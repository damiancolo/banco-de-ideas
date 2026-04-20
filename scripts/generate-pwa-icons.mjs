import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const BG = '#F8F5F0';
const GOLD = '#C5A47E';

function buildSvg(size) {
  const pad = size * 0.15;
  const inner = size - pad * 2;
  const cx = size / 2;
  const cy = size / 2;

  // Scale of the bulb within the icon
  const s = inner / 24;

  // Translate so the 24x24 viewBox is centered
  const tx = cx - 12 * s;
  const ty = cy - 12 * s;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${BG}" rx="${size * 0.18}"/>
  <g transform="translate(${tx}, ${ty}) scale(${s})" fill="none" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
    <path d="M15.09 14c.18-.9.66-1.74 1.41-2.5A4.65 4.65 0 0 0 12 3.5a4.65 4.65 0 0 0-4.5 7.97c.75.76 1.23 1.6 1.41 2.5"/>
  </g>
</svg>`;
}

const icons = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

const outDir = 'public/icons';
if (!existsSync(outDir)) await mkdir(outDir, { recursive: true });

for (const { name, size } of icons) {
  const svg = Buffer.from(buildSvg(size));
  await sharp(svg).png().toFile(`${outDir}/${name}`);
  console.log(`✓ ${outDir}/${name}`);
}

console.log('Icons generated.');
