/* ---------------- 11d. BLOOM FILTERS: size the filter ---------------- */
// false positive rate for b bits per key and k hash functions
const bloomFP=(b,k)=>Math.pow(1-Math.exp(-k/b),k);
chal('bloom-filters',{title:'Size the Bloom filter',goal:'A filter in front of the disk holds 1 million keys. Keep false positives at or under 1% using at most 1.5 MB of memory.',
  hint:'More bits per key lowers false positives but costs memory. The best number of hash functions is about 0.7 × bits per key; too many fills the array with 1s.',
  make:simGame({dur:8,defaults:{b:4,k:1},intro:'Choose bits per key and the number of hash functions, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Bits per key',1,16,1,p.b,v=>`${v} bits`,v=>{p.b=v;re();});api.slider('Hash functions',1,12,1,p.k,v=>`${v}`,v=>{p.k=v;re();});},
    build(p,api){const fp=bloomFP(p.b,p.k),mb=p.b/8,fill=1-Math.exp(-p.k/p.b);let acc=0,n=0,wasted=0;const fl=[];const AP=[150,300],BF=[480,300],DK=[840,300];
      return{step(dt){acc+=dt*14;const now=api.now();while(acc>=1){acc--;n++;const maybe=rnd(n*7.13+p.b*31+p.k)<fp;if(maybe)wasted++;
          fl.push({t0:now,d:.45,pts:[[AP[0]+56,AP[1]],[BF[0]-120,BF[1]]],c:C.blue,r:3.5});
          if(maybe)fl.push({t0:now+.45,d:.5,pts:[[BF[0]+120,BF[1]],[DK[0]-55,DK[1]]],c:C.red,r:4,label:n%5===0?'wasted read':null});else fl.push({t0:now+.45,d:.4,pts:[[BF[0],BF[1]+40],[BF[0],BF[1]+110]],c:C.green,r:3.5});}},
        draw(now){flyers(now,fl);server(AP[0],AP[1],{label:'App',sub:'lookups for absent keys',w:150});db(DK[0],DK[1],{label:'Disk',sub:'slow',w:110,h:86});
          draw(BF[0],BF[1],{},()=>{rr(-120,-40,240,80,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=mb<=1.5?C.accent:C.red;g.lineWidth=2;g.stroke();});
          for(let i=0;i<32;i++){const on=rnd(i+p.b*3+p.k*101)<fill;g.save();rr(BF[0]-108+(i%16)*13.5,BF[1]-22+Math.floor(i/16)*20,11,15,3);g.fillStyle=on?hexA(C.amber,.6):C.panel2;g.fill();g.restore();}
          tx(`Bloom filter · ${(fill*100).toFixed(0)}% of bits are 1`,BF[0],BF[1]-58,{z:12.5,c:C.dim});tx('"no" → skip the disk',BF[0],BF[1]+128,{z:12,c:C.green});},
        hud(){return[['false positives',`${(fp*100).toFixed(fp<.01?2:1)}%`,fp<=.01?C.green:C.red],['memory',`${mb.toFixed(2)} MB`,mb<=1.5?C.green:C.red],['best k for these bits',`${Math.max(1,Math.round(p.b*.693))}`,C.dim]];},
        score(){const a=fp<=.01,b=mb<=1.5;
          if(a&&b)return{stars:3,title:`${(fp*100).toFixed(2)}% in ${mb.toFixed(2)} MB`,msg:`${p.b} bits per key with ${p.k} hash functions. About 10 bits and 7 hashes per key is the classic 1% filter.`};
          if(a||b)return{stars:2,title:a?'Accurate, but too big':'Small, but too many false positives',msg:a?'Fewer bits per key would still reach 1% if the hash count is right (about 0.7 × bits).':p.k>Math.round(p.b*.7)+1?'Too many hash functions fill the array with 1s. Use about 0.7 × bits per key.':'Add bits per key, and use about 0.7 × that many hash functions.'};
          return{stars:1,title:'Leaky and expensive',msg:'Aim for about 10 bits per key and 7 hash functions.'};}};}})});
