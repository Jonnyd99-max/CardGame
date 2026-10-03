import { expect, it } from "vitest";
import { characters } from "../data/characters";
import { newSave, parseSave } from "../state/save";
import { evolutionFor } from "./evolution";
import {
  activateAbility,
  combatStats,
  abilityNotices,
  createBattle,
} from "./battle";

it("unlocks forms at card levels 5 and 10 and preserves them through save imports", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const c = characters.find((c) => c.id === "rangers-0")!;
  for (const [level, stage] of [
    [4, 0],
    [5, 1],
    [9, 1],
    [10, 2],
  ]) {
    s.cards[c.id].level = level;
    expect(evolutionFor(c, parseSave(JSON.stringify(s))).stage).toBe(stage);
  }
  expect(evolutionFor(c, { ...s, owned: [] }).stage).toBe(0);
});
it("strengthens evolved abilities without giving extra activations", () => {
  const b = createBattle(["rangers-0"], "Quick Battle", "Normal");
  const c = characters.find((c) => c.id === "rangers-0")!;
  const focus = activateAbility(b, "combat", () => 0, 2);
  expect(combatStats(focus, c.id, c.baseStats).combat).toBe(
    Math.min(100, c.baseStats.combat + 12),
  );
  expect(activateAbility(focus, "tech")).toBe(focus);
  expect(abilityNotices(focus)[0].description).toContain("+12");
  const shield = activateAbility(
    { ...b, player: ["rangers-6"] },
    "combat",
    () => 0,
    2,
  );
  expect(combatStats(shield, "rangers-6", c.baseStats).durability).toBe(
    Math.min(100, c.baseStats.durability + 16),
  );
  expect(
    activateAbility({ ...b, player: ["rick-6"] }, "tech", () => 0, 2)
      .abilityRound?.value,
  ).toBe(80);
  expect(
    activateAbility({ ...b, player: ["rick-6"] }, "tech", () => 0.999999, 2)
      .abilityRound?.value,
  ).toBe(100);
  const scan = activateAbility({ ...b, player: ["dc-0"] }, "tech", () => 0, 2);
  expect(new Set(scan.abilityRound?.revealStats).size).toBe(3);
  expect(scan.abilityRound?.revealStats).toContain("tech");
});
