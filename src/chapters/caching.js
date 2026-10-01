/* ---------------- 11. CACHING ---------------- */
(function(){
  const CL=[100,300],AP=[360,300],CA=[660,150],DB=[660,430];
  const c2a=[[118,300],[304,300]],a2c=[[416,286],[585,158]],a2d=[[416,314],[612,415]],c2d=[[660,182],[660,386]];
  const LRU=[[0,['D','C','B','A']],[30.9,['B','D','C','A']],[33.9,['E','B','D','C']],[35.9,['C','E','B','D']],[38.9,['F','C','E','B']]];
  const OPS=[[29.3,'get B',C.green],[31.9,'put E  (cache full)',C.amber],[34.4,'get C',C.green],[36.9,'put F  (cache full)',C.amber]];
  const SX=k=>320+k*120;
ch({id:'caching',group:'Data',title:'Caching Strategies & LRU Eviction',dur:42,
beats:[
[0,'Cache-aside: check the cache first','The app asks the fast in-memory cache first. On a miss, it reads the slow database, then saves the answer in the cache for next time.'],
[7,'Cache hit: skip the database','Later reads for the same key come straight from memory in about 1 ms instead of 50 ms. Watch the hit rate climb.'],
[13,'Write-through: write both, then reply','On a write, the app updates the cache and the database together before replying. Reads are always fresh, but every write pays the database cost.'],
[19,'Write-back: reply now, save later','Writes go only to the cache and are acknowledged instantly. "Dirty" entries are flushed to the database in batches later.'],
[24,'…risky if the cache dies','If the cache crashes before a flush, those unsaved writes are gone. Fast, but you give up durability.'],
[28,'Eviction: the cache is small (LRU)','Memory is limited, so when it\'s full something must go. LRU (least recently used) evicts whatever hasn\'t been touched for the longest time.']],
use:['Cache-aside: read-heavy data that tolerates brief staleness (profiles, product pages)','Write-through: data that is read right after it\'s written and must be fresh','Write-back: very high write rates where losing a few writes is acceptable (counters, metrics)'],
cons:['Stale data: invalidation is famously one of the hard problems','Cold cache after restart and "thundering herd" on popular misses','Write-back risks data loss; write-through adds write latency; all add a component to run']
,draw(t){
  if(t<28.2){const fa=A(t,.2,27.7).a;
    const cacheDown=t>26.3;
    user(CL[0],CL[1],{label:'client',a:fa});server(AP[0],AP[1],{label:'App',sub:'server',a:fa});
    box(CA[0],CA[1],{label:'Cache',sub:'in memory · ~1 ms',w:156,h:62,c:C.amber,st:cacheDown?'fail':null,...A(t,.3),a:fa});
    db(DB[0],DB[1],{label:'Database',sub:t<14.9?'on disk · ~50 ms':'user:7 = v2',w:124,h:88,...A(t,.4),a:fa});
    [c2a,a2c,a2d].forEach(p=>ln(p,{a:fa*.55}));if(t>19)ln(c2d,{a:V(t,19.3,27.7)*.6,dash:[4,6]});
    // cache chips
    const chips=[];if(t>5.9)chips.push(['user:7',t>15.1&&t<16?'fresh':'clean']);
    const dirtyTimes=[20.7,21.5,22.3],dirtyKeys=['user:8','user:9','user:5'];
    dirtyTimes.forEach((dt,i)=>{if(t>dt)chips.push([dirtyKeys[i],t<23.6?'dirty':'clean']);});
    [[25.3,'user:3'],[25.9,'user:4']].forEach(([dt,k])=>{if(t>dt)chips.push([k,'dirty']);});
    chips.forEach(([k,st],i)=>{const x=592+(i%3)*78,y=212+Math.floor(i/3)*30;const c=cacheDown&&st==='dirty'?C.red:st==='dirty'?C.amber:st==='fresh'?C.green:C.dim;
      const fall=cacheDown&&st==='dirty'?clamp((t-26.3)/1.2):0;pill(k+(st==='dirty'?' •':''),x,y+60*fall*fall,{c,z:11.5,f:MONO,tc:st==='clean'?C.text:c,a:fa*(1-fall)});});
    // cache-aside miss
    pk(t,.5,.8,c2a,C.blue,{label:'GET user:7'});pk(t,1.35,.7,a2c,C.blue,{r:5.5});pop(t,2.05,CA[0],CA[1]-48,'MISS',C.red,{d:1.1});
    pk(t,2.15,.7,rev(a2c),C.red,{r:4.5});pk(t,2.9,.9,a2d,C.blue,{r:5.5});spin(t,DB[0]+80,DB[1],{c:C.dim,a:t>3.8&&t<4.2?1:0});
    pk(t,4.2,.9,rev(a2d),C.green,{r:5.5});pk(t,5.15,.7,a2c,C.amber,{label:'SET user:7'});pk(t,5.2,.8,rev(c2a),C.green);
    // hits
    let hits=0;each(t,7.3,12.2,1,3,(i,s)=>{pk(t,s,.6,c2a,C.blue,{r:5.5});pk(t,s+.65,.5,a2c,C.blue,{r:5});pop(t,s+1.15,CA[0],CA[1]-48,'HIT',C.green,{d:.9});pk(t,s+1.2,.5,rev(a2c),C.amber,{r:5});pk(t,s+1.75,.6,rev(c2a),C.green,{r:5.5});});
    if(t>8.45)hits=Math.min(5,Math.floor((t-8.45)/1)+1);
    // write-through
    pk(t,13.4,.8,c2a,C.blue,{label:'PUT user:7 = v2'});pk(t,14.3,.7,a2c,C.blue,{r:5.5});pk(t,14.3,.7,a2d,C.blue,{r:5.5});
    spin(t,DB[0]+80,DB[1],{c:C.dim,a:t>15&&t<15.8?1:0});pk(t,15.1,.7,rev(a2c),C.green,{r:5});pk(t,15.9,.7,rev(a2d),C.green,{r:5});pk(t,16.7,.8,rev(c2a),C.green,{label:'saved ✓'});
    pill('waits for cache AND database',AP[0],AP[1]-58,{c:C.blue,z:12,a:V(t,14.4,17.6)});
    // write-back
    const wb=[19.4,20.2,21,24,24.6];wb.forEach((s,i)=>{pk(t,s,.7,c2a,C.blue,{r:5.5,label:i===0?'PUT user:8':null});pk(t,s+.72,.6,a2c,C.blue,{r:5});pk(t,s+1.35,.6,rev(c2a),C.green,{r:5,label:i===0?'ok (2 ms)':null});});
    pk(t,22.6,1,c2d,C.blue,{label:'flush ×3',r:7});
    if(t>26.3){pop(t,26.4,CA[0],CA[1]-78,'cache crashed',C.red,{d:1.4,z:13});pill('2 unsaved writes lost!',CA[0],330,{c:C.red,z:13,a:V(t,26.6,27.6)});}
    // stats
    const sa=V(t,1);if(sa>0){const miss=t>2.05?1:0,tot=hits+miss;panel(790,262,190,96,{a:sa*fa});
      tx('hit rate',806,288,{z:12.5,al:'left',c:C.dim,a:sa*fa});tx(tot?Math.round(hits/tot*100)+'%':'—',966,288,{z:18,wt:750,al:'right',c:C.green,f:MONO,a:sa*fa});
      const lat=t<8.5?'55 ms':t<13.4?'2 ms':t<19?'52 ms':'2 ms';
      tx(t<13.4?'last read':'last write',806,330,{z:12.5,al:'left',c:C.dim,a:sa*fa});tx(t<6?'…':lat,966,330,{z:14,wt:700,al:'right',c:C.text,f:MONO,a:sa*fa});}
  }else{
    // ===== LRU =====
    const la=A(t,28.4).a;
    tx('most recent',SX(0),226,{z:12.5,c:C.green,wt:650,a:la});tx('least recent',SX(3),226,{z:12.5,c:C.red,wt:650,a:la});
    ln([[SX(0)-40,372],[SX(3)+40,372]],{a:la,arrow:true,c:C.dim});tx('time since last use →',500,392,{z:12,c:C.dim,a:la});
    for(let k=0;k<4;k++)draw(SX(k),300,{a:la*.8},()=>{g.setLineDash([4,5]);rr(-50,-42,100,84,12);g.strokeStyle=C.line;g.lineWidth=1.5;g.stroke();g.setLineDash([]);});
    tx('capacity: 4 items',870,300,{z:13,c:C.dim,a:la});
    OPS.forEach(([t0,s,c],i)=>pill(s,500,150,{c,z:14,f:MONO,a:V(t,t0,(OPS[i+1]||[42])[0]-.5)}));
    let k=0;for(let j=0;j<LRU.length;j++)if(t>=LRU[j][0])k=j;
    const cur=LRU[k][1],nxt=LRU[k+1];const d=1.2;
    const items=new Set([...cur,...(nxt?nxt[1]:[])]);
    items.forEach(it=>{let x,y=300,c=C.edge,a=la,fill=C.panel;
      const i0=cur.indexOf(it);
      if(nxt&&t>nxt[0]-d){const p=eio(clamp((t-(nxt[0]-d))/d)),i1=nxt[1].indexOf(it);
        if(i0>=0&&i1>=0){x=lerp(SX(i0),SX(i1),p);if(i1<i0){c=C.green;}}
        else if(i0>=0){x=SX(i0);y=300+150*p*p;a=la*(1-p);c=C.red;}
        else{x=SX(0);y=lerp(160,300,p);a=la*clamp(p*2);c=C.amber;}}
      else{if(i0<0)return;x=SX(i0);}
      draw(x,y,{a},()=>{glowOn(c,c===C.edge?0:18);rr(-44,-36,88,72,12);g.fillStyle=fill;g.fill();glowOff();g.strokeStyle=c;g.lineWidth=2.2;g.stroke();tx(it,0,1,{z:28,wt:750,c:C.text});});
      if(c===C.red&&y>320)tx('evicted',x,y+48,{z:12,wt:700,c:C.red,a});});
    pill('Popular items stay; forgotten ones fall out',500,480,{c:C.green,a:V(t,39.3),z:13});
  }
}});})();
