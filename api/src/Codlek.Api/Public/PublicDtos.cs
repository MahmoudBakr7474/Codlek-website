using Codlek.Api.Site;

namespace Codlek.Api.Public;

/*
 * What the public site (Next.js) reads. Every text is already in the page's
 * language; image fields are absolute URLs (null when there is none).
 */

public sealed record CategoryDto(int Id, string Slug, string Name, string Icon);

public sealed record ProjectDto(
    int Id,
    string Title,
    string Description,
    string? ImageUrl,
    string? Url,
    string? Host,
    bool IsLinkable,
    bool IsFeatured,
    bool IsComingSoon,
    CategoryDto? Category);

public sealed record ServiceDto(
    string Key,
    string Icon,
    string Tone,
    string? ImageUrl,
    bool Popular,
    string Title,
    string Summary,
    string Description,
    IReadOnlyList<string> Features);

public sealed record TestimonialDto(string Name, string Role, string Quote, int Rating, string? AvatarUrl);

public sealed record PostCardDto(
    string Slug,
    string Title,
    string Excerpt,
    string? Category,
    string? CoverUrl,
    DateTime PublishedAt,
    int ReadingMinutes);

public sealed record PostDto(
    string Slug,
    string Title,
    string Excerpt,
    string? Category,
    string? CoverUrl,
    DateTime PublishedAt,
    DateTime? UpdatedAt,
    int ReadingMinutes,
    string Body);

public sealed record JobDto(int Id, string Title, string Department, string Location, string Type, string Description);

public sealed record Option(string Key, string Label);

/// <summary>Everything the layout needs on every page.</summary>
public sealed record SiteDto(
    string Locale,
    IReadOnlyDictionary<string, string> Texts,
    ContactDetails Contact,
    IReadOnlyList<SocialLink> Socials,
    IReadOnlyList<Option> Services,
    IReadOnlyList<Option> ServiceOptions,
    Appearance Appearance,
    string? OgImageUrl,
    int YearsOfExperience,
    int Founded);

public sealed record HomeDto(
    IReadOnlyList<string> Sections,
    IReadOnlyList<Stat> HeroStats,
    string HeroVisual,
    string? HeroImageUrl,
    bool HeroTrust,
    IReadOnlyList<ProjectDto> Showcase,
    IReadOnlyList<ServiceDto> Services,
    IReadOnlyList<ProjectDto> Featured,
    Why Why,
    int Years,
    IReadOnlyList<Technology> Technologies,
    IReadOnlyList<IconCard> Industries,
    IReadOnlyList<IconCard> Journey,
    IReadOnlyList<IconCard> Team,
    IReadOnlyList<TestimonialDto> Testimonials);

public sealed record ProjectsDto(IReadOnlyList<CategoryDto> Categories, string? Active, IReadOnlyList<ProjectDto> Projects);

public sealed record PostsPageDto(IReadOnlyList<PostCardDto> Posts, int Page, int LastPage, int Total);

public sealed record ArticleDto(PostDto Post, IReadOnlyList<PostCardDto> Related);

public sealed record LegalDto(string Title, string Updated, IReadOnlyList<LegalSection> Sections);

public sealed record SitemapPost(string Slug, DateTime? UpdatedAt);

public sealed record SitemapDto(IReadOnlyList<SitemapPost> Posts);

public sealed record FormSuccess(string Title, string Text);
