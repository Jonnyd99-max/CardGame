import type { Character, Save } from "../types";

export function evolvedArtwork(c: Character, stage: number): Character {
  if (!stage) return c;
  if (c.customLook) return c;
  if (c.id.startsWith("enemy-") || !["rangers", "rick"].includes(c.franchise))
    return c;
  const index = Number(c.id.split("-").at(-1));
  return {
    ...c,
    image: `/artwork/evolution-${c.franchise}.png`,
    imageSheet: { columns: 4, rows: 4, index: index + (stage - 1) * 8 },
  };
}

export function evolutionFor(c: Character, s: Save) {
  const level = s.owned.includes(c.id) ? s.cards[c.id]?.level || 1 : 1;
  const stage = c.customLook
    ? level >= 100
      ? 2
      : level >= 85
        ? 1
        : 0
    : level >= 10
      ? 2
      : level >= 5
        ? 1
        : 0;
  const names: Record<string, string[]> = {
    rangers: ["Original form", "Armoured form", "Morphin Master"],
    marvel: ["Original form", "Heroic form", "Legendary form"],
    dc: ["Original form", "Ascendant form", "Legendary form"],
    rick: ["Original form", "Dimension jumper", "Multiverse master"],
  };
  return {
    stage,
    name: (names[c.franchise] || names.marvel)[stage],
    nextLevel:
      stage === 0
        ? c.customLook
          ? 85
          : 5
        : stage === 1
          ? c.customLook
            ? 100
            : 10
          : undefined,
  };
}
