using System.Net;
using Microsoft.AspNetCore.Hosting;

namespace Codlek.Api.Tests;

[Collection("api")]
public class HealthTests(ApiFactory factory)
{
    [Fact]
    public async Task Health_endpoint_answers()
    {
        var response = await factory.CreateClient().GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task A_malformed_sentry_dsn_turns_sentry_off_instead_of_stopping_the_app()
    {
        using var withTypo = factory.WithWebHostBuilder(builder => builder.UseSetting("Sentry:Dsn", "https://o1.ingest.sentry.io/not-a-project"));

        var response = await withTypo.CreateClient().GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task The_sentry_tunnel_is_off_without_a_sentry_dsn()
    {
        var response = await factory.CreateClient().PostAsync("/api/monitoring", new StringContent("{\"dsn\":\"https://k@o1.ingest.sentry.io/1\"}\n{}"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
