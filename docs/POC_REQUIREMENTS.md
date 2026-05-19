# PoC Requirements — รายละเอียดเชิงลึก

> เอกสารนี้ขยายความ PoC 4 ฟีเจอร์ที่ TOR กำหนด (30 คะแนน) — สำหรับวางแผน implementation
>
> Source: TOR EOP.pdf หน้า 50-55 (TOR ข้อ 3.5.1-3.5.4)

---

## ภาพรวม PoC

| PoC | ฟีเจอร์ | คะแนน | โปรแกรม |
|---|---|---|---|
| 1 | AI ร่างหนังสือสั่งการ | 5 | 2 (Agenda) |
| 2 | Document Classification | 10 | 6 (Data & AI) |
| 3 | OCR ภาษาไทย | 10 | 6 (Data & AI) |
| 4 | XR Command Center | 5 | 5 (XR) |
| | **รวม** | **30** | |

---

## 🎯 PoC 1: AI Command Drafting (5 คะแนน)

> TOR ข้อ 3.5.1

### โจทย์
ระบบ AI ต้องร่างหนังสือสั่งการได้ จาก keyword 5 รายการที่กรรมการกำหนด

### Input Spec (5 รายการ)
กรรมการจะให้ในวัน PoC:

| ลำดับ | ฟิลด์ | ตัวอย่าง |
|---|---|---|
| 1 | หัวเรื่องของหนังสือสั่งการ | "เร่งรัดการดำเนินคดียาเสพติด" |
| 2 | หน่วยงานหรือผู้รับคำสั่ง | "ผบช.มค., ผบช.ผบ., ผกก.สน. ทุกสน. ในเขต กทม." |
| 3 | วัตถุประสงค์/เหตุผล | "ลดสถิติการแพร่ระบาดในไตรมาส ๔" |
| 4 | ข้อสั่งการหลัก/แนวทาง | "ให้จัดทำแผนปฏิบัติพิเศษ + รายงานทุก ๗ วัน + ตั้ง task force" |
| 5 | ระยะเวลา/เงื่อนไข | "ภายใน ๓๐ วัน นับจากได้รับหนังสือนี้" |

### Output Spec
ระบบต้อง generate **ร่างหนังสือราชการเต็มรูปแบบ** ที่มี:

- **หัวจดหมาย:** "ที่ ตร. ๐๐๐๐.๐๐/____"
- **วันที่:** ปัจจุบัน (พ.ศ.)
- **เรื่อง:** [หัวเรื่อง]
- **เรียน:** [หน่วยงาน]
- **อ้างถึง:** (ถ้ามี)
- **สิ่งที่ส่งมาด้วย:** (ถ้ามี)
- **เนื้อหา:**
  - ย่อหน้าที่ 1: ที่มา/บริบท
  - ย่อหน้าที่ 2: ข้อสั่งการ
  - ย่อหน้าที่ 3: ระยะเวลา + การรายงานผล
- **คำลงท้าย:** "จึงเรียนมาเพื่อโปรดทราบและดำเนินการต่อไป"
- **ลายเซ็น:** "(ลงนาม) พล.ต.อ. ___ ผบ.ตร."

### เกณฑ์การให้คะแนน (TOR 3.5.1)

กรรมการตรวจสอบ **2 ด้าน**:

**ด้าน 1: รูปแบบหนังสือราชการ (Format)**
- มีองค์ประกอบหลักครบ (หัว ที่ เรื่อง เรียน อ้างถึง เนื้อหา ลงนาม)
- ใช้ภาษาราชการที่ถูกต้อง

**ด้าน 2: เนื้อหา (Content)**
- มีข้อมูลครบตาม 5 input ที่กรรมการให้
- ไม่มีข้อมูลที่ไม่เกี่ยวข้องหรือผิด

| ผลการประเมิน | คะแนน |
|---|---|
| ครบทั้ง 2 ด้าน | **5 pt** |
| ครบ 1 ด้าน | 2.5 pt |
| ไม่ครบทั้ง 2 ด้าน | 0 pt |

