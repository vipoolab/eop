# Database Schema — EOP

> เอกสารนี้อธิบายทุก Prisma model + relationships + การใช้งานต่อระบบ TOR
>
> Schema file: [`prisma/schema.prisma`](../prisma/schema.prisma)

---

## 1. ภาพรวม

**Database:** PostgreSQL (Neon cloud)
**ORM:** Prisma 6.x
**Convention:** PascalCase model name, camelCase field name

**จำนวน model:** 18 models, แบ่งเป็น 7 หมวดตาม TOR

---

## 2. ER Diagram (Logical)

```
┌─────────┐         ┌─────────┐
│  User   │◄────────│ Session │
└────┬────┘         └─────────┘
     │
     ├──── creates ──── Command ──── targets ──► CommandTarget ──► Unit
     │                     │
     │                     └── status_log ──► CommandStatusLog
     │
     ├──── uploads ─── Document ──── ocr_jobs ──► OcrJob
     │
     ├──── owns ────── Mission ──── plan ──► StrategicPlan ──► Kpi
     │
     └──── action ────► AuditLog

ComplianceReport (standalone, references Unit)
FormTemplate ──► FormSubmission
SearchEntry (cross-cuts all)
Incident (standalone, GIS)
```

---

## 3. Models — แยกตามระบบ TOR

### 🛡️ ระบบ 7: User + Authentication (TOR 7.1)

#### `User`
```prisma
id           String   @id @default(cuid())
email        String   @unique
name         String
rank         String?              // ยศ เช่น พล.ต.ต. / พ.ต.อ.
passwordHash String                // bcrypt hash
unitId       String?
role         UserRole @default(STAFF)
mfaEnabled   Boolean  @default(false)
active       Boolean  @default(true)
```

**ใช้สำหรับ:** Auth + RBAC + แสดงผู้สั่งการ
**RBAC roles:** `ADMIN | COMMANDER | STAFF | AUDITOR | VIEWER`

---

#### `Session`
```prisma
id        String   @id @default(cuid())
userId    String
token     String   @unique
expires   DateTime
```

**ใช้สำหรับ:** Auth.js session storage

---

### 🏢 Organization

#### `Unit`
```prisma
id          String  @id @default(cuid())
code        String  @unique  // ยศ./ผบ./มค./มข./วจ./อจ.
name        String
parentId    String?
```

**ใช้สำหรับ:**
- 6 หน่วยตาม TOR PoC 2 (สำหรับ Doc Classification)
- Hierarchical structure (Unit → Sub-unit)
- กำหนด target ของ Command
- Cascade KPI

---

### 🎯 ระบบ 1: Strategic Plan (TOR 5.4.1)

#### `StrategicPlan`
```prisma
id          String          @id @default(cuid())
level       PlanLevel       // NATIONAL | MASTER | ACTION
code        String          // เช่น "Y20-1.2.3"
title       String
parentId    String?         // hierarchy
startDate   DateTime?
endDate     DateTime?
```

**ใช้สำหรับ:**
- เก็บแผน 3 ระดับ: ยุทธศาสตร์ชาติ → แผนแม่บท → แผนปฏิบัติราชการ
- AI Strategic Alignment ใช้ check ความสอดคล้องของคำสั่ง

---

#### `Kpi`
```prisma
id          String  @id @default(cuid())
planId      String
code        String
name        String
target      Float
actual      Float   @default(0)
unit        String?         // "ครั้ง" / "%"
period      String?         // "Q1/2568"
status      String?         // green/yellow/red
```

**ใช้สำหรับ:**
- ตัวชี้วัด (KPI) แต่ละแผน
- Cascading (Plan → Sub-plan → Mission)
- Dashboard real-time

---

### 📋 ระบบ 2: Agenda + Mission (TOR 5.4.2)

#### `Mission`
```prisma
id          String  @id @default(cuid())
code        String  @unique
title       String
ownerId     String?
unitId      String?
planId      String?              // FK ไป StrategicPlan
priority    MissionPriority      // LOW | NORMAL | HIGH | URGENT | CRITICAL
status      String  @default("active")
startDate   DateTime?
dueDate     DateTime?
```

**ใช้สำหรับ:**
- บริหารวาระ/ภารกิจสำคัญ
- ผูก Mission กับ Strategic Plan (ระบบ 1)
- เป็น parent ของ Command (1 mission → many commands)

---

### 🔄 ระบบ 4: Command + Workflow (TOR 5.4.4)

#### `Command` ⭐ (Core)
```prisma
id          String        @id @default(cuid())
docNo       String        @unique     // "๐๓๒๑/๒๕๖๘"
subject     String
recipient   String                    // เรียน
reference   String?                   // อ้างถึง
objective   String?                   // วัตถุประสงค์
body        String        @db.Text    // เนื้อหา
signature   String?
status      CommandStatus @default(DRAFT)
priority    MissionPriority
missionId   String?
creatorId   String                    // FK ไป User
signerId    String?                   // FK ไป User
aiAssisted  Boolean       @default(false)
aiPromptUsed String?      @db.Text    // เก็บ prompt ที่ใช้กับ Claude
publishedAt DateTime?
closedAt    DateTime?
```

