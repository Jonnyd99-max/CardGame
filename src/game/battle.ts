import { characters, getCharacter } from "../data/characters";
import { battleCharacters } from "../data/enemies";
import { statsFor, grantXP, refreshPeriods } from "./progression";
import { progression } from "../data/unlocks";
import { battleStats } from "./adventures";
import { applyPokemonMatchup, pokemonMatchupBonus } from "./pokemonMatchups";
import { battleStatKeys } from "./statPresentation";
import {
  uniquePowers,
  uniqueEffect,
  uniqueDescription,
  modifyStats,
} from "./uniquePowers";
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
  available: readonly Stat[] = battleStatKeys,
): Stat | undefined {
  if (!available.length) return undefined;
  if (difficulty === "Easy" || (difficulty === "Normal" && rng() < 0.35))
    return available[Math.floor(rng() * available.length)];
  const averages = Object.fromEntries(
    statKeys.map((k) => [
      k,
      characters.reduce((n, c) => n + c.baseStats[k], 0) / characters.length,
    ]),
  ) as Stats;
  return [...available].sort(
    (a, b) =>
      own[b] -
      (difficulty === "Expert" ? averages[b] : 0) -
      (own[a] - (difficulty === "Expert" ? averages[a] : 0)),
  )[0];
}
export interface Battle {
  health?: { player: number[]; ai: number[]; playerMax: number[]; aiMax: number[] };
  encountered?: string[];
  opponentAbility?: {
    round: number;
    character: string;
    stat: Stat;
    value?: number;
    shield?: boolean;
    modifiers?: Partial<Stats>;
    enemyModifiers?: Partial<Stats>;
    swapEnemy?: boolean;
  };
  usedStats?: { player: Stat[]; ai: Stat[] };
  usedAbilities?: string[];
  abilityRound?: {
    round: number;
    character: string;
    stat: Stat;
    value?: number;
    shield?: boolean;
    reveal?: boolean;
    revealStats?: Stat[];
    evolutionStage?: number;
    modifiers?: Partial<Stats>;
    enemyModifiers?: Partial<Stats>;
    swapEnemy?: boolean;
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
    abilityNotices?: AbilityNotice[];
    chooser?: "player" | "ai";
    damage?: number;
    fainted?: string[];
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
  const duration = Math.min(b.participants[0]?.startsWith("pokemon-") ? b.participants.length : roundLimit(b), progression.rewardedRoundCap);
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
  save?: Save,
): Battle {
  const shuffled = [...characters];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const opponents: string[] = [];
  for (const id of ids) {
    const franchise = getCharacter(id, save)!.franchise;
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
  if (b.result || b.last || !availableStats(b, b.turn).includes(stat)) return b;
  const enemyId = b.ai[0];
  if (!b.opponentAbility)
    b = {
      ...b,
      opponentAbility: {
        round: b.round,
        character: enemyId,
        stat: aiStat(getCharacter(enemyId, s)!.baseStats, "Hard")!,
        ...uniqueEffect(
          enemyId,
          aiStat(getCharacter(enemyId, s)!.baseStats, "Hard")!,
        ),
      },
    };
  const next = structuredClone(b);
  ensurePokemonHealth(next, s);
  next.usedStats ||= { player: [], ai: [] };
  next.usedStats[b.turn].push(stat);
  const p = getCharacter(b.player[0], s)!,
    a = getCharacter(b.ai[0], s)!;
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
    chooser: b.turn,
    abilityNotices: abilityNotices(b),
  };
  next.bossMemory = stat;
  next.log.unshift(
    `${p.name} ${ps[stat]} · ${a.name} ${as[stat]} — ${stat}: ${winner === "draw" ? "tie" : winner === "player" ? "you win" : "opponent wins"}`,
  );
  abilityNotices(b)
    .filter((n) => n.side === "ai")
    .forEach((n) => next.log.unshift(`${n.title}: ${n.description}`));
  if (winner !== "draw") {
    next.scores[winner === "player" ? 0 : 1]++;
    next.turn = winner;
    if (winner === "player" && stat === "strength") next.strengthWins++;
  }
  if (next.health) {
    const hp = next.health;
    const damage = winner === "draw" ? 10 : Math.min(30, 10 + Math.floor(Math.abs(ps[stat] - as[stat]) / 3));
    next.last.damage = damage;
    next.last.fainted = [];
    for (const side of ["player", "ai"] as const) {
      if (winner === side) continue;
      hp[side][0] = Math.max(0, hp[side][0] - damage);
      if (!hp[side][0]) {
        const fainted = next[side].shift()!;
        hp[side].shift();
        hp[side === "player" ? "playerMax" : "aiMax"].shift();
        next.last.fainted.push(fainted);
        if (side === "ai" && next.ai[0] && !next.encountered?.includes(next.ai[0])) (next.encountered ||= []).push(next.ai[0]);
        next.log.unshift(`${getCharacter(fainted, s)!.name} fainted. ${next[side].length ? "The next Pokémon enters." : "No Pokémon remain."}`);
        next.usedStats[side] = [];
      }
    }
    if (!next.player.length || !next.ai.length)
      next.result = !next.player.length && !next.ai.length ? "draw" : next.player.length ? "player" : "ai";
    // Fresh comparison choices after each set; health persists until fainting.
    for (const side of ["player", "ai"] as const)
      if (!availableStats(next, side).length) next.usedStats[side] = [];
    return next;
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
  if (!next.result && !availableStats(next, next.turn).length) {
    const other = next.turn === "player" ? "ai" : "player";
    if (availableStats(next, other).length) next.turn = other;
    else {
      next.result = compare(next.scores[0], next.scores[1]);
      next.log.unshift(
        "Both sides have used every stat. The final score decides the fight.",
      );
    }
  }
  return next;
}
export function availableStats(b: Battle, side: "player" | "ai"): Stat[] {
  return battleStatKeys.filter((stat) => !b.usedStats?.[side].includes(stat));
}
export function ensurePokemonHealth(b: Battle, s: Save) {
  if (b.health || !b.player.every(id => id.startsWith("pokemon-")) || !b.ai.every(id => id.startsWith("pokemon-"))) return;
  const player = b.player.map(id => Math.max(10, statsFor(getCharacter(id, s)!, s).tech));
  const ai = b.ai.map(id => Math.max(10, getCharacter(id, s)!.baseStats.tech));
  b.health = { player, ai, playerMax: [...player], aiMax: [...ai] };
  b.encountered = b.ai[0] ? [b.ai[0]] : [];
}
export function opponentStats(b: Battle, base: Stats): Stats {
  const phase = b.boss && !b.ai[0]?.startsWith("pokemon-") ? Math.min(2, Math.floor(b.round / 3)) : 0;
  const values = Object.fromEntries(
    statKeys.map((k) => [k, Math.min(100, base[k] + phase * 3)]),
  ) as Stats;
  if (enemyHasPower(b, "ultron") && b.bossMemory)
    values[b.bossMemory] = Math.min(100, values[b.bossMemory] + 10);
  if (enemyHasPower(b, "joker") && b.round % 2 === 1)
    [values.power, values.intelligence] = [values.intelligence, values.power];
  if (b.abilityRound?.round === b.round) {
    modifyStats(values, b.abilityRound.enemyModifiers);
    if (b.abilityRound.swapEnemy)
      [values.power, values.intelligence] = [values.intelligence, values.power];
  }
  const a = b.opponentAbility;
  if (a?.round === b.round) {
    if (a.shield) {
      modifyStats(values, { durability: 12, combat: 6 });
    } else if (a.modifiers) modifyStats(values, a.modifiers);
    else values[a.stat] = a.value ?? Math.min(100, values[a.stat] + 8);
  }
  return applyPokemonMatchup(values, b.last?.aiId || b.ai[0], b.last?.playerId || b.player[0]);
}
function enemyHasPower(b: Battle, name: string) {
  return b.chapter === name || (b.last?.aiId || b.ai[0]) === `enemy-${name}`;
}
export function abilityName(id: string) {
  if (uniquePowers[id]) return uniquePowers[id].name;
  return id === "rick-6"
    ? "Portal recalibration"
    : id === "dc-0"
      ? "Detective scan"
      : id === "rangers-6"
        ? "Dragon Shield"
        : "Signature focus";
}
export interface AbilityNotice {
  title: string;
  description: string;
  side: "player" | "ai";
  stats: Stat[];
}
export function abilityNotices(b: Battle): AbilityNotice[] {
  if (b.last?.abilityNotices) return b.last.abilityNotices;
  const notices: AbilityNotice[] = [];
  const playerId = b.last?.playerId || b.player[0];
  const aiId = b.last?.aiId || b.ai[0];
  for (const [side, own, enemy] of [["player", playerId, aiId], ["ai", aiId, playerId]] as const) {
    const bonus = pokemonMatchupBonus(own, enemy);
    if (bonus) notices.push({
      title: `${getCharacter(own)?.name || "Pokémon"}: type ${bonus > 0 ? "advantage" : "disadvantage"}`,
      description: `All stats ${bonus > 0 ? "gain +5" : "lose 5"} against ${getCharacter(enemy)?.name || "this opponent"} this round (1–100).`,
      side,
      stats: [...statKeys],
    });
  }
  const curse = ritaCurse(b);
  if (curse)
    notices.push({
      title: "Rita casts Moon Curse!",
      description: `Your ${curse} is reduced by 8 this round.`,
      side: "ai",
      stats: [curse],
    });
  if (enemyHasPower(b, "ultron") && b.bossMemory)
    notices.push({
      title: "Ultron activates Adaptive Armour!",
      description: `Opponent ${b.bossMemory} gains +10 this round (maximum 100).`,
      side: "ai",
      stats: [b.bossMemory],
    });
  if (enemyHasPower(b, "joker") && b.round % 2 === 1)
    notices.push({
      title: "Joker uses Chaos Swap!",
      description: "Opponent power and intelligence are swapped this round.",
      side: "ai",
      stats: ["power", "intelligence"],
    });
  const phase = b.boss && !b.ai[0]?.startsWith("pokemon-") ? Math.min(2, Math.floor(b.round / 3)) : 0;
  if (phase)
    notices.push({
      title: `Boss powers up — phase ${phase + 1}!`,
      description: `All opponent stats gain +${phase * 3} this phase (maximum 100).`,
      side: "ai",
      stats: [...statKeys],
    });
  const a = b.abilityRound;
  const enemyAbility = b.opponentAbility;
  if (enemyAbility?.round === b.round)
    notices.push({
      title: `${battleCharacters.find((c) => c.id === enemyAbility.character)?.name || "Opponent"} uses ${uniquePowers[enemyAbility.character]?.name || "Battle Focus"}!`,
      description: `${enemyAbility.value !== undefined ? `Opponent ${enemyAbility.stat} is rerolled to ${enemyAbility.value} this round.` : uniquePowers[enemyAbility.character] ? uniqueDescription(enemyAbility.character, enemyAbility.stat) : `Opponent ${enemyAbility.stat} gains +8 this round (maximum 100).`} Their team's one fight boost is now used.`,
      side: "ai",
      stats: enemyAbility.shield
        ? ["durability", "combat"]
        : enemyAbility.swapEnemy
          ? ["power", "intelligence"]
          : ([
              ...new Set([
                enemyAbility.stat,
                ...Object.keys(enemyAbility.modifiers || {}),
                ...Object.keys(enemyAbility.enemyModifiers || {}),
              ]),
            ] as Stat[]),
    });
  if (a && a.round === b.round) {
    const name =
      battleCharacters.find((c) => c.id === a.character)?.name ||
      "Your character";
    notices.push({
      title: `${name} uses ${abilityName(a.character)}!`,
      description:
        uniquePowers[a.character] && a.modifiers
          ? uniqueDescription(a.character, a.stat, a.evolutionStage)
          : a.reveal
            ? `Opponent ${(a.revealStats || [a.stat]).join(", ")} revealed this round.`
            : a.shield
              ? `Your durability gains +${12 + (a.evolutionStage || 0) * 2} and combat gains +${6 + (a.evolutionStage || 0) * 2} this round (maximum 100).`
              : a.value !== undefined
                ? `Your ${a.stat} is rerolled to ${a.value} this round.`
                : `Your ${a.stat} gains +${8 + (a.evolutionStage || 0) * 2} this round (maximum 100).`,
      side: "player",
      stats: a.shield
        ? ["durability", "combat"]
        : a.swapEnemy
          ? ["power", "intelligence"]
          : a.modifiers
            ? ([
                ...new Set([
                  ...Object.keys(a.modifiers),
                  ...Object.keys(a.enemyModifiers || {}),
                ]),
              ] as Stat[])
            : a.revealStats || [a.stat],
    });
  }
  return notices;
}
export function activateAbility(
  b: Battle,
  stat: Stat,
  rng = Math.random,
  evolutionStage = 0,
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
  const stage = Math.max(0, Math.min(2, Math.floor(evolutionStage)));
  (next.usedAbilities ||= []).push(id);
  next.abilityRound = {
    round: b.round,
    character: id,
    stat,
    evolutionStage: stage,
    ...(id === "rick-6"
      ? {
          value:
            70 +
            stage * 5 +
            Math.floor(
              Math.max(0, Math.min(0.999999, rng())) * (31 - stage * 5),
            ),
        }
      : id === "dc-0"
        ? {
            reveal: true,
            revealStats: [
              stat,
              ...statKeys.filter((k) => k !== stat).slice(0, stage),
            ],
          }
        : id === "rangers-6"
          ? { shield: true }
          : {}),
  };
  if (uniquePowers[id] && id !== "rick-6" && id !== "rangers-6")
    Object.assign(next.abilityRound!, uniqueEffect(id, stat, stage, rng));
  const notice = abilityNotices(next).find((n) => n.side === "player" && n.title.includes(" uses "))!;
  next.log.unshift(`${notice.title}: ${notice.description}`);
  return next;
}
export function combatStats(b: Battle, id: string, base: Stats): Stats {
  const values = { ...base };
  const round = b.last ? b.round - 1 : b.round;
  const cursed = ritaCurse(b);
  if (cursed) {
    values[cursed] = Math.max(1, values[cursed] - 8);
  }
  const enemyAbility = b.opponentAbility;
  if (enemyAbility?.round === round) {
    modifyStats(values, enemyAbility.enemyModifiers);
    if (enemyAbility.swapEnemy)
      [values.power, values.intelligence] = [values.intelligence, values.power];
  }
  const a = b.abilityRound;
  if (a && a.round === round && a.character === id && !a.reveal) {
    if (a.modifiers) modifyStats(values, a.modifiers);
    else if (a.shield) {
      values.durability = Math.min(
        100,
        values.durability + 12 + (a.evolutionStage || 0) * 2,
      );
      values.combat = Math.min(
        100,
        values.combat + 6 + (a.evolutionStage || 0) * 2,
      );
    } else
      values[a.stat] =
        a.value ??
        Math.min(100, values[a.stat] + 8 + (a.evolutionStage || 0) * 2);
  }
  return applyPokemonMatchup(values, id, b.last?.aiId || b.ai[0]);
}
export function ritaCurse(b: Battle): Stat | undefined {
  if (b.ai[0]?.startsWith("pokemon-")) return undefined;
  if (b.chapter !== "titan" && (b.last?.aiId || b.ai[0]) !== "enemy-rita")
    return undefined;
  return statKeys[(b.last ? b.round - 1 : b.round) % statKeys.length];
}
export function rewardMatch(s: Save, b: Battle) {
  if (!b.result) return s;
  refreshPeriods(s);
  const seen = b.encountered || [...b.ai, ...(b.last ? [b.last.aiId] : [])];
  if (b.participants[0]?.startsWith("pokemon-")) s.pokemonSeen = [...new Set([...(s.pokemonSeen || []), ...seen])];
  const won = b.result === "player";
  const prizes = matchPrizes(b);
  if (won) {
    s.wins++;
    s.periods.dailyWins++;
    s.periods.weeklyWins++;
    if (b.scores[1] === 0) s.perfectWins++;
    new Set(b.participants.map((id) => getCharacter(id, s)!.franchise)).forEach(
      (f) => (s.franchiseWins[f] = (s.franchiseWins[f] || 0) + 1),
    );
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
