export const villainRewards: Record<string, string> = {
  arrival: "enemy-putty",
  ambush: "enemy-goldar",
  titan: "enemy-rita",
  goblin: "enemy-goblin",
  ultron: "enemy-ultron",
  gotham: "enemy-harley",
  joker: "enemy-joker",
};
export const villainChapter = (id: string) =>
  Object.keys(villainRewards).find((chapter) => villainRewards[chapter] === id);
