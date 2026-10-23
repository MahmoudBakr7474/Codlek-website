using System.Text.RegularExpressions;
using Codlek.Api.Data;
using Codlek.Api.Site;
using Ganss.Xss;

namespace Codlek.Api.Public;

/// <summary>Database rows in the shape the public site reads.</summary>
public sealed partial class PublicMap(Media media, HtmlSanitizer sanitizer)
{
    public CategoryDto Category(ProjectCategory c, SiteContent site) =>
        new(c.Id, c.Slug, site.Tr(c.NameAr, c.NameEn), string.IsNullOrWhiteSpace(c.Icon) ? "layout-grid" : c.Icon);

    public ProjectDto Project(Data.Project p, SiteContent site) => new(
        p.Id,
        site.Tr(p.TitleAr, p.TitleEn),
        site.Tr(p.DescriptionAr, p.DescriptionEn),
        media.Url(p.Image),
        p.Url,
        Host(p.Url),
        !string.IsNullOrWhiteSpace(p.Url) && !p.IsComingSoon,
        p.IsFeatured,
        p.IsComingSoon,
        p.ProjectCategory is null ? null : Category(p.ProjectCategory, site));

    public ServiceDto Service(Data.Service s, SiteContent site) => new(
        s.Key,
        string.IsNullOrWhiteSpace(s.Icon) ? "layout-grid" : s.Icon,
        SiteData.ServiceTones.Contains(s.Tone) ? s.Tone : SiteData.ServiceTones[0],
        media.Url(s.Image),
        s.IsPopular,
        site.Tr(s.TitleAr, s.TitleEn),
        site.Tr(s.SummaryAr, s.SummaryEn),
        site.Tr(s.DescriptionAr, s.DescriptionEn),
        s.Features
            .Where(f => !string.IsNullOrWhiteSpace(f.Ar) || !string.IsNullOrWhiteSpace(f.En))
            .Select(f => site.Tr(f.Ar, f.En))
            .ToList());

    public TestimonialDto Testimonial(Data.Testimonial t, SiteContent site) => new(
        site.Tr(t.NameAr, t.NameEn),
        site.Tr(t.RoleAr, t.RoleEn),
        site.Tr(t.QuoteAr, t.QuoteEn),
        Math.Clamp((int)t.Rating, 1, 5),
        media.Url(t.Avatar));

    public PostCardDto PostCard(Post p, SiteContent site) => new(
        p.Slug,
        site.Tr(p.TitleAr, p.TitleEn),
        site.Tr(p.ExcerptAr, p.ExcerptEn),
        NullIfEmpty(site.Tr(p.CategoryAr, p.CategoryEn)),
        media.Url(p.Cover),
        p.PublishedAt ?? p.CreatedAt ?? DateTime.UtcNow,
        ReadingMinutes(site.Tr(p.BodyAr, p.BodyEn)));

    public PostDto Post(Post p, SiteContent site)
    {
        var card = PostCard(p, site);
        return new PostDto(
            card.Slug, card.Title, card.Excerpt, card.Category, card.CoverUrl, card.PublishedAt,
            p.UpdatedAt, card.ReadingMinutes, SafeBody(site.Tr(p.BodyAr, p.BodyEn)));
    }

    public JobDto Job(JobOpening j, SiteContent site) => new(
        j.Id,
        site.Tr(j.TitleAr, j.TitleEn),
        site.Tr(j.DepartmentAr, j.DepartmentEn),
        site.Tr(j.LocationAr, j.LocationEn),
        site.Tr(j.TypeAr, j.TypeEn),
        site.Tr(j.DescriptionAr, j.DescriptionEn));

    /// <summary>"ispektra.com" for the browser-frame mock-ups.</summary>
    public static string? Host(string? url)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        var host = Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Host != "" ? uri.Host : url;
        var www = host.IndexOf("www.", StringComparison.Ordinal);
        return www >= 0 ? host[(www + 4)..] : host;
    }

    /// <summary>Words split on whitespace (Arabic included), 200 a minute, at least 1.</summary>
    public static int ReadingMinutes(string html)
    {
        var text = TagPattern().Replace(html, " ").Trim();
        var words = text == "" ? 0 : WhitespacePattern().Split(text).Length;
        return Math.Max(1, (int)Math.Ceiling(words / 200.0));
    }

    /// <summary>Article HTML with anything unsafe stripped; images lazy and never without alt.</summary>
    public string SafeBody(string html)
    {
        var safe = sanitizer.Sanitize(html);
        safe = ImgWithoutLoading().Replace(safe, "<img loading=\"lazy\" decoding=\"async\"");
        return ImgWithoutAlt().Replace(safe, "<img alt=\"\"");
    }

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value;

    [GeneratedRegex("<[^>]*>")]
    private static partial Regex TagPattern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespacePattern();

    [GeneratedRegex(@"<img(?![^>]*\sloading=)", RegexOptions.IgnoreCase)]
    private static partial Regex ImgWithoutLoading();

    [GeneratedRegex(@"<img(?![^>]*\salt=)", RegexOptions.IgnoreCase)]
    private static partial Regex ImgWithoutAlt();
}
