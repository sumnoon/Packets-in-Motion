/* ---------------- 10. SHARDING ---------------- */
(function(){
  const CL=[110,190],RT=[420,190],SH=[[250,390],[500,390],[750,390]];
  const NAMES=['Ada','Ben','Cy','Eve','Ian','Kim','Liv','Pat','Raj','Sam','Tom','Zoe'];
  const HASH=[0,1,2,0,1,2,0,1,2,0,1,2];
  const rangeOf=i=>Math.floor(i/4);
  const slotPos=(s,j)=>[SH[s][0]+(j%2?34:-34),462+Math.floor(j/2)*28];
  const slotIn=(i,map)=>{let j=0;for(let k=0;k<i;k++)if(map(k)===map(i))j++;return j;};
ch({id:'sharding',group:'Data',title:'Sharding & Partitioning',dur:34,
beats:[
[0,'One table too big for one machine','A billion rows no longer fit on one server\'s disk, and one CPU can\'t answer every query.'],
[5,'Split rows by a shard key','Sharding splits rows across several databases. Here the shard key is the user\'s name: A–H, I–P and Q–Z each get their own shard.'],
[11,'A router finds the right shard','The app (or a router) looks at the key and sends each query to the one shard that holds it. Each shard handles only part of the traffic.'],
[17,'Hot shard!','Range splits can be uneven. If the most active users all fall in A–H, that shard melts while the others sit idle.'],
[21,'Hash the key instead','hash(key) % 3 scatters neighbouring keys across shards, so load evens out. The trade-off: range scans now touch every shard.'],
[27,'Cross-shard queries are expensive','A query about all users must ask every shard and merge the answers (scatter–gather), and it waits for the slowest one.']],
use:['Data or write traffic too big for one database, even after caching and read replicas','Natural partition keys: user_id, tenant_id, region','Multi-tenant SaaS: one tenant per shard group'],
cons:['Cross-shard JOINs and transactions become hard or impossible','A bad shard key causes hot spots; changing it later means a painful re-shard','More operational work: backups, migrations and monitoring per shard']
,draw(t){
  // big DB
  if(t<7){const a=A(t,.2,5.4);db(500,330,{label:'users',sub:'1B rows',w:120,h:110,...a,s:a.s*(1.3-.3*P(t,5,6.4)),st:'hot'});pill('disk 98% · CPU 100%',500,236,{c:C.red,a:V(t,1,5)});}
  const hashed=t>22.9,mv=P(t,21.5,22.9);
  user(CL[0],CL[1],{label:'app',...A(t,5.2)});
  box(RT[0],RT[1],{label:'Router',sub:t<21.3?'by name range':'hash(key) % 3',w:140,...A(t,5.4),glow:t>21.3&&t<23});
  ln([[CL[0]+17,CL[1]],[RT[0]-70,RT[1]]],{a:V(t,5.6)*.6});
  const loads=t<17?[.22,.2,.18]:t<21?[lerp(.22,.97,P(t,17.2,19)),.12,.1]:[lerp(.97,.42,P(t,22.9,24.3)),lerp(.12,.38,P(t,22.9,24.3)),lerp(.1,.35,P(t,22.9,24.3))];
  SH.forEach((s,k)=>{const a=A(t,5.6+k*.3);ln([[RT[0],RT[1]+29],[s[0],s[1]-40]],{a:a.a*.5});
    db(s[0],s[1],{label:'Shard '+(k+1),sub:t<21.3?['A–H','I–P','Q–Z'][k]:`h%3 = ${k}`,w:110,h:78,...a,st:loads[k]>.85?'fail':'ok',down:'OVERLOADED'});
    if(t>11)pill(`load ${Math.round(loads[k]*100)}%`,s[0]+92,s[1]-26,{c:loadCol(loads[k]),z:11.5,a:V(t,11.2)});});
  // chips
  NAMES.forEach((n,i)=>{const t0=6.4+i*.17;if(t<t0)return;const r=rangeOf(i),h=HASH[i];
    let p0=slotPos(r,slotIn(i,rangeOf)),p1=slotPos(h,slotIn(i,k=>HASH[k]));
    let pos;const fly=clamp((t-t0)/.9);if(fly<1)pos=along(crv([500,330],[(500+p0[0])/2,250],p0),eio(fly));
    else{const m=clamp((mv-i*.03)/.64);pos=m>0&&m<1?along(crv(p0,[(p0[0]+p1[0])/2,560],p1),eio(m)):(m>=1?p1:p0);}
    pill(n,pos[0],pos[1],{c:C.dim,tc:C.text,z:11.5,f:MONO});});
  // routed queries
  const q=(s0,key,tgt,lbl)=>{const toR=[[CL[0]+17,CL[1]],[RT[0]-70,RT[1]]],toS=[[RT[0],RT[1]+29],[SH[tgt][0],SH[tgt][1]-40]];
    pk(t,s0,.6,toR,C.blue,{label:key+'?'});pk(t,s0+.65,.8,toS,C.blue,{r:6});pk(t,s0+1.5,.8,rev(toS),C.green,{r:6});pk(t,s0+2.35,.6,rev(toR),C.green,{r:6});
    if(t>s0+.6&&t<s0+2.2)pill(lbl,RT[0]+170,RT[1],{c:C.accent,z:12,al:'left',a:V(t,s0+.6,s0+1.9)});};
  q(11.3,'Kim',1,'Kim → I–P → shard 2');q(12.9,'Ben',0,'Ben → A–H → shard 1');q(14.5,'Zoe',2,'Zoe → Q–Z → shard 3');
  // hot traffic
  each(t,17.2,26.6,.2,1.5,(i,s)=>{const key=i%4;const tgt=s<22.9?0:HASH[key];const toS=[[RT[0],RT[1]+29],[SH[tgt][0],SH[tgt][1]-40]];
    pk(t,s,.35,[[CL[0]+17,CL[1]],[RT[0]-70,RT[1]]],C.blue,{r:4.5});pk(t,s+.4,.8,toS,C.blue,{r:4.5});});
  if(t>17.4&&t<21.5)pill('everyone wants Ada, Ben, Cy, Eve…',RT[0]+170,RT[1],{c:C.red,z:12,al:'left',a:V(t,17.6,21.2)});
  if(t>21.5&&t<26.8)pill('Ada→0  Ben→1  Cy→2  Eve→0',RT[0]+170,RT[1],{c:C.green,z:12,al:'left',f:MONO,a:V(t,23,26.5)});
  // scatter-gather
  if(t>27){const toR=[[CL[0]+17,CL[1]],[RT[0]-70,RT[1]]];pk(t,27.3,.6,toR,C.blue,{label:'COUNT(*) all users'});
    const d=[.8,.8,2.1];SH.forEach((s,k)=>{const toS=[[RT[0],RT[1]+29],[s[0],s[1]-40]];pk(t,28,.8,toS,C.blue,{r:6});pk(t,28.9,d[k],rev(toS),C.green,{r:6,label:'4'});});
    if(t>29.8&&t<31.1)pill('waiting for shard 3…',RT[0]+170,RT[1],{c:C.amber,z:12,al:'left',a:V(t,29.8,30.8)});
    pk(t,31.1,.6,rev(toR),C.green,{r:7});pill('4 + 4 + 4 = 12 ✓',RT[0]+170,RT[1],{c:C.green,z:12.5,al:'left',a:V(t,31.2)});
    pill('every shard involved → slower & costlier',RT[0]+170,RT[1]-44,{c:C.amber,z:12,al:'left',a:V(t,31.8)});}
}});})();
