export const gymBadgeNames = ["Boulder", "Cascade", "Thunder", "Rainbow", "Soul", "Marsh", "Volcano", "Earth"];
const colors = ["#a49580", "#55a7d7", "#e7bc3c", "#74ae5e", "#ad69b6", "#d7a256", "#ee7950", "#68a87c"];
export function GymBadge({ index, earned = false }: { index: number; earned?: boolean }) {
  return <svg className={`gym-badge-icon ${earned ? "earned" : ""}`} viewBox="0 0 64 64" role="img" aria-label={`${gymBadgeNames[index]} Badge${earned ? ", earned" : ", not earned"}`}>
    <path d="M32 3 49 13 60 32 49 51 32 61 15 51 4 32 15 13Z" fill={earned ? colors[index] : "#e2ddd0"} stroke="#4b493f" strokeWidth="3" />
    <circle cx="32" cy="32" r="17" fill={earned ? "#fff6dc" : "#f2eee6"} stroke={earned ? colors[index] : "#aaa493"} strokeWidth="3" />
    <path d={index === 1 ? "M32 17Q13 38 32 46Q51 38 32 17Z" : index === 2 ? "M35 17 22 34H31L27 48 43 28H33Z" : index === 6 ? "M30 17Q37 27 40 23Q49 44 32 47Q15 44 23 29Q24 36 30 17Z" : index === 7 ? "M32 16Q49 25 38 42L26 48 27 35Q17 22 32 16Z" : "M32 17 46 32 32 47 18 32Z"} fill={earned ? colors[index] : "#b3ad9b"} />
  </svg>;
}
