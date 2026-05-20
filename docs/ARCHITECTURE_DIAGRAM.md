# 🏗️ EOP Architecture Diagrams

> สถาปัตยกรรมระบบ EOP — ผังภาพระดับต่างๆ
> สำหรับ pitch presentation + technical documentation

---

## 1. System Context (C4 Level 1)

ใครใช้งาน EOP และเชื่อมต่อกับอะไรบ้าง

```mermaid
graph TB
    subgraph Users["👥 ผู้ใช้งาน"]
        ADMIN[👤 ADMIN<br/>ผู้ดูแลระบบ]
        COMMANDER[👤 COMMANDER<br/>ผู้บังคับบัญชา]
        STAFF[👤 STAFF<br/>เจ้าหน้าที่]
        AUDITOR[👤 AUDITOR<br/>ผู้ตรวจสอบ]
        VIEWER[👤 VIEWER<br/>ผู้ดูข้อมูล]
    end

    EOP[("🏛️ EOP System<br/>Enterprise Operation Planning<br/>สำนักงานยุทธศาสตร์ตำรวจ")]

    subgraph External["🌐 ระบบภายนอก"]
        N191[📞 ศูนย์รับแจ้งเหตุ 191]
        CCTV[📹 ระบบกล้องวงจรปิด]
        INTEL[🔍 ระบบข่าวกรอง]
        KPR[📊 ระบบ ก.พ.ร.]
        ITA[📋 ระบบ ITA]
        CLAUDE[🤖 Claude AI API<br/>Anthropic]
    end

    ADMIN -->|จัดการผู้ใช้| EOP
    COMMANDER -->|อนุมัติ + e-Sig| EOP
    STAFF -->|ร่างคำสั่ง| EOP
    AUDITOR -->|ตรวจผล| EOP
    VIEWER -->|ดูข้อมูล| EOP

    EOP -.->|รับเหตุการณ์| N191
    EOP -.->|รับ alert| CCTV
    EOP -.->|รับข่าวกรอง| INTEL
    EOP -.->|ส่งรายงาน| KPR
    EOP -.->|ส่งรายงาน| ITA
    EOP -->|API| CLAUDE

    style EOP fill:#1e3a5f,stroke:#142a45,color:#fff
    style CLAUDE fill:#b8860b,stroke:#92400e,color:#fff
```

---

## 2. High-Level Architecture (3-Tier)

```mermaid
graph TB
    subgraph Client["💻 Client Layer"]
        WEB[🌐 Web App<br/>Next.js 16 + React 19]
        PWA[📱 PWA<br/>iOS + Android installable]
        XR[🥽 XR Headset<br/>Meta Quest 3+]
    end

    subgraph Edge["🛡️ Edge / Security"]
        FW[🔥 Next-Gen Firewall]
        LB[⚖️ Load Balancer]
        TLS[🔒 TLS 1.3]
    end

    subgraph App["⚙️ Application Layer"]
        AUTH[🔐 Auth.js<br/>JWT + bcrypt + MFA]
        API[📡 API Routes<br/>30+ endpoints]
        SSR[🖥️ Server Components<br/>20 pages]
    end

    subgraph Service["🔧 Service Layer"]
        CMD[📋 Command Service<br/>9-state Workflow]
        AI[🤖 AI Services<br/>4 features]
        SEARCH[🔍 Search Service<br/>4 modes]
        NOTIFY[🔔 Notification<br/>Auto-Escalation]
        AUDIT[📝 Audit Service]
    end

    subgraph Data["💾 Data Layer"]
        DB[(🗄️ PostgreSQL HA<br/>Primary + 2 Replicas)]
        VEC[(🧬 pgvector<br/>Semantic Search)]
        STORAGE[💾 SAN Storage<br/>≥ 20 TB NVMe]
        BACKUP[🛡️ Immutable Backup<br/>Air-gapped]
    end

    subgraph External["🌐 External APIs"]
        CLAUDE[🤖 Claude API<br/>Haiku + Sonnet]
        N191[📞 ศูนย์ 191]
        CCTV_API[📹 CCTV]
        INTEL_API[🔍 Intel]
    end

    WEB --> TLS
    PWA --> TLS
    XR --> TLS
    TLS --> FW
    FW --> LB
    LB --> AUTH
    AUTH --> API
    API --> SSR
    SSR --> CMD
    SSR --> AI
    SSR --> SEARCH
    SSR --> NOTIFY
    SSR --> AUDIT

    CMD --> DB
    AI --> CLAUDE
    SEARCH --> DB
    SEARCH --> VEC
    NOTIFY --> DB
    AUDIT --> DB

    DB <-->|HA replication| STORAGE
    STORAGE -.->|Snapshot 4h| BACKUP

    NOTIFY -.->|webhook| N191
    NOTIFY -.->|webhook| CCTV_API
    NOTIFY -.->|webhook| INTEL_API

    style WEB fill:#1e3a5f,color:#fff
    style PWA fill:#1e3a5f,color:#fff
    style XR fill:#b8860b,color:#fff
    style CLAUDE fill:#b8860b,color:#fff
    style DB fill:#166534,color:#fff
    style BACKUP fill:#166534,color:#fff
```

