# 📚 EOP Documentation Index

> **สำหรับใครก็ตามที่เข้ามาใหม่** (Claude session ใหม่ / dev คนใหม่)
>
> อ่านตามลำดับด้านล่าง → จะเข้าใจโปรเจคครบใน 30 นาที

---

## 🚀 ลำดับการอ่าน (สำคัญที่สุด → น้อย)

### 0️⃣ ภาพรวมทั้งระบบในไฟล์เดียว (45 นาที, แนะนำสำหรับ stakeholder/ผู้บริหาร)
**[SYSTEM_OVERVIEW_PAPER.md](SYSTEM_OVERVIEW_PAPER.md)** — **เอกสารฉบับเดียวสรุปทั้งระบบ** — ครอบคลุมทุกหัวข้อ:
- ที่มา + วัตถุประสงค์
- ๗ ระบบ + เทคโนโลยี
- สถาปัตยกรรม + Security + Hardware
- PoC + Risk + Timeline
- เหมาะสำหรับให้คนภายนอก / committee อ่าน

### 1️⃣ เริ่มต้นที่นี่ (5 นาที — สำหรับ developer/Claude)
**[PROJECT_BRIEF.md](PROJECT_BRIEF.md)** — บริบทโปรเจค / ทำไมมี / ใครเกี่ยวข้อง / เป้าหมาย / ข้อจำกัด

### 2️⃣ เข้าใจ TOR (15 นาที)
**[TOR_SUMMARY.md](TOR_SUMMARY.md)** — สรุป TOR EOP 60 หน้าครบ
- 7 โปรแกรมที่ต้องสร้าง
- Hardware spec
- PoC 4 ฟีเจอร์
- Scoring criteria 100 คะแนน
- Personnel requirements
- Timeline 4 งวด

### 3️⃣ เข้าใจ Architecture (10 นาที)
**[ARCHITECTURE.md](ARCHITECTURE.md)** — สถาปัตยกรรมระบบ
- Modular Monolith design
- Module structure
- Data flow
- State machine ของ Command workflow
- Security architecture
- Decision records (ADR)

### 4️⃣ เข้าใจ Data (5 นาที)
**[DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)** — Prisma models ครบ 18 models
- แยกตามระบบ TOR
- ER diagram
- Relationships
- Seed data plan

### 5️⃣ ก่อนเขียนโค้ด (10 นาที)
**[CODING_STANDARD.md](CODING_STANDARD.md)** — มาตรฐานการเขียนโค้ด
- TypeScript style
- Naming conventions
- Component patterns
- Error handling
- Git workflow
- **กฎสำหรับ Claude (AI pair)** — ห้ามแก้ไฟล์ไหน, ขอ code เต็มไฟล์, ฯลฯ

### 6️⃣ API Spec (อ่านเมื่อแตะ backend)
**[API_SPEC.md](API_SPEC.md)** — มาตรฐาน REST API
- Response format มาตรฐาน
- Endpoint list ครบ
- Validation pattern
- Error handling pattern

### 7️⃣ Daily Plan (อ่านทุกวัน)
**[DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)** — แผน 7 วัน รายวัน
- Status update
- งานแต่ละวัน
- Strategic priorities
- Risk tracking

### 8️⃣ PoC Deep Dive (อ่านก่อนทำ PoC features)
**[POC_REQUIREMENTS.md](POC_REQUIREMENTS.md)** — PoC 4 ฟีเจอร์เชิงลึก
- Scoring rubric
- Implementation strategy
- Plan B

---

## 🎯 Quick Reference

### โปรเจคคืออะไร?
**EOP** = Enterprise Operation Planning — ระบบของสำนักงานยุทธศาสตร์ตำรวจ (สยศ.ตร.) มูลค่า ~92M บาท / 240 วัน

### เรากำลังทำอะไร?
สร้าง web app จริง (ไม่ใช่ slide) เพื่อพรีเซ้นกรรมการประมูล ก่อนวัน PoC จริง

### Tech Stack
Next.js 16 + React 19 + TypeScript + Prisma + Postgres (Neon) + Auth.js + Claude API + Vercel

### ใครทำ?
Broccolie (solo) + Claude (AI pair)

### เวลา?
**7 วัน** จนถึงวัน pitch

---

## 📂 Folder Map

```
eop-demo/
├── README.md              ← (root) — Tech overview + Quick start
├── docs/                  ← (you're here) — Project documentation
│   ├── README.md          ← (this file) — Index
│   ├── PROJECT_BRIEF.md
│   ├── TOR_SUMMARY.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_SPEC.md
│   ├── CODING_STANDARD.md
│   ├── DEVELOPMENT_PLAN.md
│   └── POC_REQUIREMENTS.md
├── app/                   ← Next.js pages
├── components/            ← UI components
├── features/              ← Business logic
├── lib/                   ← Infrastructure
├── prisma/                ← Schema + migrations
└── .env.example           ← Environment template
```

---

## 🆘 ติดปัญหา?

1. ดู `README.md` § Common Issues
2. ดู `CODING_STANDARD.md` § Help & Common Issues
3. ขอความช่วยเหลือจาก Claude — **แชร์ error message เต็ม + ไฟล์ที่เกี่ยวข้อง**
4. ดู Git log + Prisma migrations เพื่อรู้ว่ามีอะไรเปลี่ยน

---

## ✏️ Maintaining Docs

**กฎสำคัญ:** Docs ต้อง up-to-date

- **PROJECT_BRIEF.md** อัปเดตเมื่อ scope/goal เปลี่ยน
- **TOR_SUMMARY.md** อัปเดตถ้าอ่าน TOR เพิ่มเติม
- **ARCHITECTURE.md** อัปเดตเมื่อ design เปลี่ยน + เพิ่ม ADR
- **DATABASE_SCHEMA.md** อัปเดตหลัง migration ใหม่
- **API_SPEC.md** อัปเดตหลังเพิ่ม endpoint
- **DEVELOPMENT_PLAN.md** อัปเดตทุกวัน (status table)

ห้าม Claude แก้ docs โดยไม่ขอ — ยกเว้น user สั่งเฉพาะ

---

## 🤖 สำหรับ Claude Sessions ใหม่

Prompt แนะนำเมื่อ user เปิด session ใหม่:

```
ก่อนตอบให้คุณอ่านเอกสารใน docs/ ตามลำดับนี้:
1. docs/PROJECT_BRIEF.md
2. docs/TOR_SUMMARY.md
3. docs/ARCHITECTURE.md
4. docs/DEVELOPMENT_PLAN.md (ดูว่าอยู่ Day ไหน)
5. docs/CODING_STANDARD.md

แล้วบอกผมว่าเข้าใจอะไรบ้าง — ก่อนเริ่มทำงาน
```
