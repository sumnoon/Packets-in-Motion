// Runs the built index.html inside a Node vm with a fake DOM and a fake 2D canvas.
// No dependencies: the fake canvas only checks the arguments a real browser would
// reject (negative radii, bad gradient stops, unparsable colours), and can record
// every call so tests can compare two renders of the same moment.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function scripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
}

// ---------- colours ----------
const NAMED = new Set(['transparent', 'black', 'white', 'red', 'green', 'blue', 'currentcolor']);
function validColor(c) {
  if (typeof c !== 'string') return true; // gradients / patterns
  const s = c.trim().toLowerCase();
  if (NAMED.has(s)) return true;
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return true;
  const m = s.match(/^(rgba?|hsla?)\((.*)\)$/);
  if (!m) return false;
  return m[2].split(/[ ,/]+/).filter(Boolean).every(p => Number.isFinite(parseFloat(p)) && /^-?[\d.]+(e-?\d+)?%?$/.test(p));
}

class CanvasError extends Error {}
const fail = msg => { throw new CanvasError(msg); };
const finite = (name, args) => args.forEach((v, i) => { if (typeof v === 'number' && !Number.isFinite(v)) fail(`${name}: argument ${i} is ${v}`); });

// ---------- fake 2D context ----------
export function makeContext() {
  const log = { on: false, calls: [] };
  const r = v => (typeof v === 'number' ? Math.round(v * 100) / 100 : typeof v === 'object' && v ? v.id ?? '[obj]' : v);
  const rec = (name, args) => { if (log.on) log.calls.push(name + '(' + args.map(r).join(',') + ')'); };
  const gradient = kind => {
    const gr = { id: kind, addColorStop(o, col) {
      if (!Number.isFinite(o) || o < 0 || o > 1) fail(`addColorStop: offset ${o} outside [0, 1]`);
      if (!validColor(col)) fail(`addColorStop: invalid colour "${col}"`);
      rec(gr.id + '.addColorStop', [o, col]);
    } };
    return gr;
  };
  const DEFAULTS = { font: '10px sans-serif', fillStyle: '#000', strokeStyle: '#000', globalAlpha: 1, lineWidth: 1, shadowBlur: 0, shadowColor: 'transparent', lineCap: 'butt', lineJoin: 'miter', textAlign: 'start', textBaseline: 'alphabetic', globalCompositeOperation: 'source-over' };
  let state = { ...DEFAULTS };
  const stack = [];
  const checks = {
    arc(x, y, rad) { finite('arc', [rad]); if (rad < 0) fail(`arc: negative radius ${rad}`); },
    arcTo(x1, y1, x2, y2, rad) { if (rad < 0) fail(`arcTo: negative radius ${rad}`); },
    ellipse(x, y, rx, ry) { if (rx < 0 || ry < 0) fail(`ellipse: negative radius ${rx}, ${ry}`); },
  };
  const ctx = {
    canvas: null,
    measureText(s) { const z = parseFloat(String(state.font).match(/([\d.]+)px/)?.[1] || 10); return { width: String(s).length * z * 0.55 }; },
    createLinearGradient(...a) { finite('createLinearGradient', a); rec('createLinearGradient', a); return gradient('lin'); },
    createRadialGradient(...a) {
      finite('createRadialGradient', a);
      if (a[2] < 0 || a[5] < 0) fail(`createRadialGradient: negative radius ${a[2]}, ${a[5]}`);
      rec('createRadialGradient', a); return gradient('rad');
    },
    getLineDash: () => [], isPointInPath: () => false,
    save() { stack.push({ ...state }); rec('save', []); },
    restore() { if (stack.length) state = stack.pop(); rec('restore', []); },
  };
  // what render() does before every frame
  const reset = () => { state = { ...DEFAULTS }; stack.length = 0; };
  const proxy = new Proxy(ctx, {
    get(t, k) {
      if (k in t) return t[k];
      if (k in state) return state[k];
      if (typeof k === 'symbol') return undefined;
      return (...args) => { if (checks[k]) checks[k](...args); rec(k, args); };
    },
    set(t, k, v) {
      if ((k === 'fillStyle' || k === 'strokeStyle' || k === 'shadowColor') && !validColor(v)) fail(`${k}: invalid colour "${v}"`);
      if (k === 'globalAlpha' && !Number.isFinite(v)) fail(`globalAlpha: ${v}`);
      state[k] = v; rec('set ' + k, [v]); return true;
    },
  });
  return { ctx: proxy, log, reset };
}

