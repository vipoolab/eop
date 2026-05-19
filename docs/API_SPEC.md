# API Specification — EOP

> มาตรฐาน API ของโปรเจค + รายการ endpoint ที่จะสร้าง
>
> Reference: Full Stack Best Practices §6 (RESTful API)

---

## 1. หลักการ

### 1.1 Convention
- ใช้ **REST** + **JSON**
- Base URL: `/api/`
- ไม่ versioning ใน Phase 1 (จะเพิ่ม `/api/v1/` ตอน Phase 2 ถ้าจำเป็น)
- ทุก endpoint ผ่าน Next.js API Routes (`app/api/`)

### 1.2 HTTP Methods
| Method | ใช้เมื่อ |
|---|---|
| GET | อ่านข้อมูล (idempotent) |
| POST | สร้างใหม่ + action ที่ไม่ idempotent (เช่น call AI) |
| PATCH | แก้บางส่วน |
| PUT | แทนที่ทั้งหมด (ไม่ค่อยใช้) |
| DELETE | ลบ (soft delete แนะนำ) |

### 1.3 Status Codes
| Code | ใช้เมื่อ |
|---|---|
| 200 | OK — read สำเร็จ / update สำเร็จ |
| 201 | Created — create สำเร็จ |
| 204 | No Content — delete สำเร็จ |
| 400 | Bad Request — validation fail |
| 401 | Unauthorized — ไม่ login |
| 403 | Forbidden — login แล้วแต่ไม่มีสิทธิ์ |
| 404 | Not Found |
| 409 | Conflict — เช่น email ซ้ำ |
| 422 | Unprocessable Entity — semantic error |
| 429 | Too Many Requests — rate limit |
| 500 | Internal Server Error — bug |

---

## 2. Response Format มาตรฐาน

### 2.1 Success Response

```json
{
  "success": true,
  "message": "Optional success message in Thai",
  "data": {
    // ข้อมูลจริง
  }
}
```

### 2.2 List Response (with pagination)

```json
{
  "success": true,
  "data": [
    { "id": "...", "title": "..." }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 145,
    "totalPages": 8
  }
}
```

### 2.3 Error Response

```json
{
  "success": false,
  "message": "ไม่สามารถบันทึกข้อมูลได้",
  "errors": [
    {
      "field": "email",
      "message": "อีเมลซ้ำในระบบ"
    }
  ]
}
```

### 2.4 Validation Error (จาก Zod)

```json
{
  "success": false,
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    { "field": "title", "message": "Title is required" },
    { "field": "body", "message": "Body must be at least 10 characters" }
  ]
}
```

---

## 3. Authentication

### 3.1 Session-based (Auth.js)
- Login → set session cookie `next-auth.session-token`
- ทุก request ต้องมี cookie นั้น
- Middleware ตรวจสอบ session ก่อน route handler

### 3.2 Login

**POST `/api/auth/callback/credentials`** (Auth.js endpoint)

Body:
```json
{
  "email": "commander@eop.test",
  "password": "demo1234"
}
```

Response: redirect + Set-Cookie

### 3.3 Logout

**POST `/api/auth/signout`**

---

## 4. Endpoints Plan

### 4.1 Auth (ระบบ 7)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| POST | `/api/auth/signin` | Login |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/mfa/verify` | Verify OTP code (Phase 2) |

### 4.2 Users (ระบบ 7)

| Method | Endpoint | Role | คำอธิบาย |
|---|---|---|---|
| GET | `/api/users` | ADMIN | List users |
| POST | `/api/users` | ADMIN | Create user |
| GET | `/api/users/:id` | ADMIN/Self | Get user |
| PATCH | `/api/users/:id` | ADMIN | Update user |
| DELETE | `/api/users/:id` | ADMIN | Deactivate user |
| GET | `/api/users/me` | Any | Get my profile |

### 4.3 Units (ระบบ 7)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/units` | List all units (with tree) |
| GET | `/api/units/:code` | Get unit by code (ยศ./ผบ./...) |

### 4.4 Strategic Plans + KPI (ระบบ 1)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/plans?level=NATIONAL` | List plans by level |
| GET | `/api/plans/:id` | Get plan + children |
| POST | `/api/plans` | Create plan (ADMIN/COMMANDER) |
| GET | `/api/plans/:id/kpis` | List KPIs of a plan |
| POST | `/api/plans/:planId/kpis` | Create KPI |
| PATCH | `/api/kpis/:id` | Update KPI actual |
| POST | `/api/strategic/check-alignment` | AI check command vs plan |

### 4.5 Missions (ระบบ 2)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/missions` | List missions (?status=active&unit=ยศ.) |
| POST | `/api/missions` | Create mission |
| GET | `/api/missions/:id` | Get mission |
| PATCH | `/api/missions/:id` | Update |

### 4.6 AI Command Drafting (ระบบ 2 / PoC 1)

**POST `/api/ai/draft`**

