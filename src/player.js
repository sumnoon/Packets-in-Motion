/* ============================================================
   PLAYER / UI
   ============================================================ */
(function(){
const $=id=>document.getElementById(id);
const store=PIM_STORE;
const initialHash=location.hash,hubNames={home:'Home',map:'Learning map',intro:'Introduction',missions:'Engineering missions'};
let hub=null,journey=null,tourAt=-1;   // tourAt: the first-visit tour's step, -1 when closed
labRestore();
let seen=pimSeen(store.json('sdve-seen',{}));
let stars=pimStars(store.json('pim-stars',{}));
let mode='watch',inst=null,api=null,ct=0,pdown=null,quizG=null;   // quizG: the section whose quiz is running
let challengeToken=0;
let renderFault=null,challengeReady=false,challengePaused=false;
let practiceTimed=store.get('pim-practice-timed')!=='0';
let shortcuts=store.get('pim-shortcuts')!=='0',diagramEditing=!matchMedia('(pointer:coarse)').matches;
const resumeRecord=pimResume(store.json('pim-resume',null));let restoring=true,loaded=false,checkpoint=-1;
let cur=0,t=0,playing=false,speed=pimSpeed(store.get('pim-speed')),last=null,capIdx=-1,captions=store.get('sdve-cc')!=='0',K=1,dragging=false,wasPlaying=false;
const ICON_PLAY='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',ICON_PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';

// sidebar
const toc=$('toc');let grp='';
const addQuiz=gname=>{if(!QUIZ[gname])return;const b=document.createElement('button');b.className='qz';b.dataset.q=gname;b.innerHTML='<span class="n" aria-hidden="true">✎</span><span>Section quiz</span><span class="st" aria-hidden="true"></span>';b.onclick=()=>{setMenu(false);startQuiz(gname);};toc.appendChild(b);};
chapters.forEach((c,i)=>{if(c.group!==grp){if(grp)addQuiz(grp);grp=c.group;const h=document.createElement('div');h.className='grp';h.dataset.g=grp;h.textContent=grp;toc.appendChild(h);}
  const b=document.createElement('button');b.className='ch';b.dataset.i=i;b.innerHTML=`<span class="n">${i+1}</span><span>${c.title}</span>${CHAL[c.id]?'<span class="st"></span>':''}`;b.onclick=()=>{setMenu(false);load(i,true);};toc.appendChild(b);});
// screen readers get one clear name per chapter: number, title, watched, stars
addQuiz(grp);
function qzLabel(b){const q=QUIZ[b.dataset.q],k=stars[q.id]||0;b.setAttribute('aria-label',`${q.title}, ${k} of 3 stars`);}
function tocLabel(b){const j=+b.dataset.i,c=chapters[j],k=stars[c.id]||0;b.setAttribute('aria-label',`${j+1}. ${c.title}${seen[c.id]?', completed':''}${CHAL[c.id]?`, ${k} of 3 stars`:''}`);}

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

function clearRenderFault(){if(renderFault)cv.width=cv.width;renderFault=null;$('renderError').hidden=true;cv.hidden=false;}
function failRender(e){if(renderFault)return;renderFault={mode,id:quizG?QUIZ[quizG].id:chapters[cur].id,time:mode==='play'?ct:t};
  console.error('Stage failed',renderFault,e);setPlaying(false);if(api)api.dispose();pdown=null;cv.hidden=true;
  $('renderError').hidden=false;$('renderErrorText').textContent=mode==='play'?'This challenge could not be drawn. Your saved design is available when you retry. No result was awarded.':'This animation could not be drawn. You can still read every step in the transcript.';
  if(mode==='watch')setTranscript(true);announce($('renderErrorText').textContent);}
function blocked(){return !!hub||tourAt>=0||document.hidden||document.body.classList.contains('menu')||['glossary','card','result','settings','missionHelp'].some(id=>$(id).open);}
function render(){if(renderFault)return;if(mode==='play'){renderChal(0);return;}const c=chapters[cur];
  try{g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;drawBackground();c.draw(t);
    g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;drawBeatTitle(c,t);}catch(e){failRender(e);}
  // UI sync
  const p=t/c.dur*100;$('scrub').value=Math.round(t/c.dur*1000);$('scrub').style.setProperty('--p',p+'%');
  $('time').textContent=fmt(t)+' / '+fmt(c.dur);
  const k=beatIndex(c,t);if(k!==capIdx){if(playing&&capIdx>=0)SFX.play('beat');capIdx=k;const el=$('capText');fillTerms(el,c.beats[k][2]);el.classList.remove('fade');void el.offsetWidth;el.classList.add('fade');$('capStep').textContent=`${k+1}/${c.beats.length}`;
    const b=c.beats[k],step=`Step ${k+1} of ${c.beats.length}: ${b[1]}`;cv.setAttribute('aria-label',`${c.title}. ${step}`);
    announce((annTitle?c.title+'. ':'')+step+'. '+b[2]);annTitle=false;markTranscript(k);}
  $('scrub').setAttribute('aria-valuetext',`${fmt(t)} of ${fmt(c.dur)}. Step ${k+1} of ${c.beats.length}: ${c.beats[k][1]}`);
  $('stepPrev').disabled=k===0;$('stepNext').disabled=k===c.beats.length-1;
}
function setPlaying(v){playing=v;$('playBtn').innerHTML=v?ICON_PAUSE:ICON_PLAY;$('playBtn').title=v?'Pause (Space)':'Play (Space)';$('playBtn').setAttribute('aria-label',v?'Pause':'Play');}
// the canvas is silent, so each step is read out (debounced, so scrubbing does not flood the queue)
let liveT=0,annTitle=false;
function announce(s){clearTimeout(liveT);liveT=setTimeout(()=>{$('srLive').textContent=s;},350);}
// transcript: every step as text; activating one jumps there
function buildTranscript(c){const ol=$('trList');ol.innerHTML='';
  c.beats.forEach((b,k)=>{const li=document.createElement('li'),btn=document.createElement('button'),ts=document.createElement('span'),h=document.createElement('b'),p=document.createElement('p');
    btn.type='button';btn.className='tr-step';ts.className='ts';ts.textContent=fmt(b[0]);h.textContent=b[1];p.className='tr-copy';fillTerms(p,b[2],2);btn.append(ts,h);btn.onclick=()=>{seek(b[0]+.01);setPlaying(true);};li.append(btn,p);ol.appendChild(li);});}
function markTranscript(k){Array.from($('trList').children).forEach((li,j)=>{const on=j===k,b=li.children[0];li.classList.toggle('now',on);if(on)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});}
function setTranscript(v){$('transcript').hidden=!v;$('trBtn').setAttribute('aria-expanded',String(v));$('trBtn').classList.toggle('on',v);store.set('pim-tr',v?'1':'0');}
function openDialog(id,focusId){const d=$(id);if(d.open)return;d.hidden=false;d.classList.add('show');d.showModal();$(focusId).focus({preventScroll:true});}
function closeDialog(id){const d=$(id);if(d.open)d.close();d.classList.remove('show');d.hidden=true;hideTip();}
function showCard(v,done){$('card').classList.toggle('done',!!done);if(v)openDialog('card',done?'cardNext':'cardClose');else closeDialog('card');}
$('card').addEventListener('cancel',e=>{e.preventDefault();showCard(false);});
$('result').addEventListener('cancel',e=>{e.preventDefault();hideResult();});
function routeState(){return {pim:1,chapter:chapters[cur].id,quiz:quizG,challenge:mode==='play',time:t};}
function saveRoute(){if(loaded&&!restoring&&!hub)history.replaceState(routeState(),'');}
function rememberLesson(){if(!loaded||quizG||hub)return;store.put('pim-resume',{version:1,chapter:chapters[cur].id,time:t,speed});saveRoute();checkpoint=t;}
function syncCompletion(){const done=!!seen[chapters[cur].id];['completeBtn','cardComplete'].forEach(id=>{$(id).textContent=done?'Lesson completed':'Mark lesson complete';$(id).disabled=done;});}
function seek(nt){const c=chapters[cur];t=clamp(nt,0,c.dur);if(t<c.dur)showCard(false);render();rememberLesson();}
window.seek=seek;
function load(i,autoplay){rememberLesson();hub=null;$('journey').hidden=true;$('lessonView').hidden=false;syncHubNav();if(loaded)$('resume').hidden=true;if(mode==='play')exitChal(true);hideResult();showCard(false);clearRenderFault();cur=(i+chapters.length)%chapters.length;const c=chapters[cur];t=0;capIdx=-1;checkpoint=-1;loaded=true;$('main').scrollTop=0;
  heading();$('cardChal').hidden=!CHAL[c.id];
  $('cardTitle').textContent=c.title;buildTranscript(c);annTitle=true;listTerms($('useList'),c.use);listTerms($('conList'),c.cons);cardLinks(c);
  $('ticks').innerHTML=c.beats.slice(1).map(b=>`<b style="left:${b[0]/c.dur*100}%"></b>`).join('');
  markToc();
  $('nextBtn').disabled=false;$('cardNext').textContent=cur===chapters.length-1?'Back to chapter 1 →':'Next chapter →';
  $('learningStatus').textContent='';syncCompletion();setPlaying(!!autoplay);last=null;resize();}
// title, eyebrow, tab title and URL for the current chapter (or the running quiz)
function heading(){const c=chapters[cur],q=quizG&&QUIZ[quizG];
  $('eyebrow').textContent=q?`${q.group} · Section quiz`:`${c.group} · Chapter ${cur+1} of ${chapters.length}`;$('title').textContent=q?q.title:c.title;
  document.title=(q?q.title:c.title)+' · Packets in Motion';$('chalBtn').hidden=!!q||!CHAL[c.id];
  const h='#'+(q?q.id:c.id);if(location.hash!==h)history[restoring?'replaceState':'pushState'](routeState(),'',h);else if(!restoring)saveRoute();}
// sidebar state: the current chapter (or quiz), watched marks, names for screen readers
function markToc(){document.querySelectorAll('.ch').forEach(b=>{const j=+b.dataset.i,on=!hub&&!quizG&&j===cur;b.classList.toggle('on',on);b.classList.toggle('seen',!!seen[chapters[j].id]);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');tocLabel(b);});
  document.querySelectorAll('.qz').forEach(b=>{const on=!hub&&b.dataset.q===quizG;b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');qzLabel(b);});
  const on=document.querySelector(quizG?'.qz.on':'.ch.on');if(on&&on.scrollIntoView)on.scrollIntoView({block:'nearest'});}
// "Before this" and "Related" chapter links on the trade-offs card
function cardLinks(c){const box=$('cardLinks');box.innerHTML='';
  [['Before this',c.needs],['Related',c.related]].forEach(([label,ids])=>{const list=(ids||[]).map(id=>chapters.findIndex(x=>x.id===id)).filter(i=>i>=0&&i!==cur);if(!list.length)return;
    const span=document.createElement('span'),b=document.createElement('b');b.textContent=label+':';span.appendChild(b);
    list.forEach(i=>{const btn=document.createElement('button');btn.type='button';btn.textContent=chapters[i].title;btn.onclick=()=>load(i,true);span.appendChild(btn);});box.appendChild(span);});}
function completeLesson(){const c=chapters[cur];seen[c.id]=1;store.set('sdve-seen',JSON.stringify(seen));markToc();updProg();syncCompletion();$('learningStatus').textContent='Lesson marked complete. Challenge stars record your practice separately.';}
function finish(){rememberLesson();showCard(true,true);}
function updProg(){$('progBar').style.width=(Object.keys(seen).filter(k=>chapters.some(c=>c.id===k)).length/chapters.length*100)+'%';}
function frame(ts){if(last==null)last=ts;const dt=Math.min(.06,(ts-last)/1000);last=ts;
  if(mode==='play'){if(challengeReady&&!challengePaused&&!blocked()&&!renderFault){ct+=dt;try{if(inst&&inst.update)inst.update(ct,dt);renderChal(dt);if(!renderFault&&api)api.tick();}catch(e){failRender(e);}}}
  else if(playing&&!dragging&&!blocked()&&!renderFault){const c=chapters[cur];t+=dt*speed;if(t>=c.dur){t=c.dur;setPlaying(false);finish();}render();if(Math.abs(t-checkpoint)>=2)rememberLesson();}
  requestAnimationFrame(frame);}

// controls
$('playBtn').onclick=()=>{const c=chapters[cur];if(!playing&&t>=c.dur)seek(0);showCard(false);setPlaying(!playing);rememberLesson();};
$('completeBtn').onclick=completeLesson;$('cardComplete').onclick=completeLesson;
$('replayBtn').onclick=()=>{seek(0);setPlaying(true);};
$('cardReplay').onclick=()=>{seek(0);setPlaying(true);};
$('cardClose').onclick=()=>showCard(false);
$('cardNext').onclick=()=>load(cur+1,true);
$('prevBtn').onclick=()=>load(cur-1,true);
$('nextBtn').onclick=()=>load(cur+1,true);
$('tradeBtn').onclick=()=>{const v=!$('card').classList.contains('show');if(v)setPlaying(false);showCard(v);};
$('stepPrev').onclick=()=>{const c=chapters[cur];seek(c.beats[Math.max(0,beatIndex(c,t)-1)][0]+.01);};
$('stepNext').onclick=()=>{const c=chapters[cur];seek(c.beats[Math.min(c.beats.length-1,beatIndex(c,t)+1)][0]+.01);};
$('speed').onchange=e=>{speed=pimSpeed(e.target.value);store.set('pim-speed',String(speed));rememberLesson();};
const sc=$('scrub');
sc.addEventListener('pointerdown',()=>{dragging=true;wasPlaying=playing;});
sc.addEventListener('input',()=>{seek(sc.value/1000*chapters[cur].dur);});
const endDrag=()=>{if(dragging){dragging=false;last=null;}};
sc.addEventListener('pointercancel',endDrag);sc.addEventListener('lostpointercapture',endDrag);sc.addEventListener('pointerup',endDrag);sc.addEventListener('change',endDrag);window.addEventListener('pointerup',endDrag);
cv.addEventListener('click',()=>{cv.focus();if(mode!=='play')$('playBtn').click();});
/* ---------------- challenge mode ---------------- */
function renderChal(dt){if(renderFault)return;try{g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;drawVoid(ct);if(inst)inst.draw(ct,dt);g.setTransform(K,0,0,K,0,0);g.globalAlpha=1;FX.step(dt);}catch(e){failRender(e);}}
function beginChallenge(){if(renderFault||challengePaused||blocked())return false;last=null;challengeReady=true;$('cStart').hidden=true;$('cPause').hidden=false;$('cTiming').disabled=true;return true;}
function challengeInput(){return !renderFault&&!challengePaused&&!blocked()&&(challengeReady||beginChallenge());}
$('cStart').onclick=beginChallenge;
$('cPause').onclick=()=>{last=null;cancelPointer();challengePaused=!challengePaused;$('cPause').textContent=challengePaused?'Resume challenge':'Pause challenge';$('cPause').setAttribute('aria-pressed',String(challengePaused));};
$('cTiming').onchange=e=>{practiceTimed=e.target.value==='timed';store.set('pim-practice-timed',practiceTimed?'1':'0');startChal(quizG);};
$('renderRetry').onclick=()=>{if(mode==='play'){startChal(quizG);return;}clearRenderFault();resize();};
$('renderRead').onclick=()=>{if(mode==='play')exitChal();setTranscript(true);$('trTitle').focus();};
function makeApi(){const ctl=$('cCtl'),run=$('cRun'),els=[],timers=new Set(),token=challengeToken,id=quizG?QUIZ[quizG].id:chapters[cur].id;let shareBox=null;
  let disposed=false,metricAt=-1;const active=()=>!disposed&&token===challengeToken&&mode==='play';ctl.innerHTML='';run.innerHTML='';$('cAccessible').innerHTML='';$('cReadout').innerHTML='';$('cReadout').hidden=true;
  const field=(label,node)=>{const d=document.createElement('div');d.className='ctl';const s=document.createElement('span');s.textContent=label;d.append(s,node);ctl.appendChild(d);return d;};
  return{now:()=>ct,timed:()=>practiceTimed,canInput:()=>active()&&challengeInput(),
    lesson(id){if(active()){const i=chapters.findIndex(c=>c.id===id);if(i>=0)load(i,false);}},
    summary(h){if(!active())return;let d=document.getElementById('labSummary');if(!d||!d.parentNode){d=d||document.createElement('div');d.id='labSummary';d.className='lab-summary';d.setAttribute('aria-label','Lab design summary');$('cAccessible').prepend(d);}d.innerHTML=h;},
    targetRadius:()=>Math.max(12,22/(cv.getBoundingClientRect().width/W)),
    surface(title){const d=document.createElement('details'),s=document.createElement('summary'),f=document.createElement('fieldset');s.textContent=title;d.append(s,f);$('cAccessible').appendChild(d);return f;},
    metrics(rows,force=false){if(!active()||!force&&ct-metricAt<1)return;metricAt=ct;const dl=$('cReadout');dl.hidden=false;
      if(dl.children.length!==rows.length||rows.some(([name],i)=>dl.children[i].children[0].textContent!==name)){dl.textContent='';rows.forEach(([name])=>{const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=name;d.append(dt,dd);dl.appendChild(d);});}
      rows.forEach(([,value],i)=>{const dd=dl.children[i].children[1],text=String(value);if(dd.textContent!==text)dd.textContent=text;});},
    status(h){if(active())$('cStatus').innerHTML=h;},
    later(fn,ms){const timer={at:ct+ms/1000,fn};if(active())timers.add(timer);return timer;},
    tick(){for(const timer of [...timers]){if(!active()||blocked())break;if(ct>=timer.at){timers.delete(timer);timer.fn();}}},
    dispose(){disposed=true;timers.clear();if(shareBox)shareBox.remove();},
    clearShareLink(){if(shareBox)shareBox.hidden=true;},
    shareLink(url){if(!active())return;let box=shareBox;if(!box){box=shareBox=document.createElement('div');box.id='shareLink';box.className='share-link';$('cpanel').appendChild(box);}
      box.hidden=false;box.textContent='';const label=document.createElement('label'),input=document.createElement('input');label.textContent='Share this design';input.type='url';input.readOnly=true;input.value=url;input.setAttribute('aria-label','Share this design link');label.appendChild(input);box.appendChild(label);},
    button(label,fn,o={}){const b=document.createElement('button');b.type='button';b.className='btn'+(o.primary?' pri':'');b.textContent=label;b.onclick=()=>{if(active()&&challengeInput())fn();};if(o.toolbar)$('labActions').insertBefore(b,$('cHintBtn'));else run.appendChild(b);els.push(b);return b;},
    slider(label,min,max,step,val,fmt,fn){const i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=val;i.setAttribute('aria-label',label);const o=document.createElement('output');o.textContent=fmt(val);
      i.oninput=()=>{o.textContent=fmt(+i.value);fn(+i.value);};field(label,i).appendChild(o);els.push(i);return i;},
    seg(label,opts,val,fn){const box=document.createElement('div');box.className='seg';box.setAttribute('role','group');box.setAttribute('aria-label',label);
      opts.forEach(([v,txt])=>{const b=document.createElement('button');b.type='button';b.textContent=txt;b.setAttribute('aria-pressed',String(v===val));b.onclick=()=>{box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));fn(v);};box.appendChild(b);els.push(b);});field(label,box);return box;},
    toggle(label,val,fn){const b=document.createElement('button');b.type='button';b.className='tog';b.textContent=label;b.setAttribute('aria-pressed',String(val));b.onclick=()=>{const v=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(v));fn(v);};ctl.appendChild(b);els.push(b);return b;},
    lock(v){if(active())els.forEach(e=>e.disabled=v);},
    win(st,title,msg){if(active())showResult(st,title,msg,id,token);}};}
function disposeChallenge(){cancelPointer();challengeToken++;if(api&&api.dispose)api.dispose();if(inst&&inst.dispose)inst.dispose();inst=null;api=null;pdown=null;}
function startQuiz(gname){if(!QUIZ[gname])return;startChal(gname);}
function labLayout(v){const hint=$('cHintBtn');$('cpanel').querySelector('.cbar').appendChild(hint);$('labIntro').hidden=!v;$('labActions').hidden=!v;$('labActions').innerHTML='';(v?$('labIntro'):$('cpanel')).prepend($('cBrief'));if(v)$('labActions').appendChild(hint);}
function startChal(gname){const c=chapters[cur],d=gname?QUIZ[gname]:CHAL[c.id];if(!d)return;rememberLesson();hub=null;$('journey').hidden=true;$('lessonView').hidden=false;$('resume').hidden=true;syncHubNav();disposeChallenge();quizG=gname||null;setPlaying(false);showCard(false);hideResult();clearRenderFault();mode='play';document.body.classList.add('play');labLayout(!!LAB_DEFS[c.id]&&!gname);
  $('diagramEdit').hidden=false;syncDiagramEditing();
  challengeReady=!!LAB_DEFS[c.id]&&!gname;challengePaused=false;$('cStart').hidden=challengeReady;$('cPause').hidden=!challengeReady;$('cPause').textContent='Pause challenge';$('cPause').setAttribute('aria-pressed','false');
  $('cTimingLabel').hidden=!d.timed;$('cTiming').value=practiceTimed?'timed':'untimed';$('cTiming').disabled=false;
  $('cTitle').textContent=d.title;$('cGoal').textContent=!practiceTimed&&d.untimedGoal?d.untimedGoal:d.goal;$('cHint').hidden=true;$('cHint').textContent='Hint: '+d.hint;$('cStatus').textContent='';
  FX.clear();ct=0;api=makeApi();try{inst=d.make(api);}catch(e){failRender(e);}$('cHintBtn').textContent=inst&&inst.hintLabel?inst.hintLabel():'Hint';$('chalBtn').setAttribute('aria-pressed','true');$('chalBtn').textContent='★ Challenge (on)';cv.setAttribute('aria-label',`${quizG?'Quiz':'Challenge'}: ${d.title}. ${d.goal}`);
  $('cTag').textContent=quizG?'Quiz':'Challenge';$('cBack').textContent=quizG?'Back to the lessons':'Back to lesson';heading();markToc();resize();}
function exitChal(quiet){disposeChallenge();labLayout(false);clearRenderFault();$('diagramEdit').hidden=true;const wasQuiz=quizG;quizG=null;mode='watch';if(wasQuiz&&!quiet){heading();markToc();}capIdx=-1;document.body.classList.remove('play');hideResult();FX.clear();$('chalBtn').setAttribute('aria-pressed','false');$('chalBtn').textContent='★ Challenge';if(!quiet){saveRoute();render();}}
function showResult(st,title,msg,id,token){if(!Number.isInteger(st)||st<0||st>3)return;const c=chapters[cur];if(st>(stars[id]||0)){stars[id]=st;store.set('pim-stars',JSON.stringify(stars));updStars();markToc();}
  const all=allIds().every(id=>stars[id]===3);SFX.play('win',st);
  $('resStars').innerHTML=[0,1,2].map(i=>`<i class="${i<st?'on':''}" style="--i:${i}">★</i>`).join('');$('resTitle').textContent=title;
  $('resMsg').textContent=msg+(all&&st===3?' That was the last star: you have mastered every challenge in the course!':'');
  $('resNext').textContent=quizG?'Next section →':cur===chapters.length-1?'Back to lesson 1 →':'Next lesson →';$('resWatch').textContent=quizG?'Back to the lessons':'Watch the lesson';openDialog('result',st?'resNext':'resRetry');if(st===3)FX.burst(W/2,H/2,C.amber,50,300);}
function hideResult(){closeDialog('result');}
const allIds=()=>[...Object.keys(CHAL),...Object.values(QUIZ).map(q=>q.id)];
// the first chapter of the section after a quiz's section
const afterQuiz=gname=>{let i=-1;chapters.forEach((c,j)=>{if(c.group===gname)i=j;});return i+1;};
const firstOf=gname=>Math.max(0,chapters.findIndex(c=>c.group===gname));
function updStars(){let n=0;document.querySelectorAll('.qz').forEach(b=>{const k=stars[QUIZ[b.dataset.q].id]||0,s=b.querySelector('.st');n+=k;if(s){s.textContent='★'.repeat(k)+'☆'.repeat(3-k);s.classList.toggle('got',k>0);}});document.querySelectorAll('.ch').forEach(b=>{const id=chapters[+b.dataset.i].id,s=b.querySelector('.st'),k=CHAL[id]?stars[id]||0:0;n+=k;if(!s)return;s.textContent='★'.repeat(k)+'☆'.repeat(3-k);s.classList.toggle('got',k>0);s.setAttribute('aria-hidden','true');tocLabel(b);});
  $('starTotal').textContent=`★ ${n} / ${allIds().length*3} stars`;}
const toWorld=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
cv.addEventListener('pointerdown',e=>{if(mode!=='play'||!inst||!diagramEditing||pdown||!challengeInput())return;cv.focus();const[x,y]=toWorld(e);pdown={x,y,id:e.pointerId};try{cv.setPointerCapture(e.pointerId);}catch(_){}if(inst.down)inst.down(x,y,ct);});
cv.addEventListener('pointermove',e=>{if(mode!=='play'||!inst||!diagramEditing||!challengeReady||challengePaused||blocked()||renderFault||pdown&&e.pointerId!==pdown.id)return;const[x,y]=toWorld(e);if(inst.move)inst.move(x,y,ct);});
cv.addEventListener('pointerup',e=>{if(!pdown||e.pointerId!==pdown.id)return;if(mode!=='play'||!inst||!challengeInput()){cancelPointer();return;}const[x,y]=toWorld(e);if(inst.up)inst.up(x,y,ct);if(pdown&&Math.hypot(x-pdown.x,y-pdown.y)<8&&inst.click)inst.click(x,y,ct);pdown=null;});
function cancelPointer(){const held=pdown;pdown=null;if(inst&&inst.cancel)inst.cancel();if(held)try{cv.releasePointerCapture(held.id);}catch(_){} }
cv.addEventListener('pointercancel',cancelPointer);cv.addEventListener('lostpointercapture',cancelPointer);
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
const narrow=window.matchMedia('(max-width:900px)');
function setMenu(v){if(v)cancelPointer();const open=!!v&&narrow.matches;document.body.classList.toggle('menu',open);$('menuBtn').setAttribute('aria-expanded',String(open));
  $('side').inert=narrow.matches&&!open;$('main').inert=open;$('side').setAttribute('aria-hidden',String(narrow.matches&&!open));
  if(open)$('find').focus();else if(narrow.matches)$('menuBtn').focus();}
$('menuBtn').onclick=()=>setMenu(!document.body.classList.contains('menu'));
$('menuClose').onclick=()=>setMenu(false);$('scrim').onclick=()=>setMenu(false);
if(narrow.addEventListener)narrow.addEventListener('change',()=>setMenu(false));
setMenu(false);
window.addEventListener('keydown',e=>{if(tourAt>=0){tourKey(e);return;}const dialog=[$('glossary'),$('card'),$('result'),$('settings'),$('missionHelp')].find(d=>d.open);if(dialog){if(e.key==='Tab'){const items=[...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')].filter(b=>!b.disabled&&b.tabIndex!==-1&&!b.hidden&&(!b.getClientRects||b.getClientRects().length));const first=items[0],end=items[items.length-1];if(first&&(!dialog.contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===end)){e.preventDefault();(e.shiftKey?end:first).focus();}}return;}if(e.key==='Escape'&&!tip.hidden){hideTip();return;}
  if((e.ctrlKey||e.metaKey||e.altKey)&&document.body.classList.contains('menu'))return;
  if(document.body.classList.contains('menu')){if(e.key==='Escape'){e.preventDefault();setMenu(false);}else if(e.key==='Tab'){
    const items=[...$('side').querySelectorAll('button,input,select,a[href]')].filter(b=>!b.disabled&&!b.closest('[hidden]'));
    const first=items[0],end=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();end.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first.focus();}}
    return;}
  if(e.target.isContentEditable||['SELECT','TEXTAREA','INPUT'].includes(e.target.tagName))return;
  if(e.target===$('stage')&&$('stage').classList.contains('readable')&&/^(?:Arrow(?:Left|Right|Up|Down)|PageUp|PageDown|Home|End| )$/.test(e.key))return;
  if(!$('main').contains(e.target))return;
  if(e.ctrlKey||e.metaKey||e.altKey){if(mode==='play'&&e.target===cv&&(e.ctrlKey||e.metaKey)&&!e.altKey&&e.key.toLowerCase()==='z'&&inst&&inst.key&&challengeInput()){e.preventDefault();inst.key(e.key,ct,e);}return;}
  if(!shortcuts)return;if(hub){if(e.key==='/'){e.preventDefault();setMenu(true);$('find').focus();}else if(e.key==='g'||e.key==='G')openGlossary();return;}const c=chapters[cur];
  if(mode!=='play'&&(e.target.tagName==='BUTTON'||e.target.tagName==='A')&&(e.key===' '||e.key==='Enter'))return;   // the focused control handles it
  if(mode==='play'){if(e.key==='Escape'){if($('result').classList.contains('show'))hideResult();else exitChal();}
    else if(e.key===']')load(cur+1,true);else if(e.key==='[')load(cur-1,true);
    else if(e.key==='g'||e.key==='G')openGlossary();
    else if(e.key==='/'){e.preventDefault();setMenu(true);$('find').focus();}
    else if(!(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))&&inst&&inst.key&&/^(?:[a-z0-9]|Arrow(?:Left|Right|Up|Down)|Enter| |Delete|Backspace)$/i.test(e.key)&&challengeInput()){if(e.key===' ')e.preventDefault();inst.key(e.key,ct,e);}
    return;}
  if((e.key==='f'||e.key==='F')&&fsOK){goFull();return;}
  if(e.key==='p'||e.key==='P'){startChal();return;}
  if(e.key==='/'){e.preventDefault();setMenu(true);$('find').focus();return;}
  if(e.key==='g'||e.key==='G'){openGlossary();return;}
  if(e.key===' '){e.preventDefault();$('playBtn').click();}
  else if(e.key==='ArrowRight'){e.preventDefault();seek(t+2);}
  else if(e.key==='ArrowLeft'){e.preventDefault();seek(t-2);}
  else if(e.key===']')load(cur+1,true);else if(e.key==='[')load(cur-1,true);
  else if(e.key==='r'||e.key==='R'){seek(0);setPlaying(true);}
  else if(e.key==='c'||e.key==='C')setCC(!captions);
  else if(e.key==='t'||e.key==='T')$('tradeBtn').click();
  else if(e.key==='s'||e.key==='S')$('trBtn').click();
  else if(e.key==='Escape'){showCard(false);setMenu(false);}
  else if(/^[0-9]$/.test(e.key)){const k=e.key==='0'?9:+e.key-1;if(c.beats[k])seek(c.beats[k][0]+.01);}});
document.addEventListener('visibilitychange',()=>{last=null;if(document.hidden){cancelPointer();rememberLesson();}});window.addEventListener('pagehide',rememberLesson);
window.addEventListener('resize',resize);
if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);
const quizFor=h=>Object.keys(QUIZ).find(g=>'#'+QUIZ[g].id===h);
function syncHubNav(){[['navHome','home'],['navMap','map'],['navMissions','missions']].forEach(([id,name])=>{if(hub===name)$(id).setAttribute('aria-current','page');else $(id).removeAttribute('aria-current');});}
function showHub(name,replace=false,focus=true,saveLesson=true){
  if(saveLesson)rememberLesson();setPlaying(false);if(mode==='play')exitChal(true);hideResult();showCard(false);hideTip();clearTimeout(liveT);setMenu(false);
  hub=name;$('lessonView').hidden=true;$('journey').hidden=false;$('resume').hidden=true;syncHubNav();markToc();journey.show(name);
  document.title=hubNames[name]+' · Packets in Motion';history[replace?'replaceState':'pushState']({pim:1,hub:name},'','#'+name);
  if(name==='home'){const r=pimResume(store.json('pim-resume',null));if(r){const i=chapters.findIndex(c=>c.id===r.chapter),c=chapters[i];$('resume').hidden=false;
    // the Home page's primary action: the paused lesson, where it stopped and how far through it is
    $('resumeText').textContent=`${c.title} · chapter ${i+1} of ${chapters.length}, paused at ${fmt(r.time)} of ${fmt(c.dur)}`;if($('resumeBar').style)$('resumeBar').style.width=Math.round(r.time/c.dur*100)+'%';$('continueBtn').onclick=()=>{load(chapters.findIndex(c=>c.id===r.chapter),false);speed=r.speed;$('speed').value=String(speed);store.set('pim-speed',String(speed));seek(r.time);cv.focus();};}}
  $('main').scrollTop=0;if(focus)$('journeyTitle').focus({preventScroll:true});
}
function restoreRoute(){const name=location.hash.slice(1);if(Object.hasOwn(hubNames,name)){restoring=true;showHub(name,true,true,false);restoring=false;return;}const q=quizFor(location.hash),i=q?firstOf(q):chapters.findIndex(c=>'#'+c.id===location.hash);if(i<0)return;const state=history.state,valid=pimRecord(state)&&state.pim===1&&state.quiz===(q||null)&&chapters.some(c=>c.id===state.chapter)&&(q||state.chapter===chapters[i].id),j=valid?chapters.findIndex(c=>c.id===state.chapter):i;
  restoring=true;load(j,false);if(valid&&Number.isFinite(state.time))seek(state.time);if(q)startQuiz(q);else if(valid&&state.challenge===true)startChal();restoring=false;saveRoute();cv.focus();}
window.addEventListener('popstate',restoreRoute);
window.addEventListener('hashchange',()=>{const q=quizFor(location.hash),h='#'+(hub|| (quizG?QUIZ[quizG].id:chapters[cur].id));if(location.hash!==h||q&&q!==quizG)restoreRoute();});
// Handle internal links before the browser changes the hash, preserving the
// outgoing lesson's history entry and bookmark. Modified clicks remain native.
document.addEventListener('click',e=>{const a=e.target.closest?e.target.closest('a'):null;if(!a||e.defaultPrevented||e.button>0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const href=a.getAttribute('href');if(!href||!href.startsWith('#'))return;const name=href.slice(1);if(Object.hasOwn(hubNames,name)){e.preventDefault();if(hub!==name)showHub(name);return;}const i=chapters.findIndex(c=>c.id===name);if(i>=0){e.preventDefault();setMenu(false);load(i,true);cv.focus();}});
// Fullscreen is optional and never locks the user's device orientation.
const fsOK=!!(document.fullscreenEnabled||document.webkitFullscreenEnabled);
function goFull(){const el=document.documentElement,req=el.requestFullscreen||el.webkitRequestFullscreen;
  if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}
  if(req)Promise.resolve(req.call(el)).catch(()=>{});}
if(!fsOK)$('fsBtn').hidden=true;
$('fsBtn').onclick=goFull;
const portrait=window.matchMedia('(orientation:portrait) and (pointer:coarse) and (max-width:600px)');
function onOrient(){cancelPointer();resize();}
if(portrait.addEventListener)portrait.addEventListener('change',onOrient);
function setShortcuts(v){shortcuts=!!v;$('shortcutsBtn').textContent='Keyboard shortcuts: '+(v?'on':'off');$('shortcutsBtn').setAttribute('aria-pressed',String(v));store.set('pim-shortcuts',v?'1':'0');}
$('shortcutsBtn').onclick=()=>setShortcuts(!shortcuts);setShortcuts(shortcuts);
function syncDiagramEditing(){$('stage').classList.toggle('editing',diagramEditing);$('diagramEdit').setAttribute('aria-pressed',String(diagramEditing));$('diagramEdit').textContent='Drag on diagram: '+(diagramEditing?'on':'off');}
$('diagramEdit').onclick=()=>{cancelPointer();diagramEditing=!diagramEditing;syncDiagramEditing();};
function diagramSize(readable){cancelPointer();$('stage').classList.toggle('readable',readable);$('diagramFit').setAttribute('aria-pressed',String(!readable));$('diagramReadable').setAttribute('aria-pressed',String(readable));resize();}
$('diagramFit').onclick=()=>diagramSize(false);$('diagramReadable').onclick=()=>diagramSize(true);
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
function showTip(b){const g=G[+b.dataset.g];if(!g)return;(b.closest('dialog')||document.body).appendChild(tip);tip.innerHTML='';const h=document.createElement('b');h.textContent=g.t;tip.append(h,g.d);tip.hidden=false;tipFor=b;
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
    if(used.length){const p=document.createElement('div');p.className='in';used.forEach(ci=>{const b=document.createElement('button');b.type='button';b.textContent=chapters[ci].title;b.onclick=()=>{closeGlossary();setMenu(false);load(ci,true);};p.appendChild(b);});dd.appendChild(p);}
    dt.dataset.k=dd.dataset.k=[g.t,...g.forms,g.d].join(' ').toLowerCase();dl.append(dt,dd);});}
function filterGloss(q){q=q.trim().toLowerCase();Array.from($('glList').children).forEach(e=>{e.hidden=!!q&&!e.dataset.k.includes(q);});}
function openGlossary(){cancelPointer();hideTip();if(!$('glList').children.length)buildGlossary();const d=$('glossary');if(!d.open){if(d.showModal)d.showModal();else d.setAttribute('open','');}$('glFind').value='';filterGloss('');$('glFind').focus();}
function closeGlossary(){const d=$('glossary');if(d.close)d.close();else d.removeAttribute('open');}
$('glossBtn').onclick=openGlossary;$('glClose').onclick=closeGlossary;$('glFind').addEventListener('input',e=>filterGloss(e.target.value));

/* ---------------- progress export / import ---------------- */
const ioMsg=s=>{$('ioMsg').textContent=s;};
const IMPORT_LIMIT=1024*1024;
function validImport(d){if(!pimRecord(d)||d.app!=='packets-in-motion')return 'Choose a Packets in Motion progress file.';
  if(![1,2].includes(d.version))return 'This progress file uses an unsupported version. Export it again from a compatible course.';
  if(!pimRecord(d.seen)||!pimRecord(d.stars))return 'The watched chapters and stars must be objects.';
  if(d.journey!==undefined&&!journeyDecode(d.journey))return 'The file contains invalid journey progress or mission evidence.';
  const entries=(v,known,check)=>pimRecord(v)&&Object.entries(v).every(([k,x])=>!known(k)||check(x,k));
  if(!entries(d.seen,k=>chapters.some(c=>c.id===k),v=>v===1||v===true)||!entries(d.stars,k=>allIds().includes(k),v=>Number.isInteger(v)&&v>=0&&v<=3))return 'The file contains invalid chapter or star values.';
  if(d.labBest!==undefined&&!entries(d.labBest,k=>Object.hasOwn(LAB_DEFS,k),v=>Number.isSafeInteger(v)&&v>0&&v<=10000))return 'The file contains invalid lab costs.';
  if(d.labChaos!==undefined&&!entries(d.labChaos,k=>Object.hasOwn(LAB_DEFS,k),v=>typeof v==='boolean'))return 'The file contains invalid chaos badges.';
  const b=d.labDesigns;if(d.version===2&&b!==undefined){
    if(!pimRecord(b)||b.version!==1)return 'The lab designs use an unsupported format.';
    const known=k=>Object.hasOwn(LAB_DEFS,k);
    if(b.drafts!==undefined&&!entries(b.drafts,known,(v,k)=>!!labDecode(k,v)))return 'The file contains an invalid lab draft.';
    if(b.best!==undefined&&!entries(b.best,known,(v,k)=>{const G=pimRecord(v)&&labDecode(k,v.design);return G&&Number.isSafeInteger(v.cost)&&v.cost>0&&v.cost===labDesignCost(k,G);}))return 'The file contains an invalid best design or cost.';
    if(b.chaos!==undefined&&!entries(b.chaos,known,(v,k)=>!!labCertificate(k,v)))return 'The file contains invalid chaos design evidence.';
  }
  return '';}
function exportProgress(){const data={app:'packets-in-motion',version:2,exported:new Date().toISOString(),seen,stars,labBest:LAB_BEST,labChaos:LAB_CHAOS,labDesigns:labDesigns(),journey:journey.export()};
  const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(data,null,2));a.download='packets-in-motion-progress.json';
  document.body.appendChild(a);a.click();a.remove();ioMsg('Progress saved to packets-in-motion-progress.json.');return data;}
