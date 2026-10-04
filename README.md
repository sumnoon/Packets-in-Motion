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

**Home** has one job: a single way in. New visitors see **Start learning** with their first lesson, plus a link to the 60-second introduction; returning learners see **Continue learning**, which reopens their last lesson at its saved position. **Learning map** draws each section as a route and each lesson as a station, marks **You are here**, and shows completion, challenge stars and suggested prerequisites. Choose your path there: **Learn the basics**, **Prepare for interviews** or **Explore systems**. The chapter list and existing lesson links still work.

**First visit:** a short guided tour points at each part of the page in turn (Home, Learning map, Missions, the chapter list, Settings and the start button), with Back, Next and Skip. It appears once, and **Settings → Take the tour again** replays it.

The **60-second introduction** starts with "Your app suddenly gets popular." Packets flow on the screen: send a traffic spike and watch one app overload and turn readers away, add a second app that sits idle, then add a load balancer and see the dropped reads disappear. It ends with a working system and a clear next lesson, Load Balancers. It is self-paced, with no timer or account, and the moving packets are hidden under reduced motion.

**Engineering missions** follow TownSquare, a fictional local-events app, through launch, viral traffic, and regional expansion. Adapt one design across three chapters, then test every named traffic/failure condition instantly. Each chapter checks delivery and budget; the last also checks regional response times. These are deterministic teaching capacity checks, with assumptions available beside the design, rather than the animated load tests used in architecture labs. Mission completion is separate from lesson stars. The story has a cast: **Maya**, TownSquare's founder, delivers each brief and reacts to your results (worried when readers are turned away, celebrating when the design holds), and **you**, the engineer, stand beside a server rack whose lights show how the system is doing. Both are full-body figures drawn in SVG, with gentle breathing, blinking and celebration motion that switches off under reduced motion. The page opens with what it is for and three steps (read the brief, shape your system, test all conditions); on the first visit a short explanation pops up, and **How missions work** brings it back.

Selected paths, introduction completion, mission drafts, and passing designs are saved locally and included in progress exports. Imported mission evidence is rechecked against the model before any records are merged. Older progress files remain supported.

<!-- course-counts:start -->
45 chapters in 10 sections; 10 architecture labs; 9 section quizzes. Lesson animations run 28.5–62 seconds.

| Section quiz | Questions |
| --- | ---: |
| Foundations | 7 |
| Traffic | 9 |
| Data | 9 |
| Storage & Search | 6 |
| Communication | 7 |
| Reliability | 7 |
| Architecture | 6 |
| Advanced | 14 |
| Capstone | 7 |
<!-- course-counts:end -->

From zero to advanced:

| Section | Chapters |
| --- | --- |
| Start Here | How computers talk: packets, IP addresses & ports |
| Foundations | Client–server & typing a URL · Latency vs throughput, vertical vs horizontal scaling · Autoscaling · Back-of-the-envelope estimation |
| Traffic | Load balancers · Sessions: sticky vs shared storage · Reverse proxies & API gateways · Authentication: sessions, JWTs & OpenID Connect · CDNs & edge caching · Rate limiting |
| Data | SQL vs NoSQL · Indexing · Replication · Quorums (N, W, R) · Sharding · Caching & LRU · Cache expiry (TTL) & invalidation · Hot keys & request coalescing · Bloom filters · CAP & consistency |
| Storage & Search | B-trees vs LSM trees · Search with inverted indexes · Geospatial indexes: geohash & quadtrees |
| Communication | REST vs gRPC vs WebSockets · Message queues & pub/sub · Sync vs async · Stream vs batch processing |
| Reliability | SPOFs & redundancy · Timeouts & deadlines · Health checks, failover, circuit breakers, retries · Idempotency · Safe deploys: blue-green, canary & feature flags |
| Architecture | Monolith vs microservices · Event-driven · Observability |
| Advanced | Consensus & leader election (Raft) · Distributed locks, leases & fencing tokens · Conflict resolution: vector clocks & CRDTs · Two-phase commit & sagas · Snowflake IDs · Back-pressure & load shedding |
| Capstone | Design a URL shortener · Design a chat app · Design a news feed, each end to end |

Each chapter has play/pause/replay, a scrubber with step markers, synced captions, and a "When to use it / Trade-offs" card at the end.

## Challenges

Every lesson ends with a hands-on challenge played on the same stage, scored with 0–3 stars (saved in your browser and shown in the sidebar). A few examples:

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

After a run that falls short, the board marks the weak spots: the component that overloaded and when, or the wire where requests failed. Hint goes a level deeper with each press: a nudge, then the components you need, then a faint outline of a 3-star design to trace. Ctrl+Z (or Undo) reverses board and design-option edits, and each lab remembers your cheapest 3-star design, with a lean medal where a cheaper one exists.

