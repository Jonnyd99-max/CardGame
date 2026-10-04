import { isPokemon } from "../game/gameMode";
import { GymBadge, gymBadgeNames } from "../components/GymBadge";
import { useState } from "react";
import {
  chapters,
  villainRewards,
  chapterAvailable,
  campaignBattle,
  rangerBonus,
  packTypes,
  pokemonPackOdds,
  openPack,
  type PackResult,
} from "../game/adventures";
import { playerLevel, validateDeck, items } from "../game/progression";
import { characters } from "../data/characters";
import { battleCharacters } from "../data/enemies";
import { audio } from "../utils/audio";
import { Artwork, Card } from "../components/Card";
import { ItemArtwork } from "../components/ItemArtwork";
import { BattlePage } from "./Battle";
import type { Battle } from "../game/battle";
import type { Save } from "../types";

export function Campaign({
  save,
  complete,
  bosses = false,
}: {
  save: Save;
  complete: (b: Battle) => void;
  bosses?: boolean;
}) {
  const [deck, setDeck] = useState(save.activeDeck);
  const [battle, setBattle] = useState<Battle | null>(null);
  const selected = save.decks.find((d) => d.id === deck) || save.decks[0];
  const bonus = rangerBonus(selected.cards, save);
  if (battle)
    return (
      <BattlePage
        save={save}
        initialBattle={battle}
        onComplete={complete}
        onExit={() => setBattle(null)}
      />
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {isPokemon ? "KANTO ADVENTURES" : "MIGHTY MORPHIN ADVENTURES"}
          </span>
          <h1>
            {bosses
              ? isPokemon ? "Challenge the Gym Leaders." : "Boss battles."
              : isPokemon
                ? "Explore Kanto."
                : "Save Angel Grove."}
          </h1>
          <p>
            {bosses
              ? isPokemon ? "Defeat each Kanto Gym Leader’s team to earn their badge. Compare stats; your Pokémon stay in play until they faint." : "Face escalating boss phases. Unlock bosses by advancing through the campaign."
              : isPokemon
                ? "Battle through Kanto’s eight gyms, then face Mewtwo in Cerulean Cave."
                : "Ten chapters across Angel Grove, Marvel, Gotham and the portal dimension."}
          </p>
        </div>
      </div>
      {isPokemon && bosses && <div className="panel badge-case"><strong>Gym badges · {chapters.filter(c => c.boss && save.campaign?.includes(c.id)).length}/8</strong><div>{chapters.filter(c => c.boss).map((c, index) => <GymBadge key={c.id} index={index} earned={save.campaign?.includes(c.id)} />)}</div></div>}
      <div className="panel adventure-deck">
        <label>
          Your team{" "}
          <select value={selected.id} onChange={(e) => setDeck(e.target.value)}>
            {save.decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {!isPokemon && (
          <p>
            <strong>
              {bonus.count} Rangers · +{bonus.total} combat · +{bonus.team}{" "}
              power
            </strong>
            <br />3 Rangers: +2 combat / power. 5 or more: +4. Personal weapons
            add +1 team combat each, capped at +3. Bonuses apply to Rangers
            only, capped at 100.
          </p>
        )}
      </div>
      <div className="adventure-grid">
        {chapters
          .filter((c) => !bosses || c.boss)
          .map((c) => {
            const cleared = save.campaign?.includes(c.id);
            const available = chapterAvailable(save, c.id);
            const reward = items.find((i) => i.id === c.item)!;
            return (
              <section
                className={`panel chapter-card ${available ? "" : "chapter-locked"}`}
                key={c.id}
              >
                <div className="chapter-art">
                  {isPokemon && c.boss ? <img className="gym-leader-portrait" src={`/artwork/trainers/${c.item.replace("trainer-", "")}.png`} alt={c.name.split(" · ")[1]} /> :
                  <Artwork
                    character={
                      battleCharacters.find((ch) => ch.id === c.opponents[0])!
                    }
                  />}
                  <span className="pill">
                    {c.boss
                      ? isPokemon ? cleared ? "BADGE EARNED" : "GYM LEADER" : "BOSS · 3 PHASES"
                      : `CHAPTER ${chapters.indexOf(c) + 1}`}
                  </span>
                </div>
                <h2>{c.name}</h2>
                {isPokemon && c.boss && <p className="gym-badge"><GymBadge index={chapters.indexOf(c) - 1} earned={cleared} />{gymBadgeNames[chapters.indexOf(c) - 1]} Badge · {cleared ? "Earned ✓" : "Defeat this leader"}</p>}
                <p aria-label={`${save.campaignStars?.[c.id] || 0} of 3 stars`}>
                  {"★".repeat(save.campaignStars?.[c.id] || 0)}
                  {"☆".repeat(3 - (save.campaignStars?.[c.id] || 0))}
                </p>
                <p>{c.story}</p>
                {villainRewards[c.id] && (
                  <p className="tip">
                    {isPokemon ? "Pokémon reward:" : "Villain card:"}{" "}
                    {
                      characters.find((ch) => ch.id === villainRewards[c.id])
                        ?.name
                    }{" "}
                    ·{" "}
                    {save.owned.includes(villainRewards[c.id])
                      ? "Collected"
                      : "Win this chapter to collect (replays count)."}
                  </p>
                )}
                <p>
                  Level {c.level} ·{" "}
                  {isPokemon ? `${c.opponents.length} Pokémon · team knockout` : c.boss
                    ? `${c.rounds}-round showdown`
                    : `Best of ${c.rounds}`}
                </p>
                <div className="chapter-prize">
                  <ItemArtwork item={reward} />
                  <div>
                    <strong>
                      {cleared
                        ? "First-clear rewards claimed"
                        : "First-clear rewards"}
                    </strong>
                    <p>
                      {c.coins} coins · {c.xp} XP · {c.boss ? 4 : 2} materials
                      <br />
                      {reward.name}
                      {c.card
                        ? isPokemon
                          ? " + Eevee"
                          : " + Green Ranger"
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  className="primary"
                  disabled={!available || !!validateDeck(selected, save)}
                  onClick={() =>
                    setBattle(campaignBattle(save, c.id, selected.id))
                  }
                >
                  {cleared
                    ? "Replay battle"
                    : available
                      ? "Start chapter"
                      : playerLevel(save.xp) < c.level
                        ? `Reach level ${c.level}`
                        : "Clear previous chapter"}
                </button>
                {cleared && (
                  <p>
                    Replay earns normal match prizes. First-clear rewards cannot
                    be claimed twice.
                  </p>
                )}
              </section>
            );
          })}
      </div>
      <p className="tip">
        Earn 1 star for a victory, 2 for winning at least 75% of played rounds,
        and 3 for a clean sweep. Every new best star earns 50 coins and 1
        material once. Opponent stats remain hidden until each fight resolves.
        Leaving a battle grants no prizes. You can
        retry a lost chapter.
      </p>
    </>
  );
}

export function Packs({
  save,
  update,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
}) {
  const [result, setResult] = useState<PackResult | null>(null);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">EARNED COINS ONLY</span>
          <h1>Open a new possibility.</h1>
          <p>
            One character and materials in every pack. No real-money purchases.
          </p>
        </div>
      </div>
      <div className="adventure-grid">
        {packTypes.map((p) => (
          <section className="panel pack-card" key={p.id}>
            <span className="pack-mark">✦</span>
            <h2>{p.name}</h2>
            <p>
              {p.cost} coins · Available at level {p.level}
            </p>
            <p>
              {isPokemon ? (
                `Common ${pokemonPackOdds(save)[0]}% · Legendary ${pokemonPackOdds(save)[1]}% · Mythic ${pokemonPackOdds(save)[2]}% · No evolved cards`
              ) : (
                <>
                  Common {p.odds[0]}% · Uncommon {p.odds[1]}% · Rare {p.odds[2]}
                  %
                </>
              )}
            </p>
            <p>
              Includes {p.materials} materials.{" "}
              {isPokemon
                ? "Collect basic Pokémon across Kanto. Upgrade them to level 5 for first evolutions, then train the middle Pokémon to level 15 for final evolutions."
                : "All four universes are included, using the same card-level limits for each. Cards can unlock up to two levels above your current level. If a rarity has no eligible cards, it becomes Common."}
            </p>
            <button
              className="primary"
              disabled={save.coins < p.cost || playerLevel(save.xp) < p.level}
              onClick={() => {
                // Roll once outside the React state updater, which may be replayed in development.
                const rolls = [Math.random(), Math.random()];
                const preview = structuredClone(save);
                let i = 0;
                const revealed = openPack(preview, p.id, () => rolls[i++]);
                if (!revealed) return;
                update((s) => {
                  let n = 0;
                  openPack(s, p.id, () => rolls[n++]);
                });
                setResult(revealed);
                audio.enabled = save.settings.sound;
                audio.play("pack");
              }}
            >
              Open {p.name}
            </button>
          </section>
        ))}
      </div>
      <p className="tip">
        {isPokemon && "Each pack has a 5% chance of a shiny card. Shinies use alternate artwork with identical stats. "}Duplicates give 25% of the pack price back in coins, 2 extra materials
        and 20 character XP. {isPokemon ? "Player levels unlock pack eligibility, not ownership. Legendary Pokémon become eligible at level 20; Mew at level 30. Evolved cards come from training their parent Pokémon." : "Packs never award Epic, Legendary or Mythic cards."}
      </p>
      {result && (
        <section className="panel pack-reveal" role="status">
          <h2>
            {result.shiny ? "A shiny Pokémon!" : result.duplicate ? "A familiar legend!" : "A new legend joins!"}
          </h2>
          <Card
            character={characters.find((c) => c.id === result.card)!}
            save={save}
          />
          <p>
            +{result.materials} materials
            {result.duplicate
              ? ` · +${result.coins} coins back · +20 character XP`
              : " · Added to your collection"}
          </p>
          <button className="secondary" onClick={() => setResult(null)}>
            Close reveal
          </button>
        </section>
      )}
      <p>{save.packsOpened || 0} packs opened</p>
    </>
  );
}
