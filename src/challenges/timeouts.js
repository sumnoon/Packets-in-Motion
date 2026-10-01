/* ---------------- 16b. TIMEOUTS: set the budget ---------------- */
function timeoutRun(p){const out=[];for(let i=0;i<40;i++){const slow=[2,5,8].includes(i%10),L=slow?3:.2;
    const r3=L<=p.t3?L+.1:p.t3+.1,ok3=L<=p.t3,r2=r3<=p.t2?r3+.1:p.t2+.1,ok2=ok3&&r3<=p.t2,r1=r2<=p.t1?r2+.1:p.t1+.1,ok1=ok2&&r2<=p.t1;
    const orphan=(p.t3>=p.t2||p.t2>=p.t1)&&slow;out.push({slow,wait:r1+.1,ok:ok1,orphan});}
  return{reqs:out,maxWait:Math.max(...out.map(r=>r.wait)),fastOk:out.filter(r=>!r.slow&&r.ok).length/out.filter(r=>!r.slow).length,orphans:out.filter(r=>r.orphan).length};}
chal('timeouts',{title:'Set the timeout budget',goal:'Every user must get an answer (success or a quick error) within 2 s. Normal calls to the bank take 0.2 s; 3 in 10 hang for 3 s. Healthy calls must all succeed, and no service may keep waiting after its caller has given up.',
  hint:'Each hop adds 0.1 s. The outermost timeout must fit inside 2 s, and each inner one must be shorter than the one outside it, but long enough for a healthy 0.2 s call.',
  make:simGame({dur:10,defaults:{t1:3,t2:3,t3:3},intro:'Set how long each service waits for the next, then press <b>Run it</b>.',
    controls(api,p,re){[['t1','Web waits for Orders'],['t2','Orders waits for Payments'],['t3','Payments waits for Bank']].forEach(([k,l])=>api.slider(l,.1,4,.1,p[k],v=>`${v.toFixed(1)} s`,v=>{p[k]=+v.toFixed(1);re();}));},
    build(p,api){const R=timeoutRun(p);let i=0,acc=0;const fl=[];const X=[120,340,560,780,930];
      return{step(dt,t){acc+=dt*4;const now=api.now();while(acc>=1&&i<R.reqs.length){acc--;const r=R.reqs[i++];const reach=r.slow?(p.t3>=3?4:3):4;
          fl.push({t0:now,d:.9,pts:X.slice(0,reach+1).map(x=>[x,300]),c:C.blue,r:4});fl.push({t0:now+.9+Math.min(r.wait,3)*.4,d:.9,pts:X.slice(0,4).reverse().map(x=>[x,330]),c:r.ok?C.green:r.wait<=2?C.amber:C.red,r:4,label:r.wait>2?`${r.wait.toFixed(1)} s`:null});}},
        draw(now){flyers(now,fl);user(X[0],300,{label:'users'});[['Web','t1'],['Orders','t2'],['Payments','t3']].forEach(([n,k],j)=>{server(X[j+1],300,{label:n,sub:`waits ${p[k].toFixed(1)} s`,w:120,h:56,st:j<2&&p[k]<=p[['t2','t3'][j]]?'hot':'ok'});});
          server(X[4],300,{label:'Bank',sub:'0.2 s · or hangs 3 s',w:120,h:56});
          [['t1','t2'],['t2','t3']].forEach(([a,b],j)=>{if(p[a]<=p[b])pill('inner ≥ outer: orphaned work',X[j+2]+110,380,{c:C.red,z:11.5});});},
        hud(){return[['slowest answer',`${R.maxWait.toFixed(1)} s`,R.maxWait<=2?C.green:C.red],['healthy calls ok',`${Math.round(R.fastOk*100)}%`,R.fastOk>=1?C.green:C.red],['orphaned',`${R.orphans}`,R.orphans===0?C.green:C.red]];},
        score(){const a=R.maxWait<=2,b=R.fastOk>=1,c=R.orphans===0;if(a&&b&&c)return{stars:3,title:'Fast failures, no waste',msg:`Slowest answer ${R.maxWait.toFixed(1)} s. Each timeout sits inside the one around it, so a hung bank fails quickly and nobody keeps working for a caller who has already left.`};
          if(a&&b)return{stars:2,title:'Within budget, but wasteful',msg:'An inner service waits longer than its caller does, so it keeps working after the caller has given up. Make each inner timeout shorter.'};
          return{stars:1,title:a?'Healthy calls are failing':`Users waited ${R.maxWait.toFixed(1)} s`,msg:a?'A timeout is shorter than a healthy call needs. Leave room for 0.2 s plus 0.1 s per hop.':'The outer timeout lets users wait past 2 s. Every hop must fit inside the budget.'};}};}})});
