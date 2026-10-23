using Codlek.Api.Data;
using Codlek.Api.Public;
using Codlek.Api.Site;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Admin;

/*
 * The tables the dashboard edits, with the Filament panel's rules. Inputs are
 * what a form sends; rows are what lists and forms read (the input fields plus
 * id, order and display extras such as image URLs and counts).
 */

public sealed record CategoryInput(string? Slug, string? NameAr, string? NameEn, string? Icon);
public sealed record CategoryRow(int Id, string Slug, string NameAr, string NameEn, string Icon, int SortOrder, int ProjectsCount);

public sealed record ProjectInput(
    int? ProjectCategoryId, string? TitleAr, string? TitleEn, string? DescriptionAr, string? DescriptionEn,
    string? Image, string? Url, bool IsFeatured, bool IsComingSoon, bool IsPublished);
public sealed record ProjectRow(
    int Id, int? ProjectCategoryId, string TitleAr, string TitleEn, string DescriptionAr, string DescriptionEn,
    string? Image, string? ImageUrl, string? Url, string? Host, bool IsFeatured, bool IsComingSoon, bool IsPublished,
    int SortOrder, string? CategoryName);

public sealed record FeatureInput(string? Ar, string? En);
public sealed record ServiceInput(
    string? Key, string? Icon, string? Tone, string? Image, string? TitleAr, string? TitleEn, string? SummaryAr, string? SummaryEn,
    string? DescriptionAr, string? DescriptionEn, List<FeatureInput>? Features, bool IsPopular, bool IsPublished);
public sealed record ServiceRow(
    int Id, string Key, string Icon, string Tone, string? Image, string? ImageUrl, string TitleAr, string TitleEn, string SummaryAr,
    string SummaryEn, string DescriptionAr, string DescriptionEn, List<LocalizedText> Features, bool IsPopular, bool IsPublished, int SortOrder);

public sealed record PostInput(
    string? Slug, string? TitleAr, string? TitleEn, string? ExcerptAr, string? ExcerptEn, string? BodyAr, string? BodyEn,
    string? CategoryAr, string? CategoryEn, string? Cover, bool IsPublished, DateTime? PublishedAt);
public sealed record PostRow(
    int Id, string Slug, string TitleAr, string TitleEn, string ExcerptAr, string ExcerptEn, string BodyAr, string BodyEn,
    string? CategoryAr, string? CategoryEn, string? Cover, string? CoverUrl, bool IsPublished, DateTime? PublishedAt, bool IsVisible);

public sealed record JobInput(
    string? TitleAr, string? TitleEn, string? DepartmentAr, string? DepartmentEn, string? LocationAr, string? LocationEn,
    string? TypeAr, string? TypeEn, string? DescriptionAr, string? DescriptionEn, bool IsActive);
public sealed record JobRow(
    int Id, string TitleAr, string TitleEn, string DepartmentAr, string DepartmentEn, string LocationAr, string LocationEn,
    string TypeAr, string TypeEn, string DescriptionAr, string DescriptionEn, bool IsActive, int SortOrder, int ApplicationsCount);

public sealed record TestimonialInput(
    string? NameAr, string? NameEn, string? RoleAr, string? RoleEn, string? QuoteAr, string? QuoteEn, int Rating, string? Avatar, bool IsPublished);
public sealed record TestimonialRow(
    int Id, string NameAr, string NameEn, string? RoleAr, string? RoleEn, string QuoteAr, string QuoteEn, int Rating,
    string? Avatar, string? AvatarUrl, bool IsPublished, int SortOrder);

public sealed record MessageRow(
    int Id, string Name, string Email, string Phone, string Service, string ServiceLabel, string Message, string Locale,
    bool IsRead, DateTime? CreatedAt);

public sealed record ApplicationRow(
    int Id, int? JobOpeningId, string JobTitle, string Name, string Email, string Phone, string? ProfileUrl, bool HasCv,
    string? CvOriginalName, string? Message, string Locale, bool IsRead, DateTime? CreatedAt);

