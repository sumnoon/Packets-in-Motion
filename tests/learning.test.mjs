// Section quizzes, before/related links, glossary, search, progress export/import, sound.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, challenge } from './harness.mjs';

const page = loadPage();
const chapters = page.get('chapters'), QUIZ = page.get('QUIZ');
const ids = new Set(chapters.map(c => c.id));
const groups = [...new Set(chapters.map(c => c.group))];

// ---------- content ----------
test('every section with more than one chapter has a quiz', () => {
  for (const g of groups) {
    const n = chapters.filter(c => c.group === g).length;
    if (n > 1) assert.ok(QUIZ[g], `no quiz for ${g}`);
  }
  for (const g of Object.keys(QUIZ)) assert.ok(groups.includes(g), `quiz for unknown section ${g}`);
});

for (const [g, q] of Object.entries(QUIZ)) {
  test(`${g} quiz: well-formed questions`, () => {
    for (const k of ['title', 'goal', 'hint']) assert.ok(q[k] && q[k].length > 3, `missing ${k}`);
    const src = questions(g);
    assert.ok(src.length >= 5, 'at least 5 questions');
    for (const x of src) {
      assert.ok(x.a.length >= 2 && x.a.length <= 4, `${x.q}: 2–4 answers`);
      assert.equal(new Set(x.a).size, x.a.length, `${x.q}: duplicate answers`);
      assert.ok(x.why && x.why.endsWith('.'), `${x.q}: needs an explanation`);
      assert.ok(ids.has(x.ch), `${x.q}: unknown chapter "${x.ch}"`);
    }
  });

  test(`${g} quiz: all right gives 3 stars; all wrong names chapters to rewatch`, () => {
    for (const aim of ['right', 'wrong']) {
      const r = quizRun(g);
      for (let i = 0; i < 20 && !r.result; i++) {
        const m = r.state.status.match(/^Question <b>\d+<\/b> of \d+: (.*?) (<kbd>1<\/kbd>.*)$/);
        assert.ok(m, `status: ${r.state.status}`);
        const def = questions(g).find(x => esc(x.q) === m[1]);
        const opts = [...m[2].matchAll(/<kbd>(\d)<\/kbd> (.*?)(?= · <kbd>|$)/g)].map(o => o[2]);
        const k = opts.findIndex(o => (o === esc(def.a[0])) === (aim === 'right'));
        r.press(String(k + 1), 'Enter').step(0.2);
      }
      assert.ok(r.result, 'no result');
      if (aim === 'right') assert.equal(r.result.stars, 3);
      else { assert.equal(r.result.stars, 0); assert.match(r.result.msg, /^Worth a rewatch: /); }
    }
  });
}

test('before/related links point at real, other chapters', () => {
  for (const c of chapters) {
    for (const k of ['needs', 'related']) {
      assert.ok(Array.isArray(c[k]), `${c.id}: missing ${k}`);
      for (const id of c[k]) { assert.ok(ids.has(id), `${c.id}.${k}: unknown "${id}"`); assert.notEqual(id, c.id); }
    }
    assert.ok(c.related.length >= 1, `${c.id}: needs at least one related chapter`);
  }
});

