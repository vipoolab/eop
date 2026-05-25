// /assessments/new — สร้างแบบประเมินใหม่

import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { AssessmentCreator } from "./creator";

export const dynamic = "force-dynamic";

export default function NewAssessmentPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        eyebrow="แบบประเมินราชการ"
        title="เพิ่มแบบประเมินใหม่"
        description="กำหนดรายละเอียด กลุ่มเป้าหมาย และกำหนดส่งของแบบประเมิน"
      />
      <AssessmentCreator />
    </div>
  );
}