### Implementation Strategy

**Stack:**
- Anthropic Claude 3.5 Sonnet (ภาษาไทยดี + reasoning ดี)
- Streaming response (typing effect — น่าตื่นเต้น)
- Cache result

**Prompt Strategy:**
```
System Prompt:
"คุณคือผู้ช่วยเขียนหนังสือราชการของสำนักงานตำรวจแห่งชาติ
ความเชี่ยวชาญ: ระเบียบงานสารบรรณ สำนักนายกรัฐมนตรี
ห้าม: ใช้ภาษาวิชาการ/ภาษาฝรั่ง/Emoji
ต้องมี: หัว/ที่/เรื่อง/เรียน/อ้างถึง/เนื้อหา 3 ย่อหน้า/ลงนาม"

Few-shot Examples (3-5 ตัวอย่างหนังสือราชการจริง):
- ตัวอย่าง 1: หนังสือสั่งการเรื่องอาชญากรรม
- ตัวอย่าง 2: หนังสือเร่งรัดงาน
- ตัวอย่าง 3: หนังสือมอบหมายภารกิจ

User Input:
"ร่างหนังสือสั่งการที่:
- หัวเรื่อง: {subject}
- เรียน: {recipient}
- วัตถุประสงค์: {objective}
- ข้อสั่งการ: {instructions}
- ระยะเวลา: {timeline}"
```

**Risk:**
- AI อาจใช้ภาษาวิชาการเกินไป → ต้อง prompt-engineer
- AI อาจสร้างเลขที่หนังสือผิด format → ใช้ template post-processing
- AI ตอบช้า (>15 sec) → streaming + show progress

**Plan B:**
- Cache 5 ตัวอย่าง result ไว้
- ถ้า API down → ส่ง cached + แสดง "Demo mode (cached)"

---

## 📂 PoC 2: Document Classification (10 คะแนน)

> TOR ข้อ 3.5.2

### โจทย์
ระบบ AI ต้องจำแนกเอกสารเข้า 6 หมวด อัตโนมัติ

### Pre-test (training period)
กรรมการให้ **เอกสารตัวอย่าง 16 ฉบับ** สำหรับ:
- ผู้เสนอเอาไป fine-tune หรือสร้าง training data
- ไม่ใช่ test set!

### Test Day Input
กรรมการจะเตรียม **เอกสารใหม่อีก 16 ฉบับ** ที่ผู้เสนอ**ไม่เคยเห็น**

**รูปแบบไฟล์:** **DOCX** (Microsoft Word)

### 6 หมวด (Categories)

| Code | ชื่อเต็ม | ลักษณะเนื้อหา |
|---|---|---|
| `ยศ.` | กองยุทธศาสตร์ | แผน + นโยบาย + ยุทธศาสตร์ + รายงานวิเคราะห์ |
| `ผบ.` | กองแผนงานอำนวยการ | งบประมาณ + บุคลากร + พัสดุ + IT |
| `มค.` | กองแผนงานความมั่นคง | ความมั่นคง + การข่าว + ก่อการร้าย |
| `มข.` | กองแผนงานกิจการพิเศษ | งานสำคัญพิเศษ + ปฏิบัติการพิเศษ |
| `วจ.` | กองวิจัย | งานวิจัย + ประเมินผล + R&D |
| `อจ.` | ฝ่ายอำนวยการ สยศ.ตร. | งานสารบรรณ + บริหารทั่วไป |

### เกณฑ์การให้คะแนน

TOR ระบุไม่ชัด แต่ logical คือ:
- จำแนกถูก = ได้คะแนน
- คะแนนเต็ม 10 = อาจหมายความว่า accuracy 90%+ ของ 16 ฉบับ
- หรือ: 10 = (correct/16) × 10

### Implementation Strategy

**Stack Option A: Zero-shot via Claude (แนะนำใน 7 วัน)**

```typescript
const prompt = `
คุณคือ classifier เอกสารราชการของสำนักงานยุทธศาสตร์ตำรวจ
จำแนกเอกสารนี้เข้า 1 ใน 6 หมวด:

