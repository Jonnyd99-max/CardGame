# Comic character artwork

The Mighty Morphin and Rick and Morty illustrations were generated with the built-in ImageGen tool for the comic edition. Marvel and DC use existing comic character illustrations sourced from public Wikipedia character pages. See [sources.json](sources.json) for each downloaded image's original URL and character page. All 32 cards now display raster character artwork rather than the original generic SVG silhouettes.

Marvel and DC artwork remains copyrighted to its respective creators and publishers; the Wikipedia source pages describe the source images and their usage. No ownership or redistribution licence is claimed for those images.

Each landscape PNG has four columns and two rows. Character records use `imageSheet: { columns: 4, rows: 2, index }`; indices run left to right across the top row, then the bottom row. CSS displays one panel without modifying the generated image.

## Prompt set

Shared direction: landscape 2:1 character portrait atlas, exactly eight equal square panels in a four-column two-row grid, edge to edge without gaps, borders, text or logos. Recognizable authentic costumes, headroom, waist-up framing, vibrant hand-inked comic painting, dimensional cel shading, Ben-Day halftone, cream highlights and colourful character-specific backgrounds.

- `rangers-comic-atlas.png`: top row Red Ranger, Blue Ranger, Pink Ranger, Black Ranger; bottom row Yellow Ranger, White Ranger, Green Ranger, Lord Zedd. Original Mighty Morphin dinosaur helmets and diamond suits, White Ranger tiger armour, Green Ranger gold Dragon Shield. No Zeo or Space suits.
- Marvel and DC atlas generation was attempted with family-friendly character portraits but rejected by the image service. Those atlases are not bundled. Their card definitions instead reference the individual source images listed in `sources.json`.
- `rick-comic-atlas.png`: top row Morty, Summer, Beth, Jerry; bottom row Evil Morty, Birdperson, Rick, Phoenixperson. Recognizable animated-series designs, cosmic portal backgrounds, ink lines, colourful comic shading and halftone textures.

For standalone replacement artwork, set `image` to the new file path and remove `imageSheet`.
