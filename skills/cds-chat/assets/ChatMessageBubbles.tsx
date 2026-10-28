/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
/**
 * Claude Design System (CDS) - Message Bubbles (User & Assistant)
 * 
 * 逆向溯源：基于 REA v6.5.0 对 /Applications/Claude.app (@ant/desktop v2.37337.1) 取证：
 * - `frame-shell-chrome-CAw-tYzh.js`: [data-cds=UserMessage] / [data-cds=AssistantMessage] 结构规范与 CSS 自定义属性
 * - `shared-2-Cb74JByF.js`: UX (UserMessage) 消息折叠、双向对齐与操作栏浮动
 * - `shared-styles-Bl9zqrv-.css`: --chat-turn-gap, --chat-item-gap, --chat-leading 排版律动
 * 
 * 核心真实生产规范：
 * 1. 用户气泡圆角律：--cds-message-bubble-radius: calc(var(--cds-radius) + calc(.25rem * var(--cds-rem-scale, 1))) (默认 18px)
 * 2. 气泡内边距与量度：px-[var(--cds-message-bubble-pad-x)] py-[var(--cds-message-bubble-pad-y)] max-w-[85%]
 * 3. 动态色阶：默认 var(--cds-bg-user-message, var(--cds-bg-neutral))；Personal 模式为 var(--cds-bg-tint-blue, #dde8f7/#193c5f)
 * 4. 气泡超长折叠：超过 collapseThreshold (默认 300px) 应用 [mask-image:linear-gradient(to_bottom,black_calc(100%_-_3rem),transparent)]
 * 5. 模型回答 Text Inset 律：--cds-assistant-message-text-inset: 4px; --cds-assistant-message-text-stop: clamp(0px, (100% - 384px) * .175, 56px)
 * 6. 思考指示灯：.timeline-quiet-dots 3 点 1.9s 循环跳跃，CSS Grid 0fr <-> 1fr 消除高度抖动
 */

import React, { useState, useRef, useEffect } from "react";

// ============================================================================
// 1. 类型定义 (Types)
// ============================================================================

export interface AttachmentPreview {
  name: string;
  size: string;
  type?: string;
}

export interface ArtifactPreview {
  title: string;
  version: string;
  desc?: string;
  type?: string;
}

export interface UserMessageProps {
  id?: string | number;
  text: string;
  time?: string;
  attachment?: AttachmentPreview | null;
  author?: "self" | "other";
  textSize?: "sm" | "md" | "lg";
  state?: "pending" | "failed" | "done";
  collapsible?: boolean;
  collapseThreshold?: number;
  onRetry?: () => void;
  onEdit?: (newText: string) => void;
  className?: string;
}

export interface AssistantMessageProps {
  id?: string | number;
  text: string;
  time?: string;
  modelName?: string;
  textSize?: "sm" | "md" | "lg";
  thinkingTime?: string;
  thinkingSteps?: string[];
  isThinkingLive?: boolean;
  codeSnippet?: {
    language: string;
    code: string;
  } | null;
  artifact?: ArtifactPreview | null;
  suggestedChips?: string[];
  onSelectChip?: (chipText: string) => void;
  onOpenArtifact?: (artifact: ArtifactPreview) => void;
  onCopyResponse?: (text: string) => void;
  className?: string;
}

// ============================================================================
// 2. 用户提问气泡 (UserMessageBubble)
// ============================================================================

