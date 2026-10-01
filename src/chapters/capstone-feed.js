/* ---------------- 24. CAPSTONE: NEWS FEED ---------------- */
(function(){
const ANA=[70,140],BEN=[70,300],STAR=[70,460],PS=[245,140],FS=[245,300],PDB=[440,70],GR=[620,70],Q=[455,225],WK=[640,225],FC=[845,190],PC=[455,345];
const a2ps=[[ANA[0]+16,ANA[1]],[PS[0]-60,PS[1]]],s2ps=[[STAR[0]+18,STAR[1]-8],[PS[0]-40,PS[1]+28]],b2fs=[[BEN[0]+16,BEN[1]],[FS[0]-60,FS[1]]];
const ps2db=[[PS[0]+60,PS[1]-12],[PDB[0]-46,PDB[1]+8]],ps2q=[[PS[0]+60,PS[1]+12],[Q[0]-60,Q[1]]],q2wk=[[Q[0]+60,Q[1]],[WK[0]-58,WK[1]]],wk2gr=[[WK[0],WK[1]-28],[GR[0],GR[1]+36]],wk2fc=[[WK[0]+58,WK[1]],[FC[0]-90,FC[1]]];
const fs2gr=[[FS[0]+60,FS[1]-20],[GR[0]-46,GR[1]+20]],fs2db=[[FS[0]+60,FS[1]-14],[PDB[0]-30,PDB[1]+34]],fs2fc=[[FS[0]+60,FS[1]-6],[FC[0]-90,FC[1]+14]],fs2pc=[[FS[0]+60,FS[1]+10],[PC[0]-64,PC[1]]];
// Ben's precomputed feed: post ids, newest first
const FEED=t=>t<16.6?['p88','p85','p80','p77']:['p91','p88','p85','p80'];
ch({id:'capstone-feed',group:'Capstone',title:'Capstone: Design a News Feed',dur:58,needs:['caching','queues-pubsub','hot-keys'],related:['capstone','capstone-chat','backpressure'],
beats:[
[0,'The goal: a fast home feed','Show each person the newest posts from everyone they follow, in well under a second. Feeds are read about a hundred times more often than people post.'],
[5,'Fan-out on read','Build the feed when someone opens the app: look up who they follow, fetch each account\'s recent posts and merge them. Posting is cheap, but every feed load does hundreds of queries.'],
[13,'Fan-out on write','Flip it: when Ana posts, a worker adds the post id to each follower\'s precomputed feed, a short list in a cache. Opening the feed becomes one fast lookup.'],
[21,'The celebrity problem','A star with 30 million followers posts. Fan-out on write now means 30 million cache writes for a single post, and the queue backs up for minutes.'],
[28,'Hybrid: push for most, pull for stars','Fan out on write for ordinary accounts. For the few huge ones, skip the fan-out and merge their latest posts in when the feed is read.'],
[36,'Rank, fill in, cache','The feed service merges both sources, ranks by recency and engagement, swaps ids for full posts, and caches the first page.'],
[44,'Survive the spike','A big event: everyone opens the app at once. Precomputed feeds and cached pages answer almost every request, and the database stays calm.'],
[50,'Every chapter, one system','Queues, caches, sharding, hot keys and back-pressure: the same building blocks as before, arranged for a read-heavy feed.']],
use:['Precompute what is read often; compute at read time what is too big to precompute','A queue between posting and fan-out absorbs bursts and lets workers catch up','Treat very large accounts (hot keys) as a special case, not the common path'],
cons:['Fan-out on write spends storage on feeds nobody opens; cap their length and expire inactive users','Hybrid feeds need two code paths and a merge step','Ranking models add latency: cache pages, and rank in the background where you can'],
draw(t){
  if(t<5.2){const a=V(t,.3,4.8);draw(500,280,{a},()=>{rr(-150,-160,300,320,22);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=2;g.stroke();});
    tx('Home',500,148,{z:14,wt:750,a});[['Ana · just now','new trail photos'],['Dev · 4 min','shipping v2 today'],['Star · 10 min','new album out!']].forEach(([h,b],k)=>{const y=200+k*72,v=a*V(t,.8+k*.6);
      draw(500,y,{a:v},()=>{rr(-125,-28,250,56,10);g.fillStyle=C.panel2;g.fill();});tx(h,390,y-10,{z:12,c:C.dim,al:'left',a:v});tx(b,390,y+10,{z:14,wt:650,al:'left',a:v});});
    pill('reads ≈ 100 × posts',500,470,{c:C.accent,z:13,a:a*V(t,2.8)});return;}
  const L=(pts,t0,o={})=>ln(pts,{a:V(t,t0)*.38,...o});
  L(a2ps,5.4);L(b2fs,5.4);L(s2ps,5.4);L(ps2db,5.8);L(ps2q,6.4);L(q2wk,6.8);L(wk2gr,7);L(wk2fc,7.2);L(fs2gr,5.8);L(fs2db,5.8);L(fs2fc,7.2);L(fs2pc,7.6);
  user(ANA[0],ANA[1],{label:'Ana · 200 followers',...A(t,5.2)});user(BEN[0],BEN[1],{label:'Ben · reads',c:C.green,...A(t,5.3)});user(STAR[0],STAR[1],{label:'Star · 30 M followers',c:C.amber,r:18,...A(t,5.4)});
  server(PS[0],PS[1],{label:'Post service',w:120,h:54,...A(t,5.6)});server(FS[0],FS[1],{label:'Feed service',sub:'merge · rank',w:120,h:54,...A(t,5.7)});
  db(PDB[0],PDB[1],{label:'Posts',sub:'sharded',w:92,h:70,...A(t,5.8)});db(GR[0],GR[1],{label:'Follows',sub:'graph',w:92,h:70,...A(t,6)});
  const backlog=t>=22.2&&t<28.2?Math.min(30e6,Math.floor((t-22.2)*6e6)):0;
  box(Q[0],Q[1],{label:'Fan-out queue',sub:backlog?`${(backlog/1e6).toFixed(0)} M waiting`:'',c:backlog?C.red:C.amber,w:130,h:52,glow:backlog>0,...A(t,6.4)});
  server(WK[0],WK[1],{label:'Workers',sub:'fan-out',w:110,h:52,st:backlog?'hot':'ok',...A(t,6.8)});
  // feed cache: one short list per follower
  const fa=A(t,7.2);box(FC[0],FC[1]-62,{label:'Feed cache',sub:'a list per user',c:C.green,w:180,h:48,...fa});
  if(fa.a>0)draw(FC[0],FC[1]+18,{a:fa.a},()=>{rr(-90,-36,180,94,10);g.fillStyle=C.panel;g.fill();g.strokeStyle=hexA(C.green,.6);g.lineWidth=1.5;g.stroke();});
  tx('feed:ben',FC[0]-78,FC[1]-6,{z:11.5,f:MONO,c:C.dim,al:'left',a:fa.a});FEED(t).forEach((id,i)=>pill(id,FC[0]-56+i*38,FC[1]+22,{c:id==='p91'&&t<21?C.amber:C.green,z:11,f:MONO,a:fa.a}));
  box(PC[0],PC[1],{label:'Page cache',sub:'first page, ranked',c:C.accent,w:128,h:50,...A(t,36.4)});
  // 5–13: fan-out on read
  if(t>5.6&&t<13){pk(t,5.8,.8,b2fs,C.green,{label:'open feed'});pk(t,6.7,.7,fs2gr,C.blue,{label:'Ben follows 300'});pk(t,7.4,.7,rev(fs2gr),C.blue,{r:4});
    each(t,8.1,10.3,.1,.8,(i,s)=>pk(t,s,.7,fs2db,C.blue,{r:3.2}));each(t,8.8,11,.1,.8,(i,s)=>pk(t,s,.7,rev(fs2db),C.green,{r:3.2}));
    pk(t,11.2,.9,rev(b2fs),C.green,{label:'feed · 820 ms'});if(t>8.4)pill('300 queries for one feed load',PDB[0]+70,PDB[1]+62,{c:C.red,z:12,a:V(t,8.4,12.8)});}
  // 13–21: fan-out on write
  pk(t,13.4,.8,a2ps,C.blue,{label:'post p91'});pk(t,14.2,.6,ps2db,C.amber,{r:4.5});pk(t,14.4,.7,ps2q,C.amber,{label:'fan out p91'});pk(t,15.1,.5,q2wk,C.amber,{r:4.5});
  pk(t,15.6,.5,wk2gr,C.blue,{label:'Ana\'s 200 followers'});each(t,16,16.8,.08,.6,(i,s)=>pk(t,s,.5,wk2fc,C.green,{r:3}));
  pk(t,18.2,.7,b2fs,C.green,{label:'open feed'});pk(t,18.9,.5,fs2fc,C.green,{r:4.5});pk(t,19.4,.5,rev(fs2fc),C.green,{r:4.5});pk(t,19.9,.8,rev(b2fs),C.green,{label:'feed · 30 ms'});
  // 21–28: the star posts, the queue drowns
  pk(t,21.4,.8,s2ps,C.amber,{label:'new album out!'});pk(t,22.2,.7,ps2q,C.red,{label:'fan out to 30 M'});
  each(t,22.9,27.8,.06,.5,(i,s)=>pk(t,s,.45,wk2fc,C.red,{r:2.8}));
  if(t>23&&t<28)pill('Ana\'s next post waits behind 30 M writes',Q[0]+90,Q[1]+60,{c:C.red,z:12,a:V(t,23,27.8)});
  // 28–36: hybrid
  if(t>28.4&&t<36)pill('stars: no fan-out',PS[0],PS[1]-50,{c:C.amber,z:12,a:V(t,28.4,35.8)});
  pk(t,28.8,.8,s2ps,C.amber,{label:'next post'});pk(t,29.6,.6,ps2db,C.amber,{label:'store only'});
  pk(t,30.8,.7,b2fs,C.green,{label:'open feed'});pk(t,31.5,.5,fs2fc,C.green,{label:'precomputed'});pk(t,31.5,.6,fs2db,C.amber,{label:'+ Star\'s latest'});
  pk(t,32.2,.5,rev(fs2fc),C.green,{r:4.5});pk(t,32.2,.6,rev(fs2db),C.amber,{r:4.5});pk(t,33,.8,rev(b2fs),C.green,{label:'merged · 45 ms'});
  if(t>33.8&&t<36)pill('push for most accounts, pull for the 0.01%',W/2,520,{c:C.green,z:12.5,a:V(t,33.8,35.8)});
  // 36–44: rank, hydrate, cache the page
  if(t>36.2&&t<44){const a=V(t,36.6,43.8);draw(FS[0],FS[1]+110,{a},()=>{rr(-110,-44,220,88,10);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=1.2;g.stroke();});
    const order=t<38.6?['p91','Star p95','p88','p85']:['Star p95','p91','p85','p88'];order.forEach((s,i)=>tx(`${i+1}. ${s}`,FS[0]-96,FS[1]+80+i*18,{z:12,f:MONO,al:'left',c:s.startsWith('Star')?C.amber:C.text,a}));
    tx(t<38.6?'merge':'rank: recent + engaging',FS[0]+20,FS[1]+80,{z:11.5,c:C.dim,al:'left',a});
    pk(t,39.6,.7,fs2db,C.blue,{label:'ids → posts'});pk(t,40.3,.7,rev(fs2db),C.green,{r:4.5});pk(t,41.2,.6,fs2pc,C.accent,{label:'cache page 1'});}
  // 44–50: the spike
  if(t>44.2&&t<50){const a=V(t,44.2,49.8);
    each(t,44.4,49.6,.05,.9,(i,s)=>{const y=260+((i*37)%9)*10;pk(t,s,.45,[[BEN[0]+16,y],[FS[0]-60,FS[1]]],C.green,{r:3,a});pk(t,s+.45,.35,fs2pc,C.accent,{r:3,a});});
    pill('feed loads ×20 · page cache hits 97% · database calm',W/2,520,{c:C.green,z:12.5,a});meter(PDB[0]-46,PDB[1]+42,92,6,.12,C.green);}
  // chapter tags
  const n=id=>chapters.findIndex(c=>c.id===id)+1,ns=(...ids)=>'Ch '+ids.map(n).join(' · ');
  [[Q[0],Q[1]+44,ns('queues-pubsub','backpressure')],[WK[0],WK[1]+44,ns('autoscaling')],[FC[0],FC[1]+86,ns('caching','hot-keys')],[PDB[0]-90,PDB[1],ns('sharding')],
   [GR[0]+80,GR[1],ns('sql-nosql')],[FS[0],FS[1]+44,ns('search')],[PC[0],PC[1]+44,ns('cache-invalidation')],[STAR[0]+120,STAR[1],ns('hot-keys')]]
    .forEach(([x,y,s],i)=>pill(s,x,y,{c:C.accent,z:12,a:V(t,50.4+i*.3),wt:700}));
}});})();
