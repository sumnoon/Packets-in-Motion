# The engineer — TownSquare's problem solver

`engineer-character-sheet.svg` is the transparent, editable sheet: three turnaround views, four full-body poses (typing, thinking, pointing and celebrating), six expressions (neutral, focused, thinking, concerned, delighted and blink), and shoulders-up portraits of both characters. Full bodies share Maya's 260 × 350 coordinate system and scale.

Every view, pose and expression also has a standalone SVG. `engineer-avatar.svg` and `../maya/maya-avatar.svg` are the speech-bubble portraits. Open `preview.html` to compare the sheet, small poses, portraits and generated reference on the course's navy background.

The fixed character has medium-brown skin, short dark hair, round dark glasses in every pose and expression, a mint zip hoodie, white lanyard with blank ID badge, navy jeans and dark sneakers. There are no visible labels, logos or background rectangles. Flat translucent ground shadows use no blur or gradients.

## Editable layers and runtime

Native vector groups expose `head`, `eyes`, `mouth`, `brows`, `glasses`, `torso`, `arm-left`, `arm-right`, `leg-left` and `leg-right`. Anatomical groups include local `data-pivot` coordinates and Inkscape layer labels. IDs are unique within each file. The application prefixes IDs per instance when embedding the four poses, preserving animation hooks and the existing reduced-motion behavior. No images need downloading at runtime; the course remains a self-contained HTML file.

`engineer-reference.webp` is the separate AI-generated raster art reference with an alpha channel. The SVGs are independently authored geometric interpretations, not exact traces of the PNG. The raster has no editable anatomical layers. The original and correction prompts are in `generation-prompts.md`.

Edit geometry in `scripts/build-characters.mjs`, then run `npm run build`. `npm run check` detects stale generated assets and course markup. The source SVGs are static; expressions and mouth groups can be swapped by a future animation controller.
