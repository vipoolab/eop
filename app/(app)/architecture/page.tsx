// System Architecture — Hardware + Network topology

import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import {
  Network,
  Server,
  Database,
  Cpu,
  HardDrive,
  Shield,
  Wifi,
  Box,
  Zap,
  Glasses,
} from "lucide-react";

const NODES = [
  {
    layer: "Edge / Network",
    color: "bg-[#1e3a5f] text-white",
    items: [
      {
        icon: Wifi,
        title: "Internet Fiber Leased Line × 2",
        spec: "500/500 Mbps · Fixed Public IP · Redundant ISP",
      },
      {
        icon: Shield,
        title: "Next Generation Firewall",
        spec: "Stateful inspection · IDS/IPS · SSL/TLS decrypt",
      },
      {
        icon: Network,
        title: "L3 Switch 64-port × 2",
        spec: "Stacking / VRRP · Redundant uplinks",
      },
    ],
  },
  {
    layer: "Compute · Application",
    color: "bg-[#b8860b] text-white",
    items: [
      {
        icon: Server,
        title: "App Node × 3",
        spec: "CPU 20-core · RAM 256 GB ECC · NVMe SSD",
      },
      {
        icon: Database,
        title: "Database Node × 3",
        spec: "PostgreSQL HA cluster · Patroni / Streaming replication",
      },
      {
        icon: Cpu,
        title: "AI / ML Node × 3",
        spec: "CPU 32-core · GPU ≥ 40 GB VRAM · 14,000 CUDA cores",
      },
    ],
  },
  {
    layer: "Storage · Backup",
    color: "bg-emerald-700 text-white",
    items: [
      {
        icon: HardDrive,
        title: "SAN Storage ≥ 20 TB",
        spec: "All-NVMe · RAID-6 · Snapshot ทุก 4 ชม.",
      },
      {
        icon: HardDrive,
        title: "Immutable Backup Storage",
        spec: "Air-gapped · WORM compliant · Ransomware-resistant",
      },
    ],
  },
  {
    layer: "Infrastructure · Power",
    color: "bg-slate-700 text-white",
    items: [
      {
        icon: Box,
        title: "Data Center Cabinet 40U",
        spec: "ระบบทำความเย็นในห้องเฉพาะ · เซนเซอร์อุณหภูมิ",
      },
      {
        icon: Zap,
        title: "UPS 5 kVA × 2",
        spec: "Online double-conversion · สำรองได้ ≥ 30 นาที",
      },
    ],
  },
  {
    layer: "End-user Devices",
    color: "bg-violet-700 text-white",
    items: [
      {
        icon: Glasses,
        title: "XR Headset × 5",
        spec: "≥ 1440×936 ต่อตา · 6 DoF · สำหรับ XR Command Center",
      },
    ],
  },
];

const CHARACTERISTICS = [
  { label: "ผู้ใช้งานพร้อมกัน", value: "1,000+ users" },
  { label: "Latency เป้าหมาย", value: "< 200 ms" },
  { label: "Availability", value: "99.95%" },
  { label: "Backup RPO/RTO", value: "≤ 4 hr / ≤ 1 hr" },
];

export default function ArchitecturePage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        icon={Network}
        eyebrow="Infrastructure"
        title="สถาปัตยกรรมระบบ"
        description="โครงสร้างฮาร์ดแวร์ของ Data Center — Compute · Storage · Network · Power · End-user Devices"
      />

      {/* Architecture diagram (visual SVG) */}
      <div className="rounded-sm border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            System Architecture Overview
          </h2>
          <a
            href="/architecture-overview.svg"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#1e3a5f] hover:underline font-semibold"
          >
            เปิดเต็มจอ ↗
          </a>
        </div>
        <div className="p-2 bg-slate-50/50 overflow-x-auto">
          <Image
            src="/architecture-overview.svg"
            alt="EOP System Architecture Overview"
            width={1600}
            height={1100}
            className="w-full h-auto min-w-[1200px]"
            unoptimized
          />
        </div>
      </div>

      {/* Quick characteristics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CHARACTERISTICS.map((c) => (
          <div
            key={c.label}
            className="rounded-sm border border-slate-200 bg-white p-4"
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {c.label}
            </div>
            <div className="text-base font-semibold text-slate-900 tabular-nums">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Layered architecture */}
      <div className="space-y-4">
        {NODES.map((layer) => (
          <div
            key={layer.layer}
            className="rounded-sm border border-slate-200 bg-white overflow-hidden"
          >
            <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-sm ${layer.color}`}
              >
                Layer
              </span>
              <h3 className="text-sm font-semibold text-slate-800">
                {layer.layer}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100">
              {layer.items.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="bg-white px-4 py-3 flex items-start gap-3"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-slate-50 border border-slate-200 text-slate-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 mb-0.5">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        {item.spec}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Software stack note */}
      <div className="rounded-sm border border-slate-200 bg-slate-50/50 p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Software Stack
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <SoftwareGroup
            label="Application"
            items={[
              "Next.js 16 + React 19",
              "TypeScript",
              "Tailwind CSS v4",
            ]}
          />
          <SoftwareGroup
            label="Data & AI"
            items={[
              "PostgreSQL (HA + pgvector)",
              "Anthropic Claude API",
              "Prisma ORM",
            ]}
          />
          <SoftwareGroup
            label="Security & Ops"
            items={[
              "Auth.js v5 (JWT)",
              "RBAC + Audit Trail",
              "TLS 1.3 + AES-256",
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function SoftwareGroup({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#b8860b] mb-2">
        {label}
      </div>
      <ul className="space-y-1">
        {items.map((i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-xs text-slate-700"
          >
            <span className="h-1 w-1 rounded-full bg-slate-400" />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