public static class AdminResources
{
    /// <summary>Keys the site already uses for its own anchors and menus.</summary>
    public static readonly string[] ReservedServiceKeys = ["other", "main", "quick-contact", "mobile-nav"];

    public static void MapAdminResources(this RouteGroupBuilder admin)
    {
        Categories.Map(admin);
        Projects.Map(admin);
        Services.Map(admin);
        Posts.Map(admin);
        Jobs.Map(admin);
        Testimonials.Map(admin);
        Messages.Map(admin);
        Applications.Map(admin);
    }

    private static string Clean(string? value) => value?.Trim() ?? "";

    private static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static IQueryable<T> Ordered<T>(IQueryable<T> query) where T : class, IEntity, ISortable =>
        query.OrderBy(e => e.SortOrder).ThenBy(e => e.Id);

    private static readonly AdminResource<ProjectCategory, CategoryInput, CategoryRow> Categories = new()
    {
        Name = "project-categories",
        Query = db => db.ProjectCategories.Include(c => c.Projects),
        Row = (c, _) => new CategoryRow(c.Id, c.Slug, c.NameAr, c.NameEn, c.Icon, c.SortOrder, c.Projects.Count),
        Validate = async (input, check, db, id) =>
        {
            check.Text("nameAr", input.NameAr, 100);
            check.Text("nameEn", input.NameEn, 100);
            check.Text("slug", input.Slug, 60);
            check.Slug("slug", Clean(input.Slug));
            if (!check.Has("slug") && await db.ProjectCategories.AnyAsync(c => c.Slug == Clean(input.Slug) && c.Id != id))
            {
                check.Fail("slug", "في تصنيف تاني بنفس الرابط ده.");
            }

            check.Icon("icon", Clean(input.Icon));
        },
        Create = () => new ProjectCategory { Slug = "", NameAr = "", NameEn = "" },
        Apply = (c, input) =>
        {
            c.Slug = Clean(input.Slug);
            c.NameAr = Clean(input.NameAr);
            c.NameEn = Clean(input.NameEn);
            c.Icon = Clean(input.Icon);
        },
        Search = (query, q) => query.Where(c => c.NameAr.Contains(q) || c.NameEn.Contains(q) || c.Slug.Contains(q)),
        Sort = (query, _, _) => Ordered(query),
    };

    private static readonly AdminResource<Project, ProjectInput, ProjectRow> Projects = new()
    {
        Name = "projects",
        Query = db => db.Projects.Include(p => p.ProjectCategory),
        Row = (p, ctx) => new ProjectRow(
            p.Id, p.ProjectCategoryId, p.TitleAr, p.TitleEn, p.DescriptionAr, p.DescriptionEn, p.Image, ctx.Media.Url(p.Image),
            p.Url, PublicMap.Host(p.Url), p.IsFeatured, p.IsComingSoon, p.IsPublished, p.SortOrder, p.ProjectCategory?.NameAr),
        Validate = async (input, check, db, _) =>
        {
            check.Text("titleAr", input.TitleAr, 150);
            check.Text("titleEn", input.TitleEn, 150);
            check.Text("descriptionAr", input.DescriptionAr, 500);
            check.Text("descriptionEn", input.DescriptionEn, 500);
            if (input.ProjectCategoryId is not { } category || !await db.ProjectCategories.AnyAsync(c => c.Id == category))
            {
                check.Fail("projectCategoryId", "اختار التصنيف.");
            }

            check.Text("url", input.Url, 255, required: false);
            check.Url("url", Optional(input.Url));
        },
        Create = () => new Project { TitleAr = "", TitleEn = "", DescriptionAr = "", DescriptionEn = "" },
        Apply = (p, input) =>
        {
            p.ProjectCategoryId = input.ProjectCategoryId;
            p.TitleAr = Clean(input.TitleAr);
            p.TitleEn = Clean(input.TitleEn);
            p.DescriptionAr = Clean(input.DescriptionAr);
            p.DescriptionEn = Clean(input.DescriptionEn);
            p.Image = Optional(input.Image);
            p.Url = Optional(input.Url);
            p.IsFeatured = input.IsFeatured;
            p.IsComingSoon = input.IsComingSoon;
            p.IsPublished = input.IsPublished;
        },
        Search = (query, q) => query.Where(p => p.TitleAr.Contains(q) || p.TitleEn.Contains(q)),
        Filters =
        {
            ["projectCategoryId"] = (query, value) => int.TryParse(value, out var id) ? query.Where(p => p.ProjectCategoryId == id) : query,
            ["isPublished"] = (query, value) => query.Where(p => p.IsPublished == (value == "true")),
            ["isFeatured"] = (query, value) => query.Where(p => p.IsFeatured == (value == "true")),
        },
        Sort = (query, _, _) => Ordered(query),
        Images = p => [p.Image],
        Toggles =
        {
            ["isPublished"] = (p, on) => p.IsPublished = on,
            ["isFeatured"] = (p, on) => p.IsFeatured = on,
        },
    };

