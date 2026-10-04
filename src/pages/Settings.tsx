import { useState, useRef, useEffect } from "react";
import { Download, Upload } from "lucide-react";
import { getCharacters } from "../data/characters";
import { franchises } from "../data/franchises";
import { groups } from "../data/groups";
import { parseSave } from "../state/save";
import { Modal } from "../components/UI";
import { selectUniverse } from "../game/progression";
import { audio, audioEvents, type AudioEvent } from "../utils/audio";
import { themes } from "../data/themes";
import type { Save } from "../types";
export function Settings({
  save: s,
  update,
  replace,
  reset,
  notify,
  install,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
  replace: (s: Save) => void;
  reset: () => void;
  notify: (t: string) => void;
  install?: () => Promise<void>;
}) {
  const characters = getCharacters(s);
  const [confirm, setConfirm] = useState(false),
    [imported, setImported] = useState<Save | null>(null),
    [name, setName] = useState(s.name);
  const input = useRef<HTMLInputElement>(null);
  const [soundSample, setSoundSample] = useState<AudioEvent>("matchWin");
  useEffect(() => setName(s.name), [s.name]);
  function exportSave() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "jd-multiverse-save.json";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE THIS MULTIVERSE YOURS</span>
          <h1>
            Your <em>preferences.</em>
          </h1>
          <p>A universe that changes with you.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Identity & theme</h2>
          <label>
            Player name
            <input
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (name.trim())
                  update((x) => {
                    x.name = name.trim();
                  });
                else setName(s.name);
              }}
            />
          </label>
          <label>
            Favourite universe / active theme
            <select
              value={s.franchise}
              onChange={(e) =>
                update((x) => {
                  selectUniverse(x, e.target.value);
                })
              }
            >
              {franchises.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Favourite group
            <select
              value={s.group}
              onChange={(e) =>
                update((x) => {
                  x.group = e.target.value;
                })
              }
            >
              {groups
                .filter((g) => g.franchise === s.franchise)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Favourite character
            <select
              value={s.favourite}
              onChange={(e) =>
                update((x) => {
                  x.favourite = e.target.value;
                })
              }
            >
              {characters
                .filter((c) => s.owned.includes(c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <p>
            Universe colours change the interface and arena. Your favourite
            character features on your home screen and profile.
          </p>
          <div className="universe-preview">
            <strong>
              {franchises.find((f) => f.id === s.franchise)?.name}
            </strong>
            <p>{themes[s.franchise].arena} · Active comic theme</p>
          </div>
          <h2 className="spaced">Take it with you</h2>
          {install ? (
            <button className="primary" onClick={install}>
              Install JD Battle Cards
            </button>
          ) : (
            <p>
              Use your browser’s install menu. On iPhone, choose Share → Add to
              Home Screen. Installation and offline caching require the
              production build.
            </p>
          )}
        </section>
        <section className="panel">
          <h2>Motion & audio</h2>
          <label>
            Preview a sound
            <select
              value={soundSample}
              onChange={(e) => setSoundSample(e.target.value as AudioEvent)}
            >
              {audioEvents.map((event) => (
                <option key={event} value={event}>
                  {
                    {
                      impact: "Punch impact",
                      whoosh: "Fast attack",
                      blaster: "Blaster shot",
                      energy: "Energy attack",
                      roundWin: "Round victory",
                      roundLoss: "Round defeat",
                      draw: "Clash",
                      matchWin: "Match victory",
                      matchLoss: "Match defeat",
                      upgrade: "Power upgrade",
                      unlock: "Character unlock",
                      pack: "Pack opening",
                      equip: "Equip / acquire gear",
                      reward: "Reward claim",
                    }[event]
                  }
                </option>
              ))}
            </select>
          </label>
          <button
            className="secondary"
            onClick={async () => {
              update((x) => {
                x.settings.sound = true;
              });
              audio.enabled = true;
              const played = await audio.play(soundSample);
              notify(
                played
                  ? "Sound is enabled. Check device volume and whether this browser tab is muted if you cannot hear the test."
                  : "The browser could not start audio. Try opening the game in Safari or Chrome, then tap Test sound again.",
              );
            }}
          >
            Enable and test sound
          </button>
          {(["animations", "reducedMotion", "sound"] as const).map((k) => (
            <label className="toggle" key={k}>
              <span>
                {k === "animations"
                  ? "Card animations"
                  : k === "reducedMotion"
                    ? "Reduce motion"
                    : "Sound effects"}
              </span>
              <input
                type="checkbox"
                checked={s.settings[k]}
                onChange={(e) =>
                  update((x) => {
                    x.settings[k] = e.target.checked;
                  })
                }
              />
            </label>
          ))}
          <p>Your device’s reduced-motion preference is also respected.</p>
          <h2 className="spaced">Save & restore</h2>
          <p>
            Progress is stored in this browser. Export a backup to transfer it
            to another device.
          </p>
          <div className="button-row">
            <button className="secondary" onClick={exportSave}>
              <Download size={16} /> Export save
            </button>
            <button
              className="secondary"
              onClick={() => input.current?.click()}
            >
              <Upload size={16} /> Import save
            </button>
          </div>
          <input
            type="file"
            ref={input}
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                if (file.size > 1000000)
                  throw new Error("Save file too large.");
                setImported(parseSave(await file.text()));
              } catch (err) {
                notify(
                  err instanceof Error ? err.message : "Could not import save",
                );
              }
              e.target.value = "";
            }}
          />
          <button className="danger spaced" onClick={() => setConfirm(true)}>
            Reset progress
          </button>
        </section>
      </div>
      {confirm && (
        <Modal title="Start a new adventure?" onClose={() => setConfirm(false)}>
          <p>
            This removes the current browser save. Export a backup first if you
            want to keep it.
          </p>
          <button className="danger" onClick={reset}>
            Reset all progress
          </button>
        </Modal>
      )}
      {imported && (
        <Modal
          title="Replace your current save?"
          onClose={() => setImported(null)}
        >
          <p>
            Import {imported.name}’s collection of {imported.owned.length}{" "}
            cards. Export your current save first if you want a backup.
          </p>
          <button
            className="primary"
            onClick={() => {
              replace(imported);
              setImported(null);
              notify("Save restored successfully");
            }}
          >
            Import this save
          </button>
        </Modal>
      )}
    </>
  );
}
