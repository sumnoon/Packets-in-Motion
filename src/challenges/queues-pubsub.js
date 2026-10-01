/* ---------------- 14. QUEUES: survive the order surge ---------------- */
// You build it on the board: web shop → (queue) → workers, 25 orders/s each.
// Orders: 40/s, 120/s from 3 s to 7 s, and every worker restarts from 9 s to 10.5 s.
// Orders sent straight to a worker are lost when it is full or restarting; a queue holds them.
(function(){
const WORKER=25;
chal('queues-pubsub',{title:'Survive the order surge',goal:'Build it yourself: orders triple for 4 seconds, then the workers restart. Lose zero orders, clear the backlog by the end, and spend at most $5/h.',
  hint:'Wire the shop to a queue and the queue to the workers. The queue turns "too many right now" into "a bit later", but it needs enough workers (25 orders/s each) to catch up afterwards.',
  make:labGame({id:'queues-pubsub',
    hints:['When orders arrive faster than the workers can take them, where do the extra ones wait?','Shop → Queue → Workers. Then count: the queue has to be empty again by the end.'],
    solution:{nodes:['queue','worker','worker','worker','worker'],edges:[[0,1],[1,2]]},
    loadNote:n=>n.kind==='queue'?'orders piling up':null,
    blame(S,G,gen){const q=G.of('queue')[0],m=[];
      if(q&&S.backlog>=1)m.push({id:q.id,note:`${Math.round(S.backlog)} orders still waiting at the end`});
      return m.concat(gen.filter(x=>!(q&&x.id===q.id)));},budget:5,dur:14,scale:8,
    intro:'The web shop takes orders on the left. Workers process them, 25 a second each. Wire the shop to your workers, directly or through a queue, then press Run.',
    fixedKinds:{shop:{label:'Web shop',shape:'server',w:110,h:54,sub:'takes orders'}},
    fixed:[{kind:'shop',x:90,y:250,label:'Web shop'}],
    kinds:{
      queue:{label:'Queue',short:'Queue',cost:1,max:1,shape:'box',c:C.amber,w:130,h:58,sub:'holds orders'},
      worker:{label:'Worker',short:'Worker',cost:1,max:6,shape:'server',w:104,h:48,sub:'25 orders/s',clone:true}},
    columns:{queue:420,worker:740},
    links:{shop:['queue','worker'],queue:['worker']},
    check(G){const s=G.of('shop')[0];if(!G.out(s).length)return['wire the web shop to a queue or to workers.'];
      const q=G.of('queue')[0];if(q&&G.inn(q).length&&!G.out(q).length)return['the queue needs workers: wire it to them.'];
      return[];},
    sub(n,G,S){if(n.kind==='shop')return S?`${S.rate} orders/s`:'40 orders/s';if(n.kind==='queue'&&S)return`${Math.round(S.backlog)} waiting`;if(n.kind==='worker'&&S&&S.out)return'restarting';return null;},
    init(){return{rate:40,out:false,backlog:0,lost:0,done:0,total:0,why:{full:0,restart:0,nowhere:0}};},
    step(S,G,dt,t){const s0=labAt(S,'spike',3,1,5),r0=labAt(S,'restart',9,s0+4.5,Math.min(s0+6,10)),rate=t>=s0&&t<s0+4?120:40,out=t>=r0&&t<r0+1.5,phase=t<s0?'Normal orders':t<s0+4?'Order spike: 3×':out?'Workers restarting':'Catching up';
      const shop=G.of('shop')[0],outs=G.out(shop),q=G.of('queue')[0],flows=[],load={},used={},F=(a,b,r,isBad,c)=>{if(r>0)flows.push({a:a.id,b:b.id,rate:r,bad:isBad,c});};
      S.rate=rate;S.out=out;S.total+=rate*dt;
      if(!outs.length){S.lost+=rate*dt;S.why.nowhere+=rate*dt;}
      // the shop splits orders evenly over what it is wired to
      const share=rate/Math.max(1,outs.length);
      outs.forEach(m=>{if(m.kind==='queue'){S.backlog+=share*dt;F(shop,m,share,false,C.amber);return;}
        const cap=out?0:WORKER,ok=Math.min(share,cap),l=(share-ok)*dt;used[m.id]=ok;S.done+=ok*dt;S.lost+=l;S.why[out?'restart':'full']+=l;F(shop,m,share,share>cap+.01,C.amber);});
      // the queue's workers drain it with whatever capacity they have left
      if(q){const ws=G.out(q,['worker']),spare=ws.map(w=>out?0:Math.max(0,WORKER-(used[w.id]||0))),cap=spare.reduce((a,b)=>a+b,0);
        const d=Math.min(S.backlog,cap*dt);S.backlog-=d;S.done+=d;
        ws.forEach((w,k)=>{const r=cap?d/dt*spare[k]/cap:0;used[w.id]=(used[w.id]||0)+r;F(q,w,r,false,C.green);});
        load[q.id]=Math.min(1.5,S.backlog/200);}
      G.of('worker').forEach(w=>{if(!out)load[w.id]=(used[w.id]||0)/WORKER;});
      return{flows,load,dead:new Set(out?G.of('worker').map(w=>w.id):[]),phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S){return[['lost',`${Math.round(S.lost)}`,S.lost<1?C.green:C.red],['waiting',`${Math.round(S.backlog)}`,S.backlog<1?C.green:C.amber],['processed',`${Math.round(S.done)}`]];},
    score(S,G,cost){
      if(S.lost>=1){const top=Object.entries(S.why).sort((a,b)=>b[1]-a[1])[0][0];
        const msg={full:'The workers could not keep up with the spike, and without a queue the extra orders were simply turned away. Put a queue between the shop and the workers.',
          restart:'Orders that arrived while the workers restarted had nowhere to wait. Put a queue between the shop and the workers.',
          nowhere:'The shop was not wired to anything, so orders had nowhere to go.'}[top];
        return{stars:S.lost>S.total/2?0:1,title:`${Math.round(S.lost)} orders lost`,msg};}
      if(S.backlog>=1)return{stars:1,title:`${Math.round(S.backlog)} still waiting`,msg:'Nothing was lost, but the workers never caught up. Add a worker so the queue drains after the spike.'};
      if(cost<=5)return{stars:3,title:'Zero lost, queue drained',msg:'The queue absorbed the spike and the restart, and four workers were just enough to drain it. That is buffering.'};
      return{stars:2,title:'Zero lost',msg:`It works, but $${cost}/h is more than it needs: four workers behind a queue are enough.`};}})});
})();
