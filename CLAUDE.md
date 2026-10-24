# Codlek website (.NET + Next.js + Refine) — notes for coding agents

Rewrite of the Codlek company site from Laravel. The plan, decisions and phase status are in
`docs/PLAN.md` (Egyptian Arabic): read it first. The owner speaks Egyptian Arabic.

## Layout
- `api/` — ASP.NET Core 10 Web API (`Codlek.slnx`): `src/Codlek.Api`, `tests/Codlek.Api.Tests` (xUnit +
  WebApplicationFactory), `tools/Codlek.Import` (one-off SQLite → SQL Server move),
  `tools/laravel-export/export.php` (one-off export of content defaults and UI texts).
- `web/` — public site, Next.js 16 (App Router, TypeScript, Tailwind 4), deployed on Vercel.
  Next 16 differs from older versions: read `web/AGENTS.md` and `web/node_modules/next/dist/docs/` before writing code.
- `admin/` — dashboard, Vite + React + TypeScript + Refine 5 + Ant Design 5 (RTL Arabic). Served by the API under `/admin`.

## Reference site (read only)
- The Laravel original is `D:\Codlek\codlek-laravel`. **Never write to it**, never run artisan commands that touch
  its database or cache. Its `CLAUDE.md` documents behaviour the rewrite must keep.
- Its data lives in `database/database.sqlite`: always work on a copy.

## Running things on this Windows box
- .NET SDK 10 at `C:\Program Files\dotnet`; Node at `C:\Program Files\nodejs` (not on PATH). Node builds need
  `NODE_OPTIONS=--max-semi-space-size=2` (the machine sits at its commit limit). Run one heavy thing at a time.
- Database for development: **LocalDB** `(localdb)\MSSQLLocalDB`, database `Codlek`. Do **not** use `localhost` /
  `MSSQLSERVER` (another live system uses it) or `SQLEXPRESS`.
- API: `cd api && dotnet run --project src/Codlek.Api` → http://localhost:5080 (`/api/health`, `/openapi/v1.json`).
  On this laptop the freshly built `Codlek.Api.exe` is blocked from writing files (uploads, CVs, keys fail with
  `FileNotFoundException`), apparently Windows Controlled Folder Access. Run it through `dotnet.exe` instead:
  `cd api/src/Codlek.Api && ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://localhost:5080 dotnet bin/Debug/net10.0/Codlek.Api.dll`.
  Shell tools (`sed -i`, `cp`, python) can't write under `admin/` either: use the editor tools.
- Stopping a background `npm start` / `dotnet` task can leave the server process running: free the port by
  killing the process that listens on it (3000 / 5080), or the next start fails with EADDRINUSE.
- Tests: `cd api && dotnet test Codlek.slnx` (stop the API first: the build can't replace a running dll).
- Dashboard: `cd admin && npm run build` builds it into `api/src/Codlek.Api/wwwroot/admin` (gitignored).
- Publish for MonsterASP: `deploy/publish-api.ps1` → `out/api`; with `-Deploy` it uploads the changed files over
  WebDeploy (`-DryRun` to preview), using the `.publishSettings` file in `D:\Codlek\` (outside the repo: it holds
  the WebDeploy password). Live: API https://codlek.tryasp.net, site https://codlekwebsite.vercel.app.
  Deploy steps: `docs/DEPLOY.md`.
- Migrations: `cd api && dotnet ef migrations add <Name> -p src/Codlek.Api -o Data/Migrations`, then
  `dotnet ef database update -p src/Codlek.Api` (`dotnet-ef` is a local tool: `dotnet tool restore`).
- Re-export content from Laravel: `php api/tools/laravel-export/export.php D:/Codlek/codlek-laravel api/src/Codlek.Api/Content`
  (PHP: `D:\Codlek\_tools\php84\php.exe`). It reads the PHP files only.
- Re-import data: copy `database.sqlite` somewhere, then
  `cd api && dotnet run --project tools/Codlek.Import -- --sqlite <copy> --uploads D:/Codlek/codlek-laravel/public/uploads --uploads-to src/Codlek.Api/wwwroot/uploads [--force]`.
- Never print Arabic through the console to check it; compare inside files (or hashes).

## Conventions
- Same tables and columns as Laravel (snake_case via `UseSnakeCaseNamingConvention()`), same ids. Bilingual
  columns are `*Ar` / `*En` pairs. Timestamps are UTC (Laravel stored Africa/Cairo; the import converts), read
  back with Kind = Utc (`UtcDateTimeConverter`) so the JSON carries the `Z`; the site and dashboard format them
  in Africa/Cairo.
- `settings` = one row per key, raw JSON value. Defaults are `Content/site-defaults.json` (exported from
  `Site::default()`); a key missing from the table means "use the default". UI texts: `Content/lang/{ar,en}.json`
  (192 keys each); owner overrides live in the `texts` setting, storing only lines that differ.
- Tokens `{years}`, `{email}`, `{phone}` in content are filled when read.
- Admin sign-in: httpOnly cookie with a stamp of the password hash (a new password ends other sessions); keys
  persist in `storage/keys`. Every admin write carries `X-Codlek-Admin: 1` and pings the site's revalidate hook.
- Unknown articles and blog pages past the last get their 404 in `web/src/proxy.ts`: the pages stream, so a
  `notFound()` inside them can only add `noindex` to a 200.

## Git
- This repo is **public** (`github.com/MahmoudBakr7474/Codlek-website`): no secrets, connection strings with
  passwords, `.env` files, databases or uploads in commits. Production settings go in environment variables.
- Commit at the end of each phase; push only when the owner agrees.
