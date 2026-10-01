/* ---------------- 11b. CACHE EXPIRY & INVALIDATION ---------------- */
(function(){
const AP=[170,330],CA=[500,170],DB=[820,330],AD=[820,110];
const toC=[[AP[0]+56,AP[1]-24],[CA[0]-90,CA[1]]],toD=[[AP[0]+56,AP[1]],[DB[0]-56,DB[1]]],fill=[[DB[0]-40,DB[1]-44],[CA[0]+90,CA[1]]];
const price=t=>t<13.5?20:t<19?25:t<27?30:35;
// the cached copy: [value, filledAt, ttl] or null
function entry(t){if(t<3.8)return null;if(t<11)return[20,3.8,7.2];if(t<13.6)return null;if(t<19.2)return[20,13.6,8];if(t<23.2)return null;if(t<27.2)return[30,23.2,8];if(t<29)return null;if(t<36.2)return[30,29,7.2];if(t<38.8)return null;return[35,38.8,8];}
ch({id:'cache-invalidation',group:'Data',title:'Cache Expiry (TTL) & Invalidation',dur:40,
beats:[
[0,'A cache is a copy','The app caches a product\'s price so it does not ask the database every time. But a copy can fall out of date.'],
[5,'TTL: copies expire','Each cached item gets a time to live, here 8 seconds. When it expires, the next read goes to the database and refreshes the copy.'],
[11.5,'Stale until it expires','The price changes to $25 in the database, but the cache keeps serving $20 until the TTL runs out. Short TTL = fresher; long TTL = fewer database reads.'],
[18.5,'Invalidate on write','Better: when the price is written, delete the cached copy at the same moment. The next read fetches the new price.'],
[25,'The race: a slow read refills old data','A slow read fetched $30 just before the write to $35, then stores it just after the delete. The cache is stale again.'],
[32,'Belt and braces','Delete on write, and keep a TTL as a safety net. Any stale copy that sneaks in still expires, and the next read gets $35.']],
use:['Any cache in front of data that changes','Short TTLs for prices and stock, long TTLs for rarely changing data','Delete-on-write when correctness matters'],
cons:['A TTL alone always serves some stale reads','Invalidation needs every writer to remember to delete','Races can still leave stale data: keep a TTL anyway'],
draw(t){
  server(AP[0],AP[1],{label:'App',w:112,...A(t,.2)});db(DB[0],DB[1],{label:'Database',sub:`price $${price(t)}`,w:120,h:90,st:t>13.4&&t<14.4||t>19&&t<20||t>27&&t<28?'good':'ok',...A(t,.4)});
  ln(toD,{a:V(t,.5)*.3});ln(toC,{a:V(t,.5)*.3});
  const e=entry(t),ca=A(t,.3);draw(CA[0],CA[1],ca,()=>{rr(-90,-50,180,100,14);g.fillStyle=C.panel;g.fill();g.strokeStyle=e&&e[0]!==price(t)?C.red:C.amber;g.lineWidth=2;g.stroke();});
  if(ca.a>0){tx('Cache',CA[0],CA[1]-66,{z:13,c:C.dim});
    if(e){const left=clamp(1-(t-e[1])/e[2]),stale=e[0]!==price(t);tx(`price: $${e[0]}`,CA[0],CA[1]-8,{z:20,wt:800,c:stale?C.red:C.text,f:MONO});
      g.save();g.strokeStyle=C.line;g.lineWidth=5;g.beginPath();g.arc(CA[0]+62,CA[1]+26,12,0,7);g.stroke();g.strokeStyle=left<.25?C.red:C.amber;g.beginPath();g.arc(CA[0]+62,CA[1]+26,12,-Math.PI/2,-Math.PI/2+6.283*left);g.stroke();g.restore();
      tx(`TTL ${Math.ceil(left*e[2])}s`,CA[0]-10,CA[1]+26,{z:12,c:C.dim,f:MONO});if(stale)pill('STALE',CA[0],CA[1]+72,{c:C.red,z:12});}
    else tx('(empty)',CA[0],CA[1],{z:15,c:C.faint});}
  // reads: [time, hit?]
  const read=(s,hit,v)=>{if(hit){pk(t,s,.6,toC,C.blue,{r:4.5});pk(t,s+.6,.6,rev(toC),v!==price(s+.6)?C.red:C.green,{r:4.5,label:`$${v}`});}
    else{pk(t,s,.6,toC,C.blue,{r:4.5});pk(t,s+.6,.9,toD,C.amber,{r:4.5,label:'miss → DB'});pk(t,s+1.5,.8,fill,C.green,{r:4.5,label:`fill $${v}`});}};
  read(1.5,false,20);read(6,true,20);read(8.4,true,20);read(11.3,false,20);read(15,true,20);read(16.8,true,20);read(20.9,false,30);read(33,true,30);read(36.5,false,35);
  if(t>10.8&&t<11.8)pill('expired',CA[0],CA[1]+72,{c:C.amber,z:12});
  // writes
  const wr=(s,v,del)=>{pk(t,s,.9,[[AD[0]-60,AD[1]],[DB[0],DB[1]-46]],C.accent,{label:`SET price = $${v}`});if(del)pk(t,s+.2,.8,[[AD[0]-60,AD[1]-10],[CA[0]+90,CA[1]-20]],C.red,{label:'DELETE cache'});};
  box(AD[0],AD[1],{label:'Admin',sub:'edits prices',w:120,h:48,...A(t,11.6)});wr(12.6,25,false);wr(18.2,30,true);wr(26.2,35,true);
  // the slow reader
  const sr=[AP[0]+10,AP[1]+90];if(t>25&&t<30.5){dot(sr[0],sr[1],C.amber,5,V(t,25,30.3));tx('slow read',sr[0],sr[1]+20,{z:11.5,c:C.amber,a:V(t,25,30.3)});}
  pk(t,25.4,.8,[sr,[DB[0]-56,DB[1]+30]],C.amber,{r:4,label:'reads $30'});pk(t,28.1,.9,[[DB[0]-56,DB[1]+10],[CA[0]+70,CA[1]+46]],C.amber,{r:4,label:'stores $30 (late!)'});
  if(t>31.5&&t<36.2)pill('the TTL will clean this up',CA[0],CA[1]-100,{c:C.accent,z:12,a:V(t,32.5,36)});
  if(t>38.9)pill('fresh again: $35 ✓',CA[0],CA[1]-100,{c:C.green,z:12.5,a:V(t,36.4)});
}});})();