test('glossary: unique terms, full-sentence definitions, every term used somewhere', () => {
  const G = page.get('GLOSSARY');
  const forms = G.flatMap(([t, , alt]) => [t, ...alt].map(f => f.toLowerCase()));
  assert.equal(new Set(forms).size, forms.length, 'a spelling belongs to two terms');
  const text = chapters.map(c => [c.title, ...c.beats.map(b => b[1] + ' ' + b[2]), ...c.use, ...c.cons].join(' ')).join('\n');
  for (const [t, d, alt] of G) {
    assert.ok(/^[A-Z0-9"]/.test(d) && /[.…]$/.test(d), `${t}: definition should be a sentence`);
    const used = [t, ...alt].some(f => new RegExp('(?<![A-Za-z0-9-])' + f.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '(?![A-Za-z0-9])', /^[A-Z0-9]+$/.test(f) ? '' : 'i').test(text));
    assert.ok(used, `"${t}" never appears in the course`);
  }
});

// ---------- player ----------
test('search filters chapters, hides empty sections, Enter opens the first match', () => {
  const p = loadPage({ player: true });
  const find = p.document.getElementById('find');
  find.value = 'cache';
  find.dispatch('input', { target: find });
  const toc = p.document.getElementById('toc').children;
  const shown = toc.filter(e => e.className.startsWith('ch') && !e.hidden).map(e => p.get('chapters')[+e.dataset.i].id);
  assert.ok(shown.includes('caching') && shown.includes('cdn') && shown.includes('hot-keys'), shown.join());
  assert.ok(!shown.includes('consensus'));
  assert.equal(toc.find(e => e.className === 'grp' && e.dataset.g === 'Start Here').hidden, true);
  assert.match(p.document.getElementById('findMsg').textContent, /^\d+ chapters match$/);
  find.value = 'zzzz'; find.dispatch('input', { target: find });
  assert.equal(p.document.getElementById('noFind').hidden, false);
  find.value = 'leader election'; find.dispatch('input', { target: find });
  const first = toc.find(e => e.className.startsWith('ch') && !e.hidden);
  find.dispatch('keydown', { key: 'Enter', target: find });
  assert.equal(p.context.location.hash, '#' + p.get('chapters')[+first.dataset.i].id);
  find.dispatch('keydown', { key: 'Escape', target: find });
  assert.equal(find.value, '');
  assert.deepEqual(p.errors, []);
});

test('quizzes sit at the end of their section and run in challenge mode', () => {
  const p = loadPage({ player: true });
  const toc = p.document.getElementById('toc').children;
  const qz = toc.filter(e => e.className.startsWith('qz'));
  assert.equal(qz.length, Object.keys(QUIZ).length);
  for (const b of qz) {
    const next = toc[toc.indexOf(b) + 1];
    assert.ok(!next || next.className === 'grp', `${b.dataset.q} quiz is not last in its section`);
  }
  qz.find(b => b.dataset.q === 'Data').click();
  assert.equal(p.context.location.hash, '#quiz-data');
  assert.equal(p.document.getElementById('title').textContent, 'Data recap');
  assert.equal(p.document.getElementById('cTag').textContent, 'Quiz');
  assert.equal(p.document.getElementById('chalBtn').hidden, true);
  p.key('Escape');
  assert.match(p.context.location.hash, /^#[a-z-]+$/);
  assert.notEqual(p.context.location.hash, '#quiz-data');
  // deep link straight into a quiz
  const d = loadPage({ player: true, hash: '#quiz-reliability' });
  assert.equal(d.document.getElementById('title').textContent, 'Reliability recap');
  assert.deepEqual(p.errors, []); assert.deepEqual(d.errors, []);
});

test('the trade-offs card links to earlier and related chapters', () => {
  const p = loadPage({ player: true, hash: '#hot-keys' });
  const box = p.document.getElementById('cardLinks');
  assert.match(box.textContent, /^Before this:Caching Strategies & LRU EvictionRelated:/);
  box.children[1].children[1].click();
  assert.equal(p.context.location.hash, '#sharding');
});

test('glossary terms in captions and the glossary dialog', () => {
  const p = loadPage({ player: true, hash: '#caching' });
  const cap = p.document.getElementById('capText');
  const terms = cap.children.filter(c => c.className === 'term');
  assert.ok(terms.length >= 1, 'no terms in the first caption');
  assert.equal(terms[0].getAttribute('aria-describedby'), 'tip');
  assert.equal(cap.textContent, p.get('chapters').find(c => c.id === 'caching').beats[0][2], 'caption text changed');
  p.key('g');
  const dlg = p.document.getElementById('glossary');
  assert.equal(dlg.open, true);
  const dts = p.document.getElementById('glList').children.filter(e => e.tagName === 'DT');
  assert.equal(dts.length, p.get('GLOSSARY').length);
  assert.deepEqual(p.errors, []);
});

test('progress export and import merge, and reject bad files', async () => {
  const p = loadPage({ player: true });
  p.context.localStorage.setItem('x', '1');
  const file = { app: 'packets-in-motion', version: 1, seen: { caching: 1, nope: 1 }, stars: { caching: 3, 'quiz-data': 2, sharding: 9 } };
  const input = p.document.getElementById('importFile');
  const load = text => input.onchange({ target: { files: [{ text: () => Promise.resolve(text) }], value: 'x' } });
  await load(JSON.stringify(file));
  assert.match(p.document.getElementById('ioMsg').textContent, /^Imported 1 more chapter watched and 5 more stars\.$/);
  const stars = JSON.parse(p.context.localStorage.getItem('pim-stars'));
  assert.deepEqual(stars, { caching: 3, 'quiz-data': 2 });
  assert.match(p.document.getElementById('starTotal').textContent, /^★ 5 \//);
  await load(JSON.stringify(file));
  assert.match(p.document.getElementById('ioMsg').textContent, /^Nothing new/);
  await load('{"hello":1}');
  assert.match(p.document.getElementById('ioMsg').textContent, /not a Packets in Motion progress file/);
  await load('not json');
  assert.match(p.document.getElementById('ioMsg').textContent, /not valid JSON/);
  // export carries what was imported
  p.document.getElementById('exportBtn').click();
  assert.match(p.document.getElementById('ioMsg').textContent, /saved/);
  assert.deepEqual(p.errors, []);
});

test('sound cues are off by default and remembered', () => {
  const p = loadPage({ player: true });
  const b = p.document.getElementById('soundBtn');
  assert.equal(b.getAttribute('aria-pressed'), 'false');
  b.click();
  assert.equal(b.getAttribute('aria-pressed'), 'true');
  assert.equal(p.context.localStorage.getItem('pim-sound'), '1');
  assert.deepEqual(p.errors, []);
});

// ---------- helpers ----------
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const questions = g => QUIZ[g].make.questions;
const quizRun = g => challenge(page, null, QUIZ[g]);
