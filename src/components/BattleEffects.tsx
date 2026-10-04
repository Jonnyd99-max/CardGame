import { abilityNotices, type Battle } from "../game/battle";
import { uniquePowers } from "../game/uniquePowers";

export function BattleEffects({ battle: b }: { battle: Battle }) {
  const attack = b.last?.stat;
  const type =
    attack === "tech"
      ? "blaster"
      : attack === "speed"
        ? "dash"
        : attack === "special" || attack === "power"
          ? "energy"
          : "strike";
  const a = b.abilityRound;
  const round = b.last ? b.round - 1 : b.round;
  return (
    <div className="battle-effects" aria-hidden="true">
      {attack && (
        <div
          key={`attack-${b.round}`}
          className={`attack-trail attack-${type} from-${b.last?.chooser || "player"}`}
        >
          <span />
          <span />
          <span />
        </div>
      )}
      {abilityNotices(b).some((n) => n.title.includes("Moon Curse")) && (
        <div key={`curse-${round}`} className="ability-vfx vfx-curse">
          ✦<span>CURSED!</span>
        </div>
      )}
      {a?.round === round && (
        <div
          key={`ability-${round}-${a.character}`}
          className={`ability-vfx ${a.shield ? "vfx-shield" : a.value !== undefined ? "vfx-portal" : a.reveal ? "vfx-scan" : "vfx-focus"}`}
        >
          {a.shield ? "⬡" : a.value !== undefined ? "◎" : a.reveal ? "⌖" : "✦"}
          <span>
            {uniquePowers[a.character]?.name ||
              (a.shield
                ? "SHIELD!"
                : a.value !== undefined
                  ? "PORTAL!"
                  : a.reveal
                    ? "SCANNED!"
                    : "BOOST!")}
          </span>
        </div>
      )}
      {abilityNotices(b).some(
        (n) => n.side === "ai" && !n.title.includes("Moon Curse"),
      ) && (
        <div key={`enemy-${round}`} className="ability-vfx vfx-enemy">
          {b.opponentAbility?.round === round && b.opponentAbility.shield
            ? "⬡"
            : b.opponentAbility?.round === round &&
                b.opponentAbility.value !== undefined
              ? "◎"
              : "✹"}
          <span>
            {b.opponentAbility?.round === round
              ? uniquePowers[b.opponentAbility.character]?.name ||
                "BATTLE FOCUS!"
              : "POWER UP!"}
          </span>
        </div>
      )}
    </div>
  );
}
