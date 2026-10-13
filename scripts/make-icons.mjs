// Generates the PWA icons (no image libraries needed): teal tile with five rising white bars
// ("pay in 5 small steps a day"). Run: node scripts/make-icons.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const TEAL = [15, 118, 110];
const WHITE = [255, 255, 255];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, { maskable = false } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const radius = maskable ? 0 : size * 0.22; // maskable icons fill the square
  const inside = (x, y) => {
    const r = radius;
    const cx = x < r ? r : x > size - r ? size - r : x;
    const cy = y < r ? r : y > size - r ? size - r : y;
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
  };
  // Bars live in the central safe zone (80% for maskable)
  const safe = maskable ? 0.2 : 0.12;
  const x0 = size * (safe + 0.06);
  const x1 = size * (1 - safe - 0.06);
  const bottom = size * (1 - safe - 0.1);
  const top = size * (safe + 0.12);
  const n = 5;
  const gap = (x1 - x0) * 0.08;
  const w = (x1 - x0 - gap * (n - 1)) / n;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (!inside(x + 0.5, y + 0.5)) continue; // transparent corner
      let col = TEAL;
      for (let b = 0; b < n; b++) {
        const bx = x0 + b * (w + gap);
        const h = (bottom - top) * (0.32 + (0.68 * b) / (n - 1));
        if (x >= bx && x < bx + w && y >= bottom - h && y < bottom) col = WHITE;
      }
      px[i] = col[0];
      px[i + 1] = col[1];
      px[i + 2] = col[2];
      px[i + 3] = 255;
    }
  }
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', png(192));
writeFileSync('public/icons/icon-512.png', png(512));
writeFileSync('public/icons/maskable-512.png', png(512, { maskable: true }));
writeFileSync('public/icons/apple-touch-icon.png', png(180, { maskable: true }));
console.log('icons written');
