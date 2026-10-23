using System.Security.Cryptography;
using Codlek.Api.Data;
using Codlek.Api.Mail;
using Codlek.Api.Public;
using Codlek.Api.Site;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Forms;

public sealed record ContactForm(string? Name, string? Email, string? Phone, string? Service, string? Message, string? Website);

/// <summary>
/// The contact and careers forms. Answers 200 with the success texts, 422 with
/// { message, errors: { field: [text] } } in the visitor's language, or 429.
/// </summary>
public static class FormEndpoints
{
    public const string CorsPolicy = "site";

    public static void MapFormEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/public/{locale:regex(^(ar|en)$)}").WithTags("Forms").RequireCors(CorsPolicy);

        group.MapPost("/contact", Contact);
        group.MapPost("/careers", Careers).DisableAntiforgery();
    }

    private static async Task<IResult> Contact(
        string locale,
        ContactForm form,
        HttpContext http,
        SiteContentLoader loader,
        SiteData data,
        CodlekDbContext db,
        FormThrottle throttle,
        SiteMailer mailer,
        IConfiguration config,
        CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        var ip = ClientIp.Of(http, config);
        if (!throttle.Attempt(ip))
        {
            return TooMany(site);
        }

        var input = form with
        {
            Name = FormInput.Clean(form.Name),
            Email = FormInput.Email(form.Email),
            Phone = FormInput.Phone(form.Phone),
            Service = FormInput.Clean(form.Service),
            Message = FormInput.Clean(form.Message),
        };

        var services = await PublicEndpoints.ServiceLabels(db, site, ct);
        var check = new FormValidator(site, data);
        string Label(string field) => site.Text($"forms.labels.{field}");

        check.Required("name", input.Name, Label("name"));
        check.Length("name", input.Name, Label("name"), 2, 100);
        check.Required("email", input.Email, Label("email"));
        check.Length("email", input.Email, Label("email"), 0, 254);
        check.Email("email", input.Email, Label("email"));
        check.Phone("phone", input.Phone, Label("phone"));
        check.Required("service", input.Service, Label("service"));
        check.In("service", input.Service, Label("service"), [.. services.Select(s => s.Key), "other"]);
        check.Required("message", input.Message, Label("message"));
        check.Length("message", input.Message, Label("message"), 10, 5000);
        check.Length("website", input.Website, "website", 0, 255);

        if (!check.IsValid)
        {
            return Invalid(site, check);
        }

        var success = new FormSuccess(site.Text("forms.contact_success_title"), site.Text("forms.contact_success_text"));

        // Bots fill the hidden "website" field; pretend it worked so they learn nothing.
        if (!string.IsNullOrEmpty(input.Website))
        {
            return Results.Ok(success);
        }

        // Saved first: the message is never lost, even if mail fails.
        var message = new ContactMessage
        {
            Name = input.Name!,
            Email = input.Email!,
            Phone = input.Phone!,
            Service = input.Service!,
            Message = input.Message!,
            Locale = site.Locale,
            IpAddress = ip.Length <= 45 ? ip : null,
        };
        db.ContactMessages.Add(message);
        await db.SaveChangesAsync(ct);

        await mailer.ContactReceivedAsync(message, ct);

        return Results.Ok(success);
    }

    private static async Task<IResult> Careers(
        string locale,
        HttpContext http,
        SiteContentLoader loader,
        SiteData data,
        CodlekDbContext db,
        FormThrottle throttle,
        SiteMailer mailer,
        Media media,
        IConfiguration config,
        CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        var ip = ClientIp.Of(http, config);
        if (!throttle.Attempt(ip))
        {
            return TooMany(site);
        }

        if (!http.Request.HasFormContentType)
        {
            return Results.BadRequest();
        }

        var form = await http.Request.ReadFormAsync(ct);
        string? Field(string name) => form.TryGetValue(name, out var value) && value.Count == 1 ? value[0] : null;

        var name = FormInput.Clean(Field("name"));
        var email = FormInput.Email(Field("email"));
        var phone = FormInput.Phone(Field("phone"));
        var profileUrl = FormInput.Clean(Field("profile_url")) is { Length: > 0 } url ? url : null;
        var jobField = FormInput.Clean(Field("job_opening_id"));
        var message = FormInput.Clean(Field("message")) is { Length: > 0 } text ? text : null;
        var website = Field("website");
        var cv = form.Files.GetFile("cv") is { Length: > 0 } file ? file : null;

        var check = new FormValidator(site, data);
        string Label(string field) => site.Text($"forms.labels.{field}");

        check.Required("name", name, Label("name"));
        check.Length("name", name, Label("name"), 2, 100);
        check.Required("email", email, Label("email"));
        check.Length("email", email, Label("email"), 0, 254);
        check.Email("email", email, Label("email"));
        check.Phone("phone", phone, Label("phone"));

        int? jobId = null;
        if (!string.IsNullOrEmpty(jobField))
        {
            if (int.TryParse(jobField, out var id) && await db.JobOpenings.AnyAsync(j => j.Id == id && j.IsActive, ct))
            {
                jobId = id;
            }
            else
            {
                check.Fail("job_opening_id", check.Message("in", Label("job")));
            }
        }

        if (profileUrl is null && cv is null)
        {
            check.Fail("profile_url", site.Text("forms.cv_or_profile"));
            check.Fail("cv", site.Text("forms.cv_or_profile"));
        }

        check.Url("profile_url", profileUrl, Label("profile_url"));
        check.Length("profile_url", profileUrl, Label("profile_url"), 0, 255);

        if (cv is not null && !check.Has("cv"))
        {
            if (cv.Length > CvFile.MaxBytes)
            {
                check.Fail("cv", site.Text("forms.cv_too_big"));
            }
            else if (!await CvFile.IsValidAsync(cv, ct))
            {
                check.Fail("cv", site.Text("forms.cv_type"));
            }
        }

        check.Length("message", message, Label("about_you"), 0, 3000);
        check.Length("website", website, "website", 0, 255);

        if (!check.IsValid)
        {
            return Invalid(site, check);
        }

        var success = new FormSuccess(site.Text("forms.apply_success_title"), site.Text("forms.apply_success_text"));
        if (!string.IsNullOrEmpty(website))
        {
            return Results.Ok(success);
        }

        // CVs stay in the private folder; only the admin can download them. The
        // extension was checked against the content, so it is kept.
        string? cvPath = null;
        if (cv is not null)
        {
            cvPath = $"applications/{RandomNumberGenerator.GetString("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 40)}.{CvFile.Extension(cv.FileName)}";
            var full = Media.SafePath(media.PrivateRoot, cvPath)!;
            Directory.CreateDirectory(Path.GetDirectoryName(full)!);
            await using var stream = File.Create(full);
            await cv.CopyToAsync(stream, ct);
        }

        var application = new JobApplication
        {
            JobOpeningId = jobId,
            Name = name!,
            Email = email!,
            Phone = phone!,
            ProfileUrl = profileUrl,
            CvPath = cvPath,
            CvOriginalName = cv is null ? null : Truncate(Path.GetFileName(cv.FileName), 200),
            Message = message,
            Locale = site.Locale,
            IpAddress = ip.Length <= 45 ? ip : null,
        };
        db.JobApplications.Add(application);
        await db.SaveChangesAsync(ct);

        await mailer.ApplicationReceivedAsync(application, ct);

        return Results.Ok(success);
    }

    private static IResult Invalid(SiteContent site, FormValidator check) =>
        Results.Json(new { message = site.Text("forms.has_errors"), errors = check.Errors }, statusCode: StatusCodes.Status422UnprocessableEntity);

    private static IResult TooMany(SiteContent site) =>
        Results.Json(
            new { message = site.Text("forms.too_many"), errors = new Dictionary<string, string[]> { ["form"] = [site.Text("forms.too_many")] } },
            statusCode: StatusCodes.Status429TooManyRequests);

    private static string Truncate(string value, int length) =>
        value.EnumerateRunes().Count() <= length ? value : string.Concat(value.EnumerateRunes().Take(length));
}
