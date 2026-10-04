import type { Item, Stats } from "../types";
import roster from "./pokemon.json";
import megaStats from "./pokemonMegaStats.json";
import { pokemonStats } from "../game/statPresentation";
const activeModifiers = (m: Partial<Stats>): Partial<Stats> => {
  const result = { ...m };
  if (m.combat) { result.strength = (result.strength || 0) + m.combat; delete result.combat; }
  if (m.special) { result.power = (result.power || 0) + m.special; delete result.special; }
  return result;
};

const held = (
  id: string,
  name: string,
  modifiers: Partial<Stats>,
  cost: number,
  description: string,
): Item => ({
  id,
  name,
  modifiers: activeModifiers(modifiers),
  cost,
  description,
  image: `/artwork/items/${id}.png`,
  rarity: "Uncommon",
  unlockLevel: 1,
  franchises: [],
  groups: [],
  characters: [],
  slot: "equipment",
  category: "held-item",
});
export const pokemonHeldItems: Item[] = [
  held(
    "leftovers",
    "Leftovers",
    { durability: 4, strength: 2 },
    120,
    "A sustaining held item that improves endurance in stat battles.",
  ),
  held(
    "wise-glasses",
    "Wise Glasses",
    { intelligence: 3, power: 4 },
    100,
    "Sharpen your Pokémon’s special techniques and battle judgement.",
  ),
  held(
    "muscle-band",
    "Muscle Band",
    { combat: 4, strength: 2 },
    150,
    "Strengthen physical attacks.",
  ),
  held(
    "charcoal",
    "Charcoal",
    { power: 4, special: 3 },
    180,
    "Boost Fire Pokémon’s attacks.",
  ),
  held(
    "mystic-water",
    "Mystic Water",
    { power: 4, special: 3 },
    180,
    "Boost Water Pokémon’s attacks.",
  ),
  held(
    "miracle-seed",
    "Miracle Seed",
    { power: 4, special: 3 },
    180,
    "Boost Grass Pokémon’s attacks.",
  ),
  held(
    "quick-claw",
    "Quick Claw",
    { speed: 5 },
    160,
    "Give your Pokémon a faster start.",
  ),
  held(
    "focus-sash",
    "Focus Sash",
    { durability: 6 },
    200,
    "Help your Pokémon withstand powerful attacks.",
  ),
].map((item) => ({ ...item, franchises: [] }));
// Type-restricted held items accept either type of a dual-type Pokémon.
export const heldItemTypes: Record<string, string> = {
  charcoal: "fire",
  "mystic-water": "water",
  "miracle-seed": "grass",
};

