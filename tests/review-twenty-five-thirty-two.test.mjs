import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPage,challenge} from './harness.mjs';

const el=(p,id)=>p.document.getElementById(id);
const button=(p,text)=>p.document.querySelectorAll('button').find(b=>b.textContent===text);
const advance=(p,seconds,start=0)=>{for(let t=start;t<=start+seconds*1000;t+=50)p.frame(t);};
const quizButton=(p,group)=>el(p,'toc').children.find(b=>b.dataset.q===group);

test('Back and Forward restore chapter position, paused, without adding scrub entries',()=>{
  const p=loadPage({player:true,hash:'#packets'});p.context.seek(12);const count=p.context.history.length;
  for(let i=0;i<10;i++)p.context.seek(i);assert.equal(p.context.history.length,count);
  p.context.seek(12);el(p,'nextBtn').click();assert.equal(p.context.history.length,count+1);p.context.seek(5);
  p.context.history.back();assert.equal(p.context.location.hash,'#packets');assert.match(el(p,'time').textContent,/0:12/);assert.equal(el(p,'playBtn').getAttribute('aria-label'),'Play');
  p.context.history.forward();assert.equal(p.context.location.hash,'#client-server');assert.match(el(p,'time').textContent,/0:05/);assert.equal(el(p,'playBtn').getAttribute('aria-label'),'Play');assert.deepEqual(p.errors,[]);
});

test('quiz history transitions are atomic and restore the selected quiz or saved lab',()=>{
  const p=loadPage({player:true,hash:'#scaling'});p.key('p');p.key('1');const count=p.context.history.length;
  quizButton(p,'Traffic').click();assert.equal(p.context.location.hash,'#quiz-traffic');assert.equal(p.context.history.length,count+1);
  p.context.history.back();assert.equal(p.context.location.hash,'#scaling');assert.equal(p.document.body.classList.contains('play'),true);assert.equal(p.get('LAB_SAVE').scaling.nodes.length,2);
  p.context.history.forward();assert.equal(el(p,'cTitle').textContent,'Traffic recap');assert.equal(el(p,'cStart').hidden,false);
  const before=p.context.history.length;el(p,'cBack').click();assert.equal(p.context.history.length,before+1);assert.equal(p.context.location.hash,'#scaling');assert.deepEqual(p.errors,[]);
});

test('returning visits offer Continue with a saved timestamp and speed, without autoplay',()=>{
  const p=loadPage({player:true,hash:'#caching'});el(p,'speed').onchange({target:{value:'1.5'}});p.context.seek(15);p.document.dispatch('visibilitychange');
  const q=loadPage({player:true,storage:Object.fromEntries(p.storage)});assert.equal(el(q,'resume').hidden,false);assert.match(el(q,'resumeText').textContent,/Caching.*0:15/);assert.equal(el(q,'playBtn').getAttribute('aria-label'),'Play');
  el(q,'continueBtn').click();assert.equal(q.context.location.hash,'#caching');assert.match(el(q,'time').textContent,/0:15/);assert.equal(el(q,'speed').value,'1.5');assert.equal(el(q,'playBtn').getAttribute('aria-label'),'Play');assert.equal(el(q,'resume').hidden,true);
});

test('deep links win over Continue and invalid bookmarks cannot poison navigation',()=>{
  const valid={version:1,chapter:'caching',time:15,speed:1.5};
  const linked=loadPage({player:true,hash:'#auth',storage:{'pim-resume':JSON.stringify(valid)}});assert.equal(linked.context.location.hash,'#auth');assert.equal(el(linked,'resume').hidden,true);
  for(const value of [null,[],{...valid,version:2},{...valid,chapter:'unknown'},{...valid,time:-1},{...valid,time:999},{...valid,time:'15'},{...valid,speed:100}]){
    const p=loadPage({player:true,storage:{'pim-resume':JSON.stringify(value),'pim-speed':'100'}});assert.equal(el(p,'resume').hidden,true);assert.equal(el(p,'speed').value,'1');assert.deepEqual(p.errors,[]);
  }
});

test('lesson ending and seeking never grant completion; explicit completion persists independently of stars',()=>{
  const p=loadPage({player:true,hash:'#packets'}),c=p.get('chapters')[0];p.context.seek(c.dur-.01);advance(p,.5);
  assert.equal(p.storage.has('sdve-seen'),false);assert.equal(el(p,'card').open,true);el(p,'cardComplete').click();assert.equal(JSON.parse(p.storage.get('sdve-seen')).packets,1);assert.equal(p.storage.has('pim-stars'),false);
  const q=loadPage({player:true,storage:Object.fromEntries(p.storage)});assert.equal(el(q,'completeBtn').disabled,true);assert.match(el(q,'toc').children.find(b=>+b.dataset.i===0).getAttribute('aria-label'),/completed, 0 of 3 stars/);
});