// merges: a chapter stays watched, and each challenge keeps its best score
function importProgress(text){if(typeof text!=='string'||text.length>IMPORT_LIMIT){ioMsg('Progress files must be 1 MB or smaller.');return false;}let d;try{d=JSON.parse(text);}catch(e){ioMsg('That file is not valid JSON.');return false;}
  const error=validImport(d);if(error){ioMsg(error+' Nothing was imported.');return false;}
  let nSeen=0,nStars=0,nLabs=0;
  const unknown=(v,known)=>pimRecord(v)?Object.keys(v).filter(k=>!known(k)).length:0,knownLab=k=>Object.hasOwn(LAB_DEFS,k);
  const skipped=unknown(d.seen,k=>chapters.some(c=>c.id===k))+unknown(d.stars,k=>allIds().includes(k))+unknown(d.labBest,knownLab)+unknown(d.labChaos,knownLab)+(d.version===2&&d.labDesigns?['drafts','best','chaos'].reduce((n,k)=>n+unknown(d.labDesigns[k],knownLab),0):0);
  Object.keys(pimSeen(d.seen)).forEach(k=>{if(!seen[k]){seen[k]=1;nSeen++;}});
  Object.entries(pimStars(d.stars)).forEach(([k,n])=>{if(n>(stars[k]||0)){nStars+=n-(stars[k]||0);stars[k]=n;}});
  Object.entries(pimFilter(d.labBest,(k,v)=>Object.hasOwn(LAB_DEFS,k)&&Number.isSafeInteger(v)&&v>0&&v<=10000)).forEach(([k,n])=>{if(LAB_BEST[k]==null||n<LAB_BEST[k]){LAB_BEST[k]=n;nLabs++;}});
  Object.keys(pimFilter(d.labChaos,(k,v)=>Object.hasOwn(LAB_DEFS,k)&&v===true)).forEach(k=>{if(!LAB_CHAOS[k]){LAB_CHAOS[k]=true;nLabs++;}});labPut('pim-lab-chaos',LAB_CHAOS);
  if(d.version===2)nLabs+=labMergeDesigns(d.labDesigns);labSaveBest();labSaveDesigns();
  store.set('sdve-seen',JSON.stringify(seen));store.set('pim-stars',JSON.stringify(stars));updProg();updStars();markToc();syncCompletion();
  const journeyChanged=d.journey?journey.merge(d.journey):false;if(hub)journey.refresh();
  const summary=nSeen||nStars||nLabs||journeyChanged?`Imported ${nSeen} more chapter${nSeen===1?'':'s'} completed and ${nStars} more star${nStars===1?'':'s'}.${nLabs?` Updated ${nLabs} lab record${nLabs===1?'':'s'}.`:''}${journeyChanged?' Updated your learning journey.':''}`:'Nothing new in the supported records.';
  ioMsg(summary+(skipped?` Ignored ${skipped} record${skipped===1?'':'s'} not used by this course.`:''));return true;}
