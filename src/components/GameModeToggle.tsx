import { gameMode, switchGameMode } from "../game/gameMode";

export function GameModeToggle({
  beforeSwitch,
}: {
  beforeSwitch?: () => void;
}) {
  return (
    <div className="game-mode-toggle" role="group" aria-label="Game mode">
      {(["multiverse", "pokemon"] as const).map((mode) => (
        <button
          key={mode}
          aria-pressed={gameMode === mode}
          onClick={() => {
            if (mode !== gameMode) {
              beforeSwitch?.();
              switchGameMode(mode);
            }
          }}
        >
          {mode === "pokemon" ? "Pokémon" : "Multiverse"}
        </button>
      ))}
    </div>
  );
}
