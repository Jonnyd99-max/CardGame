import { expect, it } from "vitest";
import { characters } from "../data/characters";
import { newSave } from "../state/save";
import { uniquePowers, uniqueEffect } from "./uniquePowers";
import {
  createBattle,
  activateAbility,
  combatStats,
  opponentStats,
  playRound,
  abilityNotices,
} from "./battle";
import { statKeys } from "../types";
it("gives every Epic, Legendary and Mythic character its own named power on either side", () => {
  const s = newSave("Player", "rangers", "rangers-0");
  const high = characters.filter((c) =>
    ["Epic", "Legendary", "Mythic"].includes(c.rarity),
  );
  expect(high).toHaveLength(18);
  for (const c of high) {
    expect(uniquePowers[c.id]).toBeDefined();
    const b = {
      ...createBattle([c.id], "Crossover Battle", "Normal"),
      ai: ["rangers-0"],
    };
    const active = activateAbility(b, "tech", () => 0.5);
    expect(
      abilityNotices(active).find((n) => n.side === "player")?.title,
    ).toContain(uniquePowers[c.id].name);
    expect(activateAbility(active, "power")).toBe(active);
    const rival = playRound(
      { ...b, player: ["rangers-0"], ai: [c.id] },
      "strength",
      s,
    );
    expect(rival.opponentAbility?.character).toBe(c.id);
    expect(
      abilityNotices(rival).some((n) =>
        n.title.includes(uniquePowers[c.id].name),
      ),
    ).toBe(true);
    const later = { ...rival, last: undefined, round: rival.round + 1 };
    expect(playRound(later, "speed", s).opponentAbility).toEqual(
      rival.opponentAbility,
    );
    for (const value of Object.values(rival.last!.enemyStats!))
      expect(value).toBeGreaterThanOrEqual(1);
  }
});
it("applies symmetric boosts, curses, swaps and rerolls with bounded values", () => {
  const base = Object.fromEntries(
    statKeys.map((k) => [k, 50]),
  ) as (typeof characters)[0]["baseStats"];
  const b = {
    ...createBattle(["marvel-6"], "Quick Battle", "Normal"),
    ai: ["rangers-0"],
  };
  const thor = activateAbility(b, "power", () => 0);
  expect(combatStats(thor, "marvel-6", base).power).toBe(62);
  expect(combatStats(thor, "marvel-6", base).special).toBe(58);
  const aiThor = {
    ...b,
    opponentAbility: {
      round: 0,
      character: "marvel-6",
      stat: "power" as const,
      ...uniqueEffect("marvel-6", "power"),
    },
  };
  expect(opponentStats(aiThor, base)).toEqual(
    combatStats(thor, "marvel-6", base),
  );
  const rita = activateAbility({ ...b, player: ["enemy-rita"] }, "tech");
  expect(opponentStats(rita, base).tech).toBe(42);
  const joker = activateAbility({ ...b, player: ["enemy-joker"] }, "tech");
  expect(
    opponentStats(joker, { ...base, power: 20, intelligence: 80 }).power,
  ).toBe(80);
  const thanos = activateAbility({ ...b, player: ["marvel-7"] }, "power");
  expect(combatStats(thanos, "marvel-7", base).speed).toBe(44);
  expect(combatStats({ ...thor, round: 1 }, "marvel-6", base)).toEqual(base);
});
