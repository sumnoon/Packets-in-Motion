# Packets in Motion logo

The mark combines the project's initial **P** with a routing path. Two rounded packets traveling around the loop connect it to the course's animated requests. Blue, mint, and violet tie it to the existing interface.

## Assets

| File | Size | Use |
| --- | --- | --- |
| `logo.png` | 1254 × 1254 | Master transparent PNG; source for every other size |
| `logo-256.png` | 256 × 256 | README header, shown at 128 × 128 so it stays sharp on high-DPI screens |
| `logo-96.png` | 96 × 96 | Sidebar mark; shown at 44 × 44 |
| `favicon-32.png` | 32 × 32 | Browser tab icon |
| `social-preview.png` | 1280 × 640 | Repository social preview (Settings → General → Social preview) |

Every logo file keeps its transparency. The visible mark fills about two thirds of the square canvas (roughly 18% padding left, 16% right, 9% top, 7% bottom). Keep the square aspect ratio and that padding. Use on the course's navy background (`#0a0e16`) or a plain light background; avoid placing it over busy imagery. Pair the mark with live text, **Packets in Motion**, rather than baking lettering into the image.

`index.html` does not load `logo-96.png` or `favicon-32.png` from disk. It embeds its own copies as `data:image/png;base64` URLs so the course still works as a single offline file. Those embedded copies are kept in sync by hand: if you change either export, re-encode it and replace the matching data URL in `index.html`. The sidebar image has empty alternative text because the adjacent project name supplies its accessible label. The README image has descriptive alternative text.

## Creation

Generated with the built-in imagegen tool. The original is preserved in `logo.png`; the smaller exports are downscaled from it with Lanczos sampling. Near-transparent stray pixels (opacity ≤ 16%) left by generation were removed from the master before exporting.

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
