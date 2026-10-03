import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPage,challenge} from './harness.mjs';

const saved=page=>Object.fromEntries(page.storage);
const graph=(kinds,wires,opts={})=>{
  const nodes=kinds.map((kind,i)=>({id:String(i),kind,x:70+i*70,y:250})),edges=wires.map(([a,b])=>({a:String(a),b:String(b)}));
  return {nodes,edges,opts,of:k=>nodes.filter(n=>n.kind===k),out:(n,ks)=>edges.filter(e=>e.a===n.id).map(e=>nodes.find(n=>n.id===e.b)).filter(n=>!ks||ks.includes(n.kind)),inn:(n,ks)=>edges.filter(e=>e.b===n.id).map(e=>nodes.find(n=>n.id===e.a)).filter(n=>!ks||ks.includes(n.kind))};
};

test('delayed completion cannot score or focus another lesson, or a restarted challenge',()=>{
  for(const action of ['navigate','restart','exit']){
    const p=loadPage({player:true,hash:'#auth'});p.key('p');for(let i=0;i<8;i++)p.key('1');
    if(action==='navigate')p.key(']');else p.document.getElementById(action==='restart'?'cRestart':'cBack').click();
    p.runTimers(2);
    assert.equal(p.context.localStorage.getItem('pim-stars'),null,action);
    assert.equal(p.document.getElementById('result').classList.contains('show'),false,action);
    assert.notEqual(p.document.activeElement?.id,'resNext');
  }
  const p=loadPage({player:true,hash:'#auth'});p.key('p');for(let i=0;i<8;i++)p.key('1');for(let t=0;t<=1200;t+=60)p.frame(t);
  assert.ok(JSON.parse(p.context.localStorage.getItem('pim-stars')).auth>0,'active completion still scores');
});

test('shared chat shards enforce capacity across multiple services',()=>{
  const p=loadPage(),o=p.get('LAB_DEFS')['capstone-chat'];
  const wires=[[0,1]];for(let i=2;i<6;i++)wires.push([1,i],[i,6],[i,7],[10,i]);
  for(const i of [6,7])for(const j of [8,9,10,11])wires.push([i,j]);
  const G=graph(['users','lb','gateway','gateway','gateway','gateway','chat','chat','store','store','pubsub','push'],wires,{resume:true});
  const S=o.init(G),out=o.step(S,G,1,6);
  assert.equal(S.sent,8000);assert.equal(S.ok,6000);assert.equal(S.lost.store,2000);
  assert.ok(Math.abs(out.load['8']-4/3)<1e-9);
  assert.ok(o.score(S,G,21).stars<3);
  // A third shard gives 9k aggregate capacity, even with two producers.
  G.nodes.push({id:'12',kind:'store',x:800,y:350});G.edges.push({a:'6',b:'12'},{a:'7',b:'12'});
  const healthy=o.init(G);o.step(healthy,G,1,6);assert.equal(healthy.ok,8000);assert.equal(healthy.lost.store,0);
});

test('shortener refuses pending and missing click accounting',()=>{
  const p=loadPage(),o=p.get('LAB_DEFS').capstone,G={of:()=>[]};
  const base={tot:10000,bad:0,lat:[[18,10000]],qb:{q:499},lost:{},clicks:{accepted:10000,persisted:9501}};
  assert.ok(o.score(base,G,20).stars<3);
  assert.ok(o.score({...base,qb:{},clicks:{accepted:10000,persisted:9999}},G,20).stars<3);
  assert.equal(o.score({...base,qb:{},clicks:{accepted:10000,persisted:10000}},G,20).stars,3);
  assert.ok(o.score({...base,qb:{},clicks:undefined},G,20).stars<3);
});

test('queued clicks remain pending when the database has no room, then persist during recovery',()=>{
  const p=loadPage(),o=p.get('LAB_DEFS').capstone;
  const G=graph(['users','app','db','queue','worker'],[[0,1],[1,2],[1,3],[3,4],[4,2]]),S=o.init(G);
  for(let i=0;i<20;i++)o.step(S,G,.05,1);
  assert.ok(S.clicks.accepted>0);assert.equal(S.clicks.persisted,0);assert.ok(S.qb['3']>0);
  assert.ok(Math.abs(S.clicks.accepted-S.clicks.persisted-S.qb['3'])<1e-6);
  const before=S.clicks.accepted;G.edges.splice(0,1); // no new arrivals; the queue can drain
  for(let i=0;i<40;i++)o.step(S,G,.05,2);
  assert.equal(S.clicks.accepted,before);assert.equal(S.qb['3'],0);assert.ok(Math.abs(S.clicks.persisted-before)<1e-6);
});

