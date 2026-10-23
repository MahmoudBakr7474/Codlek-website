using Codlek.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Admin;

/// <summary>A page of a list in the dashboard.</summary>
public sealed record Page<T>(IReadOnlyList<T> Data, int Total);

public sealed record ReorderInput(int[] Ids);

/// <summary>
/// One table edited in the dashboard: how it is listed (search, filters, sort),
/// shown, validated and saved. Endpoints, under /api/admin/{name}:
/// GET (page, pageSize, sort, order, q, filters) · GET {id} · POST · PUT {id} ·
/// PATCH {id} (on/off switches in the list) · DELETE {id} · POST reorder.
/// </summary>
public sealed class AdminResource<TEntity, TInput, TRow> where TEntity : class, IEntity
{
    public required string Name { get; init; }

    /// <summary>The rows with whatever the list and the form show (includes, counts).</summary>
    public required Func<CodlekDbContext, IQueryable<TEntity>> Query { get; init; }

    public required Func<TEntity, AdminContext, TRow> Row { get; init; }

    /// <summary>Null to create; never null for update.</summary>
    public Func<TInput, AdminValidator, CodlekDbContext, int?, Task>? Validate { get; init; }

    public Func<TEntity>? Create { get; init; }

    public Action<TEntity, TInput>? Apply { get; init; }

    public Func<IQueryable<TEntity>, string, IQueryable<TEntity>>? Search { get; init; }

    public Dictionary<string, Func<IQueryable<TEntity>, string, IQueryable<TEntity>>> Filters { get; init; } = [];

    /// <summary>Sorts by a field name (null field: the default order).</summary>
    public required Func<IQueryable<TEntity>, string?, bool, IQueryable<TEntity>> Sort { get; init; }

    /// <summary>Uploaded files the row owns: replaced or deleted ones are removed from disk.</summary>
    public Func<TEntity, IEnumerable<string?>>? Images { get; init; }

    /// <summary>The on/off fields the list can switch directly (camelCase, as in the row).</summary>
    public Dictionary<string, Action<TEntity, bool>> Toggles { get; init; } = [];

    /// <summary>A reason not to delete (shown to the owner), or null.</summary>
    public Func<TEntity, CodlekDbContext, Task<string?>>? Guard { get; init; }

    public Action<TEntity, AdminContext>? OnDelete { get; init; }

    /// <summary>Opening a row (inbox items are marked read).</summary>
    public Action<TEntity>? OnShow { get; init; }

    public void Map(RouteGroupBuilder admin)
    {
        var group = admin.MapGroup($"/{Name}").WithTags($"Admin: {Name}");

        group.MapGet("/", List);
        group.MapGet("/{id:int}", Show);

        if (Create is not null && Apply is not null)
        {
            group.MapPost("/", Store);
        }

        if (Apply is not null)
        {
            group.MapPut("/{id:int}", Update);
        }

        if (Toggles.Count > 0)
        {
            group.MapPatch("/{id:int}", Toggle);
        }

        group.MapDelete("/{id:int}", Delete);

        if (typeof(ISortable).IsAssignableFrom(typeof(TEntity)))
        {
            group.MapPost("/reorder", Reorder);
        }
    }

    private async Task<Page<TRow>> List(HttpRequest request, CodlekDbContext db, AdminContext context, CancellationToken ct)
    {
        var query = Query(db).AsNoTracking();
        var q = request.Query["q"].ToString().Trim();
        if (q != "" && Search is not null)
        {
            query = Search(query, q);
        }

        foreach (var (name, filter) in Filters)
        {
            if (request.Query[name].ToString() is { Length: > 0 } value)
            {
                query = filter(query, value);
            }
        }

        var total = await query.CountAsync(ct);
        var sort = request.Query["sort"].ToString();
        query = Sort(query, sort == "" ? null : sort, request.Query["order"] == "desc");

        var pageSize = int.TryParse(request.Query["pageSize"], out var size) ? Math.Clamp(size, 1, 200) : 20;
        var page = int.TryParse(request.Query["page"], out var number) ? Math.Max(1, number) : 1;
        var rows = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);

