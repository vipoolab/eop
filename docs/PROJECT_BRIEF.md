# Project Brief — EOP Demo

> เอกสารนี้บอก **บริบทของโปรเจค** ให้ใครก็ตามที่เข้ามาใหม่ (Claude session ใหม่ / dev คนใหม่) เข้าใจได้ว่า ทำไมโปรเจคนี้ถึงมี และเรากำลังจะทำอะไร

---

## 1. โครงการที่ประมูล

**ชื่อโครงการ:** โครงการพัฒนาระบบวางแผนและติดตามการปฏิบัติงานสำนักงานยุทธศาสตร์ตำรวจ (Enterprise Operation Planning — **EOP**)

**เจ้าของโครงการ:** สำนักงานยุทธศาสตร์ตำรวจ (สยศ.ตร.) — หน่วยงานในสำนักงานตำรวจแห่งชาติ

**งบประมาณ:** ประมาณ 92 ล้านบาท (Hardware ~20% / Software ~79% / อื่นๆ ~1%)

**ระยะเวลา:** 240 วัน / 4 งวด หลังเซ็นสัญญา

**TOR:** ไฟล์ TOR EOP.pdf 60 หน้า — รายละเอียดสรุปใน [`TOR_SUMMARY.md`](TOR_SUMMARY.md)

---

## 2. ทำไมโปรเจคนี้ถึงมี

### ปัญหาของ สตช. ปัจจุบัน

- **คำสั่งของ ตร. ไม่สอดคล้องกับยุทธศาสตร์ชาติ** — ออกตามอารมณ์/กระแส ไม่มีระบบเช็คความสอดคล้องกับแผน 3 ระดับ (ชาติ/แม่บท/ปฏิบัติราชการ)
- **การสั่งการใช้กระดาษ** — หาย / ตามไม่ได้ / ไม่รู้ใครรับ / Audit ลำบาก
- **เอกสารกระจัดกระจาย** — ไม่มี search ที่ดี / scan เป็นรูปทำให้หาไม่เจอ
- **รายงาน ก.พ.ร./ITA/PMQA ใช้คนเยอะ** — ทำ manual ทุกไตรมาส
- **ไม่มี Big Data + AI** — ใช้ประสบการณ์ตัดสินใจ ไม่มี predictive
- **ห้อง War Room มีจอจริงแพง** — ขยายยาก / ผบ. ที่ไม่อยู่ในห้องไม่เห็นภาพรวม
- **CII Security** — เป็นโครงสร้างพื้นฐานสำคัญทางสารสนเทศของชาติ ต้องมี MFA/RBAC/Audit Trail ระดับสูง

### ทางออกที่ ตร. ต้องการ

ระบบ **EOP** = "Digital Strategic Hub" ที่:
1. AI ช่วยตรวจสอบแผน + ร่างหนังสือสั่งการ
2. คำสั่งดิจิทัล 100% — ติดตามได้ตลอดวงจร
3. รายงาน ก.พ.ร./ITA/PMQA อัตโนมัติ
4. Search ภาษาไทยที่เข้าใจความหมาย
5. XR Command Center สำหรับ ผบ. ระดับสูง
6. Big Data + Predictive Analytics

---

## 3. เป้าหมายของ Web App ที่เรากำลังสร้าง

### Goal หลัก

> **สร้าง web app จริง (ไม่ใช่ slide mockup) ที่กรรมการเปิดดูแล้วเชื่อว่าเรามืออาชีพและสามารถส่งโครงการ 92M ได้สำเร็จใน 240 วัน**

### Positioning ที่จะพูดต่อกรรมการ

> "นี่ไม่ใช่ slide ไม่ใช่ mockup — เป็นต้นแบบที่เราเริ่มสร้างแล้ว มี database จริง / auth จริง / AI ทำงาน end-to-end 7 ฟีเจอร์ในวันนี้ ส่วนที่เหลือใน TOR เราวางสถาปัตยกรรมรองรับครบแล้ว รอเข้า phase 2-3 ตาม timeline 240 วันที่ TOR กำหนด"

### Strategy

แบ่งงานเป็น 2 tier:

