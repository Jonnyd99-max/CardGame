import { isPokemon } from "../game/gameMode";
import { pokemonTypes } from "./pokemon";
const multiverseFranchises = [
  {
    id: "rangers",
    name: "Mighty Morphin",
    subtitle: "Power Rangers",
    color: "#dc303c",
    symbol: "⚡",
  },
  {
    id: "marvel",
    name: "Marvel",
    subtitle: "Heroes assemble",
    color: "#c93139",
    symbol: "✦",
  },
  {
    id: "dc",
    name: "Justice League / DC",
    subtitle: "Heroic skyline",
    color: "#345aaa",
    symbol: "◆",
  },
  {
    id: "rick",
    name: "Rick and Morty",
    subtitle: "Beyond the portal",
    color: "#168653",
    symbol: "◎",
  },
];

export const franchises = isPokemon ? pokemonTypes : multiverseFranchises;
