import type { Character, Rarity, Stats } from "../types";
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
export const characters: Character[] = entries.map(
  ([franchise, group, name, description], i) => {
    const n = i % 8;
    const vals = Array.from({ length: 8 }, (_, s) =>
      Math.min(95, 48 + ((i * 13 + s * 17) % 35) + n),
    );
    if (n === 1) vals[2] = 92;
    if (n === 2) vals[1] = 91;
    if (n === 6) vals[0] = 94;
    const keys = [
      "strength",
      "speed",
      "intelligence",
      "combat",
      "durability",
      "power",
      "special",
      "tech",
    ];
    const baseStats = Object.fromEntries(
      keys.map((k, s) => [k, vals[s]]),
    ) as Stats;
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
      maxStats: Object.fromEntries(keys.map((k) => [k, 100])) as Stats,
      abilities: ["signature", "focus"],
      compatibleWeapons: ["pulse-blade", "blaster"],
      compatibleEquipment:
        franchise === "rangers"
          ? ["shield", "scanner", "morpher"]
          : ["shield", "scanner"],
      theme: franchise,
      tags: [
        n === 7 ? "villain" : "hero",
        n === 1 ? "intelligence" : "balanced",
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
