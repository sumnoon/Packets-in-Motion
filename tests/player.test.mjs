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

test('screen readers: chapter names, current step, live captions and transcript', () => {
  const page = loadPage({ player: true, hash: '#caching' });
  const chapters = page.get('chapters');
  const i = chapters.findIndex(c => c.id === 'caching'), c = chapters[i];
  const items = page.document.getElementById('toc').children.filter(e => e.dataset.i !== undefined);
  const on = items.find(b => b.getAttribute('aria-current') === 'page');
  assert.equal(on.getAttribute('aria-label'), `${i + 1}. ${c.title}, 0 of 3 stars`);
  assert.equal(items.filter(b => b.getAttribute('aria-current')).length, 1);
  assert.ok(page.get('cv').getAttribute('aria-label').startsWith(`${c.title}. Step 1 of ${c.beats.length}: `));
  page.runTimers(1);
  assert.equal(page.document.getElementById('srLive').textContent, `${c.title}. Step 1 of ${c.beats.length}: ${c.beats[0][1]}. ${c.beats[0][2]}`);
  // transcript: one entry per step, toggled with S, remembered
  const tr = page.document.getElementById('transcript');
  assert.equal(page.document.getElementById('trList').children.length, c.beats.length);
  assert.equal(tr.hidden, true);
  page.key('s');
  assert.equal(tr.hidden, false);
  assert.equal(page.document.getElementById('trBtn').getAttribute('aria-expanded'), 'true');
  assert.equal(page.context.localStorage.getItem('pim-tr'), '1');
  // a transcript entry seeks there
  page.document.getElementById('trList').children[2].children[0].click();
  page.runTimers(2);
  assert.match(page.document.getElementById('srLive').textContent, /^Step 3 of /);
  assert.equal(page.document.getElementById('trList').children[2].classList.contains('now'), true);
  assert.deepEqual(page.errors, []);
});

test('Space and Enter on a focused button are left to the button', () => {
  const page = loadPage({ player: true });
  const before = page.document.getElementById('playBtn').getAttribute('aria-label');
  page.key(' ', { tagName: 'BUTTON' });
  assert.equal(page.document.getElementById('playBtn').getAttribute('aria-label'), before);
  page.key(' ');
  assert.notEqual(page.document.getElementById('playBtn').getAttribute('aria-label'), before);
});

test('themes: picked from the sidebar, remembered, high contrast brightens the stage', () => {
  const page = loadPage({ player: true });
  const C = page.get('C'), dim = C.dim, sel = page.document.getElementById('theme');
  assert.equal(page.document.documentElement.getAttribute('data-theme'), 'dark');
  sel.onchange({ target: { value: 'contrast' } });
  assert.equal(page.document.documentElement.getAttribute('data-theme'), 'contrast');
  assert.notEqual(C.dim, dim);
  assert.equal(page.context.localStorage.getItem('pim-theme'), 'contrast');
  sel.onchange({ target: { value: 'light' } });
  assert.equal(C.dim, dim, 'the stage keeps its own palette in the light theme');
  assert.equal(page.document.documentElement.getAttribute('data-theme'), 'light');
  assert.deepEqual(page.errors, []);
});

test('a share link opens its lab with the design on the board', () => {
  const base = loadPage();
  const code = base.get('labEncode')('scaling', { nodes: [{ id: 'f0', kind: 'users', x: 70, y: 250 }, { id: 'n1', kind: 'lb', x: 260, y: 250 }, { id: 'n2', kind: 'medium', x: 560, y: 120 }], edges: [{ a: 'f0', b: 'n1' }, { a: 'n1', b: 'n2' }], opts: {} });
  const page = loadPage({ player: true, search: '?lab=scaling&d=' + encodeURIComponent(code) });
  assert.equal(page.document.body.classList.contains('play'), true, 'the challenge is open');
  assert.match(page.document.getElementById('cStatus').innerHTML, /Someone shared this design with you: \$4\/h/);
  assert.equal(page.context.location.hash, '#scaling', 'the link is tidied to the lab address');
  const bad = loadPage({ player: true, search: '?lab=scaling&d=garbage' });
  assert.equal(bad.document.body.classList.contains('play'), false, 'a broken link just opens the course');
  assert.deepEqual(page.errors, []);
});
