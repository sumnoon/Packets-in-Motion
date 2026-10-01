/* ---------------- A1c. CONFLICT RESOLUTION: VECTOR CLOCKS & CRDTs ---------------- */
(function(){
const RA=[300,190],RB=[700,190],UA=[100,190],UB=[900,190];
const ab=[[RA[0]+80,RA[1]-10],[RB[0]-80,RB[1]-10]],ba=[[RB[0]-80,RB[1]+10],[RA[0]+80,RA[1]+10]];
// what each replica holds: [value, clock or note, colour] at time t
function stateOf(r,t){
  if(t<2)return['cart = { }','',C.dim];
  if(t<4.2)return r?['cart = { pen }','10:00:01.5',C.blue]:['cart = { book }','10:00:01.2',C.blue];
  if(t<12)return t<6.4?(r?['{ pen }  vs  { book }','conflict!',C.amber]:['{ book }  vs  { pen }','conflict!',C.amber]):['cart = { pen }','later timestamp wins',C.red];
  if(t<13.2)return['cart = { }','[A:0, B:0]',C.dim];
  if(t>=28.4)return['{ book, mug, pen }','merged by union',C.green];
  if(r===0)return t<17.6?['cart = { book }','[A:1, B:0]',C.blue]:t<20.4?['cart = { book, pen }','[A:1, B:1]',C.green]:t<22.6?['{ book, pen, mug }','[A:2, B:1]',C.blue]:t<26?['two siblings kept','[A:2, B:1] ∥ [A:1, B:2]',C.amber]:['cart = { book, mug }','add-set',C.blue];
  return t<14.6?['cart = { }','[A:0, B:0]',C.dim]:t<15.6?['cart = { book }','[A:1, B:0]',C.blue]:t<20.4?['cart = { book, pen }','[A:1, B:1]',C.blue]:t<22.6?['cart = { book }','[A:1, B:2]',C.blue]:t<26?['two siblings kept','[A:2, B:1] ∥ [A:1, B:2]',C.amber]:['cart = { pen }','add-set',C.blue];}
ch({id:'conflicts',group:'Advanced',title:'Conflict Resolution: Vector Clocks & CRDTs',dur:38,needs:['replication','cap'],related:['quorums','consensus','event-driven'],
beats:[
[0,'Two writes, no single leader','In multi-leader or leaderless stores, two replicas can accept writes to the same key at the same moment, then sync with each other later.'],
[5,'Last write wins','The simplest rule keeps the write with the later timestamp. Easy, but the other write is silently lost, and clocks on different machines drift.'],
[12,'Vector clocks','Each replica counts its own writes, and every version carries all the counts, like [A:1, B:1]. Compare two versions count by count.'],
[19,'Before, after, or concurrent','If every count in X is ≤ the same count in Y, X came first and can be dropped. If each is ahead somewhere, they are concurrent: a real conflict for the app to merge.'],
[26,'CRDTs merge by design','Some data types merge automatically. A cart kept as an add-only set merges by union; a like counter keeps one count per replica and adds them up.'],
[32,'Choose your merge','Last write wins for caches and settings, vector clocks plus app logic for documents, CRDTs for counters, sets and collaborative editing.']],
use:['Multi-region writes, offline-first apps, collaborative editors','Shopping carts, likes and presence: merge instead of overwrite','Detecting real conflicts rather than guessing with timestamps'],
cons:['Last write wins loses data whenever writes are concurrent','Vector clocks grow with every replica, and the app must still merge siblings','CRDTs fit specific shapes (sets, counters, text); removals need extra care'],
draw(t){
  user(UA[0],UA[1],{label:'Ana',r:15,...A(t,.2,32)});user(UB[0],UB[1],{label:'Ben',r:15,...A(t,.3,32)});
  [[RA,'Replica A',0],[RB,'Replica B',1]].forEach(([p,n,r])=>{const a=V(t,.4,32);if(a<=0)return;box(p[0],p[1],{label:n,w:160,h:54,a});const[v,c,col]=stateOf(r,t);
    plate(p[0],p[1]+96,240,84,{c:col,a,fill:hexA(col,.08)});tx(v,p[0],p[1]+82,{z:15,wt:750,f:MONO,a});if(c)tx(c,p[0],p[1]+108,{z:12.5,f:MONO,c:col,a});});
  const toA=[[UA[0]+18,UA[1]],[RA[0]-80,RA[1]]],toB=[[UB[0]-18,UB[1]],[RB[0]+80,RB[1]]];
  // concurrent adds, then sync
  pk(t,1.2,.8,toA,C.blue,{label:'+ book'});pk(t,1.2,.8,toB,C.blue,{label:'+ pen'});pk(t,3.2,1,ab,C.amber,{r:5,label:'sync'});pk(t,3.2,1,ba,C.amber,{r:5});
  // last write wins
  if(t>6.4&&t<12){pill('10:00:01.5 > 10:00:01.2 → keep { pen }',W/2,370,{c:C.red,z:12.5,f:MONO,a:V(t,6.4,11.8)});pill('Ana\'s book silently lost',W/2,410,{c:C.red,z:12.5,a:V(t,7.4,11.8)});
    pill('and if B\'s clock runs fast, "later" may be the older write',W/2,450,{c:C.amber,z:12,a:V(t,8.6,11.8)});}
  // vector clocks: a clean "happened before"
  if(t>12&&t<13.4)pill('↺ again, with vector clocks',W/2,40,{c:C.accent,z:12.5});
  pk(t,13.4,.8,toA,C.blue,{label:'+ book'});pk(t,14.6,1,ab,C.amber,{r:5,label:'sync'});pk(t,15.8,.8,toB,C.blue,{label:'+ pen'});pk(t,16.8,.8,ba,C.amber,{r:5,label:'sync'});
  if(t>17.6&&t<19.4)pill('[A:1, B:0] ≤ [A:1, B:1] → B\'s version is newer: keep it ✓',W/2,410,{c:C.green,z:12.5,f:MONO,a:V(t,17.6,19.2)});
  // concurrent
  pk(t,19.6,.8,toA,C.blue,{label:'+ mug'});pk(t,19.6,.8,toB,C.blue,{label:'− pen'});pk(t,21.2,1,ab,C.amber,{r:5,label:'sync'});pk(t,21.2,1,ba,C.amber,{r:5});
  if(t>22.6&&t<26){pill('A is ahead on A, B is ahead on B → concurrent',W/2,410,{c:C.amber,z:12.5,a:V(t,22.6,25.8)});pill('keep both, let the app merge them',W/2,450,{c:C.accent,z:12.5,a:V(t,23.4,25.8)});}
  // CRDTs
  if(t>26.2&&t<32){pk(t,27.4,1,ab,C.green,{r:5,label:'merge'});pk(t,27.4,1,ba,C.green,{r:5});
    if(t>28.4){pill('{ book, mug } ∪ { pen } = { book, mug, pen }',W/2,400,{c:C.green,z:13,f:MONO,a:V(t,28.4,31.8)});pill('likes: A counted 3, B counted 2 → 5',W/2,442,{c:C.green,z:13,f:MONO,a:V(t,29.4,31.8)});
      pill('same answer on every replica, in any order',W/2,484,{c:C.accent,z:12.5,a:V(t,30.2,31.8)});}}
  // the choice
  const ca=V(t,32.2);if(ca>0)[['Last write wins','caches · settings',C.red],['Vector clocks','documents · app merges',C.amber],['CRDTs','counters · sets · editors',C.green]].forEach(([a,b,c],k)=>{const x=190+k*310,v=V(t,32.3+k*.4);
    plate(x,300,270,100,{c,a:v});tx(a,x,284,{z:18,wt:800,c,a:v});tx(b,x,314,{z:13,a:v});});
}});})();
