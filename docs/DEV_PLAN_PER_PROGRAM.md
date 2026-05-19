# แผนพัฒนาโปรแกรม EOP — แยกตามโปรแกรม (TOR-Based)

> **แหล่งอ้างอิง:** [`SYSTEM_OVERVIEW_PAPER.md`](SYSTEM_OVERVIEW_PAPER.md) v3.1 (สรุปจาก TOR EOP.pdf 60 หน้า)
>
> **กฎของเอกสารฉบับนี้:**
> 1. ระบุเฉพาะสิ่งที่ TOR ระบุไว้ — **ไม่มีการอนุมาน / ตีความ / เพิ่มเติม**
> 2. ทุก feature อ้างอิงเลขข้อ TOR
> 3. ส่วนที่ **TOR ไม่ระบุ** → ระบุ "TOR ไม่ระบุ — รอถาม" แทนการเดา
> 4. ข้อเสนอเพิ่มเติมของผู้พัฒนา → อยู่ส่วน **§ ข้อเสนอที่ต้องถามก่อน** ด้านล่าง

---

## สารบัญ

โครงการ EOP ตาม TOR ข้อ 5.4 + 5.7 ต้องพัฒนา **8 โปรแกรม:**

| # | โปรแกรม | TOR ข้อ |
|---|---|---|
| 1 | **Strategic-based Module** | 5.4.1 |
| 2 | **Agenda-based Module** | 5.4.2 |
| 3 | **Compliance-based Module** | 5.4.3 |
| 4 | **Command & Operation System** | 5.4.4 |
| 5 | **XR Command Center** | 5.4.5 |
| 6 | **Data & AI Management System** | 5.4.6 |
| 7 | **Infrastructure & Security System** | 5.4.7 |
| 8 | **Hypervisor Portal Management** | 5.7 + ภาคผนวก ข §9 |

---

## โปรแกรมที่ 1: Strategic-based Module [TOR 5.4.1 / ภาคผนวก ก §1]

### บทบาท (ตาม TOR)
ระบบวางแผนและติดตามแบบตามยุทธศาสตร์ — เชื่อมโยงการวางแผนยุทธศาสตร์เข้ากับการปฏิบัติ

### ฟีเจอร์ที่ต้องพัฒนา

#### 1.1 Structured Learning Dataset Management
- **1.1.1** ใช้ **NLP (Natural Language Processing)** เพื่อให้ AI เรียนรู้บริบทและความสัมพันธ์ของแผนแต่ละระดับ
- **1.1.2** รองรับการนำเข้าข้อมูล **3 ระดับ**
- **1.1.3** รูปแบบ Structured Data

#### 1.2 AI Strategic Alignment
- **1.2.1** **Draft Recommendation** — แนะนำการปรับแก้ไขข้อความ
- **1.2.2** การเปรียบเทียบแผนยุทธศาสตร์:
  - (ก) Import + Create แผนยุทธศาสตร์ ตร. ระดับต่าง ๆ
  - (ข) รองรับ **Cascading Goals** + KPI

#### 1.3 KPI Dashboard
- (ก) แสดง KPIs แบบ **Data Visualization**
- (ข) **Drill-down** รายหน่วยงานและรายพื้นที่

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | TOR ระบุที่ |
|---|---|
| แผนระดับชาติ / แผนระดับที่ 1 (**ยุทธศาสตร์ชาติ**) | 1.1.2 |
| แผนระดับที่ 2 (**แผนแม่บท**) | 1.1.2 |
| แผนระดับที่ 3 (**แผนปฏิบัติราชการ**) | 1.1.2 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- แหล่งที่มาของแผน 3 ระดับ (ดึงจาก API ไหน / ขอจากหน่วยงานไหน / Upload เอง)
- รูปแบบ Structured Data (JSON / XML / DB schema)
- ปริมาณข้อมูล (กี่แผน / กี่ KPI)

---

## โปรแกรมที่ 2: Agenda-based Module [TOR 5.4.2 / ภาคผนวก ก §2]

