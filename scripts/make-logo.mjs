/**
 * Generates presentation-ready logo assets from the supplied logo.jpeg:
 *   public/logo-white.png  → white artwork, fully transparent background (dark UI)
 *   public/logo-dark.png   → black artwork, fully transparent background (light UI)
 * The original public/logo.jpeg is left untouched.
 *
 *   node scripts/make-logo.mjs
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public", "logo.jpeg");

if (!fs.existsSync(src)) {
  console.error("  [✗] public/logo.jpeg not found");
  process.exit(1);
}

const { data, info } = await sharp(src)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const out = Buffer.alloc(width * height * 4);
const alphaBuf = Buffer.alloc(width * height);

const DEAD = 42; // ignore JPEG noise in the paper-white areas

for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const r = data[o];
  const g = data[o + 1];
  const b = data[o + 2];
  // Luminance drives alpha: white paper → transparent, black ink → opaque.
  const raw = 255 - Math.round((r + g + b) / 3);
  const a = raw <= DEAD ? 0 : Math.min(255, Math.round(((raw - DEAD) / (255 - DEAD)) * 255));
  alphaBuf[i] = a;

  const p = i * 4;
  out[p] = 255;
  out[p + 1] = 255;
  out[p + 2] = 255;
  out[p + 3] = a;
}

await sharp(out, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(root, "public", "logo-white.png"));

// Dark ink variant for light surfaces (same alpha, ink colour)
const dark = Buffer.alloc(width * height * 4);
for (let i = 0; i < width * height; i++) {
  const p = i * 4;
  dark[p] = 8;
  dark[p + 1] = 9;
  dark[p + 2] = 8;
  dark[p + 3] = alphaBuf[i];
}
await sharp(dark, { raw: { width, height, channels: 4 } })
  .png({ compressionLevel: 9, palette: true })
  .toFile(path.join(root, "public", "logo-dark.png"));

console.log(`  ✓ logo-white.png + logo-dark.png generated (${width}×${height})`);
