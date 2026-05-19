# เปรียบเทียบ Paper: ของผม vs P_bird

> วันที่: 19 พ.ค. 2569
> เทียบ: `C:\WORK\TOR_EOP\eop-demo\docs\SYSTEM_OVERVIEW_PAPER.md` (v2.0, 48K) vs `C:\Users\Broccolie\Downloads\SYSTEM_OVERVIEW_PAPER_P_bird.md` (v2.0, 104K)

---

## สรุประดับสูง

| มิติ | ของผม | P_bird | ผู้ชนะ |
|---|---|---|---|
| ขนาด | 749 บรรทัด / 48K | 1445 บรรทัด / 104K | P_bird (ครบกว่า) |
| โครงสร้าง | ตาม TOR ข้อ 1-19 + ภาคผนวก | จัดตาม system design + เพิ่ม Procurement section | คนละ approach |
| Citations | ทุก claim มี [TOR หน้า X] | บางส่วนมี [TOR ข้อ Y] | ผม (verifiable กว่า) |
| Procurement Detail | ไม่มี | ครบมาก (Section 15-17) | **P_bird ชนะขาด** |
| ROI / inference | ไม่มี (clean) | ยังมี (อาจ "เพ้อ") | ผม (strict กว่า) |
| Action items | ไม่มี | มี checklist 30/14/7/0 วัน | P_bird |
| TOR Coverage Matrix | ไม่มี | มี (ภาคผนวก จ) | P_bird |

**สรุป:** P_bird ครบเชิง **procurement** กว่ามาก — ของผม strict ตาม TOR กว่า — **ทั้งคู่ใช้คนละ goal**

---

## ✅ สิ่งที่ทั้งคู่ตรงกัน (ทั้งหมด — ถูกต้องตาม TOR)

| รายการ | ค่า |
|---|---|
| งบประมาณ | 92,000,000 บาท |
| ระยะเวลา | 240 วัน / 4 งวด |
| 7 ระบบ (5.4.1-5.4.7) | ตรงกัน |
| Personnel 10 คน | ตรงกัน |
| Training 200 คน / 2 หลักสูตร | ตรงกัน |
| Internet 2 ชุด 500/500 Mbps | ตรงกัน |
| รับประกัน 2 ปี | ตรงกัน |
| คะแนน PoC 30% | ตรงกัน |
| OCR CER thresholds | ตรงกัน |
| Doc Class 6 หมวด | ตรงกัน |
| 9 Workflow states | ตรงกัน |
| ค่าปรับ 10% / 0.20% | ตรงกัน |

---

## 🚨 จุดสำคัญที่ผมตกหล่น — ต้องเพิ่ม (P_bird มี / ของผมไม่มี)

### 1. หลักประกันการเสนอราคา 4,600,000 บาท [TOR ข้อ 7]
- P_bird ระบุ: 4.6 ล้าน = 5% ของวงเงิน
- ของผม: **ไม่มี**
- **ความสำคัญ:** สูง — เป็น input ตอนยื่นข้อเสนอ
- **Action:** เพิ่มในเปเปอร์ผม section "หลักประกัน"

### 2. ทุนจดทะเบียน 20 ล้านบาท [TOR ข้อ 3.12.2]
- P_bird ระบุ: ≥ 20 ล้านบาท
- ของผม: เขียน "มูลค่ากิจการ ≥ 3 เท่าของวงเงิน" (กว้างเกินไป)
- **ความสำคัญ:** สูง — เป็นเกณฑ์ disqualify
- **Action:** แก้เป็นเลขที่ถูกต้อง

### 3. วงเงินสินเชื่อ 23 ล้านบาท [TOR ข้อ 3.12.3]
- P_bird ระบุ: ≥ 1/4 ของวงเงิน = 23 ล้าน จากธนาคาร
- ของผม: **ไม่มี**
- **ความสำคัญ:** สูง
- **Action:** เพิ่ม

### 4. ผลงานบริษัท — ตัวเลขผมอาจผิด [TOR ภาคผนวก ค ข้อ 1.1]
- P_bird ระบุ:
  - (ก) **4 ผลงาน × 9.2M + NLP ≥ 2 ผลงาน** = 10 pt
  - (ข) **1 ผลงาน AI × 46M** = 10 pt
- ของผม: "10 ผลงาน × 5M + NLP 1 + AI 100M"
- **ปัญหา:** ตัวเลข P_bird = % ของวงเงิน (10% / 50% / 25%) ซึ่งเป็น pattern ปกติของราชการไทย
- **Action:** ต้อง verify TOR หน้า 44 อีกครั้ง — ผมอ่าน OCR distort

### 5. การนำเสนอด้านเทคนิคภายใน 5 วันทำการ [TOR ข้อ 6.1.8]
- P_bird ระบุ: ต้องนำเสนอภายใน 5 วันทำการหลังเสนอราคา
- ของผม: **ไม่มี**
- **ความสำคัญ:** สูง — กำหนด timeline หลังยื่น
- **Action:** เพิ่ม

