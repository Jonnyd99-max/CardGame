import fs from "node:fs/promises";
const url =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv";
const r = await fetch(url);
if (!r.ok) throw Error(r.status);
const [header, ...rows] = (await r.text()).trim().split("\n");
const keys = header.split(",");
const species = rows
  .map((row) => Object.fromEntries(row.split(",").map((v, i) => [keys[i], v])))
  .filter((p) => Number(p.id) <= 151);
const parents = Object.fromEntries(
  species
    .filter(
      (p) =>
        p.evolves_from_species_id && Number(p.evolves_from_species_id) <= 151,
    )
    .map((p) => [p.id, Number(p.evolves_from_species_id)]),
);
await fs.writeFile(
  "src/data/pokemonEvolution.json",
  JSON.stringify(parents, null, 2) + "\n",
);
console.log(Object.keys(parents).length + " evolution relationships cached.");
const p = await fetch(
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv",
);
const [h, ...ls] = (await p.text()).trim().split("\n");
const ks = h.split(",");
const forms = ls
  .map((row) => Object.fromEntries(row.split(",").map((v, i) => [ks[i], v])))
  .filter((p) => p.identifier.includes("-mega") && Number(p.species_id) <= 151);
await fs.mkdir("public/artwork/pokemon/mega", { recursive: true });
await Promise.all(
  forms.map(async (p) => {
    const art = await fetch(
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
    );
    if (!art.ok) throw Error(p.identifier);
    await fs.writeFile(
      `public/artwork/pokemon/mega/${p.identifier}.png`,
      Buffer.from(await art.arrayBuffer()),
    );
  }),
);
console.log("Cached " + forms.length + " Mega Evolution artworks.");
