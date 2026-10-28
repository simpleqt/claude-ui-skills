# CDS 设计令牌速查手册（蒸馏版）

> 蒸馏自 open-claude-ui `code-examples/cds-theme.css` 与《Claude Design System (CDS)》手册第一篇。完整权威版直接使用 `assets/cds-theme.css`。

## 1. 35 阶灰度标尺（`--cds-gray-*`）

浅色端（用于浅色表面与填充）：
`0:#fff 10:#fcfcfb 20:#f9f9f7 30:#f6f6f4 40:#f3f3f0 50:#f0efec 60:#edece8 70:#eae9e4 80:#e7e6e1 90:#e4e3dd 100:#e1e0d9 150:#d2d1c7 200:#c3c2b7 250:#b4b3a8 300:#a5a49a 350:#97958d 400:#898781 450:#7b7974 500:#6d6b67 550:#5f5e5a 600:#52514e 650:#454442 700:#383835`

深色端（等距 -2 HEX 步进，OLED 防色带）：
`750:#2c2c2a 800:#20201f 810:#1e1e1d 820:#1c1c1b 830:#1a1a19 840:#181817 850:#151515 860:#131313 870:#111111 880:#0f0f0f 890:#0d0d0d 900:#0b0b0b`

表面绑定：surface-0=gray-20/900 · surface-1=gray-10/850 · surface-2=gray-0/830 · surface-3=gray-0/800 · popover=gray-0/750。

## 2. 35 阶陶土/橙色标尺（`--cds-orange-*`，用于品牌渐变与状态）

`0:#fff 10:#fefbfa 20:#fdf7f5 30:#fcf4f0 40:#faf0ec 50:#f9ece7 60:#f8e9e2 70:#f7e5dd 80:#f7e1d7 90:#f7dcd1 100:#f7d8cb 150:#f3c5b2 200:#f4ae94 250:#f09978 300:#ec835a 350:#eb6834 400:#d95926 450:#c25124 500:#ae461c 550:#993d19 600:#863311 650:#712b0f 700:#5d230b 750:#4b1b08 800:#371407 … 900:#0b0b0b`

品牌色族：`--brand:#c6613f`（桌面主品牌）· `--cds-clay:#d97757` · hover 浅色加深 `#cc5a36` / 暗色提亮 `#e08264` · 浅底 `--cds-clay-light:#fbf3ef`。

## 3. Alpha 层级（边框与填充的真正来源）

| 令牌 | 浅色 | 用途 |
| --- | --- | --- |
| `--cds-alpha-1` | 黑 5% | Ghost hover、骨架屏、禁用态 |
| `--cds-alpha-2` | 黑 10% | 标准边框 `--cds-border`、次级填充 |
| `--cds-alpha-3` | 黑 20% | 强边框 `--cds-border-strong` |
| `--cds-alpha-4` | 黑 35% | 重分割线 |

深色模式反转为基础白：5% / 9% / 18% / 30%。

## 4. 7 阶排版标尺（桌面端已乘 rem-scale ≈ 0.9412）

| 阶梯 | 表达式 | 实际像素 | 行高 | 场景 |
| --- | --- | --- | --- | --- |
| caption | `calc(0.6875rem × scale)` | ≈11px | 16px (1.55) | Kbd、时间戳、Token 统计、模型版本微标 |
| footnote | `calc(0.75rem × scale)` | ≈12px | 14.1px (1.25) | 文件体积、次级说明 |
| code | `calc(0.75rem × scale)` | ≈12px | 16px (1.42) | 代码块、Thinking 日志、Diff |
| body | `calc(0.8125rem × scale)` | ≈13px | 18px (1.46) | 对话正文、Composer 输入 |
| prose | `0.875rem–1rem` | 14–16px | 20–24px (1.43–1.5) | Artifacts 长文阅读 |
| heading | `calc(0.875rem × scale)` | ≈14px | 17px (1.29) | 弹窗标题、卡片小标题 |
| title | `calc(1.25rem × scale)` | ≈19px | 23.5px (1.25) | 顶栏标题、项目主标题 |
| display (serif) | `2.375rem` | 38px | 1.2 | 首屏问候语（anthropic-serif，`wght 330, opsz 48`） |

内容场景速查：助理名 12px/580(wght)；模型徽标 mono 10.5px/500；正文 14px/400 + `text-wrap:pretty`；按钮 SM 12.5px/500、MD 13.5px/500；代码块 mono 12px/17.5px + `tabular-nums`；Kbd mono 10–11px/580 阴影衬底。

## 5. 字重体系与暗色逆补偿

| 语义 | 浅色 wght | 深色 wght（逆补偿） |
| --- | --- | --- |
| regular 正文 | 400 | 360 |
| medium 操作 | 500 | 460 |
| semibold 标题 | 580 | 550 |
| bold 警示 | 660 | 660 |

