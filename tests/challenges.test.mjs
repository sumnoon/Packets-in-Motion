// Every challenge: builds, runs for a while under random play (clicks, drags,
// number keys, every control) without throwing, and scores 0–3 stars when it ends.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, challenge } from './harness.mjs';

const page = loadPage();
const CHAL = page.get('CHAL');
const FX = page.get('FX');
const W = 1000, H = 560;

// seeded random so a failure is reproducible
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

function fakeApi(state) {
  return {
    now: () => state.now,
    status(h) { assert.equal(typeof h, 'string'); state.status = h; },
    button(label, fn, o = {}) { const b = { label, fn, primary: !!o.primary, disabled: false }; state.buttons.push(b); return b; },
    slider(label, min, max, step, val, fmt, fn) {
      assert.ok(min < max, `${label}: min must be below max`);
      assert.equal(typeof fmt(val), 'string', `${label}: format must return a string`);
      const s = { label, min: +min, max: +max, step: +step, fn, fmt, disabled: false };
      state.controls.push({ kind: 'slider', ...s, set: v => { s.fmt(v); fn(v); } }); return s;
    },
    seg(label, opts, val, fn) { assert.ok(opts.some(([v]) => v === val), `${label}: default is not an option`); state.controls.push({ kind: 'seg', label, opts, set: fn }); return {}; },
    toggle(label, val, fn) { let v = !!val; state.controls.push({ kind: 'toggle', label, set: () => fn((v = !v)) }); return {}; },
    lock(v) { state.locked = !!v; },
    win(stars, title, msg) { state.wins.push({ stars, title, msg }); },
  };
}

// set every control to a random value
function fiddle(state, rand) {
  for (const c of state.controls) {
    if (c.kind === 'slider') { const n = Math.round((c.max - c.min) / c.step); c.set(+(c.min + Math.floor(rand() * (n + 1)) * c.step).toFixed(6)); }
    else if (c.kind === 'seg') c.set(c.opts[Math.floor(rand() * c.opts.length)][0]);
    else c.set();
  }
}

function play(id, seed, seconds = 40) {
  const def = CHAL[id];
  const rand = rng(seed);
  const state = { now: 0, buttons: [], controls: [], wins: [], locked: false, status: '' };
  const api = fakeApi(state);
  const inst = def.make(api);
  for (const k of ['draw']) assert.equal(typeof inst[k], 'function', `make() must return {${k}}`);
  const dt = 1 / 30;
  fiddle(state, rand);
  let drag = null;
  for (let f = 0; f < seconds / dt; f++) {
    state.now += dt;
    page.reset();
    page.runTimers(state.now);
    inst.draw(state.now, dt);
    FX.step(dt);
    const r = rand();
    // press the primary button (Run it / Check my order) now and then, when not locked
    if (!state.locked && r < 0.01) { const b = state.buttons.find(b => b.primary); if (b) b.fn(); }
    else if (r < 0.05) { const x = rand() * W, y = rand() * H; inst.down?.(x, y, state.now); inst.up?.(x, y, state.now); inst.click?.(x, y, state.now); }
    else if (r < 0.08) { inst.key?.(String(1 + Math.floor(rand() * 4)), state.now); }
    else if (r < 0.09) { inst.key?.(' ', state.now); }
    else if (r < 0.12 && !drag) { drag = [rand() * W, rand() * H]; inst.down?.(drag[0], drag[1], state.now); }
    else if (drag && r < 0.3) { drag = [drag[0] + (rand() - .5) * 200, Math.min(H, drag[1] + rand() * 120)]; inst.move?.(drag[0], drag[1], state.now); }
    else if (drag && r < 0.34) { inst.up?.(drag[0], drag[1], state.now); drag = null; }
    else if (r < 0.345 && !state.locked) fiddle(state, rand);
    if (state.wins.length) break;
  }
  return state;
}

for (const id of Object.keys(CHAL)) {
  test(`${id}: has a title, goal and hint`, () => {
    const d = CHAL[id];
    for (const k of ['title', 'goal', 'hint']) assert.ok(typeof d[k] === 'string' && d[k].length > 3, `missing ${k}`);
    assert.equal(typeof d.make, 'function');
  });

  test(`${id}: survives random play`, () => {
    for (const seed of [1, 2, 3]) {
      const s = play(id, seed);
      for (const w of s.wins) {
        assert.ok(Number.isInteger(w.stars) && w.stars >= 0 && w.stars <= 3, `stars ${w.stars}`);
        assert.ok(w.title && w.msg, 'a result needs a title and a message');
      }
    }
  });
}

