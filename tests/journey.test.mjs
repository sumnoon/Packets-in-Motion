import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPage} from './harness.mjs';

const page=loadPage(),trial=page.get('journeyTrial'),decode=page.get('journeyDecode');
const launch={east:2,west:0,balancer:true,cache:false};
const spike={east:3,west:0,balancer:true,cache:true};
const regions={...spike,west:2};
const campaign=()=>({version:1,path:'interview',intro:true,stage:2,draft:regions,proofs:{launch,spike,regions}});

test('all learning routes contain unique real lessons; exploration covers the course',()=>{
  const chapters=page.get('chapters'),paths=page.get('JOURNEY_PATHS');
  for(const p of Object.values(paths)){assert.equal(new Set(p.ids).size,p.ids.length);for(const id of p.ids)assert.ok(chapters.some(c=>c.id===id),id);}
  assert.equal(paths.explore.ids.length,chapters.length);
  // new visitors choose between these three, by name
  assert.deepEqual(Object.values(paths).map(p=>p.title),['Learn the basics','Prepare for interviews','Explore systems']);
});
test('introduction demonstrates overload, idle capacity, then routing recovery',()=>{
  const intro=page.get('journeyIntro');
  assert.equal(intro(0).served,80);assert.equal(intro(1).served,200);
  assert.equal(intro(2).served,200);assert.equal(intro(2).loads[1],0);
  assert.equal(intro(3).served,360);assert.equal(intro(3).loads[0],180);
});
test('launch requires useful capacity and enforces its budget',()=>{
  assert.equal(trial(0,{...launch,east:1}).passed,false);
  assert.equal(trial(0,{...launch,balancer:false}).passed,false);
  assert.equal(trial(0,launch).passed,true);
  assert.equal(trial(0,{...launch,east:3}).passed,false);
  assert.equal(trial(0,{...launch,cache:true}),null);
});
test('viral traffic checks app failure separately and exposes the store bottleneck',()=>{
  assert.equal(trial(1,{...spike,cache:false}).rows[0].served,500);
  const fragile=trial(1,{...spike,east:2});
  assert.equal(fragile.rows[0].passed,true);assert.equal(fragile.rows[1].passed,false);
  const stable=trial(1,spike);assert.equal(stable.passed,true);assert.equal(stable.cost,11);
});
test('regional expansion needs locality and capacity during either regional app failure',()=>{
  const remote=trial(2,spike);assert.equal(remote.rows[0].delivery,1);assert.equal(remote.rows[0].fast,.6);assert.equal(remote.passed,false);
  const fragile=trial(2,{...regions,west:1});assert.equal(fragile.rows[0].passed,true);assert.equal(fragile.rows[2].passed,false);
  const stable=trial(2,regions);assert.equal(stable.passed,true);assert.equal(stable.cost,20);assert.equal(stable.rows.length,3);
  for(const r of stable.rows){assert.equal(r.delivery,1);assert.equal(r.fast,1);}
});
test('every bounded architecture has finite, conserved traffic and deterministic results',()=>{
  for(let stage=0;stage<3;stage++)for(let east=1;east<=6;east++)for(let west=0;west<=(stage===2?4:0);west++)for(const balancer of [true,false])for(const cache of stage?[true,false]:[false]){
    const d={east,west,balancer,cache},a=trial(stage,d),b=trial(stage,d);
    assert.equal(JSON.stringify(a),JSON.stringify(b));
    for(const row of a.rows){assert.ok(row.delivery>=0&&row.delivery<=1);assert.ok(row.fast>=0&&row.fast<=row.delivery);}
  }
});
test('mission records require reproducible passing designs and contiguous milestones',()=>{
  assert.ok(decode(campaign()));
  const bad=[null,[],{}, {...campaign(),version:2},{...campaign(),path:'__proto__'},{...campaign(),stage:3},{...campaign(),draft:{...regions,east:Infinity}}, {...campaign(),proofs:{regions}}, {...campaign(),proofs:{launch,spike:{...spike,east:1}}}, {...campaign(),proofs:{...campaign().proofs,unknown:regions}}];
  for(const value of bad)assert.equal(decode(value),null,JSON.stringify(value));
});
test('merging imports preserves earned milestones and same-stage local drafts',()=>{
  const merge=page.get('journeyMerge'),initial=page.get('journeyInitial')();
  const imported=merge(initial,campaign());assert.equal(imported.path,'interview');assert.equal(imported.stage,2);assert.equal(imported.intro,true);
  const local={...campaign(),draft:{...regions,east:4}},merged=merge(local,campaign());assert.equal(merged.draft.east,4);assert.equal(Object.keys(merged.proofs).length,3);assert.ok(decode(merged));
});
test('Home and all hub deep links are idle and never overwrite a lesson bookmark',()=>{
  const bookmark={version:1,chapter:'caching',time:15,speed:1.5};
  for(const hash of ['', '#home','#map','#intro','#missions']){
    const p=loadPage({player:true,hash,storage:{'pim-resume':JSON.stringify(bookmark)}});
    for(let t=0;t<5000;t+=50)p.frame(t);
    p.key('p');p.key(']');p.key(' ');p.document.dispatch('visibilitychange');
    assert.equal(p.context.location.hash,hash||'#home');assert.equal(p.document.getElementById('lessonView').hidden,true);
    assert.deepEqual(JSON.parse(p.storage.get('pim-resume')),bookmark);assert.deepEqual(p.errors,[]);
  }
});
test('invalid journey evidence rejects an entire import before course progress mutates',async()=>{
  const p=loadPage({player:true}),el=id=>p.document.getElementById(id);
  const data={app:'packets-in-motion',version:2,seen:{packets:1},stars:{packets:3},journey:{...campaign(),proofs:{regions}}};
  await el('importFile').onchange({target:{files:[{size:100,text:async()=>JSON.stringify(data)}],value:'x'}});
  assert.equal(p.storage.has('sdve-seen'),false);assert.equal(p.storage.has('pim-stars'),false);
  assert.match(el('ioMsg').textContent,/Nothing was imported/);
});
test('the tour starts only on a genuine first visit to Home, and is remembered once finished or skipped',()=>{
  const el=(p,id)=>p.document.getElementById(id);
  const first=loadPage({player:true,firstVisit:true});first.runTimers(1);
  assert.equal(el(first,'tour').hidden,false);assert.equal(el(first,'tourTitle').textContent,'Welcome to Packets in Motion');assert.equal(first.document.activeElement.id,'tourNext');
  el(first,'tourSkip').click();assert.equal(el(first,'tour').hidden,true);assert.equal(first.storage.get('pim-tour'),'done');
  for(const opts of [{firstVisit:true,storage:{'sdve-seen':JSON.stringify({packets:1})}},{firstVisit:true,hash:'#caching'},{player:true}]){
    const p=loadPage({player:true,...opts});p.runTimers(1);assert.equal(el(p,'tour').hidden,true,JSON.stringify(opts));assert.deepEqual(p.errors,[]);}
});
test('Missions explains itself on the first visit only, and Home offers a single way in',()=>{
  const el=(p,id)=>p.document.getElementById(id);
  const p=loadPage({player:true,firstVisit:true,hash:'#missions',storage:{'pim-tour':'done'}});p.runTimers(1);
  assert.equal(el(p,'missionHelp').open,true);assert.equal(el(p,'mhStart').textContent,'Start the first mission');
  el(p,'mhStart').click();assert.equal(el(p,'missionHelp').open,false);assert.equal(p.storage.get('pim-missions-help'),'1');
  const again=loadPage({player:true,hash:'#missions'});again.runTimers(1);assert.equal(el(again,'missionHelp').open,false);
  const home=loadPage({player:true}),html=el(home,'journey').innerHTML;assert.match(html,/id="jStart">Start learning</);assert.doesNotMatch(html,/j-path|j-story|j-practice/);assert.equal(el(home,'resume').hidden,true);
});
test('mission characters: every pose draws, lines are escaped, and each mission has Maya\u2019s voice',()=>{
  const charSVG=page.get('charSVG'),scene=page.get('missionScene'),poses=page.get('CHAR_POSES'),missions=page.get('JOURNEY_MISSIONS');
  for(const [who,list] of Object.entries(poses))for(const pose of list){const svg=charSVG(who,pose,'label');assert.match(svg,/^<svg class="mc mc-/);assert.doesNotMatch(svg,/undefined|NaN/,`${who} ${pose}`);}
  const html=scene({maya:'worried',eng:'point',rack:'fail',say:'<b>"x"</b> & y',reply:'ok'});
  assert.match(html,/&lt;b&gt;&quot;x&quot;&lt;\/b&gt; &amp; y/);assert.match(html,/m-rack-fail/);assert.match(html,/You · engineer/);
  assert.doesNotMatch(scene({say:'hi'}),/m-bubble-you/,'no reply bubble unless there is a reply');
  for(const m of missions){assert.ok(poses.maya.includes(m.pose),m.id);assert.ok(m.story.length>40&&m.win.length>20,m.id);}
});
test('mission art: decorative inline SVG with no ids, a postcard per mission, and effects that match the mood',()=>{
  const art=page.get('MISSION_ART'),scene=page.get('missionScene'),missions=page.get('JOURNEY_MISSIONS');
  for(const [name,svg] of Object.entries(art)){assert.match(svg,/^<svg [^>]*aria-hidden="true"/,name);assert.doesNotMatch(svg,/ id=|<title|inkscape:|undefined|NaN/,name);}
  for(const m of missions)assert.ok(art['postcard-'+m.postcard],m.id);
  const win=scene({maya:'celebrate',eng:'celebrate',say:'yes',mood:'win'}),fail=scene({maya:'worried',eng:'point',rack:'fail',say:'no',mood:'fail'});
  assert.equal((win.match(/m-confetti/g)||[]).length,1);assert.match(win,/m-fx-sparkle/);assert.doesNotMatch(win,/m-fx-sweat|m-fx-alert/);
  assert.match(fail,/m-fx-sweat/);assert.match(fail,/m-fx-alert/);assert.doesNotMatch(fail,/m-confetti|m-fx-sparkle/);
  assert.doesNotMatch(scene({say:'calm'}),/m-fx|m-confetti/,'a calm scene has no effects');
  assert.match(scene({rack:'hot',say:'busy'}),/m-rack-hot/);
});
