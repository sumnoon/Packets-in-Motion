/* ---------------- 3b. SESSIONS ---------------- */
(function(){
const U=[90,300],LB=[290,300],S={A:[560,160],B:[560,300],C:[560,430]},RD=[830,300];
const to=k=>[[U[0]+20,U[1]],LB,[S[k][0]-60,S[k][1]]],back=k=>to(k).slice().reverse();
const look=k=>[[S[k][0]+60,S[k][1]],[RD[0]-48,RD[1]]];
ch({id:'sessions',group:'Traffic',title:'Sessions: Sticky vs Shared Storage',dur:34,needs:['load-balancers'],related:['caching','spof'],
beats:[
[0,'Logged in… but on which server?','You log in, and Server A remembers you in its own memory. Your next click goes through the load balancer.'],
[5,'Round robin sends you elsewhere','The next request lands on Server B, which has never heard of you: "please log in again".'],
[10,'Sticky sessions: always the same server','The load balancer pins you to Server A with a cookie. That works, until A dies and takes every session it held with it.'],
[18,'Shared session storage','Instead, servers keep no user state. Sessions live in a shared store such as Redis, which every server can read.'],
[24,'Any server can serve you','Your requests can land on any server. Each one looks your session up by its id and carries on.'],
[29,'A server dies, and nobody notices','Server A crashes. Its users simply land on B or C, and their sessions are still in the store.']],
use:['Any login or shopping cart behind a load balancer','Autoscaling groups, where servers come and go','Deploys that restart servers without logging everyone out'],
cons:['The session store becomes critical: replicate it','Every request adds a lookup (fast, but not free)','Sticky sessions spread load unevenly and lose sessions on failure'],
draw(t){
  const aDead=(t>=15&&t<18)||t>=29.5;
  user(U[0],U[1],{label:'you',r:17,...A(t,.2)});box(LB[0],LB[1],{label:'Load balancer',sub:t>=10&&t<18?'sticky: A':'round robin',w:140,h:54,c:t>=10&&t<18?C.amber:C.edge,...A(t,.3)});
  Object.entries(S).forEach(([k,p],i)=>{server(p[0],p[1],{label:`Server ${k}`,w:118,h:54,st:k==='A'&&aDead?'fail':'ok',...A(t,.4+i*.1)});ln([LB,[p[0]-60,p[1]]],{a:V(t,.6)*.35});});
  const ra=A(t,18.2);db(RD[0],RD[1],{label:'Session store',sub:'Redis',w:120,h:86,col:C.accent,st:'acc',...ra});
  if(ra.a>0)Object.keys(S).forEach(k=>ln(look(k),{a:ra.a*.3,dash:[4,6]}));
  // cookie badge
  if(t>2.2)pill(t>=18?'cookie: session=7f3a':t>=10?'cookie: server=A':'cookie: session=7f3a',U[0]+30,U[1]+56,{c:C.amber,z:11.5,a:V(t,2.2)});
  // 1. log in to A
  pk(t,.8,1.1,to('A'),C.blue,{label:'POST /login'});if(t>1.9&&t<10)pill('in memory: session 7f3a',S.A[0]+90,S.A[1]-44,{c:C.green,z:11.5,a:V(t,1.9,9.6)});
  pk(t,2.2,1,back('A'),C.green,{label:'welcome!'});
  // 2. round robin → B, which does not know you
  pk(t,5.4,1.1,to('B'),C.blue,{label:'GET /cart'});if(t>6.5&&t<10)pill('who are you?',S.B[0]+90,S.B[1]-44,{c:C.red,z:12,a:V(t,6.5,9.6)});
  pk(t,7,1,back('B'),C.red,{label:'401: log in again'});
  // 3. sticky sessions
  [10.6,12.6].forEach(s=>{pk(t,s,1,to('A'),C.blue,{r:5});pk(t,s+1.1,.9,back('A'),C.green,{r:5});});
  if(t>15&&t<18)pill('Server A died: its sessions are gone',S.A[0],S.A[1]-50,{c:C.red,z:12,a:V(t,15.1,17.8)});
  pk(t,15.6,1,to('B'),C.blue,{r:5});pk(t,16.7,.9,back('B'),C.red,{label:'log in again'});
  // 4. shared store
  pk(t,18.8,1,to('A'),C.blue,{label:'POST /login',r:5});pk(t,19.9,.7,look('A'),C.amber,{label:'save 7f3a'});pk(t,20.8,.9,back('A'),C.green,{r:5});
  if(t>20.6)pill('7f3a → {user: you, cart: 2 items}',RD[0],RD[1]+76,{c:C.accent,z:11.5,a:V(t,20.6)});
  [[24.4,'B'],[26.6,'C'],[30.4,'C']].forEach(([s,k])=>{pk(t,s,1,to(k),C.blue,{r:5});pk(t,s+1,.5,look(k),C.amber,{r:4});pk(t,s+1.5,.5,rev(look(k)),C.green,{r:4});pk(t,s+2,.9,back(k),C.green,{r:5});});
  if(t>25.5&&t<29)pill('any server can find your session',RD[0],RD[1]-78,{c:C.green,z:12,a:V(t,25.5,28.8)});
  if(t>32.3)pill('still logged in ✓',U[0]+10,U[1]-56,{c:C.green,z:12.5,a:V(t,32.3)});
}});})();
