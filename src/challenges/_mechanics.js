const reduceMQ=matchMedia('(prefers-reduced-motion: reduce)');
/* ============================================================
   CHALLENGES: one hands-on problem per lesson.
   Lessons are pure draw(t). Challenges are live: they run on real
   time, react to the pointer and keyboard, and end in 1–3 stars.
   Each definition gets an `api` from the player (controls, status,
   win) and returns {draw(now,dt), down/move/up(x,y), key(k)}.
   ============================================================ */
const CHAL={};
function chal(id,def){CHAL[id]=def;}
const chalLater=(api,fn,ms)=>api.later?api.later(fn,ms):setTimeout(fn,ms);

// ---------- small helpers ----------
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const inBox=(x,y,b)=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h;
function wrapLines(s,maxW,z=14,wt=600){const out=[];let cur='';for(const w of s.split(' ')){const t=cur?cur+' '+w:w;if(tw(t,z,wt)>maxW&&cur){out.push(cur);cur=w;}else cur=t;}if(cur)out.push(cur);return out;}
function textBlock(s,x,y,maxW,o={}){const{z=14,wt=600,c=C.text,lh=z*1.3,al='center',a=1}=o;const L=wrapLines(s,maxW,z,wt);const y0=y-(L.length-1)*lh/2;L.forEach((l,i)=>tx(l,x,y0+i*lh,{z,wt,c,al,a}));return L.length;}
// a rounded plate centred on x,y
function plate(x,y,w,h,o={}){const{c=C.edge,fill=C.panel,glow=0,a=1,r=12,lw=2,s=1}=o;draw(x,y,{a,s},()=>{if(glow)glowOn(c,glow);rr(-w/2,-h/2,w,h,r);g.fillStyle=fill;g.fill();glowOff();g.strokeStyle=c;g.lineWidth=lw;g.stroke();});}
// a little key label, so every pointer target also has a key
function keycap(s,x,y,o={}){const a=o.a??1;draw(x,y,{a},()=>{rr(-10,-10,20,20,5);g.fillStyle=C.bg;g.fill();g.strokeStyle=o.c||C.edge;g.lineWidth=1.2;g.stroke();});tx(s,x,y+.5,{z:11.5,wt:800,c:o.c||C.dim,f:MONO,a});}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function meter(x,y,w,h,f,c,bg=C.line){rr(x,y,w,h,h/2);g.fillStyle=bg;g.fill();if(f>0){rr(x,y,Math.max(h,w*clamp(f)),h,h/2);g.fillStyle=c;g.fill();}}
// a packet flying along pts, started at t0 (real seconds), lasting d; drawn with its trail
function flyer(now,f){const p=(now-f.t0)/f.d;if(p<0)return false;if(f.drop&&p>=f.drop){const q=(now-f.t0-f.d*f.drop)/.8;if(q>=1)return true;const[x,y]=along(f.pts,esin(f.drop));dot(x-10*q,y+60*q*q,C.red,(f.r||5)*.9,1-q);return false;}
  pk(now,f.t0,f.d,f.pts,f.c,{r:f.r||5,label:f.label});return p>=1+TRAIL_FADE/f.d;}
function flyers(now,list){for(let i=list.length-1;i>=0;i--)if(flyer(now,list[i]))list.splice(i,1);}

// ---------- effects: bursts and floating text (real time) ----------
// ---------- sound cues (off until the viewer turns them on) ----------
// Short synthesized tones: no audio files, nothing loads until enabled.
const SFX={on:false,ctx:null,last:0,
  enable(v){this.on=!!v;if(!v)return;if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(A)this.ctx=new A();}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume();},
  tone(f,d,o={}){const a=this.ctx,t0=a.currentTime+(o.at||0),osc=a.createOscillator(),gn=a.createGain();osc.type=o.type||'sine';osc.frequency.setValueAtTime(f,t0);
    if(o.to)osc.frequency.exponentialRampToValueAtTime(o.to,t0+d);gn.gain.setValueAtTime(0,t0);gn.gain.linearRampToValueAtTime(o.vol||.07,t0+.012);gn.gain.exponentialRampToValueAtTime(.0001,t0+d);
    osc.connect(gn);gn.connect(a.destination);osc.start(t0);osc.stop(t0+d+.03);},
  play(kind,n=0){if(!this.on||!this.ctx)return;const now=Date.now();if(kind!=='win'&&now-this.last<90)return;this.last=now;
    try{if(kind==='good'){this.tone(660,.12);this.tone(990,.16,{at:.07});}
      else if(kind==='bad')this.tone(220,.22,{type:'triangle',to:150,vol:.09});
      else if(kind==='beat')this.tone(520,.18,{vol:.035});
      else if(kind==='win'){[523,659,784,1047].slice(0,n+1).forEach((f,i)=>this.tone(f,.22,{at:i*.11}));}}catch(e){}}};

