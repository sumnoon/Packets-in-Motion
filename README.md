<p align="center">
  <img src="assets/logo-256.png" width="128" height="128" alt="Packets in Motion logo: a P-shaped route with traveling packets">
</p>

<h1 align="center">Packets in Motion</h1>

<p align="center"><strong>System design, explained by watching it happen.</strong></p>

An animated, interactive course that takes you from "how do two computers talk?" to consensus, distributed transactions and a full URL-shortener design. Every concept is taught through motion: glowing requests leave light trails between servers, caches fill up, servers fail and traffic reroutes. Then you solve a hands-on challenge for each lesson.

![Packets in Motion: system design, explained by watching it happen](assets/social-preview.png)

## Run it

**Live:** [sumnoon.github.io/Packets-in-Motion](https://sumnoon.github.io/Packets-in-Motion/)

Or run it offline: `index.html` is a single self-contained file with no dependencies and no network requests. Download it and open it in any modern browser. That's it.

## What's inside

32 chapters in 9 sections, from zero to advanced:

| Section | Chapters |
| --- | --- |
| Start Here | How computers talk: packets, IP addresses & ports |
| Foundations | Client–server & typing a URL · Latency vs throughput, vertical vs horizontal scaling · Autoscaling |
| Traffic | Load balancers · Sessions: sticky vs shared storage · Reverse proxies & API gateways · CDNs & edge caching · Rate limiting |
| Data | SQL vs NoSQL · Indexing · Replication · Sharding · Caching & LRU · Cache expiry (TTL) & invalidation · Hot keys & request coalescing · CAP & consistency |
| Communication | REST vs gRPC vs WebSockets · Message queues & pub/sub · Sync vs async |
| Reliability | SPOFs & redundancy · Timeouts & deadlines · Health checks, failover, circuit breakers, retries · Idempotency |
| Architecture | Monolith vs microservices · Event-driven · Observability |
| Advanced | Consensus & leader election (Raft) · Two-phase commit & sagas · Snowflake IDs · Back-pressure & load shedding |
| Capstone | Design a URL shortener, end to end |

Each chapter has a 28–62 s animation, play/pause/replay, a scrubber with step markers, synced captions, and a "When to use it / Trade-offs" card at the end.

## Challenges

Every lesson ends with a hands-on challenge played on the same stage, scored with 1–3 stars (saved in your browser and shown in the sidebar). A few examples:

- **Be the load balancer**: route requests by hand for 30 seconds without overflowing a server.
- **Survive launch day**: pick machine sizes and counts, then watch traffic climb and a machine crash.
- **Beat LRU**: choose what to evict from a tiny cache and try to match the algorithm.
- **Keep it serving**: promote a follower the moment the leader dies.
- **Stop the retry storm**: tune retries, backoff, jitter and a circuit breaker through an outage.
- **Find the culprit**: use metrics, logs and a trace to find a slow service.
- **Launch the shortener**: build the whole system and survive a viral spike, a dead server and a bot attack.

The rest use the same kinds of mechanics: sort cards into boxes, put steps in order, or tune a system and run it.

Each section with more than one chapter ends with a **section quiz**: six multiple-choice questions with an explanation for every answer, scored with stars like the challenges. A miss names the chapter worth rewatching.

## Learning tools

- **Search** the sidebar (press `/`) by title, caption or trade-off: "stampede", "429" or "leader" all find the right chapters.
- **Glossary:** key terms in captions, the transcript and the trade-offs are underlined; hover, focus or tap one for a one-line definition. Press G for the full glossary, with links to every chapter that uses each term.
- **Before this / Related:** the trade-offs card links to the chapters a lesson builds on and the ones that go further.
- **Export / import progress** from the sidebar. Progress lives in your browser, so this is how you move it to another browser or keep a backup. Importing merges: nothing you have already earned is lost.
- **Sound cues** (off by default): soft tones for right and wrong moves, new steps and results. They are synthesized in the browser; nothing is downloaded.

## Visual language

The project logo traces a **P** with a routing path and two traveling packets, using the course's blue, mint, and violet palette. Transparent logo assets and usage notes are in [assets/BRAND.md](assets/BRAND.md).

- Servers are rounded rectangles, databases are cylinders, users are circles, and requests are glowing dots.
- **Blue** = request · **green** = success / response · **red** = failure · **amber** = cached / queued.

## Controls

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← / → | Seek 2 s |
| `[` / `]` | Previous / next chapter |
| P | Start the chapter's challenge (Esc to leave) |
| 1–9 | Jump to a step |
| C | Toggle captions |
| S | Transcript: every step as text; click one to jump there |
| T | Trade-offs card |
| F | Fullscreen |
| / | Search chapters |
| G | Glossary |

In a challenge, number keys (or letters, in the put-in-order games) do everything the mouse does; each target on the stage shows its key.

On phones the course runs in landscape. Held upright, it asks you to rotate the phone and pauses until you do.

## Accessibility

- **Screen readers:** each step is announced as it plays (title and caption), the stage is labelled with the current step, and the transcript (S) lists every step as text. The sidebar reads each chapter's number, title, whether you've watched it and your stars.
- **Keyboard only:** every lesson control and every challenge works without a mouse. Challenge status lines name the cards, slots and targets so you know which key does what.
- **Themes:** pick Dark, Light or High contrast at the bottom of the sidebar. The stage stays dark in Light (it's the video); High contrast also brightens labels and lines on the stage. High contrast is chosen for you if your system asks for more contrast.
- **Reduced motion** stills the drifting background and tones down the particle bursts.

## How it works

Everything is drawn on a `<canvas>` by code. Each chapter is a pure `draw(t)` function, so `seek(t)` reproduces any moment exactly, whether you scrub, replay or jump. Simulations such as least-connections balancing, token and leaky buckets and queue backlogs are computed once when the page loads, never frame by frame.

## Development

`index.html` is generated from the files in `src/`. Edit those, then rebuild:

| Path | What it holds |
| --- | --- |
| `src/page.html` | The page skeleton. Its `<!-- include: … -->` lines set which files go in and in what order. |
| `src/styles.css` | All styles |
| `src/engine.js` | Drawing primitives: servers, databases, packets, easing |
| `src/chapters/<id>.js` | One lesson each: beats, trade-offs and `draw(t)` |
| `src/challenges/<id>.js` | One challenge each. `_mechanics.js` holds the shared game types. |
| `src/quizzes/<section>.js` | One quiz per section: questions, answers (right one first) and explanations |
| `src/glossary.js` | Glossary terms, definitions and other spellings |
| `src/player.js` | The player: controls, sidebar, progress, challenge mode |

You need [Node.js](https://nodejs.org/) 22 or newer. There are no packages to install.

```bash
npm run build
```

```bash
npm test
```

`npm run build` writes `index.html` and inlines the logo and favicon from `assets/` as data URLs. Commit the rebuilt `index.html` with your change; CI fails if it is out of date (`npm run check`).

`npm test` runs the page in Node with a stand-in canvas. Every lesson is drawn from start to finish and seeked back and forth to prove `draw(t)` is pure. Every challenge is played with random input, and the player is driven through every chapter by keyboard. The stand-in canvas throws wherever a browser would: negative radii, bad gradient stops, unparsable colours.

To add a chapter, create `src/chapters/<id>.js` (and `src/challenges/<id>.js`), add an include line for each in `src/page.html`, then build and test. Give it `needs` and `related` chapter ids for the trade-offs card links. The tests check that every link points at a real chapter, every quiz question names one, and every glossary term appears somewhere in the course.

Every push to `main` deploys the site to GitHub Pages.

## License

[MIT](LICENSE)
