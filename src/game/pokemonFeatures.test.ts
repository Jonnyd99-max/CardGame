import { describe, expect, it, vi } from "vitest";
vi.mock("./gameMode", () => ({ isPokemon: true, gameMode: "pokemon" }));
import { newSave, parseSave } from "../state/save";
import { getCharacter } from "../data/characters";
import { createBattle, playRound, availableStats, rewardMatch, ensurePokemonHealth } from "./battle";
import { statsFor, cardProgress, toggleEquipment, items } from "./progression";
import { pokemonStats, pokemonStatKeys } from "./statPresentation";
import { evolvedArtwork } from "./evolution";
import { openPack, chapters, claimChapter } from "./adventures";
import { unlockPokemonEvolutions } from "./pokemonProgression";
import megaStats from "../data/pokemonMegaStats.json";

function fixture() {
  const save = newSave("Trainer", "fire", "pokemon-4");
  save.owned.push("pokemon-150"); save.cards["pokemon-150"] = cardProgress();
  const battle = createBattle(["pokemon-150", "pokemon-4"], "Quick Battle", "Easy", 3, false, save);
  battle.ai = ["pokemon-10", "pokemon-13"];
  battle.opponentAbility = { round: 0, character: "pokemon-10", stat: "power", modifiers: {} };
  ensurePokemonHealth(battle, save);
  return { save, battle };
}
describe("Pokémon teams and collection", () => {
  it("keeps both cards active after damage when neither has fainted", () => {
    const { save, battle } = fixture();
    battle.health!.ai[0] = 80;
    const next = playRound(battle, "power", save);
    expect(next.last?.winner).toBe("player");
    expect(next.player).toEqual(battle.player);
    expect(next.ai).toEqual(battle.ai);
    expect(next.health!.player).toEqual(battle.health!.player);
    expect(next.health!.ai[0]).toBe(80 - next.last!.damage!);
    expect(battle.health!.ai[0]).toBe(80);
  });
  it("advances only the fainted Pokémon and retains the winner's health", () => {
    const { save, battle } = fixture();
    battle.health!.ai[0] = 1;
    const next = playRound(battle, "power", save);
    expect(next.ai).toEqual(["pokemon-13"]);
    expect(next.player[0]).toBe("pokemon-150");
    expect(next.last?.fainted).toEqual(["pokemon-10"]);
    expect(next.result).toBeUndefined();
    expect(next.health!.player[0]).toBe(battle.health!.player[0]);
    expect(next.health!.ai[0]).toBe(battle.health!.ai[1]);
  });
  it("finishes on the last knockout, records encounters and prevents further rounds", () => {
    const { save, battle } = fixture();
    battle.ai = ["pokemon-10"];
    battle.health!.ai = [1]; battle.health!.aiMax = [1];
    const next = playRound(battle, "power", save);
    expect(next.result).toBe("player");
    expect(next.ai).toEqual([]);
    rewardMatch(save, next);
    expect(save.pokemonSeen).toContain("pokemon-10");
    expect(playRound(next, "speed", save)).toBe(next);
  });
  it("damages both sides on ties and supports simultaneous final knockouts", () => {
    const save = newSave("Trainer", "fire", "pokemon-4");
    const b = createBattle(["pokemon-4"], "Classic", "Easy", 3, false, save);
    b.ai = ["pokemon-4"];
    b.opponentAbility = { round: 0, character: "pokemon-4", stat: "strength", modifiers: {} };
    b.health = { player: [10], ai: [10], playerMax: [10], aiMax: [10] };
    const next = playRound(b, "strength", save);
    expect(next.result).toBe("draw");
    expect(next.last?.damage).toBe(10);
    expect(next.last?.fainted).toHaveLength(2);
  });
  it("resets comparison choices after all six are used without ending a living team's match", () => {
    const { save, battle } = fixture();
    battle.usedStats = { player: pokemonStatKeys.filter(k => k !== "power"), ai: [] };
    battle.health!.ai[0] = 100;
    const next = playRound(battle, "power", save);
    expect(availableStats(next, "player")).toEqual(pokemonStatKeys);
    expect(next.result).toBeUndefined();
  });
  it("uses each official Mega profile rather than flat bonuses", () => {
    const { save } = fixture();
    for (const stone of items.filter(i => i.category === "mega-stone" && i.id !== "arcaninite")) {
      const c = getCharacter(stone.characters[0])!;
      if (!save.owned.includes(c.id)) save.owned.push(c.id);
      save.cards[c.id] = cardProgress(); save.items[stone.id] = 1;
      expect(toggleEquipment(save, c.id, stone.id)).toBe(true);
      const form = stone.megaArtwork!.split("/").at(-1)!.replace(".png", "") as keyof typeof megaStats;
      expect(statsFor(c, save)).toEqual(pokemonStats(megaStats[form]));
      expect(save.pokemonMegaSeen).toContain(stone.id);
      toggleEquipment(save, c.id, stone.id);
      expect(statsFor(c, save)).toEqual(c.baseStats);
    }
  });
  it("collects cosmetic shinies, preserves them in saves and passes the variant to evolutions", () => {
    const save = newSave("Trainer", "grass", "pokemon-1");
    save.coins = 10000;
    const result = openPack(save, "scout", () => 0)!;
    expect(result.shiny).toBe(true);
    const c = getCharacter(result.card)!;
    expect(evolvedArtwork(c, 0, save).image).toContain("/shiny/");
    const shinyStats = statsFor(c, save);
    save.cards[c.id].style = "original";
    expect(statsFor(c, save)).toEqual(shinyStats);
    save.cards["pokemon-1"].level = 5;
    unlockPokemonEvolutions(save);
    expect(save.pokemonShinies).toContain("pokemon-2");
    expect(parseSave(JSON.stringify(save)).pokemonShinies).toEqual(save.pokemonShinies);
  });
  it("has exactly eight Gym Leader challenges with permanent first-clear badge records", () => {
    const save = newSave("Trainer", "grass", "pokemon-1");
    expect(chapters.filter(c => c.boss)).toHaveLength(8);
    save.xp = 100000; save.campaign = [chapters[0].id];
    const b = createBattle(save.decks[0].cards, "Team Battle", "Easy", 3, false, save);
    b.chapter = chapters[1].id; b.result = "player"; b.round = 1; b.scores = [1, 0];
    expect(claimChapter(save, b)).toBe(true);
    expect(save.campaign).toContain(chapters[1].id);
    expect(claimChapter(save, b)).toBe(false);
  });
  it("unlocks shiny variants of evolutions already collected when their parent becomes shiny", () => {
    const save = newSave("Trainer", "grass", "pokemon-1");
    save.cards["pokemon-1"].level = 5;
    unlockPokemonEvolutions(save);
    save.pokemonShinies = ["pokemon-1"];
    unlockPokemonEvolutions(save);
    expect(save.pokemonShinies).toContain("pokemon-2");
    expect(save.owned.filter(id => id === "pokemon-2")).toHaveLength(1);
  });
});
