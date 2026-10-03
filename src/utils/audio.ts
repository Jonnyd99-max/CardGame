export type AudioEvent =
  | "roundWin"
  | "roundLoss"
  | "matchWin"
  | "upgrade"
  | "unlock"
  | "pack";
// Original locally synthesised sound effects.
export class AudioService {
  enabled = false;
  private context?: AudioContext;
  private assets: Partial<Record<AudioEvent, string>> = {};
  register(event: AudioEvent, url: string) {
    this.assets[event] = url;
  }
  async play(event: AudioEvent): Promise<boolean> {
    if (!this.enabled || typeof window === "undefined") return false;
    const url = this.assets[event];
    if (url) {
      try {
        await new Audio(url).play();
        return true;
      } catch {
        return false;
      }
    }
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return false;
      if (!this.context || this.context.state === "closed")
        this.context = new AudioCtor();
      const ctx = this.context;
      if (ctx.state !== "running") await ctx.resume();
      if (ctx.state !== "running") return false;
      const notes: Record<AudioEvent, number[]> = {
        roundWin: [523, 784],
        roundLoss: [220, 110],
        matchWin: [523, 659, 784, 1047],
        upgrade: [330, 440, 660],
        unlock: [440, 660, 880],
        pack: [220, 330, 440, 880, 1320],
      };
      const start = ctx.currentTime + 0.03;
      notes[event].forEach((frequency, i) => {
        const oscillator = ctx.createOscillator(),
          gain = ctx.createGain();
        const at = start + i * 0.09;
        oscillator.type = event === "roundLoss" ? "sawtooth" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, at);
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.18, at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.18);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.2);
        oscillator.onended = () => {
          oscillator.disconnect();
          gain.disconnect();
        };
      });
      return true;
    } catch {
      return false;
    }
  }
}
export const audio = new AudioService();
