using System.Net.Mail;
using System.Text.RegularExpressions;
using Codlek.Api.Site;

namespace Codlek.Api.Forms;

/// <summary>
/// The Laravel form rules, with its messages in the visitor's language: one
/// message per field, field labels from the forms.labels.* texts.
/// </summary>
public sealed partial class FormValidator(SiteContent site, SiteData data)
{
    private readonly Dictionary<string, string[]> errors = [];

    public bool IsValid => errors.Count == 0;

    public IReadOnlyDictionary<string, string[]> Errors => errors;

    public bool Has(string field) => errors.ContainsKey(field);

    public void Fail(string field, string message) => errors.TryAdd(field, [message]);

    public void Required(string field, string? value, string label)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            Fail(field, Message("required", label));
        }
    }

    public void Length(string field, string? value, string label, int min, int max)
    {
        if (Has(field) || string.IsNullOrEmpty(value))
        {
            return;
        }

        var length = value.EnumerateRunes().Count();   // characters, as mb_strlen counts them
        if (length < min)
        {
            Fail(field, Message("min_string", label, ("min", min.ToString())));
        }
        else if (length > max)
        {
            Fail(field, Message("max_string", label, ("max", max.ToString())));
        }
    }

    public void Email(string field, string? value, string label)
    {
        if (Has(field) || string.IsNullOrEmpty(value))
        {
            return;
        }

        if (!MailAddress.TryCreate(value, out var address) || address.Address != value || address.Host == "")
        {
            Fail(field, Message("email", label));
        }
    }

    public void Url(string field, string? value, string label)
    {
        if (Has(field) || string.IsNullOrEmpty(value))
        {
            return;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            || uri.Host == "")
        {
            Fail(field, Message("url", label));
        }
    }

    public void In(string field, string? value, string label, IEnumerable<string> allowed)
    {
        if (!Has(field) && !string.IsNullOrEmpty(value) && !allowed.Contains(value))
        {
            Fail(field, Message("in", label));
        }
    }

    /// <summary>7–15 digits, allowing "+", spaces, dashes, dots and brackets.</summary>
    public void Phone(string field, string? value, string label)
    {
        Required(field, value, label);
        Length(field, value, label, 0, 32);
        if (Has(field))
        {
            return;
        }

        if (!PhonePattern().IsMatch(value!))
        {
            Fail(field, Message("regex", label));
            return;
        }

        var digits = value!.Count(char.IsAsciiDigit);
        if (digits is < 7 or > 15)
        {
            Fail(field, site.Text("forms.phone_format"));
        }
    }

    public string Message(string rule, string label, params (string Name, string Value)[] replace)
    {
        var text = data.Validation[site.Locale].GetValueOrDefault(rule, rule).Replace(":attribute", label);
        foreach (var (name, value) in replace)
        {
            text = text.Replace(":" + name, value);
        }

        return text;
    }

    [GeneratedRegex(@"^\+?[0-9\s\-().]{7,25}$")]
    private static partial Regex PhonePattern();
}