$('exportBtn').onclick=exportProgress;$('importBtn').onclick=()=>$('importFile').click();
$('importFile').onchange=async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;try{if(file.size>IMPORT_LIMIT){ioMsg('Progress files must be 1 MB or smaller.');return;}importProgress(await file.text());}catch(_){ioMsg('Could not read that file. Try selecting it again.');}finally{e.target.value='';}};

/* ---------------- sound cues ---------------- */
function setSound(v){SFX.enable(v);$('soundBtn').setAttribute('aria-pressed',String(v));$('soundBtn').textContent='Sound cues: '+(v?'on':'off');store.set('pim-sound',v?'1':'0');}
$('soundBtn').onclick=()=>{setSound(!SFX.on);SFX.play('good');};

setSound(store.get('pim-sound')==='1');hideTip();
// ---------- settings: one dialog, reached from the top navigation ----------
$('settingsBtn').onclick=()=>{setMenu(false);openDialog('settings','setClose');};
$('setClose').onclick=()=>closeDialog('settings');
$('settings').addEventListener('cancel',e=>{e.preventDefault();closeDialog('settings');});
// ---------- missions: what the page is for, shown once on the first visit ----------
function closeMissionHelp(){closeDialog('missionHelp');store.set('pim-missions-help','1');}
$('mhStart').onclick=closeMissionHelp;$('missionHelp').addEventListener('cancel',e=>{e.preventDefault();closeMissionHelp();});
// ---------- first-visit tour: points at each part of the page in turn ----------
const TOUR=[
  {title:'Welcome to Packets in Motion',text:'Learn system design by watching it happen: short animated lessons, each followed by a hands-on challenge. Here is a quick look around.'},
  {target:'#navHome',title:'Home',text:'Your way in. Continue the lesson you paused, or start learning from the first lesson.'},
  {target:'#navMap',title:'Learning map',text:'Every lesson on your path as a route of stations: where you are, what you have finished and what to learn first. Switch paths here: the basics, interview preparation, or everything.'},
  {target:'#navMissions',title:'Missions',text:'Put the lessons to work. Design the architecture for a growing app, then test it against traffic spikes and failures.'},
  {target:()=>narrow.matches?'#menuBtn':'#find',title:'Chapters',text:narrow.matches?`Open the list of all ${chapters.length} lessons and the section quizzes, search it, and jump anywhere.`:`All ${chapters.length} lessons and the section quizzes are listed below. Search them here (press /) and jump anywhere.`},
  {target:'#settingsBtn',title:'Settings',text:'Theme, keyboard shortcuts, sound cues, and exporting or importing your progress. You can take this tour again from here.'},
  {target:()=>$('jStart')?'#jStart':'#continueBtn',title:'Ready when you are',text:'Start your first lesson here, or try the 60-second introduction to see the big idea in action.'}];