Body:
```json
{
  "subject": "เร่งรัดการดำเนินคดียาเสพติด",
  "targetUnits": ["มค.", "ผบ."],
  "objective": "ลดอัตราการเกิดอาชญากรรมยาเสพติดในไตรมาส 4",
  "instructions": "ให้แต่ละหน่วยจัดทำแผนปฏิบัติการพิเศษ",
  "timeline": "ภายใน 30 วัน"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "draft": "ที่ ตร. ๐๐๐๐.๐๐/๔๒๑\nเรื่อง เร่งรัดการดำเนินคดียาเสพติด\nเรียน ผบช.มค., ผบช.ผบ.\n\nอ้างถึง...\nด้วย...",
    "metadata": {
      "tokensUsed": 1245,
      "promptHash": "abc123",
      "model": "claude-3-5-sonnet"
    }
  }
}
```

### 4.7 Commands (ระบบ 4)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/commands` | List (?status=DRAFT&page=1) |
| POST | `/api/commands` | Create command (from draft) |
| GET | `/api/commands/:id` | Get with targets + status log |
| PATCH | `/api/commands/:id` | Update (DRAFT only) |
| POST | `/api/commands/:id/submit` | Move to SUBMITTED |
| POST | `/api/commands/:id/approve` | COMMANDER → APPROVED |
| POST | `/api/commands/:id/publish` | → PUBLISHED + notify targets |
| POST | `/api/commands/:id/acknowledge` | Target user → ACK their target |
| POST | `/api/commands/:id/report` | Target user → submit result |
| POST | `/api/commands/:id/audit` | AUDITOR → AUDITED |
| POST | `/api/commands/:id/close` | → CLOSED |
| GET | `/api/commands/:id/status-log` | History of state changes |

### 4.8 Documents + Doc Classification (ระบบ 6 / PoC 2)

**POST `/api/documents`** — Upload file

Form-data:
```
file: <DOCX/PDF>
unitId: optional
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "doc_abc123",
    "filename": "report_q4.docx",
    "size": 245678,
    "mimeType": "application/vnd.openxmlformats-..."
  }
}
```

**POST `/api/ai/classify`** — Classify document

Body:
```json
{ "documentId": "doc_abc123" }
```

Response:
```json
{
  "success": true,
  "data": {
    "documentId": "doc_abc123",
    "predicted": [
      { "unitCode": "มค.", "confidence": 0.87 },
      { "unitCode": "ผบ.", "confidence": 0.09 },
      { "unitCode": "ยศ.", "confidence": 0.03 },
      { "unitCode": "วจ.", "confidence": 0.01 },
      { "unitCode": "มข.", "confidence": 0.00 },
      { "unitCode": "อจ.", "confidence": 0.00 }
    ],
    "top": "มค."
  }
}
```

### 4.9 OCR (ระบบ 6 / PoC 3)

**POST `/api/ai/ocr`**

Form-data:
```
file: <PDF>
groundTruth: optional text (for CER calculation)
```

Response:
```json
{
  "success": true,
  "data": {
    "jobId": "ocr_xyz789",
    "extractedText": "...",
    "cer": 7.3,
    "pageCount": 3,
    "processingTime": 4521
  }
}
```

### 4.10 Search (ระบบ 6 / TOR 8.10.12)

**GET `/api/search?mode=semantic&q=ยาเสพติด`**

Query params:
- `mode`: `basic` | `advanced` | `fulltext` | `semantic`
- `q`: query text
- `refType`: filter by `command` | `mission` | `document`
- `unitCode`: filter by unit

Response:
```json
{
  "success": true,
  "data": [
    {
      "refType": "command",
      "refId": "cmd_001",
      "title": "เร่งรัดการดำเนินคดียาเสพติด",
      "snippet": "...ให้แต่ละหน่วยจัดทำ<mark>แผนปฏิบัติการ</mark>...",
      "score": 0.92
    }
  ],
  "pagination": { ... }
}
```

### 4.11 Compliance (ระบบ 3)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/compliance/reports?standard=ITA` | List reports |
| POST | `/api/compliance/reports` | Create report |
| GET | `/api/compliance/reports/:id` | Get report |
| POST | `/api/compliance/reports/:id/generate` | Auto-generate จากข้อมูลระบบ |
| POST | `/api/compliance/reports/:id/self-assess` | Run self-assessment |
| GET | `/api/compliance/reports/:id/export?format=pdf` | Export PDF |

### 4.12 Form Builder (ระบบ 2)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/forms/templates` | List templates |
| POST | `/api/forms/templates` | Create template |
| POST | `/api/forms/:templateId/submit` | Submit data |

### 4.13 Incidents (ระบบ 6)

| Method | Endpoint | คำอธิบาย |
|---|---|---|
| GET | `/api/incidents?status=open` | List incidents |
| POST | `/api/incidents` | Create incident |
| GET | `/api/incidents/:id` | Get incident |
| PATCH | `/api/incidents/:id` | Update status |

### 4.14 Dashboard (ระบบ 1 + 6)

**GET `/api/dashboard/kpis`**

Response: aggregated KPI cards

**GET `/api/dashboard/commands-by-month`**

**GET `/api/dashboard/commands-by-unit`**

**GET `/api/dashboard/status-distribution`**

**GET `/api/dashboard/incidents-geo`**

