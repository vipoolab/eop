# Coding Standard — EOP

> มาตรฐานการเขียนโค้ดของโปรเจค + กฎสำหรับการทำงานกับ Claude (AI pair programmer)
>
> อ้างอิงจาก: Full Stack Programmer Best Practices (full_stack_programmer_best_practices.md)

---

## 1. หลักการ 5 ข้อ

1. **อ่านง่ายกว่าฉลาดเกิน** — โค้ดที่คนอื่นอ่านเข้าใจ > โค้ดที่ optimize 0.001 ms
2. **ฟังก์ชันทำหน้าที่เดียว** — function หนึ่งทำหนึ่งอย่าง / max 30 บรรทัด
3. **ตั้งชื่อให้สื่อความหมาย** — `calculateCommandStatus()` ดีกว่า `calc()`
4. **ไม่เชื่อ input** — validate ทุก input ที่มาจาก client
5. **ไม่ leak ข้อมูลลับ** — ไม่ใส่ secret ใน code / ไม่ log password / ไม่ throw stack trace ให้ user

---

## 2. Language: TypeScript

### 2.1 บังคับใช้
- `strict: true` ใน `tsconfig.json`
- `noImplicitAny: true`
- `strictNullChecks: true`

### 2.2 ห้าม
- ❌ `any` (ใช้ `unknown` แล้วค่อย narrow)
- ❌ `// @ts-ignore` (ใช้ `@ts-expect-error` ถ้าจำเป็น + comment เหตุผล)
- ❌ Non-null assertion `!.` ถ้าไม่จำเป็น (preferred: optional chaining `?.`)

### 2.3 Type Definition
```typescript
// ✅ ดี
interface Command {
  id: string;
  subject: string;
  status: CommandStatus;
  createdAt: Date;
}

type CommandStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | ...;

// ❌ หลีกเลี่ยง
type Command = any;
function getCommand(id): any { ... }
```

### 2.4 Function Signatures
```typescript
// ✅ ดี — explicit return type
async function fetchCommand(id: string): Promise<Command | null> {
  const command = await prisma.command.findUnique({ where: { id } });
  return command;
}

// ⚠️ acceptable แต่ไม่แนะนำ
async function fetchCommand(id: string) {
  return await prisma.command.findUnique({ where: { id } });
}
```

---

## 3. Naming Convention

### 3.1 Files & Folders
- Folders: `kebab-case` (เช่น `command-draft/`, `doc-classification/`)
- Components: `PascalCase.tsx` (เช่น `CommandCard.tsx`)
- Utilities: `camelCase.ts` (เช่น `formatDate.ts`)
- Pages (Next.js): `page.tsx`, `layout.tsx` (Next.js convention)
- Server actions/services: `service.ts`, `repository.ts`

### 3.2 Variables & Functions
```typescript
// Variables: camelCase
const commandList = await fetchCommands();
const isCompleted = command.status === "CLOSED";

// Functions: camelCase, verb + noun
async function createCommand(input: CreateCommandInput): Promise<Command> { ... }
function formatCommandDocNo(num: number): string { ... }
function calculateCer(predicted: string, truth: string): number { ... }

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const COMMAND_TIMEOUT_MS = 30_000;

// Types/Interfaces: PascalCase
interface CommandFilters { ... }
type CommandStatus = "DRAFT" | ...;
```

### 3.3 Boolean Naming
- ใช้ prefix `is`, `has`, `should`, `can`
- ✅ `isActive`, `hasPermission`, `shouldRetry`, `canApprove`
- ❌ `active`, `permission`, `retry`

### 3.4 Database (Prisma)
- Model: `PascalCase` (`User`, `CommandTarget`)
- Field: `camelCase` (`createdAt`, `userId`)
- Enum: `SCREAMING_SNAKE_CASE` value (`DRAFT`, `IN_PROGRESS`)

---

## 4. Folder Structure (อ้างอิงจาก ARCHITECTURE.md)

```
app/                    # Next.js pages + API routes
components/             # Shared UI (no business logic)
features/<domain>/      # Business logic per domain
  ├─ service.ts         # use cases
  ├─ repository.ts      # data access
  ├─ validators.ts      # Zod schemas
  ├─ types.ts           # domain types
  └─ workflow.ts        # state machines (if applicable)
lib/                    # Shared infrastructure (prisma, auth, ai client)
hooks/                  # React hooks
```

