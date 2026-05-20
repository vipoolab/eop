// Generate PWA icons (192x192 + 512x512) via sharp
// Run: node scripts/gen-pwa-icons.js

const sharp = require("sharp");
const path = require("path");

const SVG_TEMPLATE = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#1e3a5f"/>
  <rect x="${size * 0.08}" y="${size * 0.08}" width="${size * 0.84}" height="${size * 0.84}" fill="#1e3a5f" stroke="#d4a017" stroke-width="${size * 0.02}"/>
  <text x="50%" y="55%" font-family="Georgia, serif" font-size="${size * 0.32}" font-weight="bold" fill="#d4a017" text-anchor="middle" dominant-baseline="middle">EOP</text>
  <text x="50%" y="82%" font-family="Arial" font-size="${size * 0.07}" font-weight="500" fill="#ffffff" text-anchor="middle" letter-spacing="${size * 0.005}">ROYAL THAI POLICE</text>
</svg>`;

(async () => {
  const outDir = path.join(__dirname, "..", "public");

  for (const size of [192, 512]) {
    const svg = SVG_TEMPLATE(size);
    const outPath = path.join(outDir, `icon-${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`✓ ${outPath}`);
  }

  // Also generate a favicon-friendly small one
  const fav = SVG_TEMPLATE(32);
  await sharp(Buffer.from(fav))
    .png()
    .toFile(path.join(outDir, "favicon-32.png"));
  console.log("✓ favicon-32.png");

  console.log("Done.");
})();
