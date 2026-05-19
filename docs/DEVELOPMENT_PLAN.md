# Development Plan — 7 Days to Demo

> แผนรายวันสำหรับสร้าง EOP Web App ภายใน 7 วัน
>
> **อย่าลืม:** อ่าน [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) + [`TOR_SUMMARY.md`](TOR_SUMMARY.md) ก่อนเริ่ม

---

## ภาพรวม

| Goal | สร้าง real web app ที่ครอบคลุม TOR ทุกข้อ + 7 ฟีเจอร์ทำงานจริง |
|---|---|
| Team | Broccolie (Solo) + Claude (AI pair) |
| Days | 7 |
| Output | Vercel URL + 60 slides + script |

---

## Status (อัปเดตเมื่อทำงาน)

| Day | สถานะ | ผลงาน |
|---|---|---|
| Day 1 | 🟡 In Progress | Setup Next.js + Tailwind + Mock Dashboard + Prisma schema + docs |
| Day 2 | ⏳ Pending | - |
| Day 3 | ⏳ Pending | - |
| Day 4 | ⏳ Pending | - |
| Day 5 | ⏳ Pending | - |
| Day 6 | ⏳ Pending | - |
| Day 7 | ⏳ Pending | - |

---

## 📅 Day 1: Foundation (DB + Auth + Sidebar 20-screen)

### Goal
ระบบมี skeleton ครบ — login ได้ + navigate 20 หน้า + ดู Dashboard mock data

### Tasks
- [x] `npx create-next-app` + Tailwind v4 + TypeScript
- [x] Install Prisma + Auth.js + Recharts + Leaflet + lucide-react
- [x] เขียน Prisma schema 18 models
- [x] สร้าง `lib/utils.ts`, `lib/mock-data.ts`, `lib/nav-config.ts`
- [x] สร้าง `app/layout.tsx` ด้วย Noto Sans Thai
- [x] สร้าง `app/(app)/layout.tsx` ด้วย Sidebar + Header
- [x] สร้าง `components/sidebar.tsx`, `components/header.tsx`
- [x] สร้าง `components/kpi-card.tsx` + 4 chart components
- [x] สร้าง `app/(app)/dashboard/page.tsx` (mock data)
- [x] เขียน docs 8 ไฟล์ (PROJECT_BRIEF, TOR_SUMMARY, ARCHITECTURE, DATABASE_SCHEMA, API_SPEC, CODING_STANDARD, DEVELOPMENT_PLAN, POC_REQUIREMENTS)
- [ ] User ให้ Neon DB URL → ใส่ใน `.env.local`
- [ ] รัน `npx prisma migrate dev --name init`
- [ ] เขียน `prisma/seed.ts` + รัน `npx prisma db seed`
- [ ] Setup Auth.js v5 (credentials provider + bcrypt)
- [ ] สร้าง `app/login/page.tsx` + login form
- [ ] สร้าง `middleware.ts` (auth check)
- [ ] สร้าง `lib/audit.ts` — helper สำหรับเขียน AuditLog
- [ ] อัปเดต `components/sidebar.tsx` ให้ใช้ `nav-config.ts` (20 screens)
- [ ] สร้าง placeholder page ทุกหน้า 19 routes (รอ implement)
- [ ] สร้าง `components/ui/tor-banner.tsx`
- [ ] Commit: "feat: complete Day 1 foundation"

### Deliverables
- Login flow working
- Sidebar shows 20 screens (with TOR ref)
- ทุกหน้า navigate ได้ (placeholder content)
- Database seeded with 8 users + 6 units + 20 missions + 50 commands

### Dependencies
- ⚠️ ต้องมี `DATABASE_URL` (Neon)

---

## 📅 Day 2: Command CRUD + Workflow

### Goal
ผู้ใช้สร้างคำสั่งใหม่ได้ → ส่ง → อนุมัติ → เผยแพร่ → ติดตาม Read Receipt — 9 states flow ครบ

