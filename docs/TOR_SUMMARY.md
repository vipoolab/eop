# TOR EOP — สรุปฉบับสมบูรณ์

> สรุปจาก TOR EOP.pdf จำนวน 60 หน้า — สำหรับ Claude session ใหม่ / dev คนใหม่ อ่านเพื่อเข้าใจสิ่งที่ ตร. ต้องการ
>
> **โครงการ:** พัฒนาระบบวางแผนและติดตามการปฏิบัติงาน สำนักงานยุทธศาสตร์ตำรวจ (EOP)
> **เจ้าของโครงการ:** สำนักงานยุทธศาสตร์ตำรวจ (สยศ.ตร.) สำนักงานตำรวจแห่งชาติ
> **งบประมาณ:** ~92 ล้านบาท
> **ระยะเวลา:** 240 วัน / 4 งวด

---

## 📋 1. สิ่งที่ ตร. ต้องการให้ส่งมอบ

| หมวด | จำนวน |
|---|---|
| ซอฟต์แวร์ (โปรแกรม) | **7 โปรแกรม** |
| ฮาร์ดแวร์ (Server Nodes) | **9 nodes** + Storage + Network + UPS + Cooling |
| บริการ Internet | **2 ชุด** |
| ฝึกอบรม | **2 หลักสูตร / 200 คน** |
| PoC ในวันสอบ | **4 ฟีเจอร์** |
| ทีมงานขั้นต่ำ | **10 คน** |

---

## 🖥️ 2. ซอฟต์แวร์ — 7 โปรแกรม (TOR ข้อ 5.4)

### 🎯 โปรแกรม 1: Strategic-based Module (TOR 5.4.1)

**วัตถุประสงค์:** เชื่อมโยงยุทธศาสตร์ระดับสูงกับการปฏิบัติ — AI ช่วยตรวจสอบความสอดคล้อง

**ผู้ใช้งาน:**
- ผบ.ตร., รอง ผบ.ตร. (ดู dashboard ภาพรวมประเทศ)
- ผบช., ผกก. (ดู alignment ของหน่วยตน)
- เจ้าหน้าที่ กองยุทธศาสตร์ (ยศ.) (ป้อนแผน + train AI)

**ข้อมูลที่ใช้:**
- **ภายนอก:** ยุทธศาสตร์ชาติ 20 ปี (สศช.), แผนแม่บท (สำนักนายกฯ), แผนปฏิบัติราชการ ตร.
- **ภายใน:** คำสั่งที่ออก (จากระบบ 4), KPI หน่วยงาน, นโยบาย ผบ.ตร. ประจำปี
- **AI Training Data:** คำสั่งเก่า + label ยุทธศาสตร์

**ฟีเจอร์ (TOR ข้อ 1.1-1.3):**
- 1.1 Structured Learning Dataset Management
- 1.2 AI Strategic Alignment + Draft Recommendation (NLP)
- 1.3 KPI Dashboard + Drill-down + Data Visualization

---

### 📋 โปรแกรม 2: Agenda-based Module (TOR 5.4.2)

**วัตถุประสงค์:** บริหารวาระ ภารกิจ + AI ร่างหนังสือสั่งการ + สร้างแบบฟอร์ม

**ผู้ใช้งาน:**
- ผบ.ตร., ผบช., ผกก. (สั่งการ)
- เลขาฯ ผบ. (ตรวจร่าง AI)
- Admin หน่วย (สร้างแบบฟอร์ม)

**ข้อมูลที่ใช้:**
- คลังหนังสือสั่งการเก่า 5-10 ปี (train AI)
- Template หนังสือราชการ (สำนักนายกฯ ระเบียบงานสารบรรณ)
- โครงสร้างองค์กร (จากระบบ 7)
- ยุทธศาสตร์ + KPI (จากระบบ 1)

**ฟีเจอร์ (TOR ข้อ 2.1-2.3):**
- 2.1 Mission & Agenda Management — บริหารวาระ ภารกิจ
- 2.2 **AI Command Generator** ⭐ **PoC 1** — Generative AI ร่างหนังสือ
- 2.3 Dynamic Form Builder — No-Code Drag & Drop

---

### ✅ โปรแกรม 3: Compliance-based Module (TOR 5.4.3)

**วัตถุประสงค์:** สร้างรายงานตามมาตรฐานราชการอัตโนมัติ

**ผู้ใช้งาน:**
- ฝ่ายอำนวยการ (อจ.สยศ.ตร.)
- Quality Assurance Officer
- ผบ.ตร. (ดู score)
- หน่วยประเมินภายนอก (read-only)

