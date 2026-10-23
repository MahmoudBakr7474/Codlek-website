using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using Codlek.Api.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

// The only SQL built from strings uses table names from the fixed list below.
#pragma warning disable EF1002

/*
 * One-off move of the Laravel site's data into SQL Server, keeping every id.
 *
 *   dotnet run --project tools/Codlek.Import -- --sqlite <copy of database.sqlite>
 *       [--connection "<SQL Server connection string>"]
 *       [--uploads <laravel public/uploads> --uploads-to <api wwwroot/uploads>]
 *       [--force]
 *
 * The SQLite file is opened read-only (still: point it at a copy). The target
 * must be empty unless --force, which deletes its rows first. Laravel stored
 * times in Africa/Cairo; they are written in UTC.
 */

var options = ParseArgs(args);

if (!options.TryGetValue("sqlite", out var sqlitePath) || !File.Exists(sqlitePath))
{
    Console.Error.WriteLine("--sqlite <path to a copy of database.sqlite> is required");
    return 1;
}

var connectionString = options.GetValueOrDefault("connection")
    ?? @"Server=(localdb)\MSSQLLocalDB;Database=Codlek;Trusted_Connection=True;TrustServerCertificate=True";

var cairo = TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo");
var json = new JsonSerializerOptions { Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping };

await using var source = new SqliteConnection($"Data Source={sqlitePath};Mode=ReadOnly");
await source.OpenAsync();

await using var db = new CodlekDbContext(new DbContextOptionsBuilder<CodlekDbContext>()
    .UseSqlServer(connectionString)
    .UseSnakeCaseNamingConvention()
    .Options);

await db.Database.MigrateAsync();

// Children before parents when deleting, parents first when inserting.
string[] tables =
[
    "settings", "testimonials", "services", "contact_messages", "job_applications",
    "job_openings", "posts", "projects", "project_categories", "users",
];

var existing = await db.Users.CountAsync() + await db.Projects.CountAsync() + await db.Settings.CountAsync();
if (existing > 0 && !options.ContainsKey("force"))
{
    Console.Error.WriteLine("The target database already has data. Run again with --force to replace it.");
    return 1;
}