### Tasks
- [ ] `features/commands/types.ts` — TypeScript types
- [ ] `features/commands/validators.ts` — Zod schemas
- [ ] `features/commands/workflow.ts` — State machine 9 states
- [ ] `features/commands/repository.ts` — Prisma queries
- [ ] `features/commands/service.ts` — Business logic + RBAC + Audit
- [ ] API: `app/api/commands/route.ts` (GET list + POST create)
- [ ] API: `app/api/commands/[id]/route.ts` (GET + PATCH + DELETE)
- [ ] API: `app/api/commands/[id]/submit/route.ts`
- [ ] API: `app/api/commands/[id]/approve/route.ts`
- [ ] API: `app/api/commands/[id]/publish/route.ts`
- [ ] API: `app/api/commands/[id]/acknowledge/route.ts`
- [ ] API: `app/api/commands/[id]/report/route.ts`
- [ ] API: `app/api/commands/[id]/audit/route.ts`
- [ ] API: `app/api/commands/[id]/close/route.ts`
- [ ] Page: `app/(app)/command/workflow/page.tsx` — Kanban 9 columns
- [ ] Component: `components/forms/command-form.tsx`
- [ ] Component: `components/command-card.tsx`
- [ ] Connect Dashboard ให้ดึง real data จาก DB
- [ ] อัปเดต Dashboard charts ให้ดึงจาก aggregated query
- [ ] Audit log สำหรับทุก action

### Deliverables
- Login → สร้างคำสั่งใหม่ → submit → approve → publish ได้
- Kanban view เห็นทุก state ของคำสั่ง
- Dashboard แสดงข้อมูลจริงจาก DB
- Audit log ทำงาน (เห็นใน DB)

---

## 📅 Day 3: AI Command Drafting

### Goal
PoC 1 ทำงาน — ใส่ keyword 5 ช่อง → Claude API ร่างหนังสือราชการ → save draft → ส่งเข้า workflow

### Tasks
- [ ] User ให้ Anthropic API key → ใส่ใน `.env.local`
- [ ] Install `@anthropic-ai/sdk`
- [ ] `lib/anthropic.ts` — Claude client
- [ ] `features/agenda/ai-draft.service.ts`
- [ ] System prompt + few-shot examples ของหนังสือราชการ
- [ ] API: `app/api/ai/draft/route.ts` (POST)
- [ ] Page: `app/(app)/agenda/command-draft/page.tsx`
- [ ] Form 5 ช่อง: หัวเรื่อง / หน่วยรับ / วัตถุประสงค์ / ข้อสั่งการ / ระยะเวลา
- [ ] Streaming response (typing effect)
- [ ] ปุ่ม Regenerate / Edit / Save Draft / Export DOCX
- [ ] Save draft → ส่งเข้า workflow (เปลี่ยนเป็น `DRAFT` command)
- [ ] Cache result (ลด API cost + speed)
- [ ] Fallback ถ้า API down → cached mock
- [ ] Page: `app/(app)/agenda/missions/page.tsx` (scaffolded UI list of missions)

### Deliverables
- PoC 1 ทำงาน end-to-end
- ใส่ keyword → AI ร่าง → save → เข้า workflow

---

## 📅 Day 4: Document Classification

### Goal
PoC 2 ทำงาน — Upload DOCX → AI จำแนก 6 หมวด → save DB

### Tasks
- [ ] Install `mammoth` (DOCX → text)
- [ ] `features/data-ai/classification.service.ts`
- [ ] `features/data-ai/extract-text.ts` — DOCX + PDF → text
- [ ] API: `app/api/documents/route.ts` (POST upload)
- [ ] API: `app/api/ai/classify/route.ts` (POST classify)
- [ ] Storage: เก็บไฟล์ใน `public/uploads/` (local) — TODO: S3 ใน Phase 2
- [ ] Page: `app/(app)/ai/doc-classification/page.tsx`
- [ ] UI: Drop zone + preview + 6-category confidence bars
- [ ] Approach: Zero-shot via Claude (no fine-tune in 7 days)
  - System prompt: อธิบาย 6 หมวด + ขอ JSON return
- [ ] Save Document + result to DB
- [ ] Page: `app/(app)/agenda/form-builder/page.tsx` (scaffolded)
- [ ] Page: `app/(app)/compliance/reports/page.tsx` (scaffolded)
- [ ] Page: `app/(app)/compliance/self-assessment/page.tsx` (scaffolded)