### บทบาท (ตาม TOR)
ระบบวางแผนและติดตามแบบตามวาระ — บริหารวาระและภารกิจสำคัญ + AI ช่วยร่างหนังสือสั่งการ

### ฟีเจอร์ที่ต้องพัฒนา

#### 2.1 Mission & Agenda Management
- **2.1.1** **AI-Assisted Command Drafting** (AI ช่วยร่างหนังสือสั่งการ)
- **2.1.2** กำหนดเป้าหมายและขอบเขตของภารกิจ
- **2.1.3** **Targeting & Cascading** + ตัวชี้วัด

#### 2.2 AI Command Generator (PoC 1 — 5 คะแนน)
- **2.2.1** **Generative AI for Official Documents** — ระบุเพียง Keywords สำคัญ
- **2.2.2** รองรับ **4 กรณี:**
  - กรณีการก่อเหตุ
  - กรณีเหตุการณ์อันตรายร้ายแรง
  - กรณีงานสำคัญพิเศษ
  - กรณีงานพิเศษอื่นๆ

#### 2.3 Dynamic Agenda Reporting
- **2.3.1** **Dynamic Form Builder** — No-Code / Drag & Drop
- **2.3.4** ผู้รับจ้างต้องจัดทำ **แบบรายงานตั้งต้น ≥ 10 แบบ**

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | TOR ระบุที่ |
|---|---|
| Input PoC 1 — **5 รายการ** (หัวเรื่อง / หน่วยงาน / วัตถุประสงค์ / ข้อสั่งการ / ระยะเวลา) | PoC 1 (หน้า 50-51) |
| Keywords สำคัญ + เจตนารมณ์ของผู้ใช้ | 2.2.1 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- คลังหนังสือสั่งการเก่าสำหรับ train AI (มีให้ใช้ไหม? จำนวนเท่าไหร่?)
- Template หนังสือราชการมาตรฐาน (ระเบียบงานสารบรรณ — TOR ไม่บังคับใช้รูปแบบใด)
- รายชื่อหน่วยงาน ตร. (ดึงจากไหน — มาตรฐานของ ตร. มีโครงสร้าง?)
- ตัวอย่างแบบรายงาน 10 แบบที่ต้องทำ (TOR ไม่ระบุชื่อแบบรายงาน)

---

## โปรแกรมที่ 3: Compliance-based Module [TOR 5.4.3 / ภาคผนวก ก §3]

### บทบาท (ตาม TOR)
ระบบวางแผนและติดตามแบบตามกฎระเบียบข้อบังคับหรือมาตรฐาน

### ฟีเจอร์ที่ต้องพัฒนา

#### 3.1 สร้างและจัดการระบบฟอร์มรายงานตามมาตรฐาน
- **รายงาน ก.พ.ร.** (สำนักงานคณะกรรมการพัฒนาระบบราชการ)
- **รายงาน ITA** (Integrity & Transparency Assessment)
- **รายงาน PMQA** (Public Management Quality Award)
- **รายงาน 4.0** (รายงานระบบราชการ 4.0)

#### 3.2 Self-Assessment
- กระบวนการประเมินตนเองก่อนส่งหน่วยงานประเมินภายนอก

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | TOR ระบุที่ |
|---|---|
| Template มาตรฐาน ก.พ.ร. / ITA / PMQA / รายงาน 4.0 | 3.1 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- Template เฉพาะของแต่ละมาตรฐาน (รุ่น/ปี ของ template ที่ใช้)
- ผู้ใช้ที่กรอกรายงาน (ใครเป็นคนกรอก / เป็น role ไหน)
- รอบการประเมิน (รายไตรมาส / ปี)
- เกณฑ์การให้คะแนน Self-Assessment (เกณฑ์เปลี่ยนตามปี)

---

## โปรแกรมที่ 4: Command & Operation System [TOR 5.4.4 / ภาคผนวก ก §4]

### บทบาท (ตาม TOR)
ระบบสั่งการและติดตามการปฏิบัติงาน

