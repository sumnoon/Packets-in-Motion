/* ---------------- 14. QUEUES: survive the order surge ---------------- */
chal('queues-pubsub',{title:'Survive the order surge',goal:'Orders triple for 4 seconds, then the workers restart. Lose zero orders, clear the backlog by the end, and use at most 4 workers.',
  hint:'A queue turns "too many right now" into "a bit later". It needs enough workers to catch up afterwards.',
  make:simGame({dur:14,defaults:{q:false,n:2},intro:'Decide whether to put a queue in the middle and how many workers to run.',
    controls(api,p,re){api.toggle('Put a queue in the middle',p.q,v=>{p.q=v;re();});api.slider('Workers',1,5,1,p.n,v=>`${v} × 25/s`,v=>{p.n=v;re();});},
    build(p,api){let backlog=0,lost=0,done_=0,rate=40,acc=0,out=false;const fl=[];const WY=k=>p.n===1?280:150+k*(260/(p.n-1));
      return{step(dt,t){rate=t>=3&&t<7?120:40;out=t>=9&&t<10.5;const cap=out?0:p.n*25;const arr=rate*dt;
          if(p.q){backlog+=arr;const d=Math.min(backlog,cap*dt);backlog-=d;done_+=d;}else{const d=Math.min(arr,cap*dt);done_+=d;lost+=arr-d;}
          acc+=arr/3;const now=api.now();while(acc>=1){acc--;const full=!p.q&&(out||rate>cap);fl.push({t0:now,d:p.q?.4:.7,pts:p.q?[[120,280],[440,280]]:[[120,280],[760,WY(Math.floor(Math.random()*p.n))]],c:full&&Math.random()<(out?1:1-cap/rate)?C.red:C.amber,r:3.5,drop:0});
            const last=fl[fl.length-1];if(last.c===C.red)last.drop=.7;}
          if(p.q&&backlog>0&&!out&&Math.random()<cap*dt/3)fl.push({t0:now,d:.5,pts:[[520,280],[760,WY(Math.floor(Math.random()*p.n))]],c:C.green,r:3.5});},
        draw(now){flyers(now,fl);server(120,280,{label:'Web shop',sub:`${rate} orders/s`,w:120,st:rate>40?'hot':'ok'});
          if(p.q){box(480,280,{label:'Queue',sub:`${Math.round(backlog)} waiting`,c:C.amber,w:140,h:64,glow:backlog>0});meter(410,322,140,8,backlog/300,C.amber);}
          for(let k=0;k<p.n;k++)server(800,WY(k),{label:`Worker ${k+1}`,sub:out?'restarting':'25/s',w:110,h:52,st:out?'off':'ok'});
          if(out&&Math.sin(now*9)>0)tx('Workers restarting…',800,480,{z:14,wt:700,c:C.red});},
        hud(){return[['lost',`${Math.round(lost)}`,lost<1?C.green:C.red],['waiting',`${Math.round(backlog)}`,backlog<1?C.green:C.amber],['processed',`${Math.round(done_)}`]];},
        score(){if(lost>=1)return{stars:1,title:`${Math.round(lost)} orders lost`,msg:'Without a queue, anything beyond the workers\' speed, and everything sent while they restarted, is simply gone. Put a queue in between.'};
          if(backlog>=1)return{stars:1,title:`${Math.round(backlog)} still waiting`,msg:'Nothing was lost, but the workers never caught up. Add a worker so the queue drains after the surge.'};
          return p.n<=4?{stars:3,title:'Zero lost, queue drained',msg:'The queue absorbed the surge and the restart. Four workers were just enough to drain it. That is buffering.'}:{stars:2,title:'Zero lost',msg:'It works, but four workers would have been enough.'};}};}})});
