/* ---------------- S1. STORAGE ENGINES: B-TREES vs LSM TREES ---------------- */
(function(){
// B-tree side
const ROOT=[265,130],LEAF=[[90,'1–399'],[205,'400–699'],[325,'700–849'],[440,'850–999']].map(([x,r])=>({x,y:290,r}));
const DISK=[265,440],SLOT=k=>[DISK[0]-150+(k%10)*33,DISK[1]-18+Math.floor(k/10)*36];
const BW=[[5.6,1,7],[12.2,3,15],[13.1,0,3],[14,2,11],[14.9,1,18],[15.8,3,5]];   // writes: time, leaf, disk slot
// LSM side
const MEM=[660,170],SST=[[640,340],[810,340]],MERGED=[725,455];
const B1=[[17.6,'k42'],[18.4,'k09'],[19.2,'k88'],[20,'k17']],B2=[[21.9,'k61'],[22.4,'k05'],[22.9,'k77'],[23.3,'k23']];
const sorted=a=>a.slice().sort();
ch({id:'storage-engines',group:'Storage & Search',title:'Storage Engines: B-Trees vs LSM Trees',dur:40,needs:['indexing'],related:['bloom-filters','search','sql-nosql'],
beats:[
[0,'Where the bytes land','Every database must turn writes into files on disk. The two common designs are the B-tree and the log-structured merge tree (LSM tree).'],
[5,'B-tree: update in place','Keys live in sorted pages arranged as a shallow tree. A write walks down to its page and rewrites that page where it sits. Reads take a few steps.'],
[12,'The cost of in-place writes','Each write lands on a different page somewhere on disk. Under a flood of writes, all that random I/O becomes the bottleneck.'],
[17,'LSM tree: write to memory first','Each write is appended to a write-ahead log for safety and added to a sorted in-memory table, the memtable. Both are fast.'],
[21,'Flush in one go','When the memtable fills, it is written out in order as one immutable file, an SSTable. Writes stay sequential and cheap.'],
[25,'Reads check newest first','A read checks the memtable, then the SSTables from newest to oldest. Bloom filters let it skip files that cannot hold the key.'],
[31,'Compaction','In the background, SSTables are merged into bigger ones and old versions are dropped, so reads stay fast.'],
[36,'Pick by workload','Read-heavy with updates in place: a B-tree (PostgreSQL, MySQL). A firehose of writes: an LSM tree (Cassandra, RocksDB).']],
use:['B-tree: OLTP databases with many reads, updates and range scans','LSM tree: write-heavy logs, metrics, time series and chat history','Both: knowing which one you run explains its latency spikes'],
cons:['B-tree: random writes and page splits slow heavy write loads','LSM tree: reads may check several files; compaction uses disk and CPU in bursts','LSM tree: the same data is rewritten several times as files merge'],
draw(t){
  const bt=t<17?1:t<36?.4:1,ls=V(t,16.6);
  // ---- B-tree
  const ba=A(t,.5);if(ba.a>0){tx('B-tree',265,72,{z:15,wt:750,c:C.accent,a:ba.a*bt});
    box(ROOT[0],ROOT[1],{label:'400 | 700 | 850',w:170,h:44,z:13,c:C.accent,a:ba.a*bt});
    LEAF.forEach(l=>{ln([[ROOT[0],ROOT[1]+22],[l.x,l.y-22]],{a:ba.a*bt*.4});const hot=BW.some(([s,k])=>LEAF[k]===l&&t>s+.9&&t<s+1.6);box(l.x,l.y,{label:l.r,sub:'page',w:100,h:44,z:13,c:hot?C.amber:C.edge,glow:hot,a:ba.a*bt});});
    draw(DISK[0],DISK[1],{a:ba.a*bt},()=>{rr(-170,-44,340,88,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.line;g.lineWidth=1.5;g.stroke();});
    tx('disk pages',DISK[0]-160,DISK[1]-58,{z:11.5,c:C.dim,al:'left',a:ba.a*bt});
    for(let k=0;k<20;k++){const[x,y]=SLOT(k),hit=BW.some(([s,,d])=>d===k&&t>s+1.2&&t<s+2);g.save();g.globalAlpha=ba.a*bt;rr(x-12,y-12,24,24,4);g.fillStyle=hit?hexA(C.amber,.5):C.panel2;g.fill();g.strokeStyle=hit?C.amber:C.line;g.stroke();g.restore();}
    BW.forEach(([s,k,d],i)=>{const L=LEAF[k];pk(t,s,.9,[[ROOT[0],ROOT[1]-40],[ROOT[0],ROOT[1]+22],[L.x,L.y-22]],C.blue,{r:5,label:i===0?'write k=512':null,a:bt});pk(t,s+.9,.5,[[L.x,L.y+22],SLOT(d)],C.amber,{r:4,a:bt});});
    pk(t,8.6,1.3,[[ROOT[0],ROOT[1]-40],[ROOT[0],ROOT[1]+22],[LEAF[1].x,LEAF[1].y-22]],C.green,{label:'read k=512: 2 steps'});
    if(t>12.4&&t<17)pill('random I/O: every write seeks a new spot',DISK[0],DISK[1]+66,{c:C.red,z:12,a:V(t,12.4,16.8)});}
  if(ls<=0)return;
  ln([[500,90],[500,510]],{c:C.line,dash:[4,6],a:ls});
  tx('LSM tree',725,72,{z:15,wt:750,c:C.green,a:ls});
  // memtable + write-ahead log
  const inMem=t<21.2?B1.filter(([s])=>t>=s+.6):t<23.6?B2.filter(([s])=>t>=s+.6):[];
  draw(MEM[0],MEM[1],{a:ls},()=>{rr(-100,-52,200,104,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.green;g.lineWidth=2;g.stroke();});
  tx('memtable (sorted, in memory)',MEM[0],MEM[1]-66,{z:11.5,c:C.dim,a:ls});
  sorted(inMem.map(([,k])=>k)).forEach((k,i)=>tx(k,MEM[0]-60+(i%2)*120,MEM[1]-22+Math.floor(i/2)*40,{z:15,wt:750,f:MONO,a:ls}));
  const wal=[...B1,...B2].filter(([s])=>t>=s+.6).length;tx('write-ahead log',880,MEM[1]-66,{z:11.5,c:C.dim,a:ls});
  for(let i=0;i<8;i++){g.save();g.globalAlpha=ls;rr(820+(i%4)*30,MEM[1]-40+Math.floor(i/4)*30,24,24,4);g.fillStyle=i<wal?hexA(C.amber,.35):C.panel2;g.fill();g.strokeStyle=i<wal?C.amber:C.line;g.stroke();g.restore();}
  [...B1,...B2].forEach(([s,k])=>{pk(t,s,.6,[[540,MEM[1]],[MEM[0]-100,MEM[1]]],C.blue,{r:5,label:k});});
  // flushes and SSTables
  const merged=V(t,32);
  [[21.2,B1,0],[23.6,B2,1]].forEach(([s,b,j])=>{const p=P(t,s,s+.8);if(t<s)return;const[x,y]=L2(MEM,SST[j],p);
    draw(x,y,{a:ls*(t<31?1:1-P(t,31,32.4))},()=>{rr(-70,-34,140,68,10);g.fillStyle=C.panel2;g.fill();g.strokeStyle=C.amber;g.lineWidth=1.8;g.stroke();});
    if(p>=1){tx(`SSTable ${j+1}`,x,y-12,{z:13,wt:750,a:ls*(t<31?1:1-P(t,31,32.4))});tx(sorted(b.map(e=>e[1])).join(' '),x,y+12,{z:10.5,f:MONO,c:C.dim,a:ls*(t<31?1:1-P(t,31,32.4))});}});
  if(t>21.2&&t<23.4)pill('flush: one sequential write',MEM[0],MEM[1]+80,{c:C.amber,z:12,a:V(t,21.3,23.2)});
  // a read: memtable, newest file (skipped by its Bloom filter), older file (hit)
  pk(t,25.4,.6,[[540,MEM[1]+20],[MEM[0]-100,MEM[1]+20]],C.accent,{label:'read k42'});
  pop(t,26,MEM[0],MEM[1]-6,'not here',C.dim,{z:12,d:1});
  pk(t,26.4,.7,[[MEM[0]+40,MEM[1]+52],[SST[1][0],SST[1][1]-34]],C.accent,{r:4.5});pop(t,27.1,SST[1][0],SST[1][1]-50,'Bloom: skip',C.amber,{z:12,d:1.2});
  pk(t,27.4,.7,[[MEM[0]-40,MEM[1]+52],[SST[0][0],SST[0][1]-34]],C.accent,{r:4.5});pop(t,28.1,SST[0][0],SST[0][1]-50,'found ✓',C.green,{z:13,d:1.4});
  // compaction
  if(merged>0){draw(MERGED[0],MERGED[1],{a:ls*merged},()=>{rr(-130,-34,260,68,10);g.fillStyle=C.panel2;g.fill();g.strokeStyle=C.green;g.lineWidth=2;g.stroke();});
    tx('SSTable 3 (merged)',MERGED[0],MERGED[1]-12,{z:13,wt:750,a:ls*merged});tx(sorted([...B1,...B2].map(e=>e[1])).join(' '),MERGED[0],MERGED[1]+12,{z:10.5,f:MONO,c:C.dim,a:ls*merged});}
  if(t>31&&t<36)pill('compaction: merge, drop old versions',MERGED[0],MERGED[1]+58,{c:C.green,z:12,a:V(t,31.2,35.8)});
  // the choice
  if(t>36){pill('reads & in-place updates',265,510,{c:C.accent,z:12.5,a:V(t,36.2)});pill('heavy writes',725,510,{c:C.green,z:12.5,a:V(t,36.6)});}
}});})();
