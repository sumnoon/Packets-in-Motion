/* ---------------- A2. DISTRIBUTED TRANSACTIONS: 2PC & SAGAS ---------------- */
(function(){
const SV=[['Flights',[760,140]],['Hotels',[760,295]],['Cars',[760,450]]],CO=[380,295];
const to=k=>[[CO[0]+80,CO[1]],[SV[k][1][0]-72,SV[k][1][1]]],back=k=>to(k).slice().reverse();
const step=(a,b)=>[[SV[a][1][0],SV[a][1][1]+(b>a?30:-30)],[SV[b][1][0],SV[b][1][1]+(b>a?-30:30)]];
ch({id:'transactions',group:'Advanced',title:'Distributed Transactions: Two-Phase Commit & Sagas',dur:40,needs:['microservices','cap'],related:['idempotency','event-driven','consensus'],
beats:[
[0,'One trip, three services','Booking a trip touches Flights, Hotels and Cars, each with its own database. Either all three bookings happen, or none should.'],
[5,'Two-phase commit: prepare','A coordinator asks each service "can you commit?". Each one locks its rows, gets ready, and votes yes.'],
[11,'…then commit','Everyone voted yes, so the coordinator says COMMIT and all three finish together. It is atomic, but locks were held the whole time.'],
[16,'If the coordinator dies mid-way','The services voted yes and are now stuck waiting with their locks held, unsure whether to commit or abort. 2PC can block.'],
[21,'A saga: a chain of local steps','Instead, each service commits its own step at once and then triggers the next one. There are no global locks.'],
[27,'A step fails → compensate','The car booking fails. The saga runs compensating steps in reverse: cancel the hotel, then refund the flight.'],
[34,'Consistent in the end, never stuck','For a moment the flight really was booked. When the saga finishes, everything is undone cleanly and nobody is left holding a lock.']],
use:['2PC: a few databases that must commit atomically, close together','Sagas: long business flows across microservices (orders, trips, payments)','Sagas whenever services must stay available and independent'],
cons:['2PC holds locks across the network and blocks if the coordinator fails','Sagas expose in-between states and need a compensating action for every step','Compensations must be retried safely, so they have to be idempotent'],
draw(t){
  const co=A(t,.5,20.6);box(CO[0],CO[1],{label:'Coordinator',sub:'2-phase commit',w:150,h:58,st:t>=18&&t<20.6?'fail':undefined,...co});
  user(140,295,{label:'traveller',...A(t,.2)});
  SV.forEach(([n,[x,y]],k)=>{const fail=k===2&&t>=26.6&&t<34.5;server(x,y,{label:n,sub:'own database',w:124,h:56,st:fail?'fail':'ok',down:'FAILED',...A(t,.4+k*.1)});
    if(t<21)ln(to(k),{a:co.a*.45});});
  // 2PC round 1
  [0,1,2].forEach(k=>pk(t,5.4,1,to(k),C.blue,{r:4.5,label:k===0?'prepare?':null}));
  const locked=(t>6.4&&t<12.6)||(t>17.3&&t<21);
  if(locked)SV.forEach(([n,[x,y]])=>pill('🔒 locked',x+96,y,{c:C.amber,z:11.5,al:'left',a:t>17.3?.6+.4*Math.sin(t*6):1}));
  [0,1,2].forEach(k=>pk(t,7.2+k*.15,1,back(k),C.green,{r:4.5,label:k===1?'yes':null}));
  [0,1,2].forEach(k=>pk(t,11.3,1,to(k),C.accent,{r:5,label:k===0?'COMMIT':null}));
  if(t>12.6&&t<16)pill('all three booked atomically ✓',CO[0],CO[1]+70,{c:C.green,z:12.5,a:V(t,12.6,15.7)});
  // 2PC round 2: coordinator dies
  [0,1,2].forEach(k=>pk(t,16.2,1,to(k),C.blue,{r:4.5}));[0,1,2].forEach(k=>pk(t,17.3,.7,back(k),C.green,{r:4.5}));
  if(t>18.2&&t<21)pill('voted yes… now what? (blocked)',CO[0],CO[1]+70,{c:C.red,z:12.5,a:V(t,18.2,20.8)});
  // saga
  const sa=A(t,21);if(sa.a>0){for(let k=0;k<2;k++)ln(step(k,k+1),{a:sa.a*.5,dash:[5,6]});pill('saga',CO[0],CO[1],{c:C.accent,z:13,a:sa.a});}
  pk(t,21.5,1.2,[[180,295],[SV[0][1][0]-72,SV[0][1][1]]],C.blue,{label:'book flight'});
  if(t>22.7)pill(t<31.2?'booked ✓':'refunded ↺',SV[0][1][0]-100,SV[0][1][1]-48,{c:t<31.2?C.green:C.amber,z:12});
  pk(t,23.1,1.2,step(0,1),C.blue,{label:'book hotel'});if(t>24.3)pill(t<29.2?'booked ✓':'cancelled ↺',SV[1][1][0]-100,SV[1][1][1]-48,{c:t<29.2?C.green:C.amber,z:12});
  pk(t,24.9,1.2,step(1,2),C.blue,{label:'book car'});if(t>26.6&&t<34.5)pill('no cars left ✕',SV[2][1][0]-100,SV[2][1][1]-48,{c:C.red,z:12});
  pk(t,27.9,1.2,step(2,1),C.amber,{label:'cancel hotel'});pk(t,29.8,1.2,step(1,0),C.amber,{label:'refund flight'});
  pk(t,31.6,1.3,[[SV[0][1][0]-72,SV[0][1][1]],[180,295]],C.amber,{label:'sorry: trip cancelled'});
  // timeline of states
  const ta=V(t,34);if(ta>0){const st=[['flight booked',C.green],['hotel booked',C.green],['car failed',C.red],['hotel cancelled',C.amber],['flight refunded',C.amber]];
    st.forEach(([s,c],k)=>{pill(s,130+k*185,522,{c,z:12,a:ta*V(t,34+k*.25)});if(k)tx('→',130+k*185-94,522,{z:14,c:C.dim,a:ta});});}
}});})();
