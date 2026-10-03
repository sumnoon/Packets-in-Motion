/* ---------------- A3. UNIQUE IDS AT SCALE: SNOWFLAKE ---------------- */
(function(){
const SV=[[150,170],[150,300],[150,430]],DBP=[540,300];
const BAR={x:300,y:112,w:620};const F=[['timestamp (ms)',41,C.accent],['machine',10,C.amber],['sequence',12,C.green]];
const UU=['f47ac10b-58cc…','0b9e3a12-77d2…','c2e1d4a9-10fe…','7a03b5c8-9e44…','3d99ef01-b2a7…','9e5c7722-4f1b…'];
ch({id:'unique-ids',group:'Advanced',title:'Unique IDs at Scale: UUIDs & Snowflake',dur:40,needs:['sharding'],related:['idempotency','capstone'],
beats:[
[0,'Every row needs a unique ID','Orders, posts, messages: each one needs an ID nobody else will ever get, even with hundreds of servers creating them at the same moment.'],
[5,'Auto-increment allows gaps','A database sequence supplies distinct numbers, but rollbacks can leave gaps. Gapless invoice numbering needs a separate serialized, transactional allocator and an audit trail, including cancelled invoices.'],
[11,'UUIDv4: random, no coordination','UUIDv4 uses random bits in a 128-bit ID. Independent generators need no central counter; IDs do not sort by creation time. Secure randomness limits guessing, but never replaces authorization.'],
[16,'UUIDv7: timestamp first','UUIDv7 puts a millisecond timestamp first, with random bits after it. It offers roughly time-ordered 128-bit IDs and better index locality. Clock skew and same-millisecond generation still limit global ordering.'],
[21,'Snowflake: build the ID from parts','A common Snowflake layout packs a millisecond timestamp, a machine number and a per-millisecond counter into 64 bits. This is a compact alternative to UUIDv7.'],
[30,'Uniqueness needs safeguards','Assign machine numbers uniquely, guard against backwards clocks, and wait or fail when the per-millisecond counter is exhausted. Those safeguards prevent a generator from reusing the same parts.'],
[35,'Approximate time order','Snowflake sorts by its encoded timestamp under the generator\'s clock assumptions. Clock skew can reverse send order across servers; exact chat ordering needs a conversation sequence or causal metadata.']],
use:['High-volume IDs across many servers (Twitter/X, Discord, Instagram)','When IDs should roughly sort by creation time (feeds, timelines)','Anywhere a central counter would become a bottleneck'],
cons:['Depends on clocks: a clock jumping backwards can create duplicates unless guarded','Machine numbers must be assigned uniquely','IDs reveal when they were created and hint at your volume'],
draw(t){
  SV.forEach(([x,y],k)=>server(x,y,{label:`Server ${k+1}`,sub:t>=21?`machine ${k+1}`:'',w:116,h:52,...A(t,.2+k*.1)}));
  // auto-increment
  const da=A(t,5.2,11);db(DBP[0],DBP[1],{label:'ID counter',sub:'next = 1045',w:110,h:90,...da});
  let n=0;each(t,5.6,10.2,.25,1.4,(i,s)=>{const k=i%3,p=[[SV[k][0]+58,SV[k][1]],[DBP[0]-56,DBP[1]]];pk(t,s,.6,p,C.blue,{r:4});pk(t,s+.8,.6,rev(p),C.green,{r:4,label:t<s+1.4?`${1041+i}`:null});});
  if(t>8.4&&t<11)pill('everyone waits on one box',DBP[0],DBP[1]+80,{c:C.red,z:12.5,a:V(t,8.4,10.8)});
  if(t>7.5&&t<11)spin(t,DBP[0],DBP[1]-66,{c:C.amber,a:V(t,7.5,10.8)});
  // uuids
  const ua=V(t,11.2,16);if(ua>0){UU.forEach((u,k)=>{const x=560+(k%2)*230,y=190+Math.floor(k/2)*70,on=t>11.5+k*.5;pill(u,x,y,{c:C.dim,z:12,f:MONO,a:ua*(on?1:0)});});
    if(t>14.3)pill('UUIDv4: random order',675,440,{c:C.amber,z:12.5,a:ua*V(t,14.3)});}
  const v7=V(t,16.2,21);if(v7>0){['017f22e2-79b0-7cc3…','017f22e2-79b1-7a20…'].forEach((s,i)=>pill(s,590,240+i*80,{c:C.accent,z:17,f:MONO,a:v7}));pill('UUIDv7: timestamp prefix · 128 bits',590,430,{c:C.green,z:14,a:v7});}
  // snowflake layout
  const sa=A(t,21.3);if(sa.a>0){let x=BAR.x;F.forEach(([n,b,c],k)=>{const w=BAR.w*b/63;draw(0,0,{a:sa.a*V(t,21.5+k*.5)},()=>{rr(x,BAR.y-20,w-4,40,8);g.fillStyle=hexA(c,.18);g.fill();g.strokeStyle=c;g.lineWidth=1.8;g.stroke();});
      tx(`${n} · ${b} bits`,x+w/2,BAR.y+1,{z:12.5,wt:700,c,a:sa.a*V(t,21.5+k*.5)});x+=w;});tx('64-bit ID',BAR.x-12,BAR.y,{z:12,c:C.dim,al:'right',a:sa.a});}
  // each server builds IDs locally
  const IDS=[[0,24,'1727712000123','01','0000'],[1,24.6,'1727712000123','02','0000'],[2,25.2,'1727712000124','03','0000'],[0,25.8,'1727712000124','01','0001']];
  IDS.forEach(([k,s,ts,m,q],i)=>{if(t<s)return;const y=240+i*56,a=V(t,s);tx('→',SV[k][0]+80,SV[k][1],{z:16,c:C.dim,a:a*(t<s+1.2?1:0)});
    pill(ts,420,y,{c:C.accent,z:12,f:MONO,a});pill(m,560,y,{c:C.amber,z:12,f:MONO,a});pill(q,640,y,{c:C.green,z:12,f:MONO,a});tx(`from server ${k+1}`,700,y,{z:11.5,c:C.dim,al:'left',a});});
  if(t>30.2&&t<35)pill('unique machines + guarded clocks + counter limits',540,470,{c:C.green,z:12.5,a:V(t,30.2,34.8)});
  if(t>35.2)pill('approximate timestamp order · not causal order',540,470,{c:C.amber,z:12.5,a:V(t,35.2)});
  if(t>35.2){g.save();g.globalAlpha=V(t,35.4);ln([[790,240],[790,410]],{c:C.green,w:2,arrow:true});tx('larger timestamp',812,410,{z:11.5,c:C.green,al:'left'});g.restore();}
}});})();
