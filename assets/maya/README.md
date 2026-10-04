# Maya — TownSquare founder

`maya-character-sheet.svg` is the editable, transparent vector sheet. It contains three neutral turnaround views (front, three-quarter, side); five full-body poses (calm, wave, worried, celebrating, pointing); seven expressions; and closed, small-open and wide-open talking mouths. Figures use the same 260 × 350 coordinate system and scale. The celebration pose hops above its ground shadow.

Each individual view, pose, expression and mouth is also available as a separate SVG. No visible labels, logos or background rectangles are included. The SVGs contain native vector geometry, not embedded raster images. They are a geometric vector interpretation of the character brief, not an exact trace of the generated reference.

`maya-avatar.svg` is the matching shoulders-up speech-bubble portrait. Both portraits are also included on `../engineer/engineer-character-sheet.svg`.

`maya-reference.webp` is the separate AI-generated art reference. It has an alpha channel, but it has no editable anatomical layers. Generation used the built-in image-generation tool; the full original prompt and cleanup prompt are recorded in `generation-prompts.md`.

## Editing and animation

Every full-body SVG has named groups for `head`, `eyes`, `mouth`, `brows`, `torso`, `arm-left`, `arm-right`, `leg-left` and `leg-right`, plus hair and ground shadow. IDs include the pose prefix; `data-part` names are consistent across files. Groups carry Inkscape layer labels. Shoulder, hip, torso and head pivots are recorded as `data-pivot="x y"` in local SVG coordinates.

Animate a group using its local pivot. Facial groups can be swapped with the expression or mouth files. Use `maya-face-blink.svg` as the closed-eye expression. Keep the default art still under `prefers-reduced-motion`. The source assets are static. The course applies its existing breathing, blinking and result animations to the embedded groups, honoring reduced motion; this set does not include an automatic lip-sync engine.

Maya’s violet tunic, indigo hair, pale-gold pin, navy trousers and dark sneakers remain consistent. Flat fills use one shadow tone per material. Shadows are translucent flat ellipses, with no blur or gradients. The palette includes the requested accents, skin tones and neutral shades.

The application embeds the five poses as native SVG markup, so the downloaded course stays self-contained. The reference PNG and full character sheet are source art rather than additional runtime downloads.

Regenerate from the editable geometry in `scripts/build-characters.mjs` with `npm run build`. `npm run check` verifies the generated SVGs and course file are current.
