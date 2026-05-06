import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML = resolve(__dirname, 'drag-anim.html');
const OUT_GIF = resolve(__dirname, '../docs/drag-to-bookmark.gif');

const W = 720, H = 405;
const FPS = 18;
const DURATION_S = 5;        // one full animation cycle
const FRAMES = FPS * DURATION_S;

const tmp = mkdtempSync(join(tmpdir(), 'polish-gif-'));
console.log('frames →', tmp);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto('file://' + HTML);

// pause CSS animations so we can scrub frame-by-frame
await page.addStyleTag({
  content: `*, *::before, *::after { animation-play-state: paused !important; }`,
});

// helper: set animation-delay so all keyframe animations show frame at time t
async function scrubTo(seconds) {
  await page.evaluate((t) => {
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const cs = getComputedStyle(el);
      if (cs.animationName && cs.animationName !== 'none') {
        el.style.animationDelay = `-${t}s`;
      }
      // pseudo-elements can't be scrubbed via JS reliably; we already paused them.
    }
  }, seconds);
}

for (let i = 0; i < FRAMES; i++) {
  const t = i / FPS;
  await scrubTo(t);
  // tiny settle delay
  await page.waitForTimeout(15);
  const file = join(tmp, `f${String(i).padStart(4, '0')}.png`);
  await page.screenshot({ path: file, omitBackground: false, clip: { x:0, y:0, width: W, height: H } });
}

await browser.close();
console.log('captured', readdirSync(tmp).length, 'frames');

// build palette + gif via ffmpeg
const palette = join(tmp, 'palette.png');
const r1 = spawnSync('ffmpeg', [
  '-y', '-framerate', String(FPS),
  '-i', join(tmp, 'f%04d.png'),
  '-vf', `fps=${FPS},scale=${W}:-1:flags=lanczos,palettegen=stats_mode=diff`,
  palette,
], { stdio: 'inherit' });
if (r1.status !== 0) process.exit(r1.status ?? 1);

const r2 = spawnSync('ffmpeg', [
  '-y', '-framerate', String(FPS),
  '-i', join(tmp, 'f%04d.png'),
  '-i', palette,
  '-lavfi', `fps=${FPS},scale=${W}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
  '-loop', '0',
  OUT_GIF,
], { stdio: 'inherit' });
if (r2.status !== 0) process.exit(r2.status ?? 1);

rmSync(tmp, { recursive: true, force: true });
console.log('✓ wrote', OUT_GIF);
