/* ---------------- 2. LATENCY vs THROUGHPUT, SCALING ---------------- */
ch({id:'scaling',group:'Foundations',title:'Latency vs Throughput · Vertical vs Horizontal Scaling',dur:38,
beats:[
[0,'Latency = time for ONE trip','Latency is how long a single request takes, measured in milliseconds. Watch the stopwatch follow one request across.'],
[4,'Throughput = trips per second','Throughput is how many requests finish each second. It measures volume, not the speed of any single request.'],
[8.5,'Wider pipe: more throughput, same latency','Adding lanes (more servers, more connections) lets more requests through at once. But each one still takes exactly as long.'],
[15,'One server, rising traffic','As more users arrive, a single server climbs to 100% and starts dropping requests (red).'],
[20.5,'Vertical scaling: a bigger box','Scale UP by buying a bigger machine: more CPU, more RAM. Easy, with no code changes, but cost climbs steeply and there is a ceiling.'],
[27,'Horizontal scaling: more boxes','Scale OUT by adding ordinary machines and splitting the traffic. Each server is relaxed, and losing one is no longer fatal.'],
[33,'Need more? Add another','Horizontal scaling grows in small, cheap steps. The price: you need something to spread the traffic (next chapter), and servers must not keep local state.']],
use:['Vertical: early on, for databases that are hard to split, when you need a quick win','Horizontal: stateless web/app servers, anything that must grow without limit or survive failures','Watch latency (user experience) AND throughput (capacity), since they are different goals'],
cons:['Vertical: price grows faster than power, a hard ceiling, still one point of failure, downtime to upgrade','Horizontal: needs load balancing, shared state lives elsewhere (DB/cache), more moving parts','Raising throughput does not lower latency; that needs caching, closer servers or faster code'],
draw(t){
  // ===== Part A: latency vs throughput =====
  if(t<15.2){const fa=A(t,.2,14.4).a;
    user(120,290,{label:'Client',a:fa});
    server(875,290,{label:'Server',a:fa});
    const lanesP=P(t,8.5,10),hh=lerp(17,52,lanesP);
    g.save();g.globalAlpha=fa;rr(150,290-hh,670,hh*2,hh);g.fillStyle='rgba(39,51,77,.35)';g.fill();g.strokeStyle=C.line;g.lineWidth=1.5;g.stroke();g.restore();
    const laneY=k=>290+(k-1)*32*lanesP;
    const pth=k=>[[150,laneY(k)],[816,laneY(k)]];
    // tracked single request
    const p0=pk(t,.6,3,pth(1),C.blue,{label:'one request',linear:true,r:7});
    const ms=Math.round(clamp((t-.6)/3)*80);
    if(t<9.5)pill(`LATENCY  ${ms} ms`,485,150,{c:C.blue,z:15,a:V(t,.4,14.4)});
    else pill('LATENCY  still 80 ms',485,150,{c:C.blue,z:15,a:fa});
    // throughput streams
    let done=0;[1,0,2].forEach((k,j)=>{const t0=j===0?4.1:9.6+j*.15;
      each(t,t0,14.4,.5,3,(i,s)=>{pk(t,s,3,pth(k),C.blue,{linear:true,r:5.5});});
      if(t>t0+3)done+=Math.floor((Math.min(t,14.4+3)-t0-3)/.5)+1;});
    if(t>4){const lanes=t>9.6?3:1;pill(`THROUGHPUT  ${lanes*2} req/s`,485,430,{c:C.green,z:15,a:V(t,4,14.4)});
      tx(`completed: ${done}`,485,462,{z:12.5,c:C.dim,a:V(t,4,14.4),f:MONO});}
    if(t>8.5)tx(lanesP<1?'':'3 lanes',120,370,{z:12,c:C.dim,a:V(t,10,14.4)});
  }
  // ===== Part B: scaling =====
  if(t>14.8){const ba=A(t,15).a;
    const us=[130,200,270,340,410].map(y=>[110,y+10]);
    us.forEach((u,i)=>user(u[0],u[1],{...A(t,15+i*.1),r:13}));
    // server layout over time
    const split=P(t,27,28.8),four=P(t,33,34.5);
    const ys3=[170,300,430],ys4=[125,235,345,455];
    const big=P(t,20.5,22)*(1-split);
    const n=t<27?1:t<33?3:4;
    const load1=t<20.5?lerp(.35,1,P(t,15,19.5)):lerp(1,.55,P(t,20.8,22.2));
    const srv=[];
    for(let k=0;k<4;k++){if(k===3&&t<33)continue;
      let y=k===3?ys4[3]:lerp(lerp(300,ys3[k],split),ys4[k],four);
      srv.push([650,y]);}
    srv.forEach(([x,y],k)=>{
      let a=ba,load,label='Server',sub='4 CPU · 16 GB',s=1+.55*big;
      if(k>0&&k<3)a=Math.min(a,V(t,27.3+k*.2));if(k===3)a=V(t,33.2);
      if(t<27){load=load1;if(t>21.2)sub='64 CPU · 512 GB';}else{load=t<33?.36:.27;label='Server '+(k+1);}
      const hot=t<27&&load>.86;
      server(x,y,{label,sub,a,s:A(t,k===3?33.2:k>0?27.3+k*.2:15).s*s,load,st:hot?'hot':'ok',w:k===0&&t<27?130:112});
    });
    // traffic
    each(t,15.5,37.5,.2,2.4,(i,s)=>{if(s<17.5&&i%3)return;
      const u=us[i%5];const tg=s<27.6?0:s<33.4?i%3:i%4;const dst=srv[Math.min(tg,srv.length-1)];if(!dst)return;
      const edge=[dst[0]-(t<27?56+40*big:58),dst[1]];const path=[[u[0]+16,u[1]],edge];
      const fail=s>17.8&&s<21&&i%2===0;
      pk(t,s,1.5,path,C.blue,{r:5});
      if(fail)drop(t,s+1.5,edge[0],edge[1],{dx:-30});
    });
    if(t>18.3&&t<21.3)pill('requests dropped',650,190,{c:C.red,a:V(t,18.3,20.8)});
    // vertical pros/cons
    const pr=[['✓ No code changes',C.green,22.3],['$  Cost climbs fast',C.amber,23.5],['✕ Hard size ceiling',C.red,24.7],['✕ Still one point of failure',C.red,25.9]];
    if(t<27.5)pr.forEach(([s,c,t0],i)=>pill(s,775,190+i*42,{c,al:'left',a:V(t,t0,26.8)}));
    if(t>28.5)pill(t<33?'3 servers · each ~36%':'4 servers · each ~27%',855,60,{c:C.green,a:V(t,28.8)});
    if(t>29)tx('(who decides which server gets each request? → next chapter)',650,535,{z:12.5,c:C.dim,a:V(t,30,37)});
  }
}});
