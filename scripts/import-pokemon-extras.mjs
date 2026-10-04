import fs from "node:fs/promises";
const root = "https://raw.githubusercontent.com/PokeAPI";
const get = async (url) => { const r = await fetch(url); if (!r.ok) throw Error(`${url}: ${r.status}`); return r; };
const [pokemon, stats] = await Promise.all([
  get(`${root}/pokeapi/master/data/v2/csv/pokemon.csv`).then(r => r.text()),
  get(`${root}/pokeapi/master/data/v2/csv/pokemon_stats.csv`).then(r => r.text()),
]);
const forms = {};
const byId = new Map();
for (const row of pokemon.trim().split(/\r?\n/).slice(1)) {
  const [id, name] = row.split(",");
  if (/^(venusaur|charizard|blastoise|beedrill|pidgeot|raichu|clefable|victreebel|starmie|dragonite|alakazam|slowbro|gengar|kangaskhan|pinsir|gyarados|aerodactyl|mewtwo)-mega/.test(name)) {
    forms[name] = Array(6).fill(0); byId.set(id, name);
  }
}
for (const row of stats.trim().split(/\r?\n/).slice(1)) {
  const [id, stat, value] = row.split(",");
  if (byId.has(id)) forms[byId.get(id)][Number(stat) - 1] = Number(value);
}
await fs.writeFile("src/data/pokemonMegaStats.json", JSON.stringify(forms, null, 2) + "\n");
await fs.mkdir("public/artwork/pokemon/shiny", { recursive: true });
let next = 1;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (next <= 151) {
    const id = next++;
    const r = await get(`${root}/sprites/master/sprites/pokemon/other/official-artwork/shiny/${id}.png`);
    await fs.writeFile(`public/artwork/pokemon/shiny/${id}.png`, Buffer.from(await r.arrayBuffer()));
  }
}));
console.log(`Cached 151 shiny artworks and ${Object.keys(forms).length} Mega stat profiles.`);
