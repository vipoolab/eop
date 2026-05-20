// Generate high-fidelity architecture diagram SVG + PNG
// Run: node scripts/gen-architecture-svg.js
// Output: docs/architecture-overview.svg + docs/architecture-overview.png

const sharp = require("sharp");
const { writeFileSync } = require("fs");
const { join } = require("path");

// ─────────────────────────────────────────────
// Theme colors
// ─────────────────────────────────────────────
const C = {
  navy: "#1e3a5f",
  navyDark: "#142a45",
  gold: "#b8860b",
  goldLight: "#d4a017",
  emerald: "#166534",
  rose: "#991b1b",
  amber: "#92400e",
  violet: "#7c3aed",
  blue: "#0ea5e9",
  white: "#ffffff",
  bgLight: "#f5f6f8",
  bgGray: "#e2e8f0",
  text: "#0f172a",
  muted: "#64748b",
  border: "#cbd5e1",
};

// SVG dimensions
const W = 1600;
const H = 1100;

// Helper: build SVG element with attrs
function attr(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}="${v}"`)
    .join(" ");
}

function rect(x, y, w, h, fill, opts = {}) {
  return `<rect ${attr({
    x,
    y,
    width: w,
    height: h,
    fill,
    rx: opts.rx ?? 4,
    stroke: opts.stroke ?? "none",
    "stroke-width": opts.strokeWidth ?? 0,
  })} />`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function text(x, y, content, opts = {}) {
  const fontSize = opts.fontSize ?? 14;
  const fontWeight = opts.fontWeight ?? 400;
  const fill = opts.fill ?? C.text;
  const anchor = opts.anchor ?? "start";
  const fontFamily = opts.fontFamily ?? "'Noto Sans Thai', 'Segoe UI', Arial, sans-serif";
  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${fill}" font-family="${fontFamily}" text-anchor="${anchor}" ${opts.letterSpacing ? `letter-spacing="${opts.letterSpacing}"` : ""}>${escapeXml(content)}</text>`;
}

function box(x, y, w, h, opts) {
  const stroke = opts.stroke ?? C.border;
  const fill = opts.fill ?? C.white;
  const titleColor = opts.titleColor ?? C.navy;
  const titleSize = opts.titleSize ?? 14;
  const items = opts.items ?? [];
  const itemSize = opts.itemSize ?? 11;
  const accent = opts.accent;

  let s = "";
  s += rect(x, y, w, h, fill, { stroke, strokeWidth: 1, rx: 4 });
  if (accent) {
    s += rect(x, y, w, 4, accent, { rx: 0 });
  }
  if (opts.title) {
    s += text(x + 12, y + 22, opts.title, {
      fontSize: titleSize,
      fontWeight: 700,
      fill: titleColor,
    });
  }
  if (opts.subtitle) {
    s += text(x + 12, y + 40, opts.subtitle, {
      fontSize: 10,
      fill: C.muted,
    });
  }

  const startY = opts.title ? (opts.subtitle ? 56 : 38) : 16;
  items.forEach((item, i) => {
    const itemY = y + startY + i * (itemSize + 5);
    s += text(x + 14, itemY, "• " + item, {
      fontSize: itemSize,
      fill: C.text,
    });
  });
  return s;
}

