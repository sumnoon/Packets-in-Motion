/* ---------------- 10. SHARDING: pick the shard key ---------------- */
chal('sharding',{title:'Pick the shard key',goal:'Split the users table so no shard gets more than 30% of the traffic, using at most 4 shards.',
  hint:'Real-world values (countries, dates) are lumpy. A hash spreads keys evenly, whatever they look like.',
  make:(()=>{const C_=[['US',45],['India',20],['Brazil',12],['Germany',10],['Japan',8],['Other',5]],M=[2,2,3,3,4,4,5,6,8,11,18,34];
    function dist(key,n){const s=new Array(n).fill(0);if(key==='country')C_.forEach(([c,w],k)=>s[k%n]+=w);else if(key==='month'){M.forEach((w,k)=>s[Math.min(n-1,Math.floor(k*n/12))]+=w);}else{for(let k=0;k<n;k++)s[k]=100/n*(1+(rnd(k*7+n)-.5)*.08);}const tot=s.reduce((a,b)=>a+b,0);return s.map(v=>v/tot);}
    return simGame({dur:6,defaults:{key:'country',n:3},intro:'Choose a shard key and the number of shards, then press <b>Run it</b> to send traffic.',
      controls(api,p,re){api.seg('Shard key',[['country','country'],['month','signup month'],['hash','hash(user_id)']],p.key,v=>{p.key=v;re();});api.slider('Shards',2,6,1,p.n,v=>`${v}`,v=>{p.n=v;re();});},
      build(p,api){const d=dist(p.key,p.n),sx=k=>p.n===1?500:170+k*(660/(p.n-1));let acc=0;const fl=[];const RT=[500,150];
        return{step(dt){acc+=dt*50;const now=api.now();while(acc>=1){acc--;let x=PIM_RANDOM.next(),k=0;for(;k<p.n-1;k++){if(x<d[k])break;x-=d[k];}fl.push({t0:now,d:.55,pts:[RT,[sx(k),350]],c:d[k]>.3?C.red:C.blue,r:3.5});}},
          draw(now){flyers(now,fl);box(RT[0],RT[1],{label:'Router',sub:`shard by ${p.key==='hash'?'hash(user_id)':p.key}`,w:200,h:54});
            d.forEach((v,k)=>{db(sx(k),380,{label:`Shard ${k+1}`,w:88,h:76,st:v>.3?'hot':'ok'});meter(sx(k)-44,432,88,8,v/.6,v>.3?C.red:v>.2?C.amber:C.green);tx(`${(v*100).toFixed(0)}%`,sx(k),456,{z:13,wt:800,c:v>.3?C.red:C.text,f:MONO});});},
          hud(){const m=Math.max(...d);return[['busiest shard',`${(m*100).toFixed(0)}%`,m<=.3?C.green:C.red],['shards',`${p.n}`,p.n<=4?C.text:C.amber]];},
          score(){const m=Math.max(...d);if(m<=.3&&p.n<=4)return{stars:3,title:'Evenly split',msg:`Hashing the user id spreads users almost perfectly: the busiest shard takes ${(m*100).toFixed(0)}%. Country and signup date are lumpy in real life.`};
            if(m<=.3)return{stars:2,title:'Even, but costly',msg:'It works, but you did not need that many shards. Try fewer.'};
            return{stars:1,title:`Hot shard: ${(m*100).toFixed(0)}%`,msg:p.key==='country'?'Almost half the users are in the US, so their shard melts.':p.key==='month'?'New users all land in the newest month. One shard takes every write.':'Too few shards. Each one still carries a big share.'};}};}});})()});