### Deliverables
- PoC 2 ทำงาน end-to-end
- Upload DOCX → predicted unit + confidence
- 3 scaffolded screens สำหรับ Compliance + Form Builder

---

## 📅 Day 5: OCR + Intelligent Search (4 modes)

### Goal
- PoC 3 ทำงาน (OCR + CER calc)
- Search 4 modes ทำงาน (Basic / Advanced / Full-text / Semantic)

### Tasks (OCR)
- [ ] Approach: ใน 7 วัน ใช้ Mock + Typhoon Vision (สมัคร) หรือ PaddleOCR cloud
- [ ] หรือ: ใช้ Claude Vision (รองรับภาพ + Thai)
- [ ] API: `app/api/ai/ocr/route.ts`
- [ ] `features/data-ai/ocr.service.ts`
- [ ] CER calculator: `lib/cer.ts` — Levenshtein based
- [ ] Page: `app/(app)/ai/ocr/page.tsx`
- [ ] UI: Upload PDF → side-by-side image + extracted text + CER

### Tasks (Search)
- [ ] `features/data-ai/search.service.ts` — 4 modes
- [ ] Mode 1 Basic: `LIKE '%query%'` ใน Postgres
- [ ] Mode 2 Advanced: filter by date/unit/status
- [ ] Mode 3 Full-text: Postgres `to_tsvector` + `to_tsquery`
- [ ] Mode 4 Semantic: Claude embedding API + manual cosine (no pgvector in Phase 1)
- [ ] API: `app/api/search/route.ts` (GET ?mode=&q=)
- [ ] Page: `app/(app)/ai/search/page.tsx` — Tabs + results
- [ ] Background job: เมื่อสร้าง Command/Document → เพิ่ม SearchEntry

### Deliverables
- PoC 3 ทำงาน — OCR + CER แสดง
- Search 4 modes ทำงาน

---

## 📅 Day 6: Polish 13 Scaffolded Screens + Special Pages

### Goal
ทุกหน้าใน sidebar เปิดได้ ดูเป็น production + Architecture diagram + Mobile demo + TOR Matrix

### Tasks
- [ ] ระบบ 1: `strategic/alignment` + `strategic/kpi` — เสริม visualization
- [ ] ระบบ 2: `agenda/missions` polish
- [ ] ระบบ 3: `compliance/reports` + `self-assessment` polish
- [ ] ระบบ 4: `command/incident` — Incident table + map
- [ ] ระบบ 5: `xr` — Three.js scene (3D room with virtual screens) + 60-sec video embed
- [ ] ระบบ 6: `ai/predictive` — forecast chart + executive summary mock
- [ ] ระบบ 7: `security/audit` — Audit log table (real data!)
- [ ] ระบบ 7: `security/access` — User management table (real data)
- [ ] `architecture` — Interactive diagram showing 9 nodes + Internet 2 ชุด
- [ ] `mobile-demo` — Responsive showcase (iframe ขนาดมือถือ)
- [ ] `tor-matrix` — Table: TOR clause → screen → status (live/scaffolded)
- [ ] เพิ่ม `Loading` + `Empty state` + `Error state` ทุกหน้า

### Deliverables
- 20 หน้าสมบูรณ์ทุกหน้า
- ทุกหน้ามี TOR banner
- Audit log + User management ใช้ DB จริง

---

## 📅 Day 7: Deploy + Dress Rehearsal

### Goal
URL public พร้อมใช้ + ซ้อมพูด + plan B พร้อม

### Tasks
- [ ] Create GitHub repo (private)
- [ ] Push code
- [ ] Connect Vercel project to GitHub
- [ ] Setup environment variables ใน Vercel
- [ ] Setup Neon production database
- [ ] Run migrations on prod DB
- [ ] Seed prod DB
- [ ] Test deploy
- [ ] Custom domain (optional): `eop-tor.vercel.app` หรือ custom
- [ ] Setup error tracking (Sentry — free tier)
- [ ] Smoke test all 20 routes
- [ ] Cache common AI prompts
- [ ] Pre-record fallback video (in case AI down)
- [ ] เขียน script presentation 60 นาที (ผมช่วยร่าง)
- [ ] Dress rehearsal 2-3 รอบ
- [ ] เตรียม plan B:
  - laptop สำรอง 1 เครื่อง
  - mobile hotspot
  - cached AI responses (10 ตัวอย่าง)
  - screen-recorded backup video

