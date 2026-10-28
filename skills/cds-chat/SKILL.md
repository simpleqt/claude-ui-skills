---
name: cds-chat
description: >-
  CDS 会话核心流——聊天输入框 Composer（CJK 输入法守卫 + WebKit 500ms 防误发）、消息气泡、思考折叠、
  流式渲染与滚动图钉、模型切换器与 Token 仪表、MCP 工具授权卡、@提及富文本引擎。
  Use whenever building a chat interface, chatbot conversation stream, message bubbles, AI streaming output,
  thinking/reasoning accordion, composer/input box, or tool-approval cards in a Claude-style UI;
  when the user mentions 聊天界面/对话流/输入框/消息气泡/流式输出/思考折叠/模型切换/IME 误发送.
---

# CDS 会话核心流与指令引擎

`assets/` 有 10 个生产组件/Hook（React 18 + TS）。令牌与动效前置：cds-foundation、cds-motion。

## 1. 聊天输入框 ChatComposer（assets/ChatComposer.tsx）

- 圆角 20px（`--cds-radius-composer`），表面 Surface-3，三态阴影链（常态/hover/focus-within，见 cds-foundation）。
- 高度自适应：`field-sizing: content`（min 48px，max `min(40svh, 384px)`）；不支持时用隐藏镜像层降级。
- **IME 合成守卫（中文/日文输入法必做，否则回车选词会误发送消息）**——两阶防护：

```tsx
const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  // 一阶：标准合成标志 + 229 键码
  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
  // 二阶：WebKit 500ms 虚假回车守卫（合成结束 500ms 内的 Enter 是输入法确认键，强行拦截）
  if (isWebKit && (e.key === 'Enter' || e.keyCode === 13)
      && Math.abs(e.timeStamp - lastCompositionEndTime) < 500) {
    lastCompositionEndTime = -1;
    e.preventDefault();
    return;
  }
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
};
```

  Claude 官方还在 capture 阶段拦截 `beforeinput` 的 `insertParagraph`/`insertLineBreak`（完整实现见 RichComposerWithMentions）。
- 结构纪律：输入区与底部工具栏之间 `border-t` 单向细线；工具栏按钮全部 ghost（无边框）——单闭合边框原则。
- 底部可选 `ChatComposerChin.tsx`（2.0 的下巴扩展条：建议 prompt 胶囊容器）。

## 2. 消息气泡 ChatMessageBubbles（assets/ChatMessageBubbles.tsx）

**哲学：用户消息装进气泡，AI 回答裸奔在画布上（零边框透明画布）**——不要给助手回复加边框卡片。

- 用户气泡：圆角 `calc(--cds-radius + .25rem × scale)`（默认 12px，桌面加大 18px），padding 16/12px，版心 `max-width: 85%`（窄屏降 `clamp(85%, 448px, 100%)`），背景 `--cds-bg-user-message`（中性 5% 灰；个人版淡蓝 `#dde8f7`/深色 `#193c5f`）。
- 超长折叠：高 > 300px → `max-height:300px` + 底部 3rem 渐变蒙版 + Show more/less。
- 助手正文：`--cds-assistant-message-text-inset: 4px` 微缩进与 ✦ 徽标光学对齐；`--cds-assistant-message-text-stop: clamp(0px, (100% - 384px) × .175, 56px)` 止动。**正文内一旦出现结构化卡片（Card/CodeBlock/Table/MCP 卡…）两者立即归零**，卡片充满版心。
- 纵向节奏：`turn-gap = body × leading × 0.75`（14px 正文 ≈15px），`item-gap = × 0.5`（≈10px），`--chat-gutter: 32px`。
- 入场动画 `motionUserBubbleEnter` / `motionMessageFadeUp`；气泡连排 stack-gap 4px，连续消息 join 时相邻角收 4px。

## 3. 思考折叠 ThinkingAccordion（assets/ThinkingAccordion.tsx）

- 四态状态机：Generating（三点波浪 + 展开互斥锁锁定防抖动）→ Settled → Collapsed ⇄ Expanded。
- 展开用 **CSS Grid `0fr↔1fr`**（`.2s --cds-ease-expand`），禁止 JS 测 scrollHeight。
- 思考日志：mono 11.5~12px、弱灰、无背景包裹；触发行 "Thought for 5.2s" 12px/medium + 计时器 `tabular-nums`。
- 状态行交接用 rise/fall 升降动画，不生硬显隐。

## 4. 流式输出与滚动视口（assets/useClaudeScrollPinning.ts + ScrollFadeContainer.tsx）

- **图元晕染流式**：新文字 `blur(6px) + opacity 0 → 清晰`（.35s，`motionGraphemeReveal`），不是打字机逐字闪现。
- **滚动防抢夺图钉（150ms 冷却锁）**——流式吐字期间用户上滚看历史时严禁强行拉回底部：

```ts
const shouldAutoScroll = () => {
  const withinBottom = scrollHeight - scrollTop - clientHeight <= 40; // 40px 底部容差
  const cooldownOver = performance.now() - lastUserScrollTimestamp.current > 150;
  return withinBottom && cooldownOver;
};
```

- 视口边缘渐隐：`ScrollFadeContainer`（7 档非线性遮罩 + scroll-driven，28px；见 cds-motion）。

## 5. 模型切换与 Token 仪表（assets/ModelSwitcherWithTokenGauge.tsx + ModelSelectorEffort.tsx）

- 模型矩阵：Sonnet（旗舰）/ Haiku（极速）/ Opus（深推理）；思考架构用 `thinking.type=adaptive`（enabled 已弃用）。
- effort 档位：`low / medium / high / xhigh / max`，max 带超额 token 警示文案。
- Token 四色显存条：翡翠绿 cache_read（0.1x）· 天空蓝 cache_creation（1.25x，5m/1h 两档热缓存）· 陶土橙 input · 紫罗兰 output。
- 环形 SVG 容量计：`r=10`，周长 62.83，`dashoffset = 周长 × (1 - usage)`；占用 > 80% 变陶土报警色 + 脉冲。

## 6. MCP 工具授权卡 McpToolDecisionCard（assets/McpToolDecisionCard.tsx）

- 安全准则：**高副作用操作强制人工审批，只读平滑授权**。
- 三态生命周期：`pending_approval`（陶土半透明光晕边框 + 入参 JSON 树审查）→ `running`（转动指示灯 + 控制台流捕获）→ `success/error`（终态徽标）。
- 三按钮阵列：单次批准（陶土主按钮）/ 始终允许（签名写入白名单，330s 垃圾回收）/ 拒绝（红色 ghost；返回 `user_denied` 促使模型反思）。

## 7. @提及与斜杠指令 RichComposerWithMentions（assets/RichComposerWithMentions.tsx）

- `@` 触发文件提及：正则 `(?<=^|\s)@([^\s`]+)`，剥离中日韩全角尾随标点，路径上限 1024 字符，**256 个文件引用熔断**。
- 行内代码段 `` `…` `` 排除解析；Markdown 链接 `](` 段落跳过。
- 提及以上下文胶囊（无边框 chip）呈现在 Composer 行内。

## 自检

- [ ] Enter 发送已含 isComposing + 229 + WebKit 500ms 三重守卫
- [ ] 助手回复无边框；用户气泡 85% 版心
- [ ] 流式期间滚动不会被抢夺回底部
- [ ] 思考折叠是 Grid 0fr↔1fr，生成中锁定展开
- [ ] 数字计时带 tabular-nums；Token 仪表四色语义正确
