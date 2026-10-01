/* ---------------- 24. CAPSTONE: survive the big night ---------------- */
// Ordinary posting needs 220,000 feed writes/s; a worker does 100,000/s. A star with 30 M
// followers posts at 3 s, and feed loads jump 20× at 8 s.
function feedModel(p){const NEED=220000,cap=p.workers*1e5;let q=0,fresh=0;
  for(let t=0;t<14;t+=.1){if(p.mode!=='read'){q+=NEED*.1;if(p.mode==='write'&&t>=3&&t<3.1)q+=30e6;q=Math.max(0,q-cap*.1);fresh=Math.max(fresh,q/cap);}}
  if(p.mode!=='read'&&cap<=NEED)fresh=Math.max(fresh,60);
  const base=p.mode==='read'?820:p.mode==='write'?30:45,spike=p.mode==='read'?2400:p.cache?40:260;
  return{fresh,p99:Math.max(base,spike),base,spike,cost:p.workers*2+(p.cache?3:0)};}
chal('capstone-feed',{title:'Survive the big night',goal:'Ordinary posting needs 220,000 feed writes a second, a star with 30 million followers posts, then feed loads jump 20×. Keep p99 feed loads ≤ 200 ms, new posts visible within 10 s, and spend ≤ $12/h.',
  hint:'Fan-out on read is too slow to load. Pure fan-out on write drowns in the star\'s 30 M writes. Hybrid needs a little more worker capacity than ordinary posting uses, and the spike needs cached pages.',
  make:simGame({dur:14,defaults:{mode:'read',workers:1,cache:false},intro:'Pick a feed strategy and capacity, then press <b>Run it</b>.',
    controls(api,p,re){api.seg('Strategy',[['read','fan-out on read'],['write','fan-out on write'],['hybrid','hybrid']],p.mode,v=>{p.mode=v;re();});
      api.slider('Fan-out workers',1,6,1,p.workers,v=>`${v} × 100k/s`,v=>{p.workers=v;re();});api.toggle('Page cache',p.cache,v=>{p.cache=v;re();});},
    build(p,api){const M=feedModel(p);let T=0,acc=0,q=0;const fl=[];const FS=[300,380],QQ=[470,170],WK=[650,170],FC=[850,170],DB=[650,400];
      return{step(dt,t){T=t;const now=api.now();if(p.mode!=='read'){q+=220000*dt;if(p.mode==='write'&&t>=3&&t-dt<3){q+=30e6;FX.text(QQ[0],QQ[1]-50,'+30 M writes',C.red,15);}q=Math.max(0,q-p.workers*1e5*dt);}
          const spike=t>=8;acc+=dt*(spike?24:8);while(acc>=1){acc--;const slow=p.mode==='read'||(spike&&!p.cache);
            fl.push({t0:now,d:.5,pts:[[90,380],[FS[0]-60,FS[1]]],c:C.green,r:3});
            fl.push({t0:now+.5,d:slow?.9:.4,pts:p.mode==='read'?[[FS[0]+60,FS[1]],[DB[0]-46,DB[1]]]:[[FS[0]+60,FS[1]-10],[FC[0]-80,FC[1]+20]],c:slow?C.amber:C.green,r:3});}
          if(p.mode!=='read'&&Math.random()<dt*6)fl.push({t0:now,d:.5,pts:[[QQ[0]+64,QQ[1]],[WK[0]-55,WK[1]]],c:q>p.workers*1e5*10?C.red:C.amber,r:3.5});},
        draw(now,running){flyers(now,fl);for(let i=0;i<4;i++)user(90,320+i*40,{r:11,c:C.green});user(90,150,{label:'posters',r:13});user(90,240,{label:'Star · 30 M',c:C.amber,r:15});
          server(FS[0],FS[1],{label:'Feed service',w:120,h:54,st:running&&T>=8&&(p.mode==='read'||!p.cache)?'hot':'ok'});
          if(p.mode!=='read'){box(QQ[0],QQ[1],{label:'Fan-out queue',sub:q>1e5?`${(q/1e6).toFixed(1)} M waiting`:'',c:q>p.workers*1e5*10?C.red:C.amber,w:128,h:52});
            for(let k=0;k<p.workers;k++)server(WK[0]+(k%3)*14-14,WK[1]-16+Math.floor(k/3)*32+(k%3)*4,{label:k===p.workers-1?`${p.workers} workers`:'',w:100,h:40});
            box(FC[0],FC[1],{label:'Feed cache',sub:'list per user',c:C.green,w:150,h:52});}
          db(DB[0],DB[1],{label:'Posts',w:92,h:76,st:running&&p.mode==='read'?'hot':'ok'});if(p.cache)box(FS[0]+170,FS[1]+90,{label:'Page cache',c:C.accent,w:120,h:44});
          if(running)tx(T<3?'Normal posting':T<8?'The star posts':'Everyone opens the app',W/2,40,{z:17,wt:800,c:T>=3?C.red:C.accent});
          tx(`$${M.cost}/h`,90,520,{z:18,wt:800,c:M.cost<=12?C.green:C.red,f:MONO});},
        hud(){const lat=T<8?M.base:M.p99,fr=p.mode==='read'?0:Math.min(M.fresh,q/(p.workers*1e5)+0);return[['p99 feed load',`${lat} ms`,lat<=200?C.green:C.red],['post visible after',`${(p.mode==='read'?0:Math.max(fr,0)).toFixed(1)} s`,fr<=10?C.green:C.red],['cost',`$${M.cost}/h`,M.cost<=12?C.green:C.red]];},
        score(){const a=M.p99<=200,b=M.fresh<=10,c=M.cost<=12,n=[a,b,c].filter(Boolean).length;
          if(n===3)return{stars:3,title:'The feed held up',msg:`Hybrid fan-out with ${p.workers} workers kept new posts visible within ${M.fresh.toFixed(1)} s, the star's post skipped fan-out entirely, and cached pages carried the spike at ${M.p99} ms.`};
          const why=[!a&&(p.mode==='read'?'fan-out on read makes every feed load query hundreds of accounts':'the spike overwhelmed the feed service: cache the first page'),!b&&(p.mode==='write'?'the star\'s 30 M fan-out writes buried everyone else\'s posts':'workers could not keep up with ordinary posting: add a little headroom'),!c&&'over budget'].filter(Boolean).join('; ');
          return{stars:n===2?2:n===1?1:0,title:`${n} of 3 goals`,msg:why.charAt(0).toUpperCase()+why.slice(1)+'.'};}};}})});
