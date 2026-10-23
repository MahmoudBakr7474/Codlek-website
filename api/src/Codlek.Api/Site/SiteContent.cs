using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Codlek.Api.Site;

/// <summary>Builds a <see cref="SiteContent"/> for one request.</summary>
public sealed class SiteContentLoader(SettingsStore settings, SiteData data, TimeProvider clock)
{
    public async Task<SiteContent> LoadAsync(string locale, CancellationToken ct = default) =>
        new(SiteData.NormalizeLocale(locale), await settings.AllAsync(ct), data, clock);
}

/// <summary>
/// The site's settings blocks in one language: what the owner saved, else the
/// original (Site::get() in the Laravel site), with the tokens filled in.
/// </summary>
public sealed partial class SiteContent
{
    private readonly IReadOnlyDictionary<string, string?> saved;
    private readonly SiteData data;
    private readonly TimeProvider clock;
    private Dictionary<string, string>? texts;

    public SiteContent(string locale, IReadOnlyDictionary<string, string?> saved, SiteData data, TimeProvider clock)
    {
        Locale = locale;
        this.saved = saved;
        this.data = data;
        this.clock = clock;
    }

    public string Locale { get; }

    public string OtherLocale => Locale == "ar" ? "en" : "ar";

    /// <summary>A settings value as a fresh JSON node: the saved one, else the default.</summary>
    public JsonNode? Setting(string key)
    {
        var json = saved.TryGetValue(key, out var value) ? value : data.DefaultJson(key);
        return json is null ? null : JsonNode.Parse(json);
    }

    public bool IsSaved(string key) => saved.ContainsKey(key);

    // ---- Contact details and company ---------------------------------------------------

    /// <summary>A saved value, or the original when the saved one is empty (as config did).</summary>
    private string Detail(string key)
    {
        var value = Str(Setting(key))?.Trim();
        return string.IsNullOrEmpty(value) ? Str(JsonNode.Parse(data.DefaultJson(key) ?? "\"\"")) ?? "" : value;
    }

    public ContactDetails Contact => new(
        Detail("contact.email"),
        Detail("contact.phone"),
        Detail("contact.phone_international"),
        Detail("contact.whatsapp"));

    public int Founded => int.TryParse(Detail("company.founded"), out var year) ? year : 2019;

    public int YearsOfExperience => Math.Max(1, clock.GetUtcNow().Year - Founded);

    public IReadOnlyList<string> NotifyEmails
    {
        get
        {
            var emails = (Setting("mail.notify_emails") as JsonArray)?
                .Select(n => Str(n)?.Trim())
                .Where(e => !string.IsNullOrEmpty(e))
                .Select(e => e!)
                .ToList() ?? [];

            return emails.Count > 0 ? emails : [Contact.Email];
        }
    }

    public bool SendConfirmation => Bool(Setting("mail.send_confirmation")) ?? true;

    /// <summary>Fill {years}, {email} and {phone}.</summary>
    public string Fill(string text) => !text.Contains('{')
        ? text
        : text.Replace("{years}", YearsOfExperience.ToString())
            .Replace("{email}", Contact.Email)
            .Replace("{phone}", Contact.Phone);

    // ---- UI texts ----------------------------------------------------------------------

    /// <summary>
    /// Every UI text in this language: the shipped text, or the owner's version
    /// from the "texts" setting.
    /// </summary>
    public IReadOnlyDictionary<string, string> Texts => texts ??= BuildTexts();

    private Dictionary<string, string> BuildTexts()
    {
        var merged = new Dictionary<string, string>(data.Texts[Locale]);
        if (Setting("texts")?[Locale] is JsonObject overrides)
        {
            foreach (var (key, value) in overrides)
            {
                if (Str(value) is { } text && text.Trim() != "")
                {
                    merged[key] = text;
                }
            }
        }

        return merged;
    }

    /// <summary>A UI text with Laravel-style ":name" placeholders replaced.</summary>
    public string Text(string key, params (string Name, string Value)[] replace)
    {
        var text = Texts.TryGetValue(key, out var value) ? value : key;
        foreach (var (name, replacement) in replace.OrderByDescending(r => r.Name.Length))
        {
            text = text.Replace(":" + name, replacement);
        }

        return text;
    }

