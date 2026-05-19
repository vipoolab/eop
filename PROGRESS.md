# 📊 EOP Development Progress

> **โครงการ:** EOP (Enterprise Operation Planning) — สำนักงานยุทธศาสตร์ตำรวจ
> **งบประมาณ TOR:** 92 ล้านบาท / 240 วัน / 4 งวด
> **Phase ปัจจุบัน:** Phase 1 MVP (Pre-PoC Demo)
> **อัปเดตล่าสุด:** 19 พ.ค. 2569

---

## 🎯 Overall Progress

```
Phase 1 MVP (7 วัน):  ████████░░░░░░░░░░░░  40%

✅ Foundation:        ████████████████████  100%
🔄 Day 1 (Auth + Nav): ██████████░░░░░░░░░░  50%
⏳ Day 2-7:            ░░░░░░░░░░░░░░░░░░░░  0%
```

---

## 👥 ทีม

| คน | บทบาท | สถานะ |
|---|---|---|
| **Hinkung** | Owner + Lead Developer | 🟢 Active |
| **(เพื่อน)** | Developer | ⏳ รอ invite |
| **Claude** | AI Pair Programmer | 🟢 Active |

---

## ✅ Decisions ที่ Approved แล้ว

| # | หัวข้อ | ตัดสิน | วันที่ |
|---|---|---|---|
| 1 | **Architecture** | Modular Monolith | 19 พ.ค. |
| 2 | **AI Provider** | Anthropic Claude API | 19 พ.ค. |
| 3 | **Git Host** | GitHub (Hinkung/EOP_DEMO) | 19 พ.ค. |
| 4 | **TOR Section 8/9** numbering | สลับให้ถูกต้องตาม TOR | 19 พ.ค. |

---

## ⏳ Decisions ที่รออนุมัติ (14 ข้อ)

ดูใน [`docs/PROPOSAL_ADDITIONS.md`](docs/PROPOSAL_ADDITIONS.md)

**Critical (เลือกก่อน continue dev):**
- [ ] Tech Stack (Next.js + TS + Tailwind + Prisma + Auth.js)
- [ ] 5 RBAC Roles (ADMIN/COMMANDER/STAFF/AUDITOR/VIEWER)
- [ ] 9 Workflow states (ตาม TOR เป๊ะ)

**Less urgent:**
- [ ] PWA vs React Native
- [ ] AI Prompt Cache
- [ ] External Integrations (TDID/สศช./ฯลฯ — นอก TOR)
- [ ] Audit Log Retention period
- [ ] Phase 2 Migration Path
- [ ] Slide Deck 60 หน้า
- [ ] Deploy Vercel public ก่อนวัน pitch

**ในเอกสาร:**
- [ ] เพิ่ม Cost Breakdown (HW 14M / SW 62.6M / อื่นๆ 14.2M) ใน paper
- [ ] เพิ่มรายชื่อกรรมการ + 3 บริษัทแหล่งราคา ใน paper

**Process:**
- [ ] ทำลิสต์คำถาม ~25 ข้อส่งไป สยศ.ตร.
- [ ] กำหนดลำดับการพัฒนา (7→6→1+4→2+3→5+8)
- [ ] Template Requirements Analysis 1 doc/program

---

## 📁 Files ที่สร้างแล้ว

### โครงสร้างโปรเจค

```
eop-demo/
├── 📚 docs/                    13 files
│   ├── SYSTEM_OVERVIEW_PAPER.md   ⭐ Paper หลัก v3.1
│   ├── DEV_PLAN_PER_PROGRAM.md    แผน dev 8 โปรแกรม
│   ├── PROJECT_BRIEF.md
│   ├── TOR_SUMMARY.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── CODING_STANDARD.md
│   ├── DEVELOPMENT_PLAN.md
│   ├── POC_REQUIREMENTS.md
│   ├── PROPOSAL_ADDITIONS.md      ข้อเสนอเพิ่ม รออนุมัติ
│   ├── PAPER_AUDIT.md
│   ├── PAPER_COMPARISON.md        เทียบกับ P_bird
│   └── PAPER_VERIFICATION_v3.md
│
├── 🎨 app/                     Next.js pages
│   ├── (app)/dashboard/        ✅ Dashboard เสร็จแล้ว
│   ├── (app)/layout.tsx        ✅ Sidebar + Header
│   ├── layout.tsx              ✅ Noto Sans Thai
│   └── page.tsx                ✅ Redirect → /dashboard
│
├── 🧩 components/              8 components
│   ├── sidebar.tsx             ✅
│   ├── header.tsx              ✅
│   ├── kpi-card.tsx            ✅
│   └── charts/                 ✅ 4 charts (Line/Bar/Pie/Map)
│
├── 📦 lib/                     3 utilities
│   ├── utils.ts                ✅
│   ├── nav-config.ts           ✅ 20-screen sitemap
│   └── mock-data.ts            ✅
│
├── 🗄️ prisma/
│   └── schema.prisma           ✅ 18 models
│
├── ⚙️ Config
│   ├── package.json
│   ├── tsconfig.json
│   ├── .gitignore              ✅
│   └── .env.example            ✅
│
└── 📊 PROGRESS.md              (this file)
```

---

## 🚀 Development Status — 7 Days Plan

