# ข้อเสนอเพิ่มเติมของผู้พัฒนา (Proposal Additions)

> **กฎ:** ส่วนนี้ **ไม่ใช่ TOR** — เป็นข้อเสนอจากผู้พัฒนาที่ต้องการให้ผู้ใช้พิจารณาว่าจะรวมเข้ากับโครงการหรือไม่
>
> **สถานะ:** รออนุมัติ
>
> **เอกสารเทียบ:** [`SYSTEM_OVERVIEW_PAPER.md`](SYSTEM_OVERVIEW_PAPER.md) — มีเฉพาะสิ่งที่อยู่ใน TOR

---

## คำถามที่ต้องตอบ

ทุกข้อในเอกสารนี้ ต้องตอบว่า:
- ✅ **อนุมัติ** — รวมเข้ากับเอกสารหลัก
- ❌ **ไม่อนุมัติ** — ไม่ใส่ในเอกสาร
- 🤔 **ขอรายละเอียดเพิ่ม** — ผู้พัฒนาอธิบายเพิ่ม

---

## 1. ข้อเสนอ Technology Stack

**ที่มา:** TOR ไม่ได้กำหนด stack ที่ต้องใช้ — ผู้พัฒนาเลือกเอง

**ที่ผู้พัฒนาเลือก:**

| Layer | Technology | เหตุผลที่เลือก |
|---|---|---|
| Frontend Framework | Next.js 16 + React 19 | Industry standard, SSR/CSR ในตัวเดียว |
| Language | TypeScript | Type safety, prevent bugs |
| Styling | Tailwind CSS v4 | Rapid UI development |
| Thai Font | Noto Sans Thai | ฟรี + รองรับไทยดี |
| Charts | Recharts + react-leaflet | 4 chart types ใน TOR (Line/Bar/Pie/Map) |
| 3D / XR | Three.js + React Three Fiber | สำหรับ XR mockup ใน demo |
| Database | PostgreSQL (Neon) | ACID + pgvector + full-text search |
| ORM | Prisma | Type-safe + migration system |
| Auth | Auth.js v5 + bcrypt | Industry standard |
| AI Provider | Anthropic Claude API | ภาษาไทยดี + long context |
| Validation | Zod | Type-safe + reusable client/server |
| Deploy | Vercel | Native Next.js + auto SSL |

**ถาม:** อนุมัติให้ระบุ stack นี้ในเอกสารโครงการหรือไม่?

---

## 2. ข้อเสนอ Architecture: Modular Monolith

**ที่มา:** TOR ไม่ได้กำหนดสถาปัตยกรรม

**ที่ผู้พัฒนาเสนอ:**

- รวม 7 ระบบเป็น **1 Web App เดียว** (Modular Monolith)
- แบ่ง module ภายในตามระบบ (เพื่อแยกเป็น Microservices ภายหลังได้)
- 1 Database, 1 Auth System

**เหตุผล:**
- ผู้ใช้คนเดียวกันใช้ทั้ง 7 ระบบ
- ข้อมูลแชร์กันมาก (Command ใช้ใน 4→1→3→6→7)
- ระบบ 7 (Security) ต้อง intercept ทุก request → ต้องอยู่ที่เดียว
- ลด complexity / Deploy ง่าย / Migrate ภายหลังได้

**ถาม:** อนุมัติให้ design เป็น Modular Monolith หรือไม่?

---

## 3. ข้อเสนอ: PWA แทน Native Mobile App

**ที่ TOR ระบุ (TOR ข้อ 5.5):**
> "พัฒนาเป็น Web Application และ Mobile Application ที่ได้รับการรองรับการพัฒนา รองรับการใช้งานทั้งบนเครื่องคอมพิวเตอร์ (Desktop) และอุปกรณ์ Mobile Devices ที่ใช้ระบบปฏิบัติการ Android และ iOS ในรูปแบบ Responsive Web Design"

**ที่ผู้พัฒนาตีความ:**
- ใช้ **PWA (Progressive Web App)** จาก codebase เดียว
- ติดตั้งบนมือถือเหมือน native app
- รองรับ iOS + Android
- ตอบ TOR ข้อ 5.5 ครบ

**ทางเลือก:**
- A. PWA + Responsive (เร็ว / 1 codebase)
- B. React Native (ช้ากว่า / 2 codebase / Native API ครบ)
- C. ทั้งคู่ (PWA สำหรับ Phase 1 / React Native ใน Phase 2)

**ถาม:** เลือกทางไหน?

---

## 4. ข้อเสนอ Role-Based Access Control (RBAC) Roles

