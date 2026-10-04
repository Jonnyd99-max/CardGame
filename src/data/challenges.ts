import { franchises } from "./franchises";
import { isPokemon } from "../game/gameMode";
import type { Save } from "../types";
export const challenges = [
  {
    id: "daily3",
    name: "A good day to battle",
    description: "Win 3 battles today.",
    period: "Daily",
    target: 3,
    value: (s: Save) => s.periods.dailyWins,
    coins: 150,
  },
  {
    id: "weekly10",
    name: "Across the dimensions",
    description: "Win 10 battles this week.",
    period: "Weekly",
    target: 10,
    value: (s: Save) => s.periods.weeklyWins,
    coins: 500,
  },
  {
    id: "strength5",
    name: "Force of nature",
    description: "Win 5 rounds with Strength.",
    period: "Permanent",
    target: 5,
    value: (s: Save) => s.strengthWins,
    coins: 120,
  },
  {
    id: "upgrade1",
    name: "Going beyond",
    description: "Level up a character.",
    period: "Permanent",
    target: 1,
    value: (s: Save) => s.upgrades,
    coins: 100,
  },
  {
    id: "equip1",
    name: "Ready for anything",
    description: "Equip a weapon or armour.",
    period: "Permanent",
    target: 1,
    value: (s: Save) => s.equips,
    coins: 100,
  },
  {
    id: "perfect",
    name: "Flawless victory",
    description: "Win without losing a round.",
    period: "Permanent",
    target: 1,
    value: (s: Save) => s.perfectWins,
    coins: 200,
  },
  ...franchises.map(({ id: f }) => ({
    id: `win-${f}`,
    name: `Champion of ${f}`,
    description: isPokemon
      ? "Win with a Pokémon of this type."
      : "Win with a character from this universe.",
    period: "Permanent",
    target: 1,
    value: (s: Save) => s.franchiseWins[f] || 0,
    coins: 100,
  })),
];
