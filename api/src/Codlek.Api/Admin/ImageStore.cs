using Codlek.Api.Site;
using SkiaSharp;

namespace Codlek.Api.Admin;

/// <summary>How an upload is sized, per place it is used (the Laravel WebImage presets).</summary>
public sealed record ImagePreset(string Folder, int MaxWidth, double? MaxRatio = null, int? MaxHeight = null)
{
    public static readonly IReadOnlyDictionary<string, ImagePreset> All = new Dictionary<string, ImagePreset>
    {
        // Cards and the home hero show the top of the screenshot at 16:10.
        ["projects"] = new("projects", 1600, MaxRatio: 0.75),
        ["services"] = new("services", 1600, MaxHeight: 1200),
        ["posts"] = new("posts", 1600, MaxHeight: 1600),
        ["post-attachments"] = new("posts/attachments", 1600, MaxHeight: 1600),
        ["testimonials"] = new("testimonials", 256, MaxHeight: 256),
        ["hero"] = new("hero", 1200),
        ["seo"] = new("seo", 1200, MaxRatio: 0.525),
    };
}

/// <summary>
/// Stores an image uploaded in the admin as a web-sized WebP under uploads/, so a
/// 4 MB PNG or a full-page screenshot never reaches the public pages as is.
/// Re-encoding also drops EXIF metadata (GPS, camera) from phone photos, after
/// the EXIF orientation has been applied.
/// </summary>
public sealed class ImageStore(Media media)
{
    public const int MaxUploadBytes = 8 * 1024 * 1024;

    public static readonly string[] Accepted = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    /// <returns>The stored path ("projects/01J….webp"), or null when the file is not an image Skia can read.</returns>
    public async Task<string?> SaveAsync(IFormFile file, ImagePreset preset, CancellationToken ct = default)
    {
        await using var input = file.OpenReadStream();
        using var memory = new MemoryStream();
        await input.CopyToAsync(memory, ct);
        memory.Position = 0;

        using var codec = SKCodec.Create(memory);
        if (codec is null)
        {
            return null;
        }

        using var decoded = SKBitmap.Decode(codec);
        if (decoded is null)
        {
            return null;
        }

        using var upright = Orient(decoded, codec.EncodedOrigin);
        var (width, height) = (upright.Width, upright.Height);

        // Scale to the width (and height, if capped), never up.
        var scale = Math.Min(1.0, Math.Min((double)preset.MaxWidth / width, preset.MaxHeight is { } maxHeight ? (double)maxHeight / height : 1.0));
        var newWidth = Math.Max(1, (int)Math.Round(width * scale));
        var newHeight = Math.Max(1, (int)Math.Round(height * scale));

        // Crop very tall captures, keeping the top of the page.
        var cropHeight = preset.MaxRatio is { } ratio ? Math.Min(newHeight, (int)Math.Round(newWidth * ratio)) : newHeight;

        using var surface = SKSurface.Create(new SKImageInfo(newWidth, cropHeight, SKColorType.Rgba8888, SKAlphaType.Premul));
        surface.Canvas.Clear(SKColors.Transparent);
        using (var image = SKImage.FromBitmap(upright))
        {
            var source = new SKRect(0, 0, width, (float)(cropHeight / scale));
            surface.Canvas.DrawImage(image, source, new SKRect(0, 0, newWidth, cropHeight), new SKSamplingOptions(SKCubicResampler.Mitchell));
        }

        using var snapshot = surface.Snapshot();
        using var webp = snapshot.Encode(SKEncodedImageFormat.Webp, 82);

        var path = $"{preset.Folder}/{Ulid()}.webp";
        var full = Media.SafePath(media.UploadsRoot, path)!;
        Directory.CreateDirectory(Path.GetDirectoryName(full)!);
        await using var output = File.Create(full);
        webp.SaveTo(output);

        return path;
    }

    /// <summary>Deletes an uploaded file (a path the admin replaced or removed). Bundled images are left alone.</summary>
    public void Delete(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) || path.StartsWith("http", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (Media.SafePath(media.UploadsRoot, path) is { } full && File.Exists(full))
        {
            File.Delete(full);
        }
    }

    private static SKBitmap Orient(SKBitmap bitmap, SKEncodedOrigin origin)
    {
        var (rotate, swap) = origin switch
        {
            SKEncodedOrigin.BottomRight => (180, false),
            SKEncodedOrigin.RightTop => (90, true),
            SKEncodedOrigin.LeftBottom => (270, true),
            _ => (0, false),
        };

        if (rotate == 0)
        {
            return bitmap.Copy();
        }

        var result = new SKBitmap(swap ? bitmap.Height : bitmap.Width, swap ? bitmap.Width : bitmap.Height);
        using var canvas = new SKCanvas(result);
        canvas.Translate(result.Width / 2f, result.Height / 2f);
        canvas.RotateDegrees(rotate);
        canvas.Translate(-bitmap.Width / 2f, -bitmap.Height / 2f);
        using var image = SKImage.FromBitmap(bitmap);
        canvas.DrawImage(image, 0, 0, SKSamplingOptions.Default);
        return result;
    }

    /// <summary>A time-ordered unique name, like Laravel's Str::ulid().</summary>
    private static string Ulid() => $"{DateTime.UtcNow:yyyyMMddHHmmssfff}{Guid.NewGuid():N}"[..32].ToLowerInvariant();
}