const css=(el,o)=>{if(el&&el.style)Object.assign(el.style,o);};
function tourTarget(i){const t=TOUR[i].target,sel=typeof t==='function'?t():t,el=sel&&document.querySelector(sel);return el&&(!el.getClientRects||el.getClientRects().length)?el:null;}
// the spotlight hugs the target; the card sits below it, above it, or beside a tall target
function placeTour(){if(tourAt<0)return;const el=tourTarget(tourAt),box=$('tourBox');$('tourSpot').classList.toggle('none',!el);box.classList.toggle('center',!el);
  if(!el){css(box,{left:'',top:'',width:''});return;}
  const r=el.getBoundingClientRect(),pad=6,vw=innerWidth,vh=innerHeight,bw=Math.min(360,vw-32),bh=box.offsetHeight||220;
  css($('tourSpot'),{left:r.left-pad+'px',top:r.top-pad+'px',width:r.width+pad*2+'px',height:r.height+pad*2+'px'});
  let left,top;if(r.height>vh*.5){left=r.right+16;top=Math.max(16,Math.min(vh-bh-16,r.top+40));if(left+bw>vw-16){left=16;top=vh-bh-16;}}
  else{left=Math.min(Math.max(16,r.left+r.width/2-bw/2),vw-bw-16);top=r.bottom+14+bh<vh-16?r.bottom+14:Math.max(16,r.top-bh-14);}
  css(box,{left:left+'px',top:top+'px',width:bw+'px'});}
