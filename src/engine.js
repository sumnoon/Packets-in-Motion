"use strict";
/* ============================================================
   ENGINE — every chapter is a pure function draw(t).
   Nothing is stateful between frames, so seek(t) always
   reproduces the exact same picture.
   ============================================================ */
const cv=document.getElementById('cv'), g=cv.getContext('2d');
const W=1000, H=560;
const C={bg:'#04060d',panel:'#131b2b',panel2:'#1a2338',edge:'#3b4a69',line:'#27334d',text:'#e7ecf5',dim:'#8f9ab0',faint:'#56627a',
  accent:'#a78bfa',blue:'#4ea1ff',green:'#34d399',red:'#f87171',amber:'#fbbf24'};
const SANS='ui-sans-serif,system-ui,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
const MONO='ui-monospace,"Cascadia Mono",Consolas,Menlo,monospace';

// ---------- math / easing ----------
const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
const lerp=(a,b,p)=>a+(b-a)*p;
const eio=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;          // ease-in-out cubic
const esin=x=>.5-.5*Math.cos(Math.PI*x);                       // gentle ease for packets
const spr=x=>x<=0?0:x>=1?1:1-Math.exp(-6.5*x)*Math.cos(10*x);  // damped spring
const P=(t,a,b)=>eio(clamp((t-a)/(b-a)));                      // eased progress between two times
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};
// appearance: spring-in at t0, fade-out at t1
function A(t,t0,t1=1e9,d=.6){const pin=clamp((t-t0)/d),pout=clamp((t-t1)/.5);return{a:Math.min(clamp(pin*1.7),1-eio(pout)),s:.72+.28*spr(pin)};}
const V=(t,t0,t1)=>A(t,t0,t1).a;
const L2=(a,b,p)=>[lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
function hexA(h,a){if(h[0]!=='#'||h.length!==7)return h;const n=parseInt(h.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;}
function mixC(h1,h2,p){const a=parseInt(h1.slice(1),16),b=parseInt(h2.slice(1),16);const m=(s)=>Math.round(lerp(a>>s&255,b>>s&255,clamp(p)));return `rgb(${m(16)},${m(8)},${m(0)})`;}
const loadCol=l=>l<.6?C.green:l<.85?C.amber:C.red;

// ---------- paths ----------
function plen(pts){const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));return L;}
function along(pts,p){const L=plen(pts),d=clamp(p)*L[L.length-1];for(let i=1;i<pts.length;i++){if(d<=L[i]||i===pts.length-1){const q=(d-L[i-1])/((L[i]-L[i-1])||1);return[lerp(pts[i-1][0],pts[i][0],q),lerp(pts[i-1][1],pts[i][1],q)];}}return pts[0];}
const rev=p=>p.slice().reverse();
function crv(p0,c,p1,n=18){const o=[];for(let i=0;i<=n;i++){const u=i/n;o.push([(1-u)*(1-u)*p0[0]+2*(1-u)*u*c[0]+u*u*p1[0],(1-u)*(1-u)*p0[1]+2*(1-u)*u*c[1]+u*u*p1[1]]);}return o;}

