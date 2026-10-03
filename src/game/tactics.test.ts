import { expect, it } from "vitest";
import { newSave, parseSave } from "../state/save";
import {
  activateAbility,
  combatStats,
  opponentStats,
  playRound,
} from "./battle";
import { campaignBattle, claimChapter, campaignStars } from "./adventures";
import { characters } from "../data/characters";
it("limits abilities to one use per character and one round", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const b = campaignBattle(s, "arrival", "starter")!;
  const activated = activateAbility(b, "combat");
  expect(activated.usedAbilities).toEqual(["rangers-0"]);
  expect(activateAbility(activated, "tech")).toBe(activated);
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
