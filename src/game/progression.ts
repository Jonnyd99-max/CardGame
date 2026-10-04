import { pokemonItems, heldItemTypes } from "../data/pokemonItems";
import { evolutionRequirement } from "../data/pokemonEvolution";
import { unlockPokemonEvolutions } from "./pokemonProgression";
import { isPokemon } from "./gameMode";
import { battleStatKeys } from "./statPresentation";
import { characters, getCharacter, getCharacters } from "../data/characters";
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
export const items = isPokemon ? pokemonItems : [...equipment, ...weapons];
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
export function unlockLevelFor(c: Character, s: Save) {
  if (isPokemon && evolutionRequirement(c.id)) return 101;
  if (isPokemon)
    return c.franchise === (s.starterFranchise || s.franchise)
      ? c.unlockLevel
      : Math.max(3, c.unlockLevel);
  return c.franchise === (s.starterFranchise || s.franchise)
    ? c.unlockLevel
    : Math.max(
        c.unlockLevel,
        config.otherUniverseUnlocks[Number(c.id.split("-").at(-1))] ||
          c.unlockLevel,
      );
}
export function selectUniverse(s: Save, franchise: string) {
  s.franchise = franchise;
  const owned = getCharacters(s).find(
    (c) => c.franchise === franchise && s.owned.includes(c.id),
  );
  const preview = owned || characters.find((c) => c.franchise === franchise)!;
  s.group = preview.group;
  if (owned) s.favourite = owned.id;
}
export function migrateBalance(s: Save) {
  if (s.balanceVersion === 1) return s;
  s.starterFranchise = s.franchise;
  const starters = characters
    .filter((c) => c.franchise === s.starterFranchise && c.unlockLevel === 1)
    .map((c) => c.id);
  s.owned = s.owned.filter(
    (id) =>
      (id === "custom-hero" ? 0 : unlockLevelFor(getCharacter(id, s)!, s)) <=
      playerLevel(s.xp),
  );
  for (const id of starters) {
    if (!s.owned.includes(id)) s.owned.push(id);
    s.cards[id] ||= cardProgress();
  }
  // Keep gated card progress in the save, so it is restored when earned again.
  for (const deck of s.decks) {
    deck.cards = deck.cards.filter((id) => s.owned.includes(id));
    if (validateDeck(deck, s)) {
      deck.cards = [...starters];
      deck.rule = "Single Franchise";
    }
  }
  if (!s.owned.includes(s.favourite)) {
    s.favourite = starters[0];
    s.group = getCharacter(s.favourite, s)!.group;
  }
  s.balanceVersion = 1;
  return s;
}
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
              ((items.find((e) => e.id === id)?.modifiers[k] || 0) +
                (items.find((e) => e.id === id)?.grantedAbility?.modifiers[k] ||
                  0)) *
                (items.find(e => e.id === id)?.category === "mega-stone" ? 1 : s.items[id] || 1),
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
  Math.round(battleStatKeys.reduce((total, k) => total + statsFor(c, s)[k], 0) / battleStatKeys.length);
export function compatible(c: Character, item: Item) {
  const allowed =
    item.slot === "weapon" ? c.compatibleWeapons : c.compatibleEquipment;
  return (
    (!allowed.length || allowed.includes(item.id)) &&
    (!heldItemTypes[item.id] || c.tags.includes(heldItemTypes[item.id])) &&
    (!item.franchises.length || item.franchises.includes(c.franchise)) &&
    (!item.groups.length || item.groups.includes(c.group)) &&
    (!item.characters.length || item.characters.includes(c.id))
  );
}
export function toggleEquipment(s: Save, characterId: string, itemId: string) {
  const c = getCharacter(characterId, s);
  const item = items.find((item) => item.id === itemId);
  const p = s.cards[characterId];
  if (
    !c ||
    !item ||
    !p ||
    !s.owned.includes(characterId) ||
    !s.items[itemId] ||
    !compatible(c, item)
  )
    return false;
  const removing = p.equipment.includes(itemId);
  p.equipment = p.equipment.filter(
    (id) => items.find((other) => other.id === id)?.slot !== item.slot,
  );
  if (!removing) {
    p.equipment.push(itemId);
    if (item.category === "mega-stone" && !(s.pokemonMegaSeen || []).includes(itemId))
      (s.pokemonMegaSeen ||= []).push(itemId);
    s.equips++;
  }
  return true;
}
export function upgradeCharacter(s: Save, id: string): string[] | null {
  const c = getCharacter(id, s);
  const p = s.cards[id];
  if (
    !c ||
    !p ||
    !s.owned.includes(id) ||
    p.level >= c.maxLevel ||
    s.coins < p.level * config.characterLevelCoinMultiplier ||
    s.materials < 1 ||
    p.xp < config.xpPerCharacterLevel
  )
    return null;
  s.coins -= p.level * config.characterLevelCoinMultiplier;
  s.materials--;
  p.xp -= config.xpPerCharacterLevel;
  p.level++;
  s.upgrades++;
  return isPokemon ? unlockPokemonEvolutions(s) : [];
}
export function unlock(s: Save) {
  if (isPokemon) {
    unlockPokemonEvolutions(s);
    return s;
  }
  const level = playerLevel(s.xp);
  characters
    .filter((c) => unlockLevelFor(c, s) <= level)
    .forEach((c) => {
      if (!s.owned.includes(c.id)) {
        s.owned.push(c.id);
        s.cards[c.id] ||= cardProgress();
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
  const cs = d.cards.map((id) => getCharacter(id, s)!);
  if (
    d.rule === "Single Franchise" &&
    (isPokemon
      ? !cs[0].tags.some(
          (t) => t !== "pokemon" && cs.every((c) => c.tags.includes(t)),
        )
      : new Set(cs.map((c) => c.franchise)).size > 1)
  )
    return isPokemon
      ? "Choose Pokémon sharing one type."
      : "Choose one universe.";
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
