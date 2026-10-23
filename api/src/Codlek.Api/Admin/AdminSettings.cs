using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Codlek.Api.Data;
using Codlek.Api.Mail;
using Codlek.Api.Site;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Admin;

public sealed record SettingsInput(Dictionary<string, JsonNode?> Values);

public sealed record ResetInput(string[]? Keys, string[]? Texts);

public sealed record TextValue(string Value, string Original);

/// <summary>
/// The dashboard's settings pages: blocks (settings rows over the exported
/// defaults), page texts (only lines that differ from the shipped text are
/// stored), uploads, and the odds and ends the pages show.
/// </summary>
public static partial class AdminSettings
{
    public static void MapAdminSettings(this RouteGroupBuilder admin)
    {
        admin.MapGet("/settings", GetSettings);
        admin.MapPut("/settings", PutSettings);
        admin.MapPost("/settings/reset", Reset);
        admin.MapGet("/texts", GetTexts);
        admin.MapPut("/texts", PutTexts);
        admin.MapPost("/uploads", Upload).DisableAntiforgery();
        admin.MapGet("/job-applications/{id:int}/cv", DownloadCv);
        admin.MapGet("/dashboard", Dashboard);
        admin.MapGet("/options/hero-projects", HeroProjects);
        admin.MapGet("/site-info", SiteInfo);
        admin.MapPost("/mail/test", MailTest);
    }

    private static string[] KeysFrom(string? keys) =>
        (keys ?? "").Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    /// <summary>Each key's current value (saved, else the original) and its original.</summary>
    private static async Task<IResult> GetSettings(string? keys, SiteContentLoader loader, SiteData data, CancellationToken ct)
    {
        var site = await loader.LoadAsync("ar", ct);
        var wanted = KeysFrom(keys).Where(data.HasDefault).ToList();

        return Results.Ok(new
        {
            values = wanted.ToDictionary(key => key, site.Setting),
            defaults = wanted.ToDictionary(key => key, key => data.DefaultJson(key) is { } json ? JsonNode.Parse(json) : null),
        });
    }

    private static async Task<IResult> PutSettings(SettingsInput input, SettingsStore settings, SiteContentLoader loader, SiteData data, CodlekDbContext db, ImageStore images, CancellationToken ct)
    {
        var check = new AdminValidator();
        var site = await loader.LoadAsync("ar", ct);
        var values = new Dictionary<string, JsonNode?>();

        foreach (var (key, value) in input.Values)
        {
            if (!data.HasDefault(key))
            {
                check.Fail(key, "الإعداد ده مش معروف.");
                continue;
            }

            values[key] = await Normalize(key, value, check, data, site, db, ct);
        }

        // The same project twice: the second screenshot is picked automatically.
        if (values.TryGetValue("home.hero_second_project", out var second) && second is not null
            && values.TryGetValue("home.hero_main_project", out var main) && main?.ToJsonString() == second.ToJsonString())
        {
            values["home.hero_second_project"] = null;
        }

        if (!check.IsValid)
        {
            return check.Problem();
        }

        // A picture that was replaced or removed leaves the disk with it.
        foreach (var key in new[] { "home.hero_image", "seo.og_image" })
        {
            if (values.TryGetValue(key, out var path) && site.IsSaved(key))
            {
                var old = SiteContent.Str(site.Setting(key));
                if (old != SiteContent.Str(path))
                {
                    images.Delete(old);
                }
            }
        }

        await settings.PutAsync(values, ct);
        var fresh = await loader.LoadAsync("ar", ct);
        return Results.Ok(new { values = values.Keys.ToDictionary(key => key, fresh.Setting) });
    }