test('locked lab components provide a direct prerequisite route and explicit completion unlocks them',()=>{
  const p=loadPage({player:true,hash:'#spof'});p.key('p');p.key('1');assert.match(el(p,'cStatus').innerHTML,/mark chapter 6.*complete/);
  const label='Open required lesson: '+p.get('chapters').find(c=>c.id==='load-balancers').title;button(p,label).click();assert.equal(p.context.location.hash,'#load-balancers');assert.equal(el(p,'playBtn').getAttribute('aria-label'),'Play');
  el(p,'completeBtn').click();p.context.history.back();p.key('1');assert.equal(p.get('LAB_SAVE').spof.nodes.filter(n=>n.kind==='lb').length,1);assert.deepEqual(p.errors,[]);
});

test('lab goal and Run, Undo, Hint precede the board and survive retry and exit',()=>{
  const p=loadPage({player:true,hash:'#sessions'});p.key('p');assert.equal(el(p,'cBrief').parentNode.id,'labIntro');assert.equal(el(p,'cHintBtn').parentNode.id,'labActions');
  assert.ok(el(p,'labActions').children.some(b=>b.textContent==='Undo'));assert.ok(el(p,'labActions').children.some(b=>b.classList.contains('pri')));assert.equal(el(p,'labActions').hidden,false);
  assert.deepEqual(el(p,'labActions').children.map(b=>b.textContent),['Run load test','Undo','Hint'],'keyboard order matches the visible toolbar');assert.equal(el(p,'cAccessible').children[0].id,'labSummary');
  el(p,'cRestart').click();assert.equal(el(p,'cHintBtn').parentNode.id,'labActions');el(p,'cBack').click();assert.equal(el(p,'labActions').hidden,true);assert.equal(el(p,'cBrief').parentNode.id,'cpanel');assert.ok(el(p,'cHintBtn').parentNode);assert.deepEqual(p.errors,[]);
});

test('lab edits announce only the action while persistent summary retains budget, graph and instructions',()=>{
  const p=loadPage({storage:{'pim-lab-locks':'false'}}),r=challenge(p,'scaling');r.press('1');assert.match(r.state.status,/Added load balancer B/);assert.doesNotMatch(r.state.status,/Budget|Add with|Your design/);assert.ok(r.state.status.length<100);
  assert.match(r.state.summary,/Budget <b>\$1 of \$13/);assert.match(r.state.summary,/Your components and connections/);assert.match(r.state.summary,/Keyboard shortcuts and component costs/);
  r.press('a','b');assert.match(r.state.status,/Wired Your users → Load balancer/);assert.match(r.state.summary,/<b>A<\/b> Your users → B/);r.click(/Undo/);assert.equal(r.state.status,'Undone.');assert.doesNotMatch(r.state.summary,/Your users → B/);
});

test('ID challenge requires business allocation for gapless invoices and qualified timestamp ordering',()=>{
  const r=challenge(loadPage(),'unique-ids');for(let i=0;i<7;i++){
    const s=r.state.status;if(/Invoice numbers/.test(s)){assert.ok(r.state.buttons.some(b=>/Business numbering/.test(b.label)));r.press('4');assert.match(r.state.status,/Card|Correct box/);}
    else r.press(/small app/.test(s)?'1':/64-bit|64 bits/.test(s)?'3':'2');
  }
  r.step(1.2);assert.equal(r.result.stars,3);
});

test('authentication challenge separates OIDC login from OAuth delegated API access',()=>{
  const r=challenge(loadPage(),'auth');for(let i=0;i<8;i++){
    const s=r.state.status;r.press(/work account|Federated login/.test(s)?'4':/print shop/.test(s)?'3':/microservices|Stateless/.test(s)?'2':'1');
  }
  r.step(1.2);assert.equal(r.result.stars,3);
});

test('lessons, glossary and quizzes consistently cover ID guarantees, ID tokens and PKCE',()=>{
  const p=loadPage(),chapters=p.get('chapters'),ids=chapters.find(c=>c.id==='unique-ids'),auth=chapters.find(c=>c.id==='auth');
  const idText=ids.beats.map(b=>b.join(' ')).join(' '),authText=auth.beats.map(b=>b.join(' ')).join(' ');
  for(const phrase of [/rollbacks can leave gaps/,/transactional allocator/,/UUIDv4/,/UUIDv7/,/guard against backwards clocks/,/counter is exhausted/,/Clock skew/,/causal metadata/])assert.match(idText,phrase);
  for(const phrase of [/not proof of login identity/,/OpenID Connect/,/ID token/,/issuer, audience, expiry/,/nonce/,/PKCE/,/SHA-256 challenge/,/state/])assert.match(authText,phrase);
  for(const name of ['UUIDv4','UUIDv7','OpenID Connect','ID token','PKCE'])assert.ok(p.get('GLOSSARY').some(g=>g[0]===name));
  assert.ok(p.get('QUIZ').Traffic.make.questions.some(q=>q.q.includes('authorization code exchange')));assert.ok(p.get('QUIZ').Advanced.make.questions.some(q=>q.q.includes('gapless invoice')));
});
