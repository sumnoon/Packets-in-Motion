/* ---------------- 9b. QUORUMS: N, W & R ---------------- */
(function(){
const CL=[140,300],R=[[620,150],[620,300],[620,450]];
const to=k=>[[CL[0]+22,CL[1]+(k-1)*14],[R[k][0]-52,R[k][1]]];
// which version each replica holds at time t (r2 dies at 30.4)
const VER=[[[6.4,2],[25,3],[32,4]],[[6.7,2],[28.8,3]],[[16.4,2],[29.4,3],[32.2,4]]];
const ver=(k,t)=>VER[k].reduce((v,[at,n])=>t>=at?n:v,1);
const dead=(k,t)=>k===1&&t>=30.4;
// N, W, R in force, and when each was introduced
const cfg=t=>t>=24&&t<30?{w:1,r:1}:{w:2,r:2};
ch({id:'quorums',group:'Data',title:'Quorums: Tuning Reads & Writes with N, W & R',dur:38,needs:['replication'],related:['cap','consensus','conflicts'],
beats:[
[0,'N copies of every value','The key cart:7 is stored on N = 3 replicas. Reads and writes do not have to wait for all three.'],
[5,'Write quorum: W','A write counts as done once W replicas confirm it. With W = 2, the client gets its answer after the two fastest acks. The third catches up later.'],
[11,'Read quorum: R','A read asks R replicas and keeps the newest version it sees. With R = 2 it waits for two answers: one of them may be behind.'],
[17,'R + W > N: overlapping sets','For fixed N replicas, 2 + 2 > 3 guarantees overlap. In this example, writes finish before reads begin, replicas retain acknowledged versions, and version comparison identifies the newest completed write. The inequality alone does not guarantee linearizability.'],
[24,'R + W ≤ N: fast, but stale','With W = 1 and R = 1, a read can land on a replica the write has not reached yet, and return an old value.'],
[30,'Strict and sloppy quorums','With fixed membership, two live replicas still satisfy W = 2 and R = 2. A sloppy quorum may use fallback nodes outside that set; its read and write sets need not overlap. Concurrent or failed partial writes also require version reconciliation.']],
use:['Leaderless stores such as Cassandra and DynamoDB-style databases','Choosing per request: W = N for safety, R = 1 for speed','Riding out a slow or dead replica without failing requests'],
cons:['Bigger W or R means waiting for slower replicas','R + W > N still allows odd cases (concurrent writes, failed partial writes); add versioning','Small W and R are fast but may return stale data'],
draw(t){
  const c=cfg(t),fresh=c.r+c.w>3;
  user(CL[0],CL[1],{label:'client',r:20,...A(t,.2)});
  R.forEach((p,k)=>{const v=ver(k,t),d=dead(k,t);ln(to(k),{a:V(t,.6)*.35,dash:d?[4,6]:null});
    db(p[0],p[1],{label:`Replica ${k+1}`,sub:d?'':`cart:7 = v${v}`,w:110,h:84,st:d?'fail':t>=26.6&&t<29.4&&k===2?'hot':'ok',...A(t,.4+k*.15)});});
  // the settings panel
  const pa=V(t,.8);if(pa>0){panel(805,196,170,210,{a:pa});
    [['N',3,.8],['W',c.w,5.2],['R',c.r,11.2]].forEach(([k,v,t0],i)=>{const a=pa*V(t,t0);tx(`${k} =`,840,236+i*44,{z:20,wt:750,f:MONO,c:C.dim,a});tx(String(v),905,236+i*44,{z:22,wt:800,f:MONO,c:i===1?C.blue:i===2?C.green:C.text,a});});
    if(t>17)tx(`${c.r} + ${c.w} ${fresh?'>':'≤'} 3`,890,372,{z:17,wt:800,f:MONO,c:fresh?C.green:C.red,a:pa*V(t,17.2)});}
  // write v2 with W = 2
  [[0,5.6,.8],[1,5.6,1.1],[2,5.6,10.8]].forEach(([k,s,d])=>pk(t,s,d,to(k),C.blue,{label:k===0?'write v2':null}));
  pk(t,6.4,.8,rev(to(0)),C.green,{r:4.5,label:'ack'});pk(t,6.7,.8,rev(to(1)),C.green,{r:4.5,label:'ack'});
  if(t>7.5&&t<11)pill('written: 2 of 3 confirmed',CL[0],CL[1]-56,{c:C.green,z:12.5,a:V(t,7.5,10.8)});
  if(t>7.6&&t<16.4)pill('still catching up…',R[2][0]+118,R[2][1],{c:C.amber,z:12,a:V(t,7.6,16.2)});
  // read with R = 2: one answer is old, the newest wins
  pk(t,11.4,.7,to(1),C.blue,{label:'read'});pk(t,11.4,.7,to(2),C.blue,{r:5});
  pk(t,12.2,.7,rev(to(1)),C.green,{label:'v2'});pk(t,12.2,.7,rev(to(2)),C.amber,{label:'v1'});
  if(t>13&&t<17)pill('newest of the two: v2 ✓',CL[0],CL[1]-56,{c:C.green,z:12.5,a:V(t,13,16.8)});
  // the overlap
  const oa=V(t,17.4,23.6);if(oa>0){g.save();g.globalAlpha=oa;g.setLineDash([6,5]);g.lineWidth=2;
    rr(548,92,144,262,16);g.strokeStyle=C.blue;g.stroke();rr(540,244,160,268,18);g.strokeStyle=C.green;g.stroke();g.restore();
    tx('wrote here (W)',548,82,{z:12,c:C.blue,al:'left',a:oa});tx('read here (R)',540,530,{z:12,c:C.green,al:'left',a:oa});
    pill('fixed replicas · completed write v2',R[1][0]-160,R[1][1],{c:C.accent,z:12,a:oa});}
  // W = 1, R = 1: fast and stale
  pk(t,24.4,.6,to(0),C.blue,{label:'write v3'});pk(t,24.4,4.4,to(1),C.blue,{r:5});pk(t,24.4,5,to(2),C.blue,{r:5});
  pk(t,25,.6,rev(to(0)),C.green,{r:4.5,label:'ack'});if(t>25.6&&t<30)pill('written (W = 1)',CL[0],CL[1]-56,{c:C.green,z:12.5,a:V(t,25.6,29.8)});
  pk(t,26,.6,to(2),C.blue,{label:'read (R = 1)'});pk(t,26.6,.6,rev(to(2)),C.red,{label:'v2'});
  if(t>27.2&&t<30)pill('stale: the latest is v3',CL[0],CL[1]+62,{c:C.red,z:12.5,a:V(t,27.2,29.8)});
  // one replica down, W = 2 and R = 2 still work
  if(t>30.4&&t<31.6)pop(t,30.4,R[1][0],R[1][1]-50,'✕',C.red,{z:22,d:1.2});
  pk(t,31.4,.6,to(0),C.blue,{label:'write v4'});pk(t,31.4,.8,to(2),C.blue,{r:5});pk(t,31.4,.5,to(1),C.blue,{r:5,a:.5});
  pk(t,32,.6,rev(to(0)),C.green,{r:4.5});pk(t,32.2,.6,rev(to(2)),C.green,{r:4.5});
  if(t>32.8&&t<34)pill('written: 2 of 3',CL[0],CL[1]-56,{c:C.green,z:12.5,a:V(t,32.8,33.8)});
  pk(t,34,.6,to(0),C.blue,{label:'read'});pk(t,34,.6,to(2),C.blue,{r:5});pk(t,34.6,.6,rev(to(0)),C.green,{label:'v4'});pk(t,34.6,.6,rev(to(2)),C.green,{r:5});
  if(t>35.2)pill('fixed membership: overlap ≠ linearizability by itself',W/2-60,530,{c:C.amber,z:12.5,a:V(t,35.2)});
}});})();
