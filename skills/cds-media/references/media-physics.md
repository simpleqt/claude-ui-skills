# 视听媒体物理参数手册（蒸馏版）

> 蒸馏自《CDS 手册》第五篇（取证：audioSinkWorklet.js / shared-8-4Jj8qhmU.js / c4b054ed5-BGjH-Uu6.js / cd5136de8-BDys1vAN.js / c58115fda-BKnbLmi3.js / c19e90103-CvUj-0ZH.js / c4a1e6da6-B9dxf4-D.js）。

## 1. AudioWorklet 环形缓冲（实时流式语音需要时）

- `SharedArrayBuffer` 头 4 个 Uint32 槽位：`[RD, WR, UNDERRUNS, PLAYED]`，之后是 Float32 PCM 存储。
- 生产者 push / 消费者 pop 均用 `Atomics.load/store` 无锁同步；容量计算 `HEADER_BYTES + capacity × 4`。
- 消费频率：128 样本/帧 @48kHz ≈ 375Hz；欠载时 `channel.fill(0, read)` 输出静音绝不爆音，并触发 underrun/drain 上报。

## 2. 四大音效声学特征（合成目标参考）

| 音效 | 特征 | 触发 |
| --- | --- | --- |
| enter_voice_mode | 双音阶上扬泛音，清脆柔和 | 开启语音 |
| exit_voice_mode | 单音阶下沉，平缓收束 | 挂断/超时 |
| tool_approval_needed | 温暖木质敲击共振双音 | 高风险工具待确认 |
| disconnected | 微弱电平降调衰减 | 连接中断 |

官方实现均为 0.3 音量的 Audio 元素直通 AudioContext destination；开源替代为振荡器合成（`assets/ClaudeAudioPlayer.ts`）。

## 3. 波形算法参数

```js
analyser.fftSize = 512; analyser.smoothingTimeConstant = 0.5;
analyser.minDecibels = -70; analyser.maxDecibels = -10;
gated      = Math.max(0, rawEnergy - 0.08) / 0.92;
compressed = Math.min(1, Math.pow(gated, 0.7) * 1.5 * bandWeights[b]);
height     = 4 + 20 * compressed;   // 4px–24px
```

## 4. 灯箱全部常数（照抄）

```js
const GESTURE_DEADZONE = 4;      // Math.hypot(dx,dy) < 4 → 手抖
const WHEEL_FACTOR     = 0.01;   // Math.exp(-deltaY * 0.01)
const SNAP_FLOOR       = 1.05;   // ≤1.05 吸附回 1
const CLICK_ZOOM       = 1.25;
const OVERFLOW_DAMP    = 0.7;
const RUNWAY           = 2;      // 跑道前后预载 2 帧
const MIN_MAX_ZOOM     = 2;      // Math.max(naturalWidth / fitWidth, 2)
```
CSS：`.animate-lightbox-backdrop-in{animation:.2s ease-out fade-in}` · `.animate-lightbox-content-in{animation:.25s ease-out scale-in}`。

## 5. object-fit:contain 内切剪裁算法（View Transitions 用）

```
scale = min(availW/nw, availH/nh)（scale-down 再与 1 取小）
renderW = nw×scale, renderH = nh×scale
inset 四向 = (avail − render)/2 + padding，输出为相对 rect 的百分比（保留 3 位小数）
```
圆角提取：向上最多 5 层 DOM，找第一个 `IMG` 或 `overflow:hidden/clip` 且 borderRadius ≠ 0 的祖先，取其 borderRadius。

## 6. 沙箱桥消息协议要点

- 主 → iframe：能力协商、主题注入（`--cds-*` 令牌快照传入驻方）、resize。
- iframe → 主：ready / height 上报 / link 点击代理 / 错误上报；均带 nonce。
- 校验三件套：来源 origin 白名单、消息 schema、`event.userActivation`（系统级 API）。

## 7. Diff 变量

`--diffs-line-add-bg / --diffs-line-del-bg / --diffs-word-add-bg / --diffs-gutter-fg` 等由宿主主题提供；流式高亮逐行 `grapheme-reveal`。