1. ยศ. (กองยุทธศาสตร์) — แผน นโยบาย วิเคราะห์
2. ผบ. (กองแผนงานอำนวยการ) — งบประมาณ บุคลากร IT
3. มค. (กองแผนงานความมั่นคง) — ความมั่นคง ข่าว
4. มข. (กองแผนงานกิจการพิเศษ) — ปฏิบัติการพิเศษ
5. วจ. (กองวิจัย) — งานวิจัย ประเมินผล
6. อจ. (ฝ่ายอำนวยการ) — สารบรรณ บริหารทั่วไป

เอกสาร:
"""
${documentText}
"""

ตอบเป็น JSON:
{
  "predictions": [
    { "category": "ยศ.", "confidence": 0.85 },
    { "category": "มค.", "confidence": 0.10 },
    ...
  ],
  "top": "ยศ.",
  "reasoning": "เพราะ..."
}
`;
```

**Stack Option B: Fine-tune WangchanBERTa**
- ใช้ 16 training docs จากกรรมการ
- ต้อง GPU + เวลา > 2 วัน
- ไม่ทันใน 7 วัน

→ **เลือก Option A**

### Edge Cases
- เอกสารคลุมเครือ (overlap หลายหมวด) → return top + confidence
- เอกสารยาว >10,000 ตัวอักษร → summarize ก่อน classify
- เอกสารภาษาอังกฤษ → translate ก่อน

### Risk
- Accuracy zero-shot อาจไม่ถึง 90%
- แต่ละหมวดอธิบายไม่ชัดเจน → ต้อง craft prompt
- Plan B: ใช้ embedding similarity (Claude embedding API) เป็น tie-breaker

---

## 📄 PoC 3: OCR ภาษาไทย (10 คะแนน)

> TOR ข้อ 3.5.3

### โจทย์
OCR ดึงข้อความจากไฟล์ PDF ภาษาไทยที่ scan มา

### Input Spec
- **6 ไฟล์ PDF** ที่กรรมการจัดเตรียม
- ความละเอียด ≥ **300 dpi**
- ตัวอักษรขนาด ≥ **10 point**
- ไม่จำกัด font

### Output Spec
- ข้อความ extracted (text)
- คำนวณ **CER** เทียบกับ Ground Truth

### สูตร CER (Character Error Rate)

```
CER = (S + D + I) / N × 100

S = Substitutions (ตัวอักษรที่ต้องเปลี่ยน)
D = Deletions     (ตัวอักษรที่ขาดหายไป)
I = Insertions    (ตัวอักษรที่เพิ่มขึ้นมา)
N = จำนวนตัวอักษรทั้งหมดใน Ground Truth
```

ใช้ Levenshtein distance คำนวณ

### เกณฑ์การให้คะแนน

| CER (%) | คะแนน |
|---|---|
| ≤ 10% | **10 pt** ⭐ |
| 10.01 – 20% | 5 pt |
| 20.01 – 30% | 2.5 pt |
| > 30% | 0 pt |

### Implementation Strategy

**Stack Options:**

**Option A: Claude Vision (ลองดู accuracy)**
- Claude 3.5 Sonnet สามารถอ่านภาพ + แปล Thai ได้
- Test: pass PDF page as image, ask "extract all text in Thai"
- ✅ Pro: ไม่ต้อง setup OCR server
- ❌ Con: ราคาแพง (image input + long output)

**Option B: Typhoon Vision API (SCB10X)**
- Thai-specific vision model
- ฟรี trial limited
- ✅ Pro: ออปติไมซ์ภาษาไทยโดยเฉพาะ

**Option C: PaddleOCR cloud / Google Vision**
- Google Vision API → Thai OCR ดี / มี free tier
- PaddleOCR self-hosted → ฟรี / ต้อง setup

**Option D: Tesseract 5 + tha language pack**
- Self-hosted ฟรี
- Thai accuracy ปานกลาง
- เร็ว

