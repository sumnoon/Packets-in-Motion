import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPage} from './harness.mjs';

// A stand-in Web Audio graph that records what the score schedules.
function fakeAudio(){
  const made=[];
  const param=v=>({value:v,events:[],setValueAtTime(x,t){this.events.push(['set',x,t]);},linearRampToValueAtTime(x,t){this.events.push(['lin',x,t]);},exponentialRampToValueAtTime(x,t){assert.ok(x>0,'exponential ramps need a positive target');this.events.push(['exp',x,t]);},cancelScheduledValues(){}});
  const node=kind=>{const n={kind,connect(){},disconnect(){}};made.push(n);return n;};
  class Ctx{constructor(){this.currentTime=0;this.sampleRate=8000;this.state='running';this.destination=node('destination');}
    createGain(){return Object.assign(node('gain'),{gain:param(1)});}
    createBiquadFilter(){return Object.assign(node('filter'),{type:'',frequency:param(350),Q:param(1)});}
    createConvolver(){return node('convolver');}
    createBuffer(ch,len){const data=Array.from({length:ch},()=>new Float32Array(len));return {getChannelData:c=>data[c]};}
    createOscillator(){return Object.assign(node('osc'),{type:'',frequency:param(440),detune:param(0),start(t){this.t0=t;},stop(t){this.t1=t;}});}
    resume(){this.state='running';return Promise.resolve();}}
  return {Ctx,made};
}

test('the score stays in tune, in range and never schedules two plucks at once',()=>{
  const page=loadPage(),M=page.get('MUSIC'),{Ctx,made}=fakeAudio(),ctx=new Ctx(),c=M.chain(ctx);
  for(const ch of M.CHORDS){assert.equal(ch.pad.length,4);for(const m of [...ch.pad,ch.bass])assert.ok(m>=36&&m<=84,`MIDI ${m} in range`);}
  assert.equal(Math.round(M.hz(69)),440);assert.equal(Math.round(M.hz(57)),220);
  for(let bar=0;bar<40;bar++){made.length=0;M.scheduleBar(ctx,c.bus,bar*M.BAR,bar,bar%2?'focus':'calm');
    const osc=made.filter(n=>n.kind==='osc'),plucks=osc.filter(o=>o.frequency.value>=M.hz(69)-1&&o.t1-o.t0<3);
    assert.ok(osc.every(o=>o.t1>o.t0&&o.t0>=bar*M.BAR),'every note starts in its bar and stops after it starts');
    const starts=new Set(plucks.filter(o=>o.type!=='triangle').map(o=>o.t0));assert.ok(starts.size>=2&&starts.size<=4,'two to four plucked notes');
    // the focus pulse: eight short notes, one per beat, only in focus
    assert.equal(osc.filter(o=>Math.abs(o.t1-o.t0-.5)<.01).length,bar%2?8:0,'focus adds a pulse on every beat');}
});
test('music is off by default, needs no audio support, and the M key and button toggle a remembered choice',()=>{
  const p=loadPage({player:true}),el=id=>p.document.getElementById(id);
  assert.equal(el('musicBtn').getAttribute('aria-pressed'),'false');assert.equal(el('musicVolWrap').hidden,true);
  el('musicBtn').click();assert.equal(el('musicBtn').textContent,'Music: on');assert.equal(p.storage.get('pim-music'),'1');assert.equal(el('musicVolWrap').hidden,false);
  p.key('m',el('main'));assert.equal(el('musicBtn').textContent,'Music: off');assert.equal(p.storage.get('pim-music'),'0');
  el('musicVol').value='30';el('musicVol').oninput({target:el('musicVol')});assert.equal(p.storage.get('pim-music-vol'),'30');
  const again=loadPage({player:true,storage:{'pim-music':'1','pim-music-vol':'30'}});
  assert.equal(again.document.getElementById('musicBtn').textContent,'Music: on');assert.equal(again.document.getElementById('musicVol').value,'30');
  assert.deepEqual(p.errors,[]);assert.deepEqual(again.errors,[]);
});
test('with audio available, enabling fades in, challenges switch to focus, and a hidden tab fades out',()=>{
  const page=loadPage(),M=page.get('MUSIC'),{Ctx}=fakeAudio();
  page.context.AudioContext=Ctx;page.context.window.AudioContext=Ctx;
  M.setVolume(.5);M.enable(true);assert.ok(M.ctx,'an audio context is created on demand');
  const ramps=M.out.gain.events.filter(e=>e[0]==='lin');assert.equal(ramps.at(-1)[1],.55,'fades in to the chosen volume');
  M.setMood('focus');assert.equal(M.tone.frequency.events.at(-1)[1],2600);M.setMood('calm');assert.equal(M.tone.frequency.events.at(-1)[1],1800);
  page.document.hidden=true;M.visibility();assert.equal(M.out.gain.events.at(-1)[1],0,'hidden tab fades out');
  page.document.hidden=false;M.visibility();assert.equal(M.out.gain.events.at(-1)[1],.55);
  M.enable(false);assert.equal(M.out.gain.events.at(-1)[1],0);assert.equal(M.timer,null);
});
