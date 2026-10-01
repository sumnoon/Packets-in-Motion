/* ---------------- 3b. SESSIONS: keep them logged in ---------------- */
chal('sessions',{title:'Keep everyone logged in',goal:'30 users click around. At 5 s Server A dies; at 9 s the session store\'s machine dies. Finish with zero forced re-logins.',
  hint:'Memory on each server loses users to round robin; sticky sessions lose everyone on the dead server. A shared store fixes both, but the store must survive too.',
  make:simGame({dur:13,defaults:{mode:'mem',rep:false},intro:'Choose where sessions live, then press <b>Run it</b>.',
    controls(api,p,re){api.seg('Sessions live in',[['mem','server memory'],['sticky','memory + sticky cookie'],['shared','shared store (Redis)']],p.mode,v=>{p.mode=v;re();});api.toggle('Store has a replica',p.rep,v=>{p.rep=v;re();});},
    build(p,api){const SV=['A','B','C'],users=Array.from({length:30},(_,i)=>({home:i%3,where:new Set([i%3]),n:0}));let relog=0,aDead=false,sDead=false,acc=0,rr_=0,T=0;const fl=[];const SY=k=>150+k*140;
      return{step(dt,t){T=t;if(!aDead&&t>=5){aDead=true;FX.burst(560,SY(0),C.red,24);}if(!sDead&&t>=9&&p.mode==='shared'){sDead=true;FX.burst(840,290,C.red,24);if(!p.rep){relog+=30;FX.text(840,230,'all sessions lost',C.red);}else FX.text(840,230,'replica took over',C.green);}
          acc+=dt*6;const now=api.now();while(acc>=1){acc--;const i=Math.floor(Math.random()*30),u=users[i];let k;
            if(p.mode==='sticky'){k=u.home;if(aDead&&k===0){k=1+(i%2);if(!u.moved){u.moved=true;relog++;fl.push({t0:now,d:.6,pts:[[70,110+i*11],[300,290],[560-60,SY(k)]],c:C.red,r:3.5,label:'log in again'});continue;}}}
            else{do{k=rr_++%3;}while(aDead&&k===0);}
            let bad=false;if(p.mode==='mem'){if(!u.where.has(k)||(k===0&&aDead)){bad=true;relog++;u.where.add(k);}}
            fl.push({t0:now,d:.6,pts:[[70,110+i*11],[300,290],[560-60,SY(k)]],c:bad?C.red:C.blue,r:3.5});if(p.mode==='shared')fl.push({t0:now+.6,d:.4,pts:[[620,SY(k)],[790,290]],c:C.amber,r:3});}},
        draw(now){flyers(now,fl);for(let i=0;i<30;i++)dot(70,110+i*11,C.blue,3.2);tx('30 users',70,460,{z:12,c:C.dim});box(300,290,{label:'Load balancer',sub:p.mode==='sticky'?'sticky':'round robin',w:140,h:52});
          SV.forEach((n,k)=>server(560,SY(k),{label:`Server ${n}`,sub:p.mode==='shared'?'stateless':'sessions in RAM',w:130,h:54,st:k===0&&aDead?'fail':'ok'}));
          if(p.mode==='shared'){db(840,290,{label:'Session store',sub:sDead?(p.rep?'replica now':'DOWN'):'Redis',w:120,h:86,st:sDead&&!p.rep?'fail':'ok'});if(p.rep)db(840,420,{label:'Replica',w:90,h:64,st:sDead?'good':'ok'});}},
        hud(){return[['forced re-logins',`${relog}`,relog===0?C.green:C.red]];},
        score(){if(relog===0)return{stars:3,title:'Nobody noticed a thing',msg:'Stateless servers plus a replicated session store: a server died and so did the store\'s machine, and every user stayed logged in.'};
          if(relog<=12)return{stars:2,title:`${relog} users logged out`,msg:p.mode==='sticky'?'Sticky sessions kept most users happy, but everyone pinned to Server A lost their session when it died.':'Close. Make the session store itself survive a failure.'};
          return{stars:1,title:`${relog} forced re-logins`,msg:p.mode==='mem'?'With sessions in each server\'s memory, round robin keeps sending users to servers that do not know them.':'The session store was a single point of failure: when it died, every session went with it. Give it a replica.'};}};}})});
