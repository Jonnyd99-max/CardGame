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

## Equipment atlas

`equipment-comic-atlas.png` was generated with the built-in ImageGen tool with a transparent background. It contains four columns and three rows; each item uses `imageSheet` to display its own panel. Equipped item images appear on character cards and in the equipment shop and loadout list.

Exact prompt:

> Create a game equipment sprite atlas on a genuinely TRANSPARENT alpha background. Landscape 4:3 composition, EXACTLY four columns and three rows: twelve evenly spaced isolated object illustrations, one centred object per cell. No text, no labels, no borders, no characters, no background, no cast shadows outside object. Leave generous transparent margins inside every cell so no object crosses a cell boundary. Vivid hand-inked comic illustration, bold clean black outlines, dimensional cel shading, crisp silver metal and bright coloured accents, collectible toy accessory look, recognizable original Mighty Morphin Power Rangers prop designs. Top row left to right: 1 Jason's Power Sword, long straight silver blade red-and-black hilt; 2 Billy's Power Lance, blue staff with spear point at each end; 3 Kimberly's Power Bow, pink angular bow with silver limbs; 4 Zack's Power Axe, black-and-silver axe with a broad curved blade and mechanical handle. Middle row left to right: 5 Trini's pair of Power Daggers, two yellow-handled silver daggers together; 6 Tommy's Green Ranger Dragon Dagger, short green-and-gold dagger with flute buttons and curved gold guard; 7 White Ranger Saba, long white-and-silver saber with detailed white tiger head hilt and gold trim; 8 generic Pulse Blade, glowing cyan futuristic sword. Bottom row left to right: 9 generic Nova Blaster, compact purple-and-silver ray blaster; 10 Aegis Armour, futuristic silver chestplate with cyan energy shield element; 11 Quantum Scanner, handheld green-screen futuristic scanner; 12 original Mighty Morphin Power Morpher, compact silver hexagonal belt buckle device with red accents and central circular gold dinosaur coin. Show each entire object, not cropped. Keep each panel independent and maintain the exact ordering and transparent background.

Character-weapon references include [Hasbro's Green Ranger Dragon Dagger](https://consumercare.hasbro.com/en-us/product/power-rangers-lightning-collection-mighty-morphin-green-dragon-dagger-premium-collectible-with-lights-and-sounds/BD517BD4-C1EE-4109-984F-40E1EA31AF90), [Hasbro's Blue Ranger Power Lance](https://consumercare.hasbro.com/en-us/product/power-rangers-lightning-collection-mighty-morphin-blue-ranger-power-lance-premium-roleplay-mmpr-cosplay-collectible/28FE7DC7-0800-4610-BDBE-76763EC3F26B), and the [licensed Power Rangers RPG weapon FAQ](https://retailers.renegadegamestudios.com/content/File%20Storage%20for%20site/Ranger%20Month/Power%20Rangers%20Roleplaying%20Game%20FAQ%201.21.pdf).
