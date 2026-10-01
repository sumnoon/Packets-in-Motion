# Packets in Motion logo

The mark combines the project's initial **P** with a routing path. Two rounded packets traveling around the loop connect it to the course's animated requests. Blue, mint, and violet tie it to the existing interface.

## Assets

| File | Size | Use |
| --- | --- | --- |
| `logo.png` | 1254 × 1254 | Master transparent PNG; source for every other size |
| `logo-256.png` | 256 × 256 | README header, shown at 128 × 128 so it stays sharp on high-DPI screens |
| `logo-96.png` | 96 × 96 | Sidebar mark; shown at 44 × 44 |
| `favicon-32.png` | 32 × 32 | Browser tab icon |
| `social-preview.png` | 1280 × 640 | Repository social preview (Settings → General → Social preview), README hero and the page's `og:image` |
| `social-preview.html` | 1280 × 640 | Source of `social-preview.png` |
| `lab-screenshot.png` | 1400 × 783 | README image of an architecture lab; the social preview crops it |

Every logo file keeps its transparency. The visible mark fills about two thirds of the square canvas (roughly 18% padding left, 16% right, 9% top, 7% bottom). Keep the square aspect ratio and that padding. Use on the course's navy background (`#0a0e16`) or a plain light background; avoid placing it over busy imagery. Pair the mark with live text, **Packets in Motion**, rather than baking lettering into the image.

`index.html` does not load `logo-96.png` or `favicon-32.png` from disk. It embeds its own copies as `data:image/png;base64` URLs so the course still works as a single offline file. `npm run build` creates those data URLs from the files in `assets/`, so after changing either export, rebuild and commit `index.html`. The sidebar image has empty alternative text because the adjacent project name supplies its accessible label. The README image has descriptive alternative text.

## Social preview and lab screenshot

`lab-screenshot.png` is a real frame of the URL shortener lab, 9.6 s into a load test, just after an app server crashed. It was captured from the built `index.html` in headless Chrome at 2× and downscaled to 1400 px wide. The design was loaded from a share link, and the run was started with the Run load test button, so no keyboard shortcut letters show.

`social-preview.html` lays out the preview: the title, the tagline, three pills, and a crop of `lab-screenshot.png`. To refresh it (for example when the lesson count changes), edit the HTML, open it in Chrome at exactly 1280 × 640 and save a screenshot as `social-preview.png`. Then upload it again under the repository's Settings → General → Social preview. The page's `og:image` points at the deployed copy, so it updates on the next deploy.

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
