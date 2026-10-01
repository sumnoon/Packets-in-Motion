/* ---------------- 2. SCALING: survive launch day ---------------- */
chal('scaling',{title:'Survive launch day',goal:'Traffic climbs to 1,200 requests/s and one machine will crash. Drop under 1% of requests and spend no more than $12/hour.',
  hint:'One huge box is expensive and dies alone. Several medium boxes cost less and keep serving when one fails.',
  make:(()=>{const SZ={S:{cap:200,cost:1,w:84},M:{cap:450,cost:3,w:100},L:{cap:800,cost:8,w:116},XL:{cap:1100,cost:20,w:132}};
    const traffic=t=>100+1100*(x=>x*x*(3-2*x))(clamp(t/16));
    return simGame({dur:18,defaults:{size:'M',n:1},
      intro:'Pick a machine size and how many. Press <b>Run it</b> to open the doors.',
      controls(api,p,re){api.seg('Machine size',[['S','S · 200/s · $1'],['M','M · 450/s · $3'],['L','L · 800/s · $8'],['XL','XL · 1100/s · $20']],p.size,v=>{p.size=v;re();});
        api.slider('Machines',1,6,1,p.n,v=>`${v}`,v=>{p.n=v;re();});},
      build(p,api){const S=SZ[p.size],ms=Array.from({length:p.n},(_,k)=>({alive:true,load:0,y:p.n===1?280:130+k*(300/(p.n-1))}));
        let total=0,dropped=0,acc=0,rr=0,rate=100,crashed=false;const fl=[];const LB=[380,280];
        return{step(dt,t){rate=traffic(t);if(!crashed&&t>=11){crashed=true;ms[0].alive=false;FX.burst(740,ms[0].y,C.red,26);}if(crashed&&t>=15&&!ms[0].alive){ms[0].alive=true;}
            const alive=ms.filter(m=>m.alive),cap=alive.length*S.cap,drop=Math.max(0,rate-cap);total+=rate*dt;dropped+=drop*dt;ms.forEach(m=>m.load=m.alive?Math.min(1,rate/Math.max(cap,1)):0);
            acc+=rate*dt/45;const now=api.now();while(acc>=1){acc--;const u=[90,170+Math.random()*220];const m=alive.length?alive[rr++%alive.length]:null;
              const isDrop=!m||Math.random()<drop/rate;const to=m?[740-S.w/2,m.y]:[740,280];fl.push({t0:now,d:.9,pts:[u,LB,to],c:isDrop?C.red:C.blue,r:4,drop:isDrop?.62:0});}},
          draw(now,running){flyers(now,fl);for(let i=0;i<3;i++)user(90,170+i*110,{c:C.blue,r:13});tx('your users',90,470,{z:12,c:C.dim});
            box(LB[0],LB[1],{label:'Load balancer',w:140,h:54});ms.forEach((m,k)=>server(740,m.y,{label:`${p.size}-${k+1}`,sub:`${S.cap}/s`,w:S.w,h:p.n>4?48:58,st:m.alive?(m.load>.95?'hot':'ok'):'fail',load:m.alive?m.load:null}));
            if(!running&&!total){tx(`Capacity ${p.n*S.cap}/s  ·  peak 1,200/s`,W/2,520,{z:14,wt:700,c:p.n*S.cap>=1200?C.green:C.amber});}},
          hud(){const cap=ms.filter(m=>m.alive).length*S.cap;return[['traffic',`${Math.round(rate)}/s`],['capacity',`${cap}/s`,cap>=rate?C.green:C.red],['dropped',`${total?(dropped/total*100).toFixed(1):'0.0'}%`,dropped/Math.max(total,1)<.01?C.green:C.red],['cost',`$${p.n*S.cost}/h`,p.n*S.cost<=12?C.green:C.amber]];},
          score(){const d=dropped/total,cost=p.n*S.cost;
            if(d<.01&&cost<=12)return{stars:3,title:'Launch day survived',msg:`${p.n} × ${p.size} for $${cost}/h dropped ${(d*100).toFixed(1)}%. Scaling out beats scaling up: cheaper, and one crash is only a dent.`};
            if(d<.03)return{stars:2,title:'Mostly survived',msg:`Dropped ${(d*100).toFixed(1)}% at $${cost}/h. ${cost>12?'It works, but costs too much. Several smaller machines give the same capacity for less.':'Close. Leave room for one machine to fail at peak.'}`};
            if(d<.2)return{stars:1,title:'Rough launch',msg:`${(d*100).toFixed(1)}% of requests failed. When the crash hit, there was not enough spare capacity.`};
            return{stars:0,title:'The site went down',msg:`${(d*100).toFixed(0)}% of requests were dropped. You need total capacity above 1,200/s, even with one machine gone.`};}};}});})()});