    // ---- Bilingual values ----------------------------------------------------------------

    /// <summary>
    /// The text in this language from an {"ar": .., "en": ..} pair (the other
    /// language when this one is empty), or a plain string as it is. Filled.
    /// </summary>
    public string Loc(JsonNode? node)
    {
        if (node is JsonObject pair)
        {
            var mine = Str(pair[Locale]);
            var text = string.IsNullOrWhiteSpace(mine) ? Str(pair[OtherLocale]) : mine;
            return Fill(text ?? "");
        }

        return Fill(Str(node) ?? "");
    }

    /// <summary>A bilingual column pair: this language, else the other one.</summary>
    public string Tr(string? ar, string? en)
    {
        var (mine, other) = Locale == "ar" ? (ar, en) : (en, ar);
        return string.IsNullOrWhiteSpace(mine) ? other ?? "" : mine;
    }

    // ---- Blocks ----------------------------------------------------------------------------

    /// <summary>Visible home sections in the owner's order; sections added later go last.</summary>
    public IReadOnlyList<string> HomeSections()
    {
        var order = new List<string>();
        var visible = new List<string>();

        foreach (var item in Objects("home.sections"))
        {
            var key = Str(item["key"]);
            if (key is null || !data.HomeSections.Contains(key) || order.Contains(key))
            {
                continue;
            }

            order.Add(key);
            if (Bool(item["visible"]) ?? true)
            {
                visible.Add(key);
            }
        }

        return [.. visible, .. data.HomeSections.Except(order)];
    }

    public IReadOnlyList<Stat> HeroStats() => Stats("home.hero_stats").Take(3).ToList();

    public string HeroVisual() => OneOf(Str(Setting("home.hero_visual")), data.HeroVisuals);

    public bool HeroTrustVisible() => Bool(Setting("home.hero_trust_visible")) ?? true;

    /// <summary>Path of the uploaded hero picture under uploads/, if any.</summary>
    public string? HeroImagePath() => NonEmpty(Str(Setting("home.hero_image")));

    public IReadOnlyList<int> HeroProjectIds() =>
        new[] { Setting("home.hero_main_project"), Setting("home.hero_second_project") }
            .Select(n => int.TryParse(Str(n), out var id) ? id : 0)
            .Where(id => id > 0)
            .Distinct()
            .ToList();

    public Why Why()
    {
        var why = Setting("home.why") as JsonObject;
        return new Why(
            StatsFrom(why?["stats"] as JsonArray),
            ObjectsFrom(why?["features"] as JsonArray).Select(f => new IconText(Str(f["icon"]) ?? "", Loc(f["text"]))).ToList());
    }

    public IReadOnlyList<Technology> Technologies() => Objects("home.technologies")
        .Select(t => (Name: Str(t["name"])?.Trim() ?? "", Color: Str(t["color"])))
        .Where(t => t.Name != "")
        .Select(t => new Technology(t.Name, HexColor(t.Color) ?? TechColor(t.Name)))
        .ToList();

    public IReadOnlyList<IconCard> Industries() => Cards("home.industries");

    public IReadOnlyList<IconCard> Journey() => Cards("home.journey");

    public IReadOnlyList<IconCard> Team() => Cards("home.team");

    public About About() => new(
        Stats("about.stats"),
        Items("about.story").Select(Loc).ToList(),
        Cards("about.values"),
        Items("about.why").Select(Loc).ToList(),
        Loc(Setting("about.satisfaction")));

    public IReadOnlyList<LegalSection> Legal(string page) => Objects($"legal.{page}")
        .Select(s => new LegalSection(
            Loc(s["title"]),
            s["text"] is { } text ? NonEmpty(Loc(text)) : null,
            (s["items"] as JsonArray)?.Select(Loc).Where(i => i != "").ToList() ?? []))
        .ToList();

