# رفع موقع كودلك

> الـ API ولوحة التحكم على **MonsterASP**، والموقع العام على **Vercel**.
> أي كلمة سر أو مفتاح بيتكتب في لوحة MonsterASP أو Vercel بس. **متحطوش في git ولا تبعته في الشات.**

## الصورة الكاملة

| الجزء | فين | العنوان |
|---|---|---|
| الـ API + لوحة التحكم | MonsterASP | `https://<api-host>` (اللوحة على `https://<api-host>/admin`) |
| الداتابيز | MonsterASP (MSSQL) | بيوصلها الـ API بس |
| الموقع (Next.js) | Vercel | `https://<الدومين>` |

**الترتيب مهم:** الداتابيز ← الـ API ← HTTPS ← Vercel ← ربط الاتنين ببعض ← تغيير حساب الأدمن.
السبب إن Vercel وهو بيعمل build بيقرا المحتوى من الـ API، فلازم الـ API يكون شغال الأول.

---

## 1. على جهازك قبل الرفع

1. اتأكد إن التستات خضرا:
   ```bash
   cd api && dotnet test Codlek.slnx
   ```
2. اعمل publish للـ API واللوحة مع بعض. السكريبت بيعمل build للوحة، وبعدين `dotnet publish`، والناتج بيبقى في `out\api`:
   ```bash
   powershell -ExecutionPolicy Bypass -File deploy/publish-api.ps1 -WithUploads -Zip
   ```
   - `-WithUploads`: بيضيف صور المشاريع والخدمات الموجودة عندك. استخدمه **أول مرة بس**.
   - `-Zip`: بيعمل كمان `out\codlek-api.zip` لو هترفع من الـ File Manager.
   - الـ publish مش بيشيل فولدر `wwwroot/uploads` ولا `storage/` ولا `appsettings.Development.json`، فمفيش رفع هيمسح صور السيرفر أو يستبدلها.

---

## 2. MonsterASP

### 2.1 الموقع
- Control Panel ← Websites ← موقعك. اتأكد إن الموقع شغال على **.NET 10** (من إعدادات الـ .NET version في الموقع).

### 2.2 الداتابيز
1. Databases ← اعمل داتابيز **MSSQL** جديدة، وانسخ الـ connection string بتاعها.
2. انقل الداتا. فيه طريقتين:

**أ) أداة النقل من جهازك (الأسهل):**
1. فعّل الوصول من بره: الداتابيز ← Users and remote ← **Enabled**، وخد الـ remote connection string.
2. خد نسخة من `database.sqlite` بتاعة Laravel (**النسخة، مش الأصل**) وشغّل:
   ```bash
   cd api
   dotnet run --project tools/Codlek.Import -- --sqlite <مسار النسخة> --connection "<remote connection string>"
   ```
   الأداة بتعمل الجداول (migrations) وبتنقل كل الداتا بنفس الـ IDs، وبتطبع عدد الصفوف في كل جدول.
3. **اقفل الوصول من بره تاني** بعد ما تخلص (Disabled).

**ب) من غير وصول من بره ولا كلمة سر (اللي اتعمل في أول رفع):**
1. ارفع الـ API الأول وشغّله مرة، و `Codlek__MigrateOnStartup=true`، فهو بيعمل الجداول فاضية.
2. على جهازك، اطلّع الداتا من LocalDB لملف SQL:
   ```bash
   powershell -ExecutionPolicy Bypass -File deploy/export-data.ps1
   ```
   الناتج بيبقى `out/codlek-data.sql`، وفيه INSERTs بنفس الـ IDs.
3. في MonsterASP: الداتابيز ← WebMSSQL ← **Open Adminer** (بيدخل لوحده) ← **Import** ← اختار الملف ← **Execute**.
4. اعمل **Restart** للتطبيق، لأن الإعدادات بتتحفظ في الذاكرة من أول تشغيل، فلازم يقراها من جديد.

ودي نفس الطريقة لو عدّلت محتوى من اللوحة المحلية وعايز تنقله زي ما هو، بشرط إن الجداول على السيرفر تكون فاضية.

### 2.3 الإعدادات (Environment variables)
Control Panel ← Websites ← موقعك ← **Scripting** ← **Environment variables** ← اكتب الاسم والقيمة ← **Add**، وفي الآخر **Restart application**.
النقطتين اللي في أسماء الإعدادات بتتكتب `__` (اتنين underscore).