**ข้อมูลที่ใช้:**
- คำสั่งและผลปฏิบัติ (จากระบบ 4)
- KPI achievement (จากระบบ 1)
- งบประมาณ + การใช้จ่าย (ระบบบัญชี ตร. — external)
- Audit log (จากระบบ 7)
- **Template:** ก.พ.ร., ITA, PMQA (จากหน่วยประเมิน)

**ฟีเจอร์ (TOR ข้อ 3.1-3.2):**
- 3.1 รายงาน ก.พ.ร./ITA/PMQA/รายงาน 4.0
- 3.2 Self-Assessment ก่อนส่ง

---

### 🔄 โปรแกรม 4: Command & Operation System (TOR 5.4.4)

**วัตถุประสงค์:** **หัวใจของระบบ** — บริหารวงจรชีวิตคำสั่งทั้งหมด

**ผู้ใช้งาน:** **ทุกคนใน ตร.** (ระดับชั้นประทวน → ผบ.ตร.)

**ข้อมูลที่ใช้:**
- ร่างจากระบบ 2 (AI Command Drafting)
- User + Unit hierarchy (จากระบบ 7)
- เหตุการณ์ฉุกเฉิน (จากระบบ 6)
- e-Signature service (TDID / TDA — external)

**Output ไปยัง:**
- ระบบ 1 (KPI dashboard)
- ระบบ 3 (Compliance logs)
- ระบบ 7 (Audit trail)
- ระบบ 6 (Search index)

**วงจรคำสั่ง 9 สถานะ:**
```
1. ร่าง → 2. เสนอ → 3. อนุมัติ → 4. เผยแพร่ → 5. รับทราบ
       → 6. ปฏิบัติ → 7. ส่งผล → 8. ตรวจ → 9. ปิด
```

**ฟีเจอร์ (TOR ข้อ 4.1-4.5):**
- วงจรคำสั่ง 9 สถานะ + e-Signature
- Read Receipt / Acknowledgement
- Smart Notification + Auto-Escalation
- โหมดเหตุฉุกเฉิน
- Chain of Command + Cascading

---

### 🥽 โปรแกรม 5: XR Command Center (TOR 5.4.5)

**วัตถุประสงค์:** ศูนย์ปฏิบัติการเสมือนจริง — ผบ. ระดับสูงสวมแว่น VR ดูทุกอย่างได้พร้อมกัน

**ผู้ใช้งาน:** **VIP เท่านั้น** (กลุ่มเล็ก)
- ผบ.ตร., รอง ผบ.ตร., ผบช. (ระดับสูง)
- War Room กลาง (ตอนเหตุการณ์สำคัญ)

**ข้อมูลที่ใช้:**
- Dashboard จากทุกระบบ (1, 2, 4, 6)
- GIS data (จากระบบ 6)
- Real-time event (จาก API 191, CCTV)

**ฟีเจอร์ (TOR ข้อ 5.1-5.10):**
- XR Headset Interface (Meta Quest 3+)
- Virtual Screens 60-62 จอ
- Infinite Canvas
- GIS Heatmap 360°
- Dashboard Interaction ใน XR
- 4 Chart types: Line/Bar/Pie/Map
- 2+ Virtual Screens พร้อมกัน

---

### 🤖 โปรแกรม 6: Data & AI Management System (TOR 5.4.6)

**วัตถุประสงค์:** **Backbone ของข้อมูลทั้งระบบ** + AI ทุกฟีเจอร์

**ผู้ใช้งาน:**
- Data Engineer / Analyst
- ทุกคนใน ตร. (search + view dashboard)
- ผบ. + ผบช. (predictive + executive summary)
- Front-line officer (OCR + Doc Class)

**ข้อมูลที่ใช้:**
- **ภายใน:** ทุกระบบ (1-5, 7)
- **ภายนอก:**
  - ศูนย์รับแจ้งเหตุ 191 (API)
  - CCTV (กระทรวง/กทม.)
  - ข่าวกรอง (อช.)
  - กรมการปกครอง
  - กรมอุตุนิยมวิทยา (predictive)
  - กรมการขนส่งทางบก
- เอกสาร PDF (สำหรับ OCR)
- เอกสาร DOCX (สำหรับ Doc Class)