    private static readonly AdminResource<Service, ServiceInput, ServiceRow> Services = new()
    {
        Name = "services",
        Query = db => db.Services,
        Row = (s, ctx) => new ServiceRow(
            s.Id, s.Key, s.Icon, s.Tone, s.Image, ctx.Media.Url(s.Image), s.TitleAr, s.TitleEn, s.SummaryAr, s.SummaryEn,
            s.DescriptionAr, s.DescriptionEn, s.Features, s.IsPopular, s.IsPublished, s.SortOrder),
        Validate = async (input, check, db, id) =>
        {
            check.Text("titleAr", input.TitleAr, 80);
            check.Text("titleEn", input.TitleEn, 80);
            check.Text("summaryAr", input.SummaryAr, 300);
            check.Text("summaryEn", input.SummaryEn, 300);
            check.Text("descriptionAr", input.DescriptionAr, 1500);
            check.Text("descriptionEn", input.DescriptionEn, 1500);

            var key = Clean(input.Key).ToLowerInvariant();
            check.Text("key", key, 60);
            check.Slug("key", key);
            if (!check.Has("key") && ReservedServiceKeys.Contains(key))
            {
                check.Fail("key", "الاسم ده محجوز في الموقع، اختار اسم تاني.");
            }

            if (!check.Has("key") && await db.Services.AnyAsync(s => s.Key == key && s.Id != id))
            {
                check.Fail("key", "في خدمة تانية بنفس الرابط ده.");
            }

            check.Icon("icon", Clean(input.Icon));
            check.In("tone", input.Tone, SiteData.ServiceTones);

            var features = input.Features ?? [];
            if (features.Count > 12)
            {
                check.Fail("features", "كفاية 12 ميزة.");
            }

            for (var i = 0; i < features.Count; i++)
            {
                check.Text($"features.{i}.ar", features[i].Ar, 80);
                check.Text($"features.{i}.en", features[i].En, 80);
            }
        },
        Create = () => new Service { Key = "", TitleAr = "", TitleEn = "", SummaryAr = "", SummaryEn = "", DescriptionAr = "", DescriptionEn = "" },
        Apply = (s, input) =>
        {
            s.Key = Clean(input.Key).ToLowerInvariant();
            s.Icon = Clean(input.Icon);
            s.Tone = input.Tone ?? SiteData.ServiceTones[0];
            s.Image = Optional(input.Image);
            s.TitleAr = Clean(input.TitleAr);
            s.TitleEn = Clean(input.TitleEn);
            s.SummaryAr = Clean(input.SummaryAr);
            s.SummaryEn = Clean(input.SummaryEn);
            s.DescriptionAr = Clean(input.DescriptionAr);
            s.DescriptionEn = Clean(input.DescriptionEn);
            s.Features = (input.Features ?? []).Select(f => new LocalizedText { Ar = Clean(f.Ar), En = Clean(f.En) }).ToList();
            s.IsPopular = input.IsPopular;
            s.IsPublished = input.IsPublished;
        },
        Search = (query, q) => query.Where(s => s.TitleAr.Contains(q) || s.TitleEn.Contains(q) || s.Key.Contains(q)),
        Filters =
        {
            ["isPublished"] = (query, value) => query.Where(s => s.IsPublished == (value == "true")),
            ["isPopular"] = (query, value) => query.Where(s => s.IsPopular == (value == "true")),
        },
        Sort = (query, _, _) => Ordered(query),
        Images = s => [s.Image],
        Toggles = { ["isPublished"] = (s, on) => s.IsPublished = on },
    };

