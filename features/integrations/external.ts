// External API Integration Stubs — TOR 6.4.2
// 191 Emergency · CCTV · Intelligence
// Production: replace stubs with real API calls

export interface IncidentReport {
  source: "191" | "CCTV" | "intel";
  externalId: string;
  type: string;
  title: string;
  description?: string;
  location?: { lat?: number; lng?: number; address?: string };
  severity: number; // 1-10
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// 191 Emergency Call Center
// Production: WebSocket subscription to ศูนย์ 191 API
// ─────────────────────────────────────────────

export async function fetch191Incidents(opts?: {
  since?: Date;
  limit?: number;
}): Promise<IncidentReport[]> {
  // Stub: mock incidents that look real
  // Replace with: const r = await fetch(process.env.API_191_URL!, { headers: ... });
  const now = Date.now();
  const mins = (m: number) => new Date(now - m * 60 * 1000);

  const mockData: IncidentReport[] = [
    {
      source: "191",
      externalId: "191-2569-04211",
      type: "ประท้วง",
      title: "การชุมนุมหน้าทำเนียบรัฐบาล",
      location: { lat: 13.7563, lng: 100.5018, address: "ดุสิต · กทม." },
      severity: 8,
      occurredAt: mins(10),
      metadata: { caller: "พลเมือง", units_dispatched: 5 },
    },
    {
      source: "191",
      externalId: "191-2569-04212",
      type: "อาชญากรรม",
      title: "เหตุปล้นทรัพย์ ร้านทอง บางรัก",
      location: { lat: 13.7307, lng: 100.5234, address: "บางรัก · กทม." },
      severity: 9,
      occurredAt: mins(32),
      metadata: { caller: "เจ้าของร้าน", units_dispatched: 8 },
    },
  ];

  const filtered = opts?.since
    ? mockData.filter((m) => m.occurredAt >= opts.since!)
    : mockData;
  return filtered.slice(0, opts?.limit ?? 20);
}

// ─────────────────────────────────────────────
// CCTV Network — สำนักงานตำรวจมีกล้องเป็นพันตัวทั่ว กทม.
// Production: ONVIF / RTSP stream + AI vision analytics
// ─────────────────────────────────────────────

export async function fetchCctvAlerts(opts?: {
  since?: Date;
  zones?: string[];
}): Promise<IncidentReport[]> {
  const now = Date.now();
  const mins = (m: number) => new Date(now - m * 60 * 1000);

  const mockAlerts: IncidentReport[] = [
    {
      source: "CCTV",
      externalId: "cctv-cam-1247-evt-892",
      type: "อุบัติเหตุ",
      title: "อุบัติเหตุรถบรรทุก ทางหลวง ๓๔",
      location: { lat: 13.6098, lng: 100.7501, address: "บางพลี · สมุทรปราการ" },
      severity: 6,
      occurredAt: mins(60),
      metadata: { camera_id: "1247", confidence: 0.92, frame_url: "..." },
    },
  ];

  return opts?.since
    ? mockAlerts.filter((m) => m.occurredAt >= opts.since!)
    : mockAlerts;
}

// ─────────────────────────────────────────────
// Intelligence System — ระบบข่าวกรอง
// Production: secure API with mutual TLS
// ─────────────────────────────────────────────

export async function fetchIntelReports(opts?: {
  classification?: "secret" | "confidential" | "restricted";
  since?: Date;
}): Promise<IncidentReport[]> {
  const now = Date.now();
  const mins = (m: number) => new Date(now - m * 60 * 1000);

  const mockIntel: IncidentReport[] = [
    {
      source: "intel",
      externalId: "intel-2569-1198",
      type: "ข่าวกรอง",
      title: "พบกลุ่มผู้ค้ายาเสพติด พื้นที่ภาคใต้",
      location: { lat: 7.0080, lng: 100.4760, address: "หาดใหญ่ · สงขลา" },
      severity: 7,
      occurredAt: mins(120),
      metadata: { classification: "confidential", source_id: "INF-887" },
    },
  ];

  return opts?.since
    ? mockIntel.filter((m) => m.occurredAt >= opts.since!)
    : mockIntel;
}

// ─────────────────────────────────────────────
// Unified Incident Fetch — ทั้ง 3 sources
// ─────────────────────────────────────────────

export async function fetchAllIncidents(opts?: {
  since?: Date;
}): Promise<IncidentReport[]> {
  const [n191, cctv, intel] = await Promise.all([
    fetch191Incidents(opts),
    fetchCctvAlerts(opts),
    fetchIntelReports(opts),
  ]);

  return [...n191, ...cctv, ...intel].sort(
    (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()
  );
}
