# 🚀 Deployment Guide — EOP Demo

> วิธี deploy EOP ขึ้น Vercel + Supabase สำหรับ pre-PoC demo

---

## ✅ Pre-flight Checklist

- [ ] Code commit + push ขึ้น GitHub แล้ว
- [ ] Build local ผ่าน (`npm run build`)
- [ ] มี account Vercel (สมัครฟรีที่ vercel.com — login ด้วย GitHub ได้)
- [ ] **API keys ใหม่** (rotate ก่อน deploy production!)
  - [ ] Anthropic API key ใหม่ — https://console.anthropic.com/settings/keys
  - [ ] Supabase password ใหม่ — Project Settings → Database → Reset password

---

## 🏗️ Setup Vercel Project

### วิธีที่ 1 — ผ่าน Vercel Dashboard (แนะนำ)

1. ไปที่ https://vercel.com → **Add New** → **Project**
2. **Import Git Repository** → เลือก `Hinkung/EOP_DEMO`
3. กรอก settings:
   - **Framework Preset:** Next.js (auto-detect)
   - **Root Directory:** `eop-demo` ⚠️ (ถ้า repo root ไม่ใช่ eop-demo ต้อง set ตรงนี้)
   - **Build Command:** `prisma generate && next build` (default จาก vercel.json)
4. **Environment Variables** (สำคัญ! ใส่ก่อน deploy)
   ```
   DATABASE_URL          = postgresql://postgres:<new-password>@db.ycxlmxatpcqajpmknjvg.supabase.co:5432/postgres
   DIRECT_URL            = postgresql://postgres:<new-password>@db.ycxlmxatpcqajpmknjvg.supabase.co:5432/postgres
   AUTH_SECRET           = <generate ใหม่: openssl rand -base64 32>
   AUTH_URL              = https://<project-name>.vercel.app
   ANTHROPIC_API_KEY     = sk-ant-api03-<new-key>
   ```
5. กด **Deploy** — รอ ~3-5 นาที

### วิธีที่ 2 — ผ่าน CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login (เปิด browser)
vercel login

# 3. Link โปรเจค
cd eop-demo
vercel link

# 4. Set env vars (ทำทีละตัว)
vercel env add DATABASE_URL production
vercel env add AUTH_SECRET production
# ...

# 5. Deploy production
vercel --prod
```

---

## 🗄️ Setup Database (Supabase Production)

Supabase project เดิมใช้เป็น production ได้เลย — เพียงแต่:

1. **Rotate password** ที่ Project Settings → Database → Reset password
2. **อัปเดต DATABASE_URL** ใน Vercel env vars
3. **Run migration บน production:**
   ```bash
   # local terminal
   export DATABASE_URL="<production-url>"
   npx prisma migrate deploy
   ```
4. **Seed production data:**
   ```bash
   npm run db:seed
   ```

---

## 🔐 Generate New Secrets

```bash
# AUTH_SECRET (Auth.js JWT)
openssl rand -base64 32

# Anthropic API key
# → https://console.anthropic.com/settings/keys → Create Key

# Supabase password
# → Supabase Dashboard → Settings → Database → Reset password
```

---

## ✅ Post-Deploy Smoke Test

ไปที่ `https://<project>.vercel.app` แล้วทดสอบ:

- [ ] `/login` → render OK
- [ ] Login ด้วย `commander@eop.test` / `demo1234`
- [ ] `/dashboard` → KPI cards แสดงข้อมูลจริง
- [ ] `/command/workflow` → Kanban view 9 columns
- [ ] `/agenda/command-draft` → AI Draft ทำงานได้ (ลองส่ง 1 ครั้ง)
- [ ] `/ai/doc-classification` → upload .txt file ลองครั้งหนึ่ง
- [ ] `/ai/ocr` → upload JPG ลองครั้งหนึ่ง
- [ ] `/ai/search` → semantic search ลอง 1 query
- [ ] `/security/audit` → เห็น log ที่เราเพิ่งทำ

---

## ⚠️ Common Issues

### Build fails: "Prisma client not generated"
- ตรวจ `package.json` มี `postinstall: prisma generate`
- ตรวจ `vercel.json` มี `buildCommand: prisma generate && next build`

### "Connection timeout" จาก Supabase
- ใช้ **Pooler URL** (port 6543) แทน direct (5432) สำหรับ runtime
- เก็บ direct URL ไว้ที่ `DIRECT_URL` สำหรับ migration

### "ANTHROPIC_API_KEY not set"
- ใส่ใน Vercel env vars (Production scope)
- Restart deployment ใหม่หลังเพิ่ม env

### "Module not found: sharp"
- Vercel build จะติดตั้ง sharp อัตโนมัติ
- ถ้ายัง error ให้เพิ่มใน package.json: `"sharp": "^0.34.5"` (มีอยู่แล้ว)

---

## 💰 Cost (ฟรีเฟส)

| Service | Free Tier | Production Need |
|---|---|---|
| Vercel Hobby | 100 GB bandwidth/mo | OK สำหรับ demo |
| Supabase Free | 500 MB DB, 2 GB transfer | OK สำหรับ demo |
| Anthropic API | $5 trial credit | ~$0.10/demo session |
| **Total demo cost** | **ฟรี** | + ~$5/เดือน |

---

## 🆘 Backup Plan วันที่ pitch จริง

ถ้าวันที่ pitch มีปัญหา:
- **Internet ล่ม:** ใช้ recording video demo สำรอง (ทำไว้ล่วงหน้า)
- **API rate limit:** มี cached responses ใน DB สำหรับ 4 demo flow หลัก
- **Vercel down:** มี Plan B — รัน local บนเครื่องตัวเอง + ใช้ ngrok เปิด public URL

---

## 📞 Support

ถ้า deploy ติด ดูที่:
- Vercel logs: https://vercel.com/<your-team>/<project>/deployments
- Supabase logs: Supabase Dashboard → Logs
- GitHub Issues: https://github.com/Hinkung/EOP_DEMO/issues
