/* ---------------- 11b. CACHE INVALIDATION: fresh and cheap ---------------- */
function cacheNums(p){const ttl=p.ttl>60?Infinity:p.ttl,eff=Math.min(ttl,60);const db=(ttl===Infinity?0:1000/ttl)+(p.del?5:0);const stale=p.del?.001*eff:.005*eff/2;return{db,stale};}
chal('cache-invalidation',{title:'Fresh and cheap',goal:'1,000 products, 500 reads/s, 5 price changes/s. Keep stale reads at or under 1% while the database handles at most 200 reads/s.',
  hint:'A TTL alone cannot win: short TTLs flood the database, long ones serve stale prices. Delete on write keeps it fresh; a moderate TTL mops up the rare race.',
  make:simGame({dur:8,defaults:{ttl:30,del:false},intro:'Pick a TTL and whether writes delete the cached copy, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('TTL',1,61,1,p.ttl,v=>v>60?'∞ (never)':`${v} s`,v=>{p.ttl=v;re();});api.toggle('Delete cache on write',p.del,v=>{p.del=v;re();});},
    build(p,api){const N=cacheNums(p);let acc=0,T=0;const fl=[];
      return{step(dt,t){T=t;acc+=dt*30;const now=api.now();while(acc>=1){acc--;const miss=Math.random()<N.db/500,stale=!miss&&Math.random()<N.stale*6;
          fl.push({t0:now,d:.5,pts:[[150,300],[480,200]],c:C.blue,r:3.5});fl.push({t0:now+.5,d:miss?1:.5,pts:miss?[[480,200],[820,330],[150,300]]:[[480,200],[150,300]],c:stale?C.red:miss?C.amber:C.green,r:3.5});}
          if(Math.random()<dt*2&&p.del)fl.push({t0:api.now(),d:.6,pts:[[820,110],[480,200]],c:C.red,r:3.5,label:'delete'});},
        draw(now){flyers(now,fl);server(150,300,{label:'App',w:110});box(480,200,{label:'Cache',sub:p.ttl>60?'no TTL':`TTL ${p.ttl} s`,c:C.amber,w:150,h:56});db(820,330,{label:'Database',sub:'200 reads/s max',w:130,h:90,st:N.db>200?'fail':'ok',down:'OVERLOADED'});
          box(820,110,{label:'Writers',sub:'5 changes/s',c:C.accent,w:130,h:48});},
        hud(){return[['stale reads',`${(N.stale*100).toFixed(2)}%`,N.stale<=.01?C.green:C.red],['DB reads',`${Math.round(N.db)}/s`,N.db<=200?C.green:C.red]];},
        score(){const a=N.stale<=.01,b=N.db<=200;if(a&&b)return{stars:3,title:'Fresh and cheap',msg:`${(N.stale*100).toFixed(2)}% stale, ${Math.round(N.db)} DB reads/s. Deleting on write keeps prices current; the TTL is just a safety net for rare races.`};
          if(a||b)return{stars:2,title:a?'Fresh, but the database is drowning':'Cheap, but stale',msg:a?'That TTL is so short the database refills everything constantly. Lengthen it.':p.del?'Without an expiry, a stale copy from a race can live forever. Add a moderate TTL.':'A TTL alone leaves old prices around. Delete the cached copy when the price changes.'};
          return{stars:1,title:'Stale and expensive',msg:'Turn on delete-on-write, then find a TTL long enough to spare the database.'};}};}})});
