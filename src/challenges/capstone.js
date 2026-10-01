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
    init(){return{tot:0,bad:0,lat:[],dead:new Set(),killed:null,qb:{},lost:{deadEnd:0,deadApp:0,overload:0,overBot:0,db:0,dbSync:0,noDb:0},appIn:{}};},
    step(S,G,dt,t){const legit=t<6?1000:t<12?3000:2000,bot=t>=12?2000:0;
      const phase=t<6?'Launch':t<9?'A link goes viral':t<12?'Viral, and an app server dies':'Bot attack';
      if(t>=9&&!S.killed){const apps=G.of('app');if(apps.length){const b=apps.reduce((a,c)=>((S.appIn[c.id]||[0])[0]>(S.appIn[a.id]||[0])[0]?c:a));S.killed=b.id;S.dead.add(b.id);FX.burst(b.x,b.y,C.red,30,220);labMark(b,'crashed',C.red,15);}}
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
        D(db,'r',r.miss);D(db,'w',writes);if(q){D(q,'q',reads);F(a,q,reads,false,C.amber);}else{r.sync=reads;D(db,'w',reads);}
        F(a,db,r.miss+writes+r.sync,false);});
      // queues drain through workers that write to the database in batches
      G.of('queue').forEach(q=>{S.qb[q.id]=(S.qb[q.id]||0)+((dem[q.id]||{}).q||0)*dt;const ws=G.out(q,['worker']);let left=S.qb[q.id];
        ws.forEach(w=>{const wdb=G.out(w,['db'])[0];if(!wdb)return;const take=Math.min(left,WORKER*dt);left-=take;D(wdb,'w',take/dt/100);F(q,w,take/dt,false,C.amber);F(w,wdb,take/dt/100,false,C.amber);load[w.id]=take/dt/WORKER;});
        S.qb[q.id]=left;load[q.id]=Math.min(1.5,left/20000);});
      // the database: writes first, then reads on the primary's leftover capacity plus every replica
      const fail={};G.of('db').forEach(d=>{const x=dem[d.id]||{r:0,w:0},reps=G.out(d,['replica']),wOk=Math.min(x.w,DBOPS),rCap=DBOPS-wOk+DBOPS*reps.length;
        fail[d.id]={w:x.w?1-wOk/x.w:0,r:x.r?Math.max(0,1-rCap/x.r):0};load[d.id]=(x.r+x.w)/(DBOPS*(1+reps.length));
        reps.forEach(rp=>{const share=Math.max(0,x.r-(DBOPS-wOk))/reps.length;F(d,rp,share,false,C.blue);load[rp.id]=share/DBOPS;});
        if(fail[d.id].w>0||fail[d.id].r>0)G.inn(d,['app']).forEach(a=>bad.add(a.id+'>'+d.id));});
      rec.forEach(r=>{if(!r.db||!r.sL)return;const f=fail[r.db.id],x=Math.min(r.sL,r.miss*f.r+(r.writes+r.sync)*f.w);lost+=x;S.lost.db+=(r.miss*f.r+r.writes*f.w)*dt;S.lost.dbSync+=r.sync*f.w*dt;
        const dbU=load[r.db.id]||0,ms=15+(r.cache?3:25)+(r.util>.95?45:r.util>.8?15:0)+(dbU>.95?70:dbU>.8?20:0);S.lat.push([ms,r.sL*dt]);});
      S.tot+=legit*dt;S.bad+=Math.min(legit,lost)*dt;
      return{flows,load,dead:S.dead,phase,badEdges:bad};},
    hud(S){const s=S.tot?1-S.bad/S.tot:1,l=p95(S),b=backlog(S);return[['served',`${(s*100).toFixed(1)}%`,s>=.99?C.green:C.red],['p95',`${l} ms`,l<=80?C.green:C.red],['clicks waiting',`${Math.round(b)}`,b<500?C.green:C.amber]];},
    score(S,G,cost){const s=1-S.bad/S.tot,lat=p95(S),counted=backlog(S)<500;
      if(s>=.99&&lat<=80&&cost<=20&&counted)return{stars:3,title:'Launched without a scratch',msg:`${(s*100).toFixed(1)}% served, p95 ${lat} ms, $${cost}/h, every click counted. A limiter for the bots, a load balancer that skips the dead server, a spare app server, a cache for the viral link and a queue for the clicks: you built it.`};
      const L=S.lost,top=Object.entries(L).sort((a,b)=>b[1]-a[1])[0];
      const why=top&&top[1]>S.tot*.003?({deadEnd:'Some traffic hit a dead end: every path from Users has to reach an app server.',deadApp:'Requests kept going to the crashed server. Put a load balancer in front: its health checks skip dead servers.',
        overload:'Your app servers ran out of capacity during the viral spike. Add servers, with one to spare for when one dies.',overBot:'The bot attack used up your app servers. Put a rate limiter in front of everything.',
        db:G.of('cache').length?'The database could not keep up. Add a read replica, or make sure every app server uses the cache.':'The database drowned in reads. Put a cache between the app servers and the database.',
        dbSync:'Counting clicks synchronously writes to the database on every redirect. Send click events to a queue and let a worker write them.',noDb:'App servers need the database to look up short codes.'})[top[0]]:'';
      const extra=[lat>80?`p95 latency was ${lat} ms: something ran hot.`:'',cost>20?`Over budget at $${cost}/h.`:'',!counted?'Clicks piled up in the queue: wire a worker from the queue to the database.':''].filter(Boolean).join(' ');
      const msg=[why,extra].filter(Boolean).join(' ')||'Close. Check which phase hurt most.';
      if(s>=.95)return{stars:2,title:`${(s*100).toFixed(1)}% served`,msg};
      if(s>=.7)return{stars:1,title:`${(s*100).toFixed(1)}% served`,msg};
      return{stars:0,title:'The launch crashed',msg};}})});
function p95(S){const a=S.lat.slice().sort((x,y)=>x[0]-y[0]),W_=a.reduce((s,x)=>s+x[1],0);let w=0;for(const[m,v]of a){w+=v;if(w>=W_*.95)return m;}return 0;}
function backlog(S){return Object.values(S.qb).reduce((a,b)=>a+b,0);}
})();