// ---------- fake DOM (just enough for the player) ----------
class ClassList {
  constructor(el) { this.el = el; }
  get set() { return new Set(this.el.className.split(/\s+/).filter(Boolean)); }
  write(s) { this.el.className = [...s].join(' '); }
  add(...c) { const s = this.set; c.forEach(x => s.add(x)); this.write(s); }
  remove(...c) { const s = this.set; c.forEach(x => s.delete(x)); this.write(s); }
  contains(c) { return this.set.has(c); }
  toggle(c, force) { const s = this.set; const on = force === undefined ? !s.has(c) : !!force; on ? s.add(c) : s.delete(c); this.write(s); return on; }
}
function makeDocument(ctx) {
  const all = [];
  const listeners = new Map();
  class El {
    constructor(tag, id = '') {
      Object.assign(this, { tagName: tag.toUpperCase(), id, className: '', children: [], attrs: {}, dataset: {}, hidden: false, disabled: false, value: '', title: '', _text: '', _html: '', open: false });
      this.style = { setProperty() {}, removeProperty() {} };
      this.classList = new ClassList(this);
      this.ls = {};
      all.push(this);
    }
    get innerHTML() { return this._html; }
    set innerHTML(v) { this._html = String(v); if (v === '') { this.children.forEach(c=>{if(c.tagName)c.parentNode=null;});this.children = []; this._text = ''; } }
    // text nodes are kept as {text} entries so textContent reads back like the DOM
    get textContent() { return this._text + this.children.map(c => (c.text !== undefined ? c.text : c.textContent)).join(''); }
    set textContent(v) { this._text = String(v); this.children = []; }
    appendChild(c) { if(c.parentNode)c.remove();this.children.push(c); c.parentNode = this; return c; }
    prepend(c) { if(c.parentNode)c.remove();this.children.unshift(c);c.parentNode=this; }
    insertBefore(c,ref) { if(c.parentNode)c.remove();const i=this.children.indexOf(ref);this.children.splice(i<0?this.children.length:i,0,c);c.parentNode=this;return c; }
    append(...cs) { cs.forEach(c => (typeof c === 'string' ? this.children.push({ text: c }) : this.appendChild(c))); }
    replaceChildren(...cs) { this.children.forEach(c=>{if(c.tagName)c.parentNode=null;});this.children=[];this._text='';this.append(...cs); }
    remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(c => c !== this); }
    closest(sel) { let e = this; while (e) { if (e.classList && match(sel, [e]).length) return e; e = e.parentNode; } return null; }
    showModal() { this.returnFocus=document.activeElement;this.open = true; } close() { this.open = false;if(this.returnFocus)this.returnFocus.focus(); }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    removeAttribute(k) { delete this.attrs[k]; }
    contains(el) { return el === this || descendants(this).includes(el); }
    addEventListener(type, fn) { (this.ls[type] ||= []).push(fn); }
    removeEventListener() {}
    dispatch(type, ev = {}) { (this.ls[type] || []).forEach(fn => fn({ target: this, preventDefault() {}, ...ev })); }
    click() { if (this.disabled) return; if (this.onclick) this.onclick({ target: this }); this.dispatch('click'); }
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
    querySelectorAll(sel) { return match(sel, descendants(this)); }
    getBoundingClientRect() { return { left: 0, top: 0, width: 1000, height: 560 }; }
    focus() { document.activeElement=this; } blur() { if(document.activeElement===this)document.activeElement=document.body; } scrollIntoView() {} setPointerCapture() {} releasePointerCapture() {}
    getContext() { return ctx; }
    get offsetWidth() { return 1000; }
  }
  const descendants = el => el.children.filter(c => c.tagName).flatMap(c => [c, ...descendants(c)]);
  const match = (sel, list) => {
    if(sel.includes(',')){const hits=new Set(sel.split(',').flatMap(s=>match(s.trim(),list)));return list.filter(e=>hits.has(e));}
    if(sel==='[hidden]')return list.filter(e=>e.hidden);
    if(/^[a-z]+(\[href\])?$/.test(sel))return list.filter(e=>e.tagName===sel.split('[')[0].toUpperCase()&&(!sel.includes('[')||e.getAttribute('href')!==null));
    const cls = sel.split('.').filter(Boolean);
    if (!sel.startsWith('.')) return [];
    return list.filter(e => cls.every(c => e.classList.contains(c)));
  };
  const byId = new Map();
  const document = {
    title: '',hidden:false,
    body: new El('body'),
    documentElement: new El('html'),
    fullscreenEnabled: false,
    getElementById(id) { if (!byId.has(id)) { const existing=all.find(e=>e.id===id);if(existing)byId.set(id,existing);else{const tag = id === 'cv' ? 'canvas' : id === 'speed' ? 'select' : id === 'scrub' ? 'input' : 'div'; byId.set(id, new El(tag, id));}} return byId.get(id); },
    createElement: tag => new El(tag),
    querySelector(sel) { return this.querySelectorAll(sel)[0] || null; },
    querySelectorAll(sel) { return match(sel, all); },
    addEventListener(type, fn) { (listeners.get(type) || listeners.set(type, []).get(type)).push(fn); },
    dispatch(type,ev={}){(listeners.get(type)||[]).forEach(fn=>fn({target:this,preventDefault(){},...ev}));},
  };
  // Real initial tags, hidden attributes and ancestry matter for dialogs and drawers.
  const body=fs.readFileSync(path.join(ROOT,'index.html'),'utf8').split('<body>')[1]?.split('<script>')[0]||'';
  const stack=[document.body],voids=new Set(['input','img','path','meta','link','br']);
  for(const m of body.matchAll(/<!--[^]*?-->|<\/?([\w-]+)([^>]*?)>/g)){
    if(!m[1])continue;const tag=m[1];if(m[0].startsWith('</')){if(stack[stack.length-1].tagName===tag.toUpperCase())stack.pop();continue;}
    const el=new El(tag);for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)){el.setAttribute(a[1],a[2]||'');if(a[1]==='id'){el.id=a[2];byId.set(el.id,el);}if(a[1]==='class')el.className=a[2];if(a[1]==='hidden')el.hidden=true;if(a[1]==='value')el.value=a[2];if(a[1]==='type')el.type=a[2];}
    stack[stack.length-1].appendChild(el);if(!voids.has(tag)&&!m[0].endsWith('/>'))stack.push(el);
  }
  document.activeElement=document.body;
  return document;
}

