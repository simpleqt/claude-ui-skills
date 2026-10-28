/*
  Sourced from open-claude-ui (https://github.com/Caho1/open-claude-ui)
  © Caho1, MIT License. Distilled into cds skills with attribution.
*/
/**
 * Open Claude UI - 官方语音与交互音效引擎
 * 支持原生 Web Audio 振荡器无损合成，免除外部专有 MP3 版权依赖
 */

export type ClaudeSfxName =
  | 'enter_voice_mode'
  | 'exit_voice_mode'
  | 'disconnected'
  | 'tool_approval_needed';

export class ClaudeAudioPlayer {
  private static instance: ClaudeAudioPlayer | null = null;
  private audioContext: AudioContext | null = null;
  private sfxAudioMap: Map<ClaudeSfxName, HTMLAudioElement> = new Map();
  private sfxPaths: Partial<Record<ClaudeSfxName, string>> = {};
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): ClaudeAudioPlayer {
    if (!ClaudeAudioPlayer.instance) {
      ClaudeAudioPlayer.instance = new ClaudeAudioPlayer();
    }
    return ClaudeAudioPlayer.instance;
  }

  /**
   * 自定义配置特定音效文件的外部路径 (BYO Assets)
   */
  public setSfxPath(name: ClaudeSfxName, path: string): void {
    this.sfxPaths[name] = path;
    if (typeof window !== 'undefined') {
      const audio = new Audio(path);
      audio.volume = 0.3;
      this.sfxAudioMap.set(name, audio);
    }
  }

  /**
   * 初始化 Web Audio 上下文与音频管线
   * 遵循 30% 舒缓音量标准
   */
  public async init(speakerDeviceId?: string): Promise<boolean> {
    if (this.isInitialized && this.audioContext?.state === 'running') {
      return true;
    }
    if (typeof window === 'undefined') return false;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // 如果指定了特定扬声器设备，执行硬件路由绑定
      if (speakerDeviceId && typeof (this.audioContext as any).setSinkId === 'function') {
        await (this.audioContext as any).setSinkId(speakerDeviceId);
      }

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[ClaudeAudioPlayer] Failed to initialize Web Audio pipeline:', err);
      return false;
    }
  }

  /**
   * 使用纯原生 Web Audio API 振荡器无损合成音效
   * 零外部音频文件依赖，合规安全，无网络加载延迟
   */
  public playSynthetic(name: ClaudeSfxName): void {
    if (!this.audioContext || this.audioContext.state !== 'running') return;
    const ctx = this.audioContext;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    gain.gain.setValueAtTime(0.001, now);

    switch (name) {
      case 'enter_voice_mode':
        // 双音阶轻快上扬 (440Hz -> 880Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'exit_voice_mode':
        // 单音阶柔和下沉 (880Hz -> 440Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'tool_approval_needed':
        // 温暖木质共振双击音 (520Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'disconnected':
        // 降调平滑衰减提示 (320Hz -> 180Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.25);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  }

  /**
   * 播放交互提示音（优先播放自定义音频，缺省时自动降级至 Web Audio 原生合成音）
   */
  public async play(name: ClaudeSfxName): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const audio = this.sfxAudioMap.get(name);
    if (audio && audio.src) {
      try {
        audio.currentTime = 0;
        await audio.play();
        return;
      } catch {
        // Fallback to synthetic
      }
    }

    this.playSynthetic(name);
  }

  public async setSpeakerDevice(deviceId: string): Promise<void> {
    if (!this.audioContext || typeof (this.audioContext as any).setSinkId !== 'function') return;
    try {
      await (this.audioContext as any).setSinkId(deviceId);
    } catch (err) {
      console.warn('[ClaudeAudioPlayer] setSinkId failed:', err);
    }
  }
}