**ใช้สำหรับ:** **หัวใจของระบบทั้งหมด** — ทุกคำสั่งใน ตร.

**Status flow (9 states):**
```
DRAFT → SUBMITTED → APPROVED → PUBLISHED → ACKNOWLEDGED
     → IN_PROGRESS → REPORTED → AUDITED → CLOSED
```

**Indexes:** `status`, `creatorId`

---

#### `CommandTarget`
```prisma
id              String   @id @default(cuid())
commandId       String
unitId          String                   // หน่วยรับคำสั่ง
assignedUserId  String?                  // คนรับมอบหมาย (ถ้ามี)
acknowledged    Boolean  @default(false) // Read Receipt
acknowledgedAt  DateTime?
completed       Boolean  @default(false)
completedAt     DateTime?
resultNote      String?  @db.Text
```

**ใช้สำหรับ:**
- 1 Command มีหลาย Target (cascade ไปหลายหน่วย)
- บันทึก Read Receipt
- บันทึกผลปฏิบัติ
- TOR 4.3 / 4.4

**Constraint:** `@@unique([commandId, unitId])` — 1 หน่วยรับคำสั่งเดียวกัน 1 ครั้ง

---

#### `CommandStatusLog`
```prisma
id        String        @id @default(cuid())
commandId String
from      CommandStatus?
to        CommandStatus
byUserId  String?
note      String?
createdAt DateTime      @default(now())
```

**ใช้สำหรับ:** บันทึก state transition ทุกครั้ง — ใช้สำหรับ audit + history view

---

### ✅ ระบบ 3: Compliance (TOR 5.4.3)

#### `ComplianceReport`
```prisma
id          String              @id @default(cuid())
standard    ComplianceStandard   // GOR_POR_ROR | ITA | PMQA | CUSTOM
title       String
period      String                // "Q4/2568"
unitId      String?
status      String                @default("draft")
score       Float?
data        Json?                 // ข้อมูล form structured
```

**ใช้สำหรับ:**
- รายงาน ก.พ.ร. (Gor.Por.Ror)
- รายงาน ITA
- รายงาน PMQA
- Self-Assessment

---

### 📝 Dynamic Form (TOR 2.3)

#### `FormTemplate`
```prisma
id          String   @id @default(cuid())
name        String
description String?
schema      Json                  // JSON schema ของ fields
isActive    Boolean  @default(true)
```

**ใช้สำหรับ:**
- Template ที่ Admin สร้างจาก Form Builder (drag-drop)
- Schema format: `{ fields: [{ id, label, type, required, ... }] }`

---

#### `FormSubmission`
```prisma
id         String   @id @default(cuid())
templateId String
data       Json                   // ค่าที่ user กรอก
submittedBy String?
```

**ใช้สำหรับ:** เก็บข้อมูลที่ user submit ผ่าน dynamic form

---

### 📂 ระบบ 6: Document + OCR (TOR 5.4.6)

#### `Document`
```prisma
id              String   @id @default(cuid())
filename        String
originalName    String
mimeType        String
size            Int
storagePath     String                    // path ใน local FS หรือ S3 URL
unitId          String?
uploadedBy      String?
classifiedUnit  String?                   // ผลจาก AI — Unit code
classificationConfidence Float?
classificationAt DateTime?
contentText     String?  @db.Text         // text ที่ extract มา
```

**ใช้สำหรับ:**
- เก็บเอกสารทุกชนิด (DOCX, PDF, image)
- ผลการจำแนกจาก AI (PoC 2)
- Text ที่ extract จาก OCR หรืออ่านตรง

**Index:** `classifiedUnit`

---

#### `OcrJob`
```prisma
id            String   @id @default(cuid())
documentId    String?
inputPath     String
outputText    String?  @db.Text
groundTruth   String?  @db.Text          // สำหรับ CER comparison
cer           Float?                     // Character Error Rate
pageCount     Int      @default(1)
status        String   @default("pending")
errorMessage  String?
startedAt     DateTime?
completedAt   DateTime?
```

**ใช้สำหรับ:**
- บันทึก OCR job + ผลลัพธ์
- เก็บ CER สำหรับ PoC 3
- Async processing

---

#### `SearchEntry` (Search 4 modes — TOR 8.10.12)
```prisma
id        String   @id @default(cuid())
refType   String                         // "command" | "mission" | "document" | "report"
refId     String
title     String
content   String   @db.Text
unitCode  String?
metadata  Json?
```

**ใช้สำหรับ:**
- Unified search index
- รองรับทั้ง full-text + semantic
- pgvector column (`vector` type) จะเพิ่มภายหลังเมื่อ enable extension

**Index:** `[refType, refId]`

---

### 🚨 Incident (TOR 6.4)

#### `Incident`
```prisma
id          String   @id @default(cuid())
code        String   @unique
type        String                    // "ประท้วง" | "อาชญากรรม" | "อุบัติเหตุ"
title       String
description String?
lat         Float?
lng         Float?
location    String?
severity    Int      @default(5)      // 1-10
status      String   @default("open")
source      String?                   // "191" | "CCTV" | "intel" | "manual"
sourceRef   String?
occurredAt  DateTime
reportedAt  DateTime @default(now())
closedAt    DateTime?
```

