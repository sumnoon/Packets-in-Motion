/* ---------------- 22. CAPSTONE: build and launch the URL shortener ---------------- */
// You build the whole system on the board. Traffic follows your wires:
//   Users → (rate limiter) → (load balancer) → app servers → cache / database / queue
//   queue → workers → database, database → read replicas
// Load test: launch 1,000/s · a viral link at 3,000/s · the busiest app server crashes at 9 s ·
// a bot attack of 2,000/s on top of 2,000/s of real users from 12 s.
(function(){
const APP=1000,DBOPS=600,WORKER=4000;
chal('capstone',{title:'Build the shortener',goal:'Build it yourself, then survive the load test: launch traffic, a viral link at 3,000 req/s, the busiest app server crashing, then a bot attack. Serve ≥99% of real users, p95 ≤ 80 ms, count every click, and spend ≤ $20/h.',
  hint:'Users → rate limiter → load balancer → several app servers (one spare). Each app server talks to a cache and the database, and sends click events to a queue that a worker writes to the database. New app servers copy the first one\'s wires.',
  make:labGame({id:'capstone',
    hints:['Three things will hit you: a viral spike, a crashed server and bots. Which component handles each one?','A rate limiter for the bots, a load balancer with a spare app server for the crash, a cache for viral reads, and a queue with a worker for the click counts.'],
    solution:{nodes:['limiter','lb','app','cache','db','queue','worker','app','app','app'],edges:[[0,1],[1,2],[2,3],[3,4],[3,5],[3,6],[6,7],[7,5]]},
    loadNote:n=>n.kind==='queue'?'clicks piling up':null,budget:20,dur:18,scale:120,
    intro:'Drag components from the row below onto the board. Then drag from a component’s ● to another to wire them, starting from Users. Press Run when your design is ready.',
    fixedKinds:{users:{label:'Users',shape:'user',w:44,h:44}},
    fixed:[{kind:'users',x:70,y:250,label:'Users + bots'}],
    kinds:{
      limiter:{label:'Rate limiter',short:'Limiter',cost:1,max:2,shape:'box',c:C.amber,w:104,h:48,sub:'blocks bots'},
      lb:{label:'Load balancer',short:'LB',cost:1,max:2,shape:'box',c:C.accent,w:100,h:48,sub:'health checks'},
      app:{label:'App server',short:'App',cost:3,max:5,shape:'server',w:96,h:50,sub:'1,000/s',clone:true},
      cache:{label:'Cache',short:'Cache',cost:2,max:2,shape:'box',c:C.green,w:96,h:48,sub:'Redis'},
      db:{label:'Database',short:'DB',cost:2,max:1,shape:'db',w:86,h:70,sub:'600 ops/s'},
      replica:{label:'Read replica',short:'Replica',cost:2,max:3,shape:'db',w:72,h:58,sub:'+600 reads'},
      queue:{label:'Queue',short:'Queue',cost:1,max:1,shape:'box',c:C.amber,w:96,h:46,sub:'click events'},
      worker:{label:'Worker',short:'Worker',cost:1,max:3,shape:'server',w:94,h:46,sub:'counts clicks',clone:true}},
    columns:{limiter:190,lb:310,app:450,cache:620,db:790,replica:920,queue:620,worker:790},
    links:{users:['limiter','lb','app'],limiter:['lb','app'],lb:['app'],app:['cache','db','queue'],db:['replica'],queue:['worker'],worker:['db']},
    check(G){const u=G.of('users')[0];if(!G.out(u).length)return['wire Users to something (a limiter, load balancer or app server).'];
      if(!G.of('app').length)return['add at least one app server.'];
      const noDb=G.of('app').filter(a=>!G.out(a,['db']).length);if(noDb.length)return[`${noDb.length===1?'an app server is':'some app servers are'} not wired to the database.`];
      const reach=new Set(),walk=n=>{if(reach.has(n.id))return;reach.add(n.id);G.out(n,['limiter','lb','app']).forEach(walk);};walk(u);
      const off=G.of('app').filter(a=>!reach.has(a.id));if(off.length)return[`${off.length} app server${off.length>1?'s get':' gets'} no traffic: wire ${off.length>1?'them':'it'} to the load balancer.`];
      return[];},
    init(){return{tot:0,bad:0,lat:[],dead:new Set(),killed:null,qb:{},clicks:{accepted:0,persisted:0},lost:{deadEnd:0,deadApp:0,overload:0,overBot:0,db:0,dbSync:0,noDb:0},appIn:{}};},
    step(S,G,dt,t){const legit=t<6?1000:t<12?3000:2000,bot=t>=12?2000:0;
      const tc=labAt(S,'crash',9,7,13),phase=t<6?'Launch':t<12?(t<tc?'A link goes viral':'Viral, and an app server dies'):(t>=tc&&t<tc+2?'Bot attack, and an app server dies':'Bot attack');
      if(t>=tc&&!S.killed){const apps=G.of('app');if(apps.length){const b=labPick(S,'victim',apps,apps.reduce((a,c)=>((S.appIn[c.id]||[0])[0]>(S.appIn[a.id]||[0])[0]?c:a)));S.killed=b.id;S.dead.add(b.id);labSignal(S,b,'crashed',C.red);}}
      const flows=[],load={},bad=new Set(),F=(a,b,rate,isBad,c)=>{flows.push({a:a.id,b:b.id,rate,bad:isBad,c});if(isBad)bad.add(a.id+'>'+b.id);};
      const appIn={};let lost=0;
      // front tier: traffic follows the wires to the app servers
      const push=(n,L,B)=>{if(n.kind==='app'){const v=appIn[n.id]||(appIn[n.id]=[0,0]);v[0]+=L;v[1]+=B;return;}
        let outs;if(n.kind==='users')outs=G.out(n,['limiter','lb','app']);
        else if(n.kind==='limiter'){load[n.id]=(L+B)/20000;B*=.05;outs=G.out(n,['lb','app']);}
        else if(n.kind==='lb'){load[n.id]=(L+B)/20000;outs=G.out(n,['app']).filter(m=>!S.dead.has(m.id));}   // health checks skip dead servers
        if(!outs.length){lost+=L;S.lost.deadEnd+=L*dt;return;}
        outs.forEach(m=>{F(n,m,(L+B)/outs.length,S.dead.has(m.id));push(m,L/outs.length,B/outs.length);});};
      G.of('users').forEach(u=>push(u,legit,bot));S.appIn=appIn;
      // app servers: capacity, then their data path
      const dem={},D=(n,k,v)=>{const d=dem[n.id]||(dem[n.id]={r:0,w:0,q:0,c:0});d[k]+=v;},rec=[];
      G.of('app').forEach(a=>{const[L,B]=appIn[a.id]||[0,0],tot=L+B;
        if(S.dead.has(a.id)){lost+=L;S.lost.deadApp+=L*dt;return;}
        const served=Math.min(tot,APP),sL=tot?served*L/tot:0;lost+=L-sL;if(bot)S.lost.overBot+=(L-sL)*dt;else S.lost.overload+=(L-sL)*dt;load[a.id]=tot/APP;
        const reads=sL*.99,writes=sL*.01,cache=G.out(a,['cache'])[0],db=G.out(a,['db'])[0],q=G.out(a,['queue'])[0];
        const r={a,sL,util:tot/APP,cache,db,q,miss:0,writes,sync:0};rec.push(r);
        if(!db){lost+=sL;S.lost.noDb+=sL*dt;r.sL=0;return;}
        const hits=cache?reads*.9:0;r.miss=reads-hits;if(cache){D(cache,'c',reads);F(a,cache,reads,false,C.green);}
        D(db,'r',r.miss);D(db,'w',writes);if(!q){r.sync=reads;D(db,'w',reads);}
        F(a,db,r.miss+writes+r.sync,false);});
      // the database: writes first, then reads on the primary's leftover capacity plus every replica
      const fail={},batchRoom={};G.of('db').forEach(d=>{const x=dem[d.id]||{r:0,w:0},reps=G.out(d,['replica']),wOk=Math.min(x.w,DBOPS),rCap=DBOPS-wOk+DBOPS*reps.length;
        fail[d.id]={w:x.w?1-wOk/x.w:0,r:x.r?Math.max(0,1-rCap/x.r):0};load[d.id]=(x.r+x.w)/(DBOPS*(1+reps.length));
        batchRoom[d.id]=Math.max(0,DBOPS-wOk-Math.min(x.r,DBOPS-wOk))*dt;
        reps.forEach(rp=>{const share=Math.max(0,x.r-(DBOPS-wOk))/reps.length;F(d,rp,share,false,C.blue);load[rp.id]=share/DBOPS;});
        if(fail[d.id].w>0||fail[d.id].r>0)G.inn(d,['app']).forEach(a=>bad.add(a.id+'>'+d.id));});
      rec.forEach(r=>{if(!r.db||!r.sL)return;const f=fail[r.db.id],x=Math.min(r.sL,r.miss*f.r+(r.writes+r.sync)*f.w);lost+=x;S.lost.db+=(r.miss*f.r+r.writes*f.w)*dt;S.lost.dbSync+=r.sync*f.w*dt;
        // Count successful redirects only. Queued events stay pending until the DB accepts their batch.
        const clicks=Math.max(0,r.sL*.99-r.miss*f.r-r.sync*f.w)*dt;S.clicks.accepted+=clicks;
        if(r.q){S.qb[r.q.id]=(S.qb[r.q.id]||0)+clicks;F(r.a,r.q,clicks/dt,false,C.amber);}else S.clicks.persisted+=clicks;
      });
      // Workers share both their own capacity and the primary's remaining operations.
      const workerRoom={};G.of('worker').forEach(w=>workerRoom[w.id]=WORKER*dt);
      G.of('queue').forEach(q=>{let left=S.qb[q.id]||0;
        G.out(q,['worker']).forEach(w=>{const db=G.out(w,['db'])[0];if(!db)return;const take=Math.min(left,workerRoom[w.id],batchRoom[db.id]*100);
          left-=take;workerRoom[w.id]-=take;batchRoom[db.id]-=take/100;S.clicks.persisted+=take;
          F(q,w,take/dt,false,C.amber);F(w,db,take/dt/100,false,C.amber);load[w.id]=(load[w.id]||0)+take/dt/WORKER;
          load[db.id]=(load[db.id]||0)+take/dt/100/(DBOPS*(1+G.out(db,['replica']).length));});
        S.qb[q.id]=Math.max(0,left);load[q.id]=Math.min(1.5,left/20000);});
      rec.forEach(r=>{if(!r.db||!r.sL)return;const dbU=load[r.db.id]||0,ms=15+(r.cache?3:25)+(r.util>.95?45:r.util>.8?15:0)+(dbU>.95?70:dbU>.8?20:0);S.lat.push([ms,r.sL*dt]);});
      S.tot+=legit*dt;S.bad+=Math.min(legit,lost)*dt;
      return{flows,load,dead:S.dead,phase,badEdges:bad};},
    hud(S){const s=S.tot?1-S.bad/S.tot:1,l=p95(S),b=backlog(S);return[['served',`${(s*100).toFixed(1)}%`,s>=.99?C.green:C.red],['p95',`${l} ms`,l<=80?C.green:C.red],['clicks waiting',`${Math.ceil(b)}`,b<1e-6?C.green:C.amber]];},
    measure:shortenerMetrics,
    score(S,G,cost,m=shortenerMetrics(S,G,cost)){const s=m.requirements[0].observed,lat=m.requirements[1].observed,counted=m.requirements[3].passed;
      if(m.requirements.every(x=>x.passed))return{stars:3,title:'Launched without a scratch',msg:`${(s*100).toFixed(1)}% served, p95 ${lat} ms, $${cost}/h, every click counted. A limiter for the bots, a load balancer that skips the dead server, a spare app server, a cache for the viral link and a queue for the clicks: you built it.`};
      const L=S.lost,top=Object.entries(L).sort((a,b)=>b[1]-a[1])[0];
      const why=top&&top[1]>S.tot*.003?({deadEnd:'Some traffic hit a dead end: every path from Users has to reach an app server.',deadApp:'Requests kept going to the crashed server. Put a load balancer in front: its health checks skip dead servers.',
        overload:'Your app servers ran out of capacity during the viral spike. Add servers, with one to spare for when one dies.',overBot:'The bot attack used up your app servers. Put a rate limiter in front of everything.',
        db:G.of('cache').length?'The database could not keep up. Add a read replica, or make sure every app server uses the cache.':'The database drowned in reads. Put a cache between the app servers and the database.',
        dbSync:'Counting clicks synchronously writes to the database on every redirect. Send click events to a queue and let a worker write them.',noDb:'App servers need the database to look up short codes.'})[top[0]]:'';
      const extra=[lat>80?`p95 latency was ${lat} ms: something ran hot.`:'',cost>20?`Over budget at $${cost}/h.`:'',!counted?`${Math.ceil(backlog(S))} clicks still waiting or not accounted for: wire enough workers to the database and leave capacity for their batches.`:''].filter(Boolean).join(' ');
      const msg=[why,extra].filter(Boolean).join(' ')||'Close. Check which phase hurt most.';
      if(s>=.95)return{stars:2,title:`${(s*100).toFixed(1)}% served`,msg};
      if(s>=.7)return{stars:1,title:`${(s*100).toFixed(1)}% served`,msg};
      return{stars:0,title:'The launch crashed',msg};}})});
function p95(S){const a=S.lat.slice().sort((x,y)=>x[0]-y[0]),W_=a.reduce((s,x)=>s+x[1],0);let w=0;for(const[m,v]of a){w+=v;if(w>=W_*.95)return m;}return 0;}
function backlog(S){return Object.values(S.qb).reduce((a,b)=>a+b,0);}
function shortenerMetrics(S,G,cost){const served=S.tot?1-S.bad/S.tot:0,lat=p95(S),pending=backlog(S),unaccounted=S.clicks?Math.abs(S.clicks.accepted-S.clicks.persisted):Infinity;return{accepted:S.clicks?.accepted||0,persisted:S.clicks?.persisted||0,pending,requirements:[{name:'Served fraction',observed:served,target:.99,passed:served>=.99},{name:'Modeled p95 (ms)',observed:lat,target:80,passed:lat<=80},{name:'Model cost ($/h)',observed:cost,target:20,passed:cost<=20},{name:'Unpersisted click events',observed:Math.max(pending,unaccounted),target:0,passed:!!S.clicks&&pending<1e-6&&unaccounted<1e-6}]};}
})();