**สำหรับ Demo:**
→ ทดสอบทั้ง 4 → pick the best CER

### Algorithm Flow

```
1. Upload PDF
2. Convert PDF → images (300 dpi) [pdf2image / pypdfium2]
3. Pre-process images (deskew, denoise, binarize)
4. OCR each page [Claude Vision / PaddleOCR / Tesseract]
5. Post-process:
   - Spell check (PyThaiNLP dictionary)
   - LLM correction (Claude review + fix)
6. Compare with Ground Truth → calculate CER
7. Save to OcrJob table
```

### Demo Strategy
- Pre-run บนเอกสารตัวอย่างก่อน → cache result
- Live demo: upload หน้าใหม่ → "ทำงาน + show CER live"
- ใส่ side-by-side: ภาพ vs extracted text

### Risk
- เอกสาร ตร. อาจมี ตราประทับ + ลายมือ → OCR พลาด
- Font ราชการ "TH Sarabun" บางเวอร์ชัน → Tesseract งง
- เวลาประมวลผลอาจ > 10 sec/หน้า

### Plan B
- ถ้า CER > 10% — บอกตรงๆ:
  > "CER ที่ได้คือ X% — เราจะปรับปรุงให้ ≤ 10% ในช่วง 30-60 วันแรกของโครงการ โดย: 1) fine-tune model on Thai gov docs, 2) เพิ่ม post-processing layer, 3) Active learning จากเอกสารจริง"

- มี cached result ของ "good case" (CER 5-7%) แสดงเสริม

---

## 🥽 PoC 4: XR Command Center (5 คะแนน)

> TOR ข้อ 3.5.4

### โจทย์
ระบบ XR แสดงผ่าน Headset และโต้ตอบได้

### ต้องเตรียม
- **XR Headset** (Meta Quest 3+ หรือเทียบเท่า)
- ระบบ Prototype ที่ทำงานได้
- จอภาพรองเพื่อกรรมการดู (mirror display)

### Feature ที่กรรมการตรวจ (5 รายการ)

ตามตารางใน TOR (5 ฟีเจอร์ — ครบ = 5 pt):

| ฟีเจอร์ | คำอธิบาย |
|---|---|
| 1. Virtual Screens | แสดง 60-62 หน้าจอเสมือน |
| 2. Dashboard 4 Charts | Line / Bar / Pie / Map |
| 3. GIS Heatmap/Bubble | แผนที่ความร้อนเชิงพื้นที่ |
| 4. Dashboard Interaction | กดทำงานใน XR ได้ |
| 5. Multi-Window | เปิด 2+ virtual screens พร้อมกัน |

### Implementation Strategy (สำคัญ)

**ความจริง:** ทีมไม่มีประสบการณ์ XR + เวลา 7 วัน → **ไม่สร้าง native XR app**

**Strategy: Hybrid Approach**

#### สำหรับ web app demo:
- **Three.js + React Three Fiber** — render 3D scene in browser
- จำลอง command center room มี virtual screens 4-6 หน้า (ไม่ถึง 60 แต่พิสูจน์ concept)
- Mouse drag rotate camera = "ผู้ใช้มอง"
- แสดง dashboard data จริงบน virtual screens
- **Video 60 sec** อธิบาย full vision

#### สำหรับวัน PoC (ถ้าได้รับเลือกประมูล + วันสอบ):
- จะใช้ Unity + Quest 3 (สอนทีม / hire XR partner)
- ระยะเวลา preparation 2-3 สัปดาห์
- มี Plan B: WebXR fallback ที่ทำงานบน Quest browser

### สำหรับ Pre-PoC Demo
**บอกกรรมการตรงๆ:**
> "ระบบ XR เต็มรูปแบบ (Meta Quest 3) เราจะเตรียมพร้อมในวัน PoC จริง — วันนี้ผมขอโชว์ web-based 3D preview ที่รัน on browser เพื่อให้กรรมการเห็น concept + วิดีโอ 60 วินาทีของ Full VR experience"

