/* ---------------- 23. CAPSTONE: CHAT APP ---------------- */
(function(){
const ANA=[70,170],BEN=[70,330],CY=[930,480],LB=[185,250],G1=[330,170],G2=[330,330],CH=[515,250],S1=[700,95],S2=[815,95],PS=[700,265],PR=[515,440],PU=[780,420];
const sock=(u,g)=>[[u[0]+16,u[1]],[LB[0]-46,LB[1]],[LB[0]+46,LB[1]],[g[0]-58,g[1]]];
const g2c=g=>[[g[0]+58,g[1]],[CH[0]-62,CH[1]]];
const c2s=s=>[[CH[0]+62,CH[1]-14],[s[0]-46,s[1]+12]];
const c2p=[[CH[0]+62,CH[1]+8],[PS[0]-60,PS[1]]],p2g=g=>[[PS[0]-60,PS[1]+10],[g[0]+58,g[1]+12]];
const c2pr=[[CH[0],CH[1]+30],[PR[0],PR[1]-26]],g2pr=g=>[[g[0],g[1]+28],[PR[0]-60,PR[1]]];
const c2pu=[[CH[0]+62,CH[1]+20],[PU[0]-60,PU[1]-8]],pu2cy=[[PU[0]+60,PU[1]+10],[CY[0]-16,CY[1]]];
const G2DEAD=43.6,BEN_ON=t=>t<G2DEAD?G2:t>=45.6?G1:null;
ch({id:'capstone-chat',group:'Capstone',title:'Capstone: Design a Chat App',dur:58,needs:['rest-grpc-ws','queues-pubsub','sharding'],related:['capstone','capstone-feed','idempotency'],
beats:[
[0,'The goal: fast, ordered, never lost','Messages should arrive within a second, in order, and never get lost, whether the other person is online or not.'],
[5,'Assemble the building blocks','WebSocket gateways keep a connection open to each online user. Behind them: a chat service, a sharded message store, pub/sub, a presence store and push notifications.'],
[11,'Connect and stay connected','Ana and Ben each open a WebSocket. The load balancer spreads them across gateways, and presence records which gateway holds whom.'],
[17,'Send: store it first','Ana sends "lunch?". The chat service gives it the next sequence number in the conversation and writes it to the message store, sharded by a hash of the conversation id.'],
[24,'Deliver through pub/sub','The chat service publishes the message on the conversation\'s channel. Ben\'s gateway is subscribed and pushes it down his open socket.'],
[31,'Offline: push, then catch up','Presence says Cy is offline, so a push notification goes to his phone. When he opens the app, he fetches every message after the last sequence number he saw.'],
[38,'Receipts ride the same path','Ben\'s app sends "read #42" back the same way, and Ana sees the message marked as read. A receipt just moves Ben\'s last-read marker; typing indicators are never stored at all.'],
[43,'A gateway dies','Gateway 2 crashes. Ben\'s app reconnects to gateway 1 and asks for everything after #42. Sequence numbers make the resume exact, and duplicates are ignored.'],
[50,'Every chapter, one system','Open connections, pub/sub, sharding, presence and idempotent resumes: the building blocks you have watched, working together.']],
use:['Sequence numbers per conversation give ordering and an exact resume point','Pub/sub lets any gateway reach any other without knowing who is where','Shard messages by conversation, so a chat\'s history lives together'],
cons:['Millions of open sockets: gateways hold memory per connection and need careful draining on deploys','Group chats with huge memberships need fan-out limits, like the celebrity problem','End-to-end encryption moves ordering, search and spam checks to the clients'],
draw(t){
  // intro: a chat thread
  if(t<5.2){const a=V(t,.3,4.8);draw(500,280,{a},()=>{rr(-170,-150,340,300,22);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=2;g.stroke();});
    tx('Lunch crew · 3 people',500,155,{z:13,wt:700,c:C.dim,a});
    pill('Ana: lunch?',430,205,{c:C.blue,z:14,a:a*V(t,.8)});pill('Ben: yes! 12:30',560,255,{c:C.green,z:14,a:a*V(t,1.8)});pill('Cy is offline…',470,305,{c:C.dim,z:13,a:a*V(t,2.8)});
    pill('within a second · in order · never lost',500,375,{c:C.accent,z:13,a:a*V(t,3.4)});return;}
  const L=(pts,t0,o={})=>ln(pts,{a:V(t,t0)*.4,...o});
  // links
  L([[ANA[0]+16,ANA[1]],[LB[0]-46,LB[1]]],5.6);L([[BEN[0]+16,BEN[1]],[LB[0]-46,LB[1]]],5.6);L([[LB[0]+46,LB[1]],[G1[0]-58,G1[1]]],5.9);L([[LB[0]+46,LB[1]],[G2[0]-58,G2[1]]],5.9,t>=G2DEAD?{dash:[4,6]}:{});
  [G1,G2].forEach((gw,k)=>{L(g2c(gw),6.3,k&&t>=G2DEAD?{dash:[4,6]}:{});L(p2g(gw),7.2,k&&t>=G2DEAD?{dash:[4,6]}:{});L(g2pr(gw),7.6,k&&t>=G2DEAD?{dash:[4,6]}:{});});
  L(c2s(S1),6.8);L(c2s(S2),6.8);L(c2p,7.2);L(c2pr,7.6);L(c2pu,8);L(pu2cy,8,{dash:[4,6]});
  // nodes
  user(ANA[0],ANA[1],{label:'Ana',...A(t,5.2)});user(BEN[0],BEN[1],{label:'Ben',c:C.green,...A(t,5.3)});
  draw(CY[0],CY[1],A(t,8),()=>{rr(-16,-26,32,52,7);g.fillStyle=C.panel2;g.fill();g.strokeStyle=C.edge;g.lineWidth=1.8;g.stroke();});tx(t>=35.4?'Cy (back)':'Cy · offline',CY[0],CY[1]+42,{z:12,c:C.dim,a:V(t,8)});
  box(LB[0],LB[1],{label:'LB',w:92,h:48,...A(t,5.6)});
  server(G1[0],G1[1],{label:'Gateway 1',sub:'WebSockets',w:116,h:54,...A(t,5.9)});server(G2[0],G2[1],{label:'Gateway 2',sub:'WebSockets',w:116,h:54,st:t>=G2DEAD?'fail':'ok',...A(t,6.1)});
  server(CH[0],CH[1],{label:'Chat service',sub:'orders · stores',w:124,h:58,...A(t,6.4)});
  db(S1[0],S1[1],{label:'Shard 1',sub:'hash(conv)',w:92,h:72,...A(t,6.8)});db(S2[0],S2[1],{label:'Shard 2',sub:'hash(conv)',w:92,h:72,...A(t,7)});
  box(PS[0],PS[1],{label:'Pub/Sub',sub:'channel per chat',c:C.amber,w:124,h:52,...A(t,7.2)});
  box(PR[0],PR[1],{label:'Presence',sub:'who is on which gateway',c:C.accent,w:180,h:52,...A(t,7.6)});
  box(PU[0],PU[1],{label:'Push',sub:'notifications',c:C.green,w:124,h:52,...A(t,8)});
  // presence contents
  const pres=[t>=13&&['Ana → gw 1',C.blue],t>=15.4&&(t<G2DEAD?['Ben → gw 2',C.green]:t>=46.4?['Ben → gw 1',C.green]:['Ben → ?',C.red]),t>=35.4&&['Cy → gw 1',C.dim]].filter(Boolean);
  pres.forEach(([s,c],i)=>tx(s,PR[0]+100,PR[1]-14+i*16,{z:11.5,f:MONO,c,al:'left',a:V(t,13)}));
  // 11–17: connect
  pk(t,11.4,1.2,sock(ANA,G1),C.blue,{label:'open WebSocket'});pk(t,12.6,.6,g2pr(G1),C.accent,{r:4.5});
  pk(t,13.6,1.2,sock(BEN,G2),C.green,{label:'open WebSocket'});pk(t,14.8,.6,g2pr(G2),C.accent,{r:4.5});
  if(t>=12.6)ln(sock(ANA,G1),{c:hexA(C.blue,.55),w:2.5,a:V(t,12.6)});
  const bg=BEN_ON(t);if(t>=14.8&&bg)ln(sock(BEN,bg),{c:hexA(C.green,.55),w:2.5,a:V(t,t<G2DEAD?14.8:45.6)});
  // 17–24: send and store
  pk(t,17.4,1.2,sock(ANA,G1),C.blue,{label:'"lunch?"'});pk(t,18.6,.7,g2c(G1),C.blue,{r:5});
  if(t>19.3&&t<24)pill('conv 7 · seq #42',CH[0],CH[1]-56,{c:C.accent,z:12.5,f:MONO,a:V(t,19.3,23.8)});
  pk(t,20.2,.7,c2s(S1),C.amber,{label:'store #42'});ring(t,20.9,S1[0],S1[1],C.green,36);
  pk(t,21.4,.7,rev(g2c(G1)),C.green,{r:4.5});pk(t,22.1,1.1,rev(sock(ANA,G1)),C.green,{label:'✓ sent'});
  // 24–31: publish and deliver
  pk(t,24.4,.7,c2p,C.amber,{label:'publish conv:7'});pk(t,25.2,.8,p2g(G2),C.amber,{r:5});pk(t,25.2,.8,p2g(G1),C.amber,{r:4,a:.5});
  pk(t,26.1,1.2,rev(sock(BEN,G2)),C.green,{label:'"lunch?" #42'});
  if(t>27.3&&t<31)pill('Ana: lunch?',BEN[0]+20,BEN[1]+48,{c:C.blue,z:12.5,al:'left',a:V(t,27.3,30.8)});
  // 31–38: offline user
  pk(t,31.4,.6,c2pr,C.accent,{label:'Cy online?'});pk(t,32,.6,rev(c2pr),C.red,{label:'no'});
  pk(t,32.8,.7,c2pu,C.green,{r:5});pk(t,33.5,1,pu2cy,C.green,{label:'🔔 Ana: lunch?'});
  if(t>35.4&&t<38)pill('opens app → fetch after #41 → gets #42',CY[0]-150,CY[1]-50,{c:C.green,z:12,a:V(t,35.4,37.8)});
  // 38–43: read receipt
  pk(t,38.4,1.1,sock(BEN,G2),C.green,{label:'read #42'});pk(t,39.5,.6,g2c(G2),C.green,{r:4.5});pk(t,40.1,.6,c2p,C.amber,{r:4.5});pk(t,40.7,.8,p2g(G1),C.amber,{r:4.5});
  pk(t,41.5,1.1,rev(sock(ANA,G1)),C.green,{label:'✓✓ read'});
  // 43–50: gateway dies, Ben resumes on gateway 1
  if(t>G2DEAD&&t<45.6)pill('connection lost',BEN[0]+90,BEN[1]+40,{c:C.red,z:12,a:V(t,G2DEAD,45.4)});
  pk(t,44.4,1.2,sock(BEN,G1),C.green,{label:'reconnect · resume after #42'});pk(t,45.6,.6,g2c(G1),C.green,{r:4.5});pk(t,46.2,.6,c2s(S1),C.amber,{r:4.5});
  pk(t,46.8,.6,rev(c2s(S1)),C.green,{r:4.5});pk(t,47.4,.6,rev(g2c(G1)),C.green,{r:4.5});pk(t,48,1,rev(sock(BEN,G1)),C.green,{label:'nothing missed'});
  // chapter tags
  const n=id=>chapters.findIndex(c=>c.id===id)+1,ns=(...ids)=>'Ch '+ids.map(n).join(' · ');
  [[LB[0],LB[1]+44,ns('load-balancers')],[G1[0],G1[1]-48,ns('rest-grpc-ws')],[G2[0],G2[1]+48,ns('resilience')],[CH[0],CH[1]+48,ns('unique-ids','idempotency')],
   [(S1[0]+S2[0])/2,S1[1]+56,ns('sharding','storage-engines')],[PS[0],PS[1]+46,ns('queues-pubsub')],[PR[0]-150,PR[1],ns('sessions')],[PU[0],PU[1]+46,ns('sync-async')]]
    .forEach(([x,y,s],i)=>pill(s,x,y,{c:C.accent,z:12,a:V(t,50.4+i*.3),wt:700}));
}});})();
