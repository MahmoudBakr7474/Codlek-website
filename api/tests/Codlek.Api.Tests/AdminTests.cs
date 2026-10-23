using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Codlek.Api.Data;
using Microsoft.EntityFrameworkCore;
using SkiaSharp;

namespace Codlek.Api.Tests;

[Collection("api")]
public class AdminTests(ApiFactory factory)
{
    private static async Task<JsonElement> Json(HttpResponseMessage response) => await response.Content.ReadFromJsonAsync<JsonElement>();

    [Fact]
    public async Task The_admin_api_needs_a_signed_in_admin()
    {
        var anonymous = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/admin/projects")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/admin/auth/me")).StatusCode);
    }

    [Fact]
    public async Task Login_checks_the_password_and_the_admin_flag()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Codlek-Admin", "1");

        var wrong = await client.PostAsJsonAsync("/api/admin/auth/login", new { email = TestData.AdminEmail, password = "nope" });
        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        Assert.Equal("الإيميل أو كلمة السر غلط.", (await Json(wrong)).GetProperty("message").GetString());

        var notAdmin = await client.PostAsJsonAsync("/api/admin/auth/login", new { email = "user@codlek.test", password = TestData.AdminPassword });
        Assert.Equal(HttpStatusCode.Unauthorized, notAdmin.StatusCode);

        var admin = await factory.AdminAsync();
        var me = await admin.GetFromJsonAsync<JsonElement>("/api/admin/auth/me");
        Assert.Equal("Codlek Admin", me.GetProperty("name").GetString());
    }

    [Fact]
    public async Task An_admin_changes_their_account_and_their_other_sessions_end()
    {
        await factory.WithDbAsync(db =>
        {
            db.Users.Add(new User { Name = "Second Admin", Email = "second@codlek.test", Password = BCrypt.Net.BCrypt.HashPassword("old-password-1"), IsAdmin = true });
            return db.SaveChangesAsync();
        });

        async Task<HttpClient> SignIn(string email, string password)
        {
            var client = factory.Visitor("10.9.9.9"); // its own address for the sign-in limit
            client.DefaultRequestHeaders.Add(Admin.AdminWriteFilter.Header, "1");
            var login = await client.PostAsJsonAsync("/api/admin/auth/login", new { email, password });
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);
            return client;
        }

        var phone = await SignIn("second@codlek.test", "old-password-1");
        var laptop = await SignIn("second@codlek.test", "old-password-1");

        var wrongPassword = await laptop.PutAsJsonAsync("/api/admin/auth/account", new { name = "Owner", email = "owner@codlek.test", currentPassword = "nope", newPassword = "new-password-2" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, wrongPassword.StatusCode);
        Assert.True((await Json(wrongPassword)).GetProperty("errors").TryGetProperty("currentPassword", out _));

        var tooShort = await laptop.PutAsJsonAsync("/api/admin/auth/account", new { name = "Owner", email = "owner@codlek.test", currentPassword = "old-password-1", newPassword = "short" });
        Assert.True((await Json(tooShort)).GetProperty("errors").TryGetProperty("newPassword", out _));

        var taken = await laptop.PutAsJsonAsync("/api/admin/auth/account", new { name = "Owner", email = TestData.AdminEmail, currentPassword = "old-password-1" });
        Assert.True((await Json(taken)).GetProperty("errors").TryGetProperty("email", out _));

        var saved = await laptop.PutAsJsonAsync("/api/admin/auth/account", new { name = "Owner", email = " Owner@Codlek.test ", currentPassword = "old-password-1", newPassword = "new-password-2" });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.Equal("owner@codlek.test", (await Json(saved)).GetProperty("email").GetString());

        // This session carries on with the new details; the other one is signed out.
        Assert.Equal("Owner", (await laptop.GetFromJsonAsync<JsonElement>("/api/admin/auth/me")).GetProperty("name").GetString());
        Assert.Equal(HttpStatusCode.Unauthorized, (await phone.GetAsync("/api/admin/auth/me")).StatusCode);
        await SignIn("owner@codlek.test", "new-password-2");
    }

    [Fact]
    public async Task Writes_without_the_admin_header_are_refused()
    {
        var admin = await factory.AdminAsync();
        admin.DefaultRequestHeaders.Remove("X-Codlek-Admin");

        var response = await admin.PostAsJsonAsync("/api/admin/project-categories", new { });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task A_project_is_validated_created_listed_switched_and_deleted()
    {
        var admin = await factory.AdminAsync();
        var category = await factory.WithDbAsync(db => db.ProjectCategories.Where(c => c.Slug == "ecommerce").Select(c => c.Id).FirstAsync());

        var invalid = await admin.PostAsJsonAsync("/api/admin/projects", new { titleAr = "", url = "not a url" });
        Assert.Equal(HttpStatusCode.UnprocessableEntity, invalid.StatusCode);
        var errors = (await Json(invalid)).GetProperty("errors");
        Assert.Equal("الحقل ده مطلوب.", errors.GetProperty("titleAr")[0].GetString());
        Assert.Equal("اختار التصنيف.", errors.GetProperty("projectCategoryId")[0].GetString());
        Assert.True(errors.TryGetProperty("url", out _));

        var created = await admin.PostAsJsonAsync("/api/admin/projects", new
        {
            projectCategoryId = category,
            titleAr = "مشروع من اللوحة",
            titleEn = "Admin project",
            descriptionAr = "وصف",
            descriptionEn = "Description",
            url = "https://www.admin-project.test",
            isPublished = false,
        });
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var project = await Json(created);
        var id = project.GetProperty("id").GetInt32();
        Assert.Equal("admin-project.test", project.GetProperty("host").GetString());
        Assert.Equal("متاجر", project.GetProperty("categoryName").GetString());

        var page = await admin.GetFromJsonAsync<JsonElement>("/api/admin/projects?q=Admin%20project");
        Assert.Equal(1, page.GetProperty("total").GetInt32());

        var switched = await admin.PatchAsJsonAsync($"/api/admin/projects/{id}", new { isPublished = true });
        Assert.True((await Json(switched)).GetProperty("isPublished").GetBoolean());

        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/admin/projects/{id}")).StatusCode);
        Assert.False(await factory.WithDbAsync(db => db.Projects.AnyAsync(p => p.Id == id)));
    }

    [Fact]
    public async Task Rows_can_be_reordered_by_hand()
    {
        var admin = await factory.AdminAsync();
        var ids = await factory.WithDbAsync(db => db.JobOpenings.OrderBy(j => j.SortOrder).Select(j => j.Id).ToListAsync());

        var response = await admin.PostAsJsonAsync("/api/admin/job-openings/reorder", new { ids = ids.AsEnumerable().Reverse().ToArray() });

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var order = await factory.WithDbAsync(db => db.JobOpenings.OrderBy(j => j.SortOrder).Select(j => j.Id).ToListAsync());
        Assert.Equal(ids.AsEnumerable().Reverse(), order);
        await admin.PostAsJsonAsync("/api/admin/job-openings/reorder", new { ids });
    }

    [Fact]
    public async Task A_service_key_must_be_unique_and_not_reserved()
    {
        var admin = await factory.AdminAsync();
        var body = new
        {
            key = "other", icon = "globe", tone = "teal", titleAr = "خدمة", titleEn = "Service",
            summaryAr = "ملخص", summaryEn = "Summary", descriptionAr = "وصف", descriptionEn = "Description",
            features = new[] { new { ar = "ميزة", en = "" } },
        };

        var reserved = await admin.PostAsJsonAsync("/api/admin/services", body);
        var errors = (await Json(reserved)).GetProperty("errors");
        Assert.Equal("الاسم ده محجوز في الموقع، اختار اسم تاني.", errors.GetProperty("key")[0].GetString());
        Assert.True(errors.TryGetProperty("features.0.en", out _));

        var taken = await admin.PostAsJsonAsync("/api/admin/services", body with { key = "web" });
        Assert.Equal("في خدمة تانية بنفس الرابط ده.", (await Json(taken)).GetProperty("errors").GetProperty("key")[0].GetString());
    }

    [Fact]
    public async Task A_job_with_applications_can_not_be_deleted()
    {
        var admin = await factory.AdminAsync();
        var job = await factory.WithDbAsync(async db =>
        {
            var opening = await db.JobOpenings.FirstAsync(j => j.TitleEn == "Closed job");
            db.JobApplications.Add(new Data.JobApplication { JobOpeningId = opening.Id, Name = "A", Email = "a@a.test", Phone = "0100000000" });
            await db.SaveChangesAsync();
            return opening.Id;
        });

        var response = await admin.DeleteAsync($"/api/admin/job-openings/{job}");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.StartsWith("مينفعش تمسح وظيفة عليها طلبات توظيف", (await Json(response)).GetProperty("message").GetString());
    }

    [Fact]
    public async Task Opening_a_message_marks_it_read()
    {
        var admin = await factory.AdminAsync();
        var id = await factory.WithDbAsync(async db =>
        {
            var message = new Data.ContactMessage { Name = "Reader", Email = "r@r.test", Phone = "0100000000", Service = "web", Message = "Hello there friends" };
            db.ContactMessages.Add(message);
            await db.SaveChangesAsync();
            return message.Id;
        });

        var unread = await admin.GetFromJsonAsync<JsonElement>("/api/admin/contact-messages?read=false&q=Reader");
        Assert.Equal(1, unread.GetProperty("total").GetInt32());

        var shown = await admin.GetFromJsonAsync<JsonElement>($"/api/admin/contact-messages/{id}");
        Assert.Equal("تطوير المواقع", shown.GetProperty("serviceLabel").GetString());
        Assert.True(await factory.WithDbAsync(db => db.ContactMessages.Where(m => m.Id == id).Select(m => m.ReadAt != null).FirstAsync()));
    }

    [Fact]
    public async Task Settings_are_normalized_on_save_and_reset_to_the_originals()
    {
        var admin = await factory.AdminAsync();

        var saved = await admin.PutAsJsonAsync("/api/admin/settings", new
        {
            values = new Dictionary<string, JsonNode?>
            {
                ["home.sections"] = JsonNode.Parse("""[{"key":"team","visible":false},{"key":"team"},{"key":"nope"}]"""),
                ["home.hero_visual"] = "bogus",
                ["home.technologies"] = JsonNode.Parse("""[{"name":" Shopify ","color":""}]"""),
            },
        });
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var values = (await Json(saved)).GetProperty("values");
        Assert.Equal(9, values.GetProperty("home.sections").GetArrayLength());
        Assert.False(values.GetProperty("home.sections")[0].GetProperty("visible").GetBoolean());
        Assert.Equal("image", values.GetProperty("home.hero_visual").GetString());
        Assert.Equal("#0FA3A3", values.GetProperty("home.technologies")[0].GetProperty("color").GetString());

        var reset = await admin.PostAsJsonAsync("/api/admin/settings/reset", new { keys = new[] { "home.sections", "home.hero_visual", "home.technologies" } });
        Assert.Equal(HttpStatusCode.NoContent, reset.StatusCode);
        var after = await admin.GetFromJsonAsync<JsonElement>("/api/admin/settings?keys=home.sections");
        Assert.True(after.GetProperty("values").GetProperty("home.sections")[0].GetProperty("visible").GetBoolean());
    }

    [Fact]
    public async Task Contact_details_are_checked()
    {
        var admin = await factory.AdminAsync();

        var response = await admin.PutAsJsonAsync("/api/admin/settings", new
        {
            values = new Dictionary<string, JsonNode?>
            {
                ["contact.email"] = "not-mail",
                ["contact.phone_international"] = "01144745671",
                ["contact.whatsapp"] = "+20 114",
                ["company.founded"] = 1800,
                ["mail.notify_emails"] = new JsonArray(),
            },
        });

        var errors = (await Json(response)).GetProperty("errors");
        foreach (var key in new[] { "contact.email", "contact.phone_international", "contact.whatsapp", "company.founded", "mail.notify_emails" })
        {
            Assert.True(errors.TryGetProperty(key, out _), key);
        }
    }

    [Fact]
    public async Task Page_texts_store_only_real_changes()
    {
        var admin = await factory.AdminAsync();

        await admin.PutAsJsonAsync("/api/admin/texts", new Dictionary<string, Dictionary<string, string>>
        {
            ["en"] = new() { ["blog.related"] = "More reading", ["blog.empty"] = "  " },
            ["ar"] = new() { ["blog.related"] = "" },
        });

        var texts = await admin.GetFromJsonAsync<JsonElement>("/api/admin/texts?keys=blog.related,blog.empty");
        Assert.Equal("More reading", texts.GetProperty("en").GetProperty("blog.related").GetProperty("value").GetString());
        var stored = await factory.WithDbAsync(db => db.Settings.Where(s => s.Key == "texts").Select(s => s.Value).FirstAsync());
        var lines = JsonNode.Parse(stored!)!;
        Assert.Equal("More reading", lines["en"]!["blog.related"]!.GetValue<string>());
        Assert.Null(lines["en"]!["blog.empty"]);

        await admin.PostAsJsonAsync("/api/admin/settings/reset", new { texts = new[] { "blog.related" } });
        var reset = await admin.GetFromJsonAsync<JsonElement>("/api/admin/texts?keys=blog.related");
        var en = reset.GetProperty("en").GetProperty("blog.related");
        Assert.Equal(en.GetProperty("original").GetString(), en.GetProperty("value").GetString());
    }

    [Fact]
    public async Task Uploaded_pictures_become_webp_within_the_preset_size()
    {
        var admin = await factory.AdminAsync();
        using var bitmap = new SKBitmap(3000, 6000);
        using (var canvas = new SKCanvas(bitmap))
        {
            canvas.Clear(SKColors.CornflowerBlue);
        }

        using var png = SKImage.FromBitmap(bitmap).Encode(SKEncodedImageFormat.Png, 100);
        var file = new ByteArrayContent(png.ToArray());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        var form = new MultipartFormDataContent { { file, "file", "shot.png" }, { new StringContent("projects"), "preset" } };

        var response = await admin.PostAsync("/api/admin/uploads", form);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var path = (await Json(response)).GetProperty("path").GetString()!;
        Assert.Matches(@"^projects/[a-z0-9]+\.webp$", path);
        using var stored = SKBitmap.Decode(Path.Combine(factory.StorageDirectory, "uploads", path));
        Assert.Equal(1600, stored.Width);
        Assert.Equal(1200, stored.Height);   // a full-page capture keeps its top, 0.75 of the width

        // Served at /uploads/... from the moved uploads folder.
        var served = await factory.CreateClient().GetAsync($"/uploads/{path}");
        Assert.Equal(HttpStatusCode.OK, served.StatusCode);
        Assert.Equal("image/webp", served.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task A_file_that_is_not_a_picture_is_refused()
    {
        var admin = await factory.AdminAsync();
        var file = new ByteArrayContent("not an image"u8.ToArray());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        var form = new MultipartFormDataContent { { file, "file", "fake.png" }, { new StringContent("projects"), "preset" } };

        var response = await admin.PostAsync("/api/admin/uploads", form);

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
    }

    [Fact]
    public async Task The_dashboard_counts_the_inbox_and_the_content()
    {
        var admin = await factory.AdminAsync();

        var dashboard = await admin.GetFromJsonAsync<JsonElement>("/api/admin/dashboard");

        Assert.True(dashboard.GetProperty("totalProjects").GetInt32() >= 5);
        Assert.Equal(2, dashboard.GetProperty("publishedPosts").GetInt32());
        Assert.True(dashboard.GetProperty("latestMessages").GetArrayLength() <= 5);
    }
}
