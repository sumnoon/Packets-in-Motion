/* ---------------- 12. CAP & CONSISTENCY ---------------- */
(function(){
  const N1=[320,280],N2=[680,280],CA_=[130,440],CB=[870,440];
  const pA=[[146,430],[288,322]],pB=[[854,430],[712,322]],link=[[372,280],[628,280]];
ch({id:'cap',group:'Data',title:'CAP Theorem & Consistency Models',dur:38,
beats:[
[0,'Same data on two nodes','Two replicas hold the same value, x = 1. Client A talks to Node 1, client B talks to Node 2.'],
[3,'Normally: write, then sync','A writes x = 2 to Node 1. Node 1 copies it to Node 2, so B reads 2 as well. Everyone agrees.'],
[9,'Network partition!','The link between the nodes breaks. Both nodes are still alive, but they can\'t reach each other. In a distributed system, this will eventually happen.'],
[11.5,'A writes x = 3…','Node 1 accepts the new value, but it has no way to tell Node 2.'],
[14,'Choice 1: Consistency (CP)','Node 2 refuses to answer rather than risk returning old data. The data stays correct, but B gets an error: unavailable.'],
[20,'Choice 2: Availability (AP)','Node 2 answers with what it has: x = 2. B gets a response, but it\'s stale.'],
[25,'Partition heals → converge','When the link returns, the nodes sync and agree on x = 3 again. That\'s eventual consistency: replicas converge once they can talk.'],
[30,'Strong vs eventual consistency','Strong: every read after a write sees the new value. Eventual: reads may see old values for a short window, in exchange for speed and availability.']],
use:['CP (consistency first): bank balances, inventory counts, leader election, locks','AP (availability first): social feeds, likes, shopping carts, DNS, caches','Many databases let you tune this per query (e.g. quorum reads/writes)'],
cons:['CAP only bites during a partition; the rest of the time the trade-off is latency vs consistency (PACELC)','Strong consistency costs latency: nodes must coordinate on every write','Eventual consistency pushes complexity to the app: stale reads, conflict handling']
,draw(t){
  if(t<30.3){const fa=A(t,.2,29.8).a;
    const broken=t>9.3&&t<25.3;
    const x1=t<4.5?1:t<12.9?2:3,x2=t<6?1:t<27?2:3;
    user(CA_[0],CA_[1],{label:'Client A',...A(t,.3),a:fa});user(CB[0],CB[1],{label:'Client B',...A(t,.4),a:fa});
    ln(pA,{a:fa*.5});ln(pB,{a:fa*.5});
    if(!broken)ln(link,{a:V(t,.8)*fa,c:t>25.3&&t<26.3?C.green:C.edge,w:3});
    else{ln([link[0],[478,280]],{c:hexA(C.red,.7),w:3,a:fa});ln([[522,280],link[1]],{c:hexA(C.red,.7),w:3,a:fa});
      const sh=Math.sin(t*20)*1.5;draw(500+sh,280,{a:fa},()=>{g.strokeStyle=C.red;g.lineWidth=3;g.lineJoin='round';glowOn(C.red,14);g.beginPath();g.moveTo(-6,-26);g.lineTo(6,-6);g.lineTo(-6,6);g.lineTo(6,26);g.stroke();glowOff();});
      pill('network partition',500,226,{c:C.red,a:V(t,9.4)*fa});}
    db(N1[0],N1[1],{label:'Node 1',sub:'x = '+x1,w:104,h:84,...A(t,.3),a:fa});
    db(N2[0],N2[1],{label:'Node 2',sub:'x = '+x2,w:104,h:84,...A(t,.4),a:fa,st:t>14.5&&t<19.6?'hot':'ok'});
    if(t>14.6&&t<19.6)pill('refusing: might be stale',N2[0],N2[1]-66,{c:C.amber,z:12,a:V(t,14.8,19.2)});
    // normal
    pk(t,3.3,1.2,pA,C.blue,{label:'write x=2'});pk(t,4.8,1.2,link,C.accent,{label:'sync'});
    pk(t,6.3,1,pB,C.blue,{label:'read x'});pk(t,7.4,1,rev(pB),C.green,{label:'x = 2'});
    // partition
    pk(t,11.8,1.1,pA,C.blue,{label:'write x=3'});
    {const p=(t-13.1)/.6;if(p>0&&p<1)dot(lerp(372,476,esin(p)),280,C.accent,5.5);drop(t,13.7,476,280,{label:'✕ can\'t reach'});}
    // CP
    pk(t,14.6,1,pB,C.blue,{label:'read x'});pk(t,15.9,1.1,rev(pB),C.red,{label:'error: unavailable'});
    pk(t,17.6,1,pB,C.blue,{label:'read x'});pk(t,18.7,1,rev(pB),C.red,{label:'error'});
    // AP
    pk(t,20.4,1,pB,C.blue,{label:'read x'});pk(t,21.5,1.1,rev(pB),C.amber,{label:'x = 2 (stale)',r:7});
    // heal
    pk(t,25.8,1.2,link,C.accent,{label:'sync x=3'});ring(t,27,N2[0],N2[1],C.green,44);
    pk(t,27.6,1,pB,C.blue,{label:'read x'});pk(t,28.7,1,rev(pB),C.green,{label:'x = 3 ✓'});
    // CAP triangle
    const ta=V(t,.8,29.8);const T=[[880,80],[838,152],[922,152]];
    const hiC=t>14&&t<20,hiA=t>20&&t<25,part=t>9.3&&t<25.3;
    draw(0,0,{a:ta},()=>{g.beginPath();g.moveTo(...T[0]);g.lineTo(...T[1]);g.lineTo(...T[2]);g.closePath();g.strokeStyle=C.edge;g.lineWidth=1.5;g.stroke();
      if(hiC){ln([T[0],T[2]],{c:C.accent,w:4});}if(hiA){ln([T[1],T[2]],{c:C.accent,w:4});}});
    [['C',T[0],hiC],['A',T[1],hiA],['P',T[2],part]].forEach(([s,p,on])=>{dot(p[0],p[1],on?C.accent:C.edge,on?9:7,ta);tx(s,p[0]+(s==='A'?-18:s==='P'?18:0),p[1]+(s==='C'?-18:4),{z:14,wt:750,c:on?C.accent:C.dim,a:ta});});
    tx('Consistency · Availability · Partition tolerance',880,184,{z:11,c:C.dim,a:ta});
    tx(hiC?'picked C + P':hiA?'picked A + P':'',880,202,{z:12,wt:700,c:C.accent,a:ta});
  }else{
    const la=A(t,30.4).a;
    const row=(y,name,vals,xs,win)=>{tx(name,150,y,{z:15,wt:700,al:'right',c:C.text,a:la});ln([[180,y],[880,y]],{a:la,arrow:true,c:C.edge});
      if(win){draw(0,0,{a:la*V(t,31)},()=>{rr(330,y-38,190,76,8);g.fillStyle=hexA(C.amber,.1);g.fill();});tx('inconsistency window',425,y+52,{z:12,c:C.amber,a:la*V(t,32)});}
      draw(330,y,{a:la},()=>{g.fillStyle=C.accent;g.fillRect(-2,-30,4,60);});pill('write x = 3',330,y-44,{c:C.accent,z:12,a:la});
      vals.forEach((v,k)=>{const a=V(t,31+k*.55)*la;const c=v==='3'?C.green:C.amber;dot(xs[k],y,c,13,a);tx(v,xs[k],y+1,{z:13,wt:800,c:'#0b1019',a});});};
    tx('reads over time →',880,150,{z:12,al:'right',c:C.dim,a:la});
    row(220,'Strong',['3','3','3','3','3','3'],[400,470,560,650,740,830],false);
    row(380,'Eventual',['2','2','3','3','3','3'],[400,470,560,650,740,830],true);
    pill('every read sees the latest write',640,270,{c:C.green,z:12,a:V(t,33.5)});
    pill('fast & available, briefly stale',640,470,{c:C.amber,z:12,a:V(t,34.3)});
  }
}});})();
