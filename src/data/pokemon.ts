import {
  evolutionRequirement,
  nextPokemonEvolutions,
} from "./pokemonEvolution";
import { pokemonItems } from "./pokemonItems";
import roster from "./pokemon.json";
import { pokemonStats } from "../game/statPresentation";
import { statKeys, type Character, type Rarity, type Stats } from "../types";

export const pokemonTypes = [
  ["normal", "#a8a878", "●"],
  ["fire", "#ed7441", "♨"],
  ["water", "#558de6", "≈"],
  ["electric", "#d9ac23", "ϟ"],
  ["grass", "#65a848", "❧"],
  ["ice", "#54b9bf", "❄"],
  ["fighting", "#c44940", "◆"],
  ["poison", "#aa57b5", "◈"],
  ["ground", "#bb9551", "▲"],
  ["flying", "#9584d3", "↗"],
  ["psychic", "#e85e88", "◎"],
  ["bug", "#8caa26", "✦"],
  ["rock", "#a29347", "⬡"],
  ["ghost", "#7d65a8", "☾"],
  ["dragon", "#7958d7", "✧"],
].map(([id, color, symbol]) => ({
  id,
  color,
  symbol,
  name: id[0].toUpperCase() + id.slice(1),
  subtitle: "Kanto · Generation I",
}));

const primary = (p: (typeof roster)[number]) => {
  if ([16, 17, 18, 21, 22, 83, 84, 85].includes(p.number)) return "flying";
  if ([87, 91].includes(p.number)) return "ice";
  return p.types[0];
};
const title = (name: string) =>
  ({
    "nidoran-f": "Nidoran♀",
    "nidoran-m": "Nidoran♂",
    "mr-mime": "Mr. Mime",
    farfetchd: "Farfetch’d",
  })[name] || name[0].toUpperCase() + name.slice(1);
export const pokemonCharacters: Character[] = roster.map((p) => {
  const franchise = primary(p);
  const total = p.stats.reduce((a, b) => a + b, 0);
  const legendary = [144, 145, 146, 150].includes(p.number);
  const evolved = evolutionRequirement(`pokemon-${p.number}`);
  const rarity: Rarity =
    p.number === 151
      ? "Mythic"
      : legendary
        ? "Legendary"
        : !evolved
          ? "Common"
          : evolved.level === 5
            ? "Uncommon"
            : total >= 500
              ? "Epic"
              : "Rare";
  const baseStats: Stats = pokemonStats(p.stats);
  const siblings = roster.filter(
    (other) =>
      primary(other) === franchise &&
      ![144, 145, 146, 150, 151].includes(other.number) &&
      !evolutionRequirement(`pokemon-${other.number}`),
  );
  const starter = siblings
    .slice(0, 4)
    .some((other) => other.number === p.number);
  return {
    id: `pokemon-${p.number}`,
    name: title(p.name),
    franchise,
    group: `${franchise}-type`,
    description: `Kanto Pokédex #${String(p.number).padStart(3, "0")} · ${p.types.map((t) => t[0].toUpperCase() + t.slice(1)).join(" / ")} type. Train, collect and battle with the original 151 Pokémon.`,
    rarity,
    image: `/artwork/pokemon/${p.number}.png`,
    unlockLevel: evolved
      ? 101
      : starter
        ? 1
        : p.number === 151
          ? 30
          : legendary
            ? 20
            : rarity === "Epic"
              ? 12
              : rarity === "Rare"
                ? 8
                : rarity === "Uncommon"
                  ? 5
                  : 3,
    baseLevel: 1,
    maxLevel: 30,
    baseStats,
    maxStats: Object.fromEntries(statKeys.map((k) => [k, 100])) as Stats,
    abilities: ["signature", "focus"],
    compatibleWeapons: pokemonItems
      .filter((i) => i.category === "trainer")
      .map((i) => i.id),
    compatibleEquipment: pokemonItems
      .filter(
        (i) =>
          i.category !== "trainer" &&
          (!i.characters.length ||
            i.characters.includes(`pokemon-${p.number}`)),
      )
      .map((i) => i.id),
    theme: franchise,
    tags: ["pokemon", ...p.types],
    color: pokemonTypes.find((t) => t.id === franchise)!.color,
    avatar: p.number,
  };
});
