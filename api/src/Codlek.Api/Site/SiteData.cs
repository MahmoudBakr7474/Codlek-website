using System.Text.Json;
using System.Text.Json.Nodes;

namespace Codlek.Api.Site;

/// <summary>
/// The JSON files exported from the Laravel site (Content/): settings defaults,
/// the lists the site validates against, the UI texts and validation messages.
/// Loaded once at startup.
/// </summary>
public sealed class SiteData
{
    public static readonly string[] Locales = ["ar", "en"];

    /// <summary>Colours of a service's icon tile; the first one is the default.</summary>
    public static readonly string[] ServiceTones = ["blue", "teal", "magenta", "amber"];

    public static readonly string[] SocialPlatforms =
        ["facebook", "instagram", "linkedin", "x", "tiktok", "youtube", "behance", "dribbble", "snapchat", "telegram", "threads", "github"];

    private readonly Dictionary<string, string?> defaults;

    public SiteData(string contentDirectory)
    {
        defaults = Read<Dictionary<string, JsonElement>>(contentDirectory, "site-defaults.json")
            .ToDictionary(pair => pair.Key, pair => pair.Value.ValueKind == JsonValueKind.Null ? null : pair.Value.GetRawText());

        var constants = JsonNode.Parse(File.ReadAllText(Path.Combine(contentDirectory, "site-constants.json")))!;
        HomeSections = constants["home_sections"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        HeroVisuals = constants["hero_visuals"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        LoaderModes = constants["loader_modes"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        Themes = constants["themes"]!.AsArray().Select(n => n!.GetValue<string>()).ToArray();
        TechColor = constants["tech_color"]!.GetValue<string>();
        SocialLabels = constants["social_platforms"]!.AsObject().ToDictionary(
            pair => pair.Key,
            pair => new LocalizedLabel(pair.Value!["label_ar"]!.GetValue<string>(), pair.Value!["label"]!.GetValue<string>()));

        Texts = Locales.ToDictionary(
            locale => locale,
            locale => Read<Dictionary<string, string>>(contentDirectory, Path.Combine("lang", $"{locale}.json")));
        Validation = Read<Dictionary<string, Dictionary<string, string>>>(contentDirectory, Path.Combine("lang", "validation.json"));
        Seed = JsonNode.Parse(File.ReadAllText(Path.Combine(contentDirectory, "seed-data.json")))!;
    }

    public string[] HomeSections { get; }
    public string[] HeroVisuals { get; }
    public string[] LoaderModes { get; }
    public string[] Themes { get; }
    public string TechColor { get; }
    public IReadOnlyDictionary<string, LocalizedLabel> SocialLabels { get; }

    /// <summary>UI texts as shipped, locale => dot key => text.</summary>
    public IReadOnlyDictionary<string, Dictionary<string, string>> Texts { get; }

    public IReadOnlyDictionary<string, Dictionary<string, string>> Validation { get; }

    /// <summary>Services and testimonials a fresh database starts with.</summary>
    public JsonNode Seed { get; }

    public IEnumerable<string> SettingKeys => defaults.Keys;

    public bool HasDefault(string key) => defaults.ContainsKey(key);

    /// <summary>The original value of a settings key as raw JSON (null when it has none).</summary>
    public string? DefaultJson(string key) => defaults.GetValueOrDefault(key);

    public static string NormalizeLocale(string? locale) => locale == "en" ? "en" : "ar";

    private static T Read<T>(string directory, string file) =>
        JsonSerializer.Deserialize<T>(File.ReadAllText(Path.Combine(directory, file)))
        ?? throw new InvalidOperationException($"{file} is empty");
}

public sealed record LocalizedLabel(string Ar, string En)
{
    public string For(string locale) => locale == "en" ? En : Ar;
}
