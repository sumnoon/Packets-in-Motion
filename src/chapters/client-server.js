/* ---------------- 1. CLIENT–SERVER & TYPING A URL ---------------- */
ch({id:'client-server',group:'Foundations',title:'Client–Server & What Happens When You Type a URL',dur:31,
beats:[
[0,'Clients ask, servers answer','Every app is a conversation. Clients (phones, laptops, browsers) send requests; a server does the work and sends back responses.'],
[6.5,'You type example.com','Your browser only knows a name. Networks route by numeric IP address, so first it has to find out where example.com lives.'],
[10,'① DNS: name → IP address','The browser asks a DNS resolver "where is example.com?" and gets back an IP address, like looking up a name in a phone book.'],
[14.5,'② TCP handshake','Before talking, browser and server shake hands: SYN, SYN-ACK, ACK. Now there is a reliable connection. (HTTPS adds a TLS handshake right here too.)'],
[20,'③ HTTP request','The browser sends "GET /" over the open connection. The server finds or builds the page.'],
[23,'④ HTTP response','The server replies "200 OK" with HTML. The browser draws the page, then fetches images and scripts the same way.'],
[27.5,'Every step costs time','Each round trip adds milliseconds. That is why later chapters obsess over caching, CDNs and keeping connections open.']],
use:['Almost every web and mobile app: thin clients, logic and data on servers','When you need one central place to update code, secure data and take backups','Understanding this flow is the base for debugging any slow page'],
cons:['One server is a bottleneck and a single point of failure (see Reliability)','Every round trip costs latency, and distance to the server matters','Clients are useless when the network or server is down'],
draw(t){
  const S=[845,300],SE=[789,300];
  // server
  const sa=A(t,.5);const busy=t>21.8&&t<23;
  server(S[0],S[1],{label:'Server',sub:'93.184.216.34',...sa,st:busy?'hot':'ok',w:118});
  if(busy)spin(t,S[0],S[1]-52,{c:C.amber});
  if(busy)tx('building page…',S[0],S[1]-76,{z:12,c:C.amber});
  // --- beat 0: many clients
  if(t<7){const names=['Phone','Laptop','Tablet'];
    [[130,150],[130,300],[130,450]].forEach((u,i)=>{const a=A(t,.2+i*.15,5.6);user(u[0],u[1],{label:names[i],...a});
      const path=[[u[0]+18,u[1]],SE];ln(path,{a:a.a*.7});
      if(t<5.9){each(t,1+i*.45,4.4,1.5,1.1,(k,s)=>pk(t,s,1.1,path,C.blue));each(t,2.25+i*.45,5.6,1.5,1.1,(k,s)=>pk(t,s,1.1,rev(path),C.green));}
    });
    pill('→ request',470,120,{c:C.blue,a:V(t,1,5.6)});pill('← response',470,480,{c:C.green,a:V(t,2.2,5.6)});
  }
  // --- browser window
  const bw=A(t,6.3);
  draw(190,290,bw,()=>{rr(-130,-85,260,170,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=2;g.stroke();
    [C.red,C.amber,C.green].forEach((c,i)=>{g.beginPath();g.arc(-114+i*12,-70,3.5,0,7);g.fillStyle=hexA(c,.8);g.fill();});
    rr(-118,-58,236,26,7);g.fillStyle='#0c121e';g.fill();g.strokeStyle=t>7&&t<10?C.accent:C.line;g.stroke();
    const full='example.com',n=Math.floor(clamp((t-7)/2.2)*full.length),caret=(t>6.8&&t<10.2&&Math.floor(t*2.5)%2===0)?'|':'';
    tx(full.slice(0,n)+caret,-106,-45,{z:13.5,al:'left',f:MONO});
    if(t>13.7)tx('→ 93.184.216.34',-106,-15,{z:11.5,al:'left',f:MONO,c:C.green,a:V(t,13.7)});
    // page render
    const r=P(t,25,27.2);if(r>0){g.globalAlpha*=r;rr(-116,3,150,12,4);g.fillStyle=hexA(C.accent,.7);g.fill();
      for(let i=0;i<3;i++){rr(-116,24+i*14,200-i*40,7,3);g.fillStyle=hexA(C.dim,.45);g.fill();}
      rr(56,3,60,62,6);g.fillStyle=hexA(C.blue,.25);g.fill();}
    else if(t>20&&t<25){spin(t,0,32,{c:C.dim,r:10});}
  });
  if(bw.a>0)tx('Browser',190,395,{z:12,c:C.dim,a:bw.a});
  // --- DNS
  const da=A(t,10);box(560,125,{label:'DNS resolver',sub:'the phone book',w:150,...da});
  const toDNS=[[320,238],[485,138]];
  if(t>10)ln(toDNS,{a:da.a*.7,dash:[4,5]});
  pk(t,10.3,1.4,toDNS,C.blue,{label:'where is example.com?'});
  if(t>11.7&&t<12.3)spin(t,560,125-48,{c:C.accent});
  pk(t,12.3,1.4,rev(toDNS),C.green,{label:'93.184.216.34'});
  // --- connection line
  const conn=[[320,300],SE];
  if(t>6.5){const open=t>19.4;ln(conn,{a:V(t,6.8),c:open?hexA(C.green,.55):C.line,w:open?3:2,dash:open?null:[5,6]});
    if(open)pill('TCP connection open',555,332,{c:C.green,a:V(t,19.5)});}
  pk(t,14.8,1.4,conn,C.blue,{label:'SYN'});
  pk(t,16.4,1.4,rev(conn),C.green,{label:'SYN-ACK'});
  pk(t,18,1.4,conn,C.blue,{label:'ACK'});
  pk(t,20.3,1.5,conn,C.blue,{label:'GET /',r:7});
  pk(t,23,1.8,rev(conn),C.green,{label:'200 OK · HTML',r:8});
  // --- timeline
  const ta=V(t,10);if(ta>0){const x0=120,y=490,sc=760/150;
    tx('time →',x0-12,y,{z:12,c:C.dim,al:'right',a:ta});
    g.save();g.globalAlpha=ta;rr(x0,y-9,760,18,9);g.fillStyle='#101726';g.fill();g.restore();
    const segs=[['DNS',20,10.3,13.7,C.accent],['TCP',30,14.8,19.4,C.blue],['HTTP',70,20.3,24.8,C.green],['Render',30,25,27.2,C.amber]];
    let x=x0;segs.forEach(([nm,ms,a,b,c])=>{const w=ms*sc,p=clamp((t-a)/(b-a));if(p>0){g.save();rr(x+1,y-8,Math.max(4,(w-2)*p),16,8);g.fillStyle=hexA(c,.75);g.fill();g.restore();
      tx(`${nm} ${Math.round(ms*p)} ms`,x+w/2,y+25,{z:12.5,c,wt:600,a:clamp(p*3)});}x+=w;});
    pill('≈ 150 ms total',880,y-32,{c:C.text,a:V(t,27.5),al:'right',z:14});
  }
}});