    private static readonly AdminResource<Post, PostInput, PostRow> Posts = new()
    {
        Name = "posts",
        Query = db => db.Posts,
        Row = (p, ctx) => new PostRow(
            p.Id, p.Slug, p.TitleAr, p.TitleEn, p.ExcerptAr, p.ExcerptEn, p.BodyAr, p.BodyEn, p.CategoryAr, p.CategoryEn,
            p.Cover, ctx.Media.Url(p.Cover), p.IsPublished, p.PublishedAt,
            p.IsPublished && p.PublishedAt is { } at && at <= DateTime.UtcNow),
        Validate = async (input, check, db, id) =>
        {
            check.Text("titleAr", input.TitleAr, 200);
            check.Text("titleEn", input.TitleEn, 200);
            check.Text("categoryAr", input.CategoryAr, 60, required: false);
            check.Text("categoryEn", input.CategoryEn, 60, required: false);
            check.Text("excerptAr", input.ExcerptAr, 300);
            check.Text("excerptEn", input.ExcerptEn, 300);
            check.Required("bodyAr", StripTags(input.BodyAr));
            check.Required("bodyEn", StripTags(input.BodyEn));

            var slug = Clean(input.Slug);
            check.Text("slug", slug, 120);
            check.Slug("slug", slug);
            if (!check.Has("slug") && await db.Posts.AnyAsync(p => p.Slug == slug && p.Id != id))
            {
                check.Fail("slug", "في مقال تاني بنفس الرابط ده.");
            }

            if (input.PublishedAt is null)
            {
                check.Fail("publishedAt", "الحقل ده مطلوب.");
            }
        },
        Create = () => new Post { Slug = "", TitleAr = "", TitleEn = "", ExcerptAr = "", ExcerptEn = "", BodyAr = "", BodyEn = "" },
        Apply = (p, input) =>
        {
            p.Slug = Clean(input.Slug);
            p.TitleAr = Clean(input.TitleAr);
            p.TitleEn = Clean(input.TitleEn);
            p.ExcerptAr = Clean(input.ExcerptAr);
            p.ExcerptEn = Clean(input.ExcerptEn);
            p.BodyAr = input.BodyAr ?? "";
            p.BodyEn = input.BodyEn ?? "";
            p.CategoryAr = Optional(input.CategoryAr);
            p.CategoryEn = Optional(input.CategoryEn);
            p.Cover = Optional(input.Cover);
            p.IsPublished = input.IsPublished;
            p.PublishedAt = input.PublishedAt?.ToUniversalTime();
        },
        Search = (query, q) => query.Where(p => p.TitleAr.Contains(q) || p.TitleEn.Contains(q)),
        Filters = { ["isPublished"] = (query, value) => query.Where(p => p.IsPublished == (value == "true")) },
        Sort = (query, field, desc) => field == "publishedAt" && !desc
            ? query.OrderBy(p => p.PublishedAt).ThenBy(p => p.Id)
            : query.OrderByDescending(p => p.PublishedAt).ThenByDescending(p => p.Id),
        Images = p => [p.Cover],
        Toggles = { ["isPublished"] = (p, on) => p.IsPublished = on },
    };

