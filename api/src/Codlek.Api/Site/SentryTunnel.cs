using System.Net.Http.Headers;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http.Features;

namespace Codlek.Api.Site;

/// <summary>
/// POST /api/monitoring: forwards the dashboard's Sentry reports to Sentry.
/// Tracking prevention and ad blockers drop a browser's direct requests to
/// sentry.io; sent to the API's own address they arrive. Only reports for this
/// API's own Sentry organization go through, and only while Sentry is on.
/// </summary>
public static class SentryTunnel
{
    private const int MaxEnvelopeBytes = 1024 * 1024;

    // Not from IHttpClientFactory: Sentry instruments those clients, and its own traffic needs no tracing.
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(15) };

    public static void MapSentryTunnel(this IEndpointRouteBuilder app) =>
        app.MapPost("/api/monitoring", Forward).ExcludeFromDescription();

    private static async Task<IResult> Forward(HttpContext http, IConfiguration config, CancellationToken ct)
    {
        var dsn = config["Sentry:Dsn"];
        if (!SentrySetup.IsUsable(dsn))
        {
            return Results.NotFound();
        }

        var own = new Uri(dsn!);

        if (http.Features.Get<IHttpMaxRequestBodySizeFeature>() is { IsReadOnly: false } limit)
        {
            limit.MaxRequestBodySize = MaxEnvelopeBytes;
        }

        using var body = new MemoryStream();
        try
        {
            await http.Request.Body.CopyToAsync(body, ct);
        }
        catch (BadHttpRequestException)
        {
            return Results.StatusCode(StatusCodes.Status413PayloadTooLarge);
        }

        var envelope = body.ToArray();
        if (TargetFor(envelope, own) is not { } target)
        {
            return Results.BadRequest();
        }

        using var content = new ByteArrayContent(envelope);
        content.Headers.ContentType = new MediaTypeHeaderValue("application/x-sentry-envelope");
        try
        {
            using var response = await Http.PostAsync(target, content, ct);

            // The browser SDK backs off when Sentry says so.
            foreach (var name in (string[])["Retry-After", "X-Sentry-Rate-Limits"])
            {
                if (response.Headers.TryGetValues(name, out var values))
                {
                    http.Response.Headers[name] = values.ToArray();
                }
            }

            return Results.StatusCode((int)response.StatusCode);
        }
        catch (HttpRequestException)
        {
            return Results.StatusCode(StatusCodes.Status502BadGateway);
        }
        catch (TaskCanceledException) when (!ct.IsCancellationRequested)
        {
            return Results.StatusCode(StatusCodes.Status504GatewayTimeout);
        }
    }

    /// <summary>
    /// Where an envelope goes: its first line is a JSON header naming the DSN it
    /// is for. Null unless that DSN is in the same Sentry organization (same
    /// ingest host) as <paramref name="own"/>.
    /// </summary>
    public static Uri? TargetFor(ReadOnlySpan<byte> envelope, Uri own)
    {
        var end = envelope.IndexOf((byte)'\n');
        var header = end < 0 ? envelope : envelope[..end];

        string? dsn;
        try
        {
            dsn = JsonNode.Parse(header)?["dsn"]?.GetValue<string>();
        }
        catch (Exception e) when (e is System.Text.Json.JsonException or InvalidOperationException or FormatException)
        {
            return null;
        }

        if (!Uri.TryCreate(dsn, UriKind.Absolute, out var target)
            || target.Scheme != Uri.UriSchemeHttps
            || !string.Equals(target.Host, own.Host, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var project = target.AbsolutePath.Trim('/');
        return project.Length > 0 && project.All(char.IsAsciiDigit)
            ? new Uri($"https://{target.Host}/api/{project}/envelope/")
            : null;
    }
}
