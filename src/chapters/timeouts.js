/* ---------------- 16b. TIMEOUTS & DEADLINES ---------------- */
(function(){
const U=[90,210],WB=[330,210],PY=[650,210],TP=[330,380];
const CH=[['Web',150],['Orders',370],['Payments',590],['Bank',810]].map(([n,x])=>({n,x,y:420}));
ch({id:'timeouts',group:'Reliability',title:'Timeouts & Deadlines',dur:34,
beats:[
[0,'A call that never answers','The web server calls the payment service, which has hung. Without a timeout, the web server just waits… and waits.'],
[5,'Waiting requests pile up','Each new request also gets stuck waiting on payments. The server runs out of workers and stops answering even simple pages.'],
[11,'Set a timeout','Give up after 800 ms and return an error or a fallback. The worker is freed at once, and the server stays healthy.'],
[17,'Timeouts add up across hops','Web → Orders → Payments → Bank. If every hop waits 2 s, one user can wait 8 s. Inner calls need shorter timeouts than outer ones.'],
[24,'Pass a deadline along','Even better: the first service sets a deadline and passes it down with the request. Each hop only spends the time that is left.'],
[30,'Fail fast, stay up','Timeouts turn a slow failure into a fast one, so one broken service cannot freeze everything that depends on it.']],
use:['Every network call: HTTP, database, cache, queue','Chains of services, where waits add up','Anywhere a fallback beats an endless spinner'],
cons:['Too short: healthy but slow calls fail','Too long: stuck calls hold resources','A timeout does not cancel the work on the other side unless the deadline is passed along'],
draw(t){
  const top=V(t,.2,17),bot=V(t,17.2);
  if(top>0){user(U[0],U[1],{label:'users',a:top});server(WB[0],WB[1],{label:'Web',w:112,a:top});server(PY[0],PY[1],{label:'Payments',sub:'hung',w:124,st:'hot',a:top});
    if(t<17)spin(t,PY[0],PY[1]-46,{c:C.amber,a:top});ln([[WB[0]+56,WB[1]],[PY[0]-62,PY[1]]],{a:top*.4});ln([[U[0]+20,U[1]],[WB[0]-56,WB[1]]],{a:top*.4});
    // worker pool
    const busy=t<5?Math.min(2,Math.floor(t/2)):t<11?Math.min(8,2+Math.floor((t-5)*1.1)):Math.max(0,1-Math.floor((t-11)*2));
    draw(TP[0],TP[1],{a:top},()=>{rr(-150,-36,300,72,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=busy>=8?C.red:C.line;g.lineWidth=2;g.stroke();});
    tx('web server workers',TP[0],TP[1]-52,{z:12,c:C.dim,a:top});for(let i=0;i<8;i++){const b=i<busy;rr(TP[0]-138+i*35,TP[1]-16,28,32,6);g.save();g.globalAlpha=top;g.fillStyle=b?hexA(C.amber,.35):C.panel2;g.fill();g.strokeStyle=b?C.amber:C.line;g.stroke();g.restore();}
    if(busy>=8)pill('all workers stuck → site down',TP[0],TP[1]+56,{c:C.red,z:12.5,a:top});
    each(t,1,10.6,1.2,6,(i,s)=>{pk(t,s,.7,[[U[0]+20,U[1]],[WB[0]-56,WB[1]]],C.blue,{r:4.5,a:top});pk(t,s+.7,.8,[[WB[0]+56,WB[1]],[PY[0]-62,PY[1]]],C.blue,{r:4.5,a:top});});
    each(t,11.2,16.4,1.3,2,(i,s)=>{pk(t,s,.6,[[U[0]+20,U[1]],[WB[0]-56,WB[1]]],C.blue,{r:4.5,a:top});pk(t,s+.6,.5,[[WB[0]+56,WB[1]],[PY[0]-62,PY[1]]],C.blue,{r:4.5,a:top});
      pk(t,s+1.3,.6,[[WB[0]-56,WB[1]],[U[0]+20,U[1]]],C.amber,{r:4.5,a:top,label:'timeout → try later'});});
    if(t>11)pill('timeout: 800 ms',(WB[0]+PY[0])/2,WB[1]-40,{c:C.accent,z:12.5,a:top*V(t,11)});}
  if(bot>0){CH.forEach((c,k)=>{server(c.x,c.y,{label:c.n,w:112,h:52,a:bot,st:k===3&&t>18?'hot':'ok'});if(k)ln([[CH[k-1].x+56,c.y],[c.x-56,c.y]],{a:bot*.4});});
    const bad=t<21;const tos=bad?['2 s','2 s','2 s']:['1.5 s','1.0 s','0.5 s'];
    if(t<24)tos.forEach((s,k)=>pill(`waits ${s}`,(CH[k].x+CH[k+1].x)/2,CH[0].y-40,{c:bad?C.red:C.green,z:12,a:bot*V(t,17.5+k*.3)}));
    if(t>18.5&&t<21)pill('worst case for the user: 2 + 2 + 2 + 2 = 8 s',W/2,CH[0].y+74,{c:C.red,z:13,a:V(t,18.5,20.8)});
    if(t>21.3&&t<24)pill('outer > inner: 1.5 s ⊃ 1.0 s ⊃ 0.5 s',W/2,CH[0].y+74,{c:C.green,z:13,a:V(t,21.3,23.8)});
    // deadline travelling down the chain
    [[24.4,'deadline: 1.2 s left'],[25.6,'0.9 s left'],[26.8,'0.6 s left']].forEach(([s,l],k)=>pk(t,s,1,[[CH[k].x+56,CH[k].y],[CH[k+1].x-56,CH[k+1].y]],C.blue,{label:l}));
    if(t>28&&t<30.5)pill('Bank would need 3 s: no time left → stop now',CH[3].x-60,CH[0].y+74,{c:C.amber,z:12,a:V(t,28,30.3)});
    pk(t,28.4,2.4,[[CH[3].x-56,CH[3].y+14],[CH[0].x+56,CH[0].y+14]],C.amber,{r:5,label:'fast error, 1.2 s total'});
    if(t>31)pill('fail fast, stay up ✓',W/2,CH[0].y+74,{c:C.green,z:13,a:V(t,31)});}
}});})();
