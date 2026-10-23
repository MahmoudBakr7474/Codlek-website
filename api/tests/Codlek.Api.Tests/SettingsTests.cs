using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Codlek.Api.Public;

namespace Codlek.Api.Tests;

/// <summary>What the owner saves in the admin wins over the defaults, as in the Laravel site.</summary>
[Collection("api")]
public class SettingsTests(ApiFactory factory)
{
    private readonly HttpClient client = factory.CreateClient();

    [Fact]
    public async Task Saved_hero_stats_replace_the_defaults_with_tokens_filled()
    {
        await using var _ = await factory.SettingsAsync(new()
        {
            ["company.founded"] = 2020,
            ["home.hero_stats"] = JsonNode.Parse("""
                [{"value":"{years}+","label":{"ar":"سنوات","en":""}},{"value":"1","label":{"ar":"أ","en":"b"}},
                 {"value":"2","label":"plain"},{"value":"3","label":"fourth is dropped"}]
                """),
        });

        var home = await client.GetFromJsonAsync<HomeDto>("/api/public/en/home");

        Assert.Equal(3, home!.HeroStats.Count);
        Assert.Equal($"{DateTime.UtcNow.Year - 2020}+", home.HeroStats[0].Value);
        Assert.Equal("سنوات", home.HeroStats[0].Label);   // empty English falls back to Arabic
        Assert.Equal("plain", home.HeroStats[2].Label);
    }

    [Fact]
    public async Task Hidden_and_empty_sections_are_left_out_and_new_ones_come_last()
    {
        await using var _ = await factory.SettingsAsync(new()
        {
            ["home.sections"] = JsonNode.Parse("""[{"key":"team","visible":true},{"key":"why","visible":false},{"key":"bogus"}]"""),
            ["home.industries"] = new JsonArray(),
        });

        var home = await client.GetFromJsonAsync<HomeDto>("/api/public/en/home");

        Assert.Equal("team", home!.Sections[0]);
        Assert.DoesNotContain("why", home.Sections);
        Assert.DoesNotContain("industries", home.Sections);   // no content
        Assert.DoesNotContain("bogus", home.Sections);
        Assert.Equal("cta", home.Sections[^1]);
    }

    [Fact]
    public async Task Hero_shows_the_picked_projects_then_fills_with_featured_ones()
    {
        var picked = await factory.WithDbAsync(db => Task.FromResult(db.Projects.Single(p => p.TitleEn == "Second shop").Id));
        await using var _ = await factory.SettingsAsync(new()
        {
            ["home.hero_visual"] = "projects",
            ["home.hero_main_project"] = picked,
        });

        var home = await client.GetFromJsonAsync<HomeDto>("/api/public/en/home");

        Assert.Equal("projects", home!.HeroVisual);
        Assert.Equal(["Second shop", "Featured shop"], home.Showcase.Select(p => p.Title));
    }

    [Fact]
    public async Task Edited_page_texts_win_over_the_shipped_ones()
    {
        await using var _ = await factory.SettingsAsync(new()
        {
            ["texts"] = JsonNode.Parse("""{"en":{"legal.privacy_title":"Our privacy","legal.terms_title":"  "}}"""),
        });

        var site = await client.GetFromJsonAsync<SiteDto>("/api/public/en/site");
        var terms = await client.GetFromJsonAsync<LegalDto>("/api/public/en/legal/terms");

        Assert.Equal("Our privacy", site!.Texts["legal.privacy_title"]);
        Assert.Equal("Terms & conditions", terms!.Title);   // a blank override is ignored
    }

    [Fact]
    public async Task Technologies_get_a_colour_from_the_saved_value_or_their_name()
    {
        await using var _ = await factory.SettingsAsync(new()
        {
            ["home.technologies"] = JsonNode.Parse("""[{"name":"Shopify","color":"blue"},{"name":"Mine","color":"#abc"},{"name":"  "}]"""),
        });

        var home = await client.GetFromJsonAsync<HomeDto>("/api/public/en/home");

        Assert.Equal(2, home!.Technologies.Count);
        Assert.Equal("#0FA3A3", home.Technologies[0].Color);   // the design's Shopify colour
        Assert.Equal("#AABBCC", home.Technologies[1].Color);
    }

    [Fact]
    public async Task Social_links_keep_only_known_platforms_with_real_urls()
    {
        await using var _ = await factory.SettingsAsync(new()
        {
            ["social.links"] = JsonNode.Parse("""
                [{"platform":"facebook","url":"https://facebook.com/x"},{"platform":"myspace","url":"https://m.com"},
                 {"platform":"x","url":"javascript:alert(1)"}]
                """),
        });

        var site = await client.GetFromJsonAsync<SiteDto>("/api/public/ar/site");

        var link = Assert.Single(site!.Socials);
        Assert.Equal("فيسبوك", link.Label);
    }
}
