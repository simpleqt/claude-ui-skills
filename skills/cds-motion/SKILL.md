---
name: cds-motion
description: >-
  CDS 动效物理学——Framer Motion 四套生产级弹簧预设、CSS 贝塞尔曲线全集、时长令牌、15 阶 linear() 弹簧、
  7 档非线性滚动渐隐遮罩、关键帧动画库与 prefers-reduced-motion 降级。
  Use whenever adding ANY animation, transition, spring, hover motion, scroll fade, skeleton shimmer, thinking dots,
  or gesture physics to a Claude-style UI; when the user mentions 弹簧动效/物理动画/滚动渐隐/呼吸灯/扫光/动效参数,
  or asks why an animation "doesn't feel like Claude".
---

# CDS 动效物理引擎

所有动效必须来自真实物理模型（二阶阻尼谐振子 `m·x'' + c·x' + k(x−target) = 0`，阻尼比 ζ = c/(2√(mk))），逆向取证自 Claude Desktop 生产包。**严禁** CSS 默认 `ease`/`linear`、严禁无阻尼的夸张弹跳。

> ⚠️ 勘误：open-claude-ui 手册第 8 篇决策树把预设名标反了（SNAPPY/BOUNCY/GENTLE 错位）。以本 skill 与 `assets/ClaudeMotionPresets.ts` 源码注释为准。

## 弹簧预设决策树（Framer Motion）

```ts
import { SPRING_BOUNCY, SPRING_SNAPPY, SPRING_HEAVY_SNAP, SPRING_GENTLE,
         motionMessageFadeUp, motionPopover, motionModalDialog, motionUserBubbleEnter,
         motionGraphemeReveal } from "./ClaudeMotionPresets";
```

| 场景（你怎么判断） | 预设 | stiffness/damping/mass | ζ | 超调 | 手感 |
| --- | --- | --- | --- | --- | --- |
| 按钮点击、开关切换、图标按压、麦克风按钮出入场 | `SPRING_BOUNCY` | **600 / 30 / 1.0** | 0.612 | +8.8% | 高频微弹，利落归位 |
| 消息上浮、卡片/Popover 展开、拖拽松手回弹 | `SPRING_SNAPPY` | **320 / 28 / 1.0** | 0.783 | +1.9% | 沉稳顺滑，微冲着陆 |
| 面板宽度、抽屉吸附、拖拽占位线咬合 | `SPRING_HEAVY_SNAP` | **1200 / 80 / 0.1** | 3.65 | 0%（过阻尼） | 松手瞬间绝对咬合 |
| （非 Claude 观测值，自建补位档）点赞/成功勾选类强弹性 | `SPRING_GENTLE` | **380 / 18 / 1.0** | 0.462 | +19.4% | 明显两周期跳跃 |

取证要点：`600/30`、`320/28`、`1200/80, mass .1` 均为 Claude 生产包实测值；`380/18` 在客户端全量搜索无匹配，是 open-claude-ui 为补齐中段弹性自建的——**不要当作 Claude 观测值引用**。若要还原 Claude 听写/静息切换手感，用 `{type:"spring", duration:.32, bounce:.15}`（等价 stiffness≈244/damping≈26.6）。

现成 Variants（直接用，别手写）：
- `motionMessageFadeUp`：消息进入 `y:12→0` + SNAPPY，退场 0.18s easeIn
- `motionUserBubbleEnter`：用户气泡 `scale .94→1, y:8→0`（450/24）
- `motionPopover`：浮层 `scale .95→1, y:4→0` + SNAPPY，退场 0.12s
- `motionModalDialog`：模态 `scale .96→1, y:10→0`（400/32）
- `motionGraphemeReveal`：流式文字 `blur(6px)→0 + opacity`，0.35s easeOut

## 纯 CSS 路线（无 Framer Motion 时）

**15 阶 `linear()` 按钮弹簧**（按压 0.975 缩放 + 回弹，松手 40% 时间冲至 1.0915 再阻尼收敛）：
```css
.cds-btn-squish {
  --cds-btn-press-sx: 0.975; --cds-btn-press-sy: 0.975;
  transform-origin: 50%;
  transition: transform var(--cds-dur-slow, .45s) var(--cds-btn-spring);
}
.cds-btn-squish:active, :active > .cds-btn-squish {
  transform: scale(var(--cds-btn-press-sx), var(--cds-btn-press-sy));
  transition: transform var(--cds-dur-fast, 60ms) ease-out;
}
/* --cds-btn-spring: linear(0,.2459,.6526,.9468,1.0764,1.0915,1.0585,1.0219,.9993,.9914,.9921,.9957,.9988,1.0004,1) */
```

**时长令牌**：`--cds-dur-fast` 60ms（按压、focus 环）→ `--cds-dur-snap` 120ms（磁吸、分段滑块、Tab）→ `--cds-dur-base` 200ms（菜单、折叠、卡片）→ `--cds-dur-sheet` 300ms（抽屉、面板滑入）→ `--cds-dur-slow` 450ms（环境转场、按钮回弹）。

