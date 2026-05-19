# Architecture — EOP Web App

> สถาปัตยกรรมของ EOP MVP — สำหรับ Claude/dev ที่ต้องเข้าใจว่าระบบทำงานยังไง ก่อนแก้โค้ด

---

## 1. หลักการออกแบบ

### 1.1 Modular Monolith — ไม่ใช่ Microservices (ตอนเริ่ม)

- **1 codebase** Next.js App ครบทุกระบบ
- **แยก module ภายใน** — ทำให้แยกเป็น microservices ภายหลังได้ง่าย
- เหตุผล: ทีมเล็ก (1 dev + Claude) / เวลา 7 วัน / ต้อง deploy ง่าย / data sharing ระหว่างระบบเยอะ

### 1.2 รวม Web App เดียว — ไม่แยก 7 apps

ดู [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) มาตรา 3 + [`TOR_SUMMARY.md`](TOR_SUMMARY.md) มาตรา 2 — เหตุผล:
- ผู้ใช้คนเดียวกันใช้หลายระบบในวันเดียว
- ข้อมูล cross-system (Command ใช้ใน 4 → 1 → 3 → 6 → 7)
- TOR ไม่บังคับให้แยก
- ระบบ 7 (Security) ต้อง intercept ทุก request → ต้องอยู่ที่เดียว

### 1.3 Responsive + PWA ตอบ Mobile (TOR 5.5)

- Web app ใช้ **Tailwind responsive utilities** (`sm:`, `md:`, `lg:`)
- เป็น **PWA** (Progressive Web App) ที่ติดตั้งบนมือถือได้เหมือน native
- ไม่ต้อง React Native — ประหยัดเวลา

---

