import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPage,challenge} from './harness.mjs';
import {build} from '../scripts/build.mjs';
import {courseCounts,countedReadme} from '../scripts/course-metadata.mjs';
const page=loadPage(),defs=page.get('LAB_DEFS'),run=page.get('pimLabRun');
function outline(o){const F=o.fixed.length,kinds=[...o.fixed.map(n=>n.kind),...o.solution.nodes],edges=o.solution.edges.map(e=>e.slice());
  kinds.forEach((k,i)=>{if(i<F||!o.kinds[k].clone||edges.some(([a,b])=>a===i||b===i))return;const first=kinds.indexOf(k);edges.filter(([a,b])=>a===first||b===first).forEach(([a,b])=>edges.push([a===first?i:a,b===first?i:b]));});
  const nodes=kinds.map((kind,i)=>i<F?{...o.fixed[i],id:'f'+i,fixed:true}:{id:'n'+i,kind,x:400+(i%4)*120,y:120+Math.floor(i/4)*80});
  return{nodes,edges:edges.map(([a,b])=>({a:nodes[a].id,b:nodes[b].id})),opts:{...o.solution.opts}};}
for(const [id,o] of Object.entries(defs))test(`${id}: model replay is independent of frame schedule (seed 33040)`,()=>{
  const board=outline(o),before=JSON.stringify(board),cost=board.nodes.reduce((s,n)=>s+(n.fixed?0:o.kinds[n.kind].cost),0);
  const runs=[[1/30],[1/144],[.07,.011,.19]].map(deltas=>{const r=run(o,board,{seed:33040,chaos:true});let i=0;while(r.time<o.dur)r.advance(deltas[i++%deltas.length]);return r;});
  for(const r of runs){assert.equal(r.time,o.dur);assert.equal(r.result(cost).stars,3);assert.equal(r.snapshot(),runs[0].snapshot());assert.deepEqual(JSON.parse(JSON.stringify(r.result(cost))),JSON.parse(JSON.stringify(runs[0].result(cost))));}
  assert.equal(JSON.stringify(board),before,'run must not mutate the editor graph');
});
test('headless incidents never call drawing or sound APIs',()=>{
  const FX=page.get('FX'),SFX=page.get('SFX'),old=[FX.burst,FX.text,SFX.play],reject=()=>{throw new Error('model called presentation effect');};FX.burst=FX.text=SFX.play=reject;
  try{for(const [id,o] of Object.entries(defs)){const r=run(o,outline(o),{seed:5,chaos:true});r.advance(o.dur);if(id==='scaling')assert.ok(r.events().some(e=>e.text==='crashed'&&e.time>=0));r.events();assert.equal(r.events().length,0);}}finally{[FX.burst,FX.text,SFX.play]=old;}
});
test('draws alone neither advance nor finish a load test',()=>{
  page.context.localStorage.setItem('pim-lab-locks','false');const r=challenge(page,'scaling');r.press('Enter');
  for(let i=0;i<200;i++)r.inst.draw(100,10);assert.equal(r.result,null);r.step(19);assert.ok(r.result);
});
test('fixed clock rejects invalid deltas, retains fractions and stops exactly',()=>{
  const steps=[],clock=page.get('pimClock')((dt,t)=>steps.push([dt,t]),.1);
  clock.advance(.001);assert.equal(clock.time,0);clock.advance(.199);assert.equal(clock.time,.1);assert.ok(Math.abs(steps.reduce((s,[dt])=>s+dt,0)-.1)<1e-12);
  clock.advance(10);assert.equal(clock.time,.1);for(const dt of [-1,NaN,Infinity])assert.throws(()=>clock.advance(dt),/Invalid simulation delta/);
  for(const [duration,interval] of [[NaN,.01],[-1,.01],[1,0],[1,Infinity]])assert.throws(()=>page.get('pimClock')(()=>{},duration,interval),/Invalid simulation clock/);
});
test('drawing an in-flight request cannot remove its pending delivery',()=>{
  const p=loadPage(),r=challenge(p,'load-balancers');r.press('1');r.inst.draw(100,.1);r.step(.7);assert.match(r.state.status,/sent to Server A/);
});
test('chat shared shard capacity and delivery accounting are conserved',()=>{
  const o=defs['capstone-chat'],board=outline(o),store=board.nodes.find(n=>n.kind==='store'),chat=board.nodes.find(n=>n.kind==='chat');
  board.nodes=board.nodes.filter(n=>n.kind!=='store'||n===store);board.edges=board.edges.filter(e=>board.nodes.some(n=>n.id===e.a)&&board.nodes.some(n=>n.id===e.b));
  const extra={...chat,id:'extra'};board.nodes.push(extra);board.edges.filter(e=>e.a===chat.id||e.b===chat.id).forEach(e=>board.edges.push({a:e.a===chat.id?extra.id:e.a,b:e.b===chat.id?extra.id:e.b}));
  const r=run(o,board,{seed:1});for(let i=0;i<16*60;i++){r.advance(1/60);const S=r.state,delivered=S.view.flows.filter(f=>f.bad!==true&&board.nodes.find(n=>n.id===f.b)?.kind==='pubsub').reduce((s,f)=>s+f.rate,0);assert.ok(delivered<=3000+1e-6,'two producers cannot each spend the same shard capacity');assert.ok(Math.abs(S.sent-S.ok-Object.values(S.lost).reduce((s,x)=>s+x,0))<1e-5,'delivery and loss totals reconcile');}
  assert.ok(r.result(20).stars<3);assert.equal(r.result(20).metrics.requirements[0].passed,false);
});
test('shortener accounting reconciles accepted, persisted and pending events every step',()=>{
  const o=defs.capstone,r=run(o,outline(o),{seed:33040,chaos:true});while(r.time<o.dur){r.advance(1/60);const S=r.state;assert.ok(S.clicks.persisted<=S.clicks.accepted+1e-6);assert.ok(Math.abs(S.clicks.accepted-S.clicks.persisted-Object.values(S.qb).reduce((s,n)=>s+n,0))<1e-5);}
  const result=r.result(20);assert.equal(result.stars,3);assert.ok(result.metrics.requirements.every(x=>x.passed));
});
test('app randomness is seeded and cosmetic effects cannot change it',()=>{
  const a=loadPage({seed:45}),b=loadPage({seed:45}),c=loadPage({seed:46});for(let i=0;i<100;i++)a.get('PIM_EFFECTS').next();
  const take=p=>Array.from({length:10},()=>p.get('PIM_RANDOM').next());const aa=take(a);assert.deepEqual(aa,take(b));assert.notDeepEqual(aa,take(c));
});
test('invalid replay records are ignored individually',()=>{
  const p=loadPage(),o=p.get('LAB_DEFS').scaling,design=p.get('labEncode')('scaling',outline(o));p.context.localStorage.setItem('pim-lab-runs',JSON.stringify({version:1,runs:{scaling:{design,seed:1,chaos:false},sessions:{design:'broken',seed:-1,chaos:true}}}));
  p.get('labRestore')();assert.equal(p.get('LAB_RUNS').scaling.seed,1);assert.equal(p.get('LAB_RUNS').sessions,undefined);
});
test('README counts come from registered lesson, lab and quiz metadata',()=>{
  const html=build(),counts=courseCounts(html);assert.match(counts,/45 chapters in 10 sections; 10 architecture labs; 9 section quizzes/);assert.match(counts,/Advanced \| 14/);
  assert.match(countedReadme('<!-- course-counts:start -->old<!-- course-counts:end -->',html),/Advanced \| 14/);
});
