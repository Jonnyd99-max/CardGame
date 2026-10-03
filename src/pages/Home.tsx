import { progression } from "../data/unlocks";
import {
  ArrowUpRight,
  ChevronRight,
  Swords,
  Gift,
  Target,
  Layers,
  Zap,
} from "lucide-react";
import { characters } from "../data/characters";
import { franchises } from "../data/franchises";
import { Card, Artwork } from "../components/Card";
import { Progress } from "../components/UI";
import { playerLevel } from "../game/progression";
import type { Save } from "../types";
export function Home({
  save: s,
  navigate,
  detail,
}: {
  save: Save;
  navigate: (page: string) => void;
  detail: (id: string) => void;
}) {
  const fav = characters.find((c) => c.id === s.favourite) || characters[0];
  const featured = s.owned
    .map((id) => characters.find((c) => c.id === id)!)
    .sort(
      (a, b) =>
        Number(b.franchise === s.franchise) -
        Number(a.franchise === s.franchise),
    )
    .slice(0, 4);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR NEXT ADVENTURE STARTS HERE</span>
          <h1>
            Welcome back, <em>{s.name}.</em>
          </h1>
          <p>Different universes. One ultimate collection.</p>
        </div>
        <div className="season-label">
          <span className="live-dot" /> GENESIS COLLECTION{" "}
          <small>01 / THE BEGINNING</small>
        </div>
      </div>
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-copy">
          <div className="pill">✦ THE MULTIVERSE IS YOURS</div>
          <h2>
            Worlds collide.
            <br />
            <span>Legends rise.</span>
          </h2>
          <p>
            Assemble your dream deck. Choose your strongest stat.
            <br className="desktop" /> Make your mark across the multiverse.
          </p>
          <button className="primary" onClick={() => navigate("Play")}>
            <Swords size={19} /> Enter the battle <ArrowUpRight size={19} />
          </button>
          <div className="hero-meta">
            <span>32 unique characters</span>
            <i /> <span>4 iconic universes</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit one" />
          <div className="orbit two" />
          <div className="floating-label">
            YOUR FEATURED LEGEND <b>{fav.name}</b>
          </div>
          <div
            className="hero-person"
            style={{ "--card-color": fav.color } as React.CSSProperties}
          >
            <Artwork character={fav} />
          </div>
          <span className="hero-number">01</span>
        </div>
      </section>
      <div className="overview">
        <div>
          <span className="overview-icon">
            <Layers />
          </span>
          <section>
            <small>YOUR COLLECTION</small>
            <strong>
              {s.owned.length}
              <span> / {characters.length} cards</span>
            </strong>
          </section>
          <Progress value={s.owned.length} max={characters.length} />
        </div>
        <div>
          <span className="overview-icon purple">
            <Swords />
          </span>
          <section>
            <small>BATTLES WON</small>
            <strong>
              {s.wins}
              <span> wins</span>
            </strong>
          </section>
          <small className="right-note">
            {s.wins + s.losses
              ? Math.round((s.wins / (s.wins + s.losses)) * 100)
              : 0}
            % win rate
          </small>
        </div>
        <div>
          <span className="overview-icon orange">
            <Zap />
          </span>
          <section>
            <small>PLAYER LEVEL</small>
            <strong>
              {playerLevel(s.xp)}
              <span> dimensional explorer</span>
            </strong>
          </section>
          <Progress
            value={s.xp % progression.xpPerPlayerLevel}
            max={progression.xpPerPlayerLevel}
          />
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Choose your universe</h2>
          <p>Every world has a legend. Find yours.</p>
        </div>
        <button
          className="text-button"
          onClick={() => navigate("Teams / Groups")}
        >
          Explore all <ChevronRight size={16} />
        </button>
      </div>
      <div className="universe-grid">
        {franchises.map((f, i) => (
          <button
            key={f.id}
            className={`universe-tile universe-${f.id}`}
            style={{ "--universe": f.color } as React.CSSProperties}
            onClick={() => navigate(`Collection:${f.id}`)}
          >
            <span className="universe-no">0{i + 1}</span>
            <span className="universe-symbol">{f.symbol}</span>
            <div>
              <small>{f.subtitle}</small>
              <h3>{f.name}</h3>
            </div>
            <ArrowUpRight size={21} />
          </button>
        ))}
      </div>
      <div className="section-heading">
        <div>
          <h2>
            Your battle-ready lineup{" "}
            <span className="count">{s.owned.length}</span>
          </h2>
          <p>A little potential. A whole lot of power.</p>
        </div>
        <button
          className="text-button"
          onClick={() => navigate("My Collection")}
        >
          View collection <ChevronRight size={16} />
        </button>
      </div>
      <div className="home-lower">
        <div className="home-cards">
          {featured.map((c) => (
            <Card
              key={c.id}
              character={c}
              save={s}
              compact
              onClick={() => detail(c.id)}
            />
          ))}
        </div>
        <div className="mission-panel">
          <span className="eyebrow">MORE TO DISCOVER</span>
          <button onClick={() => navigate("Rewards")}>
            <Gift />
            <div>
              <b>Your daily drop</b>
              <small>A new day. A new reward.</small>
            </div>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("Challenges")}>
            <Target />
            <div>
              <b>Chase your next milestone</b>
              <small>Challenges worth the battle.</small>
            </div>
            <ChevronRight />
          </button>
          <button onClick={() => navigate("Upgrade")}>
            <Zap />
            <div>
              <b>Unlock their potential</b>
              <small>Take your heroes further.</small>
            </div>
            <ChevronRight />
          </button>
          <div className="tip">✦ Every legend starts with a first battle.</div>
        </div>
      </div>
    </>
  );
}
