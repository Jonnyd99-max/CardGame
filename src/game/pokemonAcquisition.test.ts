import { expect, it, vi } from "vitest";
vi.mock("./gameMode", () => ({ isPokemon: true, gameMode: "pokemon" }));
import { newSave, parseSave } from "../state/save";
import { grantXP, cardProgress, unlockLevelFor, playerLevel } from "./progression";
import { characters, getCharacter } from "../data/characters";
import { evolutionRequirement } from "../data/pokemonEvolution";
import { openPack, pokemonPackOdds } from "./adventures";

it("makes level 3 Pokémon eligible without giving any cards", () => {
  const s = newSave("Trainer", "grass", "pokemon-1");
  const starter = [...s.owned];
  grantXP(s, 300);
  expect(playerLevel(s.xp)).toBe(3);
  expect(s.owned).toEqual(starter);
  expect(characters.filter(c => !evolutionRequirement(c.id) && unlockLevelFor(c, s) <= 3).length).toBeGreaterThan(50);
  s.coins = 10000;
  const eligible = characters.filter(c => !evolutionRequirement(c.id) && c.rarity === "Common" && unlockLevelFor(c, s) <= 3);
  const index = eligible.findIndex(c => !s.owned.includes(c.id));
  const rolls = [0, (index + .1) / eligible.length, .5];
  const pack = openPack(s, "scout", () => rolls.shift()!)!;
  expect(s.owned).toHaveLength(starter.length + 1);
  expect(s.owned).toContain(pack.card);
});
it("does not give Pokémon or bypass evolution requirements at any player level", () => {
  const s = newSave("Trainer", "fire", "pokemon-4");
  const starter = [...s.owned];
  grantXP(s, 100000);
  expect(s.owned).toEqual(starter);
  expect(pokemonPackOdds(s)).toEqual([94, 5, 1]);
});
it("excludes cards above the player's actual level from packs", () => {
  const s = newSave("Trainer", "grass", "pokemon-1"); s.coins = 100000;
  for (let i = 0; i < 20; i++) {
    const pack = openPack(s, "scout", () => (i + .1) / 21)!;
    expect(unlockLevelFor(getCharacter(pack.card)!, s)).toBe(1);
  }
  expect(pokemonPackOdds(s)).toEqual([100, 0, 0]);
});
it("removes identifiable unused automatic cards while keeping starters, trained cards and Gym rewards", () => {
  const s = newSave("Trainer", "grass", "pokemon-1");
  delete s.pokemonAcquisitionVersion;
  s.xp = 300; s.campaign = ["arrival"];
  for (const id of ["pokemon-4", "pokemon-25", "pokemon-10"]) { s.owned.push(id); s.cards[id] = cardProgress(); }
  s.cards["pokemon-25"].xp = 10;
  const migrated = parseSave(JSON.stringify(s));
  expect(migrated.owned).not.toContain("pokemon-4");
  expect(migrated.owned).toContain("pokemon-25");
  expect(migrated.owned).toContain("pokemon-10");
  expect(migrated.owned).toContain("pokemon-1");
  expect(migrated.cards["pokemon-4"]).toEqual(cardProgress());
  expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
});
it("preserves ambiguous collections when packs have already been opened", () => {
  const s = newSave("Trainer", "grass", "pokemon-1");
  delete s.pokemonAcquisitionVersion; s.packsOpened = 1;
  s.owned.push("pokemon-4"); s.cards["pokemon-4"] = cardProgress();
  expect(parseSave(JSON.stringify(s)).owned).toContain("pokemon-4");
});
