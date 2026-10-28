---
name: cds-media
description: >-
  CDS 视听媒体与产物交互物理学——Web Audio 纯代码合成音效、麦克风波形、图片灯箱光标锚点 Pan/Zoom、
  双栏分割条、流式 Diff 查看器、沙箱 iframe 桥、View Transitions 共享元素变形。
  Use whenever adding sound effects / notifications audio, voice mode UI, mic activity bars, image lightbox / gallery zoom,
  split-pane resizers, code diff viewers, sandboxed artifact previews, or thumbnail→fullscreen transitions to a Claude-style UI;
  when the user mentions 音效/语音/波形/灯箱/图片查看器/分屏/diff/沙箱预览.
---

# CDS 视听多媒体与产物交互

`assets/` 有 7 个生产模块。令牌/动效前置：cds-foundation、cds-motion。

## 1. 音效：纯代码合成，零音频文件（assets/ClaudeAudioPlayer.ts）

**严禁 `fetch`/`import` 外部 `.mp3`**（版权 + 体积）。用 Web Audio 振荡器和弦合成，单例 `ClaudeAudioPlayer.getInstance()`：

- 四大音效：`enter_voice_mode`（双音阶上扬）、`exit_voice_mode`（单音阶下沉）、`disconnected`（电平降调衰减）、`tool_approval_needed`（木质敲击双音）。
- **30% 舒缓音量基准**（`audio.volume = 0.3`），绝不产生惊吓感。
- 增益 ramp 淡入淡出防爆音；支持 `setSinkId` 扬声器硬件路由；`setSfxPath()` 允许 BYO 自备音频。
- 实时流式语音（如 Realtime API）若需要：AudioWorklet + SharedArrayBuffer 无锁环形缓冲（128 样本/帧，欠载填 0 静音），规格见 references。

## 2. 麦克风波形 LiveMicActivityBars（assets/LiveMicActivityBars.tsx）

6 频段 AnalyserNode（fftSize 512，smoothing 0.5，-70dB ~ -10dB 截断）→ **8% 噪声门限** `max(0, u−.08)/.92` → **0.7 次幂 Gamma 压缩** `min(1, u^0.7 × 1.5 × bandWeight)` → 高度 4~24px + Framer Motion 弹性映射。作用：放大细语、压低爆音、消除空调背景杂音抖动。数字柱高 `tabular-nums` 无关但柱宽固定对齐。

## 3. 灯箱：光标锚点 Pan/Zoom（assets/MediaLightboxViewer.tsx）

物理常数（取证 `c4b054ed5-BGjH-Uu6.js`）：

| 常数 | 值 | 含义 |
| --- | --- | --- |
| 手势死区 | **4px** | `hypot(dx,dy) < 4` 判定为手抖，不触发拖拽 |
| 滚轮缩放因子 | **0.01** | `scale ×= exp(−deltaY × 0.01)`（指数缩放） |
| 吸附下限 | **1.05** | scale ≤ 1.05 时自动顺滑吸附回 1.0 |
| 点击跳变放大 | **1.25** | 单次双击/按钮放大比例 |
| 最大缩放 | `max(naturalW/fitW, 2)` | 不低于 2x |
| 视口阻尼溢出 | **0.7** | 边缘越界回弹系数 |
| 跑道跨度 | 75vw 视口，前后各预载 **2** 帧 | 虚拟画廊 |

核心锚点方程（缩放时指针所指内容点保持不动）：
```
c = targetScale / currentScale
idealTx = offsetX − (offsetX − prevIdealTx) × c   // offsetX = pointer − fitCenter
tx = clamp(idealTx, maxTx),  maxTx = max(0, (fitW × S − viewportW)/2) × min(1, max(0, (S−1.05)/.95))
```
进出场：backdrop `.2s fade-in` + content `.25s scale-in`。

## 4. 缩略图 ↔ 全屏共享元素变形（assets/useClaudeSharedElementTransition.ts）

View Transitions API。两个难点已解：向上穿透 5 层 DOM 提取生效圆角；`object-fit: contain` 图像的**内切剪裁百分比算法**（由 naturalW/H × scale 算 inset 四向百分比，避免变形黑边）。用法：点击缩略图时 `startTransition`，新旧视图各设 `view-transition-name`。

## 5. 双栏分割条 ArtifactsSplitPaneResizer（assets/ArtifactsSplitPaneResizer.tsx)

- 拖拽死区 4px；**50/50 居中磁吸**（接近中点吸附，`SPRING_HEAVY_SNAP` 过阻尼咬合）。
- 分割条 hover 加亮、拖拽中全局 cursor；宽度持久化。
- 键盘可达：左右箭头微调。

## 6. 流式 Diff StreamingDiffViewer（assets/StreamingDiffViewer.tsx）

- 等宽 mono 12px + `--diffs-*` 语义变量（增/删/上下文行背景）。
- 行号 `tabular-nums`；流式高亮逐行渐入（图元晕染），非整块闪现。
- 横向滚动容器 + 7 档渐隐遮罩（`.scroll-fade-x`）。

## 7. 沙箱工件桥 EpitaxyIframeBridge（assets/EpitaxyIframeBridge.tsx）

安全铁律（处理 Artifacts/外部代码注入时必须全部满足）：
1. `sandbox` **严格移除 `allow-same-origin`**——null-origin 物理隔离。
2. 跨域 `postMessage` 校验来源 origin。
3. 系统级调用（全屏/剪贴板/音频）前校验 `event.userActivation`。
4. 加载/完成扫光用 `epitaxy-linear-sweep`（1.1s），完成勾选用 `clip-path inset` 绘制动画。

## 自检

- [ ] 无任何外部音频二进制依赖；音量 30% 基准
- [ ] 灯箱缩放以指针为锚点；≤1.05 自动吸附回 1
- [ ] iframe 无 allow-same-origin；postMessage 有 origin 校验
- [ ] 波形经噪声门限 + 0.7 Gamma 压缩
- [ ] 共享元素变形处理了 object-fit:contain 内切
