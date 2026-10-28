/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

/**
 * ==============================================================================
 * Claude Design System (CDS) - RichComposerWithMentions.tsx
 * 
 * 逆向还原自官方 Claude Desktop / Web 核心输入组件 (REA v6.5.0 取证):
 * - `shared-frame-BfjMqbuN.js` (Lm/Rm/zm/Bm/Um WebKit 500ms Post-Composition Delta Guard)
 * - `cb6930dae-BD0W5ZM9.js` (Qo/ar/Xo/as Slash & Mention Tokenizer with 256 file cap)
 * - `frame-shell-chrome-CAw-tYzh.js` (field-sizing fallback, max-h-[min(40svh,24rem)])
 * 
 * 核心生产级工程机制:
 * 1. WebKit 500ms 赛跑合成后卫 (Post-Composition Delta Guard):
 *    Safari 与 macOS Electron 在 compositionend 后会派发一个带有 isComposing=false 的虚假 Enter 键。
 *    Anthropic 记录 compositionend 的 timeStamp (Fm)，并在 KeyDown 中施加:
 *    Lm() && Math.abs(e.timeStamp - Fm) < 500 守卫，杜绝中文/日文确认候选词时误发消息！
 * 2. 严苛标点剥离正则 (Punctuation Stripper):
 *    $o = /[.,;:!?'"\u3001\u3002\uFF0C\uFF1B\uFF1A\uFF01\uFF1F\u2026]+$/
 *    自动剥离中日韩全角句号、逗号、问号与英文标点。
 * 3. 256 个文件引用防御熔断 (Cap 256 Mentions) 与 1024 路径限制。
 * 4. 弹性高度自适应与 field-sizing: content 幽灵元素降级支持。
 * ==============================================================================
 */

export interface SlashCommandItem {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface MentionItem {
  id: string;
  name: string;
  kind: 'file' | 'project' | 'doc' | 'branch';
  path?: string;
  badge?: string;
}

const DEFAULT_SLASH_COMMANDS: SlashCommandItem[] = [
  { id: 'help', name: 'help', description: '获取 Claude 使用帮助与快捷键指南', icon: '❓' },
  { id: 'compact', name: 'compact', description: '压缩长会话上下文以节省 Token 窗口', icon: '⚡' },
  { id: 'model', name: 'model', description: '切换推理模型 (Opus, Sonnet, Haiku)', icon: '🔄' },
  { id: 'plan', name: 'plan', description: '进入工程分步计划模式', icon: '📋' },
  { id: 'clear', name: 'clear', description: '清空当前上下文并重启对话', icon: '🗑️' },
];

const DEFAULT_MENTIONS: MentionItem[] = [
  { id: 'app-tsx', name: 'App.tsx', kind: 'file', path: 'src/App.tsx', badge: 'TSX' },
  { id: 'theme-css', name: 'cds-theme.css', kind: 'file', path: 'src/styles/cds-theme.css', badge: 'CSS' },
  { id: 'vite-config', name: 'vite.config.ts', kind: 'file', path: 'vite.config.ts', badge: 'TS' },
  { id: 'proj-cds', name: 'Claude Design System', kind: 'project', badge: 'Project' },
  { id: 'branch-main', name: 'main', kind: 'branch', badge: 'Git' },
];

// REA 取证：标点剥离与路径合法性校验
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?'"\u3001\u3002\uFF0C\uFF1B\uFF1A\uFF01\uFF1F\u2026]+$/;
const FILE_EXT_REGEX = /\.[a-z][^/]*$/i;
const MAX_PATH_LENGTH = 1024;
const MAX_FILE_MENTIONS = 256;

function isAppleWebKit(): boolean {
  return typeof window !== 'undefined' && /Apple Computer/.test(window.navigator.vendor);
}

export interface RichComposerProps {
  placeholder?: string;
  onSubmit?: (content: { text: string; slashCommand?: string; mentions: MentionItem[] }) => void;
  disabled?: boolean;
  maxTokens?: number;
}

export const RichComposerWithMentions: React.FC<RichComposerProps> = ({
  placeholder = '向 Claude 发送消息... (输入 / 唤起指令，输入 @ 引用上下文)',
  onSubmit,
  disabled = false,
  maxTokens = 200000,
}) => {
  const [text, setText] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [activeSlashCommand, setActiveSlashCommand] = useState<SlashCommandItem | null>(null);
  const [attachedMentions, setAttachedMentions] = useState<MentionItem[]>([]);

  // 建议浮窗状态
  const [suggestionMode, setSuggestionMode] = useState<'slash' | 'mention' | null>(null);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // REA WebKit 500ms 赛跑后卫：记录上次合成结束时间戳
  const lastCompositionEndTimeRef = useRef<number>(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. 过滤建议列表
  const filteredSlashCommands = useMemo(() => {
    if (suggestionMode !== 'slash') return [];
    const q = suggestionQuery.toLowerCase();
    return DEFAULT_SLASH_COMMANDS.filter((cmd) => cmd.name.toLowerCase().includes(q));
  }, [suggestionMode, suggestionQuery]);

  const filteredMentions = useMemo(() => {
    if (suggestionMode !== 'mention') return [];
    const q = suggestionQuery.toLowerCase();
    return DEFAULT_MENTIONS.filter(
      (m) => m.name.toLowerCase().includes(q) || (m.path && m.path.toLowerCase().includes(q))
    );
  }, [suggestionMode, suggestionQuery]);

  const activeItemsCount = suggestionMode === 'slash' ? filteredSlashCommands.length : filteredMentions.length;

  // 2. 自适应高度调整 (降级计算 scrollHeight)
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const nextH = Math.min(Math.max(el.scrollHeight, 44), 384);
    el.style.height = `${nextH}px`;
  }, []);

