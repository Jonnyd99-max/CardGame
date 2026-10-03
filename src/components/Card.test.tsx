import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Card } from "./Card";
import { characters } from "../data/characters";
import { newSave, parseSave } from "../state/save";

describe("comic edition", () => {
  const ranger = characters.find((c) => c.id === "rangers-0")!;
  const save = newSave("Explorer", "rangers", ranger.id);
  it("does not expose opponent stat values or power before a fight", () => {
    const html = renderToStaticMarkup(
      <Card character={ranger} save={save} hideStats />,
    );
    expect(html).toContain("STATS SEALED");
    expect(html).not.toContain("power-badge");
    expect(html).not.toContain("card-mini-stats");
    const revealed = renderToStaticMarkup(
      <Card character={ranger} save={save} />,
    );
    expect(revealed).toContain("power-badge");
    expect(revealed).toContain("card-mini-stats");
    expect(revealed).not.toContain("STATS SEALED");
  });
  it("keeps the entire Rangers collection in Mighty Morphin with Green replacing Silver", () => {
    const lineup = characters.filter((c) => c.franchise === "rangers");
    expect(lineup.every((c) => c.group === "morphin")).toBe(true);
    expect(lineup.find((c) => c.id === "rangers-6")?.name).toBe("Green Ranger");
    expect(lineup.find((c) => c.id === "rangers-5")?.name).toBe("White Ranger");
  });
  it("migrates old Rangers groups while preserving collection and progress", () => {
    const old = { ...save, group: "space", favourite: "rangers-0", coins: 987 };
    delete old.presentationVersion;
    const migrated = parseSave(JSON.stringify(old));
    expect(migrated.group).toBe("morphin");
    expect(migrated.owned).toEqual(save.owned);
    expect(migrated.cards).toEqual(save.cards);
    expect(migrated.coins).toBe(987);
    expect(migrated.presentationVersion).toBe(2);
  });
});
