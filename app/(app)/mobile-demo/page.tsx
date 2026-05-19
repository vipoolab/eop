import { PlaceholderPage } from "@/components/placeholder-page";

export default function MobileViewPage() {
  return (
    <PlaceholderPage
      title="Mobile View Demo"
      system="Cross-cutting Requirements"
      torRefs={["5.5"]}
      description="แสดงระบบ EOP บนมือถือ — Web Application + Mobile Application (Android + iOS) ในรูปแบบ Responsive Web Design"
      features={[
        "5.5 Web Application + Mobile Application",
        "5.5 รองรับ Android และ iOS",
        "5.5 Responsive Web Design",
        "PWA (Progressive Web App) — ติดตั้งบนมือถือเหมือน native app",
        "Frame mockup แสดงหน้าจอบน iPhone + Android",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