---

## 3. Hardware Topology (9 Nodes + Network)

ตามภาคผนวก ข ของ TOR

```mermaid
graph TB
    subgraph Internet["🌐 Internet (Redundant)"]
        ISP1[ISP A<br/>Fiber 500/500 Mbps]
        ISP2[ISP B<br/>Fiber 500/500 Mbps]
    end

    subgraph Edge["Network Edge"]
        NGFW[🔥 NGFW<br/>≥ 3 Gbps<br/>DDoS Protection]
    end

    subgraph Core["Core Network"]
        L3A[L3 Switch A<br/>64 port + 6× SFP+]
        L3B[L3 Switch B<br/>64 port + 6× SFP+]
    end

    subgraph Compute["Compute · 9 Nodes"]
        APP1[App Node 1<br/>20-core · 256GB ECC]
        APP2[App Node 2<br/>20-core · 256GB ECC]
        APP3[App Node 3<br/>20-core · 256GB ECC]
        DB1[DB Node 1<br/>PostgreSQL Primary]
        DB2[DB Node 2<br/>PostgreSQL Replica]
        DB3[DB Node 3<br/>PostgreSQL Replica]
        AI1[AI Node 1<br/>32-core · 40GB GPU]
        AI2[AI Node 2<br/>32-core · 40GB GPU]
        AI3[AI Node 3<br/>32-core · 40GB GPU]
    end

    subgraph Storage["Storage"]
        SAN[(🗄️ SAN Storage<br/>≥ 20 TB NVMe<br/>RAID-6)]
        BAK[(🛡️ Immutable Backup<br/>WORM · Air-gapped)]
    end

    subgraph Power["Infrastructure"]
        UPS1[⚡ UPS 5kVA · A]
        UPS2[⚡ UPS 5kVA · B]
        CAB[🏛️ Cabinet 40U]
    end

    subgraph EndUser["End-user"]
        XR1[🥽 XR Headset × 5]
    end

    ISP1 --> NGFW
    ISP2 --> NGFW
    NGFW --> L3A
    NGFW --> L3B
    L3A --> APP1
    L3A --> APP2
    L3A --> APP3
    L3B --> DB1
    L3B --> DB2
    L3B --> DB3
    L3A --> AI1
    L3B --> AI2
    L3A --> AI3
    APP1 --> SAN
    APP2 --> SAN
    APP3 --> SAN
    DB1 --> SAN
    DB2 --> SAN
    DB3 --> SAN
    SAN -.->|Snapshot 4h| BAK
    UPS1 --> CAB
    UPS2 --> CAB
    L3B --> XR1

    style NGFW fill:#991b1b,color:#fff
    style L3A fill:#1e3a5f,color:#fff
    style L3B fill:#1e3a5f,color:#fff
    style SAN fill:#166534,color:#fff
    style BAK fill:#166534,color:#fff
    style AI1 fill:#b8860b,color:#fff
    style AI2 fill:#b8860b,color:#fff
    style AI3 fill:#b8860b,color:#fff
```

---

## 4. AI Pipeline — Command Drafting (PoC 1)

```mermaid
sequenceDiagram
    actor User as 👤 Staff
    participant UI as 💻 Web UI
    participant API as 📡 /api/ai/draft
    participant Auth as 🔐 Auth.js
    participant Service as 🤖 AI Service
    participant Claude as ☁️ Claude API
    participant DB as 💾 PostgreSQL
    participant Audit as 📝 Audit Log

    User->>UI: กรอก 5 keywords + กด "ให้ AI ร่าง"
    UI->>API: POST /api/ai/draft
    API->>Auth: ตรวจ session + role
    Auth-->>API: ✓ COMMANDER/STAFF
    API->>Service: generateCommandDraft()
    Service->>Claude: Claude Haiku 4.5<br/>(system prompt + user data)
    Claude-->>Service: JSON response<br/>(reference + objective + body)
    Service-->>API: parsed result + tokens
    API->>DB: บันทึก draft (status=DRAFT)
    API->>Audit: log ai.command.draft<br/>(tokens, elapsedMs)
    Audit-->>DB: writeAuditLog
    API-->>UI: success + draft data
    UI-->>User: แสดงผลภาษาราชการ
```

