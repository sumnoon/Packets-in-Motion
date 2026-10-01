/* ---------------- 5. CDN: place two edges ---------------- */
chal('cdn',{title:'Place the edge caches',goal:'You can afford two edge caches. Place them so the average user waits 40 ms or less. The origin is in US-East.',
  hint:'Put copies where the most users are far from the origin. Count both how many people are there and how far away they are.',
  make:(()=>{const R=[{id:'naw',n:'US-West',x:150,y:205,pop:.10,o:70},{id:'nae',n:'US-East',x:300,y:190,pop:.20,o:15,origin:true},{id:'sa',n:'S. America',x:320,y:390,pop:.05,o:120},{id:'eu',n:'Europe',x:545,y:170,pop:.30,o:90},{id:'as',n:'Asia',x:800,y:235,pop:.35,o:180}];
    const lat=(r,E)=>r.origin?15:E.has(r.id)?15+.1*r.o:r.o,avg=E=>R.reduce((a,r)=>a+r.pop*lat(r,E),0);
    let E=new Set();const PICK=R.filter(r=>!r.origin);
    return simGame({dur:7,defaults:{},intro:'Click up to two regions (or press <kbd>1</kbd> US-West, <kbd>2</kbd> S. America, <kbd>3</kbd> Europe, <kbd>4</kbd> Asia) to put an edge cache there, then press <b>Run it</b>.',
      controls(){},
      build(p,api){let acc=0;const fl=[];let el=0;
        function toggle(r){if(!r)return;if(E.has(r.id))E.delete(r.id);else if(E.size<2){E.add(r.id);FX.burst(r.x,r.y,C.amber,14);}else FX.text(r.x,r.y-40,'Budget: 2 edges',C.red,14);
          api.status(`Edge caches: ${E.size?R.filter(q=>E.has(q.id)).map(q=>q.n).join(' and '):'none'} (${E.size} of 2). Average wait ${avg(E).toFixed(0)} ms.`);}
        return{step(dt,t){el=t;acc+=dt*40;const now=api.now();while(acc>=1){acc--;let x=Math.random(),r=R[R.length-1];for(const q of R){if(x<q.pop){r=q;break;}x-=q.pop;}
            const tgt=E.has(r.id)||r.origin?r:R[1],ms=lat(r,E);fl.push({t0:now,d:.25+ms/220,pts:[[r.x+(Math.random()-.5)*50,r.y+50],[tgt.x,tgt.y]],c:ms<40?C.green:ms<100?C.amber:C.red,r:3.5});}},
          draw(now){g.save();g.globalAlpha=.5;[[190,230,150,95],[340,400,70,80],[560,190,110,70],[790,250,190,100],[870,420,60,40]].forEach(([x,y,a,b])=>{g.beginPath();g.ellipse(x,y,a,b,0,0,7);g.fillStyle='#10182a';g.fill();});g.restore();
            flyers(now,fl);R.forEach(r=>{const on=E.has(r.id);for(let i=0;i<Math.round(r.pop*20);i++)dot(r.x-40+(i%7)*13,r.y+44+Math.floor(i/7)*12,C.blue,2.4,.7);
              if(r.origin)server(r.x,r.y,{label:'Origin',sub:'US-East',w:104,h:52,col:C.accent,st:'acc'});else box(r.x,r.y,{label:on?'Edge cache':r.n,sub:on?r.n:`${r.o} ms to origin`,c:on?C.amber:C.edge,w:118,h:50,glow:on});
              tx(`${Math.round(r.pop*100)}% of users`,r.x,r.y+92,{z:11,c:C.dim});if(!r.origin)keycap(String(PICK.indexOf(r)+1),r.x-72,r.y-25);});
            tx(`edges placed: ${E.size} / 2`,W/2,520,{z:13,wt:700,c:E.size===2?C.amber:C.dim});},
          hud(){const a=avg(E);return[['avg wait',`${a.toFixed(0)} ms`,a<=40?C.green:a<=60?C.amber:C.red],['no CDN',`${avg(new Set()).toFixed(0)} ms`,C.dim]];},
          down(x,y,now,running){if(running)return;toggle(R.find(q=>!q.origin&&Math.abs(x-q.x)<70&&Math.abs(y-q.y)<35));},
          key(k,now,running){if(running)return;toggle(PICK[+k-1]);},
          score(){const a=avg(E);return a<=40?{stars:3,title:`${a.toFixed(0)} ms average`,msg:'Edges where the most distant users live (Asia and Europe) cut the average wait by two thirds. That is exactly what a CDN is for.'}:
            a<=60?{stars:2,title:`${a.toFixed(0)} ms average`,msg:'Better than no CDN, but one of your edges serves too few people. Weigh distance and headcount together.'}:
            {stars:1,title:`${a.toFixed(0)} ms average`,msg:'The biggest groups of users are still crossing oceans. Move the edges closer to them.'};}};}});})()});
