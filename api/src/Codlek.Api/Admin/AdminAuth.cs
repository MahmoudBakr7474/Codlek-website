using System.Security.Claims;
using Codlek.Api.Data;
using Codlek.Api.Forms;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Admin;

public sealed record LoginInput(string? Email, string? Password, bool Remember);

public sealed record AdminUser(string Name, string Email);

/// <summary>
/// Sign-in for the dashboard: an httpOnly cookie, for users with is_admin. The
/// passwords are the Laravel bcrypt hashes ("$2y$"), checked as they are.
/// </summary>
public static class AdminAuth
{
    public const string Policy = "admin";

    public static void AddAdminAuth(this IServiceCollection services)
    {
        services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(options =>
            {
                options.Cookie.Name = "codlek_admin";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.ExpireTimeSpan = TimeSpan.FromDays(14);
                options.SlidingExpiration = true;
                // An API: no redirects to a login page, just the status.
                options.Events.OnRedirectToLogin = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                };
                options.Events.OnRedirectToAccessDenied = context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    return Task.CompletedTask;
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy(Policy, policy => policy.RequireAuthenticatedUser().RequireClaim("admin", "1"));
    }

    public static void MapAdminAuth(this RouteGroupBuilder admin)
    {
        var auth = admin.MapGroup("/auth");

        auth.MapPost("/login", Login).AllowAnonymous();
        auth.MapPost("/logout", async (HttpContext http) =>
        {
            await http.SignOutAsync();
            return Results.NoContent();
        }).AllowAnonymous();
        auth.MapGet("/me", (ClaimsPrincipal user) =>
            new AdminUser(user.FindFirstValue(ClaimTypes.Name) ?? "", user.FindFirstValue(ClaimTypes.Email) ?? ""));
    }

    private static async Task<IResult> Login(LoginInput input, HttpContext http, CodlekDbContext db, FormThrottle throttle, IConfiguration config, CancellationToken ct)
    {
        // A few honest retries, not a password guessing run: failed sign-ins count.
        var visitor = $"login:{ClientIp.Of(http, config)}";
        if (throttle.Blocked(visitor))
        {
            return Results.Json(new { message = "محاولات كتير. استنى دقيقة وجرّب تاني." }, statusCode: StatusCodes.Status429TooManyRequests);
        }

        var email = input.Email?.Trim().ToLowerInvariant() ?? "";
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, ct);

        if (user is null || !user.IsAdmin || string.IsNullOrEmpty(input.Password) || !Verify(input.Password, user.Password))
        {
            throttle.Hit(visitor);
            return Results.Json(new { message = "الإيميل أو كلمة السر غلط." }, statusCode: StatusCodes.Status401Unauthorized);
        }

        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("admin", "1"),
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);

        await http.SignInAsync(new ClaimsPrincipal(identity), new AuthenticationProperties { IsPersistent = input.Remember });
        return Results.Ok(new AdminUser(user.Name, user.Email));
    }

    private static bool Verify(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }
}
