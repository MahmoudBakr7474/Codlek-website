using System.IO.Compression;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace Codlek.Api.Tests;

[Collection("api")]
public class CareersFormTests(ApiFactory factory)
{
    private static readonly byte[] Pdf = Encoding.ASCII.GetBytes("%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF");

    private static MultipartFormDataContent Form(string email, (byte[] Bytes, string Name)? cv = null, string? profile = null, string? job = null)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent("Omar Hassan"), "name" },
            { new StringContent(email), "email" },
            { new StringContent("01144745671"), "phone" },
            { new StringContent("Five years of React."), "message" },
        };

        if (profile is not null)
        {
            form.Add(new StringContent(profile), "profile_url");
        }

        if (job is not null)
        {
            form.Add(new StringContent(job), "job_opening_id");
        }

        if (cv is { } file)
        {
            var content = new ByteArrayContent(file.Bytes);
            content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            form.Add(content, "cv", file.Name);
        }

        return form;
    }

    private async Task<JsonElement> ErrorsAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
    }

    [Fact]
    public async Task An_application_with_a_cv_is_saved_privately_and_mailed_with_the_cv()
    {
        var job = await factory.WithDbAsync(db => db.JobOpenings.Where(j => j.IsActive).Select(j => j.Id).FirstAsync());
        var response = await factory.Visitor("10.1.0.1")
            .PostAsync("/api/public/ar/careers", Form("omar@careers.test", (Pdf, "Omar CV.pdf"), job: job.ToString()));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await factory.WithDbAsync(db => db.JobApplications.SingleAsync(a => a.Email == "omar@careers.test"));
        Assert.Equal(job, saved.JobOpeningId);
        Assert.Equal("Omar CV.pdf", saved.CvOriginalName);
        Assert.Matches(@"^applications/[A-Za-z0-9]{40}\.pdf$", saved.CvPath!);
        Assert.True(File.Exists(Path.Combine(factory.StorageDirectory, saved.CvPath!)));

        var mail = Assert.Single(await factory.Mail.ToAsync(TestData.NotifyEmail, 1, TimeSpan.FromSeconds(5)), m => m.ReplyToAddress == "omar@careers.test");
        Assert.Contains("Active job (ar)", mail.Subject);
        Assert.Equal("Omar CV.pdf", Assert.Single(mail.Attachments!).FileName);
    }

    [Fact]
    public async Task A_profile_link_is_enough_without_a_cv()
    {
        var response = await factory.Visitor("10.1.0.2")
            .PostAsync("/api/public/en/careers", Form("link@careers.test", profile: "https://linkedin.com/in/omar"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var saved = await factory.WithDbAsync(db => db.JobApplications.SingleAsync(a => a.Email == "link@careers.test"));
        Assert.Null(saved.CvPath);
        Assert.Null(saved.JobOpeningId);
    }

    [Fact]
    public async Task Neither_cv_nor_profile_asks_for_one_of_them()
    {
        var errors = await ErrorsAsync(await factory.Visitor("10.1.0.3").PostAsync("/api/public/en/careers", Form("none@careers.test")));

        Assert.Equal("Please attach your CV or add a profile link.", errors.GetProperty("cv")[0].GetString());
        Assert.Equal("Please attach your CV or add a profile link.", errors.GetProperty("profile_url")[0].GetString());
    }

    [Fact]
    public async Task A_file_whose_content_does_not_match_its_extension_is_refused()
    {
        var fake = Encoding.UTF8.GetBytes("<?php echo 'not a pdf';");
        var errors = await ErrorsAsync(await factory.Visitor("10.1.0.4")
            .PostAsync("/api/public/en/careers", Form("fake@careers.test", (fake, "cv.pdf"))));

        Assert.Equal("The CV must be a PDF or Word file.", errors.GetProperty("cv")[0].GetString());
    }

    [Fact]
    public async Task A_real_docx_is_accepted_and_a_zip_renamed_to_docx_is_not()
    {
        var ok = await factory.Visitor("10.1.0.5")
            .PostAsync("/api/public/en/careers", Form("docx@careers.test", (Zip("word/document.xml"), "cv.docx")));
        Assert.Equal(HttpStatusCode.OK, ok.StatusCode);

        var errors = await ErrorsAsync(await factory.Visitor("10.1.0.6")
            .PostAsync("/api/public/en/careers", Form("zip@careers.test", (Zip("script.js"), "cv.docx"))));
        Assert.Equal("The CV must be a PDF or Word file.", errors.GetProperty("cv")[0].GetString());
    }

    [Fact]
    public async Task A_cv_over_5_mb_is_refused()
    {
        var big = new byte[5 * 1024 * 1024 + 10];
        Pdf.CopyTo(big, 0);

        var errors = await ErrorsAsync(await factory.Visitor("10.1.0.7")
            .PostAsync("/api/public/en/careers", Form("big@careers.test", (big, "cv.pdf"))));

        Assert.Equal("The CV must be 5 MB or smaller.", errors.GetProperty("cv")[0].GetString());
    }

    [Fact]
    public async Task A_closed_job_can_not_be_picked()
    {
        var closed = await factory.WithDbAsync(db => db.JobOpenings.Where(j => !j.IsActive).Select(j => j.Id).FirstAsync());

        var errors = await ErrorsAsync(await factory.Visitor("10.1.0.8")
            .PostAsync("/api/public/en/careers", Form("closed@careers.test", profile: "https://x.test", job: closed.ToString())));

        Assert.True(errors.TryGetProperty("job_opening_id", out _));
    }

    private static byte[] Zip(string entry)
    {
        using var memory = new MemoryStream();
        using (var zip = new ZipArchive(memory, ZipArchiveMode.Create, leaveOpen: true))
        {
            using var writer = new StreamWriter(zip.CreateEntry(entry).Open());
            writer.Write("<xml/>");
        }

        return memory.ToArray();
    }
}
