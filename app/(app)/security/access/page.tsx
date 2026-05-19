import { PlaceholderPage } from "@/components/placeholder-page";

export default function UserAccessPage() {
  return (
    <PlaceholderPage
      title="User & Access Management"
      system="ระบบ 7: Infrastructure & Security"
      torRefs={["5.4.7", "7.1"]}
      description="MFA + RBAC + Local Auth (One-way Hash) + จัดการบัญชี"
      features={[
        "7.1.1 สร้าง/แก้/ระงับ/ยกเลิกบัญชี + กำหนดสิทธิ์",
        "7.1.2 MFA (Multi-Factor Authentication)",
        "7.1.2 Local Authentication (One-way Hash) ด้วย bcrypt",
        "7.1.3 RBAC (Role-Based Access Control)",
        "7.1.6 ป้องกัน Login/Logout",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
