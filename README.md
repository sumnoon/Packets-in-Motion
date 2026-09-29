# Packets in Motion

**System design, explained by watching it happen.**

An animated, interactive course that takes you from "what happens when I type a URL" to designing a URL shortener end to end. Every concept is taught through motion: glowing requests travel between servers, caches fill up, servers fail and traffic reroutes.

## Run it

It's a single self-contained HTML file with no dependencies, no build step and no network requests.

Open `index.html` in any modern browser. That's it.

## What's inside

22 chapters in 7 sections:

| Section | Chapters |
| --- | --- |
| Foundations | Client–server & typing a URL · Latency vs throughput, vertical vs horizontal scaling |
| Traffic | Load balancers · Reverse proxies & API gateways · CDNs & edge caching · Rate limiting |
| Data | SQL vs NoSQL · Indexing · Replication · Sharding · Caching & LRU · CAP & consistency |
| Communication | REST vs gRPC vs WebSockets · Message queues & pub/sub · Sync vs async |
| Reliability | SPOFs & redundancy · Health checks, failover, circuit breakers, retries · Idempotency |
| Architecture | Monolith vs microservices · Event-driven · Observability |
| Capstone | Design a URL shortener, end to end |

Each chapter has a 28–62 s animation, play/pause/replay, a scrubber with step markers, synced captions, and a "When to use it / Trade-offs" card at the end.

## Visual language

- Servers are rounded rectangles, databases are cylinders, users are circles, and requests are glowing dots.
- **Blue** = request · **green** = success / response · **red** = failure · **amber** = cached / queued.

## Controls

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← / → | Seek 2 s |
| `[` / `]` | Previous / next chapter |
| 1–9 | Jump to a step |
| C | Toggle captions |
| T | Trade-offs card |
| F | Fullscreen |

On phones the course runs in landscape. Held upright, it asks you to rotate the phone and pauses until you do.

## How it works

Everything is drawn on a `<canvas>` by code. Each chapter is a pure `draw(t)` function, so `seek(t)` reproduces any moment exactly, whether you scrub, replay or jump. Simulations such as least-connections balancing, token and leaky buckets and queue backlogs are computed once when the page loads, never frame by frame.
