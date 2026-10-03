import { useState } from "react";
import { Swords, ArrowRight, Trophy } from "lucide-react";
import { characters } from "../data/characters";
import { progression } from "../data/unlocks";
import { themes } from "../data/themes";
import { Card } from "../components/Card";
import {
  createBattle,
  playRound,
  aiStat,
  type Battle as Match,
} from "../game/battle";
import { statsFor, validateDeck } from "../game/progression";
import { statKeys, type Save, type Mode, type Difficulty } from "../types";
export function BattlePage({
  save: s,
  onComplete,
  tutorial = false,
  onExit,
}: {
  save: Save;
  onComplete: (b: Match) => void;
  tutorial?: boolean;
  onExit: () => void;
}) {
  const [mode, setMode] = useState<Mode>("Quick Battle"),
    [difficulty, setDifficulty] = useState<Difficulty>("Normal"),
    [rounds, setRounds] = useState(5),
    [deck, setDeck] = useState(s.activeDeck),
    [battle, setBattle] = useState<Match | null>(() =>
      tutorial
        ? createBattle(s.decks[0].cards, "Quick Battle", "Easy", 3, true)
        : null,
    ),
    [paid, setPaid] = useState(false);
  function resolve(stat: (typeof statKeys)[number]) {
    if (!battle || battle.last || battle.result) return;
    const next = playRound(battle, stat, s);
    setBattle(next);
    if (next.result && !paid) {
      setPaid(true);
      onComplete(next);
    }
  }
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
          {mode === "Best of" && (
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
        <div className="tip">
          Both cards are visible when choosing a stat. AI uses only its own card
          and public base-stat averages. Classic resolves at{" "}
          {progression.classicRoundLimit} rounds if neither deck is exhausted.
        </div>
      </>
    );
  const pc =
      characters.find(
        (c) => c.id === (battle.last?.playerId || battle.player[0]),
      ) || characters.find((c) => c.id === battle.participants[0])!,
    ac =
      characters.find((c) => c.id === (battle.last?.aiId || battle.ai[0])) ||
      characters[0],
    ps = statsFor(pc, s);
  return (
    <div className="arena">
      <div className="arena-header">
        <button className="text-button" onClick={onExit}>
          ← Leave arena
        </button>
        <div>
          <span className="eyebrow">{themes[s.franchise].arena}</span>
          <h2>{battle.tutorial ? "Training grounds" : battle.mode}</h2>
        </div>
        <span className="pill">{battle.difficulty} AI</span>
      </div>
      {tutorial && (
        <div className="tutorial-banner">
          Welcome to your first battle! Choose a stat where your card has an
          advantage. Highest value wins. The round winner chooses next.
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
      <div className="battle-layout">
        <Card key={`p-${pc.id}-${battle.round}`} character={pc} save={s} />
        <div className="stat-choices">
          <span className="eyebrow">
            {battle.last ? "ROUND REVEALED" : "SELECT YOUR STRONGEST STAT"}
          </span>
          {statKeys.map((k) => (
            <button
              disabled={
                !!battle.last || !!battle.result || battle.turn === "ai"
              }
              key={k}
              className={battle.last?.stat === k ? "chosen" : ""}
              onClick={() => resolve(k)}
            >
              <strong>{ps[k]}</strong>
              <span>{k === "special" ? "Special ability" : k}</span>
              <b>{ac.baseStats[k]}</b>
            </button>
          ))}
          {battle.turn === "ai" && !battle.last && !battle.result && (
            <button
              className="primary"
              onClick={() => resolve(aiStat(ac.baseStats, battle.difficulty))}
            >
              Reveal AI selection
            </button>
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
        />
      </div>
      {battle.result && (
        <section className={`match-result ${battle.result}`}>
          <Trophy size={44} />
          <span className="eyebrow">MATCH COMPLETE</span>
          <h1>
            {battle.result === "player"
              ? "Victory is yours."
              : battle.result === "draw"
                ? "A worthy rivalry."
                : "The next battle is yours."}
          </h1>
          <p>
            {battle.scores.join(" : ")} · +
            {battle.result === "player"
              ? progression.matchXP
              : progression.lossXP}{" "}
            XP · +
            {battle.result === "player"
              ? progression.winCoins
              : progression.lossCoins}{" "}
            coins · +
            {battle.result === "player"
              ? progression.winMaterials
              : progression.lossMaterials}{" "}
            materials
          </p>
          <button className="primary" onClick={onExit}>
            {tutorial ? "Enter your home" : "Return home"}{" "}
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
