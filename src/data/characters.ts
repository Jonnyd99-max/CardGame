import { isPokemon } from "../game/gameMode";
import { pokemonCharacters } from "./pokemon";
import type { Character, Rarity, Stats } from "../types";
import { statKeys } from "../types";
import { characterStats } from "./characterStats";
import { rangerWeapons } from "./weapons";
import { heroCharacter, customHeroId } from "../game/customHeroes";
import type { Save } from "../types";
const entries: [string, string, string, string][] = [
  ["rangers", "morphin", "Red Ranger", "Courage at the heart of every battle."],
  ["rangers", "morphin", "Blue Ranger", "A brilliant mind behind the visor."],
  [
    "rangers",
    "morphin",
    "Pink Ranger",
    "Precision, speed and unstoppable spirit.",
  ],
  ["rangers", "morphin", "Black Ranger", "Rhythm meets raw combat skill."],
  ["rangers", "morphin", "Yellow Ranger", "A fierce and balanced defender."],
  [
    "rangers",
    "morphin",
    "White Ranger",
    "Tommy Oliver channels the power of the White Tiger.",
  ],
  [
    "rangers",
    "morphin",
    "Green Ranger",
    "Tommy Oliver. Dragon Shield. Dragonzord power.",
  ],
  ["rangers", "morphin", "Lord Zedd", "An emperor of cosmic chaos."],
  ["marvel", "spider", "Spider-Man", "Your friendly neighbourhood wildcard."],
  [
    "marvel",
    "avengers",
    "Iron Man",
    "Genius in a suit of endless possibilities.",
  ],
  ["marvel", "avengers", "Captain America", "A shield. A leader. A legend."],
  ["marvel", "avengers", "Black Widow", "Strategy is the deadliest weapon."],
  ["marvel", "xmen", "Wolverine", "Relentless grit and razor-sharp instincts."],
  [
    "marvel",
    "guardians",
    "Star-Lord",
    "A cosmic outlaw with a plan. Probably.",
  ],
  ["marvel", "avengers", "Thor", "Thunder answers his call."],
  ["marvel", "avengers", "Thanos", "A titan with universe-shaking ambition."],
  ["dc", "justice", "Batman", "Preparation is his superpower."],
  ["dc", "justice", "The Flash", "Always one step ahead of time."],
  ["dc", "justice", "Wonder Woman", "Truth, strength and warrior resolve."],
  ["dc", "batfamily", "Nightwing", "Acrobatic skill with a fearless edge."],
  ["dc", "titans", "Raven", "A calm soul with immense hidden power."],
  ["dc", "justice", "Aquaman", "The oceans rise with their king."],
  ["dc", "justice", "Superman", "Hope beyond the horizon."],
  ["dc", "justice", "Darkseid", "The shadow at the end of the cosmos."],
  [
    "rick",
    "smith",
    "Morty Smith",
    "An unlikely hero on impossible adventures.",
  ],
  [
    "rick",
    "smith",
    "Summer Smith",
    "Resourceful, sharp and ready for anything.",
  ],
  ["rick", "smith", "Beth Smith", "Intelligence runs in the family."],
  ["rick", "smith", "Jerry Smith", "Never underestimate the ordinary."],
  ["rick", "citadel", "Evil Morty", "A calculated escape from the rules."],
  ["rick", "creatures", "Birdperson", "Loyalty carried on cosmic wings."],
  ["rick", "citadel", "Rick Sanchez", "Genius without a safety switch."],
  ["rick", "creatures", "Phoenixperson", "Rebuilt for a darker purpose."],
];
const rarity: Rarity[] = [
  "Common",
  "Common",
  "Uncommon",
  "Uncommon",
  "Rare",
  "Epic",
  "Legendary",
  "Mythic",
];
const colors = [
  "#ed576a",
  "#66aefa",
  "#ed86d1",
  "#a591e5",
  "#eac368",
  "#ffc976",
  "#b4c9df",
  "#ab6fde",
];
const multiverseHeroes: Character[] = entries.map(
  ([franchise, group, name, description], i) => {
    const n = i % 8;
    const baseStats = { ...characterStats[`${franchise}-${n}`] };
    return {
      id: `${franchise}-${n}`,
      name,
      franchise,
      group,
      description,
      rarity: rarity[n],
      image:
        franchise === "rangers" || franchise === "rick"
          ? `/artwork/${franchise}-comic-atlas.png`
          : `/artwork/${franchise}-${n}.${(franchise === "marvel" && [3, 4].includes(n)) || (franchise === "dc" && [0, 2].includes(n)) ? "jpg" : "png"}`,
      imageSheet:
        franchise === "rangers" || franchise === "rick"
          ? { columns: 4, rows: 2, index: n }
          : undefined,
      unlockLevel: [1, 1, 1, 1, 5, 10, 20, 30][n],
      baseLevel: 1,
      maxLevel: 30,
      baseStats,
      maxStats: Object.fromEntries(statKeys.map((k) => [k, 100])) as Stats,
      abilities: ["signature", "focus"],
      compatibleWeapons: [
        "pulse-blade",
        "blaster",
        ...(rangerWeapons[`${franchise}-${n}`]
          ? [rangerWeapons[`${franchise}-${n}`]]
          : []),
      ],
      compatibleEquipment:
        franchise === "rangers"
          ? ["shield", "scanner", "morpher"]
          : ["shield", "scanner"],
      theme: franchise,
      tags: [
        n === 7 ? "villain" : "hero",
        [...statKeys].sort((a, b) => baseStats[b] - baseStats[a])[0],
      ],
      color:
        franchise === "rangers"
          ? [
              "#e22e38",
              "#167ad4",
              "#dc3c94",
              "#292e38",
              "#eac523",
              "#d3ad3c",
              "#15974d",
              "#ba3046",
            ][n]
          : colors[n],
      avatar: n,
    };
  },
);
export const heroes = isPokemon ? pokemonCharacters : multiverseHeroes;
const villainDefinitions: [string, string, string, number[]][] = [
  ["rita", "Rita Repulsa", "rangers", [35, 42, 90, 52, 61, 90, 96, 55]],
  ["goldar", "Goldar", "rangers", [89, 62, 48, 88, 85, 76, 72, 30]],
  ["putty", "Putty Patrol", "rangers", [48, 48, 20, 44, 52, 30, 35, 15]],
  ["goblin", "Green Goblin", "marvel", [68, 76, 91, 78, 66, 74, 72, 93]],
  ["ultron", "Ultron", "marvel", [92, 72, 98, 86, 96, 94, 84, 99]],
  ["joker", "The Joker", "dc", [32, 48, 95, 65, 42, 45, 89, 76]],
  ["harley", "Harley Quinn", "dc", [46, 86, 76, 89, 55, 38, 73, 52]],
];
const multiverseVillains: Character[] = villainDefinitions.map(
  ([id, name, franchise, values], index) => ({
    ...multiverseHeroes.find((c) => c.franchise === franchise)!,
    id: `enemy-${id}`,
    name,
    franchise,
    description:
      "Campaign trophy card. Earn this villain by winning its chapter, then train and equip it for your own team.",
    image:
      index < 3
        ? "/artwork/ranger-enemies-atlas.png"
        : `/artwork/enemy-${id}.${franchise === "dc" ? "jpg" : "png"}`,
    imageSheet: index < 3 ? { columns: 3, rows: 1, index } : undefined,
    baseStats: Object.fromEntries(
      statKeys.map((k, i) => [k, values[i]]),
    ) as Stats,
    rarity: index === 2 ? "Common" : "Epic",
    unlockLevel: 101,
    tags: ["villain", "campaign-reward"],
    compatibleWeapons: ["pulse-blade", "blaster"],
    compatibleEquipment: ["shield", "scanner"],
  }),
);
export const villains = isPokemon ? [] : multiverseVillains;
export const characters = [...heroes, ...villains];
export const getCharacters = (s: Save) =>
  s.customHero ? [...characters, heroCharacter(s.customHero)] : characters;
export const getCharacter = (id: string, s?: Save) =>
  id === customHeroId && s?.customHero
    ? heroCharacter(s.customHero)
    : characters.find((c) => c.id === id);