await db.Database.OpenConnectionAsync();
await using (var transaction = await db.Database.BeginTransactionAsync())
{
    foreach (var table in tables)
    {
        await db.Database.ExecuteSqlRawAsync($"DELETE FROM [{table}]");
    }

    await Copy("users", row => new User
    {
        Id = row.Int("id"),
        Name = row.Text("name"),
        Email = row.Text("email"),
        Password = row.Text("password"),
        IsAdmin = row.Bool("is_admin"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("project_categories", row => new ProjectCategory
    {
        Id = row.Int("id"),
        Slug = row.Text("slug"),
        NameAr = row.Text("name_ar"),
        NameEn = row.Text("name_en"),
        Icon = row.Text("icon"),
        SortOrder = row.Int("sort_order"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("projects", row => new Project
    {
        Id = row.Int("id"),
        ProjectCategoryId = row.IntOrNull("project_category_id"),
        TitleAr = row.Text("title_ar"),
        TitleEn = row.Text("title_en"),
        DescriptionAr = row.Text("description_ar"),
        DescriptionEn = row.Text("description_en"),
        Image = row.TextOrNull("image"),
        Url = row.TextOrNull("url"),
        IsFeatured = row.Bool("is_featured"),
        IsComingSoon = row.Bool("is_coming_soon"),
        IsPublished = row.Bool("is_published"),
        SortOrder = row.Int("sort_order"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("posts", row => new Post
    {
        Id = row.Int("id"),
        Slug = row.Text("slug"),
        TitleAr = row.Text("title_ar"),
        TitleEn = row.Text("title_en"),
        ExcerptAr = row.Text("excerpt_ar"),
        ExcerptEn = row.Text("excerpt_en"),
        BodyAr = row.Text("body_ar"),
        BodyEn = row.Text("body_en"),
        CategoryAr = row.TextOrNull("category_ar"),
        CategoryEn = row.TextOrNull("category_en"),
        Cover = row.TextOrNull("cover"),
        IsPublished = row.Bool("is_published"),
        PublishedAt = row.Time("published_at"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("job_openings", row => new JobOpening
    {
        Id = row.Int("id"),
        TitleAr = row.Text("title_ar"),
        TitleEn = row.Text("title_en"),
        DepartmentAr = row.Text("department_ar"),
        DepartmentEn = row.Text("department_en"),
        LocationAr = row.Text("location_ar"),
        LocationEn = row.Text("location_en"),
        TypeAr = row.Text("type_ar"),
        TypeEn = row.Text("type_en"),
        DescriptionAr = row.Text("description_ar"),
        DescriptionEn = row.Text("description_en"),
        IsActive = row.Bool("is_active"),
        SortOrder = row.Int("sort_order"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("job_applications", row => new JobApplication
    {
        Id = row.Int("id"),
        JobOpeningId = row.IntOrNull("job_opening_id"),
        Name = row.Text("name"),
        Email = row.Text("email"),
        Phone = row.Text("phone"),
        ProfileUrl = row.TextOrNull("profile_url"),
        CvPath = row.TextOrNull("cv_path"),
        CvOriginalName = row.TextOrNull("cv_original_name"),
        Message = row.TextOrNull("message"),
        Locale = row.Text("locale"),
        IpAddress = row.TextOrNull("ip_address"),
        ReadAt = row.Time("read_at"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("contact_messages", row => new ContactMessage
    {
        Id = row.Int("id"),
        Name = row.Text("name"),
        Email = row.Text("email"),
        Phone = row.Text("phone"),
        Service = row.Text("service"),
        Message = row.Text("message"),
        Locale = row.Text("locale"),
        IpAddress = row.TextOrNull("ip_address"),
        ReadAt = row.Time("read_at"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("services", row => new Service
    {
        Id = row.Int("id"),
        Key = row.Text("key"),
        Icon = row.Text("icon"),
        Tone = row.Text("tone"),
        Image = row.TextOrNull("image"),
        TitleAr = row.Text("title_ar"),
        TitleEn = row.Text("title_en"),
        SummaryAr = row.Text("summary_ar"),
        SummaryEn = row.Text("summary_en"),
        DescriptionAr = row.Text("description_ar"),
        DescriptionEn = row.Text("description_en"),
        Features = JsonSerializer.Deserialize<List<LocalizedText>>(
            row.TextOrNull("features") ?? "[]",
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [],
        IsPopular = row.Bool("is_popular"),
        IsPublished = row.Bool("is_published"),
        SortOrder = row.Int("sort_order"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("testimonials", row => new Testimonial
    {
        Id = row.Int("id"),
        NameAr = row.Text("name_ar"),
        NameEn = row.Text("name_en"),
        RoleAr = row.TextOrNull("role_ar"),
        RoleEn = row.TextOrNull("role_en"),
        QuoteAr = row.Text("quote_ar"),
        QuoteEn = row.Text("quote_en"),
        Rating = (byte)row.Int("rating"),
        Avatar = row.TextOrNull("avatar"),
        IsPublished = row.Bool("is_published"),
        SortOrder = row.Int("sort_order"),
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await Copy("settings", row => new Setting
    {
        Id = row.Int("id"),
        Key = row.Text("key"),
        // Same JSON, re-written without \u escapes so it reads as Arabic in the database.
        Value = row.TextOrNull("value") is { } value ? JsonNode.Parse(value)?.ToJsonString(json) ?? "null" : null,
        CreatedAt = row.Time("created_at"),
        UpdatedAt = row.Time("updated_at"),
    });

    await transaction.CommitAsync();
}

if (options.TryGetValue("uploads", out var uploadsFrom))
{
    var uploadsTo = options.GetValueOrDefault("uploads-to")
        ?? throw new ArgumentException("--uploads needs --uploads-to");
    var copied = CopyDirectory(uploadsFrom, uploadsTo);
    Console.WriteLine($"uploads: {copied} files -> {Path.GetFullPath(uploadsTo)}");
}

return 0;

async Task Copy<T>(string table, Func<Row, T> map) where T : class
{
    var rows = new List<T>();
    await using (var command = source.CreateCommand())
    {
        command.CommandText = $"SELECT * FROM \"{table}\" ORDER BY id";
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            rows.Add(map(new Row(reader, cairo)));
        }
    }

    db.Set<T>().AddRange(rows);
    await db.Database.ExecuteSqlRawAsync($"SET IDENTITY_INSERT [{table}] ON");
    await db.SaveChangesAsync();
    await db.Database.ExecuteSqlRawAsync($"SET IDENTITY_INSERT [{table}] OFF");
    db.ChangeTracker.Clear();

    var count = await db.Set<T>().CountAsync();
    var status = count == rows.Count ? "ok" : "MISMATCH";
    Console.WriteLine($"{table}: {rows.Count} read, {count} in SQL Server  {status}");
    if (count != rows.Count)
    {
        throw new InvalidOperationException($"{table}: row counts differ");
    }
}

static int CopyDirectory(string from, string to)
{
    var count = 0;
    foreach (var file in Directory.EnumerateFiles(from, "*", SearchOption.AllDirectories))
    {
        var target = Path.Combine(to, Path.GetRelativePath(from, file));
        Directory.CreateDirectory(Path.GetDirectoryName(target)!);
        File.Copy(file, target, overwrite: true);
        count++;
    }

    return count;
}

static Dictionary<string, string> ParseArgs(string[] args)
{
    var options = new Dictionary<string, string>();
    for (var i = 0; i < args.Length; i++)
    {
        if (!args[i].StartsWith("--"))
        {
            continue;
        }

        var name = args[i][2..];
        var hasValue = i + 1 < args.Length && !args[i + 1].StartsWith("--");
        options[name] = hasValue ? args[++i] : "true";
    }

    return options;
}

/// <summary>A SQLite row read by column name.</summary>
sealed class Row(SqliteDataReader reader, TimeZoneInfo cairo)
{
    private object? Value(string column)
    {
        var value = reader.GetValue(reader.GetOrdinal(column));
        return value is DBNull ? null : value;
    }

    public string Text(string column) =>
        TextOrNull(column) ?? throw new InvalidOperationException($"{column} is null");

    public string? TextOrNull(string column) => Value(column)?.ToString();

    public int Int(string column) => IntOrNull(column) ?? 0;

    public int? IntOrNull(string column) => Value(column) is { } v ? Convert.ToInt32(v) : null;

    public bool Bool(string column) => Int(column) != 0;

    /// <summary>"Y-m-d H:i:s" in Cairo time, as UTC.</summary>
    public DateTime? Time(string column) => TextOrNull(column) is { } text
        ? TimeZoneInfo.ConvertTimeToUtc(DateTime.Parse(text, System.Globalization.CultureInfo.InvariantCulture), cairo)
        : null;
}
