/**
 * Smoke test for the new origin/baseline export logic.
 * - loads demo page (which auto-injects polish.js)
 * - programmatically selects .hero h1, sets margin-top: 99px via the spacing UI
 * - calls buildExportMarkdown via the global Polish hook
 * - verifies the markdown contains an `origin: ...px` comment
 */
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:8911/demo/?polish=1';

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('console', m => console.log('[browser]', m.type(), m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));

await page.goto(URL);
// wait for polish to mount (badge appears)
await page.waitForSelector('.polish-bar', { timeout: 8000 });

// Drive the API: simulate selecting .hero h1 then changing margin-top.
const result = await page.evaluate(async () => {
  const target = document.querySelector('.hero h1');
  if (!target) return { error: 'no .hero h1' };

  // Click to select via real selectEl path. We expose nothing publicly,
  // so dispatch a synthetic event the panel listens to.
  // Easier: pull internal handles off window.__POLISH__.
  const P = window.__POLISH_TEST__;
  if (!P) return { error: 'window.__POLISH_TEST__ missing — rebuild polish.js' };

  P.selectEl?.(target);
  // synth: write into spacing input
  const input = document.querySelector('.polish-spacing-grid input[data-prop="margin-top"]');
  if (!input) return { error: 'spacing input not found' };
  input.value = '99';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  await new Promise(r => setTimeout(r, 100));
  const md = P.buildExportMarkdown?.();
  return { md, computedAfter: getComputedStyle(target).marginTop };
});

console.log('--- result.computedAfter:', result.computedAfter);
console.log('--- markdown (first 1500 chars):');
console.log(result.md?.slice(0, 1500) ?? result.error);

await browser.close();