const FX={p:[],
  burst(x,y,c,n=18,sp=170){if(reduceMQ.matches)n=Math.min(n,4),sp*=.3;for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(.35+Math.random()*.65);this.p.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50,life:.6+Math.random()*.5,age:0,c,r:1.8+Math.random()*2.4});}},
  text(x,y,s,c=C.green,z=17){if(c===C.green)SFX.play('good');else if(c===C.red)SFX.play('bad');this.p.push({x,y,vx:0,vy:reduceMQ.matches?0:-36,life:1.15,age:0,c,s,z});},
  step(dt){for(let i=this.p.length-1;i>=0;i--){const q=this.p[i];q.age+=dt;if(q.age>=q.life){this.p.splice(i,1);continue;}q.x+=q.vx*dt;q.y+=q.vy*dt;const a=1-q.age/q.life;
    if(q.s){tx(q.s,q.x,q.y,{z:q.z,wt:800,c:q.c,a});}else{q.vy+=260*dt;q.vx*=.985;g.save();g.globalAlpha=a;glowOn(q.c,8);g.fillStyle=q.c;g.beginPath();g.arc(q.x,q.y,q.r*a+.4,0,7);g.fill();glowOff();g.restore();}}},
  clear(){this.p.length=0;}};

// ---------- mechanic: sort cards into boxes ----------
// o.bins:[{id,label,sub,c}]  o.cards:[{t,b,why}]  o.timer: seconds per card (optional)
// o.keepOrder: deal in the given order  o.side(api,state): extra drawing  o.done(miss,n): {stars,title,msg}
function sortGame(o){return api=>{
  const cards=o.keepOrder?o.cards.slice():shuffle(o.cards.slice());const n=o.bins.length,gap=14,bw=Math.min(220,(W-60-(n-1)*gap)/n),x0=(W-(n*bw+(n-1)*gap))/2;
  const bins=o.bins.map((b,k)=>({...b,k,x:x0+k*(bw+gap),y:356,w:bw,h:150,got:[]}));
  const HOME=[W/2,o.side?205:200];let i=0,miss=0,streak=0,best=0,cx=HOME[0],cy=HOME[1],drag=null,hover=-1,shake=0,dealt=0,flying=[],over=false,deadline=0;
  const state={cards,get i(){return i;}};
  const keyList=o.bins.map((b,k)=>`<kbd>${k+1}</kbd> ${esc(b.label)}`).join(' · ');
  function deal(now){dealt=now;cx=HOME[0];cy=HOME[1]-40;if(o.timer)deadline=now+o.timer;api.status(`Card <b>${i+1}</b> of ${cards.length}: “${esc(cards[i].t)}”. Drag it into a box, or press ${keyList}.`);}
  function place(k,now){if(over||i>=cards.length)return;const c=cards[i],b=bins[k],right=o.bins[k].id===c.b;
    const tgt=bins.find(q=>q.id===c.b);flying.push({c,from:[cx,cy],to:[tgt.x+tgt.w/2,tgt.y+40+Math.min(tgt.got.length,4)*14],t0:now,ok:right});
    if(right){streak++;best=Math.max(best,streak);FX.burst(b.x+b.w/2,b.y+30,b.c);FX.text(b.x+b.w/2,b.y-10,streak>2?`${streak} in a row!`:'Right!',C.green);}
    else{miss++;streak=0;shake=now;FX.text(b.x+b.w/2,b.y-10,'Not quite',C.red);api.status(`<span class="bad">✕</span> ${c.why||''}`);}
    tgt.got.push(c);i++;if(i>=cards.length){over=true;chalLater(api,()=>{const r=o.done?o.done(miss,cards.length,best):null;const st=r?r.stars:(miss===0?3:miss<=Math.max(1,Math.round(cards.length*.2))?2:1);
      api.win(st,r&&r.title||(miss===0?'Flawless sorting':`${cards.length-miss} of ${cards.length} right`),r&&r.msg||(miss?`You missed ${miss}. Replay the lesson if a box felt fuzzy, then try again for three stars.`:'Every card in the right box.'));},900);}
    else{if(right)deal(now);else{dealt=now;cx=HOME[0];cy=HOME[1]-40;if(o.timer)deadline=now+o.timer+2;}}}
  let started=false;
  return{
    draw(now,dt){if(!started){started=true;deal(now);}
      if(o.side)o.side(state,now);
      bins.forEach((b,k)=>{const hot=hover===k;plate(b.x+b.w/2,b.y+b.h/2,b.w,b.h,{c:hot?b.c:hexA(b.c,.6),fill:hot?hexA(b.c,.12):C.panel,glow:hot?16:0,r:14});
        tx(`${k+1}`,b.x+16,b.y+18,{z:12,wt:800,c:hexA(b.c,.8),f:MONO});tx(b.label,b.x+b.w/2,b.y+22,{z:15,wt:750,c:b.c});
        if(b.sub)tx(b.sub,b.x+b.w/2,b.y+42,{z:11.5,c:C.dim});
        b.got.slice(-5).forEach((c,j)=>{rr(b.x+10,b.y+56+j*18,b.w-20,14,4);g.fillStyle=hexA(b.c,.16);g.fill();tx(c.t.length>28?c.t.slice(0,27)+'…':c.t,b.x+b.w/2,b.y+63+j*18,{z:10.5,c:C.dim});});});
      flying=flying.filter(f=>{const p=clamp((now-f.t0)/.45),e=eio(p);const x=lerp(f.from[0],f.to[0],e),y=lerp(f.from[1],f.to[1],e);plate(x,y,lerp(300,120,e),lerp(64,20,e),{c:f.ok?C.green:C.red,a:1-p*.6,r:10});return p<1;});
      if(!over&&i<cards.length){const c=cards[i];if(!drag){cx=lerp(cx,HOME[0],clamp(dt*10));cy=lerp(cy,HOME[1],clamp(dt*10));}
        const sh=now-shake<.35?Math.sin((now-shake)*60)*6*(1-(now-shake)/.35):0,lines=wrapLines(c.t,270,16,650),h=Math.max(70,lines.length*21+34);
        plate(cx+sh,cy,320,h,{c:drag?C.accent:C.edge,fill:C.panel2,glow:drag?20:0,r:14});
        textBlock(c.t,cx+sh,cy,270,{z:16,wt:650});
        if(o.timer&&deadline){const left=clamp((deadline-now)/o.timer);meter(cx-150,cy+h/2+10,300,5,left,left>.35?C.accent:C.red);if(now>deadline){deadline=0;place((bins.findIndex(b=>b.id!==c.b)+n)%n,now);}}
        if(streak>1)pill(`streak ×${streak}`,W-80,34,{c:C.amber,z:12});
        tx(`${i+1} / ${cards.length}`,80,34,{z:13,wt:700,c:C.dim,f:MONO});}
    },
    down(x,y){if(over||i>=cards.length)return;if(Math.abs(x-cx)<165&&Math.abs(y-cy)<60)drag={dx:x-cx,dy:y-cy};},
    move(x,y){if(drag){cx=x-drag.dx;cy=y-drag.dy;}hover=bins.findIndex(b=>inBox(drag?cx:x,drag?cy:y,b));if(!drag&&hover>=0&&y<b0y())hover=-1;},
    up(x,y,now){if(!drag)return;drag=null;const k=bins.findIndex(b=>inBox(cx,cy,b));hover=-1;if(k>=0)place(k,now);},
    click(x,y,now){const k=bins.findIndex(b=>inBox(x,y,b));if(k>=0&&!drag)place(k,now);},
    key(k,now){const d=+k;if(d>=1&&d<=n)place(d-1,now);}};
  function b0y(){return 356;}
};}

