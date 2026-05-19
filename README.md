# EOP — Enterprise Operation Planning

ระบบวางแผนและติดตามการปฏิบัติงาน สำหรับสำนักงานยุทธศาสตร์ตำรวจ (สยศ.ตร.) สำนักงานตำรวจแห่งชาติ

> **โครงการนี้คืออะไร:** Web app ที่ครอบคลุม 7 ระบบหลักตาม TOR EOP — ใช้เป็น **ต้นแบบจริง** สำหรับเสนอกรรมการประมูลโครงการ 92 ล้านบาท ระยะเวลา 240 วัน
>
> **สถานะ:** Phase 1 MVP — Development in progress (Day 1 of 7)

---

## 📚 เอกสารโครงการ

ก่อนเริ่มแก้โค้ด **อ่านเอกสารต่อไปนี้ก่อน** เพื่อเข้าใจ context:

| ไฟล์ | เนื้อหา |
|---|---|
| [`docs/PROJECT_BRIEF.md`](docs/PROJECT_BRIEF.md) | ทำไมโปรเจคนี้มี / เป้าหมาย / กลุ่มเป้าหมาย / ข้อจำกัด |
| [`docs/TOR_SUMMARY.md`](docs/TOR_SUMMARY.md) | **สรุป TOR EOP ครบ 60 หน้า** — 7 ระบบ / hardware / PoC / scoring (อ่านอันนี้แรก) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | สถาปัตยกรรมระบบ + module structure + data flow |
| [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) | Prisma models + relationships |
| [`docs/API_SPEC.md`](docs/API_SPEC.md) | API conventions + response format |
| [`docs/CODING_STANDARD.md`](docs/CODING_STANDARD.md) | Naming + TypeScript style + folder structure |
| [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) | แผน 7 วัน + งานรายวัน |
| [`docs/POC_REQUIREMENTS.md`](docs/POC_REQUIREMENTS.md) | รายละเอียด PoC 4 ฟีเจอร์ + scoring rubric |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind v4 + Noto Sans Thai |
| UI Components | shadcn-style (custom) + lucide-react |
| Charts | Recharts (Line/Bar/Pie) + react-leaflet (GIS Map) |
| 3D | Three.js + React Three Fiber (XR mockup) |
| Backend | Next.js API Routes |
| ORM | Prisma |
| Database | PostgreSQL (Neon cloud) |
| Auth | Auth.js v5 + bcrypt |
| AI | Anthropic Claude API |
| Validation | Zod |
| Deploy | Vercel + Neon |

---

## 📁 Folder Structure

```
eop-demo/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated routes (with sidebar)
│   │   ├── dashboard/
│   │   ├── strategic/      # ระบบ 1
│   │   ├── agenda/         # ระบบ 2
│   │   ├── compliance/     # ระบบ 3
│   │   ├── command/        # ระบบ 4
│   │   ├── xr/             # ระบบ 5
│   │   ├── ai/             # ระบบ 6
│   │   ├── security/       # ระบบ 7
│   │   ├── architecture/   # Infra page
│   │   ├── mobile-demo/    # Responsive demo
│   │   └── tor-matrix/     # TOR coverage matrix
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── commands/
│   │   ├── ai/
│   │   └── search/
│   ├── login/              # Public login
│   ├── layout.tsx          # Root layout (Noto Sans Thai)
│   └── page.tsx            # Redirect to /dashboard
├── components/             # Shared UI components
│   ├── charts/             # Reusable chart components
│   ├── forms/              # Form components
│   ├── layout/             # Sidebar, Header
│   └── ui/                 # Buttons, Cards, Inputs
├── features/               # Business logic per domain
│   ├── auth/
│   ├── commands/
│   ├── strategic/
│   ├── compliance/
│   └── ai/
├── lib/                    # Shared utilities + services
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # Auth.js config
│   ├── anthropic.ts        # Claude API client
│   ├── utils.ts            # cn(), formatThaiNumber()
│   ├── nav-config.ts       # Sidebar navigation
│   └── mock-data.ts        # Seed data
├── prisma/
│   └── schema.prisma       # Database schema
├── docs/                   # Project documentation (อ่านก่อน!)
├── public/                 # Static assets
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+ (project tested on v24)
- npm v10+
- Neon Postgres account (free tier) — https://neon.tech
- Anthropic API key — https://console.anthropic.com/settings/keys

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Run migrations
npx prisma migrate dev

# 4. Seed initial data
npx prisma db seed

# 5. Start dev server
npm run dev
```

