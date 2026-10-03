import { describe, expect, it } from "vitest";
import { newSave, parseSave } from "../state/save";
import { characters } from "../data/characters";
import {
  grantXP,
  unlock,
  unlockLevelFor,
  cardProgress,
  validateDeck,
} from "./progression";
import { createBattle, matchPrizes, rewardMatch } from "./battle";

describe("earned collection progression", () => {
  it("keeps only four starters after early XP and gates other universes", () => {
    for (const franchise of ["rangers", "marvel", "dc", "rick"]) {
      const save = newSave("Explorer", franchise, `${franchise}-0`);
      grantXP(save, 300);
      expect(save.owned).toHaveLength(4);
      expect(save.owned.every((id) => id.startsWith(franchise))).toBe(true);
      const foreign = characters.find(
        (c) => c.franchise !== franchise && c.id.endsWith("-0"),
      )!;
      expect(unlockLevelFor(foreign, save)).toBe(8);
      save.xp = 7 * 150;
      unlock(save);
      expect(save.owned).toContain(foreign.id);
    }
  });
  it("changing favourite universe cannot grant a new starter collection", () => {
    const save = newSave("Explorer", "rangers", "rangers-0");
    save.franchise = "marvel";
    save.group = "spider";
    grantXP(save, 1);
    expect(save.owned).toHaveLength(4);
    expect(save.owned).not.toContain("marvel-0");
  });
  it("migrates old freebies, repairs decks, and restores stored card upgrades at unlock", () => {
    const save = newSave("Explorer", "rangers", "rangers-0");
    delete save.balanceVersion;
    delete save.starterFranchise;
    for (const c of characters.filter((c) => c.unlockLevel === 1)) {
      if (!save.owned.includes(c.id)) save.owned.push(c.id);
      save.cards[c.id] ||= cardProgress();
    }
    save.cards["marvel-0"].level = 4;
    save.cards["marvel-0"].xp = 61;
    save.cards["marvel-0"].boosts.tech = 2;
    save.coins = 777;
    save.decks[0].cards = ["marvel-0", "marvel-1", "marvel-2", "marvel-3"];
    const migrated = parseSave(JSON.stringify(save));
    expect(migrated.owned).toHaveLength(4);
    expect(validateDeck(migrated.decks[0], migrated)).toBe("");
    expect(migrated.cards["marvel-0"].level).toBe(4);
    expect(migrated.coins).toBe(777);
    const roundTrip = parseSave(JSON.stringify(migrated));
    roundTrip.xp = 7 * 150;
    unlock(roundTrip);
    expect(roundTrip.owned).toContain("marvel-0");
    expect(roundTrip.cards["marvel-0"].xp).toBe(61);
    expect(roundTrip.cards["marvel-0"].boosts.tech).toBe(2);
  });
});

describe("performance-based prizes", () => {
  function finished(
    rounds: number,
    wins: number,
    target = 5,
    result: "player" | "ai" | "draw" = "player",
  ) {
    const save = newSave("Explorer", "rangers", "rangers-0");
    const battle = createBattle(save.owned, "Best of", "Normal", target);
    battle.round = rounds;
    battle.scores = [wins, rounds - wins];
    battle.result = result;
    return { save, battle };
  }
  it("pays more for longer series and for additional rounds won", () => {
    const short = finished(3, 3, 5).battle;
    const long = finished(5, 5, 9).battle;
    expect(matchPrizes(long).coins).toBeGreaterThan(matchPrizes(short).coins);
    expect(matchPrizes(long).xp).toBeGreaterThan(matchPrizes(short).xp);
    const loss = finished(5, 2, 5, "ai").battle;
    const noWins = finished(5, 0, 5, "ai").battle;
    expect(matchPrizes(loss).coins).toBeGreaterThan(matchPrizes(noWins).coins);
    expect(matchPrizes(loss).bonusCoins).toBe(0);
  });
  it("pays exactly the displayed rewards and character XP", () => {
    const { save, battle } = finished(5, 5, 9);
    const prizes = matchPrizes(battle);
    rewardMatch(save, battle);
    expect(save.coins - 350).toBe(prizes.coins);
    expect(save.xp).toBe(prizes.xp);
    expect(save.materials - 5).toBe(prizes.materials);
    expect(save.cards["rangers-0"].xp).toBe(prizes.characterXP);
  });
  it("caps Classic farming and pays nothing for unfinished matches", () => {
    const { battle } = finished(20, 10);
    battle.mode = "Classic";
    const capped = matchPrizes(battle);
    battle.round = 150;
    expect(matchPrizes(battle)).toEqual(capped);
    battle.scores[0] = 100;
    expect(matchPrizes(battle).wins).toBe(20);
    expect(matchPrizes(battle).materials).toBeLessThanOrEqual(6);
    battle.result = undefined;
    expect(matchPrizes(battle).coins).toBe(0);
  });
  it("counts tied rounds as played without counting them as wins", () => {
    const { battle } = finished(5, 2, 5, "draw");
    battle.scores = [2, 2];
    expect(matchPrizes(battle).xp).toBe(5 * 4 + 2 * 8);
    expect(matchPrizes(battle).bonusXP).toBe(0);
  });
});