// ---------- mechanic: put steps in order ----------
// o.steps:[{t,sub}] in the correct order. o.play(now,p): optional scene while checking.
function orderGame(o){return api=>{
  const n=o.steps.length,sw=Math.min(150,(W-60)/n-10),gap=(W-60-n*sw)/(n-1||1),sy=250,ty=440;
  const slots=o.steps.map((s,k)=>({x:30+k*(sw+gap),y:sy-38,w:sw,h:76,card:null}));
  const cards=shuffle(o.steps.map((s,k)=>({...s,k})));const tray=cards.map((c,j)=>({x:30+j*(sw+gap),y:ty-38,w:sw,h:76}));
  cards.forEach((c,j)=>{c.home=j;c.slot=-1;c.x=tray[j].x+sw/2;c.y=tray[j].y+38;});
  let drag=null,tries=0,check=null,won=false;
  const pos=c=>c.slot>=0?[slots[c.slot].x+sw/2,slots[c.slot].y+38]:[tray[c.home].x+sw/2,tray[c.home].y+38];
  const LET='ABCDEFGHIJ';
  const doCheck=()=>{if(check)return;if(cards.some(c=>c.slot<0)){api.status('Fill every numbered slot first.');return;}tries++;check={t0:api.now(),res:slots.map((s,k)=>s.card.k===k)};api.lock(true);};
  const btn=api.button('Check my order',doCheck,{primary:true});
  const trayText=()=>{const left=cards.filter(c=>c.slot<0).sort((a,b)=>a.home-b.home);return left.length?'Tray: '+left.map(c=>`<kbd>${LET[c.home]}</kbd> ${esc(c.t)}`).join(' · '):'All slots filled: press <kbd>Enter</kbd> or <b>Check my order</b>.';};
  api.status(`Drag each step into the numbered slots, in the order it really happens. Or press a letter to put that card in the next slot (<kbd>Backspace</kbd> takes one back). ${trayText()}`);
  return{
    draw(now,dt){tx(o.head||'What happens, in order?',W/2,150,{z:15,wt:650,c:C.dim});
      slots.forEach((s,k)=>{let c=C.line;if(check){const p=(now-check.t0)/.45;if(p>k)c=check.res[k]?C.green:C.red;}
        g.save();g.setLineDash([6,6]);rr(s.x,s.y,s.w,s.h,12);g.strokeStyle=c;g.lineWidth=2;g.stroke();g.restore();tx(`${k+1}`,s.x+s.w/2,s.y-16,{z:13,wt:800,c:C.dim,f:MONO});});
      if(check){const p=(now-check.t0)/.45;const k=Math.min(n-1,Math.floor(p));const x=lerp(slots[0].x+sw/2,slots[n-1].x+sw/2,clamp(p/(n-1)));
        if(p<n)dot(x,sy-58,C.blue,6);if(o.play)o.play(now,p);
        if(p>=n+.3){const ok=check.res.every(v=>v);if(ok&&!won){won=true;FX.burst(W/2,sy,C.green,40,260);api.win(tries===1?3:tries===2?2:1,tries===1?'Perfect order':'Got it',o.msg||'Every step in its place.');}
          else if(!ok){check.res.forEach((v,j)=>{if(!v){const c=slots[j].card;c.slot=-1;slots[j].card=null;}});FX.text(W/2,sy-90,'Some steps are out of place',C.red,15);check=null;api.lock(false);api.status(`The red ones went back to the tray. Try again. ${trayText()}`);}}}
      cards.forEach(c=>{if(c!==drag){const[hx,hy]=pos(c);c.x=lerp(c.x,hx,clamp(dt*12));c.y=lerp(c.y,hy,clamp(dt*12));}});
      [...cards.filter(c=>c!==drag),...(drag?[drag]:[])].forEach(c=>{plate(c.x,c.y,sw,70,{c:c===drag?C.accent:c.slot>=0?C.blue:C.edge,fill:C.panel2,glow:c===drag?16:0});
        textBlock(c.t,c.x,c.y-(c.sub?8:0),sw-16,{z:13.5,wt:700});if(c.sub)tx(c.sub,c.x,c.y+20,{z:10.5,c:C.dim});if(c.slot<0&&c!==drag)keycap(LET[c.home],c.x-sw/2+14,c.y-24);});},
    key(k){if(check)return;if(k==='Enter'){doCheck();return;}
      if(k==='Backspace'){const s=slots.map(s=>s.card).filter(Boolean).pop();if(s){slots[s.slot].card=null;s.slot=-1;api.status(`Took “${esc(s.t)}” back. ${trayText()}`);}return;}
      const j=LET.indexOf(String(k).toUpperCase());if(j<0||k.length!==1)return;const c=cards.find(c=>c.home===j&&c.slot<0),e=slots.findIndex(s=>!s.card);if(!c||e<0)return;
      slots[e].card=c;c.slot=e;api.status(`Slot ${e+1}: ${esc(c.t)}. ${trayText()}`);},
    down(x,y){if(check)return;drag=cards.find(c=>Math.abs(x-c.x)<sw/2&&Math.abs(y-c.y)<36)||null;if(drag){drag.dx=x-drag.x;drag.dy=y-drag.y;}},
    move(x,y){if(drag){drag.x=x-drag.dx;drag.y=y-drag.dy;}},
    up(){if(!drag)return;const k=slots.findIndex(s=>Math.abs(drag.x-(s.x+sw/2))<sw/2+gap/2&&Math.abs(drag.y-(s.y+38))<70);
      if(k>=0){const other=slots[k].card;if(drag.slot>=0)slots[drag.slot].card=other;if(other)other.slot=drag.slot;slots[k].card=drag;drag.slot=k;}
      else if(drag.slot>=0){slots[drag.slot].card=null;drag.slot=-1;}drag=null;}};
};}