function arrow(x1, y1, x2, y2, opts = {}) {
  const color = opts.color ?? C.muted;
  const width = opts.width ?? 1.5;
  const dash = opts.dash ? `stroke-dasharray="${opts.dash}"` : "";
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" marker-end="url(#arrowhead)" ${dash} />`;
}

function label(x, y, text_, opts = {}) {
  const fontSize = opts.fontSize ?? 11;
  const fill = opts.fill ?? C.muted;
  return text(x, y, text_, { fontSize, fill, fontWeight: opts.bold ? 700 : 500 });
}

// ═════════════════════════════════════════════════════════════════
// Build SVG
// ═════════════════════════════════════════════════════════════════

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="'Noto Sans Thai', 'Segoe UI', Arial, sans-serif">`;

// Defs: arrow marker
svg += `<defs>
  <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
    <polygon points="0 0, 8 4, 0 8" fill="${C.muted}" />
  </marker>
  <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${C.gold}" />
    <stop offset="100%" stop-color="${C.goldLight}" />
  </linearGradient>
</defs>`;

// Background
svg += rect(0, 0, W, H, C.bgLight, { rx: 0 });

// Top gold accent
svg += rect(0, 0, W, 8, C.gold, { rx: 0 });
svg += rect(0, H - 8, W, 8, C.gold, { rx: 0 });

// ─── Title ───
svg += text(W / 2, 50, "EOP — Enterprise Operation Planning", {
  fontSize: 28,
  fontWeight: 700,
  fill: C.navy,
  anchor: "middle",
});
svg += text(W / 2, 78, "System Architecture · Royal Thai Police", {
  fontSize: 14,
  fill: C.muted,
  anchor: "middle",
  letterSpacing: 2,
});
svg += text(W / 2, 96, "สำนักงานยุทธศาสตร์ตำรวจ · สำนักงานตำรวจแห่งชาติ", {
  fontSize: 13,
  fill: C.muted,
  anchor: "middle",
});

// ═════════════════════════════════════════════════════════════════
// LAYER 1: User & External (top)
// ═════════════════════════════════════════════════════════════════

const layerLabel = (x, y, n, name) => {
  let s = "";
  s += rect(x, y, 100, 24, C.navy, { rx: 2 });
  s += text(x + 50, y + 16, `LAYER ${n}`, {
    fontSize: 11,
    fontWeight: 700,
    fill: C.goldLight,
    anchor: "middle",
    letterSpacing: 1,
  });
  s += text(x + 115, y + 16, name, {
    fontSize: 13,
    fontWeight: 600,
    fill: C.text,
  });
  return s;
};

// === Section 1: Users ===
svg += layerLabel(40, 130, "01", "ผู้ใช้งาน + ระบบภายนอก");

// User cards
const userY = 170;
const users = [
  { label: "💻 Web App", desc: "Desktop · 200+ users", color: C.navy },
  { label: "📱 PWA Mobile", desc: "iOS · Android", color: C.navy },
  { label: "🥽 XR Headset", desc: "5 เครื่อง · 360°", color: C.gold },
];

users.forEach((u, i) => {
  const x = 40 + i * 250;
  svg += rect(x, userY, 230, 70, C.white, {
    stroke: u.color,
    strokeWidth: 2,
    rx: 4,
  });
  svg += rect(x, userY, 4, 70, u.color, { rx: 0 });
  svg += text(x + 18, userY + 28, u.label, {
    fontSize: 15,
    fontWeight: 700,
    fill: u.color,
  });
  svg += text(x + 18, userY + 50, u.desc, {
    fontSize: 11,
    fill: C.muted,
  });
});

// External APIs (right side)
const extX = 850;
const externals = [
  { label: "📞 ศูนย์ 191", desc: "Emergency calls" },
  { label: "📹 CCTV Network", desc: "Vision AI alerts" },
  { label: "🔍 ข่าวกรอง", desc: "Intelligence reports" },
  { label: "🤖 Claude AI", desc: "Anthropic API", highlight: true },
];

externals.forEach((e, i) => {
  const x = extX + (i % 2) * 200;
  const y = 170 + Math.floor(i / 2) * 45;
  const color = e.highlight ? C.gold : C.muted;
  svg += rect(x, y, 190, 36, e.highlight ? C.gold : C.white, {
    stroke: color,
    strokeWidth: 1,
    rx: 4,
  });
  svg += text(x + 12, y + 16, e.label, {
    fontSize: 12,
    fontWeight: 600,
    fill: e.highlight ? C.white : C.text,
  });
  svg += text(x + 12, y + 30, e.desc, {
    fontSize: 9,
    fill: e.highlight ? C.white : C.muted,
  });
});

// ═════════════════════════════════════════════════════════════════
// LAYER 2: Network Edge
// ═════════════════════════════════════════════════════════════════

svg += layerLabel(40, 270, "02", "Network Edge · Security Perimeter");

// Internet
svg += rect(40, 310, 160, 80, C.white, {
  stroke: C.border,
  strokeWidth: 1,
  rx: 4,
});
svg += text(120, 332, "🌐 Internet", {
  fontSize: 13,
  fontWeight: 700,
  fill: C.navy,
  anchor: "middle",
});
svg += text(120, 350, "Fiber 500/500 Mbps × 2", {
  fontSize: 10,
  fill: C.muted,
  anchor: "middle",
});
svg += text(120, 365, "Fixed Public IP · Redundant", {
  fontSize: 10,
  fill: C.muted,
  anchor: "middle",
});
svg += text(120, 380, "ISP A + ISP B", {
  fontSize: 10,
  fontWeight: 600,
  fill: C.text,
  anchor: "middle",
});

// Firewall
svg += rect(240, 310, 160, 80, C.rose, { rx: 4 });
svg += text(320, 335, "🔥 Next-Gen Firewall", {
  fontSize: 13,
  fontWeight: 700,
  fill: C.white,
  anchor: "middle",
});
svg += text(320, 355, "≥ 3 Gbps", {
  fontSize: 11,
  fill: C.white,
  anchor: "middle",
});
svg += text(320, 372, "DDoS Protection · IDS/IPS", {
  fontSize: 10,
  fill: "rgba(255,255,255,0.8)",
  anchor: "middle",
});

// L3 Switches
svg += rect(440, 310, 160, 80, C.navy, { rx: 4 });
svg += text(520, 335, "⚖️ L3 Switch × 2", {
  fontSize: 13,
  fontWeight: 700,
  fill: C.white,
  anchor: "middle",
});
svg += text(520, 355, "64-port + 6× SFP+", {
  fontSize: 11,
  fill: C.white,
  anchor: "middle",
});
svg += text(520, 372, "OSPF · VRRP · Stacked", {
  fontSize: 10,
  fill: "rgba(255,255,255,0.8)",
  anchor: "middle",
});

// TLS Layer
svg += rect(640, 310, 160, 80, C.white, {
  stroke: C.emerald,
  strokeWidth: 2,
  rx: 4,
});
svg += text(720, 335, "🔒 TLS 1.3", {
  fontSize: 13,
  fontWeight: 700,
  fill: C.emerald,
  anchor: "middle",
});
svg += text(720, 355, "Perfect Forward Secrecy", {
  fontSize: 10,
  fill: C.muted,
  anchor: "middle",
});
svg += text(720, 372, "HSTS · CSP · CORS", {
  fontSize: 10,
  fill: C.muted,
  anchor: "middle",
});

// Arrows
svg += arrow(200, 350, 240, 350);
svg += arrow(400, 350, 440, 350);
svg += arrow(600, 350, 640, 350);

// ═════════════════════════════════════════════════════════════════
// LAYER 3: Application Compute (3 App Nodes)
// ═════════════════════════════════════════════════════════════════

svg += layerLabel(40, 420, "03", "Application Layer · 3 nodes");

const compY = 460;
[0, 1, 2].forEach((i) => {
  const x = 40 + i * 270;
  svg += rect(x, compY, 250, 110, C.white, {
    stroke: C.navy,
    strokeWidth: 1,
    rx: 4,
  });
  svg += rect(x, compY, 250, 6, C.navy, { rx: 0 });
  svg += text(x + 12, compY + 30, `📦 App Node ${i + 1}`, {
    fontSize: 14,
    fontWeight: 700,
    fill: C.navy,
  });
  svg += text(x + 12, compY + 48, "Next.js 16 + React 19 + TS", {
    fontSize: 11,
    fill: C.text,
  });
  svg += text(x + 12, compY + 64, "20-core CPU · 256 GB ECC RAM", {
    fontSize: 10,
    fill: C.muted,
  });
  svg += text(x + 12, compY + 78, "Auth.js + JWT + bcrypt", {
    fontSize: 10,
    fill: C.muted,
  });
  svg += text(x + 12, compY + 92, "20 Pages · 30+ API Routes", {
    fontSize: 10,
    fill: C.muted,
  });

  // status dot
  svg += `<circle cx="${x + 235}" cy="${compY + 25}" r="4" fill="${C.emerald}" />`;
});

// ═════════════════════════════════════════════════════════════════
// LAYER 4: AI Compute + Database
// ═════════════════════════════════════════════════════════════════

svg += layerLabel(40, 590, "04", "AI Compute + Database Layer");

// AI Nodes (left)
const aiY = 630;
[0, 1, 2].forEach((i) => {
  const x = 40 + i * 180;
  svg += rect(x, aiY, 160, 100, C.white, {
    stroke: C.gold,
    strokeWidth: 1,
    rx: 4,
  });
  svg += rect(x, aiY, 160, 6, C.gold, { rx: 0 });
  svg += text(x + 12, aiY + 30, `🤖 AI Node ${i + 1}`, {
    fontSize: 13,
    fontWeight: 700,
    fill: C.amber,
  });
  svg += text(x + 12, aiY + 48, "32-core CPU", {
    fontSize: 10,
    fill: C.text,
  });
  svg += text(x + 12, aiY + 64, "GPU 40 GB VRAM", {
    fontSize: 10,
    fill: C.text,
  });
  svg += text(x + 12, aiY + 78, "14,000 CUDA cores", {
    fontSize: 10,
    fill: C.muted,
  });
  svg += text(x + 12, aiY + 92, "Local AI cache", {
    fontSize: 10,
    fill: C.muted,
  });
});

// DB Nodes (right)
[0, 1, 2].forEach((i) => {
  const x = 620 + i * 180;
  const isPrimary = i === 0;
  svg += rect(x, aiY, 160, 100, C.white, {
    stroke: C.emerald,
    strokeWidth: 1,
    rx: 4,
  });
  svg += rect(x, aiY, 160, 6, C.emerald, { rx: 0 });
  svg += text(x + 12, aiY + 30, `🗄️ DB Node ${i + 1}`, {
    fontSize: 13,
    fontWeight: 700,
    fill: C.emerald,
  });
  svg += text(x + 12, aiY + 48, isPrimary ? "PostgreSQL Primary" : "Replica", {
    fontSize: 10,
    fontWeight: isPrimary ? 700 : 400,
    fill: isPrimary ? C.text : C.muted,
  });
  svg += text(x + 12, aiY + 64, "Prisma 7 ORM", {
    fontSize: 10,
    fill: C.muted,
  });
  svg += text(x + 12, aiY + 78, "pgvector enabled", {
    fontSize: 10,
    fill: C.muted,
  });
  svg += text(x + 12, aiY + 92, "20-core · 256 GB ECC", {
    fontSize: 10,
    fill: C.muted,
  });
});

// AI ⇄ Claude arrow
svg += arrow(580, 670, 850, 220, { color: C.gold, width: 2, dash: "5,3" });
svg += text(700, 470, "Claude API call", {
  fontSize: 11,
  fill: C.gold,
  fontWeight: 600,
  anchor: "middle",
});

// ═════════════════════════════════════════════════════════════════
// LAYER 5: Storage + Backup
// ═════════════════════════════════════════════════════════════════

svg += layerLabel(40, 760, "05", "Storage · Backup · Power");

// SAN
svg += rect(40, 800, 380, 100, C.white, {
  stroke: C.emerald,
  strokeWidth: 1,
  rx: 4,
});
svg += rect(40, 800, 6, 100, C.emerald, { rx: 0 });
svg += text(60, 824, "💾 SAN Storage", {
  fontSize: 14,
  fontWeight: 700,
  fill: C.emerald,
});
svg += text(60, 844, "≥ 20 TB All-NVMe SSD", {
  fontSize: 11,
  fill: C.text,
});
svg += text(60, 862, "RAID-6 · Active-Active Controllers", {
  fontSize: 10,
  fill: C.muted,
});
svg += text(60, 878, "Cache ≥ 256 GB · 64 Gb FC", {
  fontSize: 10,
  fill: C.muted,
});
svg += text(60, 894, "Data Reduction · Compression · Snapshot", {
  fontSize: 10,
  fill: C.muted,
});

// Backup
svg += rect(440, 800, 280, 100, C.rose, { rx: 4 });
svg += text(460, 824, "🛡️ Immutable Backup", {
  fontSize: 13,
  fontWeight: 700,
  fill: C.white,
});
svg += text(460, 846, "WORM Compliant", {
  fontSize: 11,
  fill: C.white,
});
svg += text(460, 862, "Ransomware-resistant", {
  fontSize: 10,
  fill: "rgba(255,255,255,0.85)",
});
svg += text(460, 878, "Air-gapped Storage", {
  fontSize: 10,
  fill: "rgba(255,255,255,0.85)",
});
svg += text(460, 894, "Snapshot ทุก 4 ชม.", {
  fontSize: 10,
  fill: "rgba(255,255,255,0.85)",
});

// Power
svg += rect(740, 800, 380, 100, C.white, {
  stroke: C.navy,
  strokeWidth: 1,
  rx: 4,
});
svg += rect(740, 800, 6, 100, C.navy, { rx: 0 });
svg += text(760, 824, "⚡ Infrastructure & Power", {
  fontSize: 14,
  fontWeight: 700,
  fill: C.navy,
});
svg += text(760, 844, "Cabinet 40U · Cooling system", {
  fontSize: 11,
  fill: C.text,
});
svg += text(760, 862, "UPS 5 kVA × 2 (redundant)", {
  fontSize: 10,
  fill: C.muted,
});
svg += text(760, 878, "Environment Monitoring + Fire Suppression", {
  fontSize: 10,
  fill: C.muted,
});
svg += text(760, 894, "Access Control: RFID/Face/IC ≥ 1,000 users", {
  fontSize: 10,
  fill: C.muted,
});

// Backup arrow (4h)
svg += arrow(420, 850, 440, 850, { color: C.muted, dash: "3,3" });

// ═════════════════════════════════════════════════════════════════
// Right sidebar: KPI / Specs
// ═════════════════════════════════════════════════════════════════

const sbX = 1150;
svg += rect(sbX, 130, 410, 770, C.navy, { rx: 6 });

svg += text(sbX + 205, 162, "System Specifications", {
  fontSize: 18,
  fontWeight: 700,
  fill: C.goldLight,
  anchor: "middle",
});
svg += text(sbX + 205, 182, "ตอบ TOR · ภาคผนวก ข", {
  fontSize: 11,
  fill: "rgba(255,255,255,0.6)",
  anchor: "middle",
});

// Divider
svg += rect(sbX + 30, 196, 350, 1, C.goldLight, { rx: 0 });

// Specs
const specs = [
  ["Concurrent Users", "1,000+"],
  ["Page Load (p95)", "< 200 ms"],
  ["API Response (p95)", "< 500 ms"],
  ["Availability SLA", "99.95%"],
  ["RPO", "≤ 4 hours"],
  ["RTO", "≤ 1 hour"],
  ["Backup Retention", "7 years"],
];

specs.forEach((s, i) => {
  const y = 240 + i * 40;
  svg += text(sbX + 30, y, s[0], {
    fontSize: 12,
    fill: "rgba(255,255,255,0.7)",
  });
  svg += text(sbX + 380, y, s[1], {
    fontSize: 14,
    fontWeight: 700,
    fill: C.white,
    anchor: "end",
  });
  svg += rect(sbX + 30, y + 8, 350, 1, "rgba(255,255,255,0.1)", { rx: 0 });
});

// Tech stack
svg += text(sbX + 205, 560, "Technology Stack", {
  fontSize: 14,
  fontWeight: 700,
  fill: C.goldLight,
  anchor: "middle",
  letterSpacing: 2,
});

const stacks = [
  ["Frontend", "Next.js 16 · React 19 · TS"],
  ["Backend", "Node.js 20 · Auth.js v5 · Zod"],
  ["Database", "PostgreSQL · Prisma · pgvector"],
  ["AI", "Claude Haiku 4.5 + Sonnet 4.5"],
  ["Security", "TLS 1.3 · bcrypt · AES-256"],
  ["Standards", "CII · ก.พ.ร. · ITA · PMQA"],
];

stacks.forEach((s, i) => {
  const y = 600 + i * 42;
  svg += rect(sbX + 30, y, 350, 36, "rgba(255,255,255,0.05)", { rx: 4 });
  svg += text(sbX + 42, y + 16, s[0], {
    fontSize: 10,
    fontWeight: 700,
    fill: C.goldLight,
    letterSpacing: 1,
  });
  svg += text(sbX + 42, y + 30, s[1], {
    fontSize: 11,
    fill: C.white,
  });
});

// Footer banner
svg += text(W / 2, H - 30, "Pre-PoC Demo · พุทธศักราช ๒๕๖๙ · Internal Use Only", {
  fontSize: 11,
  fill: C.muted,
  anchor: "middle",
  letterSpacing: 1,
});

svg += `</svg>`;

// ═════════════════════════════════════════════════════════════════
// Write files
// ═════════════════════════════════════════════════════════════════

const outDir = join(__dirname, "..", "docs");
const svgPath = join(outDir, "architecture-overview.svg");
writeFileSync(svgPath, svg, "utf-8");
console.log(`✓ ${svgPath} (${(svg.length / 1024).toFixed(1)} KB)`);

// PNG export — strip emoji that breaks sharp's libxml parser
(async () => {
  // Replace emoji with text equivalents for raster rendering
  const safeSvg = svg
    .replace(/💻/g, "")
    .replace(/📱/g, "")
    .replace(/🥽/g, "")
    .replace(/📞/g, "")
    .replace(/📹/g, "")
    .replace(/🔍/g, "")
    .replace(/🤖/g, "")
    .replace(/🌐/g, "")
    .replace(/🔥/g, "")
    .replace(/⚖️/g, "")
    .replace(/🔒/g, "")
    .replace(/📦/g, "")
    .replace(/🗄️/g, "")
    .replace(/💾/g, "")
    .replace(/🛡️/g, "")
    .replace(/⚡/g, "")
    .replace(/⭐/g, "")
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "");

  try {
    const pngPath = join(outDir, "architecture-overview.png");
    await sharp(Buffer.from(safeSvg)).png().toFile(pngPath);
    console.log(`✓ ${pngPath}`);

    const smallPath = join(outDir, "architecture-overview-small.png");
    await sharp(Buffer.from(safeSvg))
      .resize({ width: 1200 })
      .png()
      .toFile(smallPath);
    console.log(`✓ ${smallPath}`);
  } catch (e) {
    console.warn("PNG export failed:", e.message);
    console.warn("SVG is still available at", svgPath);
  }
})();
