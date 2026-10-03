import { characters } from "../data/characters";
import { equipment } from "../data/equipment";
import { weapons } from "../data/weapons";
import { abilities } from "../data/abilities";
import { progression as config } from "../data/unlocks";
import {
  statKeys,
  type Character,
  type Save,
  type Stats,
  type Item,
  type Deck,
} from "../types";
export const items = [...equipment, ...weapons];
export const playerLevel = (xp: number) =>
  Math.min(config.maxPlayerLevel, 1 + Math.floor(xp / config.xpPerPlayerLevel));
export const cardProgress = () => ({
  level: 1,
  xp: 0,
  equipment: [],
  boosts: {},
  abilities: [],
  style: "original",
  wins: 0,
});
export function statsFor(c: Character, s: Save): Stats {
  const p = s.cards[c.id] || cardProgress();
  return Object.fromEntries(
    statKeys.map((k) => [
      k,
      Math.min(
        c.maxStats[k],
        c.baseStats[k] +
          Math.floor(
            (p.level - c.baseLevel) * config.statGrowthPerLevel +
              statKeys.indexOf(k) / statKeys.length,
          ) +
          (p.boosts[k] || 0) +
          p.equipment.reduce(
            (v, id) =>
              v +
              (items.find((e) => e.id === id)?.modifiers[k] || 0) *
                (s.items[id] || 1),
            0,
          ) +
          p.abilities.reduce(
            (v, id) =>
              v +
              (abilities.find((a) => a.id === id)?.modifiers[
                k as keyof (typeof abilities)[number]["modifiers"]
              ] || 0),
            0,
          ),
      ),
    ]),
  ) as Stats;
}
export const powerFor = (c: Character, s: Save) =>
  Math.round(Object.values(statsFor(c, s)).reduce((a, b) => a + b, 0) / 8);
export function compatible(c: Character, item: Item) {
  const allowed =
    item.slot === "weapon" ? c.compatibleWeapons : c.compatibleEquipment;
  return (
    (!allowed.length || allowed.includes(item.id)) &&
    (!item.franchises.length || item.franchises.includes(c.franchise)) &&
    (!item.groups.length || item.groups.includes(c.group)) &&
    (!item.characters.length || item.characters.includes(c.id))
  );
}
export function unlock(s: Save) {
  const level = playerLevel(s.xp);
  characters
    .filter((c) => c.unlockLevel <= level)
    .forEach((c) => {
      if (!s.owned.includes(c.id)) {
        s.owned.push(c.id);
        s.cards[c.id] = cardProgress();
      }
    });
  return s;
}
export function grantXP(s: Save, amount: number) {
  const old = playerLevel(s.xp);
  s.xp += amount;
  const gained = playerLevel(s.xp) - old;
  s.coins += gained * config.levelCoins;
  s.materials += gained * config.levelMaterials;
  return unlock(s);
}
export function validateDeck(d: Deck, s: Save): string {
  if (d.cards.length < config.deckMin || d.cards.length > config.deckMax)
    return `Choose ${config.deckMin}–${config.deckMax} cards.`;
  if (
    new Set(d.cards).size !== d.cards.length ||
    d.cards.some((id) => !s.owned.includes(id))
  )
    return "Use unique, owned cards.";
  const cs = d.cards.map((id) => characters.find((c) => c.id === id)!);
  if (
    d.rule === "Single Franchise" &&
    new Set(cs.map((c) => c.franchise)).size > 1
  )
    return "Choose one universe.";
  if (d.rule === "Single Group" && new Set(cs.map((c) => c.group)).size > 1)
    return "Choose one group.";
  return "";
}
export function periodKeys(date = new Date()) {
  const day = date.toLocaleDateString("en-CA");
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return { day, week: monday.toLocaleDateString("en-CA") };
}
export function refreshPeriods(s: Save) {
  const { day, week } = periodKeys();
  if (s.periods.daily !== day) {
    s.periods.daily = day;
    s.periods.dailyWins = 0;
  }
  if (s.periods.weekly !== week) {
    s.periods.weekly = week;
    s.periods.weeklyWins = 0;
  }
  return s;
}
