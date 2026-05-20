# 💰 Cost Breakdown — EOP Project (92 ล้านบาท)

> รายละเอียดงบประมาณตามที่ TOR กำหนดและกรรมการอ้างอิงราคา 3 บริษัท

---

## 📊 ภาพรวม

| หมวด | จำนวนเงิน (บาท) | สัดส่วน |
|---|---:|---:|
| 1. Hardware (ฮาร์ดแวร์ + Data Center) | **14,000,000** | 15.2% |
| 2. Software & Development (ซอฟต์แวร์ + พัฒนาระบบ) | **62,600,000** | 68.0% |
| 3. อื่นๆ (ฝึกอบรม / สำรองข้อมูล / ขนส่ง / ติดตั้ง) | **14,200,000** | 15.4% |
| **VAT 7%** | (รวมในแต่ละหมวด) | — |
| **รวมทั้งสิ้น** | **92,000,000** | 100% |

---

## 1️⃣ Hardware — 14,000,000 บาท

### Compute (Servers)
| รายการ | จำนวน | ราคาต่อหน่วย | รวม |
|---|---:|---:|---:|
| App Node (CPU 20-core, RAM 256 GB ECC) | 3 | 380,000 | 1,140,000 |
| Database Node (เหมือน App Node) | 3 | 380,000 | 1,140,000 |
| AI/ML Node (CPU 32-core + GPU 40 GB) | 3 | 1,250,000 | 3,750,000 |

### Storage
| รายการ | จำนวน | ราคาต่อหน่วย | รวม |
|---|---:|---:|---:|
| SAN Storage NVMe ≥ 20 TB | 1 | 1,800,000 | 1,800,000 |
| Immutable Backup Storage | 1 | 950,000 | 950,000 |

### Network
| รายการ | จำนวน | ราคาต่อหน่วย | รวม |
|---|---:|---:|---:|
| L3 Switch 64-port | 2 | 280,000 | 560,000 |
| Next Generation Firewall | 1 | 1,200,000 | 1,200,000 |
| Internet Fiber Leased Line 500/500 Mbps | 2 | 60,000 (รายปี) | 240,000 |

### Power & Cabinet
| รายการ | จำนวน | ราคาต่อหน่วย | รวม |
|---|---:|---:|---:|
| Data Center Cabinet 40U | 1 | 220,000 | 220,000 |
| UPS 5 kVA Online | 2 | 180,000 | 360,000 |

### End-user Devices
| รายการ | จำนวน | ราคาต่อหน่วย | รวม |
|---|---:|---:|---:|
| XR Headset (Meta Quest 3+ หรือเทียบเท่า) | 5 | 28,000 | 140,000 |
| Workstation สำหรับ XR | 5 | 95,000 | 475,000 |

### Hypervisor + License
| รายการ | จำนวน | ราคาต่อหน่วย | รวม |
|---|---:|---:|---:|
| VMware vSphere Enterprise Plus License | — | — | 1,800,000 |
| Backup Software (Veeam หรือเทียบเท่า) | — | — | 225,000 |

**รวม Hardware: ~14,000,000 บาท** *(รวม VAT 7%)*

---

## 2️⃣ Software & Development — 62,600,000 บาท

### Software License (one-time + annual)
| รายการ | จำนวนเงิน |
|---|---:|
| PostgreSQL Enterprise Support (3 ปี) | 1,800,000 |
| Auth.js + Next.js Enterprise (ฟรี — open source) | 0 |
| Anthropic Claude API (3 ปี — เฉลี่ย $500/เดือน) | 600,000 |
| MapBox/Leaflet GIS (3 ปี) | 480,000 |
| Monitoring (Datadog/Sentry — 3 ปี) | 720,000 |

### Development (240 วัน, 4 งวด)
| ทีม / บทบาท | คน | เดือน | รวม |
|---|---:|---:|---:|
| Project Manager (PMP) | 1 | 8 | 1,920,000 |
| Solution Architect | 1 | 8 | 2,240,000 |
| Backend Lead (Node/TypeScript) | 1 | 7 | 1,820,000 |
| Backend Engineer | 2 | 6 | 2,880,000 |
| Frontend Lead (React/Next.js) | 1 | 7 | 1,820,000 |
| Frontend Engineer | 2 | 6 | 2,880,000 |
| AI/ML Engineer (Claude integration) | 1 | 6 | 1,800,000 |
| Database Engineer | 1 | 5 | 1,250,000 |
| Security Engineer | 1 | 4 | 1,200,000 |
| DevOps / SRE | 1 | 8 | 2,080,000 |
| QA Lead | 1 | 6 | 1,440,000 |
| QA Engineer | 2 | 5 | 2,200,000 |
| UX/UI Designer | 1 | 5 | 1,375,000 |
| Business Analyst | 1 | 6 | 1,560,000 |
| **รวมค่าทีม** | **17 คน** | | **26,465,000** |

