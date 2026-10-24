using Codlek.Api.Data;
using Codlek.Api.Site;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Public;

/// <summary>Read-only endpoints for the public site, one per page, in /api/public/{ar|en}/...</summary>
public static class PublicEndpoints
{
    public const int PostsPerPage = 9;

    public static void MapPublicEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/public/{locale:regex(^(ar|en)$)}").WithTags("Public");

        group.MapGet("/site", Site);
        group.MapGet("/home", Home);
        group.MapGet("/about", About);
        group.MapGet("/services", Services);
        group.MapGet("/projects", Projects);
        group.MapGet("/posts", Posts);
        group.MapGet("/posts/{slug}", Article);
        group.MapGet("/jobs", Jobs);
        group.MapGet("/legal/{page:regex(^(privacy|terms)$)}", Legal);

        app.MapGet("/api/public/sitemap", Sitemap).WithTags("Public");
    }

    private static async Task<SiteDto> Site(string locale, SiteContentLoader loader, CodlekDbContext db, Media media, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        var services = await ServiceLabels(db, site, ct);
        var ogImage = site.OgImagePath();

        // {years}, {email} and {phone} are filled here, not in site.Texts: the admin's
        // text editor reads those and must keep the tokens.
        return new SiteDto(
            site.Locale,
            site.Texts.ToDictionary(text => text.Key, text => site.Fill(text.Value)),
            site.Contact,
            site.Socials(),
            services,
            [.. services, new Option("other", site.Locale == "en" ? "Other" : "أخرى")],
            site.Appearance(),
            media.Exists(ogImage) ? media.Url(ogImage) : null,
            site.YearsOfExperience,
            site.Founded);
    }

    private static async Task<HomeDto> Home(string locale, SiteContentLoader loader, CodlekDbContext db, PublicMap map, Media media, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);

        var services = (await db.Services.AsNoTracking().Where(s => s.IsPublished).OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync(ct))
            .Select(s => map.Service(s, site)).ToList();
        var featured = (await db.Projects.AsNoTracking().Include(p => p.ProjectCategory)
                .Where(p => p.IsPublished && p.IsFeatured).OrderBy(p => p.SortOrder).ThenBy(p => p.Id).Take(4).ToListAsync(ct))
            .Select(p => map.Project(p, site)).ToList();
        var testimonials = (await db.Testimonials.AsNoTracking().Where(t => t.IsPublished).OrderBy(t => t.SortOrder).ThenBy(t => t.Id).ToListAsync(ct))
            .Select(t => map.Testimonial(t, site)).ToList();

        var why = site.Why();
        var technologies = site.Technologies();
        var industries = site.Industries();
        var journey = site.Journey();
        var team = site.Team();

        // A section with nothing to show is skipped rather than drawn empty.
        var hasContent = new Dictionary<string, bool>
        {
            ["services"] = services.Count > 0,
            ["projects"] = featured.Count > 0,
            ["why"] = why.Stats.Count > 0 || why.Features.Count > 0,
            ["technologies"] = technologies.Count > 0,
            ["industries"] = industries.Count > 0,
            ["journey"] = journey.Count > 0,
            ["team"] = team.Count > 0,
            ["testimonials"] = testimonials.Count > 0,
        };

        // Project screenshots beside the hero text only when the owner chose them;
        // with none to show, the hero falls back to its picture.
        var heroVisual = site.HeroVisual();
        var showcase = heroVisual == "projects" ? await HeroShots(db, site, ct) : [];
        if (showcase.Count == 0)
        {
            heroVisual = "image";
        }

        var heroImage = site.HeroImagePath();

        return new HomeDto(
            site.HomeSections().Where(s => hasContent.GetValueOrDefault(s, true)).ToList(),
            site.HeroStats(),
            heroVisual,
            media.Exists(heroImage) ? media.Url(heroImage) : null,
            site.HeroTrustVisible(),
            showcase.Select(p => map.Project(p, site)).ToList(),
            services,
            featured,
            why,
            site.YearsOfExperience,
            technologies,
            industries,
            journey,
            team,
            testimonials);
    }

    /// <summary>
    /// The two screenshots in the hero: the projects picked in the admin, and when
    /// one isn't picked (or no longer has an image), the next featured one.
    /// </summary>
    private static async Task<List<Data.Project>> HeroShots(CodlekDbContext db, SiteContent site, CancellationToken ct)
    {
        var shootable = db.Projects.AsNoTracking().Include(p => p.ProjectCategory)
            .Where(p => p.IsPublished && p.Image != null && p.Image != "");

        var ids = site.HeroProjectIds();
        var found = await shootable.Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        var picked = ids.Select(id => found.FirstOrDefault(p => p.Id == id)).OfType<Data.Project>().ToList();

        if (picked.Count >= 2)
        {
            return picked;
        }

        var pickedIds = picked.Select(p => p.Id).ToList();
        var fill = await shootable
            .Where(p => !p.IsComingSoon && !pickedIds.Contains(p.Id))
            .OrderByDescending(p => p.IsFeatured).ThenBy(p => p.SortOrder).ThenBy(p => p.Id)
            .Take(2 - picked.Count)
            .ToListAsync(ct);

        return [.. picked, .. fill];
    }

    private static async Task<About> About(string locale, SiteContentLoader loader, CancellationToken ct) =>
        (await loader.LoadAsync(locale, ct)).About();

    private static async Task<List<ServiceDto>> Services(string locale, SiteContentLoader loader, CodlekDbContext db, PublicMap map, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        return (await db.Services.AsNoTracking().Where(s => s.IsPublished).OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync(ct))
            .Select(s => map.Service(s, site)).ToList();
    }

    private static async Task<ProjectsDto> Projects(string locale, string? category, SiteContentLoader loader, CodlekDbContext db, PublicMap map, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);

        // Only categories that actually have something to show.
        var categories = await db.ProjectCategories.AsNoTracking()
            .Where(c => c.Projects.Any(p => p.IsPublished))
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Id)
            .ToListAsync(ct);
        var active = categories.FirstOrDefault(c => c.Slug == category);

        var query = db.Projects.AsNoTracking().Include(p => p.ProjectCategory).Where(p => p.IsPublished);
        if (active is not null)
        {
            query = query.Where(p => p.ProjectCategoryId == active.Id);
        }

        var projects = await query.OrderBy(p => p.SortOrder).ThenBy(p => p.Id).ToListAsync(ct);

        return new ProjectsDto(
            categories.Select(c => map.Category(c, site)).ToList(),
            active?.Slug,
            projects.Select(p => map.Project(p, site)).ToList());
    }

    private static async Task<Results<Ok<PostsPageDto>, NotFound>> Posts(string locale, string? page, SiteContentLoader loader, CodlekDbContext db, PublicMap map, TimeProvider clock, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        var current = int.TryParse(page, out var number) && number > 1 ? number : 1;

        var published = Published(db, clock);
        var total = await published.CountAsync(ct);
        var posts = await published
            .OrderByDescending(p => p.PublishedAt).ThenByDescending(p => p.Id)
            .Skip((current - 1) * PostsPerPage).Take(PostsPerPage)
            .ToListAsync(ct);

        // ?page=99 would be an empty page that still claims to be canonical.
        if (posts.Count == 0 && current > 1)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.Ok(new PostsPageDto(
            posts.Select(p => map.PostCard(p, site)).ToList(),
            current,
            Math.Max(1, (int)Math.Ceiling(total / (double)PostsPerPage)),
            total));
    }

    private static async Task<Results<Ok<ArticleDto>, NotFound>> Article(string locale, string slug, SiteContentLoader loader, CodlekDbContext db, PublicMap map, TimeProvider clock, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        var post = await Published(db, clock).FirstOrDefaultAsync(p => p.Slug == slug, ct);
        if (post is null)
        {
            return TypedResults.NotFound();
        }

        var related = await Published(db, clock)
            .Where(p => p.Id != post.Id)
            .OrderByDescending(p => p.PublishedAt).ThenByDescending(p => p.Id)
            .Take(3)
            .ToListAsync(ct);

        return TypedResults.Ok(new ArticleDto(map.Post(post, site), related.Select(p => map.PostCard(p, site)).ToList()));
    }

    private static async Task<List<JobDto>> Jobs(string locale, SiteContentLoader loader, CodlekDbContext db, PublicMap map, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        return (await db.JobOpenings.AsNoTracking().Where(j => j.IsActive).OrderBy(j => j.SortOrder).ThenBy(j => j.Id).ToListAsync(ct))
            .Select(j => map.Job(j, site)).ToList();
    }

    private static async Task<LegalDto> Legal(string locale, string page, SiteContentLoader loader, CancellationToken ct)
    {
        var site = await loader.LoadAsync(locale, ct);
        return new LegalDto(site.Text($"legal.{page}_title"), site.Text("legal.updated"), site.Legal(page));
    }

    private static async Task<SitemapDto> Sitemap(CodlekDbContext db, TimeProvider clock, CancellationToken ct) =>
        new(await Published(db, clock)
            .OrderByDescending(p => p.PublishedAt).ThenByDescending(p => p.Id)
            .Select(p => new SitemapPost(p.Slug, p.UpdatedAt))
            .ToListAsync(ct));

    /// <summary>Published and not scheduled for later.</summary>
    private static IQueryable<Post> Published(CodlekDbContext db, TimeProvider clock)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        return db.Posts.AsNoTracking().Where(p => p.IsPublished && p.PublishedAt != null && p.PublishedAt <= now);
    }

    /// <summary>Published services as key => title (the footer list and the contact form).</summary>
    public static async Task<List<Option>> ServiceLabels(CodlekDbContext db, SiteContent site, CancellationToken ct) =>
        (await db.Services.AsNoTracking().Where(s => s.IsPublished).OrderBy(s => s.SortOrder).ThenBy(s => s.Id).ToListAsync(ct))
            .Select(s => new Option(s.Key, site.Tr(s.TitleAr, s.TitleEn)))
            .ToList();
}
