/* ---------------- A1b. DISTRIBUTED LOCKS, LEASES & FENCING TOKENS ---------------- */
(function(){
const LS=[500,118],WA=[180,300],WB=[180,460],ST=[820,380],LEASE=6;
const toL=w=>[[w[0]+60,w[1]-12],[LS[0]-110,LS[1]+16]],toS=w=>[[w[0]+60,w[1]+8],[ST[0]-58,ST[1]]];
// renewals A sends before its pause, and the moment its lease runs out
const RENEW=[9,11.5,14,16.5],GRANT_A=6.2,GRANT_B=22.6;
const expiryA=t=>RENEW.filter(r=>r<=t).reduce((e,r)=>r+LEASE,GRANT_A+LEASE);
const holder=t=>t<GRANT_A?null:t<GRANT_B?'A':'B';
const PAUSE=[17.2,24];
ch({id:'locks',group:'Advanced',title:'Distributed Locks, Leases & Fencing Tokens',dur:38,needs:['consensus'],related:['transactions','idempotency','timeouts'],
beats:[
[0,'Only one may write','Two workers update the same record. If both read, change and write at once, one of the updates is lost. They need a lock.'],
[5,'Ask a lock service','Worker A asks a lock service (a small consensus cluster) for the lock and gets it. Worker B asks too and has to wait.'],
[10,'Leases: locks that expire','If A crashed while holding the lock, B would wait forever. So the lock is a lease that expires after a few seconds unless A keeps renewing it.'],
[17,'The pause problem','A freezes in a long garbage collection pause. Its lease runs out, B gets the lock and writes. Then A wakes up, still believing it holds the lock, and writes too.'],
[25,'Fencing tokens','Each grant comes with a number that only goes up: A got 33, B got 34. Storage remembers the highest token it has seen and rejects the write from 33.'],
[32,'The resource must help','A lease alone cannot stop a client that is paused or slow. Make the resource check the token, or design so that no lock is needed.']],
use:['One leader-only job at a time: a scheduler, a migration, a payout run','Guarding a resource that cannot merge concurrent writes','Lock services such as ZooKeeper, etcd or Consul provide leases and increasing tokens'],
cons:['Leases depend on timing: pauses and clock jumps break naive locks','Every lock is a point of contention and a possible bottleneck','Fencing needs the storage to check tokens; not every system can'],
draw(t){
  box(LS[0],LS[1],{label:'Lock service',sub:'3 nodes · consensus',w:220,h:58,c:C.accent,...A(t,4.8)});
  const paused=t>=PAUSE[0]&&t<PAUSE[1];
  server(WA[0],WA[1],{label:'Worker A',sub:paused?'paused (GC)':holder(t)==='A'?'holds lock':t>=PAUSE[1]&&t<25.4?'thinks it still has it':'',w:120,st:paused?'hot':holder(t)==='A'?'acc':'ok',col:holder(t)==='A'&&!paused?C.accent:undefined,...A(t,.2)});
  server(WB[0],WB[1],{label:'Worker B',sub:holder(t)==='B'?'holds lock':t>=6.6&&t<GRANT_B?'waiting':'',w:120,st:holder(t)==='B'?'acc':'ok',col:holder(t)==='B'?C.accent:undefined,...A(t,.4)});
  if(paused)spin(t,WA[0],WA[1]-48,{c:C.amber});
  const fenced=t>=25;
  db(ST[0],ST[1],{label:'Storage',sub:fenced&&t>=25.4?'highest token: 34':'record #7',w:136,h:92,...A(t,.6)});
  // 0–5: no lock, one update lost
  pk(t,1.2,1,toS(WA),C.blue,{label:'A: set total = 10'});pk(t,1.5,1,toS(WB),C.blue,{label:'B: set total = 12'});
  if(t>2.6&&t<5)pill('A\'s update silently overwritten',ST[0],ST[1]+80,{c:C.red,z:12.5,a:V(t,2.6,4.8)});
  // 5–10: lock and wait
  pk(t,5.4,.8,toL(WA),C.blue,{label:'lock?'});pk(t,GRANT_A,.8,rev(toL(WA)),C.green,{label:'yes · token 33'});
  pk(t,6.6,.8,toL(WB),C.blue,{label:'lock?'});pk(t,7.4,.8,rev(toL(WB)),C.amber,{label:'wait'});
  pk(t,8.2,.9,toS(WA),C.blue,{label:'write · token 33'});
  // the lease meter
  const la=V(t,GRANT_A);if(la>0){const h=holder(t),exp=h==='A'?expiryA(t):GRANT_B+LEASE+Math.floor(Math.max(0,t-GRANT_B)/2.5)*2.5,left=clamp((exp-t)/LEASE);
    draw(LS[0],LS[1]+76,{a:la},()=>{rr(-140,-18,280,36,10);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.line;g.lineWidth=1.2;g.stroke();});
    tx(`lease: ${h} · token ${h==='A'?33:34}`,LS[0]-126,LS[1]+76,{z:12.5,wt:700,f:MONO,al:'left',a:la});meter(LS[0]+60,LS[1]+71,66,10,left,left<.3?C.red:C.green);}
  RENEW.forEach((r,i)=>pk(t,r-.6,.6,toL(WA),C.green,{r:4,label:i===0?'renew':null}));
  // 17–25: A pauses, its lease expires, B takes over, then A writes anyway
  if(t>22.4&&t<23.4)pill('A\'s lease expired',LS[0],LS[1]+118,{c:C.amber,z:12,a:V(t,22.4,23.2)});
  pk(t,GRANT_B,.8,rev(toL(WB)),C.green,{label:'yes · token 34'});
  pk(t,23.4,.9,toS(WB),C.blue,{label:'write · token 34'});
  pk(t,24.3,.9,toS(WA),C.red,{label:'write · token 33 (stale!)'});
  if(t>25.2&&t<26)pill('without fencing: B\'s update is lost',ST[0],ST[1]+80,{c:C.red,z:12.5,a:V(t,25.2,25.9)});
  // 25–32: the same two writes, with fencing
  if(t>25.6&&t<32)pill('↺ again, storage checks tokens',W/2,540,{c:C.accent,z:12.5,a:V(t,25.6,31.8)});
  pk(t,26.4,.9,toS(WB),C.blue,{label:'token 34'});pop(t,27.3,ST[0],ST[1]-60,'34 ≥ 34 ✓ accepted',C.green,{z:13,d:1.6});
  const rej=[[WA[0]+60,WA[1]+8],[ST[0]-58,ST[1]]];const p=(t-28.2)/.9;
  if(p<1)pk(t,28.2,.9,rej,C.red,{label:'token 33'});else if(p<2.4){const[x,y]=along(rej,1-(p-1)/1.4*.4);dot(x,y,C.red,5,1-(p-1)/1.4);}
  pop(t,29.1,ST[0],ST[1]-60,'33 < 34 ✕ rejected',C.red,{z:13,d:1.8});
  // the lesson
  if(t>32.2){pill('lease + fencing token, checked by the resource',W/2,500,{c:C.green,z:13,a:V(t,32.2)});pill('or: make the operation idempotent and drop the lock',W/2,536,{c:C.accent,z:12.5,a:V(t,33.2)});}
}});})();
