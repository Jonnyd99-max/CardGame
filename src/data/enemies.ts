import { characters } from "./characters";
import { statKeys, type Character, type Stats } from "../types";
const definitions: [string, string, string, number[]][] = [
  ["rita", "Rita Repulsa", "rangers", [35, 42, 90, 52, 61, 90, 96, 55]],
  ["goldar", "Goldar", "rangers", [89, 62, 48, 88, 85, 76, 72, 30]],
  ["putty", "Putty Patrol", "rangers", [48, 48, 20, 44, 52, 30, 35, 15]],
  ["goblin", "Green Goblin", "marvel", [68, 76, 91, 78, 66, 74, 72, 93]],
  ["ultron", "Ultron", "marvel", [92, 72, 98, 86, 96, 94, 84, 99]],
  ["joker", "The Joker", "dc", [32, 48, 95, 65, 42, 45, 89, 76]],
  ["harley", "Harley Quinn", "dc", [46, 86, 76, 89, 55, 38, 73, 52]],
];
export const enemies: Character[] = definitions.map(
  ([id, name, franchise, values], index) => ({
    ...characters.find((c) => c.franchise === franchise)!,
    id: `enemy-${id}`,
    name,
    franchise,
    description:
      "Campaign opponent. Defeat this enemy to advance your adventure.",
    image:
      index < 3
        ? "/artwork/ranger-enemies-atlas.png"
        : `/artwork/enemy-${id}.${franchise === "dc" ? "jpg" : "png"}`,
    imageSheet: index < 3 ? { columns: 3, rows: 1, index } : undefined,
    baseStats: Object.fromEntries(
      statKeys.map((k, i) => [k, values[i]]),
    ) as Stats,
    rarity: index === 2 ? "Common" : "Epic",
    tags: ["villain"],
    compatibleWeapons: [],
    compatibleEquipment: [],
  }),
);
export const battleCharacters = [...characters, ...enemies];