### ฟีเจอร์ที่ต้องพัฒนา

#### 4.1 วงจรคำสั่ง 9 สถานะ + ลายเซ็นอิเล็กทรอนิกส์

> **TOR กำหนด:** "ร่าง → เสนอ → อนุมัติ → เผยแพร่ → การจ่ายคำสั่ง → รับทราบ → เริ่มปฏิบัติ → ส่งผลหลักฐาน → ปิดงาน/ประเมินผล"

#### 4.2 Tracking ระยะเวลาดำเนินการ

#### 4.3 Read Receipt / Acknowledgement
- บันทึก: ใคร / เมื่อไหร่ที่รับทราบ

#### 4.4 Tracking สถานะคำสั่งย่อย

#### 4.5 การกระจายคำสั่ง — ตั้งเป้าหมาย + ตัวชี้วัด

#### 4.6 Tracking บนสถานะ
- "รับทราบ / กำลังปฏิบัติ / ส่งผล / รอตรวจ / แก้ไข"

#### 4.7 Smart Notification + Auto-Escalation
- หากไม่รับทราบในเวลากำหนด → ยกระดับขึ้น

#### 4.8 ระบบสืบค้น + ตรวจสอบ + รักษาความปลอดภัย

#### 4.9 Dashboard Real-Time
- สำหรับผู้บังคับบัญชา / หน่วยงาน / ระบบโดยรวม

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | TOR ระบุที่ |
|---|---|
| คำสั่งที่สร้าง (Body, Subject, Target Units, ลายเซ็น) | 4.1 |
| Read Receipt log (User, Timestamp, Action) | 4.3 |
| สถานะคำสั่ง 9 ระดับ | 4.1 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- e-Signature service ที่ต้องใช้ (TDID? TDA? Self-issued?)
- โครงสร้างหน่วยงาน ตร. (กระจายคำสั่งไปยังหน่วยไหน — TOR ไม่ระบุโครงสร้างชัดเจน)
- เกณฑ์ Auto-Escalation (กี่ชั่วโมงไม่รับทราบ → escalate / ใครคือ "หน่วยเหนือ")

---

## โปรแกรมที่ 5: XR Command Center [TOR 5.4.5 / ภาคผนวก ก §5]

### บทบาท (ตาม TOR)
ระบบศูนย์ปฏิบัติการและควบคุมสั่งการเสมือนจริงขยาย (Extended Reality)

### ฟีเจอร์ที่ต้องพัฒนา

#### 5.1 XR Headset Interface
- พัฒนา Interface ของ EOP รองรับการแสดงผลผ่าน **XR Headset**

#### 5.2 Virtual Screens + Infinite Canvas
- จัดเรียงและขยายได้

#### 5.3 Interaction
- รองรับ Web Interface, Mouse/Keyboard, Wireless Controller

#### 5.4 High Readability บนอุปกรณ์ XR

#### 5.5 Near Real-Time

#### 5.6 หลายมุมมอง
- ส่วนกลาง / บช. / บก. / สน.
- **มุมมอง 360°**

#### 5.7 KPI Dashboard + GIS แผนที่เชิงพื้นที่

#### 5.8 Command & Control — ศูนย์กลางสั่งการ

#### 5.9 ขอ-ถ่ายทอด-ติดตามคำสั่งผ่าน XR

#### 5.10 ตรวจสอบสถานะ Real-Time

#### PoC 4 (5 คะแนน) สาธิตด้วย XR Headset:
- Virtual Screens **60-62 จอ** (หรือดีกว่า)
- Dashboard 4 chart types: **Line / Bar / Pie / Map**
- GIS Heatmap / Bubble Map
- Dashboard Interaction ภายใน XR
- Virtual Screens 2+ พร้อมกัน

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | TOR ระบุที่ |
|---|---|
| KPI Dashboard data | 5.7 |
| GIS spatial data | 5.7 |
| ข้อมูลคำสั่ง (สำหรับติดตาม) | 5.9-5.10 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- รุ่น XR Headset เฉพาะ (TOR ระบุแต่ specification — ไม่ระบุยี่ห้อ)
- GIS data source (Google Maps / OSM / ของ ตร.)
- พื้นที่ที่ครอบคลุม (ทั่วประเทศ / กทม. / เขตเฉพาะ)
- ผู้ใช้ที่จะใช้ XR (กี่คน / ระดับชั้นใด)

