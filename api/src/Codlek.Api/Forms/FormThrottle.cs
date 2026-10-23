using System.Net;
using Microsoft.Extensions.Caching.Memory;

namespace Codlek.Api.Forms;

/// <summary>
/// Contact and careers forms: a few honest retries, not a flood. Each submission
/// sends mail, so besides 5 a minute there is a cap of 20 an hour per visitor.
/// </summary>
public sealed class FormThrottle(IMemoryCache cache, TimeProvider clock)
{
    private static readonly (string Name, int Limit, TimeSpan Window)[] Limits =
    [
        ("minute", 5, TimeSpan.FromMinutes(1)),
        ("hour", 20, TimeSpan.FromHours(1)),
    ];

    private readonly Lock gate = new();

    /// <summary>Counts one attempt; false when the visitor is over a limit.</summary>
    public bool Attempt(string visitor)
    {
        lock (gate)
        {
            var now = clock.GetUtcNow();
            var windows = Limits.Select(l => (l, Key: $"forms:{l.Name}:{visitor}")).ToList();

            foreach (var (limit, key) in windows)
            {
                if (cache.TryGetValue(key, out Window? window) && window!.Count >= limit.Limit && window.Ends > now)
                {
                    return false;
                }
            }

            foreach (var (limit, key) in windows)
            {
                if (!cache.TryGetValue(key, out Window? window) || window!.Ends <= now)
                {
                    window = new Window(now + limit.Window);
                    cache.Set(key, window, window.Ends);
                }

                window.Count++;
            }

            return true;
        }
    }

    /// <summary>
    /// A shared budget (e.g. receipts to visitors, 100 an hour), so a flood of
    /// fake visitors can't use up the mailbox's sending quota.
    /// </summary>
    public bool Budget(string name, int limit, TimeSpan window) => Attempt(name, limit, window);

    private bool Attempt(string key, int limit, TimeSpan span)
    {
        lock (gate)
        {
            var now = clock.GetUtcNow();
            if (!cache.TryGetValue(key, out Window? window) || window!.Ends <= now)
            {
                window = new Window(now + span);
                cache.Set(key, window, window.Ends);
            }

            if (window.Count >= limit)
            {
                return false;
            }

            window.Count++;
            return true;
        }
    }

    private sealed class Window(DateTimeOffset ends)
    {
        public DateTimeOffset Ends { get; } = ends;
        public int Count { get; set; }
    }
}

/// <summary>
/// The visitor's IP. The Next.js site posts the forms from its server, so it
/// passes the visitor's address in X-Client-IP together with the shared
/// Codlek:FormsKey; without the key the header is ignored.
/// </summary>
public static class ClientIp
{
    public static string Of(HttpContext context, IConfiguration config)
    {
        var key = config["Codlek:FormsKey"];
        if (!string.IsNullOrEmpty(key)
            && context.Request.Headers["X-Codlek-Key"] == key
            && IPAddress.TryParse(context.Request.Headers["X-Client-IP"].ToString(), out var forwarded))
        {
            return forwarded.ToString();
        }

        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
