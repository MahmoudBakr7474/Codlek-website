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
    [InlineData("""{"dsn":"https://key@o1.ingest.de.sentry.io/42","sent_at":"x"}""", "https://o1.ingest.de.sentry.io/api/42/envelope/")]
    [InlineData("""{"dsn":"https://key@o2.ingest.de.sentry.io/42"}""", null)]          // another organization
    [InlineData("""{"dsn":"http://key@o1.ingest.de.sentry.io/42"}""", null)]           // not https
    [InlineData("""{"dsn":"https://key@o1.ingest.de.sentry.io/42/../evil"}""", null)]  // not a project id
    [InlineData("""{"sent_at":"x"}""", null)]
    [InlineData("not json", null)]
    public void The_sentry_tunnel_forwards_only_reports_for_its_own_organization(string header, string? expected)
    {
        var envelope = System.Text.Encoding.UTF8.GetBytes(header + "\n{\"type\":\"event\"}\n{}");

        var target = SentryTunnel.TargetFor(envelope, new Uri("https://own@o1.ingest.de.sentry.io/7"));

        Assert.Equal(expected, target?.ToString());
    }

    [Theory]
    [InlineData("https://key@o1.ingest.de.sentry.io/42", true)]
    [InlineData("https://o1.ingest.de.sentry.io/42", false)]         // no public key
    [InlineData("https://key@o1.ingest.de.sentry.io/", false)]       // no project id
    [InlineData("https://key@o1.ingest.de.sentry.io/abc", false)]
    [InlineData("http://key@o1.ingest.de.sentry.io/42", false)]
    [InlineData("not a dsn", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Only_a_well_formed_sentry_dsn_turns_sentry_on(string? dsn, bool usable)
    {
        Assert.Equal(usable, SentrySetup.IsUsable(dsn));
    }

    [Fact]
    public void Sentry_events_keep_no_query_string_cookies_or_identifying_headers()
    {
        var request = new Sentry.SentryRequest
        {
            Url = "https://codlek.tryasp.net/api/admin/contact-messages?q=ahmed%40example.com",
            QueryString = "?q=ahmed%40example.com",
            Cookies = "codlek_admin=secret",
            Data = new { name = "Ahmed" },
        };
        request.Headers["User-Agent"] = "Mozilla/5.0";
        request.Headers["X-Forwarded-For"] = "203.0.113.7";
        request.Headers["X-Codlek-Key"] = "key";
        request.Headers["Referer"] = "https://codlek.tryasp.net/admin/contact-messages?q=ahmed";

        SentrySetup.Scrub(request);

        Assert.Equal("https://codlek.tryasp.net/api/admin/contact-messages", request.Url);
        Assert.Null(request.QueryString);
        Assert.Null(request.Cookies);
        Assert.Null(request.Data);
        Assert.Equal(["User-Agent"], request.Headers.Keys);
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
