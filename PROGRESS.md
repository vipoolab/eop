# 📊 EOP Development Progress

> **โครงการ:** EOP (Enterprise Operation Planning) — สำนักงานยุทธศาสตร์ตำรวจ
> **งบประมาณ TOR:** 92 ล้านบาท / 240 วัน / 4 งวด
> **Phase ปัจจุบัน:** Phase 1 MVP (Pre-PoC Demo)
> **อัปเดตล่าสุด:** 19 พ.ค. 2569

---

## 🎯 Overall Progress

```
Phase 1 MVP (7 วัน):  ████████████████░░░░  75%

✅ Foundation:         ████████████████████ 100%
✅ Day 1 (Auth + Nav): ████████████████████ 100%
✅ Day 2 (Command):    ████████████████████ 100%
✅ Day 3 (AI Draft):   ████████████████████ 100%
⏳ Day 4-7:            ░░░░░░░░░░░░░░░░░░░░  0%
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

### ✅ Day 1: DB + Auth + Routes (100%)
- [x] Prisma schema เขียนเสร็จ (18 models)
- [x] Setup **Supabase** PostgreSQL (cloud)
- [x] รัน `npx prisma migrate dev` — migration 0001 applied
- [x] เขียน `prisma/seed.ts` + รัน seed (5 users + 6 units + plans + KPIs)
- [x] Setup Auth.js v5 + bcrypt + Credentials provider + JWT (8h)
- [x] สร้าง `app/login/page.tsx` (with Suspense)
- [x] สร้าง `proxy.ts` (auth + redirect to /login) — Next.js 16
- [x] อัปเดต Sidebar ใช้ `nav-config.ts` 20 หน้า
- [x] สร้าง 19 placeholder pages พร้อม TOR Banner
- [x] สร้าง TOR Reference Banner component
- [x] Audit Log writes on login (success + fail)

### ✅ Day 2: Command CRUD + Workflow (100%)
- [x] `features/commands/` foundation (types, workflow, validators, repository, service)
- [x] **9-state workflow** state machine (TOR 4.1) — DRAFT → SUBMITTED → APPROVED → PUBLISHED → ACKNOWLEDGED → IN_PROGRESS → REPORTED → AUDITED → CLOSED
- [x] RBAC per transition (ADMIN/COMMANDER/STAFF/AUDITOR/VIEWER)
- [x] API: `GET/POST /api/commands` (list + create with pagination + filters)
- [x] API: `GET /api/commands/[id]` (detail with relations)
- [x] API: `POST /api/commands/[id]/transition` (state transition)
- [x] UI: Kanban view `/command/workflow` (9 columns with cards)
- [x] UI: Detail `/command/workflow/[id]` (full content + status history + transition buttons)
- [x] UI: Create form `/command/workflow/new` (subject/body/units/priority/mission)
- [x] e-Signature stub (signerId saved on approve, publishedAt on publish, closedAt on close)
- [x] Read Receipt UI (per-unit acknowledged + acknowledgedAt timestamp)
- [x] Audit Log writes ทุก action (create + transition + target acknowledge + delete)
- [x] Dashboard ดึง **real data** จาก DB (totals, status breakdown, audit log)
- [x] Seed 9 sample commands ครบ 9 สถานะ พร้อม Thai docNo (ตร ๐๐๐๑.๖๙/...)

### ✅ Day 3: AI Command Drafting (PoC 1) — 100%
- [x] User ให้ Anthropic API key
- [x] ติดตั้ง `@anthropic-ai/sdk`
- [x] สร้าง `lib/claude.ts` (lazy singleton + smart env resolution)
- [x] สร้าง `features/ai/command-draft.ts` (Thai police system prompt)
- [x] สร้าง `features/ai/validators.ts` (Zod schema)
- [x] API route `POST /api/ai/draft` (with RBAC + audit log)
- [x] UI: ฟอร์ม 5 ช่อง + ผลลัพธ์ side-by-side
- [x] 4 Presets ตาม TOR 2.2.2 (ก่อเหตุ/ภัยพิบัติ/งานสำคัญพิเศษ/งานทั่วไป)
- [x] Save draft → Command workflow (via sessionStorage prefill)
- [x] Audit log บันทึก token usage + elapsed time
- [x] Model: claude-haiku-4-5 (เร็ว + ราคาถูก สำหรับ demo)
- [x] Test script `scripts/test-claude.ts` (end-to-end verify ผ่าน)

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
| 19 พ.ค. 2569 | Day 1.1: Sidebar 20 routes + placeholder pages + TOR Banner |
| 19 พ.ค. 2569 | Day 1.2: Supabase + Prisma 7 + adapter-pg + migrate + seed |
| 19 พ.ค. 2569 | Day 1.3: Auth.js v5 + Login page + proxy.ts (Next 16) + audit log |
| 19 พ.ค. 2569 | Day 2: Command CRUD + 9-state workflow + Kanban UI + Real Dashboard |
| 20 พ.ค. 2569 | Day 3: AI Command Drafting (PoC 1) — Claude Haiku 4.5 + 4 presets |