---

## โปรแกรมที่ 6: Data & AI Management System [TOR 5.4.6 / ภาคผนวก ก §6]

### บทบาท (ตาม TOR)
ระบบบริหารจัดการข้อมูลและปัญญาประดิษฐ์

### ฟีเจอร์ที่ต้องพัฒนา

#### 6.1 Heatmap 3 มิติ ในรูปแบบ XR

#### 6.2 AI สำหรับ
- วิเคราะห์
- สรุปรายงานสถานการณ์ (**Executive Summary**)
- ตรวจจับความผิดปกติ

#### 6.3 Predictive Analytics

#### 6.4 Integration กับระบบภายนอก ผ่าน API [TOR หน้า 30 ข้อ 6.4.2]
- **ศูนย์รับแจ้งเหตุ 191**
- **ระบบกล้องวงจรปิด (CCTV)**
- **ระบบข่าวกรอง**

#### 6.10 Data & AI Management
- **6.10.1** Data Lake / Data Warehouse
- **6.10.2** ETL pipeline + Data Quality
- **6.10.3 AI Document Processing:**
  - (ก) **Accuracy ≥ 85%** บนเอกสาร ≥ 300 dpi, ตัวอักษร ≥ 10 point
  - (ข) Document Preview เทียบกับ AI extract
  - (ค) Edit + ปรับปรุง Text Extraction
  - (ง) รองรับไฟล์: **DOCX, XLSX, PDF, JPG/JPEG, PNG**
  - (จ) Predictive Analytics
- **6.10.10 Dashboard 5 ประเภท** [TOR หน้า 34]:
  - ความก้าวหน้าภารกิจ
  - พื้นที่/ช่วงเวลาความเสี่ยง
  - เหตุฉุกเฉินและการตอบสนอง
  - การใช้ทรัพยากร
  - ประสิทธิภาพ/ประเมินผลตัวบุคคล
- **6.10.11 Search 4 โหมด:**
  - Basic Search / Keyword Search
  - Advanced Search (filter)
  - Full-Text & Content Search
  - Semantic Search

#### PoC 2: Document Classification (10 คะแนน)
- 16 เอกสาร → **6 หมวด** (ยศ./ผบ./มค./มข./วจ./อจ.สยศ.ตร.)

#### PoC 3: OCR ภาษาไทย (10 คะแนน)
- 6 ไฟล์ PDF, ≥ 300 dpi, ≥ 10pt
- **CER ≤ 10% = 10 pt**

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | แหล่งใน TOR | TOR ระบุที่ |
|---|---|---|
| **เหตุการณ์ realtime** | ศูนย์รับแจ้งเหตุ **191** | 6.4.2 |
| **ภาพ video** | ระบบ **กล้องวงจรปิด (CCTV)** | 6.4.2 |
| **ข้อมูลข่าวกรอง** | ระบบ **ข่าวกรอง** | 6.4.2 |
| เอกสารสำหรับ Doc Class | ตร. จัดเตรียม 16 ฉบับใน PoC | PoC 2 |
| PDF สำหรับ OCR | ตร. จัดเตรียม 6 ไฟล์ใน PoC | PoC 3 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- API spec ของศูนย์ 191 / CCTV / ข่าวกรอง (REST? Stream? Format?)
- ความถี่ของ data feed (Real-time / hourly / daily)
- มี API key / authorization ให้ใช้ไหม
- คลังเอกสารสำหรับ train Doc Classifier (16 ฉบับเป็น test set — train set จากไหน)
- Ground truth ของ OCR (ใครให้)
- พื้นที่ครอบคลุม Heatmap (ทั้งประเทศ / กทม.)

