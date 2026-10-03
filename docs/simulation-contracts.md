# Simulation and authoring contracts

The course ships as one offline HTML file. Source files are classic scripts included in `src/page.html` order: storage, simulation utilities, lessons, shared challenge mechanics, challenges, quizzes, glossary, player. Source modules register content; the player owns navigation, challenge lifetime, timers and DOM. JSDoc contracts live in `src/simulation.js`.

## Lifecycle and clocks

`make(api)` returns a `ChallengeInstance`. `update(now, dt)` advances play only while the player is ready, unpaused and visible. `draw(now, dt)` renders the current state; a redraw must not advance a model, deal a new card or score. Pointer/key handlers apply user actions. `cancel()` releases in-progress gestures; `dispose()` releases optional external resources. Delayed callbacks go through the player API so leaving a challenge invalidates them.

`pimClock(step, duration)` accumulates active elapsed time into fixed 1/60-second steps and stops exactly at duration, including a shorter final step if needed. It rejects negative/nonfinite deltas. Simulation challenges and architecture labs use it. The player's bounded frame delta avoids catch-up after a blocked/hidden page. Therefore a load test measures active model time, not hardware wall-clock latency. Packet slow motion after incidents affects presentation only.

## Headless architecture labs

`pimLabRun(scenario, graph, {seed, chaos})` clones the graph and creates private state, RNG and clock. `graph` contains nodes with stable IDs, directed edges and boolean design options; `of`, `out` and `inn` are query helpers. A scenario supplies `init`, `step`, `hud`, `score`, and optionally `measure`. `step(state, graph, dt, time)` produces flows, per-node utilization, unavailable nodes, failing edges and phase. Models must not touch DOM, canvas, storage, audio, global random streams or wall clocks.

`labSignal` appends timed incident events instead of triggering visual effects. The UI drains events and creates particles/audio separately. The runner tracks peak physical-node utilization and cumulative failing-edge duration at each model step. `snapshot()` serializes model state for regression comparison; Sets become arrays and RNG functions are omitted.

`result(cost)` returns a result with stars, explanation, explicit metrics, seed, elapsed model time and cost. Most scenarios expose their named HUD measurements. Shortener and chat also expose numeric observed/target/pass requirements consumed by scoring. Shortener mastery requires serving fraction, modeled p95, budget and complete persistence of accepted click events; chat mastery requires modeled recipient delivery and budget. Tests verify physical-shard capacity across multiple producers, click conservation and score stability across frame schedules.

## Randomness, replay and persistence

The shipped player chooses a fresh startup seed; tests inject `PIM_TEST_SEED` before scripts load. `PIM_RANDOM` handles challenge shuffles and run seeds. `PIM_EFFECTS` handles presentation randomness independently. Each lab run owns `pimRng(seed)` for incident times and victims.

`pim-lab-runs` stores a versioned last-run record per lab: encoded board, options, seed and chaos mode. Restore validates each record. Replay restores and runs that exact input; changing the current board does not change the saved replay. Replay records survive reloads in the same browser, but are not part of progress exports. Existing exported drafts, best designs and certification seeds retain their contracts. Certification requires three distinct seeds on an unchanged architecture; replaying one seed cannot advance the streak.

Board edits and options are undoable. Component locks and incident mode are practice settings. All storage is best-effort: failure leaves the course usable in memory and prompts progress export.

## Educational boundaries

Capacities, dollar costs and latency buckets are model parameters. They are not provider quotes or measured network timings. Each lab exposes these assumptions in its text UI. Chat assumes successful sequence replay when resume is enabled; no message timestamps/end-to-end deadlines are modeled. Its score must never claim a one-second delivery guarantee.

`npm test` covers deterministic models, accounting and drawing with a fake DOM/canvas. `npm run test:browser` covers native dialogs/focus, semantics, persistence, navigation and layouts in desktop/touch Chromium. Neither proves complete physical-device or screen-reader accessibility.
