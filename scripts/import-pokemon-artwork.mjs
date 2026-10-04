import fs from "node:fs/promises";
await fs.mkdir("public/artwork/pokemon", { recursive: true });
let next = 1;
let count = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (next <= 151) {
      const id = next++;
      const r = await fetch(
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
      );
      if (!r.ok) throw Error(`Artwork ${id}: ${r.status}`);
      await fs.writeFile(
        `public/artwork/pokemon/${id}.png`,
        Buffer.from(await r.arrayBuffer()),
      );
      count++;
    }
  }),
);
console.log(`Saved ${count} Pokémon artwork files for offline play.`);
