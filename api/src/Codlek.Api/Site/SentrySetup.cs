using Sentry.AspNetCore;
using Sentry.Extensibility;

namespace Codlek.Api.Site;

/// <summary>
/// Sentry for the API (project codlek-api): errors and slow requests. On the
/// server the DSN comes from the Sentry__Dsn environment variable; without a
/// usable one (local runs, tests, a typo) Sentry is off and the app still starts.
/// The forms and the dashboard carry names, emails, phones and CVs, so events
/// keep no request bodies, query strings, cookies or headers beyond a few
/// harmless ones.
/// </summary>
public static class SentrySetup
{
    private static readonly HashSet<string> KeptHeaders = new(StringComparer.OrdinalIgnoreCase)
    {
        "User-Agent", "Accept-Language", "Content-Type",
    };

    public static void Configure(SentryAspNetCoreOptions options)
    {
        if (!IsUsable(options.Dsn))
        {
            if (!string.IsNullOrEmpty(options.Dsn))
            {
                Console.Error.WriteLine("Sentry:Dsn is not a valid DSN, so Sentry is off.");
            }

            options.Dsn = ""; // empty = off; null or a malformed DSN stops the app from starting
        }

        options.SendDefaultPii = false;
        options.MaxRequestBodySize = RequestSize.None;
        options.TracesSampleRate ??= 0.1;
        options.SetBeforeSend((sentryEvent, _) =>
        {
            Scrub(sentryEvent.Request);
            return sentryEvent;
        });
        options.SetBeforeSendTransaction((transaction, _) =>
        {
            Scrub(transaction.Request);
            return transaction;
        });
    }

    /// <summary>An https DSN with a public key and a numeric project id.</summary>
    public static bool IsUsable(string? dsn) =>
        Uri.TryCreate(dsn, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps
        && uri.UserInfo.Length > 0
        && uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() is { } project
        && project.All(char.IsAsciiDigit);

    /// <summary>Drops the query string (the dashboard's search terms), the cookies and every header but a few harmless ones.</summary>
    public static void Scrub(SentryRequest? request)
    {
        if (request is null)
        {
            return;
        }

        request.QueryString = null;
        request.Cookies = null;
        request.Data = null;
        if (request.Url?.IndexOf('?') is >= 0 and var query)
        {
            request.Url = request.Url[..query];
        }

        foreach (var name in request.Headers.Keys.Where(name => !KeptHeaders.Contains(name)).ToList())
        {
            request.Headers.Remove(name);
        }
    }
}
