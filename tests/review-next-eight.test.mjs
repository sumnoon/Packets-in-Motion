import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPage,challenge} from './harness.mjs';

const el=(p,id)=>p.document.getElementById(id);
const advance=(p,seconds,start=0)=>{for(let t=start;t<=start+seconds*1000;t+=50)p.frame(t);};
const read=(p,data,extra={})=>el(p,'importFile').onchange({target:{files:[{text:()=>Promise.resolve(typeof data==='string'?data:JSON.stringify(data)),...extra}],value:'file'}});
const progress={app:'packets-in-motion',version:2,seen:{},stars:{}};
const outline=(p,id)=>{const o=p.get('LAB_DEFS')[id],F=o.fixed.length,kinds=[...o.fixed.map(f=>f.kind),...o.solution.nodes],edges=o.solution.edges.map(e=>e.slice());
  kinds.forEach((kind,i)=>{if(i<F||!o.kinds[kind].clone||edges.some(([a,b])=>a===i||b===i))return;const first=kinds.indexOf(kind);edges.filter(([a,b])=>a===first||b===first).forEach(([a,b])=>edges.push([a===first?i:a,b===first?i:b]));});
  const nodes=kinds.map((kind,i)=>({...(i<F?o.fixed[i]:{}),id:'n'+i,kind,x:100+(i%5)*150,y:150+Math.floor(i/5)*90,fixed:i<F}));
  return {nodes,edges:edges.map(([a,b])=>({a:nodes[a].id,b:nodes[b].id})),opts:{...o.solution.opts},seq:nodes.length};};

test('import rejects unsupported versions, wrong types and invalid nested designs before any write',async()=>{
  for(const bad of [{version:3},{seen:[]},{stars:{packets:'3'}},{labBest:[]},{labChaos:{scaling:1}},{labDesigns:{version:9}},{labDesigns:{version:1,drafts:{scaling:'bad'}}},{labDesigns:{version:1,best:{scaling:{cost:2,design:'bad'}}}},{labDesigns:{version:1,chaos:{scaling:{design:'bad',seeds:[1,2,3]}}}}]){
    const p=loadPage({player:true,hash:'#packets'}),before=Object.fromEntries(p.storage);
    await read(p,{...progress,seen:{packets:1},...bad});
    assert.match(el(p,'ioMsg').textContent,/Nothing was imported/);assert.deepEqual(Object.fromEntries(p.storage),before);
  }
});

test('oversized and unreadable files produce useful feedback and reset the file picker',async()=>{
  const p=loadPage({player:true,hash:'#packets'});let called=false;
  await read(p,progress,{size:1024*1024+1,text:()=>{called=true;throw Error('must not read');}});
  assert.equal(called,false);assert.match(el(p,'ioMsg').textContent,/1 MB/);
  await read(p,' '.repeat(1024*1024+1));assert.match(el(p,'ioMsg').textContent,/1 MB/);
  const target={files:[{text:()=>Promise.reject(Error('unreadable'))}],value:'file'};await el(p,'importFile').onchange({target});
  assert.equal(target.value,'');assert.match(el(p,'ioMsg').textContent,/Could not read/);
});

test('badge-only and cost-only imports report updates; imported drafts preserve a local draft',async()=>{
  const p=loadPage({player:true,hash:'#packets'});await read(p,{...progress,labChaos:{scaling:true}});assert.match(el(p,'ioMsg').textContent,/Updated 1 lab record/);
  await read(p,{...progress,labBest:{scaling:13}});assert.match(el(p,'ioMsg').textContent,/Updated 1 lab record/);
  const G=outline(p,'scaling'),encode=p.get('labEncode');p.get('LAB_SAVE').scaling=G;
  const old=encode('scaling',G),other={...G,nodes:G.nodes.slice(0,1),edges:[]};
  await read(p,{...progress,labDesigns:{version:1,drafts:{scaling:encode('scaling',other)}}});assert.equal(encode('scaling',p.get('LAB_SAVE').scaling),old);
});

