/* ---------------- 2. SCALING: build for launch day ---------------- */
// You build it on the board: users → (load balancer) → servers of any size.
// Traffic climbs to 1,200 requests/s; the busiest server crashes at 11 s and is back at 15 s.
// A load balancer sends traffic only to live servers, in proportion to their size;
// users wired straight to servers keep hitting the dead one.
(function(){
const CAP={small:200,medium:450,large:800,xl:1100},SERVERS=Object.keys(CAP);
const traffic=t=>100+1100*(x=>x*x*(3-2*x))(clamp(t/16));
chal('scaling',{title:'Survive launch day',goal:'Build it yourself: traffic climbs to 1,200 requests/s and the busiest machine crashes on the way up. Drop under 1% of requests and spend at most $13/h.',
  hint:'One huge machine is expensive and dies alone. Put a load balancer in front of several medium machines: they cost less and keep serving when one fails.',
  make:labGame({id:'scaling',
    hints:['Watch the moment a server crashes: where does the traffic it was carrying go?','Put a load balancer between Users and your servers, and keep enough capacity to lose your biggest server at peak.'],
    solution:{nodes:['lb','medium','medium','medium','medium'],edges:[[0,1],[1,2]]},lean:10,budget:13,dur:18,scale:60,runLabel:'Open the doors',
    intro:'Your users are on the left. Drag servers from the row below onto the board, then drag from the ● on Users to a server to wire them. Press Open the doors when you are ready.',
    fixedKinds:{users:{label:'Users',shape:'user',w:44,h:44}},
    fixed:[{kind:'users',x:70,y:250,label:'Your users'}],
    kinds:{
      lb:{label:'Load balancer',short:'LB',cost:1,max:1,shape:'box',c:C.accent,w:110,h:50,sub:'health checks'},
      small:{label:'Small server',short:'Small',cost:1,max:6,shape:'server',w:86,h:46,sub:'200/s',clone:true},
      medium:{label:'Medium server',short:'Medium',cost:3,max:6,shape:'server',w:100,h:50,sub:'450/s',clone:true},
      large:{label:'Large server',short:'Large',cost:8,max:3,shape:'server',w:116,h:54,sub:'800/s',clone:true},
      xl:{label:'Extra-large server',short:'XL',cost:20,max:2,shape:'server',w:132,h:58,sub:'1,100/s',clone:true}},
    columns:{lb:260,small:560,medium:560,large:560,xl:560},
    links:{users:['lb',...SERVERS],lb:SERVERS},
    check(G){const u=G.of('users')[0];if(!G.out(u).length)return['wire Users to a server or a load balancer.'];
      const lb=G.out(u,['lb'])[0];if(lb&&!G.out(lb).length)return['wire the load balancer to your servers.'];
      return[];},
    init(){return{rate:0,total:0,drop:0,dead:new Set(),killed:null,lastIn:{},why:{dead:0,full:0,nowhere:0}};},
    step(S,G,dt,t){const tc=labAt(S,'crash',11,7,13.5),rate=traffic(t),phase=t<6?'Doors open':t<tc?'Traffic climbing':t<tc+4?'A server dies':'Peak traffic';
      const servers=G.nodes.filter(n=>CAP[n.kind]);
      if(t>=tc&&!S.killed&&servers.length){const b=labPick(S,'victim',servers,servers.reduce((a,c)=>((S.lastIn[c.id]||0)>(S.lastIn[a.id]||0)?c:a)));S.killed=b.id;S.dead.add(b.id);FX.burst(b.x,b.y,C.red,30,220);labMark(b,'crashed',C.red,15);}
      if(t>=tc+4&&S.dead.size){const b=servers.find(n=>n.id===S.killed);S.dead.clear();if(b)labMark(b,'rebooted',C.green,14);}
      const flows=[],load={},inn={},F=(a,b,r,isBad)=>{if(r>0)flows.push({a:a.id,b:b.id,rate:r,bad:isBad});};
      // users split evenly over what they are wired to; a load balancer skips dead servers and weights by size
      const send=(n,r)=>{if(CAP[n.kind]){inn[n.id]=(inn[n.id]||0)+r;return;}
        const all=G.out(n,['lb',...SERVERS]),outs=n.kind==='lb'?all.filter(m=>!S.dead.has(m.id)):all;
        if(!outs.length){S.why[all.length?'dead':'nowhere']+=r*dt;S.drop+=r*dt;return;}
        const wt=m=>n.kind==='lb'?CAP[m.kind]:1,sum=outs.reduce((a,m)=>a+wt(m),0);
        outs.forEach(m=>{const share=r*wt(m)/sum;F(n,m,share,S.dead.has(m.id));send(m,share);});};
      send(G.of('users')[0],rate);
      servers.forEach(n=>{const r=inn[n.id]||0;if(S.dead.has(n.id)){S.why.dead+=r*dt;S.drop+=r*dt;return;}
        const over=Math.max(0,r-CAP[n.kind]);S.why.full+=over*dt;S.drop+=over*dt;load[n.id]=r/CAP[n.kind];});
      if(!S.killed)S.lastIn=inn;S.rate=rate;S.total+=rate*dt;
      return{flows,load,dead:S.dead,phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S,G){const cap=G.nodes.filter(n=>CAP[n.kind]&&!S.dead.has(n.id)).reduce((a,n)=>a+CAP[n.kind],0),d=S.total?S.drop/S.total:0;
      return[['traffic',`${Math.round(S.rate)}/s`],['capacity',`${cap}/s`,cap>=S.rate?C.green:C.red],['dropped',`${(d*100).toFixed(1)}%`,d<.01?C.green:C.red]];},
    score(S,G,cost){const d=S.total?S.drop/S.total:1,pct=(d*100).toFixed(1),top=Object.entries(S.why).sort((a,b)=>b[1]-a[1])[0][0];
      const one=G.nodes.filter(n=>CAP[n.kind]).length===1;
      const advice=one&&top!=='nowhere'?'One machine, however big, falls short at peak and takes the whole site down when it crashes. Put several smaller machines behind a load balancer.':{dead:G.of('lb').length?'When a server crashed, the others could not take its traffic. Add one more server than the peak needs.':'Users were wired straight to the server that crashed, so their requests kept going to a dead machine. Put a load balancer in front: it sends traffic only to live servers.',
        full:'Not enough capacity: keep total capacity above 1,200/s even with your biggest server gone.',
        nowhere:'Some traffic had nowhere to go: wire Users to a load balancer, and the load balancer to every server.'}[top];
      if(d<.01&&cost<=13)return{stars:3,title:'Launch day survived',msg:`Dropped ${pct}% for $${cost}/h. Several machines behind a load balancer cost less than one giant, and a crash is only a dent. That is scaling out.`};
      if(d<.01)return{stars:2,title:`Survived, at $${cost}/h`,msg:'It works, but it costs too much. Several medium machines give the same capacity for far less than large or extra-large ones.'};
      if(d<.03)return{stars:2,title:`Dropped ${pct}%`,msg:advice};
      if(d<.2)return{stars:1,title:'Rough launch',msg:`${pct}% of requests failed. ${advice}`};
      return{stars:0,title:'The site went down',msg:`${(d*100).toFixed(0)}% of requests were dropped. ${advice}`};}})});
})();
