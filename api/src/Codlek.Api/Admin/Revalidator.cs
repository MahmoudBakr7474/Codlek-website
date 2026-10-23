namespace Codlek.Api.Admin;

/// <summary>
/// After a save in the admin, tells the public site (Next.js) to drop its cached
/// API reads: POST Codlek:RevalidateUrl with Codlek:RevalidateSecret. Fire and
/// forget: a site that can't be reached refreshes on its own within the hour.
/// </summary>
public sealed class Revalidator(IHttpClientFactory clients, IConfiguration config, ILogger<Revalidator> logger)
{
    public void Ping()
    {
        var url = config["Codlek:RevalidateUrl"];
        var secret = config["Codlek:RevalidateSecret"];
        if (string.IsNullOrEmpty(url) || string.IsNullOrEmpty(secret))
        {
            return;
        }

        _ = Task.Run(async () =>
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.Add("X-Revalidate-Secret", secret);
                using var response = await clients.CreateClient(nameof(Revalidator)).SendAsync(request);
                if (!response.IsSuccessStatusCode)
                {
                    logger.LogWarning("Revalidating the site answered {Status}", (int)response.StatusCode);
                }
            }
            catch (Exception e)
            {
                logger.LogWarning(e, "Revalidating the site failed");
            }
        });
    }
}

/// <summary>
/// On the admin API: a write (anything but GET) must carry X-Codlek-Admin, which a
/// cross-site form can't add (a second line of defence next to SameSite cookies),
/// and a successful write refreshes the public site.
/// </summary>
public sealed class AdminWriteFilter(Revalidator revalidator) : IEndpointFilter
{
    public const string Header = "X-Codlek-Admin";

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var http = context.HttpContext;
        if (HttpMethods.IsGet(http.Request.Method))
        {
            return await next(context);
        }

        if (!http.Request.Headers.ContainsKey(Header))
        {
            return Results.StatusCode(StatusCodes.Status403Forbidden);
        }

        var result = await next(context);
        var status = result is IStatusCodeHttpResult { StatusCode: { } code } ? code : http.Response.StatusCode;
        if (status is >= 200 and < 300)
        {
            revalidator.Ping();
        }

        return result;
    }
}
