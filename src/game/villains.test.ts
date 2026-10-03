import { expect, it } from "vitest";
import { newSave, parseSave } from "../state/save";
import { campaignBattle, claimChapter, openPack } from "./adventures";
import { villainRewards } from "./villains";
import { chapters } from "./adventures";
import { validateDeck, unlock } from "./progression";

it("awards collectible villains on victories including old chapter replays, once", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  expect(claimChapter(s, { ...b, result: "ai" })).toBe(false);
  expect(s.owned).not.toContain("enemy-putty");
  s.campaign = ["arrival"];
  claimChapter(s, { ...b, result: "player", round: 3, scores: [3, 0] });
  expect(s.owned).toContain("enemy-putty");
  s.cards["enemy-putty"].level = 5;
  claimChapter(s, { ...b, result: "player", round: 3, scores: [3, 0] });
  expect(s.owned.filter((id) => id === "enemy-putty")).toHaveLength(1);
  expect(parseSave(JSON.stringify(s)).cards["enemy-putty"].level).toBe(5);
  expect(
    validateDeck(
      {
        id: "villains",
        name: "Villains",
        rule: "Mixed Universe",
        cards: [...s.owned.slice(0, 3), "enemy-putty"],
      },
      s,
    ),
  ).toBe("");
});
it("gates all villain rewards behind their chapters and excludes them from levels and packs", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  s.xp = 100000;
  unlock(s);
  expect(s.owned.some((id) => id.startsWith("enemy-"))).toBe(false);
  s.coins = 100000;
  for (let i = 0; i < 50; i++)
    expect(
      openPack(s, "scout", () => i / 50)?.card.startsWith("enemy-"),
    ).not.toBe(true);
  for (const [chapter, id] of Object.entries(villainRewards)) {
    const i = chapters.findIndex((c) => c.id === chapter);
    s.campaign = chapters.slice(0, i).map((c) => c.id);
    const b = campaignBattle(s, chapter, "starter")!;
    claimChapter(s, { ...b, result: "player", round: 5, scores: [5, 0] });
    expect(s.owned).toContain(id);
  }
  expect(parseSave(JSON.stringify(s)).owned).toEqual(s.owned);
});