        return new Page<TRow>(rows.Select(row => Row(row, context)).ToList(), total);
    }

    private async Task<IResult> Show(int id, CodlekDbContext db, AdminContext context, CancellationToken ct)
    {
        var entity = await Query(db).FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null)
        {
            return Results.NotFound();
        }

        if (OnShow is not null)
        {
            OnShow(entity);
            await db.SaveChangesAsync(ct);
        }

        return Results.Ok(Row(entity, context));
    }

    private async Task<IResult> Store(TInput input, CodlekDbContext db, AdminContext context, CancellationToken ct)
    {
        var check = new AdminValidator();
        if (Validate is not null)
        {
            await Validate(input, check, db, null);
        }

        if (!check.IsValid)
        {
            return check.Problem();
        }

        var entity = Create!();
        Apply!(entity, input);
        if (entity is ISortable sortable)
        {
            // New rows go last.
            sortable.SortOrder = await db.Set<TEntity>().CountAsync(ct) + 1;
        }

        db.Set<TEntity>().Add(entity);
        await db.SaveChangesAsync(ct);

        var saved = await Query(db).AsNoTracking().FirstAsync(e => e.Id == entity.Id, ct);
        return Results.Created($"/api/admin/{Name}/{entity.Id}", Row(saved, context));
    }

    private async Task<IResult> Update(int id, TInput input, CodlekDbContext db, AdminContext context, CancellationToken ct)
    {
        var entity = await db.Set<TEntity>().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null)
        {
            return Results.NotFound();
        }

        var check = new AdminValidator();
        if (Validate is not null)
        {
            await Validate(input, check, db, id);
        }

        if (!check.IsValid)
        {
            return check.Problem();
        }

        var before = Images?.Invoke(entity).ToList() ?? [];
        Apply!(entity, input);
        await db.SaveChangesAsync(ct);

        // A picture that was replaced or removed leaves the disk with it.
        var after = Images?.Invoke(entity).ToHashSet() ?? [];
        foreach (var path in before.Where(path => !after.Contains(path)))
        {
            context.Images.Delete(path);
        }

        var saved = await Query(db).AsNoTracking().FirstAsync(e => e.Id == id, ct);
        return Results.Ok(Row(saved, context));
    }

    private async Task<IResult> Toggle(int id, Dictionary<string, bool> changes, CodlekDbContext db, AdminContext context, CancellationToken ct)
    {
        var entity = await db.Set<TEntity>().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null)
        {
            return Results.NotFound();
        }

        foreach (var (field, value) in changes)
        {
            if (!Toggles.TryGetValue(field, out var set))
            {
                return Results.BadRequest(new { message = $"{field} can't be switched here" });
            }

            set(entity, value);
        }

        await db.SaveChangesAsync(ct);
        var saved = await Query(db).AsNoTracking().FirstAsync(e => e.Id == id, ct);
        return Results.Ok(Row(saved, context));
    }

    private async Task<IResult> Delete(int id, CodlekDbContext db, AdminContext context, CancellationToken ct)
    {
        var entity = await db.Set<TEntity>().FirstOrDefaultAsync(e => e.Id == id, ct);
        if (entity is null)
        {
            return Results.NotFound();
        }

        if (Guard is not null && await Guard(entity, db) is { } reason)
        {
            return Results.Json(new { message = reason }, statusCode: StatusCodes.Status409Conflict);
        }

        var images = Images?.Invoke(entity).ToList() ?? [];
        db.Set<TEntity>().Remove(entity);
        await db.SaveChangesAsync(ct);

        images.ForEach(context.Images.Delete);
        OnDelete?.Invoke(entity, context);
        return Results.NoContent();
    }

    /// <summary>The owner dragged the rows into a new order: their positions become sort_order.</summary>
    private async Task<IResult> Reorder(ReorderInput input, CodlekDbContext db, CancellationToken ct)
    {
        var rows = await db.Set<TEntity>().Where(e => input.Ids.Contains(e.Id)).ToListAsync(ct);
        for (var i = 0; i < input.Ids.Length; i++)
        {
            if (rows.FirstOrDefault(r => r.Id == input.Ids[i]) is ISortable row)
            {
                row.SortOrder = i + 1;
            }
        }

        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
}

/// <summary>What row mappers and hooks need besides the database (one per request).</summary>
public sealed class AdminContext(Site.Media media, ImageStore images, CodlekDbContext db)
{
    private Dictionary<string, string>? serviceLabels;

    public Site.Media Media { get; } = media;
    public ImageStore Images { get; } = images;

    /// <summary>A message's service in Arabic, also for services hidden since; "أخرى" for other.</summary>
    public string ServiceLabel(string key)
    {
        if (serviceLabels is null)
        {
            serviceLabels = db.Services.AsNoTracking().ToDictionary(s => s.Key, s => string.IsNullOrWhiteSpace(s.TitleAr) ? s.TitleEn : s.TitleAr);
            serviceLabels["other"] = "أخرى";
        }

        return serviceLabels.GetValueOrDefault(key, key);
    }
}
