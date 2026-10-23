using Codlek.Api.Data;
using Codlek.Api.Forms;
using Codlek.Api.Mail.Templates;
using Codlek.Api.Site;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Mail;

/// <summary>What every mail template needs from the site.</summary>
public sealed record MailContext(string HomeUrl, string LogoUrl, string ContactEmail, string Phone, string Whatsapp)
{
    /// <summary>A phone number for tel: links (digits and "+").</summary>
    public static string Dialable(string phone) => new(phone.Where(c => char.IsAsciiDigit(c) || c == '+').ToArray());
}

/// <summary>Builds the site's mails and queues them (see MailQueue).</summary>
public sealed class SiteMailer(
    MailQueue queue,
    CodlekDbContext db,
    SiteContentLoader loader,
    FormThrottle throttle,
    Media media,
    IConfiguration config,
    IServiceProvider services,
    ILoggerFactory loggers)
{
    /// <summary>The company gets the message; the visitor gets a short receipt.</summary>
    public async Task ContactReceivedAsync(ContactMessage message, CancellationToken ct = default)
    {
        var site = await loader.LoadAsync("ar", ct);
        var context = Context(site);
        var service = await ServiceLabel(message.Service, ct);

        queue.Enqueue(new OutgoingMail(
            site.NotifyEmails,
            site.Text("mail.contact_subject", ("service", service)),
            await RenderAsync<ContactReceived>(new()
            {
                [nameof(ContactReceived.Context)] = context,
                [nameof(ContactReceived.Message)] = message,
                [nameof(ContactReceived.ServiceLabel)] = service,
            }),
            message.Email,
            message.Name));

        // Receipts share an hourly budget, so a flood of fake visitors can't use up the sending quota.
        if (site.SendConfirmation && throttle.Budget("mail:receipts", 100, TimeSpan.FromHours(1)))
        {
            var visitorSite = await loader.LoadAsync(message.Locale, ct);
            queue.Enqueue(new OutgoingMail(
                [message.Email],
                visitorSite.Text("mail.confirmation_subject"),
                await RenderAsync<ContactConfirmation>(new()
                {
                    [nameof(ContactConfirmation.Context)] = context,
                    [nameof(ContactConfirmation.Locale)] = message.Locale,
                }),
                site.Contact.Email));
        }
    }

    public async Task ApplicationReceivedAsync(JobApplication application, CancellationToken ct = default)
    {
        var site = await loader.LoadAsync("ar", ct);
        var job = application.JobOpeningId is { } id
            ? await db.JobOpenings.AsNoTracking().Where(j => j.Id == id).Select(j => j.TitleAr).FirstOrDefaultAsync(ct)
            : null;
        job ??= site.Text("careers.general");

        var cv = application.CvPath is null ? null : Media.SafePath(media.PrivateRoot, application.CvPath);

        queue.Enqueue(new OutgoingMail(
            site.NotifyEmails,
            site.Text("mail.application_subject", ("job", job)),
            await RenderAsync<ApplicationReceived>(new()
            {
                [nameof(ApplicationReceived.Context)] = Context(site),
                [nameof(ApplicationReceived.Application)] = application,
                [nameof(ApplicationReceived.JobTitle)] = job,
            }),
            application.Email,
            application.Name,
            cv is not null && File.Exists(cv)
                ? [new MailAttachment(cv, application.CvOriginalName ?? Path.GetFileName(cv))]
                : null));
    }

    /// <summary>The admin's "send a test mail" button: sent right away, so a failure can be shown.</summary>
    public async Task SendTestAsync(string to, IMailSender sender, CancellationToken ct = default)
    {
        var site = await loader.LoadAsync("ar", ct);
        var html = await RenderAsync<EmailLayout>(new()
        {
            [nameof(EmailLayout.Context)] = Context(site),
            [nameof(EmailLayout.ChildContent)] = (RenderFragment)(b => b.AddMarkupContent(0,
                "<p style=\"margin:0;color:#0B1B3F;\">إيميل تجريبي من لوحة تحكم موقع كودلك. لو وصلك، يبقى الإرسال شغال.</p>")),
        });

        await sender.SendAsync(new OutgoingMail([to], "إيميل تجريبي — كودلك", html), ct);
    }

    /// <summary>Title of a message's service in Arabic, also for hidden services; "أخرى" for other.</summary>
    private async Task<string> ServiceLabel(string key, CancellationToken ct)
    {
        if (key == "other")
        {
            return "أخرى";
        }

        var service = await db.Services.AsNoTracking().FirstOrDefaultAsync(s => s.Key == key, ct);
        return service is null ? key : (string.IsNullOrWhiteSpace(service.TitleAr) ? service.TitleEn : service.TitleAr);
    }

    private MailContext Context(SiteContent site)
    {
        var siteUrl = (config["Codlek:SiteUrl"] ?? "").TrimEnd('/');
        return new MailContext(
            siteUrl + "/",
            siteUrl + "/images/brand/codlek-logo-email.png",
            site.Contact.Email,
            site.Contact.Phone,
            site.Contact.Whatsapp);
    }

    private async Task<string> RenderAsync<T>(Dictionary<string, object?> parameters) where T : IComponent
    {
        await using var renderer = new HtmlRenderer(services, loggers);
        return await renderer.Dispatcher.InvokeAsync(async () =>
        {
            var output = await renderer.RenderComponentAsync<T>(ParameterView.FromDictionary(parameters));
            return output.ToHtmlString();
        });
    }
}
