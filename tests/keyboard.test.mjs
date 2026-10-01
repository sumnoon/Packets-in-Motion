// Every challenge can be finished with the keyboard alone, and the status line
// (read out by screen readers) says what is on the stage.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, challenge } from './harness.mjs';

const page = loadPage();
const CHAL = page.get('CHAL');
const play = id => challenge(page, id);

test('every challenge that takes clicks or drags also takes keys', () => {
  for (const id of Object.keys(CHAL)) {
    const { inst } = play(id);
    if (inst.click || inst.down) assert.equal(typeof inst.key, 'function', `${id} has no key handler`);
  }
});

test('sort games read the current card aloud', () => {
  const r = play('sql-nosql');
  assert.match(r.state.status, /Card <b>1<\/b> of \d+: “.+”/);
  assert.match(r.state.status, /<kbd>1<\/kbd> SQL · <kbd>2<\/kbd> NoSQL/);
  for (let i = 0; i < 40 && !r.result; i++) r.press('1').step(1.2);
  assert.ok(r.result, 'never finished');
});

for (const id of ['client-server', 'transactions']) {
  test(`${id}: order game can be solved with letters, Backspace and Enter`, () => {
    const r = play(id);
    assert.match(r.state.status, /Tray: <kbd>A<\/kbd>/);
    r.press('a', 'b', 'Backspace', 'b');
    assert.match(r.state.status, /Slot 2: /);
    // keep placing whatever is left, then check; wrong cards go back to the tray
    for (let round = 0; round < 40 && !r.result; round++) {
      const L = 'abcdefgh'.split('').sort(() => Math.random() - 0.5);
      r.press(...L, 'Enter').step(4);
    }
    assert.ok(r.result, 'never solved');
  });
}

test('cdn: number keys place the edges', () => {
  const r = play('cdn');
  r.press('3', '4');
  assert.match(r.state.status, /Europe and Asia/);
  r.click(/run/i).step(9);
  assert.equal(r.result.stars, 3);
});

test('spof: the lab is built and run with keys', () => {
  for (const k in page.get('LAB_SAVE')) delete page.get('LAB_SAVE')[k];
  const r = play('spof');
  // 1 LB · 2 app · 3 database · 4 standby; A is DNS
  r.press('1', '2', '3', '4', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', '1', '2');
  assert.match(r.state.status, /<b>A<\/b> DNS → B, F/);
  r.press('Enter').step(16);
  assert.equal(r.result.stars, 3);
});

test('replication: the lab is built and run with keys', () => {
  for (const k in page.get('LAB_SAVE')) delete page.get('LAB_SAVE')[k];
  const r = play('replication');
  // 1 leader · 2 follower · 3 failover manager; A is the app
  r.press('1', '2', '3', 'a', 'b', 'b', 'c', 'a', 'c', 'd', 'b', 'd', 'c', '2', '2');
  assert.match(r.state.status, /<b>B<\/b> Leader database → C, E, F/);
  r.press('Enter').step(17);
  assert.equal(r.result.stars, 3);
});

test('indexing: number keys walk down the index', () => {
  const r = play('indexing');
  assert.match(r.state.status, /<kbd>1<\/kbd> 1–2,500/);
  for (let i = 0; i < 60 && !r.result; i++) r.press(String(1 + (i % 6)));
  assert.ok(r.result, 'never found the row');
});

test('caching: slot numbers evict', () => {
  const r = play('caching');
  for (let i = 0; i < 400 && !r.result; i++) { r.step(0.3); if (/evict/.test(r.state.status)) { assert.match(r.state.status, /<kbd>4<\/kbd>/); r.press('1'); } }
  assert.ok(r.result, 'never finished');
});

test('microservices: number keys move features between services', () => {
  const r = play('microservices');
  r.press('1', '2', '3', '4', '5', '6', '6');
  assert.match(r.state.status, /Service 1: Users, Auth, Catalog · Service 2: Search, Cart · Service 3: Payments/);
  r.click(/check/i);
  assert.ok(r.result);
});

test('observability: a number key names the culprit', () => {
  const r = play('observability');
  r.press('3');
  assert.match(r.state.status, /Payments is not the cause/);
  r.press('6');
  assert.ok(r.result && r.result.stars >= 1);
});
