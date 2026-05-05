/* Polish v0.1.0 | https://polish.bowie.top | MIT */
/**
 * Polish — vibe coding 的最后一站
 *
 * 让 AI 生成的页面在浏览器里被任何人改到位，导出 AI-native diff 给研发或 Claude/Cursor。
 *
 * 启用：
 *   1) 在 URL 加 ?polish=1
 *   2) 或拖一下 bookmarklet（任何页面都能用，无需修改源码）
 *   3) 或在 html 末尾加 <script src="https://polish.bowie.top/polish.js">
 *
 * 设计目标：
 *   - 单文件、零依赖、不污染生产（仅启用条件下激活）
 *   - 设计师友好：底部 pill bar，不像 devtools
 *   - 真 CSS 编辑（spacing/color/font/radius/shadow），不是 transform 假象
 *   - 输出 AI-native markdown：选择器 + CSS diff + 备注 + 截图，直接喂给 Cursor/Claude
 *
 * @license MIT
 */
(function () {
  'use strict';

  if (window.__POLISH__) {
    if (window.__POLISH_FORCE__ && new URLSearchParams(location.search).get('polish') !== '1') {
      const u = new URL(location.href);
      u.searchParams.set('polish', '1');
      location.href = u.toString();
    }
    return;
  }
  window.__POLISH__ = true;

  const params = new URLSearchParams(location.search);
  const enabledByQuery = params.get('polish') === '1' || params.get('edit') === '1';
  if (!enabledByQuery && !window.__POLISH_FORCE__) return;

  // ─── i18n ───
  const I18N = {
    en: {
      logo: 'Polish', mode_pointer: 'Pointer', mode_deep: 'Deep',
      btn_style: 'Style', btn_note: 'Note', btn_align: 'Align', btn_export: 'Export',
      tip_about: 'Polish · the last mile of vibe coding',
      title_mode: 'Mode: pointer (⇧P / ⇧D to switch)',
      title_style: 'Style (color / font / spacing)', title_note: 'Add a note to this element',
      title_align: 'Align / distribute',
      title_undo: 'Undo (Alt+Z)', title_redo: 'Redo (Alt+⇧Z)',
      title_viewport: 'Viewport size', title_overlay: 'Reference image overlay',
      title_export: 'Export edits (AI-ready markdown)', title_menu: 'More',
      pop_style: 'Style', pop_note: 'Note', pop_align: 'Align / distribute', pop_vp: 'Viewport',
      sec_dom: 'DOM navigation', sec_spacing: 'Spacing (margin / padding · reflows)',
      label_bg: 'BG', label_color: 'Text', label_border: 'Border',
      label_radius: 'Radius', label_size: 'Size', label_weight: 'Weight',
      label_lh: 'Line', label_ls: 'Spacing', label_opacity: 'Opacity', label_shadow: 'Shadow',
      shadow_default: 'default', shadow_xs: 'xs', shadow_s: 's', shadow_m: 'm', shadow_l: 'l', shadow_xl: 'xl',
      weight_default: 'default',
      note_placeholder: 'e.g. needs more breathing room / title not bold enough / want a card with Apple aesthetic',
      note_hint: 'Esc to close · auto-saved', note_clear: 'Clear',
      align_left: 'Left', align_center_h: 'Center horiz', align_right: 'Right',
      align_top: 'Top', align_center_v: 'Center vert', align_bottom: 'Bottom',
      align_dist_h: 'Distribute horiz (≥3)', align_dist_v: 'Distribute vert (≥3)',
      nav_parent: '↑ Parent', nav_prev: '← Prev', nav_next: 'Next →', nav_child: 'Child ↓',
      vp_orig: 'Original',
      menu_share: 'Copy share link', menu_bookmarklet: 'Copy bookmarklet',
      menu_reset: 'Reset all edits', menu_hide: 'Hide Polish toolbar', menu_about: 'About Polish ↗',
      modal_export_title: 'Export — AI-ready markdown',
      modal_export_tip: 'Paste this whole block to Claude / Cursor / your dev. Selectors, CSS diffs, and notes are included.',
      copy_all: 'Copy all', download_md: 'Download .md', share_link: 'Copy share link',
      toast_copied: 'Copied to clipboard', toast_copy_failed: 'Encoding failed',
      toast_share_copied: 'Share link copied',
      toast_bookmarklet_copied: 'Bookmarklet copied (paste into bookmark URL)',
      toast_dist_h: 'Horizontal distribution needs ≥3 elements',
      toast_dist_v: 'Vertical distribution needs ≥3 elements',
      toast_vp_reset: 'Viewport restored',
      toast_vp_set: (v) => `Viewport: ${v}px`,
      toast_reset: 'All edits cleared',
      toast_hide_hint: 'Double-click bottom-right to bring back Polish',
      confirm_reset: 'Reset all edits and notes?',
      no_edits: '(no edits yet)',
      session_title: 'Polish editing session',
      page: 'Page', time: 'Time', viewport: 'Viewport', edits_count: 'Edits',
      stats_styles: (n) => `${n} style change${n === 1 ? '' : 's'}`,
      stats_notes: (n) => `${n} note${n === 1 ? '' : 's'}`,
      task_heading: 'Task',
      task_intro: 'Apply all edits below to the source code. Each `### selector` is one target element. For each one you have:',
      task_bullets: '- CSS diff (paste straight into the matching file)\n- Text / note (so you understand the design intent)',
      task_lib_hint: 'If the project uses a component library or utility classes (Tailwind / shadcn / Material / Ant), translate to the equivalent idiomatic form — do not inline-style.',
      tailwind_hint: '> Project detected as using Tailwind CSS. Translate CSS diffs to equivalent utility classes (e.g. `padding-left: 24px` → `pl-6`) before applying.',
      transform_comment: '/* stacked on top of the original transform */',
      text_change: '**Text change**:',
      text_before: '- Before:',
      text_after:  '- After:',
      note_label: '**Note**:',
      console_msg: 'Polish enabled · Q/E navigate parent/child · Shift+P/D switch mode · Alt+Z undo · Esc deselect',
    },
    zh: {
      logo: 'Polish', mode_pointer: '指针', mode_deep: '深选',
      btn_style: '样式', btn_note: '备注', btn_align: '对齐', btn_export: '导出',
      tip_about: 'Polish · vibe coding 的最后一站',
      title_mode: '模式：指针（⇧P / ⇧D 切换）',
      title_style: '样式（颜色 / 字体 / 间距）', title_note: '给当前元素加备注',
      title_align: '对齐 / 分布',
      title_undo: '撤销 (Alt+Z)', title_redo: '重做 (Alt+⇧Z)',
      title_viewport: '视口尺寸', title_overlay: '导入参考图覆盖',
      title_export: '导出改动（AI-ready markdown）', title_menu: '更多',
      pop_style: '样式', pop_note: '备注', pop_align: '对齐 / 分布', pop_vp: '视口预览',
      sec_dom: 'DOM 导航', sec_spacing: '间距（margin / padding · 直接 reflow）',
      label_bg: '背景', label_color: '文字', label_border: '边框色',
      label_radius: '圆角', label_size: '字号', label_weight: '字重',
      label_lh: '行高', label_ls: '字距', label_opacity: '透明', label_shadow: '阴影',
      shadow_default: '原值', shadow_xs: '微小', shadow_s: '轻', shadow_m: '中', shadow_l: '重', shadow_xl: '很重',
      weight_default: '原值',
      note_placeholder: '例如：这里再透气一点 / 标题不够有力量 / 想要 Apple 风格的卡片',
      note_hint: 'Esc 关闭 · 自动保存', note_clear: '清除',
      align_left: '左对齐', align_center_h: '水平居中', align_right: '右对齐',
      align_top: '顶对齐', align_center_v: '垂直居中', align_bottom: '底对齐',
      align_dist_h: '水平等距（≥3 个）', align_dist_v: '垂直等距（≥3 个）',
      nav_parent: '↑ 父', nav_prev: '← 兄', nav_next: '弟 →', nav_child: '子 ↓',
      vp_orig: '原始',
      menu_share: '复制分享链接', menu_bookmarklet: '复制 bookmarklet',
      menu_reset: '重置所有改动', menu_hide: '隐藏 Polish 工具栏', menu_about: '关于 Polish ↗',
      modal_export_title: '导出改动 — AI-ready markdown',
      modal_export_tip: '把下面整段粘给 Claude / Cursor / 研发同事。已自动包含选择器、CSS diff、备注。',
      copy_all: '复制全部', download_md: '下载 .md', share_link: '复制分享链接',
      toast_copied: '已复制到剪贴板', toast_copy_failed: '编码失败',
      toast_share_copied: '分享链接已复制',
      toast_bookmarklet_copied: 'Bookmarklet 已复制（粘到书签栏 URL）',
      toast_dist_h: '水平等距至少需要 3 个',
      toast_dist_v: '垂直等距至少需要 3 个',
      toast_vp_reset: '已恢复原始视口',
      toast_vp_set: (v) => `已切到 ${v}px`,
      toast_reset: '已重置',
      toast_hide_hint: '双击页面右下角恢复 Polish',
      confirm_reset: '确认清除所有改动和备注？',
      no_edits: '（暂无改动）',
      session_title: 'Polish 编辑会话',
      page: '页面', time: '时间', viewport: '视口', edits_count: '改动数',
      stats_styles: (n) => `${n} 处样式`,
      stats_notes: (n) => `${n} 条备注`,
      task_heading: '任务',
      task_intro: '请把下面所有改动落进源代码。每个 `### selector` 是一个目标元素，下面是该元素的：',
      task_bullets: '- CSS diff（直接复制到对应文件）\n- 文案 / 备注（理解设计意图）',
      task_lib_hint: '如果项目使用组件库 / 工具类（Tailwind / shadcn / Material / Ant），请用对应的方式实现等价效果，不要直接 inline style。',
      tailwind_hint: '> 项目检测到使用 Tailwind CSS。请优先把 CSS diff 翻译成等价的 Tailwind utility class（例如 `padding-left: 24px` → `pl-6`）再落代码。',
      transform_comment: '/* 在原 transform 之上叠加 */',
      text_change: '**文案改动**：',
      text_before: '- 原：',
      text_after:  '- 改：',
      note_label: '**备注**：',
      console_msg: 'Polish 已启用 · Q/E 选父子层 · Shift+P/D 切模式 · Alt+Z 撤销 · Esc 取消',
    }
  };
  // 默认英文。允许 ?polish-lang=zh 或 localStorage 强制。
  function detectLang() {
    const force = params.get('polish-lang');
    if (force === 'en' || force === 'zh') return force;
    const stored = localStorage.getItem('polish-lang');
    if (stored === 'en' || stored === 'zh') return stored;
    return 'en';
  }
  let LANG = detectLang();
  const t = (k, ...args) => {
    const v = (I18N[LANG] || I18N.en)[k] ?? I18N.en[k] ?? k;
    return typeof v === 'function' ? v(...args) : v;
  };

  const STORAGE_KEY = 'polish:' + location.host + location.pathname;
  const NOTES_KEY   = 'polish-notes:' + location.host + location.pathname;
  let edits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  let notes = JSON.parse(localStorage.getItem(NOTES_KEY)   || '{}');

  // 如果 URL 带 ?polish-share=<base64>，载入分享的改动
  const shared = params.get('polish-share');
  if (shared) {
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(shared))));
      edits = { ...edits, ...(decoded.edits || {}) };
      notes = { ...notes, ...(decoded.notes || {}) };
    } catch (e) { console.warn('[polish] share decode failed', e); }
  }

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
    localStorage.setItem(NOTES_KEY,   JSON.stringify(notes));
  };

  // ─────────────────────────────────────────────
  // 选择器生成（path-based、避免 :nth-of-type）
  // ─────────────────────────────────────────────
  function selectorFor(el) {
    if (!el || el === document.documentElement) return 'html';
    if (el === document.body) return 'body';
    if (el.id) return '#' + CSS.escape(el.id);

    const localSel = (node) => {
      if (!node || node === document.body) return null;
      if (node.id) return '#' + CSS.escape(node.id);
      const cls = [...node.classList].filter(c => !c.startsWith('polish-') && !c.startsWith('pe-'));
      const base = cls.length ? '.' + cls.map(CSS.escape).join('.') : node.tagName.toLowerCase();
      for (const a of node.attributes || []) {
        if (!a.name.startsWith('data-') || !a.value || a.value.length > 40) continue;
        if (a.name.startsWith('data-polish-') || a.name.startsWith('data-pe-')) continue;
        return `${base}[${a.name}="${a.value}"]`;
      }
      return base;
    };

    const parts = [];
    let cur = el;
    while (cur && cur !== document.body) {
      let part = localSel(cur);
      if (!part) break;
      const p = cur.parentElement;
      if (p) {
        const ambiguous = [...p.children].some(s => {
          if (s === cur) return false;
          try { return s.matches(part); } catch { return false; }
        });
        if (ambiguous) {
          const idx = [...p.children].indexOf(cur) + 1;
          part += `:nth-child(${idx})`;
        }
      }
      parts.unshift(part);
      const accum = parts.join(' ');
      try {
        if (document.querySelectorAll(accum).length === 1) return accum;
      } catch {}
      cur = p;
    }
    return parts.join(' ');
  }

  function isVisible(el) {
    let cur = el;
    while (cur && cur !== document.documentElement) {
      const cs = getComputedStyle(cur);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (cur.getAttribute && cur.getAttribute('aria-hidden') === 'true') return false;
      cur = cur.parentElement;
    }
    return true;
  }

  function visibleStack(x, y) {
    return document.elementsFromPoint(x, y).filter(el => {
      if (root.contains(el)) return false;
      if (el === hoverBox || el === hoverLabel) return false;
      if (el === document.documentElement || el === document.body) return false;
      if (!isVisible(el)) return false;
      return true;
    });
  }

  function namedAncestor(el) {
    let cur = el;
    while (cur && cur !== document.body) {
      const named = cur.id || [...cur.classList].some(c => !c.startsWith('polish-') && c.length >= 3);
      if (named) {
        const display = getComputedStyle(cur).display;
        if (display === 'inline') { cur = cur.parentElement; continue; }
        return cur;
      }
      cur = cur.parentElement;
    }
    return el;
  }

  function targetAt(x, y, opts) {
    const stack = visibleStack(x, y);
    if (!stack.length) return null;
    let raw = stack[0];
    if (opts && opts.penetrate && selected) {
      const idx = stack.indexOf(selected);
      if (idx >= 0 && idx + 1 < stack.length) raw = stack[idx + 1];
    }
    return mode === 'deep' ? raw : namedAncestor(raw);
  }

  // ─────────────────────────────────────────────
  // Tailwind 探测
  // ─────────────────────────────────────────────
  function detectTailwind() {
    for (const sheet of document.styleSheets) {
      try {
        const rules = sheet.cssRules;
        if (!rules) continue;
        for (let i = 0; i < Math.min(50, rules.length); i++) {
          const sel = rules[i].selectorText || '';
          if (/\.(p|m|w|h|text|bg|flex|grid)-\d/.test(sel)) return true;
        }
      } catch {}
    }
    return false;
  }
  const isTailwind = detectTailwind();

  // ─────────────────────────────────────────────
  // UI：底部 pill bar + popover
  // ─────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'polish-root';
  root.innerHTML = `
    <div class="polish-bar" role="toolbar" aria-label="Polish">
      <button class="polish-logo" data-action="about" title="${t('tip_about')}">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l4-4M14 6l-7 7M14 6l3-3M14 6l3 3M14 6l-3-3"/></svg>
        <span>${t('logo')}</span>
      </button>
      <span class="polish-sep"></span>

      <button class="polish-btn polish-mode" data-mode="pointer" title="${t('title_mode')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><path d="M5 3l9 5-4 1-2 4z"/></svg>
        <span class="label">${t('mode_pointer')}</span>
      </button>

      <button class="polish-btn" data-action="style" title="${t('title_style')}" disabled>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10" cy="10" r="6.5"/><circle cx="7" cy="8" r="1" fill="currentColor"/><circle cx="13" cy="8" r="1" fill="currentColor"/><circle cx="13" cy="12" r="1" fill="currentColor"/></svg>
        <span class="label">${t('btn_style')}</span>
      </button>

      <button class="polish-btn" data-action="note" title="${t('title_note')}" disabled>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 4h12v9l-3 3H4z"/><path d="M13 16v-3h3"/></svg>
        <span class="label">${t('btn_note')}</span>
      </button>

      <button class="polish-btn" data-action="align" title="${t('title_align')}" disabled>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 4h14M3 10h10M3 16h14"/></svg>
        <span class="label">${t('btn_align')}</span>
      </button>

      <span class="polish-sep"></span>

      <button class="polish-btn polish-icon" data-action="undo" title="${t('title_undo')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4L3 8l4 4"/><path d="M3 8h9a4 4 0 010 8H8"/></svg>
      </button>
      <button class="polish-btn polish-icon" data-action="redo" title="${t('title_redo')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 4l4 4-4 4"/><path d="M17 8H8a4 4 0 000 8h4"/></svg>
      </button>

      <button class="polish-btn polish-icon" data-action="viewport" title="${t('title_viewport')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="14" height="10" rx="1"/><path d="M7 17h6"/></svg>
      </button>

      <button class="polish-btn polish-icon" data-action="overlay" title="${t('title_overlay')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="14" height="14" rx="1"/><path d="M3 13l4-4 4 4 3-3 3 3"/></svg>
      </button>

      <span class="polish-sep"></span>

      <button class="polish-btn polish-primary" data-action="export" title="${t('title_export')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M10 3v10M6 9l4 4 4-4M3 17h14"/></svg>
        <span class="label">${t('btn_export')}</span>
        <span class="polish-count" hidden>0</span>
      </button>

      <button class="polish-btn polish-icon polish-menu" data-action="menu" title="${t('title_menu')}">
        <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor"><circle cx="5" cy="10" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/></svg>
      </button>

      <button class="polish-btn polish-icon polish-lang-toggle" data-action="lang" title="Language">
        <span class="label">${LANG === 'zh' ? '中' : 'EN'}</span>
      </button>
    </div>

    <div class="polish-popover polish-style-popover" hidden>
      <div class="polish-pop-head">${t('pop_style')} <span class="polish-current-sel"></span></div>
      <div class="polish-style-grid">
        <label>${t('label_bg')}<input type="color" data-prop="background-color"></label>
        <label>${t('label_color')}<input type="color" data-prop="color"></label>
        <label>${t('label_border')}<input type="color" data-prop="border-color"></label>
        <label>${t('label_radius')}<input type="number" min="0" max="200" data-prop="border-radius" data-unit="px" placeholder="px"></label>
        <label>${t('label_size')}<input type="number" min="1" max="200" data-prop="font-size" data-unit="px" placeholder="px"></label>
        <label>${t('label_weight')}<select data-prop="font-weight"><option value="">${t('weight_default')}</option><option>300</option><option>400</option><option>500</option><option>600</option><option>700</option><option>800</option></select></label>
        <label>${t('label_lh')}<input type="number" step="0.05" min="0.5" max="5" data-prop="line-height" data-unit="" placeholder="—"></label>
        <label>${t('label_ls')}<input type="number" step="0.5" data-prop="letter-spacing" data-unit="px" placeholder="px"></label>
        <label>${t('label_opacity')}<input type="range" min="0" max="100" data-prop="opacity" data-unit="%"></label>
        <label>${t('label_shadow')}<select data-prop="box-shadow"><option value="">${t('shadow_default')}</option><option value="0 1px 2px rgba(0,0,0,.05)">${t('shadow_xs')}</option><option value="0 2px 8px rgba(0,0,0,.08)">${t('shadow_s')}</option><option value="0 4px 16px rgba(0,0,0,.12)">${t('shadow_m')}</option><option value="0 8px 32px rgba(0,0,0,.18)">${t('shadow_l')}</option><option value="0 16px 48px rgba(0,0,0,.24)">${t('shadow_xl')}</option></select></label>
      </div>
      <div class="polish-pop-section">${t('sec_spacing')}</div>
      <div class="polish-spacing">
        <div class="polish-spacing-grid">
          <input type="number" data-prop="margin-top" data-unit="px" placeholder="m-t">
          <input type="number" data-prop="margin-right" data-unit="px" placeholder="m-r">
          <input type="number" data-prop="margin-bottom" data-unit="px" placeholder="m-b">
          <input type="number" data-prop="margin-left" data-unit="px" placeholder="m-l">
          <input type="number" data-prop="padding-top" data-unit="px" placeholder="p-t">
          <input type="number" data-prop="padding-right" data-unit="px" placeholder="p-r">
          <input type="number" data-prop="padding-bottom" data-unit="px" placeholder="p-b">
          <input type="number" data-prop="padding-left" data-unit="px" placeholder="p-l">
        </div>
      </div>
    </div>

    <div class="polish-popover polish-note-popover" hidden>
      <div class="polish-pop-head">${t('pop_note')} <span class="polish-current-sel"></span></div>
      <textarea class="polish-note-input" placeholder="${t('note_placeholder')}"></textarea>
      <div class="polish-pop-foot">
        <span class="polish-hint">${t('note_hint')}</span>
        <button class="polish-btn-mini polish-note-clear">${t('note_clear')}</button>
      </div>
    </div>

    <div class="polish-popover polish-align-popover" hidden>
      <div class="polish-pop-head">${t('pop_align')}</div>
      <div class="polish-align-grid">
        <button data-align="left"     title="${t('align_left')}">⫷</button>
        <button data-align="center-h" title="${t('align_center_h')}">↔</button>
        <button data-align="right"    title="${t('align_right')}">⫸</button>
        <button data-align="top"      title="${t('align_top')}">⊤</button>
        <button data-align="center-v" title="${t('align_center_v')}">↕</button>
        <button data-align="bottom"   title="${t('align_bottom')}">⊥</button>
        <button data-align="dist-h"   title="${t('align_dist_h')}">‖→</button>
        <button data-align="dist-v"   title="${t('align_dist_v')}">‖↓</button>
      </div>
      <div class="polish-pop-section">${t('sec_dom')}</div>
      <div class="polish-nav-grid">
        <button data-nav="parent">${t('nav_parent')}</button>
        <button data-nav="prev">${t('nav_prev')}</button>
        <button data-nav="next">${t('nav_next')}</button>
        <button data-nav="child">${t('nav_child')}</button>
      </div>
    </div>

    <div class="polish-popover polish-vp-popover" hidden>
      <div class="polish-pop-head">${t('pop_vp')}</div>
      <div class="polish-vp-grid">
        <button data-vp="0">${t('vp_orig')}</button>
        <button data-vp="375">375 · iPhone</button>
        <button data-vp="768">768 · iPad</button>
        <button data-vp="1024">1024</button>
        <button data-vp="1280">1280</button>
        <button data-vp="1440">1440</button>
      </div>
    </div>

    <div class="polish-popover polish-menu-popover" hidden>
      <button class="polish-menu-item" data-action="copy-share">${t('menu_share')}</button>
      <button class="polish-menu-item" data-action="bookmarklet">${t('menu_bookmarklet')}</button>
      <button class="polish-menu-item" data-action="reset">${t('menu_reset')}</button>
      <button class="polish-menu-item" data-action="hide">${t('menu_hide')}</button>
      <a class="polish-menu-item" href="https://polish.bowie.top" target="_blank" rel="noopener">${t('menu_about')}</a>
    </div>

    <div class="polish-export-modal" hidden>
      <div class="polish-modal-card">
        <div class="polish-modal-head">
          <strong>${t('modal_export_title')}</strong>
          <button class="polish-btn-mini polish-modal-close">×</button>
        </div>
        <div class="polish-modal-tip">${t('modal_export_tip')}</div>
        <textarea class="polish-export-text" readonly></textarea>
        <div class="polish-modal-actions">
          <button class="polish-btn-primary polish-copy-export">${t('copy_all')}</button>
          <button class="polish-btn-secondary polish-download-export">${t('download_md')}</button>
          <button class="polish-btn-secondary polish-share-export">${t('share_link')}</button>
        </div>
      </div>
    </div>

    <div class="polish-toast" hidden></div>

    <div class="polish-overlay-img" hidden>
      <img alt="reference">
      <div class="polish-overlay-controls">
        <input type="range" min="0" max="100" value="40" class="polish-overlay-opacity">
        <button class="polish-btn-mini polish-overlay-close">×</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    /* ─── reset & root ─── */
    #polish-root [hidden] { display: none !important; }
    #polish-root, #polish-root * { box-sizing: border-box; }
    #polish-root {
      --polish-accent: #5b5bd6;
      --polish-accent-hover: #4a4ac9;
      --polish-bg: rgba(255,255,255,0.92);
      --polish-bg-solid: #ffffff;
      --polish-fg: #1a1a1a;
      --polish-fg-muted: #6b7280;
      --polish-border: rgba(0,0,0,0.08);
      --polish-border-strong: rgba(0,0,0,0.16);
      --polish-shadow: 0 8px 32px rgba(15, 23, 42, 0.12), 0 2px 8px rgba(15, 23, 42, 0.06);
      --polish-radius: 12px;
      font: 13px/1.5 -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang SC", "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: var(--polish-fg);
    }
    @media (prefers-color-scheme: dark) {
      #polish-root {
        --polish-bg: rgba(28,28,30,0.92);
        --polish-bg-solid: #1c1c1e;
        --polish-fg: #f5f5f7;
        --polish-fg-muted: #98989d;
        --polish-border: rgba(255,255,255,0.10);
        --polish-border-strong: rgba(255,255,255,0.18);
        --polish-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3);
      }
    }

    /* ─── 底部 pill bar ─── */
    .polish-bar {
      position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 2px;
      background: var(--polish-bg);
      backdrop-filter: blur(20px) saturate(160%);
      -webkit-backdrop-filter: blur(20px) saturate(160%);
      border: 1px solid var(--polish-border);
      border-radius: 999px;
      padding: 4px 6px;
      box-shadow: var(--polish-shadow);
      z-index: 2147483646;
      max-width: calc(100vw - 32px);
      overflow-x: auto;
    }
    .polish-bar.hidden { transform: translateX(-50%) translateY(120%); opacity: 0; pointer-events: none; transition: transform .3s ease, opacity .3s ease; }

    .polish-logo {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 10px; border: 0; background: transparent; cursor: pointer;
      color: var(--polish-fg); font-weight: 600; font-size: 13px; border-radius: 999px;
    }
    .polish-logo:hover { background: rgba(0,0,0,.04); }
    @media (prefers-color-scheme: dark) { .polish-logo:hover { background: rgba(255,255,255,.06); } }
    .polish-logo svg { color: var(--polish-accent); }

    .polish-sep {
      width: 1px; height: 18px; background: var(--polish-border); margin: 0 4px;
    }

    .polish-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 10px; border: 0; background: transparent;
      color: var(--polish-fg); cursor: pointer;
      border-radius: 8px; font-size: 12.5px; font-weight: 500;
      transition: background .12s ease, color .12s ease, transform .08s ease;
      white-space: nowrap;
    }
    .polish-btn:hover:not(:disabled) { background: rgba(0,0,0,.05); }
    @media (prefers-color-scheme: dark) { .polish-btn:hover:not(:disabled) { background: rgba(255,255,255,.07); } }
    .polish-btn:active:not(:disabled) { transform: scale(0.97); }
    .polish-btn:disabled { opacity: .35; cursor: not-allowed; }
    .polish-btn svg { color: var(--polish-fg-muted); }
    .polish-btn:hover:not(:disabled) svg { color: var(--polish-fg); }
    .polish-btn.polish-icon { padding: 6px 7px; }
    .polish-btn.polish-icon .label { display: none; }

    .polish-mode[data-mode="deep"] { color: var(--polish-accent); background: color-mix(in oklab, var(--polish-accent) 10%, transparent); }
    .polish-mode[data-mode="deep"] svg { color: var(--polish-accent); }

    .polish-primary {
      background: var(--polish-accent); color: #fff;
    }
    .polish-primary svg { color: #fff; }
    .polish-primary:hover:not(:disabled) { background: var(--polish-accent-hover); }
    .polish-primary:hover:not(:disabled) svg { color: #fff; }

    .polish-count {
      background: rgba(255,255,255,.25); color: #fff; border-radius: 999px;
      padding: 1px 6px; font-size: 11px; min-width: 18px; text-align: center;
    }

    /* ─── popover ─── */
    .polish-popover {
      position: fixed; bottom: 64px; left: 50%; transform: translateX(-50%);
      background: var(--polish-bg-solid); color: var(--polish-fg);
      border: 1px solid var(--polish-border);
      border-radius: var(--polish-radius);
      padding: 12px;
      box-shadow: var(--polish-shadow);
      z-index: 2147483645;
      width: min(380px, calc(100vw - 32px));
      max-height: 70vh; overflow-y: auto;
    }
    .polish-pop-head {
      display: flex; justify-content: space-between; align-items: center;
      font-weight: 600; font-size: 13px; margin-bottom: 10px;
      color: var(--polish-fg);
    }
    .polish-pop-head .polish-current-sel {
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      font-size: 11px; color: var(--polish-fg-muted); font-weight: 400;
      max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .polish-pop-section {
      font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
      color: var(--polish-fg-muted); font-weight: 600;
      margin: 12px 0 6px;
    }

    .polish-style-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px;
    }
    .polish-style-grid label {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; font-size: 12px; color: var(--polish-fg-muted);
    }
    .polish-style-grid input[type="color"] {
      width: 28px; height: 22px; padding: 0; border: 1px solid var(--polish-border);
      border-radius: 4px; background: transparent; cursor: pointer;
    }
    .polish-style-grid input[type="number"],
    .polish-style-grid input[type="range"],
    .polish-style-grid select {
      width: 90px; padding: 3px 6px; border: 1px solid var(--polish-border);
      border-radius: 5px; background: var(--polish-bg-solid); color: var(--polish-fg);
      font: inherit; font-size: 12px;
    }
    .polish-style-grid input[type="range"] { width: 100px; }

    .polish-spacing-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;
    }
    .polish-spacing-grid input {
      padding: 4px 6px; border: 1px solid var(--polish-border);
      border-radius: 5px; background: var(--polish-bg-solid); color: var(--polish-fg);
      font: inherit; font-size: 11.5px; text-align: center;
    }

    .polish-note-input {
      width: 100%; min-height: 100px;
      padding: 8px; border: 1px solid var(--polish-border); border-radius: 8px;
      background: var(--polish-bg-solid); color: var(--polish-fg);
      font: inherit; font-size: 13px; resize: vertical;
    }
    .polish-pop-foot {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 6px; font-size: 11px; color: var(--polish-fg-muted);
    }

    .polish-align-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
    }
    .polish-align-grid button,
    .polish-nav-grid button {
      padding: 8px 4px; border: 1px solid var(--polish-border);
      background: var(--polish-bg-solid); color: var(--polish-fg);
      border-radius: 6px; cursor: pointer; font-size: 14px;
      transition: background .12s, border-color .12s;
    }
    .polish-align-grid button:hover,
    .polish-nav-grid button:hover { background: rgba(91,91,214,.08); border-color: var(--polish-accent); }
    .polish-nav-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
    }

    .polish-vp-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;
    }
    .polish-vp-grid button {
      padding: 8px; border: 1px solid var(--polish-border);
      background: var(--polish-bg-solid); color: var(--polish-fg);
      border-radius: 6px; cursor: pointer; font-size: 12px;
    }
    .polish-vp-grid button:hover { background: rgba(91,91,214,.08); border-color: var(--polish-accent); }

    .polish-menu-popover {
      width: 220px;
      padding: 4px;
    }
    .polish-menu-item {
      display: block; width: 100%; text-align: left;
      padding: 8px 12px; border: 0; background: transparent; color: var(--polish-fg);
      cursor: pointer; border-radius: 6px; font-size: 13px;
      text-decoration: none;
    }
    .polish-menu-item:hover { background: rgba(91,91,214,.10); color: var(--polish-accent); }

    /* ─── modal ─── */
    .polish-export-modal {
      position: fixed; inset: 0; background: rgba(0,0,0,.4);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 2147483647;
    }
    .polish-modal-card {
      width: min(720px, calc(100vw - 40px));
      max-height: 80vh;
      background: var(--polish-bg-solid); color: var(--polish-fg);
      border-radius: var(--polish-radius);
      padding: 20px; display: flex; flex-direction: column; gap: 12px;
      box-shadow: 0 24px 64px rgba(0,0,0,.3);
    }
    .polish-modal-head {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 15px;
    }
    .polish-modal-tip { font-size: 12.5px; color: var(--polish-fg-muted); }
    .polish-export-text {
      flex: 1; min-height: 320px;
      padding: 12px;
      border: 1px solid var(--polish-border); border-radius: 8px;
      background: rgba(0,0,0,.03); color: var(--polish-fg);
      font: 12px/1.55 ui-monospace, "SF Mono", Menlo, monospace;
      resize: vertical;
    }
    @media (prefers-color-scheme: dark) {
      .polish-export-text { background: rgba(255,255,255,.04); }
    }
    .polish-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .polish-btn-primary, .polish-btn-secondary {
      padding: 8px 16px; border: 0; border-radius: 8px; cursor: pointer;
      font: inherit; font-weight: 500; font-size: 13px;
    }
    .polish-btn-primary { background: var(--polish-accent); color: #fff; }
    .polish-btn-primary:hover { background: var(--polish-accent-hover); }
    .polish-btn-secondary {
      background: rgba(0,0,0,.06); color: var(--polish-fg);
    }
    @media (prefers-color-scheme: dark) {
      .polish-btn-secondary { background: rgba(255,255,255,.08); }
    }
    .polish-btn-mini {
      padding: 4px 10px; border: 1px solid var(--polish-border);
      border-radius: 6px; background: transparent; color: var(--polish-fg);
      font: inherit; font-size: 12px; cursor: pointer;
    }
    .polish-btn-mini:hover { background: rgba(0,0,0,.05); }

    /* ─── toast ─── */
    .polish-toast {
      position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
      background: var(--polish-fg); color: var(--polish-bg-solid);
      padding: 8px 16px; border-radius: 999px;
      font-size: 12.5px; font-weight: 500;
      box-shadow: var(--polish-shadow);
      z-index: 2147483647;
      opacity: 0; transition: opacity .2s, transform .2s;
    }
    .polish-toast.show { opacity: 1; transform: translateX(-50%) translateY(-6px); }

    /* ─── 选中态 / hover ─── */
    .polish-selected {
      outline: 1.5px solid var(--polish-accent) !important;
      outline-offset: 2px !important;
    }
    .polish-multi {
      outline: 1.5px dashed var(--polish-accent) !important;
      outline-offset: 2px !important;
    }
    .polish-noted::after {
      content: ""; position: absolute; top: -3px; right: -3px;
      width: 8px; height: 8px; background: #f59e0b; border-radius: 50%;
      box-shadow: 0 0 0 2px var(--polish-bg-solid);
    }
    .polish-hover-box {
      position: fixed; border: 1.5px solid var(--polish-accent);
      background: rgba(91,91,214,.08);
      pointer-events: none; z-index: 2147483644;
      transition: all .04s linear; border-radius: 2px;
    }
    .polish-hover-label {
      position: fixed; background: var(--polish-accent); color: #fff;
      font: 11px/1.2 ui-monospace, "SF Mono", Menlo, monospace;
      padding: 3px 7px; border-radius: 4px; pointer-events: none;
      z-index: 2147483644;
      white-space: nowrap; max-width: 60vw;
      overflow: hidden; text-overflow: ellipsis;
    }
    .polish-handle {
      position: fixed; width: 8px; height: 8px;
      background: #fff; border: 1.5px solid var(--polish-accent);
      border-radius: 2px; z-index: 2147483647; box-sizing: border-box;
      transform: translate(-50%, -50%);
    }
    .polish-h-nw, .polish-h-se { cursor: nwse-resize; }
    .polish-h-ne, .polish-h-sw { cursor: nesw-resize; }
    .polish-h-n,  .polish-h-s  { cursor: ns-resize;  }
    .polish-h-e,  .polish-h-w  { cursor: ew-resize;  }

    /* ─── 对齐参考线 ─── */
    .polish-guide {
      position: fixed; pointer-events: none;
      background: #ff3b8b;
      z-index: 2147483645;
    }
    .polish-guide-h { height: 1px; box-shadow: 0 0 0 0.5px #ff3b8b, 0 0 4px rgba(255,59,139,.6); }
    .polish-guide-v { width: 1px; box-shadow: 0 0 0 0.5px #ff3b8b, 0 0 4px rgba(255,59,139,.6); }

    body.polish-active * { cursor: crosshair !important; pointer-events: auto !important; }
    body.polish-active { cursor: crosshair !important; }
    #polish-root, #polish-root *,
    .polish-hover-box, .polish-hover-label,
    .polish-handle, .polish-overlay-img, .polish-overlay-img * { pointer-events: auto !important; }
    .polish-hover-box, .polish-hover-label { pointer-events: none !important; }
    .polish-handle { cursor: inherit !important; }
    body.polish-dragging, body.polish-dragging * { cursor: move !important; user-select: none !important; }

    /* ─── 视口模拟 ─── */
    body.polish-viewport-set {
      max-width: var(--polish-vp-width, 100%);
      margin: 0 auto !important;
      box-shadow: 0 0 0 1px var(--polish-border-strong);
      transition: max-width .25s ease;
    }

    /* ─── 参考图覆盖 ─── */
    .polish-overlay-img {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 2147483640;
    }
    .polish-overlay-img img {
      position: absolute; top: 0; left: 0; width: 100%; height: auto;
      opacity: 0.4;
    }
    .polish-overlay-controls {
      position: fixed; top: 12px; left: 12px;
      display: flex; gap: 6px; align-items: center;
      background: var(--polish-bg-solid); border: 1px solid var(--polish-border);
      border-radius: 999px; padding: 4px 8px;
      pointer-events: auto;
      box-shadow: var(--polish-shadow);
    }
    .polish-overlay-controls input[type="range"] { width: 100px; }
  `;
  document.head.appendChild(style);

  // ─────────────────────────────────────────────
  // 状态
  // ─────────────────────────────────────────────
  let mode = 'pointer';
  let selected = null;
  let extraSelected = [];
  let drag = null, resize = null;
  document.body.classList.add('polish-active');
  const allSelected = () => [selected, ...extraSelected].filter(Boolean);

  const $bar = root.querySelector('.polish-bar');
  const $modeBtn = root.querySelector('.polish-mode');
  const $countBadge = root.querySelector('.polish-count');
  const popovers = {
    style: root.querySelector('.polish-style-popover'),
    note:  root.querySelector('.polish-note-popover'),
    align: root.querySelector('.polish-align-popover'),
    viewport: root.querySelector('.polish-vp-popover'),
    menu:  root.querySelector('.polish-menu-popover'),
  };
  const $exportModal = root.querySelector('.polish-export-modal');
  const $exportText  = root.querySelector('.polish-export-text');
  const $toast = root.querySelector('.polish-toast');

  function toast(msg, ms = 1500) {
    $toast.textContent = msg;
    $toast.hidden = false;
    requestAnimationFrame(() => $toast.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => {
      $toast.classList.remove('show');
      setTimeout(() => $toast.hidden = true, 200);
    }, ms);
  }

  function setMode(m) {
    mode = m;
    $modeBtn.dataset.mode = m;
    $modeBtn.querySelector('.label').textContent = m === 'pointer' ? t('mode_pointer') : t('mode_deep');
  }

  function closePopovers(except) {
    Object.entries(popovers).forEach(([k, el]) => { if (k !== except) el.hidden = true; });
  }

  function togglePopover(name) {
    const el = popovers[name];
    if (!el) return;
    const wasHidden = el.hidden;
    closePopovers(wasHidden ? name : null);
    el.hidden = !wasHidden;
  }

  // hover 框 / handles
  const hoverBox = document.createElement('div');
  hoverBox.className = 'polish-hover-box'; hoverBox.style.display = 'none';
  document.body.appendChild(hoverBox);
  const hoverLabel = document.createElement('div');
  hoverLabel.className = 'polish-hover-label'; hoverLabel.style.display = 'none';
  document.body.appendChild(hoverLabel);

  const HANDLE_DIRS = ['nw','n','ne','e','se','s','sw','w'];
  const handles = HANDLE_DIRS.map(dir => {
    const h = document.createElement('div');
    h.className = 'polish-handle polish-h-' + dir;
    h.dataset.dir = dir; h.style.display = 'none';
    document.body.appendChild(h);
    return h;
  });

  // 对齐参考线（拖动时显示）
  const guideLayer = document.createElement('div');
  guideLayer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483645;';
  document.body.appendChild(guideLayer);
  function clearGuides() { guideLayer.innerHTML = ''; }
  function addGuide(type, pos, span) {
    const g = document.createElement('div');
    g.className = 'polish-guide polish-guide-' + type;
    if (type === 'v') {
      g.style.left = pos + 'px';
      g.style.top  = span[0] + 'px';
      g.style.height = (span[1] - span[0]) + 'px';
    } else {
      g.style.top  = pos + 'px';
      g.style.left = span[0] + 'px';
      g.style.width  = (span[1] - span[0]) + 'px';
    }
    guideLayer.appendChild(g);
  }

  // drag 开始时缓存候选元素的 rect，避免每次 mousemove 重算
  let snapCandidates = [];
  function buildSnapCandidates(targetEls) {
    const ignore = (el) => {
      if (root.contains(el)) return true;
      if (el === guideLayer || el === hoverBox || el === hoverLabel) return true;
      if (handles.includes(el)) return true;
      // 排除目标自身、目标的祖先和后代（吸到自己/亲属上没有意义）
      for (const t of targetEls) {
        if (t === el || t.contains(el) || el.contains(t)) return true;
      }
      return false;
    };
    snapCandidates = [];
    document.querySelectorAll('body *').forEach(el => {
      if (ignore(el)) return;
      if (!isVisible(el)) return;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      snapCandidates.push(r);
    });
  }

  // 给定当前元素 rect，找到 snap 偏移和需画的参考线
  // 返回 { snapDx, snapDy, guides: [{type, pos, span}] }
  const SNAP_THRESHOLD = 5;
  function computeSnap(r) {
    let bestDx = 0, bestDxAbs = SNAP_THRESHOLD + 1;
    let bestDy = 0, bestDyAbs = SNAP_THRESHOLD + 1;
    const guides = [];

    const myV = [r.left, r.left + r.width / 2, r.right];
    const myH = [r.top,  r.top  + r.height / 2, r.bottom];

    for (const c of snapCandidates) {
      const cV = [c.left, c.left + c.width / 2, c.right];
      const cH = [c.top,  c.top  + c.height / 2, c.bottom];
      // 垂直对齐：x 维度匹配
      for (const m of myV) {
        for (const t of cV) {
          const d = t - m;
          if (Math.abs(d) <= SNAP_THRESHOLD) {
            if (Math.abs(d) < bestDxAbs) { bestDx = d; bestDxAbs = Math.abs(d); }
            guides.push({
              type: 'v', pos: t,
              span: [Math.min(r.top, c.top) - 8, Math.max(r.bottom, c.bottom) + 8]
            });
          }
        }
      }
      // 水平对齐：y 维度匹配
      for (const m of myH) {
        for (const t of cH) {
          const d = t - m;
          if (Math.abs(d) <= SNAP_THRESHOLD) {
            if (Math.abs(d) < bestDyAbs) { bestDy = d; bestDyAbs = Math.abs(d); }
            guides.push({
              type: 'h', pos: t,
              span: [Math.min(r.left, c.left) - 8, Math.max(r.right, c.right) + 8]
            });
          }
        }
      }
    }
    return { snapDx: bestDxAbs <= SNAP_THRESHOLD ? bestDx : 0,
             snapDy: bestDyAbs <= SNAP_THRESHOLD ? bestDy : 0,
             guides };
  }

  // ─────────────────────────────────────────────
  // edits 数据模型
  //   edits[selector] = {
  //     props: { 'padding-left': '24px', 'color': '#000' },  // 真 CSS 属性
  //     dx, dy, scale,                                        // 仅当用户拖拽 / 缩放时有
  //     width, height,                                        // resize handle 设
  //     text,                                                 // contenteditable
  //     original: { props: {...}, transform, text, widthCSS, heightCSS, parentW, parentH }
  //   }
  // ─────────────────────────────────────────────
  function ensureEntry(el, sel) {
    if (edits[sel]) return edits[sel];
    const cs = getComputedStyle(el);
    edits[sel] = {
      props: {},
      dx: 0, dy: 0, scale: 1,
      original: {
        transform: el.style.transform || '',
        text: null,
        widthCSS:  el.style.width  || cs.width,
        heightCSS: el.style.height || cs.height,
        widthPx:   parseFloat(cs.width)  || el.getBoundingClientRect().width,
        heightPx:  parseFloat(cs.height) || el.getBoundingClientRect().height,
        parentW:   el.parentElement ? el.parentElement.getBoundingClientRect().width  : 0,
        parentH:   el.parentElement ? el.parentElement.getBoundingClientRect().height : 0,
      }
    };
    return edits[sel];
  }

  function applyEdit(el, e) {
    const baseT = e.original?.transform && e.original.transform !== 'none' ? e.original.transform : '';
    const moved = (e.dx || 0) !== 0 || (e.dy || 0) !== 0 || (e.scale && e.scale !== 1);
    const t = moved
      ? `${baseT} translate(${e.dx || 0}px, ${e.dy || 0}px) scale(${e.scale || 1})`.trim()
      : baseT;
    if (t) el.style.setProperty('transform', t, 'important');
    else el.style.removeProperty('transform');

    if (e.width != null)  el.style.setProperty('width',  e.width + 'px',  'important');
    if (e.height != null) el.style.setProperty('height', e.height + 'px', 'important');

    Object.entries(e.props || {}).forEach(([prop, val]) => {
      if (val === '' || val == null) {
        el.style.removeProperty(prop);
      } else {
        el.style.setProperty(prop, val, 'important');
      }
    });

    if (e.text != null && el.textContent !== e.text) el.textContent = e.text;
  }

  function applyAllEdits() {
    Object.entries(edits).forEach(([sel, e]) => {
      const el = document.querySelector(sel);
      if (el) applyEdit(el, e);
    });
  }

  function entryIsEmpty(e) {
    const noPos = !e.dx && !e.dy && (!e.scale || e.scale === 1);
    const noSize = e.width == null && e.height == null;
    const noProps = !e.props || Object.keys(e.props).length === 0;
    const noText = e.text == null || e.text === e.original?.text;
    return noPos && noSize && noProps && noText;
  }

  // ─────────────────────────────────────────────
  // 撤销/重做
  // ─────────────────────────────────────────────
  const history = [JSON.parse(JSON.stringify(edits))];
  const redoStack = [];
  let snapshotT = null;
  function snapshot() {
    clearTimeout(snapshotT);
    snapshotT = setTimeout(() => {
      history.push(JSON.parse(JSON.stringify(edits)));
      if (history.length > 100) history.shift();
      redoStack.length = 0;
      updateBadge();
    }, 80);
  }
  function applyState(state) {
    Object.keys(edits).forEach(sel => {
      if (!(sel in state)) {
        const el = document.querySelector(sel);
        if (el && edits[sel]) {
          el.style.transform = edits[sel].original?.transform || '';
          el.style.width = ''; el.style.height = '';
          Object.keys(edits[sel].props || {}).forEach(p => el.style.removeProperty(p));
          if (edits[sel].original?.text != null) el.textContent = edits[sel].original.text;
        }
        delete edits[sel];
      }
    });
    Object.entries(state).forEach(([sel, e]) => {
      edits[sel] = JSON.parse(JSON.stringify(e));
      const el = document.querySelector(sel);
      if (el) applyEdit(el, e);
    });
  }
  function undo() {
    if (history.length < 2) return;
    redoStack.push(history.pop());
    applyState(history[history.length - 1]);
    save(); updateHandles(); updateBadge();
  }
  function redoFn() {
    if (!redoStack.length) return;
    const next = redoStack.pop();
    history.push(next);
    applyState(next);
    save(); updateHandles(); updateBadge();
  }

  // ─────────────────────────────────────────────
  // 选择
  // ─────────────────────────────────────────────
  function selectEl(el, opts = {}) {
    if (!el) return;
    if (opts.add) {
      if (selected === el) return;
      const idx = extraSelected.indexOf(el);
      if (idx >= 0) {
        extraSelected.splice(idx, 1);
        el.classList.remove('polish-multi');
      } else {
        if (selected) {
          selected.classList.remove('polish-selected');
          selected.classList.add('polish-multi');
          extraSelected.push(selected);
        }
        selected = el;
        el.classList.remove('polish-multi');
        el.classList.add('polish-selected');
      }
    } else {
      extraSelected.forEach(x => x.classList.remove('polish-multi'));
      extraSelected = [];
      selected?.classList.remove('polish-selected');
      selected = el;
      el.classList.add('polish-selected');
    }
    refreshSelectionUI();
  }

  function deselect() {
    selected?.classList.remove('polish-selected');
    extraSelected.forEach(x => x.classList.remove('polish-multi'));
    selected = null; extraSelected = [];
    refreshSelectionUI();
    closePopovers();
  }

  function refreshSelectionUI() {
    const has = !!selected;
    ['style','note','align'].forEach(k => {
      const btn = root.querySelector(`[data-action="${k}"]`);
      if (btn) btn.disabled = !has;
    });
    if (has) {
      const sel = selectorFor(selected);
      root.querySelectorAll('.polish-current-sel').forEach(n => n.textContent = sel);
      syncStylePanel();
      syncNotePanel(sel);
    }
    updateHandles();
  }

  function updateBadge() {
    const count = Object.keys(edits).length + Object.keys(notes).length;
    if (count > 0) { $countBadge.hidden = false; $countBadge.textContent = count; }
    else $countBadge.hidden = true;
  }

  function updateHandles() {
    if (!selected || extraSelected.length > 0 || resize || drag) {
      handles.forEach(h => h.style.display = 'none');
      return;
    }
    const r = selected.getBoundingClientRect();
    const positions = {
      nw: [r.x, r.y], n: [r.x + r.width/2, r.y], ne: [r.x + r.width, r.y],
      e:  [r.x + r.width, r.y + r.height/2], w: [r.x, r.y + r.height/2],
      sw: [r.x, r.y + r.height], s: [r.x + r.width/2, r.y + r.height], se: [r.x + r.width, r.y + r.height]
    };
    handles.forEach(h => {
      const [x, y] = positions[h.dataset.dir];
      h.style.display = 'block';
      h.style.left = x + 'px'; h.style.top = y + 'px';
    });
  }

  // ─────────────────────────────────────────────
  // 样式面板
  // ─────────────────────────────────────────────
  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb.includes('rgba(0, 0, 0, 0)')) return '#000000';
    const m = rgb.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    if (!m) return '#000000';
    return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('');
  }

  function syncStylePanel() {
    if (!selected) return;
    const cs = getComputedStyle(selected);
    const sel = selectorFor(selected);
    const props = edits[sel]?.props || {};
    popovers.style.querySelectorAll('[data-prop]').forEach(input => {
      const prop = input.dataset.prop;
      const unit = input.dataset.unit || '';
      const cur = props[prop] || cs[prop] || '';
      if (input.type === 'color') {
        input.value = rgbToHex(cur);
      } else if (input.type === 'number') {
        const m = String(cur).match(/(-?[\d.]+)/);
        input.value = m ? m[1] : '';
      } else if (input.type === 'range') {
        const m = String(cur).match(/(-?[\d.]+)/);
        if (input.dataset.unit === '%') input.value = m ? Math.round(+m[1] * 100) : 100;
        else input.value = m ? m[1] : 100;
      } else {
        input.value = cur;
      }
    });
  }

  popovers.style.addEventListener('input', e => {
    const input = e.target.closest('[data-prop]');
    if (!input || !selected) return;
    const sel = selectorFor(selected);
    const entry = ensureEntry(selected, sel);
    const prop = input.dataset.prop;
    const unit = input.dataset.unit || '';
    let val = input.value;
    if (val === '' || val == null) {
      delete entry.props[prop];
    } else {
      if (input.type === 'range' && unit === '%') {
        val = (+val / 100).toString();
      } else if (input.type === 'number' && unit) {
        val = val + unit;
      }
      entry.props[prop] = val;
    }
    applyEdit(selected, entry);
    if (entryIsEmpty(entry)) delete edits[sel];
    save(); updateHandles(); snapshot();
  });

  // ─────────────────────────────────────────────
  // 备注面板
  // ─────────────────────────────────────────────
  const $noteInput = popovers.note.querySelector('.polish-note-input');
  function syncNotePanel(sel) {
    $noteInput.value = notes[sel] || '';
  }
  $noteInput.addEventListener('input', () => {
    if (!selected) return;
    const sel = selectorFor(selected);
    const v = $noteInput.value.trim();
    if (v) {
      notes[sel] = v;
      selected.classList.add('polish-noted');
    } else {
      delete notes[sel];
      selected.classList.remove('polish-noted');
    }
    save(); updateBadge();
  });
  popovers.note.querySelector('.polish-note-clear').onclick = () => {
    $noteInput.value = '';
    $noteInput.dispatchEvent(new Event('input'));
  };

  // ─────────────────────────────────────────────
  // 对齐 + DOM 导航
  // ─────────────────────────────────────────────
  popovers.align.addEventListener('click', e => {
    if (e.target.dataset.align) alignAction(e.target.dataset.align);
    if (e.target.dataset.nav)   navAction(e.target.dataset.nav);
  });

  function shiftElement(el, ddx, ddy) {
    const sel = selectorFor(el);
    const e = ensureEntry(el, sel);
    e.dx = (e.dx || 0) + ddx;
    e.dy = (e.dy || 0) + ddy;
    applyEdit(el, e);
  }

  function alignAction(type) {
    const items = allSelected();
    if (!items.length) return;
    if (items.length === 1) {
      const el = items[0];
      const r = el.getBoundingClientRect();
      const p = el.parentElement?.getBoundingClientRect();
      if (!p) return;
      if (type === 'center-h') shiftElement(el, (p.left + p.width / 2) - (r.left + r.width / 2), 0);
      else if (type === 'center-v') shiftElement(el, 0, (p.top + p.height / 2) - (r.top + r.height / 2));
      else if (type === 'left')   shiftElement(el, p.left - r.left, 0);
      else if (type === 'right')  shiftElement(el, (p.right - r.right), 0);
      else if (type === 'top')    shiftElement(el, 0, p.top - r.top);
      else if (type === 'bottom') shiftElement(el, 0, (p.bottom - r.bottom));
      save(); updateHandles(); snapshot();
      return;
    }
    const rects = items.map(el => ({ el, r: el.getBoundingClientRect() }));
    const ops = {
      left:     () => { const v = Math.min(...rects.map(o => o.r.left));  rects.forEach(o => shiftElement(o.el, v - o.r.left, 0)); },
      right:    () => { const v = Math.max(...rects.map(o => o.r.right)); rects.forEach(o => shiftElement(o.el, v - o.r.right, 0)); },
      top:      () => { const v = Math.min(...rects.map(o => o.r.top));   rects.forEach(o => shiftElement(o.el, 0, v - o.r.top)); },
      bottom:   () => { const v = Math.max(...rects.map(o => o.r.bottom)); rects.forEach(o => shiftElement(o.el, 0, v - o.r.bottom)); },
      'center-h': () => { const cx = rects.reduce((s, o) => s + (o.r.left + o.r.width/2), 0) / rects.length; rects.forEach(o => shiftElement(o.el, cx - (o.r.left + o.r.width/2), 0)); },
      'center-v': () => { const cy = rects.reduce((s, o) => s + (o.r.top  + o.r.height/2), 0) / rects.length; rects.forEach(o => shiftElement(o.el, 0, cy - (o.r.top + o.r.height/2))); },
      'dist-h':  () => {
        if (rects.length < 3) { toast(t('toast_dist_h')); return; }
        const sorted = rects.slice().sort((a,b) => a.r.left - b.r.left);
        const totalW = sorted.reduce((s,o) => s + o.r.width, 0);
        const span = sorted[sorted.length-1].r.right - sorted[0].r.left;
        const gap = (span - totalW) / (sorted.length - 1);
        let cur = sorted[0].r.left;
        sorted.forEach(o => { shiftElement(o.el, cur - o.r.left, 0); cur += o.r.width + gap; });
      },
      'dist-v': () => {
        if (rects.length < 3) { toast(t('toast_dist_v')); return; }
        const sorted = rects.slice().sort((a,b) => a.r.top - b.r.top);
        const totalH = sorted.reduce((s,o) => s + o.r.height, 0);
        const span = sorted[sorted.length-1].r.bottom - sorted[0].r.top;
        const gap = (span - totalH) / (sorted.length - 1);
        let cur = sorted[0].r.top;
        sorted.forEach(o => { shiftElement(o.el, 0, cur - o.r.top); cur += o.r.height + gap; });
      }
    };
    ops[type]?.();
    save(); updateHandles(); snapshot();
  }

  function navAction(dir) {
    if (!selected) { toast(t('toast_select_first') || 'Select an element first'); return; }
    let next = null;
    if (dir === 'parent') next = selected.parentElement;
    else if (dir === 'child') next = selected.firstElementChild;
    else if (dir === 'prev')  next = selected.previousElementSibling;
    else if (dir === 'next')  next = selected.nextElementSibling;
    if (!next || root.contains(next) || next === document.body || next === document.documentElement) {
      toast({ parent: '↑ no parent', child: '↓ no child', prev: '← no sibling', next: '→ no sibling' }[dir]);
      return;
    }
    selectEl(next);
  }

  // ─────────────────────────────────────────────
  // 视口模拟
  // ─────────────────────────────────────────────
  popovers.viewport.addEventListener('click', e => {
    const v = e.target.dataset.vp;
    if (v == null) return;
    if (+v === 0) {
      document.body.classList.remove('polish-viewport-set');
      document.body.style.removeProperty('--polish-vp-width');
    } else {
      document.body.classList.add('polish-viewport-set');
      document.body.style.setProperty('--polish-vp-width', v + 'px');
    }
    closePopovers();
    toast(+v === 0 ? t('toast_vp_reset') : t('toast_vp_set', v));
  });

  // ─────────────────────────────────────────────
  // 参考图覆盖
  // ─────────────────────────────────────────────
  const $overlay = root.querySelector('.polish-overlay-img');
  const $overlayImg = $overlay.querySelector('img');
  const $overlayOpacity = $overlay.querySelector('.polish-overlay-opacity');
  $overlayOpacity.addEventListener('input', () => {
    $overlayImg.style.opacity = (+$overlayOpacity.value / 100).toString();
  });
  $overlay.querySelector('.polish-overlay-close').onclick = () => {
    $overlay.hidden = true;
    $overlayImg.removeAttribute('src');
  };
  function openOverlay() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        $overlayImg.src = reader.result;
        $overlay.hidden = false;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // ─────────────────────────────────────────────
  // bar 按钮派发
  // ─────────────────────────────────────────────
  $bar.addEventListener('click', e => {
    const btn = e.target.closest('[data-action], .polish-mode');
    if (!btn) return;
    if (btn.classList.contains('polish-mode')) {
      setMode(mode === 'pointer' ? 'deep' : 'pointer');
      return;
    }
    const action = btn.dataset.action;
    if (action === 'about') {
      window.open('https://polish.bowie.top', '_blank');
    } else if (action === 'style')   togglePopover('style');
    else if (action === 'note')    togglePopover('note');
    else if (action === 'align')   togglePopover('align');
    else if (action === 'viewport') togglePopover('viewport');
    else if (action === 'menu')    togglePopover('menu');
    else if (action === 'undo')    undo();
    else if (action === 'redo')    redoFn();
    else if (action === 'overlay') openOverlay();
    else if (action === 'export')  openExportModal();
    else if (action === 'lang')    toggleLang();
  });

  function toggleLang() {
    LANG = LANG === 'zh' ? 'en' : 'zh';
    localStorage.setItem('polish-lang', LANG);
    location.reload();
  }

  popovers.menu.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const a = btn.dataset.action;
    closePopovers();
    if (a === 'reset') resetAll();
    else if (a === 'copy-share') copyShareLink();
    else if (a === 'bookmarklet') copyBookmarklet();
    else if (a === 'hide') {
      $bar.classList.add('hidden');
      toast(t('toast_hide_hint'));
    }
  });

  function resetAll() {
    if (!confirm(t('confirm_reset'))) return;
    Object.entries(edits).forEach(([sel, e]) => {
      const el = document.querySelector(sel);
      if (el) {
        el.style.transform = e.original?.transform || '';
        el.style.width = ''; el.style.height = '';
        Object.keys(e.props || {}).forEach(p => el.style.removeProperty(p));
        if (e.original?.text != null && e.text != null) el.textContent = e.original.text;
      }
    });
    edits = {}; notes = {};
    document.querySelectorAll('.polish-noted').forEach(n => n.classList.remove('polish-noted'));
    save(); updateHandles(); updateBadge(); snapshot();
    toast(t('toast_reset'));
  }

  // ─────────────────────────────────────────────
  // 智能单位回写
  // ─────────────────────────────────────────────
  function smartSize(newPx, originalCSS, parentPx, viewportPx) {
    if (!originalCSS) return `${Math.round(newPx)}px`;
    const m = originalCSS.match(/^([\d.]+)\s*(%|vw|vh|px|em|rem)?\s*$/);
    if (!m || !m[2] || m[2] === 'px') return `${Math.round(newPx)}px`;
    const unit = m[2];
    if (unit === '%' && parentPx > 0) return `${((newPx / parentPx) * 100).toFixed(2)}%`;
    if ((unit === 'vw' || unit === 'vh') && viewportPx > 0) return `${((newPx / viewportPx) * 100).toFixed(2)}${unit}`;
    return `${Math.round(newPx)}px`;
  }

  // ─────────────────────────────────────────────
  // 导出 modal
  // ─────────────────────────────────────────────
  function buildExportMarkdown() {
    const total = Object.keys(edits).length + Object.keys(notes).length;
    if (total === 0) return t('no_edits');

    const allSelectors = new Set([...Object.keys(edits), ...Object.keys(notes)]);
    const items = [...allSelectors].map(sel => {
      const e = edits[sel];
      const note = notes[sel];
      const lines = [];
      if (e) {
        const css = [];
        if (e.dx || e.dy || (e.scale && e.scale !== 1)) {
          const tx = `translate(${e.dx||0}px, ${e.dy||0}px)${e.scale && e.scale !== 1 ? ` scale(${e.scale.toFixed(3)})` : ''}`;
          css.push(`  transform: ${tx};  ${t('transform_comment')}`);
        }
        if (e.width != null) {
          css.push(`  width: ${smartSize(e.width, e.original?.widthCSS, e.original?.parentW, window.innerWidth)};`);
        }
        if (e.height != null) {
          css.push(`  height: ${smartSize(e.height, e.original?.heightCSS, e.original?.parentH, window.innerHeight)};`);
        }
        Object.entries(e.props || {}).forEach(([p, v]) => {
          css.push(`  ${p}: ${v};`);
        });
        if (css.length) {
          lines.push('```css');
          lines.push(`${sel} {`);
          lines.push(...css);
          lines.push('}');
          lines.push('```');
        }
        if (e.text != null && e.text !== e.original?.text) {
          lines.push(t('text_change'));
          lines.push(`${t('text_before')} ${JSON.stringify(e.original?.text || '')}`);
          lines.push(`${t('text_after')} ${JSON.stringify(e.text)}`);
        }
      }
      if (note) {
        lines.push(`${t('note_label')} ${note}`);
      }
      return lines.length ? `### \`${sel}\`\n\n${lines.join('\n')}` : '';
    }).filter(Boolean);

    const tailwindHint = isTailwind ? `\n${t('tailwind_hint')}\n` : '';

    return [
      `# ${t('session_title')}`,
      ``,
      `**${t('page')}**: ${location.href.replace(/\?polish=1.*$/, '')}`,
      `**${t('time')}**: ${new Date().toLocaleString()}`,
      `**${t('viewport')}**: ${window.innerWidth} × ${window.innerHeight}`,
      `**${t('edits_count')}**: ${t('stats_styles', Object.keys(edits).length)} / ${t('stats_notes', Object.keys(notes).length)}`,
      tailwindHint,
      `## ${t('task_heading')}`,
      ``,
      t('task_intro'),
      t('task_bullets'),
      ``,
      t('task_lib_hint'),
      ``,
      `---`,
      ``,
      ...items
    ].join('\n');
  }

  function openExportModal() {
    $exportText.value = buildExportMarkdown();
    $exportModal.hidden = false;
  }

  $exportModal.querySelector('.polish-modal-close').onclick = () => $exportModal.hidden = true;
  $exportModal.addEventListener('click', e => { if (e.target === $exportModal) $exportModal.hidden = true; });
  root.querySelector('.polish-copy-export').onclick = async () => {
    try { await navigator.clipboard.writeText($exportText.value); toast(t('toast_copied')); }
    catch { $exportText.select(); document.execCommand('copy'); toast(t('toast_copied')); }
  };
  root.querySelector('.polish-download-export').onclick = () => {
    const blob = new Blob([$exportText.value], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `polish-${Date.now()}.md`;
    a.click();
  };
  root.querySelector('.polish-share-export').onclick = copyShareLink;

  function copyShareLink() {
    try {
      const payload = JSON.stringify({ edits, notes });
      const encoded = btoa(unescape(encodeURIComponent(payload)));
      const u = new URL(location.href);
      u.searchParams.set('polish', '1');
      u.searchParams.set('polish-share', encoded);
      navigator.clipboard.writeText(u.toString());
      toast(t('toast_share_copied'));
    } catch (e) { toast(t('toast_copy_failed')); }
  }

  function copyBookmarklet() {
    const code = `javascript:(function(){if(window.__POLISH__){return}var s=document.createElement('script');s.src='https://polish.bowie.top/polish.js?b='+Date.now();window.__POLISH_FORCE__=true;document.body.appendChild(s)})();`;
    navigator.clipboard.writeText(code);
    toast(t('toast_bookmarklet_copied'));
  }

  // ─────────────────────────────────────────────
  // 鼠标交互
  // ─────────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    if (resize) {
      const o = edits[resize.sel];
      const ddx = e.clientX - resize.startX;
      const ddy = e.clientY - resize.startY;
      const dir = resize.dir;
      let w = resize.origW, h = resize.origH, dx = resize.origDx, dy = resize.origDy;
      if (dir.includes('e')) w = resize.origW + ddx;
      if (dir.includes('w')) { w = resize.origW - ddx; dx = resize.origDx + ddx; }
      if (dir.includes('s')) h = resize.origH + ddy;
      if (dir.includes('n')) { h = resize.origH - ddy; dy = resize.origDy + ddy; }
      o.width = Math.max(2, w); o.height = Math.max(2, h);
      o.dx = dx; o.dy = dy;
      applyEdit(resize.el, o);
      return;
    }
    if (drag) {
      const ddx = e.clientX - drag.startX;
      const ddy = e.clientY - drag.startY;
      // 先按裸 dx/dy 应用一次
      for (const t of drag.targets) {
        const o = edits[t.sel];
        o.dx = t.origDx + ddx; o.dy = t.origDy + ddy;
        applyEdit(t.el, o);
      }
      // 单选时计算 snap：根据 primary 元素当前位置算偏移，整组吸附
      clearGuides();
      if (drag.targets.length === 1 && !e.altKey) {
        const r = drag.targets[0].el.getBoundingClientRect();
        const { snapDx, snapDy, guides } = computeSnap(r);
        if (snapDx !== 0 || snapDy !== 0) {
          for (const t of drag.targets) {
            const o = edits[t.sel];
            o.dx += snapDx; o.dy += snapDy;
            applyEdit(t.el, o);
          }
        }
        guides.forEach(g => addGuide(g.type, g.pos, g.span));
      }
      return;
    }
    if (root.contains(e.target)) {
      hoverBox.style.display = 'none'; hoverLabel.style.display = 'none';
      return;
    }
    const el = targetAt(e.clientX, e.clientY, { penetrate: e.altKey });
    if (!el) {
      hoverBox.style.display = 'none'; hoverLabel.style.display = 'none';
      return;
    }
    const r = el.getBoundingClientRect();
    Object.assign(hoverBox.style, {
      display: 'block', left: r.x+'px', top: r.y+'px',
      width: r.width+'px', height: r.height+'px'
    });
    hoverLabel.textContent = selectorFor(el);
    hoverLabel.style.display = 'block';
    hoverLabel.style.left = r.x + 'px';
    hoverLabel.style.top = Math.max(0, r.y - 22) + 'px';
  });

  document.addEventListener('mousedown', e => {
    if (root.contains(e.target)) return;
    if (e.button !== 0) return;
    if (e.target.classList && e.target.classList.contains('polish-handle') && selected) {
      e.preventDefault(); e.stopPropagation();
      const sel = selectorFor(selected);
      const entry = ensureEntry(selected, sel);
      const r = selected.getBoundingClientRect();
      if (entry.width == null)  entry.width  = r.width;
      if (entry.height == null) entry.height = r.height;
      resize = {
        el: selected, sel, dir: e.target.dataset.dir,
        startX: e.clientX, startY: e.clientY,
        origW: entry.width, origH: entry.height,
        origDx: entry.dx || 0, origDy: entry.dy || 0
      };
      document.body.classList.add('polish-dragging');
      return;
    }
    const el = targetAt(e.clientX, e.clientY, { penetrate: e.altKey });
    if (!el) return;
    e.preventDefault(); e.stopPropagation();
    if (e.shiftKey) { selectEl(el, { add: true }); return; }
    if (e.altKey)   { selectEl(el); return; }
    if (!allSelected().includes(el)) selectEl(el);
    const dragTargets = allSelected().map(t => {
      const ts = selectorFor(t); ensureEntry(t, ts);
      return { el: t, sel: ts, origDx: edits[ts].dx || 0, origDy: edits[ts].dy || 0 };
    });
    drag = {
      targets: dragTargets, sel: selectorFor(el), el,
      startX: e.clientX, startY: e.clientY,
      origDx: edits[selectorFor(el)].dx || 0, origDy: edits[selectorFor(el)].dy || 0
    };
    buildSnapCandidates(dragTargets.map(t => t.el));
    document.body.classList.add('polish-dragging');
    hoverBox.style.display = 'none'; hoverLabel.style.display = 'none';
  }, true);

  document.addEventListener('mouseup', () => {
    if (resize) {
      document.body.classList.remove('polish-dragging');
      save(); updateHandles(); snapshot();
      resize = null; return;
    }
    if (!drag) return;
    document.body.classList.remove('polish-dragging');
    clearGuides();
    for (const t of drag.targets) {
      if (entryIsEmpty(edits[t.sel])) delete edits[t.sel];
    }
    save(); snapshot();
    drag = null;
  });

  document.addEventListener('click', e => {
    if (root.contains(e.target)) return;
    e.preventDefault(); e.stopPropagation();
  }, true);

  // 双击：文本叶子 → 编辑文案；页面右下角 → 显示隐藏的工具栏
  function isTextLeaf(el) {
    if (!el || !el.textContent || !el.textContent.trim()) return false;
    if (el.children.length === 0) return true;
    return [...el.children].every(c => /^(BR|SPAN|EM|STRONG|I|B|U|SMALL)$/.test(c.tagName));
  }

  document.addEventListener('dblclick', e => {
    if (root.contains(e.target)) return;
    if ($bar.classList.contains('hidden') &&
        e.clientX > window.innerWidth - 80 &&
        e.clientY > window.innerHeight - 80) {
      $bar.classList.remove('hidden');
      return;
    }
    e.preventDefault();
    if (!selected) return;
    if (isTextLeaf(selected)) {
      const sel = selectorFor(selected);
      const entry = ensureEntry(selected, sel);
      if (entry.original.text == null) entry.original.text = selected.textContent;
      selected.contentEditable = 'true';
      selected.focus();
      try {
        const range = document.createRange();
        range.selectNodeContents(selected);
        const s = window.getSelection();
        s.removeAllRanges(); s.addRange(range);
      } catch {}
      const onBlur = () => {
        selected.contentEditable = 'false';
        const newText = selected.textContent;
        if (newText !== entry.original.text) entry.text = newText;
        else delete entry.text;
        if (entryIsEmpty(entry)) delete edits[sel];
        save(); snapshot();
        selected.removeEventListener('blur', onBlur);
      };
      selected.addEventListener('blur', onBlur);
      return;
    }
    if (selected.firstElementChild) selectEl(selected.firstElementChild);
  }, true);

  document.addEventListener('wheel', e => {
    if (!e.shiftKey || !selected) return;
    e.preventDefault();
    const sel = selectorFor(selected);
    const entry = ensureEntry(selected, sel);
    entry.scale = Math.max(0.1, Math.min(10, (entry.scale || 1) - e.deltaY * 0.001));
    applyEdit(selected, entry);
    save(); snapshot();
  }, { passive: false });

  // 关闭 popover：点 bar 外部
  document.addEventListener('mousedown', e => {
    if (root.contains(e.target)) return;
    closePopovers();
  }, false);

  // 键盘
  document.addEventListener('keydown', e => {
    const ae = document.activeElement;
    if (ae && (['INPUT','TEXTAREA','SELECT'].includes(ae.tagName) || ae.isContentEditable)) {
      if (e.key === 'Escape' && ae.classList.contains('polish-note-input')) ae.blur();
      return;
    }
    if (e.altKey && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) { undo(); e.preventDefault(); return; }
    if (e.altKey &&  e.shiftKey && (e.key === 'z' || e.key === 'Z')) { redoFn(); e.preventDefault(); return; }
    if (e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'P' || e.key === 'p')) { setMode('pointer'); e.preventDefault(); }
    else if (e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'D' || e.key === 'd')) { setMode('deep'); e.preventDefault(); }
    else if (!e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'q' || e.key === 'Q')) { navAction('parent'); e.preventDefault(); }
    else if (!e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'e' || e.key === 'E')) { navAction('child');  e.preventDefault(); }
    else if (!e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 'a' || e.key === 'A')) { navAction('prev');   e.preventDefault(); }
    else if (!e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && (e.key === 's' || e.key === 'S')) { navAction('next');   e.preventDefault(); }
    else if (e.key === 'Escape') {
      if (Object.values(popovers).some(p => !p.hidden) || !$exportModal.hidden) {
        closePopovers(); $exportModal.hidden = true;
      } else deselect();
      e.preventDefault();
    }
  });

  window.addEventListener('scroll', updateHandles, true);
  window.addEventListener('resize', updateHandles);

  // ─────────────────────────────────────────────
  // 启动
  // ─────────────────────────────────────────────
  // 标注已有备注的元素
  Object.keys(notes).forEach(sel => {
    const el = document.querySelector(sel);
    if (el) el.classList.add('polish-noted');
  });
  applyAllEdits();
  setMode('pointer');
  updateBadge();
  console.log('%c[Polish]', 'color:#5b5bd6;font-weight:600', t('console_msg'));
})();