export function UserMessageBubble({
  text,
  time = "Just now",
  attachment,
  author = "self",
  textSize = "md",
  state = "done",
  collapsible = true,
  collapseThreshold = 300,
  onRetry,
  onEdit,
  className = "",
}: UserMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // 测量内容高度以决定是否启用阅读更多渐变遮罩
  useEffect(() => {
    if (contentRef.current && collapsible) {
      const scrollH = contentRef.current.scrollHeight;
      setIsOverflowing(scrollH > collapseThreshold);
    }
  }, [text, collapsible, collapseThreshold]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isOther = author === "other";

  return (
    <div
      data-cds="UserMessage"
      data-state={state}
      data-text-size={textSize}
      data-author={author}
      className={`group/message-row flex w-full min-w-0 flex-col gap-xs font-sans ${
        isOther ? "me-auto items-start" : "ms-auto items-end"
      } ${className}`}
    >
      {/* 随附上传的附件芯片 */}
      {attachment && (
        <div
          data-cds="MessageAttachmentsFile"
          className="w-56 p-2 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-800/90 shadow-2xs flex items-center gap-2.5 mb-1 animate-fade"
        >
          <div className="size-8 rounded-lg bg-clay/10 text-clay flex items-center justify-center font-mono text-xs font-bold shrink-0">
            {attachment.type || "DOC"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
              {attachment.name}
            </div>
            <div className="text-[10px] text-neutral-400 font-mono">{attachment.size}</div>
          </div>
        </div>
      )}

      {/* 气泡本体容器 */}
      <div
        className={`relative flex min-w-0 flex-col gap-xs rounded-[var(--cds-message-bubble-radius,18px)] px-[var(--cds-message-bubble-pad-x,16px)] py-[var(--cds-message-bubble-pad-y,12px)] max-w-[var(--cds-message-bubble-measure,85%)] text-heading font-normal break-words select-text ${
          state === "failed"
            ? "border border-red-500/30 bg-red-50/10 dark:bg-red-950/20 text-neutral-900 dark:text-neutral-100"
            : "bg-[var(--cds-bg-user-message-personal,#f0f4f8)] dark:bg-[var(--cds-bg-user-message,rgba(255,255,255,0.06))] text-neutral-900 dark:text-neutral-100"
        }`}
        style={{
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
          animation: "message-fade-up 0.4s cubic-bezier(0.34, 1.3, 0.64, 1)",
        }}
      >
        {/* 正文包裹层与溢出渐变遮罩 */}
        <div
          ref={contentRef}
          className={`cds-user-message-body text-[14.5px] leading-relaxed ${
            isOverflowing && !isExpanded
              ? "max-h-[300px] overflow-hidden [mask-image:linear-gradient(to_bottom,black_calc(100%_-_3rem),transparent)]"
              : ""
          }`}
        >
          {text}
        </div>

        {/* 展开/收起按钮 */}
        {isOverflowing && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-start text-xs font-medium text-clay hover:underline mt-1 cursor-pointer select-none"
          >
            {isExpanded ? "Show less" : "Show more"}
          </button>
        )}

        {/* 失败状态操作行 */}
        {state === "failed" && (
          <div className="flex items-center gap-2 pt-1 text-xs text-red-500 font-medium">
            <span>Failed to send</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="underline hover:text-red-600 font-semibold cursor-pointer"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>

      {/* 气泡底部时间与动作行 */}
      <div className="flex items-center gap-2 px-1 select-none">
        {time && (
          <span className="text-[11px] font-mono text-neutral-400">
            {time}
          </span>
        )}

        {/* 悬停操作组 */}
        <div
          data-cds="MessageActions"
          role="toolbar"
          aria-label="Message actions"
          className="opacity-0 group-hover/message-row:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 text-neutral-400"
        >
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800 text-[11px] transition-colors"
            title="Copy message"
          >
            {isCopied ? "✓" : "Copy"}
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(text)}
              className="p-1 rounded hover:bg-neutral-200/50 dark:hover:bg-neutral-800 text-[11px] transition-colors"
              title="Edit message"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. 模型回答正文 (AssistantMessageBubble)
// ============================================================================

export function AssistantMessageBubble({
  text,
  time = "Just now",
  modelName = "Sonnet 3.7",
  textSize = "md",
  thinkingTime,
  thinkingSteps,
  isThinkingLive = false,
  codeSnippet,
  artifact,
  suggestedChips,
  onSelectChip,
  onOpenArtifact,
  onCopyResponse,
  className = "",
}: AssistantMessageProps) {
  const [isThinkingOpen, setIsThinkingOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // 深度思考在生成中强制展开，防止视口跳动
  const isThinkingExpanded = isThinkingLive || isThinkingOpen;

  const handleCopyCode = () => {
    if (!codeSnippet?.code) return;
    navigator.clipboard.writeText(codeSnippet.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500); // 2.5s 状态衰减
  };

  const handleCopyResponse = () => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    onCopyResponse?.(text);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div
      data-cds="AssistantMessage"
      data-text-size={textSize}
      className={`space-y-3.5 max-w-2xl w-full text-neutral-800 dark:text-neutral-200 font-sans ${className}`}
      style={{
        animation: "message-fade-up 0.45s cubic-bezier(0.34, 1.3, 0.64, 1)",
        // REA 取证：模型正文文本微缩进与止动公式
        paddingLeft: "var(--cds-assistant-message-text-inset, 4px)",
      }}
    >
      {/* 头部：Claude Spark 图标 + 模型徽章 + 时间 */}
      <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium select-none">
        <span className="size-5 rounded-md bg-clay text-white flex items-center justify-center text-[10px] shadow-2xs font-serif font-bold">
          ✦
        </span>
        <span className="font-semibold text-neutral-900 dark:text-neutral-100">Claude</span>
        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
          {modelName}
        </span>
        <span>•</span>
        <span className="font-mono text-[11px]">{time}</span>
      </div>

      {/* 深度思考折叠器 (Thinking Accordion - 采用 REA 1.9s quiet-dots 与 CSS Grid 0fr 伸缩) */}
      {(isThinkingLive || (thinkingSteps && thinkingSteps.length > 0)) && (
        <div className="rounded-lg transition-colors py-0.5 select-none">
          <button
            type="button"
            disabled={isThinkingLive}
            onClick={() => !isThinkingLive && setIsThinkingOpen(!isThinkingOpen)}
            className={`inline-flex items-center gap-2 py-1 px-2 -ml-2 rounded-md text-xs font-medium transition-colors ${
              isThinkingLive
                ? "text-neutral-600 dark:text-neutral-300 cursor-default"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 cursor-pointer"
            }`}
          >
            {isThinkingLive ? (
              <>
                {/* REA 官方 3 点静默跳跃波浪 (1.9s infinite cubic-bezier(.4, 0, .2, 1)) */}
                <div className="timeline-quiet-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="font-sans">Thinking…</span>
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-clay" />
                <span>Thought for {thinkingTime || "3.2s"}</span>
                <span
                  className={`text-[10px] text-neutral-400 transition-transform duration-200 ${
                    isThinkingExpanded ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </>
            )}
          </button>

          {/* CSS Grid 0fr -> 1fr 伸缩容器 */}
          <div
            className="grid transition-[grid-template-rows] duration-200 ease-[cubic-bezier(0.19,1,0.22,1)]"
            style={{ gridTemplateRows: isThinkingExpanded ? "1fr" : "0fr" }}
          >
            <div className="min-h-0 overflow-hidden pl-3.5 ml-1 mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 font-mono border-l-2 border-clay/40 dark:border-clay/30 space-y-1">
              {thinkingSteps && thinkingSteps.length > 0 ? (
                thinkingSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className={
                      step.includes("正在") || step.includes("分析") || step.includes("Parsing")
                        ? "text-clay font-medium"
                        : ""
                    }
                  >
                    &gt; {step}
                  </div>
                ))
              ) : (
                <div className="italic text-neutral-400">Synthesizing step-by-step reasoning…</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 回答正文：完全零边框，直接呈现在表面 */}
      <div className="prose text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 break-words select-text">
        {text}
      </div>

      {/* 代码块与 2.5s 复制衰减状态机 */}
      {codeSnippet && (
        <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#0d0d0c] text-neutral-200 font-mono text-xs shadow-sm my-2">
          <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-950/80 border-b border-neutral-800 text-[11px] text-neutral-400 select-none">
            <span className="font-medium text-neutral-300">{codeSnippet.language}</span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? (
                <span className="text-emerald-400 flex items-center gap-1 font-sans font-medium">
                  ✓ Copied!
                </span>
              ) : (
                <span>Copy code</span>
              )}
            </button>
          </div>
          <pre className="p-3.5 overflow-x-auto leading-relaxed text-[13px] text-neutral-300 font-mono">
            {codeSnippet.code}
          </pre>
        </div>
      )}

      {/* Artifacts 产物展示卡片 */}
      {artifact && (
        <div className="p-3.5 rounded-xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800/70 shadow-2xs flex items-center justify-between my-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 rounded-lg bg-clay/10 text-clay flex items-center justify-center shrink-0 font-mono text-xs font-bold">
              &lt;/&gt;
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {artifact.title}
              </div>
              <div className="text-[11px] text-neutral-400 font-mono truncate">
                {artifact.version} {artifact.desc ? `• ${artifact.desc}` : ""}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenArtifact?.(artifact)}
            className="h-7 px-3 rounded-lg bg-clay text-white text-xs font-medium hover:bg-clay-hover shadow-2xs flex items-center gap-1.5 transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <span>Open Artifact</span>
          </button>
        </div>
      )}

      {/* 建议追问胶囊 (Suggested Chips) */}
      {suggestedChips && suggestedChips.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {suggestedChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectChip?.(chip)}
              className="px-3 py-1 rounded-full border border-neutral-200/80 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 transition-colors active:scale-95 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* 底部操作工具栏 (MessageActions) */}
      <div
        data-cds="MessageActions"
        role="toolbar"
        aria-label="Assistant message actions"
        className="flex items-center gap-3 pt-1 text-neutral-400 select-none text-xs"
      >
        <button
          type="button"
          onClick={handleCopyResponse}
          className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          title="Copy response"
        >
          {copiedResponse ? "✓ Copied" : "Copy"}
        </button>
        <button
          type="button"
          className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          title="Good response"
        >
          👍
        </button>
        <button
          type="button"
          className="hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          title="Bad response"
        >
          👎
        </button>
      </div>
    </div>
  );
}