Undo covers board components, connections, positions and design options. Component locks and chaos mode are practice settings rather than board edits. **Replay last run** restores the last tested board, its options, incident mode and seed, including after a reload. Last-run replay records stay in the current browser; progress exports include drafts, best boards and certification seeds. Replaying a seed does not earn another distinct certification run.

Expand **Model assumptions and replay** for capacity, cost and latency assumptions. Dollar values are educational model parameters, not provider quotes; latency figures are illustrative buckets. The chat lab measures modeled recipient delivery, with successful replay assumed when resume is enabled. It does not measure message timestamps or certify a one-second end-to-end delivery deadline.

Lab drafts, including wires and design options, survive reloads. **Restore best design** brings back the cheapest saved three-star board; restoring it can also be undone. Older progress files retain their best-cost records, and a new successful run saves a restorable board. The shortener only earns three stars when every successful redirect's click event has been persisted, with none left pending.

Once a design holds, turn on **chaos mode**: every run, the incidents strike at a random time and hit a random component, and three 3-star runs with distinct random seeds on the same architecture earn its chaos-proof badge. Changing components, wires or options resets the streak; moving a component does not. The tested design and seeds are saved and exported. Earlier badges remain learner achievements, but do not certify an untested board. **Copy share link** packs your design into a link, so anyone who opens it gets the same board and can try to beat your cost. Components grow with the course: a component stays locked until you mark its prerequisite lesson complete. Already know the material? Turn off **Lock components until I have completed their chapter** in any lab.

Shared boards are saved before their URL is tidied, so they survive reloads too. When using the downloaded HTML, share links open the hosted course. If clipboard access fails, the selectable link remains available to copy manually. If browser storage is unavailable or full, the sidebar asks you to export before closing the tab.

Labs work with the keyboard too: digits add components, pressing two components' letters wires them, Delete removes the selection, Ctrl+Z undoes, and Enter runs the test. The goal appears above the board, and Run, Undo and Hint stay available in a sticky toolbar. The live status announces only the latest action; a persistent design summary lists budget, components, connections, options and weak spots. Expand the text editor for an add → connect → run walkthrough, or the keyboard guide for shortcuts and costs.

Each section with more than one chapter ends with a **section quiz**, with an explanation for every answer, scored with stars like the challenges. A miss names the chapter worth rewatching.

## Learning tools

Chapter and quiz changes create browser-history entries; Back and Forward restore lessons paused at their saved position, or reopen challenges ready to start. Timeline changes update the current entry without creating more entries. On an unlinked return visit, **Continue lesson** offers the saved lesson and position without autoplay. Playback speed, captions and transcript preferences are remembered.

**Mark lesson complete** records your own completion decision. Reaching or seeking to the end does not mark completion. Challenge stars record practice separately, and three stars indicate challenge mastery. Older watched records are retained as completed records for compatibility. Locked components provide a direct route to their prerequisite lesson; mark that lesson complete to unlock them, or disable component locks when you already know the material.

The ID lesson distinguishes sequences that allow gaps, transactional business-number allocation, random UUIDv4, time-based UUIDv7, and Snowflake's clock-dependent timestamp ordering. The authentication lesson separates OAuth API authorization from OpenID Connect login, explains access versus ID tokens, and covers validation and authorization code flow with PKCE. References: [PostgreSQL sequences](https://www.postgresql.org/docs/18/functions-sequence.html), [UUID specification](https://www.rfc-editor.org/rfc/rfc9562.html), [Snowflake generator safeguards](https://github.com/twitter-archive/snowflake/blob/snowflake-2010/src/main/scala/com/twitter/service/snowflake/IdWorker.scala), [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html), and [PKCE](https://www.rfc-editor.org/rfc/rfc7636.html).

- **Search** the sidebar (press `/`) by title, caption or trade-off: "stampede", "429" or "leader" all find the right chapters.
- **Glossary:** key terms in captions, the transcript and the trade-offs are underlined; hover, focus or tap one for a one-line definition. Press G for the full glossary, with links to every chapter that uses each term.
- **Stage recovery:** a failed drawing stops playback and offers Retry or the readable lesson transcript while keeping saved lab designs. Trade-offs and results use modal dialogs with keyboard focus containment and Escape to close.
- **Before this / Related:** the trade-offs card links to the chapters a lesson builds on and the ones that go further.
- **Settings** (⚙ in the top navigation, on every page): theme, keyboard shortcuts, sound cues, progress export / import, and the tour. No scrolling to the bottom of the chapter list.
- **Export / import progress** from Settings. Progress (chapters completed, stars, lab drafts, your cheapest saved lab designs and chaos-proof badges) lives in your browser, so this is how you move it to another browser or keep a backup. Importing merges: nothing you have already earned is lost, and an existing draft is kept. Both original version 1 files and the new version 2 files are supported. Files are limited to 1 MB; invalid supported records or design schemas reject the whole import before merging, and unknown course records are reported as ignored.
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

