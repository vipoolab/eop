import { PlaceholderPage } from "@/components/placeholder-page";

export default function ArchitecturePage() {
  return (
    <PlaceholderPage
      title="System Architecture"
      system="Infrastructure — TOR ภาคผนวก ข"
      torRefs={["5.6", "5.7", "ภาคผนวก ข"]}
      description="โครงสร้างฮาร์ดแวร์: 9 Server Nodes + Storage + Network + UPS + Internet 2 ชุด"
      features={[
        "App Node × 3 (CPU 20 core, RAM 256GB ECC DDR4)",
        "Database Node × 3 (เหมือน App Node)",
        "Protocol Node (AI/ML) × 3 (CPU 32 core, GPU GDDR6 ≥40GB, ≥14,000 Core, ≥300 GB/s)",
        "Storage SAN ≥ 20 TB NVMe + Immutable Snapshot",
        "L3 Switch 64-port × 2",
        "Next Generation Firewall (NGFW)",
        "Data Center Cabinet 40U + UPS 5kVA × 2",
        "Internet Fiber Leased Line × 2 (500/500 Mbps + Fixed Public IP)",
        "XR Headset × 5 (≥1440×936 per eye, 6 DoF)",
        "Hypervisor (HA + Live Migration)",
      ]}
      status="scaffolded"
      scheduledDay={6}
    />
  );
}
