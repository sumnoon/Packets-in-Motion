/* ---------------- 23. CAPSTONE: build and launch the chat app ---------------- */
// You build it on the board. 100,000 people are online; 10% of each message's recipients are offline.
// Messages: 4,000/s, a storm of 8,000/s from 5 s to 12 s, and the busiest gateway dies at 9 s.
// Scored as recipients reached within a second: offline members count only through a push.
(function(){
const ONLINE=100000,SOCK=40000,CHAT=12000,SHARD=3000,DIRECT=20000;
chal('capstone-chat',{title:'Build the chat app',goal:'Build it yourself: 100,000 people online, a message storm, the busiest gateway crashing and 10% of members offline. Reach at least 99.5% of recipients within a second (a push counts for offline members) and spend at most $22/h.',
  hint:'People → load balancer → WebSocket gateways (room for everyone even after one dies) → chat service → enough store shards for the storm. Deliver through pub/sub to every gateway, push to the offline, and let clients resume from their last sequence number.',
  make:labGame({id:'capstone-chat',budget:22,dur:16,scale:400,
    intro:'Drag components onto the board and wire them from People. A message goes phone → gateway → chat service → store, then out to the recipient’s gateway or phone.',
    fixedKinds:{users:{label:'People',shape:'user',w:44,h:44}},
    fixed:[{kind:'users',x:70,y:250,label:'100k online'}],
    kinds:{
      lb:{label:'Load balancer',short:'LB',cost:1,max:2,shape:'box',c:C.accent,w:100,h:48,sub:'health checks'},
      gateway:{label:'WebSocket gateway',short:'Gateway',cost:2,max:5,shape:'server',w:100,h:48,sub:'40k sockets',clone:true},
      chat:{label:'Chat service',short:'Chat',cost:2,max:2,shape:'server',w:104,h:52,sub:'12k msg/s',clone:true},
      store:{label:'Message store shard',short:'Shard',cost:3,max:4,shape:'db',w:80,h:62,sub:'3k writes/s',clone:true},
      pubsub:{label:'Pub/Sub',short:'Pub/Sub',cost:1,max:1,shape:'box',c:C.amber,w:96,h:46,sub:'channel per chat'},
      push:{label:'Push notifications',short:'Push',cost:1,max:1,shape:'box',c:C.green,w:96,h:46,sub:'offline phones'}},
    columns:{lb:200,gateway:350,chat:540,store:760,pubsub:540,push:760},
    links:{users:['lb','gateway'],lb:['gateway'],gateway:['chat'],chat:['store','pubsub','gateway','push'],pubsub:['gateway']},
    toggles:[{key:'resume',label:'Clients resume from their last sequence number',val:false}],
    check(G){const u=G.of('users')[0];if(!G.out(u).length)return['wire People to a load balancer or a gateway.'];
      if(!G.of('gateway').length)return['add WebSocket gateways: they hold everyone’s open connection.'];
      if(G.of('gateway').some(g=>!G.out(g,['chat']).length))return['every gateway needs a wire to the chat service.'];
      if(!G.of('chat').some(c=>G.out(c,['store']).length))return['the chat service must store each message: wire it to a store shard.'];
      if(!G.of('chat').some(c=>G.out(c,['pubsub','gateway']).length))return['messages need a way back out: pub/sub to the gateways, or direct wires.'];
      return[];},
    init(){return{sent:0,ok:0,dead:new Set(),killed:null,deadShare:0,deadAt:null,gwIn:{},lost:{noConn:0,noChat:0,store:0,route:0,fan:0,offline:0,crash:0}};},
    step(S,G,dt,t){const rate=t>=5&&t<12?8000:4000,phase=t<5?'Normal traffic':t<9?'Message storm':t<12?'Storm, and a gateway dies':'Recovering';
      if(t>=9&&!S.killed){const gws=G.of('gateway');if(gws.length){const b=gws.reduce((a,c)=>((S.gwIn[c.id]||0)>(S.gwIn[a.id]||0)?c:a));S.killed=b.id;S.dead.add(b.id);S.deadAt=t;S.deadShare=Math.min(S.gwIn[b.id]||0,SOCK)/ONLINE;FX.burst(b.x,b.y,C.red,30,220);labMark(b,'crashed',C.red,15);}}
      const flows=[],load={},bad=new Set(),F=(a,b,r,isBad,c)=>{if(!a||!b)return;flows.push({a:a.id,b:b.id,rate:r,bad:isBad,c});if(isBad)bad.add(a.id+'>'+b.id);};
      // connections: people → (LB) → gateways. The LB sends reconnects only to live gateways;
      // people wired straight to a gateway stay stuck on it when it dies.
      const want={};const conn=(n,people)=>{if(n.kind==='gateway'){want[n.id]=(want[n.id]||0)+people;return;}
        const outs=n.kind==='lb'?G.out(n,['gateway']).filter(g=>!S.dead.has(g.id)):G.out(n,['lb','gateway']);if(!outs.length)return;
        outs.forEach(m=>{F(n,m,rate*people/ONLINE/outs.length,S.dead.has(m.id),C.blue);conn(m,people/outs.length);});};
      G.of('users').forEach(u=>conn(u,ONLINE));if(!S.killed)S.gwIn=want;
      const held={};let connected=0;G.of('gateway').forEach(g=>{const w=want[g.id]||0;held[g.id]=S.dead.has(g.id)?0:Math.min(w,SOCK);connected+=held[g.id];load[g.id]=S.dead.has(g.id)?0:w/SOCK;});
      const cf=connected/ONLINE,reconnecting=S.deadAt!=null&&t<S.deadAt+1.5;
      // sending: the sender must be connected, its gateway must reach a chat service, and the message must be stored
      const sending=rate*cf;S.lost.noConn+=rate*(1-cf)*dt;
      const chatIn={};G.of('gateway').forEach(g=>{const share=sending*held[g.id]/Math.max(connected,1),cs=G.out(g,['chat']);if(!share)return;
        if(!cs.length){S.lost.noChat+=share*dt;return;}cs.forEach(c=>{chatIn[c.id]=(chatIn[c.id]||0)+share/cs.length;F(g,c,share/cs.length,false,C.blue);});});
      let reached=0;
      G.of('chat').forEach(c=>{const inC=chatIn[c.id]||0;load[c.id]=inC/CHAT;const ok=Math.min(inC,CHAT);S.lost.noChat+=(inC-ok)*dt;
        const st=G.out(c,['store']);if(!st.length){S.lost.store+=ok*dt;return;}
        let stored=0;const per=ok/st.length;st.forEach(s=>{const w=Math.min(per,SHARD);stored+=w;S.lost.store+=(per-w)*dt;F(c,s,per,per>SHARD,C.amber);load[s.id]=(load[s.id]||0)+per/SHARD;});
        if(!stored)return;
        // delivery: online recipients via pub/sub, or direct calls to every wired gateway; offline ones by push
        const ps=G.out(c,['pubsub'])[0],direct=G.out(c,['gateway']),push=G.out(c,['push'])[0];
        const viaPs=new Set(ps?G.out(ps,['gateway']).map(g=>g.id):[]),viaD=new Set(direct.map(g=>g.id)),fan=direct.length&&!ps?Math.min(1,DIRECT/(stored*direct.length)):1;
        if(ps)F(c,ps,stored,false,C.amber);
        S.lost.noConn+=stored*.9*(1-cf)*dt;
        G.of('gateway').forEach(g=>{if(!held[g.id])return;const share=stored*.9*held[g.id]/ONLINE;
          const path=viaPs.has(g.id)?'ps':viaD.has(g.id)?'d':null;if(!path){S.lost.route+=share*dt;return;}
          const got=path==='d'?share*fan:share;S.lost.fan+=(share-got)*dt;reached+=got;F(path==='ps'?ps:c,g,got,false,C.green);});
        // people from the dead gateway are reconnecting: they miss these messages unless they resume
        if(reconnecting&&!G.opts.resume){const miss=Math.min(reached,stored*.9*S.deadShare);reached-=miss;S.lost.crash+=miss*dt;}
        if(push){reached+=stored*.1;F(c,push,stored*.1,false,C.green);}else S.lost.offline+=stored*.1*dt;});
      S.sent+=rate*dt;S.ok+=Math.min(rate,reached)*dt;
      return{flows,load,dead:S.dead,phase,badEdges:bad};},
    hud(S){const r=S.sent?S.ok/S.sent:1;return[['reached in time',`${(r*100).toFixed(2)}%`,r>=.995?C.green:C.red]];},
    score(S,G,cost){const r=S.ok/S.sent;
      if(r>=.995&&cost<=22)return{stars:3,title:'Everyone reached in time',msg:`${(r*100).toFixed(2)}% reached within a second for $${cost}/h. Room to lose a gateway, shards for the storm, pub/sub for fan-out, push for the offline and exact resumes: you built it.`};
      const top=Object.entries(S.lost).sort((a,b)=>b[1]-a[1])[0];
      const why=top&&top[1]>S.sent*.002?({noConn:'Not everyone could hold a connection: count sockets (40k per gateway) after one gateway dies, and put a load balancer in front so people reconnect to live gateways.',
        noChat:'Messages got stuck before the chat service: wire every gateway to it, and keep it under 12k messages/s.',store:'The store could not take the storm: add shards (3k writes/s each).',
        route:'Some gateways never got the messages for their users: wire pub/sub to every gateway.',fan:'Calling every gateway directly could not keep up with the storm: use pub/sub.',
        offline:'Offline members were not told until they next opened the app: add push notifications.',crash:'People on the dead gateway lost the messages sent while they reconnected: let clients resume from their last sequence number.'})[top[0]]:'';
      const msg=[why,cost>22?`Over budget at $${cost}/h.`:''].filter(Boolean).join(' ')||'Close: trim the cost.';
      if(r>=.97)return{stars:2,title:`${(r*100).toFixed(2)}% reached in time`,msg};
      return{stars:r>=.85?1:0,title:`${(r*100).toFixed(1)}% reached in time`,msg};}})});
})();
