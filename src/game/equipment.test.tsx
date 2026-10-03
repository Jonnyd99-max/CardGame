import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { characters } from "../data/characters";
import { weapons, rangerWeapons } from "../data/weapons";
import { items, compatible, toggleEquipment, statsFor } from "./progression";
import { newSave, parseSave } from "../state/save";
import { Card } from "../components/Card";

describe("illustrated personal loadouts", () => {
  it("gives each of the seven Mighty Morphin Rangers the correct exclusive personal weapon", () => {
    expect(Object.keys(rangerWeapons)).toHaveLength(7);
    for (const [id, weaponId] of Object.entries(rangerWeapons)) {
      const item = weapons.find((i) => i.id === weaponId)!;
      const ranger = characters.find((c) => c.id === id)!;
      expect(compatible(ranger, item)).toBe(true);
      expect(item.imageSheet).toBeDefined();
      expect(
        characters.filter((c) => compatible(c, item)).map((c) => c.id),
      ).toEqual([id]);
    }
    expect(items.every((i) => !!i.image)).toBe(true);
  });
  it("shows both item images on cards, replaces a weapon, removes it, and preserves gear", () => {
    const save = newSave("Explorer", "rangers", "rangers-0");
    const ranger = characters[0];
    save.items = { "power-sword": 1, shield: 1, "pulse-blade": 1 };
    expect(toggleEquipment(save, ranger.id, "shield")).toBe(true);
    expect(toggleEquipment(save, ranger.id, "power-sword")).toBe(true);
    const equipped = renderToStaticMarkup(
      <Card character={ranger} save={save} />,
    );
    expect(equipped).toContain('aria-label="Power Sword"');
    expect(equipped).toContain('aria-label="Aegis armour"');
    expect(statsFor(ranger, save).combat).toBe(ranger.baseStats.combat + 5);
    expect(parseSave(JSON.stringify(save)).cards[ranger.id].equipment).toEqual([
      "shield",
      "power-sword",
    ]);
    toggleEquipment(save, ranger.id, "pulse-blade");
    expect(save.cards[ranger.id].equipment).toEqual(["shield", "pulse-blade"]);
    toggleEquipment(save, ranger.id, "pulse-blade");
    expect(save.cards[ranger.id].equipment).toEqual(["shield"]);
    expect(
      renderToStaticMarkup(<Card character={ranger} save={save} />),
    ).not.toContain('aria-label="Power Sword"');
  });
  it("rejects wrong-Ranger, locked-character and unowned-item equips", () => {
    const save = newSave("Explorer", "rangers", "rangers-0");
    save.items["power-sword"] = 1;
    save.items["dragon-dagger"] = 1;
    expect(toggleEquipment(save, "rangers-1", "power-sword")).toBe(false);
    expect(toggleEquipment(save, "rangers-6", "dragon-dagger")).toBe(false);
    expect(toggleEquipment(save, "rangers-0", "scanner")).toBe(false);
    save.cards["rangers-1"].equipment = ["power-sword"];
    expect(() => parseSave(JSON.stringify(save))).toThrow();
  });
});
