# خطة تحويل موقع كودلك من Laravel إلى .NET + React

> اتكتبت 2026-10-23. المرجع: نسخة Laravel في `D:\Codlek\codlek-laravel`، ومش هتتلمس خالص (هنقرا منها بس).

---

## 1. القرارات اللي اتاخدت

| الجزء | التقنية | الرفع |
|---|---|---|
| الباك اند | **ASP.NET Core 10** (Web API، Minimal APIs) + EF Core + **SQL Server** | MonsterASP (الخطة المجانية) |
| الموقع العام | **Next.js** (App Router، TypeScript، Tailwind 4) بالتصميم الجديد (2026-10-22) | Vercel |
| لوحة التحكم | **React + TypeScript + Refine + Ant Design** (Vite SPA) | انظر قرار 7-1 |
| Git | ريبو جديد في `D:\Codlek\codlek-dotnet`، و commit محلي بعد كل مرحلة، ومفيش push | — |

**على الجهاز:** .NET SDK 10.0.401 موجود. وللتطوير هنستخدم **LocalDB** (`(localdb)\MSSQLLocalDB`)، **مش** `localhost` ولا `SQLEXPRESS`، عشان `localhost` هو اللي عليه نظام الورشة (YAS)، فمش هنقرب منه.

---

## 2. شكل الريبو

```
D:\Codlek\codlek-dotnet\
  api/
    Codlek.sln
    src/Codlek.Api/            ← الـ API (endpoints, EF, الإعدادات, الإيميلات, الرفع)
    tests/Codlek.Api.Tests/    ← xUnit + WebApplicationFactory (داتابيز LocalDB للتستات)
    tools/Codlek.Import/       ← أداة تنقل الداتا مرة واحدة من SQLite لـ SQL Server
  web/                         ← Next.js (الموقع العام)
  admin/                       ← Refine + Ant Design (لوحة التحكم)
  docs/PLAN.md, docs/DEPLOY.md
  CLAUDE.md, README.md, .gitignore
```

---

## 3. الباك اند (`api/`)

**الداتابيز (نفس الـ schema بتاعة Laravel، 10 جداول + users):**
`project_categories`, `projects`, `posts`, `job_openings`, `job_applications`, `contact_messages`, `services` (بالـ `tone` و `features` JSON), `testimonials`, `settings` (key + value JSON), `users`.
- نفس أسماء الأعمدة (`title_ar/title_en`…)، عشان النقل يبقى 1:1 والـ IDs تفضل زي ما هي (مشروع 16 و 17، واختيارات الهيرو بتشاور على IDs).
- EF Core migrations. والـ JSON يتخزن `nvarchar(max)`.

**المحتوى الافتراضي والنصوص:**
- سكريبت PHP بيتشغل مرة واحدة على نسخة Laravel (قراية بس) يطلّع:
  - `site-defaults.json`: كل مفاتيح `Site::default()` (الهيرو، لماذا كودلك، التقنيات، القطاعات، رحلة المشروع، الفريق، من نحن، الخصوصية، الشروط، السوشيال…).
  - `lang/ar.json` و `lang/en.json` من `lang/*/site.php` (232 مفتاح في كل لغة).
- الـ API بيرجّع «الافتراضي + اللي المالك عدّله» زي `Site::get()` بالظبط، وبيبدّل `{years}` و `{email}` و `{phone}`.
- «استرجاع الأصل» = حذف المفتاح من `settings`.

**الـ endpoints:**
- **عامة** (`/api/public/*`، للـ Next.js): `bootstrap?locale=` (التواصل، السوشيال، الـ SEO، المظهر، شاشة التحميل، قاموس النصوص)، `home`، `about`، `services`، `projects?category=`، `posts?page=`، `posts/{slug}`، `jobs`، `legal/{privacy|terms}`، `sitemap`.
- **الفورمين:** `POST contact` و `POST careers` (multipart + CV لحد 5MB، PDF/DOC/DOCX). فيهم validation برسايل باللغتين، و rate limit (بديل `throttle:forms`)، والـ CV بيتحفظ في فولدر خاص برا `wwwroot`.
- **اللوحة** (`/api/admin/*`): login / logout / me، و CRUD لكل الـ resources بصيغة Refine (`_start,_end,_sort,_order` + `X-Total-Count`)، ورفع الصور، والإعدادات `GET/PUT /settings/{group}` + reset، والإيميل التجريبي، وتحميل الـ CV، وإحصائيات الداشبورد، و mark-as-read للرسايل والطلبات.
- **OpenAPI** (المدمج في .NET 10) + Scalar للتجربة محلياً، ومنه `openapi-typescript` بيطلّع الـ types لـ `web` و `admin`، فالـ types تفضل متطابقة.

