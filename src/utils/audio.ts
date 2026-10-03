import { assetUrl } from "../game/assetUrl";
export const audioEvents = [
  "impact",
  "whoosh",
  "blaster",
  "energy",
  "roundWin",
  "roundLoss",
  "draw",
  "matchWin",
  "matchLoss",
  "upgrade",
  "unlock",
  "pack",
  "equip",
  "reward",
] as const;
export type AudioEvent = (typeof audioEvents)[number];
export class AudioService {
  enabled = false;
  private context?: AudioContext;
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private assets: Partial<Record<AudioEvent, string>> = {};
  register(event: AudioEvent, url: string) {
    this.assets[event] = url;
  }
  async play(event: AudioEvent, delay = 0): Promise<boolean> {
    if (!this.enabled || typeof window === "undefined") return false;
    try {
      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtor) return false;
      if (!this.context || this.context.state === "closed") {
        this.context = new AudioCtor();
        this.buffers.clear();
      }
      const ctx = this.context;
      if (ctx.state !== "running") await ctx.resume();
      if (ctx.state !== "running") return false;
      const url = this.assets[event] || assetUrl(`/audio/${event}.wav`);
      if (!this.buffers.has(url))
        this.buffers.set(
          url,
          fetch(url)
            .then((r) => {
              if (!r.ok) throw new Error("Audio unavailable");
              return r.arrayBuffer();
            })
            .then((data) => ctx.decodeAudioData(data))
            .catch((error) => {
              this.buffers.delete(url);
              throw error;
            }),
        );
      const buffer = await this.buffers.get(url)!;
      if (!this.enabled) return false;
      const source = ctx.createBufferSource(),
        gain = ctx.createGain();
      source.buffer = buffer;
      gain.gain.value = 0.65;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      source.start(ctx.currentTime + 0.03 + delay);
      return true;
    } catch {
      return false;
    }
  }
}
export const audio = new AudioService();
