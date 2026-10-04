import { evolutionRequirement } from "../data/pokemonEvolution";
import { isPokemon } from "./gameMode";
import { unlockPokemonEvolutions } from "./pokemonProgression";
import { characters } from "../data/characters";
import { rangerWeapons } from "../data/weapons";
import {
  cardProgress,
  grantXP,
  playerLevel,
  unlockLevelFor,
  validateDeck,
} from "./progression";
import { createBattle, ensurePokemonHealth, type Battle } from "./battle";
import type { Save, Stats } from "../types";
export function pokemonPackOdds(s: Save): number[] {
  const eligible = characters.filter(c => !evolutionRequirement(c.id) && unlockLevelFor(c, s) <= playerLevel(s.xp));
  const legendary = eligible.some(c => c.rarity === "Legendary") ? 5 : 0;
  const mythic = eligible.some(c => c.rarity === "Mythic") ? 1 : 0;
  return [100 - legendary - mythic, legendary, mythic];
}

const multiverseChapters = [
  {
    id: "arrival",
    name: "Trouble in Angel Grove",
    story:
      "A portal has scattered rivals across Angel Grove. Defend the city with your first team.",
    level: 1,
    opponents: ["enemy-putty", "enemy-putty", "enemy-putty", "enemy-putty"],
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
    opponents: ["enemy-goldar", "enemy-putty", "enemy-goldar", "enemy-putty"],
    rounds: 5,
    coins: 140,
    xp: 60,
    item: "power-lance",
    boss: false,
  },
  {
    id: "titan",
    name: "Rita’s moon palace",
    story:
      "Rita has opened a portal from her moon palace. Break her spell across three escalating phases.",
    level: 5,
    opponents: ["enemy-rita"],
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
    opponents: ["enemy-goldar", "enemy-rita", "enemy-putty", "enemy-goldar"],
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
  {
    id: "goblin",
    name: "Chaos over New York",
    story:
      "Green Goblin has stolen a portal stabiliser. Stop his rooftop raids.",
    level: 14,
    opponents: ["enemy-goblin"],
    rounds: 7,
    coins: 260,
    xp: 120,
    item: "blaster",
    boss: true,
  },
  {
    id: "ultron",
    name: "Age of machines",
    story:
      "Ultron is connecting the portals into a machine army. Shut him down.",
    level: 16,
    opponents: ["enemy-ultron"],
    rounds: 9,
    coins: 320,
    xp: 150,
    item: "scanner",
    boss: true,
  },
  {
    id: "gotham",
    name: "Gotham’s wild cards",
    story:
      "Joker and Harley have turned Gotham’s portal into a trap. Outsmart their ambush.",
    level: 18,
    opponents: ["enemy-harley", "enemy-joker", "enemy-harley", "enemy-joker"],
    rounds: 7,
    coins: 280,
    xp: 130,
    item: "shield",
    boss: false,
  },
  {
    id: "joker",
    name: "The last laugh",
    story:
      "Joker holds the portal key. Survive three phases of escalating tricks.",
    level: 20,
    opponents: ["enemy-joker"],
    rounds: 9,
    coins: 350,
    xp: 160,
    item: "pulse-blade",
    boss: true,
  },
  {
    id: "assassin",
    name: "Beyond the finite curve",
    story:
      "Evil Morty has trapped your team beyond the Central Finite Curve. Fight through his dimensional alliance.",
    level: 22,
    opponents: ["rick-4", "rick-7", "rick-4", "rick-7"],
    rounds: 9,
    coins: 380,
    xp: 180,
    item: "scanner",
    boss: true,
  },
] as const;
export interface Chapter {
  id: string;
  name: string;
  story: string;
  level: number;
  opponents: readonly string[];
  rounds: number;
  coins: number;
  xp: number;
  item: string;
  boss: boolean;
  card?: string;
}
export const chapters: readonly Chapter[] = isPokemon
  ? multiverseChapters.map((chapter, i) => ({
      ...chapter,
      boss: i >= 1 && i <= 8,
      name: [
        "Viridian Forest",
        "Pewter Gym · Brock",
        "Cerulean Gym · Misty",
        "Vermilion Gym · Lt. Surge",
        "Celadon Gym · Erika",
        "Fuchsia Gym · Koga",
        "Saffron Gym · Sabrina",
        "Cinnabar Gym · Blaine",
        "Viridian Gym · Giovanni",
        "Cerulean Cave · Mewtwo",
      ][i],
      story: [
        "Build your first Kanto team and battle the Pokémon of Viridian Forest.",
        "Challenge Brock’s Rock Pokémon.",
        "Face Misty’s Water Pokémon.",
        "Take on Lt. Surge’s Electric team.",
        "Battle Erika’s Grass team.",
        "Overcome Koga’s Poison team.",
        "Test your team against Sabrina’s Psychic Pokémon.",
        "Face Blaine’s Fire team.",
        "Defeat Giovanni’s Ground team.",
        "Your final Kanto challenge: the legendary Mewtwo.",
      ][i],
      opponents: [
        [10, 13, 11, 14],
        [74, 95, 75, 95],
        [120, 121, 54, 55],
        [25, 26, 100, 101],
        [43, 44, 45, 114],
        [109, 110, 88, 89],
        [63, 64, 97, 65],
        [58, 59, 77, 78],
        [111, 112, 31, 34],
        [150],
      ][i].map((n) => `pokemon-${n}`),
      item: [
        "wise-glasses",
        "trainer-brock",
        "trainer-misty",
        "trainer-surge",
        "trainer-erika",
        "trainer-koga",
        "trainer-sabrina",
        "trainer-blaine",
        "trainer-giovanni",
        "mewtwonite-y",
      ][i],
      ...("card" in chapter ? { card: "pokemon-133" } : {}),
    }))
  : multiverseChapters;

import { villainRewards } from "./villains";
export { villainRewards } from "./villains";
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
    false,
    s,
  );
  b.ai = [...stage.opponents];
  b.chapter = id;
  b.boss = stage.boss;
  ensurePokemonHealth(b, s);
  return b;
}
export function claimChapter(s: Save, b: Battle) {
  if (b.result !== "player" || !b.chapter || !chapterAvailable(s, b.chapter))
    return false;
  const stage = chapters.find((c) => c.id === b.chapter)!;
  const villain = villainRewards[stage.id];
  if (villain && !s.owned.includes(villain)) {
    s.owned.push(villain);
    s.cards[villain] ||= cardProgress();
  }
  const stars = campaignStars(b);
  const earned = Math.max(0, stars - (s.campaignStars?.[stage.id] || 0));
  if (earned) {
    (s.campaignStars ||= {})[stage.id] = stars;
    s.coins += earned * 50;
    s.materials += earned;
  }
  if (s.campaign?.includes(stage.id)) return false;
  (s.campaign ||= []).push(stage.id);
  s.coins += stage.coins;
  s.materials += stage.boss ? 4 : 2;
  s.items[stage.item] ||= 1;
  if (stage.card && !s.owned.includes(stage.card)) {
    s.owned.push(stage.card);
    s.cards[stage.card] ||= cardProgress();
  }
  grantXP(s, stage.xp);
  return true;
}
export function campaignStars(b: Battle) {
  if (!b.chapter || b.result !== "player") return 0;
  return b.round > 0 && b.scores[0] === b.round
    ? 3
    : b.round > 0 && b.scores[0] / b.round >= 0.75
      ? 2
      : 1;
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
const multiversePackTypes = [
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
export const packTypes = isPokemon
  ? multiversePackTypes.map((pack) => ({
      ...pack,
      name: pack.id === "scout" ? "Kanto basics pack" : "Kanto training pack",
      odds: [100, 0, 0],
      materials: pack.id === "hero" ? 4 : pack.materials,
    }))
  : multiversePackTypes;
export interface PackResult {
  shiny?: boolean;
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
      !c.tags.includes("campaign-reward") &&
      (!isPokemon || !evolutionRequirement(c.id)) &&
      c.unlockLevel <= playerLevel(s.xp) + 2 &&
      (isPokemon ? unlockLevelFor(c, s) <= playerLevel(s.xp) : ["Common", "Uncommon", "Rare"].includes(c.rarity)),
  );
  const roll = Math.max(0, Math.min(0.999999, rng())) * 100;
  const odds = isPokemon ? pokemonPackOdds(s) : pack.odds;
  const rarity =
    roll < odds[0]
      ? "Common"
      : roll < odds[0] + odds[1]
        ? isPokemon ? "Legendary" : "Uncommon"
        : isPokemon ? "Mythic" : "Rare";
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
  const shiny = isPokemon && rng() < 0.05;
  if (shiny && !(s.pokemonShinies || []).includes(c.id)) {
    (s.pokemonShinies ||= []).push(c.id);
    s.cards[c.id].style = "shiny";
    unlockPokemonEvolutions(s);
  }
  return {
    card: c.id,
    shiny,
    duplicate,
    coins,
    materials: pack.materials + (duplicate ? 2 : 0),
  };
}
