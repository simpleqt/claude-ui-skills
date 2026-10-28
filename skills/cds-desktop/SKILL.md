---
name: cds-desktop
description: >-
  CDS 桌面宿主架构——Electron 窗口工厂（macOS 毛玻璃 vibrancy、红绿灯避让、WebContentsView 解耦）、
  侧边栏拖拽重排、Cowork 多 Agent 协作画布、容器查询响应栏、WAI-ARIA 焦点漫游、429/503 指数退避。
  Use whenever building an Electron desktop shell, frameless/vibrancy window, titlebar with traffic-light avoidance,
  drag-and-drop sidebar reordering, multi-agent dashboard, responsive bars via container queries,
  keyboard grid navigation, or API rate-limit retry logic for a Claude-style app;
  when the user mentions 桌面端/Electron/毛玻璃/侧边栏拖拽/多 Agent 看板/限流重试/无障碍焦点.
---

# CDS 桌面架构与协作拓扑

`assets/` 有 9 个生产模块（Electron 31 + React 18）。令牌/动效前置：cds-foundation、cds-motion。

## 1. Electron 主窗口工厂（assets/createClaudeMainWindow.ts）

- `titleBarStyle: "hidden"` + `trafficLightPosition` 红绿灯**逆缩放几何补偿**：直径 12px、基线 16.5px，`calc(pos) = max(0, round((pos + 6) × zoom − 6))`。
- **背景色按原生主题预置**（dark `#151515` / light `#fcfcfb`），彻底消除首帧白闪；`show: false` + ready-to-show 再显示。
- 宿主 BrowserWindow + 子 `WebContentsView` 解耦：内容视图 `setBackgroundColor("#00000000")` 100% 透明穿透，承载 macOS **vibrancy 毛玻璃**。
- 动态圆角：窗口化 8px 圆角，最大化/全屏归 0（监听 maximize/unmaximize/enter-full-screen/leave-full-screen），防黑边锯齿。
- macOS vibrancy 侧栏：原生材质置于宿主层，Web 层透明即可透出。

## 2. 沉浸式顶栏（assets/ClaudeDesktopHeader.tsx + 74px 避让）

- 标题栏高度 inset：macOS 45px（红绿灯物理中心线）；Web 侧红绿灯**占位宽 74px**，且随 zoom 逆缩放 `round(74 / min(zoom,1))`；全屏时动态归零。
- 拖拽区：`.cds-desktop-drag-strip { height: var(--desktop-titlebar-inset, 45px); -webkit-app-region: drag }`，仅 Electron 宿主 `@supports` 生效。
- 可交互控件必须加 `.draggable-none`（`app-region: no-drag`），否则点击被拖拽吞掉。

## 3. 侧边栏会话拖拽重排（assets/DraggableSessionList.tsx）

- **4px 指针死区**过滤手抖（与灯箱同一物理常数）；越过死区才进入拖拽态。
- 乐观拓扑重排：立即应用新顺序再持久化 `pinnedOrder: string[]`。
- 拖拽视觉：幽灵投影微倾斜 + 对撞占位线（drop indicator）；松手用 `SPRING_HEAVY_SNAP`（1200/80 过阻尼）绝对咬合归位。

## 4. Cowork 多 Agent 画布（assets/CoworkAgentCanvas.tsx）

- 多智能体任务委派状态机（idle → queued → running → done/error）+ 共享工件网格资产池。
- 跨会话/跨窗口同步用 `BroadcastChannel` 事件广播（同源多窗口无主从锁）。
- 网格看板遵循 Surface 阶梯与卡片 hover 抬升规范（cds-foundation）。

## 5. 容器查询响应栏（assets/ContainerResponsiveBar.tsx）

**用容器查询（`@container`），不用窗口媒体查询**——侧栏宽度变化时窗口没变，`@media` 会严重畸变。4 阶收缩策略（宽度递减逐级：换图标 → 收标签 → 折叠成菜单 → 纵向），CJK 防裂字组合 `overflow-wrap:anywhere + word-break:normal`。

## 6. 键盘焦点漫游（assets/useClaudeRovingFocus.ts）

W3C WAI-ARIA roving tabindex：方向键在网格/列表内移动焦点（`aria-activedescendant` 模式），Home/End 跳首尾，Tab 逃离组件，焦点记忆最后位置。适用于消息操作栏、模型列表、Cowork 网格。

## 7. 限流退避 useRateLimitBackoff（assets/useRateLimitBackoff.ts）

429/503(overloaded) 自动重试状态机：

```
delay = max(retryAfterMs, 5000) × 2^(attempt−1)，封顶 600,000ms（10min）
自动重试上限 3 次；超过强制切手动点击重试（防雪崩放大）
canAutoRetry / retryAtMs / waitsInARow 对外暴露，驱动 UI 倒计时
```
全抖动（full jitter）可选叠加。非限流错误不自动重试（`nextAttempt = 0`）。

## 8. 推理氛围光效（assets/ReasoningAmbientGlow.tsx + CdsMotionEngine.tsx）

- `wl-glow`（1.8s）/`wl-halo`（2.2s）陶土 `color-mix` 呼吸光晕，仅 `prefers-reduced-motion: no-preference` 时启用。
- 扫光/绘制/退场关键帧（`epitaxy-*`）统一由 CdsMotionEngine 调度。

## 自检

- [ ] 无白闪（主题预置背景色 + 延迟 show）
- [ ] 拖拽区内的按钮都有 no-drag
- [ ] 响应式走容器查询而非窗口媒体查询
- [ ] 重试有 3 次上限与 10min 封顶；UI 显示倒计时而非静默循环
- [ ] 网格组件有 roving focus，不只靠 Tab 顺序
