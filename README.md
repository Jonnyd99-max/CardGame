# JD Multiverse Battle Cards

A playable, local-first collectible Top Trumps game built with React, TypeScript and Vite. Collect 32 sample characters across Power Rangers, Marvel, Justice League/DC and Rick and Morty; build decks, choose stats, earn rewards and grow your collection. The comic edition uses raster character illustrations, cream paper, halftone textures and bold ink borders. The Rangers lineup is entirely Mighty Morphin, including White Ranger and Green Ranger.

## Run locally

Install Node.js 20.19+ (Node 22 LTS recommended), then:

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Production and tests:

```sh
npm test
npm run build
npx vite preview --host 0.0.0.0
```

Use HTTPS when hosting, or localhost, to enable service workers. Deploy the `dist` directory to any static host. For a subdirectory deployment, configure Vite's `base` and PWA paths accordingly. The Google Fonts enhancement falls back to system fonts offline.

## How to play

On first launch, enter your name, choose a universe and starter favourite, then play a short tutorial. You receive four starter cards, 350 coins and five materials. Highest selected stat wins the round; ties award no point. Both characters are visible, but opponent stats and power stay sealed until the round resolves. They are hidden again at the start of the next round. The winner chooses the next stat; tied rounds retain the current chooser. The AI uses its own card and public base-stat averages, never the player's current card or private upgrades.

- **Quick Battle:** best of three rounds.
- **Classic:** round winners capture both cards and any tied pot. Own the full deck to win. A 150-round safeguard uses remaining card counts; equal counts draw.
- **Best of:** select 5, 7 or 9 rounds; a majority ends the match early.
- **Team Battle:** each lineup fights over one round per team member.
- **Crossover Battle:** a round-limited match against cards from other universes.

In round-limited modes, ties consume a round and the final score may draw. Classic captured cards belong to the current match only, not the permanent collection. Leaving a match forfeits its unfinished progress without rewards. Match state is intentionally transient; completed rewards persist immediately.

Completed matches pay 4 XP and 6 coins per round played, plus 8 XP and 12 coins per round won. A match victory adds `12 + 2 × round limit` XP and `18 + 3 × round limit` coins. Materials award one per match victory, one per three rounds won, and one per six rounds played (maximum six). Each participating character receives two XP per round played, four per round won, and eight for a match victory. Classic rewards count at most 20 rounds played and 20 rounds won, with its victory bonus using a 20-round limit. Ties earn participation rewards without a round-win bonus; unfinished matches pay nothing. The result screen uses the same prize calculator as persistence.

You begin with four cards from your original chosen universe. Its later characters unlock at levels 5, 10, 20 and 30. Other universes unlock progressively at levels 8, 12, 16, 20, 24, 28, 35 and 40, rather than giving all 16 starter-tier cards after the first XP reward. Changing the favourite universe does not change the original starter entitlement. Existing saves migrate once: premature cards become locked, their training/equipment remain saved, and invalidated decks receive a valid starter lineup. XP, currency and match history remain intact.

Player levels award currency/materials and unlock eligible characters. Upgrade a character with 80 character XP, one material and level-scaled coins. Preview the next level's stats before confirming. Stat training adds up to five points per attribute. Equipment and weapons occupy separate slots and can be enhanced to tier three. Abilities grant modest stat bonuses. Stats never exceed configured maxima.

## Architecture

```text
src/
  components/  Card artwork, card rendering, modal and progress primitives
  pages/       Home, collection, battles, details, decks, rewards, settings
  game/        Pure battle rules, AI, progression, equipment and deck validation
  data/        Characters, franchises, groups, rarities, themes, abilities, gear, unlocks
  state/       Versioned persistence and import validation
  types/       Character, item, deck, player save and stat contracts
public/        PWA icon and replaceable static artwork
```

`App.tsx` owns navigation and immutable save updates. Game rules are independent of React. `saveStorage` is the persistence boundary: swap its methods for a server-backed repository when accounts/cloud saves are introduced. For multiplayer, the server should own match state, stat resolution and reward settlement. No account or paid-purchase infrastructure is present.

`hooks/useInstall.ts` handles eligible browser install prompts. `themes/effects.css` contains arena patterns and rarity/reveal effects; `utils/audio.ts` exposes semantic audio events with a registry for future licensed audio files. Use `npm run format` to format source and `npm run preview` to serve the production build.

## Add content