| الاسم | القيمة | ملاحظات |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` | متسيبهاش أبداً `Development` على السيرفر |
| `ConnectionStrings__Default` | الـ connection string الداخلي بتاع الداتابيز | الاسم بالظبط كده. القيمة من صفحة الداتابيز ← Local access ← Show with password (مش بتاع الـ remote) |
| `Codlek__PublicUrl` | `https://<api-host>` | من غير `/` في الآخر. روابط الصور بتتبني منه |
| `Codlek__SiteUrl` | `https://<الدومين>` | الموقع على Vercel. بيُستخدم في الإيميلات وزرار «عرض الموقع» |
| `Codlek__CorsOrigins` | `https://<الدومين>,https://www.<الدومين>` | العناوين اللي الفورمين بيبعتوا منها. ضيف `https://<project>.vercel.app` لو هتجرب عليه |
| `Codlek__RevalidateUrl` | `https://<الدومين>/api/revalidate` | الـ API بيكلمه بعد كل حفظ في اللوحة عشان الموقع يتحدث على طول |
| `Codlek__RevalidateSecret` | كلمة سر طويلة عشوائية | **نفس القيمة** في `REVALIDATE_SECRET` على Vercel |
| `Codlek__MigrateOnStartup` | `true` | أي تعديل في شكل الداتابيز في التحديثات الجاية بيتطبق لوحده مع أول تشغيل |
| `Mail__Driver` | `resend` أو `smtp` أو `log` | `log` يعني من غير إرسال (الرسايل بتتحفظ في اللوحة عادي) |
| `Mail__FromAddress` | `no-reply@<الدومين>` | لازم الدومين يكون متأكد منه في Resend |
| `Mail__FromName` | `Codlek` | |
| `Mail__ResendApiKey` | `re_...` | لو `Mail__Driver=resend` |
| `Mail__Smtp__Host` / `__Port` / `__Username` / `__Password` | بيانات الـ SMTP | لو `Mail__Driver=smtp` (الخطة المجانية مفيهاش إيميلات، فـ Resend أضمن لأنه بيبعت على HTTPS) |

كلمة سر عشوائية للـ revalidate (PowerShell):
```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); -join ($b | % { $_.ToString('x2') })
```

> لو لوحة MonsterASP مش بتحفظ الـ Environment variables لأي سبب، البديل: انسخ `deploy/appsettings.Production.example.json` على السيرفر باسم `appsettings.Production.json` جنب `Codlek.Api.dll` واملاه هناك. الملف ده عمره ما يتحط في git، والـ publish مش بيرفعه ولا بيمسحه.

### 2.4 رفع الملفات
اختار طريقة من دول:
- **WebDeploy:** فعّله من Deploy في اللوحة. اكتب البورت صريح في العنوان (`:8172`). **متعلّمش** على «Remove additional files at destination»، عشان دي هتمسح الصور والـ CVs.
- **File Manager:** ارفع `out\codlek-api.zip` جوه `/wwwroot` واعمله Extract.
- **FTP:** ارفع محتوى `out\api` جوه `/wwwroot`.

ملاحظات:
- السيرفر لازم يكون عنده صلاحية كتابة على `wwwroot/uploads` (صور اللوحة) و `storage/` (الـ CVs ومفاتيح تسجيل الدخول). هتتأكد في الخطوة 4 لما ترفع صورة.
- الـ `web.config` بيطلع لوحده من الـ publish. متعدلش فيه.

