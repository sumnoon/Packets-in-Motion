/* ---------------- 14. MESSAGE QUEUES & PUB/SUB ---------------- */
(function(){
  const PR=[140,250],QU=[490,250],CO=[850,250];
  // queue simulation
  const M=[];for(let s=7.6;s<=13.95;s+=.9)M.push(s);for(let s=14.2;s<=21;s+=.75)M.push(s);
  const Q=[];{let last=-9;M.forEach(s=>{const arr=s+.6;const svc=last>=19?.45:.8;let ready=Math.max(arr,last+svc);if(ready>=14.5&&ready<19)ready=19;Q.push({s,arr,take:ready});last=ready;});}
  const qSlotX=k=>QU[0]+100-k*28;
  // log
  const ta=k=>22.6+k*.85,NE=13,cellX=k=>200+k*50+25;
  const readE=k=>ta(k)+.7,batch=[24.5,27,29.5,32,34.5],readA=k=>batch.find(b=>b>=ta(k)+.3),readS=k=>Math.max(ta(k)+.5,23.5+k*1.35);
  const GR=[['Email',260,readE],['Analytics',520,readA],['Shipping',780,readS]];
ch({id:'queues-pubsub',group:'Communication',title:'Message Queues & Pub/Sub',dur:41,
beats:[
[0,'Direct call: both must be up','The producer calls the consumer directly and waits. If the consumer is slow, the producer is stuck. If it\'s down, the request fails.'],
[7,'Put a queue in the middle','The producer drops messages into a queue (amber) and moves on instantly. The consumer pulls them at its own pace.'],
[14,'Consumer down? Messages wait','If the consumer crashes, messages pile up safely in the queue. When it comes back, it works through the backlog. Nothing is lost.'],
[22,'Pub/Sub: a shared log (Kafka-style)','A topic is an append-only log. Producers add events to the end, and each gets a numbered offset. Events are kept, not deleted when read.'],
[27,'Many independent readers','Each consumer group keeps its own bookmark (offset). Email, Analytics and Shipping all read every event, each at its own speed.'],
[34,'Partitions for scale','A topic is split into partitions that are read in parallel, one consumer per partition in a group. Events with the same key stay in order.']],
use:['Queue: background jobs (emails, image processing), smoothing traffic spikes, retrying work','Pub/Sub log: one event feeding many services, event sourcing, analytics pipelines','Decoupling services so each can deploy, scale and fail independently'],
cons:['Eventual consistency: work happens "soon", not "now"','Duplicates and ordering: consumers must be idempotent (see Idempotency)','Another system to run and monitor; queue backlogs can hide problems']
,draw(t){
  if(t<22.2){const fa=A(t,.2,21.6).a;
    const conDown=(t>4.6&&t<7.2)||(t>14.5&&t<19);
    server(PR[0],PR[1],{label:'Order API',sub:'producer',a:fa,w:124});
    server(CO[0],CO[1],{label:'Email worker',sub:'consumer',a:fa,w:132,st:conDown?'fail':'ok'});
    // direct phase
    if(t<7.4){const dp=[[202,250],[784,250]];ln(dp,{a:fa*(1-P(t,7,7.4))*.6});
      [[.8,true],[2.6,true],[4.8,false]].forEach(([s,ok])=>{pk(t,s,1,dp,C.blue,{label:'send email'});
        if(ok){spin(t,CO[0],CO[1]-52,{a:t>s+1&&t<s+2?1:0});pk(t,s+2,1,rev(dp),C.green,{label:'done'});}
        else{ring(t,s+1,CO[0]-66,CO[1],C.red,24);pk(t,s+1.1,1,rev(dp),C.red,{label:'error 503'});}});
      const waiting=(t>.8&&t<3)||(t>2.6&&t<4.8)||(t>4.8&&t<6.9);
      if(waiting)pill('⏳ waiting…',PR[0],PR[1]-58,{c:C.amber,z:12,a:fa});}
    // queue phase
    const qa=A(t,7.2,21.6);
    if(qa.a>0){ln([[202,250],[QU[0]-122,250]],{a:qa.a*.6});ln([[QU[0]+122,250],[784,250]],{a:qa.a*.6});
      draw(QU[0],QU[1],qa,()=>{rr(-120,-30,240,60,12);g.fillStyle=C.panel;g.fill();g.fillStyle=hexA(C.amber,.07);g.fill();g.strokeStyle=C.amber;g.lineWidth=2;g.stroke();
        for(let k=0;k<8;k++){rr(100-k*28-11,-11,22,22,5);g.strokeStyle=hexA(C.amber,.25);g.lineWidth=1.2;g.stroke();}});
      tx('queue',QU[0],QU[1]-46,{z:13,wt:700,c:C.amber,a:qa.a});tx('front →',QU[0]+82,QU[1]+44,{z:11,c:C.dim,a:qa.a});}
    let inQ=0;
    Q.forEach((m,i)=>{pk(t,m.s,.6,[[202,250],[QU[0]-122,250]],C.blue,{r:5.5});
      if(t>=m.arr&&t<m.take){inQ++;let slot=0;Q.forEach((q,j)=>{if(j<i&&t<q.take)slot+=clamp((q.take-t)/.3);});
        const ent=clamp((t-m.arr)/.35);const x=lerp(QU[0]-110,qSlotX(slot),eio(ent));dot(x,QU[1],C.amber,8,fa);}
      pk(t,m.take,.5,[[QU[0]+122,250],[784,250]],C.blue,{r:5.5});pop(t,m.take+.8,CO[0],CO[1]-50,'✓',C.green,{d:.8});});
    if(t>7.6&&t<14)pill('producer moves on instantly',PR[0],PR[1]-58,{c:C.green,z:12,a:V(t,8,13.6)});
    if(t>7.3)pill(`queued: ${inQ}`,QU[0],QU[1]+78,{c:C.amber,z:12.5,a:qa.a});
    if(t>14.6&&t<19.3)pill('messages wait safely',QU[0],QU[1]-84,{c:C.amber,z:12.5,a:V(t,14.8,19)});
    if(t>19&&t<21.6)pill('back up → draining backlog',CO[0],CO[1]-84,{c:C.green,z:12,a:V(t,19.2,21.3)});
  }else if(t<34.2){const fa=A(t,22.2,33.7).a;
    server(95,222,{label:'Orders',sub:'producer',a:fa,w:112});
    tx('topic: "orders"   (append-only log)',200,160,{z:13,wt:700,al:'left',c:C.amber,a:fa});
    for(let k=0;k<NE;k++){const x=cellX(k)-25,filled=t>=ta(k)+.5;draw(0,0,{a:fa},()=>{rr(x+2,200,46,44,7);g.fillStyle=filled?hexA(C.amber,.2):'rgba(19,27,43,.6)';g.fill();g.strokeStyle=filled?C.amber:C.line;g.lineWidth=1.5;g.stroke();});
      tx(String(k),cellX(k),188,{z:11,c:C.faint,f:MONO,a:fa});if(filled)tx('e'+k,cellX(k),222,{z:12,wt:650,f:MONO,c:C.text,a:fa*V(t,ta(k)+.5)});
      pk(t,ta(k),.5,[[151,222],[cellX(k),222]],C.amber,{r:5.5,a:fa});}
    pill('events are kept, not deleted when read',745,140,{c:C.amber,z:12,a:V(t,27.5,33.6)});
    GR.forEach(([n,x,rf],gi)=>{let off=0;for(let k=0;k<NE;k++)if(t>=rf(k)+.6)off=k+1;
      server(x,420,{label:n,sub:`read up to #${off}`,w:136,a:fa*V(t,22.6+gi*.3),col:null});
      for(let k=0;k<NE;k++)pk(t,rf(k),.6,[[cellX(k),246],[x,388]],C.blue,{r:4.5,a:fa});
      const px=off<NE?cellX(off):cellX(NE-1)+40;pill('▲ '+n,px,266+gi*24,{c:C.accent,z:11,a:fa*V(t,23)});});
  }else{
    const fa=A(t,34.2).a,PY=[170,260,350];
    server(100,260,{label:'Producer',a:fa,w:112});
    tx('consumer group: analytics',840,112,{z:13,wt:700,c:C.accent,a:fa});
    PY.forEach((y,p)=>{tx('partition '+p,250,y-32,{z:12,wt:650,al:'left',c:C.amber,a:fa});
      for(let k=0;k<8;k++){draw(0,0,{a:fa},()=>{rr(250+k*52,y-20,46,40,7);g.fillStyle='rgba(19,27,43,.6)';g.fill();g.strokeStyle=C.line;g.lineWidth=1.3;g.stroke();});}
      server(840,y,{label:'consumer '+(p+1),w:124,h:52,a:fa*V(t,34.5+p*.2)});ln([[670,y],[778,y]],{a:fa*.4});});
    each(t,34.6,40.2,.33,3,(i,s)=>{});
    for(let i=0;i<18;i++){const s=34.6+i*.33;if(t<s)break;const p=i%3,k=Math.floor(i/3),y=PY[p],x=250+k*52+23;
      pk(t,s,.5,[[156,260],[230,y],[x,y]],C.blue,{r:5,label:i<3?'key '+(i+7)+' → P'+p:null});
      if(t>s+.5){draw(0,0,{a:fa},()=>{rr(x-21,y-18,42,36,6);g.fillStyle=hexA(C.amber,.2);g.fill();g.strokeStyle=C.amber;g.lineWidth=1.3;g.stroke();});tx('e'+i,x,y,{z:11.5,f:MONO,c:C.text,a:fa});}
      pk(t,s+1.1,.6,[[x,y],[778,y]],C.blue,{r:4.5});}
    pill('same key → same partition → order kept',460,440,{c:C.accent,z:12.5,a:V(t,36)});
    pill('3 partitions → 3 consumers work in parallel',460,478,{c:C.green,z:12.5,a:V(t,37.2)});
  }
}});})();
