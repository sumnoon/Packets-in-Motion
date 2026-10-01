/* ---------------- 23. CAPSTONE: launch the chat app ---------------- */
// 100,000 people online; a gateway holds 40,000 sockets; a store shard takes 3,000 messages/s.
// A message storm runs from 5 s to 12 s, and one gateway dies at 9 s. 10% of members are offline.
// Scored as recipients reached within a second: offline members count only if a push reaches them
// (without push the message is still stored and synced on their next open, just not in time).
function chatModel(p){const ONLINE=100000,GW=40000,SHARD=3000,FAN=20000;let sent=0,ok=0,lost={store:0,sockets:0,fanout:0,offline:0,crash:0};
  for(let t=0;t<16;t+=.1){const rate=t>=5&&t<12?8000:4000,dt=.1,gw=t>=9?p.gw-1:p.gw;sent+=rate*dt;
    const stored=Math.min(rate,p.shards*SHARD);lost.store+=(rate-stored)*dt;
    const conn=Math.min(1,gw*GW/ONLINE);lost.sockets+=stored*.9*(1-conn)*dt;
    const fan=p.pubsub?1:Math.min(1,FAN/(stored*Math.max(1,gw)));lost.fanout+=stored*.9*conn*(1-fan)*dt;
    if(!p.push)lost.offline+=stored*.1*dt;
    if(t>=9&&t<10.5&&!p.resume)lost.crash+=stored*.9*conn*fan/Math.max(1,p.gw)*dt;}
  const L=Object.values(lost).reduce((a,b)=>a+b,0);return{sent,lost,del:1-L/sent,cost:p.gw*2+p.shards*3+(p.pubsub?1:0)+(p.push?1:0)};}
chal('capstone-chat',{title:'Launch the chat app',goal:'100,000 people online, a message storm, a gateway crash and 10% of members offline. Reach at least 99.5% of recipients within a second (a push notification counts for offline members) and spend at most $20/h.',
  hint:'Count sockets: you need room for everyone even after a gateway dies. Count writes for the storm. Pub/sub saves the chat service from calling every gateway. Offline members need push, and reconnecting members need to resume from a sequence number.',
  make:simGame({dur:16,defaults:{gw:2,shards:1,pubsub:false,push:false,resume:false},intro:'Pick your building blocks, watch the cost, then press <b>Run load test</b>.',runLabel:'Run load test',
    controls(api,p,re){api.slider('Gateways',1,5,1,p.gw,v=>`${v} × 40k sockets`,v=>{p.gw=v;re();});api.slider('Store shards',1,4,1,p.shards,v=>`${v} × 3,000/s`,v=>{p.shards=v;re();});
      api.toggle('Pub/sub between gateways',p.pubsub,v=>{p.pubsub=v;re();});api.toggle('Push notifications',p.push,v=>{p.push=v;re();});api.toggle('Resume from last sequence number',p.resume,v=>{p.resume=v;re();});},
    build(p,api){const M=chatModel(p);let T=0,acc=0;const fl=[];const GY=k=>300+(k-(p.gw-1)/2)*Math.min(84,380/p.gw),SY=k=>140+k*72;
      return{step(dt,t){T=t;if(t>=9&&t-dt<9)FX.burst(330,GY(0),C.red,26);const now=api.now(),storm=t>=5&&t<12;acc+=dt*(storm?20:10);
          while(acc>=1){acc--;const k=Math.floor(Math.random()*p.gw),dead=t>=9&&k===0,bad=Math.random()>M.del;
            fl.push({t0:now,d:.5,pts:[[80,300],[330-58,GY(k)]],c:C.blue,r:3});
            fl.push({t0:now+.5,d:.5,pts:[[330+58,GY(k)],[540-62,300]],c:dead?C.red:C.blue,r:3,drop:dead?.5:0});
            fl.push({t0:now+1,d:.5,pts:[[540+62,300],[p.pubsub?700:330,p.pubsub?300:GY((k+1)%p.gw)]],c:bad?C.red:C.green,r:3,drop:bad?.8:0});}},
        draw(now,running){flyers(now,fl);for(let i=0;i<4;i++)user(80,240+i*40,{r:11});tx('100k online',80,420,{z:12,c:C.dim});
          for(let k=0;k<p.gw;k++)server(330,GY(k),{label:`Gateway ${k+1}`,sub:'40k sockets',w:116,h:46,st:running&&T>=9&&k===0?'fail':'ok'});
          server(540,300,{label:'Chat service',w:124,h:56});
          for(let k=0;k<p.shards;k++)db(870,SY(k),{label:`Shard ${k+1}`,w:84,h:58});ln([[602,290],[828,SY(0)]],{c:C.line});
          if(p.pubsub)box(700,300,{label:'Pub/Sub',c:C.amber,w:104,h:46});if(p.push)box(700,440,{label:'Push',c:C.green,w:96,h:44});
          if(running)tx(T<5?'Normal traffic':T<9?'Message storm':T<12?'Storm + a gateway dies':'Recovering',W/2,40,{z:17,wt:800,c:T>=5&&T<12?C.red:C.accent});
          tx(`$${M.cost}/h`,90,500,{z:18,wt:800,c:M.cost<=20?C.green:C.red,f:MONO});},
        hud(){const shown=T>=16?M.del:1-(1-M.del)*clamp(T/16);return[['reached in time',`${(shown*100).toFixed(2)}%`,shown>=.995?C.green:C.red],['cost',`$${M.cost}/h`,M.cost<=20?C.green:C.red]];},
        score(){const d=M.del,why=Object.entries(M.lost).filter(([,v])=>v>M.sent*.001).sort((a,b)=>b[1]-a[1]).map(([k])=>({store:'the store shards could not take the storm',sockets:'there were not enough gateway sockets for everyone (count them after the crash)',fanout:'without pub/sub the chat service could not call every gateway',offline:'offline members were not told until they next opened the app: turn on push',crash:'members on the dead gateway lost the messages sent while they reconnected: resume from the last sequence number'})[k]);
          if(d>=.995&&M.cost<=20)return{stars:3,title:'Everyone reached in time',msg:`${(d*100).toFixed(2)}% reached within a second for $${M.cost}/h. Enough sockets to lose a gateway, shards for the storm, pub/sub for fan-out, push for the offline, and exact resumes.`};
          if(d>=.97)return{stars:2,title:`${(d*100).toFixed(2)}% reached in time`,msg:(M.cost>20?'Over budget. ':'')+(why.length?'Biggest gap: '+why[0]+'.':'Trim the cost.')};
          return{stars:d>=.85?1:0,title:`${(d*100).toFixed(1)}% reached in time`,msg:'Too many people did not get their messages in time: '+why.slice(0,2).join('; ')+'.'};}};}})});
