/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React from 'react';
import { ModelSelectorEffort, EffortLevel } from './ModelSelectorEffort';

export interface ChatComposerChinProps {
  currentEffort: EffortLevel;
  onEffortChange: (effort: EffortLevel) => void;
  failedQueueCount?: number;
  onRetryQueue?: () => void;
}

export const ChatComposerChin: React.FC<ChatComposerChinProps> = ({
  currentEffort,
  onEffortChange,
  failedQueueCount = 0,
  onRetryQueue
}) => {
  return (
    <div
      className="cds-root w-full border-t border-[var(--cds-border-subtle,rgba(0,0,0,0.08))] bg-[var(--cds-surface,#FCFBF7)] px-3 py-1.5"
      data-cds="ChatComposerChin"
    >
      {/* 离线失败消息队列横幅 */}
      {failedQueueCount > 0 && (
        <div
          data-cds="ChatComposerQueuedMessages"
          className="mb-2 flex items-center justify-between rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 border border-amber-200"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{failedQueueCount} message(s) failed to send. Staged in local storage.</span>
          </div>
          <button
            type="button"
            onClick={onRetryQueue}
            className="font-medium underline hover:text-amber-900"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* 下颌操作行 (自带触控补偿) */}
      <div
        data-touch-size="true"
        className="flex items-center justify-between min-h-[28px]"
        style={{
          // 原生 CDS 负边距补偿算法
          '--cds-h-control': '36px',
          '--cmp-chin-row-h': '28px',
        } as React.CSSProperties}
      >
        <div className="flex items-center gap-2">
          {/* 模型与推理调节器 */}
          <ModelSelectorEffort currentEffort={currentEffort} onEffortChange={onEffortChange} />
          
          <button
            type="button"
            data-cds="Button"
            className="px-2 py-1 text-xs text-neutral-600 hover:text-neutral-900 rounded hover:bg-neutral-100 transition-colors"
          >
            + Attach
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-400">⌘ + Enter to send</span>
          <button
            type="button"
            data-cds="Button"
            className="w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};