---

## โปรแกรมที่ 7: Infrastructure & Security System [TOR 5.4.7 / ภาคผนวก ก §7]

### บทบาท (ตาม TOR)
ระบบโครงสร้างพื้นฐานและความมั่นคงปลอดภัย

### ฟีเจอร์ที่ต้องพัฒนา

#### 7.1 User & Access Management
- **7.1.1** สร้าง / แก้ / ระงับ / ยกเลิกบัญชี + กำหนดสิทธิ์
- **7.1.2** **MFA** (Multi-Factor Authentication) + Local Authentication (**One-way Hash**)
- **7.1.3** **RBAC** (Role-Based Access Control)
- **7.1.4** Feedback ให้ผู้ใช้
- **7.1.5** **Activity Log / Audit Trail**
- **7.1.6** ป้องกัน Login/Logout

#### 7.2 Security & Compliance
- **7.2.1** **Zero Trust** — ตรวจสอบทุกครั้ง
- **7.2.2** **Encryption** at rest + in transit
- **7.2.3** ป้องกัน SQL Injection, DDoS, ฯลฯ
- **7.2.4** **Audit Log / Access Log**

#### CII Compliance (15 คะแนน) [TOR 9.2.4]
- ระบบต้องสอดคล้องกับ **Critical Information Infrastructure (CII)**

### ข้อมูลที่ใช้ (TOR ระบุ)

| ข้อมูล | TOR ระบุที่ |
|---|---|
| User credentials | 7.1.1 |
| Audit log events | 7.1.5, 7.2.4 |
| Session data | 7.1.2 |

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- จำนวนผู้ใช้ระบบ (ทั่วประเทศ / กี่หน่วยงาน)
- รายชื่อ Role ที่ต้องมี (TOR ระบุแค่ RBAC concept ไม่ระบุชื่อ role)
- มาตรฐาน CII เฉพาะที่ต้องผ่าน (สกมช.? พ.ร.บ. CII?)
- Retention period ของ Audit Log (TOR ไม่ระบุระยะเวลาเก็บ)

---

## โปรแกรมที่ 8: Hypervisor Portal Management [TOR 5.7 / ภาคผนวก ข §9]

### บทบาท (ตาม TOR)
ระบบจัดการพอร์ทัล Hypervisor 1 ระบบ — บริหารทรัพยากร virtualization

### ฟีเจอร์ที่ต้องพัฒนา [TOR หน้า 43]

| Feature | ข้อกำหนด |
|---|---|
| **HA** | High Availability + Auto-Restart |
| Storage | Thin Provisioning on Shared Storage |
| Migration | **Live VM Migration** (no downtime) |
| Management | **Web-based** Virtualization Management |
| Monitoring | CPU / Memory usage / Alarm / VM / Host / Datastore / Network |

### ข้อมูลที่ใช้ (TOR ระบุ)
- VM / Host / Datastore / Network resources

### ข้อมูลที่ TOR **ไม่ระบุ** — รอถาม
- Hypervisor product เฉพาะ (VMware / Proxmox / Hyper-V / KVM)
- จำนวน Host / VM ที่ต้องรองรับ
- License ของ Hypervisor (รวมในงบไหม)

---

## สรุปข้อมูลที่ TOR ระบุชัด vs ไม่ระบุ

| โปรแกรม | TOR ระบุ data source | TOR ไม่ระบุ (รอถาม) |
|---|---|---|
| 1 Strategic | แผน 3 ระดับ (ชาติ/แม่บท/ปฏิบัติราชการ) | แหล่งที่มา + format |
| 2 Agenda | Input 5 รายการของ PoC 1 + Keywords | คลังหนังสือเก่า + template |
| 3 Compliance | Template ก.พ.ร./ITA/PMQA/4.0 | รุ่น/ปีของ template |
| 4 Command | Command body + Read Receipt log | e-Signature service + Org structure |
| 5 XR | KPI + GIS + Command data (ดึงจากระบบอื่น) | GIS data source + headset model |
| 6 Data & AI | **API 191 + CCTV + ข่าวกรอง** | API spec + frequency + auth |
| 7 Security | User + Audit + Session | จำนวน user + role names + CII standard |
| 8 Hypervisor | VM/Host/Datastore | Hypervisor product |

