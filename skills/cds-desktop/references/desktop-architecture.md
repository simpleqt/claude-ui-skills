# 桌面架构参数速查（蒸馏版）

> 蒸馏自《CDS 手册》第六篇（取证：app.asar / mainWindow.js / index.chunk-CiiI592G.js / shared-19-DmuztgN-.js / shared-21-CGGmSsMS.js / shared-6-zKKz0bS2.js / shared-50-Bmc9oUMm.js / cd5a31703-B4nKQMBN.js / c6a992d55-sXiDGMFQ.css）。

## 1. 红绿灯几何与避让

```js
const TRAFFIC_LIGHT_DIAMETER = 12;    // px
const TRAFFIC_LIGHT_BASELINE = 16.5;  // 33/2，45px 顶栏物理中心线
const trafficLightPosition = (zoom) => {
  const r = 6;
  const calc = (p) => Math.max(0, Math.round((p + r) * zoom - r));
  return { x: calc(16.5), y: calc(16.5) };
};
```
Web 内容避让：
```js
inset       = isMac && !isFullscreen ? 45 : isDesktop ? 36 : 0;   // incognito 桌面 45
spacerWidth = isMac && !isFullscreen ? Math.round(74 / Math.min(zoom, 1)) : 0;
```

## 2. 窗口工厂关键序列

1. `new BrowserWindow({ titleBarStyle:"hidden", titleBarOverlay:false, trafficLightPosition, backgroundColor: nativeTheme.shouldUseDarkColors ? "#151515" : "#fcfcfb", show:false })`
2. `new WebContentsView({ webPreferences:{ sandbox:true } })`；`setBackgroundColor("#00000000")`；`addChildView`
3. 圆角监听：`isMaximized() || isFullScreen() ? 0 : 8`
4. vibrancy：宿主层开原生材质，内容视图保持透明。

## 3. 侧栏拖拽拓扑

- 死区：`Math.hypot(dx, dy) >= 4` 才算拖拽（与灯箱共用常数）。
- 持久化：`pinnedOrder: string[]`（会话 id 顺序数组）。
- 占位线/幽灵投影：微倾斜投影（`--cds-shadow-lg` 变体）+ 2px 对撞指示线。

## 4. Broker-Replica 多窗口（架构参考）

- 权威单点 Broker 持有状态，各窗口 Replica 通过 `ReplicaWriter` 快照流订阅。
- 工作区挂载冲突仲裁：`baseline-mismatch` 时以 Broker 快照为准重放。
- 同源轻量场景用 `BroadcastChannel` 即可，无需 Broker。

## 5. 流式大文本视口（对话滚动容器）

- 追加 chunk 后按「40px 底部容差 + 150ms 冷却」决定是否跟随（见 cds-chat）。
- 长列表虚拟化：只保持视口 ± 缓冲区 DOM，滚动位置用相对锚点（第一条可见消息 id + offset）恢复。

## 6. 退避状态机（取证 shared-50-Bmc9oUMm.js）

```js
MIN_RETRY_DELAY = 5000; MAX_RETRY_DELAY = 600000;
backoff = Math.max(base, 5000) * 2 ** (attempt - 1);   // 封顶 600000
isOverload = status === 429 || (status === 503 && type === "overloaded_error");
nextAttempt = isOverload ? attempts + 1 : 0;
canAutoRetry = nextAttempt > 0 && nextAttempt < 3;      // 上限 3 次
retryAtMs = Date.now() + backoff;                       // 驱动 UI 倒计时
```

## 7. 资产对应表

| 能力 | 资产 |
| --- | --- |
| 主窗口工厂 | `assets/createClaudeMainWindow.ts` |
| 沉浸式顶栏 | `assets/ClaudeDesktopHeader.tsx` |
| 侧栏拖拽重排 | `assets/DraggableSessionList.tsx` |
| Cowork 多 Agent 画布 | `assets/CoworkAgentCanvas.tsx` |
| 容器查询响应栏 | `assets/ContainerResponsiveBar.tsx` |
| 焦点漫游 Hook | `assets/useClaudeRovingFocus.ts` |
| 限流退避 Hook | `assets/useRateLimitBackoff.ts` |
| 动效调度引擎 | `assets/CdsMotionEngine.tsx` |
| 推理氛围光效 | `assets/ReasoningAmbientGlow.tsx` |
