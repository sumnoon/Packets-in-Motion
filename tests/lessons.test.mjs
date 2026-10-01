// Every lesson: well-formed metadata, draws without errors from start to end,
// and is a pure function of t (seeking to a moment always gives the same picture).
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from './harness.mjs';

const page = loadPage();
const chapters = page.get('chapters');
const CHAL = page.get('CHAL');
// a fresh frame, as render() starts one
const drawAt = (c, t) => { page.reset(); c.draw(t); };
const GROUPS = ['Start Here', 'Foundations', 'Traffic', 'Data', 'Communication', 'Reliability', 'Architecture', 'Advanced', 'Capstone'];

test('chapter ids are unique, kebab-case and groups are contiguous and in course order', () => {
  const ids = chapters.map(c => c.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate chapter id');
  ids.forEach(id => assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/));
  const seen = [];
  chapters.forEach(c => {
    assert.ok(GROUPS.includes(c.group), `${c.id}: unknown group "${c.group}"`);
    if (seen[seen.length - 1] !== c.group) {
      assert.ok(!seen.includes(c.group), `${c.id}: group "${c.group}" is split in two`);
      seen.push(c.group);
    }
  });
  assert.deepEqual(seen, GROUPS.filter(g => seen.includes(g)), 'groups out of order');
});

test('every chapter has a challenge and every challenge has a chapter', () => {
  const ids = new Set(chapters.map(c => c.id));
  for (const id of Object.keys(CHAL)) assert.ok(ids.has(id), `challenge "${id}" has no chapter`);
  for (const c of chapters) assert.ok(CHAL[c.id], `chapter "${c.id}" has no challenge`);
});

for (const c of chapters) {
  test(`${c.id}: metadata`, () => {
    assert.equal(typeof c.title, 'string');
    assert.ok(c.title.length > 3);
    assert.ok(Number.isFinite(c.dur) && c.dur > 10 && c.dur < 120, `dur ${c.dur}`);
    assert.ok(Array.isArray(c.beats) && c.beats.length >= 3, 'needs at least 3 beats');
    assert.ok(c.beats.length <= 10, 'number keys 1–9 and 0 only reach 10 beats');
    assert.equal(c.beats[0][0], 0, 'first beat must start at 0');
    c.beats.forEach((b, i) => {
      assert.equal(b.length, 3, `beat ${i + 1} must be [time, title, caption]`);
      assert.ok(b[0] < c.dur, `beat ${i + 1} starts after the end`);
      if (i) assert.ok(b[0] > c.beats[i - 1][0], `beat ${i + 1} is not after beat ${i}`);
      assert.ok(b[1].length > 0 && b[2].length > 0, `beat ${i + 1} needs a title and a caption`);
    });
    for (const k of ['use', 'cons']) {
      assert.ok(Array.isArray(c[k]) && c[k].length >= 2, `${k} needs at least 2 points`);
      c[k].forEach(s => assert.equal(typeof s, 'string'));
    }
  });

  test(`${c.id}: draws every moment without errors`, () => {
    for (let t = 0; t <= c.dur + 1e-9; t += 0.05) {
      try { drawAt(c, Math.min(t, c.dur)); } catch (e) { e.message = `at t=${t.toFixed(2)}: ${e.message}`; throw e; }
    }
  });

  test(`${c.id}: seeking is exact (draw is a pure function of t)`, () => {
    const at = t => { page.log.calls = []; page.log.on = true; drawAt(c, t); page.log.on = false; return page.log.calls.join('\n'); };
    const moments = c.beats.map(b => b[0] + 0.37).concat(c.dur * 0.5, c.dur);
    const first = moments.map(at);
    // draw other moments in between, backwards, then compare
    moments.slice().reverse().forEach(t => drawAt(c, t));
    moments.forEach((t, i) => assert.equal(at(t), first[i], `picture at t=${t.toFixed(2)} changed after seeking elsewhere`));
  });
}
