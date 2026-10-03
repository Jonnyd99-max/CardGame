import { useState } from "react";
import { Plus, Trash2, Check, Layers } from "lucide-react";
import { characters } from "../data/characters";
import { validateDeck } from "../game/progression";
import { Modal } from "../components/UI";
import type { Save, Deck, DeckRule } from "../types";
export function Decks({
  save: s,
  update,
}: {
  save: Save;
  update: (fn: (s: Save) => void) => void;
}) {
  const [edit, setEdit] = useState<Deck | null>(null),
    [deleting, setDeleting] = useState("");
  const error = edit ? validateDeck(edit, s) : "";
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">THE PERFECT COMBINATION</span>
          <h1>
            My <em>decks.</em>
          </h1>
          <p>Build a lineup of 4–12 unique owned characters.</p>
        </div>
        <button
          className="primary"
          onClick={() =>
            setEdit({
              id: crypto.randomUUID(),
              name: "New dimension",
              rule: "Mixed Universe",
              cards: [],
            })
          }
        >
          <Plus size={18} /> New deck
        </button>
      </div>
      <div className="equipment-grid">
        {s.decks.map((d) => (
          <div className="panel" key={d.id}>
            <Layers className="accent" size={36} />
            <span className="eyebrow">{d.rule}</span>
            <h2>{d.name}</h2>
            <p>{d.cards.length} characters</p>
            <div className="deck-names">
              {d.cards.map((id) => (
                <span key={id}>
                  {characters.find((c) => c.id === id)?.name}
                </span>
              ))}
            </div>
            <div className="button-row">
              <button
                className="secondary"
                onClick={() => setEdit(structuredClone(d))}
              >
                Edit
              </button>
              <button
                className="secondary"
                disabled={!!validateDeck(d, s)}
                onClick={() =>
                  update((x) => {
                    x.activeDeck = d.id;
                  })
                }
              >
                {s.activeDeck === d.id ? (
                  <>
                    <Check size={15} /> Active
                  </>
                ) : (
                  "Set active"
                )}
              </button>
              <button
                className="icon-button"
                aria-label={`Delete ${d.name}`}
                disabled={s.decks.length === 1}
                onClick={() => setDeleting(d.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <Modal title="Build your deck" onClose={() => setEdit(null)}>
          <label>
            Deck name
            <input
              value={edit.name}
              maxLength={40}
              onChange={(e) => setEdit({ ...edit, name: e.target.value })}
            />
          </label>
          <label>
            Deck rule
            <select
              value={edit.rule}
              onChange={(e) =>
                setEdit({ ...edit, rule: e.target.value as DeckRule })
              }
            >
              {["Mixed Universe", "Single Franchise", "Single Group"].map(
                (r) => (
                  <option key={r}>{r}</option>
                ),
              )}
            </select>
          </label>
          <div className="deck-picker">
            {s.owned.map((id) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={edit.cards.includes(id)}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      cards: e.target.checked
                        ? [...edit.cards, id]
                        : edit.cards.filter((c) => c !== id),
                    })
                  }
                />
                {characters.find((c) => c.id === id)?.name}
              </label>
            ))}
          </div>
          <p>{error || `${edit.cards.length} cards · ready to battle`}</p>
          <button
            className="primary"
            disabled={!!error || !edit.name.trim()}
            onClick={() => {
              update((x) => {
                const i = x.decks.findIndex((d) => d.id === edit.id);
                if (i >= 0) x.decks[i] = edit;
                else x.decks.push(edit);
              });
              setEdit(null);
            }}
          >
            Save deck
          </button>
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this deck?" onClose={() => setDeleting("")}>
          <p>Your cards stay in your collection.</p>
          <button
            className="danger"
            onClick={() => {
              update((x) => {
                x.decks = x.decks.filter((d) => d.id !== deleting);
                if (x.activeDeck === deleting) x.activeDeck = x.decks[0].id;
              });
              setDeleting("");
            }}
          >
            Delete deck
          </button>
        </Modal>
      )}
    </>
  );
}
