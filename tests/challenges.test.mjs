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
test('capstone: chat app has a 3-star design', () => {
  assert.equal(runWith('capstone-chat', [[/gateways/i, 4], [/shards/i, 3], [/pub\/sub/i, true], [/push/i, true], [/resume/i, true]], 17).stars, 3);
  assert.equal(runWith('capstone-chat', [[/gateways/i, 4], [/shards/i, 3], [/pub\/sub/i, true], [/push/i, true]], 17).stars, 2);
});
test('capstone: news feed needs the hybrid', () => {
  assert.equal(runWith('capstone-feed', [[/strategy/i, 'hybrid'], [/workers/i, 3], [/page cache/i, true]], 15).stars, 3);
  assert.ok(runWith('capstone-feed', [[/strategy/i, 'write'], [/workers/i, 6], [/page cache/i, true]], 15).stars < 3);
});
test('new chapters: intended answers earn 3 stars', () => {
  assert.equal(runWith('quorums', [[/replicas/i, 3], [/write/i, 2], [/read/i, 2]], 11).stars, 3);
  assert.equal(runWith('bloom-filters', [[/bits/i, 10], [/hash/i, 7]], 9).stars, 3);
  assert.equal(runWith('streams', [[/partitions/i, 6], [/consumers/i, 4]], 13).stars, 3);
  assert.equal(runWith('deployments', [[/strategy/i, 'canary'], [/rollback/i, true]], 13).stars, 3);
  assert.equal(runWith('locks', [[/lease/i, 6], [/fencing/i, true]], 19).stars, 3);
  assert.ok(runWith('locks', [[/lease/i, 6]], 19).stars < 3, 'without fencing a stale write gets through');
});
