/* ---------------- 16. SPOF & REDUNDANCY ---------------- */
(function(){
  const U=[80,300],X={lb:290,s:520,d:770};
ch({id:'spof',group:'Reliability',title:'Single Points of Failure & Redundancy',dur:31,
beats:[
[0,'A chain of single boxes','Requests flow user → load balancer → server → database. It works, as long as every link holds.'],
[4,'One box dies, everything stops','The server fails and every request hits a dead end. A part whose failure takes down the whole system is a single point of failure (SPOF).'],
[9,'Find every single point','Walk the request path and count: one load balancer, one server, one database. Each one is a SPOF.'],
[13.5,'Duplicate each one','Add a second of everything: a standby load balancer, another server and a database replica. Now no single box is critical.'],
[17,'Server fails → traffic reroutes','A server goes down, and the load balancer simply sends everything to the healthy one.'],
[21.5,'Database fails → replica takes over','The primary database dies. The replica is promoted and the servers switch to it.'],
[25.8,'Load balancer fails → standby takes the address','The standby grabs the shared virtual IP (VIP) and carries on. Users never notice.']],
use:['Anything users depend on: identify every component on the request path','Critical data: replicas in another zone or region, plus backups','Also think beyond servers: DNS, certificates, a single cloud region, one on-call person'],
cons:['Redundancy costs money: roughly 2× hardware for 1× capacity','More moving parts: failover logic can itself fail (test it!)','Replicas need syncing; "split brain" if both sides think they\'re primary']
,draw(t){
  const pr=P(t,13.5,15),top=y=>lerp(300,220,pr),twinA=V(t,14);
  const sDownA=(t>4.4&&t<9)||t>17.4,dDownA=t>21.9,lbDownA=t>26.1;
  const pos={lbA:[X.lb,top()],lbB:[X.lb,lerp(300,380,pr)],sA:[X.s,top()],sB:[X.s,lerp(300,380,pr)],dA:[X.d,top()],dB:[X.d,lerp(300,380,pr)]};
  user(U[0],U[1],{label:'users',...A(t,.2)});
  // links
  const la=V(t,.5)*.5;
  ['lbA','lbB'].forEach(l=>{if(l==='lbB'&&twinA<=0)return;const a=l==='lbB'?la*twinA:la;ln([[U[0]+17,U[1]],[pos[l][0]-60,pos[l][1]]],{a});
    ['sA','sB'].forEach(s=>{if(s==='sB'&&twinA<=0)return;ln([[pos[l][0]+60,pos[l][1]],[pos[s][0]-56,pos[s][1]]],{a:a*(s==='sB'?twinA:1)});});});
  ['sA','sB'].forEach(s=>['dA','dB'].forEach(d=>{if((s==='sB'||d==='dB')&&twinA<=0)return;ln([[pos[s][0]+56,pos[s][1]],[pos[d][0]-48,pos[d][1]]],{a:la*((s==='sB'||d==='dB')?twinA:1)});}));
  if(twinA>0)ln([[X.d,pos.dA[1]+44],[X.d,pos.dB[1]-44]],{a:twinA*.8,dash:[4,5],c:hexA(C.accent,.7)});
  // nodes
  box(pos.lbA[0],pos.lbA[1],{label:'Load balancer',w:120,st:lbDownA?'fail':null,...A(t,.3)});
  if(twinA>0)box(pos.lbB[0],pos.lbB[1],{label:'Load balancer',sub:lbDownA?'now active':'standby',w:120,a:twinA,s:A(t,14).s});
  server(pos.sA[0],pos.sA[1],{label:'Server A',st:sDownA?'fail':'ok',...A(t,.4)});
  if(twinA>0)server(pos.sB[0],pos.sB[1],{label:'Server B',a:twinA,s:A(t,14.1).s});
  db(pos.dA[0],pos.dA[1],{label:'Primary',w:96,h:78,st:dDownA?'fail':'ok',...A(t,.5)});
  if(twinA>0)db(pos.dB[0],pos.dB[1],{label:dDownA?'Primary ★':'Replica',sub:dDownA?'promoted':null,w:96,h:78,a:twinA,s:A(t,14.2).s,col:dDownA?C.accent:null,st:dDownA?'acc':'ok'});
  // VIP tag
  if(t>14.5){const m=P(t,26.3,27.1);const vy=lerp(pos.lbA[1],pos.lbB[1],m)-48;pill('VIP 10.0.0.100',X.lb,vy,{c:C.accent,z:11.5,a:V(t,14.6)});}
  // SPOF badges
  [['lbA',9.5],['sA',10.3],['dA',11.1]].forEach(([k,t0])=>{const p=pos[k];if(t>t0&&t<13.5){ring(t,t0,p[0],p[1],C.red,60);pill('×1  SPOF',p[0],p[1]-58,{c:C.red,z:12,a:V(t,t0,13.2)});}
    if(t>14.6&&t<17.2)pill('×2',p[0],pos[k][1]-(k==='sA'?58:48)-(k==='lbA'?30:0),{c:C.green,z:12,a:V(t,14.8,17)});});
  // traffic
  each(t,.6,30.6,.55,4.2,(i,s)=>{
    const lb=s>26.1?'lbB':'lbA';let sv=s<14.2?'sA':(i%2?'sB':'sA');if(s>17.4)sv='sB';const dd=s>21.9?'dB':'dA';
    const fail=s>4.4&&s<9&&sv==='sA'&&s<14;
    const P0=[U[0]+17,U[1]],P1=[pos[lb][0]-60,pos[lb][1]],P2=[pos[lb][0]+60,pos[lb][1]],P3=[pos[sv][0]-56,pos[sv][1]];
    if(fail){pk(t,s,1.3,[P0,P1,P2,P3],C.blue,{r:5.5});drop(t,s+1.3,P3[0],P3[1],{dx:-20});return;}
    const P4=[pos[sv][0]+56,pos[sv][1]],P5=[pos[dd][0]-48,pos[dd][1]],path=[P0,P1,P2,P3,P4,P5];
    pk(t,s,2,path,C.blue,{r:5.5});const dead=(lb==='lbA'&&t>26.1)||(sv==='sA'&&t>17.4)||(dd==='dA'&&t>21.9);if(!dead)pk(t,s+2.05,2,rev(path),C.green,{r:5});});
  if(t>5&&t<9)pill('every request fails',X.s,420,{c:C.red,a:V(t,5.2,8.8)});
  if(t>17.6&&t<21.5)pill('Server A down → all traffic to B',X.s,500,{c:C.green,z:12.5,a:V(t,18,21.2)});
  if(t>22.1&&t<25.8)pill('replica promoted to primary',X.d,500,{c:C.accent,z:12.5,a:V(t,22.4,25.5)});
  if(t>26.3)pill('standby took over the VIP',X.lb,500,{c:C.accent,z:12.5,a:V(t,26.6)});
}});})();
