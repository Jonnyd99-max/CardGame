import { Gift, Zap, Check, Trophy } from "lucide-react";
import { useState } from "react";
import { heldItemTypes } from "../data/pokemonItems";
import { characters, getCharacters } from "../data/characters";
import { progression } from "../data/unlocks";
import { items, playerLevel, periodKeys, grantXP } from "../game/progression";
import { challenges } from "../data/challenges";
import { Progress } from "../components/UI";
import { Card } from "../components/Card";
import { ItemArtwork } from "../components/ItemArtwork";
import type { Save } from "../types";
import { isPokemon } from "../game/gameMode";
import { battleStatKeys, statLabel } from "../game/statPresentation";
export function Upgrades({
  save,
  detail,
}: {
  save: Save;
  detail: (id: string) => void;
}) {
  const characters = getCharacters(save);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STRONGER WITH EVERY BATTLE</span>
          <h1>
            Unlock their <em>potential.</em>
          </h1>
          <p>
            Spend character XP, coins and materials. Preview every improvement
            before upgrading.
          </p>
        </div>
      </div>
      <div className="collection-grid">
        {characters
          .filter((c) => save.owned.includes(c.id))
          .map((c) => (
            <div key={c.id}>
              <Card character={c} save={save} onClick={() => detail(c.id)} />
              <button className="secondary full" onClick={() => detail(c.id)}>
                <Zap size={16} /> Upgrade · {save.cards[c.id].xp} XP
              </button>
            </div>
          ))}
      </div>
    </>
  );
}
export function Equipment({
  save: s,
  update,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
}) {
  const [category, setCategory] = useState("");
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">GEAR FOR THE EXTRAORDINARY</span>
          <h1>
            Your <em>{isPokemon ? "Pokémon gear." : "arsenal."}</em>
          </h1>
          <p>
            Earn your edge. Buy with battle coins, then equip from a character’s
            detail page.
          </p>
        </div>
      </div>
      {isPokemon && (
        <div
          className="button-row equipment-categories"
          role="group"
          aria-label="Equipment category"
        >
          {[
            ["", "All"],
            ["held-item", "Held items"],
            ["mega-stone", "Mega Stones"],
            ["trainer", "Trainers"],
          ].map(([value, label]) => (
            <button
              className={`secondary ${category === value ? "selected" : ""}`}
              aria-pressed={category === value}
              key={value}
              onClick={() => setCategory(value)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <div className="equipment-grid">
        {items
          .filter((i) => !category || i.category === category)
          .map((i) => {
            const owned = s.items[i.id] || 0,
              canBuy = s.coins >= i.cost && playerLevel(s.xp) >= i.unlockLevel;
            return (
              <div className="panel equipment-card" key={i.id}>
                <div className="equipment-art">
                  <ItemArtwork item={i} />
                </div>
                <span className="eyebrow">
                  {i.rarity} ·{" "}
                  {i.category ? i.category.replace("-", " ") : i.slot}
                </span>
                <h2>{i.name}</h2>
                <p>{i.description}</p>
                <div className="modifiers">
                  {Object.entries(i.modifiers).filter(([k, v]) => v && (!isPokemon || battleStatKeys.includes(k as typeof battleStatKeys[number]))).map(([k, v]) => (
                    <span key={k}>
                      {v > 0 ? "+" : ""}{v * (i.category === "mega-stone" ? 1 : Math.max(1, owned))} {statLabel(k)}
                    </span>
                  ))}
                  {i.grantedAbility && (
                    <>
                      <b>{i.grantedAbility.name}</b>
                      {Object.entries(i.grantedAbility.modifiers).map(
                        ([k, v]) => (
                          <span key={k}>
                            +{v! * Math.max(1, owned)} {statLabel(k)}
                          </span>
                        ),
                      )}
                    </>
                  )}
                </div>
                <small>
                  Unlock level {i.unlockLevel} ·{" "}
                  {heldItemTypes[i.id]
                    ? `For ${heldItemTypes[i.id]} Pokémon (either type)`
                    : i.characters.length
                      ? `For ${i.characters.map((id) => characters.find((c) => c.id === id)?.name).join(", ")}`
                      : i.franchises.length
                        ? "Mighty Morphin Rangers"
                        : "Universal compatibility"}
                </small>
                <button
                  className="primary full"
                  disabled={
                    owned
                      ? owned >= 3 || s.coins < i.cost || s.materials < 2
                      : !canBuy
                  }
                  onClick={() =>
                    update((x) => {
                      x.coins -= i.cost;
                      if (owned) x.materials -= 2;
                      x.items[i.id] = owned + 1;
                    })
                  }
                >
                  {owned
                    ? owned >= 3
                      ? "Fully enhanced"
                      : `Enhance to ${owned + 1} · ${i.cost} coins + 2 materials`
                    : `Acquire · ${i.cost} coins`}
                </button>
                {owned > 0 && <small>Owned · enhancement {owned}/3</small>}
              </div>
            );
          })}
      </div>
    </>
  );
}
export function Rewards({
  save: s,
  update,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
}) {
  const today = periodKeys().day,
    claimed = s.daily === today;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ADVENTURE GIVES BACK</span>
          <h1>
            A little <em>extraordinary.</em>
          </h1>
          <p>Rewards earned through play. No purchases. No shortcuts.</p>
        </div>
      </div>
      <div className="reward-hero panel">
        <Gift size={64} />
        <span className="eyebrow">DAILY DIMENSIONAL DROP</span>
        <h2>Something good, every day.</h2>
        <p>100 coins · 2 upgrade materials · 25 player XP</p>
        <button
          className="primary"
          disabled={claimed}
          onClick={() =>
            update((x) => {
              if (x.daily === periodKeys().day) return;
              x.daily = periodKeys().day;
              x.coins += 100;
              x.materials += 2;
              grantXP(x, 25);
            })
          }
        >
          {claimed ? (
            <>
              <Check size={18} /> Claimed today
            </>
          ) : (
            "Claim your daily reward"
          )}
        </button>
        <small>Daily rewards use this device’s local calendar.</small>
      </div>
      <div className="equipment-grid">
        {progression.rewardMilestones.map((level) => (
          <div className="panel" key={level}>
            <Trophy className="accent" />
            <h2>Level {level} milestone</h2>
            <p>
              {level * 50} coins + {level / 5 + 1} materials
            </p>
            <button
              className="secondary"
              disabled={
                playerLevel(s.xp) < level ||
                s.claimed.includes(`level-${level}`)
              }
              onClick={() =>
                update((x) => {
                  if (
                    playerLevel(x.xp) < level ||
                    x.claimed.includes(`level-${level}`)
                  )
                    return;
                  x.claimed.push(`level-${level}`);
                  x.coins += level * 50;
                  x.materials += level / 5 + 1;
                })
              }
            >
              {s.claimed.includes(`level-${level}`)
                ? "Claimed"
                : playerLevel(s.xp) < level
                  ? "Keep exploring"
                  : "Claim reward"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
export function Challenges({
  save: s,
  update,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE EVERY BATTLE COUNT</span>
          <h1>
            Chase your <em>next milestone.</em>
          </h1>
          <p>Daily missions, weekly goals and permanent achievements.</p>
        </div>
      </div>
      <div className="challenge-grid">
        {challenges.map((c) => {
          const key =
              c.id +
              (c.period === "Daily"
                ? s.periods.daily
                : c.period === "Weekly"
                  ? s.periods.weekly
                  : ""),
            value = c.value(s),
            claimed = s.claimed.includes(key);
          return (
            <div className="panel" key={c.id}>
              <span className="eyebrow">{c.period}</span>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              <Progress value={value} max={c.target} />
              <div className="item-row">
                <small>
                  {Math.min(value, c.target)} / {c.target} · {c.coins} coins
                </small>
                <button
                  className="secondary"
                  disabled={value < c.target || claimed}
                  onClick={() =>
                    update((x) => {
                      const currentKey =
                        c.id +
                        (c.period === "Daily"
                          ? x.periods.daily
                          : c.period === "Weekly"
                            ? x.periods.weekly
                            : "");
                      if (
                        c.value(x) < c.target ||
                        x.claimed.includes(currentKey)
                      )
                        return;
                      x.claimed.push(currentKey);
                      x.coins += c.coins;
                      grantXP(x, 30);
                    })
                  }
                >
                  {claimed ? "Claimed" : "Claim"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
