export type GameMode = "multiverse" | "pokemon";
export const MODE_KEY = "jd-battle-game-mode";
export const gameMode: GameMode =
  typeof localStorage !== "undefined" &&
  localStorage.getItem(MODE_KEY) === "pokemon"
    ? "pokemon"
    : "multiverse";
export const isPokemon = gameMode === "pokemon";

export function switchGameMode(mode: GameMode) {
  if (mode === gameMode) return;
  localStorage.setItem(MODE_KEY, mode);
  // Reload the roster and all dependent game systems together.
  location.reload();
}