**10 条贝塞尔曲线**（场景专用，不许通用 ease 代替）：

| 令牌 | 值 | 场景 |
| --- | --- | --- |
| `--cds-ease-swift` | `cubic-bezier(.16,1,.3,1)` | Ghost hover、卡片抬升（仿 iOS 微交互） |
| `--cds-ease-expand` | `cubic-bezier(.19,1,.22,1)` | Grid 0fr→1fr 展开（思考折叠） |
| `--cds-ease-enter` | `cubic-bezier(.22,1,.36,1)` | 消息块入场消融（blur+scale） |
| `--cds-ease-out` | `cubic-bezier(.165,.84,.44,1)` | 标准出场 |
| `--cds-ease-snap` | `cubic-bezier(.32,.72,0,1)` | 磁吸对齐 |
| `--cds-ease-overshoot` | `cubic-bezier(.34,1.3,.64,1)` | 胶囊滑块果冻回弹（+30%） |
| `--cds-ease-pop` | `cubic-bezier(.34,1.56,.64,1)` | 弹窗重强调（+56%） |
| `--cds-ease-pulse` | `cubic-bezier(.4,0,.2,1)` | 思考三点脉冲 |
| `--cds-ease-rise` | `cubic-bezier(.3,.7,.4,1)` | 状态行抬升 |
| `--cds-ease-fall` | `cubic-bezier(0,0,.2,1)` | 状态行下落 |

## 高频关键帧库（cds-theme.css 已内置，类名直接用）

| 动效 | 时序 | 用途 |
| --- | --- | --- |
| `timeline-quiet-dot` | 1.9s infinite，三点相位差 0.15s/0.3s | 思考等待波浪（3px 陶土点，`translateY(-2.5px)` 冲刺） |
| `dframe-clay-breathe` | 2.4~3s ease-in-out | 陶土呼吸指示灯（brightness .96↔1.06 + scale .86↔1） |
| `dframe-dot-blink` | 1.2s ease-in-out | running 状态灯闪烁 |
| `cds-skeleton-sweep` | 2s linear，105° 倾角 | 骨架屏扫光（严格 2.0s 匀速） |
| `timeline-expand` | .2s + `--cds-ease-expand` | Grid 0fr→1fr 高度防抖展开 |
| `timeline-status-rise/fall` | .24s/.18s | 状态行平滑升降交接 |
| `message-fade-up` | .45s + overshoot 曲线 | 消息气泡微弹进入 |
| `timeline-block-enter` | .3s + `--cds-ease-enter` | 消息块 `blur(4px)+scale(.9)` 消融入场 |
| `file-thumbnail-grow-in` | 250ms | 附件磁贴生长（scale .85→1） |
| `saved-check-decay` | .35s + 2.2s 延迟 forwards | 复制勾选衰减消退 |
| `_grapheme-reveal_` | .35s | 流式字符 blur(6px)→0 晕染 |
| `wl-glow / wl-halo` | 1.8s / 2.2s ease-in-out | 推理氛围陶土光晕脉冲 |
| `epitaxy-linear-sweep` | 1.1s | 工件扫光（translate -100%→350%） |

## 7 档非线性滚动渐隐遮罩（滚动容器边缘）

严禁单段线性渐变。用感知伽马校准的 7 档采样 + 原生 CSS scroll-driven 动画（零 JS、GPU 合成器驱动）：
```css
/* 容器加 .scroll-fade-y（纵向）/ .cds-scroll-fade（四向），宽度 --cds-scroll-fade-size: 28px */
mask-image: linear-gradient(to bottom,
  transparent,
  #0000000d calc(var(--cds-scroll-fade-top) * .15),
  #00000026 calc(var(--cds-scroll-fade-top) * .3),
  #0000004d calc(var(--cds-scroll-fade-top) * .45),
  #00000080 calc(var(--cds-scroll-fade-top) * .6),
  #000000b3 calc(var(--cds-scroll-fade-top) * .75),
  #000000d9 calc(var(--cds-scroll-fade-top) * .87),
  #000 var(--cds-scroll-fade-top),
  #000 calc(100% - var(--cds-scroll-fade-bottom)),
  /* 底部对称 … */ transparent);
animation-timeline: scroll(self);
```
完整实现（含 `@property` 注册、触顶归零、静态兜底）在 `../cds-foundation/assets/cds-theme.css` 的 `.scroll-fade-y` 段；React 封装在 `../cds-chat/assets/ScrollFadeContainer.tsx`。

## 必须做的降级

`prefers-reduced-motion` 下所有弹簧动画直接跳位（Claude 客户端 65 个文件均做此降级）；遮罩/呼吸灯等纯装饰动画停用。骨架屏等必要状态提示改为静态低对比。

## 自检

- [ ] 动效参数全部来自预设或曲线令牌，无 `transition: all .3s ease`
- [ ] 按钮按压是 `.cds-btn-squish`（15 阶弹簧）而非生硬 `scale(.98)`
- [ ] 滚动渐隐是 7 档非线性 + scroll-driven
- [ ] reduced-motion 已处理