### 4.15 Audit Log (ระบบ 7)

| Method | Endpoint | Role | คำอธิบาย |
|---|---|---|---|
| GET | `/api/audit-logs` | AUDITOR/ADMIN | List logs (?userId, ?action, ?date) |
| GET | `/api/audit-logs/:id` | AUDITOR/ADMIN | Get detail |

---

## 5. Validation Pattern

ทุก POST/PATCH ต้อง validate ด้วย Zod:

```typescript
// features/commands/validators.ts
import { z } from "zod";

export const createCommandSchema = z.object({
  subject: z.string().min(5).max(200),
  recipient: z.string().min(1),
  body: z.string().min(10),
  missionId: z.string().optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"]),
  targetUnitIds: z.array(z.string()).min(1),
});

export type CreateCommandInput = z.infer<typeof createCommandSchema>;
```

ใน API route:
```typescript
const body = await req.json();
const result = createCommandSchema.safeParse(body);

if (!result.success) {
  return Response.json({
    success: false,
    message: "ข้อมูลไม่ถูกต้อง",
    errors: result.error.issues.map(e => ({
      field: e.path.join("."),
      message: e.message,
    })),
  }, { status: 400 });
}
```

---

## 6. Authorization Pattern

ใช้ middleware helper:

```typescript
// lib/auth-helpers.ts
import { auth } from "@/lib/auth";

export async function requireRole(allowed: UserRole[]) {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "ต้อง login");
  }
  if (!allowed.includes(session.user.role)) {
    throw new ApiError(403, "ไม่มีสิทธิ์");
  }
  return session.user;
}

// ใช้ใน API route:
export async function POST(req: Request) {
  const user = await requireRole(["ADMIN", "COMMANDER"]);
  // ... continue
}
```

---

## 7. Audit Log Pattern

ทุก write action ต้องบันทึก:

```typescript
import { logAudit } from "@/lib/audit";

await logAudit({
  userId: user.id,
  action: "command.create",
  target: `command:${command.id}`,
  details: { subject: command.subject, targets: targetUnitIds },
  ip: req.headers.get("x-forwarded-for") ?? "",
  ua: req.headers.get("user-agent") ?? "",
});
```

---

## 8. Error Handling Pattern

```typescript
// lib/api-errors.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public userMessage: string,
    public details?: unknown
  ) {
    super(userMessage);
  }
}

// In API route:
try {
  // ... logic
  return Response.json({ success: true, data: ... });
} catch (error) {
  if (error instanceof ApiError) {
    return Response.json({
      success: false,
      message: error.userMessage,
    }, { status: error.status });
  }

  console.error("Unexpected error:", error);
  return Response.json({
    success: false,
    message: "เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่",
  }, { status: 500 });
}
```

**กฎ:**
- User เห็น Thai message ที่เข้าใจง่าย
- Server log: full stack trace
- **ห้าม leak** SQL error / file path / stack ให้ user

---

## 9. Rate Limiting (Phase 2)

```typescript
// AI endpoints: max 10/min/user
// Auth endpoints: max 5/min/IP (anti brute force)
// Other: 100/min/user
```

ใช้ Upstash Redis หรือ in-memory store (dev).

---

## 10. AI Endpoint Conventions

ทุก AI call ต้อง:
1. **Cache** ผลลัพธ์ที่ identical input
2. **Stream** response สำหรับ long generation
3. **Timeout** 30 sec
4. **Log token usage** ใน DB
5. **Fallback** ถ้า API down → mock response + แจ้ง user

```typescript
// app/api/ai/draft/route.ts
export async function POST(req: Request) {
  const input = await req.json();

  // 1. Validate
  const result = draftInputSchema.safeParse(input);
  if (!result.success) return validationError(result.error);

  // 2. Check cache
  const cacheKey = hashInput(input);
  const cached = await getCachedDraft(cacheKey);
  if (cached) return Response.json({ success: true, data: cached });

  // 3. Call Claude
  try {
    const draft = await callClaudeDraft(input);
    await saveDraft(cacheKey, draft);
    await logAudit({ ... });
    return Response.json({ success: true, data: draft });
  } catch (err) {
    // Fallback
    return Response.json({
      success: true,
      data: getMockDraft(input),
      meta: { fallback: true },
    });
  }
}
```

---

## 11. Future: Public API (TOR ภายนอก integration)

Phase 2 จะมี:
- `/api/v1/external/incidents` (รับจาก 191)
- `/api/v1/external/cctv-events` (รับจาก CCTV system)
- `/api/v1/external/intel` (รับจากข่าวกรอง)

ใช้ API key auth + IP whitelist

---

## 12. Testing API

### Manual ด้วย curl
```bash
# Login
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"commander@eop.test","password":"demo1234"}'

# Create command (with cookie)
curl -X POST http://localhost:3000/api/commands \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{"subject":"test","body":"..."}'
```

### Postman Collection
จะมีใน `docs/postman-collection.json` (Day 7)

---

## 13. OpenAPI Spec (Phase 2)

จะ generate ด้วย `zod-to-openapi` ภายหลัง — เพื่อให้กรรมการดู spec ครบ
