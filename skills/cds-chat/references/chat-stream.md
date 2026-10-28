# 会话流规格速查（蒸馏版）

> 蒸馏自《CDS 手册》第三篇（取证：frame-shell-chrome / shared-2 / shared-frame / cb6930dae / c058e28e3 / c05b96c7f）。

## 1. 气泡令牌组（cds-theme.css 已内置）

```css
--cds-message-bubble-radius: calc(var(--cds-radius, 8px) + calc(.25rem * var(--cds-rem-scale, 1)));
--cds-message-bubble-pad-x: 16px;   --cds-message-bubble-pad-y: 12px;
--cds-message-bubble-measure: 85%;
--cds-message-bubble-stack-gap: 4px;      /* 连续气泡堆叠 */
--cds-message-bubble-radius-meeting: 4px; /* 相邻角收角 */
--cds-message-bubble-join-gap: min(8px, pad-y);
--cds-assistant-message-text-inset: 4px;
--cds-assistant-message-text-stop: clamp(0px, (100% - 384px) * .175, 56px);
/* 版心节奏 */
--chat-gutter: 32px; --chat-body: calc(.875rem * scale); --chat-leading: 1.42857;
--chat-turn-gap: calc(body × leading × .75);  /* ≈15px @14px */
--chat-item-gap: calc(body × leading × .5);   /* ≈10px */
```

助手正文嵌套结构化卡片时 inset/stop 归零的选择器组：`[data-cds=Card/Surface/Panel/Banner/Aside/Accordion/PreviewCard/Table/DataTable/AskUserQuestion/CommentCard/ChartContainer/PointChartContainer/FileDiff/UserMessage]`。

用户气泡悬浮反应（hover 时背景微加深）：`.feed-bubble-reacts:has(…):hover` 注入 `--cds-bg-user-message: var(--cds-bg-neutral-hover)`。

## 2. WebKit IME 守卫官方算法（取证 shared-frame-BfjMqbuN.js）

```
Lm() = /Apple Computer/.test(navigator.vendor)          // WebKit 判定
Rm(e) → Fm = e.timeStamp                                 // 记录 compositionend 时刻
Bm(e):
  1. isComposing || keyCode===229 → 拦截
  2. WebKit 且 |e.timeStamp - Fm| < 500 且是 Enter → 拦截（meta/ctrl 放行）
     并把该事件加入 Im 集合
Um(e): 对 Im 中事件在 capture 阶段监听 beforeinput/keydown/keyup/compositionstart/focusout，
     beforeinput.inputType ∈ {insertParagraph, insertLineBreak} → preventDefault
```
镜像降级幽灵层（不支持 field-sizing 时）：
```html
<div class="pointer-events-none invisible min-w-px overflow-y-auto font-sans break-words
     whitespace-pre-wrap select-none [@supports_(field-sizing:content)]:hidden">{value}&#x200B;</div>
```

## 3. @提及词法引擎（取证 cb6930dae-BD0W5ZM9.js）

```js
const INLINE_CODE = /`([^`\n]+)`/g;                 // 排除段
const MENTION     = /(?<=^|\s)@([^\s`]+)/g;         // @ 捕获
const TRAILING_PUNCT = /[.,;:!?'"\u3001\u3002\uFF0C\uFF1B\uFF1A\uFF01\uFF1F\u2026]+$/; // CJK 标点剥离
const FILE_EXT   = /\.[a-z][^/]*$/i;
const MAX_PATH   = 1024, MAX_FILE_REFS = 256;       // 熔断
```

## 4. Token 计量模型（取证 c058e28e3-DXZbxFF9.js）

- 热缓存两档：`ephemeral_5m_input_tokens`（300,000ms）/ `ephemeral_1h_input_tokens`（3,600,000ms）。
- 四色：cache_read 0.1x · cache_creation 1.25x · input 1x · output 1x（紫罗兰）。
- 仪表环：r=10 → C=62.83；`stroke-dashoffset = C × (1 - usage)`；>80% (`total > maxWindow × .8`) 报警色。

## 5. MCP 授权卡（取证 c05b96c7f-DklIyA-P.js / cc1aae219-DjR8LnUv.js）

- pending 态边框 `border-[var(--cds-border-accent)]/50` + 入参 JSON 树。
- 白名单 GC：`clientAckedAtMs` 超 330,000ms（330s）自动删除；容量满按序淘汰。
- 判决集：`user_denied`（返回 `{is_error:true, error_text:"User denied tool execution"}`）· `policy_denied` · `PERMISSIONS_ERROR`。

## 6. 流式渲染细节

- 图元晕染：`blur(6px)→0 + opacity` 0.35s easeOut（既适用于整块也适用于逐段）。
- 消息块整体入场：`timeline-block-enter`（.3s `--cds-ease-enter`，blur 4px + scale .9 + y 5px，30% 处先就位再显影）。
- 复制成功反馈：勾选 2.5s 衰减（`saved-check-decay`：75% 保持 → scale .92 + fade）。
- 朗读高亮（如接 TTS）：当前词 `.cds-read-aloud-active`，听写用前缀差分 delta（只发射新增文本，避免光标闪烁）。

## 7. 资产对应表

| 能力 | 资产 |
| --- | --- |
| 核心输入框 | `assets/ChatComposer.tsx` |
| 输入框下巴/建议条 | `assets/ChatComposerChin.tsx` |
| 消息气泡双态 | `assets/ChatMessageBubbles.tsx` |
| 思考折叠状态机 | `assets/ThinkingAccordion.tsx` |
| 富文本+提及+500ms 守卫完整版 | `assets/RichComposerWithMentions.tsx` |
| 模型切换+Token 仪表 | `assets/ModelSwitcherWithTokenGauge.tsx` |
| 算力 effort 调节器 | `assets/ModelSelectorEffort.tsx` |
| MCP 授权卡 | `assets/McpToolDecisionCard.tsx` |
| 滚动图钉 Hook | `assets/useClaudeScrollPinning.ts` |
| 渐隐遮罩容器 | `assets/ScrollFadeContainer.tsx` |