test('storage validation preserves valid entries and rejects wrong types, arrays and unknown ids',()=>{
  const p=loadPage({player:true,storage:{
    'sdve-seen':'{"packets":1,"caching":true,"auth":"yes","nope":1}',
    'pim-stars':'{"packets":4,"caching":3,"auth":"3","cdn":-1,"quiz-data":2,"nope":3}',
    'pim-lab-best':'{"scaling":10,"sessions":"2","caching":4}',
    'pim-lab-chaos':'{"scaling":true,"sessions":1,"caching":true}'
  }});
  assert.match(p.document.getElementById('starTotal').textContent,/^★ 5 \//);
  assert.deepEqual(JSON.parse(JSON.stringify(p.get('LAB_BEST'))),{scaling:10});
  assert.deepEqual(JSON.parse(JSON.stringify(p.get('LAB_CHAOS'))),{scaling:true});
  for(const raw of ['[]','null','false','"3"','{broken']){
    const q=loadPage({player:true,storage:{'sdve-seen':raw,'pim-stars':raw,'pim-lab-best':raw,'pim-lab-chaos':raw,'pim-lab-designs':raw}});
    assert.match(q.document.getElementById('starTotal').textContent,/^★ 0 \//);assert.deepEqual(q.errors,[]);
  }
});

test('denied storage reads and failed writes show a backup message without breaking the course',()=>{
  for(const error of [{get:true},{set:true}]){
    const p=loadPage({player:true,storageError:error});
    assert.match(p.document.getElementById('storageMsg').textContent,/export your progress/i);
    p.key('p');p.frame(60);assert.deepEqual(p.errors,[]);
  }
});

test('drafts and options survive reload; toggle undo restores the option before removing a node',()=>{
  const p=loadPage({storage:{'pim-lab-locks':'false'}}),r=challenge(p,'sessions');r.press('1','2');r.control(/sticky/i).set(true);
  const reloaded=loadPage({storage:saved(p)}),again=challenge(reloaded,'sessions');
  assert.match(again.state.status,/<b>C<\/b> App server/);assert.equal(reloaded.get('LAB_SAVE').sessions.opts.sticky,true);
  r.click(/^undo$/i);assert.equal(p.get('LAB_SAVE').sessions.opts.sticky,false);assert.equal(p.get('LAB_SAVE').sessions.nodes.length,3);
  r.click(/^undo$/i);assert.equal(p.get('LAB_SAVE').sessions.nodes.length,2);
});

test('best three-star graphs are restorable across reload, including through progress export/import',async()=>{
  const p=loadPage({storage:{'pim-lab-locks':'false'}}),r=challenge(p,'scaling');
  r.press('1','3','a','b','b','c','3','3','3','Enter').step(21);assert.equal(r.result.stars,3);
  const best=p.get('LAB_BEST_DESIGNS').scaling;assert.equal(best.cost,13);assert.ok(best.design);
  r.click(/clear board/i);assert.equal(p.get('LAB_SAVE').scaling.nodes.length,1);
  const reload=loadPage({player:true,hash:'#scaling',storage:saved(p)});reload.key('p');
  const restore=reload.document.getElementById('cRun').children.find(b=>b.textContent==='Restore best design');restore.click();
  assert.equal(reload.get('LAB_SAVE').scaling.nodes.length,6);
  let exported;const create=reload.document.createElement;reload.document.createElement=tag=>{const el=create(tag);if(tag==='a')el.click=()=>exported=JSON.parse(decodeURIComponent(el.href.split(',')[1]));return el;};
  reload.document.getElementById('exportBtn').click();assert.equal(exported.version,2);assert.equal(exported.labDesigns.best.scaling.design,best.design);
  const recipient=loadPage({player:true,hash:'#scaling'});
  await recipient.document.getElementById('importFile').onchange({target:{files:[{text:()=>Promise.resolve(JSON.stringify(exported))}],value:''}});
  recipient.key('p');assert.equal(recipient.get('LAB_SAVE').scaling.nodes.length,6);assert.equal(recipient.get('LAB_BEST_DESIGNS').scaling.cost,13);
});

test('share only reports copied after success and uses a hosted link offline',async()=>{
  for(const outcome of ['pending-success','reject','missing']){
    const p=loadPage({storage:{'pim-lab-locks':'false'},href:'file:///tmp/index.html'}),r=challenge(p,'scaling');r.press('1');
    let resolve;p.context.navigator=outcome==='missing'?{}:{clipboard:{writeText:()=>outcome==='reject'?Promise.reject(new Error('denied')):new Promise(r=>resolve=r)}};
    const promise=r.state.buttons.find(b=>/copy share/i.test(b.label)).fn();
    if(resolve){assert.doesNotMatch(r.state.status,/Link copied/);resolve();}
    await promise;
    assert.match(r.state.status,/https:\/\/sumnoon\.github\.io\/Packets-in-Motion\/\?lab=scaling/);
    assert.equal(/Link copied/.test(r.state.status),outcome==='pending-success');
  }
});

test('a received design remains saved after URL cleanup and reload',()=>{
  const base=loadPage(),code=base.get('labEncode')('scaling',{nodes:[{id:'f0',kind:'users',x:70,y:250},{id:'n1',kind:'lb',x:260,y:250}],edges:[{a:'f0',b:'n1'}],opts:{}});
  const p=loadPage({player:true,search:'?lab=scaling&d='+encodeURIComponent(code)});
  const q=loadPage({player:true,hash:'#scaling',storage:saved(p)});q.key('p');
  assert.equal(q.get('LAB_SAVE').scaling.nodes.length,2);assert.equal(q.get('LAB_SAVE').scaling.edges.length,1);
  const dirty='{"version":1,"drafts":{"scaling":"bad","__proto__":'+JSON.stringify(code)+'},"best":{"scaling":{"cost":2,"design":'+JSON.stringify(code)+'}}}';
  const invalid=loadPage({player:true,storage:{'pim-lab-designs':dirty}});assert.equal(invalid.get('LAB_SAVE').scaling,undefined);assert.equal(invalid.get('LAB_BEST_DESIGNS').scaling,undefined);
});