### กฎ Import Boundary
```
app → components, features, lib
features → lib, other features (rare)
components → lib (utilities only)
lib → standalone (no app/features import)
```

---

## 5. Component Patterns

### 5.1 Server vs Client Component

**Default: Server Component** (ไม่มี `"use client"`)
- Read DB, fetch, static content
- Better for SEO + performance

**Client Component** (มี `"use client"`)
- Interaction (onClick, useState, useEffect)
- Hooks (Recharts, Leaflet)
- Browser APIs

### 5.2 Component Structure

```tsx
// ✅ ดี
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createCommand } from "@/features/commands/actions";
import type { Command } from "@/features/commands/types";

interface CommandFormProps {
  initial?: Command;
  onSuccess?: (cmd: Command) => void;
}

export function CommandForm({ initial, onSuccess }: CommandFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    try {
      const result = await createCommand(formData);
      onSuccess?.(result);
    } catch (err) {
      // Show user-friendly error
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit}>
      {/* ... */}
    </form>
  );
}
```

### 5.3 Component Size
- Max ~150 บรรทัด/ไฟล์
- ถ้าใหญ่กว่า → แยก sub-components หรือ extract hooks

### 5.4 ห้าม
- ❌ Business logic ในหน้า UI
- ❌ Direct Prisma call ใน component (ใช้ service layer)
- ❌ Inline magic numbers (ใช้ named constants)

---

## 6. Error Handling

### 6.1 Server-side

```typescript
// ✅ ดี
try {
  const result = await prisma.command.create({ data });
  return { success: true, data: result };
} catch (err) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      throw new ApiError(409, "เลขที่หนังสือซ้ำในระบบ");
    }
  }
  console.error("Failed to create command:", err);
  throw new ApiError(500, "ไม่สามารถสร้างคำสั่งได้ กรุณาลองใหม่");
}

// ❌ หลีกเลี่ยง
try {
  return await prisma.command.create({ data });
} catch (e) {
  throw e; // ใช้ default error → leak stack trace
}
```

### 6.2 Client-side

```typescript
// ✅ ดี
try {
  const res = await fetch("/api/commands", { method: "POST", body });
  const json = await res.json();

  if (!res.ok) {
    toast.error(json.message ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    return;
  }

  toast.success("บันทึกสำเร็จ");
} catch (err) {
  toast.error("ไม่สามารถเชื่อมต่อระบบได้");
}
```

### 6.3 User-Facing Messages
- ✅ ภาษาไทย / ใช้งานเข้าใจง่าย
- ❌ technical jargon / stack trace

| ✅ ดี | ❌ ไม่ดี |
|---|---|
| "ไม่สามารถบันทึกข้อมูลได้ กรุณาตรวจสอบและลองใหม่" | "Error: P2002 unique constraint violation" |
| "เซสชันหมดอายุ กรุณา login ใหม่" | "JWT expired at 2026-05-19T..." |
| "ไฟล์ใหญ่เกินไป (สูงสุด 10 MB)" | "ENOMEM cannot allocate buffer" |

---

## 7. Validation

ทุก input จาก client → ผ่าน Zod:

```typescript
// features/commands/validators.ts
import { z } from "zod";

export const createCommandSchema = z.object({
  subject: z.string().min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร").max(200),
  body: z.string().min(10, "เนื้อหาต้องมีอย่างน้อย 10 ตัวอักษร"),
  targetUnitIds: z.array(z.string().cuid()).min(1, "ต้องระบุหน่วยรับอย่างน้อย 1 หน่วย"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"]).default("NORMAL"),
});
```

- ใช้ Thai message ที่ user เห็น
- Reuse schema ทั้ง client + server (Zod รัน 2 ฝั่งได้)

---

## 8. Database Access

### 8.1 ใช้ Prisma เท่านั้น (ไม่ raw SQL)
- Type-safe
- Prevent SQL injection
- Migration system

ยกเว้น: pgvector similarity search (ต้อง raw SQL — เฉพาะกรณีนั้น)

### 8.2 Pagination เสมอ