实现：variable font `font-variation-settings: "wght" …`；cds-theme.css 已对 `.dark .font-medium/.font-semibold/.font-bold` 自动覆盖为 465/560/660。

## 6. 字体栈

```css
--font-sans-fallbacks: system-ui, "Segoe UI", Roboto, Helvetica, Arial,
  "PingFang SC", "PingFang TC", "Hiragino Sans", "Apple SD Gothic Neo", sans-serif;
--font-anthropic-sans: "anthropic-sans", var(--font-sans-fallbacks);
--font-anthropic-serif: "anthropic-serif", ui-serif, Georgia, "Times New Roman", <CJK 链>, serif;
--font-anthropic-mono: "anthropic-mono", ui-monospace, "SF Mono", Menlo, monospace;
```

不引入任何专有字体二进制（版权合规），系统回退栈已足够高保真。

## 7. 图标协议

- Phosphor 架构 `viewBox="0 0 256 256"`；常规 stroke 16、激活 24。
- 双层色：主层 `currentColor`，次层 `color-mix(in srgb, currentColor 45%, transparent)`。
- 尺寸阶梯 XS 12 / SM 14 / MD 16（`calc(1rem × rem-scale)`）/ LG 20 / XL 24。
- 行内对齐 `-0.125em`（正文）· `-0.075em`（caption）· `-1px`（固定高工具栏）。

## 8. 控件高度与版心

| 令牌 | 值 | 说明 |
| --- | --- | --- |
| 控件高 xs–lg | 20 / 24 / 32 / 40px | 32px 是标准按钮与 Tab |
| 桌面 titlebar | 46–48px | 无边框窗口拖拽条 |
| 常驻侧边栏 | 288px (`18rem`) | `--static-sidebar-width` |
| 会话版心 | 672–768px | `max-w-2xl / 3xl`，`--chat-gutter: 32px` |
| Composer 最大高 | 384px (`24rem`) | 超出内部滚动 |

## 9. 文本换行与截断阶梯

- `text-wrap: balance` → h1–h4 与卡片主标题
- `text-wrap: pretty` → p/li/dd/blockquote
- `overflow-wrap: anywhere; word-break: normal` → 长模型 ID、hash
- `-webkit-line-clamp` 1/2/3 阶 → 侧栏标题 / 思考摘要 / 系统提示卡
- 用户气泡超 300px 高：`max-height:300px` + 底部 3rem 渐变蒙版 + Show more

## 10. 双环 Popover / Composer 阴影（照抄即可）

```css
/* Popover 浅色：外环细线 + 双层漫射 */
--cds-shadow-popover: inset 0 0 0 0 transparent,
  0 0 0 1px var(--cds-border),
  0 8px 24px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.08);
/* Popover 深色：倒角高光反转 */
--cds-shadow-popover: inset 0 0 0 1px rgba(255,255,255,.10),
  0 0 0 0 transparent,
  0 8px 28px rgba(0,0,0,.65), 0 2px 8px rgba(0,0,0,.45);

/* Composer 三态 */
常态  : 0 4px 20px rgba(0,0,0,.035), inset 0 0 0 1px var(--cds-border);
hover : 0 4px 24px rgba(0,0,0,.06),  inset 0 0 0 1px var(--cds-border-strong);
focus : 0 4px 24px rgba(0,0,0,.08),  inset 0 0 0 1px var(--cds-border-strong),
         0 0 0 1px var(--cds-border-strong);

/* 焦点三环（陶土） */
--cds-focus-shadow: inset 0 0 0 1px var(--cds-surface-1),
  0 0 0 1.5px var(--cds-clay),
  0 0 6px 1px rgba(217,119,87,.25);
```

## 11. 语义别名映射（写组件时优先用这些）

背景：`--cds-bg-surface`(=2) / `--cds-bg-surface-elevated`(=3) / `--cds-bg-primary`(=0) / `--cds-bg-secondary`(=1) / `--cds-bg-hover` / `--cds-bg-selected` / `--cds-bg-input`(=3)
边框：`--cds-border-subtle` / `--cds-border-accent`(clay) / `--cds-border-card`
填充：`--cds-fill-brand`(#c6613f) / `--cds-fill-brand-hover` / `--cds-fill-brand-subtle`(浅陶土) / `--cds-fill-danger`(#ef4444，深色 #f87171) / `--cds-fill-ghost-hover` / `--cds-fill-ghost-selected` / `--cds-fill-secondary`
文本：`--cds-text-primary/secondary/muted/accent`
圆角别名：`--cds-radius-dialog:16px` · `--cds-radius-code:12px` · `--cds-radius-btn-md:8px` · `--cds-radius-pill:9999px`
