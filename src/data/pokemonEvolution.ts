import parents from "./pokemonEvolution.json";

export const pokemonEvolutionParents: Record<string, number> = parents;
export const evolutionRequirement = (id: string) => {
  if (!id.startsWith("pokemon-")) return undefined;
  const parent = pokemonEvolutionParents[id.slice(8)];
  if (!parent) return undefined;
  return {
    parent: `pokemon-${parent}`,
    level: pokemonEvolutionParents[String(parent)] ? 15 : 5,
  };
};
export const nextPokemonEvolutions = (id: string) =>
  Object.keys(pokemonEvolutionParents)
    .map((number) => ({
      id: `pokemon-${number}`,
      ...evolutionRequirement(`pokemon-${number}`)!,
    }))
    .filter((evolution) => evolution.parent === id);
