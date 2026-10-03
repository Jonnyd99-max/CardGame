import { Lock, Star } from "lucide-react";
import { rarities } from "../data/rarities";
import { franchises } from "../data/franchises";
import { powerFor, statsFor, unlockLevelFor } from "../game/progression";
import type { Character, Save } from "../types";
import { items } from "../game/progression";
import { ItemArtwork } from "./ItemArtwork";
export function Artwork({ character: c }: { character: Character }) {
  if (c.image && c.imageSheet) {
    const { columns, rows, index } = c.imageSheet;
    return (
      <div
        className="character-image artwork-sheet"
        role="img"
        aria-label={`${c.name}, comic illustration`}
        style={{
          backgroundImage: `url("${c.image}")`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: `${columns === 1 ? 0 : ((index % columns) / (columns - 1)) * 100}% ${rows === 1 ? 0 : (Math.floor(index / columns) / (rows - 1)) * 100}%`,
        }}
      />
    );
  }
  return c.image ? (
    <img className="character-image" src={c.image} alt={c.name} />
  ) : (
    <svg
      className="character-image"
      role="img"
      aria-label={`${c.name}, original placeholder illustration`}
      viewBox="0 0 300 330"
    >
      <defs>
        <radialGradient id={`g-${c.id}`}>
          <stop stopColor={c.color} stopOpacity=".48" />
          <stop offset="1" stopColor="#151523" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`body-${c.id}`} x2=".8" y2="1">
          <stop stopColor={c.color} />
          <stop offset="1" stopColor="#252336" />
        </linearGradient>
      </defs>
      <circle cx="150" cy="150" r="150" fill={`url(#g-${c.id})`} />
      <g stroke={c.color} fill="none" opacity=".2">
        <circle cx="150" cy="155" r="113" />
        <circle cx="150" cy="155" r="95" />
        <path d="M20 155h260M150 30v250M55 60l190 190M245 60 55 250" />
      </g>
      <path
        d={
          c.avatar % 2 === 0
            ? "M106 178 64 211 33 326h231l-31-115-39-33z"
            : "M106 178 76 195 48 330h211l-37-133-27-19z"
        }
        fill={`url(#body-${c.id})`}
      />
      <path d="m107 190 43 45 44-45-15 104h-61z" fill="#14151f" />
      <path d="m134 238 21-14-5 19h18l-27 34 6-26h-20z" fill={c.color} />
      <path
        d="m103 178-24 35 23 23 13-44m80-13 24 35-23 23-13-44"
        fill={c.color}
        opacity=".7"
      />
      <path
        d="M110 91q40-37 80 0l-3 61-19 32h-37l-20-30z"
        fill={`url(#body-${c.id})`}
      />
      <path
        d={
          c.avatar % 3 === 0
            ? "m111 110 39 11 39-11-6 33-32 7-34-9z"
            : "m114 114 30 8 7 15 9-16 27-8-5 23-24 10h-18l-22-10z"
        }
        fill="#080d19"
        stroke={c.color}
        strokeWidth="2"
      />
      <path d="m124 130 15 4m25 0 14-5" stroke="#f0faff" strokeWidth="4" />
      <path
        d="m132 163 18 7 18-7"
        fill="none"
        stroke={c.color}
        strokeWidth="3"
      />
      <g fill={c.color} opacity=".8">
        <circle cx="48" cy="85" r="3" />
        <circle cx="241" cy="171" r="2" />
        <circle cx="223" cy="52" r="3" />
      </g>
    </svg>
  );
}
export function Card({
  character: c,
  save: s,
  onClick,
  compact = false,
  locked = false,
  hideStats = false,
}: {
  character: Character;
  save: Save;
  onClick?: () => void;
  compact?: boolean;
  locked?: boolean;
  hideStats?: boolean;
}) {
  const p = s.cards[c.id];
  const stats = statsFor(c, s);
  const loadout = locked
    ? []
    : (p?.equipment || [])
        .map((id) => items.find((item) => item.id === id)!)
        .filter(Boolean)
        .sort(
          (a, b) =>
            Number(a.slot === "equipment") - Number(b.slot === "equipment"),
        );
  return (
    <button
      className={`battle-card ${compact ? "compact" : ""} ${locked ? "locked" : ""} ${p?.style === "holographic" ? "holo" : ""}`}
      style={
        {
          "--card-color": c.color,
          "--rarity": rarities[c.rarity],
        } as React.CSSProperties
      }
      onClick={onClick}
      aria-label={`${c.name}, ${c.rarity}${locked ? ", locked" : ""}`}
    >
      <div className="card-top">
        <span>
          {franchises.find((f) => f.id === c.franchise)?.symbol}{" "}
          {franchises.find((f) => f.id === c.franchise)?.name}
        </span>
        <span>
          {locked ? (
            <Lock size={14} />
          ) : s.favourite === c.id ? (
            <Star size={14} fill="currentColor" />
          ) : (
            `LV ${p?.level || 1}`
          )}
        </span>
      </div>
      <div className="card-art">
        <Artwork character={c} />
        {!!loadout.length && (
          <div className="card-loadout" aria-label="Equipped loadout">
            {loadout.map((item) => (
              <div
                className={`card-item ${item.slot}`}
                key={item.id}
                title={`${item.name} · Tier ${s.items[item.id] || 1}`}
              >
                <ItemArtwork item={item} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
        {locked && (
          <div className="lock-label">
            <Lock size={25} />
            <span>Unlock at level {unlockLevelFor(c, s)}</span>
          </div>
        )}
        {!hideStats && (
          <div className="power-badge">
            <strong>{powerFor(c, s)}</strong>
            <small>POWER</small>
          </div>
        )}
      </div>
      <div className="card-bottom">
        <small style={{ color: rarities[c.rarity] }}>
          ◆ {c.rarity.toUpperCase()}
        </small>
        <h3>{c.name}</h3>
        {hideStats ? (
          <div className="hidden-stats">STATS SEALED · REVEAL AFTER BATTLE</div>
        ) : (
          <div className="card-mini-stats">
            <span>
              STR <b>{stats.strength}</b>
            </span>
            <span>
              SPD <b>{stats.speed}</b>
            </span>
            <span>
              INT <b>{stats.intelligence}</b>
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
