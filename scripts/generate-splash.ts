/**
 * generate-splash.ts
 * Generates charlotte-rn/assets/splash.png — a pixel-perfect replica of
 * the JS LoadingScreen so the native splash → JS transition is seamless.
 *
 * Run: npm run generate-splash
 *
 * Output: charlotte-rn/assets/splash.png  (1284 × 2778 px, @3x)
 *
 * Requires: sharp  (already in the project's node_modules)
 */

import path from 'path';
import sharp from 'sharp';

// ── Canvas dimensions (iPhone 14 Pro Max @3x — scales well for all sizes) ──
const W = 1284;
const H = 2778;

// ── Design tokens (match LoadingScreen exactly) ──────────────────────────────
const BG         = '#F4F3FA';
const NAVY       = '#16153A';
const GREEN      = '#A3FF3C';
const SUBTITLE   = '#9896B8';

const AVATAR_D   = 288;          // circle diameter (px @3x)
const BORDER     = 9;            // green ring thickness
const CENTER_X   = W / 2;
const CENTER_Y   = H / 2 - 60;  // slightly above true center (visual balance)

const AVATAR_PATH = path.resolve(__dirname, '../charlotte-rn/assets/charlotte-avatar.png');
const OUT_PATH    = path.resolve(__dirname, '../charlotte-rn/assets/splash.png');

// ── Dot texture ───────────────────────────────────────────────────────────────
// We render an SVG dot-grid overlay at 60px spacing (≈ 20pt @3x)
function dotTextureSvg(w: number, h: number): string {
  const spacing = 60;
  const r       = 3.3;
  const dots: string[] = [];
  for (let y = spacing / 2; y < h; y += spacing) {
    for (let x = spacing / 2; x < w; x += spacing) {
      dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(22,21,58,0.055)"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${dots.join('')}</svg>`;
}

// ── Build the circular avatar composite ───────────────────────────────────────
async function makeCircularAvatar(size: number, border: number): Promise<Buffer> {
  const inner = size - border * 2;

  // 1. Resize photo to inner circle size, then clip to circle
  const avatarBuffer = await sharp(AVATAR_PATH)
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  // Circular mask
  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${inner}" height="${inner}">
       <circle cx="${inner / 2}" cy="${inner / 2}" r="${inner / 2}" fill="white"/>
     </svg>`,
  );

  const clippedAvatar = await sharp(avatarBuffer)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 2. Build the ring container: navy fill + green border + clipped avatar
  const ringR  = size / 2;
  const innerR = inner / 2;

  const ringSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <!-- Navy background circle -->
    <circle cx="${ringR}" cy="${ringR}" r="${ringR}" fill="${NAVY}"/>
    <!-- Green border ring (drawn as stroke) -->
    <circle cx="${ringR}" cy="${ringR}" r="${ringR - border / 2}"
            fill="none" stroke="${GREEN}" stroke-width="${border}"/>
  </svg>`;

  return sharp(Buffer.from(ringSvg))
    .composite([{
      input: clippedAvatar,
      left:  border,
      top:   border,
    }])
    .png()
    .toBuffer();
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Generating splash.png…');

  // 1. Background (flat colour)
  const base = await sharp({
    create: { width: W, height: H, channels: 4, background: BG },
  }).png().toBuffer();

  // 2. Dot texture overlay
  const dots = await sharp(Buffer.from(dotTextureSvg(W, H))).png().toBuffer();

  // 3. Avatar composite
  const avatar = await makeCircularAvatar(AVATAR_D, BORDER);

  // 4. Text block (SVG) — Charlotte + AI English Teacher
  // Expo uses Inter; system sans-serif is close enough for the splash.
  // We render at @3x: 26pt → 78px, 13pt → 39px
  const TEXT_Y_TOP   = CENTER_Y + AVATAR_D / 2 + 40;   // top of "Charlotte"
  const textSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <!-- "Charlotte" -->
    <text
      x="${CENTER_X}" y="${TEXT_Y_TOP + 72}"
      text-anchor="middle"
      font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
      font-size="78"
      font-weight="800"
      letter-spacing="-1.5"
      fill="${NAVY}"
    >Charlotte</text>
    <!-- "AI English Teacher" -->
    <text
      x="${CENTER_X}" y="${TEXT_Y_TOP + 72 + 18 + 39}"
      text-anchor="middle"
      font-family="'Helvetica Neue', Helvetica, Arial, sans-serif"
      font-size="39"
      font-weight="500"
      letter-spacing="0.9"
      fill="${SUBTITLE}"
    >AI English Teacher</text>
  </svg>`;

  const textLayer = await sharp(Buffer.from(textSvg)).png().toBuffer();

  // 5. Composite all layers onto the base
  const result = await sharp(base)
    .composite([
      { input: dots,   top: 0, left: 0 },
      {
        input: avatar,
        left: Math.round(CENTER_X - AVATAR_D / 2),
        top:  Math.round(CENTER_Y - AVATAR_D / 2),
      },
      { input: textLayer, top: 0, left: 0 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(OUT_PATH);

  console.log(`✓ splash.png saved → ${OUT_PATH}`);
  console.log(`  ${result.width} × ${result.height} px  (${(result.size / 1024).toFixed(0)} KB)`);
  console.log('\nNext steps:');
  console.log('  1. Update app.config.ts:');
  console.log("       splash: { image: './assets/splash.png', resizeMode: 'cover', backgroundColor: '#F4F3FA' }");
  console.log("       ['expo-splash-screen', { backgroundColor: '#F4F3FA', image: './assets/splash.png', resizeMode: 'cover' }]");
  console.log('  2. npx expo prebuild --clean  (rebuild native)');
  console.log('  3. eas build --platform ios --profile preview');
}

main().catch(e => { console.error(e); process.exit(1); });
