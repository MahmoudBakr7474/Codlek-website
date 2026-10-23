using Codlek.Api.Forms;
using Codlek.Api.Public;
using Codlek.Api.Site;

namespace Codlek.Api.Tests;

public class HelperTests
{
    [Theory]
    [InlineData("٠١١٤٤٧٤٥٦٧١", "01144745671")]
    [InlineData("۰۱۲", "012")]
    [InlineData("‪+966 5x‬", "+966 5x")]
    [InlineData("  010  123  ", "010 123")]
    public void Phone_numbers_become_plain_ascii(string input, string expected)
    {
        Assert.Equal(expected, FormInput.Phone(input));
    }

    [Theory]
    [InlineData("#abc", "#AABBCC")]
    [InlineData("0b63ce", "#0B63CE")]
    [InlineData("#12345", null)]
    [InlineData("red", null)]
    [InlineData(null, null)]
    public void Hex_colours_are_normalised(string? input, string? expected)
    {
        Assert.Equal(expected, SiteContent.HexColor(input));
    }

    [Theory]
    [InlineData("https://www.ispektra.com/ar", "ispektra.com")]
    [InlineData("http://deglatours.com", "deglatours.com")]
    [InlineData("not a url", "not a url")]
    [InlineData(null, null)]
    public void Project_hosts_drop_www(string? url, string? expected)
    {
        Assert.Equal(expected, PublicMap.Host(url));
    }

    [Fact]
    public void Reading_time_counts_arabic_words_too()
    {
        var html = "<p>" + string.Join(' ', Enumerable.Repeat("كلمة", 401)) + "</p>";

        Assert.Equal(3, PublicMap.ReadingMinutes(html));
        Assert.Equal(1, PublicMap.ReadingMinutes(""));
    }
}
