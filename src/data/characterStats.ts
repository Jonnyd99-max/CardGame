import type { Stats } from "../types";

// Game ratings for the character's usual powered/equipped form, on a 1–100 scale.
// These are gameplay interpretations, rather than official franchise rankings.
function profile(
  strength: number,
  speed: number,
  intelligence: number,
  combat: number,
  durability: number,
  power: number,
  special: number,
  tech: number,
): Stats {
  return {
    strength,
    speed,
    intelligence,
    combat,
    durability,
    power,
    special,
    tech,
  };
}

//                         STR SPD INT CMB DUR PWR SPC TEC
export const characterStats: Record<string, Stats> = {
  "rangers-0": profile(78, 75, 72, 90, 78, 80, 82, 65), // Jason: strength and leadership in combat.
  "rangers-1": profile(65, 70, 94, 72, 72, 76, 78, 95), // Billy: scientist and inventor.
  "rangers-2": profile(62, 86, 76, 82, 66, 75, 88, 62), // Kimberly: agility and precision.
  "rangers-3": profile(76, 83, 70, 88, 73, 77, 83, 60), // Zack: acrobatic martial arts.
  "rangers-4": profile(70, 82, 78, 87, 75, 77, 84, 64), // Trini: disciplined, balanced fighter.
  "rangers-5": profile(85, 85, 77, 95, 89, 94, 95, 73), // Tommy: White Tiger powers and Saba.
  "rangers-6": profile(88, 83, 75, 96, 87, 92, 96, 70), // Tommy: Dragon Shield and Dragonzord.
  "rangers-7": profile(90, 62, 86, 83, 93, 97, 98, 85), // Zedd: magic, monsters and alien technology.
  "marvel-0": profile(82, 91, 91, 85, 79, 82, 95, 86), // Spider-Man: spider-sense, agility and science.
  "marvel-1": profile(87, 84, 97, 76, 90, 93, 89, 99), // Iron Man: armour and engineering.
  "marvel-2": profile(64, 72, 81, 97, 76, 60, 82, 58), // Captain America: tactics, shield and fighting skill.
  "marvel-3": profile(38, 75, 87, 96, 46, 35, 79, 83), // Black Widow: espionage and martial arts.
  "marvel-4": profile(76, 78, 67, 97, 98, 76, 96, 37), // Wolverine: regeneration and adamantium.
  "marvel-5": profile(44, 69, 79, 77, 52, 67, 78, 91), // Star-Lord: cosmic gadgets and improvisation.
  "marvel-6": profile(98, 87, 76, 93, 98, 99, 98, 39), // Thor: godlike strength and lightning.
  "marvel-7": profile(99, 69, 95, 94, 99, 97, 92, 92), // Thanos: formidable even without the Infinity Stones.
  "dc-0": profile(45, 72, 96, 98, 57, 38, 86, 96), // Batman: detective, strategist and gadget expert.
  "dc-1": profile(58, 99, 87, 78, 71, 94, 99, 77), // Flash: Speed Force and forensic science.
  "dc-2": profile(96, 92, 85, 99, 96, 95, 94, 48), // Wonder Woman: Amazon warrior and divine gifts.
  "dc-3": profile(42, 85, 85, 96, 49, 36, 83, 85), // Nightwing: acrobatics and trained combat.
  "dc-4": profile(35, 65, 90, 66, 73, 98, 99, 30), // Raven: empathy, soul-self and powerful magic.
  "dc-5": profile(94, 80, 77, 91, 95, 90, 96, 45), // Aquaman: Atlantean physiology and marine command.
  "dc-6": profile(99, 96, 84, 86, 99, 99, 98, 55), // Superman: Kryptonian strength, speed and senses.
  "dc-7": profile(99, 72, 96, 92, 99, 99, 99, 94), // Darkseid: New God and Omega Effect.
  "rick-0": profile(24, 43, 62, 37, 40, 29, 76, 65), // Morty: adaptability and surprising resourcefulness.
  "rick-1": profile(32, 53, 74, 62, 45, 36, 72, 68), // Summer: confidence and practical survival skills.
  "rick-2": profile(30, 44, 90, 42, 40, 28, 69, 72), // Beth: surgical expertise and scientific aptitude.
  "rick-3": profile(20, 28, 30, 18, 35, 16, 43, 24), // Jerry: ordinary human with occasional lucky breaks.
  "rick-4": profile(28, 48, 98, 61, 46, 79, 97, 98), // Evil Morty: manipulation and multiverse engineering.
  "rick-5": profile(69, 86, 76, 90, 74, 69, 88, 73), // Birdperson: flight and veteran combat experience.
  "rick-6": profile(30, 45, 99, 64, 43, 87, 98, 99), // Rick: portal technology and extraordinary science.
  "rick-7": profile(89, 91, 73, 95, 94, 91, 93, 96), // Phoenixperson: cybernetic weapons and armour.
};
