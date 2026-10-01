/* ---------------- 11c. HOT KEYS & REQUEST COALESCING ---------------- */
(function(){
const UX=80,UY=k=>110+k*48,AP=[330,300],CA=[590,160],DB=[840,360];
const miss=[[AP[0]+56,AP[1]+10],[DB[0]-56,DB[1]]];
ch({id:'hot-keys',group:'Data',title:'Hot Keys & Request Coalescing',dur:34,needs:['caching'],related:['sharding','rate-limiting','backpressure'],
beats:[
[0,'One key, a million readers','A celebrity posts. Everyone asks for the same key at once: post:42. The cache serves it easily…'],
[5,'…until it expires','The cached copy of post:42 expires, and in that instant thousands of requests miss the cache together.'],
[8.5,'Cache stampede','Every miss goes to the database for the same row. It drowns in identical queries, gets slow, and everything times out.'],
[15,'Coalescing: one fetch, many waiters','Rewind. This time, the first miss fetches from the database and every other request for post:42 waits for that one answer.'],
[21.5,'One answer for everyone','One query comes back, the cache refills, and all the waiting requests are answered together. The database barely notices.'],
[27.5,'Extra care for the hottest keys','Refresh very hot keys before they expire, and keep copies on several cache nodes, so no single node takes all the traffic.']],
use:['Viral posts, flash sales, live scores: a few keys get most traffic','Any cache with expiring entries under heavy load','Expensive queries that many users need at once'],
cons:['Waiters pause for the first fetch (usually a few ms)','Needs a per-key lock or single-flight map in the app','Refresh-ahead spends work on keys that might go cold'],
draw(t){
  for(let k=0;k<8;k++)user(UX,UY(k),{r:11,c:C.blue,...A(t,.1+k*.04)});tx('fans',UX,UY(7)+34,{z:12,c:C.dim,a:V(t,.5)});
  server(AP[0],AP[1],{label:'App',sub:t>=15&&t<27.5?'coalescing on':'',w:118,...A(t,.3)});
  const reps=t>=27.8?3:1;for(let r=0;r<reps;r++){const y=CA[1]+(reps>1?(r-1)*96:0),x=CA[0]+(reps>1?(r-1)*14:0);
    const valid=(t<6||(t>=12.5&&t<16.2)||t>=22.6),refreshing=t>=30&&t<31;box(x,y,{label:reps>1?`cache ${r+1}`:'Cache',sub:valid?'post:42 ✓':'post:42 expired',c:valid?C.green:C.red,w:136,h:52,glow:refreshing,...A(t,.4)});}
  const stamp=t>=8.5&&t<15,dbLoad=stamp?clamp((t-8.5)/1.2):t>=17&&t<22.5?.08:.02;
  db(DB[0],DB[1],{label:'Database',sub:stamp?'overloaded':'',w:120,h:90,st:stamp?'fail':'ok',down:'SWAMPED',...A(t,.5)});
  meter(DB[0]-60,DB[1]+56,120,8,dbLoad,dbLoad>.8?C.red:C.green);tx(`${Math.round(dbLoad*100)}% busy`,DB[0],DB[1]+78,{z:11.5,c:C.dim,f:MONO,a:V(t,.8)});
  // steady hits
  const hitting=t<6||(t>=12.5&&t<16.2)||t>=22.6;
  each(t,.5,34,.12,1.1,(i,s)=>{const valid=s<6||(s>=12.5&&s<16.2)||s>=22.6;if(!valid)return;const k=i%8,c=t>=27.8?CA[1]+((i%3)-1)*96:CA[1];
    pk(t,s,.5,[[UX+14,UY(k)],[AP[0]-56,AP[1]],[CA[0]-68,c]],C.blue,{r:3.5});pk(t,s+.5,.5,[[CA[0]-68,c],[AP[0]-56,AP[1]-10],[UX+14,UY(k)]],C.green,{r:3.5});});
  // stampede: every miss hits the DB
  each(t,6.2,12,.07,1,(i,s)=>{pk(t,s,.8,miss,C.red,{r:3.5});});
  if(t>6&&t<8.5)pill('expired!',CA[0],CA[1]-50,{c:C.red,z:12.5,a:V(t,6,8.3)});
  if(t>9&&t<15)pill('same query ×4,000',DB[0],DB[1]-66,{c:C.red,z:12,a:V(t,9,14.7)});
  if(t>15&&t<16.4)pill('↺ rewind, now with coalescing',AP[0],AP[1]-70,{c:C.accent,z:12.5});
  // coalescing: one fetch; everyone else queues at the app
  pk(t,16.4,1,miss,C.amber,{label:'1 query'});pk(t,21.4,.9,rev(miss),C.green,{label:'post:42'});pk(t,22.1,.6,[[AP[0]+56,AP[1]-20],[CA[0]-68,CA[1]]],C.green,{label:'refill'});
  const waiting=t>=16.3&&t<22.3?Math.min(4000,Math.floor((t-16.3)*700)):0;
  if(waiting>0){for(let i=0;i<Math.min(24,Math.floor(waiting/150)+1);i++)dot(AP[0]-44+(i%8)*12,AP[1]+48+Math.floor(i/8)*12,C.amber,3.5);pill(`${waiting.toLocaleString()} waiting on 1 fetch`,AP[0],AP[1]+100,{c:C.amber,z:12});}
  each(t,22.3,23.2,.05,1,(i,s)=>{const k=i%8;pk(t,s,.6,[[AP[0]-56,AP[1]],[UX+14,UY(k)]],C.green,{r:3.5});});
  if(t>22.6&&t<27.5)pill('answered together ✓',AP[0],AP[1]+100,{c:C.green,z:12.5,a:V(t,22.6,27.3)});
  if(t>28.4)pill('refresh ahead: renew before it expires',CA[0]-10,480,{c:C.accent,z:12,a:V(t,28.4)});
  if(t>29.2)pill('copies on 3 nodes: spread the load',CA[0]-10,516,{c:C.accent,z:12,a:V(t,29.2)});
}});})();