---

## ตารางการเชื่อมโยงข้อมูลระหว่างโปรแกรม (Data Flow ตามที่ TOR ระบุ)

```
[ระบบ 1: Strategic]
   ↓ ยุทธศาสตร์ + KPI
[ระบบ 2: Agenda]
   ↓ AI Command Drafting (จาก keywords + บริบท)
[ระบบ 4: Command & Operation]
   ↓ คำสั่ง + สถานะ
   ↓
   ├──→ [ระบบ 3: Compliance] — ดึงข้อมูลไปรายงาน
   ├──→ [ระบบ 5: XR] — แสดง Dashboard + GIS
   ├──→ [ระบบ 6: Data & AI] — Big Data + Search + OCR
   └──→ [ระบบ 7: Infra/Security] — Audit Log

[External via API — TOR 6.4.2]
   ├─ ศูนย์รับแจ้งเหตุ 191
   ├─ CCTV
   └─ ข่าวกรอง
   ↓
[ระบบ 6: Data & AI Management] — รับเข้า process
```

> **TOR ไม่ระบุ:** Data flow รายละเอียด (Sync/Async / Event-driven / Batch) — รอถาม

---

## งวดการส่งมอบ (ตาม TOR ข้อ 8 — Mapping กับโปรแกรม)

| งวด | ภายในกี่วัน | สิ่งที่ต้องส่ง | โปรแกรมที่เกี่ยว |
|---|---|---|---|
| 1 | 30 วัน | Project Management Plan + Requirements Analysis | ทั้ง 8 โปรแกรม (วิเคราะห์) |
| 2 | 60 วัน | Design/Prototype + Dev Plan + UAT/SIT Plan + Training Plan | ทั้ง 8 โปรแกรม (ออกแบบ) |
| 3 | 230 วัน | Workflow + ER + Screen + Report + Data Dictionary | ทั้ง 8 โปรแกรม (พัฒนา) |
| 4 | 240 วัน | UAT/SIT + Training + Manuals + **Source Code ≥ 2 ชุดต่อระบบ** | ทั้ง 8 โปรแกรม (ส่งมอบ) |

---

## รายการ Deliverable ที่ TOR กำหนดเฉพาะ

### โปรแกรม 2 (Agenda)
- **แบบรายงานตั้งต้น ≥ 10 แบบ** [TOR 2.3.4]

### โปรแกรม 6 (Data & AI)
- รองรับไฟล์ 5 format: **DOCX, XLSX, PDF, JPG/JPEG, PNG** [TOR 6.10.3(ง)]
- Doc Classification: **6 หมวด** (ยศ./ผบ./มค./มข./วจ./อจ.สยศ.ตร.) [PoC 2]
- OCR: CER ≤ 10% [PoC 3]

### โปรแกรม 5 (XR)
- Virtual Screens **60-62 จอ** [PoC 4]
- Dashboard 4 chart types: **Line / Bar / Pie / Map** [PoC 4]

### Management Plan (ตาม TOR 9.2.5)
- **5 Mockup Design หน้าจอ** [TOR หน้า 49]:
  - หน้าจอร่างหนังสือสั่งการ
  - หน้าจอรับข้อสั่งการของหน่วยงาน
  - หน้าจอติดตามการดำเนินการ
  - หน้าจอ Dashboard
  - หน้าจอการแสดงผล (XR / Visualization)
- รูปแบบ: **PDF A3 / PowerPoint / Canva**

---

## ⚠️ ส่วนที่ TOR ไม่ระบุ — รวมประเด็นที่ต้องถาม

