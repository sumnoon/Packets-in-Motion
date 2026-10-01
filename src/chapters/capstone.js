/* ---------------- 22. CAPSTONE: URL SHORTENER ---------------- */
(function(){
  const AL='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const b62=n=>{let s='';while(n>0){s=AL[n%62]+s;n=Math.floor(n/62);}return s;};
  const ID=125000017,CODE=b62(ID);
  const U=[60,300],BOT=[60,470],DNS=[175,105],GW=[235,300],LB=[395,300],AP=[[560,195],[560,405]],CA=[760,105],D1=[730,300],D2=[870,300],QU=[730,475],AN=[890,475];
  const fwd=k=>[[78,300],[173,300],[297,300],[333,300],[457,300],[505,AP[k][1]]];
  const a2c=k=>[[615,AP[k][1]],[695,112]],a2d=k=>[[615,AP[k][1]],[686,300]],a2q=k=>[[615,AP[k][1]],[675,470]];
  // click simulation (hit path) 33.2 → 61
  const CL=[];for(let s=33.2;s<60.6;s+=.72){const i=CL.length;const k=s<46.3?(i%2):1;CL.push({s,k,ev:s>=40});}
  const EV=[];{let last=0;CL.forEach(c=>{if(!c.ev)return;const e=c.s+1.6+.5+.55;const take=Math.max(e+.4,last+.95);last=take;EV.push({e,take,k:c.k,s:c.s});});}
  const FLOOD=[];for(let s=51.3;s<54.8;s+=.14)FLOOD.push({s,ok:FLOOD.length<3});
ch({id:'capstone',group:'Capstone',title:'Capstone: Design a URL Shortener',dur:62,needs:['caching','sharding','unique-ids','queues-pubsub'],related:['rate-limiting','resilience','load-balancers'],
beats:[
[0,'The goal: long URL → short link','A URL shortener turns a long link into a short code, then redirects everyone who opens it. Clicks (reads) outnumber new links (writes) about 100 to 1.'],
[5,'Assemble the building blocks','DNS, an API gateway with rate limiting, a load balancer, two stateless app servers, a cache, a sharded database, and a queue for click analytics.'],
[12,'Write path: shorten a URL','POST the long URL. An app server takes a unique numeric id, encodes it in base62 to get a short code, and stores code → URL in the right shard.'],
[24,'Read path: first click (cache miss)','A visitor opens the short link. The app checks the cache, misses, reads the database, fills the cache and answers with a 301 redirect.'],
[33,'Popular link: cache hits','Every later click is served from memory. The database barely notices, even when a link goes viral.'],
[40,'Count clicks asynchronously','Each click drops a small event on a queue. An analytics worker counts them in the background, so redirects stay fast.'],
[46,'App server dies → traffic reroutes','App 1 fails its health check. The load balancer sends everything to App 2. Because the app servers are stateless, nothing is lost.'],
[51,'Abuse → rate limited','A bot floods the API. The gateway\'s token bucket lets a few through and rejects the rest with 429 before they reach the app servers.'],
[56,'Every chapter, one system','Each box you just watched is a chapter of this course, working together.']],
use:['Reads ≫ writes: cache aggressively and replicate for reads','Unique ids via a counter/ID service + base62 give short, collision-free codes','Shard by the short code; push analytics to a queue so the redirect path stays tiny'],
cons:['301 (permanent) redirects are cached by browsers: great for speed, but clicks go uncounted; 302 counts every click','Sequential ids are guessable, so add randomness if links must be private','Custom aliases, link expiry and abuse/malware checks add real complexity']
,draw(t){
  // intro
  if(t<5.2){const a=A(t,.3,4.6).a;
    pill('https://www.example.com/articles/2026/09/system-design-intro?ref=newsletter&utm=spring',500,230,{c:C.blue,z:13,f:MONO,a});
    const p=P(t,1.4,2.4);ln([[500,258],[500,258+44*p]],{c:C.dim,a,arrow:true});
    pill(`sho.rt/${CODE}`,500,330,{c:C.green,z:20,f:MONO,a:a*V(t,2.2)});
    tx('7 characters instead of 80+',500,372,{z:13,c:C.dim,a:a*V(t,3)});return;}
  const app1Dead=t>46.9;
  // links
  const L=(pts,t0,o={})=>ln(pts,{a:V(t,t0)*.5,...o});
  L([[78,300],[173,300]],5.8);L([[70,285],[130,122]],5.4,{dash:[4,5]});L([[297,300],[333,300]],6.4);
  AP.forEach((p,k)=>{L([[457,300],[505,p[1]]],7+k*.3,k===0&&app1Dead?{dash:[4,6]}:{});L(a2c(k),8);L(a2d(k),8.6);L([[615,p[1]],[826,300]],8.9);L(a2q(k),9.6);});
  L([[785,475],[832,475]],10);
  // nodes
  user(U[0],U[1],{label:'visitors',...A(t,5)});
  box(DNS[0],DNS[1],{label:'DNS',sub:'sho.rt → IP',w:110,h:52,...A(t,5.2)});
  box(GW[0],GW[1],{label:'API gateway',sub:'rate limit',w:124,...A(t,5.8),glow:t>51.3&&t<55.5});
  box(LB[0],LB[1],{label:'Load balancer',w:124,...A(t,6.4)});
  AP.forEach((p,k)=>server(p[0],p[1],{label:'App '+(k+1),sub:'stateless',w:110,...A(t,7+k*.3),st:k===0&&app1Dead?'fail':'ok'}));
  box(CA[0],CA[1],{label:'Cache',sub:'Redis · in memory',w:140,c:C.amber,...A(t,8)});
  db(D1[0],D1[1],{label:'Shard 1',w:88,h:74,...A(t,8.6)});db(D2[0],D2[1],{label:'Shard 2',w:88,h:74,...A(t,8.9)});
  box(QU[0],QU[1],{label:'Queue',sub:'click events',w:110,h:54,c:C.amber,...A(t,9.6)});
  server(AN[0],AN[1],{label:'Analytics',sub:'worker',w:116,h:56,...A(t,10)});
  // ---- write path
  pk(t,12.3,.6,[[70,285],[130,122]],C.blue,{label:'sho.rt?'});pk(t,12.95,.6,[[130,122],[70,285]],C.green,{r:5});
  pk(t,13.6,1.8,fwd(0),C.blue,{label:'POST /shorten',r:6.5});pop(t,14.1,GW[0],GW[1]-46,'✓ rate ok',C.green,{z:12,d:1});
  if(t>15.5&&t<23){const a=V(t,15.5,22.6);panel(455,86,210,58,{a});tx(`id = ${ID.toLocaleString()}`,560,104,{z:12.5,f:MONO,a});tx(`base62 → ${CODE}`,560,126,{z:13.5,f:MONO,wt:750,c:C.green,a:a*V(t,16.4)});}
  pk(t,17.6,.8,a2d(0),C.blue,{label:`INSERT ${CODE}`});ring(t,18.4,D1[0],D1[1],C.green,40);
  if(t>17.4&&t<20.4)pill(`hash(${CODE}) % 2 → shard 1`,800,392,{c:C.accent,z:12,a:V(t,17.5,20)});
  pk(t,18.6,.7,rev(a2d(0)),C.green,{r:5.5});pk(t,19.4,1.8,rev(fwd(0)),C.green,{label:`sho.rt/${CODE}`,r:6.5});
  if(t>21.2&&t<24)pill(`✓ sho.rt/${CODE}`,U[0]-20,U[1]-56,{c:C.green,z:12.5,al:'left',f:MONO,a:V(t,21.2,23.7)});
  // ---- read path (miss)
  pk(t,24.3,1.8,fwd(1),C.blue,{label:`GET /${CODE}`,r:6.5});pk(t,26.2,.6,a2c(1),C.blue,{r:5.5});pop(t,26.8,CA[0],CA[1]-44,'MISS',C.red,{d:1});
  pk(t,26.9,.6,rev(a2c(1)),C.red,{r:4.5});pk(t,27.6,.7,a2d(1),C.blue,{r:5.5});pk(t,28.4,.7,rev(a2d(1)),C.green,{r:5.5});
  pk(t,29.2,.6,a2c(1),C.amber,{label:'SET'});pk(t,29.3,1.8,rev(fwd(1)),C.green,{label:'301 → long URL',r:6.5});
  if(t>29.8)pill(`${CODE} → long URL`,CA[0],CA[1]+46,{c:C.amber,z:11.5,f:MONO,a:V(t,29.8)});
  if(t>31&&t<33.5)pill('≈ 25 ms',U[0]-20,U[1]-56,{c:C.blue,z:12.5,al:'left',a:V(t,31.1,33.2)});
  // ---- hits, analytics
  let hits=0;
  CL.forEach(c=>{const k=c.k;pk(t,c.s,1.6,fwd(k),C.blue,{r:5});pk(t,c.s+1.6,.5,a2c(k),C.blue,{r:4.5});
    if(t>=c.s+2.1)hits++;pop(t,c.s+2.1,CA[0]+2,CA[1]-44,'HIT',C.green,{d:.7,z:12});
    pk(t,c.s+2.15,.5,rev(a2c(k)),C.amber,{r:4.5});pk(t,c.s+2.7,1.6,rev(fwd(k)),C.green,{r:5});
    if(c.ev)pk(t,c.s+1.6+.5,.55,a2q(k),C.amber,{r:4.5});});
  if(t>33)pill(`hit rate ${Math.round(hits/(hits+1)*100)}%`,CA[0]+145,CA[1],{c:C.green,z:12.5,a:V(t,33.4)});
  let counted=0,inQ=0;EV.forEach(e=>{if(t>=e.e&&t<e.take)inQ++;if(t>=e.take+.45)counted++;pk(t,e.take,.45,[[785,475],[832,475]],C.blue,{r:4.5});});
  for(let k=0;k<Math.min(inQ,5);k++)dot(QU[0]-36+k*18,QU[1]-38,C.amber,5);
  if(t>40.4)pill(`clicks counted: ${counted}`,AN[0],AN[1]-50,{c:C.accent,z:12,a:V(t,40.6)});
  // ---- failure
  pk(t,46.4,.5,[[457,300],[505,AP[0][1]]],C.accent,{r:4,label:'health check'});pop(t,46.9,AP[0][0]-70,AP[0][1]-30,'✕ no reply',C.red,{d:1.2,z:12});
  if(t>47&&t<51)pill('App 1 removed · all traffic → App 2',LB[0]+20,396,{c:C.amber,z:12,a:V(t,47.2,50.7)});
  // ---- bot flood
  const ba=A(t,50.9,56.5);user(BOT[0],BOT[1],{label:'bot',c:C.red,...ba});
  if(ba.a>0)ln([[74,460],[190,322]],{a:ba.a*.5,c:hexA(C.red,.6)});
  FLOOD.forEach((f,fi)=>{pk(t,f.s,.55,[[74,460],[190,322]],C.red,{r:4.5});
    if(f.ok)pk(t,f.s+.55,1,[[297,300],[333,300],[457,300],[505,AP[1][1]]],C.blue,{r:4.5});
    else{if(fi%4===0)pop(t,f.s+.55,GW[0]-40,GW[1]+54,'429',C.red,{z:12,d:.7});drop(t,f.s+.55,190,322,{label:false,dx:-30});}});
  if(t>51.6&&t<56)pill('429 Too Many Requests',GW[0],392,{c:C.red,z:12.5,a:V(t,51.8,55.6)});
  // ---- chapter tags
  const TAGS=[[DNS[0],DNS[1]+44,'Ch 1'],[GW[0],GW[1]+48,'Ch 4 · 6'],[LB[0],LB[1]+48,'Ch 3 · 17'],[AP[0][0],AP[0][1]-50,'Ch 2 · 16'],[AP[1][0],AP[1][1]+50,'Ch 2 · 19'],[CA[0]-106,CA[1],'Ch 5 · 11'],[800,356,'Ch 7 – 10'],[QU[0],QU[1]+48,'Ch 14 · 15'],[AN[0],AN[1]+48,'Ch 21']];
  TAGS.forEach(([x,y,s],i)=>pill(s,x,y,{c:C.accent,z:12,a:V(t,56.3+i*.25),wt:700}));
}});})();
