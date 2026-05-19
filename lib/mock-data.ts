// Mock data for EOP demo — based on real Thai police operations context
// Anonymized references to ก.พ.ร., ITA, PMQA reports and public ตร. data

export const UNITS = [
  { code: "ยศ.", name: "กองยุทธศาสตร์", color: "#3b82f6" },
  { code: "ผบ.", name: "กองแผนงานอำนวยการ", color: "#10b981" },
  { code: "มค.", name: "กองแผนงานความมั่นคง", color: "#f59e0b" },
  { code: "มข.", name: "กองแผนงานกิจการพิเศษ", color: "#8b5cf6" },
  { code: "วจ.", name: "กองวิจัย", color: "#ec4899" },
  { code: "อจ.", name: "ฝ่ายอำนวยการ สยศ.ตร.", color: "#06b6d4" },
] as const;

export const COMMAND_STATUSES = [
  { id: "draft", name: "ร่าง", color: "#94a3b8" },
  { id: "submitted", name: "เสนอ", color: "#60a5fa" },
  { id: "approved", name: "อนุมัติ", color: "#34d399" },
  { id: "published", name: "เผยแพร่", color: "#22d3ee" },
  { id: "acknowledged", name: "รับทราบ", color: "#a78bfa" },
  { id: "in_progress", name: "ปฏิบัติ", color: "#fbbf24" },
  { id: "reported", name: "ส่งผล", color: "#fb923c" },
  { id: "audited", name: "ตรวจ", color: "#f87171" },
  { id: "closed", name: "ปิด", color: "#6b7280" },
] as const;

// KPI Cards data
export const kpiCards = [
  {
    label: "คำสั่งทั้งหมด (ไตรมาส)",
    value: 1247,
    change: 12.4,
    sub: "เพิ่มขึ้นจากไตรมาสก่อน",
  },
  {
    label: "อยู่ระหว่างปฏิบัติ",
    value: 348,
    change: -3.2,
    sub: "ลดลงจากเดือนก่อน",
  },
  {
    label: "เสร็จสิ้นในกำหนด",
    value: 821,
    change: 8.7,
    sub: "อัตรา 92.3%",
  },
  {
    label: "รอตรวจรับ",
    value: 78,
    change: 5.1,
    sub: "เฉลี่ย 4.2 วัน/คำสั่ง",
  },
  {
    label: "KPI Achievement",
    value: 87.5,
    change: 2.3,
    sub: "เทียบเป้าปีงบประมาณ",
    unit: "%",
  },
  {
    label: "Active Alerts",
    value: 12,
    change: 0,
    sub: "ต้องการดำเนินการ",
  },
];

// Line chart — commands per month (12 months)
export const commandsPerMonth = [
  { month: "ต.ค.67", count: 89, completed: 76 },
  { month: "พ.ย.67", count: 102, completed: 94 },
  { month: "ธ.ค.67", count: 118, completed: 110 },
  { month: "ม.ค.68", count: 95, completed: 89 },
  { month: "ก.พ.68", count: 124, completed: 115 },
  { month: "มี.ค.68", count: 137, completed: 124 },
  { month: "เม.ย.68", count: 108, completed: 98 },
  { month: "พ.ค.68", count: 142, completed: 128 },
  { month: "มิ.ย.68", count: 156, completed: 138 },
  { month: "ก.ค.68", count: 134, completed: 120 },
  { month: "ส.ค.68", count: 165, completed: 142 },
  { month: "ก.ย.68", count: 178, completed: 145 },
];

// Bar chart — commands by unit (6 units per TOR PoC 2)
export const commandsByUnit = UNITS.map((u, i) => ({
  unit: u.code,
  name: u.name,
  count: [284, 218, 196, 167, 152, 230][i],
  color: u.color,
}));

// Pie chart — status distribution
export const statusDistribution = COMMAND_STATUSES.map((s, i) => ({
  name: s.name,
  value: [42, 56, 134, 187, 243, 348, 145, 64, 28][i],
  color: s.color,
}));

// Map data — incident heatmap (Bangkok + South)
export const incidentLocations = [
  { lat: 13.7563, lng: 100.5018, name: "กทม. - บางรัก", severity: 8, count: 23 },
  { lat: 13.7466, lng: 100.5347, name: "กทม. - คลองเตย", severity: 9, count: 31 },
  { lat: 13.7651, lng: 100.5380, name: "กทม. - ห้วยขวาง", severity: 5, count: 12 },
  { lat: 13.7307, lng: 100.5234, name: "กทม. - สาทร", severity: 6, count: 15 },
  { lat: 13.7950, lng: 100.5436, name: "กทม. - ดอนเมือง", severity: 7, count: 19 },
  { lat: 13.7140, lng: 100.5740, name: "กทม. - พระโขนง", severity: 4, count: 9 },
  { lat: 18.7883, lng: 98.9853, name: "เชียงใหม่ - เมือง", severity: 6, count: 14 },
  { lat: 16.4419, lng: 102.8360, name: "ขอนแก่น - เมือง", severity: 5, count: 11 },
  { lat: 7.0080, lng: 100.4760, name: "สงขลา - หาดใหญ่", severity: 8, count: 22 },
  { lat: 7.8804, lng: 98.3923, name: "ภูเก็ต - เมือง", severity: 7, count: 17 },
  { lat: 6.5444, lng: 101.2811, name: "ปัตตานี - เมือง", severity: 9, count: 28 },
  { lat: 12.9279, lng: 100.8810, name: "ชลบุรี - พัทยา", severity: 6, count: 16 },
];

// Recent activities for sidebar/notifications
export const recentActivities = [
  {
    id: "a1",
    type: "command",
    title: "คำสั่งที่ ๐๓๒๑/๒๕๖๘ ได้รับการอนุมัติ",
    unit: "ยศ.",
    time: "5 นาทีที่แล้ว",
    status: "approved",
  },
  {
    id: "a2",
    type: "alert",
    title: "แจ้งเตือน: เหตุประท้วงในพื้นที่ บก.น.5",
    unit: "มค.",
    time: "12 นาทีที่แล้ว",
    status: "alert",
  },
  {
    id: "a3",
    type: "report",
    title: "รายงาน ก.พ.ร. ไตรมาสที่ ๔ ส่งครบหน่วยงาน",
    unit: "อจ.",
    time: "1 ชั่วโมงที่แล้ว",
    status: "completed",
  },
  {
    id: "a4",
    type: "ai",
    title: "AI สรุปคำสั่งใหม่ ๑๒ ฉบับเสร็จสิ้น",
    unit: "วจ.",
    time: "2 ชั่วโมงที่แล้ว",
    status: "completed",
  },
];