const megaDefinitions: [string, string, number, string, Partial<Stats>][] = [
  [
    "venusaurite",
    "Venusaurite",
    3,
    "venusaur-mega",
    { durability: 8, special: 8 },
  ],
  [
    "charizardite-x",
    "Charizardite X",
    6,
    "charizard-mega-x",
    { strength: 8, combat: 8 },
  ],
  [
    "charizardite-y",
    "Charizardite Y",
    6,
    "charizard-mega-y",
    { power: 8, special: 8 },
  ],
  [
    "blastoisinite",
    "Blastoisinite",
    9,
    "blastoise-mega",
    { durability: 8, power: 8 },
  ],
  ["beedrillite", "Beedrillite", 15, "beedrill-mega", { speed: 8, combat: 8 }],
  ["pidgeotite", "Pidgeotite", 18, "pidgeot-mega", { speed: 8, special: 8 }],
  ["raichunite-x", "Raichunite X", 26, "raichu-mega-x", { speed: 8, power: 8 }],
  ["raichunite-y", "Raichunite Y", 26, "raichu-mega-y", { special: 8, tech: 8 }],
  ["clefablite", "Clefablite", 36, "clefable-mega", { durability: 8, special: 8 }],
  ["victreebelite", "Victreebelite", 71, "victreebel-mega", { strength: 8, power: 8 }],
  ["starminite", "Starminite", 121, "starmie-mega", { speed: 8, combat: 8 }],
  ["dragoninite", "Dragoninite", 149, "dragonite-mega", { strength: 8, special: 8 }],
  [
    "alakazite",
    "Alakazite",
    65,
    "alakazam-mega",
    { intelligence: 8, special: 8 },
  ],
  [
    "slowbronite",
    "Slowbronite",
    80,
    "slowbro-mega",
    { durability: 8, power: 8 },
  ],
  ["gengarite", "Gengarite", 94, "gengar-mega", { speed: 8, special: 8 }],
  ["arcaninite", "Arcaninite", 59, "arcanine-mega", { strength: 8, speed: 8 }],
  [
    "kangaskhanite",
    "Kangaskhanite",
    115,
    "kangaskhan-mega",
    { strength: 8, combat: 8 },
  ],
  ["pinsirite", "Pinsirite", 127, "pinsir-mega", { strength: 8, speed: 8 }],
  [
    "gyaradosite",
    "Gyaradosite",
    130,
    "gyarados-mega",
    { strength: 8, durability: 8 },
  ],
  [
    "aerodactylite",
    "Aerodactylite",
    142,
    "aerodactyl-mega",
    { speed: 8, combat: 8 },
  ],
  [
    "mewtwonite-x",
    "Mewtwonite X",
    150,
    "mewtwo-mega-x",
    { strength: 8, combat: 8 },
  ],
  [
    "mewtwonite-y",
    "Mewtwonite Y",
    150,
    "mewtwo-mega-y",
    { intelligence: 8, special: 8 },
  ],
];
export const pokemonMegaStones: Item[] = megaDefinitions.map(
  ([id, name, number, form, modifiers]) => ({
    id,
    name,
    modifiers: (() => {
      const raw = megaStats[form as keyof typeof megaStats];
      if (!raw) return activeModifiers(modifiers);
      const base = pokemonStats(roster.find(p => p.number === number)!.stats);
      const mega = pokemonStats(raw);
      return Object.fromEntries(Object.keys(base).map(k => [k, mega[k as keyof Stats] - base[k as keyof Stats]]));
    })(),
    cost: 400,
    description:
      id === "arcaninite"
        ? "A custom Mega Stone for Arcanine. Activates Mega Arcanine artwork and grants +8 strength and +8 speed while equipped."
        : "Equip to use this Mega form’s stat profile and artwork. Some stats can decrease as its strengths change. Removing the stone restores the regular form.",
    image: `/artwork/items/${id}.${["raichunite-x", "raichunite-y", "clefablite", "victreebelite", "starminite", "dragoninite", "arcaninite"].includes(id) ? "svg" : "png"}`,
    rarity: "Legendary",
    unlockLevel: 5,
    franchises: [],
    groups: [],
    characters: [`pokemon-${number}`],
    slot: "equipment",
    category: "mega-stone",
    megaArtwork:
      id === "arcaninite"
        ? "/artwork/pokemon/mega/arcanine-mega.jpg"
        : `/artwork/pokemon/mega/${form}.png`,
  }),
);

const trainers: [string, string, string, string, Partial<Stats>][] = [
  [
    "trainer-oak",
    "Professor Oak",
    "Professor’s Insight",
    "Improves battle judgement and special technique.",
    { intelligence: 5, special: 3 },
  ],
  [
    "trainer-brock",
    "Brock",
    "Rock Solid",
    "Adds resilience and physical strength.",
    { durability: 6, strength: 2 },
  ],
  [
    "trainer-misty",
    "Misty",
    "Cascade",
    "Adds special attack power and speed.",
    { power: 5, speed: 3 },
  ],
  [
    "trainer-surge",
    "Lt. Surge",
    "Thunder Drive",
    "Adds speed and combat precision.",
    { speed: 5, combat: 3 },
  ],
  [
    "trainer-erika",
    "Erika",
    "Garden Guard",
    "Adds endurance and special technique.",
    { durability: 4, special: 4 },
  ],
  [
    "trainer-koga",
    "Koga",
    "Ninja Training",
    "Adds speed and battle judgement.",
    { speed: 5, intelligence: 3 },
  ],
  [
    "trainer-sabrina",
    "Sabrina",
    "Mind Over Matter",
    "Adds intelligence and special power.",
    { intelligence: 5, power: 3 },
  ],
  [
    "trainer-blaine",
    "Blaine",
    "Burning Spirit",
    "Adds power and physical strength.",
    { power: 5, strength: 3 },
  ],
  [
    "trainer-giovanni",
    "Giovanni",
    "Ground Control",
    "Adds combat strength and endurance.",
    { combat: 5, durability: 3 },
  ],
];
export const pokemonTrainers: Item[] = trainers.map(
  ([id, name, ability, description, modifiers]) => ({
    id,
    name,
    description: `Grants ${ability} while assigned. ${description}`,
    modifiers: {},
    cost: 220,
    image: `/artwork/trainers/${id.replace("trainer-", "")}.png`,
    rarity: "Rare",
    unlockLevel: 1,
    franchises: [],
    groups: [],
    characters: [],
    slot: "weapon",
    category: "trainer",
    grantedAbility: { name: ability, description, modifiers: activeModifiers(modifiers) },
  }),
);
export const pokemonItems = [
  ...pokemonHeldItems,
  ...pokemonMegaStones,
  ...pokemonTrainers,
];
export const legacyPokemonItems: Record<string, string> = {
  shield: "leftovers",
  scanner: "wise-glasses",
  "pulse-blade": "muscle-band",
  blaster: "quick-claw",
};
