/* ---------------- 22. CAPSTONE: launch the URL shortener ---------------- */
chal('capstone',{title:'Launch the shortener',goal:'Build it, then survive the load test: launch traffic, a viral link at 3,000 req/s, an app server dying, then a bot attack. Serve ≥99% of real users, p95 ≤ 80 ms, spend ≤ $18/h.',
  hint:'The viral link is almost all reads: cache it. Counting clicks writes to the DB on every redirect, so push that through a queue. Keep a spare app server, and put a limiter in front of the bots.',
  make:(()=>{const COST={app:3,cache:2,queue:1,rl:1,rep:2};
    return simGame({dur:18,defaults:{apps:2,cache:false,queue:false,rl:false,rep:0},intro:'Choose your building blocks, watch the cost, then press <b>Run load test</b>.',runLabel:'Run load test',
      controls(api,p,re){api.slider('App servers',1,4,1,p.apps,v=>`${v} × 1,000/s`,v=>{p.apps=v;re();});api.toggle('Cache (Redis)',p.cache,v=>{p.cache=v;re();});api.toggle('Queue for click counts',p.queue,v=>{p.queue=v;re();});
        api.toggle('Rate limiter',p.rl,v=>{p.rl=v;re();});api.slider('DB read replicas',0,2,1,p.rep,v=>`${v}`,v=>{p.rep=v;re();});},
      build(p,api){const cost=p.apps*COST.app+(p.cache?COST.cache:0)+(p.queue?COST.queue:0)+(p.rl?COST.rl:0)+p.rep*COST.rep;let tot=0,bad=0,lat=[],phase='Launch',alive=p.apps,acc=0,appU=0,dbU=0;const fl=[];
        const X={u:70,rl:190,lb:310,app:450,cache:610,db:800,q:610,wk:800};const AY=k=>alive===1&&p.apps===1?240:150+k*(180/Math.max(1,p.apps-1));
        return{step(dt,t){const legit=t<6?1000:t<12?3000:2000,bot0=t>=12?2000:0;phase=t<6?'Launch':t<12?(t>=9?'Viral + a server dies':'Viral link'):'Bot attack';alive=t>=9?p.apps-1:p.apps;
            const bot=p.rl?bot0*.05:bot0,inc=legit+bot,cap=Math.max(0,alive)*1000,served=Math.min(inc,cap),sL=served*legit/inc;appU=cap?inc/cap:9;
            // ~100 clicks per new link. Writes (new links, and click counts unless queued) all hit the primary;
            // reads that miss the cache share the primary's leftover capacity and every replica's.
            const reads=sL*.99,writes=sL*.01,miss=p.cache?reads*.1:reads,clicks=p.queue?0:reads,dbCap=600*(1+p.rep),wr=writes+clicks;
            const wOk=Math.min(wr,600),readOk=Math.min(miss,dbCap-wOk),dbFail=(miss-readOk)+(wr-wOk);dbU=(miss+wr)/dbCap;
            const good=Math.max(0,sL-Math.max(0,dbFail));tot+=legit*dt;bad+=(legit-good)*dt;
            let ms=15+(p.cache?3:25)+(appU>.95?45:appU>.8?15:0)+(dbU>.95?70:dbU>.8?20:0);lat.push([ms,legit*dt]);
            acc+=dt*inc/150;const now=api.now();while(acc>=1){acc--;const isBot=Math.random()<bot0/(legit+bot0);const blocked=isBot&&p.rl;const k=Math.floor(Math.random()*Math.max(1,alive));
              const fail=!blocked&&(Math.random()>(served/inc)||Math.random()<Math.max(0,dbFail)/Math.max(sL,1));
              const pts=blocked?[[X.u,240],[X.rl,240]]:[[X.u,240],[X.lb,240],[X.app,AY(k)],p.cache?[X.cache,150]:[X.db,240]];
              fl.push({t0:now,d:.8,pts,c:blocked?C.amber:isBot?C.red:fail?C.red:C.blue,r:3.5,drop:blocked?.95:fail?.7:0});}},
          draw(now,running){flyers(now,fl);user(X.u,240,{label:'users',c:C.blue});if(p.rl)box(X.rl,240,{label:'Limiter',c:C.amber,w:96,h:48});
            box(X.lb,240,{label:'LB',w:70,h:48});for(let k=0;k<p.apps;k++)server(X.app,AY(k),{label:`App ${k+1}`,w:96,h:44,st:running&&k>=alive?'fail':appU>.95&&running?'hot':'ok',down:''});
            if(p.cache)box(X.cache,150,{label:'Cache',c:C.green,w:100,h:48});db(X.db,240,{label:'DB',w:86,h:74,st:running&&dbU>.95?'hot':'ok'});
            for(let r=0;r<p.rep;r++)db(X.db+80+r*60,300,{label:'R'+(r+1),w:50,h:46});
            if(p.queue){box(X.q,360,{label:'Queue',c:C.amber,w:96,h:46});server(X.wk,380,{label:'Counter',w:96,h:44});}
            if(running)tx(phase,W/2,40,{z:17,wt:800,c:phase.includes('Bot')||phase.includes('dies')?C.red:C.accent});
            tx(`$${cost}/h`,90,470,{z:18,wt:800,c:cost<=18?C.green:C.red,f:MONO});},
          hud(){const s=tot?1-bad/tot:1;const sorted=lat.slice().sort((a,b)=>a[0]-b[0]);let w=0,W_=sorted.reduce((a,b)=>a+b[1],0),p95=0;for(const[m,v]of sorted){w+=v;if(w>=W_*.95){p95=m;break;}}
            this._p95=p95;return[['served',`${(s*100).toFixed(1)}%`,s>=.99?C.green:C.red],['p95',`${p95} ms`,p95<=80?C.green:C.red],['cost',`$${cost}/h`,cost<=18?C.green:C.red]];},
          score(){const s=1-bad/tot;this.hud();const p95=this._p95;
            if(s>=.99&&p95<=80&&cost<=18)return{stars:3,title:'Launched without a scratch',msg:`${(s*100).toFixed(1)}% served, p95 ${p95} ms, $${cost}/h. Cache for the viral reads, a queue for click counts, a spare server and a limiter: every chapter, working together.`};
            if(s>=.95)return{stars:2,title:`${(s*100).toFixed(1)}% served`,msg:[p95>80?'Latency spiked: something was running hot.':'',cost>18?'Over budget.':'','Check which phase hurt most and add the one block that fixes it.'].filter(Boolean).join(' ')};
            if(s>=.7)return{stars:1,title:`${(s*100).toFixed(1)}% served`,msg:'Part of the load test broke you. Viral reads need a cache, click counting needs a queue, bots need a limiter.'};
            return{stars:0,title:'The launch crashed',msg:'Most users got errors. Start with a cache and enough app servers, then add the rest.'};}};}});})()});
