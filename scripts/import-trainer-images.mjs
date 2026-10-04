import fs from "node:fs/promises";
const trainers = {
  oak: "oak-gen3",
  brock: "brock-gen3",
  misty: "misty-gen3",
  surge: "ltsurge-gen3",
  erika: "erika-gen3",
  koga: "koga-gen3",
  sabrina: "sabrina-gen3",
  blaine: "blaine-gen3",
  giovanni: "giovanni-gen3",
};
await fs.mkdir("public/artwork/trainers", { recursive: true });
const sources = {};
await Promise.all(
  Object.entries(trainers).map(async ([id, name]) => {
    const url = `https://play.pokemonshowdown.com/sprites/trainers/${name}.png`;
    const r = await fetch(url);
    if (!r.ok) throw Error(`${name}: ${r.status}`);
    await fs.writeFile(
      `public/artwork/trainers/${id}.png`,
      Buffer.from(await r.arrayBuffer()),
    );
    sources[id] = {
      url,
      description:
        "Generation III trainer sprite, hosted by Pokémon Showdown. Pokémon artwork belongs to its respective owners.",
    };
  }),
);
await fs.writeFile(
  "public/artwork/trainers/sources.json",
  JSON.stringify(sources, null, 2) + "\n",
);
console.log("Cached all nine trainer images.");
