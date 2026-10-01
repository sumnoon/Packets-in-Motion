/* ---------------- 9. REPLICATION: build it, then survive the crash ---------------- */
chal('replication',{title:'Keep it serving',goal:'Handle 150 requests/s (70% reads). Each node takes 60/s. Mid-run the leader crashes: click a follower to promote it. Stay above 95% success.',
  hint:'Writes can only go to the leader. Spread the reads across followers. After a promotion you lose one follower, so keep a spare.',
  make:simGame({dur:14,defaults:{f:1,reads:false},intro:'Choose followers and where reads go. Be ready: when the leader dies, click a follower fast.',
    controls(api,p,re){api.slider('Followers',0,3,1,p.f,v=>`${v}`,v=>{p.f=v;re();});api.toggle('Send reads to followers',p.reads,v=>{p.reads=v;re();});},
    build(p,api){const L={x:560,y:130,role:'leader',alive:true},F=Array.from({length:p.f},(_,k)=>({x:p.f===1?560:360+k*(400/Math.max(1,p.f-1)),y:370,role:'follower',alive:true}));
      const nodes=[L,...F];let ok=0,fail=0,crash=false,need=false,crashAt=0,down=0,acc=0;const fl=[];const APP=[150,250];
      const leader=()=>nodes.find(n=>n.role==='leader'&&n.alive);
      return{step(dt,t){if(!crash&&t>=6){crash=true;L.alive=false;need=!!F.length;crashAt=t;FX.burst(L.x,L.y,C.red,30);}
          const ld=leader();if(!ld)down+=dt;const fol=nodes.filter(n=>n.role==='follower'&&n.alive);
          const W_=45,Rd=105;let wOk=ld?Math.min(W_,60):0;let rd=0;if(p.reads&&fol.length){rd=Math.min(Rd,fol.length*60);wOk=ld?Math.min(W_,60):0;}else if(ld){const cap=60-wOk;rd=Math.min(Rd,Math.max(0,cap));}
          ok+=(wOk+rd)*dt;fail+=(150-wOk-rd)*dt;
          acc+=dt*18;const now=api.now();while(acc>=1){acc--;const isW=Math.random()<.3;let tgt=isW?ld:(p.reads&&fol.length?fol[Math.floor(Math.random()*fol.length)]:ld);
            const bad=!tgt||(isW?0:Math.random()>rd/Rd);fl.push({t0:now,d:.6,pts:[APP,tgt?[tgt.x,tgt.y]:[L.x,L.y]],c:bad?C.red:isW?C.amber:C.blue,r:4,drop:bad?.8:0});}},
        draw(now,running){flyers(now,fl);server(APP[0],APP[1],{label:'App',sub:'150 req/s',w:110});
          nodes.forEach((n,k)=>db(n.x,n.y,{label:n.role==='leader'?'Leader':`Follower ${k}`,sub:n.alive?(n.role==='leader'?'writes':'reads'):'',st:n.alive?(n.role==='leader'?'acc':'ok'):'fail',col:n.role==='leader'?C.accent:undefined,w:96,h:84}));
          F.forEach(f=>{if(f.alive&&L.alive)ln([[L.x,L.y+44],[f.x,f.y-44]],{c:hexA(C.accent,.4),dash:[4,6]});});
          if(need&&Math.sin(now*10)>-.2)tx('Leader down! Click a follower to promote it',W/2,500,{z:18,wt:800,c:C.red});
          tx('writes',80,470,{z:11,c:C.amber,al:'left'});tx('reads',80,490,{z:11,c:C.blue,al:'left'});},
        hud(){const s=ok+fail?ok/(ok+fail):1;return[['success',`${(s*100).toFixed(1)}%`,s>=.95?C.green:C.red],['no leader for',`${down.toFixed(1)} s`,down<1.5?C.green:C.red]];},
        down(x,y,now,running){if(!need||!running)return;const f=F.find(q=>q.alive&&Math.abs(x-q.x)<60&&Math.abs(y-q.y)<50);if(!f)return;f.role='leader';need=false;FX.burst(f.x,f.y,C.green,30,220);FX.text(f.x,f.y-70,'Promoted!',C.green);},
        score(){const s=ok/(ok+fail);if(s>=.95)return{stars:3,title:`${(s*100).toFixed(1)}% served`,msg:`Reads spread over followers, a quick promotion (${down.toFixed(1)} s without a leader) and a spare follower left afterwards. That is textbook replication.`};
          if(s>=.85)return{stars:2,title:`${(s*100).toFixed(1)}% served`,msg:p.f<3?'After the promotion you ran short of followers for all the reads. Keep a spare.':'Promote faster, or send reads to followers.'};
          if(s>=.6)return{stars:1,title:`${(s*100).toFixed(1)}% served`,msg:'One node cannot take everything. Add followers and move reads onto them.'};
          return{stars:0,title:'Mostly down',msg:'A single database had to do all the work, and it died. Add followers.'};}};}})});