test('chaos certification stores three distinct seeds for one design and survives reload',()=>{
  const p=loadPage({storage:{'pim-lab-locks':'false'}});p.get('LAB_SAVE').scaling=outline(p,'scaling');
  for(let i=0;i<3;i++){const r=challenge(p,'scaling');if(i===0)r.control(/chaos/i).set(true);r.press('Enter').step(23);assert.equal(r.result.stars,3);}
  const b=p.get('LAB_CERTIFIED').scaling;assert.equal(new Set(b.seeds).size,3);
  const q=loadPage({storage:Object.fromEntries(p.storage)});challenge(q,'scaling');assert.equal(q.get('LAB_CERTIFIED').scaling.design,b.design);
  const G=q.get('LAB_SAVE').scaling,key=q.get('labDesignKey');const before=key(G);G.nodes[1].x+=30;assert.equal(key(G),before);G.edges.pop();assert.notEqual(key(G),before);
  q.log.on=true;const r=challenge(q,'scaling');q.log.calls.length=0;r.step(.1);assert.ok(!q.log.calls.some(c=>c.includes('this design · chaos-proof')));
});

test('an architecture or option edit resets a chaos streak; a learner badge does not certify a fresh board',()=>{
  const p=loadPage({storage:{'pim-lab-locks':'false','pim-lab-chaos':'{"sessions":true}'}});p.get('LAB_SAVE').sessions=outline(p,'sessions');
  let r=challenge(p,'sessions');r.control(/chaos/i).set(true);r.press('Enter').step(23);assert.equal(p.get('LAB_STREAK').sessions,1);
  r=challenge(p,'sessions');r.control(/sticky/i).set(!p.get('LAB_SAVE').sessions.opts.sticky);assert.equal(p.get('LAB_STREAK').sessions,0);
  p.log.on=true;p.log.calls.length=0;r.step(.1);assert.ok(!p.log.calls.some(c=>c.includes('this design · chaos-proof')));
});

test('lesson drawing failures stop once, expose the transcript, and recover on retry or navigation',()=>{
  const p=loadPage({player:true,hash:'#packets'}),c=p.get('chapters')[0],draw=c.draw;c.draw=()=>{throw Error('broken lesson');};advance(p,2);
  assert.equal(p.errors.length,1);assert.equal(el(p,'renderError').hidden,false);assert.equal(el(p,'transcript').hidden,false);assert.equal(el(p,'cv').hidden,true);
  c.draw=draw;el(p,'renderRetry').click();assert.equal(el(p,'renderError').hidden,true);assert.equal(el(p,'cv').hidden,false);
  p.key(']');assert.equal(p.errors.length,1);assert.equal(el(p,'renderError').hidden,true);
});

test('challenge draw failures cancel pending results and keep the saved architecture for retry',()=>{
  const p=loadPage({player:true,hash:'#scaling'}),d=p.get('CHAL').scaling,make=d.make;
  const G=outline(p,'scaling');p.get('LAB_SAVE').scaling=G;
  d.make=api=>({draw(){api.later(()=>api.win(3,'Wrong','Should never score'),1);throw Error('broken challenge');}});
  p.key('p');advance(p,3);assert.equal(p.errors.length,1);assert.equal(p.storage.get('pim-stars'),undefined);assert.equal(p.get('LAB_SAVE').scaling,G);
  d.make=make;el(p,'renderRetry').click();assert.equal(el(p,'renderError').hidden,true);assert.equal(p.get('LAB_SAVE').scaling,G);
});

test('closed trade-offs and results are hidden; modal focus is immediate and returns on close',()=>{
  const p=loadPage({player:true,hash:'#packets'});assert.equal(el(p,'card').tagName,'DIALOG');assert.equal(el(p,'card').hidden,true);assert.equal(el(p,'result').hidden,true);
  el(p,'tradeBtn').focus();p.key('t');assert.equal(el(p,'card').open,true);assert.equal(p.document.activeElement.id,'cardClose');
  p.key(']');assert.equal(p.context.location.hash,'#packets','background navigation is blocked');
  p.key('Escape');assert.equal(el(p,'card').hidden,true);assert.equal(p.document.activeElement.id,'tradeBtn');
  p.key('p');p.key('1');el(p,'cBack').click();p.runTimers(5);assert.notEqual(p.document.activeElement.id,'resNext');
});