**ใช้สำหรับ:**
- เก็บเหตุการณ์ทั้งหมด
- Heatmap บน Dashboard + XR
- Source = link กับ API ภายนอก (191/CCTV)

---

### 📊 Audit (TOR 7.1.5 + 7.2.4)

#### `AuditLog`
```prisma
id        String   @id @default(cuid())
userId    String?
action    String                       // "command.create" / "auth.login" / "doc.upload"
target    String?                      // "command:cln1234abc"
details   Json?
ip        String?
ua        String?                      // User-Agent
createdAt DateTime @default(now())
```

**ใช้สำหรับ:**
- บันทึกทุก action ของทุก user
- ใช้สำหรับ Auditor + Compliance
- SIEM analysis

**Indexes:** `userId`, `action`, `createdAt`

---

## 4. Relationships Summary

```
User
 ├─ 1:N Session
 ├─ 1:N Command (creator)
 ├─ 1:N Command (signer)
 ├─ 1:N CommandTarget (assigned)
 ├─ 1:N AuditLog
 ├─ 1:N Mission (owner)
 ├─ 1:N Document (uploader)
 ├─ 1:N OcrJob (processedBy)
 └─ N:1 Unit

Unit
 ├─ 1:N User
 ├─ 1:N Mission
 ├─ 1:N CommandTarget
 ├─ 1:N Document
 └─ Self-ref (parent / children)

StrategicPlan
 ├─ 1:N Kpi
 ├─ 1:N Mission
 └─ Self-ref (parent / children)

Command
 ├─ N:1 Mission
 ├─ 1:N CommandTarget
 └─ 1:N CommandStatusLog

Document
 └─ 1:N OcrJob

FormTemplate
 └─ 1:N FormSubmission
```

---

## 5. Seed Data Plan

จะ seed ข้อมูลใน `prisma/seed.ts`:

| Table | จำนวน records | หมายเหตุ |
|---|---|---|
| User | 8-10 | ครอบ 5 roles + 6 units |
| Unit | 6 + sub-units | ตาม TOR PoC 2 |
| StrategicPlan | 12 | 3 levels × 4 plans |
| Kpi | 30-40 | ตามแผน |
| Mission | 20-30 | ตัวอย่างภารกิจ |
| Command | 50-100 | กระจาย 9 states |
| CommandTarget | ~300 | average 5 targets/command |
| ComplianceReport | 6 | 2 standards × 3 periods |
| FormTemplate | 5 | sample forms |
| Document | 30 | sample docs (รวม PDF for OCR) |
| Incident | 50 | กระจาย Bangkok + ภาคใต้ |
| SearchEntry | ~200 | index ของทุก content |
| AuditLog | 500+ | สังเคราะห์ activity log |

---

## 6. Migration Strategy

```bash
# Initial migration
npx prisma migrate dev --name init

# Future migrations
npx prisma migrate dev --name add_pgvector
npx prisma migrate dev --name add_e_signature_table
```

**ห้ามทำ:**
- `prisma db push` บน production — ใช้ migration เท่านั้น
- แก้ schema แล้วลืม migrate

---

## 7. pgvector (Phase 2)

ใน Phase 1 — Search ใช้ Postgres full-text + ts_vector
ใน Phase 2 — เพิ่ม pgvector column สำหรับ semantic search:

```prisma
model SearchEntry {
  // ... existing fields
  embedding Unsupported("vector(1536)")?
}
```

ต้อง enable extension ก่อน: `CREATE EXTENSION vector;`

---

## 8. Performance Considerations

### Indexes ที่จำเป็น (มีแล้วใน schema)
- `User.email` (unique → login)
- `Command.status` (filter dashboard)
- `Command.creatorId` (list my commands)
- `AuditLog.userId` (user history)
- `AuditLog.action` (filter by action type)
- `AuditLog.createdAt` (sort recent)
- `Document.classifiedUnit` (filter by unit)
- `SearchEntry.[refType, refId]` (composite — search results)

### Pagination
ทุก list endpoint ต้องมี:
```typescript
{ take: 20, skip: page * 20 }
```

### N+1 Prevention
ใช้ `include` แทน multiple queries:
```typescript
prisma.command.findMany({
  include: { creator: true, targets: { include: { unit: true } } }
});
```

---

## 9. Data Privacy & PDPA

- `passwordHash` — bcrypt, ห้าม return ใน API response
- `User.email` — sensitive แต่จำเป็นสำหรับ login
- `AuditLog.ip` + `ua` — เก็บแต่ไม่แสดงต่อ non-admin
- ห้าม log password / token / API key ลง AuditLog.details

---

## 10. Backup & Recovery

| Frequency | Strategy |
|---|---|
| Daily | Neon auto-backup (built-in) |
| Weekly | Manual `pg_dump` ลง local |
| Before migration | `pg_dump` ก่อนทุกครั้ง |

```bash
# Backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup_20260519.sql
```