test('simulation challenges finish and score once they run', () => {
  // every challenge with a primary "run" button must end in a result after running
  for (const id of Object.keys(CHAL)) {
    const state = { now: 0, buttons: [], controls: [], wins: [], locked: false, status: '' };
    const inst = CHAL[id].make(fakeApi(state));
    const run = state.buttons.find(b => b.primary && !/check/i.test(b.label));
    if (!run) continue;
    inst.draw(0, 0); run.fn();
    for (let f = 0; f < 120 * 30 && !state.wins.length; f++) { state.now += 1 / 30; page.reset(); page.runTimers(state.now); inst.draw(state.now, 1 / 30); }
    assert.equal(state.wins.length, 1, `${id}: no result after running`);
  }
});

// the puzzles must stay solvable: the intended design earns 3 stars, a naive one does not
const runWith = (id, set, seconds) => {
  const r = challenge(page, id);
  for (const [label, v] of set) r.control(label).set(v);
  r.click(/run|ship|chaos/i).step(seconds);
  return r.result;
};
// capstones are architecture labs: build the design with keys (digits add, letter pairs wire), then load-test it
const LAB_SAVE = page.get('LAB_SAVE');
// a fresh start: no saved design, weak spots, hints, undo history, failures or best costs
const labReset = () => ['LAB_SAVE', 'LAB_POST', 'LAB_HINT', 'LAB_UNDO', 'LAB_FAILS', 'LAB_BEST'].forEach(n => { const o = page.get(n); for (const k in o) delete o[k]; });
const lab = (id, keys, opts, seconds) => {
  labReset();
  const r = challenge(page, id);
  r.press(...keys);
  for (const [label, v] of opts) r.control(label).set(v);
  r.press('Enter').step(seconds);
  return r.result;
};
test('capstone: URL shortener needs every building block', () => {
  // 1 limiter · 2 LB · 3 app · 4 cache · 5 DB · 7 queue · 8 worker; A is Users
  const base = ['1', '2', '3', '4', '5', '7', '8', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', 'd', 'f', 'd', 'g', 'g', 'h', 'h', 'f'];
  assert.equal(lab('capstone', [...base, '3', '3', '3'], [], 19).stars, 3);
  assert.ok(lab('capstone', [...base, '3', '3'], [], 19).stars < 3, 'no spare server when one dies');
  assert.ok(lab('capstone', ['2', '3', '4', '5', '7', '8', 'a', 'b', 'b', 'c', 'c', 'd', 'c', 'e', 'c', 'f', 'f', 'g', 'g', 'e', '3', '3', '3'], [], 19).stars < 3, 'the bot attack gets through without a limiter');
  assert.ok(lab('capstone', ['1', '3', '4', '5', '7', '8', 'a', 'b', 'b', 'c', 'c', 'd', 'c', 'e', 'c', 'f', 'f', 'g', 'g', 'd', '3', '3', '3'], [], 19).stars < 3, 'without a load balancer traffic keeps hitting the crashed server');
  assert.ok(lab('capstone', ['1', '2', '3', '5', '7', '8', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', 'd', 'f', 'f', 'g', 'g', 'e', '3', '3', '3'], [], 19).stars < 3, 'viral reads need a cache');
  assert.ok(lab('capstone', ['1', '2', '3', '4', '5', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', 'd', 'f', '3', '3', '3'], [], 19).stars < 3, 'click counts written synchronously swamp the database');
});
test('capstone: lab keys add, wire and describe the design', () => {
  for (const k in LAB_SAVE) delete LAB_SAVE[k];
  const r = challenge(page, 'capstone');
  assert.match(r.state.status, /<kbd>1<\/kbd> Rate limiter/);
  r.press('2', '3', 'a', 'b', 'b', 'c');
  assert.match(r.state.status, /A<\/b> Users \+ bots → B · <b>B<\/b> Load balancer → C/);
  r.press('3');
  assert.match(r.state.status, /wired like the first one/);
  r.press('d', 'Delete');
  assert.doesNotMatch(r.state.status, /<b>D<\/b> App server/);
  r.press('c', 'a');
  assert.match(r.state.status, /can't send to/);
});
test('capstone: chat app has a 3-star design', () => {
  // 1 LB · 2 gateway · 3 chat · 4 store shard · 5 pub/sub · 6 push; A is People
  const base = ['1', '2', '3', '4', '5', '6', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', 'd', 'f', 'f', 'c', 'd', 'g'];
  assert.equal(lab('capstone-chat', [...base, '2', '2', '2', '4', '4'], [[/resume/i, true]], 17).stars, 3);
  assert.equal(lab('capstone-chat', [...base, '2', '2', '2', '4', '4'], [], 17).stars, 2);
  assert.ok(lab('capstone-chat', [...base, '2', '2', '4', '4'], [[/resume/i, true]], 17).stars < 3, 'no spare gateway');
});
test('capstone: news feed needs the hybrid', () => {
  // 1 post svc · 2 posts DB · 3 fan-out queue · 4 worker · 5 feed cache · 6 feed svc · 7 page cache; A posters, B readers
  const base = ['1', '2', '3', '4', '5', '6', '7', 'a', 'c', 'c', 'd', 'c', 'e', 'e', 'f', 'f', 'g', 'b', 'h', 'h', 'g', 'h', 'd', 'h', 'i'];
  assert.equal(lab('capstone-feed', [...base, '4', '4'], [[/skip/i, true]], 15).stars, 3);
  assert.ok(lab('capstone-feed', [...base, '4', '4'], [], 15).stars < 3, 'pure fan-out on write drowns in the star');
  assert.ok(lab('capstone-feed', ['1', '2', '6', '7', 'a', 'c', 'c', 'd', 'b', 'e', 'e', 'd', 'e', 'f'], [], 15).stars < 3, 'fan-out on read is too slow');
});
test('lab: launch day rewards scaling out behind a load balancer', () => {
  // 1 LB · 2 small · 3 medium · 4 large · 5 XL; A is Users
  assert.equal(lab('scaling', ['1', '3', 'a', 'b', 'b', 'c', '3', '3', '3'], [], 19).stars, 3);
  assert.ok(lab('scaling', ['1', '3', 'a', 'b', 'b', 'c', '3', '3'], [], 19).stars < 3, 'no room for a crash');
  assert.ok(lab('scaling', ['3', 'a', 'b', '3', '3', '3'], [], 19).stars < 3, 'without a load balancer users keep hitting the dead server');
  assert.equal(lab('scaling', ['5', 'a', 'b'], [], 19).stars, 0, 'one giant machine');
  assert.ok(lab('scaling', ['1', '4', 'a', 'b', 'b', 'c', '4'], [], 19).stars < 3, 'scaling up costs too much');
});
test('lab: sessions need a shared, replicated store', () => {
  // 1 LB · 2 app server · 3 session store · 4 replica; A is Users
  const full = ['1', '2', '3', '4', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', '2'];
  assert.equal(lab('sessions', full, [], 14).stars, 3);
  assert.ok(lab('sessions', ['1', '2', 'a', 'b', 'b', 'c', '2', '2'], [], 14).stars < 2, 'memory sessions and round robin');
  assert.equal(lab('sessions', ['1', '2', 'a', 'b', 'b', 'c', '2', '2'], [[/sticky/i, true]], 14).stars, 2, 'sticky sessions lose the dead server\'s users');
  assert.ok(lab('sessions', ['1', '2', '3', 'a', 'b', 'b', 'c', 'c', 'd', '2', '2'], [], 14).stars < 2, 'the store alone is a single point of failure');
});
test('lab: a queue absorbs the order surge', () => {
  // 1 queue · 2 worker; A is the web shop
  assert.equal(lab('queues-pubsub', ['1', '2', 'a', 'b', 'b', 'c', '2', '2', '2'], [], 15).stars, 3);
  assert.equal(lab('queues-pubsub', ['1', '2', 'a', 'b', 'b', 'c', '2', '2'], [], 15).stars, 1, 'too few workers to drain');
  assert.equal(lab('queues-pubsub', ['2', 'a', 'b', '2', '2', '2', '2', '2'], [], 15).stars, 1, 'no queue loses orders');
});
test('lab: the chaos monkey finds every single point of failure', () => {
  // 1 LB · 2 app · 3 database · 4 standby; A is DNS
  assert.equal(lab('spof', ['1', '2', '3', '4', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', '1', '2'], [], 14).stars, 3);
  assert.equal(lab('spof', ['1', '2', '3', '4', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', '2'], [], 14).stars, 2, 'one load balancer');
  assert.equal(lab('spof', ['1', '2', '3', 'a', 'b', 'b', 'c', 'c', 'd', '1', '2'], [], 14).stars, 2, 'no standby database');
  assert.equal(lab('spof', ['1', '2', '3', 'a', 'b', 'b', 'c', 'c', 'd'], [], 14).stars, 1, 'nothing has a twin');
});
test('lab: checkout replies after only what the customer must know', () => {
  // 1 queue · 2 cart · 3 payment · 4 orders DB · 5 email · 6 recs · 7 invoice · 8 warehouse; A is Checkout
  const all = ['1', '2', '3', '4', '5', '6', '7', '8'];
  const wire = (direct, queued) => [...all, ...direct.flatMap(l => ['a', l]), 'a', 'b', ...queued.flatMap(l => ['b', l])];
  assert.equal(lab('sync-async', wire(['c', 'd', 'e'], ['f', 'g', 'h', 'i']), [], 13).stars, 3);
  assert.equal(lab('sync-async', wire(['c', 'd', 'e', 'i'], ['f', 'g', 'h']), [], 13).stars, 2, 'the warehouse can wait');
  assert.equal(lab('sync-async', wire(['c', 'e'], ['d', 'f', 'g', 'h', 'i']), [], 13).stars, 1, 'charging later misleads customers');
  assert.equal(lab('sync-async', wire(['c', 'd', 'e', 'f'], ['g', 'h', 'i']), [], 13).stars, 1, 'waiting for email fails during its outage');
});
test('lab: each service subscribes to exactly the events it needs', () => {
  // 1 email · 2 inventory · 3 card alerts · 4 tracking SMS · 5 reviews · 6 loyalty; A OrderPlaced, B PaymentFailed, C ItemShipped
  const svc = ['1', '2', '3', '4', '5', '6'];
  assert.equal(lab('event-driven', [...svc, 'a', 'd', 'a', 'e', 'b', 'e', 'b', 'f', 'c', 'g', 'c', 'h', 'a', 'i'], [], 13).stars, 3);
  assert.equal(lab('event-driven', [...svc, 'a', 'd', 'a', 'e', 'b', 'f', 'c', 'g', 'c', 'h', 'a', 'i'], [], 13).stars, 2, 'inventory must also hear PaymentFailed');
  assert.equal(lab('event-driven', [...svc, 'a', 'd', 'a', 'e', 'a', 'f', 'a', 'g', 'a', 'h', 'a', 'i'], [], 13).stars, 0, 'not everything is OrderPlaced');
});
test('lab: replication needs followers, automatic failover and a spare', () => {
  // 1 leader · 2 follower · 3 failover manager; A is the app
  assert.equal(lab('replication', ['1', '2', '3', 'a', 'b', 'b', 'c', 'a', 'c', 'd', 'b', 'd', 'c', '2', '2'], [], 15).stars, 3);
  assert.equal(lab('replication', ['1', '2', '3', 'a', 'b', 'b', 'c', 'a', 'c', 'd', 'b', 'd', 'c', '2'], [], 15).stars, 1, 'no spare follower');
  assert.equal(lab('replication', ['1', '2', 'a', 'b', 'b', 'c', 'a', 'c', '2', '2'], [], 15).stars, 1, 'no failover manager');
  assert.equal(lab('replication', ['1', 'a', 'b'], [], 15).stars, 0, 'one database');
});
test('lab: every outline shown by the third hint earns 3 stars', () => {
  const DEFS = page.get('LAB_DEFS');
  assert.ok(Object.keys(DEFS).length >= 10);
  for (const [id, o] of Object.entries(DEFS)) {
    labReset();
    // build the outline the way the hint lays it out: stateless servers without wires copy the first of their kind
    const F = o.fixed.length, kinds = [...o.fixed.map(f => f.kind), ...o.solution.nodes], es = o.solution.edges.map(e => e.slice());
    kinds.forEach((k, i) => {
      if (i < F || !o.kinds[k].clone || es.some(([a, b]) => a === i || b === i)) return;
      const first = kinds.indexOf(k);
      es.filter(([a, b]) => a === first || b === first).forEach(([a, b]) => es.push([a === first ? i : a, b === first ? i : b]));
    });
    const nodes = kinds.map((k, i) => i < F ? { ...o.fixed[i], id: 'f' + i, fixed: true } : { id: 'n' + i, kind: k, x: 500, y: 250 });
    LAB_SAVE[id] = { nodes, edges: es.map(([a, b]) => ({ a: nodes[a].id, b: nodes[b].id })), seq: kinds.length, opts: { ...(o.solution.opts || {}) } };
    const r = challenge(page, id);
    r.press('Enter').step(o.dur + 1);
    assert.equal(r.result.stars, 3, `${id}: the outline should earn 3 stars`);
    assert.equal(o.hints.length, 2, `${id}: two hint levels before the outline`);
  }
});
test('lab: hints go a level deeper with each press, then outline a design', () => {
  labReset();
  const r = challenge(page, 'scaling');
  assert.equal(r.inst.hintLabel(), 'Hint');
  const h1 = r.inst.hint('full'), h2 = r.inst.hint('full'), h3 = r.inst.hint('full');
  assert.match(h1.text, /^Hint 1 of 3: Watch the moment/);
  assert.match(h2.text, /^Hint 2 of 3: Put a load balancer/);
  assert.match(h3.text, /^Hint 3 of 3: full One 3-star design is outlined faintly on the board: Users → Load balancer, Load balancer → 4 × Medium server\./);
  assert.equal(h3.label, 'Hide outline');
  assert.equal(r.inst.hint('full').text, null, 'a fourth press hides the outline');
  assert.equal(challenge(page, 'scaling').inst.hintLabel(), 'Hide outline', 'the hint level survives Try again, with the outline back on');
});
test('lab: undo reverses adds, wires and removals', () => {
  labReset();
  const r = challenge(page, 'scaling');
  r.press('1', '3', 'a', 'b');
  assert.match(r.state.status, /<b>A<\/b> Your users → B/);
  r.press('z');   // a plain letter still selects; only Ctrl+Z undoes
  r.inst.key('z', 0, { ctrlKey: true });
  assert.doesNotMatch(r.state.status, /Your users → B/);
  r.click(/^undo$/i);
  assert.doesNotMatch(r.state.status, /<b>C<\/b>/, 'the medium server is gone');
  r.press('b', 'Delete');
  assert.doesNotMatch(r.state.status, /<b>B<\/b> Load balancer/);
  r.click(/^undo$/i);
  assert.match(r.state.status, /<b>B<\/b> Load balancer/);
});
test('lab: a failed run marks its weak spots on the board, until you change the design', () => {
  labReset();
  const r = challenge(page, 'scaling');
  r.press('3', 'a', 'b', '3', '3', '3', 'Enter').step(19);
  assert.ok(r.result.stars < 3);
  assert.match(r.result.msg, /see where it broke on the board/);
  const again = challenge(page, 'scaling');
  assert.match(again.state.status, /Weak spots from your last run:<\/span> Your users → Medium server: failing from 11\.0 s/);
  again.press('1');
  assert.doesNotMatch(again.state.status, /Weak spots/, 'an edit clears them');
});
test('lab: the cheapest 3-star cost is kept, with a lean medal to chase', () => {
  labReset();
  let r = challenge(page, 'scaling');
  r.press('1', '3', 'a', 'b', 'b', 'c', '3', '3', '3', 'Enter').step(19);
  assert.equal(r.result.stars, 3);
  assert.match(r.result.msg, /A 3-star design exists for \$10\/h\. Can you find it\?/);
  assert.equal(page.get('LAB_BEST').scaling, 13);
  for (const k in LAB_SAVE) delete LAB_SAVE[k];
  r = challenge(page, 'scaling');
  r.press('1', '2', 'a', 'b', 'b', 'c', '2', '2', '2', '2', '2', '3', 'b', 'i', 'Enter').step(19);
  assert.equal(r.result.stars, 3);
  assert.match(r.result.msg, /New best: \$10\/h, down from \$13\/h\. Lean medal/);
  assert.match(challenge(page, 'scaling').state.status, /Your cheapest 3-star design: \$10\/h/);
});
test('new chapters: intended answers earn 3 stars', () => {
  assert.equal(runWith('quorums', [[/replicas/i, 3], [/write/i, 2], [/read/i, 2]], 11).stars, 3);
  assert.equal(runWith('bloom-filters', [[/bits/i, 10], [/hash/i, 7]], 9).stars, 3);
  assert.equal(runWith('streams', [[/partitions/i, 6], [/consumers/i, 4]], 13).stars, 3);
  assert.equal(runWith('deployments', [[/strategy/i, 'canary'], [/rollback/i, true]], 13).stars, 3);
  assert.equal(runWith('locks', [[/lease/i, 6], [/fencing/i, true]], 19).stars, 3);
  assert.ok(runWith('locks', [[/lease/i, 6]], 19).stars < 3, 'without fencing a stale write gets through');
});
