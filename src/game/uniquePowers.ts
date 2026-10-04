import type { Stats, Stat } from "../types";
export const uniquePowers: Record<
  string,
  {
    name: string;
    modifiers?: Partial<Stats>;
    enemyModifiers?: Partial<Stats>;
    selectedCurse?: boolean;
    adaptive?: boolean;
    swapEnemy?: boolean;
  }
> = {
  "rangers-5": {
    name: "White Tiger Guard",
    modifiers: { durability: 12, combat: 6 },
  },
  "rangers-6": { name: "Dragon Shield" },
  "rangers-7": {
    name: "Emperor's Dominion",
    modifiers: { power: 12, special: 6 },
    enemyModifiers: { tech: -6 },
  },
  "marvel-5": { name: "Element Blasters", modifiers: { tech: 12, combat: 6 } },
  "marvel-6": { name: "Thunder Strike", modifiers: { power: 12, special: 8 } },
  "marvel-7": {
    name: "Infinity Surge",
    modifiers: { strength: 12, power: 8, speed: -6 },
  },
  "dc-5": {
    name: "Trident of Atlantis",
    modifiers: { strength: 10, combat: 8 },
  },
  "dc-6": { name: "Solar Charge", modifiers: { strength: 12, durability: 8 } },
  "dc-7": { name: "Omega Beams", modifiers: { special: 12, power: 8 } },
  "rick-5": { name: "Aerial Assault", modifiers: { speed: 12, combat: 6 } },
  "rick-6": { name: "Portal recalibration" },
  "rick-7": {
    name: "Cybernetic Overdrive",
    modifiers: { tech: 12, durability: 8 },
  },
  "enemy-rita": {
    name: "Moon Curse",
    modifiers: { special: 10 },
    selectedCurse: true,
  },
  "enemy-goldar": {
    name: "Golden Fury",
    modifiers: { strength: 12, combat: 6 },
  },
  "enemy-goblin": { name: "Pumpkin Bombs", modifiers: { tech: 12, speed: 6 } },
  "enemy-ultron": {
    name: "Adaptive Armour",
    modifiers: { durability: 6 },
    adaptive: true,
  },
  "enemy-joker": { name: "Chaos Swap", swapEnemy: true },
  "enemy-harley": {
    name: "Mallet Mayhem",
    modifiers: { speed: 12, combat: 6 },
  },
};
export function uniqueEffect(
  id: string,
  stat: Stat,
  stage = 0,
  rng = Math.random,
) {
  if (id === "rangers-6") return { shield: true };
  if (id === "rick-6")
    return {
      value:
        70 +
        stage * 5 +
        Math.floor(Math.max(0, Math.min(0.999999, rng())) * (31 - stage * 5)),
    };
  const power = uniquePowers[id];
  if (!power) return {};
  const modifiers = Object.fromEntries(
    Object.entries(power.modifiers || {}).map(([k, v]) => [
      k,
      v! + (v! > 0 ? stage * 2 : 0),
    ]),
  ) as Partial<Stats>;
  if (power.adaptive) modifiers[stat] = 10 + stage * 2;
  return {
    modifiers,
    enemyModifiers: {
      ...power.enemyModifiers,
      ...(power.selectedCurse ? { [stat]: -8 } : {}),
    },
    swapEnemy: power.swapEnemy,
  };
}
export function modifyStats(values: Stats, modifiers?: Partial<Stats>) {
  for (const [k, v] of Object.entries(modifiers || {}))
    values[k as Stat] = Math.max(1, Math.min(100, values[k as Stat] + v!));
}
export function uniqueDescription(id: string, stat: Stat, stage = 0) {
  if (id === "rick-6")
    return `Reroll ${stat} to ${70 + stage * 5}–100. It may become lower.`;
  if (id === "rangers-6")
    return `+${12 + stage * 2} durability and +${6 + stage * 2} combat this round.`;
  const effect = uniqueEffect(id, stat, stage, () => 0);
  const parts = Object.entries(effect.modifiers || {}).map(
    ([k, v]) => `${v! > 0 ? "+" : ""}${v} own ${k}`,
  );
  parts.push(
    ...Object.entries(effect.enemyModifiers || {}).map(
      ([k, v]) => `${v} rival ${k}`,
    ),
  );
  if (effect.swapEnemy) parts.push("swap the rival's power and intelligence");
  return `${parts.join(" · ")}. Lasts this round; values stay within 1–100.`;
}
