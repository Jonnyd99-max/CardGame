import { describe, expect, it } from "vitest";
import { applyPokemonMatchup, pokemonMatchupBonus } from "./pokemonMatchups";
import { statKeys, type Stats } from "../types";

describe("Pokémon type matchups", () => {
  it("gives Water an advantage and Fire a disadvantage", () => {
    expect(pokemonMatchupBonus("pokemon-7", "pokemon-4")).toBe(5);
    expect(pokemonMatchupBonus("pokemon-4", "pokemon-7")).toBe(-5);
  });
  it("combines defending types and selects the strongest attacking type", () => {
    // Electric cannot affect Ground; Rock versus Fire/Flying still gets just +5.
    expect(pokemonMatchupBonus("pokemon-25", "pokemon-74")).toBe(-5);
    expect(pokemonMatchupBonus("pokemon-74", "pokemon-6")).toBe(5);
    // Electric resistance and Flying weakness cancel on Zapdos.
    expect(pokemonMatchupBonus("pokemon-25", "pokemon-123")).toBe(5);
    expect(pokemonMatchupBonus("pokemon-25", "pokemon-145")).toBe(0);
    // Normal/Flying can use Flying against Ghost/Poison instead of Normal immunity.
    expect(pokemonMatchupBonus("pokemon-16", "pokemon-92")).toBe(0);
    expect(pokemonMatchupBonus("pokemon-4", "pokemon-4")).toBe(-5);
  });
  it("leaves multiverse matchups unchanged", () => {
    expect(pokemonMatchupBonus("marvel-0", "pokemon-7")).toBe(0);
  });
  it("adjusts every stat and respects bounds", () => {
    const base = Object.fromEntries(statKeys.map((k) => [k, 50])) as Stats;
    expect(Object.values(applyPokemonMatchup(base, "pokemon-7", "pokemon-4"))).toEqual(statKeys.map(() => 55));
    expect(Object.values(applyPokemonMatchup(base, "pokemon-4", "pokemon-7"))).toEqual(statKeys.map(() => 45));
    base.strength = 99;
    base.speed = 2;
    expect(applyPokemonMatchup(base, "pokemon-7", "pokemon-4").strength).toBe(100);
    expect(applyPokemonMatchup(base, "pokemon-4", "pokemon-7").speed).toBe(1);
  });
});
