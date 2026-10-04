import { useState, useRef } from "react";
import { parseSave, SAVE_KEY } from "../state/save";
import { Modal } from "../components/UI";
import type { Save } from "../types";
import { GameModeToggle } from "../components/GameModeToggle";
export function SaveRecovery({
  message,
  restore,
  reset,
}: {
  message: string;
  restore: (save: Save) => void;
  reset: () => void;
}) {
  const [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <main className="onboarding">
      <GameModeToggle />
      <span className="eyebrow">YOUR PROGRESS MATTERS</span>
      <h1>
        Let’s restore
        <br />
        your <em>adventure.</em>
      </h1>
      <p>{message} Your stored file has been preserved.</p>
      <div className="button-row">
        <button
          className="secondary"
          onClick={() => {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return;
            const url = URL.createObjectURL(
              new Blob([raw], { type: "application/json" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = "jd-save-recovery.json";
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export original file
        </button>
        <button className="primary" onClick={() => input.current?.click()}>
          Import a backup
        </button>
        <button className="danger" onClick={() => setConfirm(true)}>
          Start fresh
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            if (file.size > 1000000) throw new Error("Save file too large.");
            restore(parseSave(await file.text()));
          } catch (error) {
            setError(
              error instanceof Error
                ? error.message
                : "Could not restore this file.",
            );
          }
          e.target.value = "";
        }}
      />
      {error && <p role="alert">{error}</p>}
      {confirm && (
        <Modal
          title="Replace the saved adventure?"
          onClose={() => setConfirm(false)}
        >
          <p>
            Export the original file first to keep a copy. Starting fresh
            removes the current browser save.
          </p>
          <button className="danger" onClick={reset}>
            Confirm fresh start
          </button>
        </Modal>
      )}
    </main>
  );
}
