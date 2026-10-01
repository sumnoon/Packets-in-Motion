/* ============================================================
   PLAYER / UI
   ============================================================ */
(function(){
const $=id=>document.getElementById(id);
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
let seen={};try{seen=JSON.parse(store.get('sdve-seen')||'{}')||{};}catch(e){seen={};}
let stars={};try{stars=JSON.parse(store.get('pim-stars')||'{}')||{};}catch(e){stars={};}
let mode='watch',inst=null,api=null,ct=0,pdown=null,quizG=null;   // quizG: the section whose quiz is running
let cur=0,t=0,playing=false,speed=1,last=null,capIdx=-1,captions=store.get('sdve-cc')!=='0',K=1,dragging=false,wasPlaying=false;
const ICON_PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',ICON_PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

// sidebar
const toc=$('toc');let grp='';
const addQuiz=gname=>{if(!QUIZ[gname])return;const b=document.createElement('button');b.className='qz';b.dataset.q=gname;b.innerHTML='<span class="n" aria-hidden="true">✎</span><span>Section quiz</span><span class="st" aria-hidden="true"></span>';b.onclick=()=>{startQuiz(gname);document.body.classList.remove('menu');};toc.appendChild(b);};
chapters.forEach((c,i)=>{if(c.group!==grp){if(grp)addQuiz(grp);grp=c.group;const h=document.createElement('div');h.className='grp';h.dataset.g=grp;h.textContent=grp;toc.appendChild(h);}
  const b=document.createElement('button');b.className='ch';b.dataset.i=i;b.innerHTML=`<span class="n">${i+1}</span><span>${c.title}</span>${CHAL[c.id]?'<span class="st"></span>':''}`;b.onclick=()=>{load(i,true);document.body.classList.remove('menu');};toc.appendChild(b);});
// screen readers get one clear name per chapter: number, title, watched, stars
addQuiz(grp);
function qzLabel(b){const q=QUIZ[b.dataset.q],k=stars[q.id]||0;b.setAttribute('aria-label',`${q.title}, ${k} of 3 stars`);}
function tocLabel(b){const j=+b.dataset.i,c=chapters[j],k=stars[c.id]||0;b.setAttribute('aria-label',`${j+1}. ${c.title}${seen[c.id]?', watched':''}${CHAL[c.id]?`, ${k} of 3 stars`:''}`);}

function resize(){const r=cv.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2.5);cv.width=Math.max(1,Math.round(r.width*dpr));cv.height=Math.max(1,Math.round(r.width*H/W*dpr));K=cv.width/W;render();}
const fmt=s=>{s=Math.max(0,s);return Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');};
function beatIndex(c,tt){let k=0;c.beats.forEach((b,i)=>{if(tt>=b[0])k=i;});return k;}

// The Memory Void: a blue-black void with two drifting fog banks, a soft pool of
// light and motes that rise with time. Driven by the clock it is given, so a
// paused lesson holds still and seek stays exact.
const MOTES=Array.from({length:80},(_,i)=>({x:rnd(i+1)*W,y:rnd(i+201)*H,r:.5+rnd(i+401)*1.7,d:.25+rnd(i+601)*.75,a:.12+rnd(i+801)*.5,p:rnd(i+1001)*6.28}));
function drawVoid(clock){const tt=reduceMQ.matches?0:clock;g.fillStyle=C.bg;g.fillRect(0,0,W,H);
  const fog=(x,y,rx,col)=>{const gr=g.createRadialGradient(x,y,0,x,y,rx);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(4,6,13,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);};
  fog(640+60*Math.sin(tt*.07),330+20*Math.cos(tt*.05),460,'rgba(44,66,130,.30)');
  fog(170+50*Math.cos(tt*.06),110+18*Math.sin(tt*.08),300,'rgba(90,64,150,.22)');
  fog(500,300,380,'rgba(28,38,72,.30)');
  g.fillStyle='rgba(143,166,214,.08)';g.fillRect(0,500,W,1);
  MOTES.forEach(m=>{const x=((m.x+tt*6*m.d)%W+W)%W,y=((m.y-tt*9*m.d)%H+H)%H,a=m.a*(.65+.35*Math.sin(tt*.9+m.p));g.fillStyle=`rgba(236,242,255,${a.toFixed(3)})`;g.beginPath();g.arc(x,y,m.r*m.d+.3,0,7);g.fill();});
  const v=g.createRadialGradient(W/2,H/2,H*.42,W/2,H/2,W*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');g.fillStyle=v;g.fillRect(0,0,W,H);}
function drawBackground(){drawVoid(t);}
function drawBeatTitle(c,tt){const k=beatIndex(c,tt),b=c.beats[k],a=clamp((tt-b[0])/.45),e=eio(a);
  g.save();g.globalAlpha=.25+.75*e;const chip=`${k+1}/${c.beats.length}`;const cw=tw(chip,12,700)+16;
  rr(26,22,cw,24,12);g.fillStyle=hexA(C.accent,.18);g.fill();g.strokeStyle=hexA(C.accent,.6);g.lineWidth=1.2;g.stroke();
  tx(chip,26+cw/2,34.5,{z:12,wt:700,c:C.accent});
  tx(b[1],26+cw+12-8*(1-e),35,{z:19,wt:650,al:'left',c:C.text});g.restore();}

function render(){if(mode==='play'){renderChal(0);return;}const c=chapters[cur];g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;drawBackground();
  try{c.draw(t);}catch(e){console.error(e);}
  g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;drawBeatTitle(c,t);
  // UI sync
  const p=t/c.dur*100;$('scrub').value=Math.round(t/c.dur*1000);$('scrub').style.setProperty('--p',p+'%');
  $('time').textContent=fmt(t)+' / '+fmt(c.dur);
  const k=beatIndex(c,t);if(k!==capIdx){if(playing&&capIdx>=0)SFX.play('beat');capIdx=k;const el=$('capText');fillTerms(el,c.beats[k][2]);el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');$('capStep').textContent=`${k+1}/${c.beats.length}`;
    const b=c.beats[k],step=`Step ${k+1} of ${c.beats.length}: ${b[1]}`;cv.setAttribute('aria-label',`${c.title}. ${step}`);
    announce((annTitle?c.title+'. ':'')+step+'. '+b[2]);annTitle=false;markTranscript(k);}
}
function setPlaying(v){playing=v;$('playBtn').innerHTML=v?ICON_PAUSE:ICON_PLAY;$('playBtn').title=v?'Pause (Space)':'Play (Space)';$('playBtn').setAttribute('aria-label',v?'Pause':'Play');}
// the canvas is silent, so each step is read out (debounced, so scrubbing does not flood the queue)
let liveT=0,annTitle=false;
function announce(s){clearTimeout(liveT);liveT=setTimeout(()=>{$('srLive').textContent=s;},350);}
// transcript: every step as text; activating one jumps there
function buildTranscript(c){const ol=$('trList');ol.innerHTML='';
  c.beats.forEach((b,k)=>{const li=document.createElement('li'),btn=document.createElement('button'),ts=document.createElement('span'),h=document.createElement('b'),p=document.createElement('span');
    btn.type='button';ts.className='ts';ts.textContent=fmt(b[0]);h.textContent=b[1];fillTerms(p,b[2],2);btn.append(ts,h,p);btn.onclick=()=>{seek(b[0]+.01);setPlaying(true);};li.appendChild(btn);ol.appendChild(li);});}
function markTranscript(k){Array.from($('trList').children).forEach((li,j)=>{const on=j===k,b=li.children[0];li.classList.toggle('now',on);if(on)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
function setTranscript(v){$('transcript').hidden=!v;$('trBtn').setAttribute('aria-expanded',String(v));$('trBtn').classList.toggle('on',v);store.set('pim-tr',v?'1':'0');}
function showCard(v,done){const card=$('card'),was=card.classList.contains('show');card.classList.toggle('show',v);card.classList.toggle('done',!!done);
  // move focus into the card when it opens, and back to its button when it closes
  if(v&&!was)setTimeout(()=>{const b=$(done?'cardNext':'cardClose');if(b)b.focus({preventScroll:true});},60);
  else if(!v&&was&&card.contains(document.activeElement))$('tradeBtn').focus({preventScroll:true});}
function seek(nt){const c=chapters[cur];t=clamp(nt,0,c.dur);if(t<c.dur)showCard(false);render();}
window.seek=seek;
function load(i,autoplay){if(mode==='play')exitChal(true);hideResult();cur=(i+chapters.length)%chapters.length;const c=chapters[cur];t=0;capIdx=-1;showCard(false);
  heading();$('cardChal').hidden=!CHAL[c.id];
  $('cardTitle').textContent=c.title;buildTranscript(c);annTitle=true;listTerms($('useList'),c.use);listTerms($('conList'),c.cons);cardLinks(c);
  $('ticks').innerHTML=c.beats.slice(1).map(b=>`<b style="left:${b[0]/c.dur*100}%"></b>`).join('');
  markToc();
  $('nextBtn').disabled=false;$('cardNext').textContent=cur===chapters.length-1?'Back to chapter 1 →':'Next chapter →';
  setPlaying(!!autoplay);render();}
// title, eyebrow, tab title and URL for the current chapter (or the running quiz)
function heading(){const c=chapters[cur],q=quizG&&QUIZ[quizG];
  $('eyebrow').textContent=q?`${q.group} · Section quiz`:`${c.group} · Chapter ${cur+1} of ${chapters.length}`;$('title').textContent=q?q.title:c.title;
  document.title=(q?q.title:c.title)+' · Packets in Motion';$('chalBtn').hidden=!!q||!CHAL[c.id];
  const h='#'+(q?q.id:c.id);if(location.hash!==h)history.replaceState(null,'','#'+(q?q.id:c.id));}
// sidebar state: the current chapter (or quiz), watched marks, names for screen readers
function markToc(){document.querySelectorAll('.ch').forEach(b=>{const j=+b.dataset.i,on=!quizG&&j===cur;b.classList.toggle('on',on);b.classList.toggle('seen',!!seen[chapters[j].id]);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');tocLabel(b);});
  document.querySelectorAll('.qz').forEach(b=>{const on=b.dataset.q===quizG;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');qzLabel(b);});
  const on=document.querySelector(quizG?'.qz.on':'.ch.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});}
// "Before this" and "Related" chapter links on the trade-offs card
function cardLinks(c){const box=$('cardLinks');box.innerHTML='';
  [['Before this',c.needs],['Related',c.related]].forEach(([label,ids])=>{const list=(ids||[]).map(id=>chapters.findIndex(x=>x.id===id)).filter(i=>i>=0&&i!==cur);if(!list.length)return;
    const span=document.createElement('span'),b=document.createElement('b');b.textContent=label+':';span.appendChild(b);
    list.forEach(i=>{const btn=document.createElement('button');btn.type='button';btn.textContent=chapters[i].title;btn.onclick=()=>load(i,true);span.appendChild(btn);});box.appendChild(span);});}
function finish(){const c=chapters[cur];seen[c.id]=1;store.set('sdve-seen',JSON.stringify(seen));
  document.querySelectorAll('.ch').forEach(b=>{b.classList.toggle('seen',!!seen[chapters[+b.dataset.i].id]);tocLabel(b);});updProg();showCard(true,true);}
function updProg(){$('progBar').style.width=(Object.keys(seen).filter(k=>chapters.some(c=>c.id===k)).length/chapters.length*100)+'%';}
function frame(ts){if(last==null)last=ts;const dt=Math.min(.06,(ts-last)/1000);last=ts;
  if(mode==='play'){ct+=dt;renderChal(dt);}
  else if(playing&&!dragging){const c=chapters[cur];t+=dt*speed;if(t>=c.dur){t=c.dur;setPlaying(false);finish();}render();}
  requestAnimationFrame(frame);}

// controls
$('playBtn').onclick=()=>{const c=chapters[cur];if(!playing&&t>=c.dur)seek(0);showCard(false);setPlaying(!playing);};
$('replayBtn').onclick=()=>{seek(0);setPlaying(true);};
$('cardReplay').onclick=()=>{seek(0);setPlaying(true);};
$('cardClose').onclick=()=>showCard(false);
$('cardNext').onclick=()=>load(cur+1,true);
$('prevBtn').onclick=()=>load(cur-1,true);
$('nextBtn').onclick=()=>load(cur+1,true);
$('tradeBtn').onclick=()=>{const v=!$('card').classList.contains('show');if(v)setPlaying(false);showCard(v);};
$('speed').onchange=e=>{speed=+e.target.value;};
const sc=$('scrub');
sc.addEventListener('pointerdown',()=>{dragging=true;wasPlaying=playing;});
sc.addEventListener('input',()=>{seek(sc.value/1000*chapters[cur].dur);});
const endDrag=()=>{if(dragging){dragging=false;last=null;}};
sc.addEventListener('pointerup',endDrag);sc.addEventListener('change',endDrag);window.addEventListener('pointerup',endDrag);
cv.addEventListener('click',()=>{if(mode!=='play')$('playBtn').click();});
/* ---------------- challenge mode ---------------- */
function renderChal(dt){g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;drawVoid(ct);try{if(inst)inst.draw(ct,dt);}catch(e){console.error(e);}g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;FX.step(dt);}
function makeApi(){const ctl=$('cCtl'),run=$('cRun'),els=[];ctl.innerHTML='';run.innerHTML='';
  const field=(label,node)=>{const d=document.createElement('div');d.className='ctl';const s=document.createElement('span');s.textContent=label;d.append(s,node);ctl.appendChild(d);return d;};
  return{now:()=>ct,
    status(h){$('cStatus').innerHTML=h;},
    button(label,fn,o={}){const b=document.createElement('button');b.type='button';b.className='btn'+(o.primary?' pri':'');b.textContent=label;b.onclick=()=>fn();run.appendChild(b);els.push(b);return b;},
    slider(label,min,max,step,val,fmt,fn){const i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=val;i.setAttribute('aria-label',label);const o=document.createElement('output');o.textContent=fmt(val);
      i.oninput=()=>{o.textContent=fmt(+i.value);fn(+i.value);};field(label,i).appendChild(o);els.push(i);return i;},
    seg(label,opts,val,fn){const box=document.createElement('div');box.className='seg';box.setAttribute('role','group');box.setAttribute('aria-label',label);
      opts.forEach(([v,txt])=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute('aria-pressed',String(v===val));b.onclick=()=>{box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));fn(v);};box.appendChild(b);els.push(b);});field(label,box);return box;},
    toggle(label,val,fn){const b=document.createElement('button');b.type='button';b.className='tog';b.textContent=label;b.setAttribute('aria-pressed',String(val));b.onclick=()=>{const v=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(v));fn(v);};ctl.appendChild(b);els.push(b);return b;},
    lock(v){els.forEach(e=>e.disabled=v);},
    win(st,title,msg){showResult(st,title,msg);}};}
function startQuiz(gname){if(!QUIZ[gname])return;startChal(gname);}
function startChal(gname){const c=chapters[cur],d=gname?QUIZ[gname]:CHAL[c.id];if(!d)return;quizG=gname||null;setPlaying(false);showCard(false);hideResult();mode='play';document.body.classList.add('play');
  $('cTitle').textContent=d.title;$('cGoal').textContent=d.goal;$('cHint').hidden=true;$('cHint').textContent='Hint: '+d.hint;$('cStatus').textContent='';
  FX.clear();ct=0;api=makeApi();inst=d.make(api);$('cHintBtn').textContent=inst&&inst.hintLabel?inst.hintLabel():'Hint';$('chalBtn').setAttribute('aria-pressed','true');$('chalBtn').textContent='★ Challenge (on)';cv.setAttribute('aria-label',`${quizG?'Quiz':'Challenge'}: ${d.title}. ${d.goal}`);
  $('cTag').textContent=quizG?'Quiz':'Challenge';$('cBack').textContent=quizG?'Back to the lessons':'Back to lesson';heading();markToc();render();}
function exitChal(quiet){const wasQuiz=quizG;quizG=null;if(wasQuiz){heading();markToc();}mode='watch';capIdx=-1;inst=null;document.body.classList.remove('play');hideResult();FX.clear();$('chalBtn').setAttribute('aria-pressed','false');$('chalBtn').textContent='★ Challenge';if(!quiet)render();}
function showResult(st,title,msg){const c=chapters[cur],id=quizG?QUIZ[quizG].id:c.id;if(st>(stars[id]||0)){stars[id]=st;store.set('pim-stars',JSON.stringify(stars));updStars();markToc();}
  const all=allIds().every(id=>stars[id]===3);SFX.play('win',st);
  $('resStars').innerHTML=[0,1,2].map(i=>`<i class="${i<st?'on':''}" style="--i:${i}">★</i>`).join('');$('resTitle').textContent=title;
  $('resMsg').textContent=msg+(all&&st===3?' That was the last star: you have mastered every challenge in the course!':'');
  $('resNext').textContent=quizG?'Next section →':cur===chapters.length-1?'Back to lesson 1 →':'Next lesson →';$('resWatch').textContent=quizG?'Back to the lessons':'Watch the lesson';$('result').classList.add('show');if(st===3)FX.burst(W/2,H/2,C.amber,50,300);
  setTimeout(()=>{const b=$(st?'resNext':'resRetry');if(b)b.focus({preventScroll:true});},60);}
function hideResult(){$('result').classList.remove('show');}
const allIds=()=>[...Object.keys(CHAL),...Object.values(QUIZ).map(q=>q.id)];
// the first chapter of the section after a quiz's section
const afterQuiz=gname=>{let i=-1;chapters.forEach((c,j)=>{if(c.group===gname)i=j;});return i+1;};
const firstOf=gname=>Math.max(0,chapters.findIndex(c=>c.group===gname));
function updStars(){let n=0;document.querySelectorAll('.qz').forEach(b=>{const k=stars[QUIZ[b.dataset.q].id]||0,s=b.querySelector('.st');n+=k;if(s){s.textContent='★'.repeat(k)+'☆'.repeat(3-k);s.classList.toggle('got',k>0);}});document.querySelectorAll('.ch').forEach(b=>{const id=chapters[+b.dataset.i].id,s=b.querySelector('.st'),k=CHAL[id]?stars[id]||0:0;n+=k;if(!s)return;s.textContent='★'.repeat(k)+'☆'.repeat(3-k);s.classList.toggle('got',k>0);s.setAttribute('aria-hidden','true');tocLabel(b);});
  $('starTotal').textContent=`★ ${n} / ${allIds().length*3} stars`;}
const toWorld=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
cv.addEventListener('pointerdown',e=>{if(mode!=='play'||!inst)return;const[x,y]=toWorld(e);pdown={x,y};try{cv.setPointerCapture(e.pointerId);}catch(_){}if(inst.down)inst.down(x,y,ct);});
cv.addEventListener('pointermove',e=>{if(mode!=='play'||!inst)return;const[x,y]=toWorld(e);if(inst.move)inst.move(x,y,ct);});
cv.addEventListener('pointerup',e=>{if(mode!=='play'||!inst)return;const[x,y]=toWorld(e);if(inst.up)inst.up(x,y,ct);if(pdown&&Math.hypot(x-pdown.x,y-pdown.y)<8&&inst.click)inst.click(x,y,ct);pdown=null;});
$('chalBtn').onclick=()=>{if(mode==='play')exitChal();else startChal();};
$('cardChal').onclick=()=>startChal();$('cRestart').onclick=()=>startChal(quizG);$('cBack').onclick=()=>exitChal();
// a lab's hints go a level deeper with each press; other challenges show their one hint
$('cHintBtn').onclick=()=>{if(inst&&inst.hint){const d=quizG?QUIZ[quizG]:CHAL[chapters[cur].id],r=inst.hint(d.hint);$('cHint').hidden=!r.text;if(r.text)$('cHint').textContent=r.text;$('cHintBtn').textContent=r.label;return;}$('cHint').hidden=!$('cHint').hidden;};
$('resRetry').onclick=()=>startChal(quizG);
$('resWatch').onclick=()=>{if(quizG){const g=quizG;exitChal(true);load(firstOf(g),false);return;}exitChal();seek(0);setPlaying(true);};
$('resNext').onclick=()=>{if(quizG){const i=afterQuiz(quizG);exitChal(true);load(i,true);return;}load(cur+1,true);};

function setCC(v){captions=v;$('caption').classList.toggle('hide',!v);$('ccBtn').classList.toggle('on',v);$('ccBtn').setAttribute('aria-pressed',String(v));store.set('sdve-cc',v?'1':'0');}
$('ccBtn').onclick=()=>setCC(!captions);
$('trBtn').onclick=()=>setTranscript($('transcript').hidden);
// themes: the page chrome follows the theme; high contrast also brightens the stage
const BASE={...C},HC={text:'#ffffff',dim:'#c6cddb',faint:'#98a2b6',edge:'#7f8fb2',line:'#4b5a7c',bg:'#000000'};
function setTheme(v){if(!['dark','light','contrast'].includes(v))v='dark';document.documentElement.setAttribute('data-theme',v);Object.assign(C,BASE,v==='contrast'?HC:{});$('theme').value=v;render();}
$('theme').onchange=e=>{store.set('pim-theme',e.target.value);setTheme(e.target.value);};
$('menuBtn').onclick=()=>document.body.classList.toggle('menu');
$('scrim').onclick=()=>document.body.classList.remove('menu');
window.addEventListener('keydown',e=>{if($('glossary').open)return;if(e.key==='Escape'&&!tip.hidden){hideTip();return;}
  if(e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT'&&(e.key!==' '||e.target.type!=='range'))return;const c=chapters[cur];
  if(mode!=='play'&&(e.target.tagName==='BUTTON'||e.target.tagName==='A')&&(e.key===' '||e.key==='Enter'))return;   // the focused control handles it
  if(mode==='play'){if(e.key==='Escape'){if($('result').classList.contains('show'))hideResult();else exitChal();}
    else if(e.key===']')load(cur+1,true);else if(e.key==='[')load(cur-1,true);
    else if(!(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))&&inst&&inst.key){if(e.key===' ')e.preventDefault();inst.key(e.key,ct,e);}
    return;}
  if(e.key==='p'||e.key==='P'){startChal();return;}
  if(e.key==='/'){e.preventDefault();document.body.classList.add('menu');$('find').focus();return;}
  if(e.key==='g'||e.key==='G'){openGlossary();return;}
  if(e.key===' '){e.preventDefault();$('playBtn').click();}
  else if(e.key==='ArrowRight'){e.preventDefault();seek(t+2);}
  else if(e.key==='ArrowLeft'){e.preventDefault();seek(t-2);}
  else if(e.key===']')load(cur+1,true);else if(e.key==='[')load(cur-1,true);
  else if(e.key==='r'||e.key==='R'){seek(0);setPlaying(true);}
  else if(e.key==='c'||e.key==='C')setCC(!captions);
  else if(e.key==='t'||e.key==='T')$('tradeBtn').click();
  else if(e.key==='s'||e.key==='S')$('trBtn').click();
  else if(e.key==='Escape'){showCard(false);document.body.classList.remove('menu');}
  else if(/^[0-9]$/.test(e.key)){const k=e.key==='0'?9:+e.key-1;if(c.beats[k])seek(c.beats[k][0]+.01);}});
window.addEventListener('resize',resize);
if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);
const quizFor=h=>Object.keys(QUIZ).find(g=>'#'+QUIZ[g].id===h);
window.addEventListener('hashchange',()=>{const q=quizFor(location.hash);if(q){if(q!==quizG){load(firstOf(q),false);startQuiz(q);}return;}
  const i=chapters.findIndex(c=>'#'+c.id===location.hash);if(i>=0&&(i!==cur||quizG))load(i,true);});
// fullscreen + landscape lock (lock works on Android; iOS relies on the rotate prompt)
const fsOK=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function goFull(){const el=document.documentElement,req=el.requestFullscreen||el.webkitRequestFullscreen;
  const inFs=document.fullscreenElement||document.webkitFullscreenElement;
  if(inFs){(document.exitFullscreen||document.webkitExitFullscreen).call(document);try{screen.orientation.unlock();}catch(e){}return;}
  if(!req)return;Promise.resolve(req.call(el)).then(()=>{try{return screen.orientation.lock('landscape');}catch(e){}}).catch(()=>{});}
if(!fsOK){$('fsBtn').style.display='none';$('rotateFs').style.display='none';}
$('fsBtn').onclick=goFull;$('rotateFs').onclick=goFull;
window.addEventListener('keydown',e=>{if((e.key==='f'||e.key==='F')&&fsOK&&e.target.tagName!=='INPUT'&&mode!=='play'&&!$('glossary').open)goFull();});
// pause while the portrait prompt covers the stage; resume when turned back
const portrait=window.matchMedia('(orientation:portrait) and (pointer:coarse) and (max-width:600px)');let resumeOnTurn=false;
function onOrient(){if(portrait.matches){resumeOnTurn=playing;if(playing)setPlaying(false);}else if(resumeOnTurn){resumeOnTurn=false;last=null;setPlaying(true);}resize();}
if(portrait.addEventListener)portrait.addEventListener('change',onOrient);else if(portrait.addListener)portrait.addListener(onOrient);
/* ---------------- search ---------------- */
const hay=chapters.map(c=>[c.title,c.group,...c.beats.map(b=>b[1]+' '+b[2]),...c.use,...c.cons].join(' ').toLowerCase());
function filterToc(q){const words=q.trim().toLowerCase().split(/\s+/).filter(Boolean),hit=i=>words.every(w=>hay[i].includes(w));let n=0;
  document.querySelectorAll('.ch').forEach(b=>{const ok=hit(+b.dataset.i);b.hidden=!ok;if(ok)n++;});
  document.querySelectorAll('.qz').forEach(b=>{b.hidden=words.length>0&&!words.every(w=>(b.dataset.q+' section quiz').toLowerCase().includes(w));});
  document.querySelectorAll('.grp').forEach(h=>{h.hidden=words.length>0&&!chapters.some((c,i)=>c.group===h.dataset.g&&hit(i));});
  $('noFind').hidden=!words.length||n>0;$('findMsg').textContent=words.length?(n?`${n} chapter${n>1?'s':''} match`:'No chapters match'):'';return n;}
$('find').addEventListener('input',e=>filterToc(e.target.value));
$('find').addEventListener('keydown',e=>{if(e.key==='Enter'){const b=[...document.querySelectorAll('.ch')].find(b=>!b.hidden);if(b)b.click();}
  else if(e.key==='Escape'){e.target.value='';filterToc('');e.target.blur();}});

/* ---------------- glossary ---------------- */
const G=GLOSSARY.map(([t,d,alt],i)=>({t,d,i,forms:[t,...alt]}));
const FORMS=G.flatMap(g=>g.forms.map(f=>({f,g,cs:/^[A-Z0-9]+$/.test(f)}))).sort((a,b)=>b.f.length-a.f.length);
const TERM_RE=new RegExp('(?<![A-Za-z0-9-])('+FORMS.map(x=>x.f.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&')).join('|')+')(?![A-Za-z0-9])','gi');
const termOf=m=>{const lo=m.toLowerCase();return FORMS.find(x=>x.cs?x.f===m:x.f.toLowerCase()===lo);};
// text with up to `max` glossary terms turned into focusable buttons (first use of each)
function fillTerms(el,text,max=3){el.textContent='';let last=0,n=0;const used=new Set();
  for(const m of text.matchAll(TERM_RE)){const x=termOf(m[1]);if(!x||used.has(x.g.i))continue;if(n>=max)break;
    el.append(text.slice(last,m.index));const b=document.createElement('button');b.type='button';b.className='term';b.textContent=m[1];b.dataset.g=x.g.i;b.setAttribute('aria-describedby','tip');el.appendChild(b);
    last=m.index+m[1].length;n++;used.add(x.g.i);}
  el.append(text.slice(last));}
function listTerms(ul,items){ul.innerHTML='';items.forEach(s=>{const li=document.createElement('li');fillTerms(li,s,2);ul.appendChild(li);});}
const tip=$('tip');let tipFor=null;
function showTip(b){const g=G[+b.dataset.g];if(!g)return;tip.innerHTML='';const h=document.createElement('b');h.textContent=g.t;tip.append(h,g.d);tip.hidden=false;tipFor=b;
  const r=b.getBoundingClientRect(),w=Math.min(300,innerWidth-16),x=Math.min(Math.max(8,r.left),innerWidth-w-8);tip.style.left=x+'px';tip.style.top=(r.bottom+8)+'px';
  const th=tip.getBoundingClientRect().height;if(r.bottom+8+th>innerHeight-8)tip.style.top=Math.max(8,r.top-th-8)+'px';}
function hideTip(){tip.hidden=true;tipFor=null;}
const termAt=e=>e.target&&e.target.closest?e.target.closest('.term'):null;
document.addEventListener('mouseover',e=>{const b=termAt(e);if(b)showTip(b);});
document.addEventListener('mouseout',e=>{if(termAt(e))hideTip();});
document.addEventListener('focusin',e=>{const b=termAt(e);if(b)showTip(b);});
document.addEventListener('focusout',e=>{if(termAt(e))hideTip();});
document.addEventListener('click',e=>{const b=termAt(e);if(b){e.stopPropagation();if(tipFor===b)hideTip();else showTip(b);}else if(tipFor)hideTip();},true);
function buildGlossary(){const dl=$('glList');dl.innerHTML='';const uses=G.map(()=>new Set());
  chapters.forEach((c,ci)=>{const text=[c.title,...c.beats.map(b=>b[1]+' '+b[2]),...c.use,...c.cons].join(' ');for(const m of text.matchAll(TERM_RE)){const x=termOf(m[1]);if(x)uses[x.g.i].add(ci);}});
  G.slice().sort((a,b)=>a.t.localeCompare(b.t,undefined,{sensitivity:'base'})).forEach(g=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=g.t;dd.append(g.d);
    const used=[...uses[g.i]].sort((a,b)=>a-b).slice(0,6);
    if(used.length){const p=document.createElement('div');p.className='in';used.forEach(ci=>{const b=document.createElement('button');b.type='button';b.textContent=chapters[ci].title;b.onclick=()=>{closeGlossary();load(ci,true);};p.appendChild(b);});dd.appendChild(p);}
    dt.dataset.k=dd.dataset.k=[g.t,...g.forms,g.d].join(' ').toLowerCase();dl.append(dt,dd);});}
function filterGloss(q){q=q.trim().toLowerCase();Array.from($('glList').children).forEach(e=>{e.hidden=!!q&&!e.dataset.k.includes(q);});}
function openGlossary(){hideTip();if(!$('glList').children.length)buildGlossary();const d=$('glossary');if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}$('glFind').value='';filterGloss('');$('glFind').focus();}
function closeGlossary(){const d=$('glossary');if(d.close)d.close();else d.removeAttribute('open');}
$('glossBtn').onclick=openGlossary;$('glClose').onclick=closeGlossary;$('glFind').addEventListener('input',e=>filterGloss(e.target.value));

/* ---------------- progress export / import ---------------- */
const KNOWN=new Set(allIds().concat(chapters.map(c=>c.id)));
const ioMsg=s=>{$('ioMsg').textContent=s;};
function exportProgress(){const data={app:'packets-in-motion',version:1,exported:new Date().toISOString(),seen,stars,labBest:LAB_BEST};
  const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));a.download='packets-in-motion-progress.json';
  document.body.appendChild(a);a.click();a.remove();ioMsg('Progress saved to packets-in-motion-progress.json.');return data;}
// merges: a chapter stays watched, and each challenge keeps its best score
function importProgress(text){let d;try{d=JSON.parse(text);}catch(e){ioMsg('That file is not valid JSON.');return false;}
  if(!d||d.app!=='packets-in-motion'||typeof d.seen!=='object'||typeof d.stars!=='object'||!d.seen||!d.stars){ioMsg('That is not a Packets in Motion progress file.');return false;}
  let nSeen=0,nStars=0;
  Object.keys(d.seen).forEach(k=>{if(KNOWN.has(k)&&d.seen[k]&&!seen[k]){seen[k]=1;nSeen++;}});
  Object.entries(d.stars).forEach(([k,v])=>{const n=Math.round(+v);if(KNOWN.has(k)&&n>=0&&n<=3&&n>(stars[k]||0)){nStars+=n-(stars[k]||0);stars[k]=n;}});
  if(d.labBest&&typeof d.labBest==='object')Object.entries(d.labBest).forEach(([k,v])=>{const n=Math.round(+v);if(KNOWN.has(k)&&n>0&&(LAB_BEST[k]==null||n<LAB_BEST[k]))LAB_BEST[k]=n;});labSaveBest();
  store.set('sdve-seen',JSON.stringify(seen));store.set('pim-stars',JSON.stringify(stars));updProg();updStars();markToc();
  ioMsg(nSeen||nStars?`Imported ${nSeen} more chapter${nSeen===1?'':'s'} watched and ${nStars} more star${nStars===1?'':'s'}.`:'Nothing new in that file: you already have all of it.');return true;}
$('exportBtn').onclick=exportProgress;$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=e=>{const file=e.target.files&&e.target.files[0];if(!file)return;return file.text().then(importProgress).finally(()=>{e.target.value='';});};

/* ---------------- sound cues ---------------- */
function setSound(v){SFX.enable(v);$('soundBtn').setAttribute('aria-pressed',String(v));$('soundBtn').textContent='Sound cues: '+(v?'on':'off');store.set('pim-sound',v?'1':'0');}
$('soundBtn').onclick=()=>{setSound(!SFX.on);SFX.play('good');};

setSound(store.get('pim-sound')==='1');hideTip();
setCC(captions);setTranscript(store.get('pim-tr')==='1');setTheme(store.get('pim-theme')||(matchMedia('(prefers-contrast: more)').matches?'contrast':'dark'));updProg();updStars();
const startQ=quizFor(location.hash),start=startQ?firstOf(startQ):Math.max(0,chapters.findIndex(c=>'#'+c.id===location.hash));
load(start,!startQ);if(startQ)startQuiz(startQ);resize();if(portrait.matches)onOrient();requestAnimationFrame(frame);
})();
