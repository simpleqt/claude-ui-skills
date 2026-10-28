# 组件规格速查（蒸馏版）

> 蒸馏自《CDS 手册》第二篇与 `assets/` 组件源码头注释。取证基线：Claude Desktop `@ant/desktop v2.37337.1`。

## 1. 按钮官方原生类提取（可对照实现）

外层壳（取证 `shared-frame-BfjMqbuN.js` 的 `Il` 变量）：
```
cds-reset group/btn relative isolate inline-flex shrink-0 items-center justify-center gap-1.5
whitespace-nowrap select-none cursor-[var(--cds-cursor-interactive)] border-0 outline-none
focus-visible:outline-hidden rounded h-control font-sans text-body
transition-shadow duration-fast
```
结构：`Button 外壳（cds-btn-squish）` → `绘景层 [data-cds-part="paint"]（-z-10 背景与内阴影）` + `内容层（Icon+Children+Kbd）` + `微标插槽 [data-cds-part="indicator"]`。

JS 动态按压系数：`pressScale = min(1.5, max(0.5, height × 1/32))`——小按钮细腻、大按钮扎实。

## 2. 分段控件容器查询断点

```
@container (width <= 180px) → 2 项版：非激活项 label display:none + padding:0；激活项 flex:none + px 16px
@container (width <= 254px) → 3 项版：同上
```

## 3. 对话框尺寸表与安全帽公式

```js
const DIALOG_SIZES = { sm:400, md:520, lg:720, xl:880, "2xl":1024, "3xl":1152 }; // px, max-width
```
```css
max-height: calc(100dvh
  - max(2rem, 2 * var(--desktop-titlebar-inset, 0px))
  - 2 * max(env(safe-area-inset-top, 0px), env(safe-area-inset-bottom, 0px)));
```
嵌套虚化：父层 `data-[nested-dialog-open]:blur-[2px]` + 伪元素遮罩 opacity 0→100（200ms ease-out）。

## 4. 附件磁贴官方类提取（取证 `shared-2-Cb74JByF.js` `Yf`）

```
group/tile relative isolate size-[calc(7.5rem*var(--cds-rem-scale,1))] shrink-0
rounded-card outline-none focus-visible:shadow-focus
```
移除按钮（`_p`）：
```
cds-reset absolute -end-2 -top-2 z-[1] inline-flex size-5 items-center justify-center
rounded-full bg-surface-3 text-secondary shadow-card-ring hover:text-primary
outline-none focus-visible:shadow-focus
```

双向中间截断 DOM：
```html
<span class="flex min-w-0 flex-col text-footnote text-primary">
  <bdi class="overflow-hidden break-words [overflow-wrap:anywhere]">{head}</bdi>
  <span class="flex min-w-0 before:shrink-0 before:content-['…']">
    <bdi class="truncate">{tailStem}</bdi>
    <span class="shrink-0 font-medium">{.ext}</span>
  </span>
</span>
```

## 5. 下拉菜单 / Popover 行规约

- 菜单项 hover：4px 圆角轻量高亮胶囊（`--radius-sm`），图标与快捷键同步点亮。
- 菜单分组隔离用 `border-t` 单向细线，禁止组内套框。
- 弹出动画 `motionPopover`；定位层投影 `--cds-shadow-popover`。

## 6. Kbd 快捷键徽章

mono 10–11px / wght 580（暗色 550）/ `--radius-sm` 4px / 阴影衬底 / `tabular-nums`。

## 7. 各组件与 assets 对应表

| 规范域 | 资产 |
| --- | --- |
| 按钮 | `assets/CdsButton.tsx` |
| 分段控件 | `assets/SegmentedControl.tsx` |
| 状态灯/骨架/思考点 | `assets/StatusIndicators.tsx` |
| 模态对话框 | `assets/ConfirmationDialog.tsx` |
| 附件磁贴/行内胶囊 | `assets/AttachmentCard.tsx` |
| 代码块 | `assets/CodeBlock.tsx` |
| Tailwind 语义类映射 | `../cds-foundation/assets/tailwind.config.js` |
