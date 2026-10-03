/* ---------------- 16. SPOF: survive the chaos monkey ---------------- */
// You build it on the board: DNS → load balancer(s) → app servers → database (→ standby).
// The chaos monkey kills the busiest app server at 3 s, the busiest load balancer at 6.5 s and the
// database at 10 s; each dead box is rebooted 2.5 s later. Managed DNS health-checks what it points at,
// a load balancer skips dead app servers, and the database fails over only to a standby it replicates to.
(function(){
const KILLS=[['app',3],['lb',6.5],['db',10]],REBOOT=2.5,R=60;
chal('spof',{title:'Survive the chaos monkey',goal:'Build it yourself, then let the chaos monkey kill an app server, a load balancer and the database. Stay up the whole time and spend at most $7/h.',
  hint:'Every box that stands alone is a single point of failure: two load balancers, two app servers, and a standby that the database replicates to. DNS is a managed service and already redundant.',
  make:labGame({id:'spof',
    hints:['Picture each box dying on its own. Which ones take everything down with them?','Every box needs a twin: a second load balancer, a second app server, and a standby that the database copies to. DNS is already redundant.'],
    solution:{nodes:['lb','lb','app','app','db','standby'],edges:[[0,1],[1,3],[3,5],[5,6]]},lean:5,
    blame(S,G){return Object.keys(S.deadAt).map(id=>{const n=G.nodes.find(x=>x.id===id);if(!n||!(S.why[n.kind]>.5))return null;
      return{id,note:n.kind==='db'?'no standby: down while it rebooted':'stood alone: down while it rebooted'};}).filter(Boolean);},budget:7,dur:13,scale:6,runLabel:'Unleash chaos',
    intro:'Requests arrive through DNS on the left. Build a path from DNS to a database, then press Unleash chaos: it kills one box of each kind.',
    fixedKinds:{dns:{label:'DNS',shape:'box',c:C.blue,w:120,h:52,sub:'managed · redundant'}},
    fixed:[{kind:'dns',x:84,y:250,label:'DNS'}],
    kinds:{
      lb:{label:'Load balancer',short:'LB',cost:1,max:2,shape:'box',c:C.accent,w:104,h:48,sub:'health checks',clone:true},
      app:{label:'App server',short:'App',cost:1,max:3,shape:'server',w:100,h:50,sub:'stateless',clone:true},
      db:{label:'Database',short:'DB',cost:2,max:1,shape:'db',w:90,h:72,sub:'primary'},
      standby:{label:'Standby database',short:'Standby',cost:1,max:1,shape:'db',w:84,h:64,sub:'takes over'}},
    columns:{lb:290,app:510,db:760,standby:760},
    links:{dns:['lb','app'],lb:['app'],app:['db'],db:['standby']},
    check(G){const d=G.of('dns')[0];if(!G.out(d).length)return['wire DNS to a load balancer or an app server.'];
      const lone=G.of('lb').find(l=>!G.out(l).length);if(lone)return['wire the load balancer to your app servers.'];
      if(!G.of('db').length)return['add a database.'];
      const noDb=G.of('app').filter(a=>!G.out(a,['db']).length);if(noDb.length)return[`${noDb.length===1?'an app server is':'some app servers are'} not wired to the database.`];
      if(G.of('standby').length&&!G.out(G.of('db')[0],['standby']).length)return['wire the database to the standby so it keeps a copy.'];
      return[];},
    sub(n,G,S){if(n.kind==='standby'&&S&&S.failover)return'now the primary';return null;},
    init(){return{ok:0,lost:0,down:0,deadAt:{},hits:{},killed:[],failover:false,why:{lb:0,app:0,db:0,none:0}};},
    step(S,G,dt,t){// in chaos mode the three kills come in a random order, at slightly random times
      const ks=S.kills||(S.kills=S.chaos?labShuffle(S,KILLS.map(k=>k[0])).map((k,i)=>[k,2+i*3.5+S.rng()*1.5]):KILLS),lastKill=ks.filter(([,at])=>t>=at).pop();
      const phase=lastKill?{app:'An app server dies',lb:'A load balancer dies',db:'The database dies'}[lastKill[0]]:'Calm before the chaos';
      ks.forEach(([kind,at])=>{if(t<at||S.killed.includes(kind))return;S.killed.push(kind);const c=G.of(kind);if(!c.length)return;
        const b=labPick(S,kind,c,c.reduce((a,x)=>((S.hits[x.id]||0)>(S.hits[a.id]||0)?x:a)));S.deadAt[b.id]=t;labSignal(S,b,'killed',C.red);});
      const dead=new Set(Object.keys(S.deadAt).filter(id=>t<S.deadAt[id]+REBOOT)),live=ns=>ns.filter(n=>!dead.has(n.id));
      const flows=[],F=(a,b,r,isBad,c)=>{if(a&&b&&r>0)flows.push({a:a.id,b:b.id,rate:r,bad:isBad,c});};
      let lostNow=0;const lose=(why,r)=>{S.why[why]+=r*dt;lostNow+=r;};
      const hit=(n,r)=>{S.hits[n.id]=(S.hits[n.id]||0)+r*dt;};
      // the database: the primary, or the standby it replicates to while the primary is dead
      const pdb=G.of('db')[0],sb=pdb&&G.out(pdb,['standby'])[0];S.failover=!!(pdb&&sb&&dead.has(pdb.id));
      const toApp=(from,a,r)=>{hit(a,r);F(from,a,r,false);const d=G.out(a,['db'])[0];
        if(!d){lose('none',r);return;}
        if(!dead.has(d.id)){F(a,d,r,false,C.green);return;}
        if(sb){F(a,sb,r,false,C.green);return;}
        F(a,d,r,true);lose('db',r);};
      // managed DNS health-checks its targets; a load balancer skips dead app servers
      const dns=G.of('dns')[0],targets=G.out(dns),up=live(targets);
      if(!targets.length)lose('none',R);
      else if(!up.length){targets.forEach(m=>F(dns,m,R/targets.length,true));lose(targets[0].kind,R);}
      else up.forEach(m=>{const r=R/up.length;hit(m,r);
        if(m.kind==='app'){toApp(dns,m,r);return;}
        const apps=G.out(m,['app']),ok=live(apps);
        if(!ok.length){F(dns,m,r,false);apps.forEach(a=>F(m,a,r/apps.length,true));lose(apps.length?'app':'none',r);return;}
        F(dns,m,r,false);ok.forEach(a=>toApp(m,a,r/ok.length));});
      S.lost+=lostNow*dt;S.ok+=(R-lostNow)*dt;if(lostNow>R*.01)S.down+=dt;
      return{flows,load:{},dead,phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S){const s=S.ok+S.lost?S.ok/(S.ok+S.lost):1;return[['served',`${(s*100).toFixed(1)}%`,S.lost<.5?C.green:C.red],['down for',`${S.down.toFixed(1)} s`,S.down<.05?C.green:C.red]];},
    score(S,G,cost){const failed=Object.entries(S.why).filter(([k,v])=>v>.5).sort((a,b)=>b[1]-a[1]);
      if(!failed.length&&cost<=7)return{stars:3,title:'Zero downtime',msg:`Every box had a twin, for $${cost}/h. The chaos monkey killed three of them and nobody noticed. DNS was already redundant, so it needed nothing.`};
      if(!failed.length)return{stars:2,title:`Zero downtime, at $${cost}/h`,msg:'It works, but costs more than it needs to: one spare of each kind is enough.'};
      const advice={lb:'The load balancer stood alone: when it died, nothing could reach the app servers. Add a second one and point DNS at both.',
        app:'The app server stood alone: when it died, the load balancer had nowhere to send requests. Add a second one.',
        db:'The database stood alone. Add a standby and wire the database to it, so it keeps a copy and takes over.',
        none:'Requests had nowhere to go: build a full path from DNS through app servers to the database.'};
      const msg=failed.map(([k])=>advice[k]).join(' ');
      if(S.why.none>S.lost/2)return{stars:0,title:'Never fully up',msg};
      return{stars:failed.length===1?2:1,title:`Down for ${S.down.toFixed(1)} s`,msg};}})});
})();
