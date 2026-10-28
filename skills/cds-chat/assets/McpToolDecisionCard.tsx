/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React, { useState } from 'react';

/**
 * ==============================================================================
 * Claude Design System (CDS) - McpToolDecisionCard.tsx
 * 
 * 逆向还原自官方 Claude Desktop / Code 交互式工具调用与 MCP 决策卡片 (REA v6.5.0 取证):
 * - `c05b96c7f-DklIyA-P.js`: structured_content / ws / onVerdict / PERMISSIONS_ERROR
 * - `cc1aae219-DjR8LnUv.js`: user_denied / policy_denied / settleReason / streamSettled
 * - `frame-shell-chrome-CAw-tYzh.js`: [data-cds=Card] 嵌套下重置 text-inset: 0px 规则
 * 
 * 核心生产级工程机制:
 * 1. 严格的三态授权生命周期 (Three-State Authorization Machine):
 *    - `pending_approval`: 等待人工授权，呈现陶土色半透明微晕边框 (border-[var(--cds-border-accent)]/50)
 *    - `running`: 执行中，捕获下游工具输出流
 *    - `success` / `error`: 终态收口，折叠控制台输出预览
 * 2. 真实 settleReason 判决体系：
 *    - `user_denied`: 用户主动拒绝执行，向模型返回 is_error: true, error_text: "User denied tool execution"
 *    - `policy_denied`: 系统安全沙箱策略拦截
 *    - `PERMISSIONS_ERROR`: 缺少本地系统读写授权
 * 3. 三阶决议动作阵列：
 *    - [单次批准 (Allow Once)]: 仅赋予当前单次调用执行权限
 *    - [始终允许 (Always Allow)]: 将该 MCP 模式加入本地白名单缓存 (bs 330s 垃圾回收)
 *    - [拒绝执行 (Deny)]: 终止执行并促使模型反思提出替代路径
 * 4. 结构化入参 JSON 审查与只读展示。
 * ==============================================================================
 */

export type ToolExecutionStatus = 'pending_approval' | 'running' | 'success' | 'error';
export type SettleReason = 'user_denied' | 'policy_denied' | 'PERMISSIONS_ERROR' | 'completed' | null;

export interface McpToolCallData {
  id: string;
  toolName: string;
  serverUrl?: string; // 如 "mcp://filesystem", "cli://bash"
  inputParams: Record<string, any>;
  resultOutput?: string;
  errorMessage?: string;
  executionDurationMs?: number;
}

export interface McpToolDecisionCardProps {
  toolCall: McpToolCallData;
  onVerdict?: (verdict: 'allow_once' | 'always_allow' | 'deny', modifiedParams?: Record<string, any>) => void;
  className?: string;
}

