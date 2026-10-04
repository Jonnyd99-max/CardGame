import { isPokemon } from "../game/gameMode";
import { pokemonTypes } from "./pokemon";
const multiverseGroups = [
  { id: "morphin", name: "Mighty Morphin Power Rangers", franchise: "rangers" },
  { id: "avengers", name: "Avengers", franchise: "marvel" },
  { id: "spider", name: "Spider heroes", franchise: "marvel" },
  { id: "xmen", name: "X-Men", franchise: "marvel" },
  { id: "guardians", name: "Guardians", franchise: "marvel" },
  { id: "justice", name: "Justice League", franchise: "dc" },
  { id: "batfamily", name: "Batman family", franchise: "dc" },
  { id: "titans", name: "Teen Titans", franchise: "dc" },
  { id: "smith", name: "Smith family", franchise: "rick" },
  { id: "citadel", name: "Citadel", franchise: "rick" },
  { id: "creatures", name: "Creatures & villains", franchise: "rick" },
];

export const groups = isPokemon
  ? pokemonTypes.map((t) => ({
      id: `${t.id}-type`,
      name: `${t.name} Pokémon`,
      franchise: t.id,
    }))
  : multiverseGroups;