> **TOR ไม่ได้ระบุ:** Technology stack, Architecture pattern, Database engine, Hosting, Development methodology

ผมไม่ใส่ tech recommendation ในเอกสารฉบับนี้ตามกฎ — ถ้าต้องการคำแนะนำ tech stack ให้ดู [`PROPOSAL_ADDITIONS.md`](PROPOSAL_ADDITIONS.md) (รออนุมัติ)

---

## § ข้อเสนอที่ต้องถามก่อน (ผู้พัฒนาเสนอเพิ่ม)

ตามกฎ — ส่วนนี้ผมอยากแนะนำ แต่ต้อง **ถามอนุมัติก่อน** ใส่ลง paper หลัก

### ❓ คำถาม 1: รวบรวมข้อมูลขาดที่ TOR ไม่ระบุก่อนเริ่ม dev ไหม?

ผมเห็นว่ามี ~25 จุดที่ TOR ไม่ระบุ (ดูตารางด้านบน) — ผมแนะนำให้:
- ส่งหนังสือถาม สยศ.ตร. ขอข้อมูลเพิ่ม (เช่น API spec 191/CCTV, Template ก.พ.ร./ITA, รายชื่อ Role)
- กำหนดเป็น Assumption + ระบุชัดในงวด 1 (Requirements Analysis)

**ขอ approve?** — ทำลิสต์คำถามที่จะส่งไป สยศ.ตร. ในงวด 1?

---

### ❓ คำถาม 2: ลำดับการพัฒนาควรเป็นยังไง?

TOR ไม่กำหนด priority ของ 8 โปรแกรม — แต่ในมุม dev มีความ dependency:

```
ระบบ 7 (Auth/Security)  ← ต้องทำก่อนทุกระบบ
   ↓
ระบบ 6 (Data & AI Foundation: DB, ETL)
   ↓
ระบบ 1 (Strategic) + ระบบ 4 (Command)  ← Core business
   ↓
ระบบ 2 (Agenda) + ระบบ 3 (Compliance)
   ↓
ระบบ 5 (XR) + ระบบ 8 (Hypervisor)  ← ต่อยอด
```

**ขอ approve?** — เสนอลำดับนี้ หรืออยากปรับ?

---

### ❓ คำถาม 3: รูปแบบการเขียน Requirements Analysis ของแต่ละโปรแกรม?

งวด 1 (30 วัน) ต้องส่ง Requirements Analysis — TOR ไม่ระบุ format

ผมเสนอ:
- 1 เอกสารต่อโปรแกรม (รวม 8 เอกสาร)
- แต่ละเอกสารมี:
  - Functional Requirements (ตาม TOR)
  - Non-Functional Requirements (ตาม TOR — เช่น Accuracy 85%, CER 10%)
  - Data Source (จากตารางในเอกสารฉบับนี้)
  - User Stories
  - Acceptance Criteria

**ขอ approve?** — ใช้ template นี้?

---

## หมายเหตุท้ายเอกสาร

1. **เอกสารฉบับนี้** อ้างอิงจาก `SYSTEM_OVERVIEW_PAPER.md` v3.1 และ TOR EOP.pdf 60 หน้า
2. ทุก feature มี citation ไปยังเลขข้อ TOR
3. ส่วนที่ TOR ไม่ระบุ — มาร์ค "TOR ไม่ระบุ — รอถาม" ไม่ใช้การเดา
4. ข้อเสนอเพิ่มเติม → ต้องอนุมัติก่อนใช้
5. Tech stack / Architecture / Database → ไม่ใส่ในเอกสารนี้ (อยู่ใน `PROPOSAL_ADDITIONS.md` รออนุมัติ)

---

**เวอร์ชัน:** 1.0
**สร้างเมื่อ:** ตาม commit ล่าสุดของ repo
**ผู้สร้าง:** Broccolie + Claude (AI pair)
**ใช้ร่วมกับ:** [`SYSTEM_OVERVIEW_PAPER.md`](SYSTEM_OVERVIEW_PAPER.md)