function showTourStep(i){tourAt=i;const el=tourTarget(i),r=el&&el.getBoundingClientRect();if(r&&(r.top<0||r.bottom>innerHeight)&&el.scrollIntoView)el.scrollIntoView({block:'nearest'});
  $('tourStep').textContent=`${i+1} of ${TOUR.length}`;$('tourTitle').textContent=TOUR[i].title;$('tourText').textContent=TOUR[i].text;
  $('tourBack').hidden=i===0;$('tourNext').textContent=i===TOUR.length-1?'Done':'Next';placeTour();$('tourNext').focus({preventScroll:true});}
function startTour(){closeDialog('settings');if(hub!=='home')showHub('home',false,false);setMenu(false);$('tour').hidden=false;$('app').inert=true;showTourStep(0);}
function endTour(){if(tourAt<0)return;tourAt=-1;$('tour').hidden=true;$('app').inert=false;store.set('pim-tour','done');const go=$('jStart')||$('continueBtn');if(go)go.focus({preventScroll:true});}
function tourKey(e){if(e.key==='Escape'){e.preventDefault();endTour();return;}
  if(e.key==='Tab'){const items=[...$('tourBox').querySelectorAll('button')].filter(b=>!b.hidden),first=items[0],end=items[items.length-1];
    if(!$('tourBox').contains(document.activeElement)||e.shiftKey&&document.activeElement===first||!e.shiftKey&&document.activeElement===end){e.preventDefault();(e.shiftKey?end:first).focus();}}}
