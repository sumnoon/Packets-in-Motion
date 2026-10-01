/* ---------------- 9. REPLICATION: build it, then survive the crash ---------------- */
// You build it on the board: app → leader (writes) and followers (reads), leader → followers (replication),
// and optionally a failover manager watching the leader. 150 requests/s, 30% writes; each node takes 60/s.
// The leader crashes at 6 s. A failover manager wired to the leader and to followers promotes a
// replicating follower 1 s later and points writes at it; without one there is no leader again.
(function(){
const R=150,WRITES=45,READS=105,CAP=60,PROMOTE=1;
chal('replication',{title:'Keep it serving',goal:'Build it yourself: 150 requests/s (30% writes), each database node takes 60/s, and the leader crashes halfway. Serve at least 95% of requests and spend at most $6/h.',
  hint:'Writes go to the leader; spread reads over followers that replicate from it. A failover manager promotes a follower when the leader dies, and that costs you a follower, so keep a spare.',
  make:labGame({id:'replication',
    hints:['Writes must go to the leader, but reads can go to any database that has a copy. Count the work per node.','Followers wired from the leader take the reads. A failover manager wired to the leader and the followers promotes one when the leader dies. Count the followers left after that.'],
    solution:{nodes:['leader','follower','follower','follower','failover'],edges:[[0,1],[0,2],[1,2],[5,1],[5,2]]},
    loadNote:n=>n.kind==='leader'||n.kind==='follower'?'over its 60 requests/s':null,
    blame(S,G,gen){const m=[],L=G.of('leader')[0];
      if(S.why.nolead>100&&L)m.push({id:L.id,note:'nobody took over when it died'});
      if(S.why.stale>1)G.of('follower').filter(f=>!G.inn(f,['leader']).length).forEach(f=>m.push({id:f.id,note:'gets no data from the leader'}));
      return m.concat(gen.filter(x=>x.id));},budget:6,dur:14,scale:12,
    intro:'The app sends writes and reads. Add a leader database and followers, wire the leader to each follower so it copies the data, and decide where reads go.',
    fixedKinds:{app:{label:'App',shape:'server',w:110,h:56,sub:'150 req/s'}},
    fixed:[{kind:'app',x:90,y:250,label:'App'}],
    kinds:{
      leader:{label:'Leader database',short:'Leader',cost:2,max:1,shape:'db',w:100,h:76,sub:'writes · 60/s'},
      follower:{label:'Follower database',short:'Follower',cost:1,max:3,shape:'db',w:90,h:58,sub:'reads · 60/s',clone:true},
      failover:{label:'Failover manager',short:'Failover',cost:1,max:1,shape:'box',c:C.amber,w:120,h:48,sub:'promotes a follower'}},
    columns:{leader:[420,190],follower:740,failover:[420,360]},
    links:{app:['leader','follower'],leader:['follower'],failover:['leader','follower']},
    check(G){const a=G.of('app')[0];if(!G.out(a,['leader']).length)return['wire the App to a leader database: every write goes there.'];
      const L=G.of('leader')[0],stale=G.of('follower').find(f=>!G.inn(f,['leader']).length);if(stale)return['wire the leader to every follower, or that follower never gets the data.'];
      const fm=G.of('failover')[0];if(fm&&!G.out(fm,['leader']).length)return['wire the failover manager to the leader so it notices when it dies.'];
      if(fm&&!G.out(fm,['follower']).length)return['wire the failover manager to the followers it may promote.'];
      return[];},
    sub(n,G,S){if(S&&n.id===S.lead&&n.kind==='follower')return'promoted · writes';return null;},
    init(G){const L=G.of('leader')[0];return{lead:L?L.id:null,crashAt:null,dead:new Set(),total:0,fail:0,why:{nolead:0,reads:0,stale:0,leader:0}};},
    step(S,G,dt,t){const tc=labAt(S,'crash',6,3,9),phase=t<tc?'Steady traffic':t<tc+PROMOTE?'The leader dies':S.lead&&!S.dead.has(S.lead)?'Running on the new leader':'No leader';
      const app=G.of('app')[0],L0=G.of('leader')[0],fm=G.of('failover')[0];
      if(t>=tc&&S.crashAt==null){S.crashAt=t;if(L0){S.dead.add(L0.id);FX.burst(L0.x,L0.y,C.red,30,220);labMark(L0,'crashed',C.red);}}
      // the failover manager promotes a follower that was copying the leader
      if(S.crashAt!=null&&t>=S.crashAt+PROMOTE&&S.lead===(L0&&L0.id)){const cand=fm&&L0&&G.out(fm,['leader']).includes(L0)?G.out(fm,['follower']).find(f=>G.inn(f,['leader']).includes(L0)):null;
        if(cand){S.lead=cand.id;FX.burst(cand.x,cand.y,C.green,30,220);labMark(cand,'promoted',C.green);}else S.lead=null;}
      const lead=S.lead&&!S.dead.has(S.lead)?G.nodes.find(n=>n.id===S.lead):null;
      const flows=[],load={},used={},F=(a,b,r,isBad,c)=>{if(a&&b&&r>0)flows.push({a:a.id,b:b.id,rate:r,bad:isBad,c});};
      const fail=(why,r)=>{S.why[why]+=r*dt;S.fail+=r*dt;};
      // writes: to the leader (the failover manager points the app at a promoted one)
      const writesTo=lead&&(lead===L0?G.out(app,['leader']).includes(L0):true)?lead:null;
      if(writesTo){used[lead.id]=WRITES;F(app,lead,WRITES,false,C.amber);}else{fail(L0&&G.out(app,['leader']).length?'nolead':'leader',WRITES);if(L0&&G.out(app,['leader']).length)F(app,L0,WRITES,true,C.amber);}
      // reads: spread over the live followers the app is wired to, otherwise the leader
      const replicating=f=>L0&&G.inn(f,['leader']).includes(L0);
      const rs=G.out(app,['follower']).filter(f=>!S.dead.has(f.id)&&f.id!==S.lead);
      const tgt=rs.length?rs:lead?[lead]:[];
      if(!tgt.length)fail('nolead',READS);
      tgt.forEach(n=>{const share=READS/tgt.length,room=Math.max(0,CAP-(used[n.id]||0)),okR=Math.min(share,room);used[n.id]=(used[n.id]||0)+share;
        if(n.kind==='follower'&&!replicating(n)){fail('stale',share);F(app,n,share,true,C.blue);return;}
        if(share>okR)fail(n===lead?'leader':'reads',share-okR);F(app,n,share,share>okR+.01,C.blue);});
      // replication traffic from the current leader
      if(lead)G.of('follower').filter(f=>f!==lead&&!S.dead.has(f.id)&&replicating(f)).forEach(f=>F(lead,f,WRITES,false,C.accent));
      G.nodes.filter(n=>n.kind==='leader'||n.kind==='follower').forEach(n=>{if(!S.dead.has(n.id))load[n.id]=(used[n.id]||0)/CAP;});
      S.total+=R*dt;
      return{flows,load,dead:S.dead,phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S){const s=S.total?1-S.fail/S.total:1;return[['served',`${(s*100).toFixed(1)}%`,s>=.95?C.green:C.red]];},
    score(S,G,cost){const s=S.total?1-S.fail/S.total:0,pct=(s*100).toFixed(1),top=Object.entries(S.why).sort((a,b)=>b[1]-a[1])[0];
      let advice={nolead:'After the leader died, nobody took over and every write failed. Add a failover manager wired to the leader and the followers.',
        reads:G.of('failover').length&&G.of('follower').length<3?'After the promotion one follower became the leader, and the rest could not carry all the reads. Keep a spare follower.':'The followers could not carry all the reads (60/s each): add followers and send reads to them.',
        stale:'A follower that is not wired from the leader never receives the data, so its reads are wrong. Wire the leader to every follower.',
        leader:'The leader had to do too much: writes plus reads are more than 60/s. Add followers and send reads to them.'}[top[0]];
      if(!G.of('follower').length)advice='One database had to take every read and every write, and when it died there was nothing left. Add followers for the reads and a failover manager.';
      if(s>=.95&&cost<=6)return{stars:3,title:`${pct}% served`,msg:'Writes on the leader, reads spread over followers, an automatic promotion when the leader died, and a spare follower left afterwards. That is textbook replication.'};
      if(s>=.95)return{stars:2,title:`${pct}% served, at $${cost}/h`,msg:'It works, but costs more than it needs to.'};
      if(s>=.85)return{stars:2,title:`${pct}% served`,msg:advice};
      if(s>=.6)return{stars:1,title:`${pct}% served`,msg:advice};
      return{stars:0,title:'Mostly down',msg:advice};}})});
})();
