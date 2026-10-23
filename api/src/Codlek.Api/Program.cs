using Codlek.Api.Data;
using Codlek.Api.Forms;
using Codlek.Api.Mail;
using Codlek.Api.Public;
using Codlek.Api.Site;
using Ganss.Xss;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
// Numbers are numbers (the web default also reads "12"), so the OpenAPI types say so.
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.Strict);
builder.Services.AddProblemDetails();
builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);

builder.Services.AddDbContext<CodlekDbContext>(options => options
    .UseSqlServer(builder.Configuration.GetConnectionString("Default"))
    .UseSnakeCaseNamingConvention());

// Content exported from the Laravel site, and the owner's saved settings over it.
builder.Services.AddSingleton(new SiteData(Path.Combine(builder.Environment.ContentRootPath, "Content")));
builder.Services.AddScoped<SettingsStore>();
builder.Services.AddScoped<SiteContentLoader>();
builder.Services.AddScoped<Media>();
builder.Services.AddScoped<PublicMap>();
builder.Services.AddSingleton(new HtmlSanitizer());

// Forms and mail.
builder.Services.AddSingleton<FormThrottle>();
var mailOptions = builder.Configuration.GetSection("Mail").Get<MailOptions>() ?? new MailOptions();
builder.Services.AddSingleton(mailOptions);
switch (mailOptions.Driver)
{
    case "smtp":
        builder.Services.AddSingleton<IMailSender, SmtpMailSender>();
        break;
    case "resend":
        builder.Services.AddHttpClient<ResendMailSender>();
        builder.Services.AddSingleton<IMailSender>(sp => sp.GetRequiredService<ResendMailSender>());
        break;
    default:
        builder.Services.AddSingleton<IMailSender, LogMailSender>();
        break;
}

builder.Services.AddSingleton<MailQueue>();
builder.Services.AddHostedService<MailWorker>();
builder.Services.AddScoped<SiteMailer>();

// The public site posts its forms from the visitor's browser (a CV can be larger
// than a Vercel function accepts), so its origin may call the form endpoints.
var siteOrigins = (builder.Configuration["Codlek:CorsOrigins"] is { Length: > 0 } origins ? origins : builder.Configuration["Codlek:SiteUrl"] ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    .Select(origin => origin.TrimEnd('/'))
    .ToArray();
builder.Services.AddCors(options => options.AddPolicy(FormEndpoints.CorsPolicy, policy => policy
    .WithOrigins(siteOrigins)
    .WithMethods("POST")
    .WithHeaders("Content-Type")));

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// wwwroot: /uploads/... (pictures uploaded in the admin).
app.UseStaticFiles();

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapPublicEndpoints();
app.MapFormEndpoints();

app.Run();

// WebApplicationFactory<Program> in the tests needs a public Program type.
public partial class Program;