```typescript
// ✅ ดี
async function listCommands(filters: Filters, page = 1, pageSize = 20) {
  const [items, total] = await Promise.all([
    prisma.command.findMany({
      where: filters,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.command.count({ where: filters }),
  ]);
  return { items, total, page, pageSize };
}

// ❌ อันตราย
async function listCommands() {
  return prisma.command.findMany(); // อาจ load 10,000 records!
}
```

### 8.3 หลีกเลี่ยง N+1

```typescript
// ✅ ดี — 1 query
const commands = await prisma.command.findMany({
  include: { creator: true, targets: { include: { unit: true } } },
});

// ❌ N+1 — 1 + N queries
const commands = await prisma.command.findMany();
for (const cmd of commands) {
  cmd.creator = await prisma.user.findUnique({ where: { id: cmd.creatorId } });
}
```

### 8.4 Transactions

```typescript
// ✅ ดี — atomic
await prisma.$transaction(async (tx) => {
  const cmd = await tx.command.create({ data });
  await tx.commandTarget.createMany({ data: targets });
  await tx.commandStatusLog.create({ data: log });
});
```

---

## 9. Security Checklist (every PR/commit)

- [ ] Passwords hashed with bcrypt (cost ≥ 10)
- [ ] No secrets ใน source code (use `.env`)
- [ ] All API endpoints check auth + role
- [ ] All user input validated with Zod
- [ ] No `dangerouslySetInnerHTML` กับ user input
- [ ] File upload: check mime + size + sanitize filename
- [ ] No `console.log` ของ password/token/PII
- [ ] CORS configured for production domain only
- [ ] Audit log written for all write operations

---

## 10. Git Convention

### 10.1 Commit Messages

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

**Types:**
- `feat` — new feature
- `fix` — bug fix
- `refactor` — restructure code (no behavior change)
- `docs` — documentation only
- `style` — formatting (no logic change)
- `test` — add/fix tests
- `chore` — build/dependencies/config

**Examples:**
```
feat(commands): add AI-assisted command drafting
fix(auth): handle expired session correctly
refactor(strategic): extract KPI calculation to service
docs(architecture): update module structure diagram
```

### 10.2 Branch Names

```
feature/<area>-<short-desc>      e.g., feature/command-drafting
fix/<area>-<short-desc>          e.g., fix/auth-redirect
refactor/<area>-<desc>           e.g., refactor/extract-prisma
hotfix/<short-desc>              e.g., hotfix/dashboard-crash
```

### 10.3 ห้าม
- ❌ Commit `.env`, `.env.local`, secrets
- ❌ Commit `node_modules`, `.next`, generated files
- ❌ Force push บน main
- ❌ Skip hooks (`--no-verify`) ยกเว้น emergency

---

## 11. Documentation

ทุก non-trivial function ต้องมี JSDoc:

```typescript
/**
 * คำนวณ Character Error Rate (CER) ระหว่าง OCR output และ ground truth
 *
 * @param predicted - ข้อความที่ OCR ดึงได้
 * @param truth - ข้อความ ground truth ที่กรรมการกำหนด
 * @returns CER เป็น percentage (0-100)
 *
 * @example
 * calculateCer("HELO WORLD", "HELLO WORLD") // → 9.09
 */
export function calculateCer(predicted: string, truth: string): number {
  // ...
}
```

---

## 12. Testing (เวลามีจำกัด — focus ที่จุดสำคัญ)

ใน Phase 1 ทำเฉพาะ smoke test ของ critical paths:

1. Login flow
2. Create command + workflow transitions
3. AI Command Drafting endpoint
4. Doc Classification endpoint
5. Search endpoint

ใช้ Playwright สำหรับ E2E (Phase 2 เพิ่มเข้ามา)

---

## 13. Performance

### 13.1 Frontend
- ใช้ React Server Components เป็น default
- Client component เฉพาะที่มี interaction
- Lazy load: Three.js, Leaflet (dynamic import + SSR off)
- Image optimization: ใช้ `next/image`

### 13.2 Backend
- Pagination ทุก list
- Index columns ที่ filter/sort บ่อย
- Cache AI response (DB column)
- Stream long AI responses

