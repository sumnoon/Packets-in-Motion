/* ---------------- 3b. SESSIONS: keep everyone logged in ---------------- */
// You build it on the board: users → (load balancer) → app servers → (session store → replica).
// 30 logged-in users click around, 10 requests a second. At 5 s the busiest server dies; at 9 s the
// session store's machine dies. Where a session lives follows from your wiring: a server wired to
// the store keeps sessions there, otherwise in its own memory. Sticky sessions pin each user to one server.
(function(){
const N=30,RATE=10;
chal('sessions',{title:'Keep everyone logged in',goal:'Build it yourself: 30 users click around, then a server dies, then the session store\'s machine dies. Finish with zero forced re-logins and spend at most $7/h.',
  hint:'A session kept in one server\'s memory is lost when the load balancer sends you elsewhere or that server dies. Wire every server to a shared session store, and give the store a replica so its machine can die too.',
  make:labGame({id:'sessions',
    hints:['A session only helps if the next server you land on can find it.','Wire every server to a session store, and wire the store to a replica.'],
    solution:{nodes:['lb','app','app','store','replica'],edges:[[0,1],[1,2],[2,4],[4,5]]},lean:6,
    blame(S,G,gen){const m=[];
      if(S.why.mem)G.of('app').filter(a=>!G.out(a,['store']).length).forEach(a=>m.push({id:a.id,note:'sessions only in its own memory'}));
      if(S.why.dead)S.dead.forEach(d=>m.push({id:d,note:'its sessions died with it'}));
      if(S.why.store){const st=G.of('store')[0];if(st)m.push({id:st.id,note:'no replica: every session lost at 9 s'});}
      if(S.why.direct){const u=G.of('users')[0];S.dead.forEach(d=>m.push({edge:u.id+'>'+d,note:'users stranded here'}));}
      return m.length?m:gen;},budget:7,dur:13,scale:.6,
    intro:'30 users are logged in. Build a path from Users to your servers and decide where their sessions live, then press Run.',
    fixedKinds:{users:{label:'Users',shape:'user',w:44,h:44}},
    fixed:[{kind:'users',x:70,y:250,label:'30 users'}],
    kinds:{
      lb:{label:'Load balancer',short:'LB',cost:1,max:1,shape:'box',c:C.accent,w:110,h:50,sub:'round robin'},
      app:{label:'App server',short:'Server',cost:1,max:4,shape:'server',w:110,h:50,sub:'sessions in RAM',clone:true},
      store:{label:'Session store',short:'Store',cost:2,max:1,shape:'db',w:96,h:72,sub:'Redis'},
      replica:{label:'Store replica',short:'Replica',cost:1,max:1,shape:'db',w:84,h:62,sub:'a live copy'}},
    columns:{lb:260,app:490,store:730,replica:900},
    links:{users:['lb','app'],lb:['app'],app:['store'],store:['replica']},
    toggles:[{key:'sticky',label:'Sticky sessions: the load balancer pins each user to one server',val:false}],
    check(G){const u=G.of('users')[0];if(!G.out(u).length)return['wire Users to a load balancer or a server.'];
      const lb=G.out(u,['lb'])[0];if(lb&&!G.out(lb).length)return['wire the load balancer to your servers.'];
      const st=G.of('store')[0];if(st&&!G.inn(st).length)return['wire your servers to the session store, or it holds nothing.'];
      if(G.of('replica').length&&!(st&&G.out(st,['replica']).length))return['wire the session store to its replica so it keeps a copy.'];
      return[];},
    sub(n,G,S){if(n.kind==='app')return G.out(n,['store']).length?'sessions in the store':'sessions in RAM';
      if(n.kind==='lb')return G.opts.sticky?'sticky':'round robin';
      if(n.kind==='store'&&S&&S.storeHit)return G.out(n,['replica']).length?'replica took over':'restarted empty';return null;},
    init(){return{ema:{},badT:{},k:0,acc:0,rr:0,relog:0,dead:new Set(),killed:false,storeHit:false,hits:{},stranded:new Set(),why:{mem:0,dead:0,store:0,direct:0,none:0},
      users:Array.from({length:N},()=>({seen:false,mem:new Set(),last:null,pin:null}))};},
    step(S,G,dt,t){const phase=t<5?'Users clicking around':t<9?'A server dies':'The store\'s machine dies';
      const U=G.of('users')[0],lb=G.out(U,['lb'])[0],direct=G.out(U,['app']),store=G.of('store')[0];
      if(t>=5&&!S.killed){S.killed=true;const apps=G.of('app');if(apps.length){const b=apps.reduce((a,c)=>((S.hits[c.id]||0)>(S.hits[a.id]||0)?c:a));S.dead.add(b.id);FX.burst(b.x,b.y,C.red,30,220);labMark(b,'crashed',C.red,15);}}
      if(t>=9&&!S.storeHit&&store){S.storeHit=true;const rep=G.out(store,['replica'])[0];FX.burst(store.x,store.y,C.red,30,220);
        if(rep)labMark(rep,'replica took over',C.green,14);
        else{const lost=S.users.filter(u=>u.seen&&u.inStore).length;S.relog+=lost;S.why.store+=lost;labMark(store,'all sessions lost',C.red,15);}}
      const edges={},E=(a,b,isBad)=>{const key=a.id+'>'+b.id,e=edges[key]||(edges[key]={a:a.id,b:b.id,n:0,bad:false});e.n++;e.bad=e.bad||isBad;};
      const kick=why=>{S.relog++;S.why[why]++;};
      S.acc+=RATE*dt;
      while(S.acc>=1){S.acc--;const i=(S.k++*7)%N,u=S.users[i];let srv=null,from=lb||U;
        if(lb){const live=G.out(lb,['app']).filter(a=>!S.dead.has(a.id));E(U,lb,!live.length);
          if(!live.length){S.why.none++;continue;}
          if(G.opts.sticky){if(!u.pin||!live.includes(u.pin))u.pin=live[i%live.length];srv=u.pin;}else srv=live[S.rr++%live.length];}
        else if(direct.length){srv=direct[i%direct.length];
          if(S.dead.has(srv.id)){E(U,srv,true);if(!S.stranded.has(i)){S.stranded.add(i);kick('direct');}continue;}}
        else{S.why.none++;continue;}
        S.hits[srv.id]=(S.hits[srv.id]||0)+1;
        // does this server know the user?
        const st=G.out(srv,['store'])[0];let bad=false;
        if(!u.seen){u.seen=true;if(st)u.inStore=true;else u.mem.add(srv.id);}
        else if(st){if(!u.inStore){bad=true;kick('mem');u.inStore=true;}}
        else if(!u.mem.has(srv.id)){bad=true;kick(u.last&&S.dead.has(u.last)?'dead':'mem');u.mem.add(srv.id);}
        u.last=srv.id;E(from,srv,bad);if(st)E(srv,st,false);}
      // smooth the request counts into rates so packets flow steadily along each wire
      for(const key in S.ema)S.ema[key].r*=Math.max(0,1-dt*1.5);
      Object.values(edges).forEach(e=>{const key=e.a+'>'+e.b;(S.ema[key]||(S.ema[key]={a:e.a,b:e.b,r:0})).r+=e.n*1.5;if(e.bad)S.badT[key]=t;});
      const flows=Object.entries(S.ema).filter(([key,e])=>!(S.dead.has(e.a)||S.dead.has(e.b))||t-(S.badT[key]??-9)<.4).map(([key,e])=>({a:e.a,b:e.b,rate:e.r,bad:t-(S.badT[key]??-9)<.4,c:node_kind(G,e.b)==='store'?C.amber:undefined}));
      return{flows,load:{},dead:S.dead,phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S){return[['forced re-logins',`${S.relog}`,S.relog===0?C.green:C.red]];},
    score(S,G,cost){const r=S.relog,top=Object.entries(S.why).sort((a,b)=>b[1]-a[1])[0][0];
      const advice={mem:'Sessions lived in each server\'s memory, so whenever someone landed on a different server they were logged out. Wire every server to a shared session store.',
        dead:'Everyone whose session lived on the server that died was logged out. Keep sessions in a shared store, not in a server\'s memory.',
        store:'The session store was a single point of failure: when its machine died, every session went with it. Give it a replica.',
        direct:'Users were wired straight to servers, so the ones on the dead server were stranded. Put a load balancer in front.',
        none:'Requests had nowhere to go: wire Users to a load balancer, and the load balancer to your servers.'}[top];
      if(S.why.none>RATE*2)return{stars:0,title:'Nobody got in',msg:advice};
      if(r===0&&cost<=7)return{stars:3,title:'Nobody noticed a thing',msg:`Stateless servers and a replicated session store for $${cost}/h: a server died, then the store's machine died, and every user stayed logged in.`};
      if(r===0)return{stars:2,title:`Nobody logged out, at $${cost}/h`,msg:'It works, but costs more than it needs to. Two or three servers are enough when sessions live in the store.'};
      if(r<=12)return{stars:2,title:`${r} forced re-login${r>1?'s':''}`,msg:advice};
      return{stars:1,title:`${r} forced re-logins`,msg:advice};}})});
function node_kind(G,id){const n=G.nodes.find(m=>m.id===id);return n&&n.kind;}
})();
