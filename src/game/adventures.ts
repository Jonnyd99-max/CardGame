import { characters } from "../data/characters";
import { rangerWeapons } from "../data/weapons";
import {
  cardProgress,
  grantXP,
  playerLevel,
  unlockLevelFor,
  validateDeck,
} from "./progression";
import { createBattle, type Battle } from "./battle";
import type { Save, Stats } from "../types";

export const chapters = [
  {
    id: "arrival",
    name: "Trouble in Angel Grove",
    story:
      "A portal has scattered rivals across Angel Grove. Defend the city with your first team.",
    level: 1,
    opponents: ["rick-3", "rick-0", "rick-1", "rick-2"],
    rounds: 5,
    coins: 100,
    xp: 40,
    item: "power-sword",
    boss: false,
  },
  {
    id: "ambush",
    name: "The rooftop ambush",
    story: "Outsmart a skilled rival patrol and recover Billy’s Power Lance.",
    level: 3,
    opponents: ["marvel-3", "dc-3", "marvel-5", "rick-4"],
    rounds: 5,
    coins: 140,
    xp: 60,
    item: "power-lance",
    boss: false,
  },
  {
    id: "titan",
    name: "Thunder at the gates",
    story:
      "Thor guards the next portal. Beat three escalating phases to claim the Power Bow.",
    level: 5,
    opponents: ["marvel-6"],
    rounds: 7,
    coins: 200,
    xp: 80,
    item: "power-bow",
    boss: true,
  },
  {
    id: "shadow",
    name: "The shadow dimension",
    story:
      "A darker alliance awaits. Bring your Rangers together and recover the Power Axe.",
    level: 8,
    opponents: ["dc-4", "rick-5", "marvel-4", "dc-5"],
    rounds: 7,
    coins: 240,
    xp: 100,
    item: "power-axe",
    boss: false,
  },
  {
    id: "zedd",
    name: "Lord Zedd’s last stand",
    story:
      "Break Zedd’s three-phase assault. Free the Green Ranger and recover his Dragon Dagger.",
    level: 12,
    opponents: ["rangers-7"],
    rounds: 9,
    coins: 350,
    xp: 150,
    item: "dragon-dagger",
    card: "rangers-6",
    boss: true,
  },
] as const;
export type Chapter = (typeof chapters)[number];
export function chapterAvailable(s: Save, id: string) {
  const i = chapters.findIndex((c) => c.id === id);
  return (
    i >= 0 &&
    playerLevel(s.xp) >= chapters[i].level &&
    (i === 0 || !!s.campaign?.includes(chapters[i - 1].id))
  );
}
export function campaignBattle(
  s: Save,
  id: string,
  deckId: string,
): Battle | null {
  const stage = chapters.find((c) => c.id === id);
  const deck = s.decks.find((d) => d.id === deckId);
  if (!stage || !deck || validateDeck(deck, s) || !chapterAvailable(s, id))
    return null;
  const b = createBattle(
    deck.cards,
    stage.boss ? "Crossover Battle" : "Best of",
    stage.boss ? "Expert" : "Normal",
    stage.rounds,
  );
  b.ai = [...stage.opponents];
  b.chapter = id;
  b.boss = stage.boss;
  return b;
}
export function claimChapter(s: Save, b: Battle) {
  if (b.result !== "player" || !b.chapter || !chapterAvailable(s, b.chapter))
    return false;
  const stage = chapters.find((c) => c.id === b.chapter)!;
  if (s.campaign?.includes(stage.id)) return false;
  (s.campaign ||= []).push(stage.id);
  s.coins += stage.coins;
  s.materials += stage.boss ? 4 : 2;
  s.items[stage.item] ||= 1;
  if ("card" in stage && !s.owned.includes(stage.card)) {
    s.owned.push(stage.card);
    s.cards[stage.card] ||= cardProgress();
  }
  grantXP(s, stage.xp);
  return true;
}
export function rangerBonus(ids: string[], s: Save) {
  const rangers = [...new Set(ids)].filter((id) => rangerWeapons[id]);
  const armed = rangers.filter((id) =>
    s.cards[id]?.equipment.includes(rangerWeapons[id]),
  ).length;
  const team = rangers.length >= 5 ? 4 : rangers.length >= 3 ? 2 : 0;
  return {
    team,
    armed: Math.min(3, armed),
    total: team + Math.min(3, armed),
    count: rangers.length,
  };
}
export function battleStats(
  id: string,
  base: Stats,
  ids: string[],
  s: Save,
): Stats {
  if (!rangerWeapons[id]) return base;
  const bonus = rangerBonus(ids, s);
  return {
    ...base,
    combat: Math.min(100, base.combat + bonus.total),
    power: Math.min(100, base.power + bonus.team),
  };
}
export const packTypes = [
  {
    id: "scout",
    name: "Scout pack",
    cost: 180,
    level: 1,
    odds: [75, 25, 0],
    materials: 1,
  },
  {
    id: "hero",
    name: "Hero pack",
    cost: 350,
    level: 5,
    odds: [45, 35, 20],
    materials: 2,
  },
] as const;
export interface PackResult {
  card: string;
  duplicate: boolean;
  coins: number;
  materials: number;
}
export function openPack(
  s: Save,
  packId: string,
  rng = Math.random,
): PackResult | null {
  const pack = packTypes.find((p) => p.id === packId);
  if (!pack || s.coins < pack.cost || playerLevel(s.xp) < pack.level)
    return null;
  const eligible = characters.filter(
    (c) =>
      unlockLevelFor(c, s) <= playerLevel(s.xp) + 2 &&
      ["Common", "Uncommon", "Rare"].includes(c.rarity),
  );
  const roll = Math.max(0, Math.min(0.999999, rng())) * 100;
  const rarity =
    roll < pack.odds[0]
      ? "Common"
      : roll < pack.odds[0] + pack.odds[1]
        ? "Uncommon"
        : "Rare";
  const pool = eligible.filter((c) => c.rarity === rarity);
  const candidates = pool.length
    ? pool
    : eligible.filter((c) => c.rarity === "Common");
  if (!candidates.length) return null;
  const c =
    candidates[
      Math.floor(Math.max(0, Math.min(0.999999, rng())) * candidates.length)
    ];
  const duplicate = s.owned.includes(c.id);
  const coins = duplicate ? Math.floor(pack.cost / 4) : 0;
  s.coins += coins - pack.cost;
  s.materials += pack.materials + (duplicate ? 2 : 0);
  if (duplicate) s.cards[c.id].xp += 20;
  else {
    s.owned.push(c.id);
    s.cards[c.id] ||= cardProgress();
  }
  s.packsOpened = (s.packsOpened || 0) + 1;
  return {
    card: c.id,
    duplicate,
    coins,
    materials: pack.materials + (duplicate ? 2 : 0),
  };
}