// ---------- mechanic: multiple choice (section quizzes) ----------
// o.questions:[{q, a:[right, wrong, wrong…], why, ch}]  (the first answer is the right one;
// options are shuffled when the quiz starts). ch: the chapter to rewatch after a miss.
function quizGame(o){const make=api=>{
  const qs=shuffle(o.questions.map(q=>({...q,opts:shuffle(q.a.map((t,k)=>({t,ok:k===0})))})));const n=qs.length;
  let i=0,picked=-1,right=0,done=false,shown=0;const missed=[],marks=[];
  const OW=430,OH=92,ox=k=>W/2+(k%2?1:-1)*(OW/2+10),oy=k=>246+Math.floor(k/2)*(OH+18);
  const opts=()=>qs[i].opts;
  function ask(){picked=-1;shown=api.now();const q=qs[i];
    api.status(`Question <b>${i+1}</b> of ${n}: ${esc(q.q)} ${q.opts.map((p,k)=>`<kbd>${k+1}</kbd> ${esc(p.t)}`).join(' · ')}`);}
  function pick(k){if(done||picked>=0||!opts()[k])return;picked=k;const q=qs[i],ok=q.opts[k].ok;marks.push(ok);
    const x=ox(k),y=oy(k);if(ok){right++;FX.burst(x,y,C.green,18,140);FX.text(x,y-60,'Right!',C.green,16);}else{missed.push(q);FX.text(x,y-60,'Not quite',C.red,16);}
    const ans=q.opts.find(p=>p.ok).t;
    api.status(`${ok?'<b>Right.</b>':`<span class="bad">✕</span> The answer is “${esc(ans)}”.`} ${esc(q.why)} Press <kbd>Enter</kbd> for ${i+1<n?'the next question':'your score'}.`);}
  function next(){if(done||picked<0)return;if(i+1<n){i++;ask();return;}done=true;
    const miss=n-right,st=miss===0?3:miss<=1?2:right>=n/2?1:0;
    const again=[...new Set(missed.map(q=>q.ch))].map(id=>chapters.find(c=>c.id===id)).filter(Boolean).map(c=>c.title);
    api.win(st,`${right} of ${n} right`,miss?`Worth a rewatch: ${again.join('; ')}.`:'Every answer right. You have this section down.');}
  api.button('Next question →',next,{primary:true});
  let started=false;
  return{
    draw(now){if(!started){started=true;ask();}const q=qs[i];
      tx(`${o.title||'Section quiz'} · ${i+1} / ${n}`,W/2,44,{z:13,wt:700,c:C.dim});
      textBlock(q.q,W/2,118,860,{z:21,wt:700,lh:29});
      q.opts.forEach((p,k)=>{const x=ox(k),y=oy(k),me=k===picked,after=picked>=0;
        const c=after?(p.ok?C.green:me?C.red:C.edge):C.edge,a=after&&!p.ok&&!me?.45:1;
        plate(x,y,OW,OH,{c,fill:after&&(p.ok||me)?hexA(c,.13):C.panel2,glow:after&&(p.ok||me)?14:0,a,r:14});
        keycap(String(k+1),x-OW/2+20,y-OH/2+20,{a});textBlock(p.t,x+8,y,OW-70,{z:15.5,wt:600,lh:21,a});});
      if(picked>=0)textBlock(q.why,W/2,492,880,{z:14,wt:500,c:C.dim,lh:19});
      marks.forEach((ok,k)=>dot(W/2-(n-1)*11+k*22,536,ok?C.green:C.red,4.5));
      for(let k=marks.length;k<n;k++){g.save();g.strokeStyle=C.edge;g.lineWidth=1.5;g.beginPath();g.arc(W/2-(n-1)*11+k*22,536,4.5,0,7);g.stroke();g.restore();}},
    click(x,y){const k=opts().findIndex((p,k)=>Math.abs(x-ox(k))<OW/2&&Math.abs(y-oy(k))<OH/2);if(k>=0)pick(k);else if(picked>=0)next();},
    key(k){if(k==='Enter'||k===' '||k==='n'||k==='N'){next();return;}const d=+k;if(d>=1&&d<=4)pick(d-1);}};
};make.questions=o.questions;return make;}
// registry: one quiz per course section, shown at the end of that section in the sidebar
const QUIZ={};
function quiz(group,def){QUIZ[group]={...def,group,id:'quiz-'+group.toLowerCase().replace(/[^a-z0-9]+/g,'-')};}

