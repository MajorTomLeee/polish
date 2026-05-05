// 简单 build：把 src/polish.js 复制到 dist/polish.js，生成 bookmarklet.html
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

mkdirSync(resolve(ROOT, 'dist'), { recursive: true });

// 1. dist/polish.js
copyFileSync(resolve(ROOT, 'src/polish.js'), resolve(ROOT, 'dist/polish.js'));
console.log('✓ dist/polish.js');

// 1b. dist/favicon.svg + favicon.png + favicon-180.png
copyFileSync(resolve(ROOT, 'docs/favicon.svg'), resolve(ROOT, 'dist/favicon.svg'));
copyFileSync(resolve(ROOT, 'docs/favicon.png'), resolve(ROOT, 'dist/favicon.png'));
copyFileSync(resolve(ROOT, 'docs/favicon-180.png'), resolve(ROOT, 'dist/favicon-180.png'));
console.log('✓ dist/favicon.{svg,png,180.png}');

// 2. bookmarklet 代码（从 polish.bowie.top 加载）
const BOOKMARKLET = `javascript:(function(){if(window.__POLISH__){return}var s=document.createElement('script');s.src='https://polish.bowie.top/polish.js?b='+Date.now();window.__POLISH_FORCE__=true;document.body.appendChild(s)})();`;

writeFileSync(resolve(ROOT, 'dist/bookmarklet.txt'), BOOKMARKLET);
console.log('✓ dist/bookmarklet.txt');

// 3. 版本注入
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const versioned = readFileSync(resolve(ROOT, 'dist/polish.js'), 'utf8')
  .replace(/^/, `/* Polish v${pkg.version} | https://polish.bowie.top | MIT */\n`);
writeFileSync(resolve(ROOT, 'dist/polish.js'), versioned);
console.log(`✓ stamped v${pkg.version}`);
