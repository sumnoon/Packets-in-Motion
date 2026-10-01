/* ---------------- 2b. AUTOSCALING ---------------- */
(function(){
const GX=90,GY=70,GW=820,GH=110,DUR=36;
const demand=t=>100+380*Math.exp(-Math.pow((t-19)/6.5,2));           // requests/s
// launch / remove schedule the autoscaler produces for this traffic curve
const SV=[{on:0},{on:0},{on:10.4},{on:13},{on:15.5},{on:17.6}];SV[5].off=26;SV[4].off=29.2;SV[3].off=32.4;
const BOOT=2,SX=k=>560+(k%3)*150,SY=k=>k<3?300:420;
const ready=(s,t)=>t>=s.on+(s.on?BOOT:0)&&!(s.off&&t>=s.off);
const nReady=t=>SV.filter(s=>ready(s,t)).length;
ch({id:'autoscaling',group:'Foundations',title:'Autoscaling: Add Servers When You Need Them',dur:DUR,needs:['scaling'],related:['load-balancers','backpressure','observability'],
beats:[
[0,'Traffic has a daily rhythm','A few users at night, a crowd at lunch, a peak in the evening. Paying for enough servers to handle the peak all day wastes money.'],
[5,'Watch one number','An autoscaler keeps an eye on the group\'s average CPU and checks it every few seconds against a target: here, 70%.'],
[10,'Above target → add servers','When average CPU stays above 70%, it launches another server. The load spreads out and CPU falls back.'],
[17,'New servers need time to warm up','A fresh server takes a while to boot and warm up. Until it is ready, the others stay overloaded, so scale out early.'],
[23,'Below target → remove servers','As traffic falls and CPU drops under 40%, servers are drained and removed. You pay for what you actually use.'],
[29,'Cooldown stops flapping','After every change, the autoscaler waits a while before deciding again. Without that pause it could add and remove servers in a frantic loop.']],
use:['Traffic that rises and falls: daily cycles, launches, sales','Stateless servers that can start and stop at any time','Cloud platforms where you pay per server-minute'],
cons:['New servers take time to boot, so sudden spikes still hurt','Bad thresholds cause flapping or slow reactions','Needs stateless servers and health checks to work well'],
draw(t){
  // traffic vs capacity chart
  const ca=A(t,.2);draw(0,0,ca,()=>{rr(GX-10,GY-30,GW+20,GH+50,12);g.fillStyle=hexA(C.panel,.8);g.fill();g.strokeStyle=C.line;g.lineWidth=1.2;g.stroke();});
  if(ca.a>0){tx('requests/s',GX,GY-14,{z:11.5,c:C.dim,al:'left',a:ca.a});tx('— capacity (ready servers × 100)',GX+110,GY-14,{z:11.5,c:C.green,al:'left',a:ca.a});
    const X=s=>GX+s/DUR*GW,Y=v=>GY+GH-v/600*GH;g.save();g.globalAlpha=ca.a;
    g.beginPath();for(let s=0;s<=DUR;s+=.25){const x=X(s),y=Y(nReady(s)*100);s?g.lineTo(x,y):g.moveTo(x,y);}g.strokeStyle=hexA(C.green,.8);g.lineWidth=2;g.stroke();
    g.beginPath();for(let s=0;s<=DUR;s+=.25){const x=X(s),y=Y(demand(s));s?g.lineTo(x,y):g.moveTo(x,y);}g.strokeStyle=C.blue;g.lineWidth=2.5;g.stroke();
    g.fillStyle=hexA(C.bg,.55);g.fillRect(X(t),GY-4,GX+GW-X(t),GH+8);g.strokeStyle=C.accent;g.lineWidth=1.5;g.beginPath();g.moveTo(X(t),GY-6);g.lineTo(X(t),GY+GH+6);g.stroke();g.restore();}
  // autoscaler, balancer, servers
  const n=nReady(t),cpu=demand(t)/(Math.max(n,1)*100),cool=[10.4,13,15.5,17.6,26,29.2,32.4].some(c=>t>c&&t<c+(t>25?2.8:.8));
  box(170,340,{label:'Autoscaler',sub:`target 70% CPU`,w:150,h:58,c:C.accent,glow:cool,...A(t,4.6)});
  if(t>5)pill(`avg CPU ${Math.round(cpu*100)}%`,170,410,{c:cpu>.7?C.red:cpu<.4?C.amber:C.green,z:13,a:V(t,5.2)});
  if(t>29&&cool)pill('cooldown…',170,275,{c:C.dim,z:12,a:V(t,29.2)});
  box(380,360,{label:'Load balancer',w:130,h:50,...A(t,.4)});
  SV.forEach((s,k)=>{const shown=t>=s.on-.01&&!(s.off&&t>s.off+.8);if(!shown)return;const boot=s.on&&t<s.on+BOOT,gone=s.off&&t>=s.off;
    const a=gone?1-clamp((t-s.off)/.8):V(t,s.on||.5);
    server(SX(k),SY(k),{label:`Server ${k+1}`,sub:boot?'booting…':gone?'draining':'',w:112,h:54,a,s:A(t,s.on||.5).s,st:boot?'off':gone?'off':cpu>1?'fail':cpu>.7?'hot':'ok',down:'OVERLOADED',load:boot||gone?null:Math.min(cpu,1)});
    if(boot)spin(t,SX(k)+40,SY(k)-40,{c:C.amber});
    if(ready(s,t)&&t>1)ln([[445,360],[SX(k)-56,SY(k)]],{a:a*.35});});
  each(t,.8,DUR,.9-.5*clamp(demand(t)/480),.9,(i,s0)=>{const on=SV.map((s,k)=>k).filter(k=>ready(SV[k],s0));if(!on.length)return;const k=on[i%on.length];
    pk(t,s0,.8,[[30,360],[315,360],[445,360],[SX(k)-56,SY(k)]],cpu>1?C.amber:C.blue,{r:4});});
  const ev=[[10.4,'CPU 82% > 70% → launch server 3'],[13,'still hot → launch server 4'],[15.5,'overloaded while booting → launch 5'],[17.6,'launch 6'],[26,'CPU 36% < 40% → remove one'],[29.2,'after cooldown → remove another'],[32.4,'and another']];
  ev.forEach(([at,s])=>{if(t>at&&t<at+2.6)pill(s,W/2+60,212,{c:at>25?C.amber:C.accent,z:12.5,a:V(t,at,at+2.4)});});
}});})();
