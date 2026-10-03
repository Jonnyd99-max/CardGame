import { useState } from "react";
import {
  chapters,
  chapterAvailable,
  campaignBattle,
  rangerBonus,
  packTypes,
  openPack,
  type PackResult,
} from "../game/adventures";
import { playerLevel, validateDeck, items } from "../game/progression";
import { characters } from "../data/characters";
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
          <span className="eyebrow">MIGHTY MORPHIN ADVENTURES</span>
          <h1>{bosses ? "Boss battles." : "Save Angel Grove."}</h1>
          <p>
            {bosses
              ? "Face escalating boss phases. Unlock bosses by advancing through the campaign."
              : "Five chapters. One Ranger team. A final showdown with Lord Zedd."}
          </p>
        </div>
      </div>
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
        <p>
          <strong>
            {bonus.count} Rangers · +{bonus.total} combat · +{bonus.team} power
          </strong>
          <br />3 Rangers: +2 combat / power. 5 or more: +4. Personal weapons
          add +1 team combat each, capped at +3. Bonuses apply to Rangers only,
          capped at 100.
        </p>
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
                  <Artwork
                    character={
                      characters.find((ch) => ch.id === c.opponents[0])!
                    }
                  />
                  <span className="pill">
                    {c.boss
                      ? "BOSS · 3 PHASES"
                      : `CHAPTER ${chapters.indexOf(c) + 1}`}
                  </span>
                </div>
                <h2>{c.name}</h2>
                <p>{c.story}</p>
                <p>
                  Level {c.level} ·{" "}
                  {c.boss
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
                      {"card" in c ? " + Green Ranger" : ""}
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
        Opponent stats remain hidden until each fight resolves. Leaving a battle
        grants no prizes. You can retry a lost chapter.
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
              Common {p.odds[0]}% · Uncommon {p.odds[1]}% · Rare {p.odds[2]}%
            </p>
            <p>
              Includes {p.materials} materials. Cards are limited to unlock
              levels up to two above your current level. If a rarity has no
              eligible cards, it becomes Common.
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
              }}
            >
              Open {p.name}
            </button>
          </section>
        ))}
      </div>
      <p className="tip">
        Duplicates give 25% of the pack price back in coins, 2 extra materials
        and 20 character XP. Packs never award Epic, Legendary or Mythic cards.
      </p>
      {result && (
        <section className="panel pack-reveal" role="status">
          <h2>
            {result.duplicate ? "A familiar legend!" : "A new legend joins!"}
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
