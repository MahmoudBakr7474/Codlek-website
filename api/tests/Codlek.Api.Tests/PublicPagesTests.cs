using System.Net;
using System.Net.Http.Json;
using Codlek.Api.Public;
using Codlek.Api.Site;

namespace Codlek.Api.Tests;

[Collection("api")]
public class PublicPagesTests(ApiFactory factory)
{
    private readonly HttpClient client = factory.CreateClient();

    [Theory]
    [InlineData("site")]
    [InlineData("home")]
    [InlineData("about")]
    [InlineData("services")]
    [InlineData("projects")]
    [InlineData("posts")]
    [InlineData("jobs")]
    [InlineData("legal/privacy")]
    [InlineData("legal/terms")]
    public async Task Every_page_answers_in_both_languages(string page)
    {
        foreach (var locale in new[] { "ar", "en" })
        {
            var response = await client.GetAsync($"/api/public/{locale}/{page}");
            Assert.True(response.StatusCode == HttpStatusCode.OK, $"{locale}/{page}: {response.StatusCode}");
        }
    }

    [Fact]
    public async Task Unknown_language_is_not_a_page()
    {
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/public/fr/home")).StatusCode);
    }

    [Fact]
    public async Task Site_has_texts_contact_and_service_options()
    {
        var site = await client.GetFromJsonAsync<SiteDto>("/api/public/en/site");

        Assert.NotNull(site);
        Assert.Equal("en", site.Locale);
        Assert.Equal("Privacy policy", site.Texts["legal.privacy_title"]);
        Assert.Equal(192, site.Texts.Count);
        Assert.False(string.IsNullOrEmpty(site.Contact.Email));
        Assert.Equal(["web"], site.Services.Select(s => s.Key));
        Assert.Equal(["web", "other"], site.ServiceOptions.Select(s => s.Key));
        Assert.Equal("always", site.Appearance.Loader);
    }

    [Fact]
    public async Task Home_shows_published_content_in_the_page_language()
    {
        var ar = await client.GetFromJsonAsync<HomeDto>("/api/public/ar/home");
        var en = await client.GetFromJsonAsync<HomeDto>("/api/public/en/home");

        Assert.NotNull(ar);
        Assert.NotNull(en);
        Assert.Equal(["Featured shop", "Second shop"], en.Featured.Select(p => p.Title));
        Assert.Equal("Featured shop (ar)", ar.Featured[0].Title);
        // An empty Arabic description falls back to the English one.
        Assert.Equal("Featured shop description", ar.Featured[0].Description);
        Assert.Equal("shop.example", en.Featured[0].Host);
        Assert.Equal("https://api.test/uploads/projects/shop.webp", en.Featured[0].ImageUrl);

        var service = Assert.Single(en.Services);
        Assert.Equal("blue", service.Tone);   // an unknown tone falls back to the first one
        Assert.Equal(["Feature"], service.Features);

        Assert.Equal(5, Assert.Single(en.Testimonials).Rating);
        Assert.Contains("why", en.Sections);
        Assert.Equal("image", en.HeroVisual);
        Assert.Null(en.HeroImageUrl);
    }

    [Fact]
    public async Task Projects_list_only_categories_with_something_to_show()
    {
        var all = await client.GetFromJsonAsync<ProjectsDto>("/api/public/en/projects");
        var shops = await client.GetFromJsonAsync<ProjectsDto>("/api/public/en/projects?category=ecommerce");
        var unknown = await client.GetFromJsonAsync<ProjectsDto>("/api/public/en/projects?category=nope");

        Assert.Equal(["ecommerce"], all!.Categories.Select(c => c.Slug));
        Assert.DoesNotContain(all.Projects, p => p.Title == "Hidden project");
        Assert.Equal(4, all.Projects.Count);
        Assert.Null(all.Active);

        Assert.Equal("ecommerce", shops!.Active);
        Assert.Equal(3, shops.Projects.Count);

        var soon = shops.Projects.Single(p => p.Title == "Coming soon");
        Assert.False(soon.IsLinkable);

        Assert.Null(unknown!.Active);
        Assert.Equal(4, unknown.Projects.Count);
    }

    [Fact]
    public async Task Blog_lists_published_posts_newest_first_and_hides_the_rest()
    {
        var page = await client.GetFromJsonAsync<PostsPageDto>("/api/public/en/posts");

        Assert.Equal(["published-post", "older-post"], page!.Posts.Select(p => p.Slug));
        Assert.Equal(1, page.LastPage);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync("/api/public/en/posts?page=2")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/public/en/posts?page=abc")).StatusCode);
    }

    [Theory]
    [InlineData("scheduled-post")]
    [InlineData("draft-post")]
    [InlineData("no-such-post")]
    public async Task Hidden_posts_are_not_found(string slug)
    {
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"/api/public/en/posts/{slug}")).StatusCode);
    }

    [Fact]
    public async Task Article_body_is_sanitized_and_related_posts_exclude_it()
    {
        var article = await client.GetFromJsonAsync<ArticleDto>("/api/public/en/posts/published-post");

        Assert.DoesNotContain("<script", article!.Post.Body);
        Assert.Contains("loading=\"lazy\"", article.Post.Body);
        Assert.Contains("alt=\"\"", article.Post.Body);
        Assert.Equal(["older-post"], article.Related.Select(p => p.Slug));
        Assert.Equal(1, article.Post.ReadingMinutes);
    }

    [Fact]
    public async Task Jobs_list_only_active_openings()
    {
        var jobs = await client.GetFromJsonAsync<List<JobDto>>("/api/public/en/jobs");

        Assert.Equal(["Active job"], jobs!.Select(j => j.Title));
    }

    [Fact]
    public async Task Legal_pages_have_title_and_sections()
    {
        var privacy = await client.GetFromJsonAsync<LegalDto>("/api/public/en/legal/privacy");

        Assert.Equal("Privacy policy", privacy!.Title);
        Assert.NotEmpty(privacy.Sections);
        Assert.All(privacy.Sections, s => Assert.False(string.IsNullOrEmpty(s.Title)));
    }

    [Fact]
    public async Task About_fills_the_years_token()
    {
        var about = await client.GetFromJsonAsync<About>("/api/public/en/about");

        Assert.NotEmpty(about!.Stats);
        Assert.DoesNotContain(about.Story, s => s.Contains("{years}"));
        Assert.DoesNotContain(about.Stats, s => s.Value.Contains("{years}"));
    }

    [Fact]
    public async Task Sitemap_lists_published_posts()
    {
        var sitemap = await client.GetFromJsonAsync<SitemapDto>("/api/public/sitemap");

        Assert.Equal(["published-post", "older-post"], sitemap!.Posts.Select(p => p.Slug));
    }
}