---

## 5. Command Workflow — 9-State State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: สร้างใหม่

    DRAFT --> SUBMITTED: ส่งเพื่อพิจารณา<br/>(STAFF/COMMANDER)
    SUBMITTED --> APPROVED: อนุมัติ<br/>(COMMANDER)
    SUBMITTED --> DRAFT: ส่งกลับแก้ไข<br/>(COMMANDER)

    APPROVED --> PUBLISHED: เผยแพร่<br/>(COMMANDER)
    PUBLISHED --> ACKNOWLEDGED: หน่วยรับทราบครบ
    ACKNOWLEDGED --> IN_PROGRESS: เริ่มปฏิบัติ
    IN_PROGRESS --> REPORTED: ส่งผลปฏิบัติ
    REPORTED --> AUDITED: ตรวจสอบ<br/>(AUDITOR)
    AUDITED --> CLOSED: ปิดงาน<br/>(COMMANDER)

    CLOSED --> [*]

    note right of DRAFT
        Audit log บันทึกทุก transition
        + e-Signature ที่ APPROVED
        + publishedAt ที่ PUBLISHED
        + closedAt ที่ CLOSED
    end note
```

---

## 6. Security Architecture — Defense in Depth

```mermaid
graph TB
    USER[👤 User Request] --> L1

    subgraph L1[Layer 1: Network Edge]
        FW[🔥 Firewall<br/>DDoS Protection]
        IPF[🔍 IP Filtering<br/>Whitelist + Geolocation]
    end

    L1 --> L2

    subgraph L2[Layer 2: Transport]
        TLS[🔒 TLS 1.3<br/>Perfect Forward Secrecy]
        HSTS[📋 HSTS + CSP Headers]
    end

    L2 --> L3

    subgraph L3[Layer 3: Authentication]
        MFA[🔑 MFA<br/>Authenticator App]
        JWT[🎫 JWT Session<br/>8h expiry]
        BCRYPT[🔐 bcrypt<br/>Password hash]
    end

    L3 --> L4

    subgraph L4[Layer 4: Authorization · RBAC]
        ROLE[👥 5 Roles<br/>ADMIN/COMMANDER/<br/>STAFF/AUDITOR/VIEWER]
        RLS[🔍 Row-Level Security<br/>per-unit filtering]
    end

    L4 --> L5

    subgraph L5[Layer 5: Application]
        VAL[✅ Zod Validation<br/>every API input]
        XSS[🛡️ XSS Protection<br/>React + sanitize]
        CSRF[🛡️ CSRF Tokens]
    end

    L5 --> L6

    subgraph L6[Layer 6: Data]
        AES[🔐 AES-256<br/>Encryption at rest]
        PII[🎭 PII Masking<br/>in logs]
        BACKUP[🛡️ Immutable Backup<br/>Ransomware-proof]
    end

    L6 --> L7

    subgraph L7[Layer 7: Audit · TOR 7.1.5]
        LOG[📝 Audit Log<br/>every action]
        SIEM[👁️ SIEM Ready<br/>Anomaly Detection]
        RETAIN[📅 7-year retention]
    end

    L7 --> DATA[(💾 Data Access)]

    style USER fill:#1e3a5f,color:#fff
    style DATA fill:#166534,color:#fff
    style L7 fill:#b8860b,color:#fff
```

---

## 7. Data Flow — End-to-End for Command Lifecycle

```mermaid
flowchart LR
    subgraph Input["📥 Input"]
        FORM[📝 New Command<br/>Form]
        AI[🤖 AI Draft]
    end

    subgraph Validation["✅ Validation"]
        ZOD[Zod Schema]
        RBAC[RBAC Check]
    end

    subgraph Persistence["💾 Persist"]
        TX[🔄 Transaction]
        CMD[(commands)]
        TGT[(command_targets)]
        LOG[(command_status_log)]
        AUD[(audit_log)]
    end

    subgraph Notification["🔔 Notify"]
        WS[WebSocket]
        EMAIL[📧 Email Queue]
        LINE[📱 LINE]
    end

    subgraph Recipients["👥 Recipients"]
        U1[Unit 1]
        U2[Unit 2]
        U3[Unit N]
    end

    FORM --> ZOD
    AI --> ZOD
    ZOD --> RBAC
    RBAC --> TX
    TX --> CMD
    TX --> TGT
    TX --> LOG
    TX --> AUD
    CMD --> WS
    CMD --> EMAIL
    CMD --> LINE
    WS --> U1
    WS --> U2
    EMAIL --> U3
    LINE --> U1

    style TX fill:#1e3a5f,color:#fff
    style CMD fill:#166534,color:#fff
    style AUD fill:#b8860b,color:#fff
