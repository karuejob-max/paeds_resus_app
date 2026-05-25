/**
 * One-off generator for client/public/og-image.png (1200×630 Open Graph share image).
 * Run: node scripts/generate-og-image.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const logoPath = path.join(root, "client/public/paeds-resus-logo-brand.png");
const outPath = path.join(root, "client/public/og-image.png");

const WIDTH = 1200;
const HEIGHT = 630;
const BRAND_TEAL = { r: 27, g: 61, b: 61 };

const titleSvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#1b3d3d"/>
  <text x="600" y="500" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="700" fill="#ffffff">Paeds Resus</text>
  <text x="600" y="555" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="400" fill="#f37021">Paediatric emergency care platform</text>
</svg>`;

const logo = await sharp(logoPath).resize(320, 320, { fit: "inside" }).png().toBuffer();

await sharp(Buffer.from(titleSvg))
  .composite([{ input: logo, top: 120, left: Math.round((WIDTH - 320) / 2) }])
  .png()
  .toFile(outPath);

console.log(`Wrote ${outPath}`);