Player shortcuts work while focus is inside the lesson. Native inputs retain their keys, and Ctrl, Command and Alt combinations retain their browser behavior (Ctrl/Command+Z on the challenge canvas performs lab undo). **Keyboard shortcuts** in Settings turns the single-key shortcuts off. Timeline arrows use the slider's native behavior; **Previous lesson step** and **Next lesson step** jump between narrated beats, and the slider reports elapsed time and the current step to assistive technology.

## Accessibility

- **Screen readers:** each step is announced as it plays (title and caption), the stage is labelled with the current step, and the transcript (S) lists every step as text. The sidebar reads each chapter's number, title, whether you've marked it complete and your stars.
- **Keyboard only:** every lesson control and every challenge works without a mouse. Challenge status lines name the cards, slots and targets so you know which key does what.
- **Themes:** pick Dark, Light or High contrast in Settings (⚙ in the top navigation). The stage stays dark in Light (it's the video); High contrast also brightens labels and lines on the stage. High contrast is chosen for you if your system asks for more contrast.
- **Reduced motion** stills the drifting background, tones down the particle bursts and turns off the labs' screen shake and slow motion.

## How it works

The diagrams are drawn on a `<canvas>` by code. Each chapter is a pure `draw(t)` function, so `seek(t)` reproduces any moment exactly. Lesson timelines are precomputed. Challenges advance through `update(now, dt)` independently of drawing; architecture labs use a seeded, headless model with fixed 1/60-second steps and an exact end time. Presentation effects use a separate random stream. See [simulation contracts](docs/simulation-contracts.md) for lifecycle, graph, events, scoring and replay.

The consensus, quorum, SQL migration, saga and vector-clock lessons state their protocol assumptions and failure cases. Primary references: [Raft](https://raft.github.io/raft.pdf), [Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), [PostgreSQL table modification](https://www.postgresql.org/docs/18/ddl-alter.html), and [compensating transactions](https://learn.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction).

## Development

`index.html` is generated from the files in `src/`. Edit those, then rebuild:

| Path | What it holds |
| --- | --- |
| `src/page.html` | The page skeleton. Its `<!-- include: … -->` lines set which files go in and in what order. |
| `src/styles.css` | All styles |
| `src/engine.js` | Drawing primitives: servers, databases, packets, easing |
| `src/simulation.js` | JSDoc contracts, independent random streams, fixed clock and headless lab runner |
| `src/chapters/<id>.js` | One lesson each: beats, trade-offs and `draw(t)` |
| `src/challenges/<id>.js` | One challenge each. `_mechanics.js` holds the shared game types; `_lab.js` is the architecture-lab engine (board, wiring, load tests, hints, weak spots, chaos mode, share links). |
| `src/quizzes/<section>.js` | One quiz per section: questions, answers (right one first) and explanations |
| `src/glossary.js` | Glossary terms, definitions and other spellings |
| `src/player.js` | The player: controls, sidebar, progress, challenge mode |

You need [Node.js](https://nodejs.org/) 22 or newer. Building and VM tests use Node alone. Browser tests use the locked development dependency on Playwright:

```bash
npm run build
```

```bash
npm test
npm ci
npx playwright install chromium
npm run test:browser
```

`npm run build` writes `index.html`, inlines logo assets and generates the counts above from registered course metadata. Commit the rebuilt HTML and README; `npm run check` verifies both.

`npm test` uses a stand-in canvas to check lesson drawing, seeded challenge play, keyboard controls, lab solutions and model invariants. It checks negative radii, gradient stops and colours, but does not reproduce browser layout, HTML semantics or native focus. `npm run test:browser` checks those boundaries in Chromium at desktop and touch portrait sizes, plus delayed navigation, reload/import/share and seed replay. CI runs both suites and saves browser traces/screenshots on failure. These automated touch and semantic checks do not replace physical-device or screen-reader testing; full assistive-technology coverage has not been verified.

To add a chapter, create `src/chapters/<id>.js` (and `src/challenges/<id>.js`), add an include line for each in `src/page.html`, then build and test. Give it `needs` and `related` chapter ids for the trade-offs card links. The tests check that every link points at a real chapter, every quiz question names one, and every glossary term appears somewhere in the course.

Every push to `main` deploys the site to GitHub Pages.

## License

[MIT](LICENSE)
