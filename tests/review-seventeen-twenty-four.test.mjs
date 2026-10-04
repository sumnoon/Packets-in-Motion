import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadPage,challenge} from './harness.mjs';

const el=(p,id)=>p.document.getElementById(id);
const metrics=r=>Object.fromEntries(r.state.metrics.map(([k,v])=>[k,String(v)]));
const choose=(p,id,value)=>{const select=el(p,id);select.value=value;select.onchange();};
const editorButton=(p,label)=>p.document.querySelectorAll('button').find(b=>b.textContent===label);

test('untimed balancing exposes decisions and preserves all loads while idle',()=>{
  const p=loadPage(),r=challenge(p,'load-balancers',undefined,{timed:false});
  assert.match(metrics(r)['Next request'],/size [1-4] load units/);assert.match(metrics(r)['Deadline'],/No deadline/);
  r.click(/Send to Server A/).step(.1);const before=metrics(r);r.step(15);
  for(const name of ['Server A','Server B','Server C','Requests served','Next request','Progress'])assert.equal(metrics(r)[name],before[name]);
  assert.match(r.state.status,/Next request: size/);assert.equal(r.result,null);
  for(let i=1;i<30;i++)r.click(i%2?/Send to Server B/:/Send to Server A/).step(.1);
  assert.equal(r.result.stars,3);assert.match(r.result.msg,/30 requests/);
});

test('timed balancing exposes deadline changes and announces expiration',()=>{
  const r=challenge(loadPage(),'load-balancers');const before=metrics(r)['Deadline'];r.step(1);
  assert.notEqual(metrics(r)['Deadline'],before);r.step(2.3);assert.match(r.state.status,/timed out.*Next request/);assert.equal(metrics(r)['Strikes'],'1 of 6');
});

test('measurement updates preserve readable DOM rows and avoid live-region flooding',()=>{
  const p=loadPage({player:true,hash:'#load-balancers'});p.key('p');el(p,'cStart').click();const row=el(p,'cReadout').children[0];
  p.key('1');for(let t=0;t<=1500;t+=50)p.frame(t);assert.equal(el(p,'cReadout').children[0],row);assert.equal(el(p,'cReadout').getAttribute('aria-live'),'off');assert.deepEqual(p.errors,[]);
});

test('wrong sorting feedback includes the next prompt and semantic choices score correctly',()=>{
  const p=loadPage(),make=p.get('sortGame')({keepOrder:true,bins:[{id:'a',label:'Alpha',c:'#4ea1ff'},{id:'b',label:'Beta',c:'#34d399'}],cards:[{t:'First',b:'a',why:'Alpha belongs here.'},{t:'Second',b:'b'}]});
  const r=challenge(p,'fixture',{make});r.click(/Choose Beta/);
  assert.match(r.state.status,/Not quite.*Alpha belongs here.*Correct box: Alpha.*Card <b>2<\/b>.*Second/);
  r.click(/Choose Beta/).step(1);assert.equal(r.result.stars,2);
});

test('player shortcuts respect focus, browser modifiers, native inputs and the saved opt-out',()=>{
  const p=loadPage({player:true,hash:'#packets'}),hash=p.context.location.hash,before=el(p,'scrub').value;
  p.key(']',p.document.body);p.key(']',el(p,'theme'));p.key(']',el(p,'cv'),{ctrlKey:true});p.key('p',el(p,'cv'),{metaKey:true});p.key(']',el(p,'cv'),{altKey:true});
  assert.equal(p.context.location.hash,hash);assert.equal(p.document.body.classList.contains('play'),false);
  for(const id of ['scrub','speed'])p.key('ArrowRight',el(p,id));assert.equal(el(p,'scrub').value,before);
  el(p,'shortcutsBtn').click();p.key(']',el(p,'cv'));p.key('p',el(p,'cv'));assert.equal(p.context.location.hash,hash);assert.equal(p.document.body.classList.contains('play'),false);
  const q=loadPage({player:true,storage:Object.fromEntries(p.storage)});assert.equal(el(q,'shortcutsBtn').getAttribute('aria-pressed'),'false');el(q,'nextBtn').click();assert.notEqual(q.context.location.hash,hash);
});

