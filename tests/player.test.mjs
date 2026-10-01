// The player/UI script boots, and keyboard navigation through every chapter and
// challenge runs without errors. render() catches drawing errors and logs them
// with console.error, so any logged error fails the test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from './harness.mjs';

test('boots on the first chapter, or the one in the URL hash', () => {
  const page = loadPage({ player: true });
  const chapters = page.get('chapters');
  assert.equal(page.document.getElementById('title').textContent, chapters[0].title);
  assert.equal(page.context.location.hash, '#' + chapters[0].id);
  const deep = loadPage({ player: true, hash: '#caching' });
  assert.equal(deep.document.getElementById('title').textContent, chapters.find(c => c.id === 'caching').title);
  assert.deepEqual(page.errors, []);
  assert.deepEqual(deep.errors, []);
});

test('the sidebar lists every chapter under its group', () => {
  const page = loadPage({ player: true });
  const chapters = page.get('chapters');
  const toc = page.document.getElementById('toc');
  const items = toc.children.filter(e => e.className === 'ch' || e.className.startsWith('ch '));
  assert.equal(items.length, chapters.length);
  const groups = toc.children.filter(e => e.className === 'grp').map(e => e.textContent);
  assert.deepEqual(groups, [...new Set(chapters.map(c => c.group))]);
});

test('every chapter plays, seeks and opens its challenge without errors', () => {
  const page = loadPage({ player: true });
  const chapters = page.get('chapters');
  let ts = 0;
  const run = n => { for (let i = 0; i < n; i++) { ts += 1000 / 30; page.frame(ts); } };
  run(5);
  for (let i = 0; i < chapters.length; i++) {
    const c = chapters[i];
    assert.equal(page.context.location.hash, '#' + c.id, `chapter ${i + 1} did not load`);
    run(10);                                           // play
    page.key('ArrowRight'); page.key('ArrowRight');    // seek
    for (let k = 1; k <= Math.min(9, c.beats.length); k++) { page.key(String(k)); run(1); }
    page.key('c'); page.key('c');                       // captions off / on
    page.key('t'); page.key('Escape');                  // trade-offs card
    page.key('p'); run(30);                             // challenge
    page.key('1'); page.key('2'); run(5);
    page.key('Escape');
    page.key(']');                                     // next chapter
    assert.deepEqual(page.errors, [], `errors in "${c.id}"`);
  }
  assert.equal(page.context.location.hash, '#' + chapters[0].id, '] on the last chapter wraps to the first');
});

test('playing a chapter to the end marks it seen and shows the trade-offs card', () => {
  const page = loadPage({ player: true, hash: '#packets' });
  const c = page.get('chapters')[0];
  let ts = 0;
  // speed up: 2× playback, frames are capped at 60 ms
  page.document.getElementById('speed').onchange({ target: { value: '2' } });
  for (let i = 0; i < (c.dur / 2 + 2) / 0.06; i++) { ts += 60; page.frame(ts); }
  assert.ok(page.document.getElementById('card').classList.contains('show'), 'trade-offs card not shown');
  assert.match(page.context.localStorage.getItem('sdve-seen'), /"packets":1/);
  assert.deepEqual(page.errors, []);
});
