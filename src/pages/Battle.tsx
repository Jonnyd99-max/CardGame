import { useState, useEffect, useCallback } from "react";
import { Swords, ArrowRight, Trophy } from "lucide-react";
import { characters } from "../data/characters";
import { battleCharacters } from "../data/enemies";
import { audio } from "../utils/audio";
import { progression } from "../data/unlocks";
import { themes } from "../data/themes";
import { Card } from "../components/Card";
import { BattleEffects } from "../components/BattleEffects";
import { evolutionFor } from "../game/evolution";
import { uniquePowers, uniqueDescription } from "../game/uniquePowers";
import {
  createBattle,
  playRound,
  aiStat,
  matchPrizes,
  opponentStats,
  activateAbility,
  abilityName,
  combatStats,
  availableStats,
  abilityNotices,
  type Battle as Match,
} from "../game/battle";
import { statsFor, validateDeck } from "../game/progression";
import {
  battleStats,
  rangerBonus,
  chapters,
  campaignStars,
  villainRewards,
} from "../game/adventures";
import { statKeys, type Save, type Mode, type Difficulty } from "../types";
export function BattlePage({
  save: s,
  onComplete,
  tutorial = false,
  onExit,
  initialBattle,
}: {
  save: Save;
  onComplete: (b: Match) => void;
  tutorial?: boolean;
  onExit: () => void;
  initialBattle?: Match;
}) {
  const [mode, setMode] = useState<Mode>("Quick Battle"),
    [difficulty, setDifficulty] = useState<Difficulty>("Normal"),
    [rounds, setRounds] = useState(5),
    [deck, setDeck] = useState(s.activeDeck),
    [battle, setBattle] = useState<Match | null>(
      () =>
        initialBattle ||
        (tutorial
          ? createBattle(s.decks[0].cards, "Quick Battle", "Easy", 3, true)
          : null),
    ),
    [paid, setPaid] = useState(false);
  const [chapterAlreadyCleared] = useState(
    () =>
      !!initialBattle?.chapter && !!s.campaign?.includes(initialBattle.chapter),
  );
  const [abilityStat, setAbilityStat] =
    useState<(typeof statKeys)[number]>("combat");
  const resolve = useCallback(
    (stat: (typeof statKeys)[number]) => {
      if (!battle || battle.last || battle.result) return;
      const next = playRound(battle, stat, s);
      if (next === battle) return;
      audio.enabled = s.settings.sound;
      const attackSound =
        stat === "tech"
          ? "blaster"
          : stat === "speed"
            ? "whoosh"
            : stat === "special" || stat === "power"
              ? "energy"
              : "impact";
      const resultSound =
        next.result === "player"
          ? "matchWin"
          : next.result === "ai"
            ? "matchLoss"
            : next.last?.winner === "player"
              ? "roundWin"
              : next.last?.winner === "draw"
                ? "draw"
                : "roundLoss";
      void audio.play(attackSound).then(() => audio.play(resultSound, 0.35));
      setBattle(next);
      if (next.result && !paid) {
        setPaid(true);
        onComplete(next);
      }
    },
    [battle, s, paid, onComplete],
  );
  useEffect(() => {
    if (!battle || battle.turn !== "ai" || battle.last || battle.result) return;
    const timer = window.setTimeout(() => {
      const enemy = battleCharacters.find((c) => c.id === battle.ai[0]);
      if (!enemy) return;
      const stat = aiStat(
        opponentStats(battle, enemy.baseStats),
        battle.difficulty,
        Math.random,
        availableStats(battle, "ai"),
      );
      if (stat) resolve(stat);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [battle, resolve]);
  const selectedDeck = s.decks.find((d) => d.id === deck)!;
  const selectedLimit =
    mode === "Quick Battle"
      ? 3
      : mode === "Team Battle"
        ? selectedDeck.cards.length
        : rounds;
  const sweepRounds =
    mode === "Quick Battle" || mode === "Best of"
      ? Math.floor(selectedLimit / 2) + 1
      : selectedLimit;
  const sweep = matchPrizes({
    mode,
    target: rounds,
    participants: selectedDeck.cards,
    round: sweepRounds,
    scores: [sweepRounds, 0],
    result: "player",
  });
  if (!battle)
    return (
      <>
        <div className="page-heading">
          <div>
            <span className="eyebrow">THE ARENA AWAITS</span>
            <h1>
              Pick your <em>battle.</em>
            </h1>
            <p>Your cards. Your strategy. Your moment.</p>
          </div>
        </div>
        <div className="mode-grid">
          {(
            [
              "Quick Battle",
              "Classic",
              "Best of",
              "Team Battle",
              "Crossover Battle",
            ] as Mode[]
          ).map((m, i) => (
            <button
              className={`mode-card ${mode === m ? "selected" : ""}`}
              key={m}
              onClick={() => setMode(m)}
            >
              <span>0{i + 1}</span>
              <Swords size={30} />
              <h2>{m}</h2>
              <p>
                {
                  [
                    "A fast, best-of-three showdown.",
                    "Capture every card. Ties build a prize pot.",
                    "A balanced clash over 5, 7 or 9 rounds.",
                    "Your custom lineup against a rival team.",
                    "Face cards from other universes.",
                  ][i]
                }
              </p>
            </button>
          ))}
        </div>
        <div className="panel battle-config">
          <label>
            AI difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              {["Easy", "Normal", "Hard", "Expert"].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            Your deck
            <select value={deck} onChange={(e) => setDeck(e.target.value)}>
              {s.decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.cards.length} cards
                </option>
              ))}
            </select>
          </label>
          {(mode === "Best of" || mode === "Crossover Battle") && (
            <label>
              Round limit
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
              >
                {[5, 7, 9].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          )}
          <button
            className="primary"
            disabled={!!validateDeck(s.decks.find((d) => d.id === deck)!, s)}
            onClick={() => {
              setBattle(
                createBattle(
                  s.decks.find((d) => d.id === deck)!.cards,
                  mode,
                  difficulty,
                  rounds,
                ),
              );
              setPaid(false);
            }}
          >
            <Swords size={18} /> Start battle <ArrowRight size={18} />
          </button>
          <p>{validateDeck(s.decks.find((d) => d.id === deck)!, s)}</p>
        </div>
        <div className="panel">
          <h2>Earn your prizes</h2>
          {mode !== "Classic" && (
            <p>
              <strong>
                A {sweepRounds}–0 clean sweep: {sweep.xp} XP · {sweep.coins}{" "}
                coins · {sweep.materials}{" "}
                {sweep.materials === 1 ? "material" : "materials"}
              </strong>
            </p>
          )}
          <p>
            Each round played earns 4 XP and 6 coins. Each round you win adds 8
            XP and 12 coins. Win the match for a bonus that grows with the round
            limit.
          </p>
          <p>
            Materials: one for a match victory, plus one per 3 rounds won and
            per 6 rounds played, up to 6. Classic prizes count up to{" "}
            {progression.rewardedRoundCap} played rounds. Unfinished matches
            award no prizes.
          </p>
        </div>
        <div className="tip">
          Opponent attributes stay hidden until the round resolves. AI uses only
          its own card and public base-stat averages. Classic resolves at{" "}
          {progression.classicRoundLimit} rounds if neither deck is exhausted.
          Each side can choose each stat only once per fight. When both sides
          run out, the final score decides the winner.
        </div>
      </>
    );
  const pc =
      battleCharacters.find(
        (c) => c.id === (battle.last?.playerId || battle.player[0]),
      ) || characters.find((c) => c.id === battle.participants[0])!,
    ac =
      battleCharacters.find(
        (c) => c.id === (battle.last?.aiId || battle.ai[0]),
      ) || characters[0],
    ps = combatStats(
      battle,
      pc.id,
      battleStats(pc.id, statsFor(pc, s), battle.participants, s),
    ),
    opponent = battle.last?.enemyStats || opponentStats(battle, ac.baseStats),
    prizes = matchPrizes(battle);
  return (
    <div
      className={`arena ${battle.last ? `impact-${battle.last.winner}` : ""}`}
    >
      {battle.last && (
        <div key={battle.round} className="comic-impact" aria-hidden="true">
          {battle.last.winner === "player"
            ? "POW!"
            : battle.last.winner === "draw"
              ? "CLASH!"
              : "WHAM!"}
        </div>
      )}
      <div className="arena-header">
        <button className="text-button" onClick={onExit}>
          ← Leave arena
        </button>
        <div>
          <span className="eyebrow">{themes[s.franchise].arena}</span>
          <h2>
            {battle.chapter
              ? chapters.find((c) => c.id === battle.chapter)?.name
              : battle.tutorial
                ? "Training grounds"
                : battle.mode}
          </h2>
        </div>
        <span className="pill">{battle.difficulty} AI</span>
      </div>
      {tutorial && (
        <div className="tutorial-banner">
          It’s morphin time! Pick one of your strongest stats. Your opponent’s
          stats are secret until the fight. Highest value wins; the winner
          chooses next.
        </div>
      )}
      {battle.boss && (
        <div className="tutorial-banner">
          Boss phase{" "}
          {Math.min(
            3,
            1 + Math.floor((battle.last ? battle.round - 1 : battle.round) / 3),
          )}{" "}
          / 3 · Enemy stats rise by 3 each phase. Win the majority of{" "}
          {battle.target} rounds.
        </div>
      )}
      {rangerBonus(battle.participants, s).total > 0 && (
        <div className="tip">
          Ranger synergy: +{rangerBonus(battle.participants, s).total} combat
          and +{rangerBonus(battle.participants, s).team} power for your
          Rangers. Battle values include this bonus.
        </div>
      )}
      <div className="scoreboard">
        <div>
          <small>{s.name}</small>
          <strong>{battle.scores[0]}</strong>
          <span>{battle.player.length} cards</span>
        </div>
        <section>
          <span>ROUND {battle.round + (battle.last ? 0 : 1)}</span>
          <b>VS</b>
          <small>
            {battle.turn === "player" ? "YOUR CHOICE" : "OPPONENT’S CHOICE"}
          </small>
        </section>
        <div>
          <small>Dimensional rival</small>
          <strong>{battle.scores[1]}</strong>
          <span>
            {battle.ai.length} cards{" "}
            {battle.pot.length ? `· ${battle.pot.length} in pot` : ""}
          </span>
        </div>
      </div>
      {abilityNotices(battle).map((notice) => (
        <div
          key={notice.title}
          className={`curse-banner ability-banner-${notice.side}`}
          role="status"
        >
          <strong>{notice.title}</strong>
          <p>
            {notice.description}{" "}
            {notice.side === "player"
              ? "Your team’s fight boost has been used."
              : "Enemy ability active."}
          </p>
        </div>
      ))}
      <div className="battle-layout">
        <Card
          key={`p-${pc.id}-${battle.round}`}
          character={pc}
          save={s}
          battleValues={ps}
        />
        <div className="stat-choices">
          <p className="tip">
            Each stat can be chosen once per side for the whole fight. Your
            choices remaining: {availableStats(battle, "player").length} ·
            Opponent: {availableStats(battle, "ai").length}.
          </p>
          {!battle.last && !battle.result && (
            <div className="panel">
              <h3>{abilityName(pc.id)}</h3>
              <p>
                {uniquePowers[pc.id]
                  ? uniqueDescription(
                      pc.id,
                      abilityStat,
                      evolutionFor(pc, s).stage,
                    )
                  : pc.id === "rick-6"
                    ? `Reroll one stat to ${70 + evolutionFor(pc, s).stage * 5}–100. It may become lower.`
                    : pc.id === "dc-0"
                      ? `Reveal ${1 + evolutionFor(pc, s).stage} enemy stats before attacking.`
                      : pc.id === "rangers-6"
                        ? `+${12 + evolutionFor(pc, s).stage * 2} durability and +${6 + evolutionFor(pc, s).stage * 2} combat this round.`
                        : `+${8 + evolutionFor(pc, s).stage * 2} to one stat this round.`}{" "}
                One ability use for your whole team per fight.
              </p>
              {(!uniquePowers[pc.id] ||
                ["rick-6", "enemy-rita", "enemy-ultron"].includes(pc.id)) && (
                <label>
                  Ability stat
                  <select
                    value={abilityStat}
                    onChange={(e) =>
                      setAbilityStat(
                        e.target.value as (typeof statKeys)[number],
                      )
                    }
                  >
                    {statKeys.map((k) => (
                      <option key={k}>{k}</option>
                    ))}
                  </select>
                </label>
              )}
              <button
                className="secondary"
                disabled={
                  battle.turn !== "player" ||
                  (battle.usedAbilities?.length || 0) > 0
                }
                onClick={() => {
                  setBattle(
                    activateAbility(
                      battle,
                      abilityStat,
                      Math.random,
                      evolutionFor(pc, s).stage,
                    ),
                  );
                  audio.play("energy");
                }}
              >
                {(battle.usedAbilities?.length || 0) > 0
                  ? "Fight boost used"
                  : "Activate ability"}
              </button>
            </div>
          )}

          <span className="eyebrow">
            {battle.last ? "ROUND REVEALED" : "SELECT YOUR STRONGEST STAT"}
          </span>
          {statKeys.map((k) => (
            <button
              disabled={
                !!battle.last ||
                !!battle.result ||
                battle.turn === "ai" ||
                !availableStats(battle, "player").includes(k)
              }
              key={k}
              className={`${battle.last?.stat === k ? "chosen" : ""} ${abilityNotices(battle).some((n) => n.stats.includes(k)) ? "cursed-stat" : ""}`}
              onClick={() => resolve(k)}
            >
              <strong>{ps[k]}</strong>
              <span>
                {k === "special" ? "Special ability" : k}
                {battle.usedStats?.player.includes(k) ? " · Used by you" : ""}
                {battle.usedStats?.ai.includes(k) ? " · Used by opponent" : ""}
                {abilityNotices(battle).some((n) => n.stats.includes(k))
                  ? " · Ability active"
                  : ""}
              </span>
              <b
                aria-label={
                  battle.last ||
                  (battle.abilityRound?.round === battle.round &&
                    battle.abilityRound.reveal &&
                    (
                      battle.abilityRound.revealStats || [
                        battle.abilityRound.stat,
                      ]
                    ).includes(k))
                    ? undefined
                    : "Opponent stat hidden"
                }
              >
                {battle.last ||
                (battle.abilityRound?.round === battle.round &&
                  battle.abilityRound.reveal &&
                  (
                    battle.abilityRound.revealStats || [
                      battle.abilityRound.stat,
                    ]
                  ).includes(k))
                  ? opponent[k]
                  : "?"}
              </b>
            </button>
          ))}
          {battle.turn === "ai" && !battle.last && !battle.result && (
            <p className="tip" role="status">
              Opponent is choosing its attack…
            </p>
          )}
          {battle.last && !battle.result && (
            <div className="round-result">
              <b>
                {battle.last.winner === "draw"
                  ? "A dimensional tie"
                  : battle.last.winner === "player"
                    ? "Round won!"
                    : "Opponent takes the round"}
              </b>
              <p>
                {battle.last.a} vs {battle.last.b} · {battle.last.stat}
              </p>
              <button
                className="primary"
                onClick={() => setBattle({ ...battle, last: undefined })}
              >
                Next round <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        <Card
          key={`a-${ac.id}-${battle.round}`}
          character={ac}
          save={{ ...s, cards: {}, favourite: "" }}
          hideStats={!battle.last}
          battleValues={opponent}
        />
        <BattleEffects battle={battle} />
      </div>
      {battle.result && (
        <section className={`match-result ${battle.result}`}>
          <Trophy size={44} />
          <span className="eyebrow">MATCH COMPLETE</span>
          {battle.chapter && (
            <p>
              <strong>
                {"★".repeat(campaignStars(battle))}
                {"☆".repeat(3 - campaignStars(battle))} · Campaign rating
              </strong>
              <br />
              New best stars award 50 coins and 1 material each, once.
            </p>
          )}
          <h1>
            {battle.result === "player"
              ? "Victory is yours."
              : battle.result === "draw"
                ? "A worthy rivalry."
                : "The next battle is yours."}
          </h1>
          <p>
            {battle.scores.join(" : ")} · +{prizes.xp} XP · +{prizes.coins}{" "}
            coins · +{prizes.materials}{" "}
            {prizes.materials === 1 ? "material" : "materials"}
          </p>
          <p>
            {battle.round} rounds played · {battle.scores[0]} rounds won · +
            {prizes.characterXP} XP per participating character
          </p>
          {!!prizes.bonusXP && (
            <p>
              Victory bonus included: +{prizes.bonusXP} XP and +
              {prizes.bonusCoins} coins.
            </p>
          )}
          {battle.chapter && battle.result === "player" && (
            <p>
              {villainRewards[battle.chapter] && (
                <>
                  <strong>
                    Villain card earned:{" "}
                    {
                      characters.find(
                        (c) => c.id === villainRewards[battle.chapter!],
                      )?.name
                    }
                    !
                  </strong>
                  <br />
                </>
              )}
              {chapterAlreadyCleared
                ? "Replay complete. First-clear prizes were already claimed."
                : (() => {
                    const c = chapters.find((c) => c.id === battle.chapter)!;
                    return `Chapter bonus: +${c.coins} coins · +${c.xp} XP · +${c.boss ? 4 : 2} materials · ${c.item.split("-").join(" ")}${"card" in c ? " + Green Ranger" : ""}. Awarded once.`;
                  })()}
            </p>
          )}
          <button className="primary" onClick={onExit}>
            {battle.chapter
              ? "Return to campaign"
              : tutorial
                ? "Enter your home"
                : "Return home"}{" "}
            <ArrowRight size={18} />
          </button>
        </section>
      )}
      <details className="panel">
        <summary>Battle log · {battle.round} rounds</summary>
        {battle.log.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </details>
    </div>
  );
}