// ---------- mechanic: tune, then run a simulation ----------
// o.controls(api,p): builds controls that write into p. o.build(p,api): returns a sim with
// step(dt,now), draw(now,running), hud():[[label,value,colour]], score():{stars,title,msg}. o.dur: seconds.
function simGame(o){return api=>{
  const p=Object.assign({},o.defaults);let sim=o.build(p,api),running=false,t0=0,last=0,speed=o.speed||1,done=false;
  const rebuild=()=>{if(!running){sim=o.build(p,api);}};
  o.controls(api,p,rebuild);
  const run=api.button(o.runLabel||'Run it',()=>{if(running)return;sim=o.build(p,api);running=true;done=false;api.lock(true);t0=api.now();last=0;api.status(o.runStatus||'Running…');},{primary:true});
  api.status(o.intro||'Set it up, then press <b>Run it</b>.');
  return{draw(now,dt){if(running){const el=(now-t0)*speed;const step=Math.min(el-last,.1);if(step>0){sim.step(step,el);last+=step;}
        if(el>=o.dur&&!done){done=true;running=false;api.lock(false);const r=sim.score();api.win(r.stars,r.title,r.msg);}}
      sim.draw(now,running);
      const hud=sim.hud(running);hud.forEach(([l,v,c],k)=>{const x=W-20,y=26+k*22;tx(l,x-92,y,{z:11.5,c:C.dim,al:'right'});tx(v,x,y,{z:13,wt:800,c:c||C.text,al:'right',f:MONO});});
      if(running){const f=clamp(((now-t0)*speed)/o.dur);meter(20,H-14,W-40,4,f,C.accent);}},
    down(x,y,now){sim.down&&sim.down(x,y,now,running);},move(x,y){sim.move&&sim.move(x,y);},up(x,y,now){sim.up&&sim.up(x,y,now);},
    key(k,now){sim.key&&sim.key(k,now,running);}};
};}
