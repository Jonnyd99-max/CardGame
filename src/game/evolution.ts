import type { Character, Save } from "../types";
import {
  evolutionRequirement,
  nextPokemonEvolutions,
} from "../data/pokemonEvolution";
import { pokemonMegaStones } from "../data/pokemonItems";

export function evolvedArtwork(
  c: Character,
  stage: number,
  s?: Save,
): Character {
  if (c.tags.includes("pokemon") && s) {
    const stone = pokemonMegaStones.find(
      (item) =>
        s.cards[c.id]?.equipment.includes(item.id) &&
        item.characters.includes(c.id),
    );
    return stone
      ? { ...c, image: stone.megaArtwork!, imageSheet: undefined }
      : s.cards[c.id]?.style === "shiny" && s.pokemonShinies?.includes(c.id)
        ? { ...c, image: `/artwork/pokemon/shiny/${c.id.replace("pokemon-", "")}.png`, imageSheet: undefined }
        : c;
  }
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
  if (c.tags.includes("pokemon")) {
    const requirement = evolutionRequirement(c.id);
    const stage = requirement ? (requirement.level === 15 ? 2 : 1) : 0;
    const next = nextPokemonEvolutions(c.id);
    const mega = pokemonMegaStones.find(
      (item) =>
        s.cards[c.id]?.equipment.includes(item.id) &&
        item.characters.includes(c.id),
    );
    return {
      stage,
      name: mega
        ? "Mega Evolution"
        : requirement
          ? "Evolved Pokémon"
          : "Basic Pokémon",
      nextLevel: next[0]?.level,
    };
  }
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
    name: c.tags.includes("pokemon")
      ? ["Rookie", "Trained", "Mastered"][stage]
      : (names[c.franchise] || names.marvel)[stage],
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
