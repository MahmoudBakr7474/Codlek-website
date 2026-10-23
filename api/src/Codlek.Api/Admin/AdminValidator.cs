using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Codlek.Api.Admin;

/// <summary>
/// Checks for the admin forms, with the messages in Egyptian Arabic the Filament
/// panel used. One message per field; the dashboard shows it under the field.
/// </summary>
public sealed partial class AdminValidator
{
    private readonly Dictionary<string, string[]> errors = [];

    public bool IsValid => errors.Count == 0;

    public IReadOnlyDictionary<string, string[]> Errors => errors;

    public bool Has(string field) => errors.ContainsKey(field);

    public void Fail(string field, string message) => errors.TryAdd(field, [message]);

    public void Required(string field, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Fail(field, "الحقل ده مطلوب.");
        }
    }

    public void Max(string field, string? value, int max)
    {
        if (!Has(field) && value is not null && value.EnumerateRunes().Count() > max)
        {
            Fail(field, $"أقصى طول {max} حرف.");
        }
    }

    public void Text(string field, string? value, int max, bool required = true)
    {
        if (required)
        {
            Required(field, value);
        }

        Max(field, value, max);
    }

    public void Url(string field, string? value)
    {
        if (Has(field) || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) || uri.Host == "")
        {
            Fail(field, "الرابط لازم يبدأ بـ https:// ويكون رابط صحيح.");
        }
    }

    public void Email(string field, string? value)
    {
        if (Has(field) || string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        if (!MailAddress.TryCreate(value, out var address) || address.Address != value)
        {
            Fail(field, "الإيميل مكتوب غلط.");
        }
    }

    /// <summary>Lower-case English letters, digits and dashes (a URL part such as "ecommerce-seo-tips").</summary>
    public void Slug(string field, string? value)
    {
        if (!Has(field) && !string.IsNullOrEmpty(value) && !SlugPattern().IsMatch(value))
        {
            Fail(field, "حروف إنجليزية صغيرة (a-z) وأرقام وشرطات بس، ومن غير شرطة في الأول أو الآخر.");
        }
    }

    /// <summary>A Lucide icon name ("shopping-cart"). The site draws a fallback for a name it doesn't know.</summary>
    public void Icon(string field, string? value)
    {
        Required(field, value);
        if (!Has(field) && !IconPattern().IsMatch(value!))
        {
            Fail(field, "اختار أيقونة من القائمة.");
        }
    }

    public void In(string field, string? value, IEnumerable<string> allowed)
    {
        if (!Has(field) && (value is null || !allowed.Contains(value)))
        {
            Fail(field, "اختار من القائمة.");
        }
    }

    public IResult Problem() =>
        Results.Json(new { message = "راجع الحقول اللي عليها علامة.", errors }, statusCode: StatusCodes.Status422UnprocessableEntity);

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex SlugPattern();

    [GeneratedRegex("^[a-z0-9]+(?:-[a-z0-9]+)*$")]
    private static partial Regex IconPattern();
}
