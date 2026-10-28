---
name: cds-foundation
description: >-
  Claude Design System (CDS) 设计令牌与视觉契约——表面阶梯、陶土色、发丝边、圆角矩阵、阴影、排版与暗色模式。
  Use whenever building or restyling ANY UI to look/feel like Claude, Anthropic style, "Claude 风格/Claude 同款/克劳德界面",
  warm editorial AI-chat aesthetics, clay/terracotta themes, or when the user mentions CDS, 陶土色, Surface 0-3, design tokens,
  or wants a chat UI that feels like Claude Desktop. Also the mandatory base before using cds-motion / cds-components / cds-chat skills.
---

# CDS 基础：设计哲学与令牌契约

你正在生成的 UI 必须遵守 Claude Design System (CDS) 的逆向取证规范（源自 open-claude-ui / REA v6.5.0 对 Claude Desktop 生产包的 AST 解构）。本 skill 是其余 cds-* skill 的地基。

## 三条设计哲学（违反任何一条都会立刻"不像 Claude"）

1. **温润的人文质感（Editorial Warmth）**：严禁高饱和赛博朋克蓝/紫渐变和荧光色。品牌强调色是陶土色 Clay `#d97757`（hover `#cc5a36`，浅底 `#fbf3ef`）；桌面端全局品牌色 `--brand: #c6613f`。界面底色是微温纸质灰，深色模式严禁滥用纯 `#000000`（唯一例外：代码块高亮背景 `#0d0d0c`）。
2. **多层微对比表面（Low-contrast Surface Layering）**：放弃 1px 硬描边思维，用 Surface 0→3 的 1%~3% 明度阶梯差 + 10%/9% alpha 发丝线构建空间。
3. **触感物理反馈（Tactile Physics）**：严禁 CSS 默认 `ease`/`linear` 或夸张弹跳。位移缩放必须用真实弹簧参数或 15 阶 `linear()` 弹簧曲线（见 cds-motion skill）。

## 第一步：接入令牌层（三选一）

```
# A. 纯 CSS 项目（React/Vue/Svelte/任意宿主均可）——把 assets/cds-theme.css 复制进项目后：
@import "cds-theme.css";        /* 全量 183 个令牌 + 关键帧 + 工具类 */

# B. 只要最薄令牌（60 行核心变量）：
@import "cds-pure.css";

# C. Tailwind 项目：额外复制 assets/tailwind.config.js，合并到 tailwind.config，
#    获得 bg-surface-0..3 / text-clay / shadow-popover / rounded-composer 等语义类
```

令牌层与 React/Tailwind 完全解耦，可独立消费。接入后所有颜色一律写 `var(--cds-*)` 或语义 Tailwind 类，**严禁写死十六进制假色**。

## 表面阶梯（最重要的空间规则）

| 令牌 | 浅色 | 深色 | 用途 |
| --- | --- | --- | --- |
| `--cds-surface-0` | `#f9f9f7` | `#0b0b0b` | 侧边栏 / 窗口最底层 Canvas |
| `--cds-surface-1` | `#fcfcfb` | `#151515` | 主聊天画布页面背景 |
| `--cds-surface-2` | `#ffffff` | `#1a1a19` | 消息卡片表面 |
| `--cds-surface-3` | `#ffffff` | `#20201f` | 输入框容器 / 高层浮层 |
| `--cds-surface-popover` | `#ffffff` | `#2c2c2a` | 悬浮 Popover / 菜单 |

深色灰阶是严格等距步进的（#20201f→#1e1e1d→…→#0b0b0b，每阶 -2 HEX），用于消除 OLED 色带断层——自定义深色表面时必须从 `--cds-gray-*` 35 阶标尺（见 references/design-tokens.md）取值，禁止凭空调色。

## 文本三级

`--cds-text-primary: #151515`（正文标题）/ `--cds-text-secondary: #525252`（副标题）/ `--cds-text-muted: #8a8a8a`（占位符、快捷键）。深色对应 `#f5f5f5 / #a3a3a3 / #666666`。

## 边框与阴影：单闭合边框原则（最高频翻车点）