นี่คือ honesty ที่กรรมการชอบ — แสดง risk awareness + plan B

### Risk
- ทีมไม่เคยใช้ Unity → ต้องหาคู่ค้า (Bangkok Studio?)
- Quest 3 ราคา 20,000-25,000 บ. → ต้องมีก่อนวัน PoC
- App ต้อง side-load + tested บน device จริง

---

## 📊 PoC Scoring Summary

| PoC | คะแนนเต็ม | เป้าหมาย ในวันสอบ | กลยุทธ์ใน Pre-Demo |
|---|---|---|---|
| 1 AI Command | 5 | **5** (ครบ 2 ด้าน) | Live + ใช้ Claude 3.5 Sonnet + few-shot |
| 2 Doc Class | 10 | 8-10 (accuracy 80-100%) | Zero-shot Claude + fallback embedding |
| 3 OCR | 10 | 5-10 (CER ≤ 10% หรือ 20%) | Best-effort + บอกตรงๆ ถ้าได้ < 10% |
| 4 XR | 5 | 3-5 (ครบ 3-5 features) | Web-based mockup + video + bold strategy |
| **รวม** | **30** | **21-30** | |

**คะแนนที่คาดหวัง:** 24-28 จาก 30 (80-93%)

---

## 🎬 Demo Day Flow (สำหรับวันสอบ PoC จริง)

### Setup (15 นาที before)
- Laptop + projector + Internet
- Test ทั้ง 4 PoC พร้อม cached fallback
- Quest 3 charged + setup demo scene

### Main Demo (40-60 นาที)
1. Login + intro (5 นาที)
2. PoC 1 AI Command — ใช้ input ที่กรรมการให้ (10 นาที)
3. PoC 2 Doc Class — upload 16 docs ตามที่กรรมการให้ (10 นาที)
4. PoC 3 OCR — run บน 6 PDF + แสดง CER live (15 นาที)
5. PoC 4 XR — สวม Quest 3 + mirror display (10 นาที)
6. Q&A (15 นาที)

### Plan B
- ทุก PoC มี cached result
- ถ้า internet down → ใช้ local Postgres + cached AI
- มี video walkthrough ของแต่ละ PoC สำรอง

---

## 📚 Test Data Preparation

ก่อนวันสอบ ต้องเตรียม:

| Item | จำนวน | สำหรับ |
|---|---|---|
| ตัวอย่างหนังสือสั่งการ (จริง) | 20-30 ฉบับ | Train AI Command Drafting (few-shot) |
| เอกสารตัวอย่าง 6 หมวด | 30-50 ฉบับ/หมวด | Train Doc Classifier (zero-shot reference) |
| PDF ภาษาไทย scan 300dpi | 10-20 ไฟล์ | Test OCR + benchmark CER |
| Ground truth text ของ PDFs | 10-20 ไฟล์ | คำนวณ CER baseline |

แหล่งข้อมูล:
- เว็บราชการ public (ราชกิจจานุเบกษา)
- ตัวอย่าง อช./สวก. ที่เผยแพร่ public
- รายงาน ก.พ.ร. ที่ public

⚠️ **PDPA Note:** ห้ามใช้เอกสาร internal ตร. จริงโดยไม่ได้รับอนุญาต — ใช้แต่ public docs

---

## 🔬 Benchmark Baseline (ตั้งเป้าก่อนพัฒนา)

| Metric | Baseline (จากเทคโนโลยีตลาด) | เป้าผมหวัง | TOR เกณฑ์ |
|---|---|---|---|
| Command Draft Quality | 70% (GPT-4 zero-shot) | 90% (Claude 3.5 + few-shot) | "ครบ 2 ด้าน" |
| Doc Class Accuracy | 75% (BERT zero-shot) | 85% (Claude zero-shot) | (TOR ไม่ระบุ %) |
| OCR Thai CER | 8-15% (PaddleOCR) | ≤ 10% | ≤ 10% = 10pt |
| XR Latency | 90 fps target | 60 fps acceptable | (ไม่ระบุ) |
