/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React, { useEffect, useRef } from 'react';

/**
 * ==============================================================================
 * Claude Design System (CDS) - ReasoningAmbientGlow.tsx
 * 
 * 逆向还原自官方 Claude 动态光效与推理氛围感引擎 (REA v6.5.0 取证):
 * - `c6a992d55-sXiDGMFQ.css`: cds-shimmer-text-shine / wl-glow / wl-halo / cds-dot-pulse / epitaxy-linear-sweep
 * - `frame-shell-chrome-CAw-tYzh.js`: --cds-fill-brand / shadow-field-drop / color-mix
 * 
 * 核心视觉物理学:
 * 1. 陶土暖光推理晕染 (Warm Clay Ambient Glow / wl-glow):
 *    采用 1.8s ease-in-out 双向呼吸脉冲，双层外晕结合 2px 品牌外轮廓，
 *    在长思维链推理 (Extended Thinking) 时营造沉浸式思考场域。
 * 2. 文本扫光波纹 (Shimmer Text Shine):
 *    非对称贝塞尔曲线 `cubic-bezier(.714, .121, .211, .888)` 驱动的渐变光波扫描，
 *    0%~15% 蓄力位移至 83.333%、85%~100% 回落至 16.667%，呈现突破性算力涌动。
 * 3. 三相差分跳跃点 (cds-dot-pulse):
 *    0%~5% 不透明度 0.2857 (2/7 黄金常数) -> 15%~25% 跃升至 1.0 (cubic-bezier(.165,.84,.44,1)) -> 65%~100% 衰减回 0.2857。
 * 4. 底部 Epitaxy 线性扫光条 (epitaxy-linear-sweep):
 *    精确 1.1s cubic-bezier(.45, 0, .55, 1) infinite 从 -100% 平移至 +350% (支持 RTL)。
 * ==============================================================================
 */

