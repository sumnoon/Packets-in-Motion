/* ---------------- 19. MONOLITH vs MICROSERVICES ---------------- */
(function(){
  const U=[80,290],MC=[480,290],MW=330,MH=250;
  const MODS=['Users','Orders','Payments','Search'];
  const GRID=[[-80,-45],[80,-45],[-80,55],[80,55]];
  const SVC=[[440,120],[440,230],[440,340],[440,450]],SDB=880,GWP=[245,290];
  const SEARCH_COPIES=[[595,450],[740,450]];
  function mono(cx,cy,s,a,o={}){if(a<=.01)return;draw(cx,cy,{a,s},()=>{const c=o.dead?C.red:C.blue;if(o.dead)glowOn(C.red,24);rr(-MW/2,-MH/2,MW,MH,18);g.fillStyle=o.dead?'#24121a':C.panel;g.fill();glowOff();g.strokeStyle=c;g.lineWidth=2.5;g.stroke();
    tx(o.title||'Monolith',-MW/2+16,-MH/2+20,{z:14,wt:750,al:'left',c:o.dead?C.red:C.blue});
    MODS.forEach((m,i)=>{const[gx,gy]=GRID[i];const hot=o.hot&&m==='Search',bad=o.bad===m,idle=o.hot&&m!=='Search';
      const mc=bad?C.red:hot?C.amber:C.accent;if(hot||bad)glowOn(mc,14);rr(gx-65,gy-33,130,66,10);g.fillStyle=C.panel2;g.fill();glowOff();g.strokeStyle=mc;g.lineWidth=1.6;g.stroke();
      tx(m,gx,gy-(idle?6:0),{z:14,wt:650,c:idle?C.faint:C.text});if(idle)tx('idle',gx,gy+13,{z:11,c:C.faint});if(hot)tx('busy!',gx,gy+14,{z:11,c:C.amber,wt:700});});
    if(o.dead)pill('WHOLE APP CRASHED',0,MH/2+18,{c:C.red,z:12});});}
ch({id:'microservices',group:'Architecture',title:'Monolith vs Microservices',dur:35,needs:['rest-grpc-ws'],related:['proxy-gateway','observability','transactions','event-driven'],
beats:[
[0,'Monolith: one app, one deploy','All features live in one codebase and run as one process, sharing one database. Simple to build, test and deploy at first.'],
[6,'Scaling means copying everything','Only Search is busy, but you can\'t scale just Search. You run whole extra copies of the entire app, idle parts and all.'],
[11,'One bug can take it all down','A memory leak in Payments crashes the process, and Users, Orders and Search go down with it.'],
[15,'Microservices: split by capability','Each capability becomes its own small service with its own database, deployed independently, often by its own team.'],
[21,'Scale only what\'s hot','Search is busy? Run three copies of Search. Everything else stays at one.'],
[25,'Failures stay contained','Payments crashes, but Users, Orders and Search keep serving. Part of the app degrades instead of all of it.'],
[29,'The cost: a distributed system','In-process function calls become network calls: extra latency, partial failures and much harder debugging. Start with a monolith; split when it hurts.']],
use:['Monolith: new products, small teams, unclear domain boundaries (most startups)','Microservices: many teams that need to ship independently, parts with very different scaling needs','A "modular monolith" is a great middle ground: clear modules, one deploy'],
cons:['Monolith: grows tangled, slow builds, one bad deploy or bug affects everything','Microservices: network latency, distributed transactions, versioned APIs between services','Microservices need strong DevOps: CI/CD per service, tracing, service discovery, on-call']
,draw(t){
  const split=P(t,15.2,17),copies=A(t,6.3,10.8),dead=t>12.6&&t<15.2;
  user(U[0],U[1],{label:'users',...A(t,.2)});
  // monolith phases
  if(t<16.5){const sc=lerp(1,.52,P(t,6,6.8)*(1-P(t,10.8,11.6)));const a=A(t,.3).a*(1-split);
    const title=t>6&&t<11?'Monolith copy':'Monolith';
    mono(MC[0],MC[1],sc,a,{hot:t>6.6&&t<11,bad:t>12&&t<15.2?'Payments':null,dead,title});
    mono(MC[0],140,.52,copies.a,{hot:true,title});mono(MC[0],440,.52,copies.a,{hot:true,title});
    db(830,290,{label:'one DB',w:96,h:80,...A(t,.5),a:A(t,.5).a*(1-P(t,15.2,16))});
    ln([[MC[0]+MW/2*sc,290],[782,290]],{a:.5*(1-split)*V(t,.5)});
    if(t>6.8&&t<10.8)pill('3× everything, for 1 busy feature',MC[0]+250,215,{c:C.amber,z:12.5,a:V(t,7.4,10.4)});}
  // monolith traffic
  if(t<15.2)each(t,.6,15,.45,1.2,(i,s)=>{let tgt;
    if(s>6.6&&s<10.8){const cp=i%3,cy=[290,140,440][cp];const g_=GRID[3];tgt=[MC[0]+g_[0]*.52,cy+g_[1]*.52];}
    else{const g_=GRID[i%4];tgt=[MC[0]+g_[0],MC[1]+g_[1]];}
    const p=[[U[0]+17,U[1]],[MC[0]-MW/2*(s>6.6&&s<10.8?.52:1),U[1]],tgt];
    if(s+.9>12.6&&s+.9<15.3){pk(t,s,.9,[p[0],p[1]],C.blue,{r:5});drop(t,s+.9,p[1][0],p[1][1]);return;}
    pk(t,s,1,p,C.blue,{r:5});});
  // microservices
  if(t>15){const ga=A(t,16);
    box(GWP[0],GWP[1],{label:'API gateway',w:124,...ga});ln([[U[0]+17,U[1]],[GWP[0]-62,GWP[1]]],{a:ga.a*.5});
    MODS.forEach((m,i)=>{const from=[MC[0]+GRID[i][0],MC[1]+GRID[i][1]],to=SVC[i];const p=split;const x=lerp(from[0],to[0],p),y=lerp(from[1],to[1],p);
      const bad=m==='Payments'&&t>25.2&&t<29.2,hot=m==='Search'&&t>21&&t<25;
      ln([[GWP[0]+62,GWP[1]],[x-70,y]],{a:ga.a*.45});
      box(x,y,{label:m+' svc',w:lerp(130,140,p),h:lerp(66,56,p),c:bad?C.red:hot?C.amber:C.accent,st:bad?'fail':null,glow:hot});
      const da=V(t,17+i*.2);ln([[m==='Search'?SEARCH_COPIES[1][0]+70:x+70,y],[SDB-38,y]],{a:da*.45});
      db(SDB,y,{label:m.toLowerCase(),w:76,h:56,a:da,s:A(t,17+i*.2).s});});
    SEARCH_COPIES.forEach((p,k)=>{const a=A(t,21.3+k*.35,33.8);box(p[0],p[1],{label:'Search svc',w:140,h:56,c:C.amber,...a});});
    if(t>21.3)pill('only Search scaled ×3',SEARCH_COPIES[0][0]+70,SVC[3][1]-50,{c:C.amber,z:12,a:V(t,21.8,28.6)});
    // traffic via gateway
    each(t,16.8,34.6,.33,1.4,(i,s)=>{let k=i%4;if(s>21&&s<25&&i%3!==0)k=3;
      let to=SVC[k];if(k===3&&s>21.3){const c=i%3;to=c===0?SVC[3]:SEARCH_COPIES[c-1];}
      const p=[[U[0]+17,U[1]],[GWP[0]-62,GWP[1]],[GWP[0]+62,GWP[1]],[to[0]-70,to[1]]];
      pk(t,s,1.1,p,C.blue,{r:4.5});
      if(k===2&&s+1.1>25.2&&s+1.1<29.2)drop(t,s+1.1,to[0]-70,to[1],{dx:-16});else pop(t,s+1.1,to[0]-86,to[1]-14,'✓',C.green,{z:12,d:.6});});
    if(t>25.4&&t<29.2)pill('others keep working ✓',SVC[1][0],SVC[2][1]+44,{c:C.green,z:12,a:V(t,25.8,28.9)});
    // network hops
    if(t>29){const hops=[[SVC[1],SVC[2],'+4 ms'],[SVC[2],SVC[0],'+3 ms'],[SVC[1],SVC[3],'+5 ms']];
      hops.forEach(([a,b,l],k)=>{const pth=crv([a[0]+70,a[1]],[a[0]+170+k*30,(a[1]+b[1])/2],[b[0]+70,b[1]]);ln(pth,{dash:[4,5],c:hexA(C.accent,.8),a:V(t,29.3+k*.4)});
        const mid=along(pth,.5);pill(l,mid[0]+14,mid[1],{c:C.accent,z:11.5,a:V(t,29.6+k*.4)});
        each(t,29.6+k*.4,34.5,1.3,.9,(i,s)=>pk(t,s,.9,pth,C.blue,{r:4.5}));});
      pill('network hops · partial failures · harder debugging',640,530,{c:C.red,z:12.5,a:V(t,30.4)});}
  }
}});})();