**ที่ TOR ระบุ (TOR ข้อ 7.1.3):**
> "สามารถกำหนดสิทธิ์ตามบทบาท (Role-based Access Control) กำหนดของบทบาทการเข้าถึงตามตำแหน่ง..."

**TOR ไม่ได้ระบุจำนวน role หรือชื่อ role ที่เฉพาะ**

**ที่ผู้พัฒนาเสนอ:** 5 Roles

| Role | คำอธิบาย |
|---|---|
| ADMIN | ผู้ดูแลระบบ |
| COMMANDER | ผู้บังคับบัญชา — สั่งการ + อนุมัติ |
| STAFF | เจ้าหน้าที่ปฏิบัติงาน |
| AUDITOR | ผู้ตรวจสอบ |
| VIEWER | ผู้ดูข้อมูล (read-only) |

**ทางเลือก:**
- A. 5 roles ตามที่เสนอ
- B. ใช้ตำแหน่งราชการของ ตร. โดยตรง (ผบ.ตร., รอง ผบ.ตร., ผบช., ผกก., ฯลฯ)
- C. ออกแบบร่วมกับ ตร. ตอน Phase 1 (งวด 1: Requirements Analysis)

**ถาม:** เลือกทางไหน?

---

## 5. ข้อเสนอ: เก็บ AI Prompt + Cache

**ที่มา:** ไม่ได้ระบุใน TOR

**ที่ผู้พัฒนาเสนอ:**
- เก็บ prompt ทุกครั้งที่ใช้ AI ลง column `aiPromptUsed` ใน `Command` table
- Cache ผลลัพธ์เพื่อลด API cost + speed

**เหตุผล:**
- Audit AI usage (มีโอกาส ตร. ต้องการตรวจสอบ)
- Cost optimization (ลดการเรียก Claude ซ้ำ)

**ถาม:** อนุมัติให้เพิ่มฟีเจอร์นี้?

---

## 6. ข้อเสนอ External Integrations

**ที่ TOR ระบุชัด (TOR หน้า 30 ข้อ 6.4.2):**
- ✅ ศูนย์รับแจ้งเหตุ 191
- ✅ ระบบกล้องวงจรปิด (CCTV)
- ✅ ระบบข่าวกรอง

**ที่ผู้พัฒนาแนะนำเพิ่ม (เสริม value):**
- e-Signature service (TDID หรือ TDA) สำหรับ Command Workflow ลายเซ็นอิเล็กทรอนิกส์
- API กับ สศช. (สำหรับนำเข้ายุทธศาสตร์ชาติอัตโนมัติ)
- API กับ สำนักนายกฯ (สำหรับนำเข้าแผนแม่บทอัตโนมัติ)
- API กับ กรมการปกครอง (ข้อมูลพื้นที่ปกครอง)

**ถาม:** อนุมัติ integration เพิ่มเติมไหน? ทั้งหมดหรือบางส่วน?

---

## 7. ข้อเสนอ: Phase 2 Migration Path

**ที่มา:** TOR ไม่ได้ระบุ phase หลังจาก 240 วัน

**ที่ผู้พัฒนาเสนอ (สำหรับการขยายในอนาคต):**

| Phase | งาน |
|---|---|
| Phase 1 (240 วัน) | ส่งมอบ EOP ตามที่ TOR กำหนด |
| Phase 2 (1-12 เดือน หลังประกันหมด) | Native Mobile App + เพิ่ม Integration + XR ขยาย |
| Phase 3 (12+ เดือน) | Microservices split (ถ้าโหลดมาก) + Multi-region DR |

**ถาม:** ใส่ใน proposal หรือไม่? (อาจเป็น value-add แต่อาจทำให้กรรมการคิดว่าโครงการนี้ยังไม่ครบ)

---

## 8. ข้อเสนอ: Slide Deck สำหรับ Pitch

**ที่มา:** TOR ข้อ 8.2.5 หน้า 49 ระบุต้องมี Mockup Design 5 หน้าจอ (PDF A3, PowerPoint, Canva)

**ที่ผู้พัฒนาเสนอเพิ่ม:**
- Slide deck 60+ หน้า สำหรับ pitch ต่อกรรมการ
- ครอบคลุม:
  - Executive summary
  - 7 ระบบ detail
  - Architecture diagram
  - Risk + mitigation
  - Team CV summary
  - Timeline Gantt chart
  - PoC preview

**ถาม:** ทำ slide deck ด้วยหรือไม่? (ผู้พัฒนาทำได้ใน 1-2 วัน)

---

## 9. ข้อเสนอ: Deploy Pre-PoC Demo