### ✅ Day 0: Foundation (เสร็จแล้ว)
- [x] Setup Next.js 16 + React 19 + TypeScript + Tailwind v4
- [x] Install Prisma + Auth.js + Recharts + react-leaflet
- [x] Setup Noto Sans Thai font
- [x] Build Dashboard with KPI cards + 4 chart types
- [x] Create Sidebar nav (20 screens)
- [x] Create mock data + nav-config
- [x] Write Prisma schema (18 models)
- [x] Write comprehensive docs (13 .md files)
- [x] Setup Git repo + push to GitHub
- [x] Configure .gitignore (exclude .env, .mcp.json)

### 🔄 Day 1: DB + Auth + Routes (50%)
- [x] Prisma schema เขียนเสร็จ
- [ ] **TODO:** User ให้ Neon DB URL
- [ ] รัน `npx prisma migrate dev`
- [ ] เขียน `prisma/seed.ts` + รัน seed
- [ ] Setup Auth.js v5 + bcrypt
- [ ] สร้าง `app/login/page.tsx`
- [ ] สร้าง `middleware.ts` (auth + RBAC)
- [ ] อัปเดต Sidebar ใช้ nav-config 20 หน้า
- [ ] สร้าง placeholder pages 19 routes
- [ ] สร้าง TOR Reference Banner component

### ⏳ Day 2: Command CRUD + Workflow
- [ ] Command CRUD API + UI
- [ ] Workflow state machine (9 states)
- [ ] e-Signature stub
- [ ] Read Receipt + Smart Notification
- [ ] Audit Log integration
- [ ] Dashboard ดึง real data จาก DB

### ⏳ Day 3: AI Command Drafting (PoC 1)
- [ ] **TODO:** User ให้ Anthropic API key
- [ ] Setup Claude API client
- [ ] System prompt + few-shot examples
- [ ] API route `/api/ai/draft`
- [ ] UI: ฟอร์ม 5 ช่อง + streaming response
- [ ] Save draft → Command workflow
- [ ] Cache result

### ⏳ Day 4: Doc Classification (PoC 2)
- [ ] Upload DOCX/PDF
- [ ] Zero-shot classification via Claude
- [ ] UI: drop zone + 6-category result
- [ ] Save Document + result to DB

### ⏳ Day 5: OCR + Search (PoC 3)
- [ ] OCR pipeline (Claude Vision or PaddleOCR)
- [ ] CER calculator
- [ ] Search 4 modes (Basic/Advanced/Full-text/Semantic)
- [ ] Search index in DB

### ⏳ Day 6: Polish + Architecture
- [ ] Polish 13 scaffolded screens
- [ ] Architecture diagram page
- [ ] Mobile view demo
- [ ] TOR Coverage Matrix page

### ⏳ Day 7: Deploy + Rehearsal
- [ ] Create GitHub repo (✅ done)
- [ ] Connect Vercel
- [ ] Setup Neon production
- [ ] Smoke test 20 routes
- [ ] Dress rehearsal
- [ ] Backup plan + cached AI responses

---

## 🔑 ข้อมูลที่ User ต้องเตรียม

| รายการ | สำคัญ | สถานะ | Deadline |
|---|---|---|---|
| GitHub repo | ✅ | ✅ Done | - |
| Friend invitation | ⏳ | รอ Hinkung invite | - |
| Neon DB connection string | 🔴 | ❌ ยังไม่มี | Day 1 |
| Anthropic Claude API key | 🔴 | ❌ ยังไม่มี | Day 3 |
| Vercel account | 🟡 | ❌ ยังไม่มี | Day 7 |
| ทีม CV (10 คน) | 🟢 | ❌ ยังไม่มี | ก่อน pitch |

---

## 📈 Statistics

```
Total Files:     49
Total Lines:     ~15,000+ (mostly docs)
Git Commits:     2
Documentation:   ~250 KB (13 .md files)
Code:            ~5 KB (started)
```

---

## 🔗 Quick Links

- **Repo:** https://github.com/Hinkung/EOP_DEMO
- **Issues:** https://github.com/Hinkung/EOP_DEMO/issues
- **Settings → Access:** https://github.com/Hinkung/EOP_DEMO/settings/access
- **Paper หลัก:** [`docs/SYSTEM_OVERVIEW_PAPER.md`](docs/SYSTEM_OVERVIEW_PAPER.md)
- **Dev Plan:** [`docs/DEV_PLAN_PER_PROGRAM.md`](docs/DEV_PLAN_PER_PROGRAM.md)
- **Decisions รออนุมัติ:** [`docs/PROPOSAL_ADDITIONS.md`](docs/PROPOSAL_ADDITIONS.md)

---

## 💡 How to use this file

### สำหรับ Hinkung
- เปิดดูทุกเช้า ดูว่าเหลืออะไรต้องทำ
- update ตอนเสร็จงาน → commit + push

### สำหรับเพื่อน
- เปิดมาดูภาพรวมโครงการได้ทันที
- ดูว่ามีอะไรค้าง / อะไรเสร็จ

### สำหรับ Claude
- ใช้ track work + update เมื่อทำเสร็จ
- ใช้เป็น context สำหรับ session ต่อไป

---

## 📝 Changelog

| วันที่ | เหตุการณ์ |
|---|---|
| 19 พ.ค. 2569 | Setup foundation + 13 docs + GitHub push |
| 19 พ.ค. 2569 | Verify SYSTEM_OVERVIEW_PAPER.md vs TOR (v3.1) |
| 19 พ.ค. 2569 | Approve: Modular Monolith + Claude API |
| 19 พ.ค. 2569 | Create PROGRESS.md |
