/* ---------------- A1. CONSENSUS: LEADER ELECTION WITH RAFT ---------------- */
(function(){
const CX=500,CY=305,RAD=185,N=['A','B','C','D','E'];
const POS=N.map((n,k)=>{const a=(-90+k*72)*Math.PI/180;return[CX+RAD*Math.cos(a),CY+RAD*.92*Math.sin(a)];});
const TO={B:5.2,C:4.0,D:4.8,E:5.6};             // randomized election timeouts (s)
const HB1=[5.5,6.5,7.5,8.5,9.5], HB2=[20.6,21.6,22.6,23.6,24.6,25.6,26.6,27.6,28.6,29.6,30.6];
const seg=(a,b)=>{const[x0,y0]=POS[a],[x1,y1]=POS[b],d=Math.hypot(x1-x0,y1-y0),u=[(x1-x0)/d,(y1-y0)/d];return[[x0+u[0]*52,y0+u[1]*34],[x1-u[0]*52,y1-u[1]*34]];};
ch({id:'consensus',group:'Advanced',title:'Consensus: Leader Election with Raft',dur:38,needs:['replication'],related:['locks','cap','spof','transactions'],
beats:[
[0,'Five nodes must agree','A replicated database needs exactly one leader to order the writes. With five nodes, how do they agree who leads, even when some crash?'],
[5,'The leader sends heartbeats','Leader A pings every follower a few times a second: "still alive". Each ping resets that follower\'s election timer.'],
[10,'The leader crashes','The heartbeats stop and the timers run down. Each timer has a random length, so one node almost always runs out first.'],
[14.2,'A candidate asks for votes','C\'s timer ran out first. It starts term 2, votes for itself and asks everyone: "vote for me?" Each node votes once per term.'],
[19.5,'A majority wins','C has 3 of 5 votes, a majority, so it becomes leader of term 2. Two majorities always overlap, so there can never be two leaders.'],
[25,'Writes need a majority too','A write only counts once a majority has stored it. After that it survives any minority of crashes.'],
[31,'No majority, no writes','With B and E also gone, only 2 of 5 nodes are left. They cannot form a majority, so they refuse writes rather than risk disagreeing.']],
use:['Coordination services that store config and locks (etcd, ZooKeeper, Consul)','Choosing the leader of a database or queue cluster (CockroachDB, Kafka KRaft)','Anywhere two leaders at once would corrupt data'],
cons:['Needs a majority: 5 nodes survive 2 failures, 3 nodes survive 1','Every write waits for a majority round trip','Elections briefly pause writes, and it is subtle to operate'],
draw(t){
  const dead=k=>(k===0&&t>=10)||((k===1||k===4)&&t>=31);
  const lead=t<10?0:t>=19.5?2:-1,cand=t>=14.2&&t<19.5?2:-1,term=t<14.2?1:2;
  for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)ln(seg(i,j),{a:V(t,.4)*.25});
  POS.forEach(([x,y],k)=>{const st=dead(k)?'fail':k===lead?'acc':k===cand?'hot':'ok';
    server(x,y,{label:`Node ${N[k]}`,sub:dead(k)?'':k===lead?`leader · term ${term}`:k===cand?`candidate · term 2`:'follower',w:108,h:56,st,down:'DOWN',...A(t,.2+k*.1)});
    if(k===lead&&!dead(k)&&t>1){g.save();g.globalAlpha=.35+.25*Math.sin(t*4);g.strokeStyle=C.accent;g.lineWidth=2;rr(x-62,y-36,124,72,14);g.stroke();g.restore();}});
  // heartbeats from the current leader
  HB1.forEach(h=>[1,2,3,4].forEach(k=>pk(t,h,.5,seg(0,k),C.accent,{r:3.5})));
  HB2.forEach(h=>[0,1,3,4].forEach(k=>{if(!(h>=31&&(k===1||k===4))&&k!==0)pk(t,h,.5,seg(2,k),C.accent,{r:3.5});}));
  if(t>5.6&&t<10)pill('♥ heartbeat',CX,CY,{c:C.accent,z:12,a:V(t,5.6,9.6)});
  // election timers (followers, while there is no live leader)
  if(t>5&&t<19.5)[1,2,3,4].forEach(k=>{const n=N[k],last=t<10?HB1.filter(h=>h+.5<=t).pop()+.5||5:10,left=clamp(1-(t-last)/TO[n]);
    const[x,y]=POS[k];g.save();g.globalAlpha=V(t,5,19.2);g.strokeStyle=C.line;g.lineWidth=4;g.beginPath();g.arc(x+64,y-30,11,0,7);g.stroke();
    g.strokeStyle=left<.25?C.red:C.amber;g.beginPath();g.arc(x+64,y-30,11,-Math.PI/2,-Math.PI/2+6.283*left);g.stroke();g.restore();});
  if(t>10.3&&t<14.2)pill('timers running down…',CX,CY,{c:C.amber,z:12.5,a:V(t,10.3,14)});
  // votes
  [1,3,4,0].forEach((k,i)=>pk(t,14.6+i*.1,.8,seg(2,k),C.blue,{r:4.5,label:i===0?'vote for me?':null}));
  const yes=[[1,15.6],[3,15.7],[4,16.4]];yes.forEach(([k,s])=>pk(t,s,.8,seg(k,2),C.green,{r:4.5,label:'yes ✓'}));
  const votes=1+yes.filter(([k,s])=>t>=s+.8).length;
  if(t>14.4&&t<25)pill(`votes ${votes} / 5${votes>=3?'  → majority!':''}`,POS[2][0],POS[2][1]+60,{c:votes>=3?C.green:C.blue,z:12.5,a:V(t,14.4,24.6)});
  // a committed write
  const CL=[CX,CY];pk(t,25.3,.8,[[CX-120,CY+10],[POS[2][0]-40,POS[2][1]-26]],C.blue,{label:'SET x = 5'});
  [1,3,4].forEach((k,i)=>pk(t,26.3+i*.05,.8,seg(2,k),C.blue,{r:4}));[[1,27.3],[3,27.4]].forEach(([k,s])=>pk(t,s,.8,seg(k,2),C.green,{r:4}));
  if(t>28.2&&t<31)pill('stored on 3 of 5 → committed ✓',CX,CY,{c:C.green,z:12.5,a:V(t,28.2,30.8)});
  // losing the majority
  pk(t,32.2,.8,[[CX-120,CY+10],[POS[2][0]-40,POS[2][1]-26]],C.blue,{label:'SET y = 7'});
  [1,4].forEach(k=>pk(t,33.1,.9,seg(2,k),C.blue,{r:4}));
  if(t>34.1)pill('only 2 of 5 reachable → write refused (safe)',CX,CY,{c:C.red,z:12.5,a:V(t,34.1)});
}});})();