export interface ReasoningAmbientGlowProps {
  active?: boolean;
  statusText?: string;
  durationSeconds?: number;
  showCanvasBackdrop?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * 1. 深度推理动态氛围感主容器 (ReasoningAmbientGlow)
 */
export const ReasoningAmbientGlow: React.FC<ReasoningAmbientGlowProps> = ({
  active = true,
  statusText = 'Claude 正在进行深度思考与逆向推理...',
  durationSeconds,
  showCanvasBackdrop = true,
  className = '',
  children,
}) => {
  return (
    <div
      data-cds="ReasoningAmbientGlow"
      className={`relative overflow-hidden rounded-2xl border transition-all duration-500 font-sans ${
        active
          ? 'border-[var(--cds-fill-brand,#c6613f)]/40 bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1b1a18)] shadow-[0_0_24px_-4px_rgba(217,119,87,0.18)] dark:shadow-[0_0_32px_-4px_rgba(217,119,87,0.28)]'
          : 'border-[var(--cds-border,#e5e5e3)] dark:border-[var(--cds-border,#262626)] bg-[var(--cds-surface-1,#ffffff)] dark:bg-[var(--cds-surface-1,#1c1c1c)]'
      } ${className}`}
    >
      {/* 动态焦散光场画布 (Ambient Light Canvas) */}
      {active && showCanvasBackdrop && <AmbientLightFieldCanvas />}

      {/* 顶部思考状态指示栏 */}
      {active && (
        <div className="relative z-10 flex items-center justify-between px-4 py-2.5 border-b border-[var(--cds-fill-brand,#c6613f)]/20 bg-[var(--cds-surface-2,#fcf4f1)]/70 dark:bg-[#2c1b16]/70 backdrop-blur-md select-none">
          <div className="flex items-center gap-2.5">
            {/* 三点相位脉冲 */}
            <ThreePhasePulseDots />
            {/* 扫光文字 */}
            <ShimmerText text={statusText} />
          </div>

          {durationSeconds !== undefined && (
            <span className="text-[11px] font-mono text-clay tabular-nums font-medium">
              {durationSeconds}s
            </span>
          )}
        </div>
      )}

      {/* 内容投影区 */}
      <div className="relative z-10 p-4">{children}</div>

      {/* 底部线性能量扫光条 (REA 官方 1.1s cubic-bezier(.45,0,.55,1)) */}
      {active && <LinearSweepProgress />}
    </div>
  );
};

/**
 * 2. 官方反编译 keyframe 文本扫光组件 (ShimmerText)
 * 对应 official `cds-shimmer-text-shine`
 */
export const ShimmerText: React.FC<{ text: string; className?: string }> = ({
  text,
  className = '',
}) => {
  return (
    <span
      className={`inline-block font-sans text-xs font-medium tracking-wide bg-clip-text text-transparent select-none ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(90deg, var(--cds-clay, #d97757) 0%, var(--cds-text-primary, #1a1a1a) 35%, #ffffff 50%, var(--cds-text-primary, #1a1a1a) 65%, var(--cds-clay, #d97757) 100%)',
        backgroundSize: '250% 100%',
        animation: 'cds-shimmer-text-shine 3s linear infinite',
      }}
    >
      {text}
      <style>{`
        @keyframes cds-shimmer-text-shine {
          0%, 15% {
            background-position: 83.333% 0;
            animation-timing-function: cubic-bezier(.714, .121, .211, .888);
          }
          85%, 100% {
            background-position: 16.667% 0;
          }
        }
      `}</style>
    </span>
  );
};

/**
 * 3. 官方三相差分跳跃点 (ThreePhasePulseDots)
 * 对应 `cds-dot-pulse` (0%~5%: 0.2857 -> 15%~25%: 1.0 -> 65%~100%: 0.2857)
 */
export const ThreePhasePulseDots: React.FC = () => {
  return (
    <div className="flex items-center gap-1 select-none">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-clay"
          style={{
            animation: `cds-dot-pulse 1.2s cubic-bezier(.165, .84, .44, 1) infinite`,
            animationDelay: `${i * 180}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes cds-dot-pulse {
          0%, 5% {
            opacity: 0.2857;
            animation-timing-function: cubic-bezier(.165, .84, .44, 1);
          }
          15%, 25% {
            opacity: 1;
            animation-timing-function: cubic-bezier(.165, .84, .44, 1);
          }
          65%, 100% {
            opacity: 0.2857;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * 4. 底部 Epitaxy 线性扫光条 (LinearSweepProgress)
 * REA 取证自 c6a992d55-sXiDGMFQ.css pos 1784290: 1.1s cubic-bezier(.45, 0, .55, 1)
 */
export const LinearSweepProgress: React.FC = () => {
  return (
    <div className="relative h-0.5 w-full overflow-hidden bg-clay/15">
      <div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-clay to-transparent"
        style={{
          animation: 'epitaxy-linear-sweep 1.1s cubic-bezier(0.45, 0, 0.55, 1) infinite',
        }}
      />
      <style>{`
        @keyframes epitaxy-linear-sweep {
          0% {
            transform: translate(-100%);
          }
          100% {
            transform: translate(350%);
          }
        }
      `}</style>
    </div>
  );
};

/**
 * 5. 轻量级焦散光场画布 (AmbientLightFieldCanvas)
 * 在卡片背景渲染柔和的低频色相波动光晕
 */
const AmbientLightFieldCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.015;
      const w = (canvas.width = canvas.offsetWidth);
      const h = (canvas.height = canvas.offsetHeight);

      ctx.clearRect(0, 0, w, h);

      // 计算波动中心光斑
      const cx1 = w * 0.3 + Math.sin(t) * (w * 0.15);
      const cy1 = h * 0.4 + Math.cos(t * 0.8) * (h * 0.15);
      const r1 = Math.max(w, h) * 0.6;

      const grad1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, r1);
      // 官方陶土色 #d97757 对应 rgba(217, 119, 87, ...)
      grad1.addColorStop(0, 'rgba(217, 119, 87, 0.12)');
      grad1.addColorStop(0.5, 'rgba(217, 119, 87, 0.04)');
      grad1.addColorStop(1, 'rgba(217, 119, 87, 0)');

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full z-0 opacity-80"
    />
  );
};
