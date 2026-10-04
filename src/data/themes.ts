import { pokemonTypes } from "./pokemon";
export const themes: Record<
  string,
  { accent: string; glow: string; arena: string }
> = {
  rangers: {
    accent: "#dc303c",
    glow: "#ffd762",
    arena: "Mighty Morphin Command Centre",
  },
  marvel: { accent: "#dc323b", glow: "#ffe7ab", arena: "Comic city" },
  dc: { accent: "#345aaa", glow: "#bcd8f0", arena: "Heroic skyline" },
  rick: { accent: "#168653", glow: "#dbf49c", arena: "Portal dimension" },
};

for (const type of pokemonTypes)
  themes[type.id] = {
    accent: type.color,
    glow: type.color,
    arena: `${type.name} · Kanto battle arena`,
  };
