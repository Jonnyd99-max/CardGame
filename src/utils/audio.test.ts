import { afterEach, expect, it, vi } from "vitest";
import { AudioService } from "./audio";
afterEach(() => vi.unstubAllGlobals());
it("waits for browser audio activation before scheduling effects", async () => {
  let finish!: () => void;
  const oscillator = {
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const create = vi.fn(() => oscillator);
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
    createOscillator = create;
    createGain() {
      return gain;
    }
  }
  vi.stubGlobal("window", { AudioContext: Context });
  const audio = new AudioService();
  audio.enabled = true;
  const pending = audio.play("roundWin");
  expect(create).not.toHaveBeenCalled();
  finish();
  expect(await pending).toBe(true);
  expect(create).toHaveBeenCalledTimes(2);
  expect(oscillator.start).toHaveBeenCalledWith(10.03);
});
it("reports unsupported or disabled audio instead of silently claiming success", async () => {
  vi.stubGlobal("window", {});
  const audio = new AudioService();
  expect(await audio.play("matchWin")).toBe(false);
  audio.enabled = true;
  expect(await audio.play("matchWin")).toBe(false);
});
