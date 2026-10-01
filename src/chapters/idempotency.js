/* ---------------- 18. IDEMPOTENCY ---------------- */
(function(){
  const CL=[130,300],PA=[520,300],BAL=[840,150];
  const path=[[148,300],[455,300]];
  const bal=t=>t<2.6?100:t<10.5?50:t<13.4?0:t<16.1?100:50;
  const lost=(t,t0)=>{const p=(t-t0)/1.4;if(p<=0)return;if(p<.5){const[x,y]=along(rev(path),p);dot(x,y,C.green,6);}else{const m=along(rev(path),.5);drop(t,t0+.7,m[0],m[1],{label:'✕ lost'});}};
ch({id:'idempotency',group:'Reliability',title:'Idempotency',dur:32,needs:['resilience'],related:['queues-pubsub','transactions','unique-ids'],
beats:[
[0,'Pay $50, then the network hiccups','The server charges the card, but the response is lost on the way back. The client can\'t tell whether the payment happened.'],
[8,'Retry… and get charged twice','The client retries, which is the right instinct. But the server treats it as a brand-new payment and charges again.'],
[13.4,'Send an idempotency key','Rewind. This time the client attaches a unique key (a1b2). The server does the work and saves the result under that key.'],
[20,'Same key → same result, no new charge','On retry, the server finds the key, skips the work and returns the saved result. One payment, however many retries.'],
[27,'Idempotent = safe to repeat','Doing it once or ten times has the same effect. GET, PUT and DELETE are naturally idempotent; "create" actions like POST need a key.']],
use:['Payments, orders, bookings: anything with real-world side effects','Any API that clients (or queues) may retry after timeouts','Message consumers that can receive the same message twice'],
cons:['Must store keys and results (with an expiry), which adds storage and a lookup per request','Two requests with the same key arriving at once need locking','Clients must generate and reuse keys correctly']
,draw(t){
  user(CL[0],CL[1],{label:'your app',...A(t,.2)});server(PA[0],PA[1],{label:'Payment API',w:130,...A(t,.3),st:'ok'});ln(path,{a:V(t,.4)*.5});
  // balance card
  const b=bal(t),chg=[2.6,10.5,16.1].find(c=>t>c&&t<c+.9);
  draw(BAL[0],BAL[1],A(t,.4),()=>{rr(-100,-48,200,96,14);g.fillStyle=C.panel;g.fill();g.strokeStyle=chg?C.red:C.edge;g.lineWidth=2;if(chg)glowOn(C.red,18);g.stroke();glowOff();
    tx('card balance',0,-24,{z:12.5,c:C.dim});tx('$'+b,0,12,{z:34,wt:800,f:MONO,c:b===0?C.red:C.text});});
  ln([[PA[0]+65,PA[1]-14],[BAL[0]-100,BAL[1]]],{a:V(t,.5)*.4,dash:[4,6]});
  if(t>13.4&&t<14.4)pill('↺ rewind: balance back to $100',BAL[0],BAL[1]+74,{c:C.accent,z:12,a:V(t,13.4,14)});
  const charge=(t0)=>{spin(t,PA[0],PA[1]-52,{a:t>t0&&t<t0+1?1:0});pk(t,t0+.3,.6,[[PA[0]+65,PA[1]-14],[BAL[0]-100,BAL[1]]],C.red,{r:5,label:'-$50'});};
  // scenario 1
  pk(t,.5,1.3,path,C.blue,{label:'POST /pay $50'});charge(1.9);lost(t,3);
  if(t>5&&t<8.3)pill('timeout… did it go through?',CL[0]+10,CL[1]-60,{c:C.amber,z:12,al:'left',a:V(t,5,8)});
  pk(t,8.3,1.3,path,C.blue,{label:'POST /pay $50 (retry)'});charge(9.7);pk(t,11,1.3,rev(path),C.green,{label:'200 OK'});
  if(t>10.6&&t<13.4)pill('charged twice! −$100',BAL[0],BAL[1]+74,{c:C.red,z:13,a:V(t,10.7,13.2)});
  // key table
  const ka=A(t,13.6);
  table(740,390,'saved results (by key)',['key','result'],[70,150],t>16.5?[['a1b2','charged $50 ✓']]:[['','']],{a:ka.a,hl:i=>t>21.7&&t<23.6?C.amber:t>16.5&&t<17.3?C.green:null,rowA:i=>t>16.5?1:0});
  ln([[PA[0]+65,PA[1]+14],[740,430]],{a:ka.a*.4,dash:[4,6]});
  // scenario 2
  pk(t,13.8,1.3,path,C.blue,{label:'POST /pay $50 · key a1b2'});
  if(t>15.1&&t<16.3)pill('key a1b2 seen? no → process',PA[0],PA[1]+64,{c:C.dim,z:12,a:V(t,15.1,16)});
  charge(15.8);pk(t,16.6,.7,[[PA[0]+65,PA[1]+14],[740,430]],C.amber,{r:5,label:'save'});lost(t,17.3);
  if(t>19&&t<20.3)pill('timeout… retry with the SAME key',CL[0]+10,CL[1]-60,{c:C.amber,z:12,al:'left',a:V(t,19,20.1)});
  pk(t,20.3,1.3,path,C.blue,{label:'POST /pay $50 · key a1b2'});
  pk(t,21.7,.6,[[PA[0]+65,PA[1]+14],[740,430]],C.amber,{r:5});
  if(t>21.7&&t<24)pill('key a1b2 seen? YES → return saved result',PA[0],PA[1]+64,{c:C.amber,z:12,a:V(t,21.8,23.8)});
  if(t>22.4&&t<27)pill('no new charge',BAL[0],BAL[1]+74,{c:C.green,z:13,a:V(t,22.6,26.8)});
  pk(t,22.8,1.3,rev(path),C.green,{label:'200 OK (saved)'});
  if(t>24.1)pill('✓ paid exactly once',CL[0]+10,CL[1]-60,{c:C.green,z:12.5,al:'left',a:V(t,24.2)});
  pill('GET · PUT · DELETE: naturally idempotent',330,440,{c:C.green,z:12.5,a:V(t,27.3)});
  pill('POST /pay: needs an Idempotency-Key header',330,480,{c:C.amber,z:12.5,a:V(t,28)});
}});})();
