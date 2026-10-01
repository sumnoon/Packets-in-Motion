/* ---------------- 18b. DEPLOYING SAFELY: BLUE-GREEN, CANARY & FEATURE FLAGS ---------------- */
(function(){
const UY=k=>160+k*70,LB=[300,300],SY=k=>132+k*112;
const fromU=k=>[[104,UY(k)],[LB[0]-60,LB[1]]];
const toS=(x,y)=>[[LB[0]+60,LB[1]],[x-56,y]];
// canary: how much traffic v2 gets
const share=t=>t<20?0:t<22.4?.05:t<24.4?.25:t<26?.5:1;
const flagRung=t=>t<28.2?0:t<29.6?1:t<31.2?2:3;
ch({id:'deployments',group:'Reliability',title:'Deploying Safely: Blue-Green, Canary & Feature Flags',dur:38,needs:['load-balancers'],related:['observability','resilience','microservices'],
beats:[
[0,'Shipping is the risky part','Most outages start with a change. A new version can hide a bug that only shows up under real traffic.'],
[5,'All at once','Replace every server with v2 together. If v2 is broken, every user hits the bug until someone notices and redeploys v1.'],
[11,'Blue-green','Run v2 (green) beside v1 (blue). Point the load balancer at green in one step, and if anything breaks, point it straight back.'],
[19,'Canary','Send 5% of traffic to v2 and watch its error rate. Healthy? Widen to 25%, 50%, 100%. Broken? Roll back after hurting only a few users.'],
[27,'Feature flags','Ship the new code switched off. Turn it on for staff, then 1% of users, then everyone. Turning it off again needs no deploy at all.'],
[33,'Small steps, fast undo','Every safe release has the same shape: expose a little, measure, then widen or roll back.']],
use:['Blue-green: quick, all-or-nothing switches with an instant way back','Canary: big user bases where a bug at 5% is cheaper than at 100%','Feature flags: separating "deployed" from "released", A/B tests, kill switches'],
cons:['Blue-green doubles the servers during the switch','Canaries need good metrics and enough traffic to judge quickly','Old flags pile up as dead code: remove them once a feature is fully out'],
draw(t){
  for(let k=0;k<5;k++){const r=flagRung(t),lit=t>=27.4&&t<33&&(r===3||(r>=1&&k===0)||(r>=2&&k===1));user(90,UY(k),{r:14,c:C.blue,...A(t,.1+k*.05)});
    if(lit){g.save();g.strokeStyle=C.accent;g.lineWidth=2;g.beginPath();g.arc(90,UY(k),19,0,7);g.stroke();g.restore();}}
  box(LB[0],LB[1],{label:'Load balancer',w:120,h:54,...A(t,.3)});
  // ---- 0–11: one fleet; all at once
  const f1=V(t,.4,10.8);
  if(f1>0){const v2=t>=5.6;for(let k=0;k<4;k++){const y=SY(k);server(720,y,{label:v2?'v2':'v1',sub:v2?'new':'stable',w:110,h:54,st:v2&&t>6.4?'fail':'ok',down:'BUGGY',a:f1});ln(toS(720,y),{a:f1*.35});}
    each(t,.6,10.4,.16,1.3,(i,s)=>{const k=i%5,sv=i%4,bad=s>=6.2&&i%3===0;pk(t,s,.5,fromU(k),C.blue,{r:3.5,a:f1});pk(t,s+.5,.4,toS(720,SY(sv)),C.blue,{r:3.5,a:f1});
      pk(t,s+.9,.4,[[LB[0]-60,LB[1]],[104,UY(k)]],bad?C.red:C.green,{r:3.5,a:f1});});
    if(t>1&&t<5.4)pill('every outage starts with a change',LB[0],LB[1]+90,{c:C.dim,z:12.5,a:V(t,1,5.2)});
    if(t>6.6)pill('everyone hits the bug',LB[0],LB[1]+90,{c:C.red,z:12.5,a:f1*V(t,6.6)});}
  // ---- 11–19: blue-green
  const f2=V(t,11.2,18.8);
  if(f2>0){const live=t<13.6?'b':t<16.6?'g':'b';
    for(let k=0;k<3;k++){server(640,SY(k)+56,{label:'v1',sub:'blue',w:104,h:50,col:C.blue,st:'blue',a:f2});server(850,SY(k)+56,{label:'v2',sub:'green',w:104,h:50,col:C.green,st:t>15&&t<16.6?'fail':'good',down:'',a:f2});}
    tx('blue (live)',640,98,{z:12.5,wt:700,c:C.blue,a:f2*(live==='b'?1:.4)});tx('green (new)',850,98,{z:12.5,wt:700,c:C.green,a:f2*(live==='g'?1:.4)});
    for(let k=0;k<3;k++){ln(toS(640,SY(k)+56),{c:live==='b'?hexA(C.blue,.6):C.line,w:live==='b'?2.5:1,a:f2});ln([[LB[0]+60,LB[1]],[798,SY(k)+56]],{c:live==='g'?hexA(C.green,.6):C.line,w:live==='g'?2.5:1,dash:live==='g'?null:[4,6],a:f2});}
    each(t,11.6,18.4,.18,1.2,(i,s)=>{const k=i%5,g_=s>=13.6&&s<16.6,x=g_?850:640,y=SY(i%3)+56,bad=g_&&s>15&&i%3===0;pk(t,s,.5,fromU(k),C.blue,{r:3.5,a:f2});pk(t,s+.5,.4,toS(x,y),C.blue,{r:3.5,a:f2});pk(t,s+.9,.4,[[LB[0]-60,LB[1]],[104,UY(k)]],bad?C.red:C.green,{r:3.5,a:f2});});
    if(t>13.6&&t<15)pill('switch: all traffic → green',LB[0],LB[1]+90,{c:C.green,z:12.5,a:V(t,13.6,14.8)});
    if(t>15&&t<16.6)pill('errors on green!',LB[0],LB[1]+90,{c:C.red,z:12.5,a:V(t,15,16.4)});
    if(t>16.6)pill('switched back: rollback in 1 second',LB[0],LB[1]+90,{c:C.green,z:12.5,a:f2*V(t,16.6)});}
  // ---- 19–27: canary
  const f3=V(t,19.2,26.8);
  if(f3>0){const sh=share(t),nNew=sh>=1?4:sh>=.5?2:sh>=.25?1:0;
    for(let k=0;k<4;k++){const isNew=k<nNew;server(680,SY(k),{label:isNew?'v2':'v1',sub:isNew?'new':'stable',w:104,h:50,col:isNew?C.amber:undefined,st:isNew?'hot':'ok',a:f3});ln(toS(680,SY(k)),{a:f3*.35});}
    server(860,300,{label:'v2 canary',sub:'',w:120,h:54,col:C.amber,st:'hot',a:f3*V(t,19.6)});ln([[LB[0]+60,LB[1]],[800,300]],{c:hexA(C.amber,.6),dash:[4,5],a:f3*V(t,19.6)});
    each(t,19.8,26.4,.15,1.2,(i,s)=>{const k=i%5,can=(i*7%20)/20<Math.max(share(s),.05);const y=SY(i%4),x=can?(share(s)>=.25&&i%2?680:860):680,yy=can&&x===860?300:y;
      pk(t,s,.5,fromU(k),C.blue,{r:3.5,a:f3});pk(t,s+.5,.4,toS(x,yy),can?C.amber:C.blue,{r:3.5,a:f3});});
    draw(860,440,{a:f3*V(t,20.2)},()=>{rr(-110,-44,220,88,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=1.5;g.stroke();});
    tx(`v2 traffic: ${Math.round(sh*100)}%`,860,422,{z:15,wt:800,f:MONO,c:C.amber,a:f3*V(t,20.2)});tx('v2 errors: 0.1% ✓ healthy',860,452,{z:12.5,c:C.green,a:f3*V(t,20.8)});
    if(t>22.4)pill('healthy → widen',LB[0],LB[1]+90,{c:C.green,z:12.5,a:f3*V(t,22.4)});}
  // ---- 27–33: feature flags
  const f4=V(t,27.2,32.8);
  if(f4>0){for(let k=0;k<4;k++){server(700,SY(k),{label:'v3',sub:'flag inside',w:104,h:50,a:f4});ln(toS(700,SY(k)),{a:f4*.35});}
    const r=flagRung(t);draw(890,300,{a:f4},()=>{rr(-86,-110,172,220,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=1.5;g.stroke();});
    tx('new checkout',890,214,{z:13,wt:750,a:f4});
    [['off',0],['staff',1],['1% of users',2],['everyone',3]].forEach(([s,k])=>{const on=r===k;pill(s,890,252+k*40,{c:on?C.accent:C.edge,z:12.5,a:f4*(on?1:.55)});});
    if(t>28.2)pill('no deploy needed to turn it on, or off',LB[0],LB[1]+90,{c:C.accent,z:12.5,a:f4*V(t,28.4)});}
  // ---- summary
  const f5=V(t,33.2);if(f5>0)['expose a little','measure','widen or roll back'].forEach((s,k)=>{const x=480+k*170,v=V(t,33.3+k*.5);plate(x,300,150,70,{c:[C.amber,C.blue,C.green][k],a:v});tx(s,x,301,{z:14,wt:750,a:v});if(k)tx('→',x-85,301,{z:18,c:C.dim,a:v});});
}});})();
