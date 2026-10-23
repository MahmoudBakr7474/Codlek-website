using Codlek.Api.Data;

namespace Codlek.Api.Tests;

/// <summary>A small site: what the tests look for is named after its role.</summary>
public static class TestData
{
    public const string NotifyEmail = "owner@codlek.test";

    public static async Task SeedAsync(CodlekDbContext db)
    {
        var shops = new ProjectCategory { Slug = "ecommerce", NameAr = "متاجر", NameEn = "Stores", Icon = "shopping-cart", SortOrder = 1 };
        var empty = new ProjectCategory { Slug = "empty", NameAr = "فارغ", NameEn = "Empty", SortOrder = 2 };
        var hiddenOnly = new ProjectCategory { Slug = "hidden-only", NameAr = "مخفي", NameEn = "Hidden only", SortOrder = 3 };
        db.ProjectCategories.AddRange(shops, empty, hiddenOnly);

        db.Projects.AddRange(
            Project("Featured shop", shops, featured: true, image: "projects/shop.webp", url: "https://www.shop.example/", sort: 1),
            Project("Second shop", shops, featured: true, image: "projects/second.webp", url: "https://second.example", sort: 2),
            Project("Coming soon", shops, comingSoon: true, image: "projects/soon.webp", url: "https://soon.example", sort: 3),
            Project("Hidden project", hiddenOnly, published: false, sort: 4),
            Project("No category", null, sort: 5));

        var now = DateTime.UtcNow;
        db.Posts.AddRange(
            Post("published-post", "Published post", now.AddDays(-2)),
            Post("older-post", "Older post", now.AddDays(-10)),
            Post("scheduled-post", "Scheduled post", now.AddDays(5)),
            Post("draft-post", "Draft post", now.AddDays(-1), published: false));

        db.JobOpenings.AddRange(
            Job("Active job", active: true, sort: 1),
            Job("Closed job", active: false, sort: 2));

        db.Services.AddRange(
            Service("web", "تطوير المواقع", "Web Development", popular: true, sort: 1),
            Service("hidden", "خدمة مخفية", "Hidden service", published: false, sort: 2));

        db.Testimonials.Add(new Testimonial
        {
            NameAr = "أحمد", NameEn = "Ahmed", QuoteAr = "شغل ممتاز", QuoteEn = "Great work", Rating = 9, SortOrder = 1,
        });

        db.Settings.Add(new Setting { Key = "mail.notify_emails", Value = $"[\"{NotifyEmail}\"]" });

        await db.SaveChangesAsync();
    }

    private static Project Project(string title, ProjectCategory? category, bool featured = false, bool comingSoon = false,
        bool published = true, string? image = null, string? url = null, int sort = 0) => new()
    {
        ProjectCategory = category,
        TitleAr = title + " (ar)",
        TitleEn = title,
        DescriptionAr = "",
        DescriptionEn = title + " description",
        Image = image,
        Url = url,
        IsFeatured = featured,
        IsComingSoon = comingSoon,
        IsPublished = published,
        SortOrder = sort,
    };

    private static Post Post(string slug, string title, DateTime publishedAt, bool published = true) => new()
    {
        Slug = slug,
        TitleAr = title + " (ar)",
        TitleEn = title,
        ExcerptAr = "مقتطف",
        ExcerptEn = "Excerpt",
        BodyAr = "<p>نص</p>",
        BodyEn = "<p>Body text <img src=\"/a.png\"></p><script>alert(1)</script>",
        IsPublished = published,
        PublishedAt = publishedAt,
    };

    private static JobOpening Job(string title, bool active, int sort) => new()
    {
        TitleAr = title + " (ar)",
        TitleEn = title,
        DepartmentAr = "التطوير", DepartmentEn = "Development",
        LocationAr = "القاهرة", LocationEn = "Cairo",
        TypeAr = "دوام كامل", TypeEn = "Full-time",
        DescriptionAr = "وصف", DescriptionEn = "Description",
        IsActive = active,
        SortOrder = sort,
    };

    private static Service Service(string key, string titleAr, string titleEn, bool popular = false, bool published = true, int sort = 0) => new()
    {
        Key = key,
        Icon = "globe",
        Tone = "not-a-tone",
        TitleAr = titleAr,
        TitleEn = titleEn,
        SummaryAr = "ملخص", SummaryEn = "Summary",
        DescriptionAr = "وصف", DescriptionEn = "Description",
        Features = [new LocalizedText { Ar = "ميزة", En = "Feature" }, new LocalizedText()],
        IsPopular = popular,
        IsPublished = published,
        SortOrder = sort,
    };
}
