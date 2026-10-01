/* ---------------- A4. BACK-PRESSURE & LOAD SHEDDING ---------------- */
(function(){
const PR=[150,290],QU=[470,290],DB=[810,290];
ch({id:'backpressure',group:'Advanced',title:'Back-Pressure & Load Shedding',dur:36,needs:['queues-pubsub','rate-limiting'],related:['autoscaling','timeouts','hot-keys'],
beats:[
[0,'A fast producer, a slow consumer','The API receives 300 requests/s, but the database can only handle 200/s. The extra 100 every second has to go somewhere.'],
[5,'An unbounded queue delays the crash','Requests pile up in memory. Everyone waits longer and longer, until memory runs out and the whole service falls over.'],
[12,'Bound the queue','Give the buffer a limit. When it is full, new requests are refused at once with "try again later" instead of waiting forever.'],
[18,'Back-pressure: slow the sender','The consumer signals "I\'m full" and the producer slows to 200/s, the speed the database can actually handle. Everything flows steadily.'],
[25,'Load shedding: drop the least important','Overloaded anyway? Drop low-priority work (analytics, recommendations) so the important requests (checkout) always get through.'],
[31,'Degrade gracefully','Customers can still pay; they just see fewer recommendations for a while. A partial service beats a total outage.']],
use:['Any pipeline where one stage is slower than the one feeding it','Protecting the critical path (login, checkout) during spikes','Streaming systems: Kafka consumers, reactive streams, TCP itself'],
cons:['Refused and shed requests are real failures that some users will notice','You must decide priorities before the incident, not during it','Back-pressure has to reach all the way to the source to help'],
draw(t){
  const bp=t>=18.6,shed=t>=25.3,crash=t>=11&&t<12;
  server(PR[0],PR[1],{label:'API',sub:bp&&!shed?'200 req/s':'300 req/s',w:120,st:t<12||shed?'hot':'ok',...A(t,.2)});
  db(DB[0],DB[1],{label:'Database',sub:'200/s max',w:110,h:90,...A(t,.4)});
  // queue body
  const lvl=t<5?Math.min(4,t*.8):t<11?Math.min(60,4+(t-5)*9):t<12?0:t<18.6?8:3;
  const qw=t<11?Math.min(260,120+lvl*2.2):150;
  draw(QU[0],QU[1],A(t,.3),()=>{rr(-qw/2,-44,qw,88,12);g.fillStyle=crash?'#2a141a':C.panel;g.fill();g.strokeStyle=crash?C.red:t>=12&&t<18.6?C.amber:C.edge;g.lineWidth=2;g.stroke();
    const show=Math.min(lvl,t<11?60:8);for(let i=0;i<show;i++){const cx=-qw/2+14+(i%Math.floor((qw-20)/12))*12,cy=26-Math.floor(i/Math.floor((qw-20)/12))*12;dot(cx,cy,C.amber,4);}});
  tx(t<12?'queue (no limit)':'queue (limit 8)',QU[0],QU[1]-60,{z:12.5,c:C.dim,a:V(t,.5)});
  if(t>=5&&t<11)pill(`waiting: ${(lvl/200*1000*6).toFixed(0)} ms and rising`,QU[0],QU[1]+74,{c:C.red,z:12,a:V(t,6,10.8)});
  if(crash)pill('OUT OF MEMORY',QU[0],QU[1]-92,{c:C.red,z:13});
  // arrivals: 300/s (or 200/s under back-pressure); drawn at 1:30 scale
  const into=[[PR[0]+60,PR[1]],[QU[0]-qw/2,QU[1]]],out=[[QU[0]+qw/2,QU[1]],[DB[0]-56,DB[1]]];
  each(t,.6,35,bp&&!shed?.15:.1,.8,(i,s)=>{const kind=shed?(i%4===0?'checkout':i%4===1?'search':i%4===2?'recs':'analytics'):null;
    const refused=t>=12&&s<18.6&&i%3===0,drop=shed&&(kind==='recs'||kind==='analytics');
    pk(t,s,.6,drop?[into[0],[into[0][0]+120,into[0][1]]]:into,drop||refused?C.red:C.blue,{r:4,label:shed&&i%4===0&&i%12===0?'checkout':null});});
  each(t,.9,35,.15,.8,(i,s)=>{if(s>11&&s<12)return;pk(t,s,.6,out,C.green,{r:4});});
  if(t>12.4&&t<18.6)pill('full → 429 "try again later"',PR[0]+110,PR[1]-70,{c:C.amber,z:12,a:V(t,12.4,18.3)});
  pk(t,18.6,.9,[[QU[0]-60,QU[1]-50],[PR[0]+40,PR[1]-40]],C.amber,{label:'slow down!'});
  if(t>19.6&&t<25)pill('producer matches 200/s → steady flow',QU[0],QU[1]+74,{c:C.green,z:12.5,a:V(t,19.6,24.8)});
  // shedding
  if(shed){const sa=V(t,25.3);box(PR[0]+130,PR[1]-110,{label:'Shedder',sub:'drop low priority',c:C.amber,w:150,h:50,a:sa});
    [['checkout','kept',C.green],['search','kept',C.green],['recommendations','dropped',C.red],['analytics','dropped',C.red]].forEach(([n,s,c],k)=>pill(`${n}: ${s}`,PR[0]+60,PR[1]+90+k*32,{c,z:12,al:'left',a:sa*V(t,25.6+k*.3)}));}
  if(t>31.2){pill('checkout ✓ always works',DB[0],DB[1]+90,{c:C.green,z:12.5,a:V(t,31.2)});pill('"recommendations paused"',DB[0],DB[1]+124,{c:C.dim,z:12,a:V(t,31.6)});}
}});})();
