# Packets in Motion logo

The mark combines the project's initial **P** with a routing path. Two rounded packets traveling around the loop connect it to the course's animated requests. Blue, mint, and violet tie it to the existing interface.

## Assets

| File | Size | Use |
| --- | --- | --- |
| `logo.png` | 1254 × 1254 | Original transparent PNG; README and larger placements |
| `logo-96.png` | 96 × 96 | Sidebar mark; displayed at 44 × 44 for sharp rendering |
| `favicon-32.png` | 32 × 32 | Browser tab icon |

All three files preserve transparency. Keep the square aspect ratio and the padding included in the artwork. Use on the course's navy background (`#0a0e16`) or a plain light background; avoid placing it over busy imagery. Pair the mark with live text, **Packets in Motion**, rather than baking lettering into the image.

`index.html` embeds the two small exports as `data:image/png;base64` URLs so the course still works as a single offline file. If you replace either export, update its embedded copy too. The sidebar image has empty alternative text because the adjacent project name supplies its accessible label. The README image has descriptive alternative text.

## Creation

Generated with the built-in imagegen tool. The original is preserved in `logo.png`; the small exports were resized with high-quality bicubic sampling and alpha preserved.

Final generation prompt:

```text
Use case: logo-brand.
Asset type: primary standalone logo symbol for "Packets in Motion", an interactive system-design course where animated packets travel through servers, caches, load balancers and networks.
Primary request: design one polished, original, memorable compact symbol that unites a capital P with packets moving along a routing path. A bold continuous rounded track forms the upright and open looping bowl of the P; two tiny separated rounded-square packets on the path suggest forward travel. Precise geometry, optical balance, confident simple silhouette, modern editorial developer-tool identity.
Color palette: use the project's luminous request blue #4ea1ff, response mint #34d399 and restrained violet #a78bfa against genuine transparency. Solid flat color regions, carefully arranged so the P remains recognizable on dark navy #0a0e16 and white.
Style/medium: clean vector-like flat logo, crisp edges, substantial strokes, deliberately minimal and legible at 32 pixels.
Composition/framing: a single centered mark on a square transparent canvas, mark occupies about 82% of the canvas with even safe margins.
Constraints: actual transparent background; no text or wordmark; no shadow, glow, gradient, background tile, checkerboard, mockup, border, watermark, 3D, extra symbols or decorative network diagram. Do not imitate any existing brand.
```