  // 3. 监听输入流并触发指令/引用嗅探
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    setText(nextVal);
    adjustTextareaHeight();

    if (isComposing) return;

    const cursorPos = e.target.selectionStart || nextVal.length;
    const textBeforeCursor = nextVal.slice(0, cursorPos);

    // 检查 Slash Command
    const slashMatch = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9_\-]*)$/);
    if (slashMatch) {
      setSuggestionMode('slash');
      setSuggestionQuery(slashMatch[1]);
      setSelectedIndex(0);
      return;
    }

    // 检查 Mention
    const mentionMatch = textBeforeCursor.match(/(?:^|\s)@([^\s`]*)$/);
    if (mentionMatch) {
      let rawQuery = mentionMatch[1].replace(TRAILING_PUNCTUATION_REGEX, '');
      if (rawQuery.length <= MAX_PATH_LENGTH) {
        setSuggestionMode('mention');
        setSuggestionQuery(rawQuery);
        setSelectedIndex(0);
        return;
      }
    }

    setSuggestionMode(null);
    setSuggestionQuery('');
  };

  // 4. 选择 Slash 指令
  const applySlashCommand = useCallback((cmd: SlashCommandItem) => {
    setActiveSlashCommand(cmd);
    setText((prev) => prev.replace(/(?:^|\s)\/[a-zA-Z0-9_\-]*$/, '').trimStart());
    setSuggestionMode(null);
    textareaRef.current?.focus();
    setTimeout(adjustTextareaHeight, 0);
  }, [adjustTextareaHeight]);

  // 5. 插入 Mention 胶囊
  const applyMention = useCallback((mention: MentionItem) => {
    setAttachedMentions((prev) => {
      if (prev.length >= MAX_FILE_MENTIONS) return prev;
      return prev.some((m) => m.id === mention.id) ? prev : [...prev, mention];
    });
    setText((prev) => prev.replace(/(?:^|\s)@[^\s`]*$/, ' '));
    setSuggestionMode(null);
    textareaRef.current?.focus();
    setTimeout(adjustTextareaHeight, 0);
  }, [adjustTextareaHeight]);

  // 6. 核心生产键盘交互状态机与 WebKit 500ms 后卫
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 基础守卫：原生合成中或 keyCode 229 拦截
    if (isComposing || e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    // REA 核心发明：WebKit 500ms post-composition 虚假回车防护
    // 仅拦截 Safari/WebKit 在输入法候选词确认 (compositionend) 后派发的虚假回车事件，
    // 避免误触提交；同时重置时间戳防止误吞后续快速键入的正常字符。
    const timeSinceCompositionEnd = Math.abs(e.nativeEvent.timeStamp - lastCompositionEndTimeRef.current);
    if (isAppleWebKit() && (e.key === 'Enter' || e.keyCode === 13) && timeSinceCompositionEnd < 500) {
      lastCompositionEndTimeRef.current = -1;
      e.preventDefault();
      return;
    }

    // 建议弹窗开启时的方向键导航与确认
    if (suggestionMode && activeItemsCount > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % activeItemsCount);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + activeItemsCount) % activeItemsCount);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (suggestionMode === 'slash') {
          const selected = filteredSlashCommands[selectedIndex];
          if (selected) applySlashCommand(selected);
        } else if (suggestionMode === 'mention') {
          const selected = filteredMentions[selectedIndex];
          if (selected) applyMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSuggestionMode(null);
        return;
      }
    }

    // 消息提交快捷键处理: Enter 提交, Shift+Enter 换行
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 7. 发送消息
  const handleSend = () => {
    if (disabled || isComposing) return;
    const trimmed = text.trim();
    if (!trimmed && !activeSlashCommand && attachedMentions.length === 0) return;

    if (onSubmit) {
      onSubmit({
        text: trimmed,
        slashCommand: activeSlashCommand?.name,
        mentions: attachedMentions,
      });
    }

    // 重置状态
    setText('');
    setActiveSlashCommand(null);
    setAttachedMentions([]);
    setSuggestionMode(null);
    setTimeout(adjustTextareaHeight, 0);
  };

  // 8. 估算 Token
  const estimatedTokens = useMemo(() => {
    const charLen = text.length;
    const slashWeight = activeSlashCommand ? 12 : 0;
    const mentionWeight = attachedMentions.length * 30;
    return Math.ceil(charLen * 0.75) + slashWeight + mentionWeight;
  }, [text, activeSlashCommand, attachedMentions]);

  const tokenUsageRatio = Math.min(1, estimatedTokens / maxTokens);
  const isNearLimit = tokenUsageRatio > 0.85;

  return (
    <div
      ref={containerRef}
      data-cds="ChatComposer"
      className="relative w-full max-w-[42rem] mx-auto font-sans"
    >
      {/* 浮动建议弹窗 */}
      {suggestionMode && activeItemsCount > 0 && (
        <div
          role="listbox"
          aria-label={suggestionMode === 'slash' ? 'Slash Commands' : 'Context Mentions'}
          className="absolute bottom-full left-0 mb-2 w-full max-w-md rounded-2xl border border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#2e2e2c)] bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1f1e1d)] shadow-[0_12px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.4)] overflow-hidden z-50 animate-fade"
        >
          <div className="px-3.5 py-2 border-b border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#2e2e2c)] text-[11px] font-semibold text-[var(--cds-text-secondary,#6b6b6b)] flex justify-between items-center select-none">
            <span>{suggestionMode === 'slash' ? '⚡ 快捷指令 (Slash Commands)' : '📁 上下文与文件引用 (@ Mentions)'}</span>
            <span className="text-[10px] opacity-70">↑↓ 导航 · Enter/Tab 选择</span>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
            {suggestionMode === 'slash' &&
              filteredSlashCommands.map((cmd, idx) => (
                <div
                  key={cmd.id}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => applySlashCommand(cmd)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-colors ${
                    idx === selectedIndex
                      ? 'bg-[var(--cds-fill-ghost-selected,rgba(217,119,87,0.1))] text-[var(--cds-clay,#d97757)] font-medium'
                      : 'hover:bg-[var(--cds-fill-ghost-hover,rgba(0,0,0,0.04))] dark:hover:bg-[var(--cds-fill-ghost-hover,rgba(255,255,255,0.05))] text-[var(--cds-text-primary,#1a1a1a)] dark:text-[var(--cds-text-primary,#f0f0f0)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm">{cmd.icon || '⚡'}</span>
                    <span className="font-mono font-semibold">/{cmd.name}</span>
                  </div>
                  <span className="text-[11px] text-[var(--cds-text-secondary,#6b6b6b)] dark:text-[var(--cds-text-secondary,#9e9e9e)] truncate max-w-[200px]">
                    {cmd.description}
                  </span>
                </div>
              ))}

            {suggestionMode === 'mention' &&
              filteredMentions.map((m, idx) => (
                <div
                  key={m.id}
                  role="option"
                  aria-selected={idx === selectedIndex}
                  onClick={() => applyMention(m)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-colors ${
                    idx === selectedIndex
                      ? 'bg-[var(--cds-fill-ghost-selected,rgba(217,119,87,0.1))] text-[var(--cds-clay,#d97757)] font-medium'
                      : 'hover:bg-[var(--cds-fill-ghost-hover,rgba(0,0,0,0.04))] dark:hover:bg-[var(--cds-fill-ghost-hover,rgba(255,255,255,0.05))] text-[var(--cds-text-primary,#1a1a1a)] dark:text-[var(--cds-text-primary,#f0f0f0)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">@</span>
                    <span className="font-medium">{m.name}</span>
                    {m.path && (
                      <span className="text-[10px] text-[var(--cds-text-secondary,#8a8a8a)] font-mono truncate max-w-[160px]">
                        {m.path}
                      </span>
                    )}
                  </div>
                  {m.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {m.badge}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 输入框主卡片 */}
      <div
        className="relative flex flex-col w-full rounded-[20px] bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1f1e1d)] border border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#2e2e2c)] p-[0.875rem] gap-y-2 cursor-text transition-all duration-200 shadow-card-ring focus-within:border-[var(--cds-clay,#d97757)] focus-within:shadow-focus"
      >
        {/* 顶部标签条：激活的 Slash 指令与 Mention 胶囊 */}
        {(activeSlashCommand || attachedMentions.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 pb-1 select-none">
            {activeSlashCommand && (
              <span
                data-cds="SlashCommandPill"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-clay/10 text-clay text-xs font-semibold font-mono border border-clay/30"
              >
                <span>{activeSlashCommand.icon || '⚡'}</span>
                <span>/{activeSlashCommand.name}</span>
                <button
                  type="button"
                  onClick={() => setActiveSlashCommand(null)}
                  className="hover:opacity-75 ml-0.5 cursor-pointer"
                  title="Remove command"
                >
                  ×
                </button>
              </span>
            )}

            {attachedMentions.map((m) => (
              <span
                key={m.id}
                data-cds="FileMentionPill"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--cds-surface-2,#f0eee9)] dark:bg-[var(--cds-surface-2,#282725)] text-neutral-800 dark:text-neutral-200 text-xs font-medium border border-neutral-300/50 dark:border-neutral-700/50"
              >
                <span className="text-neutral-400">@</span>
                <span>{m.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachedMentions((prev) => prev.filter((item) => item.id !== m.id))}
                  className="hover:opacity-75 ml-0.5 cursor-pointer"
                  title="Remove mention"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 核心文本域：支持 field-sizing: content 与回退 */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            // REA 取证：记录 WebKit 500ms 赛跑时间戳
            lastCompositionEndTimeRef.current = e.nativeEvent.timeStamp;
          }}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="w-full min-h-[44px] max-h-[min(40svh,24rem)] bg-transparent border-none outline-none resize-none text-[15px] leading-[1.4] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 pl-2 focus:ring-0 select-text font-sans"
          style={{ fieldSizing: 'content' as any }}
        />

        {/* 底部操作与指示栏 */}
        <div className="flex items-center justify-between pt-1 select-none">
          {/* 左侧附加操作 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <span className="text-sm">+</span>
              <span>Add content</span>
            </button>
          </div>

          {/* 右侧：Token 动态计量与发送按钮 */}
          <div className="flex items-center gap-3">
            {/* Token 动态计量指示器 */}
            {estimatedTokens > 0 && (
              <div
                className="flex items-center gap-1.5 text-[11px] font-mono select-none"
                title={`预估单次交互 Tokens: ~${estimatedTokens}`}
              >
                <span
                  className={`size-2 rounded-full ${
                    isNearLimit
                      ? 'bg-clay animate-pulse'
                      : 'bg-emerald-500'
                  }`}
                />
                <span className="text-neutral-500 dark:text-neutral-400 tabular-nums">
                  ~{estimatedTokens} tok
                </span>
              </div>
            )}

            {/* 发送按钮 */}
            <button
              type="button"
              disabled={disabled || (!text.trim() && !activeSlashCommand && attachedMentions.length === 0)}
              onClick={handleSend}
              className="size-8 rounded-lg flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--cds-fill-brand,#c6613f)] hover:bg-[#b05232] text-white cursor-pointer active:scale-95 shadow-2xs"
              title="发送 (Enter)"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