```

---

## 8. Deployment Topology (Production)

```mermaid
graph TB
    subgraph DC["🏛️ On-Premise Data Center (สยศ.ตร.)"]
        subgraph Public["DMZ / Public Subnet"]
            FW[🔥 NGFW]
            LB[⚖️ Load Balancer<br/>HAProxy]
        end

        subgraph Private["Private Subnet"]
            APP[3× App Nodes<br/>Docker Swarm/K8s]
            DB[3× DB Cluster<br/>Patroni HA]
            AI[3× AI Nodes<br/>Local inference cache]
        end

        subgraph SAN["Storage SAN"]
            STG[💾 NVMe Storage<br/>≥ 20 TB]
        end

        subgraph BAK["Backup Zone (Air-gapped)"]
            B1[🛡️ Daily Snapshot]
            B2[🛡️ Weekly Snapshot]
            B3[🛡️ Monthly Cold Storage]
        end
    end

    subgraph Cloud["☁️ Cloud Services"]
        CLAUDE[Claude API<br/>Anthropic]
        SES[Email Provider<br/>SendGrid/SES]
        LINE[LINE Notify API]
    end

    subgraph Users["👥 Users"]
        DESK[💻 Desktop<br/>200+ users]
        MOBILE[📱 Mobile<br/>iOS+Android]
        XR[🥽 XR Headset × 5<br/>Command Center]
    end

    DESK -->|HTTPS| FW
    MOBILE -->|HTTPS| FW
    XR -->|WebXR| FW
    FW --> LB
    LB --> APP
    APP --> DB
    APP --> AI
    APP -.->|HTTPS| CLAUDE
    APP -.->|API| SES
    APP -.->|API| LINE
    DB --> STG
    AI --> STG
    STG -.->|4h snapshot| B1
    B1 -.->|weekly| B2
    B2 -.->|monthly| B3

    style FW fill:#991b1b,color:#fff
    style LB fill:#1e3a5f,color:#fff
    style DB fill:#166534,color:#fff
    style STG fill:#166534,color:#fff
    style CLAUDE fill:#b8860b,color:#fff
```

---

## 9. Disaster Recovery Strategy

```mermaid
graph LR
    PROD[🟢 Production<br/>Primary DC] -->|Sync replication| DR[🟡 DR Site<br/>Hot Standby]
    PROD -->|4h snapshot| BAK[🔴 Immutable<br/>Backup]

    subgraph SLA["SLA Targets"]
        AVAIL[99.95% Availability]
        RPO[RPO ≤ 4 hr]
        RTO[RTO ≤ 1 hr]
    end

    subgraph Drill["DR Drill"]
        D1[Quarterly DR test]
        D2[Monthly backup<br/>verification]
        D3[Annual full simulation]
    end

    style PROD fill:#166534,color:#fff
    style DR fill:#92400e,color:#fff
    style BAK fill:#991b1b,color:#fff
```

---

## 10. Software Stack

```mermaid
mindmap
  root((EOP Stack))
    Frontend
      Next.js 16
      React 19
      TypeScript
      Tailwind CSS v4
      Recharts
      Lucide Icons
      @dnd-kit
    Backend
      Node.js 20 LTS
      Auth.js v5
      Zod validation
      Server Components
      30+ API Routes
    Database
      PostgreSQL 15+
      Prisma 7 ORM
      pgvector extension
      Patroni HA
    AI
      Anthropic Claude API
      Haiku 4.5 (fast)
      Sonnet 4.5 (vision)
      mammoth (DOCX)
      xlsx (Excel)
    Document
      pdf-lib
      Noto Sans Thai font
      @pdf-lib/fontkit
    DevOps
      Vercel deploy
      GitHub
      pptxgenjs slides
      sharp images
```

---

## 📂 Files

| Diagram | Source | Render |
|---|---|---|
| All diagrams above | `docs/ARCHITECTURE_DIAGRAM.md` | GitHub renders Mermaid natively |
| High-fidelity SVG | `docs/architecture-overview.svg` | (Generated below) |

To view these diagrams:
- **GitHub:** Open this file on github.com — Mermaid renders automatically
- **VS Code:** Install "Markdown Preview Mermaid Support" extension
- **Online:** Copy any `mermaid` block to https://mermaid.live
- **Export:** Use `mmdc` (mermaid-cli) for PNG/SVG export

---

**Color Legend (Royal Thai Police palette):**
- 🔵 Navy `#1e3a5f` — Primary infrastructure
- 🟡 Gold `#b8860b` — AI / Highlight
- 🟢 Emerald `#166534` — Data / Storage
- 🔴 Rose `#991b1b` — Security / Firewall
