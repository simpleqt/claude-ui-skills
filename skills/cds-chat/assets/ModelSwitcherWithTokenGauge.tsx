/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React, { useState } from 'react';

/**
 * ==============================================================================
 * Claude Design System (CDS) - ModelSwitcherWithTokenGauge.tsx
 * 
 * 逆向还原自官方 Claude 模型矩阵选择器与 Token 上下文仪表盘 (REA v6.5.0 取证):
 * - `c30db9bec-DjF3pT_h.js` (adaptive thinking deprecation & official models)
 * - `c058e28e3-DXZbxFF9.js` (5m/1h ephemeral prompt cache tokens breakdown)
 * - `shared-3-DnHYUZdJ.js` (effort levels: low, medium, high, max & setDraftEffort)
 * - `frame-shell-chrome-CAw-tYzh.js` (SVG gauge & strokeDashoffset calculation)
 * 
 * 核心生产级工程机制:
 * 1. 官方三大模型梯队架构 (Model Tier Matrix):
 *    - Claude 3.7 Sonnet: 旗舰智能，原生支持自适应深度思考 (adaptive thinking)
 *    - Claude 3.5 Haiku: 极速响应，超高吞吐
 *    - Claude 3 Opus: 终极长程推理与巨构分析
 * 2. 深度思考 (Adaptive Thinking & Effort Level):
 *    支持配置思考配额与 effort 档位 (low / medium / high / max)。
 * 3. Prompt Caching 显存成本解构表:
 *    - cache_read_input_tokens: 命中 5m / 1h 缓存，享受 90% 阶梯折扣
 *    - cache_creation_input_tokens (5m / 1h): 写入热缓存 (1.25x 成本)
 *    - input_tokens: 常规冷启动输入
 *    - output_tokens: 模型流式生成输出
 * 4. 环形 SVG 动态容量仪表盘 (Circular Capacity Gauge):
 *    基于 strokeDashoffset 渲染 200k 窗口饱和度，80% 触发陶土警告色。
 * ==============================================================================
 */

export interface ModelTier {
  id: string;
  name: string;
  tagline: string;
  badge?: string;
  supportsThinking?: boolean;
  maxContext: number; // 如 200000
}

export const AVAILABLE_MODELS: ModelTier[] = [
  {
    id: 'claude-3-7-sonnet-latest',
    name: 'Claude 3.7 Sonnet',
    tagline: '最强智能，支持自适应思考链与全栈系统级编程',
    badge: '旗舰',
    supportsThinking: true,
    maxContext: 200000,
  },
  {
    id: 'claude-3-5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    tagline: '极速响应，专为即时问答与高频流式自动化优化',
    badge: '极速',
    supportsThinking: false,
    maxContext: 200000,
  },
  {
    id: 'claude-3-opus-latest',
    name: 'Claude 3 Opus',
    tagline: '终极深度，专为复杂科学推演与巨型上下文分析设计',
    supportsThinking: true,
    maxContext: 200000,
  },
];

export interface TokenMetrics {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  cacheTtl?: '5m' | '1h';
}

export type ThinkingEffort = 'low' | 'medium' | 'high' | 'max';

export interface ModelSwitcherProps {
  currentModelId?: string;
  onSelectModel?: (model: ModelTier) => void;
  tokenMetrics?: TokenMetrics;
  className?: string;
}