    private static readonly AdminResource<JobOpening, JobInput, JobRow> Jobs = new()
    {
        Name = "job-openings",
        Query = db => db.JobOpenings.Include(j => j.Applications),
        Row = (j, _) => new JobRow(
            j.Id, j.TitleAr, j.TitleEn, j.DepartmentAr, j.DepartmentEn, j.LocationAr, j.LocationEn, j.TypeAr, j.TypeEn,
            j.DescriptionAr, j.DescriptionEn, j.IsActive, j.SortOrder, j.Applications.Count),
        Validate = (input, check, _, _) =>
        {
            check.Text("titleAr", input.TitleAr, 150);
            check.Text("titleEn", input.TitleEn, 150);
            check.Text("departmentAr", input.DepartmentAr, 80);
            check.Text("departmentEn", input.DepartmentEn, 80);
            check.Text("locationAr", input.LocationAr, 80);
            check.Text("locationEn", input.LocationEn, 80);
            check.Text("typeAr", input.TypeAr, 60);
            check.Text("typeEn", input.TypeEn, 60);
            check.Text("descriptionAr", input.DescriptionAr, 2000);
            check.Text("descriptionEn", input.DescriptionEn, 2000);
            return Task.CompletedTask;
        },
        Create = () => new JobOpening
        {
            TitleAr = "", TitleEn = "", DepartmentAr = "", DepartmentEn = "", LocationAr = "", LocationEn = "",
            TypeAr = "", TypeEn = "", DescriptionAr = "", DescriptionEn = "",
        },
        Apply = (j, input) =>
        {
            j.TitleAr = Clean(input.TitleAr);
            j.TitleEn = Clean(input.TitleEn);
            j.DepartmentAr = Clean(input.DepartmentAr);
            j.DepartmentEn = Clean(input.DepartmentEn);
            j.LocationAr = Clean(input.LocationAr);
            j.LocationEn = Clean(input.LocationEn);
            j.TypeAr = Clean(input.TypeAr);
            j.TypeEn = Clean(input.TypeEn);
            j.DescriptionAr = Clean(input.DescriptionAr);
            j.DescriptionEn = Clean(input.DescriptionEn);
            j.IsActive = input.IsActive;
        },
        Search = (query, q) => query.Where(j => j.TitleAr.Contains(q) || j.TitleEn.Contains(q)),
        Sort = (query, _, _) => Ordered(query),
        Toggles = { ["isActive"] = (j, on) => j.IsActive = on },
        // Applications keep pointing at their job: switching it off hides it from the site instead.
        Guard = async (j, db) => await db.JobApplications.AnyAsync(a => a.JobOpeningId == j.Id)
            ? "مينفعش تمسح وظيفة عليها طلبات توظيف. اقفل «متاحة للتقديم» بدل المسح: الوظيفة تختفي من الموقع والطلبات تفضل مربوطة بيها."
            : null,
    };

    private static readonly AdminResource<Testimonial, TestimonialInput, TestimonialRow> Testimonials = new()
    {
        Name = "testimonials",
        Query = db => db.Testimonials,
        Row = (t, ctx) => new TestimonialRow(
            t.Id, t.NameAr, t.NameEn, t.RoleAr, t.RoleEn, t.QuoteAr, t.QuoteEn, t.Rating, t.Avatar, ctx.Media.Url(t.Avatar), t.IsPublished, t.SortOrder),
        Validate = (input, check, _, _) =>
        {
            check.Text("nameAr", input.NameAr, 100);
            check.Text("nameEn", input.NameEn, 100);
            check.Text("roleAr", input.RoleAr, 120, required: false);
            check.Text("roleEn", input.RoleEn, 120, required: false);
            check.Text("quoteAr", input.QuoteAr, 600);
            check.Text("quoteEn", input.QuoteEn, 600);
            if (input.Rating is < 1 or > 5)
            {
                check.Fail("rating", "التقييم من 1 لـ 5.");
            }

            return Task.CompletedTask;
        },
        Create = () => new Testimonial { NameAr = "", NameEn = "", QuoteAr = "", QuoteEn = "" },
        Apply = (t, input) =>
        {
            t.NameAr = Clean(input.NameAr);
            t.NameEn = Clean(input.NameEn);
            t.RoleAr = Optional(input.RoleAr);
            t.RoleEn = Optional(input.RoleEn);
            t.QuoteAr = Clean(input.QuoteAr);
            t.QuoteEn = Clean(input.QuoteEn);
            t.Rating = (byte)Math.Clamp(input.Rating, 1, 5);
            t.Avatar = Optional(input.Avatar);
            t.IsPublished = input.IsPublished;
        },
        Search = (query, q) => query.Where(t => t.NameAr.Contains(q) || t.NameEn.Contains(q) || t.QuoteAr.Contains(q) || t.QuoteEn.Contains(q)),
        Filters =
        {
            ["isPublished"] = (query, value) => query.Where(t => t.IsPublished == (value == "true")),
            ["rating"] = (query, value) => byte.TryParse(value, out var rating) ? query.Where(t => t.Rating == rating) : query,
        },
        Sort = (query, _, _) => Ordered(query),
        Images = t => [t.Avatar],
        Toggles = { ["isPublished"] = (t, on) => t.IsPublished = on },
    };