**ฟีเจอร์ (TOR ข้อ 5.4.6 + 8.10):**
- Big Data Lake/Warehouse
- ETL pipeline
- **OCR ภาษาไทย** ⭐ **PoC 3**
- **AI Document Classification** ⭐ **PoC 2**
- Predictive Analytics
- Executive Summary AI
- Search 4 modes (Basic/Advanced/Full-text/Semantic)
- Dashboard 5 ประเภท (ก้าวหน้า / พื้นที่เสี่ยง / ฉุกเฉิน / ทรัพยากร / ประสิทธิภาพ)
- Heatmap 3 มิติ
- API integration กับ 191/CCTV/ข่าวกรอง

---

### 🛡️ โปรแกรม 7: Infrastructure & Security System (TOR 5.4.7)

**วัตถุประสงค์:** ความปลอดภัย + จัดการผู้ใช้ + Audit (ตร. เป็น **CII = Critical Information Infrastructure**)

**ผู้ใช้งาน:**
- IT Admin ของ ตร.
- CISO + Security Analyst
- Internal/External Auditor (สตง./คตง.)
- **ทุกคนใน ตร.** (ใช้ login/MFA)

**ข้อมูลที่ใช้:**
- รายชื่อ ตร. ทั้งหมด (กองทะเบียนพล)
- โครงสร้างหน่วย (กอง 2 สารบรรณ)
- Threat intelligence (external feeds)
- Compliance standards (ISO 27001, **PDPA**, CII)

**ฟีเจอร์ (TOR ข้อ 7.1-7.2):**
- User Management (สร้าง/แก้/ระงับ บัญชี)
- **MFA** (Multi-Factor Authentication)
- **RBAC** (Role-Based Access Control)
- **SSO** (Single Sign-On)
- **Local Authentication** (bcrypt one-way hash)
- **Zero Trust** Architecture
- **Encryption** at rest + in transit
- **Audit Trail** (บันทึกทุกการกระทำ)
- **SIEM** (Security Information & Event Management)
- ป้องกัน: SQL Injection, DDoS, XSS, CSRF

---

## ⚙️ 3. ข้อกำหนดอื่นๆ ของซอฟต์แวร์ (TOR 5.5 + 8.x)

- **Web Application** (Desktop browser)
- **Mobile Application** (iOS + Android — หรือ PWA)
- **Responsive Design** (Tablet)
- รองรับ **Big Data**
- AI ช่วยตรวจเอกสารและรายงาน
- Smart Notification
- Real-time Dashboard

---

## 🖨️ 4. ฮาร์ดแวร์ (TOR ข้อ 5.7)

### Server Nodes

| ชุด | จำนวน | สเปคหลัก |
|---|---|---|
| **App Node** | 3 | CPU 20 core, RAM 256GB ECC DDR4, RAID 0/1/5 |
| **Database Node** | 3 | CPU 20 core, RAM 256GB, SSD/SAS 10,000+ RPM, FC 16Gbps |
| **Protocol Node (AI/ML)** | 3 | CPU 32 core, **GPU GDDR6 40GB+** with **14,000+ Core** (เทียบ A100/H100), RAM 320GB |

### Network + Power + Safety

| รายการ | สเปค |
|---|---|
| **L3 Switch 64-port** | 2 ชุด, OSPF/RIPv2 |
| **UPS** | 10 kVA / 10 kW, On-line Double Conversion |
| **Cooling** | 5-8 kW, Rack-type / Close-Loop / In-Row |
| **Access Control** | RFID / Face / Finger / IC Card, ≥1,000 users |
| **Fire Suppression** | Clean Agent อัตโนมัติ |
| **Storage SAN** | FC 16Gbps |
| **XR Headsets** | Meta Quest 3+ |

---

## 🌐 5. Internet (TOR ข้อ 5.6)

**Internet 2 ชุด (Redundancy):**
- Fiber Optic Leased Line (ไม่ใช่ Internet บ้าน)
- Fixed Public IP ≥1 IP
- ความเร็ว 500/500 Mbps (upload/download เท่ากัน)
- รองรับขยายเป็น 1 Gbps

---

## 🎓 6. การฝึกอบรม (TOR ข้อ 15.)

**2 หลักสูตร / รวม 200 คน:**

| หลักสูตร | จำนวนคน | กลุ่มเป้าหมาย |
|---|---|---|
| ผู้ดูแลระบบ | ≥100 | IT Admin ของ ตร. |
| ผู้ปฏิบัติงาน | ≥100 | User ทั่วไป |

ผู้รับจ้างรับผิดชอบทุกอย่าง: วิทยากร / เอกสาร / คู่มือ / อาหาร / สถานที่

---

## 👥 7. ทีมงาน — 10 คนขั้นต่ำ (TOR ข้อ 14.)

