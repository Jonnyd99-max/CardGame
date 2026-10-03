import { characters } from "../data/characters";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { abilities } from "../data/abilities";
import {
  cardProgress,
  refreshPeriods,
  items,
  compatible,
  validateDeck,
} from "../game/progression";
import { statKeys, type Save } from "../types";
export const SAVE_KEY = "jd-multiverse-v1";
export function newSave(
  name: string,
  franchise: string,
  favourite: string,
): Save {
  const owned = characters
    .filter((c) => c.franchise === franchise && c.unlockLevel === 1)
    .map((c) => c.id);
  return {
    version: 1,
    presentationVersion: 2,
    name,
    xp: 0,
    coins: 350,
    materials: 5,
    owned,
    cards: Object.fromEntries(owned.map((id) => [id, cardProgress()])),
    items: {},
    decks: [
      {
        id: "starter",
        name: "First dimension",
        cards: [...owned],
        rule: "Single Franchise",
      },
    ],
    activeDeck: "starter",
    favourite,
    franchise,
    group: characters.find((c) => c.id === favourite)!.group,
    wins: 0,
    losses: 0,
    roundWins: 0,
    strengthWins: 0,
    perfectWins: 0,
    franchiseWins: {},
    upgrades: 0,
    equips: 0,
    claimed: [],
    daily: "",
    settings: { sound: false, animations: true, reducedMotion: false },
    history: [],
    periods: { daily: "", weekly: "", dailyWins: 0, weeklyWins: 0 },
  };
}
const integer = (n: unknown, max = Number.MAX_SAFE_INTEGER): n is number =>
  typeof n === "number" && Number.isSafeInteger(n) && n >= 0 && n <= max;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const stringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((id) => typeof id === "string");
export function parseSave(raw: string): Save {
  const s = JSON.parse(raw) as Save;
  // Preserve IDs, ownership and upgrades while moving old Ranger preferences to MMPR.
  if (s?.franchise === "rangers" && ["zeo", "space"].includes(s.group))
    s.group = "morphin";
  if (s?.version === 1 && !s.presentationVersion && Array.isArray(s.owned)) {
    s.franchise = "rangers";
    s.group = "morphin";
    s.favourite = s.owned.includes("rangers-0") ? "rangers-0" : s.favourite;
    s.presentationVersion = 2;
  }
  const fail = () => {
    throw new Error(
      "This is not a valid version 1 save. Your current progress has been kept.",
    );
  };
  if (
    !record(s) ||
    s.version !== 1 ||
    typeof s.name !== "string" ||
    !s.name.trim() ||
    s.name.length > 24
  )
    fail();
  if (
    ![
      "xp",
      "coins",
      "materials",
      "wins",
      "losses",
      "roundWins",
      "strengthWins",
      "perfectWins",
      "upgrades",
      "equips",
    ].every((k) => integer(s[k as keyof Save]))
  )
    fail();
  if (
    !stringArray(s.owned) ||
    !s.owned.length ||
    new Set(s.owned).size !== s.owned.length ||
    s.owned.some((id) => !characters.some((c) => c.id === id))
  )
    fail();
  if (
    !s.owned.includes(s.favourite) ||
    !franchises.some((f) => f.id === s.franchise) ||
    !groups.some((g) => g.id === s.group && g.franchise === s.franchise)
  )
    fail();
  if (
    !record(s.cards) ||
    !record(s.items) ||
    !record(s.settings) ||
    !record(s.periods) ||
    !record(s.franchiseWins)
  )
    fail();
  if (
    !Object.values(s.settings).every((v) => typeof v === "boolean") ||
    !["sound", "animations", "reducedMotion"].every(
      (k) => typeof s.settings[k as keyof Save["settings"]] === "boolean",
    )
  )
    fail();
  if (
    typeof s.periods.daily !== "string" ||
    typeof s.periods.weekly !== "string" ||
    !integer(s.periods.dailyWins) ||
    !integer(s.periods.weeklyWins) ||
    typeof s.daily !== "string"
  )
    fail();
  if (
    !Object.entries(s.franchiseWins).every(
      ([id, n]) => franchises.some((f) => f.id === id) && integer(n),
    )
  )
    fail();
  if (
    !Object.entries(s.items).every(
      ([id, tier]) =>
        items.some((i) => i.id === id) && integer(tier, 3) && tier >= 1,
    )
  )
    fail();
  if (
    !stringArray(s.claimed) ||
    !Array.isArray(s.history) ||
    s.history.length > 30 ||
    !s.history.every(
      (h) =>
        record(h) &&
        typeof h.won === "boolean" &&
        typeof h.mode === "string" &&
        typeof h.score === "string" &&
        typeof h.date === "string" &&
        Number.isFinite(Date.parse(h.date)),
    )
  )
    fail();
  for (const id of s.owned) {
    const c = characters.find((c) => c.id === id)!;
    const p = s.cards[id];
    if (
      !record(p) ||
      !integer(p.level, c.maxLevel) ||
      p.level < c.baseLevel ||
      !integer(p.xp) ||
      !integer(p.wins) ||
      !stringArray(p.equipment) ||
      !stringArray(p.abilities) ||
      !record(p.boosts) ||
      !["original", "holographic"].includes(p.style)
    )
      fail();
    if (
      p.equipment.length > 2 ||
      new Set(p.equipment).size !== p.equipment.length ||
      p.equipment.some(
        (itemId) =>
          !s.items[itemId] ||
          !items.some((i) => i.id === itemId && compatible(c, i)),
      )
    )
      fail();
    if (
      new Set(
        p.equipment.map((itemId) => items.find((i) => i.id === itemId)!.slot),
      ).size !== p.equipment.length
    )
      fail();
    if (
      new Set(p.abilities).size !== p.abilities.length ||
      p.abilities.some(
        (a) =>
          !c.abilities.includes(a) || !abilities.some((def) => def.id === a),
      )
    )
      fail();
    if (
      !Object.entries(p.boosts).every(
        ([k, v]) =>
          statKeys.includes(k as (typeof statKeys)[number]) && integer(v, 5),
      )
    )
      fail();
  }
  if (
    !Array.isArray(s.decks) ||
    !s.decks.length ||
    new Set(s.decks.map((d) => d.id)).size !== s.decks.length
  )
    fail();
  for (const d of s.decks) {
    if (
      !record(d) ||
      typeof d.id !== "string" ||
      typeof d.name !== "string" ||
      !d.name.trim() ||
      d.name.length > 40 ||
      !["Mixed Universe", "Single Franchise", "Single Group"].includes(
        d.rule,
      ) ||
      !stringArray(d.cards) ||
      validateDeck(d, s)
    )
      fail();
  }
  if (!s.decks.some((d) => d.id === s.activeDeck)) fail();
  return refreshPeriods(s);
}
export const saveStorage = {
  error: "",
  load(): Save | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.error = "";
      return raw ? parseSave(raw) : null;
    } catch (error) {
      this.error =
        error instanceof Error
          ? error.message
          : "Saved progress could not be loaded.";
      console.warn("Saved progress could not be loaded:", this.error);
      return null;
    }
  },
  save(s: Save) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  },
  clear() {
    localStorage.removeItem(SAVE_KEY);
    this.error = "";
  },
};
