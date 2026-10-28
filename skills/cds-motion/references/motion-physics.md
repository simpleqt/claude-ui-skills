# 动效物理参数手册（蒸馏版）

> 蒸馏自 `assets/ClaudeMotionPresets.ts`（含取证注释的原始源码）与《CDS 手册》第四篇。

## 1. 阻尼谐振子求解器（需要离线计算任意时刻位移时用）

```ts
function calcDampedHarmonicOscillator(k: number, c: number, m: number, t: number): number {
  const w0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(m * k));
  if (zeta < 1) {            // 欠阻尼：存在超调振荡
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * w0 * t) *
      (Math.cos(wd * t) + (zeta / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t));
  } else if (Math.abs(zeta - 1) < 1e-4) {   // 临界阻尼
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  } else {                   // 过阻尼
    const s1 = -w0 * (zeta - Math.sqrt(zeta * zeta - 1));
    const s2 = -w0 * (zeta + Math.sqrt(zeta * zeta - 1));
    return 1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1);
  }
}
```

## 2. 弹簧预设溯源表

| 预设 | 参数 | 取证来源（ion-dist 混淆文件） | Claude 实测用途 |
| --- | --- | --- | --- |
| SPRING_BOUNCY | 600/30/1.0 | `shared-8-PHXy9B6B.js` | 麦克风按钮 mount/unmount 的 scale/opacity、语音条 `width 0→32` 展开、图形切换 popLayout |
| SPRING_SNAPPY | 320/28/1.0 | `c427176b2-DuM09fKk.js` | 拖动结束后按松手速度回弹（`animate(dx, target, {…, velocity})`） |
| SPRING_HEAVY_SNAP | 1200/80/0.1 | `c8ad300b7-07P9B-v4.js` | `file_viewer` 面板 `animate(width, 384)`；最小宽 320、默认 480 |
| SPRING_GENTLE | 380/18/1.0 | **无客户端来源**（open-claude-ui 自建） | 中段强弹档；Claude 的听写切换实际用 `{spring, duration:.32, bounce:.15}` |

## 3. 现成 Variants 全文

```ts
motionMessageFadeUp  // 消息上浮：initial {opacity:0, y:12} → SNAPPY；exit {y:-8, .18s easeIn}
motionUserBubbleEnter // 用户气泡：initial {opacity:0, scale:.94, y:8} → spring 450/24
motionPopover        // 浮层：initial {opacity:0, scale:.95, y:4} → SNAPPY；exit .12s easeOut
motionModalDialog    // 模态：initial {opacity:0, scale:.96, y:10} → spring 400/32；exit .15s easeInOut
motionGraphemeReveal // 流式字符：{opacity:0, blur(6px)} → {1, blur(0)} .35s easeOut
```

## 4. CSS Houdini 可变字体动效（文字微动效引擎）

```css
@property --cds-anim  { syntax: "<number>"; inherits: false; initial-value: 0; }
@property --cds-anim2 { syntax: "<number>"; inherits: false; initial-value: 0; }
[data-cds-anim] {
  font-variation-settings: "opsz" var(--cds-opsz,20), "wght" var(--cds-wght,400),
                           "ANIM" var(--cds-anim), "ANM2" var(--cds-anim2);
  transition: --cds-anim .3s cubic-bezier(.34,1.3,.64,1);
}
/* hover/focus-visible 时 --cds-anim: 100 触发字形弹性形变；reduced-motion 下禁用 */
```

## 5. 关键帧完整定义（速用）

```css
/* 思考三点波浪 */
@keyframes timeline-quiet-dot {
  0%, 8%    { opacity: 0; transform: translateY(2px); }
  22%       { opacity: 1; transform: translateY(-2.5px); }
  36%, 70%  { opacity: 1; transform: translateY(0); }
  90%, 100% { opacity: 0; transform: translateY(0); }
}
/* 容器：.timeline-quiet-dots { gap:3.5px; display:inline-flex; top:.26em }
   单点 3px 陶土圆，delay 0/.15s/.3s，总 1.9s cubic-bezier(.4,0,.2,1) infinite */

/* 骨架扫光（光带角度在背景渐变上：105deg LTR / 255deg RTL） */
@keyframes cds-skeleton-sweep { 0% {transform:translate(-100%)} 100% {transform:translate(100%)} }
/* animation: cds-skeleton-sweep 2s linear infinite */

/* 陶土呼吸 */
@keyframes dframe-clay-breathe {
  0%,100% { filter: brightness(.96); transform: scale(.86); }
  50%     { filter: brightness(1.06); transform: scale(1); }
}

/* 消息块消融入场 */
@keyframes timeline-block-enter {
  0%   { opacity:0; filter:blur(4px); transform: translateY(5px) scale(.9); }
  30%  { opacity:0; filter:blur(4px); transform:none; }
  100% { opacity:1; filter:none;      transform:none; }
}
/* 用法：.timeline-block-enter { animation: .3s cubic-bezier(.22,1,.36,1) both; } */
```

## 6. View Transitions / sibling-index()（Claude Desktop 2.0 现代方案）

- 列表级联交错渐入可用原生 CSS `sibling-index()` 计算 per-item delay，替代 JS stagger。
- 共享元素变形（缩略图 ↔ 全屏）用 View Transitions API：完整 Hook 见 `../cds-media/assets/useClaudeSharedElementTransition.ts`（含 object-fit:contain 内切剪裁百分比算法与向上 5 层圆角提取）。

## 7. 性能纪律

- 展开类动效优先 Grid `0fr↔1fr`（无 scrollHeight 测量、无视口突变）。
- transform/opacity/filter 之外的属性禁止进入长循环动画。
- `will-change` 只加在滑块等确有合成层需求的元素上（如 `.df-pill-indicator`）。
- 拖拽回弹必须带松手 velocity；reduced-motion 直接跳位。
