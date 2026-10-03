import { Star, ArrowRight, Lock } from "lucide-react";
import { characters } from "../data/characters";
import { progression } from "../data/unlocks";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { abilities } from "../data/abilities";
import { Card } from "../components/Card";
import { Progress } from "../components/UI";
import { ItemArtwork } from "../components/ItemArtwork";
import {
  statsFor,
  cardProgress,
  items,
  compatible,
  playerLevel,
  unlockLevelFor,
  toggleEquipment,
} from "../game/progression";
import { statKeys, type Save } from "../types";
export function CharacterDetail({
  id,
  save: s,
  update,
  notify,
}: {
  id: string;
  save: Save;
  update: (fn: (s: Save) => void) => void;
  notify: (text: string) => void;
}) {
  const c = characters.find((c) => c.id === id)!,
    owned = s.owned.includes(id),
    p = s.cards[id] || cardProgress(),
    stats = statsFor(c, s),
    cost = p.level * progression.characterLevelCoinMultiplier,
    next = statsFor(c, {
      ...s,
      cards: { ...s.cards, [id]: { ...p, level: p.level + 1 } },
    });
  function level() {
    if (
      !owned ||
      p.level >= c.maxLevel ||
      s.coins < cost ||
      s.materials < 1 ||
      p.xp < progression.xpPerCharacterLevel
    )
      return;
    update((x) => {
      x.coins -= cost;
      x.materials--;
      x.cards[id].xp -= progression.xpPerCharacterLevel;
      x.cards[id].level++;
      x.upgrades++;
    });
    notify(`${c.name} reached level ${p.level + 1}`);
  }
  return (
    <div className="detail-layout">
      <div className="detail-preview">
        <Card character={c} save={s} locked={!owned} />
        <div className="tip">
          Comic edition · Collect your favourite heroes.
        </div>
      </div>
      <div>
        <span className="eyebrow">
          {franchises.find((f) => f.id === c.franchise)?.name} /{" "}
          {groups.find((g) => g.id === c.group)?.name}
        </span>
        <h1>{c.name}</h1>
        <p className="muted">{c.description}</p>
        {!owned ? (
          <div className="panel">
            <Lock /> Unlocks at player level {unlockLevelFor(c, s)}. Current
            level: {playerLevel(s.xp)}.
            {s.cards[id] && (
              <p>
                Your earlier training and upgrades are saved for when this card
                unlocks again.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="detail-level">
              <b>
                LEVEL {p.level} / {c.maxLevel}
              </b>
              <span>{p.xp} character XP</span>
            </div>
            <Progress value={p.xp} max={progression.xpPerCharacterLevel} />
            <button
              className="text-button"
              onClick={() =>
                update((x) => {
                  x.favourite = id;
                  x.franchise = c.franchise;
                  x.group = c.group;
                })
              }
            >
              <Star
                size={17}
                fill={s.favourite === id ? "currentColor" : "none"}
              />{" "}
              {s.favourite === id
                ? "Your favourite legend"
                : "Set as favourite & apply theme"}
            </button>
          </>
        )}
        <div className="panel">
          <h2>Battle attributes</h2>
          <div className="detail-stats">
            {statKeys.map((k) => (
              <div key={k}>
                <span>{k === "special" ? "Special ability" : k}</span>
                <Progress value={stats[k]} />
                <b>{stats[k]}</b>
                {owned && p.level < c.maxLevel && <small>→ {next[k]}</small>}
              </div>
            ))}
          </div>
        </div>
        {owned && (
          <>
            <div className="panel">
              <h2>Push beyond your limits</h2>
              <p>
                Preview the next level above. Costs {cost} coins, 1 material and{" "}
                {progression.xpPerCharacterLevel} character XP.
              </p>
              <button
                className="primary"
                disabled={
                  p.level >= c.maxLevel ||
                  s.coins < cost ||
                  s.materials < 1 ||
                  p.xp < progression.xpPerCharacterLevel
                }
                onClick={level}
              >
                {p.level >= c.maxLevel ? "Maximum level" : "Level up"}{" "}
                <ArrowRight size={16} />
              </button>
              <div className="boost-grid">
                {statKeys.map((k) => (
                  <button
                    className="secondary"
                    key={k}
                    disabled={
                      s.coins < 100 ||
                      s.materials < 1 ||
                      stats[k] >= c.maxStats[k] ||
                      (p.boosts[k] || 0) >= 5
                    }
                    onClick={() =>
                      update((x) => {
                        x.coins -= 100;
                        x.materials--;
                        x.cards[id].boosts[k] =
                          (x.cards[id].boosts[k] || 0) + 1;
                      })
                    }
                  >
                    +1 {k} <small>100 coins · 1 material · max +5</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="panel">
              <h2>Weapons & equipment</h2>
              <p>
                One weapon and one equipment slot. Equip, replace or remove
                anytime.
              </p>
              <div className="item-list">
                {items
                  .filter((i) => compatible(c, i))
                  .map((i) => {
                    const equipped = p.equipment.includes(i.id);
                    return (
                      <div key={i.id}>
                        <div className="item-list-art">
                          <ItemArtwork item={i} />
                        </div>
                        <section>
                          <b>{i.name}</b>
                          <small>
                            {Object.entries(i.modifiers)
                              .map(
                                ([k, v]) => `+${v * (s.items[i.id] || 1)} ${k}`,
                              )
                              .join(" · ")}
                          </small>
                        </section>
                        <button
                          className="secondary"
                          disabled={!s.items[i.id]}
                          onClick={() =>
                            update((x) => {
                              toggleEquipment(x, id, i.id);
                            })
                          }
                        >
                          {equipped
                            ? "Remove"
                            : s.items[i.id]
                              ? "Equip"
                              : "Not owned"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="panel">
              <h2>Abilities</h2>
              {abilities
                .filter((a) => c.abilities.includes(a.id))
                .map((a) => (
                  <div className="item-row" key={a.id}>
                    <section>
                      <b>{a.name}</b>
                      <p>
                        {a.description}{" "}
                        {Object.entries(a.modifiers)
                          .map(([k, v]) => `+${v} ${k}`)
                          .join(" · ")}
                      </p>
                    </section>
                    <button
                      className="secondary"
                      disabled={p.abilities.includes(a.id) || s.coins < a.cost}
                      onClick={() =>
                        update((x) => {
                          x.coins -= a.cost;
                          x.cards[id].abilities.push(a.id);
                        })
                      }
                    >
                      {p.abilities.includes(a.id)
                        ? "Unlocked"
                        : `${a.cost} coins`}
                    </button>
                  </div>
                ))}
            </div>
            <div className="panel">
              <h2>Card treatment</h2>
              <div className="button-row">
                {["original", "holographic"].map((style) => (
                  <button
                    className={`secondary ${p.style === style ? "selected" : ""}`}
                    key={style}
                    onClick={() =>
                      update((x) => {
                        x.cards[id].style = style;
                      })
                    }
                  >
                    {style}
                  </button>
                ))}
              </div>
              <p>
                {p.wins} victories with this character · {s.history.length}{" "}
                recent matches saved in your profile.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
