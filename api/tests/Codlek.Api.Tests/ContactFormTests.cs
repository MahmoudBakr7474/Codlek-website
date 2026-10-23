using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Tests;

[Collection("api")]
public class ContactFormTests(ApiFactory factory)
{
    private static object Valid(string email, string? website = null) => new
    {
        name = "  Mona Ali ",
        email,
        phone = "‎+٢٠ ١١٤ ٤٧٤ 5671",
        service = "web",
        message = "We need a new online store for our brand.",
        website,
    };

    [Fact]
    public async Task A_valid_message_is_saved_cleaned_and_mailed()
    {
        var email = "mona@contact.test";
        var response = await factory.Visitor("10.0.0.1").PostAsJsonAsync("/api/public/en/contact", Valid("Mona@Contact.Test"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Your message has been sent!", body.GetProperty("title").GetString());

        var saved = await factory.WithDbAsync(db => db.ContactMessages.SingleAsync(m => m.Email == email));
        Assert.Equal("Mona Ali", saved.Name);
        Assert.Equal("+20 114 474 5671", saved.Phone);
        Assert.Equal("en", saved.Locale);
        Assert.Equal("10.0.0.1", saved.IpAddress);

        var company = Assert.Single(await factory.Mail.ToAsync(TestData.NotifyEmail, 1), m => m.ReplyToAddress == email);
        Assert.Contains("تطوير المواقع", company.Subject);
        Assert.Contains("رسالة جديدة من نموذج التواصل", company.Html);

        var receipt = Assert.Single(await factory.Mail.ToAsync(email, 1));
        Assert.Contains("Thanks for contacting Codlek", receipt.Html);
        Assert.DoesNotContain("online store", receipt.Html);   // never repeats what the visitor typed
    }

    [Fact]
    public async Task Errors_come_back_per_field_in_the_visitor_language()
    {
        var response = await factory.Visitor("10.0.0.2").PostAsJsonAsync("/api/public/ar/contact", new
        {
            name = "م",
            email = "not-an-email",
            phone = "123",
            service = "hidden",   // unpublished services can't be picked
            message = "",
        });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("يجب ألا يقل عدد أحرف الاسم الكامل عن 2.", errors.GetProperty("name")[0].GetString());
        Assert.Contains("بريداً إلكترونياً صالحاً", errors.GetProperty("email")[0].GetString());
        Assert.True(errors.TryGetProperty("phone", out _));
        Assert.True(errors.TryGetProperty("service", out _));
        Assert.Equal("حقل تفاصيل المشروع مطلوب.", errors.GetProperty("message")[0].GetString());
    }

    [Fact]
    public async Task A_phone_with_too_few_digits_gets_the_phone_message()
    {
        var response = await factory.Visitor("10.0.0.3").PostAsJsonAsync("/api/public/en/contact", new
        {
            name = "Sam", email = "sam@contact.test", phone = "(12) 34-5", service = "other", message = "Hello there, a question.",
        });

        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("The phone number is not valid.", errors.GetProperty("phone")[0].GetString());
    }

    [Fact]
    public async Task Bots_filling_the_hidden_field_get_a_success_but_nothing_is_saved()
    {
        var response = await factory.Visitor("10.0.0.4").PostAsJsonAsync("/api/public/en/contact", Valid("bot@contact.test", website: "http://spam"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(await factory.WithDbAsync(db => db.ContactMessages.AnyAsync(m => m.Email == "bot@contact.test")));
    }

    [Fact]
    public async Task More_than_five_attempts_a_minute_are_refused()
    {
        var visitor = factory.Visitor("10.0.0.5");
        for (var i = 0; i < 5; i++)
        {
            await visitor.PostAsJsonAsync("/api/public/en/contact", new { });
        }

        var response = await visitor.PostAsJsonAsync("/api/public/en/contact", Valid("late@contact.test"));

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal("Too many attempts. Please wait a minute and try again.", errors.GetProperty("form")[0].GetString());

        // Another visitor is not affected.
        var other = await factory.Visitor("10.0.0.6").PostAsJsonAsync("/api/public/en/contact", Valid("other@contact.test"));
        Assert.Equal(HttpStatusCode.OK, other.StatusCode);
    }

    [Fact]
    public async Task Without_the_forms_key_the_client_ip_header_is_ignored()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Client-IP", "10.9.9.9");

        await client.PostAsJsonAsync("/api/public/en/contact", Valid("nokey@contact.test"));

        var saved = await factory.WithDbAsync(db => db.ContactMessages.SingleAsync(m => m.Email == "nokey@contact.test"));
        Assert.NotEqual("10.9.9.9", saved.IpAddress);
    }
}
