using System.Globalization;
using System.Text;

namespace Codlek.Api.Forms;

/// <summary>Clean-up applied to the visitor's input before validation.</summary>
public static class FormInput
{
    public static string? Clean(string? value) => value?.Trim();

    public static string? Email(string? value) => Clean(value)?.ToLowerInvariant();

    /// <summary>
    /// Phone numbers typed with Arabic-Indic digits (٠١١٤…) become plain ASCII,
    /// and the invisible direction marks and non-breaking spaces that come with
    /// numbers pasted from iPhone Contacts or WhatsApp are dropped.
    /// </summary>
    public static string? Phone(string? value)
    {
        if (value is null)
        {
            return null;
        }

        var text = new StringBuilder(value.Length);
        var lastWasSpace = false;

        foreach (var rune in value.EnumerateRunes())
        {
            var category = Rune.GetUnicodeCategory(rune);
            if (category == UnicodeCategory.Format)
            {
                continue;
            }

            if (category is UnicodeCategory.SpaceSeparator or UnicodeCategory.LineSeparator or UnicodeCategory.ParagraphSeparator)
            {
                if (!lastWasSpace)
                {
                    text.Append(' ');
                }

                lastWasSpace = true;
                continue;
            }

            lastWasSpace = false;
            var digit = rune.Value switch
            {
                >= 0x0660 and <= 0x0669 => rune.Value - 0x0660,   // Arabic-Indic
                >= 0x06F0 and <= 0x06F9 => rune.Value - 0x06F0,   // Eastern Arabic-Indic (Persian)
                _ => -1,
            };

            if (digit >= 0)
            {
                text.Append((char)('0' + digit));
            }
            else
            {
                text.Append(rune.ToString());
            }
        }

        return text.ToString().Trim();
    }
}