Open http://localhost:3000

### Default Login (after seed)
| Role | Email | Password |
|---|---|---|
| ผบ.ตร. (Commander) | commander@eop.test | demo1234 |
| ผกก. (Staff) | staff@eop.test | demo1234 |
| IT Admin | admin@eop.test | demo1234 |
| Auditor | auditor@eop.test | demo1234 |

---

## 📜 Available Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production build

npx prisma studio    # GUI for database
npx prisma migrate dev --name <name>  # Create migration
npx prisma db seed   # Re-seed database
npx prisma generate  # Regenerate Prisma client
```

---

## 🌐 Environment Variables

ดู `.env.example` สำหรับรายการเต็ม

หลักๆ ต้องมี:
- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — random 32-char string (gen: `openssl rand -base64 32`)
- `AUTH_URL` — http://localhost:3000 (dev) หรือ Vercel URL (prod)
- `ANTHROPIC_API_KEY` — Claude API key

---

## 🎯 TOR Coverage

โครงการนี้ครอบคลุม **TOR EOP ทุกข้อ** ผ่าน 20 หน้าในระบบเดียว:

| โปรแกรม (TOR) | จำนวนหน้า | Live AI |
|---|---|---|
| ระบบ 1 Strategic | 2 | - |
| ระบบ 2 Agenda | 3 | ⭐ Command Drafting |
| ระบบ 3 Compliance | 2 | - |
| ระบบ 4 Command | 2 | - |
| ระบบ 5 XR | 1 | - |
| ระบบ 6 Data & AI | 4 | ⭐ Doc Class + OCR + Search |
| ระบบ 7 Infra/Security | 2 | - |
| Architecture + Mobile + TOR Matrix | 3 | - |
| Dashboard ภาพรวม | 1 | - |
| **รวม** | **20 หน้า** | **4 live AI** |

ดูรายละเอียด: [`docs/TOR_SUMMARY.md`](docs/TOR_SUMMARY.md)

---

## ⚠️ Common Issues

| ปัญหา | วิธีแก้ |
|---|---|
| `Prisma client not generated` | `npx prisma generate` |
| `Database connection refused` | ตรวจ `DATABASE_URL` ใน `.env.local` |
| `AUTH_SECRET is undefined` | gen ด้วย `openssl rand -base64 32` |
| Map ไม่ขึ้น | ตรวจว่า `leaflet/dist/leaflet.css` import แล้ว |
| Thai font ไม่ทำงาน | restart dev server หลังเปลี่ยน `app/layout.tsx` |

---

## 🤝 Working with Claude (AI Pair Programmer)

อ่าน [`docs/CODING_STANDARD.md`](docs/CODING_STANDARD.md) ก่อนเริ่มทำงานกับ Claude

หลักการ:
- ให้ Claude อ่าน `docs/` ก่อนเขียนโค้ด
- ระบุ scope ชัด ห้ามแก้ไฟล์ไหน
- ขอ code เต็มไฟล์ ห้ามตัด
- หลังเสร็จ ขอให้ describe ว่าแก้ไฟล์ไหนบ้าง

---

## 📝 License & Confidentiality

โครงการนี้เป็น proposal สำหรับสำนักงานตำรวจแห่งชาติ — เนื้อหาในเอกสารเป็นข้อมูลสาธารณะที่อ้างอิงจาก TOR และข่าวกิจการตำรวจที่เผยแพร่แล้ว — ห้ามนำข้อมูลผู้ใช้จริงเข้าระบบจนกว่าจะมี PDPA consent ครบ
