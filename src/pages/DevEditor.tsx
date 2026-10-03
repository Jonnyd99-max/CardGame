import { useState } from "react";
import { characters } from "../data/characters";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { rarities } from "../data/rarities";
import { items } from "../game/progression";
import { Card } from "../components/Card";
import { statKeys, type Character, type Rarity, type Save } from "../types";
export function DevEditor({ save }: { save: Save }) {
  const [c, setC] = useState<Character>(structuredClone(characters[0]));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">DEVELOPER WORKSHOP</span>
          <h1>
            Character <em>creator.</em>
          </h1>
          <p>
            Preview and export a character definition. Production data is never
            overwritten.
          </p>
        </div>
      </div>
      <div className="detail-layout">
        <Card character={c} save={save} />
        <div className="panel">
          <label>
            Existing template
            <select
              onChange={(e) =>
                setC(
                  structuredClone(
                    characters.find((c) => c.id === e.target.value)!,
                  ),
                )
              }
            >
              {characters.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
          </label>
          {(["id", "name", "description", "image", "color"] as const).map(
            (k) => (
              <label key={k}>
                {k}
                <input
                  value={c[k]}
                  onChange={(e) =>
                    setC({
                      ...c,
                      [k]: e.target.value,
                      ...(k === "image" ? { imageSheet: undefined } : {}),
                    })
                  }
                />
              </label>
            ),
          )}
          <label>
            Universe
            <select
              value={c.franchise}
              onChange={(e) =>
                setC({
                  ...c,
                  franchise: e.target.value,
                  theme: e.target.value,
                  group: groups.find((g) => g.franchise === e.target.value)!.id,
                })
              }
            >
              {franchises.map((f) => (
                <option value={f.id} key={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Group
            <select
              value={c.group}
              onChange={(e) => setC({ ...c, group: e.target.value })}
            >
              {groups
                .filter((g) => g.franchise === c.franchise)
                .map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Rarity
            <select
              value={c.rarity}
              onChange={(e) => setC({ ...c, rarity: e.target.value as Rarity })}
            >
              {Object.keys(rarities).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Unlock level
            <input
              type="number"
              min={1}
              max={100}
              value={c.unlockLevel}
              onChange={(e) =>
                setC({
                  ...c,
                  unlockLevel: Math.max(
                    1,
                    Math.min(100, Number(e.target.value)),
                  ),
                })
              }
            />
          </label>
          <div className="boost-grid">
            {statKeys.map((k) => (
              <label key={k}>
                {k}
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={c.baseStats[k]}
                  onChange={(e) =>
                    setC({
                      ...c,
                      baseStats: {
                        ...c.baseStats,
                        [k]: Math.max(1, Math.min(100, Number(e.target.value))),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Compatible weapon
            <select
              value={c.compatibleWeapons[0] || ""}
              onChange={(e) =>
                setC({ ...c, compatibleWeapons: [e.target.value] })
              }
            >
              {items
                .filter((i) => i.slot === "weapon")
                .map((i) => (
                  <option value={i.id} key={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="primary"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(c, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = `${c.id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export character JSON
          </button>
        </div>
      </div>
    </>
  );
}
