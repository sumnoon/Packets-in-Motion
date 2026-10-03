/* ---------------- 3. LOAD BALANCERS: be the load balancer ---------------- */
chal('load-balancers',{timed:true,title:'Be the load balancer',goal:'For 30 seconds, send each request to a server. Never let a server overflow. Server C is older and slower.',
  untimedGoal:'Route 30 requests one turn at a time. Each choice advances service by one second; requests do not time out. Avoid overflowing a server; C is older and slower.',
  hint:'Big requests (4) to the emptiest server. C drains slowly, so only give it small jobs. This is least connections, done by hand.',
  make:api=>{const S=[{n:'A',y:150,rate:2.3},{n:'B',y:280,rate:2.3},{n:'C',y:410,rate:1.2}].map(s=>({...s,load:0,flash:0}));const CAP=10,DUR=30,LB=[430,280];
    const timed=()=>!api.timed||api.timed();
    let t0=null,next=0,queue=[],strikes=0,fl=[],done=false,served=0,routed=0;const gen=()=>{const r=Math.random();return r<.4?1:r<.7?2:r<.9?3:4;};for(let i=0;i<4;i++)queue.push({sz:gen(),born:0});
    api.status('Click a server (or press <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd>) to send it the glowing request.');
    function readout(now,force=false){if(api.metrics)api.metrics([['Next request',`size ${queue[0].sz} load units`],...S.map(s=>[`Server ${s.n}`,`${s.load.toFixed(1)} of ${CAP}; drains ${s.rate}/s`]),['Requests served',served],['Strikes',`${strikes} of 6`],['Deadline',timed()?`${Math.max(0,3.2-(now-queue[0].born)).toFixed(1)} seconds for this request`:'No deadline; service advances on each choice'],['Progress',timed()?`${Math.max(0,Math.ceil(DUR-(now-(t0||0))))} seconds left`:`${routed} of 30 routed`]],force);}
    function received(s,q,now){if(s.load+q.sz>CAP){strikes++;s.flash=now;FX.burst(760,s.y,C.red,22);api.status(`Server ${s.n} overflowed. ${strikes} strikes. Next request: size ${queue[0].sz}.`);}else{s.load+=q.sz;served++;FX.burst(700,s.y,C.green,8,90);api.status(`Request size ${q.sz} sent to Server ${s.n}. Next request: size ${queue[0].sz}.`);}readout(now,true);}
    S.forEach((s,k)=>api.button('Send to Server '+s.n,()=>send(k,api.now())));
    function send(k,now){if(done||!queue.length||t0===null||!timed()&&routed>=30)return;routed++;const q=queue.shift();queue.push({sz:gen(),born:now});queue[0].born=now;const s=S[k];
      if(!timed()){S.forEach(s=>s.load=Math.max(0,s.load-s.rate));received(s,q,now);return;}
      readout(now,true);fl.push({t0:now,d:.5,pts:[LB,[760-60,s.y]],c:C.blue,r:4+q.sz*1.6,label:`${q.sz}`,onArrive:()=>received(s,q,now),arrive:now+.5});}
    return{draw(now,dt){if(t0===null){t0=now;queue[0].born=now;}const el=now-t0;
        if(!done){if(timed())S.forEach(s=>s.load=Math.max(0,s.load-s.rate*dt));
          fl.forEach(f=>{if(!f.hit&&now>=f.arrive){f.hit=true;f.onArrive();}});
          if(timed()&&now-queue[0].born>3.2){strikes++;FX.text(LB[0],LB[1]-70,'Too slow: timed out',C.red,15);queue.shift();queue.push({sz:gen(),born:now});queue[0].born=now;api.status(`Request timed out. ${strikes} strikes. Next request: size ${queue[0].sz}.`);}
          if((timed()?el>=DUR:routed>=30&&fl.every(f=>f.hit))||strikes>=6){done=true;const st=strikes>=6?0:strikes===0?3:strikes<=2?2:1;
            api.win(st,st===3?'Perfectly balanced':st?`${strikes} overflow${strikes>1?'s':''}`:'The servers melted',st===3?`${served} requests, zero overflows. You did least connections by eye: watch the load, feed the emptiest server.`:`Watch each server's fill level and send big requests to the emptiest one. C drains at half speed.`);}}
        readout(now);flyers(now,fl);fl=fl.filter(f=>!f.hit);
        for(let i=0;i<3;i++)user(90,170+i*110,{c:C.blue,r:13});box(LB[0],LB[1],{label:'You',sub:'the balancer',w:120,h:58,glow:true});
        S.forEach((s,k)=>{const f=s.load/CAP,hot=now-s.flash<.4;server(760,s.y,{label:`Server ${s.n}`,sub:s.rate<2?'slow · old':'fast',w:120,h:58,st:hot?'fail':f>.75?'hot':'ok',down:''});
          meter(830,s.y-6,120,12,f,f>.75?C.red:f>.5?C.amber:C.green);tx(`${s.load.toFixed(1)} / ${CAP}`,890,s.y+20,{z:11.5,c:C.dim,f:MONO});tx(`${k+1}`,690,s.y-40,{z:12,wt:800,c:C.dim,f:MONO});});
        // incoming queue: the glowing one is next
        queue.forEach((q,j)=>{const x=LB[0]-110-j*62,a=j?0.45:1;dot(x,LB[1],C.blue,5+q.sz*2,a);tx(`${q.sz}`,x,LB[1]+1,{z:12,wt:800,c:'#0b1019',a});});
        if(timed()){const wait=clamp((now-queue[0].born)/3.2);meter(LB[0]-150,LB[1]+34,80,5,1-wait,wait>.6?C.red:C.accent);}
        tx(timed()?`${Math.max(0,Math.ceil(DUR-el))}s`:`${routed} / 30`,70,40,{z:22,wt:800,c:C.text,f:MONO});tx(`strikes ${'●'.repeat(strikes)}${'○'.repeat(Math.max(0,6-strikes))}`,70,70,{z:12,c:strikes?C.red:C.dim,al:'left'});},
      click(x,y,now){const k=S.findIndex(s=>Math.abs(x-800)<150&&Math.abs(y-s.y)<50);if(k>=0)send(k,now);},
      key(k,now){if(k>='1'&&k<='3')send(+k-1,now);}};}});
