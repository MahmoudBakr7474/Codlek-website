using System.Text.Json.Nodes;
using Codlek.Api.Data;
using Codlek.Api.Mail;
using Codlek.Api.Site;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Codlek.Api.Tests;

/// <summary>
/// The API on its own LocalDB database (Codlek_Tests, rebuilt for every run and
/// filled with <see cref="TestData"/>), with mail captured instead of sent and
/// CVs written to a temp folder.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string FormsKey = "test-forms-key";

    private const string Connection =
        @"Server=(localdb)\MSSQLLocalDB;Database=Codlek_Tests;Trusted_Connection=True;TrustServerCertificate=True";

    public string StorageDirectory { get; } = Path.Combine(Path.GetTempPath(), "codlek-tests", Guid.NewGuid().ToString("N"));

    public CapturingMailSender Mail { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Default", Connection);
        builder.UseSetting("Codlek:FormsKey", FormsKey);
        builder.UseSetting("Codlek:PrivateStorage", StorageDirectory);
        builder.UseSetting("Codlek:PublicUrl", "https://api.test");
        builder.UseSetting("Codlek:SiteUrl", "https://site.test");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IMailSender>();
            services.AddSingleton<IMailSender>(Mail);
        });
    }

    public async Task InitializeAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CodlekDbContext>();
        await db.Database.EnsureDeletedAsync();
        await db.Database.MigrateAsync();
        await TestData.SeedAsync(db);
    }

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
        if (Directory.Exists(StorageDirectory))
        {
            Directory.Delete(StorageDirectory, recursive: true);
        }
    }

    /// <summary>A client that posts forms as the visitor at <paramref name="ip"/> (each test its own, for the rate limit).</summary>
    public HttpClient Visitor(string ip)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("X-Codlek-Key", FormsKey);
        client.DefaultRequestHeaders.Add("X-Client-IP", ip);
        return client;
    }

    public async Task<T> WithDbAsync<T>(Func<CodlekDbContext, Task<T>> action)
    {
        using var scope = Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<CodlekDbContext>());
    }

    /// <summary>Saves settings for the length of a test; they go back to the defaults on dispose.</summary>
    public async Task<IAsyncDisposable> SettingsAsync(Dictionary<string, JsonNode?> values)
    {
        using (var scope = Services.CreateScope())
        {
            await scope.ServiceProvider.GetRequiredService<SettingsStore>().PutAsync(values);
        }

        return new Restore(this, values.Keys.ToList());
    }

    private sealed class Restore(ApiFactory factory, List<string> keys) : IAsyncDisposable
    {
        public async ValueTask DisposeAsync()
        {
            using var scope = factory.Services.CreateScope();
            await scope.ServiceProvider.GetRequiredService<SettingsStore>().ForgetAsync(keys);
        }
    }
}

[CollectionDefinition("api")]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>;

public sealed class CapturingMailSender : IMailSender
{
    private readonly List<OutgoingMail> sent = [];

    public Task SendAsync(OutgoingMail mail, CancellationToken ct = default)
    {
        lock (sent)
        {
            sent.Add(mail);
        }

        return Task.CompletedTask;
    }

    /// <summary>Mails sent to <paramref name="to"/>, waiting for the queue (mail goes out after the response).</summary>
    public async Task<List<OutgoingMail>> ToAsync(string to, int expected, TimeSpan? timeout = null)
    {
        var until = DateTime.UtcNow + (timeout ?? TimeSpan.FromSeconds(5));
        while (true)
        {
            List<OutgoingMail> found;
            lock (sent)
            {
                found = sent.Where(m => m.To.Contains(to)).ToList();
            }

            if (found.Count >= expected || DateTime.UtcNow > until)
            {
                return found;
            }

            await Task.Delay(50);
        }
    }
}
