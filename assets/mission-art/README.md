# TownSquare mission art

26 original native SVG assets and `mission-art-sheet.svg`, a transparent contact sheet. Open `preview.html` for labelled previews on navy and light backgrounds. The artwork itself has no visible text, logos, fonts, raster images, gradients or filters. `manifest.json` lists filenames, dimensions and descriptions.

## Contents

- Four rack frames: `server-rack-healthy.svg`, `server-rack-under-load.svg`, `server-rack-failing.svg` and `server-rack-failing-dim.svg`. Healthy lights are mint; load makes the top two units amber; failure makes the second unit red. The dim frame changes only that unit's light-group opacity. All rack frames share a 100 × 180 viewBox.
- `laptop-open.svg` (140 × 110), with mint abstract code lines; `tablet-chart.svg` (74 × 96), with blue chart blocks. Suggested placement in the characters' 260 × 350 coordinate system: laptop `translate(91 117) scale(.65)`; tablet `translate(107 119) scale(.62)`. Place held props behind the hands and adjust to the chosen pose.
- `townsquare-office.svg` (480 × 230): muted desk, plant and night-city window. It is an optional strip with transparent surrounding space, not a full-page background.
- `world-regions.svg` (450 × 240): an illustrative, simplified continent silhouette with `region-west`, `region-east` and `region-link` groups. Translucent concentric rings create a flat glow. It is not a political or navigational map.
- Ten individual confetti assets: square and circle in each of violet, mint, blue, amber and red. Plus `sparkle.svg`, `exclamation.svg`, `sweat-drop.svg`, `speech-tail-left.svg` and `speech-tail-right.svg`. Exclamation artwork uses paths, not a text character. The tails have an open top edge so they can join a navy speech bubble.
- Three 600 × 400 (3:2) postcards: `postcard-launch-day.svg`, `postcard-viral-night.svg`, `postcard-going-global.svg`. Their canvases are transparent, including around the scene silhouettes. The images contain no captions; names belong in the surrounding interface.

## Editing and animation

Every asset has a top-level group named after its file. Component groups have stable semantic IDs, `data-part` attributes and Inkscape layer labels. Rack bodies, units and lights; laptop screen and keyboard; tablet shell and chart; office furniture; continents, markers and route; and postcard figures are independently editable. Small postcard figures expose head, eyes, brows, mouth, torso, left/right arms and legs. Composite sheets prefix IDs to avoid collisions.

The assets are deliberately static. Animate failure by swapping the two failure files, or changing the `lights-1` group's opacity between 1 and .22. Under reduced motion, keep the bright red failure frame so status remains visible. Region markers expose local pivot coordinates. Confetti pieces can be translated and rotated independently. If multiple copies of an SVG are inserted inline, prefix IDs and update its `aria-labelledby` reference per instance; `<img>` use isolates IDs automatically.

Source geometry lives in `scripts/build-mission-art.mjs`. Run `npm run build` to regenerate; `npm run check` verifies generated files. The palette is limited to the supplied colors, skin tones and neutral shades. Flat shadow areas and translucent ellipses replace gradients and blur. These assets match the existing geometric character SVGs and do not introduce a new runtime dependency or change mission behavior.
