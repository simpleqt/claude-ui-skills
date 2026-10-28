---
name: cds-components
description: >-
  CDS 原子组件规格与生产级实现——按钮（5 尺寸 × 6 变体 + squish 弹簧）、分段滑动胶囊、状态指示灯、
  模态确认对话框、附件磁贴、代码块。附可直接复制的 React/TSX 生产源码。
  Use whenever building buttons, segmented controls / tabs, status dots, dialogs/modals, attachment cards,
  file chips, or code blocks for a Claude-style UI; when the user mentions 按钮/分段控件/弹窗/对话框/状态灯/附件卡片/代码块
  in a CDS or Claude-like project.
---

# CDS 原子组件

先满足前置：颜色/圆角/阴影令牌来自 cds-foundation（`assets/cds-theme.css`），按压动效来自 cds-motion。本 skill 的 `assets/` 有 6 个 0 依赖黑盒、可直接复制的生产组件（React 18 + TypeScript + Framer Motion + lucide-react）。

## 1. 按钮 CdsButton（assets/CdsButton.tsx）

**尺寸阶梯**（桌面 rem-scale ≈0.94 后实际值）：

| 档 | 高度 | padding | 字号 | 圆角 |
| --- | --- | --- | --- | --- |
| xxs | ≈19px | px-1.5 py-0 | 11px | 4px |
| xs | ≈23px | px-2 py-0.5 | 11.5px | 6px |
| sm | ≈26px | px-2.5 py-1 | 12.5px | 8px |
| **md（默认）** | ≈32px | px-3.5 py-1.5 | 13.5px | 8px |
| lg | ≈40px | px-5 py-2 | 15px | 12px |
| icon | 正方形 | p-0 | — | 8px |

嵌套在 Composer/工具栏内时自动降为嵌套高度（17/18.8/20.7/26.35px）。

**变体**（两层架构：外层交互壳 `cds-btn-squish` + 内层绘景层，杜绝 hover 尺寸抖动）：

| 变体 | 视觉 | 关键类 |
| --- | --- | --- |
| **secondary（官方默认）** | 无边框柔和填充，**绝不带硬边框** | `bg-fill-secondary hover:bg-fill-secondary-hover` |
| primary | 陶土实色 | `bg-fill-primary hover:fill-primary-hover` + `active:brightness-95` |
| ghost | 常态全透明，hover 5% 灰底 | `bg-transparent hover:bg-fill-ghost-hover` |
| danger | 警示深红 | `bg-fill-danger` + 红色 focus 晕 |
| brand | 桌面品牌深陶土 `--brand #c6613f` | `bg-fill-brand` |
| onContent | 浮在代码/图片/视频上的毛玻璃覆层 | `backdrop-blur-md + inset ring` |

按压物理：`.cds-btn-squish` 15 阶 linear() 弹簧（按压 scale .975，回弹过冲 +9.15%）。组合按钮组：首项 `rounded-e-none`、中间 `rounded-none`、末项 `rounded-s-none`。

## 2. 分段滑动胶囊 SegmentedControl（assets/SegmentedControl.tsx）

- 轨道：`border-radius: 999px`，**padding 严格 1px**（不是 2px），背景 `rgba(0,0,0,.06)`（暗色 8% 白），`container-type: inline-size`。
- 滑块纯几何定位：`left: calc(1px + activeIndex × (100% - 2px) / total)`，`width: calc((100% - 2px) / total)`；过渡 `transform var(--cds-dur-snap) var(--cds-ease-snap)`。
- 滑块光学双层投影：浅色 `inset 0 0 0 .5px var(--cds-border), 0 1px 2px #0000000f, 0 2px 6px -1px #0000000d`；暗色内环 `#ffffff14`。
- 容器自适应折叠（不换行）：`@container (width <= 180px)` 收起 2 项版的非激活标签；`<= 254px` 收起 3 项版。
- 双实现模式：纯 CSS 几何 or Framer Motion `layoutId` 共享滑块。

## 3. 状态指示灯 StatusIndicators（assets/StatusIndicators.tsx）

`.status-dot` 严格 **6px** 圆：

| kind | 颜色 | 动画 |
| --- | --- | --- |
| ready | fill-accent | 静态常亮 |
| running | fill-accent | `1.2s ease-in-out infinite` 闪烁（opacity .3↔1） |
| error | fill-danger | 静态深红 |
| clay | `--cds-clay` | `3s ease-in-out infinite` 呼吸（brightness .96↔1.06, scale .86↔1）——Extended Thinking 专用 |

配套：骨架屏扫光（2s linear、105° 倾斜、严格匀速）、思考三点波浪（见 cds-motion）。

## 4. 模态确认对话框 ConfirmationDialog（assets/ConfirmationDialog.tsx）

- 尺寸阶梯：sm 400 / **md 520（默认）** / lg 720 / xl 880 / 2xl 1024 / 3xl 1152px `max-w`。
- 视口安全帽：`max-height: calc(100dvh - 2rem - 2 × safe-area)`，防刘海屏溢出。
- 圆角 16px，投影 `--cds-shadow-popover`（深色倒角高光），遮罩高斯模糊。
- 进入动画 `motionModalDialog`（400/32 弹簧）；**嵌套弹窗防御**：父弹窗检测 `data-nested-dialog-open` 时 `blur(2px)` + 半透明遮罩拦截。
- 危险操作用 danger 主按钮 + ghost 取消；键盘陷阱（focus trap）+ Esc 关闭。
- 内容超长时容器走 scroll-driven 渐隐遮罩（`.scroll-fade-y`）。

## 5. 附件磁贴 AttachmentCard（assets/AttachmentCard.tsx）

- 磁贴是**严格正方形** `size-[calc(7.5rem × rem-scale)]`（≈113~120px，不是 128×96 扁矩形），圆角 `--radius-card`，外投影 `shadow-field-drop`，hover 微抬升。
- 移除按钮悬浮右上角：`absolute -end-2 -top-2`，20px 圆，`bg-surface-3` + 发丝环 + `active:scale-90`。
- 长文件名**双向中间截断**：头部保留 + `before:content-['…']` + 尾部词干 truncate + 扩展名 `shrink-0` 永远完整显示。
- 左上角全大写等宽类型徽标（TS/PY/PDF…）；入场 `file-thumbnail-grow-in` 250ms。
- 输入框内的行内模式：胶囊形上下文 chip（无边框，遵守单闭合边框原则）。

## 6. 代码块 CodeBlock（assets/CodeBlock.tsx）

- 圆角 12px（`--cds-radius-code`），背景**纯黑系** `#0d0d0c`（深浅模式统一），mono 12px / 行高 17.5px，`tabular-nums` 行号。
- 顶部语言栏与代码区之间用 `border-b` 单向细线（不是套框）；横向平滑滚动。
- 行内代码：3px 圆角、1px 细边框、`padding 1px 4px`、mono 12px/medium。

## 通用纪律

- 所有二次确认/删除走 ConfirmationDialog，不要浏览器原生 `confirm()`。
- 菜单/浮层投影一律 `--cds-shadow-popover`；激活态边框 1.5px `inset 0 0 0 1.5px currentColor`。
- 需要精确 DOM 结构或完整属性签名时直接读 `assets/*.tsx` 源码，不要凭记忆重写。
