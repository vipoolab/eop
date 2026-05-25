// Sidebar config — เน้นเมนูที่ใช้งานได้จริงเท่านั้น (ค่อยเพิ่มทีละเมนู)
import type { LucideIcon } from "lucide-react";
import {
  Library,
  FileEdit,
  Inbox,
  LayoutList,
  ClipboardList,
  AlertOctagon,
  Brain,
  LayoutDashboard,
  FileSearch,
  ScanLine,
  Sparkles,
  BarChart3,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  live?: boolean;
  /** PoC tag — set to PoC number (1, 2, 3) to show gold "PoC N" badge */
  poc?: number;
  /** If set, sidebar will fetch /api/inbox and show this count as badge */
  badge?: "inbox";
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "งานของฉัน",
    items: [
      {
        label: "ภาพรวมระบบ",
        href: "/overview",
        icon: LayoutDashboard,
        description:
          "Executive Dashboard — สถานะระบบทั้งหมดในมุมมองเดียว เห็นภาพชัดทั้งฝ่ายปฏิบัติและฝ่ายบริหาร",
        live: true,
      },
      {
        label: "แดชบอร์ดวิเคราะห์",
        href: "/dashboard",
        icon: BarChart3,
        description:
          "Analytics Dashboard — กราฟเส้น/แท่ง/วงกลม/แผนที่ GIS พร้อมตัวกรอง ๔ มิติ (ช่วงเวลา / หน่วยงาน / พื้นที่ / ประเภทคำสั่ง)",
        live: true,
      },
      {
        label: "งานรอ",
        href: "/inbox",
        icon: Inbox,
        description: "หนังสือสั่งการที่รออนุมัติ รับทราบ ปฏิบัติ หรือส่งผล",
        badge: "inbox",
        live: true,
      },
      {
        label: "ระบบข้อมูลและ AI",
        href: "/intelligence",
        icon: Brain,
        description:
          "OCR / Classify / Predict / Search / Dashboard 5 ประเภท / Heatmap",
        live: true,
      },
    ],
  },
  {
    label: "ระบบ AI สำหรับ PoC",
    items: [
      {
        label: "ร่างหนังสือสั่งการ (AI)",
        href: "/commands/new",
        icon: Sparkles,
        description:
          "PoC ๑ — AI ร่างหนังสือสั่งการตามรูปแบบราชการจากข้อมูล ๓ ส่วน (คำสำคัญ / ข้อมูลตั้งต้น / บริบท)",
        poc: 1,
      },
      {
        label: "จำแนกประเภทเอกสาร",
        href: "/intelligence/classify",
        icon: FileSearch,
        description:
          "PoC ๒ — AI จำแนกเอกสารเข้า ๖ หมวด (ยศ./ผบ./มค./มข./วจ./อจ.) รองรับ DOCX upload และ batch ๑๖ ไฟล์",
        poc: 2,
      },
      {
        label: "OCR เอกสาร (AI Vision)",
        href: "/intelligence/ocr",
        icon: ScanLine,
        description:
          "PoC ๓ — AI Vision อ่านข้อความจาก PDF/รูปภาพ ภาษาไทย ความแม่นยำสูง พร้อมวัด CER ตามเกณฑ์ TOR",
        poc: 3,
      },
    ],
  },
  {
    label: "แผนยุทธศาสตร์",
    items: [
      {
        label: "คลังแผนยุทธศาสตร์",
        href: "/strategic",
        icon: Library,
        description:
          "แผน 3 ระดับ — อัปโหลด PDF · AI ดึงโครงสร้าง · Dashboard ลำดับชั้น",
      },
    ],
  },
  {
    label: "ระบบสั่งการ",
    items: [
      {
        label: "ร่างหนังสือสั่งการ",
        href: "/commands",
        icon: FileEdit,
        description:
          "AI Engine ร่างหนังสือสั่งการสอดคล้องกับแผน 3 ระดับ + กำหนดหน่วยรับ/ระยะเวลา/KPI",
        live: true,
      },
      {
        label: "ศูนย์ปฏิบัติการฉุกเฉิน",
        href: "/commands/emergency",
        icon: AlertOctagon,
        description:
          "Emergency Operations Center — สั่งการเร่งด่วน + ติดตามเหตุฉุกเฉินแบบ real-time",
        live: true,
      },
      {
        label: "แบบฟอร์มรายงาน",
        href: "/forms",
        icon: LayoutList,
        description:
          "จัดการแบบฟอร์มสำหรับตัวชี้วัดเชิงคุณภาพ — ผู้ดูแลระบบสร้างแบบฟอร์มให้หน่วยงานใช้รายงานผล",
      },
      {
        label: "แบบประเมินราชการ",
        href: "/assessments",
        icon: ClipboardList,
        description:
          "วางแผนและติดตามการส่งแบบประเมิน ก.พ.ร., PMQA, ITA ของหน่วยงานในสังกัด",
      },
    ],
  },
];

export const flatNavItems: NavItem[] = navSections.flatMap((s) => s.items);

export function findNavItem(pathname: string): NavItem | undefined {
  return flatNavItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );
}
