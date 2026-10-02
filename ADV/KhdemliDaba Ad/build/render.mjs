// Frame renderer: steps scene.html deterministically and writes JPEG frames.
//   node render.mjs --w 1920 --h 1080 --out ../out/frames_16x9 [--fps 60] [--only 0.0,5.4,...]
import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const A = Object.fromEntries(
  process.argv.slice(2).join(' ').split('--').filter(Boolean)
    .map(s => s.trim().split(/\s+/)).map(([k, ...v]) => [k, v.join(' ')]),
);
const W = +(A.w || 1920), H = +(A.h || 1080), FPS = +(A.fps || 60);
const OUT = path.resolve(A.out || '../out/frames');
const ONLY = A.only ? A.only.split(',').map(Number) : null;   // stills mode

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'],
});
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const url = 'file://' + path.resolve('scene.html') + `?w=${W}&h=${H}`;
await page.goto(url, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
page.on('pageerror', e => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });

const DUR = await page.evaluate(() => window.DUR);
const times = ONLY || Array.from({ length: Math.round(DUR * FPS) }, (_, i) => i / FPS);

const t0 = Date.now();
for (let i = 0; i < times.length; i++) {
  await page.evaluate(t => window.setTime(t), times[i]);
  const name = ONLY
    ? `still_${times[i].toFixed(2).replace('.', 'p')}.jpg`
    : `f${String(i).padStart(5, '0')}.jpg`;
  await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 94 });
  if (i % 120 === 0 || i === times.length - 1) {
    const el = (Date.now() - t0) / 1000;
    console.log(`${i + 1}/${times.length}  ${el.toFixed(0)}s  (${((i + 1) / el).toFixed(1)} fps render)`);
  }
}
await browser.close();
console.log('frames ->', OUT);