### Deliverables
- URL public พร้อม
- Script presentation
- Plan B พร้อมทุกอย่าง

---

## 🎯 Strategic Priorities

### MUST HAVE (ห้ามขาด)
1. Login + Audit Log ทำงาน
2. AI Command Drafting working
3. AI Doc Classification working
4. OCR + CER calc working
5. Search semantic working
6. Dashboard ดูดีจาก real data
7. Command Workflow 9 states working
8. Deploy บน Vercel
9. 20 หน้า navigation ครบ

### NICE TO HAVE
- Three.js XR scene (มี → ดี, ไม่มี → video เท่านั้น)
- Audit log filter + search
- KPI cascading drill-down
- Form Builder drag-drop
- Predictive analytics chart

### CUT IF NO TIME
- pgvector setup (ใช้ embedding + manual cosine แทน)
- Compliance auto-generate (mock template ก็พอ)
- Incident map detail (basic map)
- Mobile-specific PWA features (offline, push)

---

## 🚨 Risk Tracking

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Neon DB connection issue | Low | High | Backup: SQLite + Prisma migrate reset |
| Claude API rate limit | Med | High | Cache 20 common requests |
| OCR CER >10% บนเอกสาร ตร. จริง | High | Med | บอกตรงๆ + แสดง roadmap improvement |
| Vercel deploy fail | Low | High | localhost backup + ngrok tunnel |
| ทำไม่ทันบางหน้า | Med | Med | Scaffolded UI (อ่านได้ ทำงานไม่ได้) |
| AI ตอบช้า | Med | Med | Streaming + cache + 30s timeout |
| Mobile แสดงเพี้ยน | High | Low | Test ที่ Chrome DevTools mobile view |

---

## 📊 Daily Standup (Self Check)

ทุกวันจบ ถามตัวเอง:
1. วันนี้ทำอะไรเสร็จ?
2. มี blocker ไหม?
3. พรุ่งนี้จะทำอะไร?
4. ยังครอบ TOR ครบมั้ย?

อัปเดต Status table ด้านบน

---

## 🔄 If Off-Track

ถ้าทำตามแผนไม่ทัน:

### Day 2-3 ทำไม่ทัน
→ ย้าย Doc Class ไป Day 4-5 / ลด feature ของ Command workflow

### Day 4 ทำไม่ทัน
→ Doc Class ใช้ mock บางส่วน (Claude classify เฉพาะข้อความสั้น)

### Day 5 ทำไม่ทัน
→ OCR = mock + show CER 7-8% (ใส่ pre-calculated)

### Day 6 ทำไม่ทัน
→ 13 scaffolded screens แค่มี TOR banner + 1 hero text + 1 ภาพ

### Day 7 ทำไม่ทัน
→ Deploy localhost + screen record + ใช้ video แทน live demo

---

## ✅ Final Checklist (Before Pitch)

- [ ] URL เปิดได้
- [ ] Login ได้ทั้ง 5 roles
- [ ] ทุก 20 หน้า navigate ได้ ไม่ติด
- [ ] PoC 1 (AI Command) ทำงาน
- [ ] PoC 2 (Doc Class) ทำงาน
- [ ] PoC 3 (OCR) แสดง CER
- [ ] PoC 4 (XR) เปิด Three.js scene ได้
- [ ] Search semantic ใช้ได้
- [ ] Dashboard อัปเดต real-time
- [ ] Audit log แสดงเหตุการณ์ล่าสุด
- [ ] TOR Coverage Matrix สมบูรณ์
- [ ] Mobile view เปิดได้
- [ ] Architecture diagram เปิดได้
- [ ] No `console.log` ของ sensitive data
- [ ] No `.env` ใน git
- [ ] Backup plan พร้อม