// ---------- primitives ----------
function rr(x,y,w,h,r){r=Math.min(r,w/2,h/2);g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function tx(s,x,y,o={}){const{z=14,c=C.text,al='center',wt=500,a=1,f=SANS,bl='middle'}=o;if(a<=.01)return;g.save();g.globalAlpha*=a;g.font=`${wt} ${z}px ${f}`;g.fillStyle=c;g.textAlign=al;g.textBaseline=bl;g.fillText(s,x,y);g.restore();}
function tw(s,z=14,wt=500,f=SANS){g.font=`${wt} ${z}px ${f}`;return g.measureText(s).width;}
function pill(s,x,y,o={}){const{c=C.accent,z=13,a=1,f=SANS,wt=600,al='center',tc}=o;if(a<=.01)return 0;const w=tw(s,z,wt,f)+z*1.4,h=z+11;const x0=al==='left'?x:al==='right'?x-w:x-w/2;g.save();g.globalAlpha*=a;rr(x0,y-h/2,w,h,h/2);g.fillStyle='#0d1320';g.fill();g.fillStyle=hexA(c,.16);g.fill();g.strokeStyle=hexA(c,.6);g.lineWidth=1.2;g.stroke();g.restore();tx(s,x0+w/2,y+.5,{z,c:tc||c,wt,f,a});return w;}
function draw(x,y,o,fn){const a=o.a??1,s=o.s??1;if(a<=.01)return;g.save();g.globalAlpha*=a;g.translate(x,y);if(s!==1)g.scale(s,s);fn();g.restore();}
const stCol=(st,c)=>c||({fail:C.red,hot:C.amber,good:C.green,off:C.faint,acc:C.accent,blue:C.blue,amber:C.amber}[st])||C.edge;
function glowOn(c,b){g.shadowColor=c;g.shadowBlur=b;}
function glowOff(){g.shadowBlur=0;g.shadowColor='transparent';}

// Server = rounded rectangle with status LEDs
function server(x,y,o={}){const{label='Server',sub,st='ok',w=112,h=62,load,col,down='DOWN'}=o;
  draw(x,y,o,()=>{const sc=stCol(st,col);
    if(st!=='ok'&&st!=='off')glowOn(sc,st==='fail'?26:16);
    rr(-w/2,-h/2,w,h,12);g.fillStyle=st==='fail'?'#2a141a':st==='off'?'#0f141e':C.panel;g.fill();glowOff();
    g.lineWidth=2;g.strokeStyle=sc;g.stroke();
    for(let i=0;i<3;i++){g.beginPath();g.arc(-w/2+13+i*9,-h/2+12,2.6,0,7);g.fillStyle=st==='fail'?C.red:st==='off'?C.faint:(i===0?C.green:hexA(C.green,.3));g.fill();}
    g.strokeStyle=hexA(C.dim,.3);g.lineWidth=1.5;for(let i=0;i<2;i++){g.beginPath();g.moveTo(w/2-32,-h/2+10+i*5);g.lineTo(w/2-12,-h/2+10+i*5);g.stroke();}
    tx(label,0,sub?3:7,{z:15,wt:650,c:st==='off'?C.faint:C.text});
    if(sub)tx(sub,0,20,{z:11.5,c:st==='off'?C.faint:C.dim,f:MONO});
    if(st==='fail'&&down)pill(down,0,-h/2-15,{c:C.red,z:11});
    if(load!=null){const bw=w-44,l=clamp(load);rr(-w/2+6,h/2+8,bw,6,3);g.fillStyle=C.line;g.fill();if(l>0){rr(-w/2+6,h/2+8,Math.max(6,bw*l),6,3);g.fillStyle=loadCol(l);g.fill();}
      tx(Math.round(l*100)+'%',w/2-4,h/2+11,{z:11,al:'right',c:loadCol(l),wt:700,f:MONO});}
  });}
// Generic component (load balancer, gateway, cache, queue…)
function box(x,y,o={}){const{label='',sub,c=C.accent,w=120,h=58,st,fillC,z=15}=o;
  draw(x,y,o,()=>{const sc=st==='fail'?C.red:st==='off'?C.faint:c;
    if(o.glow||st==='fail')glowOn(sc,st==='fail'?24:18);
    rr(-w/2,-h/2,w,h,12);g.fillStyle=st==='fail'?'#2a141a':fillC||C.panel;g.fill();glowOff();
    g.fillStyle=hexA(sc,.09);g.fill();g.lineWidth=2;g.strokeStyle=sc;g.stroke();
    tx(label,0,sub?-7:1,{z,wt:650,c:st==='off'?C.faint:C.text});
    if(sub)tx(sub,0,12,{z:11.5,c:st==='off'?C.faint:hexA(sc,.95),f:MONO});
    if(st==='fail')pill('DOWN',0,-h/2-15,{c:C.red,z:11});
  });}
// Database = cylinder
function db(x,y,o={}){const{label='DB',sub,st='ok',w=92,h=80,col,down='DOWN'}=o;
  draw(x,y,o,()=>{const sc=stCol(st,col),ry=Math.min(11,w*.12),top=-h/2+ry,bot=h/2-ry;
    if(st!=='ok'&&st!=='off')glowOn(sc,st==='fail'?26:16);
    g.beginPath();g.moveTo(-w/2,top);g.lineTo(-w/2,bot);g.ellipse(0,bot,w/2,ry,0,Math.PI,0,true);g.lineTo(w/2,top);g.ellipse(0,top,w/2,ry,0,0,Math.PI,true);g.closePath();
    g.fillStyle=st==='fail'?'#2a141a':C.panel;g.fill();glowOff();g.lineWidth=2;g.strokeStyle=sc;g.stroke();
    g.beginPath();g.ellipse(0,top,w/2,ry,0,0,Math.PI*2);g.fillStyle=st==='fail'?'#3a1a22':C.panel2;g.fill();g.stroke();
    g.beginPath();g.ellipse(0,top+h*.28,w/2,ry,0,0,Math.PI);g.strokeStyle=hexA(sc,.35);g.lineWidth=1.3;g.stroke();
    tx(label,0,sub?h*.12:h*.16,{z:14,wt:650,c:st==='off'?C.faint:C.text});
    if(sub)tx(sub,0,h*.12+17,{z:11.5,c:C.dim,f:MONO});
    if(st==='fail'&&down)pill(down,0,-h/2-14,{c:C.red,z:11});
  });}
// User = small circle with a person glyph
function user(x,y,o={}){const{label,c=C.blue,r=15,lc=C.dim}=o;
  draw(x,y,o,()=>{g.beginPath();g.arc(0,0,r,0,7);g.fillStyle=C.panel2;g.fill();g.lineWidth=2;g.strokeStyle=hexA(c,.85);g.stroke();
    g.fillStyle=c;g.beginPath();g.arc(0,-r*.22,r*.3,0,7);g.fill();g.beginPath();g.arc(0,r*.68,r*.5,Math.PI,0);g.fill();
    if(label)tx(label,0,r+13,{z:12,c:lc,wt:500});});}
// Line / link (optionally partially drawn with p)
function ln(pts,o={}){const{c=C.line,w=2,a=1,dash,p=1,arrow}=o;if(a<=.01||p<=0)return;g.save();g.globalAlpha*=a;g.strokeStyle=c;g.lineWidth=w;g.lineCap='round';g.lineJoin='round';if(dash)g.setLineDash(dash);
  const L=plen(pts),tot=L[L.length-1]*clamp(p);g.beginPath();g.moveTo(pts[0][0],pts[0][1]);let end=pts[0],pre=pts[0];
  for(let i=1;i<pts.length;i++){if(L[i]<=tot){g.lineTo(pts[i][0],pts[i][1]);pre=pts[i-1];end=pts[i];}else{const q=(tot-L[i-1])/((L[i]-L[i-1])||1);end=L2(pts[i-1],pts[i],q);pre=pts[i-1];g.lineTo(end[0],end[1]);break;}}
  g.stroke();g.setLineDash([]);
  if(arrow&&p>.98){const an=Math.atan2(end[1]-pre[1],end[0]-pre[0]);g.fillStyle=c;g.beginPath();g.moveTo(end[0],end[1]);g.lineTo(end[0]-10*Math.cos(an-.45),end[1]-10*Math.sin(an-.45));g.lineTo(end[0]-10*Math.cos(an+.45),end[1]-10*Math.sin(an+.45));g.closePath();g.fill();}
  g.restore();}
// Glowing dot
function dot(x,y,c=C.blue,r=6,a=1){if(a<=.01)return;g.save();g.globalAlpha*=a;glowOn(c,r*3.2);g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,7);g.fill();glowOff();g.fillStyle='rgba(255,255,255,.7)';g.beginPath();g.arc(x-r*.28,y-r*.28,r*.38,0,7);g.fill();g.restore();}
// Long exposure: a moving packet drags a streak of light, white-hot at the head
// and its own colour at the tail. After it arrives the streak burns out over
// TRAIL_FADE seconds, so the stage briefly remembers where traffic went.
// Everything is computed from t alone, so seek stays exact.
const TRAIL_LEN=96, TRAIL_FADE=1.2;
function streak(pts,e0,e1,c,r,a){if(e1-e0<.002||a<=.01)return;const L=plen(pts),tot=L[L.length-1],n=Math.max(3,Math.ceil((e1-e0)*tot/6)),P=[];
  for(let i=0;i<=n;i++)P.push(along(pts,e0+(e1-e0)*i/n));
  const[x0,y0]=P[0],[x1,y1]=P[n],gr=g.createLinearGradient(x0,y0,x1,y1);
  gr.addColorStop(0,hexA(c,0));gr.addColorStop(.7,hexA(c,.6*a));gr.addColorStop(1,`rgba(255,250,240,${.9*a})`);
  g.save();g.lineCap='round';g.lineJoin='round';g.lineWidth=r*1.2;g.strokeStyle=gr;g.shadowColor=c;g.shadowBlur=r*2.4;
  g.beginPath();g.moveTo(x0,y0);for(let i=1;i<=n;i++)g.lineTo(P[i][0],P[i][1]);g.stroke();g.restore();}
