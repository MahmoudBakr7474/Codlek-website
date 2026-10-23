namespace Codlek.Api.Site;

/// <summary>
/// Uploaded files: public ones under wwwroot/uploads (served as /uploads/...),
/// CVs in a private folder outside wwwroot. Paths in the database are relative
/// ("projects/degla-tours.webp"), as in the Laravel site.
/// </summary>
public sealed class Media(IWebHostEnvironment env, IConfiguration config, IHttpContextAccessor http)
{
    /// <summary>wwwroot/uploads (Codlek:UploadsRoot moves it, e.g. for the tests).</summary>
    public string UploadsRoot => config["Codlek:UploadsRoot"] is { Length: > 0 } root
        ? Path.GetFullPath(root, env.ContentRootPath)
        : Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");

    public string PrivateRoot => config["Codlek:PrivateStorage"] is { Length: > 0 } path
        ? Path.GetFullPath(path, env.ContentRootPath)
        : Path.Combine(env.ContentRootPath, "storage");

    /// <summary>Absolute public URL of an upload (or an http(s) URL kept as it is); null when empty.</summary>
    public string? Url(string? path)
    {
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        if (path.StartsWith("http://", StringComparison.OrdinalIgnoreCase) || path.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            return path;
        }

        return $"{PublicBase()}/uploads/{path.TrimStart('/')}";
    }

    public bool Exists(string? path) =>
        !string.IsNullOrWhiteSpace(path) && SafePath(UploadsRoot, path) is { } full && File.Exists(full);

    /// <summary>Full path of a relative path inside root, or null when it would leave root.</summary>
    public static string? SafePath(string root, string relative)
    {
        var rootFull = Path.GetFullPath(root);
        var full = Path.GetFullPath(Path.Combine(rootFull, relative));
        return full.StartsWith(rootFull + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) ? full : null;
    }

    /// <summary>Where browsers reach this API: Codlek:PublicUrl, else the request's own host.</summary>
    private string PublicBase()
    {
        if (config["Codlek:PublicUrl"] is { Length: > 0 } configured)
        {
            return configured.TrimEnd('/');
        }

        var request = http.HttpContext?.Request;
        return request is null ? "" : $"{request.Scheme}://{request.Host}";
    }
}
