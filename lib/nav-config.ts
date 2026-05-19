// Sitemap แบบ map TOR ทุกข้อ — 20 screens
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Target,
  TrendingUp,
  ListChecks,
  FileEdit,
  FormInput,
  ShieldCheck,
  ClipboardCheck,
  Workflow,
  AlertOctagon,
  Glasses,
  FolderTree,
  ScanText,
  Search,
  Sparkles,
  Lock,
  Users,
  Network,
  Smartphone,
  GitBranch,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  torRef: string;
  description: string;
  live?: boolean;
  poc?: number;
}

export interface NavSection {
  label: string;
  systemNo?: string;
  torRef?: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "หน้าหลัก",
    items: [
      {
        label: "Dashboard ภาพรวม",
        href: "/dashboard",
        icon: LayoutDashboard,
        torRef: "1.3 / 5.7 / 6.1 / 8.9",
        description: "Real-time Dashboard ภาพรวมการปฏิบัติงานทั้ง ตร.",
        live: true,
      },
    ],
  },
  {
    label: "ระบบ 1: ยุทธศาสตร์",
    systemNo: "1",
    torRef: "5.4.1",
    items: [
      {
        label: "Strategic Alignment",
        href: "/strategic/alignment",
        icon: Target,
        torRef: "1.1 / 1.2",
        description: "AI วิเคราะห์ความสอดคล้องของแผน 3 ระดับ (NLP)",
      },
      {
        label: "KPI Cascading",
        href: "/strategic/kpi",
        icon: TrendingUp,
        torRef: "1.2.2 / 1.3",
        description: "ตัวชี้วัดถ่ายทอดเชิงน้ำตก หน่วยงาน → ส่วนกลาง",
      },
    ],
  },
  {
    label: "ระบบ 2: วาระ",
    systemNo: "2",
    torRef: "5.4.2",
    items: [
      {
        label: "Mission & Agenda",
        href: "/agenda/missions",
        icon: ListChecks,
        torRef: "2.1",
        description: "บริหารวาระและภารกิจสำคัญของ ตร.",
      },
      {
        label: "AI ร่างหนังสือสั่งการ",
        href: "/agenda/command-draft",
        icon: FileEdit,
        torRef: "2.2",
        description: "Generative AI ช่วยร่างหนังสือราชการจาก keyword",
        live: true,
        poc: 1,
      },
      {
        label: "Dynamic Form Builder",
        href: "/agenda/form-builder",
        icon: FormInput,
        torRef: "2.3",
        description: "สร้างแบบฟอร์มรายงานแบบ Drag & Drop No-Code",
      },
    ],
  },
  {
    label: "ระบบ 3: กฎระเบียบ",
    systemNo: "3",
    torRef: "5.4.3",
    items: [
      {
        label: "Compliance Reports",
        href: "/compliance/reports",
        icon: ShieldCheck,
        torRef: "3.1",
        description: "ก.พ.ร. / ITA / PMQA — รายงานอัตโนมัติ",
      },
      {
        label: "Self-Assessment",
        href: "/compliance/self-assessment",
        icon: ClipboardCheck,
        torRef: "3.2",
        description: "ประเมินตนเองก่อนส่งหน่วยประเมิน",
      },
    ],
  },
  {
    label: "ระบบ 4: สั่งการ",
    systemNo: "4",
    torRef: "5.4.4",
    items: [
      {
        label: "Command Workflow",
        href: "/command/workflow",
        icon: Workflow,
        torRef: "4.1 / 4.3 / 4.5",
        description: "วงจรคำสั่ง 9 สถานะ + Read Receipt + Smart Notification",
      },
      {
        label: "Incident Management",
        href: "/command/incident",
        icon: AlertOctagon,
        torRef: "4.5 / 6.4",
        description: "จัดการเหตุฉุกเฉิน + API 191 + CCTV + ข่าวกรอง",
      },
    ],
  },
  {
    label: "ระบบ 5: XR Command",
    systemNo: "5",
    torRef: "5.4.5",
    items: [
      {
        label: "XR Command Center",
        href: "/xr",
        icon: Glasses,
        torRef: "5.1 - 5.10",
        description: "Virtual Screens + Infinite Canvas + GIS Heatmap 360°",
        poc: 4,
      },
    ],
  },
  {
    label: "ระบบ 6: Data & AI",
    systemNo: "6",
    torRef: "5.4.6",
    items: [
      {
        label: "AI Document Classification",
        href: "/ai/doc-classification",
        icon: FolderTree,
        torRef: "6.10.3",
        description: "AI จำแนกเอกสาร 6 หมวด (ยศ./ผบ./มค./มข./วจ./อจ.)",
        live: true,
        poc: 2,
      },
      {
        label: "OCR Demo",
        href: "/ai/ocr",
        icon: ScanText,
        torRef: "6.10.3 (ค)",
        description: "OCR ภาษาไทย เป้า CER ≤ 10%",
        live: true,
        poc: 3,
      },
      {
        label: "Intelligent Search",
        href: "/ai/search",
        icon: Search,
        torRef: "8.10.12",
        description: "ค้นหา 4 โหมด — Basic / Advanced / Full-text / Semantic",
        live: true,
      },
      {
        label: "Predictive Analytics",
        href: "/ai/predictive",
        icon: Sparkles,
        torRef: "6.1 / 6.2",
        description: "พยากรณ์พื้นที่/เวลาเสี่ยง + Executive Summary AI",
      },
    ],
  },
  {
    label: "ระบบ 7: Infra & Security",
    systemNo: "7",
    torRef: "5.4.7",
    items: [
      {
        label: "Security & Audit Log",
        href: "/security/audit",
        icon: Lock,
        torRef: "7.2 / 7.1.5",
        description: "Activity Log + Zero Trust + Encryption + SIEM",
      },
      {
        label: "User & Access Management",
        href: "/security/access",
        icon: Users,
        torRef: "7.1.1 - 7.1.3",
        description: "MFA + RBAC + SSO + บัญชีผู้ใช้",
      },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      {
        label: "System Architecture",
        href: "/architecture",
        icon: Network,
        torRef: "5.6 / 5.7",
        description: "Hardware 9 nodes + Storage + L3 Switch + Internet 2 ชุด",
      },
      {
        label: "Mobile View Demo",
        href: "/mobile-demo",
        icon: Smartphone,
        torRef: "8.1",
        description: "Responsive + Mobile App (iOS/Android)",
      },
    ],
  },
  {
    label: "Meta",
    items: [
      {
        label: "TOR Coverage Matrix",
        href: "/tor-matrix",
        icon: GitBranch,
        torRef: "All",
        description: "Map ทุก TOR clause กับ web app screens — Transparency",
      },
    ],
  },
];

// Flat list สำหรับ routing utilities
export const flatNavItems: NavItem[] = navSections.flatMap((s) => s.items);

export function findNavItem(pathname: string): NavItem | undefined {
  return flatNavItems.find((i) => i.href === pathname);
}
