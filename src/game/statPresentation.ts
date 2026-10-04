import { isPokemon } from "./gameMode";
import { statKeys, type Stat, type Stats } from "../types";
export const pokemonStatKeys: Stat[] = ["tech", "strength", "durability", "power", "intelligence", "speed"];
export const battleStatKeys = isPokemon ? pokemonStatKeys : [...statKeys];
const labels: Partial<Record<Stat, string>> = {
  tech: "HP", strength: "Attack", durability: "Defense", power: "Special Attack", intelligence: "Special Defense", speed: "Speed", combat: "Attack", special: "Special Attack",
};
export const statLabel = (stat: string) => isPokemon ? labels[stat as Stat] || stat : stat === "special" ? "Special ability" : stat;
export const statBonusLabel = (stat: string, value: number) => `${value > 0 ? "+" : ""}${value} ${statLabel(stat)}`;
export function pokemonStats(raw: number[]): Stats {
  const scale = (n: number) => Math.max(15, Math.min(100, Math.round(n * .55)));
  const [hp, attack, defense, specialAttack, specialDefense, speed] = raw;
  return { strength: scale(attack), speed: scale(speed), intelligence: scale(specialDefense), durability: scale(defense), power: scale(specialAttack), tech: scale(hp), combat: scale(attack), special: scale(specialAttack) };
}