**Tier 1: Real Functional (7 หน้า)** — ทำงานจริง บันทึก DB จริง กรรมการกดทุกปุ่มได้
1. Login + RBAC + Audit Log
2. Command CRUD + Workflow 9 สถานะ + Read Receipt
3. AI ร่างหนังสือสั่งการ (Claude API)
4. AI Document Classification
5. OCR Demo
6. Intelligent Search 4 modes
7. Dashboard real-time

**Tier 2: Scaffolded (13 หน้า)** — UI สวย + map TOR ชัด + อ่านจาก DB จริงบางส่วน
- Strategic Alignment, KPI Cascading
- Mission Mgmt, Form Builder
- Compliance Reports, Self-Assessment
- Incident Management
- XR Mockup (Three.js + video)
- Predictive Analytics
- Security Audit Log, User Mgmt
- Architecture Diagram, Mobile View, TOR Matrix

---

## 4. กลุ่มเป้าหมาย (Audience)

### Primary: กรรมการประมูล TOR

6 คน ผสมระหว่าง:
- ผบ. + ผกก. (ผู้ใช้งานจริง) — ต้องเล่า "story" ไม่ใช่ feature list
- IT/Technical expert — ต้องเห็น architecture + code quality
- กฎหมาย/พัสดุ — ตรวจ compliance

### Secondary: ทีมเสนอโครงการ (Sale + Tech Lead)

ใช้ web app นี้เป็น proof point ระหว่าง pitch

---

## 5. ข้อจำกัด (Constraints)

| ข้อจำกัด | ผลที่ตามมา |
|---|---|
| **เวลา < 1 สัปดาห์** | ต้องใช้ libraries สำเร็จรูป / no custom CSS framework |
| **ทีม dev = 1 คน + Claude (AI pair)** | ต้องเลือก stack ที่ Claude เก่ง (Next.js + TypeScript) |
| **ไม่มีประสบการณ์ XR** | XR = Three.js mockup + video เท่านั้น ไม่ live VR |
| **AI API ต้องใช้ Claude** | ผูกกับ Anthropic key — ต้องมี fallback (cache result) |
| **OCR ภาษาไทย ทำสูงไม่ทันใน 7 วัน** | ใช้ Mock + ตั้งเป้าผ่าน PoC ในวันจริง (CER ≤ 10%) |
| **ไม่มี real police data** | ใช้ mock data ที่ inspired จากข่าวสาธารณะ + รายงาน ก.พ.ร. public |

---

## 6. นิยาม Success

### สำเร็จ = กรรมการเชื่อว่าเราทำได้

วัดจาก signal เหล่านี้:
1. กรรมการเปิดทุกหน้า navigation ไม่ติด — "ครบจริง"
2. กรรมการลอง login เอง ลองสร้างคำสั่งเอง — "ใช้งานได้จริง"
3. กรรมการเห็น AI ร่างหนังสือต่อหน้า — "AI ทำงานจริง"
4. กรรมการอ่าน TOR Coverage Matrix — "เรา map ตาม TOR ทุกข้อ"
5. กรรมการดู Audit Log เห็นสิ่งที่ตัวเองเพิ่งทำ — "Security ใช้ได้จริง"

### ล้มเหลว = สิ่งที่ห้ามให้เกิด

- เปิด URL แล้วเปิดไม่ขึ้น (Vercel down)
- กดปุ่มแล้ว 500 error
- AI ตอบช้าเกิน 30 วินาที (timeout)
- หน้าใน sidebar มีบางหน้าเปิดไม่ได้
- ไม่มี TOR reference ในหน้าใดหน้าหนึ่ง

---

## 7. Timeline (ภาพรวม)

| Phase | วันที่ | สิ่งที่ทำ |
|---|---|---|
| **Day 1** | (กำลังทำ) | Setup + DB + Auth + Sidebar 20 หน้า + Dashboard mock |
| **Day 2** | | Command CRUD + Workflow 9 states + Real Dashboard |
| **Day 3** | | AI Command Drafting (Claude API) end-to-end |
| **Day 4** | | Doc Classification + Upload + File storage |
| **Day 5** | | OCR + Intelligent Search 4 modes |
| **Day 6** | | Polish 13 scaffolded screens + Architecture + Mobile + TOR Matrix |
| **Day 7** | | Deploy Vercel + Dress rehearsal + Plan B prep |

