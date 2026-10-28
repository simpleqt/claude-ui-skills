/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
/**
 * Claude Design System (CDS) - Segmented Control & Pills
 * 
 * 逆向溯源：依据 REA v6.5.0 对 Claude Desktop 生产环境 (shared-styles-Bl9zqrv-.css / shared-frame-CegduNQ2.css)
 * 提取的 .df-pills[data-segmented] 完整轨道与滑动指示器规范。
 * 
 * 核心规范：
 *   - 轨道外壳：严格 1px 内边距 (padding: 1px)
 *   - 滑动指示器：top: 1px, bottom: 1px, border-radius: calc(var(--cds-radius) - 1px)
 *   - 纯几何等分滑动指示器公式：
 *       left = calc(1px + activeIndex * (100% - 2px) / total)
 *       width = calc((100% - 2px) / total)
 *   - 双断点容器查询防御：
 *       @container (width <= 180px) 对 2 项分段控制器折叠未激活项文本
 *       @container (width <= 254px) 对 3 项分段控制器折叠未激活项文本
 *   - 物理双层弥散投影：inset 0 0 0 .5px var(--cds-border), 0 1px 2px #0000000f, 0 2px 6px -1px #0000000d
 *   - 磁吸时序：120ms 缓动 (var(--cds-dur-snap) var(--cds-ease-snap))
 */

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface SegmentedTabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface SegmentedControlProps {
  tabs: (string | SegmentedTabItem)[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number, index: number) => void;
  size?: "sm" | "md";
  className?: string;
  useFramerMotion?: boolean;
}

export function SegmentedControl({
  tabs,
  value,
  defaultValue,
  onChange,
  size = "md",
  className = "",
  useFramerMotion = true,
}: SegmentedControlProps) {
  const normalizedTabs: SegmentedTabItem[] = tabs.map((tab, idx) =>
    typeof tab === "string" ? { id: String(idx), label: tab } : tab
  );

  const [internalIndex, setInternalIndex] = useState(() => {
    if (defaultValue !== undefined) {
      const idx = normalizedTabs.findIndex((t) => t.id === defaultValue || t.label === defaultValue);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const activeIndex =
    value !== undefined
      ? normalizedTabs.findIndex((t) => t.id === value || t.label === value)
      : internalIndex;

  const handleSelect = (idx: number) => {
    if (value === undefined) {
      setInternalIndex(idx);
    }
    const selectedTab = normalizedTabs[idx];
    onChange?.(selectedTab.id, idx);
  };

  const isSmall = size === "sm";

  return (
    <div
      data-cds="SegmentedControl"
      data-segmented=""
      data-pills={normalizedTabs.length}
      className={`df-pills relative rounded-full select-none flex items-stretch p-[1px] transition-colors ${
        isSmall ? "h-7 text-xs" : "h-8 text-xs"
      } ${className}`}
      style={{
        backgroundColor: "var(--cds-segmented-track, rgba(0, 0, 0, 0.06))",
        containerType: "inline-size",
      }}
      role="tablist"
    >
      {/* 1. 原生纯几何定位滑动指示器 */}
      {!useFramerMotion ? (
        <div
          className="df-pill-indicator absolute top-[1px] bottom-[1px] rounded-full bg-white dark:bg-[#2c2c2a] pointer-events-none transition-all duration-[var(--cds-dur-snap)] ease-[var(--cds-ease-snap)] will-change-transform"
          style={{
            left: `calc(1px + ${activeIndex} * (100% - 2px) / ${normalizedTabs.length})`,
            width: `calc((100% - 2px) / ${normalizedTabs.length})`,
            boxShadow:
              "inset 0 0 0 0.5px var(--cds-border, rgba(0,0,0,0.08)), 0 1px 2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.05)",
          }}
        />
      ) : null}

      {/* 2. 标签项渲染 */}
      {normalizedTabs.map((tab, idx) => {
        const isActive = activeIndex === idx;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-active={isActive ? "" : undefined}
            onClick={() => handleSelect(idx)}
            className={`df-pill relative z-10 flex-1 h-full flex items-center justify-center gap-1.5 px-3 rounded-full transition-colors truncate font-control ${
              isActive
                ? "text-neutral-900 dark:text-white font-medium"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 font-normal"
            }`}
          >
            {/* Framer Motion 物理弹簧滑块 */}
            {useFramerMotion && isActive && (
              <motion.div
                layoutId="cds-segmented-active-thumb"
                className="absolute inset-0 rounded-full bg-white dark:bg-[#2c2c2a] -z-10"
                style={{
                  boxShadow:
                    "inset 0 0 0 0.5px var(--cds-border, rgba(0,0,0,0.08)), 0 1px 2px rgba(0,0,0,0.06), 0 2px 6px -1px rgba(0,0,0,0.05)",
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}

            {tab.icon && (
              <span className="shrink-0 flex items-center justify-center text-current">
                {tab.icon}
              </span>
            )}

            {/* 容器查询自适应文本：2项在<=180px折叠，3项在<=254px折叠 */}
            <span
              className={`df-pill-label truncate ${
                normalizedTabs.length === 2
                  ? "@[max-width:180px]:hidden"
                  : "@[max-width:254px]:hidden"
              }`}
            >
              {tab.label}
            </span>

            {tab.badge !== undefined && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-neutral-200/60 dark:bg-neutral-700 text-[10px] font-mono leading-tight tabular-nums">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
