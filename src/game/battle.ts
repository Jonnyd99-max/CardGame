import { characters } from "../data/characters";
import { battleCharacters } from "../data/enemies";
import { statsFor, grantXP, refreshPeriods } from "./progression";
import { progression } from "../data/unlocks";
import { battleStats } from "./adventures";
import {
  statKeys,
  type Stats,
  type Stat,
  type Difficulty,
  type Mode,
  type Save,
} from "../types";
export function compare(a: number, b: number) {
  return a === b ? "draw" : a > b ? "player" : "ai";
}
export function aiStat(
  own: Stats,
  difficulty: Difficulty,
  rng = Math.random,
): Stat {
  if (difficulty === "Easy" || (difficulty === "Normal" && rng() < 0.35))
    return statKeys[Math.floor(rng() * statKeys.length)];
  const averages = Object.fromEntries(
    statKeys.map((k) => [
      k,
      characters.reduce((n, c) => n + c.baseStats[k], 0) / characters.length,
    ]),
  ) as Stats;
  return [...statKeys].sort(
    (a, b) =>
      own[b] -
      (difficulty === "Expert" ? averages[b] : 0) -
      (own[a] - (difficulty === "Expert" ? averages[a] : 0)),
  )[0];
}
export interface Battle {
  usedAbilities?: string[];
  abilityRound?: {
    round: number;
    character: string;
    stat: Stat;
    value?: number;
    shield?: boolean;
    reveal?: boolean;
  };
  bossMemory?: Stat;
  chapter?: string;
  boss?: boolean;
  mode: Mode;
  difficulty: Difficulty;
  target: number;
  player: string[];
  ai: string[];
  pot: string[];
  turn: "player" | "ai";
  round: number;
  scores: [number, number];
  result?: "player" | "ai" | "draw";
  last?: {
    stat: Stat;
    a: number;
    b: number;
    winner: string;
    playerId: string;
    aiId: string;
    enemyStats?: Stats;
  };
  log: string[];
  strengthWins: number;
  participants: string[];
  tutorial: boolean;
}
export function roundLimit(
  b: Pick<Battle, "mode" | "target" | "participants">,
) {
  return b.mode === "Classic"
    ? progression.classicRoundLimit
    : b.mode === "Quick Battle"
      ? 3
      : b.mode === "Team Battle"
        ? b.participants.length
        : b.target;
}
export function matchPrizes(
  b: Pick<
    Battle,
    "mode" | "target" | "participants" | "round" | "scores" | "result"
  >,
) {
  if (!b.result)
    return {
      xp: 0,
      coins: 0,
      materials: 0,
      characterXP: 0,
      rounds: 0,
      wins: 0,
      bonusXP: 0,
      bonusCoins: 0,
    };
  const rounds = Math.min(b.round, progression.rewardedRoundCap);
  const wins = Math.min(b.scores[0], rounds);
  const duration = Math.min(roundLimit(b), progression.rewardedRoundCap);
  const won = b.result === "player";
  const bonusXP = won ? 12 + duration * 2 : 0;
  const bonusCoins = won ? 18 + duration * 3 : 0;
  return {
    xp: rounds * 4 + wins * 8 + bonusXP,
    coins: rounds * 6 + wins * 12 + bonusCoins,
    materials: Math.min(
      6,
      Math.floor(rounds / 6) + Math.floor(wins / 3) + (won ? 1 : 0),
    ),
    characterXP: rounds * 2 + wins * 4 + (won ? 8 : 0),
    rounds,
    wins,
    bonusXP,
    bonusCoins,
  };
}
export function createBattle(
  ids: string[],
  mode: Mode,
  difficulty: Difficulty,
  target = 5,
  tutorial = false,
): Battle {
  const shuffled = [...characters];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const opponents: string[] = [];
  for (const id of ids) {
    const franchise = characters.find((c) => c.id === id)!.franchise;
    const candidate = shuffled.find(
      (c) =>
        !opponents.includes(c.id) &&
        (mode !== "Crossover Battle" || c.franchise !== franchise),
    );
    if (!candidate)
      throw new Error(
        "Not enough compatible opponents in the character catalogue.",
      );
    opponents.push(candidate.id);
  }
  return {
    mode,
    difficulty,
    target,
    player: [...ids],
    ai: opponents,
    pot: [],
    turn: "player",
    round: 0,
    scores: [0, 0],
    log: [],
    strengthWins: 0,
    participants: ids,
    tutorial,
  };
}
export function playRound(b: Battle, stat: Stat, s: Save): Battle {
  if (b.result) return b;
  const next = structuredClone(b);
  const p = battleCharacters.find((c) => c.id === b.player[0])!,
    a = battleCharacters.find((c) => c.id === b.ai[0])!;
  const ps = combatStats(
      b,
      p.id,
      battleStats(p.id, statsFor(p, s), b.participants, s),
    ),
    as = opponentStats(b, a.baseStats);
  const winner = compare(ps[stat], as[stat]);
  next.round++;
  next.last = {
    stat,
    a: ps[stat],
    b: as[stat],
    winner,
    playerId: p.id,
    aiId: a.id,
    enemyStats: as,
  };
  next.bossMemory = stat;
  next.log.unshift(
    `${p.name} ${ps[stat]} · ${a.name} ${as[stat]} — ${stat}: ${winner === "draw" ? "tie" : winner === "player" ? "you win" : "opponent wins"}`,
  );
  const curse = ritaCurse(b);
  if (curse)
    next.log.unshift(
      `Rita casts Moon Curse: your ${curse} is reduced by 8 for this round.`,
    );
  if (winner !== "draw") {
    next.scores[winner === "player" ? 0 : 1]++;
    next.turn = winner;
    if (winner === "player" && stat === "strength") next.strengthWins++;
  }
  if (b.mode === "Classic") {
    const pair = [next.player.shift()!, next.ai.shift()!];
    if (winner === "draw") next.pot.push(...pair);
    else {
      next[winner].push(...next.pot, ...pair);
      next.pot = [];
    }
    if (!next.player.length || !next.ai.length) {
      if (winner === "draw" && next.pot.length) {
        next.player.push(...next.pot.filter((_, i) => i % 2 === 0));
        next.ai.push(...next.pot.filter((_, i) => i % 2 === 1));
        next.pot = [];
      } else next.result = next.player.length ? "player" : "ai";
    }
    if (next.round >= progression.classicRoundLimit && !next.result)
      next.result =
        next.player.length === next.ai.length
          ? "draw"
          : next.player.length > next.ai.length
            ? "player"
            : "ai";
  } else {
    next.player.push(next.player.shift()!);
    next.ai.push(next.ai.shift()!);
    const limit = roundLimit(b);
    if (
      next.round >= limit ||
      ((b.mode === "Best of" || b.mode === "Quick Battle") &&
        Math.max(...next.scores) > limit / 2)
    )
      next.result =
        next.scores[0] === next.scores[1]
          ? "draw"
          : next.scores[0] > next.scores[1]
            ? "player"
            : "ai";
  }
  return next;
}
export function opponentStats(b: Battle, base: Stats): Stats {
  const phase = b.boss ? Math.min(2, Math.floor(b.round / 3)) : 0;
  const values = Object.fromEntries(
    statKeys.map((k) => [k, Math.min(100, base[k] + phase * 3)]),
  ) as Stats;
  if (b.chapter === "ultron" && b.bossMemory)
    values[b.bossMemory] = Math.min(100, values[b.bossMemory] + 10);
  if (b.chapter === "joker" && b.round % 2 === 1)
    [values.power, values.intelligence] = [values.intelligence, values.power];
  return values;
}
export function abilityName(id: string) {
  return id === "rick-6"
    ? "Portal recalibration"
    : id === "dc-0"
      ? "Detective scan"
      : id === "rangers-6"
        ? "Dragon Shield"
        : "Signature focus";
}
export function activateAbility(
  b: Battle,
  stat: Stat,
  rng = Math.random,
): Battle {
  const id = b.player[0];
  if (
    b.last ||
    b.result ||
    b.turn !== "player" ||
    (b.usedAbilities?.length || 0) > 0
  )
    return b;
  const next = structuredClone(b);
  (next.usedAbilities ||= []).push(id);
  next.abilityRound = {
    round: b.round,
    character: id,
    stat,
    ...(id === "rick-6"
      ? { value: 70 + Math.floor(Math.max(0, Math.min(0.999999, rng())) * 31) }
      : id === "dc-0"
        ? { reveal: true }
        : id === "rangers-6"
          ? { shield: true }
          : {}),
  };
  next.log.unshift(`${abilityName(id)} activated for ${stat}.`);
  return next;
}
export function combatStats(b: Battle, id: string, base: Stats): Stats {
  const values = { ...base };
  const round = b.last ? b.round - 1 : b.round;
  const cursed = ritaCurse(b);
  if (cursed) {
    values[cursed] = Math.max(1, values[cursed] - 8);
  }
  const a = b.abilityRound;
  if (a && a.round === round && a.character === id && !a.reveal) {
    if (a.shield) {
      values.durability = Math.min(100, values.durability + 12);
      values.combat = Math.min(100, values.combat + 6);
    } else values[a.stat] = a.value ?? Math.min(100, values[a.stat] + 8);
  }
  return values;
}
export function ritaCurse(b: Battle): Stat | undefined {
  if (b.chapter !== "titan" && (b.last?.aiId || b.ai[0]) !== "enemy-rita")
    return undefined;
  return statKeys[(b.last ? b.round - 1 : b.round) % statKeys.length];
}
export function rewardMatch(s: Save, b: Battle) {
  if (!b.result) return s;
  refreshPeriods(s);
  const won = b.result === "player";
  const prizes = matchPrizes(b);
  if (won) {
    s.wins++;
    s.periods.dailyWins++;
    s.periods.weeklyWins++;
    if (b.scores[1] === 0) s.perfectWins++;
    new Set(
      b.participants.map(
        (id) => characters.find((c) => c.id === id)!.franchise,
      ),
    ).forEach((f) => (s.franchiseWins[f] = (s.franchiseWins[f] || 0) + 1));
  } else if (b.result === "ai") s.losses++;
  s.roundWins += b.scores[0];
  s.strengthWins += b.strengthWins;
  s.coins += prizes.coins;
  s.materials += prizes.materials;
  b.participants.forEach((id) => {
    const p = s.cards[id];
    if (p) {
      p.xp += prizes.characterXP;
      p.wins += won ? 1 : 0;
    }
  });
  s.history.unshift({
    date: new Date().toISOString(),
    mode: b.mode,
    won,
    score: b.scores.join(" : "),
  });
  s.history = s.history.slice(0, 30);
  return grantXP(s, prizes.xp);
}
