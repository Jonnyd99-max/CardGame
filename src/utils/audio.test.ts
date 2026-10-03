import { afterEach, expect, it, vi } from "vitest";
import { AudioService, audioEvents } from "./audio";
const runtimeModule: string = "node:fs";
const fs = await import(runtimeModule);
afterEach(() => vi.unstubAllGlobals());
it("waits for browser activation, decodes samples and reuses the audio cache", async () => {
  let finish!: () => void;
  const source = {
    connect: vi.fn(),
    start: vi.fn(),
    disconnect: vi.fn(),
    buffer: null,
  };
  const create = vi.fn(() => source),
    decode = vi.fn(async () => ({}));
  class Context {
    state = "suspended";
    currentTime = 10;
    destination = {};
    resume() {
      return new Promise<void>((resolve) => {
        finish = () => {
          this.state = "running";
          resolve();
        };
      });
    }
    createBufferSource = create;
    decodeAudioData = decode;
    createGain() {
      return { gain: { value: 0 }, connect: vi.fn(), disconnect: vi.fn() };
    }
  }
  vi.stubGlobal("window", { AudioContext: Context });
  const fetcher = vi.fn(async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  }));
  vi.stubGlobal("fetch", fetcher);
  const audio = new AudioService();
  audio.enabled = true;
  const pending = audio.play("roundWin");
  expect(create).not.toHaveBeenCalled();
  finish();
  expect(await pending).toBe(true);
  expect(source.start).toHaveBeenCalledWith(10.03);
  expect(await audio.play("roundWin", 0.35)).toBe(true);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(decode).toHaveBeenCalledTimes(1);
  expect(source.start.mock.calls.at(-1)?.[0]).toBeCloseTo(10.38);
});
it("reports unsupported or disabled audio", async () => {
  vi.stubGlobal("window", {});
  const audio = new AudioService();
  expect(await audio.play("matchWin")).toBe(false);
  audio.enabled = true;
  expect(await audio.play("matchWin")).toBe(false);
});
it("ships valid, audible and unclipped PCM recordings for every event", () => {
  for (const event of audioEvents) {
    const data = fs.readFileSync(`public/audio/${event}.wav`);
    expect(data.toString("ascii", 0, 4)).toBe("RIFF");
    expect(data.readUInt32LE(24)).toBe(22050);
    let peak = 0,
      sum = 0;
    for (let i = 44; i < data.length; i += 2) {
      const x = data.readInt16LE(i);
      peak = Math.max(peak, Math.abs(x));
      sum += x * x;
    }
    expect(peak).toBeLessThan(32767);
    expect(peak).toBeGreaterThan(15000);
    expect(Math.sqrt(sum / ((data.length - 44) / 2))).toBeGreaterThan(500);
  }
});
