import { migratePokemonSave } from "../game/pokemonProgression";
import { isPokemon } from "../game/gameMode";
import { characters, getCharacter } from "../data/characters";
import { validHero, customHeroId } from "../game/customHeroes";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { abilities } from "../data/abilities";
import {
  cardProgress,
  refreshPeriods,
  items,
  compatible,
  validateDeck,
  migrateBalance,
} from "../game/progression";
import { statKeys, type Save } from "../types";
import { chapters } from "../game/adventures";
export const SAVE_KEY = isPokemon ? "jd-pokemon-v1" : "jd-multiverse-v1";
export function newSave(
  name: string,
  franchise: string,
  favourite: string,
): Save {
  let owned = characters
    .filter(
      (c) =>
        c.franchise === franchise &&
        c.unlockLevel === 1 &&
        (!isPokemon || c.rarity === "Common"),
    )
    .map((c) => c.id);
  if (isPokemon) {
    owned = [
      ...new Set([
        ...owned.slice(0, 4),
        "pokemon-1",
        "pokemon-4",
        "pokemon-7",
        "pokemon-25",
      ]),
    ].slice(0, 4);
  }
  if (isPokemon && !owned.includes(favourite)) favourite = owned[0];
  return {
    ...(isPokemon ? { pokemonProgressionVersion: 1 as const, pokemonAcquisitionVersion: 1 as const } : {}),
    version: 1,
    presentationVersion: 2,
    balanceVersion: 1,
    starterFranchise: franchise,
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
        name: isPokemon ? "First Kanto team" : "First dimension",
        cards: [...owned],
        rule: isPokemon ? "Mixed Universe" : "Single Franchise",
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
  if (s.customHero !== undefined && !validHero(s.customHero)) fail();
  if (isPokemon) {
    if (
      s.pokemonProgressionVersion !== undefined &&
      s.pokemonProgressionVersion !== 1
    )
      fail();
    migratePokemonSave(s);
  }
  if (
    !stringArray(s.owned) ||
    !s.owned.length ||
    new Set(s.owned).size !== s.owned.length ||
    s.owned.some((id) => !getCharacter(id, s))
  )
    fail();
  if (
    !s.owned.includes(s.favourite) ||
    (s.starterFranchise !== undefined &&
      !franchises.some((f) => f.id === s.starterFranchise)) ||
    (s.balanceVersion !== undefined &&
      (s.balanceVersion !== 1 || !s.starterFranchise)) ||
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
    s.customHero &&
    (!s.owned.includes(customHeroId) || !s.cards[customHeroId])
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
  if (s.owned.some((id) => !s.cards[id])) fail();
  if (s.packsOpened !== undefined && !integer(s.packsOpened)) fail();
  for (const key of ["pokemonSeen", "pokemonShinies"] as const) {
    const ids = s[key];
    if (ids !== undefined && (!stringArray(ids) || new Set(ids).size !== ids.length || ids.some(id => !id.startsWith("pokemon-") || !getCharacter(id, s)))) fail();
  }
  if (s.pokemonMegaSeen !== undefined && (!stringArray(s.pokemonMegaSeen) || new Set(s.pokemonMegaSeen).size !== s.pokemonMegaSeen.length || s.pokemonMegaSeen.some(id => !items.some(i => i.id === id && i.category === "mega-stone")))) fail();
  if (
    s.campaignStars !== undefined &&
    (!record(s.campaignStars) ||
      !Object.entries(s.campaignStars).every(
        ([id, n]) => s.campaign?.includes(id) && integer(n, 3) && n >= 1,
      ))
  )
    fail();
  if (
    s.campaign !== undefined &&
    (!stringArray(s.campaign) ||
      new Set(s.campaign).size !== s.campaign.length ||
      s.campaign.some((id, i) => chapters[i]?.id !== id))
  )
    fail();
  for (const id of Object.keys(s.cards)) {
    const c = getCharacter(id, s)!;
    if (!c) fail();
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
      !["original", "holographic", ...(isPokemon && s.pokemonShinies?.includes(id) ? ["shiny"] : [])].includes(p.style)
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
  return refreshPeriods(migrateBalance(s));
}
export const saveStorage = {
  error: "",
  load(): Save | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      this.error = "";
      if (!raw) return null;
      const parsed = parseSave(raw);
      if (isPokemon && parsed.owned.length < (JSON.parse(raw).owned?.length || 0) && !localStorage.getItem(`${SAVE_KEY}-before-pack-progression`))
        localStorage.setItem(`${SAVE_KEY}-before-pack-progression`, raw);
      return parsed;
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
