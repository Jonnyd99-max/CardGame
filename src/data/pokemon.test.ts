import { describe, expect, it, vi } from "vitest";
vi.mock("../game/gameMode", () => ({ isPokemon: true, gameMode: "pokemon" }));
import { characters, getCharacter } from "./characters";
import { franchises } from "./franchises";
import { newSave, parseSave, SAVE_KEY } from "../state/save";
import {
  validateDeck,
  grantXP,
  items,
  upgradeCharacter,
  statsFor,
  toggleEquipment,
  cardProgress,
} from "../game/progression";
import { evolutionRequirement } from "./pokemonEvolution";
import { unlockPokemonEvolutions } from "../game/pokemonProgression";
import { evolvedArtwork, evolutionFor } from "../game/evolution";
import {
  chapters,
  campaignBattle,
  claimChapter,
  openPack,
} from "../game/adventures";
import { createBattle, playRound, combatStats, opponentStats, abilityNotices } from "../game/battle";
import { uniquePowers } from "../game/uniquePowers";

describe("Pokémon mode", () => {
  it("includes exactly the original 151 with local artwork and Generation I types", () => {
    expect(characters).toHaveLength(151);
    expect(new Set(characters.map((c) => c.id)).size).toBe(151);
    expect(franchises).toHaveLength(15);
    for (const c of characters) {
      expect(c.image).toBe(`/artwork/pokemon/${c.avatar}.png`);
      expect(c.tags).not.toContain("fairy");
      expect(c.tags).not.toContain("steel");
      expect(uniquePowers[c.id]).toBeTruthy();
    }
    expect(getCharacter("pokemon-1")?.tags).toEqual([
      "pokemon",
      "grass",
      "poison",
    ]);
    expect(getCharacter("pokemon-81")?.tags).toEqual(["pokemon", "electric"]);
  });
  it("creates playable starters and round-trips a separate save for every type", () => {
    expect(SAVE_KEY).toBe("jd-pokemon-v1");
    for (const type of franchises) {
      const first = characters.find(
        (c) => c.franchise === type.id && c.unlockLevel === 1,
      )!;
      expect(first).toBeTruthy();
      const s = newSave("Trainer", type.id, first.id);
      expect(s.owned).toContain(first.id);
      expect(
        s.owned.every(
          (id) =>
            getCharacter(id)!.rarity === "Common" && !evolutionRequirement(id),
        ),
      ).toBe(true);
      expect(validateDeck(s.decks[0], s)).toBe("");
      expect(parseSave(JSON.stringify(s))).toMatchObject({
        franchise: type.id,
        owned: s.owned,
      });
    }
  });
  it("uses Pokémon for all campaign opponents and rewards", () => {
    const s = newSave("Trainer", "grass", "pokemon-1");
    for (const chapter of chapters) {
      expect(chapter.opponents.every((id) => !!getCharacter(id))).toBe(true);
      expect(items.some((item) => item.id === chapter.item)).toBe(true);
      const b = campaignBattle(s, chapter.id, s.activeDeck)!;
      expect(b).toBeTruthy();
      b.result = "player";
      b.round = 3;
      b.scores = [3, 0];
      expect(claimChapter(s, b)).toBe(true);
      grantXP(s, 10000);
      expect(() => parseSave(JSON.stringify(s))).not.toThrow();
    }
    expect(s.owned.every((id) => id.startsWith("pokemon-"))).toBe(true);
  });
  it("collects all 151 through level-gated packs and evolutions, keeping battles inside Kanto", () => {
    const s = newSave("Trainer", "grass", "pokemon-1");
    const pack = openPack(s, "scout", () => 0)!;
    expect(pack.card.startsWith("pokemon-")).toBe(true);
    let battle = createBattle(
      s.decks[0].cards,
      "Quick Battle",
      "Easy",
      3,
      true,
      s,
    );
    expect(battle.ai.every((id) => id.startsWith("pokemon-"))).toBe(true);
    battle = playRound(battle, "strength", s);
    expect(battle.last).toBeTruthy();
    grantXP(s, 100000);
    s.coins = 1000000;
    for (const rarity of ["Common", "Legendary", "Mythic"] as const) {
      const pool = characters.filter(c => !evolutionRequirement(c.id) && c.rarity === rarity);
      pool.forEach((c, index) => {
        const draws = [rarity === "Common" ? 0 : rarity === "Legendary" ? .96 : .995, (index + .1) / pool.length, .5];
        expect(openPack(s, "scout", () => draws.shift()!)!.card).toBe(c.id);
      });
    }
    expect(s.owned.every((id) => !evolutionRequirement(id))).toBe(true);
    for (const id of s.owned) s.cards[id].level = 5;
    unlockPokemonEvolutions(s);
    for (const id of s.owned) s.cards[id].level = 15;
    unlockPokemonEvolutions(s);
    expect(s.owned).toHaveLength(151);
  });
  it("accepts a shared secondary type in single-type decks", () => {
    const s = newSave("Trainer", "grass", "pokemon-1");
    grantXP(s, 100000);
    for (const id of ["pokemon-13", "pokemon-23", "pokemon-92", "pokemon-4", "pokemon-7", "pokemon-25"]) {
      if (!s.owned.includes(id)) s.owned.push(id);
      s.cards[id] ||= cardProgress();
    }
    expect(
      validateDeck(
        {
          id: "poison",
          name: "Poison",
          rule: "Single Franchise",
          cards: ["pokemon-1", "pokemon-13", "pokemon-23", "pokemon-92"],
        },
        s,
      ),
    ).toBe("");
    expect(
      validateDeck(
        {
          id: "mixed",
          name: "Mixed",
          rule: "Single Franchise",
          cards: ["pokemon-1", "pokemon-4", "pokemon-7", "pokemon-25"],
        },
        s,
      ),
    ).toContain("sharing one type");
  });
  it("upgrades Charmander into Charmeleon at 5, then Charmeleon into Charizard at 15", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    s.coins = 100000;
    s.materials = 100;
    s.cards["pokemon-4"].xp = 10000;
    expect(s.owned).not.toContain("pokemon-5");
    while (s.cards["pokemon-4"].level < 4) upgradeCharacter(s, "pokemon-4");
    expect(s.owned).not.toContain("pokemon-5");
    expect(upgradeCharacter(s, "pokemon-4")).toEqual(["pokemon-5"]);
    expect(s.cards["pokemon-5"].level).toBe(5);
    expect(s.owned).not.toContain("pokemon-6");
    s.cards["pokemon-5"].xp = 10000;
    while (s.cards["pokemon-5"].level < 14) upgradeCharacter(s, "pokemon-5");
    expect(s.owned).not.toContain("pokemon-6");
    expect(upgradeCharacter(s, "pokemon-5")).toEqual(["pokemon-6"]);
    expect(s.cards["pokemon-6"].level).toBe(15);
    expect(s.owned).toContain("pokemon-4");
    expect(upgradeCharacter(s, "pokemon-5")).toEqual([]);
    expect(s.owned.filter((id) => id === "pokemon-6")).toHaveLength(1);
    expect(() => parseSave(JSON.stringify(s))).not.toThrow();
  });
  it("does not upgrade or unlock evolutions without the required resources", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    s.cards["pokemon-4"].level = 4;
    const before = structuredClone(s);
    expect(upgradeCharacter(s, "pokemon-4")).toBeNull();
    expect(s).toEqual(before);
    s.coins = 10000;
    s.materials = 100;
    grantXP(s, 100000);
    expect(s.owned).not.toContain("pokemon-5");
    expect(s.owned).not.toContain("pokemon-6");
    for (let i = 0; i < 20; i++) {
      const pack = openPack(s, "hero", () => i / 21)!;
      expect(evolutionRequirement(pack.card)).toBeUndefined();
      expect(getCharacter(pack.card)!.rarity).toBe("Common");
    }
  });
  it("supports all Kanto evolution families and Eevee’s three branches", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    grantXP(s, 100000);
    s.owned.push("pokemon-133"); s.cards["pokemon-133"] = cardProgress();
    s.cards["pokemon-133"].level = 5;
    expect(unlockPokemonEvolutions(s)).toEqual(
      expect.arrayContaining(["pokemon-134", "pokemon-135", "pokemon-136"]),
    );
    expect(evolutionRequirement("pokemon-9")).toEqual({
      parent: "pokemon-8",
      level: 15,
    });
    expect(evolutionRequirement("pokemon-130")).toEqual({
      parent: "pokemon-129",
      level: 5,
    });
    expect(evolutionRequirement("pokemon-25")).toBeUndefined();
  });
  it("applies trainer abilities while assigned, and restricts Mega Stones to their species", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    s.items["trainer-brock"] = 1;
    s.items["charizardite-x"] = 1;
    s.items["charizardite-y"] = 1;
    const c = getCharacter("pokemon-4")!;
    const before = statsFor(c, s);
    expect(toggleEquipment(s, c.id, "trainer-brock")).toBe(true);
    expect(statsFor(c, s).durability).toBe(before.durability + 6);
    expect(toggleEquipment(s, c.id, "charizardite-x")).toBe(false);
    expect(toggleEquipment(s, c.id, "trainer-brock")).toBe(true);
    expect(statsFor(c, s)).toEqual(before);
    s.owned.push("pokemon-6");
    s.cards["pokemon-6"] = { ...cardProgress(), level: 15 };
    const charizard = getCharacter("pokemon-6")!;
    expect(toggleEquipment(s, charizard.id, "charizardite-x")).toBe(true);
    expect(evolvedArtwork(charizard, 2, s).image).toContain("charizard-mega-x");
    expect(evolutionFor(charizard, s).name).toBe("Mega Evolution");
    expect(toggleEquipment(s, charizard.id, "trainer-brock")).toBe(true);
    expect(s.cards[charizard.id].equipment).toHaveLength(2);
    expect(toggleEquipment(s, charizard.id, "charizardite-y")).toBe(true);
    expect(s.cards[charizard.id].equipment).not.toContain("charizardite-x");
    expect(toggleEquipment(s, charizard.id, "charizardite-y")).toBe(true);
    expect(evolvedArtwork(charizard, 2, s).image).toBe(charizard.image);
    expect(() => parseSave(JSON.stringify(s))).not.toThrow();
  });
  it("migrates old starters and gear while retaining saved training", () => {
    const s = newSave("Trainer", "grass", "pokemon-1");
    delete s.pokemonProgressionVersion;
    s.owned.push("pokemon-3");
    s.cards["pokemon-3"] = cardProgress();
    s.cards["pokemon-3"].xp = 45;
    s.items = { shield: 2, blaster: 1 };
    s.cards["pokemon-1"].equipment = ["shield", "blaster"];
    const migrated = parseSave(JSON.stringify(s));
    expect(migrated.owned).not.toContain("pokemon-3");
    expect(migrated.cards["pokemon-3"].xp).toBe(45);
    expect(migrated.items).toEqual({ leftovers: 2, "quick-claw": 1 });
    expect(migrated.cards["pokemon-1"].equipment).toEqual(["leftovers"]);
    expect(migrated.pokemonProgressionVersion).toBe(1);
    expect(parseSave(JSON.stringify(migrated))).toEqual(migrated);
  });
  it("equips Arcaninite on Arcanine and preserves the custom stone through saves", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    grantXP(s, 100000);
    if (!s.owned.includes("pokemon-58")) s.owned.push("pokemon-58"); s.cards["pokemon-58"] = { ...cardProgress(), level: 5 };
    unlockPokemonEvolutions(s);
    const arcanine = getCharacter("pokemon-59")!;
    const before = statsFor(arcanine, s);
    s.items.arcaninite = 1;
    expect(toggleEquipment(s, "pokemon-58", "arcaninite")).toBe(false);
    expect(toggleEquipment(s, arcanine.id, "arcaninite")).toBe(true);
    expect(statsFor(arcanine, s).strength).toBe(
      Math.min(100, before.strength + 8),
    );
    expect(statsFor(arcanine, s).speed).toBe(Math.min(100, before.speed + 8));
    expect(evolutionFor(arcanine, s).name).toBe("Mega Evolution");
    expect(evolvedArtwork(arcanine, 0, s).image).toBe(
      "/artwork/pokemon/mega/arcanine-mega.jpg",
    );
    expect(parseSave(JSON.stringify(s)).cards[arcanine.id].equipment).toContain(
      "arcaninite",
    );
    expect(toggleEquipment(s, arcanine.id, "arcaninite")).toBe(true);
    expect(statsFor(arcanine, s)).toEqual(before);
    expect(evolvedArtwork(arcanine, 0, s).image).toBe(arcanine.image);
  });
  it("equips each new Mega Stone only on its matching Pokémon with distinct artwork", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    grantXP(s, 100000);
    const forms = [
      ["raichunite-x", 26, "raichu-mega-x"],
      ["raichunite-y", 26, "raichu-mega-y"],
      ["clefablite", 36, "clefable-mega"],
      ["victreebelite", 71, "victreebel-mega"],
      ["starminite", 121, "starmie-mega"],
      ["dragoninite", 149, "dragonite-mega"],
    ] as const;
    for (const [stone, number, artwork] of forms) {
      const c = getCharacter(`pokemon-${number}`)!;
      s.owned.push(c.id);
      s.cards[c.id] = cardProgress();
      s.items[stone] = 1;
      expect(toggleEquipment(s, "pokemon-4", stone)).toBe(false);
      expect(toggleEquipment(s, c.id, stone)).toBe(true);
      expect(evolvedArtwork(c, 0, s).image).toBe(`/artwork/pokemon/mega/${artwork}.png`);
      expect(toggleEquipment(s, c.id, stone)).toBe(true);
      expect(evolvedArtwork(c, 0, s).image).toBe(c.image);
    }
  });
  it("uses the same type-adjusted stats for the battle preview and resolved round", () => {
    const s = newSave("Trainer", "fire", "pokemon-4");
    const b = createBattle(["pokemon-4", "pokemon-1"], "Quick Battle", "Easy", 3, false, s);
    b.ai = ["pokemon-7", "pokemon-25"];
    b.opponentAbility = { round: 0, character: "pokemon-7", stat: "strength", modifiers: {} };
    const player = getCharacter("pokemon-4")!, enemy = getCharacter("pokemon-7")!;
    const preview = combatStats(b, player.id, statsFor(player, s));
    const enemyPreview = opponentStats(b, enemy.baseStats);
    expect(preview.strength).toBe(statsFor(player, s).strength - 5);
    expect(enemyPreview.strength).toBe(enemy.baseStats.strength + 5);
    expect(abilityNotices(b).filter((n) => n.title.includes("type "))).toHaveLength(2);
    const played = playRound(b, "strength", s);
    expect(played.last?.a).toBe(preview.strength);
    expect(played.last?.b).toBe(enemyPreview.strength);
    expect(combatStats(played, player.id, statsFor(player, s))).toEqual(preview);
  });
});