export const ModelSwitcherWithTokenGauge: React.FC<ModelSwitcherProps> = ({
  currentModelId = 'claude-3-7-sonnet-latest',
  onSelectModel,
  tokenMetrics = {
    inputTokens: 14200,
    outputTokens: 3800,
    cacheReadTokens: 42000,
    cacheWriteTokens: 12000,
    cacheTtl: '5m',
  },
  className = '',
}) => {
  const [selectedModelId, setSelectedModelId] = useState(currentModelId);
  const [isOpen, setIsOpen] = useState(false);
  const [thinkingMode, setThinkingMode] = useState<'adaptive' | 'off'>('adaptive');
  const [effortLevel, setEffortLevel] = useState<ThinkingEffort>('high');

  const activeModel = AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  // 计算上下文占用率
  const totalTokens =
    tokenMetrics.inputTokens +
    tokenMetrics.outputTokens +
    tokenMetrics.cacheReadTokens +
    tokenMetrics.cacheWriteTokens;
  const usageRatio = Math.min(1, totalTokens / activeModel.maxContext);
  const usagePercent = Math.round(usageRatio * 100);
  const isNearLimit = usageRatio > 0.8;

  // SVG 环形仪表盘数学模型 (半径 10，周长 2 * PI * 10 ≈ 62.83)
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - usageRatio);

  const handleChooseModel = (model: ModelTier) => {
    setSelectedModelId(model.id);
    onSelectModel?.(model);
    setIsOpen(false);
  };

  return (
    <div
      data-cds="ModelSwitcher"
      className={`relative inline-block text-xs font-sans ${className}`}
    >
      {/* 触发器胶囊 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#2e2e2c)] bg-[var(--cds-surface-1,#faf9f6)] dark:bg-[var(--cds-surface-1,#1c1b1a)] hover:bg-[var(--cds-surface-2,#f0eee9)] dark:hover:bg-[var(--cds-surface-2,#262625)] transition-colors select-none cursor-pointer shadow-2xs"
      >
        <span className="font-semibold text-[var(--cds-text-primary,#1a1a1a)] dark:text-[var(--cds-text-primary,#f0f0f0)]">
          {activeModel.name}
        </span>

        {/* 思考档位指示器 */}
        {activeModel.supportsThinking && thinkingMode === 'adaptive' && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-clay/10 text-clay font-medium">
            Thinking: {effortLevel}
          </span>
        )}

        {/* 微型 SVG 环形容量计量表 */}
        <div className="relative size-4 flex items-center justify-center" title={`上下文占用: ${usagePercent}%`}>
          <svg className="size-4 -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              className="text-neutral-200 dark:text-neutral-700"
            />
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${
                isNearLimit ? 'text-clay animate-pulse' : 'text-emerald-500'
              }`}
            />
          </svg>
        </div>

        <span className={`text-[10px] text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* 弹窗菜单：模型切换 + 思考设置 + Prompt Caching 解构 */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Model switcher and token breakdown"
          className="absolute left-0 mt-2 w-80 rounded-2xl border border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#2e2e2c)] bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1f1e1d)] shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] p-3 space-y-3 z-50 animate-fade select-none"
        >
          {/* 模型矩阵列表 */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold tracking-wider uppercase text-neutral-400 px-1">
              模型矩阵 (Model Tier)
            </div>
            {AVAILABLE_MODELS.map((model) => {
              const isSelected = model.id === selectedModelId;
              return (
                <div
                  key={model.id}
                  onClick={() => handleChooseModel(model)}
                  className={`flex flex-col p-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-clay/10 border border-clay/30'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-semibold ${isSelected ? 'text-clay' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {model.name}
                      </span>
                      {model.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-200/80 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200">
                          {model.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && <span className="text-clay font-bold text-xs">✓</span>}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                    {model.tagline}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 深度思考与 Effort 调节 */}
          {activeModel.supportsThinking && (
            <div className="border-t border-neutral-200/80 dark:border-neutral-800 pt-2.5 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
                  自适应深度思考 (Adaptive Thinking)
                </span>
                <button
                  type="button"
                  onClick={() => setThinkingMode(thinkingMode === 'adaptive' ? 'off' : 'adaptive')}
                  className={`relative w-8 h-4.5 rounded-full transition-colors cursor-pointer ${
                    thinkingMode === 'adaptive' ? 'bg-clay' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white transition-transform ${
                      thinkingMode === 'adaptive' ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {thinkingMode === 'adaptive' && (
                <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg">
                  {(['low', 'medium', 'high', 'max'] as ThinkingEffort[]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setEffortLevel(level)}
                      className={`flex-1 py-1 rounded text-[10px] font-mono capitalize transition-all cursor-pointer ${
                        effortLevel === level
                          ? 'bg-white dark:bg-neutral-700 text-clay font-bold shadow-2xs'
                          : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Prompt Caching 显存成本解构仪表盘 */}
          <div className="border-t border-neutral-200/80 dark:border-neutral-800 pt-2.5 space-y-2">
            <div className="flex items-center justify-between px-1 text-[11px]">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                上下文与缓存解构
              </span>
              <span className="font-mono text-neutral-400 tabular-nums">
                {totalTokens.toLocaleString()} / {(activeModel.maxContext / 1000).toFixed(0)}k
              </span>
            </div>

            {/* 四色比例进度条 */}
            <div className="h-2 w-full rounded-full bg-neutral-200/70 dark:bg-neutral-800 flex overflow-hidden">
              <div
                style={{ width: `${(tokenMetrics.cacheReadTokens / activeModel.maxContext) * 100}%` }}
                className="bg-emerald-500"
                title={`读缓存命中 (90% 折扣): ${tokenMetrics.cacheReadTokens.toLocaleString()} tok`}
              />
              <div
                style={{ width: `${(tokenMetrics.cacheWriteTokens / activeModel.maxContext) * 100}%` }}
                className="bg-sky-500"
                title={`写入热缓存 (${tokenMetrics.cacheTtl || '5m'} TTL): ${tokenMetrics.cacheWriteTokens.toLocaleString()} tok`}
              />
              <div
                style={{ width: `${(tokenMetrics.inputTokens / activeModel.maxContext) * 100}%` }}
                className="bg-clay"
                title={`常规输入: ${tokenMetrics.inputTokens.toLocaleString()} tok`}
              />
              <div
                style={{ width: `${(tokenMetrics.outputTokens / activeModel.maxContext) * 100}%` }}
                className="bg-purple-500"
                title={`生成输出: ${tokenMetrics.outputTokens.toLocaleString()} tok`}
              />
            </div>

            {/* 图例清单 */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1 text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Cache Read (90% off)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-sky-500 shrink-0" />
                <span className="truncate">Cache Write ({tokenMetrics.cacheTtl || '5m'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-clay shrink-0" />
                <span className="truncate">Input Tokens</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">Output Tokens</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
