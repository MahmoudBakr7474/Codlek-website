namespace Codlek.Api.Data;

/*
 * The same tables and columns as the Laravel site (snake_case in the database,
 * see CodlekDbContext), so its data moves over 1:1 with the same ids: settings
 * such as home.hero_main_project point at project ids. Bilingual columns come in
 * *Ar / *En pairs. Timestamps are stored in UTC.
 */

public interface IHasTimestamps
{
    DateTime? CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
}

public class ProjectCategory : IHasTimestamps
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public required string NameAr { get; set; }
    public required string NameEn { get; set; }
    public string Icon { get; set; } = "layout-grid";
    public int SortOrder { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<Project> Projects { get; set; } = [];
}

public class Project : IHasTimestamps
{
    public int Id { get; set; }
    public int? ProjectCategoryId { get; set; }
    public ProjectCategory? ProjectCategory { get; set; }
    public required string TitleAr { get; set; }
    public required string TitleEn { get; set; }
    public required string DescriptionAr { get; set; }
    public required string DescriptionEn { get; set; }
    public string? Image { get; set; }
    public string? Url { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsComingSoon { get; set; }
    public bool IsPublished { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class Post : IHasTimestamps
{
    public int Id { get; set; }
    public required string Slug { get; set; }
    public required string TitleAr { get; set; }
    public required string TitleEn { get; set; }
    public required string ExcerptAr { get; set; }
    public required string ExcerptEn { get; set; }
    public required string BodyAr { get; set; }
    public required string BodyEn { get; set; }
    public string? CategoryAr { get; set; }
    public string? CategoryEn { get; set; }
    public string? Cover { get; set; }
    public bool IsPublished { get; set; } = true;
    public DateTime? PublishedAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class JobOpening : IHasTimestamps
{
    public int Id { get; set; }
    public required string TitleAr { get; set; }
    public required string TitleEn { get; set; }
    public required string DepartmentAr { get; set; }
    public required string DepartmentEn { get; set; }
    public required string LocationAr { get; set; }
    public required string LocationEn { get; set; }
    public required string TypeAr { get; set; }
    public required string TypeEn { get; set; }
    public required string DescriptionAr { get; set; }
    public required string DescriptionEn { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<JobApplication> Applications { get; set; } = [];
}

public class JobApplication : IHasTimestamps
{
    public int Id { get; set; }
    public int? JobOpeningId { get; set; }
    public JobOpening? JobOpening { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public string? ProfileUrl { get; set; }
    public string? CvPath { get; set; }
    public string? CvOriginalName { get; set; }
    public string? Message { get; set; }
    public string Locale { get; set; } = "ar";
    public string? IpAddress { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class ContactMessage : IHasTimestamps
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Phone { get; set; }
    public required string Service { get; set; }
    public required string Message { get; set; }
    public string Locale { get; set; } = "ar";
    public string? IpAddress { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class Service : IHasTimestamps
{
    public int Id { get; set; }

    /// <summary>Anchor on /services and the contact form's value.</summary>
    public required string Key { get; set; }

    public string Icon { get; set; } = "layout-grid";

    /// <summary>Colour of the icon tile: blue, teal, magenta or amber.</summary>
    public string Tone { get; set; } = "blue";

    public string? Image { get; set; }
    public required string TitleAr { get; set; }
    public required string TitleEn { get; set; }
    public required string SummaryAr { get; set; }
    public required string SummaryEn { get; set; }
    public required string DescriptionAr { get; set; }
    public required string DescriptionEn { get; set; }
    public List<LocalizedText> Features { get; set; } = [];
    public bool IsPopular { get; set; }
    public bool IsPublished { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>An {"ar": .., "en": ..} pair inside a JSON column.</summary>
public class LocalizedText
{
    public string Ar { get; set; } = "";
    public string En { get; set; } = "";
}

public class Testimonial : IHasTimestamps
{
    public int Id { get; set; }
    public required string NameAr { get; set; }
    public required string NameEn { get; set; }
    public string? RoleAr { get; set; }
    public string? RoleEn { get; set; }
    public required string QuoteAr { get; set; }
    public required string QuoteEn { get; set; }
    public byte Rating { get; set; } = 5;
    public string? Avatar { get; set; }
    public bool IsPublished { get; set; } = true;
    public int SortOrder { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>One settings key with its JSON value (raw JSON text).</summary>
public class Setting : IHasTimestamps
{
    public int Id { get; set; }
    public required string Key { get; set; }
    public string? Value { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class User : IHasTimestamps
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }

    /// <summary>bcrypt hash (the Laravel "$2y$" hashes verify as they are).</summary>
    public required string Password { get; set; }

    public bool IsAdmin { get; set; }
    public DateTime? CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
