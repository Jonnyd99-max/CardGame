import fs from "node:fs";
const rate = 22050;
let seed = 73;
const noise = () => {
  seed = (1664525 * seed + 1013904223) >>> 0;
  return seed / 2147483648 - 1;
};
function render(name, seconds, layers) {
  const samples = new Float64Array(Math.ceil(seconds * rate));
  const tone = (at, len, freq, amp = 0.2, kind = "bell", end = freq) => {
    let phase = 0;
    for (let i = 0; i < len * rate; i++) {
      const t = i / rate,
        u = t / len,
        f = freq * Math.pow(end / freq, u);
      phase += (2 * Math.PI * f) / rate;
      const env =
        Math.min(1, t / 0.008) *
        Math.exp(-(kind === "brass" ? 3 : 6) * u) *
        (1 - u);
      const v =
        kind === "bell"
          ? Math.sin(phase) +
            0.3 * Math.sin(phase * 2.01) +
            0.13 * Math.sin(phase * 3.97)
          : kind === "brass"
            ? Math.sin(phase) +
              0.28 * Math.sin(2 * phase) +
              0.14 * Math.sin(3 * phase)
            : Math.sin(phase);
      const j = Math.floor(at * rate) + i;
      if (j < samples.length) samples[j] += amp * env * v;
    }
  };
  const burst = (at, len, amp = 0.3, filter = 0.12) => {
    let low = 0;
    for (let i = 0; i < len * rate; i++) {
      const t = i / rate,
        u = t / len;
      low += filter * (noise() - low);
      const j = Math.floor(at * rate) + i;
      if (j < samples.length)
        samples[j] +=
          low *
          amp *
          Math.sin(Math.PI * Math.min(1, u * 3)) *
          Math.pow(1 - u, 2);
    }
  };
  layers(tone, burst);
  // Short diffuse reflections create space without muddying the impact.
  for (const delay of [0.043, 0.079, 0.131])
    for (let i = samples.length - 1; i >= delay * rate; i--)
      samples[i] += 0.12 * samples[i - Math.floor(delay * rate)];
  const peak = Math.max(0.01, ...Array.from(samples, Math.abs));
  const out = Buffer.alloc(44 + samples.length * 2);
  out.write("RIFF");
  out.writeUInt32LE(out.length - 8, 4);
  out.write("WAVEfmt ", 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) =>
    out.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, (v / peak) * 0.72)) * 32767),
      44 + i * 2,
    ),
  );
  fs.writeFileSync(`public/audio/${name}.wav`, out);
}
render("impact", 0.65, (t, n) => {
  n(0, 0.09, 0.8, 0.5);
  t(0.015, 0.25, 125, 0.8, "bass", 40);
  n(0.05, 0.28, 0.6, 0.08);
});
render("whoosh", 0.6, (t, n) => {
  n(0, 0.38, 0.8, 0.35);
  t(0.12, 0.24, 440, 0.12, "bass", 90);
  n(0.3, 0.1, 0.4, 0.7);
});
render("blaster", 0.65, (t, n) => {
  t(0, 0.22, 1700, 0.45, "bass", 100);
  t(0.07, 0.25, 950, 0.3, "bass", 70);
  n(0.02, 0.12, 0.3, 0.7);
});
render("energy", 0.9, (t, n) => {
  t(0, 0.55, 180, 0.3, "brass", 1100);
  n(0.2, 0.35, 0.5, 0.06);
  t(0.4, 0.3, 880, 0.2);
});
render("roundWin", 1, (t, n) => {
  n(0, 0.12, 0.3, 0.1);
  [392, 493.88, 587.33].forEach((f, i) => t(0.12 + i * 0.075, 0.65, f, 0.25));
});
render("roundLoss", 0.95, (t, n) => {
  t(0, 0.5, 110, 0.5, "bass", 42);
  n(0.03, 0.32, 0.45, 0.06);
  t(0.13, 0.5, 185, 0.12, "brass", 110);
});
render("draw", 0.75, (t, n) => {
  n(0, 0.1, 0.45, 0.5);
  [440, 466].forEach((f) => t(0.03, 0.5, f, 0.18));
});
render("matchWin", 2.4, (t, n) => {
  [261.63, 329.63, 392, 523.25].forEach((f, i) =>
    t(i * 0.17, 0.6, f, 0.3, "brass"),
  );
  [261.63, 329.63, 392, 523.25].forEach((f) => t(0.95, 1.15, f, 0.17, "brass"));
  n(0.9, 0.12, 0.25, 0.2);
  t(0.94, 0.4, 80, 0.4, "bass", 38);
});
render("matchLoss", 1.5, (t, n) => {
  [293.66, 261.63, 220, 146.83].forEach((f, i) =>
    t(i * 0.2, 0.6, f, 0.24, "brass"),
  );
  n(0.5, 0.5, 0.3, 0.04);
});
render("upgrade", 1.4, (t, n) => {
  t(0, 0.6, 130, 0.22, "brass", 700);
  [523, 659, 784, 1047].forEach((f, i) => t(0.35 + i * 0.08, 0.8, f, 0.2));
});
render("unlock", 1.7, (t, n) => {
  [523, 784, 1047, 1568].forEach((f, i) => t(i * 0.12, 1, f, 0.22));
  n(0.1, 0.7, 0.3, 0.5);
});
render("pack", 1.8, (t, n) => {
  n(0, 0.3, 0.9, 0.7);
  n(0.12, 0.2, 0.65, 0.8);
  t(0.25, 0.5, 100, 0.3, "bass", 40);
  n(0.3, 0.6, 0.6, 0.06);
  [659, 988, 1318, 1976].forEach((f, i) => t(0.45 + i * 0.07, 0.95, f, 0.2));
});
render("equip", 0.55, (t, n) => {
  n(0, 0.055, 0.65, 0.7);
  t(0.04, 0.3, 850, 0.28);
  t(0.075, 0.25, 1275, 0.15);
});
render("reward", 1.2, (t, n) => {
  [1047, 1318, 1568].forEach((f, i) => t(i * 0.09, 0.7, f, 0.2));
  n(0.01, 0.06, 0.4, 0.5);
});
