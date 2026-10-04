import { characters, getCharacter } from "../data/characters";
import {
  evolutionRequirement,
  nextPokemonEvolutions,
} from "../data/pokemonEvolution";
import { legacyPokemonItems } from "../data/pokemonItems";
import { cardProgress, compatible, items, validateDeck } from "./progression";
import type { Save } from "../types";
import { villainRewards } from "./villains";

export function migratePokemonAcquisition(s: Save) {
  if (s.pokemonAcquisitionVersion === 1) return;
  if (!Array.isArray(s.owned) || !s.cards || !Array.isArray(s.decks)) return;
  // Older saves do not record which cards came from packs. Never guess after a pack was opened.
  if (!(s.packsOpened || 0)) {
    const initial = characters.filter(c => c.rarity === "Common" && !evolutionRequirement(c.id) && c.franchise === (s.starterFranchise || s.franchise) && c.unlockLevel === 1).map(c => c.id).slice(0, 4);
    const starters = [...new Set([...initial, "pokemon-1", "pokemon-4", "pokemon-7", "pokemon-25"])].slice(0, 4);
    const rewards = new Set((s.campaign || []).map(id => villainRewards[id]));
    if (s.campaign?.includes("zedd")) rewards.add("pokemon-133");
    s.owned = s.owned.filter(id => {
      const p = s.cards[id];
      return starters.includes(id) || rewards.has(id) || !!evolutionRequirement(id) || s.pokemonShinies?.includes(id) || !p || p.level > 1 || p.xp > 0 || p.wins > 0 || p.equipment?.length || p.abilities?.length || Object.values(p.boosts || {}).some(Boolean);
    });
    for (const deck of s.decks) {
      if (!Array.isArray(deck.cards)) continue;
      deck.cards = deck.cards.filter(id => s.owned.includes(id));
      if (validateDeck(deck, s)) { deck.cards = starters.filter(id => s.owned.includes(id)); deck.rule = "Mixed Universe"; }
    }
    if (!s.owned.includes(s.favourite)) s.favourite = s.owned[0];
  }
  s.pokemonAcquisitionVersion = 1;
}

export function unlockPokemonEvolutions(s: Save): string[] {
  const unlocked: string[] = [];
  for (const id of [...s.owned]) {
    for (const evolution of nextPokemonEvolutions(id)) {
      if ((s.cards[id]?.level || 1) < evolution.level) continue;
      if (s.owned.includes(evolution.id)) {
        if (s.pokemonShinies?.includes(id) && !s.pokemonShinies.includes(evolution.id)) {
          s.pokemonShinies.push(evolution.id);
          s.cards[evolution.id].style = "shiny";
        }
        continue;
      }
      s.owned.push(evolution.id);
      // Each new species starts at its evolution milestone, ready for further training.
      const previous = s.cards[evolution.id];
      s.cards[evolution.id] = previous || {
        ...cardProgress(),
        level: evolution.level,
      };
      s.cards[evolution.id].level = Math.max(
        evolution.level,
        s.cards[evolution.id].level,
      );
      unlocked.push(evolution.id);
      if (s.pokemonShinies?.includes(id) && !s.pokemonShinies.includes(evolution.id)) {
        s.pokemonShinies.push(evolution.id);
        s.cards[evolution.id].style = "shiny";
      }
    }
  }
  return unlocked;
}

export function pokemonUnlockText(id: string, s: Save): string {
  const requirement = evolutionRequirement(id);
  if (!requirement) return "";
  const parent = getCharacter(requirement.parent)!;
  return `Upgrade ${parent.name} to Pokémon level ${requirement.level} to unlock ${getCharacter(id)!.name}. ${s.owned.includes(parent.id) ? `Current ${parent.name} level: ${s.cards[parent.id]?.level || 1}.` : `Collect ${parent.name} first.`}`;
}

export function migratePokemonSave(s: Save) {
  if (s.pokemonProgressionVersion === 1) {
    migratePokemonAcquisition(s);
    unlockPokemonEvolutions(s);
    return;
  }
  // Let the normal parser reject malformed files; migrate only well-shaped old saves.
  if (
    !Array.isArray(s.owned) ||
    !s.owned.length ||
    new Set(s.owned).size !== s.owned.length ||
    !s.cards ||
    !s.items ||
    !Array.isArray(s.decks) ||
    !Object.values(s.items).every(
      (tier) =>
        typeof tier === "number" &&
        Number.isSafeInteger(tier) &&
        tier >= 1 &&
        tier <= 3,
    ) ||
    !s.owned.every((id) => typeof id === "string" && !!getCharacter(id)) ||
    !Object.values(s.cards).every((p) => p && Array.isArray(p.equipment)) ||
    !s.decks.every((d) => d && Array.isArray(d.cards))
  )
    return;
  const aliases: Record<string, string> = {
    ...legacyPokemonItems,
    "power-sword": "muscle-band",
    "power-lance": "wise-glasses",
    "power-bow": "quick-claw",
    "power-axe": "muscle-band",
    "power-daggers": "quick-claw",
    "dragon-dagger": "focus-sash",
    saba: "focus-sash",
    morpher: "focus-sash",
  };
  const inventory: Save["items"] = {};
  for (const [id, tier] of Object.entries(s.items)) {
    const mapped = aliases[id] || id;
    inventory[mapped] = Math.max(inventory[mapped] || 0, tier);
  }
  s.items = inventory;
  for (const [id, p] of Object.entries(s.cards)) {
    const c = getCharacter(id);
    const slots = new Set<string>();
    p.equipment = p.equipment
      .map((item) => aliases[item] || item)
      .filter((item) => {
        const definition = items.find((i) => i.id === item);
        if (!definition || !c) return true; // Unknown IDs are rejected by the parser.
        if (!compatible(c, definition) || slots.has(definition.slot))
          return false;
        slots.add(definition.slot);
        return true;
      });
  }
  // Re-lock untrained evolutions from the old starter/pack system. Keep their card progress.
  s.owned = s.owned.filter((id) => {
    const requirement = evolutionRequirement(id);
    return (
      !requirement ||
      (s.cards[id]?.level || 1) >= requirement.level ||
      (s.owned.includes(requirement.parent) &&
        (s.cards[requirement.parent]?.level || 1) >= requirement.level)
    );
  });
  const starters = characters
    .filter(
      (c) =>
        c.rarity === "Common" &&
        !evolutionRequirement(c.id) &&
        c.franchise === (s.starterFranchise || s.franchise) &&
        c.unlockLevel === 1,
    )
    .map((c) => c.id);
  const fallback = [
    ...new Set([
      ...starters,
      "pokemon-1",
      "pokemon-4",
      "pokemon-7",
      "pokemon-25",
    ]),
  ].slice(0, 4);
  for (const id of fallback) {
    if (!s.owned.includes(id)) s.owned.push(id);
    s.cards[id] ||= cardProgress();
  }
  for (const deck of s.decks) {
    deck.cards = deck.cards.filter((id) => s.owned.includes(id));
    if (validateDeck(deck, s)) {
      deck.cards = [...fallback];
      deck.rule = "Mixed Universe";
    }
  }
  if (!s.owned.includes(s.favourite)) s.favourite = fallback[0];
  s.group = getCharacter(s.favourite)!.group;
  s.franchise = getCharacter(s.favourite)!.franchise;
  s.pokemonProgressionVersion = 1;
  migratePokemonAcquisition(s);
  unlockPokemonEvolutions(s);
}
