/* ---------------- 11d. BLOOM FILTERS ---------------- */
(function(){
const NB=16,BX=k=>212+k*38,BY=170,KX=110,DB=[840,420],AP=[500,420];
// three hash functions per key: which bits each key lands on
const ADD=[['alice',[2,7,11],5.4],['bob',[4,7,13],7.4],['carol',[1,9,14],9.4]];
const ASK=[['dave',[3,9,12],12.4,'no'],['erin',[2,4,14],18.4,'fp'],['bob',[4,7,13],25.4,'yes']];
const setAt=k=>{let s=1e9;ADD.forEach(([,h,t0])=>{if(h.includes(k))s=Math.min(s,t0+1.1);});return s;};
const hashPath=(from,k)=>crv(from,[(from[0]+BX(k))/2,from[1]-60],[BX(k),BY+20]);
ch({id:'bloom-filters',group:'Data',title:'Bloom Filters: Skip Work You Do Not Need',dur:36,needs:['caching'],related:['storage-engines','hot-keys','cdn'],
beats:[
[0,'Is it even there?','Before an expensive disk or network lookup, ask a cheap question first: could this key possibly exist? A Bloom filter answers from a few bits in memory.'],
[5,'Adding a key','Run the key through k = 3 hash functions. Each one picks a bit in the array; set all three bits to 1.'],
[12,'Checking a key','Hash it the same way. If any of its bits is 0, the key was never added: skip the lookup completely.'],
[18,'False positives','If all its bits happen to be 1, set by other keys, the filter says "maybe". The real lookup finds nothing: one wasted read.'],
[25,'Never a false negative','A key that was added always finds all its bits set, so the filter never says no to a key that exists.'],
[30,'Size it to taste','About 10 bits per key with 7 hash functions gives roughly 1% false positives. Databases, caches and CDNs use Bloom filters to skip work.']],
use:['LSM-tree databases skip files that cannot hold a key','Caches and CDNs avoid caching one-hit wonders, or skip lookups for unknown keys','Checking "seen before?" across billions of items with little memory'],
cons:['A "maybe" can be wrong: there is always some false positive rate','You cannot remove keys from a plain Bloom filter (counting filters can)','It must be sized up front; overfilling it drives false positives up'],
draw(t){
  // the bit array
  const ba=V(t,.4);tx('bit array (in memory)',BX(0)-20,BY-52,{z:12,c:C.dim,al:'left',a:ba});
  for(let k=0;k<NB;k++){const on=t>=setAt(k),fl=ASK.some(([,h,t0])=>h.includes(k)&&t>=t0+1&&t<t0+3.2);
    draw(BX(k),BY,{a:ba*V(t,.4+k*.03)},()=>{rr(-16,-20,32,40,7);g.fillStyle=on?hexA(C.amber,.25):C.panel;g.fill();g.strokeStyle=fl?C.accent:on?C.amber:C.line;g.lineWidth=fl?2.5:1.5;g.stroke();});
    tx(on?'1':'0',BX(k),BY+1,{z:16,wt:800,f:MONO,c:on?C.amber:C.faint,a:ba});tx(String(k),BX(k),BY+34,{z:10,c:C.faint,f:MONO,a:ba});}
  server(AP[0],AP[1],{label:'App',w:112,...A(t,.8)});db(DB[0],DB[1],{label:'Disk',sub:'slow lookup',w:110,h:86,...A(t,1)});
  // adding keys
  ADD.forEach(([key,h,t0],i)=>{const y=300+i*44,a=V(t,t0-.3,11.6);if(a<=0)return;pill(key,KX,y,{c:C.blue,z:13,f:MONO,a});
    h.forEach(k=>{const pth=hashPath([KX+40,y],k);if(t>t0&&t<t0+2.2)ln(pth,{c:hexA(C.blue,.5),dash:[4,5],p:P(t,t0,t0+.9),a});pk(t,t0,1.1,pth,C.blue,{r:4.5});});});
  if(t>5.6&&t<11.8)pill('h1, h2, h3 → 3 bits per key',KX+40,450,{c:C.dim,z:12,a:V(t,5.6,11.6)});
  // checking keys
  ASK.forEach(([key,h,t0,res],i)=>{const a=V(t,t0-.3,t0+5.4);if(a<=0)return;const from=[AP[0]-40,AP[1]-34];pill(`check "${key}"`,AP[0],AP[1]-62,{c:C.accent,z:13,f:MONO,a});
    h.forEach(k=>{pk(t,t0,1,hashPath(from,k),C.accent,{r:4.5});if(t>t0+1&&t<t0+3.2&&t<setAt(k))ring(t,t0+1,BX(k),BY,C.red,26);});
    const toDb=[[AP[0]+56,AP[1]],[DB[0]-55,DB[1]]];
    if(res==='no'){if(t>t0+1.3)pill('a 0 bit → definitely not here · disk skipped',AP[0],AP[1]+60,{c:C.green,z:12.5,a:a*V(t,t0+1.3)});}
    else{if(t>t0+1.3)pill('all 1s → maybe: check the disk',AP[0],AP[1]+60,{c:C.amber,z:12.5,a:a*V(t,t0+1.3,t0+2.8)});pk(t,t0+1.6,.8,toDb,C.amber,{r:5});
      pk(t,t0+2.6,.8,rev(toDb),res==='fp'?C.red:C.green,{label:res==='fp'?'not found':'found ✓'});
      if(t>t0+3.4)pill(res==='fp'?'false positive: one wasted read':'keys that exist always pass',AP[0],AP[1]+60,{c:res==='fp'?C.red:C.green,z:12.5,a:a*V(t,t0+3.4)});}});
  if(t>19.6&&t<24)pill('bits 2, 4 and 14 were set by alice, bob and carol',BX(7),BY+66,{c:C.amber,z:12,a:V(t,19.6,23.8)});
  // sizing
  const sa=V(t,30.4);if(sa>0){panel(60,236,420,128,{a:sa});tx('per key',78,262,{z:12,c:C.dim,al:'left',a:sa});
    [['10 bits + 7 hashes','≈ 1% false positives'],['15 bits + 10 hashes','≈ 0.1%']].forEach(([a,b],k)=>{tx(a,78,292+k*40,{z:14,f:MONO,wt:700,al:'left',a:sa*V(t,30.6+k*.6)});tx(b,462,292+k*40,{z:14,f:MONO,wt:800,c:C.green,al:'right',a:sa*V(t,30.6+k*.6)});});
    pill('1 billion keys ≈ 1.2 GB of memory at 1%',270,392,{c:C.accent,z:12,a:sa*V(t,31.8)});}
}});})();
