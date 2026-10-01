/* ---------------- 20. EVENT-DRIVEN ARCHITECTURE ---------------- */
(function(){
  const OD0=[170,280],OD1=[130,280],BUSY=280,BX0=250,BX1=950,SPD=260;
  const SUB={Inventory:{d:[720,130],e:[430,140],t0:.4},Analytics:{d:[720,430],e:[650,140],t0:.6},Email:{d:[720,280],e:[870,140],t0:.5},Fraud:{e:[430,420],t0:17.2},Shipping:{e:[650,420],t0:22.8}};
  const TOPIC={OrderPlaced:['Inventory','Analytics','Email','Fraud'],StockReserved:['Shipping','Analytics'],Shipped:['Email','Analytics']};
  const EVTS=[[8.9,'OrderPlaced',BX0],[12.8,'OrderPlaced',BX0],[18,'OrderPlaced',BX0],[20.4,'OrderPlaced',BX0]];
  // chain
  const C0=23.4;const recv=(t0,x0,x)=>t0+(x-x0)/SPD;
  const invGets=recv(C0,BX0,430)+.5,sr=invGets+.8;const shipGets=recv(sr+.5,430,650)+.5,sh=shipGets+.8;const emGets=recv(sh+.5,650,870)+.5;
  EVTS.push([C0,'OrderPlaced',BX0],[sr+.5,'StockReserved',430],[sh+.5,'Shipped',650]);
ch({id:'event-driven',group:'Architecture',title:'Event-Driven Architecture',dur:33,
beats:[
[0,'Request-driven: the caller knows everyone','Order service calls Inventory, Email and Analytics directly, one by one, and waits. Adding a feature means changing Order service.'],
[7,'Event-driven: announce what happened','Order service just publishes a fact, "OrderPlaced", to an event bus. It doesn\'t know or care who is listening.'],
[11,'Subscribers react on their own','Every interested service receives its own copy and does its job independently, in parallel. A slow subscriber doesn\'t block the others.'],
[17,'Add a consumer: zero changes upstream','A new Fraud-check service subscribes to OrderPlaced. Order service didn\'t change a single line.'],
[23,'Events trigger events','Inventory reserves stock and publishes "StockReserved". Shipping reacts and publishes "Shipped". Email tells the customer. A workflow emerges from reactions.']],
use:['Many services need to react to the same business facts (order placed, user signed up)','Extending a system without touching existing code','Audit trails, analytics and syncing data to other stores'],
cons:['Harder to follow: there is no single place that shows the whole flow (use tracing!)','Eventual consistency and duplicate or out-of-order events must be handled','Event schemas become contracts; changing them needs versioning']
,draw(t){
  const mv=P(t,7,8.6),busA=A(t,7.4);
  const OD=L2(OD0,OD1,mv);
  server(OD[0],OD[1],{label:'Order svc',...A(t,.2),w:120,sub:t<7&&t>.8?'waiting…':'publisher'});
  // bus
  draw(0,0,busA,()=>{rr(BX0,BUSY-20,BX1-BX0,40,20);g.fillStyle=hexA(C.amber,.07);g.fill();g.strokeStyle=hexA(C.amber,.6);g.lineWidth=1.6;g.stroke();});
  tx('event bus',BX0+16,BUSY,{z:12,wt:700,al:'left',c:C.amber,a:busA.a*(t<8.8?1:.6)});
  if(busA.a>0)ln([[OD[0]+60,OD[1]],[BX0,BUSY]],{a:busA.a*.6});
  // subscribers
  Object.entries(SUB).forEach(([n,s])=>{const pos=s.d?L2(s.d,s.e,mv):s.e;const a=A(t,s.t0);
    server(pos[0],pos[1],{label:n,w:118,h:56,...a,st:n==='Fraud'&&t>17.2&&t<18.4?'good':'ok'});
    if(t>7.6)ln([[pos[0],pos[1]+(pos[1]<BUSY?28:-28)],[pos[0],BUSY+(pos[1]<BUSY?-20:20)]],{a:a.a*busA.a*.55,dash:[3,5]});
    if(n==='Fraud'&&t>17.2&&t<21)pill('new subscriber',pos[0]+120,pos[1],{c:C.green,z:12,a:V(t,17.4,20.6)});});
  // direct calls
  if(t<7.4){const fa=1-P(t,7,7.4);['Inventory','Email','Analytics'].forEach((n,k)=>{const d=SUB[n].d,p=[[OD0[0]+60,OD0[1]],[d[0]-59,d[1]]];ln(p,{a:fa*.6,w:2});
      const t0=.8+k*2;pk(t,t0,.7,p,C.blue,{label:k===0?'reserve stock':k===1?'send email':'track'});spin(t,d[0]+78,d[1],{a:t>t0+.7&&t<t0+1.1?1:0});pk(t,t0+1.1,.7,rev(p),C.green);});
    pill('tightly coupled: knows every service',OD0[0]+20,OD0[1]+72,{c:C.red,z:12,a:V(t,1.5,7)});}
  // events on the bus
  EVTS.forEach(([t0,name,x0],ei)=>{if(t<t0-.6)return;
    if(x0===BX0){pk(t,t0-.6,.6,[[OD[0]+60,OD[1]],[BX0+8,BUSY]],C.amber,{r:5});}
    const x=x0+(t-t0)*SPD;if(t>t0&&x<BX1-10)pill(name,x+tw(name,12,650)/2+12,BUSY,{c:C.amber,z:12,tc:C.text});
    TOPIC[name].forEach(n=>{const s=SUB[n];if(ei<4&&n==='Fraud'&&t0<17.4)return;const pos=s.e;if(pos[0]<x0)return;const ta=t0+(pos[0]-x0)/SPD;
      const up=pos[1]<BUSY;pk(t,ta,.5,[[pos[0],BUSY+(up?-20:20)],[pos[0],pos[1]+(up?28:-28)]],C.blue,{r:5});
      pop(t,ta+.5,pos[0]+64,pos[1]-22,'✓',C.green,{z:13,d:.8});});});
  if(t>invGets-.2&&t<sr+.5)pk(t,sr,.5,[[430,168],[430,BUSY-20]],C.amber,{r:5,label:'publish'});
  if(t>shipGets-.2&&t<sh+.5)pk(t,sh,.5,[[650,392],[650,BUSY+20]],C.amber,{r:5,label:'publish'});
  if(t>emGets)pill('✉ customer notified',870,72,{c:C.green,z:12.5,a:V(t,emGets)});
  if(t>11.2&&t<16.8)pill('each subscriber gets its own copy',650,356,{c:C.accent,z:12,a:V(t,11.4,16.4)});
  if(t>17.4&&t<22.8)pill('Order svc: 0 lines changed',OD1[0]+10,OD1[1]-68,{c:C.green,z:12,a:V(t,17.6,22.4)});
}});})();