- 任何一条视线路径上**至多穿过 1 层闭合边框**。带边框容器（Composer、Dialog、CodeBlock）内部的按钮/输入区/chips 必须 `border-none bg-transparent`，仅靠 Hover 表面色变化传达可交互。
- 边框层级：标准边框 `--cds-border`（8% 黑 alpha 0.10）、强调 `--cds-border-strong`（0.20）。优先用 `box-shadow: 0 0 0 1px var(--cds-border)` 代替 CSS border，避免激活态切换时的 1px 重排抖动。
- 视网膜高分屏发丝线：`--cds-ring-hairline` 在 @2x 降为 0.5px、@3x 降为 1/3px（cds-theme.css 已内置媒体查询）。
- 阴影一律用 `--cds-shadow-sm/md/lg/popover`（双层复合：近距微遮蔽 + 远距漫反射）。深色 Popover 是"倒角高光"结构：内环 `inset 0 0 0 1px rgba(255,255,255,0.10)` + 外环 0px，模拟物理顶光反光。
- 焦点环：`--cds-focus-shadow`（三层：1px 隔离垫片 + 1.5px 陶土环 + 6px 陶土漫射光晕）。拖拽吸附用 `--cds-shadow-drop-glow`。

## 圆角矩阵（必须精确）

| 值 | 用途 |
| --- | --- |
| 6px | XS 按钮 |
| 8px | 标准按钮 / 输入框 / 菜单项（`--radius-lg`） |
| 10px | 子面板卡片、附件条目（`--cds-panel-radius`） |
| 12px | 代码块、抽屉面板（`--radius-xl`） |
| 16px | 模态弹窗（`--radius-2xl` / `--cds-radius-dialog`） |
| 18px | 用户消息气泡（`--cds-message-bubble-radius`） |
| 20px | 聊天输入框 Composer（`--cds-radius-composer`） |
| 999px | 分段控件轨道 / 药丸（`--df-radius-pill`） |
| `calc(内圆角 + .25rem × scale)` | 卡片自适应嵌套同心圆角 `--radius-card` |

## 排版规则

- 字体栈带 CJK 回退链（PingFang SC → PingFang TC → Hiragino Sans → Apple SD Gothic Neo），见 references/design-tokens.md；不引入专有字体文件。
- 桌面光学缩放系数 `--cds-rem-scale: calc(16/17) ≈ 0.9412`，令字号与原生视网膜渲染对齐。
- **暗色模式字重逆补偿**：白字在黑底会视觉膨胀 10%~15%，深色下须把 variable font 字重下调 30~40（font-medium 500→460、semibold→550；cds-theme.css 已内置 `.dark` 覆盖）。
- 行内图标光学居中：`vertical-align: -0.125em`（正文）/ `-0.075em`（小字）。
- 动态数字（计时、Token 计数、时间戳、Diff 行号）必须 `tabular-nums`，杜绝水平抖动。
- 标题 `text-wrap: balance`，正文 `text-wrap: pretty`，长模型 ID / hash 用 `overflow-wrap: anywhere`。
- 移动端输入框字号下限 16px，防 iOS 聚焦缩放。
- 排版 7 阶标尺（caption 11px → body 14px → title 20px → display 38px serif 问候语）精确值在 references/design-tokens.md。

## 暗色模式清单

用 `[data-mode="dark"], .dark` 选择器重载（cds-theme.css 已内置全量深色变量）。核对：背景不纯黑、字重已逆补偿、Popover 双环已反转、陶土色 hover 改为**提亮** `#e08264`（浅色模式是加深 `#cc5a36`）。

## Hover / 按压微交互基准

- Ghost 按钮：hover 150ms `cubic-bezier(.16,1,.3,1)` 渐入 5% 灰底，active `scale(0.98)` + 10% 灰底。
- 卡片：hover `translateY(-1.5px)` + 阴影升至 `--cds-panel-shadow-hover` + 边框加深。
- Composer 三态阴影链：常态 `--cds-shadow-composer` → hover `composer-hover` → focus-within `composer-focus`（cds-theme.css 的 `.cds-composer-shadow` 工具类已实现 220ms 过渡）。

## 何时读 references

- 需要 35 阶灰度/橙色标尺的精确值、7 阶排版标尺、图标双层色协议、内容场景→字体参数速查矩阵 → 读 `references/design-tokens.md`。
- 需要完整可复制令牌 → 直接取 `assets/cds-theme.css`。

## 交付自检（写完 UI 后逐项核对）

- [ ] 所有颜色来自 `var(--cds-*)`，无写死色值（Tailwind 语义类除外）
- [ ] 表面用了正确层级（sidebar=0，画布=1，卡片=2，输入框/浮层=3）
- [ ] 无嵌套闭合边框；容器内控件全部 borderless
- [ ] 深色模式变量重载完整，无纯黑背景
- [ ] 动态数字带 `tabular-nums`
- [ ] 阴影来自令牌；焦点环是陶土三层环而非浏览器默认蓝框
