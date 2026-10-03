import { expect, it } from "vitest";
import { newSave, parseSave } from "../state/save";
import {
  activateAbility,
  combatStats,
  opponentStats,
  playRound,
  ritaCurse,
  availableStats,
  aiStat,
} from "./battle";
import { campaignBattle, claimChapter, campaignStars } from "./adventures";
import { characters } from "../data/characters";
it("limits the whole team to one ability per fight, even after changing characters", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const activated = activateAbility(b, "combat");
  expect(activated.usedAbilities).toEqual(["rangers-0"]);
  expect(activateAbility(activated, "tech")).toBe(activated);
  const later = { ...activated, round: 1, player: ["rangers-1"] };
  expect(activateAbility(later, "tech")).toBe(later);
  const base = characters[0].baseStats;
  expect(combatStats(activated, "rangers-0", base).combat).toBe(
    base.combat + 8,
  );
  expect(combatStats({ ...activated, round: 1 }, "rangers-0", base)).toEqual(
    base,
  );
  expect(
    activateAbility({ ...b, turn: "ai" }, "combat").usedAbilities,
  ).toBeUndefined();
});
it("provides Rick rerolls, Batman scans and Green Ranger shields", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const r = activateAbility({ ...b, player: ["rick-6"] }, "tech", () => 0);
  expect(r.abilityRound?.value).toBe(70);
  const bat = activateAbility({ ...b, player: ["dc-0"] }, "power");
  expect(bat.abilityRound?.reveal).toBe(true);
  const green = activateAbility({ ...b, player: ["rangers-6"] }, "combat");
  const c = characters.find((c) => c.id === "rangers-6")!;
  expect(combatStats(green, c.id, c.baseStats).durability).toBe(
    Math.min(100, c.baseStats.durability + 12),
  );
});
it("applies boss mechanics and preserves the revealed combat snapshot", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const base = characters[0].baseStats;
  expect(
    combatStats({ ...b, chapter: "titan" }, "rangers-0", base).strength,
  ).toBe(base.strength - 8);
  expect(
    opponentStats({ ...b, chapter: "ultron", bossMemory: "speed" }, base).speed,
  ).toBe(base.speed + 10);
  const swapped = opponentStats({ ...b, chapter: "joker", round: 1 }, base);
  expect(swapped.power).toBe(base.intelligence);
  const fought = playRound(
    { ...b, chapter: "ultron", bossMemory: "speed" },
    "combat",
    s,
  );
  expect(fought.last?.enemyStats).toBeDefined();
  expect(fought.bossMemory).toBe("combat");
});
it("awards only improvements in campaign stars and validates their saves", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const first = {
    ...b,
    result: "player" as const,
    round: 5,
    scores: [3, 2] as [number, number],
  };
  expect(campaignStars(first)).toBe(1);
  claimChapter(s, first);
  const previous = s.coins;
  const perfect = { ...first, round: 3, scores: [3, 0] as [number, number] };
  expect(campaignStars(perfect)).toBe(3);
  claimChapter(s, perfect);
  expect(s.coins - previous).toBe(100);
  const coins = s.coins;
  claimChapter(s, perfect);
  expect(s.coins).toBe(coins);
  expect(parseSave(JSON.stringify(s)).campaignStars?.arrival).toBe(3);
  expect(() =>
    parseSave(JSON.stringify({ ...s, campaignStars: { arrival: 4 } })),
  ).toThrow();
});
it("casts Rita's curse outside her boss chapter and keeps it on the resolved round", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = {
    ...campaignBattle(s, "arrival", "starter")!,
    chapter: "shadow",
    ai: ["enemy-rita", "enemy-goldar"],
  };
  const base = characters[0].baseStats;
  expect(ritaCurse(b)).toBe("strength");
  expect(combatStats(b, "rangers-0", base).strength).toBe(base.strength - 8);
  const fought = playRound(b, "strength", s);
  expect(fought.last?.a).toBe(base.strength - 8);
  expect(fought.log[0]).toContain("Rita casts Moon Curse");
  expect(fought.ai[0]).toBe("enemy-goldar");
  expect(ritaCurse(fought)).toBe("strength");
  expect(ritaCurse({ ...fought, last: undefined })).toBeUndefined();
  expect(ritaCurse({ ...b, round: 1 })).toBe("speed");
});
it("locks stat choices per side across cards and rejects repeats", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const fought = playRound(b, "strength", s);
  const later = { ...fought, last: undefined, turn: "player" as const };
  expect(availableStats(later, "player")).not.toContain("strength");
  expect(availableStats(later, "ai")).toContain("strength");
  expect(playRound(later, "strength", s)).toBe(later);
  const ai = playRound({ ...later, turn: "ai" }, "strength", s);
  expect(ai.usedStats?.ai).toEqual(["strength"]);
  expect(aiStat(characters[0].baseStats, "Expert", () => 0, ["tech"])).toBe(
    "tech",
  );
  expect(aiStat(characters[0].baseStats, "Easy", () => 0, [])).toBeUndefined();
});
it("hands off exhausted choices and ends long fights when both sides run out", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const all = [
    "strength",
    "speed",
    "intelligence",
    "combat",
    "durability",
    "power",
    "special",
    "tech",
  ] as const;
  const exhausted = {
    ...b,
    mode: "Crossover Battle" as const,
    target: 30,
    usedStats: { player: all.filter((k) => k !== "tech"), ai: [] },
  };
  const handed = playRound(exhausted, "tech", s);
  expect(handed.turn).toBe("ai");
  expect(handed.result).toBeUndefined();
  const final = playRound(
    {
      ...exhausted,
      usedStats: { player: all.filter((k) => k !== "tech"), ai: [...all] },
    },
    "tech",
    s,
  );
  expect(final.result).toBeDefined();
  expect(final.log[0]).toContain("Both sides have used every stat");
});