// ---------- load the page into a vm context ----------
// opts.player: also run the player/UI script (needs the fake DOM)
export function loadPage(opts = {}) {
  const { ctx, log, reset } = makeContext();
  const document = makeDocument(ctx);
  if(opts.fullscreen){document.fullscreenEnabled=true;document.documentElement.requestFullscreen=()=>{document.fullscreenElement=document.documentElement;return Promise.resolve();};}
  const errors = [];
  const timers = [];
  const frames = [];
  const winListeners = {};
  const media=new Map();
  const storage = new Map(Object.entries(opts.storage || {}));
  let timerId=0;
  const context = {
    document,
    console: { log() {}, info() {}, warn() {}, error: (...a) => errors.push(a.map(x => (x && x.stack) || String(x)).join(' ')) },
    matchMedia(query) {if(!media.has(query)){const handlers=[];media.set(query,{matches:!!opts.media?.[query],addEventListener(_,fn){handlers.push(fn);},addListener(fn){handlers.push(fn);},change(matches){this.matches=matches;handlers.forEach(fn=>fn(this));}});}return media.get(query);},
    localStorage: { getItem(k) { if(opts.storageError?.get)throw new Error('storage denied');return storage.has(k)?storage.get(k):null; }, setItem(k,v) { if(opts.storageError?.set)throw new Error('storage full');storage.set(k,String(v)); }, removeItem: k => storage.delete(k) },
    location: { hash: opts.hash || '', search: opts.search || '', pathname: '/index.html', href: opts.href || 'https://example.test/index.html' + (opts.search || '') + (opts.hash || '') },
    history: { replaceState(_, __, url) { context.location.hash = url; } },
    screen: { orientation: { lock: () => Promise.resolve(), unlock() {} } },
    devicePixelRatio: 1, innerWidth: 1280, innerHeight: 800,
    requestAnimationFrame: fn => frames.push(fn),
    setTimeout: (fn, ms = 0) => { const id=++timerId;timers.push({ id,fn, at: (context.__now || 0) + ms / 1000 }); return id; },
    clearTimeout(id) { const i=timers.findIndex(t=>t.id===id);if(i>=0)timers.splice(i,1); },
    addEventListener: (type, fn) => (winListeners[type] ||= []).push(fn),
    removeEventListener() {},
    URLSearchParams, Math, JSON, Object, Array, Number, String, Set, Map, Promise, Date, Error, Symbol, Proxy, Reflect, Infinity, NaN, parseInt, parseFloat, isFinite,
  };
  context.window = context;
  const historyEntries=[{state:null,url:context.location.href}];let historyIndex=0;
  const updateLocation=url=>{const u=new URL(url,context.location.href);Object.assign(context.location,{href:u.href,hash:u.hash,search:u.search,pathname:u.pathname});};
  const travel=delta=>{const next=historyIndex+delta;if(next<0||next>=historyEntries.length)return;const old=context.location.href;historyIndex=next;const entry=historyEntries[next];updateLocation(entry.url);(winListeners.popstate||[]).forEach(fn=>fn({state:entry.state}));if(old!==entry.url)(winListeners.hashchange||[]).forEach(fn=>fn({oldURL:old,newURL:entry.url}));};
  context.history={get state(){return historyEntries[historyIndex].state;},get length(){return historyEntries.length;},pushState(state,_,url){if(url!==undefined)updateLocation(url);historyEntries.splice(++historyIndex);historyEntries.push({state:JSON.parse(JSON.stringify(state)),url:context.location.href});},replaceState(state,_,url){if(url!==undefined)updateLocation(url);historyEntries[historyIndex]={state:JSON.parse(JSON.stringify(state)),url:context.location.href};},back(){travel(-1);},forward(){travel(1);}};
  context.globalThis = context;
  vm.createContext(context);
  const src = scripts();
  const n = opts.player ? src.length : src.length - 1; // the player is the last script
  src.slice(0, n).forEach((s, i) => vm.runInContext(s, context, { filename: `index.html<script #${i + 1}>` }));
  // let-declared globals (chapters, CHAL, ...) live in the script scope, not on the context object
  const get = name => vm.runInContext(name, context);
  return {
    context, get, log, reset, errors, frames, timers, winListeners, document, storage,media,
    runTimers(now) { context.__now = now; for (let i = 0; i < timers.length; i++) if (timers[i].at <= now) { const t = timers.splice(i--, 1)[0]; t.fn(); } },
    key(key, target = opts.player ? document.getElementById('main') : document.body, extra={}) { (winListeners.keydown || []).forEach(fn => fn({ key, target, preventDefault() {},...extra }));if(key==='Escape'){const dialogs=document.querySelectorAll('dialog').filter(d=>d.open);dialogs.at(-1)?.dispatch('cancel');} },
    frame(ts) { const fs = frames.splice(0); fs.forEach(fn => fn(ts)); },
  };
}
export { CanvasError };

