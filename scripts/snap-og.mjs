/**
 * Render the hero crop of polish.bowie.top into a 1200×630 OG image.
 * Output: docs/og.png
 */
import { chromium } from 'playwright';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../docs/og.png');
const URL = process.env.URL || 'http://127.0.0.1:8911/docs/';

const W = 1200, H = 630;

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(URL);
await page.waitForLoadState('networkidle');

// Tailor the page: hide nav (it eats vertical space), and re-center the hero
// so the title + button + drag-hint all fit in the 1200×630 frame.
await page.addStyleTag({ content: `
  /* keep only the hero core; hide everything else so the OG isn't polluted */
  .nav, .hero-howto-title, .drag-illustration, .demo-cta, .hero-visual,
  #problem, #solution, #features, #install, footer, .footer { display: none !important; }
  body { padding-top: 0 !important; }
  /* zero out the transforms users applied — those are page-context, not OG-context */
  .bookmarklet-wrap, .drag-hint, .drag-demo, .demo-cta { transform: none !important; }
  .hero { padding: 28px 0 0 !important; min-height: 0 !important; }
  .hero h1 { font-size: 76px !important; line-height: 1.02 !important; margin-bottom: 14px !important; }
  .hero p {
    font-size: 17px !important;
    max-width: 760px !important;
    margin: 0 auto 64px !important;
    line-height: 1.45 !important;
  }
  .hero p br { display: none; }
  .badge { margin-bottom: 16px !important; }
  .drag-hint {
    margin-top: 16px !important;
    font-size: 15px !important;
    color: var(--fg-muted) !important;
  }
  .bookmark-arrow { animation-play-state: paused !important; }
` });

await page.waitForTimeout(400);
await page.screenshot({ path: OUT, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log('✓ wrote', OUT);
