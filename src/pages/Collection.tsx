import { isPokemon } from "../game/gameMode";
import { useState } from "react";
import { Search } from "lucide-react";
import { getCharacters } from "../data/characters";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { rarities } from "../data/rarities";
import { powerFor } from "../game/progression";
import { Card } from "../components/Card";
import type { Save } from "../types";
import { pokemonMegaStones } from "../data/pokemonItems";
import { evolutionRequirement } from "../data/pokemonEvolution";
export function Collection({
  save,
  detail,
  initial = "",
}: {
  save: Save;
  detail: (id: string) => void;
  initial?: string;
}) {
  const characters = getCharacters(save);
  const [album, setAlbum] = useState("all");
  const [search, setSearch] = useState(""),
    [franchise, setFranchise] = useState(initial),
    [rarity, setRarity] = useState(""),
    [group, setGroup] = useState(""),
    [level, setLevel] = useState(""),
    [sort, setSort] = useState("power"),
    [owned, setOwned] = useState(false),
    [favourites, setFavourites] = useState(false);
  const list = characters
    .filter(
      (c) =>
        (album !== "shiny" || save.pokemonShinies?.includes(c.id)) &&
        (album !== "evolved" || !!evolutionRequirement(c.id)) &&
        (!franchise ||
          (isPokemon
            ? c.tags.includes(franchise)
            : c.franchise === franchise)) &&
        (!rarity || c.rarity === rarity) &&
        (!group || c.group === group) &&
        (!level || (save.cards[c.id]?.level || 1) >= Number(level)) &&
        (!owned || save.owned.includes(c.id)) &&
        (!favourites || save.favourite === c.id) &&
        c.name.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : sort === "number" ? Number(a.id.replace("pokemon-", "")) - Number(b.id.replace("pokemon-", ""))
        : powerFor(b, save) - powerFor(a, save),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">BUILD YOUR LEGACY</span>
          <h1>
            {isPokemon ? "Kanto Pokédex" : "My collection"}{" "}
            <em>
              {save.owned.length}/{characters.length}
            </em>
          </h1>
          <p>
            {isPokemon
              ? "All 151 Kanto Pokémon. Player levels make cards available in packs; open packs to collect them. Train owned Pokémon to unlock evolutions at levels 5 and 15."
              : "Meet your legends. Discover your next obsession."}
          </p>
        </div>
      </div>
      {isPokemon && <>
        <div className="pokedex-summary panel">
          <span><strong>{new Set([...(save.pokemonSeen || []), ...save.owned]).size}/151</strong> Seen</span>
          <span><strong>{save.owned.length}/151</strong> Collected</span>
          <span><strong>{save.owned.filter(id => evolutionRequirement(id)).length}</strong> Evolutions</span>
          <span><strong>{save.pokemonMegaSeen?.length || 0}/{pokemonMegaStones.length}</strong> Mega forms activated</span>
          <span><strong>{save.pokemonShinies?.length || 0}</strong> Shiny variants</span>
        </div>
        <div className="button-row" aria-label="Pokédex album">
          {[["all", "All Pokémon"], ["evolved", "Evolutions"], ["mega", "Mega forms"], ["shiny", "Shinies"]].map(([id, label]) => <button key={id} className={`secondary ${album === id ? "selected" : ""}`} onClick={() => setAlbum(id)}>{label}</button>)}
        </div>
      </>}
      {isPokemon && album === "mega" ? <div className="collection-grid">
        {pokemonMegaStones.map(stone => {
          const c = characters.find(c => c.id === stone.characters[0])!;
          const unlocked = save.pokemonMegaSeen?.includes(stone.id);
          const preview = { ...save, cards: { ...save.cards, [c.id]: { ...(save.cards[c.id] || { level: 1, xp: 0, wins: 0, boosts: {}, abilities: [], style: "original" }), equipment: [stone.id] } } };
          return <section key={stone.id}><Card character={c} save={preview} onClick={() => detail(c.id)} /><p><strong>{stone.name}</strong> · {unlocked ? "Activated ✓" : "Collect the Pokémon and equip its stone"}</p></section>;
        })}
      </div> : <>
      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Search characters"
            placeholder={
              isPokemon ? "Search the original 151…" : "Search your multiverse…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label={isPokemon ? "Type filter" : "Universe filter"}
          value={franchise}
          onChange={(e) => setFranchise(e.target.value)}
        >
          <option value="">{isPokemon ? "All types" : "All universes"}</option>
          {franchises.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Rarity filter"
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
        >
          <option value="">All rarities</option>
          {Object.keys(rarities).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select
          aria-label="Group filter"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="">All groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Minimum level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="">Any level</option>
          {[5, 10, 20].map((n) => (
            <option key={n} value={n}>
              Level {n}+
            </option>
          ))}
        </select>
        <select
          aria-label="Sort cards"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="power">Power: highest first</option>
          <option value="name">Name: A–Z</option>
          {isPokemon && <option value="number">Pokédex number</option>}
        </select>
        <label>
          <input
            type="checkbox"
            checked={owned}
            onChange={(e) => setOwned(e.target.checked)}
          />{" "}
          Owned only
        </label>
        <label>
          <input
            type="checkbox"
            checked={favourites}
            onChange={(e) => setFavourites(e.target.checked)}
          />{" "}
          Favourite
        </label>
      </div>
      <div className="collection-grid">
        {list.map((c) => (
          <Card
            key={c.id}
            character={c}
            save={isPokemon && album === "shiny" ? { ...save, cards: { ...save.cards, [c.id]: { ...save.cards[c.id], style: "shiny", equipment: [] } } } : save}
            locked={!save.owned.includes(c.id)}
            onClick={() => detail(c.id)}
          />
        ))}
      </div>
      {!list.length && (
        <div className="empty">{album === "shiny" ? "Find shiny Pokémon in packs: a 5% chance per pack. Evolving a shiny also unlocks its shiny evolution." : "No cards match. Try changing your filters."}</div>
      )}
      </>}
    </>
  );
}