// Packet travelling along a path between t0 and t0+d. Returns raw progress.
function pk(t,t0,d,pts,c=C.blue,o={}){const p=(t-t0)/d,r=o.r||6,a=o.a??1;
  if(p>=1){const q=(t-t0-d)/TRAIL_FADE;if(q<1){const L=plen(pts),len=Math.min(1,TRAIL_LEN/L[L.length-1]);streak(pts,1-len*(1-q),1,c,r,a*(1-q)*(1-q));}return p;}
  if(p<=0)return p;const e=o.linear?p:esin(p);
  const L=plen(pts),tot=L[L.length-1];streak(pts,Math.max(0,e-TRAIL_LEN/tot),e,c,r,a);
  const[x,y]=along(pts,e);dot(x,y,c,r,a);
  if(o.lock){g.save();g.globalAlpha*=a;g.strokeStyle=C.accent;g.lineWidth=2;g.beginPath();g.arc(x,y,r+5,0,7);g.stroke();g.restore();}
  if(o.label)pill(o.label,x,y-(r+15),{c:o.lc||c,z:12,a:a*clamp(Math.min(p,1-p)*9)});
  return p;}
// Iterate spawned items: calls fn(i, spawnTime) for every item alive at t
function each(t,t0,t1,every,life,fn){if(t<t0)return;const iMax=Math.floor((Math.min(t,t1)-t0)/every+1e-9),iMin=Math.max(0,Math.ceil((t-life-t0)/every-1e-9));for(let i=iMin;i<=iMax;i++)fn(i,t0+i*every);}
// Floating text that rises & fades
function pop(t,t0,x,y,s,c=C.green,o={}){const p=(t-t0)/(o.d||1);if(p<=0||p>=1)return;tx(s,x,y-18*eio(p),{z:o.z||15,wt:700,c,a:1-p*p});}
// Expanding ring
function ring(t,t0,x,y,c=C.green,r=30){const p=(t-t0)/.7;if(p<=0||p>=1)return;g.save();g.globalAlpha=1-p;g.strokeStyle=c;g.lineWidth=2.5;g.beginPath();g.arc(x,y,6+r*eio(p),0,7);g.stroke();g.restore();}
// Spinner (work in progress)
function spin(t,x,y,o={}){const{c=C.accent,r=9,a=1}=o;if(a<=.01)return;g.save();g.globalAlpha*=a;g.strokeStyle=c;g.lineWidth=2.5;g.lineCap='round';g.beginPath();const s=t*6;g.arc(x,y,r,s,s+Math.PI*1.3);g.stroke();g.restore();}
// Falling red "dropped" dot
function drop(t,t0,x,y,o={}){const p=(t-t0)/(o.d||.9);if(p<=0||p>=1)return;dot(x+(o.dx??-14)*p,y+70*p*p,C.red,o.r||5.5,1-p);if(p<.7&&o.label!==false)tx(o.label||'✕',x+10,y-12,{z:13,wt:800,c:C.red,a:1-p/.7});}
function panel(x,y,w,h,o={}){draw(0,0,o,()=>{rr(x,y,w,h,o.r||12);g.fillStyle=o.fill||'rgba(19,27,43,.85)';g.fill();g.strokeStyle=o.c||C.line;g.lineWidth=1.3;g.stroke();});}

/* ============================================================
   CHAPTERS
   ============================================================ */
const chapters=[];
function ch(o){o.index=chapters.length;chapters.push(o);}
