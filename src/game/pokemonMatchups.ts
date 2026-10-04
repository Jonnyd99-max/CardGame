import roster from "../data/pokemon.json";
import { statKeys, type Stats } from "../types";

// Standard type effectiveness for the fifteen types used by this Kanto roster.
const chart: Record<string, [string[], string[], string[]?]> = {
  normal: [[], ["rock"], ["ghost"]],
  fire: [["grass", "ice", "bug"], ["fire", "water", "rock", "dragon"]],
  water: [["fire", "ground", "rock"], ["water", "grass", "dragon"]],
  electric: [["water", "flying"], ["electric", "grass", "dragon"], ["ground"]],
  grass: [["water", "ground", "rock"], ["fire", "grass", "poison", "flying", "bug", "dragon"]],
  ice: [["grass", "ground", "flying", "dragon"], ["fire", "water", "ice"]],
  fighting: [["normal", "ice", "rock"], ["poison", "flying", "psychic", "bug"], ["ghost"]],
  poison: [["grass"], ["poison", "ground", "rock", "ghost"]],
  ground: [["fire", "electric", "poison", "rock"], ["grass", "bug"], ["flying"]],
  flying: [["grass", "fighting", "bug"], ["electric", "rock"]],
  psychic: [["fighting", "poison"], ["psychic"]],
  bug: [["grass", "psychic"], ["fire", "fighting", "poison", "flying", "ghost"]],
  rock: [["fire", "ice", "flying", "bug"], ["fighting", "ground"]],
  ghost: [["psychic", "ghost"], [], ["normal"]],
  dragon: [["dragon"], []],
};
const typesById = new Map(roster.map((p) => [`pokemon-${p.number}`, p.types]));

export function pokemonMatchupBonus(ownId: string, enemyId: string): number {
  const own = typesById.get(ownId), enemy = typesById.get(enemyId);
  if (!own || !enemy) return 0;
  // Use the strongest of the Pokémon's types; combine both defending types.
  const effectiveness = Math.max(...own.map((type) => {
    const [strong, weak, immune = []] = chart[type];
    return enemy.reduce((value, defending) => value *
      (immune.includes(defending) ? 0 : strong.includes(defending) ? 2 : weak.includes(defending) ? 0.5 : 1), 1);
  }));
  return effectiveness > 1 ? 5 : effectiveness < 1 ? -5 : 0;
}

export function applyPokemonMatchup(base: Stats, ownId: string, enemyId: string): Stats {
  const bonus = pokemonMatchupBonus(ownId, enemyId);
  return Object.fromEntries(statKeys.map((key) => [key, Math.max(1, Math.min(100, base[key] + bonus))])) as Stats;
}
