namespace Codlek.Api.Site;

/*
 * Content blocks as the site gets them: texts already in the page's language
 * (falling back to the other one when left empty) with {years}, {email} and
 * {phone} filled in. Icon names are Lucide names; the site swaps an unknown
 * one for a fallback, as the Laravel templates did.
 */

public sealed record Stat(string Value, string Label);

public sealed record IconText(string Icon, string Text);

public sealed record IconCard(string Icon, string Title, string Text);

public sealed record Technology(string Name, string Color);

public sealed record Why(IReadOnlyList<Stat> Stats, IReadOnlyList<IconText> Features);

public sealed record About(
    IReadOnlyList<Stat> Stats,
    IReadOnlyList<string> Story,
    IReadOnlyList<IconCard> Values,
    IReadOnlyList<string> Why,
    string Satisfaction);

public sealed record LegalSection(string Title, string? Text, IReadOnlyList<string> Items);

public sealed record SocialLink(string Platform, string Url, string Label);

public sealed record ContactDetails(string Email, string Phone, string PhoneInternational, string Whatsapp);

public sealed record Appearance(string Loader, string Theme, bool FloatingContact);
