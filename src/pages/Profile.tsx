import { progression } from "../data/unlocks";
import { getCharacters } from "../data/characters";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { Artwork } from "../components/Card";
import { Progress } from "../components/UI";
import { playerLevel, unlockLevelFor } from "../game/progression";
import { challenges } from "../data/challenges";
import type { Save } from "../types";
export function Profile({ save: s }: { save: Save }) {
  const characters = getCharacters(s);
  const c = characters.find((c) => c.id === s.favourite)!;
  return (
    <>
      <div className="profile-banner">
        <div>
          <span className="eyebrow">
            DIMENSIONAL EXPLORER · LEVEL {playerLevel(s.xp)}
          </span>
          <h1>{s.name}</h1>
          <p>
            {franchises.find((f) => f.id === s.franchise)?.name} /{" "}
            {groups.find((g) => g.id === s.group)?.name}
          </p>
          <p>Favourite legend: {c.name}</p>
          <Progress
            value={s.xp % progression.xpPerPlayerLevel}
            max={progression.xpPerPlayerLevel}
          />
          <small>
            {s.xp % progression.xpPerPlayerLevel} /{" "}
            {progression.xpPerPlayerLevel} XP to next player level
          </small>
        </div>
        <Artwork character={c} />
      </div>
      <div className="profile-stats">
        {[
          [s.wins, "Victories"],
          [s.losses, "Defeats"],
          [
            `${s.wins + s.losses ? Math.round((s.wins / (s.wins + s.losses)) * 100) : 0}%`,
            "Win rate",
          ],
          [
            `${Math.round((s.owned.length / characters.length) * 100)}%`,
            "Collection",
          ],
        ].map(([v, k]) => (
          <div className="panel" key={k}>
            <strong>{v}</strong>
            <small>{k}</small>
          </div>
        ))}
      </div>
      <div className="panel">
        <h2>Achievement cabinet</h2>
        <div className="deck-names">
          {challenges
            .filter((c) => c.period === "Permanent" && c.value(s) >= c.target)
            .map((c) => (
              <span key={c.id}>✦ {c.name}</span>
            ))}
        </div>
        {!challenges.some(
          (c) => c.period === "Permanent" && c.value(s) >= c.target,
        ) && <p>Your first achievement is waiting in the arena.</p>}
      </div>
      <div className="panel">
        <h2>Recent battles</h2>
        {s.history.length ? (
          s.history.map((b, i) => (
            <div className="history-row" key={i}>
              <b className={b.won ? "accent" : ""}>
                {b.won ? "Victory" : "Completed"}
              </b>
              <span>{b.mode}</span>
              <strong>{b.score}</strong>
              <small>{new Date(b.date).toLocaleDateString()}</small>
            </div>
          ))
        ) : (
          <p>No battles yet. Your story starts here.</p>
        )}
      </div>
    </>
  );
}
export function Groups({
  save: s,
  detail,
}: {
  save: Save;
  detail: (id: string) => void;
}) {
  const characters = getCharacters(s);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STRONGER TOGETHER</span>
          <h1>
            Teams & <em>groups.</em>
          </h1>
          <p>Discover the alliances that shape each universe.</p>
        </div>
      </div>
      {franchises.map((f) => (
        <section className="panel" key={f.id}>
          <h2 style={{ color: f.color }}>
            {f.symbol} {f.name}
          </h2>
          <div className="group-grid">
            {groups
              .filter((g) => g.franchise === f.id)
              .map((g) => (
                <div key={g.id}>
                  <h3>{g.name}</h3>
                  {characters
                    .filter((c) => c.group === g.id)
                    .map((c) => (
                      <button
                        className="group-character"
                        key={c.id}
                        onClick={() => detail(c.id)}
                      >
                        <span style={{ color: c.color }}>◆</span>
                        {c.name}
                        <small>
                          {s.owned.includes(c.id)
                            ? "Owned"
                            : `Level ${unlockLevelFor(c, s)}`}
                        </small>
                      </button>
                    ))}
                </div>
              ))}
          </div>
        </section>
      ))}
    </>
  );
}
