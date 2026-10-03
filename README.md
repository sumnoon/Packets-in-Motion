<p align="center">
  <img src="assets/logo-256.png" width="128" height="128" alt="Packets in Motion logo: a P-shaped route with traveling packets">
</p>

<h1 align="center">Packets in Motion</h1>

<p align="center"><strong>System design, explained by watching it happen.</strong></p>

An animated, interactive course that takes you from "how do two computers talk?" to consensus, distributed transactions and three full system designs: a URL shortener, a chat app and a news feed. Every concept is taught through motion: glowing requests leave light trails between servers, caches fill up, servers fail and traffic reroutes. Then you solve a hands-on challenge for each lesson, and in ten **architecture labs** you build the system yourself, wire it up and watch it survive (or not) a crash, a spike or an attack.

![Packets in Motion: system design, explained by watching it happen. Requests flow from three users through a load balancer to three servers, one of them down.](assets/social-preview.png)

## Run it

**Live:** [sumnoon.github.io/Packets-in-Motion](https://sumnoon.github.io/Packets-in-Motion/)

Or run it offline: `index.html` is a single self-contained file with no dependencies and no network requests. Download it and open it in any modern browser. That's it.

## What's inside

45 chapters in 10 sections, from zero to advanced:

| Section | Chapters |
| --- | --- |
| Start Here | How computers talk: packets, IP addresses & ports |
| Foundations | Client–server & typing a URL · Latency vs throughput, vertical vs horizontal scaling · Autoscaling · Back-of-the-envelope estimation |
| Traffic | Load balancers · Sessions: sticky vs shared storage · Reverse proxies & API gateways · Authentication: sessions, JWTs & OAuth · CDNs & edge caching · Rate limiting |
| Data | SQL vs NoSQL · Indexing · Replication · Quorums (N, W, R) · Sharding · Caching & LRU · Cache expiry (TTL) & invalidation · Hot keys & request coalescing · Bloom filters · CAP & consistency |
| Storage & Search | B-trees vs LSM trees · Search with inverted indexes · Geospatial indexes: geohash & quadtrees |
| Communication | REST vs gRPC vs WebSockets · Message queues & pub/sub · Sync vs async · Stream vs batch processing |
| Reliability | SPOFs & redundancy · Timeouts & deadlines · Health checks, failover, circuit breakers, retries · Idempotency · Safe deploys: blue-green, canary & feature flags |
| Architecture | Monolith vs microservices · Event-driven · Observability |
| Advanced | Consensus & leader election (Raft) · Distributed locks, leases & fencing tokens · Conflict resolution: vector clocks & CRDTs · Two-phase commit & sagas · Snowflake IDs · Back-pressure & load shedding |
| Capstone | Design a URL shortener · Design a chat app · Design a news feed, each end to end |

Each chapter has a 28–62 s animation, play/pause/replay, a scrubber with step markers, synced captions, and a "When to use it / Trade-offs" card at the end.

## Challenges

Every lesson ends with a hands-on challenge played on the same stage, scored with 1–3 stars (saved in your browser and shown in the sidebar). A few examples:

- **Be the load balancer**: route requests by hand for 30 seconds without overflowing a server.
- **Beat LRU**: choose what to evict from a tiny cache and try to match the algorithm.
- **Stop the retry storm**: tune retries, backoff, jitter and a circuit breaker through an outage.
- **Find the culprit**: use metrics, logs and a trace to find a slow service.

**Start challenge** (or your first answer) starts the clock; **Pause challenge** freezes it, including delayed results. Reading the glossary, opening the mobile chapter drawer, or hiding the tab pauses automatically. Timed sorting games and load balancing also offer **Untimed** practice before starting. Untimed balancing finishes after 30 routed requests; each choice advances service by one second, with no request deadlines or idle progress.

The rest use the same kinds of mechanics: sort cards into boxes, put steps in order, or tune a system and run it.

### Architecture labs

![The URL shortener lab mid-run: users pass a rate limiter and a load balancer to four app servers, one just crashed, which read from a cache, write to a database and send clicks through a queue to a worker. The palette of components sits under the board.](assets/lab-screenshot.png)

Ten challenges are **architecture labs**: you design the system yourself. Drag components (load balancers, app servers, caches, databases, queues, gateways, pub/sub and so on) from a palette onto the board, drag from a component's ● to another to wire them, then run a load test. Traffic flows along the wires you drew, every component has its own capacity, and a crash, a spike or an attack hits whatever you built. The results name the weakest part of your design.

- **Survive launch day**: one giant machine or several smaller ones behind a load balancer? Traffic climbs and the busiest machine crashes.
- **Keep everyone logged in**: decide where sessions live, then lose a server and the session store's machine.
- **Keep it serving**: a leader, followers that copy it, and a failover manager; the leader crashes halfway.
- **Survive the order surge**: put a queue between the shop and the workers, and size the workers to catch up after a spike and a restart.
- **Make checkout fast**: wire each job straight from checkout (the customer waits) or through a queue (it happens later), then survive declined cards and an email outage.
- **Wire up the events**: subscribe each service to the events it must react to, and nothing else.
- **Survive the chaos monkey**: find every single point of failure before an app server, a load balancer and the database are killed.
- **Build the shortener**: survive a viral spike, the busiest app server crashing and a bot attack, and count every click.
- **Build the chat app**: keep 100,000 people connected through a message storm, a gateway crash and offline members.
- **Build the news feed**: get posts to followers fast, survive a celebrity post and a 20× spike in feed loads.

After a run that falls short, the board marks the weak spots: the component that overloaded and when, or the wire where requests failed. Hint goes a level deeper with each press: a nudge, then the components you need, then a faint outline of a 3-star design to trace. Ctrl+Z (or Undo) reverses any change, and each lab remembers your cheapest 3-star design, with a lean medal where a cheaper one exists.

Lab drafts, including wires and design options, survive reloads. **Restore best design** brings back the cheapest saved three-star board; restoring it can also be undone. Older progress files retain their best-cost records, and a new successful run saves a restorable board. The shortener only earns three stars when every successful redirect's click event has been persisted, with none left pending.

Once a design holds, turn on **chaos mode**: every run, the incidents strike at a random time and hit a random component, and three 3-star runs with distinct random seeds on the same architecture earn its chaos-proof badge. Changing components, wires or options resets the streak; moving a component does not. The tested design and seeds are saved and exported. Earlier badges remain learner achievements, but do not certify an untested board. **Copy share link** packs your design into a link, so anyone who opens it gets the same board and can try to beat your cost. Components grow with the course: a component from a chapter you haven't watched yet stays locked until you watch it. Already know the material? Turn off **Lock components until I have watched their chapter** in any lab.

Shared boards are saved before their URL is tidied, so they survive reloads too. When using the downloaded HTML, share links open the hosted course. If clipboard access fails, the selectable link remains available to copy manually. If browser storage is unavailable or full, the sidebar asks you to export before closing the tab.

Labs work with the keyboard too: digits add components, pressing two components' letters wires them, Delete removes the selection, Ctrl+Z undoes, and Enter runs the test. The status line reads the whole design aloud, including the weak spots from the last run.

Each section with more than one chapter ends with a **section quiz**: six multiple-choice questions with an explanation for every answer, scored with stars like the challenges. A miss names the chapter worth rewatching.

## Learning tools

- **Search** the sidebar (press `/`) by title, caption or trade-off: "stampede", "429" or "leader" all find the right chapters.
- **Glossary:** key terms in captions, the transcript and the trade-offs are underlined; hover, focus or tap one for a one-line definition. Press G for the full glossary, with links to every chapter that uses each term.
- **Stage recovery:** a failed drawing stops playback and offers Retry or the readable lesson transcript while keeping saved lab designs. Trade-offs and results use modal dialogs with keyboard focus containment and Escape to close.
- **Before this / Related:** the trade-offs card links to the chapters a lesson builds on and the ones that go further.
- **Export / import progress** from the sidebar. Progress (chapters watched, stars, lab drafts, your cheapest saved lab designs and chaos-proof badges) lives in your browser, so this is how you move it to another browser or keep a backup. Importing merges: nothing you have already earned is lost, and an existing draft is kept. Both original version 1 files and the new version 2 files are supported. Files are limited to 1 MB; invalid supported records or design schemas reject the whole import before merging, and unknown course records are reported as ignored.
- **Sound cues** (off by default): soft tones for right and wrong moves, new steps and results. They are synthesized in the browser; nothing is downloaded.

## Visual language

The project logo traces a **P** with a routing path and two traveling packets, using the course's blue, mint, and violet palette. Transparent logo assets, the social preview and how to refresh both are in [assets/BRAND.md](assets/BRAND.md).

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

The course works in portrait and landscape. **Readable size** enlarges the diagram in a scrollable viewport; **Fit diagram** restores the overview. Touch scrolling is the default. In challenges, **Drag on diagram** enables canvas editing; turn it off to pan. The lab's **Components and connections** editor provides text controls for adding, removing, wiring and unwiring components, with the same budget limits and undo history. Live challenge measurements expose server loads, cache contents, search postings and lab capacity readings as text.

Player shortcuts work while focus is inside the lesson. Native inputs retain their keys, and Ctrl, Command and Alt combinations retain their browser behavior (Ctrl/Command+Z on the challenge canvas performs lab undo). **Keyboard shortcuts** in the sidebar turns the single-key shortcuts off. Timeline arrows use the slider's native behavior; **Previous lesson step** and **Next lesson step** jump between narrated beats, and the slider reports elapsed time and the current step to assistive technology.

## Accessibility

- **Screen readers:** each step is announced as it plays (title and caption), the stage is labelled with the current step, and the transcript (S) lists every step as text. The sidebar reads each chapter's number, title, whether you've watched it and your stars.
- **Keyboard only:** every lesson control and every challenge works without a mouse. Challenge status lines name the cards, slots and targets so you know which key does what.
- **Themes:** pick Dark, Light or High contrast at the bottom of the sidebar. The stage stays dark in Light (it's the video); High contrast also brightens labels and lines on the stage. High contrast is chosen for you if your system asks for more contrast.
- **Reduced motion** stills the drifting background, tones down the particle bursts and turns off the labs' screen shake and slow motion.

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
| `src/challenges/<id>.js` | One challenge each. `_mechanics.js` holds the shared game types; `_lab.js` is the architecture-lab engine (board, wiring, load tests, hints, weak spots, chaos mode, share links). |
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

`npm test` runs the page in Node with a stand-in canvas. Every lesson is drawn from start to finish and seeked back and forth to prove `draw(t)` is pure. Every challenge is played with random input, and the player is driven through every chapter by keyboard. Every lab's 3-star outline is built and load-tested, in normal and chaos mode, and the tempting shortcuts are checked to score lower. The stand-in canvas throws wherever a browser would: negative radii, bad gradient stops, unparsable colours.

To add a chapter, create `src/chapters/<id>.js` (and `src/challenges/<id>.js`), add an include line for each in `src/page.html`, then build and test. Give it `needs` and `related` chapter ids for the trade-offs card links. The tests check that every link points at a real chapter, every quiz question names one, and every glossary term appears somewhere in the course.

Every push to `main` deploys the site to GitHub Pages.

## License

[MIT](LICENSE)
