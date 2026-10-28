/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React, { useState } from 'react';

export const CdsMotionEngine: React.FC = () => {
  const [popped, setPopped] = useState(false);
  const chips = ['AST-Engine', 'Electron-Fuses', 'View-Transitions', 'Scroll-Timeline', 'Off-Line-Bundle'];

  return (
    <div className="p-6 space-y-6 bg-[#FCFBF7] rounded-xl border border-neutral-200">
      <h3 className="text-sm font-bold text-neutral-800">CDS 2.0 物理动效引擎实机呈现</h3>

      {/* 1. Pill 弹性过冲 */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">1. Pill Elastic Pop (1.32x Overshoot)</p>
        <button
          type="button"
          onClick={() => {
            setPopped(true);
            setTimeout(() => setPopped(false), 240);
          }}
          className={`px-3 py-1.5 rounded-full bg-amber-600 text-white text-xs font-medium transition-transform ${
            popped ? 'scale-125' : 'scale-100 hover:scale-105 active:scale-95'
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.34, 1.3, 0.64, 1)',
            transitionDuration: '200ms'
          }}
        >
          Pill Spring Trigger
        </button>
      </div>

      {/* 2. Chip 原生级联交错渐入 */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">2. Staggered Chip Cascade Entrance</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((chip, idx) => (
            <span
              key={chip}
              className="px-2.5 py-1 text-xs rounded-md bg-neutral-100 border border-neutral-200 text-neutral-700 animate-in fade-in zoom-in-75 duration-200"
              style={{
                animationDelay: `${idx * 30}ms`,
                animationFillMode: 'backwards'
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* 3. Skeleton 105deg 线性扫光带 */}
      <div>
        <p className="text-xs text-neutral-500 mb-2">3. Skeleton 105° Linear Sweep (Wave Mode)</p>
        <div className="space-y-2 max-w-sm">
          <div className="h-3.5 rounded bg-neutral-200/60 overflow-hidden relative">
            <div
              className="absolute inset-0 -translate-x-full animate-[sweep_2s_infinite]"
              style={{
                backgroundImage: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.8) 50%, transparent 65%)'
              }}
            />
          </div>
          <div className="h-3.5 w-2/3 rounded bg-neutral-200/60 overflow-hidden relative">
            <div
              className="absolute inset-0 -translate-x-full animate-[sweep_2s_infinite]"
              style={{
                animationDelay: '90ms',
                backgroundImage: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.8) 50%, transparent 65%)'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
