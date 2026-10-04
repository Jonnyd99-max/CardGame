import fs from "node:fs/promises";
const held = ["leftovers", "wise-glasses", "muscle-band", "charcoal", "mystic-water", "miracle-seed", "quick-claw", "focus-sash"];
const stones = ["venusaurite", "charizardite-x", "charizardite-y", "blastoisinite", "beedrillite", "pidgeotite", "raichunite-x", "raichunite-y", "clefablite", "victreebelite", "starminite", "dragoninite", "alakazite", "slowbronite", "gengarite", "kangaskhanite", "pinsirite", "gyaradosite", "aerodactylite", "mewtwonite-x", "mewtwonite-y"];
await fs.mkdir("public/artwork/items", { recursive: true });
const sources = {};
const customStones = {
  "raichunite-x": ["#ffd55b", "#f19c32", "#5d4095"],
  "raichunite-y": ["#ffd55b", "#a178dd", "#ef8a54"],
  clefablite: ["#f5a8cb", "#bc91db", "#77b9dd"],
  victreebelite: ["#a5c84c", "#f4cf55", "#a26bc2"],
  starminite: ["#ae79cc", "#ed6585", "#62b6d7"],
  dragoninite: ["#f0ad63", "#78c7bb", "#9873d6"],
  arcaninite: ["#ff9344", "#ffda86", "#463d45"],
};
for (const id of [...held, ...stones, "arcaninite"]) {
  if (customStones[id]) {
    const [a, b, c] = customStones[id];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><radialGradient id="gem"><stop stop-color="#fff9df"/><stop offset=".4" stop-color="${a}"/><stop offset="1" stop-color="${c}"/></radialGradient></defs><ellipse cx="64" cy="111" rx="31" ry="6" fill="#322847" opacity=".12"/><path d="M64 12 100 37 109 73 87 105 48 111 21 84 22 44Z" fill="url(#gem)" stroke="#413648" stroke-width="4"/><path d="M64 12 48 49 22 44M48 49 21 84M48 49 87 105M48 49 100 37M100 37 79 65 109 73M79 65 87 105" fill="none" stroke="#fff5df" stroke-width="3" opacity=".7"/><path d="M68 31C39 47 79 58 55 79C80 64 42 50 68 31Z" fill="${b}" stroke="#fff6e1" stroke-width="2"/><path d="M43 25 32 45" stroke="white" stroke-width="5" stroke-linecap="round" opacity=".85"/></svg>`;
    await fs.writeFile(`public/artwork/items/${id}.svg`, svg);
    sources[id] = { description: "Custom illustrated Mega Stone icon in the game's gem style; colors match its Pokémon." };
    console.log(`${id}: custom illustration`);
    continue;
  }
  const sprite = id === "arcaninite" ? "fire-stone" : id;
  const url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${sprite}.png`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${id}: unavailable (${response.status})`);
  await fs.writeFile(`public/artwork/items/${id}.png`, Buffer.from(await response.arrayBuffer()));
  sources[id] = { url, description: id === "arcaninite" ? "Fire Stone sprite used for the custom Arcaninite item." : "Pokémon item sprite from PokeAPI's sprite collection." };
  console.log(`${id}: cached`);
}
await fs.writeFile("public/artwork/items/sources.json", JSON.stringify(sources, null, 2) + "\n");
