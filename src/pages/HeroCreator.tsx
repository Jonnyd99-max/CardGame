import { useState } from "react";
import { Card } from "../components/Card";
import { statKeys, type Save, type Stats } from "../types";
import {
  customHeroId,
  heroCharacter,
  saveHero,
  transferPoint,
} from "../game/customHeroes";
import { franchises } from "../data/franchises";
const heads = [
  "Red Ranger helmet",
  "Blue Ranger helmet",
  "Pink Ranger helmet",
  "Black Ranger helmet",
  "Yellow Ranger helmet",
  "White Ranger helmet",
  "Green Ranger helmet",
  "Armoured red helmet",
];
const bodies = [
  "Crimson armour",
  "Blue armour",
  "Knight armour",
  "Stealth suit",
  "Cosmic suit",
  "Cyber armour",
  "Explorer suit",
  "White-gold armour",
];
const backgrounds = [
  "Sunset rooftops",
  "Moonlit city",
  "Portal",
  "Nebula",
  "Desert temple",
  "Laboratory",
  "Mountain forest",
  "Volcano",
];
export function HeroCreator({
  save: s,
  update,
  notify,
  navigate,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
  notify: (text: string) => void;
  navigate: (page: string) => void;
}) {
  const [name, setName] = useState(s.customHero?.name || ""),
    [stats, setStats] = useState<Stats>(
      s.customHero?.stats ||
        (Object.fromEntries(statKeys.map((k) => [k, 70])) as Stats),
    ),
    [look, setLook] = useState(
      s.customHero?.look || { head: 0, body: 0, background: 0 },
    ),
    [franchise, setFranchise] = useState(
      s.customHero?.franchise || s.franchise,
    ),
    [donor, setDonor] = useState<(typeof statKeys)[number]>("strength");
  const draft = { name: name.trim() || "Your hero", franchise, stats, look };
  const preview = {
    ...s,
    customHero: draft,
    owned: [...s.owned.filter((id) => id !== customHeroId), customHeroId],
    cards: {
      ...s.cards,
      [customHeroId]: s.cards[customHeroId] || {
        level: 70,
        xp: 0,
        equipment: [],
        boosts: {},
        abilities: [],
        style: "original",
        wins: 0,
      },
    },
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR ORIGINAL LEGEND</span>
          <h1>
            Make your <em>own hero.</em>
          </h1>
          <p>
            Starts at card level 70. Eight stats share 560 points—an average of
            70.
          </p>
        </div>
      </div>
      <div className="hero-creator-layout">
        <div className="hero-creator-preview">
          <Card character={heroCharacter(draft)} save={preview} />
        </div>
        <div>
          <section className="panel">
            <h2>Identity</h2>
            <label>
              Hero name
              <input
                maxLength={24}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your hero"
              />
            </label>
            <label>
              Universe
              <select
                disabled={!!s.customHero}
                value={franchise}
                onChange={(e) => setFranchise(e.target.value)}
              >
                {franchises.map((f) => (
                  <option value={f.id} key={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="panel">
            <h2>
              Balance your stats · {statKeys.reduce((n, k) => n + stats[k], 0)}
              /560
            </h2>
            <p>
              Every +1 takes one point from your selected balancing stat. Every
              −1 returns a point to it. Values stay between 1 and 100.
            </p>
            <label>
              Balancing stat
              <select
                value={donor}
                onChange={(e) => setDonor(e.target.value as typeof donor)}
              >
                {statKeys.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <div className="hero-stat-editor">
              {statKeys.map((k) => (
                <div key={k}>
                  <span>
                    {k}
                    {k === donor ? " · Balancing stat" : ""}
                  </span>
                  <button
                    aria-label={`Decrease ${k}`}
                    disabled={transferPoint(stats, k, donor, -1) === stats}
                    onClick={() => setStats(transferPoint(stats, k, donor, -1))}
                  >
                    −
                  </button>
                  <strong>{stats[k]}</strong>
                  <button
                    aria-label={`Increase ${k}`}
                    disabled={transferPoint(stats, k, donor, 1) === stats}
                    onClick={() => setStats(transferPoint(stats, k, donor, 1))}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <h2>Build your look</h2>
            <p>
              All creator parts use the same front-facing pose and neck
              position.
            </p>
            {[
              ["background", backgrounds],
              ["head", heads],
              ["body", bodies],
            ].map(([key, names]) => (
              <label key={key as string}>
                {`Hero ${key}`}
                <select
                  value={look[key as keyof typeof look]}
                  onChange={(e) =>
                    setLook({
                      ...look,
                      [key as string]: Number(e.target.value),
                    })
                  }
                >
                  {(names as string[]).map((n, i) => (
                    <option value={i} key={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </section>
          <button
            className="primary"
            disabled={!name.trim()}
            onClick={() => {
              update((x) => {
                saveHero(x, { name: name.trim(), franchise, stats, look });
              });
              notify("Your hero is saved. Add it to a team in My Decks.");
            }}
          >
            {s.customHero ? "Save hero changes" : "Create my hero"}
          </button>
          <button className="secondary" onClick={() => navigate("My Decks")}>
            Build a team
          </button>
          <p className="tip">
            One custom hero per save. Editing preserves its training and
            equipment. Changes stay balanced and are included in save exports.
          </p>
        </div>
      </div>
    </>
  );
}