**تفاصيل:**
- **الدخول:** cookie auth. وكلمة السر بتاعة الأدمن الحالية (bcrypt `$2y$` من Laravel) هتفضل شغالة بـ `BCrypt.Net-Next`.
- **الصور:** وقت الرفع بتتحول WebP (زي `WebImage.php`) بـ **SkiaSharp** (MIT)، وبيتعمل منها مقاسات 400/800/1200 للـ `srcset` (ودي بتحل بند 13 في القايمة المفتوحة). المسارات النسبية زي ما هي (`projects/xxx.webp`)، فالصور القديمة هتتنقل كوبي من `public/uploads`.
- **محتوى المقالات (HTML):** بيتنضّف بـ `HtmlSanitizer` وقت الحفظ.
- **الإيميلات:** نفس القوالب التلاتة (رسالة جديدة، تأكيد للعميل، طلب توظيف) كـ Razor components بتترندر لـ HTML (`HtmlRenderer`). والإرسال بـ MailKit/SMTP أو Resend، وده بيتحدد من «البريد» في اللوحة. انظر قرار 7-2.
- **تحديث الموقع:** بعد أي حفظ في اللوحة، الـ API بيبعت لـ Next.js `POST /api/revalidate` (بـ secret + tags)، فالتعديل يظهر على طول.

---

## 4. الموقع العام (`web/`، Next.js)

- **الروابط نفسها بالظبط:** العربي على `/…` والإنجليزي على `/en/…`. الـ middleware بيعمل rewrite داخلي لـ `app/[locale]/…`، والـ `<html lang dir>` بيتظبط حسب اللغة.
- **التصميم:** الـ tokens والـ utilities بتتنقل من `resources/css/app.css` لـ `globals.css` (Tailwind 4 نفسه). والخط Cairo بـ `next/font` (self-hosted + preload، وده بيحل جزء من بند 13).
- **المكونات:** كل مكون Blade يقابله component: button، eyebrow، section-header، icon-tile، page-hero، cta-band، form field، logo، logo-mark، project-card، post-card، post-cover. وكمان header، footer، floating-contact، toast، pagination. الأيقونات: `lucide-react` (نفس الأسماء) و `simple-icons` للسوشيال.
- **الصفحات:** الرئيسية (9 أقسام بنفس ترتيب الإخفاء والإظهار وتبادل الخلفيات)، من نحن، الخدمات، الأعمال (فلتر)، المدونة + المقال، الوظائف، تواصل معنا، الخصوصية، الشروط، 404/500.
- **الفورمين:** Server Actions بتكلم الـ API من السيرفر (server-to-server بـ secret header، وبتبعت IP الزائر للـ rate limit). المتصفح مش بيكلم الـ API خالص، فمفيش CORS ولا مشكلة HTTP/HTTPS.
- **SEO:** `generateMetadata` لكل صفحة (عنوان، وصف، OG، hreflang ar/en، canonical)، و JSON-LD (Organization + Article)، و `sitemap.ts` و `robots.ts`. والبيانات بتيجي من «الظهور في جوجل».
- **الثيم:** فاتح / غامق / زي الجهاز، من غير flash (script في الـ head)، والافتراضي من الإعدادات.
- **شاشة التحميل:** نفس الحركة (CSS/JS inline). **الفرق:** التنقل في Next.js بيحصل من غير تحميل صفحة كاملة، فوضع `always` هيبقى «أول تحميل + لو الصفحة الجاية بطيئة» من خلال `loading.tsx`، مش إعادة تحميل كاملة زي Laravel.
- **الكاش:** fetch بـ tags + `revalidate` احتياطي كل ساعة.

---

## 5. لوحة التحكم (`admin/`، Refine + Ant Design)