| ตำแหน่ง | จำนวน | คุณวุฒิ | ประสบการณ์ |
|---|---|---|---|
| Project Manager | 1 | ป.โท วิศวกรรม/IT | **10 ปี+** |
| Project Coordinator | 1 | ป.ตรี+ | 5 ปี+ |
| System Engineer | 1 | ป.ตรี+ | 5 ปี+ |
| Data Engineer | 1 | ป.ตรี+ | 5 ปี+ |
| Front-end Developer | 2 | ป.ตรี+ | 5 ปี+ |
| Back-end Developer | 2 | ป.ตรี+ | 5 ปี+ |
| Training Specialist | 1 | ป.ตรี+ | 5 ปี+ |
| Tester | 1 | ป.ตรี+ | 5 ปี+ |

---

## 💼 8. คุณสมบัติบริษัท (TOR ข้อ 3.x)

- มีคุณสมบัติตาม กฎหมายจัดซื้อจัดจ้างภาครัฐ
- **ทุนจดทะเบียน ≥ 3 เท่าของวงเงิน** (~276 ล้าน ถ้าวงเงิน 92M) — ⚠️ **ตรวจสอบกับบริษัทก่อน**
- ลงทะเบียน e-GP
- Bank Guarantee
- ไม่อยู่ใน blacklist

---

## 📊 9. เกณฑ์การให้คะแนน (TOR ข้อ 8.x) — รวม 100%

| ข้อ | เกณฑ์ | น้ำหนัก |
|---|---|---|
| 8.2.1 | ราคา (Price) | **20%** |
| 8.2.2 | ผลงานและประสบการณ์บริษัท | 10% |
| 8.2.3 | คุณวุฒิและประสบการณ์บุคลากร | 10% |
| 8.2.4 | ความมั่นคงปลอดภัย CII | 15% |
| 8.2.5 | วิธีการบริหารและแผนการดำเนินงาน | 15% |
| 8.2.6 | **Proof of Concept (PoC)** | **30%** |
| | **รวม** | **100%** |

**PoC = 30% คือเกณฑ์เดียวที่ใหญ่ที่สุด** — จุดตายของโครงการ

---

## 🎯 10. PoC — 4 ฟีเจอร์ (TOR ข้อ 8.2.6 / 30 คะแนน)

### PoC 1: AI Command Drafting (5 คะแนน) — TOR 3.5.1

**Input:** 5 รายการ
1. หัวเรื่องของหนังสือสั่งการ
2. หน่วยงานหรือผู้รับคำสั่ง
3. วัตถุประสงค์หรือเหตุผลของการสั่งการ
4. ข้อสั่งการหลักหรือแนวทางการปฏิบัติ
5. ระยะเวลาหรือเงื่อนไขการรายงานผล

**Output:** ร่างหนังสือสั่งการที่มีลักษณะเป็นหนังสือราชการ

**Scoring (2 ด้าน):**
- ด้าน 1: ร่างเอกสารมีองค์ประกอบหลักของหนังสือราชการ (หัว/ที่/เรื่อง/เรียน/อ้างถึง/เนื้อหา/ลงนาม)
- ด้าน 2: ร่างเอกสารมีข้อมูลครบตาม 5 input

**คะแนน:**
- ครบ 2 ด้าน = **5 pt**
- ครบ 1 ด้าน = 2.5 pt
- ไม่ครบ = 0

---

### PoC 2: Document Classification (10 คะแนน) — TOR 3.5.2

**Pre-test:** ตร. ให้เอกสารตัวอย่าง **16 ฉบับ** (training data)

**วัน PoC:** ตร. จัดเตรียมเอกสารใหม่ที่ไม่เคยเห็น **16 ฉบับ** (test data)

**รูปแบบ:** ไฟล์ DOCX

**หมวด (6 หมวด):**
1. ยศ. — กองยุทธศาสตร์
2. ผบ. — กองแผนงานอำนวยการ
3. มค. — กองแผนงานความมั่นคง
4. มข. — กองแผนงานกิจการพิเศษ
5. วจ. — กองวิจัย
6. อจ.สยศ.ตร. — ฝ่ายอำนวยการ

**Scoring:** ไม่ได้ระบุ accuracy threshold ตรงๆ แต่อ้างอิงผลการจำแนกถูกต้อง

---

### PoC 3: OCR ภาษาไทย (10 คะแนน) — TOR 3.5.3

**Input:** ไฟล์ PDF **6 ไฟล์**
- ความละเอียด ≥ 300 dpi
- ตัวอักษรขนาด ≥ 10 point
- ไม่เลือก font