    private static readonly AdminResource<ContactMessage, object, MessageRow> Messages = new()
    {
        Name = "contact-messages",
        Query = db => db.ContactMessages,
        Row = (m, ctx) => new MessageRow(
            m.Id, m.Name, m.Email, m.Phone, m.Service, ctx.ServiceLabel(m.Service), m.Message, m.Locale, m.ReadAt is not null, m.CreatedAt),
        Search = (query, q) => query.Where(m => m.Name.Contains(q) || m.Email.Contains(q) || m.Phone.Contains(q)),
        Filters = { ["read"] = (query, value) => value == "true" ? query.Where(m => m.ReadAt != null) : query.Where(m => m.ReadAt == null) },
        Sort = (query, field, desc) => field == "createdAt" && !desc
            ? query.OrderBy(m => m.CreatedAt).ThenBy(m => m.Id)
            : query.OrderByDescending(m => m.CreatedAt).ThenByDescending(m => m.Id),
        OnShow = m => m.ReadAt ??= DateTime.UtcNow,
    };

    private static readonly AdminResource<JobApplication, object, ApplicationRow> Applications = new()
    {
        Name = "job-applications",
        Query = db => db.JobApplications.Include(a => a.JobOpening),
        Row = (a, _) => new ApplicationRow(
            a.Id, a.JobOpeningId, a.JobOpening?.TitleAr ?? "تقديم عام", a.Name, a.Email, a.Phone, a.ProfileUrl, a.CvPath is not null,
            a.CvOriginalName, a.Message, a.Locale, a.ReadAt is not null, a.CreatedAt),
        Search = (query, q) => query.Where(a => a.Name.Contains(q) || a.Email.Contains(q) || a.Phone.Contains(q)),
        Filters =
        {
            ["read"] = (query, value) => value == "true" ? query.Where(a => a.ReadAt != null) : query.Where(a => a.ReadAt == null),
            ["jobOpeningId"] = (query, value) => int.TryParse(value, out var id) ? query.Where(a => a.JobOpeningId == id) : query,
        },
        Sort = (query, field, desc) => field == "createdAt" && !desc
            ? query.OrderBy(a => a.CreatedAt).ThenBy(a => a.Id)
            : query.OrderByDescending(a => a.CreatedAt).ThenByDescending(a => a.Id),
        OnShow = a => a.ReadAt ??= DateTime.UtcNow,
        OnDelete = (a, ctx) =>
        {
            if (a.CvPath is not null && Media.SafePath(ctx.Media.PrivateRoot, a.CvPath) is { } cv && File.Exists(cv))
            {
                File.Delete(cv);
            }
        },
    };

    private static string StripTags(string? html) =>
        System.Text.RegularExpressions.Regex.Replace(html ?? "", "<[^>]*>", "").Replace("&nbsp;", " ").Trim();
}
