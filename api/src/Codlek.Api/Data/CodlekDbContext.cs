using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Codlek.Api.Data;

public class CodlekDbContext(DbContextOptions<CodlekDbContext> options) : DbContext(options)
{
    public DbSet<ProjectCategory> ProjectCategories => Set<ProjectCategory>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<JobOpening> JobOpenings => Set<JobOpening>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<Setting> Settings => Set<Setting>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<ProjectCategory>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
        });

        model.Entity<Project>(e =>
        {
            e.HasOne(x => x.ProjectCategory).WithMany(x => x.Projects).OnDelete(DeleteBehavior.SetNull);
            Text(e.Property(x => x.DescriptionAr));
            Text(e.Property(x => x.DescriptionEn));
            e.HasIndex(x => new { x.IsPublished, x.SortOrder });
        });

        model.Entity<Post>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            Text(e.Property(x => x.ExcerptAr));
            Text(e.Property(x => x.ExcerptEn));
            Text(e.Property(x => x.BodyAr));
            Text(e.Property(x => x.BodyEn));
            e.HasIndex(x => new { x.IsPublished, x.PublishedAt });
        });

        model.Entity<JobOpening>(e =>
        {
            Text(e.Property(x => x.DescriptionAr));
            Text(e.Property(x => x.DescriptionEn));
        });

        model.Entity<JobApplication>(e =>
        {
            e.HasOne(x => x.JobOpening).WithMany(x => x.Applications).OnDelete(DeleteBehavior.SetNull);
            e.Property(x => x.Phone).HasMaxLength(32);
            e.Property(x => x.Locale).HasMaxLength(2);
            e.Property(x => x.IpAddress).HasMaxLength(45);
            Text(e.Property(x => x.Message));
        });

        model.Entity<ContactMessage>(e =>
        {
            e.Property(x => x.Phone).HasMaxLength(32);
            e.Property(x => x.Service).HasMaxLength(40);
            e.Property(x => x.Locale).HasMaxLength(2);
            e.Property(x => x.IpAddress).HasMaxLength(45);
            Text(e.Property(x => x.Message));
        });

        model.Entity<Service>(e =>
        {
            e.HasIndex(x => x.Key).IsUnique();
            e.Property(x => x.Key).HasMaxLength(60);
            e.Property(x => x.Icon).HasMaxLength(60);
            e.Property(x => x.Tone).HasMaxLength(12);
            Text(e.Property(x => x.SummaryAr));
            Text(e.Property(x => x.SummaryEn));
            Text(e.Property(x => x.DescriptionAr));
            Text(e.Property(x => x.DescriptionEn));
            e.OwnsMany(x => x.Features, f =>
            {
                f.ToJson("features");
                f.Property(x => x.Ar).HasJsonPropertyName("ar");
                f.Property(x => x.En).HasJsonPropertyName("en");
            });
        });

        model.Entity<Testimonial>(e =>
        {
            Text(e.Property(x => x.QuoteAr));
            Text(e.Property(x => x.QuoteEn));
        });

        model.Entity<Setting>(e =>
        {
            e.HasIndex(x => x.Key).IsUnique();
            Text(e.Property(x => x.Value));
        });

        model.Entity<User>(e =>
        {
            e.HasIndex(x => x.Email).IsUnique();
        });

        // Every other string is a Laravel string() column: nvarchar(255).
        var strings = model.Model.GetEntityTypes()
            .Where(type => !type.IsMappedToJson())
            .SelectMany(type => type.GetProperties())
            .Where(p => p.ClrType == typeof(string) && p.GetMaxLength() is null && p.GetColumnType() is null);

        foreach (var property in strings)
        {
            property.SetMaxLength(255);
        }
    }

    /// <summary>
    /// Times are stored in UTC. Read back they say so (Kind = Utc), so the JSON
    /// carries the "Z" and browsers show them in their own time zone; a local
    /// time written in is converted first.
    /// </summary>
    protected override void ConfigureConventions(ModelConfigurationBuilder configuration)
    {
        configuration.Properties<DateTime>().HaveConversion<UtcDateTimeConverter>();
        configuration.Properties<DateTime?>().HaveConversion<UtcDateTimeConverter>();
    }

    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        Stamp();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        Stamp();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    /// <summary>
    /// Laravel-style timestamps. Rows added with their own times (the import)
    /// keep them.
    /// </summary>
    private void Stamp()
    {
        var now = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<IHasTimestamps>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt ??= now;
                entry.Entity.UpdatedAt ??= now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }
    }

    private static void Text<T>(Microsoft.EntityFrameworkCore.Metadata.Builders.PropertyBuilder<T> property) =>
        property.HasColumnType("nvarchar(max)");
}

/// <summary>UTC in the database, Kind = Utc in the app (see <see cref="CodlekDbContext.ConfigureConventions"/>).</summary>
public sealed class UtcDateTimeConverter() : ValueConverter<DateTime, DateTime>(
    value => value.Kind == DateTimeKind.Local ? value.ToUniversalTime() : value,
    value => DateTime.SpecifyKind(value, DateTimeKind.Utc));