$('tourNext').onclick=()=>tourAt<TOUR.length-1?showTourStep(tourAt+1):endTour();
$('tourBack').onclick=()=>showTourStep(Math.max(0,tourAt-1));$('tourSkip').onclick=endTour;$('tourBtn').onclick=startTour;
window.addEventListener('resize',placeTour);
journey=initJourney({progress:()=>({seen,stars}),missionHelp:first=>setTimeout(()=>{if($('missionHelp').open)return;$('mhStart').textContent=first?'Start the first mission':'Got it';
  $('mhScene').innerHTML=missionScene({maya:'wave',eng:'type',say:"Hi, I'm Maya! I run TownSquare, a little app that helps neighbors find local events. Things are about to get busy. Will you be our engineer?",reply:'Happy to help. Show me the first brief.'});openDialog('missionHelp','mhStart');},0),lesson:id=>{load(chapters.findIndex(c=>c.id===id),true);cv.focus();},practice:id=>{load(chapters.findIndex(c=>c.id===id),false);startChal();($('cStart').hidden?$('cPause'):$('cStart')).focus();}});
setCC(captions);setTranscript(store.get('pim-tr')==='1');setTheme(store.get('pim-theme')||(matchMedia('(prefers-contrast: more)').matches?'contrast':'dark'));updProg();updStars();
const startQ=quizFor(location.hash),start=startQ?firstOf(startQ):Math.max(0,chapters.findIndex(c=>'#'+c.id===location.hash));
// a shared lab design: ?lab=<id>&d=<design> opens that lab with the design on the board
const sp=typeof URLSearchParams!=='undefined'?new URLSearchParams(location.search||''):null,sLab=sp&&sp.get('lab'),sIdx=sLab?chapters.findIndex(c=>c.id===sLab):-1;
const shared=sIdx>=0&&CHAL[sLab]&&labImport(sLab,sp.get('d')||'');
if(shared){history.replaceState(null,'',location.pathname+'#'+sLab);load(sIdx,false);startChal();}
else{load(start,!!initialHash&&!Object.hasOwn(hubNames,initialHash.slice(1))&&!startQ&&!resumeRecord);if(startQ)startQuiz(startQ);else if(!initialHash||Object.hasOwn(hubNames,initialHash.slice(1)))showHub(initialHash.slice(1)||'home',true,false,false);}restoring=false;saveRoute();$('speed').value=String(speed);
if(hub==='home'&&!shared&&store.get('pim-tour')===null&&!Object.keys(seen).length&&!resumeRecord)setTimeout(startTour,400);
resize();if(portrait.matches)onOrient();requestAnimationFrame(frame);
})();
