/* ---------------- 5. CDN & EDGE CACHING ---------------- */
(function(){
  const OR=[860,135],EA=[280,360],EB=[610,380];
  const UA=[[95,450],[180,505],[80,330]],UB=[[560,495],[690,500]];
  const oPath=(e)=>crv([e[0]+50,e[1]-20],[(e[0]+OR[0])/2,Math.min(e[1],OR[1])-70],[OR[0]-60,OR[1]+10]);
ch({id:'cdn',group:'Traffic',title:'CDNs & Edge Caching',dur:37,
beats:[
[0,'Far from the server = slow','A user in Tokyo loads a site hosted in Virginia. Every request crosses an ocean, about 200 ms each way, however fast the server is.'],
[7,'Put copies at the edge','A CDN runs edge servers in cities around the world. Users connect to the nearest one instead of the faraway origin.'],
[10,'First request: cache MISS','The edge doesn\'t have the file yet. It fetches it from the origin once, keeps a copy (amber) and passes it along.'],
[17,'Next requests: cache HIT','Nearby users now get the copy straight from the edge in about 15 ms, and the origin isn\'t touched. Each edge keeps its own copies.'],
[26,'Copies expire (TTL)','Every copy has a time-to-live. When it runs out, the next request fetches a fresh version from the origin. Short TTL = fresher; long TTL = faster.'],
[32.5,'Faster users, lighter origin','Static files (images, video, JS, CSS) are ideal for a CDN. Personalised or rapidly changing data usually still goes to the origin.']],
use:['Static assets: images, video, fonts, JS/CSS bundles, downloads','Global audiences where distance dominates latency','Absorbing traffic spikes and some attacks (DDoS) before they reach you'],
cons:['Stale content until the TTL expires or you purge the cache','Not useful for personalised, per-user responses','Extra cost and configuration; cache-key mistakes can leak or mix content'],
draw(t){
  // map-ish background labels
  tx('ASIA',150,250,{z:40,wt:800,c:'rgba(255,255,255,.035)'});tx('EUROPE',610,270,{z:40,wt:800,c:'rgba(255,255,255,.035)'});tx('US-EAST',860,250,{z:40,wt:800,c:'rgba(255,255,255,.035)'});
  const hitN=t>17?Math.min(9,Math.floor((t-17.6)/.8)+1):0;
  server(OR[0],OR[1],{label:'Origin',sub:'Virginia',...A(t,.3),w:118,load:null});
  UA.forEach((u,i)=>user(u[0],u[1],{...A(t,i===0?.2:7.4+i*.2),label:['Tokyo','Osaka','Seoul'][i],r:13}));
  UB.forEach((u,i)=>user(u[0],u[1],{...A(t,18+i*.3),label:['London','Paris'][i],r:13}));
  // beat 0: long trip
  const far=crv([UA[0][0]+14,UA[0][1]-8],[420,190],[OR[0]-60,OR[1]+10]);
  if(t<9){ln(far,{a:V(t,.4,8.3)*.7,dash:[5,6]});
    pk(t,.8,2.4,far,C.blue,{label:'GET logo.png'});pk(t,3.3,2.4,rev(far),C.green);
    const ms=Math.round(clamp((t-.8)/4.9)*420);pill(`${ms} ms`,UA[0][0]+50,UA[0][1]-40,{c:t>5.7?C.red:C.blue,a:V(t,.8,8.4),z:13});}
  // edges
  const eaA=A(t,7.2),ebA=A(t,7.6);
  const ttl=t<27.5?1-clamp((t-15.2)/(27.5-15.2)):0;
  const has=(t>15.1&&t<27.5)||t>30.6;
  const hasB=t>23;
  [[EA,eaA,'Edge · Tokyo',has],[EB,ebA,'Edge · London',hasB]].forEach(([e,a,l,h],i)=>{
    if(a.a>0)ln(oPath(e),{a:a.a*.35,dash:[3,6]});
    box(e[0],e[1],{label:l,sub:'CDN edge',w:130,...a,c:C.accent});
    if(h){draw(e[0]+80,e[1]-22,{a:a.a},()=>{rr(-12,-14,24,28,4);g.fillStyle=hexA(C.amber,.25);g.fill();g.strokeStyle=C.amber;g.lineWidth=1.6;g.stroke();});
      if(i===0&&t<27.6){g.save();g.strokeStyle=C.amber;g.lineWidth=2.5;g.beginPath();g.arc(e[0]+80,e[1]-22,21,-Math.PI/2,-Math.PI/2+Math.PI*2*ttl);g.stroke();g.restore();}
      tx('copy',e[0]+80,e[1]+14,{z:10.5,c:C.amber});}
  });
  if(t>18&&t<27.5)tx('TTL',EA[0]+106,EA[1]-40,{z:11,c:C.amber,a:V(t,18.5,27)});
  if(t>27.4&&t<29.2)pill('expired',EA[0]+80,EA[1]-56,{c:C.red,z:11,a:V(t,27.4,28.8)});
  // user->edge links
  UA.forEach((u,i)=>{if(i===0?t>7:t>7.4+i*.2)ln([[u[0],u[1]],EA],{a:.3});});
  UB.forEach((u,i)=>{if(t>18+i*.3)ln([[u[0],u[1]],EB],{a:.3});});
  // miss sequence (generic)
  const miss=(t0,u,e,lbl)=>{const toE=[[u[0]+10,u[1]-8],[e[0]-20,e[1]+22]];
    pk(t,t0,.6,toE,C.blue,{label:lbl});pop(t,t0+.6,e[0],e[1]-42,'MISS',C.red,{d:1.2});
    pk(t,t0+.7,1.6,oPath(e),C.blue);pk(t,t0+2.4,1.6,rev(oPath(e)),C.green);pk(t,t0+4.1,.6,rev(toE),C.green);};
  miss(10.3,UA[1],EA,'logo.png?');
  if(t>10.3&&t<17)pill(t<14.7?'…':'440 ms (miss)',UA[1][0]+64,UA[1][1]-2,{c:C.amber,z:12,a:V(t,14.8,16.8)});
  miss(19.2,UB[0],EB,null);
  miss(28.2,UA[2],EA,'logo.png?');
  // hits
  each(t,17.6,25.9,.8,1.3,(i,s)=>{const u=UA[i%3],toE=[[u[0]+10,u[1]-8],[EA[0]-20,EA[1]+22]];pk(t,s,.55,toE,C.blue,{r:5});pop(t,s+.55,EA[0]-8,EA[1]-42,'HIT',C.green,{d:.8,z:13});pk(t,s+.6,.55,rev(toE),C.amber,{r:5});});
  each(t,24.4,26,.8,1.3,(i,s)=>{const u=UB[i%2],toE=[[u[0],u[1]-12],[EB[0],EB[1]+28]];pk(t,s,.55,toE,C.blue,{r:5});pk(t,s+.6,.55,rev(toE),C.amber,{r:5});});
  if(t>17.4&&t<27.8)pill('15 ms (hit)',UA[1][0]+64,UA[1][1]-2,{c:C.green,z:12,a:V(t,18.2,27.4)});
  // stats
  if(t>10){const total=hitN+1;const hr=Math.round(hitN/total*100);const oReq=t<19.9?1:t<28.9?2:3;
    panel(735,245,240,92,{a:V(t,10.4)});
    tx('Tokyo edge hit rate',751,270,{z:12.5,al:'left',c:C.dim,a:V(t,10.4)});tx(`${hr}%`,960,270,{z:18,wt:750,al:'right',c:C.green,f:MONO,a:V(t,10.4)});
    tx('requests reaching origin',751,312,{z:12.5,al:'left',c:C.dim,a:V(t,10.4)});tx(`${t<11?0:oReq}`,960,312,{z:18,wt:750,al:'right',c:C.text,f:MONO,a:V(t,10.4)});}
  if(t>32.5){pill('✓ users served from ~15 ms away',330,95,{c:C.green,a:V(t,32.8)});pill('✓ origin handles a fraction of traffic',630,95,{c:C.green,a:V(t,33.6)});}
}});})();