### 6. AI Accuracy ≥ 85% [TOR ข้อ 8.10.3(1)]
- P_bird ระบุ: ≥ 85% บนเอกสาร 300 dpi, ≥ 10pt
- ของผม: เขียน "≥ 95%" — **อาจผิด**
- **Action:** verify หน้า 32 อีกครั้ง

### 7. แบบรายงานตั้งต้น 10 แบบ [TOR ข้อ 2.3.4]
- P_bird ระบุ: ต้องจัดทำ 10 แบบ + list ตัวอย่าง
- ของผม: ระบุแค่ "10 แบบเป็นอย่างน้อย" ไม่มีรายชื่อ
- **Action:** เพิ่มรายชื่อตัวอย่าง (เป็นข้อเสนอผู้พัฒนา)

### 8. KPI ลดเวลาประมวลผลคำสั่ง 2-3 วัน → 1 วัน [TOR ข้อ 4.2]
- P_bird ระบุ: เป็น KPI สำคัญใน TOR
- ของผม: **ไม่มี**
- **ความสำคัญ:** สูง — เป็น success criteria
- **Action:** verify หน้า 27-28 + เพิ่ม

### 9. GPU Spec — ตัวเลขต่าง [TOR ภาคผนวก ข ข้อ 3.4]
- P_bird ระบุ: **CUDA Cores ≥ 18,000 + Bandwidth ≥ 900 GB/s**
- ของผม: เขียน "14,000 Core + 300 GB/s"
- **ปัญหา:** ผมอ่าน OCR ผิด หรือ P_bird ผิด — ต้อง verify
- **Action:** อ่านหน้า 37 อีกครั้ง

### 10. RAM Type — DDR5 vs DDR4
- P_bird: ECC **DDR5**
- ของผม: ECC **DDR4**
- **Action:** verify หน้า 36-37

### 11. SLA Severity Levels [TOR ข้อ 13]
- P_bird ระบุ:
  - Severity 1: Response 1 ชม. / Resolve 4 ชม.
  - Severity 2: Response 2 ชม. / Resolve 24 ชม.
  - Severity 3: Response 4 ชม. / Resolve 72 ชม.
- ของผม: **ไม่มี** (เขียนแค่ 24×7)
- **Action:** verify หน้า 18 — ถ้า TOR ระบุ → เพิ่ม / ถ้า P_bird ตีความ → ไม่เพิ่ม

### 12. งวดงาน — วันที่ต่างกัน [TOR ข้อ 11]
- P_bird ระบุ: งวด 3 ภายใน **210 วัน**
- ของผม: งวด 3 ภายใน **230 วัน**
- **ผมอ่านจาก TOR หน้า 17 ได้ ๒๓๐** — แต่ OCR อาจ distort
- **Action:** อ่านหน้า 17 อีกครั้ง — ถ้าเป็น 230 = ของผมถูก / 210 = P_bird ถูก

---

## ⚠️ จุดที่ผมสะอาดกว่า — P_bird ยัง "เพ้อ" (อ้างจาก TOR ไม่ได้)

### 1. ROI Numbers
- P_bird มี: "2,000 ชั่วโมง/ปี / 30% / 60%→95% / 60%"
- ของผม: **ลบหมดแล้ว** เพราะ TOR ไม่มี
- **Verdict:** ผม strict กว่า ✓

### 2. 5 Roles (ADMIN/COMMANDER/STAFF/AUDITOR/VIEWER)
- P_bird: อ้างเป็นข้อเท็จจริง
- ของผม: ย้ายไปไว้ใน `PROPOSAL_ADDITIONS.md` เป็นข้อเสนอ
- **Verdict:** ผม strict กว่า ✓

### 3. CII Wording
- P_bird: "ตร. ถูกจัดเป็น CII ตามมาตรฐาน..."
- ของผม: "ระบบต้องสอดคล้องกับ Critical Information Infrastructure (CII) [TOR หน้า 47]"
- **Verdict:** ผมระมัดระวังกว่า ✓

### 4. External Integrations เพิ่มเติม
- P_bird: ระบุ TDID/TDA, e-Signature เป็นการใช้งานปกติ
- ของผม: เก็บไว้ใน PROPOSAL_ADDITIONS.md
- **Verdict:** ผม strict กว่า ✓

---

## 📊 จุดเด่นของ P_bird ที่ผมขาด (เชิง procurement)

### Section 15: Procurement Context
- หลักประกันการเสนอราคา + Cost of Capital
- งวดงาน + Cash Flow Planning
- ค่าปรับ + Contingency
- Maintenance Cost Estimate
- ของแท้/ของใหม่ + Manufacturer Letter

### Section 16: Portfolio Strategy
- 2 strategies (สูตร ก / สูตร ข)
- เอกสารที่ต้องเตรียม

