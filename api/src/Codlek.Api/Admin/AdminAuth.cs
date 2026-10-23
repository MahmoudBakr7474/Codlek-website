using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Codlek.Api.Data;
using Codlek.Api.Forms;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Admin;

public sealed record LoginInput(string? Email, string? Password, bool Remember);

public sealed record AdminUser(string Name, string Email);

public sealed record AccountInput(string? Name, string? Email, string? CurrentPassword, string? NewPassword);

/// <summary>
/// Sign-in for the dashboard: an httpOnly cookie, for users with is_admin. The
/// passwords are the Laravel bcrypt hashes ("$2y$"), checked as they are. The
/// cookie carries a stamp of the password hash, so changing the password (or
/// losing is_admin) signs out every other session.
/// </summary>
public static class AdminAuth
{
    public const string Policy = "admin";
    public const int MinPasswordLength = 10;

    private const string StampClaim = "stamp";

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
                options.Events.OnValidatePrincipal = async context =>
                {
                    var db = context.HttpContext.RequestServices.GetRequiredService<CodlekDbContext>();
                    var id = int.TryParse(context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
                    var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
                    if (user is null || !user.IsAdmin || context.Principal?.FindFirstValue(StampClaim) != Stamp(user.Password))
                    {
                        context.RejectPrincipal();
                        await context.HttpContext.SignOutAsync();
                    }
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
        auth.MapPut("/account", UpdateAccount);
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

        await SignInAsync(http, user, input.Remember);
        return Results.Ok(new AdminUser(user.Name, user.Email));
    }

    /// <summary>The signed-in admin's name, email and password. The current password is always required.</summary>
    private static async Task<IResult> UpdateAccount(AccountInput input, ClaimsPrincipal principal, HttpContext http, CodlekDbContext db, FormThrottle throttle, IConfiguration config, CancellationToken ct)
    {
        var id = int.TryParse(principal.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : 0;
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
        if (user is null)
        {
            return Results.Unauthorized();
        }

        // Guessing the current password from a stolen session counts like failed sign-ins.
        var visitor = $"login:{ClientIp.Of(http, config)}";
        if (throttle.Blocked(visitor))
        {
            return Results.Json(new { message = "محاولات كتير. استنى دقيقة وجرّب تاني." }, statusCode: StatusCodes.Status429TooManyRequests);
        }

        var name = input.Name?.Trim() ?? "";
        var email = input.Email?.Trim().ToLowerInvariant() ?? "";
        var validator = new AdminValidator();
        validator.Text("name", name, 255);
        validator.Required("email", email);
        validator.Email("email", email);
        validator.Max("email", email, 255);
        if (!validator.Has("email") && await db.Users.AnyAsync(u => u.Email == email && u.Id != user.Id, ct))
        {
            validator.Fail("email", "الإيميل ده مستخدم لحساب تاني.");
        }

        if (!string.IsNullOrEmpty(input.NewPassword) && input.NewPassword.Length < MinPasswordLength)
        {
            validator.Fail("newPassword", $"كلمة السر الجديدة لازم تبقى {MinPasswordLength} حروف على الأقل.");
        }

        if (string.IsNullOrEmpty(input.CurrentPassword) || !Verify(input.CurrentPassword, user.Password))
        {
            throttle.Hit(visitor);
            validator.Fail("currentPassword", "كلمة السر الحالية غلط.");
        }

        if (!validator.IsValid)
        {
            return validator.Problem();
        }

        user.Name = name;
        user.Email = email;
        if (!string.IsNullOrEmpty(input.NewPassword))
        {
            user.Password = BCrypt.Net.BCrypt.HashPassword(input.NewPassword, 12);
        }

        await db.SaveChangesAsync(ct);

        // A fresh cookie with the new name, email and password stamp; the other sessions end.
        var current = await http.AuthenticateAsync();
        await SignInAsync(http, user, current.Properties?.IsPersistent ?? false);
        return Results.Ok(new AdminUser(user.Name, user.Email));
    }

    private static Task SignInAsync(HttpContext http, User user, bool remember)
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("admin", "1"),
                new Claim(StampClaim, Stamp(user.Password)),
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);

        return http.SignInAsync(new ClaimsPrincipal(identity), new AuthenticationProperties { IsPersistent = remember });
    }

    /// <summary>A short fingerprint of the password hash (not the hash itself) for the cookie.</summary>
    private static string Stamp(string passwordHash) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(passwordHash)))[..16];

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
