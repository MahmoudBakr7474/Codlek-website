using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using Codlek.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Codlek.Api.Site;

/// <summary>
/// The owner's saved values: one settings row per key, the value as raw JSON.
/// All rows are cached together and the cache is dropped on every save. A key
/// with no row means "use the default" (see SiteData).
/// </summary>
public sealed class SettingsStore(CodlekDbContext db, IMemoryCache cache)
{
    private const string CacheKey = "site-settings";

    public static readonly JsonSerializerOptions Json = new()
    {
        // Arabic stays readable in the database.
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    public async Task<IReadOnlyDictionary<string, string?>> AllAsync(CancellationToken ct = default)
    {
        if (cache.TryGetValue(CacheKey, out IReadOnlyDictionary<string, string?>? values) && values is not null)
        {
            return values;
        }

        values = await db.Settings.AsNoTracking().ToDictionaryAsync(s => s.Key, s => s.Value, ct);
        cache.Set(CacheKey, values);
        return values;
    }

    public async Task PutAsync(IReadOnlyDictionary<string, JsonNode?> values, CancellationToken ct = default)
    {
        var keys = values.Keys.ToList();
        var rows = await db.Settings.Where(s => keys.Contains(s.Key)).ToDictionaryAsync(s => s.Key, ct);

        foreach (var (key, value) in values)
        {
            var json = value?.ToJsonString(Json) ?? "null";
            if (rows.TryGetValue(key, out var row))
            {
                row.Value = json;
            }
            else
            {
                db.Settings.Add(new Setting { Key = key, Value = json });
            }
        }

        await db.SaveChangesAsync(ct);
        Flush();
    }

    public async Task ForgetAsync(IEnumerable<string> keys, CancellationToken ct = default)
    {
        var list = keys.ToList();
        await db.Settings.Where(s => list.Contains(s.Key)).ExecuteDeleteAsync(ct);
        Flush();
    }

    public void Flush() => cache.Remove(CacheKey);
}
