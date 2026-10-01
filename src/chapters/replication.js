/* ---------------- 9. REPLICATION ---------------- */
(function(){
  const L=[500,190],F1=[270,400],F2=[730,400],WR=[120,190],R1=[95,400],R2=[905,400];
  const E=(a,b,da=48,db_=48)=>{const d=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/d,uy=(b[1]-a[1])/d;return[[a[0]+ux*da,a[1]+uy*da],[b[0]-ux*db_,b[1]-uy*db_]];};
ch({id:'replication',group:'Data',title:'Replication: Leader–Follower & Multi-Leader',dur:40,needs:['sql-nosql'],related:['cap','consensus','spof'],
beats:[
[0,'One database, every request','All reads and writes hit one database. If it slows down or dies, the whole app goes with it.'],
[4,'Leader–follower replication','Add follower copies. The leader streams every change to them through a replication log.'],
[7,'Writes go to the leader','A write lands on the leader first (v1 → v2), then flows to the followers a few milliseconds later.'],
[13,'Reads fan out to followers','Reads can be served by any follower, so read capacity grows with every copy you add.'],
[18,'Replication lag → stale reads','Right after a write, a follower may not have it yet. A read that hits it returns old data (amber). That\'s the price of asynchronous replication.'],
[23,'Leader fails → promote a follower','If the leader dies, a follower is promoted to be the new leader and writes carry on. This is failover.'],
[28,'Multi-leader: write anywhere','With a leader in each region, users write to the nearest one and the leaders sync with each other. Local writes are fast.'],
[33.3,'…but conflicts happen','Two leaders changed the same record at the same time. The system must pick a winner, e.g. "last write wins", which silently drops the other change.']],
use:['Leader–follower: read-heavy apps (most web apps), backups, read replicas for analytics','Failover for high availability of the database','Multi-leader: multi-region apps and offline-first clients that must write locally'],
cons:['Asynchronous replication means stale reads (read-your-own-writes needs care)','Failover can lose the last few writes, or cause "split brain" if done wrong','Multi-leader conflicts are hard: last-write-wins loses data; merging is app-specific']
,draw(t){
  if(t<28.2){const fa=A(t,.2,27.7).a;
    const lDead=t>23.3,promoted=t>24.5;
    const lv=t<8.7?'v1':t<19.3?'v2':'v3',f1=t<10.3?'v1':t<20.7?'v2':t<26.2?'v3':'v4',f2=t<10.9?'v1':t<22.5?'v2':t<27.3?'v3':'v4';
    user(WR[0],WR[1],{label:'writer',...A(t,.2),a:fa});user(R1[0],R1[1],{label:'reader',...A(t,.4),a:fa});user(R2[0],R2[1],{label:'reader',...A(t,.5),a:fa});
    const fA=A(t,4.2);
    // links
    ln(E(L,F1,44,50),{a:fA.a*fa*.8,dash:[5,6],c:hexA(C.accent,.7)});ln(E(L,F2,44,50),{a:fA.a*fa*.8,dash:[5,6],c:hexA(C.accent,.7)});
    pill('replication log',385,300,{c:C.accent,z:11.5,a:V(t,4.8,12.5)*fa});
    db(L[0],L[1],{label:t<4?'Database':'Leader',sub:lv,w:104,h:84,...A(t,.3),a:fa,st:lDead?'fail':t<4?'hot':'ok',col:!lDead&&t>=4?C.accent:null});
    db(F1[0],F1[1],{label:promoted?'Leader ★':'Follower',sub:f1,w:104,h:84,...fA,a:fA.a*fa,col:promoted?C.accent:null,st:promoted?'acc':'ok'});
    db(F2[0],F2[1],{label:'Follower',sub:f2,w:104,h:84,...A(t,4.5),a:V(t,4.5)*fa});
    if(t<4.2)pill('all reads + all writes',L[0],L[1]-70,{c:C.red,z:12,a:V(t,1.2,3.8)});
    // beat 0 traffic to single DB
    if(t<4.4){const w=E(WR,L,18,54),r1=E(R1,L,18,56),r2=E(R2,L,18,56);[w,r1,r2].forEach(p=>ln(p,{a:fa*.4*(1-P(t,3.8,4.3))}));
      each(t,.6,3.6,.5,1,(i,s)=>{const p=[w,r1,r2][i%3];pk(t,s,.9,p,C.blue,{r:5});});}
    // write links
    ln(E(WR,L,18,54),{a:V(t,6.5,23.3)*.5});
    // writes
    pk(t,7.5,1.2,E(WR,L,18,54),C.blue,{label:'write v2'});ring(t,8.7,L[0],L[1],C.accent,40);
    pk(t,9,1.3,E(L,F1,44,50),C.accent,{r:5.5,label:'v2'});pk(t,9.3,1.6,E(L,F2,44,50),C.accent,{r:5.5,label:'v2'});
    if(t>9&&t<12.4)pill('lag ~50 ms',F2[0]+2,F2[1]+66,{c:C.accent,z:12,a:V(t,10.9,12)});
    // reads
    ln([[R1[0]+17,R1[1]],[F1[0]-52,F1[1]]],{a:V(t,12.8)*fa*.5});ln([[R2[0]-17,R2[1]],[F2[0]+52,F2[1]]],{a:V(t,12.8)*fa*.5});
    each(t,13.2,17.4,.8,2,(i,s)=>{const left=i%2===0;const p=left?[[R1[0]+17,R1[1]],[F1[0]-52,F1[1]]]:[[R2[0]-17,R2[1]],[F2[0]+52,F2[1]]];pk(t,s,.7,p,C.blue,{r:5});pk(t,s+.8,.7,rev(p),C.green,{r:5,label:i<2?'v2':null});});
    if(t>13.4&&t<18)pill('2 followers = 2× read capacity',L[0],300,{c:C.green,z:12,a:V(t,13.6,17.6)});
    // stale read
    pk(t,18.3,1,E(WR,L,18,54),C.blue,{label:'write v3'});ring(t,19.3,L[0],L[1],C.accent,40);
    pk(t,19.5,1.2,E(L,F1,44,50),C.accent,{r:5.5,label:'v3'});pk(t,19.5,3,E(L,F2,44,50),C.accent,{r:5.5,label:'v3 (slow)',linear:true});
    const rp=[[R2[0]-17,R2[1]],[F2[0]+52,F2[1]]];pk(t,20,.9,rp,C.blue,{label:'read'});pk(t,21,.9,rev(rp),C.amber,{label:'v2 · stale!',r:7});
    // failover
    if(t>23.3){pop(t,23.4,L[0],L[1]-70,'leader crashed',C.red,{d:1.6,z:13});}
    if(t>24.3&&t<27.8)pill('promoted to leader',F1[0],F1[1]-68,{c:C.accent,z:12,a:V(t,24.5,27.4)});
    const nw=E(WR,F1,18,50);ln(nw,{a:V(t,24.6)*fa*.6});
    pk(t,25.2,1,nw,C.blue,{label:'write v4'});pk(t,26.3,1,[[F1[0]+52,F1[1]],[F2[0]-52,F2[1]]],C.accent,{r:5.5,label:'v4'});
    if(t>26)ln([[F1[0]+52,F1[1]],[F2[0]-52,F2[1]]],{a:V(t,26)*fa*.6,dash:[5,6],c:hexA(C.accent,.7)});
  }else{
    // ===== multi-leader =====
    const US=[300,280],EU=[700,280],U1=[110,280],U2=[890,280];
    const conflict=t>35.2&&t<36.7,res=t>36.7;
    const usShow=t<30?'—':t<33.4?'a=1':t<34.3?'a=1 b=2':res?'name=Bo':'name=Ann';
    const euShow=t<31.4?'—':t<32?'a=1':t<34.3?'a=1 b=2':'name=Bo';
    user(U1[0],U1[1],{label:'US user',...A(t,28.3)});user(U2[0],U2[1],{label:'EU user',...A(t,28.4)});
    tx('US region',US[0],170,{z:13,c:C.dim,wt:650,a:V(t,28.4)});tx('EU region',EU[0],170,{z:13,c:C.dim,wt:650,a:V(t,28.5)});
    const link=[[US[0]+58,US[1]],[EU[0]-58,EU[1]]];ln(link,{a:V(t,28.8),dash:[5,6],c:hexA(C.accent,.7)});pill('sync both ways',500,318,{c:C.accent,z:11.5,a:V(t,29,33)});
    db(US[0],US[1],{label:'Leader US',sub:usShow,w:116,h:88,...A(t,28.4),col:conflict?C.red:C.accent,st:conflict?'fail':'acc',down:null});
    db(EU[0],EU[1],{label:'Leader EU',sub:euShow,w:116,h:88,...A(t,28.5),col:conflict?C.red:C.accent,st:conflict?'fail':'acc',down:null});
    const u1=[[U1[0]+17,U1[1]],[US[0]-58,US[1]]],u2=[[U2[0]-17,U2[1]],[EU[0]+58,EU[1]]];ln(u1,{a:V(t,28.6)*.5});ln(u2,{a:V(t,28.6)*.5});
    pk(t,29,1,u1,C.blue,{label:'a=1'});pk(t,30.2,1.2,link,C.accent,{r:5.5});
    pk(t,31,1,u2,C.blue,{label:'b=2'});pk(t,32.2,1.2,rev(link),C.accent,{r:5.5});
    pk(t,33.4,.9,u1,C.blue,{label:'name=Ann',r:7});pk(t,33.4,.9,u2,C.blue,{label:'name=Bo',r:7});
    pk(t,34.5,1.4,link,C.accent,{label:'Ann',linear:true});pk(t,34.5,1.4,rev(link),C.accent,{label:'Bo',linear:true});
    ring(t,35.2,500,280,C.amber,40);
    pill('CONFLICT: same row, two values',500,200,{c:C.red,a:V(t,35.3),z:13});
    pill('last write wins → name = Bo',500,380,{c:C.green,a:V(t,36.8),z:13});
    pop(t,37,US[0],US[1]-72,'"Ann" silently lost',C.red,{d:2.2,z:13});
  }
}});})();
