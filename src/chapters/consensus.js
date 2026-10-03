/* ---------------- A1. CONSENSUS: LEADER ELECTION WITH RAFT ---------------- */
(function(){
const CX=500,CY=305,RAD=185,N=['A','B','C','D','E'];
const POS=N.map((n,k)=>{const a=(-90+k*72)*Math.PI/180;return[CX+RAD*Math.cos(a),CY+RAD*.92*Math.sin(a)];});
const TO={B:5.2,C:4.0,D:4.8,E:5.6};             // randomized election timeouts (s)
const HB1=[5.5,6.5,7.5,8.5,9.5], HB2=[20.6,21.6,22.6,23.6,24.6,25.6,26.6,27.6,28.6,29.6,30.6];
const seg=(a,b)=>{const[x0,y0]=POS[a],[x1,y1]=POS[b],d=Math.hypot(x1-x0,y1-y0),u=[(x1-x0)/d,(y1-y0)/d];return[[x0+u[0]*52,y0+u[1]*34],[x1-u[0]*52,y1-u[1]*34]];};
ch({id:'consensus',group:'Advanced',title:'Consensus: Leader Election with Raft',dur:48,needs:['replication'],related:['locks','cap','spof','transactions'],
beats:[
[0,'Five nodes must agree','A replicated database needs exactly one leader to order the writes. With five nodes, how do they agree who leads, even when some crash?'],
[5,'The leader sends heartbeats','Leader A pings every follower a few times a second: "still alive". Each ping resets that follower\'s election timer.'],
[10,'The leader becomes isolated','A loses contact with the other nodes but still believes it leads term 1. Its heartbeats no longer arrive, and the followers’ randomized election timers run down.'],
[14.2,'A candidate asks for votes','C\'s timer ran out first. It starts term 2, votes for itself and asks everyone: "vote for me?" Each node votes once per term.'],
[19.5,'One leader per term','C has a majority of votes and leads term 2. Each node votes at most once per term, so overlapping majorities prevent two elected leaders in the same term. An isolated older leader can still believe it leads.'],
[25,'Commit a current-term entry','C commits an entry from its current term once a majority durably stores it under Raft log-matching rules. Earlier entries in its log become committed indirectly; counting replicas of an older-term entry alone is insufficient.'],
[31,'No majority, no writes','With B and E also gone, only 2 of 5 nodes are left. They cannot commit new writes without a majority.'],
[36,'Reject a stale leader','A reconnects believing it leads term 1. C and D are in term 2 and reject its old-term requests. Once A learns the higher term, it steps down.'],
[42,'Votes protect the committed log','A voter requires the candidate log to be at least as up-to-date as its own: compare last-entry term first, then index. Together with log matching and the current-term commit rule, this protects committed entries.']],
use:['Coordination services that store config and locks (etcd, ZooKeeper, Consul)','Choosing the leader of a database or queue cluster (CockroachDB, Kafka KRaft)','A replicated log that preserves committed entries under Raft protocol rules'],
cons:['Needs a majority: 5 nodes survive 2 failures, 3 nodes survive 1','Every write waits for a majority round trip','Elections briefly pause writes, and it is subtle to operate'],
draw(t){
  const dead=k=>(k===0&&t>=10&&t<36)||((k===1||k===4)&&t>=31);
  const lead=t<10?0:t>=19.5?2:-1,cand=t>=14.2&&t<19.5?2:-1,term=t<14.2?1:2;
  for(let i=0;i<5;i++)for(let j=i+1;j<5;j++)ln(seg(i,j),{a:V(t,.4)*.25});
  POS.forEach(([x,y],k)=>{const st=dead(k)?'fail':k===lead?'acc':k===cand?'hot':'ok';
    server(x,y,{label:`Node ${N[k]}`,sub:dead(k)?'':k===0&&t>=36&&t<40?'old leader · term 1':k===lead?`leader · term ${term}`:k===cand?`candidate · term 2`:`follower · term ${term}`,w:108,h:56,st,down:k===0?'ISOLATED':'DOWN',...A(t,.2+k*.1)});
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
  if(t>28.2&&t<31)pill('term 2 entry on 3 of 5 → committed ✓',CX,CY,{c:C.green,z:12.5,a:V(t,28.2,30.8)});
  // losing the majority
  pk(t,32.2,.8,[[CX-120,CY+10],[POS[2][0]-40,POS[2][1]-26]],C.blue,{label:'SET y = 7'});
  [1,4].forEach(k=>pk(t,33.1,.9,seg(2,k),C.blue,{r:4}));
  if(t>34.1&&t<36)pill('only 2 of 5 reachable → cannot commit',CX,CY,{c:C.red,z:12.5,a:V(t,34.1,36)});
  pk(t,36.6,.8,seg(0,2),C.red,{label:'term 1 request'});pk(t,37.5,.8,seg(2,0),C.amber,{label:'reject: term 2'});
  if(t>38.3&&t<42)pill(t<40?'old term rejected':'A learns term 2 → follower',CX,CY,{c:C.amber,z:13,a:V(t,38.3,41.8)});
  if(t>42)textBlock('Vote restriction: last log term, then index. Current-term majority commit + log matching protect earlier entries.',CX,CY,330,{z:14,a:V(t,42)});
}});})();
