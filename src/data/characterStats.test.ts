import { describe, expect, it } from "vitest";
import { characters, heroes } from "./characters";
import { characterStats } from "./characterStats";
import { statKeys } from "../types";

const stats = (name: string) =>
  characters.find((c) => c.name === name)!.baseStats;
describe("character-specific stat balance", () => {
  it("provides a complete valid profile for every character", () => {
    expect(Object.keys(characterStats).sort()).toEqual(
      heroes.map((c) => c.id).sort(),
    );
    for (const c of characters) {
      expect(Object.keys(c.baseStats).sort()).toEqual([...statKeys].sort());
      for (const stat of statKeys) {
        expect(Number.isInteger(c.baseStats[stat])).toBe(true);
        expect(c.baseStats[stat]).toBeGreaterThanOrEqual(1);
        expect(c.baseStats[stat]).toBeLessThanOrEqual(c.maxStats[stat]);
      }
    }
  });
  it("makes Rick and Billy scientists with physical tradeoffs", () => {
    const rick = stats("Rick Sanchez");
    expect(rick.intelligence).toBeGreaterThanOrEqual(98);
    expect(rick.tech).toBeGreaterThanOrEqual(98);
    expect(rick.strength).toBeLessThan(stats("Birdperson").strength);
    const billy = stats("Blue Ranger");
    expect(billy.intelligence).toBeGreaterThan(
      stats("Red Ranger").intelligence,
    );
    expect(billy.tech).toBeGreaterThan(stats("Red Ranger").tech);
    expect(billy.combat).toBeLessThan(stats("Red Ranger").combat);
  });
  it("distinguishes speed, physical power, magic and human skill", () => {
    expect(stats("The Flash").speed).toBeGreaterThan(stats("Superman").speed);
    expect(stats("Superman").strength).toBeGreaterThan(
      stats("Batman").strength,
    );
    expect(stats("Batman").intelligence).toBeGreaterThan(
      stats("Superman").intelligence,
    );
    expect(stats("Raven").special).toBeGreaterThan(stats("Nightwing").special);
    expect(stats("Black Widow").combat).toBeGreaterThan(
      stats("Iron Man").combat,
    );
    expect(stats("Wolverine").durability).toBeGreaterThan(
      stats("Spider-Man").durability,
    );
  });
});