### Section 17: Demo Day Checklist
- Timeline การนำเสนอ
- Action items 3 วัน / 1 วัน / วัน Demo

### ภาคผนวก จ: TOR Mapping Index
- ตารางอ้างอิงระหว่าง TOR ↔ section

### ภาคผนวก ฉ: Action Items Checklist
- 30 / 14 / 7 / 0 วันก่อนยื่น

**ทั้งหมดนี้:** มีประโยชน์มากในการ **ยื่นประมูลจริง** — ของผมขาด

---

## 🎯 คะแนนเทียบ

| มิติ | ของผม | P_bird |
|---|---|---|
| Strict ตาม TOR (no inference) | 9/10 | 6/10 |
| ครอบคลุม TOR ครบ | 7/10 | **9/10** |
| Procurement readiness | 4/10 | **10/10** |
| Verifiability (citations) | **9/10** | 7/10 |
| Actionable (checklist) | 4/10 | **9/10** |
| Visual structure | 8/10 | 8/10 |
| **รวม** | **41/60 (68%)** | **49/60 (82%)** |

---

## 💡 ข้อเสนอแนะ — Best of Both Worlds

### แผน: รวมจุดแข็งของทั้งสองฉบับ

1. **เก็บ structure ของผม** (ตาม TOR ข้อ 1-19 เป๊ะ)
2. **เพิ่มจาก P_bird:**
   - Section "หลักประกัน 4.6M" — TOR ข้อ 7
   - Section "ทุนจดทะเบียน + วงเงินสินเชื่อ" — TOR 3.12
   - Portfolio Strategy — TOR ภาคผนวก ค 1.1 (verify ตัวเลข)
   - การนำเสนอ 5 วัน — TOR 6.1.8
   - AI Accuracy 85% — TOR 8.10.3
   - แบบรายงาน 10 แบบ — TOR 2.3.4
   - KPI ลดเวลา 2-3→1 — TOR 4.2
   - SLA Severity — TOR 13 (ถ้ามีจริง)
   - Demo Day Checklist
   - TOR Mapping Index
   - Action Items 30/14/7/0
3. **คงกฎ "no inference"** — ไม่เอา ROI, 5 roles, integrations เพิ่ม

### ก่อนรวม — ต้อง verify TOR

ผมต้องอ่าน TOR หน้าที่อาจ OCR distort อีกครั้ง:
- **หน้า 17** — งวด 3 = 230 หรือ 210?
- **หน้า 18** — SLA Severity?
- **หน้า 32** — Accuracy 85% หรือ 95%?
- **หน้า 36-37** — RAM DDR4 หรือ DDR5? + GPU CUDA 14,000 หรือ 18,000?
- **หน้า 44** — ผลงาน 10×5M หรือ 4×9.2M?
- **หน้า 5** — ทุนจดทะเบียน 20M หรือ 3 เท่าวงเงิน?

---

## 📋 สรุป (ตอบคำถามผู้ใช้)

### "ตรงกันมั้ย?"
**ส่วนใหญ่ตรง** — 7 ระบบ / งบ / เวลา / PoC / personnel ตรงกัน
**แต่ตัวเลขเชิง procurement หลายจุดต่างกัน** — เพราะ OCR distortion

### "มีอะไรตกหล่นมั้ย?"
**ของผมตก 11 ข้อสำคัญ:**
1. หลักประกัน 4.6M
2. ทุนจดทะเบียน 20M
3. วงเงินสินเชื่อ 23M
4. Portfolio criteria (4×9.2M / 1×46M)
5. นำเสนอ 5 วันทำการ
6. AI Accuracy 85%
7. แบบรายงาน 10 แบบ (รายชื่อ)
8. KPI ลด 2-3→1 วัน
9. SLA Severity
10. งวดงาน + จำนวนเงิน
11. Action checklist + TOR mapping index

**P_bird เก่งกว่ามาก** — แต่มีจุดอ่อนตรง ROI/Roles/Integration ที่เพิ่มเข้ามาเอง

---

## ⚡ Recommended Next Step

**ทางเลือก:**

A. **อ่าน TOR หน้า 17, 18, 32, 36-37, 44, 5 อีกครั้ง** เพื่อ verify ตัวเลขที่ต่างกัน — แล้วรวมจุดแข็งของทั้งสองฉบับเข้าใน paper เดียว (1-2 ชั่วโมง)

B. **ใช้ P_bird เป็นหลัก แล้วลบ ROI/Roles/Integration ที่ "เพ้อ"** — ประหยัดเวลา (30 นาที)

C. **คงของผมไว้แล้วเพิ่มเฉพาะ Procurement Context** — โครงสร้างของผมเป็นตาม TOR เป๊ะอยู่แล้ว (1 ชั่วโมง)

อยากเลือกทางไหนครับ?
