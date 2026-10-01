/* ---------------- 6. RATE LIMITING: tune the bucket ---------------- */
chal('rate-limiting',{title:'Tune the token bucket',goal:'Let a real user through (≥95% of their requests) while blocking at least 80% of a bot flooding 25 requests/s.',
  hint:'Capacity decides how big a burst fits. The refill rate decides the long-run speed: the bot can never beat it. The user bursts 6 at a time, every 2 s.',
  make:simGame({dur:13,defaults:{cap:3,rate:12},intro:'Set the bucket size and refill rate for each client, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Bucket size',1,20,1,p.cap,v=>`${v} tokens`,v=>{p.cap=v;re();});api.slider('Refill rate',1,20,1,p.rate,v=>`${v} / s`,v=>{p.rate=v;re();});},
    build(p,api){const cl=[{n:'A real user',y:170,c:C.blue,tok:p.cap,ok:0,no:0,ev:[]},{n:'A bot',y:390,c:C.red,tok:p.cap,ok:0,no:0,ev:[]}];
      for(let b=1;b<12;b+=2)for(let i=0;i<6;i++)cl[0].ev.push(b+i*.09);for(let x=2;x<12.6;x+=.04)cl[1].ev.push(x);
      const fl=[];let last=0;
      return{step(dt,t){cl.forEach((c,ci)=>{c.tok=Math.min(p.cap,c.tok+p.rate*dt);while(c.ev.length&&c.ev[0]<=t){c.ev.shift();const now=api.now();
          if(c.tok>=1){c.tok--;c.ok++;fl.push({t0:now,d:.7,pts:[[150,c.y],[430,c.y],[820,280]],c:ci?C.amber:C.green,r:ci?3.2:4.5});}
          else{c.no++;fl.push({t0:now,d:.5,pts:[[150,c.y],[430,c.y]],c:C.red,r:3.2,drop:.95});}}});last=t;},
        draw(now){flyers(now,fl);cl.forEach((c,ci)=>{user(110,c.y,{c:ci?C.red:C.blue,label:c.n,r:16});
            draw(430,c.y,{},()=>{rr(-34,-46,68,92,10);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=2;g.stroke();const f=c.tok/p.cap;rr(-28,40-80*f,56,80*f,6);g.fillStyle=hexA(C.accent,.5);g.fill();});
            tx(`${Math.floor(c.tok)} / ${p.cap}`,430,c.y+62,{z:11.5,c:C.dim,f:MONO});tx('bucket',430,c.y-58,{z:11.5,c:C.dim});});
          server(820,280,{label:'API',sub:'protected',w:110});tx(`+${p.rate} tokens / s`,430,280,{z:13,wt:700,c:C.accent});},
        hud(){const[u,b]=cl,uo=u.ok+u.no?u.ok/(u.ok+u.no):1,bb=b.ok+b.no?b.no/(b.ok+b.no):0;return[['user allowed',`${(uo*100).toFixed(0)}%`,uo>=.95?C.green:C.red],['bot blocked',`${(bb*100).toFixed(0)}%`,bb>=.8?C.green:C.red]];},
        score(){const[u,b]=cl,uo=u.ok/(u.ok+u.no),bb=b.no/(b.ok+b.no);
          if(uo>=.95&&bb>=.8)return{stars:3,title:'Fair and firm',msg:`User ${(uo*100).toFixed(0)}% through, bot ${(bb*100).toFixed(0)}% blocked. A bucket big enough for one burst and a refill just above the user's average: the bot can only ever get the refill rate.`};
          if(uo>=.85&&bb>=.6)return{stars:2,title:'Nearly there',msg:uo<.95?'The real user hit the limit during bursts. Give the bucket room for a burst of 6.':'The bot still gets through too often. Lower the refill rate: in the long run it is all the bot can get.'};
          return{stars:1,title:uo<.85?'Real users are being blocked':'The bot walked right in',msg:'Capacity sets the burst size. Refill sets the long-run rate. Tune one at a time.'};}};}})});
