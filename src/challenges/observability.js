/* ---------------- 21. OBSERVABILITY: find the culprit ---------------- */
chal('observability',{title:'Find the culprit',goal:'Checkout is slow for some users. Open as few clues as you need, then click the component causing it.',
  hint:'Metrics tell you when and where it hurts. Logs tell you what happened. A trace shows one request\'s whole path. Two clues are usually enough.',
  make:api=>{const N=[{id:'gw',n:'Gateway',x:150,y:120},{id:'cart',n:'Cart',x:380,y:120},{id:'pay',n:'Payments',x:380,y:250},{id:'price',n:'Pricing',x:610,y:120},{id:'inv',n:'Inventory',x:610,y:250},{id:'pdb',n:'Pricing DB',x:840,y:120,isDb:true}];
    const L=[['gw','cart'],['gw','pay'],['cart','price'],['cart','inv'],['price','pdb']];let view=null,used=new Set(),wrong=0,done=false;
    const open=v=>()=>{view=v;used.add(v);api.status(`Clues opened: <b>${used.size}</b>. When you know, click the culprit on the diagram.`);};
    api.button('Metrics',open('m'));api.button('Logs',open('l'));api.button('Trace',open('t'));
    api.status('Open a clue, or click a component if you already know.');
    const series=(id,k)=>{const base=id==='gw'||id==='cart'||id==='price'?1:0,s=[];for(let i=0;i<40;i++){const spike=base&&i>18&&i<34?.55+.3*rnd(i+k):0;s.push(.12+.08*rnd(i*3+k)+spike);}return s;};
    return{draw(now){L.forEach(([a,b])=>{const A=N.find(n=>n.id===a),B=N.find(n=>n.id===b);ln([[A.x,A.y],[B.x,B.y]],{c:C.line});});
        N.forEach(n=>{if(n.isDb)db(n.x,n.y,{label:n.n,w:92,h:70});else server(n.x,n.y,{label:n.n,w:112,h:50});});
        const y0=320;if(!view){tx('Pick a clue: Metrics, Logs or Trace',W/2,y0+90,{z:15,c:C.dim});return;}
        panel(40,y0,920,200,{});
        if(view==='m'){[['gw','Gateway'],['cart','Cart'],['pay','Payments'],['price','Pricing']].forEach(([id,n],k)=>{const x=60+k*228,s=series(id,k);tx(`${n} · p99 latency`,x,y0+22,{z:12,c:C.dim,al:'left'});
            g.beginPath();s.forEach((v,i)=>{const px=x+i*5,py=y0+180-v*130;i?g.lineTo(px,py):g.moveTo(px,py);});g.strokeStyle=Math.max(...s)>.5?C.red:C.green;g.lineWidth=2;g.stroke();});}
        if(view==='l'){[['WARN','payments','card network slow, retry 1 of 3 (succeeded)'],['INFO','cart','checkout ok in 1.9 s'],['WARN','pricing','slow query 1.8 s: SELECT * FROM prices WHERE sku IN (…)'],['INFO','inventory','reserve ok in 38 ms'],['INFO','gateway','POST /checkout 200 in 2.1 s']]
            .forEach(([lv,svc,m],k)=>{tx(lv,60,y0+30+k*34,{z:12.5,wt:800,c:lv==='WARN'?C.amber:C.dim,al:'left',f:MONO});tx(svc,120,y0+30+k*34,{z:12.5,c:C.accent,al:'left',f:MONO});tx(m,220,y0+30+k*34,{z:12.5,c:C.text,al:'left',f:MONO});});}
        if(view==='t'){[['gateway',0,2.1],['cart',.05,2.0],['inventory',.1,.04],['pricing',.15,1.9],['pricing-db query',.2,1.8]].forEach(([n,s,d],k)=>{const x=220+s*300,w=d*300;tx(n,60,y0+34+k*32,{z:12.5,c:C.dim,al:'left',f:MONO});
            rr(x,y0+24+k*32,Math.max(4,w),18,5);g.fillStyle=hexA(n==='pricing-db query'?C.red:C.blue,.75);g.fill();tx(`${d>=1?d.toFixed(1)+' s':Math.round(d*1000)+' ms'}`,x+w+8,y0+34+k*32,{z:11.5,c:C.dim,al:'left',f:MONO});});}},
      click(x,y,now){if(done)return;const n=N.find(q=>Math.abs(x-q.x)<60&&Math.abs(y-q.y)<40);if(!n)return;
        if(n.id==='pdb'||n.id==='price'){done=true;FX.burst(n.x,n.y,C.green,40,240);const st=Math.max(1,(used.size<=2?3:2)-wrong);
          api.win(st,'Found it: a slow pricing query',`Metrics showed where it hurt (Gateway, Cart, Pricing). The trace showed the time sinking into one database query. The Payments warning was a red herring: it retried and succeeded.${wrong?' Wrong guesses cost a star.':''}`);}
        else{wrong++;FX.burst(n.x,n.y,C.red,16);FX.text(n.x,n.y-45,'not the cause',C.red,14);}}};}});