Character definitions live in `src/data/characters.ts`. Its compact sample generator builds full `Character` records; append records to the exported array or replace it with explicit data definitions. Add a unique ID, name, franchise/group IDs, rarity, description, image, unlock level, base/max stats, max level, ability IDs, compatibility lists, theme, tags, colour and placeholder avatar variant. All eight stat keys are required and use 1–100 values. Content should be validated and balanced when adding it. New characters appear automatically in collection, group pages, unlock logic and AI selection. Already eligible new content is granted on the next XP award.

`src/data/characterStats.ts` defines individual base-stat profiles for every character's usual powered/equipped form. These are game ratings rather than official rankings: Rick excels in intelligence/tech, Flash in speed, Superman in physical power, Billy in science, and Batman in tactics/combat. Physical and technical weaknesses keep stat selection meaningful. Existing character levels, training and equipment apply on top of the new base stats.

Add franchise entries in `src/data/franchises.ts`, groups in `src/data/groups.ts`, and a matching theme entry in `src/data/themes.ts`. Group membership is a character's `group` field. Add equipment/weapon definitions in their respective files and abilities in `abilities.ts`. Item restrictions support universal, franchise, group and character scopes. Character compatibility lists further identify permitted gear. Tune player XP, rewards, unlock pacing and deck sizes in `unlocks.ts`; character-specific unlock levels remain in character records. Rarity colours live in `rarities.ts`.

### Artwork

Put artwork you own or have permission to use in `public/artwork/`, then set a character's `image` to `/artwork/name.webp`. Empty paths use the original SVG illustration. Equipment supports image paths too. Avoid huge source images; use optimised WebP/AVIF/PNG. Mighty Morphin and Rick and Morty illustrations were generated with the built-in ImageGen tool; Marvel and DC use sourced comic artwork. See public/artwork/README.md for prompts, atlas mapping and source credits. Set imageSheet to undefined when replacing an atlas panel with a standalone image.

### Theme engine

Theme data defines accent, glow and arena name. These are exposed as CSS variables at the app root; components inherit them. Favourite universe changes the interface/arena palette, favourite character changes hero/profile artwork and character-card colours. Rarities have separate border treatments. Card detail offers original and holographic styles. Settings allow animations, reduced motion and a sound toggle. Sound is a persisted placeholder for a future audio service; no sound assets are included. Device reduced-motion preferences are respected automatically.

### Developer editor

Open `/#dev` after onboarding to edit/preview a template and export a character JSON record. It supports name, IDs, image, colour, stats, rarity, franchise, group, unlock level and weapon selection. Exports do not write production files; review and copy the data into the content catalogue.

## Saves and rewards

Saves are versioned JSON in localStorage under `jd-multiverse-v1`. They include collection, character progression, gear, settings, favourites, deck definitions, currencies, recent match history and challenge counters. Settings has Export, validated Import (with replacement confirmation), and confirmed Reset. Clearing browser data removes the save; export backups regularly. Import rejects unsupported versions and malformed records. Daily rewards and daily/weekly challenge boundaries use the device's local date; Monday starts the week. Local time/storage can be edited, so this is not an anti-cheat system. A backend should use authoritative clocks and award transactions.

An invalid existing save opens a recovery screen and preserves the stored file rather than replacing it with a fresh profile. Export the original file, restore a validated backup or explicitly confirm a fresh start. Save imports validate collection IDs, owned equipment/compatibility, levels, boosts, abilities, currencies, deck rules, settings and favourite references.

## PWA and accessibility

Production builds include a generated manifest and Workbox service worker. After an initial online visit, cached app assets work offline. Browsers offer installation through their normal install menu when eligible; iOS uses Share → Add to Home Screen. The original SVG mark is supplied with raster 192/512 icons; add platform-specific splash artwork for a production release. Responsive layouts accommodate touch screens, keyboard controls, focus outlines, labelled forms, dialog keyboard trapping and reduced motion. Browser storage must remain available for persistent progress.

## Testing

Vitest covers stat comparison, capture/tie logic, majority wins, AI stat selection, match/character rewards, XP levels, unlocks, equipment/ability modifiers and caps, compatibility, deck constraints, save round trips and malformed imports, and period resets. Build performs strict TypeScript checking before bundling.

## Next development

The intended extension points support online accounts/cloud saves, authoritative multiplayer, packs, tournaments, seasons, leaderboards, trading, richer animation/audio, mobile packaging and a backend admin catalogue. Add schema migration before changing the save contract. Before any public release, review character-name/franchise permissions and supply licensed artwork, balance long-term progression and test target mobile install behaviour.
