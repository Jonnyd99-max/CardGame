import { statKeys, type Character, type Save } from "../types";
import { groups } from "../data/groups";
export const customHeroId = "custom-hero";
export function validHero(
  hero: unknown,
): hero is NonNullable<Save["customHero"]> {
  if (!hero || typeof hero !== "object") return false;
  const h = hero as NonNullable<Save["customHero"]>;
  return (
    typeof h.name === "string" &&
    h.name.trim().length > 0 &&
    h.name.length <= 24 &&
    groups.some((g) => g.franchise === h.franchise) &&
    !!h.stats &&
    Object.keys(h.stats).length === 8 &&
    statKeys.every(
      (k) =>
        Number.isInteger(h.stats[k]) && h.stats[k] >= 1 && h.stats[k] <= 100,
    ) &&
    statKeys.reduce((n, k) => n + h.stats[k], 0) === 560 &&
    !!h.look &&
    [h.look.head, h.look.body, h.look.background].every(
      (n) => Number.isInteger(n) && n >= 0 && n < 8,
    )
  );
}
export function heroCharacter(h: NonNullable<Save["customHero"]>): Character {
  return {
    id: customHeroId,
    name: h.name,
    franchise: h.franchise,
    group: groups.find((g) => g.franchise === h.franchise)!.id,
    description:
      "Your original level-70 hero. Eight balanced stats share 560 points.",
    rarity: "Epic",
    image: "",
    customLook: h.look,
    unlockLevel: 101,
    baseLevel: 70,
    maxLevel: 100,
    baseStats: h.stats,
    maxStats: Object.fromEntries(
      statKeys.map((k) => [k, 100]),
    ) as Character["maxStats"],
    abilities: ["signature", "focus"],
    compatibleWeapons: ["pulse-blade", "blaster"],
    compatibleEquipment: ["shield", "scanner"],
    theme: h.franchise,
    tags: ["custom"],
    color: "#df9b22",
    avatar: 0,
  };
}
export function saveHero(s: Save, h: NonNullable<Save["customHero"]>) {
  if (!validHero(h) || (s.customHero && s.customHero.franchise !== h.franchise))
    return false;
  s.customHero = structuredClone({ ...h, name: h.name.trim() });
  if (!s.owned.includes(customHeroId)) s.owned.push(customHeroId);
  s.cards[customHeroId] ||= {
    level: 70,
    xp: 0,
    equipment: [],
    boosts: {},
    abilities: [],
    style: "original",
    wins: 0,
  };
  return true;
}
export function transferPoint(
  stats: Character["baseStats"],
  target: (typeof statKeys)[number],
  donor: (typeof statKeys)[number],
  amount: number,
) {
  if (
    target === donor ||
    !Number.isInteger(amount) ||
    stats[target] + amount < 1 ||
    stats[target] + amount > 100 ||
    stats[donor] - amount < 1 ||
    stats[donor] - amount > 100
  )
    return stats;
  return {
    ...stats,
    [target]: stats[target] + amount,
    [donor]: stats[donor] - amount,
  };
}
