export const statKeys = [
  "strength",
  "speed",
  "intelligence",
  "combat",
  "durability",
  "power",
  "special",
  "tech",
] as const;
export type Stat = (typeof statKeys)[number];
export type Stats = Record<Stat, number>;
export type Rarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Epic"
  | "Legendary"
  | "Mythic";
export interface Character {
  customLook?: { head: number; body: number; background: number };
  id: string;
  name: string;
  franchise: string;
  group: string;
  description: string;
  rarity: Rarity;
  image: string;
  imageSheet?: { columns: number; rows: number; index: number };
  unlockLevel: number;
  baseLevel: number;
  maxLevel: number;
  baseStats: Stats;
  maxStats: Stats;
  abilities: string[];
  compatibleWeapons: string[];
  compatibleEquipment: string[];
  theme: string;
  tags: string[];
  color: string;
  avatar: number;
}
export interface Item {
  category?: "held-item" | "mega-stone" | "trainer";
  grantedAbility?: {
    name: string;
    description: string;
    modifiers: Partial<Stats>;
  };
  megaArtwork?: string;
  id: string;
  name: string;
  rarity: Rarity;
  image: string;
  imageSheet?: { columns: number; rows: number; index: number };
  description: string;
  modifiers: Partial<Stats>;
  unlockLevel: number;
  franchises: string[];
  groups: string[];
  characters: string[];
  slot: "weapon" | "equipment";
  cost: number;
}
export interface CardProgress {
  level: number;
  xp: number;
  equipment: string[];
  boosts: Partial<Stats>;
  abilities: string[];
  style: string;
  wins: number;
}
export type DeckRule = "Mixed Universe" | "Single Franchise" | "Single Group";
export interface Deck {
  id: string;
  name: string;
  cards: string[];
  rule: DeckRule;
}
export interface Save {
  pokemonAcquisitionVersion?: 1;
  pokemonSeen?: string[];
  pokemonShinies?: string[];
  pokemonMegaSeen?: string[];
  pokemonProgressionVersion?: 1;
  customHero?: {
    name: string;
    franchise: string;
    stats: Stats;
    look: { head: number; body: number; background: number };
  };
  campaign?: string[];
  campaignStars?: Record<string, number>;
  packsOpened?: number;
  balanceVersion?: number;
  starterFranchise?: string;
  presentationVersion?: number;
  version: 1;
  name: string;
  xp: number;
  coins: number;
  materials: number;
  owned: string[];
  cards: Record<string, CardProgress>;
  items: Record<string, number>;
  decks: Deck[];
  activeDeck: string;
  favourite: string;
  franchise: string;
  group: string;
  wins: number;
  losses: number;
  roundWins: number;
  strengthWins: number;
  perfectWins: number;
  franchiseWins: Record<string, number>;
  upgrades: number;
  equips: number;
  claimed: string[];
  daily: string;
  settings: { sound: boolean; animations: boolean; reducedMotion: boolean };
  history: { date: string; mode: string; won: boolean; score: string }[];
  periods: {
    daily: string;
    weekly: string;
    dailyWins: number;
    weeklyWins: number;
  };
}
export type Mode =
  | "Quick Battle"
  | "Classic"
  | "Best of"
  | "Team Battle"
  | "Crossover Battle";
export type Difficulty = "Easy" | "Normal" | "Hard" | "Expert";
