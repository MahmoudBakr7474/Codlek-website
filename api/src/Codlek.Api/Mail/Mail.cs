using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Channels;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace Codlek.Api.Mail;

public sealed record MailAttachment(string Path, string FileName);

public sealed record OutgoingMail(
    IReadOnlyList<string> To,
    string Subject,
    string Html,
    string? ReplyToAddress = null,
    string? ReplyToName = null,
    IReadOnlyList<MailAttachment>? Attachments = null);

/// <summary>
/// "Mail" settings. Driver: log (writes each mail as an .html file, the default
/// for development), smtp, or resend (HTTPS API, for hosts that block SMTP).
/// </summary>
public sealed class MailOptions
{
    public string Driver { get; set; } = "log";
    public string FromAddress { get; set; } = "no-reply@codlek.com";
    public string FromName { get; set; } = "Codlek";
    public string? LogDirectory { get; set; }
    public SmtpOptions Smtp { get; set; } = new();
    public string? ResendApiKey { get; set; }

    public sealed class SmtpOptions
    {
        public string Host { get; set; } = "";
        public int Port { get; set; } = 587;
        public string? Username { get; set; }
        public string? Password { get; set; }
    }
}

public interface IMailSender
{
    Task SendAsync(OutgoingMail mail, CancellationToken ct = default);
}

/// <summary>Writes each mail to a file instead of sending it (development).</summary>
public sealed class LogMailSender(MailOptions options, IWebHostEnvironment env, ILogger<LogMailSender> logger) : IMailSender
{
    public async Task SendAsync(OutgoingMail mail, CancellationToken ct = default)
    {
        var directory = Path.GetFullPath(options.LogDirectory ?? Path.Combine("storage", "mail"), env.ContentRootPath);
        Directory.CreateDirectory(directory);

        var file = Path.Combine(directory, $"{DateTime.UtcNow:yyyyMMdd-HHmmss-fff}-{Guid.NewGuid():N}.html");
        var header = $"<!--\nTo: {string.Join(", ", mail.To)}\nReply-To: {mail.ReplyToAddress}\nSubject: {mail.Subject}\n" +
                     $"Attachments: {string.Join(", ", mail.Attachments?.Select(a => a.FileName) ?? [])}\n-->\n";
        await File.WriteAllTextAsync(file, header + mail.Html, ct);

        logger.LogInformation("Mail to {To} written to {File}", string.Join(", ", mail.To), file);
    }
}

public sealed class SmtpMailSender(MailOptions options) : IMailSender
{
    public async Task SendAsync(OutgoingMail mail, CancellationToken ct = default)
    {
        using var client = new SmtpClient();
        await client.ConnectAsync(options.Smtp.Host, options.Smtp.Port, SecureSocketOptions.Auto, ct);
        if (!string.IsNullOrEmpty(options.Smtp.Username))
        {
            await client.AuthenticateAsync(options.Smtp.Username, options.Smtp.Password ?? "", ct);
        }

        await client.SendAsync(ToMime(mail), ct);
        await client.DisconnectAsync(true, ct);
    }

    private MimeMessage ToMime(OutgoingMail mail)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(options.FromName, options.FromAddress));
        foreach (var to in mail.To)
        {
            message.To.Add(MailboxAddress.Parse(to));
        }

        if (mail.ReplyToAddress is not null)
        {
            message.ReplyTo.Add(new MailboxAddress(mail.ReplyToName ?? "", mail.ReplyToAddress));
        }

        message.Subject = mail.Subject;
        var body = new BodyBuilder { HtmlBody = mail.Html };
        foreach (var attachment in mail.Attachments ?? [])
        {
            body.Attachments.Add(attachment.FileName, File.ReadAllBytes(attachment.Path));
        }

        message.Body = body.ToMessageBody();
        return message;
    }
}

/// <summary>Resend's HTTPS API (https://resend.com/docs/api-reference/emails/send-email).</summary>
public sealed class ResendMailSender(MailOptions options, HttpClient http) : IMailSender
{
    public async Task SendAsync(OutgoingMail mail, CancellationToken ct = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", options.ResendApiKey);
        request.Content = JsonContent.Create(new
        {
            from = $"{options.FromName} <{options.FromAddress}>",
            to = mail.To,
            subject = mail.Subject,
            html = mail.Html,
            reply_to = mail.ReplyToAddress,
            attachments = mail.Attachments?.Select(a => new
            {
                filename = a.FileName,
                content = Convert.ToBase64String(File.ReadAllBytes(a.Path)),
            }),
        });

        using var response = await http.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Resend answered {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync(ct)}");
        }
    }
}

/// <summary>
/// Mail goes out after the response has been sent: the visitor never waits on
/// a slow or unreachable mail server. A failure is logged; the message itself
/// is already saved in the database.
/// </summary>
public sealed class MailQueue
{
    private readonly Channel<OutgoingMail> channel = Channel.CreateUnbounded<OutgoingMail>();

    public void Enqueue(OutgoingMail mail) => channel.Writer.TryWrite(mail);

    public ChannelReader<OutgoingMail> Reader => channel.Reader;
}

public sealed class MailWorker(MailQueue queue, IMailSender sender, ILogger<MailWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var mail in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await sender.SendAsync(mail, stoppingToken);
            }
            catch (Exception e) when (e is not OperationCanceledException)
            {
                logger.LogError(e, "Sending mail \"{Subject}\" failed", mail.Subject);
            }
        }
    }
}