- عربي RTL (`ConfigProvider direction="rtl"` + locale `ar_EG`)، بخط Cairo ولون `#0B63CE` واللوجو 2c.
- **Resources:** المشاريع، تصنيفات المشاريع، الخدمات (أيقونة + لون + رسم + مميزات + «الأكثر طلباً»)، المقالات (TipTap للـ HTML + تاريخ النشر)، الوظائف، آراء العملاء (نجوم + صورة)، رسائل التواصل (عرض + مقروء)، طلبات التوظيف (عرض + تحميل CV).
- **صفحات الإعدادات** (فيها حفظ ثابت + Ctrl+S + «استرجاع الأصل» + «عرض على الموقع»):
  - الرئيسية (8 تابات بنفس الحقول)
  - من نحن
  - نصوص الصفحات (232 مفتاح، بيتخزن بس اللي اختلف)
  - الخصوصية والشروط
  - بيانات التواصل
  - الظهور في جوجل (+ معاينة)
  - البريد (+ إيميل تجريبي)
  - المظهر وشاشة التحميل (+ معاينة حية)
- **الداشبورد:** تحية، إحصائيات، كروت «تعديل الموقع»، آخر الرسائل.
- **مقابل مكونات Filament:** Repeater ← `Form.List`، FileUpload ← `Upload`، ColorPicker ← `ColorPicker`، IconPicker ← `Select` بمعاينة lucide، RichEditor ← TipTap.

---

## 6. المراحل (كل مرحلة تخلص بـ build + تستات + commit)

| # | المرحلة | بتخلص بإيه |
|---|---|---|
| 0 | تجهيز الريبو والهيكل و git و CLAUDE.md | المشاريع التلاتة بتعمل build فاضية |
| 1 | تصدير المحتوى (JSON) + أداة النقل SQLite ← LocalDB + نقل الصور | الداتا في LocalDB بنفس الأعداد (17 مشروع، 8 خدمات، 6 مقالات، 5 وظايف، 4 آراء، 11 setting، 1 أدمن) |
| 2 | الـ API: الموديل، الإعدادات، الـ endpoints العامة، الفورمين، الإيميلات | تستات xUnit خضرا للـ endpoints العامة والفورمين |
| 3 | الموقع العام Next.js | كل الصفحات باللغتين، فاتح/غامق/موبايل، ومقارنة لقطة بلقطة مع Laravel |
| 4 | الـ API بتاع اللوحة (auth، CRUD، رفع، إعدادات) + لوحة Refine | الدخول بالحساب الحالي، و CRUD لكل resource، وحفظ كل صفحة إعدادات يبان على الموقع |
| 5 | البنود المفتوحة من المراجعة (قسم 9 في ملف المشروع) | اللي يخص الشكل بيتعمل وإحنا بننقل كل مكون، والباقي هنا |
| 6 | الرفع: الـ API على MonsterASP، والموقع على Vercel، و `DEPLOY.md` | الموقع شغال على الإنترنت |

**التستات:** xUnit للـ API (بديل الـ 118 تست اللي في Laravel، على قد ما ينطبق)، و Playwright smoke للموقع (كل صفحة باللغتين) وللوحة (login + CRUD + حفظ إعدادات).

**الذاكرة:** الجهاز ذاكرته قليلة، فهنشغّل حاجة واحدة بس في كل مرة (LocalDB + API، أو Next، أو Vite)، ومش هنشغلهم كلهم مع بعض.

---

## 7. قرارات محتاجة ردك

1. **مكان لوحة التحكم:** **المقترح** إنها تترفع مع الـ API على MonsterASP تحت `/admin` (نفس الدومين). كده الدخول بـ cookie آمن، ومفيش CORS، ورفع الصور الكبيرة مش هيعدي على Vercel. والبديل: مشروع تاني على Vercel، بس ساعتها هنحتاج CORS و token auth.
2. **الإيميلات:** صفحة MonsterASP بتقول إن الخطة المجانية **مش بتبعت إيميلات**. **المقترح:** Resend من خلال HTTP API (بورت 443، ومحتاجين نتأكد إن الخروج مسموح)، ولو مش مسموح، الإرسال يحصل من Next.js على Vercel.
3. **HTTPS على MonsterASP:** في الخطة المجانية بيتفعّل يدوي بتذكرة للدعم. لازم يتفعّل قبل ما اللوحة تشتغل أونلاين، عشان كلمة السر متتبعتش على HTTP.

---

## 8. حاجات لازم نتأكد منها وقت الرفع

- الاتصال بـ SQL Server بتاع MonsterASP من الجهاز (عشان `dotnet ef database update` أو نشغّل سكريبت SQL)، وإلا هنستورد من لوحتهم.
- صلاحية الكتابة على `wwwroot/uploads` وفولدر الـ CV.
- WebDeploy على البورت `:8172` صريح، وإن `web.config` ميتستبدلش.