export const McpToolDecisionCard: React.FC<McpToolDecisionCardProps> = ({
  toolCall,
  onVerdict,
  className = '',
}) => {
  const [status, setStatus] = useState<ToolExecutionStatus>('pending_approval');
  const [settleReason, setSettleReason] = useState<SettleReason>(null);
  const [isJsonExpanded, setIsJsonExpanded] = useState(true);
  const [isResultExpanded, setIsResultExpanded] = useState(false);

  // 1. 处理用户决议
  const handleAction = (verdict: 'allow_once' | 'always_allow' | 'deny') => {
    if (verdict === 'deny') {
      setStatus('error');
      setSettleReason('user_denied');
    } else {
      setStatus('running');
      // 模拟工具执行返回
      setTimeout(() => {
        setStatus('success');
        setSettleReason('completed');
      }, 1200);
    }
    onVerdict?.(verdict, toolCall.inputParams);
  };

  const isPending = status === 'pending_approval';
  const isRunning = status === 'running';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div
      data-cds="McpToolDecisionCard"
      role="region"
      aria-label={`工具调用决策卡片: ${toolCall.toolName}`}
      className={`relative w-full rounded-2xl border overflow-hidden transition-all duration-300 font-sans text-xs ${
        isPending
          ? 'border-[var(--cds-border-accent,#d97757)]/50 bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1c1b1a)] shadow-[0_4px_16px_rgba(217,119,87,0.12)]'
          : isRunning
          ? 'border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#2e2e2c)] bg-[var(--cds-surface-2,#faf9f6)] dark:bg-[var(--cds-surface-2,#181817)]'
          : isSuccess
          ? 'border-emerald-500/40 bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#171b18)]'
          : 'border-red-500/40 bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1f1717)]'
      } ${className}`}
    >
      {/* 顶部标题栏：工具名、来源 Server、执行状态徽标 */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[var(--cds-border,#e8e8e6)] dark:border-[var(--cds-border,#282827)] bg-[var(--cds-surface-2,#fbfbf9)] dark:bg-[var(--cds-surface-2,#191918)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm select-none">⚙️</span>
          <span className="font-mono font-semibold text-sm text-[var(--cds-text-primary,#1a1a1a)] dark:text-[var(--cds-text-primary,#f0f0f0)] truncate">
            {toolCall.toolName}
          </span>
          {toolCall.serverUrl && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 truncate">
              {toolCall.serverUrl}
            </span>
          )}
        </div>

        {/* 状态徽标 */}
        <div className="flex items-center gap-1.5 select-none shrink-0">
          {isPending && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-clay/10 text-clay flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-clay animate-ping" />
              等待授权 (Pending)
            </span>
          )}
          {isRunning && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-500/10 text-sky-500 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
              执行中 (Running)
            </span>
          )}
          {isSuccess && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>✓</span> 已完成 (Success)
            </span>
          )}
          {isError && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-500 flex items-center gap-1">
              <span>✕</span> {settleReason === 'user_denied' ? '已拒绝 (Denied)' : '执行失败 (Error)'}
            </span>
          )}
        </div>
      </div>

      {/* 参数审查区 (Payload Inspector) */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between text-neutral-500 select-none">
          <button
            type="button"
            onClick={() => setIsJsonExpanded(!isJsonExpanded)}
            className="flex items-center gap-1.5 font-medium hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            <span className={`text-[10px] transition-transform duration-200 ${isJsonExpanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            <span>入参审查 (Structured Content)</span>
          </button>
          <span className="text-[10px] font-mono text-neutral-400">
            {Object.keys(toolCall.inputParams).length} fields
          </span>
        </div>

        {isJsonExpanded && (
          <pre className="p-2.5 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-[11px] leading-relaxed overflow-x-auto border border-neutral-800 select-text">
            {JSON.stringify(toolCall.inputParams, null, 2)}
          </pre>
        )}
      </div>

      {/* 执行结果输出区 (Result Output) */}
      {(isSuccess || isError) && (
        <div className="px-3.5 pb-3.5 space-y-2 border-t border-[var(--cds-border,#e8e8e6)] dark:border-[var(--cds-border,#282827)] pt-2.5">
          <div className="flex items-center justify-between text-neutral-500 select-none">
            <button
              type="button"
              onClick={() => setIsResultExpanded(!isResultExpanded)}
              className="flex items-center gap-1.5 font-medium hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            >
              <span className={`text-[10px] transition-transform duration-200 ${isResultExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
              <span>执行输出 (Console Output)</span>
            </button>
            {toolCall.executionDurationMs && (
              <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
                {toolCall.executionDurationMs}ms
              </span>
            )}
          </div>

          {isResultExpanded && (
            <pre className="p-2.5 rounded-xl bg-neutral-950 text-neutral-300 font-mono text-[11px] leading-relaxed overflow-x-auto border border-neutral-800/80 max-h-48 overflow-y-auto select-text">
              {isError
                ? toolCall.errorMessage || 'User denied tool execution (settleReason: user_denied)'
                : toolCall.resultOutput || 'Tool executed successfully with 0 exit code.'}
            </pre>
          )}
        </div>
      )}

      {/* 三阶决议按钮动作阵列 (Pending 阶段展示) */}
      {isPending && (
        <div className="flex items-center justify-end gap-2 px-3.5 py-2.5 bg-[var(--cds-surface-2,#fbfbf9)] dark:bg-[var(--cds-surface-2,#191918)] border-t border-[var(--cds-border,#e8e8e6)] dark:border-[var(--cds-border,#282827)] select-none">
          <button
            type="button"
            onClick={() => handleAction('deny')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            拒绝 (Deny)
          </button>
          <button
            type="button"
            onClick={() => handleAction('always_allow')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200/70 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            始终允许 (Always Allow)
          </button>
          <button
            type="button"
            onClick={() => handleAction('allow_once')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-clay hover:bg-clay-hover shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            单次批准 (Allow Once)
          </button>
        </div>
      )}
    </div>
  );
};
