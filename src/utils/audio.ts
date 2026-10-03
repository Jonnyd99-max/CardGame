export type AudioEvent =
  | "roundWin"
  | "roundLoss"
  | "matchWin"
  | "upgrade"
  | "unlock";
// Register licensed audio files here later; consumers emit semantic events only.
export class AudioService {
  enabled = false;
  private assets: Partial<Record<AudioEvent, string>> = {};
  register(event: AudioEvent, url: string) {
    this.assets[event] = url;
  }
  play(event: AudioEvent) {
    const url = this.assets[event];
    if (this.enabled && url) void new Audio(url).play().catch(() => {});
  }
}
export const audio = new AudioService();