### 2.5 HTTPS (قبل أي دخول للوحة)
موقعك ← **HTTPS** ← **Enable HTTPS** (شهادة Let's Encrypt مجانية بتتجدد لوحدها)، وبعدين فعّل **HTTPS Redirect**. **لازم يتفعّل قبل أول دخول للوحة** عشان كلمة السر متتبعتش على HTTP. وكمان الموقع على Vercel شغال HTTPS، فالمتصفح هيرفض يبعت الفورم أو يعرض الصور من API شغال HTTP.

> التطبيق على MonsterASP شغال 32-bit (x86) افتراضياً، والـ publish فيه المكتبات اللي محتاجها (`runtimes/win-x86`).

### 2.6 اتأكد إن الـ API شغال
- `https://<api-host>/api/health` ← `{"status":"ok"}`
- `https://<api-host>/api/public/ar/site` ← JSON فيه بيانات الموقع
- `https://<api-host>/admin` ← صفحة الدخول

---

## 3. Vercel

1. ارفع الكود على GitHub، وبعدين في Vercel: **Add New ← Project** ← اختار الريبو.
2. Settings ← Build and Deployment:
   - **Root Directory:** `web`.
   - **Framework Preset:** **Next.js**. لو فاضل **Other**، الـ build بيخلص في ثانيتين والموقع كله بيطلع «This page doesn't exist».
3. Settings ← General ← **Node.js Version:** `22.x` (Next 16 محتاج 20.9 أو أحدث).
4. **Environment Variables** (Production):

| الاسم | القيمة |
|---|---|
| `API_URL` | `https://<api-host>` |
| `NEXT_PUBLIC_API_URL` | `https://<api-host>` |
| `NEXT_PUBLIC_SITE_URL` | `https://<الدومين>` |
| `REVALIDATE_SECRET` | نفس `Codlek__RevalidateSecret` |

5. **Deploy.** الـ build بيقرا المحتوى من الـ API، فلو فشل اتأكد إن `https://<api-host>/api/health` شغال.
6. الدومين: Settings ← Domains ← ضيف الدومين واعمل الـ DNS records اللي Vercel بيقولها.
7. لما الدومين يشتغل: رجّع لـ MonsterASP وحدّث `Codlek__SiteUrl` و `Codlek__CorsOrigins` و `Codlek__RevalidateUrl`، وبعدين **Restart application**.

---

## 4. أول دخول للوحة

1. افتح `https://<api-host>/admin` وادخل بالحساب اللي اتنقل مع الداتا.
2. **على طول:** دوس على اسمك فوق ← **حسابي** ← غيّر الإيميل وكلمة السر (10 حروف على الأقل). أي جهاز تاني كان داخل بالحساب ده بيتعمله خروج.
3. ارفع صورة تجربة (مثلاً صورة عميل في «آراء العملاء»)، وامسحها. لو الرفع فشل، يبقى مفيش صلاحية كتابة على `wwwroot/uploads` (كلّم الدعم).
4. غيّر نص صغير (مثلاً «بيانات التواصل») واحفظ، وافتح الموقع: التعديل لازم يظهر في ثواني. لو مظهرش، راجع `Codlek__RevalidateUrl` و `REVALIDATE_SECRET`.

---

## 5. Checklist بعد الرفع

- [ ] كل الصفحات بالعربي و `/en/...` بالإنجليزي، فاتح وغامق، وعلى الموبايل.
- [ ] الصور (المشاريع، الخدمات، العملاء) ظاهرة وروابطها `https://`.
- [ ] فورم التواصل: الرسالة بتظهر في اللوحة ← الوارد، والإيميل بيوصل (لو الإرسال متفعّل).
- [ ] فورم التوظيف مع CV (لحد 5MB): الطلب بيظهر في اللوحة والـ CV بيتحمّل.
- [ ] حفظ أي صفحة من اللوحة بيبان على الموقع.
- [ ] `https://<الدومين>/sitemap.xml` و `robots.txt` فيهم الدومين الصح.

---

## 6. التحديثات بعد كده

- **محتوى:** من اللوحة. مفيش رفع.
- **الموقع:** push على GitHub، و Vercel بيعمل build لوحده.
- **الـ API أو اللوحة:** شغّل السكريبت تاني **من غير** `-WithUploads`، وارفع `out\api` (من غير ما تمسح `wwwroot/uploads` و `storage/` من السيرفر). لو فيه migration جديدة، `Codlek__MigrateOnStartup` بيطبقها مع أول تشغيل.

---

## 7. مشاكل متوقعة

| العرض | الحل |
|---|---|
| صفحة HTTP Error 500.30 / 500.31 | غالباً نسخة .NET على الموقع مش 10، أو إعداد ناقص. للتشخيص: في `web.config` خلّي `stdoutLogEnabled="true"`، واعمل فولدر `logs`، واقرا آخر ملف فيه، وبعدين رجّعها `false`. |
| الفورم بيطلع رسالة خطأ عامة، وفي الـ Console بتاع المتصفح فيه CORS error | `Codlek__CorsOrigins` لازم يطابق عنوان الموقع بالظبط (https + الدومين، من غير `/` في الآخر). |
| الصور مش ظاهرة على الموقع | `Codlek__PublicUrl` لازم يبقى `https://<api-host>`. |
| اللوحة بتعمل خروج لوحدها كتير | فولدر `storage/keys` مش بيتكتب فيه (صلاحيات). |
| الإيميلات مش بتوصل | راجع `Mail__Driver` والمفتاح. الرسايل بتتحفظ في اللوحة في كل الأحوال. |
| «محاولات كتير» بتظهر لزوار كتير مع بعض | معناها إن MonsterASP شغال ورا proxy وكل الزوار طالعين بنفس الـ IP. ابعتلي وأظبط قراءة الـ IP. |
