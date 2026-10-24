# موقع كودلك — .NET + Next.js

النسخة الجديدة من موقع شركة كودلك:

| الفولدر | إيه هو | بيترفع فين |
|---|---|---|
| `api/` | الباك اند: ASP.NET Core 10 Web API + SQL Server | MonsterASP |
| `web/` | الموقع العام: Next.js (عربي على `/`، إنجليزي على `/en`) | Vercel |
| `admin/` | لوحة التحكم: React + Refine + Ant Design | مع الـ API تحت `/admin` |

- الخطة والمراحل وحالة الشغل: [docs/PLAN.md](docs/PLAN.md)
- الرفع خطوة بخطوة: [docs/DEPLOY.md](docs/DEPLOY.md)
- ملاحظات التطوير: [CLAUDE.md](CLAUDE.md)

## التشغيل على الجهاز

```bash
# الـ API (محتاج LocalDB)
cd api
dotnet tool restore
dotnet ef database update -p src/Codlek.Api
dotnet run --project src/Codlek.Api        # http://localhost:5080

# الموقع
cd web && npm install && npm run dev       # http://localhost:3000

# لوحة التحكم (وهي بتتطور)
cd admin && npm install && npm run dev     # http://localhost:5173/admin/

# لوحة التحكم جوه الـ API (زي السيرفر)
cd admin && npm run build                  # http://localhost:5080/admin/
```

## التستات

```bash
cd api && dotnet test Codlek.slnx          # xUnit على داتابيز Codlek_Tests في LocalDB
cd web && npm run lint
cd admin && npm run lint
```

## الرفع

```bash
powershell -ExecutionPolicy Bypass -File deploy/publish-api.ps1 -Deploy
```

بيعمل build للوحة، و publish للـ API، ويرفع اللي اتغير على MonsterASP بـ WebDeploy. الموقع بيترفع لوحده مع أي push. الباقي في [docs/DEPLOY.md](docs/DEPLOY.md).
