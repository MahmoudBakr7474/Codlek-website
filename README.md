# موقع كودلك — .NET + Next.js

النسخة الجديدة من موقع شركة كودلك:

| الفولدر | إيه هو | بيترفع فين |
|---|---|---|
| `api/` | الباك اند: ASP.NET Core 10 Web API + SQL Server | MonsterASP |
| `web/` | الموقع العام: Next.js (عربي على `/`، إنجليزي على `/en`) | Vercel |
| `admin/` | لوحة التحكم: React + Refine + Ant Design | مع الـ API تحت `/admin` |

الخطة والمراحل في [docs/PLAN.md](docs/PLAN.md)، وملاحظات التطوير في [CLAUDE.md](CLAUDE.md).

## التشغيل على الجهاز

```bash
# الـ API (محتاج LocalDB)
cd api
dotnet tool restore
dotnet ef database update -p src/Codlek.Api
dotnet run --project src/Codlek.Api        # http://localhost:5080

# الموقع
cd web && npm install && npm run dev       # http://localhost:3000

# لوحة التحكم
cd admin && npm install && npm run dev     # http://localhost:5173
```