**ผู้ใช้:** ทดสอบกับเอกสารคำสั่งของ ตร.

**สูตร CER (Character Error Rate):**
```
CER = (S + D + I) / N × 100
```
- S = Substitutions (ตัวอักษรที่ต้องเปลี่ยน)
- D = Deletions (ตัวอักษรที่ขาด)
- I = Insertions (ตัวอักษรที่เพิ่ม)
- N = จำนวนตัวอักษรทั้งหมดใน Ground Truth

**Scoring:**
| CER | คะแนน |
|---|---|
| ≤ 10% | **10 pt** |
| > 10% – 20% | 5 pt |
| > 20% – 30% | 2.5 pt |
| > 30% | 0 |

---

### PoC 4: XR Command Center (5 คะแนน) — TOR 3.5.4

**ต้องเตรียม:**
- XR Headset (Meta Quest 3+)
- ระบบ prototype ที่ทำงานได้

**กรรมการดู:**
- Virtual Screens 60-62 จอ
- Dashboard 4 chart types: Line / Bar / Pie / Map
- GIS Heatmap / Bubble Map (Spatial Information System)
- Dashboard Interaction ภายใน XR
- เปิด Virtual Screens 2+ หน้าต่างพร้อมกัน

**Scoring (5 pt):** ตามจำนวนฟีเจอร์ที่ครบ

---

## 📅 11. การส่งมอบ — 4 งวด (TOR ข้อ 8.2)

| งวด | ภายใน | สิ่งที่ต้องส่ง |
|---|---|---|
| **1** | 30 วัน | Project Management Plan + Requirements Analysis |
| **2** | 60 วัน | Design/Prototype + Development & Deployment Plan + UAT/SIT Plan + Training Plan |
| **3** | กลาง | Workflow Diagram + ER Diagram + Screen Design + Report Design + Data Dictionary |
| **4** | 240 วัน | UAT/SIT result + Training + User Manual + Maintenance Manual + **Source Code** + Use Case Diagram + Installation & Configuration Guide |

---

## 🛡️ 12. การรับประกัน (TOR ข้อ 13.)

- **รับประกัน 2 ปี** หลังตรวจรับงานในงวดสุดท้าย
- **Support 24×7** ในช่วงประกัน
- **On-Site Service ทุก 6 เดือน** (Preventive Maintenance)
- **Corrective Maintenance** เมื่อพบปัญหา (response time + on-site)

---

## 🔒 13. ทรัพย์สินทางปัญญา (TOR ข้อ 16.)

- **Source Code ทั้งหมด** ต้องส่งมอบให้ ตร.
- IP เป็นของ ตร. (ผู้ว่าจ้าง)
- ห้ามใช้ซอฟต์แวร์ละเมิดลิขสิทธิ์

---

## ⚠️ 14. ความสำคัญ + Note สำหรับการพัฒนา

### สิ่งที่ ตร. เน้นมากเป็นพิเศษ

1. **CII Compliance** — เป็นโครงสร้างพื้นฐานสำคัญทางสารสนเทศ
2. **PDPA** — ข้อมูลส่วนบุคคล (ตำรวจ + ประชาชน)
3. **ภาษาไทย** — UI, OCR, NLP, Search ทุกอย่างต้องดีกับไทย
4. **Big Data** — ข้อมูล ตร. มหาศาล
5. **Real-time** — ดูสถานการณ์ปัจจุบันได้

### Trade-off ที่ต้องรู้

- ผบ. คนใน ตร. **คุ้นกับเอกสารราชการ** — ระบบต้องดูเหมือนเอกสารราชการ ไม่ใช่ web app ฝรั่ง
- กรรมการ **ผสมระหว่าง IT + ปฏิบัติการ** — ต้องเล่าทั้ง 2 มุม
- **XR เป็นจุดเสี่ยง** — แต่ก็เป็นจุดขาย (innovation)
- ไม่ใช่ทุกหน่วยจะใช้ทุกระบบ — แต่ระบบต้องรองรับทั้งหมด

---

## 📎 15. Files ที่ render เก็บไว้

- TOR ตัวจริง: `C:\Users\Broccolie\Downloads\TOR EOP.pdf` (60 หน้า scanned)
- TOR render เป็น PNG: `C:\Users\Broccolie\Downloads\tor_eop_pages\page_001.png` ... `page_060.png`

ถ้าต้องอ้างอิงรายละเอียดเพิ่มเติม ใช้ Read tool บน PNG ได้ (vision OCR ภาษาไทย)
