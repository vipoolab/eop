// /dashboard — Analytics dashboard with multi-filter + charts + GIS map

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getDashboardData } from "@/lib/dashboard/mock-data";
import { AnalyticsDashboard } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const data = getDashboardData();

  return (
    <div className="space-y-5">
      <PageHeader
        icon={BarChart3}
        eyebrow="แดชบอร์ดวิเคราะห์"
        title="วิเคราะห์ข้อมูลเชิงลึก"
        description={`วิเคราะห์ข้อมูล ${data.length.toLocaleString()} รายการ พร้อมตัวกรอง ๔ มิติ (ช่วงเวลา / หน่วยงาน / พื้นที่ / ประเภทคำสั่ง) + กราฟ ๔ ชนิด + แผนที่ GIS`}
        live
      />

      <AnalyticsDashboard initialData={data} />
    </div>
  );
}