test('browser find does not invoke fullscreen and modified Tab does not trigger drawer trapping',()=>{
  const p=loadPage({player:true,hash:'#packets',fullscreen:true,media:{'(max-width:900px)':true}});p.key('f',el(p,'cv'),{ctrlKey:true});assert.equal(p.document.fullscreenElement,undefined);p.key('f',el(p,'cv'));assert.equal(p.document.fullscreenElement,p.document.documentElement);
  el(p,'menuBtn').click();el(p,'glossBtn').focus();let prevented=false;p.key('Tab',el(p,'glossBtn'),{ctrlKey:true,preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(p.document.activeElement.id,'glossBtn');
});

test('timeline describes time and step, jumps between beats, and retains native range keys',()=>{
  const p=loadPage({player:true,hash:'#packets'}),c=p.get('chapters')[0],scrub=el(p,'scrub');assert.match(scrub.getAttribute('aria-valuetext'),/0:00 of .*Step 1 of/);
  el(p,'stepNext').click();assert.ok(Math.abs(+scrub.value/1000*c.dur-c.beats[1][0])<=c.dur/1000);assert.match(scrub.getAttribute('aria-valuetext'),/Step 2 of/);
  const before=scrub.value;let prevented=false;p.key('ArrowLeft',scrub,{preventDefault(){prevented=true;}});assert.equal(scrub.value,before);assert.equal(prevented,false);
  scrub.value='500';scrub.dispatch('input');assert.equal(+scrub.value,500);el(p,'stepPrev').click();assert.ok(+scrub.value<500);
});

test('portrait retains the course and diagram controls offer readable size and touch editing',()=>{
  const p=loadPage({player:true,hash:'#packets',media:{'(orientation:portrait) and (pointer:coarse) and (max-width:600px)':true,'(pointer:coarse)':true}});
  assert.ok(!fs.readFileSync('src/page.html','utf8').includes('id="rotate"'));const before=el(p,'scrub').value;p.frame(0);p.frame(100);assert.notEqual(el(p,'scrub').value,before);
  el(p,'diagramReadable').click();assert.equal(el(p,'stage').classList.contains('readable'),true);assert.equal(el(p,'diagramReadable').getAttribute('aria-pressed'),'true');
  const time=el(p,'scrub').value;let prevented=false;p.key('ArrowRight',el(p,'stage'),{preventDefault(){prevented=true;}});assert.equal(el(p,'scrub').value,time);assert.equal(prevented,false);
  el(p,'diagramFit').click();assert.equal(el(p,'stage').classList.contains('readable'),false);
  p.key('p');assert.equal(el(p,'diagramEdit').getAttribute('aria-pressed'),'false');el(p,'diagramEdit').click();assert.equal(el(p,'diagramEdit').getAttribute('aria-pressed'),'true');
});

test('lab text editor can build, connect, undo and load-test a three-star design',()=>{
  const p=loadPage({player:true,hash:'#scaling',storage:{'pim-lab-locks':'false'}});p.key('p');
  el(p,'cPause').click();editorButton(p,'Add component').click();assert.equal(p.get('LAB_SAVE').scaling,undefined);el(p,'cPause').click();
  editorButton(p,'Add component').click();choose(p,'lab-from','f0');choose(p,'lab-to','n1');editorButton(p,'Connect').click();
  choose(p,'lab-kind','medium');editorButton(p,'Add component').click();choose(p,'lab-from','n1');choose(p,'lab-to','n2');editorButton(p,'Connect').click();
  for(let i=0;i<3;i++)editorButton(p,'Add component').click();
  assert.equal(p.get('LAB_SAVE').scaling.edges.length,5);assert.match(el(p,'cAccessible').textContent,/Your users → B: Load balancer/);
  editorButton(p,'Disconnect').click();assert.equal(p.get('LAB_SAVE').scaling.edges.length,4);editorButton(p,'Undo').click();assert.equal(p.get('LAB_SAVE').scaling.edges.length,5);
  editorButton(p,'Open the doors').click();assert.equal(el(p,'lab-kind').parentNode.parentNode.disabled,true);
  for(let t=0;t<=23000;t+=50)p.frame(t);
  assert.equal(JSON.parse(p.storage.get('pim-stars')).scaling,3);assert.match(el(p,'cReadout').textContent,/capacity/);assert.deepEqual(p.errors,[]);
});

test('keyboard, pointer and text additions share the same budget allowance',()=>{
  for(const method of ['key','pointer','editor']){
    const p=loadPage({storage:{'pim-lab-locks':'false'}}),r=challenge(p,'scaling');
    for(let i=0;i<2;i++){
      if(method==='key')r.press('5');
      else if(method==='pointer'){r.inst.down(816,483);r.inst.move(600,300);r.inst.up(600,300);}
      else{choose(p,'lab-kind','xl');editorButton(p,'Add component').click();}
    }
    assert.equal(p.get('LAB_SAVE').scaling.nodes.filter(n=>n.kind==='xl').length,1,method);r.click(/Undo/);assert.equal(p.get('LAB_SAVE').scaling.nodes.length,1,method);
  }
});

test('cancelling a lab move restores its position and creates no undo entry',()=>{
  const p=loadPage({storage:{'pim-lab-locks':'false'}}),r=challenge(p,'scaling');r.press('4');const n={...p.get('LAB_SAVE').scaling.nodes[1]};
  r.inst.down(n.x,n.y);r.inst.move(n.x+250,n.y+100);r.inst.cancel();r.inst.up(n.x+250,n.y+100);
  r.inst.down(n.x,n.y);r.inst.move(n.x+30,n.y+30);r.inst.up(n.x+30,n.y+30);
  assert.equal(p.get('LAB_SAVE').scaling.nodes[1].x,n.x+30);r.click(/Undo/);assert.equal(p.get('LAB_SAVE').scaling.nodes[1].x,n.x);r.click(/Undo/);assert.equal(p.get('LAB_SAVE').scaling.nodes.length,1);
});

test('player cancels capture on pointer cancellation, loss, pause and mode changes',()=>{
  for(const action of ['pointercancel','lostpointercapture','pause','exit']){
    const p=loadPage({player:true,hash:'#packets'});let cancels=0,ups=0;p.get('CHAL').packets.make=()=>({draw(){},down(){},cancel(){cancels++;},up(){ups++;}});p.key('p');el(p,'cStart').click();
    const cv=el(p,'cv');cv.dispatch('pointerdown',{clientX:500,clientY:200,pointerId:7});
    if(action==='pause')el(p,'cPause').click();else if(action==='exit')el(p,'cBack').click();else cv.dispatch(action,{pointerId:7});
    cv.dispatch('pointerup',{clientX:500,clientY:200,pointerId:7});assert.ok(cancels>=1);assert.equal(ups,0);
    if(action==='pointercancel'||action==='lostpointercapture'){cv.dispatch('pointerdown',{clientX:500,clientY:200,pointerId:8});cv.dispatch('pointerup',{clientX:500,clientY:200,pointerId:8});assert.equal(ups,1);}
  }
});

test('ordering and service boundaries discard cancelled drags without committing decisions',()=>{
  const p=loadPage(),make=p.get('orderGame')({steps:[{t:'One'},{t:'Two'}]});const r=challenge(p,'fixture',{make});r.inst.down(105,440);r.inst.move(105,250);r.inst.cancel();r.inst.up();r.click(/Check my order/);assert.match(r.state.status,/Fill every numbered slot/);
  const m=challenge(p,'microservices');m.inst.down(140,150);m.inst.move(200,310);m.inst.cancel();m.inst.up();m.click(/Check boundaries/);assert.match(m.state.status,/Place every feature/);
});

test('search and cache decisions expose the information required to choose semantic controls',()=>{
  const p=loadPage(),r=challenge(p,'search');assert.equal(metrics(r).redis,'D1, D2, D5');r.click(/^D1:/).click(/^D5:/).click(/Check my answer/);assert.match(r.state.status,/Right/);
  const cache=challenge(p,'caching');cache.step(8);assert.ok(metrics(cache)['Slot 1']);assert.match(metrics(cache)['Hits'],/LRU target/);assert.equal(cache.state.buttons.filter(b=>/Evict slot/.test(b.label)).length,4);
});

test('informational faint text exceeds 4.5:1 in all themes while unearned stars use their own token',()=>{
  const css=fs.readFileSync('src/styles.css','utf8');const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
  for(const match of css.matchAll(/:root(?:\[data-theme="[^"]+"\])?\{([^}]+)\}/g)){
    const vars=Object.fromEntries([...match[1].matchAll(/--([\w-]+):([^;]+)/g)].map(m=>[m[1],m[2]]));
    const expand=c=>c.length===4?'#'+[...c.slice(1)].map(v=>v+v).join(''):c;
    for(const key of ['side','bg','panel','hover-bg']){const a=luminance(expand(vars.faint)),b=luminance(expand(vars[key]));assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`${key}: ${match[0]}`);}
  }
  assert.match(css,/\.ch \.st\{[^}]+color:var\(--star-off\)/);assert.match(css,/\.find input::placeholder\{color:var\(--faint\)/);
});