// ---------- drive one challenge without the player ----------
// A stand-in for the player's api: records buttons, controls, status and results.
export function challenge(page, id, def, opts={}) {
  const state = { now: 0, buttons: [], controls: [], wins: [], locked: false, status: '' };
  const api = {
    now: () => state.now,
    timed:()=>opts.timed!==false,
    status(h) { state.status = String(h); },
    summary(h) { state.summary=String(h); },
    metrics(rows) { state.metrics=rows; },
    surface(title) { const field=page.document.createElement('fieldset');field.title=title;page.document.body.appendChild(field);return field; },
    button(label, fn, o = {}) { const b = { label, fn, primary: !!o.primary,attrs:{},setAttribute(k,v){this.attrs[k]=String(v);} }; state.buttons.push(b); return b; },
    slider(label, min, max, step, val, fmt, fn) { const c = { kind: 'slider', label, min: +min, max: +max, step: +step, fmt, set: v => { fmt(v); fn(v); } }; state.controls.push(c); return c; },
    seg(label, opts, val, fn) { const c = { kind: 'seg', label, opts, set: fn }; state.controls.push(c); return c; },
    toggle(label, val, fn) { let v = !!val; const c = { kind: 'toggle', label, set: x => fn((v = x === undefined ? !v : !!x)) }; state.controls.push(c); return c; },
    lock(v) { state.locked = !!v; },
    win(stars, title, msg) { state.wins.push({ stars, title, msg }); },
  };
  const FX = page.get('FX');
  const inst = (def || page.get('CHAL')[id]).make(api);
  const run = {
    state, inst,
    step(seconds, dt = 1 / 30) { for (let f = 0; f < seconds / dt; f++) { state.now += dt; page.reset(); page.runTimers(state.now); inst.draw(state.now, dt); FX.step(dt); } return run; },
    press(...keys) { keys.forEach(k => inst.key && inst.key(k, state.now)); run.step(0.1); return run; },
    click(label) { const b = state.buttons.find(b => label.test(b.label)); if (!b) throw new Error('no button ' + label); b.fn(); return run; },
    control(label) { const c = state.controls.find(c => label.test(c.label)); if (!c) throw new Error('no control ' + label); return c; },
    get result() { return state.wins[state.wins.length - 1] || null; },
  };
  return run.step(0.1);
}