ดูรายละเอียด: [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md)

---

## 8. ใครเป็นใคร (Stakeholders)

| Role | คำอธิบาย |
|---|---|
| **Broccolie (ผู้ใช้)** | Solo developer ที่จะเสนองาน — เป็นคนตัดสินใจหลัก / ทำงานคู่กับ Claude |
| **Sale ของบริษัท** | คนแจ้ง Broccolie ให้ไปพรีเซ้น |
| **Claude (AI Pair Programmer)** | เขียน code + เอกสาร + คำตอบ — assistant ที่ทำงานร่วมกับ Broccolie |
| **กรรมการ ตร.** | 6 คนที่ตัดสินใจประมูล |
| **สยศ.ตร.** | เจ้าของโครงการ |

---

## 9. หลักการสำคัญที่ Claude ต้องยึด

ดู [`CODING_STANDARD.md`](CODING_STANDARD.md) สำหรับรายละเอียด แต่หัวใจคือ:

1. **อ่านเอกสารใน `docs/` ก่อนเขียนโค้ดทุกครั้ง**
2. **ทุก feature ต้อง map กับ TOR clause** — แสดงในหน้า UI ด้วย banner
3. **Real app ไม่ใช่ mockup** — มี DB จริง, validation จริง, error handling จริง
4. **ภาษาไทยสำหรับ UI / English สำหรับ code**
5. **No `any` ใน TypeScript / No secrets ใน code**
6. **Error message ที่ user เห็น ต้องเป็นภาษาไทย user-friendly**
7. **ทุก action บันทึก audit log**

---

## 10. คำถามที่ผู้เข้ามาใหม่มักถาม

**Q: ต่างจากแค่ demo ทั่วไปยังไง?**
A: นี่ไม่ใช่ mock prototype — มี Postgres จริง, Auth.js จริง, AI ทำงานจริง deploy บน Vercel — กรรมการเปิดดูได้จากที่ไหนก็ได้

**Q: ต้องครอบคลุม TOR ทุกข้อจริงๆ ใน 7 วันเหรอ?**
A: ครอบคลุม visual + navigation ครบ 100% — แต่ functional แค่ 7 หน้า (Tier 1) ที่เหลือเป็น scaffolded UI พร้อม TOR mapping — เราซื่อสัตย์กับกรรมการเรื่องนี้

**Q: XR ทำจริงมั้ย?**
A: ไม่ทำจริง — ใช้ Three.js + video เท่านั้น เราบอกตรงๆ ว่า phase 2 ของ project

**Q: ใช้ AI ของใคร?**
A: Anthropic Claude API — เพราะภาษาไทยดี + พร้อม API + accuracy สูง

**Q: ทำไมไม่ใช้ React Native สำหรับ mobile?**
A: เวลาไม่พอ — ใช้ PWA + Responsive design แทน (ก็ตอบ TOR ข้อ 5.5 ได้)

**Q: ทำเสร็จแล้วใช้ในงานจริงได้มั้ย?**
A: เป็น **Phase 1 MVP** — Foundation ที่ดี / ขยายต่อได้ — ถ้าชนะประมูล สามารถพัฒนาต่อบน codebase นี้ตาม TOR 240 วัน

---

## 11. Refresher สำหรับ Claude session ใหม่

ถ้าคุณคือ Claude ที่เพิ่งเข้า session นี้:

1. อ่าน [`TOR_SUMMARY.md`](TOR_SUMMARY.md) ก่อน — รู้ว่าระบบ 7 ตัวคืออะไร
2. อ่าน [`ARCHITECTURE.md`](ARCHITECTURE.md) — รู้ว่าเรา design ระบบยังไง
3. อ่าน [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — รู้ว่ามี table อะไรบ้าง
4. อ่าน [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) — รู้ว่าเราอยู่ Day ไหน
5. ตรวจ `git log` + `TaskList` — รู้ว่าทำอะไรไปแล้ว
6. ถามผู้ใช้ว่าจะทำอะไรต่อ — อย่าเริ่มเขียน code โดยไม่ confirm
