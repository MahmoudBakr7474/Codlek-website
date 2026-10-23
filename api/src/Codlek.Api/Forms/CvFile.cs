using System.IO.Compression;
using System.Text;

namespace Codlek.Api.Forms;

/// <summary>
/// A CV must be a PDF or Word file whose content matches its extension: the
/// extension says what the file claims to be, the first bytes have to fit that
/// family. A .docx is a zip, accepted when it really holds a Word document
/// (its parts can be in any order), so a script renamed to .docx is refused.
/// </summary>
public static class CvFile
{
    public const int MaxBytes = 5120 * 1024;

    public static readonly string[] Extensions = ["pdf", "doc", "docx"];

    public static string Extension(string fileName) =>
        Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();

    public static async Task<bool> IsValidAsync(IFormFile file, CancellationToken ct = default)
    {
        var extension = Extension(file.FileName);
        if (!Extensions.Contains(extension))
        {
            return false;
        }

        await using var stream = file.OpenReadStream();
        var head = new byte[8];
        var read = await stream.ReadAtLeastAsync(head, head.Length, throwOnEndOfStream: false, ct);
        head = head[..read];

        return extension switch
        {
            "pdf" => StartsWith(head, "%PDF"u8),
            // Old Word files are OLE compound documents; RTF saved as .doc also opens in Word.
            "doc" => StartsWith(head, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) || StartsWith(head, "{\\rtf"u8),
            "docx" => StartsWith(head, "PK\x03\x04"u8) && IsWordDocument(file),
            _ => false,
        };
    }

    private static bool IsWordDocument(IFormFile file)
    {
        try
        {
            using var zip = new ZipArchive(file.OpenReadStream(), ZipArchiveMode.Read);
            if (zip.GetEntry("word/document.xml") is not null)
            {
                return true;
            }

            var types = zip.GetEntry("[Content_Types].xml");
            if (types is null)
            {
                return false;
            }

            using var reader = new StreamReader(types.Open(), Encoding.UTF8);
            return reader.ReadToEnd().Contains("wordprocessingml", StringComparison.Ordinal);
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private static bool StartsWith(ReadOnlySpan<byte> data, ReadOnlySpan<byte> prefix) =>
        data.Length >= prefix.Length && data[..prefix.Length].SequenceEqual(prefix);
}