test('mobile drawer removes closed navigation from focus, contains Tab, restores focus and adapts to desktop',()=>{
  const p=loadPage({player:true,media:{'(max-width:900px)':true}});
  assert.equal(el(p,'side').inert,true);el(p,'menuBtn').click();assert.equal(el(p,'main').inert,true);assert.equal(el(p,'side').inert,false);assert.equal(p.document.activeElement.id,'find');
  el(p,'menuClose').focus();p.key('Tab',el(p,'menuClose'),{shiftKey:true});assert.equal(p.document.activeElement.id,'importBtn');
  p.key('Tab',el(p,'importBtn'));assert.equal(p.document.activeElement.id,'menuClose');
  p.key('Escape');assert.equal(el(p,'side').inert,true);assert.equal(el(p,'main').inert,false);assert.equal(p.document.activeElement.id,'menuBtn');
  el(p,'menuBtn').click();p.media.get('(max-width:900px)').change(false);assert.equal(el(p,'side').inert,false);assert.equal(el(p,'main').inert,false);assert.equal(el(p,'menuBtn').getAttribute('aria-expanded'),'false');
});

test('transcript definitions are independent buttons rather than nested inside seek buttons',()=>{
  const p=loadPage({player:true,hash:'#packets'}),li=el(p,'trList').children.find(li=>li.children[1].querySelector('.term'));
  assert.ok(li);assert.equal(li.children[0].querySelector('button'),null);assert.equal(li.children[1].tagName,'P');
  const before=el(p,'scrub').value;li.children[1].querySelector('.term').click();assert.equal(el(p,'scrub').value,before);li.children[0].click();assert.equal(li.children[0].getAttribute('aria-current'),'step');
});

test('challenge start, pause, modal, visibility and drawer gates freeze the same clock; portrait stays available',()=>{
  const p=loadPage({player:true,hash:'#packets',media:{'(max-width:900px)':true}});p.key('p');p.key('Tab');advance(p,10);assert.equal(el(p,'cStart').hidden,false);assert.match(el(p,'cStatus').innerHTML,/Card <b>1<\/b>/);
  el(p,'cStart').click();advance(p,1,10050);const before=el(p,'cStatus').innerHTML;
  el(p,'cPause').click();advance(p,10,11100);assert.equal(el(p,'cStatus').innerHTML,before);el(p,'cPause').click();
  p.key('g');advance(p,10,21150);assert.equal(el(p,'cStatus').innerHTML,before);el(p,'glClose').click();
  p.document.hidden=true;advance(p,10,31200);p.document.hidden=false;assert.equal(el(p,'cStatus').innerHTML,before);
  el(p,'menuBtn').click();advance(p,10,41250);el(p,'menuClose').click();assert.equal(el(p,'cStatus').innerHTML,before);
  const mq=p.media.get('(orientation:portrait) and (pointer:coarse) and (max-width:600px)');mq.change(true);advance(p,10,51300);mq.change(false);assert.notEqual(el(p,'cStatus').innerHTML,before);assert.deepEqual(p.errors,[]);
});

test('delayed completion also waits while paused and fires on resume',()=>{
  const p=loadPage({player:true,hash:'#auth'});p.key('p');for(let i=0;i<8;i++)p.key('1');el(p,'cPause').click();advance(p,3);
  assert.equal(p.storage.get('pim-stars'),undefined);el(p,'cPause').click();advance(p,1.2,3050);assert.ok(JSON.parse(p.storage.get('pim-stars')).auth>0);
});

test('untimed sorting keeps its first card indefinitely; timed sorting still enforces deadlines',()=>{
  const p=loadPage();const quiet=challenge(p,'packets',undefined,{timed:false});quiet.step(30);assert.match(quiet.state.status,/Card <b>1<\/b>/);assert.equal(quiet.result,null);
  const timed=challenge(p,'packets');timed.step(10);assert.doesNotMatch(timed.state.status,/Card <b>1<\/b>/);
});

test('untimed balancing needs 30 routed requests and cannot award an idle three-star win',()=>{
  const p=loadPage(),r=challenge(p,'load-balancers',undefined,{timed:false});r.step(40);assert.equal(r.result,null);
  for(let i=0;i<29;i++)r.press(String(i%2+1)).step(4);assert.equal(r.result,null);r.press('1').step(1);assert.equal(r.result.stars,3);assert.match(r.result.msg,/30 requests/);
});
