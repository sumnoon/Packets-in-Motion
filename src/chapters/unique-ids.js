/* ---------------- A3. UNIQUE IDS AT SCALE: SNOWFLAKE ---------------- */
(function(){
const SV=[[150,170],[150,300],[150,430]],DBP=[540,300];
const BAR={x:300,y:112,w:620};const F=[['timestamp (ms)',41,C.accent],['machine',10,C.amber],['sequence',12,C.green]];
const UU=['f47ac10b-58cc…','0b9e3a12-77d2…','c2e1d4a9-10fe…','7a03b5c8-9e44…','3d99ef01-b2a7…','9e5c7722-4f1b…'];
ch({id:'unique-ids',group:'Advanced',title:'Unique IDs at Scale: Snowflake IDs',dur:34,needs:['sharding'],related:['idempotency','capstone'],
beats:[
[0,'Every row needs a unique ID','Orders, posts, messages: each one needs an ID nobody else will ever get, even with hundreds of servers creating them at the same moment.'],
[5,'Auto-increment: one counter','One database hands out 1, 2, 3… Simple and ordered, but every server has to ask it, so it becomes a bottleneck and a single point of failure.'],
[11,'UUIDs: random, no coordination','Each server makes up a random 128-bit ID. No asking anyone, but the IDs are long and random, so they do not sort by time and they index poorly.'],
[17,'Snowflake: build the ID from parts','A 64-bit number made of three parts: the current time in milliseconds, the machine\'s number, and a counter within that millisecond.'],
[24,'Unique without asking anyone','Machine numbers never clash, and the counter separates IDs made in the same millisecond. Two servers can never produce the same ID.'],
[29,'Sorted by time for free','Time is the first part, so newer IDs are bigger numbers. Sorting by ID is almost the same as sorting by creation time.']],
use:['High-volume IDs across many servers (Twitter/X, Discord, Instagram)','When IDs should roughly sort by creation time (feeds, timelines)','Anywhere a central counter would become a bottleneck'],
cons:['Depends on clocks: a clock jumping backwards can create duplicates unless guarded','Machine numbers must be assigned uniquely','IDs reveal when they were created and hint at your volume'],
draw(t){
  SV.forEach(([x,y],k)=>server(x,y,{label:`Server ${k+1}`,sub:t>=17?`machine ${k+1}`:'',w:116,h:52,...A(t,.2+k*.1)}));
  // auto-increment
  const da=A(t,5.2,11);db(DBP[0],DBP[1],{label:'ID counter',sub:'next = 1045',w:110,h:90,...da});
  let n=0;each(t,5.6,10.2,.25,1.4,(i,s)=>{const k=i%3,p=[[SV[k][0]+58,SV[k][1]],[DBP[0]-56,DBP[1]]];pk(t,s,.6,p,C.blue,{r:4});pk(t,s+.8,.6,rev(p),C.green,{r:4,label:t<s+1.4?`${1041+i}`:null});});
  if(t>8.4&&t<11)pill('everyone waits on one box',DBP[0],DBP[1]+80,{c:C.red,z:12.5,a:V(t,8.4,10.8)});
  if(t>7.5&&t<11)spin(t,DBP[0],DBP[1]-66,{c:C.amber,a:V(t,7.5,10.8)});
  // uuids
  const ua=V(t,11.2,17);if(ua>0){UU.forEach((u,k)=>{const x=560+(k%2)*230,y=190+Math.floor(k/2)*70,on=t>11.5+k*.5;pill(u,x,y,{c:C.dim,z:12,f:MONO,a:ua*(on?1:0)});});
    if(t>14.3)pill('random order: newest is not last',675,440,{c:C.amber,z:12.5,a:ua*V(t,14.3)});}
  // snowflake layout
  const sa=A(t,17.3);if(sa.a>0){let x=BAR.x;F.forEach(([n,b,c],k)=>{const w=BAR.w*b/63;draw(0,0,{a:sa.a*V(t,17.5+k*.5)},()=>{rr(x,BAR.y-20,w-4,40,8);g.fillStyle=hexA(c,.18);g.fill();g.strokeStyle=c;g.lineWidth=1.8;g.stroke();});
      tx(`${n} · ${b} bits`,x+w/2,BAR.y+1,{z:12.5,wt:700,c,a:sa.a*V(t,17.5+k*.5)});x+=w;});tx('64-bit ID',BAR.x-12,BAR.y,{z:12,c:C.dim,al:'right',a:sa.a});}
  // each server builds IDs locally
  const IDS=[[0,20,'1727712000123','01','0000'],[1,20.6,'1727712000123','02','0000'],[2,21.2,'1727712000124','03','0000'],[0,21.8,'1727712000124','01','0001']];
  IDS.forEach(([k,s,ts,m,q],i)=>{if(t<s)return;const y=240+i*56,a=V(t,s);tx('→',SV[k][0]+80,SV[k][1],{z:16,c:C.dim,a:a*(t<s+1.2?1:0)});
    pill(ts,420,y,{c:C.accent,z:12,f:MONO,a});pill(m,560,y,{c:C.amber,z:12,f:MONO,a});pill(q,640,y,{c:C.green,z:12,f:MONO,a});tx(`from server ${k+1}`,700,y,{z:11.5,c:C.dim,al:'left',a});});
  if(t>24.2&&t<29)pill('same millisecond, different machine → different IDs',540,470,{c:C.green,z:12.5,a:V(t,24.2,28.8)});
  if(t>29.2)pill('bigger number = created later → sorts by time ✓',540,470,{c:C.green,z:12.5,a:V(t,29.2)});
  if(t>29.2){g.save();g.globalAlpha=V(t,29.4);ln([[790,240],[790,410]],{c:C.green,w:2,arrow:true});tx('newer',812,410,{z:11.5,c:C.green,al:'left'});g.restore();}
}});})();
