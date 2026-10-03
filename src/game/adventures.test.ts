import { describe, expect, it } from "vitest";
import { newSave, parseSave } from "../state/save";
import {
  campaignBattle,
  chapterAvailable,
  claimChapter,
  openPack,
  rangerBonus,
  battleStats,
} from "./adventures";
import { opponentStats, playRound } from "./battle";
import { characters } from "../data/characters";
import { statsFor } from "./progression";

describe("campaign, bosses, team bonuses and packs", () => {
  it("gates chapters and awards first clears once, preserving old saves", () => {
    const s = newSave("Player", "rangers", "rangers-0");
    expect(parseSave(JSON.stringify(s)).campaign).toBeUndefined();
    expect(chapterAvailable(s, "ambush")).toBe(false);
    const b = campaignBattle(s, "arrival", "starter")!;
    expect(b.ai).toEqual(["rick-3", "rick-0", "rick-1", "rick-2"]);
    expect(claimChapter(s, b)).toBe(false);
    b.result = "player";
    expect(claimChapter(s, b)).toBe(true);
    const coins = s.coins;
    expect(claimChapter(s, b)).toBe(false);
    expect(s.coins).toBe(coins);
    expect(s.items["power-sword"]).toBe(1);
    expect(parseSave(JSON.stringify(s)).campaign).toEqual(["arrival"]);
    const bad = { ...s, campaign: ["zedd"] };
    expect(() => parseSave(JSON.stringify(bad))).toThrow();
  });
  it("computes capped deck synergy and excludes villains and other universes", () => {
    const s = newSave("Player", "rangers", "rangers-0");
    s.items["power-sword"] = 1;
    s.cards["rangers-0"].equipment = ["power-sword"];
    expect(rangerBonus(s.decks[0].cards, s).total).toBe(3);
    expect(
      rangerBonus(["rangers-0", "rangers-0", "rangers-7", "marvel-0"], s).team,
    ).toBe(0);
    const c = characters[0];
    const base = statsFor(c, s);
    const enhanced = battleStats(c.id, base, s.decks[0].cards, s);
    expect(enhanced.combat).toBe(Math.min(100, base.combat + 3));
    expect(battleStats("marvel-0", base, s.decks[0].cards, s)).toEqual(base);
    const b = campaignBattle(s, "arrival", "starter")!;
    expect(playRound(b, "combat", s).last?.a).toBe(enhanced.combat);
  });
  it("escalates boss stats by phase and grants final character reward", () => {
    const s = newSave("Player", "rangers", "rangers-0");
    s.xp = 3300;
    s.campaign = ["arrival", "ambush", "titan", "shadow"];
    const b = campaignBattle(s, "zedd", "starter")!;
    expect(b.boss).toBe(true);
    expect(
      playRound({ ...b, round: 4, scores: [4, 0] }, "combat", s).result,
    ).toBeUndefined();
    const base = characters.find((c) => c.id === "rangers-7")!.baseStats;
    expect(opponentStats({ ...b, round: 6 }, base).combat).toBe(
      Math.min(100, base.combat + 6),
    );
    b.result = "player";
    expect(claimChapter(s, b)).toBe(true);
    expect(s.owned).toContain("rangers-6");
    expect(s.items["dragon-dagger"]).toBe(1);
    expect(parseSave(JSON.stringify(s)).owned).toContain("rangers-6");
  });
  it("charges exactly once, handles duplicates and rejects unavailable packs", () => {
    const s = newSave("Player", "rangers", "rangers-0");
    expect(openPack(s, "hero", () => 0)).toBeNull();
    expect(s.coins).toBe(350);
    const result = openPack(s, "scout", () => 0)!;
    expect(result.duplicate).toBe(true);
    expect(s.coins).toBe(350 - 180 + 45);
    expect(s.materials).toBe(8);
    expect(s.cards[result.card].xp).toBe(20);
    expect(s.packsOpened).toBe(1);
    s.coins = 0;
    expect(openPack(s, "scout")).toBeNull();
    expect(s.packsOpened).toBe(1);
    expect(parseSave(JSON.stringify(s)).packsOpened).toBe(1);
  });
  it("adds eligible new cards without replacing existing progress", () => {
    const s = newSave("Player", "rangers", "rangers-0");
    s.xp = 1500;
    s.coins = 1000;
    const rolls = [0, 0.99];
    let i = 0;
    const result = openPack(s, "scout", () => rolls[i++])!;
    expect(result.duplicate).toBe(false);
    expect(s.owned).toContain(result.card);
    expect(s.cards[result.card].level).toBe(1);
    expect(parseSave(JSON.stringify(s)).owned).toContain(result.card);
  });
});
