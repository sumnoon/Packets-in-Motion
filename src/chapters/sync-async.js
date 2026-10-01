/* ---------------- 15. SYNC vs ASYNC ---------------- */
(function(){
  const U=[90,260],API=[320,260],CH=[640,130],EM0=[640,260],PDF0=[640,390],EM1=[840,300],PDF1=[840,430],QU=[520,430];
  const hop=(a,b,da=56,db_=56)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/d,uy=(b[1]-a[1])/d;return[[a[0]+ux*da,a[1]+uy*da],[b[0]-ux*db_,b[1]-uy*db_]];};
ch({id:'sync-async',group:'Communication',title:'Synchronous vs Asynchronous Processing',dur:32,
beats:[
[0,'Synchronous: wait for everything','You place an order. The API charges the card, sends the email and builds the invoice PDF one after another, and only then replies.'],
[11,'You wait for the slowest parts','Total wait = the sum of every step. And if the email service is down, the whole order fails.'],
[13,'Asynchronous: reply now, work later','The API does only what must happen now (charge the card), puts the rest on a queue, and immediately replies "order received".'],
[20,'Workers finish in the background','Workers pull jobs in parallel. A failed job just goes back on the queue and is retried. You get the email a moment later.'],
[26,'How long did you wait?','Same total work, but you only wait for the part that truly needs an answer right now.']],
use:['Slow or unreliable steps: emails, PDFs, video encoding, third-party webhooks','Work that can be retried or batched','Keep synchronous: anything the user must see the result of right now (payment approved?)'],
cons:['Harder to reason about: the result arrives later, so you need status checks or notifications','Needs a queue, workers, retries and dead-letter handling','Errors surface later and away from the user\'s request']
,draw(t){
  const mv=P(t,13,14.2),sa=t>26?1-.85*P(t,26,26.8):1;
  const EM=L2(EM0,EM1,mv),PD=L2(PDF0,PDF1,mv);
  user(U[0],U[1],{label:'you',...A(t,.2),a:sa});server(API[0],API[1],{label:'Order API',...A(t,.3),a:sa,w:118});
  server(CH[0],CH[1],{label:'Payments',sub:'~200 ms',...A(t,.4),a:sa,w:120});
  server(EM[0],EM[1],{label:t<13.6?'Email':'Email worker',sub:t<13.6?'~300 ms':null,...A(t,.5),a:sa,w:132});
  server(PD[0],PD[1],{label:t<13.6?'Invoice PDF':'PDF worker',sub:t<13.6?'~350 ms':null,...A(t,.6),a:sa,w:132,st:t>21.8&&t<22.6?'fail':'ok',down:'FAILED'});
  const uA=hop(U,API,18,60);ln(uA,{a:sa*.5});[CH,EM,PD].forEach(p=>ln(hop(API,p,60,62),{a:sa*.45*(p===CH?1:1-mv)}));
  const call=(t0,to,work,lbl,rl)=>{const p=hop(API,to,60,62);pk(t,t0,.8,p,C.blue,{label:lbl});spin(t,to[0],to[1]-50,{a:t>t0+.8&&t<t0+.8+work?1:0});pk(t,t0+.8+work,.8,rev(p),C.green,{label:rl});};
  // sync
  if(t<13.2){pk(t,.5,.8,uA,C.blue,{label:'place order'});call(1.4,CH,1,'charge','ok');call(4.1,EM0,1.3,'send email','ok');call(7.1,PDF0,1.5,'make PDF','ok');pk(t,10.3,.7,rev(uA),C.green,{label:'order done'});}
  if(t>.5&&t<13){const ms=Math.round(clamp(t-.5,0,10.5)*220);pill(`waited ${ms.toLocaleString()} ms`,U[0]+10,U[1]-58,{c:t>11?C.red:C.blue,z:12.5,al:'left',a:V(t,.6,12.6)});if(t<11)spin(t,U[0],U[1]-30,{c:C.blue,r:6});}
  if(t>11&&t<13)pill('= charge + email + PDF + every hop',API[0]+160,470,{c:C.red,z:12.5,a:V(t,11.1,12.7)});
  // async
  const qa=A(t,13.2);
  if(t>13){ln(hop(API,QU,40,52),{a:qa.a*sa*.6});ln([[QU[0]+80,QU[1]-10],[EM[0]-66,EM[1]]],{a:qa.a*sa*.5});ln([[QU[0]+80,QU[1]+10],[PD[0]-66,PD[1]]],{a:qa.a*sa*.5});
    box(QU[0],QU[1],{label:'Job queue',w:150,h:52,c:C.amber,...qa,a:qa.a*sa});}
  if(t>13.2){pk(t,13.5,.8,uA,C.blue,{label:'place order'});call(14.4,CH,1,'charge','ok');
    pk(t,17.1,.7,hop(API,QU,40,52),C.amber,{label:'2 jobs'});pk(t,17.2,.8,rev(uA),C.green,{label:'202 · order received'});
    const jobsIn=(t>17.8&&t<20.2?2:t>=20.2&&t<20.4?1:0)+(t>22.7&&t<23?1:0);for(let k=0;k<jobsIn;k++)dot(QU[0]-20+k*22,QU[1]+16,C.amber,6,sa);
    const qE=[[QU[0]+80,QU[1]-10],[EM[0]-66,EM[1]]],qP=[[QU[0]+80,QU[1]+10],[PD[0]-66,PD[1]]];
    pk(t,20.2,.7,qE,C.amber,{r:5.5});spin(t,EM[0],EM[1]-50,{a:t>20.9&&t<22.1?sa:0});pop(t,22.1,EM[0],EM[1]-50,'✓ sent',C.green,{d:1.2});
    pk(t,20.4,.7,qP,C.amber,{r:5.5});spin(t,PD[0],PD[1]-50,{a:t>21.1&&t<21.8?sa:0});pop(t,21.8,PD[0]+90,PD[1]-10,'failed',C.red,{d:1});
    pk(t,22,.7,rev(qP),C.amber,{r:5.5,label:'retry later'});pk(t,23,.7,qP,C.amber,{r:5.5});spin(t,PD[0],PD[1]-50,{a:t>23.7&&t<24.7?sa:0});pop(t,24.7,PD[0],PD[1]-50,'✓ PDF ready',C.green,{d:1.2});
    if(t>22.3)pill('✉ confirmation email',U[0]+10,U[1]+62,{c:C.green,z:12,al:'left',a:V(t,22.4,26)});
    if(t>13.5&&t<26){const ms=Math.round(clamp(t-13.5,0,4.5)*220);pill(`waited ${ms.toLocaleString()} ms`,U[0]+10,U[1]-58,{c:t>18?C.green:C.blue,z:12.5,al:'left',a:V(t,13.6,25.6)});if(t<18)spin(t,U[0],U[1]-30,{c:C.blue,r:6});}
    if(t>18.3&&t<26)pill('work continues in the background',QU[0],QU[1]+54,{c:C.amber,z:12,a:V(t,18.5,25.6)});}
  // comparison
  if(t>26){const ba=V(t,26.4),sc=.25,x0=260;
    tx('How long you waited',x0,150,{z:16,wt:700,al:'left',c:C.text,a:ba});
    [[250,'Synchronous',2310,C.blue,26.6],[340,'Asynchronous',990,C.green,27.3]].forEach(([y,n,ms,c,t0])=>{const w=ms*sc*P(t,t0,t0+1.2);
      tx(n,x0-16,y,{z:14,wt:650,al:'right',c:C.text,a:ba});draw(0,0,{a:ba},()=>{rr(x0,y-16,Math.max(8,w),32,8);g.fillStyle=hexA(c,.75);g.fill();});
      tx(`${Math.round(ms*P(t,t0,t0+1.2)).toLocaleString()} ms`,x0+w+12,y,{z:14,wt:750,al:'left',c,f:MONO,a:ba});});
    const ex=P(t,28.6,29.8);draw(0,0,{a:ba*ex},()=>{g.setLineDash([6,6]);rr(x0+990*sc,324,(2310-990)*sc*ex,32,8);g.strokeStyle=C.amber;g.lineWidth=1.5;g.stroke();g.setLineDash([]);});
    tx('background work (you are not waiting)',x0+990*sc+10,380,{z:12.5,al:'left',c:C.amber,a:ba*ex});}
}});})();
