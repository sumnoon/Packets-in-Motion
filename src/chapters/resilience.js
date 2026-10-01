/* ---------------- 17. HEALTH CHECKS, FAILOVER, CIRCUIT BREAKERS, RETRIES ---------------- */
(function(){
  const LB=[330,290],SV=[[760,160],[760,290],[760,420]],CU=[90,290];
  const hung=t=>t>4.4&&t<12.4,outRot=t=>t>9.7&&t<13.2;
  // circuit breaker
  const CA_=[170,270],BR=[480,270],CB=[800,270];
  const calls=[];for(let s=14.5;s<28.6;s+=1)calls.push(s);
  const bFail=t=>t>17.3&&t<24.8;
  const cbState=t=>t<22.3?'CLOSED':t<25.3?'OPEN':t<27.4?'HALF-OPEN':'CLOSED';
  const CALL=calls.map(s=>{const at=s+.6,st=cbState(at);const trial=st==='HALF-OPEN'&&Math.abs(s-25.5)<.01;
    if(st==='CLOSED'||trial){const fail=bFail(s+1.2);return{s,pass:true,fail};}return{s,pass:false};});
  const fails=t=>CALL.filter(c=>c.pass&&c.fail&&t>=c.s+2.8&&c.s+2.8<=22.31).length;
  // retries
  const vx=v=>200+v*45,RY=[170,300,430];
  const ROW1=[];for(let v=0;v<=16;v+=.5)ROW1.push([v,5]);
  const ROW2=[0,1,3,7,15].map(v=>[v,5]);
  const ROW3=[];{const m={};for(let c=0;c<5;c++){let v=0;for(let k=0;k<5;k++){if(k>0)v+=(.35+rnd(c*7+k)*1.3)*Math.pow(2,k-1);if(v<=16){const b=Math.round(v/.2)*.2;m[b]=(m[b]||0)+1;}}}for(const b in m)ROW3.push([+b,m[b]]);}
ch({id:'resilience',group:'Reliability',title:'Health Checks, Failover, Circuit Breakers & Retries',dur:44,needs:['timeouts','spof'],related:['idempotency','load-balancers','backpressure'],
beats:[
[0,'Health checks: are you alive?','Every couple of seconds the load balancer pings each server. A healthy server answers "200 OK".'],
[4.4,'A server stops answering','Server 2 hangs. One missed check could be a blip, so the balancer waits for 3 misses in a row. Meanwhile, requests sent to it fail.'],
[9.7,'Failover: out of rotation','After 3 failed checks, Server 2 is marked unhealthy and traffic goes only to the healthy servers. When it recovers, it\'s added back.'],
[14,'Circuit breaker: guard a fragile call','Service A calls Service B through a breaker. While B is healthy the breaker is CLOSED and calls pass straight through.'],
[17.3,'Failures trip the breaker OPEN','B starts timing out. After 3 failures the breaker opens: calls now fail instantly instead of waiting, giving B room to recover.'],
[25.3,'HALF-OPEN: one test call','After a cool-down, a single trial call is allowed through. It succeeds, so the breaker closes and traffic flows again.'],
[29.5,'Retries with exponential backoff','Don\'t retry instantly and forever (top row). Wait 1 s, 2 s, 4 s, 8 s between tries so a struggling server can recover.'],
[36.5,'Add jitter','If every client backs off on the same schedule, they all retry at the same instant (spikes). Random jitter spreads them out.']],
use:['Health checks + failover: every load-balanced pool of servers','Circuit breakers: calls to other services or third-party APIs that can hang','Retries with backoff + jitter: transient network errors and 503s, only for idempotent operations'],
cons:['Health checks that are too sensitive cause flapping; too lax and failures linger','Breaker thresholds and cool-downs need tuning, and fail-fast still means errors','Retries multiply load; without backoff and a retry limit they can cause an outage']
,draw(t){
  if(t<14.2){const fa=A(t,.2,13.7).a;
    user(CU[0],CU[1],{label:'clients',a:fa});box(LB[0],LB[1],{label:'Load balancer',w:130,a:fa});ln([[CU[0]+17,CU[1]],[LB[0]-65,LB[1]]],{a:fa*.5});
    SV.forEach((s,k)=>{const st=k===1?(outRot(t)?'fail':hung(t)?'hot':'ok'):'ok';ln([[LB[0]+65,LB[1]],[s[0]-56,s[1]]],{a:fa*.5,dash:k===1&&outRot(t)?[4,6]:null});
      server(s[0],s[1],{label:'Server '+(k+1),sub:k===1&&hung(t)&&!outRot(t)?'not responding':null,st,a:fa,down:'OUT OF ROTATION'});});
    // pings
    each(t,.6,13,2,1.2,(i,s)=>SV.forEach((sv,k)=>{const p=[[LB[0]+65,LB[1]-6],[sv[0]-56,sv[1]-6]];pk(t,s,.5,p,C.accent,{r:3.5,a:fa});
      if(k===1&&hung(s+.5)){pop(t,s+1.1,sv[0]-90,sv[1]-30,'✕ timeout',C.red,{d:.9,z:12});}else pk(t,s+.55,.5,rev(p),C.green,{r:3.5,a:fa});}));
    tx('♥ health check every 2 s',LB[0],LB[1]+52,{z:12,c:C.accent,a:fa*V(t,.6)});
    const miss=t<5.7?0:t<7.7?1:t<9.7?2:3;
    if(t>5.7&&t<12.4)pill(miss<3?`missed ${miss} / 3`:'3 / 3 → unhealthy',SV[1][0]+120,SV[1][1],{c:miss<3?C.amber:C.red,z:12,a:V(t,5.7,12)});
    each(t,.8,13.3,.45,1.6,(i,s)=>{let k=i%3;if(outRot(s)&&k===1)k=i%2?0:2;const sv=SV[k];
      const p=[[CU[0]+17,CU[1]],[LB[0]-65,LB[1]],[LB[0]+65,LB[1]],[sv[0]-56,sv[1]]];pk(t,s,1.1,p,C.blue,{r:5,a:fa});
      if(k===1&&hung(s+1.1))drop(t,s+1.1,sv[0]-56,sv[1],{dx:-24});});
  }else if(t<29.4){const fa=A(t,14.2,28.9).a;const st=cbState(t);
    server(CA_[0],CA_[1],{label:'Service A',a:fa,w:120});server(CB[0],CB[1],{label:'Service B',sub:bFail(t)?'timing out':null,st:bFail(t)?'fail':'ok',a:fa,w:120,down:'SLOW'});
    ln([[CA_[0]+60,CA_[1]],[BR[0]-62,BR[1]]],{a:fa*.5});ln([[BR[0]+62,BR[1]],[CB[0]-60,CB[1]]],{a:fa*.5});
    const sc=st==='CLOSED'?C.green:st==='OPEN'?C.red:C.amber;
    const ang=-.75*P(t,22.3,22.8)*(1-P(t,25.3,25.8))-.3*P(t,25.3,25.8)*(1-P(t,27.4,27.9));
    draw(BR[0],BR[1],{a:fa},()=>{rr(-62,-40,124,80,14);g.fillStyle=C.panel;g.fill();g.strokeStyle=sc;g.lineWidth=2;glowOn(sc,14);g.stroke();glowOff();
      [-30,30].forEach(x=>{g.beginPath();g.arc(x,6,5,0,7);g.fillStyle=sc;g.fill();});
      g.save();g.translate(-30,6);g.rotate(ang);g.strokeStyle=sc;g.lineWidth=4;g.lineCap='round';g.beginPath();g.moveTo(0,0);g.lineTo(60,0);g.stroke();g.restore();});
    tx('circuit breaker',BR[0],BR[1]-56,{z:12.5,c:C.dim,a:fa});
    pill(st,BR[0],BR[1]+62,{c:sc,z:13.5,a:fa});
    if(t<25.3)pill(`failures: ${Math.min(3,fails(t))} / 3`,BR[0],BR[1]+100,{c:fails(t)>=3?C.red:C.dim,z:12,a:fa*V(t,17.5)});
    if(t>22.3&&t<25.3){const cd=1-(t-22.3)/3;draw(BR[0]+86,BR[1]-30,{a:fa},()=>{g.strokeStyle=C.red;g.lineWidth=3;g.beginPath();g.arc(0,0,11,-Math.PI/2,-Math.PI/2+Math.PI*2*cd);g.stroke();});tx('cool-down',BR[0]+86,BR[1]-6,{z:11,c:C.red,a:fa});}
    const a2b=[[CA_[0]+60,CA_[1]],[BR[0]-62,BR[1]]],b2b=[[BR[0]+62,BR[1]],[CB[0]-60,CB[1]]];
    CALL.forEach(c=>{pk(t,c.s,.6,a2b,C.blue,{r:5.5,a:fa});
      if(!c.pass){pk(t,c.s+.6,.6,rev(a2b),C.red,{r:5.5,a:fa,label:'fail fast'});return;}
      pk(t,c.s+.6,.6,b2b,C.blue,{r:5.5,a:fa,label:Math.abs(c.s-25.5)<.01?'trial call':null});
      if(c.fail){spin(t,CB[0]+84,CB[1],{c:C.red,a:t>c.s+1.2&&t<c.s+2.2?fa:0});pk(t,c.s+2.2,.6,rev(b2b),C.red,{r:5.5,a:fa,label:'timeout'});pk(t,c.s+2.8,.6,rev(a2b),C.red,{r:5.5,a:fa});}
      else{pk(t,c.s+1.3,.6,rev(b2b),C.green,{r:5.5,a:fa});pk(t,c.s+1.9,.6,rev(a2b),C.green,{r:5.5,a:fa});}});
    if(t>22.6&&t<25.3)pill('B gets breathing room',CB[0],CB[1]+64,{c:C.amber,z:12,a:V(t,22.8,25)});
  }else{const fa=A(t,29.5).a;
    tx('time →',vx(16),RY[2]+40,{z:12,c:C.dim,al:'right',a:fa});
    const rows=[['Instant retries',ROW1,C.red,30.2,'retry immediately, forever: server hammered'],['Exponential backoff',ROW2,C.amber,30.2,'5 clients retry in lockstep: spikes'],['+ Jitter',ROW3,C.green,36.8,'retries spread out: server can recover']];
    rows.forEach(([n,R,c,t0,msg],k)=>{const y=RY[k],a=fa*V(t,k===2?36.6:29.8+k*.3);const vNow=(t-t0)*3.1;
      tx(n,180,y-6,{z:14,wt:700,al:'right',c:C.text,a});ln([[vx(0),y],[vx(16),y]],{a,c:C.edge});
      R.forEach(([v,n2])=>{if(v>vNow)return;const h=n2*9;draw(0,0,{a},()=>{rr(vx(v)-3,y-h,6,h,2);g.fillStyle=c;glowOn(c,8);g.fill();glowOff();});});
      if(vNow>0&&vNow<16.5)ln([[vx(vNow),y-44],[vx(vNow),y+6]],{c:hexA(C.text,.4),w:1,a});
      pill(msg,560,y+44,{c,z:12,a:a*V(t,t0+1.5)});
      if(k===1)[[0,1,'1s'],[1,3,'2s'],[3,7,'4s'],[7,15,'8s']].forEach(([v0,v1,l])=>{if(vNow>v1)tx('wait '+l,vx((v0+v1)/2),y+16,{z:11.5,c:C.amber,a});});});
  }
}});})();
