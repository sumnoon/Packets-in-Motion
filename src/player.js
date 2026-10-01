/* ============================================================
   PLAYER / UI
   ============================================================ */
(function(){
const $=id=>document.getElementById(id);
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
let seen={};try{seen=JSON.parse(store.get('sdve-seen')||'{}')||{};}catch(e){seen={};}
let stars={};try{stars=JSON.parse(store.get('pim-stars')||'{}')||{};}catch(e){stars={};}
let mode='watch',inst=null,api=null,ct=0,pdown=null;
let cur=0,t=0,playing=false,speed=1,last=null,capIdx=-1,captions=store.get('sdve-cc')!=='0',K=1,dragging=false,wasPlaying=false;
const ICON_PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',ICON_PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

// sidebar
const toc=$('toc');let grp='';
chapters.forEach((c,i)=>{if(c.group!==grp){grp=c.group;const h=document.createElement('div');h.className='grp';h.textContent=grp;toc.appendChild(h);}
  const b=document.createElement('button');b.className='ch';b.dataset.i=i;b.innerHTML=`<span class="n">${i+1}</span><span>${c.title}</span>${CHAL[c.id]?'<span class="st"></span>':''}`;b.onclick=()=>{load(i,true);document.body.classList.remove('menu');};toc.appendChild(b);});
// screen readers get one clear name per chapter: number, title, watched, stars
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
  const k=beatIndex(c,t);if(k!==capIdx){capIdx=k;const el=$('capText');el.textContent=c.beats[k][2];el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');$('capStep').textContent=`${k+1}/${c.beats.length}`;
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
    btn.type='button';ts.className='ts';ts.textContent=fmt(b[0]);h.textContent=b[1];p.textContent=b[2];btn.append(ts,h,p);btn.onclick=()=>{seek(b[0]+.01);setPlaying(true);};li.appendChild(btn);ol.appendChild(li);});}