    public IReadOnlyList<SocialLink> Socials() => Objects("social.links")
        .Select(l => (Platform: Str(l["platform"]) ?? "", Url: Str(l["url"])?.Trim() ?? ""))
        .Where(l => data.SocialLabels.ContainsKey(l.Platform)
            && Uri.TryCreate(l.Url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps))
        .Select(l => new SocialLink(l.Platform, l.Url, data.SocialLabels[l.Platform].For(Locale)))
        .ToList();

    public Appearance Appearance() => new(
        OneOf(Str(Setting("appearance.loader")), data.LoaderModes),
        OneOf(Str(Setting("appearance.theme")), data.Themes),
        Bool(Setting("appearance.floating_contact")) ?? true);

    /// <summary>Path of the uploaded share picture under uploads/, if any.</summary>
    public string? OgImagePath() => NonEmpty(Str(Setting("seo.og_image")));

    /// <summary>The design's colour for a technology by name, else the brand blue.</summary>
    public string TechColor(string name)
    {
        var defaults = JsonNode.Parse(data.DefaultJson("home.technologies") ?? "[]") as JsonArray;
        var match = ObjectsFrom(defaults).FirstOrDefault(t =>
            string.Equals(Str(t["name"]), name.Trim(), StringComparison.OrdinalIgnoreCase));

        return Str(match?["color"]) ?? data.TechColor;
    }

    /// <summary>"#RRGGBB" in capitals from "#rgb" or "#rrggbb"; null for anything else.</summary>
    public static string? HexColor(string? color)
    {
        var match = color is null ? null : HexPattern().Match(color.Trim());
        if (match is not { Success: true })
        {
            return null;
        }

        var hex = match.Groups[1].Value;
        if (hex.Length == 3)
        {
            hex = string.Concat(hex.Select(c => $"{c}{c}"));
        }

        return "#" + hex.ToUpperInvariant();
    }

    // ---- Helpers ---------------------------------------------------------------------------

    private IReadOnlyList<Stat> Stats(string key) => StatsFrom(Setting(key) as JsonArray);

    private IReadOnlyList<Stat> StatsFrom(JsonArray? list) =>
        ObjectsFrom(list).Select(s => new Stat(Fill(Str(s["value"]) ?? ""), Loc(s["label"]))).ToList();

    private IReadOnlyList<IconCard> Cards(string key) => Objects(key)
        .Select(c => new IconCard(Str(c["icon"]) ?? "", Loc(c["title"]), Loc(c["text"])))
        .ToList();

    /// <summary>The objects of a list block (repeaters may also save keyed objects).</summary>
    private IEnumerable<JsonObject> Objects(string key) => Setting(key) switch
    {
        JsonArray list => ObjectsFrom(list),
        JsonObject keyed => keyed.Select(pair => pair.Value).OfType<JsonObject>(),
        _ => [],
    };

    private IEnumerable<JsonNode> Items(string key) => Setting(key) switch
    {
        JsonArray list => list.Where(n => n is not null).Select(n => n!),
        JsonObject keyed => keyed.Select(pair => pair.Value).Where(n => n is not null).Select(n => n!),
        _ => [],
    };

    private static IEnumerable<JsonObject> ObjectsFrom(JsonArray? list) => list?.OfType<JsonObject>() ?? [];

    private static string OneOf(string? value, string[] allowed) =>
        value is not null && allowed.Contains(value) ? value : allowed[0];

    private static string? NonEmpty(string? value) => string.IsNullOrWhiteSpace(value) ? null : value;

    /// <summary>A JSON scalar as text (numbers and booleans too); null for null, objects and lists.</summary>
    public static string? Str(JsonNode? node) => node switch
    {
        JsonValue value when value.TryGetValue<string>(out var text) => text,
        JsonValue value => value.ToJsonString(),
        _ => null,
    };

    public static bool? Bool(JsonNode? node) => node switch
    {
        JsonValue value when value.TryGetValue<bool>(out var flag) => flag,
        JsonValue value when value.TryGetValue<int>(out var number) => number != 0,
        JsonValue value when value.TryGetValue<string>(out var text) => text is "1" or "true",
        _ => null,
    };

    [GeneratedRegex("^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")]
    private static partial Regex HexPattern();
}
