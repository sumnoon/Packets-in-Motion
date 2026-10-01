/* ---------------- 21. OBSERVABILITY ---------------- */
(function(){
  const CH=[[60,130,'user'],[190,130,'gateway'],[380,130,'orders'],[570,130,'payments'],[760,130,'db']];
  const hopPath=(i)=>[[CH[i][0]+(i===0?17:55),130],[CH[i+1][0]-(i+1===4?46:55),130]];
  const full=[];for(let i=0;i<4;i++){const h=hopPath(i);if(!full.length)full.push(h[0]);full.push(h[1]);if(i<3)full.push([CH[i+1][0]+55,130]);}
  const LOGS=[['gateway','INFO','GET /checkout 200 (41 ms)'],['orders','INFO','order 9812 created'],['payments','INFO','charging card …4242'],['db','INFO','INSERT payments (3 ms)'],['payments','WARN','bank API slow: 820 ms'],['gateway','INFO','GET /cart 200 (12 ms)'],['orders','INFO','order 9813 created'],['payments','ERROR','bank API timeout after 2000 ms'],['orders','ERROR','checkout failed: payment error'],['gateway','INFO','POST /checkout 502 (2051 ms)'],['orders','INFO','order 9814 created'],['payments','INFO','charging card …1881'],['db','INFO','INSERT payments (4 ms)'],['gateway','INFO','GET /checkout 200 (57 ms)'],['orders','INFO','order 9815 created'],['payments','INFO','charging card …7730']];
  const svcX=n=>CH.find(c=>c[2]===n)[0];
  const series=(f)=>Array.from({length:48},(_,i)=>f(i/47,i));
  const RPS=series((u,i)=>120+18*Math.sin(u*9)+8*(rnd(i)-.5)),ERR=series((u,i)=>u>.55&&u<.72?3.5+rnd(i+50):.4+.3*rnd(i+90)),P99=series((u,i)=>u>.55&&u<.72?820+80*rnd(i):190+30*Math.sin(u*7)+20*rnd(i+7));
  const SP=[['gateway',0,480],['orders',15,462],['payments',40,440],['db query',48,70],['bank API call',80,428]];
ch({id:'observability',group:'Architecture',title:'Observability: Logs, Metrics & Traces',dur:36,
beats:[
[0,'One click, many services','A single request hops through the gateway, the Orders service, the Payments service and the database. When it\'s slow, where do you even look?'],
[4,'Logs: what happened, in detail','Each service writes timestamped lines describing events. Great for the details of a single error, but there are millions of lines to search.'],
[13,'Metrics: numbers over time','Counters and gauges (requests per second, error rate, p99 latency) are cheap to store and graph. An alert fires when a line crosses a threshold.'],
[22,'Traces: one request\'s whole journey','A trace follows one request (id 7f3a) across every service. Each bar is a span. The longest bar shows exactly where the time went: the bank API call.'],
[32,'Use all three together','Metrics tell you something is wrong. Traces tell you where. Logs tell you why.']],
use:['Any system with more than one service, or anything running in production','Metrics + alerts: know about problems before users complain','Traces: find the slow hop in a distributed request; logs: debug the specific failure'],
cons:['Storage and tooling cost grows fast (log volume especially), so sample and set retention','High-cardinality labels (user ids in metrics) can blow up metric systems','Instrumenting every service takes effort (OpenTelemetry helps standardise it)']
,draw(t){
  CH.forEach(([x,y,n],i)=>{const a=A(t,.2+i*.15);if(i===0)user(x,y,{label:'user',...a});else if(n==='db')db(x,y,{label:'db',w:84,h:66,...a});else server(x,y,{label:n,w:110,h:54,...a,st:n==='payments'&&t>22&&t<32?'hot':'ok'});});
  for(let i=0;i<4;i++)ln(hopPath(i),{a:V(t,.8)*.5});
  each(t,.5,34,1.9,4.6,(i,s)=>{const traced=s>21.5&&s<23;pk(t,s,2.2,full,traced?C.accent:C.blue,{r:traced?7:5.5,label:traced?'trace 7f3a':null});pk(t,s+2.3,2.2,rev(full),C.green,{r:5});});
  // logs
  const la=A(t,4.2,12.7).a;
  if(la>0){panel(60,236,880,296,{a:la});tx('LOGS',80,258,{z:12,wt:800,c:C.dim,al:'left',a:la});
    const rate=.52,n=clamp(Math.floor((t-4.4)/rate)+1,0,LOGS.length),frac=clamp(((t-4.4)/rate)%1*2.5);
    g.save();rr(60,270,880,258,0);g.clip();
    for(let k=0;k<n;k++){const [svc,lv,msg]=LOGS[k];const y=510-(n-1-k)*27+(k===n-1?(1-eio(frac))*14:0)-(n>0?0:0);if(y<280)continue;
      const c=lv==='ERROR'?C.red:lv==='WARN'?C.amber:'#c9d2e3',a=la*(k===n-1?eio(frac):1);
      tx(`12:00:${String(3+k).padStart(2,'0')}.${String(100+k*37%900).slice(0,3)}`,80,y,{z:12.5,f:MONO,al:'left',c:C.faint,a});
      tx(`[${svc}]`,230,y,{z:12.5,f:MONO,al:'left',c:C.accent,a});tx(lv,340,y,{z:12.5,f:MONO,al:'left',c,wt:700,a});tx(msg,410,y,{z:12.5,f:MONO,al:'left',c,a});
      if(lv==='ERROR'){g.save();g.globalAlpha=a*.12;g.fillStyle=C.red;g.fillRect(70,y-11,860,22);g.restore();}}
    g.restore();
    for(let k=0;k<LOGS.length;k++){const t0=4.4+k*rate-.4;pk(t,t0,.4,[[svcX(LOGS[k][0]),160],[svcX(LOGS[k][0]),240]],C.dim,{r:3.5,a:la});}}
  // metrics
  const ma=A(t,13.2,21.7).a;
  if(ma>0){const prog=clamp((t-13.6)/5.8);
    [['Requests / sec',RPS,0,200,C.blue,null],['Error rate %',ERR,0,5,C.red,null],['p99 latency ms',P99,0,1000,C.amber,500]].forEach(([title,d,lo,hi,c,th],k)=>{
      const x0=70+k*292,y0=250,w=272,h=250;panel(x0,y0,w,h,{a:ma});tx(title,x0+14,y0+20,{z:12.5,wt:700,al:'left',c:C.dim,a:ma});
      const px=i=>x0+16+(w-32)*i/47,py=v=>y0+h-20-(h-60)*(v-lo)/(hi-lo);
      if(th!=null){ln([[x0+16,py(th)],[x0+w-16,py(th)]],{dash:[5,5],c:hexA(C.red,.7),a:ma});tx('alert > '+th,x0+w-16,py(th)-10,{z:10.5,al:'right',c:C.red,a:ma});}
      const m=Math.max(2,Math.floor(prog*48));const pts=d.slice(0,m).map((v,i)=>[px(i),py(v)]);ln(pts,{c,w:2.2,a:ma});
      const last=d[m-1];tx((k===1?last.toFixed(1):Math.round(last))+'',x0+w-16,y0+20,{z:14,wt:750,al:'right',f:MONO,c,a:ma});});
    if(prog>.58)pill('🔔 ALERT: p99 latency > 500 ms',500,222,{c:C.red,z:12.5,a:ma*V(t,13.6+5.8*.58)});}
  // trace
  const ta=A(t,22.2,31.7).a;
  if(ta>0){panel(60,236,880,296,{a:ta});tx('TRACE  7f3a  ·  480 ms total',80,258,{z:12.5,wt:800,al:'left',c:C.accent,a:ta});
    const X0=270,X1=910,sx=ms=>X0+(X1-X0)*ms/500,grow=clamp((t-22.8)/3.4)*500;
    [0,100,200,300,400,500].forEach(ms=>{tx(ms+' ms',sx(ms),284,{z:10.5,c:C.faint,a:ta});ln([[sx(ms),292],[sx(ms),512]],{c:hexA(C.line,.8),w:1,a:ta});});
    SP.forEach(([n,a0,a1],k)=>{const y=318+k*42,e=Math.min(a1,Math.max(a0,grow));const slow=n==='bank API call';const c=slow?C.red:k===0?C.blue:k===1?C.accent:k===2?C.amber:C.green;
      tx(n,X0-14,y,{z:12.5,al:'right',c:slow?C.red:C.text,wt:slow?750:500,a:ta,f:MONO});
      if(e>a0){draw(0,0,{a:ta},()=>{rr(sx(a0),y-10,Math.max(4,sx(e)-sx(a0)),20,6);g.fillStyle=hexA(c,.8);if(slow)glowOn(C.red,14);g.fill();glowOff();});
        if(e>=a1)tx(`${a1-a0} ms`,sx(a1)+8,y,{z:12,al:'left',f:MONO,wt:700,c,a:ta});}});
    if(grow>=500)pill('← here is where the time goes',sx(250),318+4*42+30,{c:C.red,z:12,a:ta*V(t,26.4)});}
  // summary
  if(t>32){[['Metrics → something is wrong (and when)',C.amber],['Traces → where it\'s slow',C.accent],['Logs → why it happened',C.text]].forEach(([s,c],k)=>pill(s,500,300+k*52,{c,z:14.5,a:V(t,32.2+k*.5)}));}
}});})();