function markTranscript(k){Array.from($('trList').children).forEach((li,j)=>{const on=j===k,b=li.children[0];li.classList.toggle('now',on);if(on)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
function setTranscript(v){$('transcript').hidden=!v;$('trBtn').setAttribute('aria-expanded',String(v));$('trBtn').classList.toggle('on',v);store.set('pim-tr',v?'1':'0');}
function showCard(v,done){const card=$('card'),was=card.classList.contains('show');card.classList.toggle('show',v);card.classList.toggle('done',!!done);
  // move focus into the card when it opens, and back to its button when it closes
  if(v&&!was)setTimeout(()=>{const b=$(done?'cardNext':'cardClose');if(b)b.focus({preventScroll:true});},60);
  else if(!v&&was&&card.contains(document.activeElement))$('tradeBtn').focus({preventScroll:true});}
function seek(nt){const c=chapters[cur];t=clamp(nt,0,c.dur);if(t<c.dur)showCard(false);render();}
window.seek=seek;
function load(i,autoplay){if(mode==='play')exitChal(true);hideResult();cur=(i+chapters.length)%chapters.length;const c=chapters[cur];t=0;capIdx=-1;showCard(false);
  $('eyebrow').textContent=`${c.group} · Chapter ${cur+1} of ${chapters.length}`;$('title').textContent=c.title;document.title=c.title+' · Packets in Motion';
  $('chalBtn').hidden=!CHAL[c.id];$('cardChal').hidden=!CHAL[c.id];
  $('cardTitle').textContent=c.title;buildTranscript(c);annTitle=true;$('useList').innerHTML=c.use.map(s=>`<li>${s}</li>`).join('');$('conList').innerHTML=c.cons.map(s=>`<li>${s}</li>`).join('');
  $('ticks').innerHTML=c.beats.slice(1).map(b=>`<b style="left:${b[0]/c.dur*100}%"></b>`).join('');
  document.querySelectorAll('.ch').forEach(b=>{const j=+b.dataset.i;b.classList.toggle('on',j===cur);b.classList.toggle('seen',!!seen[chapters[j].id]);if(j===cur)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');tocLabel(b);});
  const on=document.querySelector('.ch.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});
  $('nextBtn').disabled=false;$('cardNext').textContent=cur===chapters.length-1?'Back to chapter 1 →':'Next chapter →';
  if(location.hash!=='#'+c.id)history.replaceState(null,'','#'+c.id);
  setPlaying(!!autoplay);render();}
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
function startChal(){const c=chapters[cur],d=CHAL[c.id];if(!d)return;setPlaying(false);showCard(false);hideResult();mode='play';document.body.classList.add('play');
  $('cTitle').textContent=d.title;$('cGoal').textContent=d.goal;$('cHint').hidden=true;$('cHint').textContent='Hint: '+d.hint;$('cStatus').textContent='';
  FX.clear();ct=0;api=makeApi();inst=d.make(api);$('chalBtn').setAttribute('aria-pressed','true');$('chalBtn').textContent='★ Challenge (on)';cv.setAttribute('aria-label',`Challenge: ${d.title}. ${d.goal}`);render();}
function exitChal(quiet){mode='watch';capIdx=-1;inst=null;document.body.classList.remove('play');hideResult();FX.clear();$('chalBtn').setAttribute('aria-pressed','false');$('chalBtn').textContent='★ Challenge';if(!quiet)render();}
function showResult(st,title,msg){const c=chapters[cur];if(st>(stars[c.id]||0)){stars[c.id]=st;store.set('pim-stars',JSON.stringify(stars));updStars();}
  const all=Object.keys(CHAL).every(id=>stars[id]===3);
  $('resStars').innerHTML=[0,1,2].map(i=>`<i class="${i<st?'on':''}" style="--i:${i}">★</i>`).join('');$('resTitle').textContent=title;
  $('resMsg').textContent=msg+(all&&st===3?' That was the last star: you have mastered every challenge in the course!':'');
  $('resNext').textContent=cur===chapters.length-1?'Back to lesson 1 →':'Next lesson →';$('result').classList.add('show');if(st===3)FX.burst(W/2,H/2,C.amber,50,300);
  setTimeout(()=>{const b=$(st?'resNext':'resRetry');if(b)b.focus({preventScroll:true});},60);}
function hideResult(){$('result').classList.remove('show');}
function updStars(){let n=0;document.querySelectorAll('.ch').forEach(b=>{const id=chapters[+b.dataset.i].id,s=b.querySelector('.st');if(!s)return;const k=stars[id]||0;n+=k;s.textContent='★'.repeat(k)+'☆'.repeat(3-k);s.classList.toggle('got',k>0);s.setAttribute('aria-hidden','true');tocLabel(b);});
  $('starTotal').textContent=`★ ${n} / ${Object.keys(CHAL).length*3} stars`;}
const toWorld=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
cv.addEventListener('pointerdown',e=>{if(mode!=='play'||!inst)return;const[x,y]=toWorld(e);pdown={x,y};try{cv.setPointerCapture(e.pointerId);}catch(_){}if(inst.down)inst.down(x,y,ct);});
cv.addEventListener('pointermove',e=>{if(mode!=='play'||!inst)return;const[x,y]=toWorld(e);if(inst.move)inst.move(x,y,ct);});
cv.addEventListener('pointerup',e=>{if(mode!=='play'||!inst)return;const[x,y]=toWorld(e);if(inst.up)inst.up(x,y,ct);if(pdown&&Math.hypot(x-pdown.x,y-pdown.y)<8&&inst.click)inst.click(x,y,ct);pdown=null;});
$('chalBtn').onclick=()=>{if(mode==='play')exitChal();else startChal();};
$('cardChal').onclick=startChal;$('cRestart').onclick=startChal;$('cBack').onclick=()=>exitChal();
$('cHintBtn').onclick=()=>{$('cHint').hidden=!$('cHint').hidden;};
$('resRetry').onclick=startChal;$('resWatch').onclick=()=>{exitChal();seek(0);setPlaying(true);};$('resNext').onclick=()=>load(cur+1,true);

function setCC(v){captions=v;$('caption').classList.toggle('hide',!v);$('ccBtn').classList.toggle('on',v);$('ccBtn').setAttribute('aria-pressed',String(v));store.set('sdve-cc',v?'1':'0');}
$('ccBtn').onclick=()=>setCC(!captions);
$('trBtn').onclick=()=>setTranscript($('transcript').hidden);
// themes: the page chrome follows the theme; high contrast also brightens the stage
const BASE={...C},HC={text:'#ffffff',dim:'#c6cddb',faint:'#98a2b6',edge:'#7f8fb2',line:'#4b5a7c',bg:'#000000'};
function setTheme(v){if(!['dark','light','contrast'].includes(v))v='dark';document.documentElement.setAttribute('data-theme',v);Object.assign(C,BASE,v==='contrast'?HC:{});$('theme').value=v;render();}
$('theme').onchange=e=>{store.set('pim-theme',e.target.value);setTheme(e.target.value);};
$('menuBtn').onclick=()=>document.body.classList.toggle('menu');
$('scrim').onclick=()=>document.body.classList.remove('menu');
window.addEventListener('keydown',e=>{if(e.target.tagName==='SELECT'||e.target.tagName==='INPUT'&&e.key!==' ')return;const c=chapters[cur];
  if(mode!=='play'&&(e.target.tagName==='BUTTON'||e.target.tagName==='A')&&(e.key===' '||e.key==='Enter'))return;   // the focused control handles it
  if(mode==='play'){if(e.key==='Escape'){if($('result').classList.contains('show'))hideResult();else exitChal();}
    else if(e.key===']')load(cur+1,true);else if(e.key==='[')load(cur-1,true);
    else if(!(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))&&inst&&inst.key){if(e.key===' ')e.preventDefault();inst.key(e.key,ct);}
    return;}
  if(e.key==='p'||e.key==='P'){startChal();return;}
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
window.addEventListener('hashchange',()=>{const i=chapters.findIndex(c=>'#'+c.id===location.hash);if(i>=0&&i!==cur)load(i,true);});
// fullscreen + landscape lock (lock works on Android; iOS relies on the rotate prompt)
const fsOK=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function goFull(){const el=document.documentElement,req=el.requestFullscreen||el.webkitRequestFullscreen;
  const inFs=document.fullscreenElement||document.webkitFullscreenElement;
  if(inFs){(document.exitFullscreen||document.webkitExitFullscreen).call(document);try{screen.orientation.unlock();}catch(e){}return;}
  if(!req)return;Promise.resolve(req.call(el)).then(()=>{try{return screen.orientation.lock('landscape');}catch(e){}}).catch(()=>{});}
if(!fsOK){$('fsBtn').style.display='none';$('rotateFs').style.display='none';}
$('fsBtn').onclick=goFull;$('rotateFs').onclick=goFull;
window.addEventListener('keydown',e=>{if((e.key==='f'||e.key==='F')&&fsOK&&e.target.tagName!=='INPUT'&&mode!=='play')goFull();});
// pause while the portrait prompt covers the stage; resume when turned back
const portrait=window.matchMedia('(orientation:portrait) and (pointer:coarse) and (max-width:600px)');let resumeOnTurn=false;
function onOrient(){if(portrait.matches){resumeOnTurn=playing;if(playing)setPlaying(false);}else if(resumeOnTurn){resumeOnTurn=false;last=null;setPlaying(true);}resize();}
if(portrait.addEventListener)portrait.addEventListener('change',onOrient);else if(portrait.addListener)portrait.addListener(onOrient);
setCC(captions);setTranscript(store.get('pim-tr')==='1');setTheme(store.get('pim-theme')||(matchMedia('(prefers-contrast: more)').matches?'contrast':'dark'));updProg();updStars();
const start=Math.max(0,chapters.findIndex(c=>'#'+c.id===location.hash));
load(start,true);resize();if(portrait.matches)onOrient();requestAnimationFrame(frame);
})();
