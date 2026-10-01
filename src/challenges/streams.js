/* ---------------- 15b. STREAMS: partitions and consumers ---------------- */
// 1,200 events/s spread over the partitions; a consumer handles 400/s; consumer 1 dies at 6 s
function streamPlan(P,Cn,dead){const owners=Array.from({length:Cn},()=>[]),alive=[...Array(Cn).keys()].filter(c=>!(dead&&c===0));
  for(let p=0;p<P;p++)if(alive.length)owners[alive[p%alive.length]].push(p);return owners;}
chal('streams',{title:'Keep up with the stream',goal:'1,200 events per second; each consumer handles 400. One consumer will crash halfway. Finish with under 200 events of lag, no idle consumers, and at most 4 consumers.',
  hint:'Partitions are the unit of sharing: a consumer with no partition sits idle. After the crash, the survivors split its partitions, so leave headroom.',
  make:simGame({dur:12,defaults:{p:2,c:2},intro:'Pick partitions and consumers, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Partitions',1,8,1,p.p,v=>`${v}`,v=>{p.p=v;re();});api.slider('Consumers',1,6,1,p.c,v=>`${v}`,v=>{p.c=v;re();});},
    build(p,api){const RATE=1200/p.p,CAP=400;let dead=false,lag=Array(p.c).fill(0),idleSeen=false,acc=0,n=0;const fl=[];
      const PY=k=>300+(k-(p.p-1)/2)*Math.min(56,420/p.p),CY=k=>300+(k-(p.c-1)/2)*Math.min(80,440/p.c);
      return{step(dt,t){if(!dead&&t>=6){dead=true;FX.burst(820,CY(0),C.red,24);FX.text(820,CY(0)-44,'crashed',C.red,14);}
          const own=streamPlan(p.p,p.c,dead);own.forEach((ps,c)=>{if(dead&&c===0)return;if(!ps.length)idleSeen=true;lag[c]=Math.max(0,lag[c]+(ps.length*RATE-CAP)*dt);});
          acc+=dt*18;const now=api.now();while(acc>=1){acc--;const k=n++%p.p,c=own.findIndex(ps=>ps.includes(k));
            fl.push({t0:now,d:.5,pts:[[110,300],[340,PY(k)]],c:C.blue,r:3});if(c>=0)fl.push({t0:now+.5,d:.5,pts:[[640,PY(k)],[760,CY(c)]],c:lag[c]>1?C.amber:C.green,r:3});}},
        draw(now,running){flyers(now,fl);box(110,300,{label:'Events',sub:'1,200 / s',w:120,h:56,c:C.blue});
          const own=streamPlan(p.p,p.c,dead);
          for(let k=0;k<p.p;k++){const y=PY(k);g.save();rr(340,y-14,300,28,8);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.line;g.stroke();g.restore();tx(`partition ${k} · ${Math.round(RATE)}/s`,490,y,{z:11.5,f:MONO,c:C.dim});
            const c=own.findIndex(ps=>ps.includes(k));if(c>=0)ln([[640,y],[760,CY(c)]],{c:hexA(C.green,.4)});}
          for(let c=0;c<p.c;c++){const d=dead&&c===0,load=own[c].length*RATE;server(820,CY(c),{label:`Consumer ${c+1}`,sub:d?'':own[c].length?`${Math.round(load)}/s`:'idle',w:120,h:Math.min(56,400/p.c),st:d?'fail':!own[c].length?'off':load>CAP?'hot':'ok'});
            if(!d&&lag[c]>1)tx(`lag ${Math.round(lag[c])}`,890,CY(c)+4,{z:11.5,c:C.amber,al:'left',f:MONO});}
          if(!running)tx(`each consumer handles 400/s`,W/2,536,{z:13,c:C.dim});},
        hud(){const L=lag.reduce((a,b)=>a+b,0),idle=idleSeen||streamPlan(p.p,p.c,false).some(ps=>!ps.length);return[['lag',`${Math.round(L)} events`,L<200?C.green:C.red],['idle consumers',idle?'yes':'none',idle?C.red:C.green],['consumers',`${p.c}`,p.c<=4?C.green:C.amber]];},
        score(){const L=lag.reduce((a,b)=>a+b,0),idle=idleSeen||streamPlan(p.p,p.c,false).some(ps=>!ps.length);const a=L<200,b=!idle,c=p.c<=4,n=[a,b,c].filter(Boolean).length;
          if(n===3)return{stars:3,title:'Kept up through the crash',msg:`${p.p} partitions over ${p.c} consumers: no one idle, and after the crash the survivors still had room for the extra partitions.`};
          const why=[!a&&(p.c*CAP<1200?'there was never enough consumer capacity':'after the crash some consumers got more partitions than they could handle'),!b&&'more consumers than partitions leaves some idle',!c&&'more than 4 consumers is over budget'].filter(Boolean).join('; ');
          return{stars:n===2?2:1,title:`${n} of 3 goals`,msg:why.charAt(0).toUpperCase()+why.slice(1)+'.'};}};}})});
