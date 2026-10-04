# Custom hero artwork

The creator combines eight backgrounds and eight headless bodies generated as image atlases. Its eight helmet choices reuse the existing front-facing Ranger evolution artwork, cropped and masked in CSS; the new head atlas was rejected by image generation and was not retried.

All parts are displayed in a fixed front-facing pose. Head positioning and silhouette clipping are implemented in HeroArtwork.tsx and comic.css. Existing character cards retain their normal artwork.

## heads
A transparent sprite atlas EXACTLY 4 columns and 2 rows of 8 equal square cells. Each cell one original comic superhero HEAD with short straight neck only, no torso, no shoulders, no text, no gutters. Front-facing perfectly centered straight pose, neck joins centered at bottom edge of each cell. Same scale and eye height in every cell, no rotations. Bold ink vibrant comic artwork, clean crisp transparent surroundings. In reading order: red futuristic helmet with silver visor; blue angular helmet; gold knight helmet; green masked human face; purple alien humanoid face; black robotic helmet with cyan eyes; unmasked dark-skinned woman with short hair; unmasked light-skinned man with dark hair. Original designs, no existing characters. Game component sheet 2048x1024.

## bodies
A transparent sprite atlas EXACTLY 4 columns and 2 rows of 8 equal square cells. Each cell one original comic superhero BODY with NO HEAD from straight exposed neck stump to upper thighs. All front-facing, same upright symmetrical neutral standing pose, shoulders level, arms slightly away from sides, hands near hips. Centered neck stump TOP CENTER of each cell must align with interchangeable heads. Same proportions and silhouette, no cape over face, no weapon crossing neck. Bold ink vibrant comic artwork. Clean transparent surroundings, no text, no borders, no gutters. In reading order: red silver futuristic armor; blue white futuristic armor; gold knight chest armor; green black stealth suit; purple silver cosmic bodysuit; charcoal cyan robotic torso; orange cream explorer suit; white gold heroic armor. Original designs, no existing characters. Game component sheet 2048x1024.

## backgrounds
Exactly 4 columns and 2 rows of EIGHT equal square illustrated background panels for a comic superhero portrait game, no characters, no words, no borders, no gutters. Bold comic linework vibrant colour. In reading order: red sunset city rooftops; blue moonlit skyscrapers; green swirling cosmic portal; purple star nebula; golden desert temple; cyan futuristic laboratory; bright forest with mountains; orange volcanic landscape. Clear central area for foreground hero, evenly sized cells. 2048x1024.

