import { describe, it, expect } from "vitest";
import { newSave, parseSave } from "../state/save";
import {
  customHeroId,
  saveHero,
  heroCharacter,
  validHero,
  transferPoint,
} from "./customHeroes";
import { getCharacter, getCharacters, characters } from "../data/characters";
import { statsFor, validateDeck, toggleEquipment } from "./progression";
import { createBattle, playRound, rewardMatch, availableStats } from "./battle";
import { statKeys, type Stats } from "../types";
const fresh = () => newSave("Builder", "rangers", "rangers-0");
const hero = () => ({
  name: "Neon Knight",
  franchise: "rangers",
  stats: Object.fromEntries(statKeys.map((k) => [k, 70])) as Stats,
  look: { head: 6, body: 5, background: 2 },
});
describe("custom heroes", () => {
  it("starts at level 70 with 560 base stat points and a separate saved catalogue", () => {
    const s = fresh();
    expect(saveHero(s, hero())).toBe(true);
    const c = getCharacter(customHeroId, s)!;
    expect(s.cards[customHeroId].level).toBe(70);
    expect(statsFor(c, s)).toEqual(hero().stats);
    expect(getCharacters(s).length).toBe(characters.length + 1);
    expect(getCharacter(customHeroId, fresh())).toBeUndefined();
  });
  it("trades points between stats without exceeding bounds or changing the budget", () => {
    const h = hero();
    const next = transferPoint(h.stats, "tech", "strength", 30);
    expect(next.tech).toBe(100);
    expect(next.strength).toBe(40);
    expect(Object.values(next).reduce((n, v) => n + v, 0)).toBe(560);
    expect(transferPoint(next, "tech", "strength", 1)).toBe(next);
    expect(transferPoint(next, "tech", "tech", 1)).toBe(next);
    expect(transferPoint(next, "tech", "strength", -99)).toBe(next);
  });
  it("validates names, stats and sprite choices including imported saves", () => {
    const s = fresh();
    saveHero(s, hero());
    expect(parseSave(JSON.stringify(s)).customHero).toEqual(hero());
    expect(validHero({ ...hero(), name: " " })).toBe(false);
    expect(validHero({ ...hero(), stats: { ...hero().stats, tech: 71 } })).toBe(
      false,
    );
    expect(
      validHero({ ...hero(), look: { head: 8, body: 0, background: 0 } }),
    ).toBe(false);
    s.cards[customHeroId].level = 69;
    expect(() => parseSave(JSON.stringify(s))).toThrow();
    expect(parseSave(JSON.stringify(fresh())).customHero).toBeUndefined();
  });
  it("preserves training and prevents affinity changes that invalidate existing decks", () => {
    const s = fresh();
    saveHero(s, hero());
    s.cards[customHeroId].level = 73;
    s.cards[customHeroId].xp = 250;
    expect(saveHero(s, { ...hero(), name: "Neon Knight II" })).toBe(true);
    expect(s.cards[customHeroId].level).toBe(73);
    expect(s.cards[customHeroId].xp).toBe(250);
    expect(s.owned.filter((id) => id === customHeroId)).toHaveLength(1);
    expect(saveHero(s, { ...hero(), franchise: "marvel" })).toBe(false);
  });
  it("supports decks, equipment, battles and match rewards", () => {
    const s = fresh();
    saveHero(s, hero());
    s.decks[0].cards[0] = customHeroId;
    expect(validateDeck(s.decks[0], s)).toBe("");
    expect(parseSave(JSON.stringify(s)).decks[0].cards[0]).toBe(customHeroId);
    s.items["pulse-blade"] = 1;
    expect(toggleEquipment(s, customHeroId, "pulse-blade")).toBe(true);
    let b = createBattle(s.decks[0].cards, "Best of", "Normal", 3, false, s);
    b = playRound(b, "tech", s);
    expect(b.last?.playerId).toBe(customHeroId);
    while (!b.result) {
      b.last = undefined;
      const stat = availableStats(b, b.turn)[0];
      b = playRound(b, stat, s);
    }
    expect(() => rewardMatch(s, b)).not.toThrow();
  });
  it("supports the opponent using a captured custom hero", () => {
    const s = fresh();
    saveHero(s, hero());
    const b = createBattle(s.decks[0].cards, "Classic", "Normal", 3, false, s);
    b.ai[0] = customHeroId;
    expect(() => playRound(b, "tech", s)).not.toThrow();
    expect(heroCharacter(hero()).customLook).toEqual(hero().look);
  });
});
