import { isPokemon } from "./gameMode";
const multiverseRewards: Record<string, string> = {
  arrival: "enemy-putty",
  ambush: "enemy-goldar",
  titan: "enemy-rita",
  goblin: "enemy-goblin",
  ultron: "enemy-ultron",
  gotham: "enemy-harley",
  joker: "enemy-joker",
};
export const villainRewards: Record<string, string> = isPokemon
  ? {
      arrival: "pokemon-10",
      ambush: "pokemon-95",
      titan: "pokemon-120",
      shadow: "pokemon-25",
      zedd: "pokemon-43",
      goblin: "pokemon-109",
      ultron: "pokemon-63",
      gotham: "pokemon-58",
      joker: "pokemon-111",
      assassin: "pokemon-150",
    }
  : multiverseRewards;
export const villainChapter = (id: string) =>
  Object.keys(villainRewards).find((chapter) => villainRewards[chapter] === id);
