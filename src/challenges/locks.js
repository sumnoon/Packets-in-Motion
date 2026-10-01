/* ---------------- A1b. LOCKS: tune the lease ---------------- */
// A renews every 2 s; one renewal is delayed to 3.5 s by a network blip; at 4.2 s A freezes for 12 s.
function lockRun(p){const L=p.lease,needless=L<3.5,lostAt=needless?L:4+L,bWait=Math.max(0,lostAt-(needless?0:4.2)),aWakes=16.2;
  const overlap=!needless&&aWakes>4+L||needless;   // A writes again while B holds the lock
  return{needless,bWait,overlap,lost:overlap&&!p.fence,grantB:lostAt};}
chal('locks',{title:'Tune the lease',goal:'Worker A holds the lock and renews it every 2 s. One renewal arrives 1.5 s late, and later A freezes for 12 s. Lose no writes, keep B waiting at most 10 s, and never take the lock from a healthy A.',
  hint:'The lease must outlast a late renewal (over 3.5 s) but be short enough that B is not stuck for long. A paused A will still write when it wakes: only fencing tokens stop that.',
  make:simGame({dur:18,defaults:{lease:20,fence:false},intro:'Set the lease length and whether storage checks fencing tokens, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Lease length',1,20,1,p.lease,v=>`${v} s`,v=>{p.lease=v;re();});api.toggle('Storage checks fencing tokens',p.fence,v=>{p.fence=v;re();});},
    build(p,api){const R=lockRun(p);let T=0,ev=new Set();const fl=[];const LS=[500,110],A_=[190,300],B_=[190,450],ST=[810,380];
      const once=(k,fn)=>{if(!ev.has(k)){ev.add(k);fn();}};const toS=w=>[[w[0]+60,w[1]],[ST[0]-60,ST[1]]],toL=w=>[[w[0]+60,w[1]-14],[LS[0]-100,LS[1]+16]];
      return{step(dt,t){T=t;const now=api.now();
          [0,2,4].forEach(r=>{const at=r===2?3.5:r;if(t>=at-.5&&!(R.needless&&r>=2))once('r'+r,()=>fl.push({t0:now,d:.5,pts:toL(A_),c:r===2?C.amber:C.green,r:4,label:r===2?'late renew':'renew'}));});
          if(t>=R.grantB)once('gb',()=>{fl.push({t0:now,d:.6,pts:rev(toL(B_)),c:C.green,r:5,label:'lock · token 34'});FX.text(B_[0],B_[1]-50,R.needless?'took the lock from a healthy A':'B gets the lock',R.needless?C.red:C.green,13);});
          if(t>=R.grantB+1)once('wb',()=>fl.push({t0:now,d:.7,pts:toS(B_),c:C.blue,r:5,label:'write · 34'}));
          if(R.overlap&&t>=(R.needless?R.grantB+2:16.4))once('wa',()=>{fl.push({t0:now,d:.7,pts:toS(A_),c:C.red,r:5,label:'write · 33',drop:p.fence?.95:0});
            setTimeout(()=>FX.text(ST[0],ST[1]-60,p.fence?'33 < 34: rejected':'B\'s write lost',p.fence?C.green:C.red,14),700);});},
        draw(now,running){flyers(now,fl);box(LS[0],LS[1],{label:'Lock service',sub:`lease ${p.lease} s`,w:200,h:56,c:C.accent});
          const paused=running&&T>=4.2&&T<16.2,bHas=running&&T>=R.grantB;
          server(A_[0],A_[1],{label:'Worker A',sub:paused?'paused (GC)':bHas?'thinks it holds the lock':'holds lock · 33',w:150,st:paused?'hot':bHas?'ok':'acc',col:!bHas&&!paused?C.accent:undefined});
          server(B_[0],B_[1],{label:'Worker B',sub:bHas?'holds lock · 34':'waiting',w:150,st:bHas?'acc':'ok',col:bHas?C.accent:undefined});
          db(ST[0],ST[1],{label:'Storage',sub:p.fence?'checks tokens':'accepts any write',w:140,h:90});
          if(paused)spin(T,A_[0],A_[1]-48,{c:C.amber});},
        hud(){return[['lost writes',T>16.6&&R.lost?'1':'0',R.lost&&T>16.6?C.red:C.green],['B waited',`${Math.min(T,R.bWait).toFixed(1)} s`,R.bWait<=10?C.green:C.red],['needless handoff',R.needless&&T>=R.grantB?'yes':'no',R.needless&&T>=R.grantB?C.red:C.green]];},
        score(){const a=!R.lost,b=R.bWait<=10,c=!R.needless,n=[a,b,c].filter(Boolean).length;
          if(n===3)return{stars:3,title:'Safe and responsive',msg:`A ${p.lease} s lease rides out the late renewal, hands over within ${R.bWait.toFixed(0)} s when A freezes, and fencing tokens reject A's stale write when it wakes.`};
          const why=[!a&&'A woke up and overwrote B: storage must check fencing tokens',!b&&`B waited ${R.bWait.toFixed(0)} s for a frozen A: shorten the lease`,!c&&'the lease expired during a late renewal and the lock was taken from a healthy A: lengthen it past 3.5 s'].filter(Boolean).join('; ');
          return{stars:n===2?2:1,title:`${n} of 3 goals`,msg:why.charAt(0).toUpperCase()+why.slice(1)+'.'};}};}})});