**ที่มา:** ไม่ใช่ TOR — เป็นกลยุทธ์การพรีเซ้นต่อกรรมการ

**ที่ผู้พัฒนาเสนอ:**
- Deploy ระบบที่กำลังพัฒนาอยู่ขึ้น **Vercel public URL**
- กรรมการเปิดดูได้จากที่ไหนก็ได้ก่อนวันสอบ
- แสดงว่า "เรามีของจริงพร้อมแล้ว"

**ข้อดี:**
- ความน่าเชื่อถือสูงขึ้น
- กรรมการเล่นกับระบบจริงก่อนสอบ

**ข้อเสีย:**
- หากระบบยังไม่สมบูรณ์ อาจตรงข้าม
- ต้องมั่นใจในคุณภาพก่อนเปิด

**ถาม:** Deploy public ดีไหม? (หรือเก็บไว้เปิดในวันสอบ?)

---

## 10. ข้อเสนอ: ใช้ Claude API สำหรับ AI ทุกตัว

**ที่ TOR ระบุ:** ใช้ AI ตามมาตรฐาน (ไม่จำกัด vendor)

**ที่ผู้พัฒนาเสนอ:**
- ใช้ **Anthropic Claude API** สำหรับ:
  - PoC 1: Command Drafting (Generative AI)
  - PoC 2: Doc Classification (Zero-shot)
  - PoC 3: OCR (Claude Vision)
  - Semantic Search (Embedding)

**เหตุผล:**
- ภาษาไทยดี
- 1 vendor ดูแลง่าย
- Cost / quality สมดุล

**ทางเลือก:**
- A. Claude ทุกตัว (ที่เสนอ)
- B. Claude + WangchanBERTa (NLP ไทยเฉพาะ) สำหรับ Doc Class
- C. Claude + PaddleOCR (self-hosted) สำหรับ OCR
- D. ผสม Claude + local model ตามความเหมาะสม

**ถาม:** เลือกทางไหน?

---

## 11. ข้อเสนอ: Audit Log แบบเก็บละเอียด

**ที่ TOR ระบุ (TOR ข้อ 7.1.5, 7.2.4):** ต้องมี Activity Log / Audit Trail

**ที่ผู้พัฒนาเสนอเพิ่ม:**
- เก็บ IP, User-Agent ทุก request
- เก็บ details เป็น JSON (ก่อน-หลัง แก้ไข)
- Retain 7 ปี (ตามมาตรฐาน CII)

**ถาม:** Retention 7 ปีเหมาะสมหรือ ตร. มี policy เฉพาะ?

---

## 12. ข้อเสนอ: 9 Workflow States ใน Database

**ที่ TOR ระบุ (TOR ข้อ 4.1 หน้า 27):**
> "ร่าง → เสนอ → อนุมัติ → เผยแพร่ → การจ่ายคำสั่ง → รับทราบ → เริ่มปฏิบัติ → ส่งผลหลักฐาน → ปิดงาน/ประเมินผล"

**TOR ระบุ 9 รัฐ:** ร่าง / เสนอ / อนุมัติ / เผยแพร่ / การจ่ายคำสั่ง / รับทราบ / เริ่มปฏิบัติ / ส่งผลหลักฐาน / ปิดงาน-ประเมินผล

**ที่ผู้พัฒนาจะ implement:** ใช้ทั้ง 9 รัฐใน DB enum

```typescript
enum CommandStatus {
  DRAFT             // ร่าง
  SUBMITTED         // เสนอ
  APPROVED          // อนุมัติ
  PUBLISHED         // เผยแพร่
  DISPATCHED        // การจ่ายคำสั่ง
  ACKNOWLEDGED      // รับทราบ
  IN_PROGRESS       // เริ่มปฏิบัติ
  REPORTED          // ส่งผลหลักฐาน
  CLOSED            // ปิดงาน/ประเมินผล
}
```

**ถาม:** ใช้ 9 states ตาม TOR ตรงๆ ใช่ไหม?

---

## 📋 ขั้นตอนต่อไป

1. ผู้ใช้อ่านเอกสารนี้
2. ตอบทุกข้อ (✅ / ❌ / 🤔)
3. ผู้พัฒนานำส่วนที่ ✅ ไปรวมกับเอกสารหลัก
4. ส่วนที่ ❌ ลบทิ้ง
5. ส่วนที่ 🤔 พูดคุยเพิ่มเติม

---

**ใครคือ "ผู้พัฒนา":** ทีมที่กำลังพัฒนา EOP MVP — Broccolie + Claude (AI pair)

**ใครคือ "ผู้ใช้":** ผู้ตัดสินใจหลัก (ตอนนี้ = Broccolie)
