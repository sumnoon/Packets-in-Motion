/* ---------------- 15b. STREAM vs BATCH PROCESSING ---------------- */
(function(){
const SRC=[['shop',180],['app',300],['sensors',420]].map(([n,y])=>({n,x:90,y}));
const LX=300,SW=27,WIN=13,LY=p=>180+p*120,CX=860,CY=[240,420];
// partition p gets its e-th event at this time; a consumer reads ~0.6 s behind
const T0=13.6,RATE=[2.1,1.7,1.9];
const count=(p,t)=>t<T0?0:Math.floor((t-T0)*RATE[p])+1;
const CRASH=26,TAKE=27.6;
function offset(p,t){const behind=count(p,t-.6);if(p<2||t<CRASH)return behind;const saved=count(2,CRASH-.6);if(t<TAKE)return saved;return Math.min(behind,saved+Math.floor((t-TAKE)*6));}
const owner=(p,t)=>p<2?0:t<TAKE?1:0;
ch({id:'streams',group:'Communication',title:'Stream vs Batch Processing',dur:38,needs:['queues-pubsub'],related:['event-driven','sync-async','observability'],
beats:[
[0,'Two ways to process events','Orders, clicks and sensor readings never stop arriving. You can crunch them later in big batches, or handle each one as it arrives.'],
[5,'Batch: collect, then crunch','Events pile up in storage all day. At night a batch job reads the whole day at once and writes the report. Efficient and simple, but the answer is hours old.'],
[13,'Stream: process as they arrive','Events are appended to a log such as Kafka. Consumers read them seconds after they happen and keep running totals up to date.'],
[19,'Partitions and offsets','The log is split into partitions so several consumers can share the work. Each consumer remembers its offset: how far it has read in each partition.'],
[26,'Crash, take over, resume','A consumer dies. Another one takes over its partition and carries on from the last saved offset, so no event is skipped.'],
[32,'Pick by freshness','Fraud checks and live dashboards need streams. Monthly invoices and model training are fine as batches. Many systems run both.']],
use:['Stream: fraud detection, live dashboards, alerts, feeding search and caches','Batch: reports, billing runs, backfills, training models on history','Both together: stream for "now", batch to recompute exact history'],
cons:['Streams are always on: more moving parts, state and failure handling','Batch results are hours old, and a failed run means rerunning everything','Exactly-once results need idempotent consumers or transactional writes'],
draw(t){
  SRC.forEach((s,k)=>{box(s.x,s.y,{label:s.n,w:96,h:44,z:13,c:C.blue,...A(t,.2+k*.15,31.8)});});
  // ---- batch
  const ba=V(t,.4,12.8);
  if(ba>0){db(480,300,{label:'Storage',sub:'all of today',w:120,h:94,a:ba});SRC.forEach((s,k)=>ln([[s.x+48,s.y],[420,300]],{a:ba*.35}));
    each(t,.8,9.4,.18,.7,(i,st)=>{const s=SRC[i%3];pk(t,st,.7,[[s.x+48,s.y],[420,300]],C.blue,{r:3.5,a:ba});});
    const n=Math.floor(clamp((t-.8)/8.6)*412000);tx(`${n.toLocaleString()} events`,480,372,{z:13,wt:700,f:MONO,c:C.amber,a:ba});
    if(t>9.2)pill('02:00 · nightly batch job',720,200,{c:C.accent,z:12.5,a:ba*V(t,9.2)});
    server(720,300,{label:'Batch job',sub:t>9.6&&t<11?'crunching…':'',w:124,a:ba*V(t,9.2),st:t>9.6&&t<11?'hot':'ok'});
    pk(t,9.6,.8,[[540,300],[658,300]],C.amber,{r:9,label:'the whole day'});
    if(t>10.9){draw(890,300,{a:ba*V(t,10.9)},()=>{rr(-64,-46,128,92,10);g.fillStyle=C.panel2;g.fill();g.strokeStyle=C.edge;g.lineWidth=1.5;g.stroke();});
      tx('Report',890,286,{z:14,wt:750,a:ba*V(t,10.9)});tx('about yesterday',890,308,{z:11.5,c:C.dim,a:ba*V(t,10.9)});
      pill('answers are hours old',890,372,{c:C.amber,z:12,a:ba*V(t,11.4)});}}
  // ---- stream
  const sa=V(t,13.2,31.8);
  if(sa>0){for(let p=0;p<3;p++){const y=LY(p),n=count(p,t),first=Math.max(0,n-WIN),off=offset(p,t),own=owner(p,t),down=own===1&&t>=CRASH&&t<TAKE;
      tx(`P${p}`,LX-34,y,{z:13,wt:800,f:MONO,c:C.dim,a:sa});ln([[LX-12,y-22],[LX+WIN*SW,y-22]],{c:C.line,a:sa});ln([[LX-12,y+22],[LX+WIN*SW,y+22]],{c:C.line,a:sa});
      for(let e=first;e<n;e++){const x=LX+(e-first)*SW,read=e<off;g.save();g.globalAlpha=sa;rr(x,y-14,SW-5,28,5);g.fillStyle=read?hexA(C.green,.22):hexA(C.blue,.35);g.fill();g.strokeStyle=read?hexA(C.green,.6):C.blue;g.lineWidth=1.2;g.stroke();g.restore();}
      const ox=LX+Math.max(0,off-first)*SW-2;if(t>19)draw(ox,y+30,{a:sa*V(t,19.2)},()=>{g.beginPath();g.moveTo(0,-6);g.lineTo(-6,4);g.lineTo(6,4);g.closePath();g.fillStyle=down?C.amber:C.green;g.fill();});
      if(t>19.6)tx(`offset ${off}`,ox+10,y+36,{z:11,f:MONO,c:down?C.amber:C.green,al:'left',a:sa*V(t,19.6)});
      const cy=CY[own];ln([[LX+WIN*SW+6,y],[CX-62,cy]],{c:hexA(own?C.blue:C.green,.5),dash:down?[4,6]:null,a:sa});}
    tx('the log (Kafka)',LX+WIN*SW/2,118,{z:12,c:C.dim,a:sa});
    each(t,T0,31.6,.2,.5,(i,st)=>{const s=SRC[i%3],p=i%3;pk(t,st,.5,[[s.x+48,s.y],[LX-14,LY(p)]],C.blue,{r:3.5,a:sa});});
    server(CX,CY[0],{label:'Consumer 1',sub:t>=TAKE?'P0 · P1 · P2':'P0 · P1',w:132,a:sa});
    server(CX,CY[1],{label:'Consumer 2',sub:t<CRASH?'P2':'',w:132,st:t>=CRASH?'fail':'ok',a:sa});
    const total=Math.max(0,offset(0,t)+offset(1,t)+offset(2,t));if(t>15)pill(`orders so far: ${total*37}`,CX,CY[0]-64,{c:C.green,z:12.5,f:MONO,a:sa*V(t,15)});
    if(t>CRASH+.2&&t<TAKE)pill('P2 waits at its saved offset',LX+WIN*SW/2,LY(2)+64,{c:C.amber,z:12,a:V(t,CRASH+.2,TAKE-.1)});
    if(t>TAKE&&t<31.6)pill('Consumer 1 takes P2 and resumes from that offset',LX+WIN*SW/2,LY(2)+64,{c:C.green,z:12,a:V(t,TAKE,31.4)});}
  // ---- the choice
  const ca=V(t,32);if(ca>0)[['Stream','fraud checks · live dashboards · alerts',C.green],['Batch','invoices · reports · model training',C.accent]].forEach(([a,b,c],k)=>{const x=300+k*400,v=V(t,32.2+k*.5);
    plate(x,300,330,120,{c,a:v});tx(a,x,278,{z:22,wt:800,c,a:v});tx(b,x,316,{z:13.5,a:v});});
}});})();
