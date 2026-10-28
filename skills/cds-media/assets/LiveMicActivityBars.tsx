/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';

export type VoiceMode = 'idle' | 'connecting' | 'active';

interface LiveMicActivityBarsProps {
  mode: VoiceMode;
  audioStream?: MediaStream | null;
  size?: number;
  className?: string;
  minHeight?: number;
  maxHeight?: number;
}

export const LiveMicActivityBars: React.FC<LiveMicActivityBarsProps> = ({
  mode,
  audioStream = null,
  size = 48,
  className = '',
  minHeight = 4,
  maxHeight = 24
}) => {
  const VIEWBOX_SIZE = 48;
  const BAR_COUNT = 6;
  // 6 频段非重叠区间采样（覆盖 85Hz - 4.8kHz 人声基频与关键共振峰，fftSize=512, ~86Hz/bin）
  const SPEECH_BANDS = [
    { start: 1, end: 3 },   // ~86-258 Hz: 人声基频 (F0)
    { start: 3, end: 6 },   // ~258-516 Hz: 低频元音能量
    { start: 6, end: 12 },  // ~516-1033 Hz: 第一共振峰 (F1)
    { start: 12, end: 22 }, // ~1033-1895 Hz: 第二共振峰 (F2)
    { start: 22, end: 36 }, // ~1895-3100 Hz: 辅音与第三共振峰 (F3)
    { start: 36, end: 56 }, // ~3100-4823 Hz: 齿音与清辅音细节
  ];
  const NOISE_FLOOR = [0.08, 0.08, 0.08, 0.08, 0.08, 0.08];
  const BAND_WEIGHTS = [1.1, 1.2, 1.3, 1.2, 1.0, 0.9];

  // 6 条音频柱的独立 Framer Motion 动态高度
  const motionValues = Array.from({ length: BAR_COUNT }, () => useMotionValue(minHeight));
  const opacityValues = Array.from({ length: BAR_COUNT }, () => useMotionValue(1));

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const pulseStartTimeRef = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  // 1. 初始化 Web Audio FFT 分析器
  useEffect(() => {
    if (mode === 'active' && audioStream) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.5; // 0.5 阻尼平滑消除瞬态抖动
        analyser.minDecibels = -70;          // 人类语言基准底噪
        analyser.maxDecibels = -10;          // 动态范围上限
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(audioStream);
        source.connect(analyser);
        sourceRef.current = source;

        dataArrayRef.current = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
      } catch (err) {
        console.error('[LiveMicActivityBars] AudioContext init failed', err);
      }
    } else {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      sourceRef.current = null;
      dataArrayRef.current = null;
    }

    if (mode === 'connecting') {
      pulseStartTimeRef.current = performance.now();
    } else if (mode === 'idle') {
      motionValues.forEach((mv) => mv.set(minHeight));
      opacityValues.forEach((ov) => ov.set(0.6));
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [mode, audioStream]);

  // 2. 动画渲染物理循环
  useEffect(() => {
    const renderLoop = () => {
      if (mode === 'connecting') {
        // 1800ms 周期交错呼吸波形
        const elapsed = performance.now() - pulseStartTimeRef.current;
        const period = 1800;
        const phase = (elapsed % period) / period;
        const baseOpacity = 0.35;

        for (let i = 0; i < BAR_COUNT; i++) {
          const stepOffset = i * 0.15;
          let alpha = baseOpacity;
          if (phase < 0.6) {
            const start = stepOffset;
            const end = start + 0.2;
            alpha = phase < start ? baseOpacity : phase < end ? baseOpacity + 0.65 * ((phase - start) / 0.2) : 1;
          } else {
            alpha = 1 - 0.65 * ((phase - 0.6) / 0.4);
          }
          motionValues[i]?.set(minHeight + 3);
          opacityValues[i]?.set(Math.max(0.2, Math.min(1, alpha)));
        }
      } else if (mode === 'active') {
        const analyser = analyserRef.current;
        const dataArray = dataArrayRef.current;
        if (analyser && dataArray) {
          analyser.getByteFrequencyData(dataArray);

          // 核心 6 频段非线性 Gamma 幂律压缩采样
          for (let b = 0; b < BAR_COUNT; b++) {
            const { start, end } = SPEECH_BANDS[b];
            let sum = 0;
            let count = 0;
            for (let bin = start; bin < end; bin++) {
              sum += dataArray[bin] || 0;
              count++;
            }
            const normalized = count > 0 ? sum / count / 255 : 0;
            const noiseFloor = NOISE_FLOOR[b] ?? 0.08;
            const gated = Math.max(0, normalized - noiseFloor) / (1 - noiseFloor);
            const weight = BAND_WEIGHTS[b] ?? 1;
            // 0.7 次幂强化微弱语音细节
            const compressed = Math.min(1, Math.pow(gated, 0.7) * 1.5 * weight);
            const targetHeight = minHeight + (maxHeight - minHeight) * compressed;

            motionValues[b]?.set(targetHeight);
            opacityValues[b]?.set(1);
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [mode, minHeight, maxHeight]);

  // 6 条柱的物理 X 坐标布局（居中排列）
  const barPositions = [11, 16, 21, 26, 31, 36];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block overflow-visible ${className}`}
    >
      {barPositions.map((posX, index) => (
        <motion.rect
          key={index}
          x={posX}
          width={3}
          rx={1.5}
          fill="var(--cds-clay, #d97757)"
          style={{
            height: motionValues[index],
            opacity: opacityValues[index],
            y: useMotionValue((VIEWBOX_SIZE - minHeight) / 2) // 垂直居中呼吸
          }}
        />
      ))}
    </svg>
  );
};
