import { Star, ArrowRight, Lock } from "lucide-react";
import { isPokemon } from "../game/gameMode";
import { battleStatKeys, statLabel, statBonusLabel } from "../game/statPresentation";
import { nextPokemonEvolutions } from "../data/pokemonEvolution";
import { pokemonUnlockText } from "../game/pokemonProgression";
import { getCharacter } from "../data/characters";
import { progression } from "../data/unlocks";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { abilities } from "../data/abilities";
import { Card, Artwork } from "../components/Card";
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
  upgradeCharacter,
} from "../game/progression";
import { statKeys, type Save } from "../types";
import { evolutionFor } from "../game/evolution";
import { villainChapter } from "../game/villains";
import { chapters } from "../game/adventures";
import { uniquePowers, uniqueDescription } from "../game/uniquePowers";
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
  const c = getCharacter(id, s)!,
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
      upgradeCharacter(x, id);
    });
    notify(`${c.name} reached level ${p.level + 1}`);
    if (isPokemon) {
      const evolved = nextPokemonEvolutions(id).filter(
        (e) => e.level === p.level + 1 && !s.owned.includes(e.id),
      );
      if (evolved.length)
        notify(
          `${evolved.map((e) => getCharacter(e.id)!.name).join(", ")} unlocked! Find your new Pokémon in the collection.`,
        );
    } else if (p.level + 1 === 5 || p.level + 1 === 10)
      notify(
        `${c.name} evolved! A new form and stronger fight ability are unlocked.`,
      );
  }
  return (
    <div className="detail-layout">
      <div className="detail-preview">
        <Card character={c} save={s} locked={!owned} />
        <div className="tip">
          {isPokemon
            ? "Kanto edition · Train your Pokémon to unlock its evolutions."
            : "Comic edition · Collect your favourite heroes."}
        </div>
      </div>
      <div>
        <span className="eyebrow">
          {franchises.find((f) => f.id === c.franchise)?.name} /{" "}
          {groups.find((g) => g.id === c.group)?.name}
        </span>
        <h1>{c.name}</h1>
        <p className="muted">{c.description}</p>
        {uniquePowers[c.id] && (
          <div className="panel">
            <h2>Fight ability · {uniquePowers[c.id].name}</h2>
            <p>
              {uniqueDescription(c.id, "special", evolutionFor(c, s).stage)}
            </p>
            <p>
              One activation for your whole team per fight. Opponents use this
              power automatically; your card uses the Activate ability button.
              For a targeted power, choose the ability stat in battle.
            </p>
          </div>
        )}
        <div className="panel evolution-panel">
          <h2>Evolution · {evolutionFor(c, s).name}</h2>
          {isPokemon ? (
            <>
              <p>
                Upgrade this Pokémon using Pokémon XP, coins and materials.
                Evolved cards are added to your collection; your original card
                stays yours.
              </p>
              {nextPokemonEvolutions(id).length ? (
                <div className="pokemon-evolution-path">
                  {nextPokemonEvolutions(id).map((e) => (
                    <div key={e.id}>
                      <Artwork character={getCharacter(e.id)!} />
                      <b>{getCharacter(e.id)!.name}</b>
                      <span>
                        {s.owned.includes(e.id)
                          ? "Collected"
                          : `Upgrade ${c.name} to level ${e.level}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>
                  This Pokémon has no further evolution in the original 151.
                  Compatible Mega Stones can temporarily boost eligible Pokémon
                  while equipped.
                </p>
              )}
              <p>
                First evolutions unlock at Pokémon level 5; final evolutions in
                three-stage families unlock by training the middle Pokémon to
                level 15. Each new card starts at its evolution level.
              </p>
            </>
          ) : (
            <>
              <p>
                Card level 5 unlocks evolution I. Level 10 unlocks evolution II.
                Train and upgrade this card to evolve automatically.
              </p>
              <p>
                Each evolution adds +2 to focus and shield bonuses. Rick’s
                reroll minimum rises by 5; Batman reveals one extra stat. Your
                team still gets only one ability per fight.
              </p>
              <p>
                {evolutionFor(c, s).nextLevel
                  ? `Next form at card level ${evolutionFor(c, s).nextLevel}.`
                  : "Final form unlocked!"}
              </p>
            </>
          )}
        </div>
        {!owned ? (
          <div className="panel">
            <Lock />{" "}
            {isPokemon && pokemonUnlockText(id, s)
              ? pokemonUnlockText(id, s)
              : !isPokemon && villainChapter(c.id)
                ? `Win “${chapters.find((ch) => ch.id === villainChapter(c.id))?.name}” to collect this villain. Replays count.`
                : isPokemon ? unlockLevelFor(c, s) <= playerLevel(s.xp) ? "Available in packs. Open a Pokémon pack to collect this card." : `Available in packs from player level ${unlockLevelFor(c, s)}. Current level: ${playerLevel(s.xp)}.`
                : `Unlocks at player level ${unlockLevelFor(c, s)}. Current level: ${playerLevel(s.xp)}.`}
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
            {battleStatKeys.map((k) => (
              <div key={k}>
                <span>{statLabel(k)}</span>
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
                {battleStatKeys.map((k) => (
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
                    +1 {statLabel(k)} <small>100 coins · 1 material · max +5</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="panel">
              <h2>
                {isPokemon
                  ? "Held items, Mega Stones & trainers"
                  : "Weapons & equipment"}
              </h2>
              <p>
                {isPokemon
                  ? "One held item or Mega Stone, plus one trainer. Trainer abilities apply while assigned; removing a trainer removes the ability."
                  : "One weapon and one equipment slot. Equip, replace or remove anytime."}
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
                              .filter(([k, v]) => v && (!isPokemon || battleStatKeys.includes(k as typeof battleStatKeys[number])))
                              .map(
                                ([k, v]) => statBonusLabel(k, v * (i.category === "mega-stone" ? 1 : s.items[i.id] || 1)),
                              )
                              .join(" · ")}
                          </small>
                          {i.grantedAbility && (
                            <small>
                              Grants {i.grantedAbility.name}:{" "}
                              {Object.entries(i.grantedAbility.modifiers)
                                .map(
                                  ([k, v]) =>
                                    statBonusLabel(k, v! * (s.items[i.id] || 1)),
                                )
                                .join(" · ")}
                            </small>
                          )}
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
              <h2>
                {isPokemon ? "Techniques & trainer abilities" : "Abilities"}
              </h2>
              {isPokemon &&
                items
                  .filter((i) => i.grantedAbility && p.equipment.includes(i.id))
                  .map((i) => (
                    <div className="item-row" key={i.id}>
                      <section>
                        <b>
                          {i.grantedAbility!.name} · {i.name}
                        </b>
                        <p>
                          {i.grantedAbility!.description} Active while assigned.{" "}
                          {Object.entries(i.grantedAbility!.modifiers)
                            .map(
                              ([k, v]) => statBonusLabel(k, v! * (s.items[i.id] || 1)),
                            )
                            .join(" · ")}
                        </p>
                      </section>
                      <span className="pill">Active</span>
                    </div>
                  ))}
              {abilities
                .filter((a) => c.abilities.includes(a.id))
                .map((a) => (
                  <div className="item-row" key={a.id}>
                    <section>
                      <b>{a.name}</b>
                      <p>
                        {a.description}{" "}
                        {Object.entries(a.modifiers)
                          .map(([k, v]) => statBonusLabel(k, v))
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
                {isPokemon && <button className={`secondary ${p.style === "shiny" ? "selected" : ""}`} disabled={!s.pokemonShinies?.includes(id)} onClick={() => update(x => { x.cards[id].style = "shiny"; })}>{s.pokemonShinies?.includes(id) ? "Shiny" : "Shiny · find in packs"}</button>}
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