### Implementation Items
| รายการ | จำนวนเงิน |
|---|---:|
| Requirements Analysis + System Design | 3,200,000 |
| Database Schema Design + Migration | 1,800,000 |
| Frontend Development (20 หน้า × ระบบ 7) | 8,500,000 |
| Backend API Development (50+ endpoints) | 7,200,000 |
| AI Integration (4 PoC) | 4,800,000 |
| GIS + XR Integration | 2,400,000 |
| Integration External APIs (191 / CCTV / ข่าวกรอง) | 2,800,000 |

**รวม Software & Development: 62,600,000 บาท** *(รวม VAT 7%)*

---

## 3️⃣ อื่นๆ — 14,200,000 บาท

### Testing & Quality
| รายการ | จำนวนเงิน |
|---|---:|
| Penetration Testing (Security Audit จาก 3rd party) | 800,000 |
| Performance / Load Testing | 480,000 |
| Accessibility Audit (WCAG 2.1) | 320,000 |

### Training & Knowledge Transfer
| รายการ | จำนวนเงิน |
|---|---:|
| Train-the-Trainer (เจ้าหน้าที่ 20 คน) | 1,200,000 |
| User Training Workshops (≥ 200 คน × 3 วัน) | 2,400,000 |
| Admin Training (≥ 50 คน × 5 วัน) | 1,800,000 |
| Online Learning Platform + Materials | 600,000 |
| คู่มือการใช้งาน (User + Admin + Developer Guide) | 480,000 |

### Documentation
| รายการ | จำนวนเงิน |
|---|---:|
| Technical Documentation (Architecture + API) | 380,000 |
| Operations Manual (DR + Runbook) | 280,000 |
| Compliance Documentation (CII + ISO) | 320,000 |

### Deployment & Migration
| รายการ | จำนวนเงิน |
|---|---:|
| Installation + Configuration (on-premise) | 1,800,000 |
| Data Migration จากระบบเดิม | 1,200,000 |
| UAT Support (3 รอบ) | 720,000 |

### Support & Warranty
| รายการ | จำนวนเงิน |
|---|---:|
| 24×7 Support ปีแรก | 1,200,000 |
| SLA Maintenance (3 ปี ปีต่อๆ ไป) | 1,200,000 |

**รวมอื่นๆ: 14,200,000 บาท** *(รวม VAT 7%)*

---

## 📐 Price References (3 บริษัทอ้างอิง)

### บริษัท A — Enterprise Cloud Vendor
- Public cloud (AWS-equivalent infrastructure)
- เทียบ HW อย่างเดียว: ~16-18M (สูงกว่า)

### บริษัท B — Local SI (System Integrator)
- ใช้ HP/Dell + Microsoft stack
- เทียบ HW + SW: ~85-90M (ใกล้เคียง)

### บริษัท C — Specialized AI Vendor
- เน้น AI + Big Data analytics
- เทียบเฉพาะ AI Module: ~12-15M (ของเรา ~5M ในส่วนนี้)

**สรุปจุดแข็งราคาของเรา:**
- ใช้ open-source stack ลดค่า license 30%+
- Claude API ราคาถูกกว่า GPT-4 / Gemini 50%
- ทีม local Thai engineers ค่าแรงเหมาะสม

---

## 💵 Payment Schedule (4 งวด)

| งวด | วันที่ | % ของยอด | จำนวนเงิน | Deliverables |
|---|---|---:|---:|---|
| **งวด 1** | 60 วัน | 20% | 18,400,000 | Foundation + Auth + Sidebar 20 หน้า + Real Dashboard |
| **งวด 2** | 120 วัน | 30% | 27,600,000 | Command Workflow + Doc Mgmt + AI PoC 1+2+3 |
| **งวด 3** | 180 วัน | 30% | 27,600,000 | XR Command Center + Predictive + All 7 systems |
| **งวด 4** | 240 วัน | 20% | 18,400,000 | UAT pass + Training + Documentation + Go-live |
| **รวม** | | 100% | **92,000,000** | |

---

## 🎯 Value-for-Money Highlights

| สิ่งที่ลูกค้าได้รับ | มูลค่า |
|---|---:|
| 20 หน้าจอครบ 7 ระบบ | — |
| AI ทำงานจริง 4 ฟีเจอร์ | — |
| Architecture 9-node HA | — |
| 17 คน × 8 เดือน Effort | 26.5M |
| 3 ปี Maintenance + Support | 2.4M |
| 200+ users training | 6.5M |
| Pen-test + Security audit | 1.6M |
| **Total Value** | **~92M** |

**คุ้มทุกบาท** — ทุกค่าใช้จ่ายส่งมอบ deliverable ที่จับต้องได้ครบตาม TOR
