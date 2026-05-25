import { redirect } from "next/navigation";

export default function Home() {
  // Demo entrypoint: เริ่มที่ "งานรอ" — ทุก persona เห็นงานที่ต้องทำ
  redirect("/inbox");
}
