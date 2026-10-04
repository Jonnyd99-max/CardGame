import fs from "node:fs/promises";
const root =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/";
const names = ["pokemon", "pokemon_stats", "pokemon_types", "types"];
const data = Object.fromEntries(
  await Promise.all(
    names.map(async (name) => {
      const r = await fetch(root + name + ".csv");
      if (!r.ok) throw new Error(name + ": " + r.status);
      const [header, ...lines] = (await r.text()).trim().split("\n");
      return [
        name,
        lines.map((line) =>
          Object.fromEntries(
            line.split(",").map((v, i) => [header.split(",")[i], v]),
          ),
        ),
      ];
    }),
  ),
);
const typeNames = Object.fromEntries(
  data.types.map((t) => [t.id, t.identifier]),
);
const rows = data.pokemon
  .filter((p) => Number(p.id) <= 151)
  .map((p) => {
    let types = data.pokemon_types
      .filter((t) => t.pokemon_id === p.id)
      .sort((a, b) => a.slot - b.slot)
      .map((t) => typeNames[t.type_id]);
    // Original Red/Blue typing, before Steel and Fairy were introduced.
    types = types.filter((t) => t !== "steel" && t !== "fairy");
    if (!types.length) types = ["normal"];
    const stats = data.pokemon_stats
      .filter((s) => s.pokemon_id === p.id)
      .sort((a, b) => a.stat_id - b.stat_id)
      .map((s) => Number(s.base_stat));
    return {
      number: Number(p.id),
      name: p.identifier,
      types: [...new Set(types)],
      stats,
    };
  });
await fs.writeFile(
  "src/data/pokemon.json",
  JSON.stringify(rows, null, 2) + "\n",
);
console.log("Cached " + rows.length + " Pokémon from PokéAPI CSV data.");