### 13.3 Database
- ดู `prisma/schema.prisma` — มี `@@index` ที่จำเป็นแล้ว
- ไม่ใช้ `SELECT *` (Prisma `select` field ที่ใช้จริง)

---

## 14. TOR Reference Banner

**ทุกหน้า** ใน `app/(app)/*/page.tsx` ต้องมี TOR ref banner ด้านบน:

```tsx
import { TorBanner } from "@/components/ui/tor-banner";

export default function CommandWorkflowPage() {
  return (
    <div>
      <TorBanner
        torRefs={["5.4.4", "4.1", "4.3", "4.5"]}
        description="วงจรคำสั่ง 9 สถานะ + Read Receipt + Smart Notification"
        system="ระบบ 4: Command & Operation"
      />
      {/* page content */}
    </div>
  );
}
```

ทำไม: กรรมการเปิดหน้าไหน เห็นว่าหน้านี้ map TOR ข้อไหนทันที — เสริม credibility

---

## 15. AI Collaboration Best Practices

(เมื่อทำงานร่วมกับ Claude)

### 15.1 ก่อนเริ่ม Session ใหม่
- ให้ Claude อ่าน `docs/PROJECT_BRIEF.md`, `docs/TOR_SUMMARY.md`, `docs/ARCHITECTURE.md` ก่อน
- Run `TaskList` เพื่อดูสถานะ
- บอก Claude ว่าอยู่ Day ไหนใน [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md)

### 15.2 Prompt Pattern
```
ก่อนตอบให้คุณอ่าน docs/PROJECT_BRIEF.md และ docs/ARCHITECTURE.md
โปรเจคนี้ใช้ Next.js 16 + Prisma + Postgres + Claude API
ต้องการ <X feature>
ขอ code เต็มไฟล์ที่ต้องแก้ ห้ามตัด
อธิบายด้วยว่าแก้ไฟล์ไหนบ้าง
ห้ามแก้ docs/* และ prisma/schema.prisma โดยไม่ขอ
```

### 15.3 หลังจบงาน
- ขอให้ Claude สรุปว่าแก้ไฟล์ไหนบ้าง
- ขอให้ update task status
- ขอให้ commit message ตามมาตรฐาน

### 15.4 ห้าม Claude
- ❌ แก้ `docs/*.md` โดยไม่ขอ (ยกเว้น user สั่ง)
- ❌ แก้ `prisma/schema.prisma` โดยไม่ขอ
- ❌ ลบไฟล์ใดๆ โดยไม่ confirm
- ❌ Commit / push โดยไม่ confirm
- ❌ Run destructive command (`rm -rf`, `prisma migrate reset`, etc.)

---

## 16. Code Review Checklist

ก่อน commit:
- [ ] ทำงานตาม requirement
- [ ] มี validation (Zod)
- [ ] มี error handling
- [ ] ตรวจ RBAC แล้ว
- [ ] มี audit log (ถ้าเป็น write action)
- [ ] User error message ภาษาไทย
- [ ] ไม่มี `any`
- [ ] ไม่มี secret
- [ ] ไม่มี `console.log` ของ sensitive data
- [ ] ตั้งชื่ออ่านเข้าใจ
- [ ] Component < 150 บรรทัด
- [ ] มี TOR ref banner (ถ้าเป็นหน้า)

---

## 17. การ Commit ระหว่าง Development

แนะนำ commit บ่อยๆ — 1 commit/feature small chunk:

```bash
# Day 1 example commits
git commit -m "chore: init Next.js 16 + Prisma + Tailwind v4"
git commit -m "feat(db): add Prisma schema with 18 models"
git commit -m "feat(auth): setup Auth.js with credentials provider"
git commit -m "feat(nav): add sidebar with 20-screen navigation"
git commit -m "feat(dashboard): create KPI cards + 4 charts"
git commit -m "docs: add comprehensive project documentation"
```

---

## 18. Help & Common Issues

ดู `README.md` § Common Issues

ถ้าติด:
1. ลอง `npx prisma generate`
2. ลอง `rm -rf .next && npm run dev`
3. ตรวจ `.env.local` ครบ
4. ดู Vercel build logs
5. ถาม Claude (เป็น senior pair) พร้อมแชร์ error message เต็ม
