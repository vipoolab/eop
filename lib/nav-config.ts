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
  FileSearch,
  FileBarChart,
  BrainCircuit,
  Database,
} from "lucide-react";

export type Role = "ADMIN" | "COMMANDER" | "STAFF" | "AUDITOR" | "VIEWER";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  torRef: string;
  description: string;
  live?: boolean;
  poc?: number;
  /** Roles ที่เห็นเมนูนี้ — ถ้าไม่ระบุ = ทุกคนเห็น */
  roles?: Role[];
}

export interface NavSection {
  label: string;
  systemNo?: string;
  torRef?: string;
  items: NavItem[];
}

/** Filter sidebar sections+items ตาม role ของ user */
export function filterNavForRole(role: Role | undefined, sections: NavSection[]): NavSection[] {
  if (!role) return [];
  return sections
    .map((s) => ({
      ...s,
      items: s.items.filter((i) => !i.roles || i.roles.includes(role)),
    }))
    .filter((s) => s.items.length > 0);
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
        label: "วาระงาน (Agenda)",
        href: "/agenda/agendas",
        icon: ListChecks,
        torRef: "2.1",
        description: "บริหารวาระประชุม/พิธีการ/ตรวจเยี่ยม/กำหนดรายงาน",
        roles: ["ADMIN", "COMMANDER", "STAFF", "AUDITOR", "VIEWER"],
      },
      {
        label: "Mission & Agenda",
        href: "/agenda/missions",
        icon: ListChecks,
        torRef: "2.1",
        description: "บริหารวาระและภารกิจสำคัญของ ตร.",
        roles: ["ADMIN", "COMMANDER", "STAFF", "AUDITOR", "VIEWER"],
      },
      {
        label: "AI ร่างหนังสือสั่งการ",
        href: "/agenda/command-draft",
        icon: FileEdit,
        torRef: "2.2",
        description: "Generative AI ช่วยร่างหนังสือราชการจาก keyword",
        live: true,
        poc: 1,
        roles: ["ADMIN", "COMMANDER", "STAFF"],
      },
      {
        label: "Dynamic Form Builder",
        href: "/agenda/form-builder",
        icon: FormInput,
        torRef: "2.3",
        description: "สร้างแบบฟอร์มรายงานแบบ Drag & Drop No-Code",
        roles: ["ADMIN", "COMMANDER"],
      },
      {
        label: "กรอกแบบฟอร์ม",
        href: "/agenda/forms",
        icon: FormInput,
        torRef: "2.3",
        description: "เลือกแบบฟอร์มเพื่อกรอกข้อมูลจริง + ดูประวัติการกรอก",
        roles: ["ADMIN", "COMMANDER", "STAFF"],
      },
    ],
  },
  {
    label: "ระบบ 3: กฎระเบียบ",
    systemNo: "3",
    torRef: "5.4.3",
    items: [
      {
        label: "ภาพรวมการประเมิน",
        href: "/compliance",
        icon: ShieldCheck,
        torRef: "3.1",
        description: "Dashboard ก.พ.ร./ITA/PMQA — คะแนน + Trend + Deadline",
      },
      {
        label: "Compliance Reports",
        href: "/compliance/reports",
        icon: ClipboardCheck,
        torRef: "3.1",
        description: "ก.พ.ร./ITA/PMQA — รายงานอัตโนมัติ + Self-Assessment",
      },
      {
        label: "แบบฟอร์มมาตรฐาน (Templates)",
        href: "/compliance/templates",
        icon: FileEdit,
        torRef: "3.1",
        description: "สร้าง/แก้/clone template — Builder รายข้อ checklist",
        roles: ["ADMIN", "COMMANDER"],
      },
      {
        label: "คลังหลักฐาน",
        href: "/compliance/evidence",
        icon: ClipboardCheck,
        torRef: "3.1",
        description: "เอกสารหลักฐาน Compliance — ใช้ซ้ำได้ปีต่อปี",
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
        roles: ["ADMIN", "COMMANDER"],
      },
    ],
  },
  {
    label: "ระบบ 6: Data & AI",
    systemNo: "6",
    torRef: "5.4.6",
    items: [
      {
        label: "ค้นหา",
        href: "/ai/search",
        icon: Search,
        torRef: "8.10.11",
        description: "ค้นหา 4 โหมด — Basic / Advanced / Full-text / Semantic",
        live: true,
        roles: ["ADMIN", "COMMANDER", "STAFF", "AUDITOR"],
      },
      {
        label: "เครื่องมือเอกสาร AI",
        href: "/ai/documents",
        icon: FileSearch,
        torRef: "8.10.3",
        description: "OCR ภาษาไทย + จัดหมวดเอกสาร + แก้ไข Text Extraction",
        live: true,
        roles: ["ADMIN", "COMMANDER", "STAFF", "AUDITOR"],
      },
      {
        label: "Dashboards",
        href: "/dashboards",
        icon: LayoutDashboard,
        torRef: "8.10.10",
        description: "Mission · Risk · Emergency · Resource · Performance",
      },
      {
        label: "รายงาน & สรุป",
        href: "/reports",
        icon: FileBarChart,
        torRef: "6.2 / 6.4.4 / 6.4.7",
        description: "Executive Summary · SITREP · After Action Review",
        roles: ["ADMIN", "COMMANDER", "AUDITOR"],
      },
      {
        label: "วิเคราะห์ + พยากรณ์",
        href: "/analytics",
        icon: BrainCircuit,
        torRef: "6.3 / 6.2",
        description: "Predictive Analytics + Anomaly Alerts",
        roles: ["ADMIN", "COMMANDER", "AUDITOR"],
      },
      {
        label: "Data Operations",
        href: "/data/operations",
        icon: Database,
        torRef: "6.4.1 / 8.10.1-2",
        description: "ETL Pipeline · Data Quality · External Systems (191/CCTV)",
        roles: ["ADMIN"],
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
        roles: ["ADMIN", "AUDITOR"],
      },
      {
        label: "User & Access Management",
        href: "/security/access",
        icon: Users,
        torRef: "7.1.1 - 7.1.3",
        description: "MFA + RBAC + SSO + บัญชีผู้ใช้",
        roles: ["ADMIN"],
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
        roles: ["ADMIN"],
      },
      {
        label: "Mobile View Demo",
        href: "/mobile-demo",
        icon: Smartphone,
        torRef: "8.1",
        description: "Responsive + Mobile App (iOS/Android)",
        roles: ["ADMIN"],
      },
    ],
  },
];

// Flat list สำหรับ routing utilities
export const flatNavItems: NavItem[] = navSections.flatMap((s) => s.items);

export function findNavItem(pathname: string): NavItem | undefined {
  return flatNavItems.find((i) => i.href === pathname);
}
