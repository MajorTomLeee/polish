<div align="center">

# Polish

**Vibe coding 的最后一站**

让 AI 生成的页面，在浏览器里被任何人改到位。<br/>
导出 AI-native 改动包，直接喂给 Cursor / Claude / 研发同事。

[官网与 Demo](https://polish.bowie.top) · [Bookmarklet 安装](https://polish.bowie.top#install) · [一行接入](https://polish.bowie.top#install)

</div>

---

## 这是什么

AI 帮你把一个页面写出来了。它差不多对，但不够对。

- 标题字号大了 2px。
- 卡片间距不够呼吸。
- 主按钮颜色比设计稿浅了一档。
- 这块在 iPhone 上挤成一团。

设计师 / 产品经理看到这些细节，但**不在本地**，**没装环境**，**改不了代码**。研发又没耐心听一句句"这里再大一点、那里再透气一点"。

**Polish 把任何已部署的页面变成可编辑画布**：拖、改颜色、改字号、调间距、写备注 → 一键导出一份结构化 markdown，研发或 AI 直接落代码。

```
设计师/PM     →  Polish 在浏览器里改  →  导出 .md  →  Claude / Cursor / 研发  →  代码改了
（无需本地）                          （含选择器+CSS+备注）
```

## 30 秒上手

**方式 A · Bookmarklet（推荐给设计师 / 产品）**

把这段代码保存为浏览器书签的 URL，然后在任何页面点一下：

```javascript
javascript:(function(){if(window.__POLISH__){return}var s=document.createElement('script');s.src='https://polish.bowie.top/polish.js?b='+Date.now();window.__POLISH_FORCE__=true;document.body.appendChild(s)})();
```

或访问 [polish.bowie.top](https://polish.bowie.top) 把按钮拖到书签栏。

**方式 B · 一行 script（推荐给研发）**

在项目 html 末尾加：

```html
<script src="https://polish.bowie.top/polish.js"></script>
```

页面 URL 加 `?polish=1` 启用。无 `?polish=1` 时不激活，不污染生产。

**方式 C · npm**

```bash
npm install polish
```

```js
import 'polish';
```

## 工作流

1. **打开**任何已部署的页面（Vercel preview / Netlify / 自己服务器都行）
2. 点 bookmarklet → 底部出现 Polish 工具栏
3. **悬停** → 看蓝框预览；**点击** → 选中
4. **拖** 改位置、**拖角点** 改尺寸、**Shift+滚轮** 缩放
5. 点 **样式** → 改颜色、字号、间距、圆角、阴影
6. 点 **备注** → 留下"这里再透气一点"这种意图
7. 点 **导出** → 拿到一份 markdown：

```markdown
# Polish 编辑会话
**页面**：https://preview.vercel.app/dashboard
**视口**：1440 × 900

## 任务
请把下面所有改动落进源代码 ...

### `.hero h1`
​```css
.hero h1 {
  font-size: 40px;
  color: #1a1a1a;
}
​```
**备注**：原版显得不够有力量，希望更厚重一些。

### `.cta-button`
​```css
.cta-button {
  padding-left: 24px;
  padding-right: 24px;
  background-color: #5b5bd6;
}
​```
```

8. 把整段粘给 Claude / Cursor / 研发同事 → 代码改了。

## 功能

| | |
|---|---|
| **直接拖拽** | 任意元素拖位置 / 缩放 / 改尺寸 |
| **真 CSS 编辑** | 颜色 / 字号 / 字重 / 行高 / 间距 / 圆角 / 阴影 / 透明度（不是 transform 假象，让兄弟元素正确 reflow） |
| **文本编辑** | 双击文本叶子节点直接改文案 |
| **元素备注** | 给每个元素留意图说明，AI 能消化的语义信号 |
| **AI-native 导出** | Markdown 含选择器 + CSS diff + 备注，可直接粘到 Cursor / Claude |
| **分享链接** | 改动编码到 URL，研发打开同样链接看到所有覆盖 |
| **响应式预览** | 一键切 375 / 768 / 1024 / 1280 / 1440 验证多断点 |
| **Figma 参考图覆盖** | 上传设计稿半透明叠加到当前页面 |
| **Tailwind 感知** | 检测 Tailwind 项目，提示输出 utility class |
| **多选对齐** | Shift+点击多选，水平/垂直对齐和等距分布 |
| **撤销/重做** | Alt+Z / Alt+Shift+Z（避免与浏览器原生快捷键冲突） |
| **持久化** | 改动按 host+path 存到 localStorage，刷新页面不丢 |

## 快捷键

| 快捷键 | 作用 |
|---|---|
| `Shift+P` / `Shift+D` | 切换 指针 / 深选 模式 |
| `Alt+Z` / `Alt+Shift+Z` | 撤销 / 重做 |
| `Esc` | 取消选中 / 关闭面板 |
| `Shift+点击` | 多选 |
| `Alt+点击` | 穿透到下面一层 |
| `Shift+滚轮` | 缩放选中元素 |
| 双击文本 | 编辑文案 |

## 设计原则

- **零依赖**：单文件，没有 npm 树，bookmarklet 也能用
- **不污染生产**：没有 `?polish=1` 时完全 no-op
- **不需要本地代码**：Polish 在已部署页面上工作，设计师 / PM 不需要装任何环境
- **AI 友好**：导出格式针对 LLM 优化，不是给人读的 CSS dump
- **设计师友好**：UI 像 Vercel Toolbar / Linear，不像 Chrome DevTools

## 与 Chrome DevTools / 设计稿工具的区别

| | Chrome DevTools | Figma | Polish |
|---|---|---|---|
| 改 css 看效果 | ✓ | ✗ | ✓ |
| 不需要研发协助 | ✓ | ✓ | ✓ |
| 在已部署页面工作 | ✓ | ✗ | ✓ |
| 输出能直接落代码 | ✗（手抄） | ✗（手抄） | ✓（AI-ready md） |
| 备注 / 沟通意图 | ✗ | ✓ | ✓ |
| 设计师友好 | ✗（太工程） | ✓ | ✓ |

## Roadmap

- [x] v0.1 真 CSS 编辑、AI-native 导出、bookmarklet、分享链接、视口预览、Figma 覆盖、Tailwind 感知
- [ ] v0.2 PR 直发（连 GitHub repo，编辑结果一键开 PR）
- [ ] v0.3 多人协作（同页面 cursor / 评论）
- [ ] v0.4 `data-source-loc` 自动定位到源码行（Vite/Next 集成）
- [ ] v0.5 历史会话回放（设计师录一段改动过程，研发回放）
- [ ] v1.0 桌面 app（绕开跨域 / iframe 限制）

## 为什么

> AI 让前端 vibe coding 成为可能。但最后 5% 的视觉细节，永远是 AI 一次写不对、研发不愿听描述、设计师改不了代码的痛点。
> Polish 是这条产线的最后一站。

## License

MIT © Bowie Lee