    private static async Task<IResult> Reset(ResetInput input, SettingsStore settings, SiteContentLoader loader, SiteData data, ImageStore images, CancellationToken ct)
    {
        var site = await loader.LoadAsync("ar", ct);
        var keys = (input.Keys ?? []).Where(data.HasDefault).ToList();

        foreach (var key in keys.Where(k => k is "home.hero_image" or "seo.og_image"))
        {
            images.Delete(SiteContent.Str(site.Setting(key)));
        }

        await settings.ForgetAsync(keys, ct);

        if (input.Texts is { Length: > 0 } texts)
        {
            var saved = site.Setting("texts") as JsonObject ?? [];
            foreach (var locale in SiteData.Locales)
            {
                if (saved[locale] is JsonObject lines)
                {
                    foreach (var key in texts)
                    {
                        lines.Remove(key);
                    }
                }
            }

            await settings.PutAsync(new Dictionary<string, JsonNode?> { ["texts"] = saved }, ct);
        }

        return Results.NoContent();
    }

    private static async Task<IResult> GetTexts(string? keys, SiteContentLoader loader, SiteData data, CancellationToken ct)
    {
        var wanted = KeysFrom(keys);
        var result = new Dictionary<string, Dictionary<string, TextValue>>();

        foreach (var locale in SiteData.Locales)
        {
            var site = await loader.LoadAsync(locale, ct);
            result[locale] = wanted
                .Where(data.Texts[locale].ContainsKey)
                .ToDictionary(key => key, key => new TextValue(site.Texts[key], data.Texts[locale][key]));
        }

        return Results.Ok(result);
    }

    /// <summary>
    /// Saves the texts sent ({ar: {key: text}, en: {...}}). A text saved back to its
    /// original, or left empty, drops the override, so later fixes to the shipped
    /// texts still show up.
    /// </summary>
    private static async Task<IResult> PutTexts(Dictionary<string, Dictionary<string, string?>> input, SettingsStore settings, SiteContentLoader loader, SiteData data, CancellationToken ct)
    {
        var check = new AdminValidator();
        var site = await loader.LoadAsync("ar", ct);
        var saved = site.Setting("texts") as JsonObject ?? [];

        foreach (var (locale, lines) in input)
        {
            if (!SiteData.Locales.Contains(locale))
            {
                continue;
            }

            if (saved[locale] is not JsonObject stored)
            {
                stored = [];
                saved[locale] = stored;
            }

            foreach (var (key, raw) in lines)
            {
                if (!data.Texts[locale].TryGetValue(key, out var original))
                {
                    continue;
                }

                var value = raw?.Trim() ?? "";
                if (value.EnumerateRunes().Count() > 1000)
                {
                    check.Fail($"{locale}.{key}", "أقصى طول 1000 حرف.");
                }
                else if (value == "" || value == original.Trim())
                {
                    stored.Remove(key);
                }
                else
                {
                    stored[key] = value;
                }
            }
        }

        if (!check.IsValid)
        {
            return check.Problem();
        }

        await settings.PutAsync(new Dictionary<string, JsonNode?> { ["texts"] = saved }, ct);
        return Results.NoContent();
    }