## 2. High-level Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Client Layer                                           │
│  - Browser (Desktop / Tablet / Mobile via PWA)          │
│  - Future: Native iOS/Android (Phase 2)                 │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│  Next.js App Router (Vercel Edge + Node runtime)        │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Middleware (next.config / middleware.ts)          │  │
│  │  - Auth check (Auth.js session)                   │  │
│  │  - RBAC enforcement                               │  │
│  │  - Audit log injection                            │  │
│  │  - CORS / Rate limit                              │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                  │
│  ┌───────────────────▼───────────────────────────────┐  │
│  │  Pages (app/)                                     │  │
│  │  ├─ (app)/dashboard/                              │  │
│  │  ├─ (app)/strategic/* — ระบบ 1                    │  │
│  │  ├─ (app)/agenda/*    — ระบบ 2                    │  │
│  │  ├─ (app)/compliance/* — ระบบ 3                   │  │
│  │  ├─ (app)/command/*   — ระบบ 4                    │  │
│  │  ├─ (app)/xr/         — ระบบ 5                    │  │
│  │  ├─ (app)/ai/*        — ระบบ 6                    │  │
│  │  └─ (app)/security/*  — ระบบ 7                    │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  API Routes (app/api/)                            │  │
│  │  ├─ /api/auth/* (Auth.js)                         │  │
│  │  ├─ /api/commands/* (CRUD + workflow)             │  │
│  │  ├─ /api/missions/*                               │  │
│  │  ├─ /api/documents/*                              │  │
│  │  ├─ /api/ai/draft (Claude — ระบบ 2)               │  │
│  │  ├─ /api/ai/classify (Claude — ระบบ 6)            │  │
│  │  ├─ /api/ai/ocr (mock/PaddleOCR — ระบบ 6)         │  │
│  │  ├─ /api/search (semantic — ระบบ 6)               │  │
│  │  └─ /api/audit-log                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Service Layer (features/*/service.ts)            │  │
│  │  - Business logic per domain                      │  │
│  │  - Validation (Zod)                               │  │
│  │  - Authorization checks                           │  │
│  │  - Audit log writes                               │  │
│  └───────────────────┬───────────────────────────────┘  │
│                      │                                  │
│  ┌───────────────────▼───────────────────────────────┐  │
│  │  Repository Layer (features/*/repository.ts)      │  │
│  │  - Prisma queries                                 │  │
│  │  - Pure data access                               │  │
│  └───────────────────┬───────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────┘
                       │ TCP/SSL
┌──────────────────────▼──────────────────────────────────┐
│  Postgres (Neon Cloud)                                  │
│  - Prisma schema (18-20 tables)                         │
│  - pgvector extension (for semantic search)             │
└─────────────────────────────────────────────────────────┘

External Services
┌─────────────────────────────────────────────────────────┐
│  - Anthropic Claude API  (AI features)                  │
│  - Mapbox / OpenStreetMap (GIS)                         │
│  - Future: API 191, CCTV, ข่าวกรอง (TOR 6.4)            │
│  - Future: TDID/TDA (e-Signature — TOR 4.x)             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Module Structure (Code Organization)

ตามหลักการ §14 ของ [Full Stack Best Practices](../full_stack_programmer_best_practices.md):

```
eop-demo/
├── app/                                 # Next.js App Router
│   ├── (app)/                          # Authenticated routes (with sidebar)
│   │   ├── layout.tsx                  # Sidebar + Header
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── strategic/                  # ระบบ 1
│   │   │   ├── alignment/page.tsx
│   │   │   └── kpi/page.tsx
│   │   ├── agenda/                     # ระบบ 2
│   │   │   ├── missions/page.tsx
│   │   │   ├── command-draft/page.tsx
│   │   │   └── form-builder/page.tsx
│   │   ├── compliance/                 # ระบบ 3
│   │   │   ├── reports/page.tsx
│   │   │   └── self-assessment/page.tsx
│   │   ├── command/                    # ระบบ 4
│   │   │   ├── workflow/page.tsx
│   │   │   └── incident/page.tsx
│   │   ├── xr/page.tsx                 # ระบบ 5
│   │   ├── ai/                         # ระบบ 6
│   │   │   ├── doc-classification/page.tsx
│   │   │   ├── ocr/page.tsx
│   │   │   ├── search/page.tsx
│   │   │   └── predictive/page.tsx
│   │   ├── security/                   # ระบบ 7
│   │   │   ├── audit/page.tsx
│   │   │   └── access/page.tsx
│   │   ├── architecture/page.tsx
│   │   ├── mobile-demo/page.tsx
│   │   └── tor-matrix/page.tsx
│   ├── api/                            # API Routes
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── commands/
│   │   │   ├── route.ts                # GET (list) + POST (create)
│   │   │   └── [id]/route.ts           # GET + PATCH + DELETE
│   │   ├── ai/
│   │   │   ├── draft/route.ts          # POST — call Claude
│   │   │   ├── classify/route.ts
│   │   │   └── ocr/route.ts
│   │   └── search/route.ts
│   ├── login/page.tsx
│   ├── layout.tsx                      # Root layout (Noto Sans Thai)
│   ├── page.tsx                        # Redirect to /dashboard
│   └── globals.css
├── components/                         # Shared UI components
│   ├── charts/
│   │   ├── command-line-chart.tsx
│   │   ├── unit-bar-chart.tsx
│   │   ├── status-pie-chart.tsx
│   │   └── incident-map.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── header.tsx
│   ├── ui/                             # Reusable primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   └── tor-banner.tsx             # NEW — แสดง TOR ref ทุกหน้า
│   └── forms/
│       └── command-form.tsx
├── features/                           # Business logic per domain
│   ├── auth/
│   │   ├── service.ts
│   │   └── types.ts
│   ├── commands/
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   ├── workflow.ts                # State machine 9 sts
│   │   ├── validators.ts              # Zod schemas
│   │   └── types.ts
│   ├── strategic/
│   ├── agenda/
│   ├── compliance/
│   ├── data-ai/
│   └── security/
├── lib/                                # Shared utilities
│   ├── prisma.ts                       # Prisma client singleton
│   ├── auth.ts                         # Auth.js config
│   ├── anthropic.ts                    # Claude API client
│   ├── utils.ts                        # cn(), formatThaiNumber()
│   ├── nav-config.ts                   # Sidebar nav
│   └── mock-data.ts                    # Seed data (จะลด)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── docs/                               # อ่านก่อนเริ่ม!
├── public/
└── middleware.ts                       # Auth + RBAC + Audit
```

---

## 4. Module Boundaries — ใครเรียกใครได้

### กฎ:
1. **Pages** เรียก **Service Layer** เท่านั้น (ไม่ direct Prisma)
2. **Service Layer** เรียก **Repository Layer** (Prisma)
3. **API Routes** เรียก **Service Layer**
4. **Service ระบบ 1** ไม่ import โดยตรงจาก **Service ระบบ 4** — ผ่าน shared types หรือ events

### Data Flow ตัวอย่าง: สร้างคำสั่งใหม่ผ่าน AI

```
User กดปุ่ม "Generate" บน /agenda/command-draft
  ↓
Page เรียก fetch('/api/ai/draft', { method: 'POST', body: 5 keywords })
  ↓
API Route /api/ai/draft/route.ts
  ↓
features/agenda/ai-draft.service.ts (validate + call Claude)
  ↓
lib/anthropic.ts (HTTP call to Claude API)
  ↓
return draft text
  ↓
User edits → กดปุ่ม "Save Draft"
  ↓
fetch('/api/commands', { method: 'POST', body: { ... } })
  ↓
API Route /api/commands/route.ts
  ↓
features/commands/service.ts:
  - validate (Zod)
  - check RBAC (commander role only)
  - call repository.create()
  - write audit log
  - return Command
  ↓
features/commands/repository.ts:
  - prisma.command.create()
  ↓
Postgres saves
  ↓
Response → Page redirects to /command/workflow/{id}
```

---

## 5. State Machine: Command Workflow

ระบบ 4 หัวใจคือ workflow 9 สถานะ:

```
       ┌──────────┐
       │ 1. DRAFT │ ◄────────────────────── (สร้างใหม่)
       └─────┬────┘
             │ submit
             ▼
       ┌──────────────┐
       │ 2. SUBMITTED │
       └──────┬───────┘
              │ approve (Commander)
              ▼
       ┌──────────────┐
       │ 3. APPROVED  │
       └──────┬───────┘
              │ publish (auto หรือ manual)
              ▼
       ┌──────────────┐
       │ 4. PUBLISHED │ ───► notify targets
       └──────┬───────┘
              │ each target acknowledges (Read Receipt)
              ▼
       ┌─────────────────┐
       │ 5. ACKNOWLEDGED │ (when all targets ack)
       └──────┬──────────┘
              │ start execution
              ▼
       ┌─────────────────┐
       │ 6. IN_PROGRESS  │
       └──────┬──────────┘
              │ submit result (each target)
              ▼
       ┌──────────────┐
       │ 7. REPORTED  │
       └──────┬───────┘
              │ audit (Auditor role)
              ▼
       ┌──────────────┐
       │ 8. AUDITED   │
       └──────┬───────┘
              │ close
              ▼
       ┌──────────────┐
       │  9. CLOSED   │
       └──────────────┘
```

Implemented in: `features/commands/workflow.ts`

**Auto-Escalation:** ถ้า acknowledged หรือ in_progress ค้างเกิน threshold → notify หน่วยเหนือ (TOR 4.5)

---

## 6. Security Architecture (ระบบ 7)

### Layers

```
Request → Middleware → API Route → Service → Repository → DB

ทุก request ผ่าน middleware ที่:
1. ตรวจสอบ session (Auth.js)
2. ตรวจสอบ role (RBAC)
3. Log request (Audit)
4. Rate limit (optional)
```

### RBAC Matrix

| Role | Strategic | Agenda | Compliance | Command | XR | Data/AI | Security |
|---|---|---|---|---|---|---|---|
| ADMIN | RW | RW | RW | RW | RW | RW | RW |
| COMMANDER | RW | RW | R | RW | RW | RW | R |
| STAFF | R | R/W (own) | R | R/W (own) | - | R | - |
| AUDITOR | R | R | R | R | - | R | R |
| VIEWER | R | R | R | R | - | R | - |

R = Read, RW = Read/Write

### Audit Log

ทุก action → write to `AuditLog` table:
- userId
- action (e.g., `command.create`, `auth.login`, `doc.upload`)
- target (e.g., `command:cln1234abc`)
- ip, ua
- details (JSON)
- createdAt

---

## 7. External Integration (Future)

| Service | Module | Status |
|---|---|---|
| Claude API | ระบบ 2 (Draft) + ระบบ 6 (Classify) | Phase 1 ✓ |
| Mapbox / OSM | ระบบ 6 (GIS) | Phase 1 ✓ |
| API 191 | ระบบ 6 (Incident) | Phase 2 (mock ใน Phase 1) |
| CCTV stream | ระบบ 5 + 6 | Phase 3 |
| TDID/TDA e-Signature | ระบบ 4 | Phase 2 (mock ใน Phase 1) |
| สศช. ยุทธศาสตร์ API | ระบบ 1 | Phase 2 (manual import ใน Phase 1) |

---

## 8. Deployment Architecture

```
GitHub repo (eop-tor)
   ↓ push to main
Vercel (auto deploy)
   ↓
- Static assets → CDN
- API Routes → Edge / Node runtime
- Pages → SSR
   ↓
Neon Postgres (us-east-1 or asia-southeast)
```

### Environment Separation

| Env | Domain | DB | Branch |
|---|---|---|---|
| local | localhost:3000 | local Postgres or Neon dev | feature/* |
| staging | eop-staging.vercel.app | Neon dev | develop |
| production | eop-tor.vercel.app | Neon prod | main |

---

## 9. Decisions Log (ADR — Architecture Decision Records)

### ADR-001: Monolith over Microservices
**Date:** Day 1
**Decision:** Modular Monolith
**Why:** ทีม 1 คน + 7 วัน + data sharing เยอะ → microservices ไม่คุ้ม

### ADR-002: Next.js full-stack over separate frontend+backend
**Date:** Day 1
**Decision:** Next.js (frontend + API routes)
**Why:** ลด complexity / Vercel deploy ง่าย / TypeScript shared types ระหว่าง client+server

### ADR-003: Postgres over MongoDB
**Date:** Day 1
**Decision:** Postgres + Prisma
**Why:** relational data หนัก (Command → CommandTarget → User → Unit) / pgvector รองรับ semantic search

### ADR-004: PWA over React Native for mobile
**Date:** Day 1
**Decision:** PWA + Responsive
**Why:** เวลาไม่พอเขียนแยก / 1 codebase ครอบคลุมหมด / TOR 5.5 ผ่าน

### ADR-005: Claude API over Local LLM
**Date:** Day 1
**Decision:** Anthropic Claude API
**Why:** ภาษาไทยดี / accuracy สูง / setup เร็ว / no GPU need
**Trade-off:** ผูกกับ Anthropic / ต้องมี API key / cost per call

### ADR-006: 20 screens (Tier 1 + Tier 2)
**Date:** Day 1
**Decision:** 7 real-functional + 13 scaffolded
**Why:** ครอบคลุม TOR 100% (visual) + functional 35% ในเวลา 7 วัน

---

## 10. Performance Considerations

### Database
- Index on: User.email, Command.status, Command.creatorId, AuditLog.userId, AuditLog.createdAt
- Pagination ทุก list endpoint (default 20/page)
- N+1 prevention: ใช้ `include` ใน Prisma แบบมีสติ

### Frontend
- React Server Components ทุกที่ที่ทำได้ — ลด JS bundle
- Client component เฉพาะที่มี interaction
- Lazy load: Three.js scene + Map component (dynamic import)

### AI Calls
- Cache result ใน DB (column `aiPromptUsed`)
- Stream response แสดง typing effect
- Timeout 30 sec + fallback message

---

## 11. Future Migration Path

ถ้าชนะประมูล + ต้องขึ้น production จริง:

| Phase | งาน |
|---|---|
| Phase 2 (week 2-8) | เพิ่ม integration จริง (191, e-Signature) + Mobile native (React Native) |
| Phase 3 (week 9-16) | XR Unity production + GPU server setup + OCR self-hosted |
| Phase 4 (week 17-24) | Microservices split (ถ้าโหลดมาก) + Multi-region + DR |
| Phase 5 (week 25-34) | UAT + Training + Documentation final + Handover |

---

## 12. Glossary

| Term | คำอธิบาย |
|---|---|
| EOP | Enterprise Operation Planning — ชื่อโครงการ |
| สยศ.ตร. | สำนักงานยุทธศาสตร์ตำรวจ |
| CII | Critical Information Infrastructure — โครงสร้างพื้นฐานสำคัญของชาติ |
| RBAC | Role-Based Access Control |
| MFA | Multi-Factor Authentication |
| TOR | Terms of Reference — ขอบเขตงาน |
| PoC | Proof of Concept |
| ก.พ.ร. | สำนักงานคณะกรรมการพัฒนาระบบราชการ |
| ITA | Integrity & Transparency Assessment |
| PMQA | Public Management Quality Award |
| CER | Character Error Rate (ใน OCR) |
| สศช. | สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ |
| อช. | สำนักข่าวกรองแห่งชาติ |