    private static async Task<IResult> Upload(HttpRequest request, ImageStore images, Media media, CancellationToken ct)
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest();
        }

        var form = await request.ReadFormAsync(ct);
        var file = form.Files.GetFile("file");
        var preset = ImagePreset.All.GetValueOrDefault(form["preset"].ToString());

        string? error = null;
        if (preset is null)
        {
            error = "نوع الرفع مش معروف.";
        }
        else if (file is null || file.Length == 0)
        {
            error = "اختار صورة.";
        }
        else if (file.Length > ImageStore.MaxUploadBytes)
        {
            error = "الصورة أكبر من 8 ميجا.";
        }
        else if (!ImageStore.Accepted.Contains(file.ContentType))
        {
            error = "الصورة لازم تكون JPG أو PNG أو WebP.";
        }

        var path = error is null ? await images.SaveAsync(file!, preset!, ct) : null;
        if (path is null)
        {
            return Results.Json(new { message = error ?? "الملف ده مش صورة ينفع تتقري." }, statusCode: StatusCodes.Status422UnprocessableEntity);
        }

        return Results.Ok(new { path, url = media.Url(path) });
    }

    private static async Task<IResult> DownloadCv(int id, CodlekDbContext db, Media media, CancellationToken ct)
    {
        var application = await db.JobApplications.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        var path = application?.CvPath is { } relative ? Media.SafePath(media.PrivateRoot, relative) : null;
        if (path is null || !File.Exists(path))
        {
            return Results.NotFound();
        }

        var name = application!.CvOriginalName ?? Path.GetFileName(path);
        var type = new FileExtensionContentTypeProvider().TryGetContentType(path, out var known) ? known : "application/octet-stream";
        return Results.File(path, type, name);
    }

    private static async Task<IResult> Dashboard(CodlekDbContext db, AdminContext context, TimeProvider clock, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var latest = await db.ContactMessages.AsNoTracking().OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id).Take(5).ToListAsync(ct);

        return Results.Ok(new
        {
            unreadMessages = await db.ContactMessages.CountAsync(m => m.ReadAt == null, ct),
            totalMessages = await db.ContactMessages.CountAsync(ct),
            unreadApplications = await db.JobApplications.CountAsync(a => a.ReadAt == null, ct),
            totalApplications = await db.JobApplications.CountAsync(ct),
            publishedProjects = await db.Projects.CountAsync(p => p.IsPublished, ct),
            totalProjects = await db.Projects.CountAsync(ct),
            publishedPosts = await db.Posts.CountAsync(p => p.IsPublished && p.PublishedAt != null && p.PublishedAt <= now, ct),
            totalPosts = await db.Posts.CountAsync(ct),
            latestMessages = latest.Select(m => new MessageRow(
                m.Id, m.Name, m.Email, m.Phone, m.Service, context.ServiceLabel(m.Service), m.Message, m.Locale, m.ReadAt is not null, m.CreatedAt)),
        });
    }

    /// <summary>Published projects with a screenshot: the hero's choices.</summary>
    private static async Task<IResult> HeroProjects(CodlekDbContext db, Media media, CancellationToken ct)
    {
        var projects = await db.Projects.AsNoTracking().Include(p => p.ProjectCategory)
            .Where(p => p.IsPublished && p.Image != null && p.Image != "")
            .OrderBy(p => p.SortOrder).ThenBy(p => p.Id)
            .ToListAsync(ct);

        return Results.Ok(projects.Select(p => new
        {
            id = p.Id,
            label = string.Join(" · ", new[] { string.IsNullOrWhiteSpace(p.TitleAr) ? p.TitleEn : p.TitleAr, p.ProjectCategory?.NameAr }.Where(s => !string.IsNullOrWhiteSpace(s))),
            imageUrl = media.Url(p.Image),
        }));
    }

    private static async Task<IResult> SiteInfo(SiteContentLoader loader, IConfiguration config, MailOptions mail, CancellationToken ct)
    {
        var site = await loader.LoadAsync("ar", ct);
        return Results.Ok(new
        {
            siteUrl = (config["Codlek:SiteUrl"] ?? "").TrimEnd('/'),
            founded = site.Founded,
            yearsOfExperience = site.YearsOfExperience,
            contactEmail = site.Contact.Email,
            contactPhone = site.Contact.Phone,
            notifyEmails = site.NotifyEmails,
            mailDriver = mail.Driver,
        });
    }

    /// <summary>The "send a test mail" button: sent right away, so a failure shows its reason.</summary>
    private static async Task<IResult> MailTest(SiteContentLoader loader, SiteMailer mailer, IMailSender sender, CancellationToken ct)
    {
        var site = await loader.LoadAsync("ar", ct);
        try
        {
            foreach (var to in site.NotifyEmails)
            {
                await mailer.SendTestAsync(to, sender, ct);
            }

            return Results.Ok(new { sentTo = site.NotifyEmails });
        }
        catch (Exception e)
        {
            var message = e.Message.Length > 300 ? e.Message[..300] : e.Message;
            return Results.Json(new { message }, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    // ---- Normalizing what a settings page saves ---------------------------------------------

    private static async Task<JsonNode?> Normalize(string key, JsonNode? value, AdminValidator check, SiteData data, SiteContent site, CodlekDbContext db, CancellationToken ct)
    {
        switch (key)
        {
            case "home.sections":
                return Sections(value, data);

            case "home.hero_visual":
                return OneOf(value, data.HeroVisuals);

            case "appearance.loader":
                return OneOf(value, data.LoaderModes);

            case "appearance.theme":
                return OneOf(value, data.Themes);

            case "home.hero_trust_visible":
            case "appearance.floating_contact":
            case "mail.send_confirmation":
                return JsonValue.Create(SiteContent.Bool(value) ?? false);

            case "home.hero_main_project":
            case "home.hero_second_project":
                return int.TryParse(SiteContent.Str(value), out var id)
                    && await db.Projects.AnyAsync(p => p.Id == id && p.IsPublished && p.Image != null && p.Image != "", ct)
                        ? JsonValue.Create(id)
                        : null;

            case "home.hero_image":
            case "seo.og_image":
                return SiteContent.Str(value) is { Length: > 0 } path ? JsonValue.Create(path) : null;

            case "home.technologies":
                return Technologies(value, check, site);

            case "home.hero_stats":
                return Stats(key, value, check, max: 3);

            case "about.stats":
                return Stats(key, value, check, max: 4);

            case "home.why":
                return new JsonObject
                {
                    ["stats"] = Stats($"{key}.stats", value?["stats"], check, max: 4),
                    ["features"] = Cards($"{key}.features", value?["features"], check, max: 6, title: null, text: ("text", 200)),
                };

            case "home.industries":
                return Cards(key, value, check, max: 12, title: ("title", 80), text: ("text", 160));

            case "home.journey":
                return Cards(key, value, check, max: 7, title: ("title", 80), text: ("text", 160));

            case "home.team":
                return Cards(key, value, check, max: 12, title: ("title", 80), text: ("text", 160));

            case "about.values":
                return Cards(key, value, check, max: 8, title: ("title", 60), text: ("text", 200));

            case "about.story":
                return Pairs(key, value, check, max: 50, length: 1500, min: 1);

            case "about.why":
                return Pairs(key, value, check, max: 12, length: 150);

            case "about.satisfaction":
                check.Text(key, SiteContent.Str(value), 10);
                return JsonValue.Create(SiteContent.Str(value)?.Trim() ?? "");

            case "legal.privacy":
            case "legal.terms":
                return Legal(key, value, check);

            case "contact.email":
                return Detail(key, value, check, 254, v => check.Email(key, v));

            case "contact.phone":
                return Detail(key, value, check, 30);

            case "contact.phone_international":
                return Detail(key, value, check, 16, v =>
                {
                    if (!InternationalPhone().IsMatch(v))
                    {
                        check.Fail(key, "اكتب الرقم بالشكل ده: + وبعدها كود الدولة والرقم من غير مسافات.");
                    }
                });

            case "contact.whatsapp":
                return Detail(key, value, check, 15, v =>
                {
                    if (!WhatsappNumber().IsMatch(v))
                    {
                        check.Fail(key, "أرقام بس بكود الدولة، من غير + ولا مسافات.");
                    }
                });

            case "company.founded":
                if (!int.TryParse(SiteContent.Str(value), out var year) || year < 1990 || year > DateTime.UtcNow.Year)
                {
                    check.Fail(key, $"سنة من 1990 لـ {DateTime.UtcNow.Year}.");
                }

                return JsonValue.Create(year);

            case "social.links":
                return Socials(key, value, check, data);

            case "mail.notify_emails":
                var emails = (value as JsonArray)?.Select(SiteContent.Str).Select(e => e?.Trim() ?? "").Where(e => e != "").Distinct().ToList() ?? [];
                if (emails.Count == 0)
                {
                    check.Fail(key, "اكتب إيميل واحد على الأقل.");
                }

                emails.ForEach(email => check.Email(key, email));
                return new JsonArray(emails.Select(e => (JsonNode?)JsonValue.Create(e)).ToArray());

            default:
                return value?.DeepClone();
        }
    }

    private static JsonNode OneOf(JsonNode? value, string[] allowed) =>
        JsonValue.Create(SiteContent.Str(value) is { } v && allowed.Contains(v) ? v : allowed[0]);

    private static JsonNode? Detail(string key, JsonNode? value, AdminValidator check, int max, Action<string>? rule = null)
    {
        var text = SiteContent.Str(value)?.Trim() ?? "";
        check.Text(key, text, max);
        if (!check.Has(key))
        {
            rule?.Invoke(text);
        }

        return JsonValue.Create(text);
    }

    /// <summary>Every home section exactly once: the saved order first, then any missing one, visible.</summary>
    private static JsonArray Sections(JsonNode? value, SiteData data)
    {
        var sections = new List<(string Key, bool Visible)>();
        foreach (var item in (value as JsonArray)?.OfType<JsonObject>() ?? [])
        {
            var key = SiteContent.Str(item["key"]);
            if (key is not null && data.HomeSections.Contains(key) && sections.All(s => s.Key != key))
            {
                sections.Add((key, SiteContent.Bool(item["visible"]) ?? true));
            }
        }

        sections.AddRange(data.HomeSections.Where(key => sections.All(s => s.Key != key)).Select(key => (key, true)));
        return new JsonArray(sections.Select(s => (JsonNode?)new JsonObject { ["key"] = s.Key, ["visible"] = s.Visible }).ToArray());
    }

    private static JsonArray Technologies(JsonNode? value, AdminValidator check, SiteContent site)
    {
        var items = Objects(value).ToList();
        if (items.Count > 32)
        {
            check.Fail("home.technologies", "كفاية 32 تقنية.");
        }

        var result = new JsonArray();
        for (var i = 0; i < items.Count; i++)
        {
            var name = SiteContent.Str(items[i]["name"])?.Trim() ?? "";
            check.Text($"home.technologies.{i}.name", name, 40);
            var color = SiteContent.HexColor(SiteContent.Str(items[i]["color"]));
            if (color is null && SiteContent.Str(items[i]["color"]) is { Length: > 0 })
            {
                check.Fail($"home.technologies.{i}.color", "اللون لازم يكون كود زي ⁦#0B63CE⁩: علامة ⁦#⁩ وبعدها 6 حروف أو أرقام.");
            }

            result.Add(new JsonObject { ["name"] = name, ["color"] = color ?? site.TechColor(name) });
        }

        return result;
    }

    private static JsonArray Stats(string key, JsonNode? value, AdminValidator check, int max)
    {
        var items = Objects(value).ToList();
        if (items.Count > max)
        {
            check.Fail(key, $"أقصى عدد {max}.");
        }

        var result = new JsonArray();
        for (var i = 0; i < items.Count; i++)
        {
            var number = SiteContent.Str(items[i]["value"])?.Trim() ?? "";
            check.Text($"{key}.{i}.value", number, 20);
            result.Add(new JsonObject { ["value"] = number, ["label"] = Pair($"{key}.{i}.label", items[i]["label"], check, 60) });
        }

        return result;
    }

    private static JsonArray Cards(string key, JsonNode? value, AdminValidator check, int max, (string Name, int Length)? title, (string Name, int Length) text)
    {
        var items = Objects(value).ToList();
        if (items.Count > max)
        {
            check.Fail(key, $"أقصى عدد {max}.");
        }

        var result = new JsonArray();
        for (var i = 0; i < items.Count; i++)
        {
            var icon = SiteContent.Str(items[i]["icon"])?.Trim() ?? "";
            check.Icon($"{key}.{i}.icon", icon);
            var card = new JsonObject { ["icon"] = icon };
            if (title is { } t)
            {
                card[t.Name] = Pair($"{key}.{i}.{t.Name}", items[i][t.Name], check, t.Length);
            }

            card[text.Name] = Pair($"{key}.{i}.{text.Name}", items[i][text.Name], check, text.Length);
            result.Add(card);
        }

        return result;
    }

    private static JsonArray Pairs(string key, JsonNode? value, AdminValidator check, int max, int length, int min = 0)
    {
        var items = Objects(value).ToList();
        if (items.Count > max)
        {
            check.Fail(key, $"أقصى عدد {max}.");
        }
        else if (items.Count < min)
        {
            check.Fail(key, "لازم يفضل عنصر واحد على الأقل.");
        }

        return new JsonArray(items.Select((item, i) => (JsonNode?)Pair($"{key}.{i}", item, check, length)).ToArray());
    }

    /// <summary>Legal sections: a title, an optional text and optional bullet points.</summary>
    private static JsonArray Legal(string key, JsonNode? value, AdminValidator check)
    {
        var items = Objects(value).ToList();
        if (items.Count == 0)
        {
            check.Fail(key, "لازم يفضل قسم واحد على الأقل.");
        }

        var result = new JsonArray();
        for (var i = 0; i < items.Count; i++)
        {
            var section = new JsonObject { ["title"] = Pair($"{key}.{i}.title", items[i]["title"], check, 150) };
            var text = Pair($"{key}.{i}.text", items[i]["text"], check, 3000, required: false);
            var (ar, en) = (SiteContent.Str(text["ar"]) ?? "", SiteContent.Str(text["en"]) ?? "");
            if (ar != "" && en == "")
            {
                check.Fail($"{key}.{i}.text.en", "اكتب النص بالإنجليزي كمان، أو امسح النص العربي.");
            }
            else if (en != "" && ar == "")
            {
                check.Fail($"{key}.{i}.text.ar", "اكتب النص بالعربي كمان، أو امسح النص الإنجليزي.");
            }

            if (ar != "" || en != "")
            {
                section["text"] = text;
            }

            var points = Objects(items[i]["items"]).Select((point, n) => Pair($"{key}.{i}.items.{n}", point, check, 500)).ToList();
            if (points.Count > 0)
            {
                section["items"] = new JsonArray(points.Select(p => (JsonNode?)p).ToArray());
            }

            result.Add(section);
        }

        return result;
    }

    private static JsonArray Socials(string key, JsonNode? value, AdminValidator check, SiteData data)
    {
        var result = new JsonArray();
        var seen = new HashSet<string>();
        var items = Objects(value).ToList();
        for (var i = 0; i < items.Count; i++)
        {
            var platform = SiteContent.Str(items[i]["platform"]) ?? "";
            var url = SiteContent.Str(items[i]["url"])?.Trim() ?? "";
            if (!data.SocialLabels.ContainsKey(platform))
            {
                check.Fail($"{key}.{i}.platform", "اختار المنصة.");
            }
            else if (!seen.Add(platform))
            {
                check.Fail($"{key}.{i}.platform", "المنصة دي متضافة قبل كده.");
            }

            check.Text($"{key}.{i}.url", url, 255);
            check.Url($"{key}.{i}.url", url);
            result.Add(new JsonObject { ["platform"] = platform, ["url"] = url });
        }

        return result;
    }

    private static JsonObject Pair(string key, JsonNode? value, AdminValidator check, int length, bool required = true)
    {
        var ar = SiteContent.Str(value?["ar"])?.Trim() ?? "";
        var en = SiteContent.Str(value?["en"])?.Trim() ?? "";
        check.Text($"{key}.ar", ar, length, required);
        check.Text($"{key}.en", en, length, required);
        return new JsonObject { ["ar"] = ar, ["en"] = en };
    }

    private static IEnumerable<JsonObject> Objects(JsonNode? value) => value switch
    {
        JsonArray list => list.OfType<JsonObject>(),
        JsonObject keyed => keyed.Select(pair => pair.Value).OfType<JsonObject>(),
        _ => [],
    };

    [GeneratedRegex(@"^\+[1-9][0-9]{7,14}$")]
    private static partial Regex InternationalPhone();

    [GeneratedRegex("^[1-9][0-9]{7,14}$")]
    private static partial Regex WhatsappNumber();
}
