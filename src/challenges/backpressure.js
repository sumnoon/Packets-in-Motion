/* ---------------- A4. BACK-PRESSURE: keep checkout alive ---------------- */
chal('backpressure',{title:'Keep checkout alive',goal:'Traffic is 300 req/s and the database takes 200. Keep ≥99% of checkouts succeeding, wait times under 250 ms, and do not run out of memory.',
  hint:'A queue only postpones the problem. Decide what to drop: analytics and recommendations can wait, checkout cannot.',
  make:(()=>{const MIX=[['checkout',80],['search',70],['recs',60],['analytics',90]];
    return simGame({dur:12,defaults:{bound:false,bp:false,shed:'none'},intro:'Choose how the API protects itself, then press <b>Run it</b>.',
      controls(api,p,re){api.toggle('Limit the queue (100)',p.bound,v=>{p.bound=v;re();});api.toggle('Back-pressure',p.bp,v=>{p.bp=v;re();});
        api.seg('Shed when overloaded',[['none','nothing'],['an','analytics'],['anr','analytics + recs']],p.shed,v=>{p.shed=v;re();});},
      build(p,api){const drop=new Set(p.shed==='an'?['analytics']:p.shed==='anr'?['analytics','recs']:[]);let q=0,up=0,crashed=false,acc=0;const ok={},tot={};MIX.forEach(([k])=>{ok[k]=0;tot[k]=0;});let wait=0,waitMax=0;const fl=[];
        return{step(dt,t){let inRate=0;MIX.forEach(([k,r])=>{tot[k]+=r*dt;if(!drop.has(k))inRate+=r;});
            // back-pressure: the API only sends what the database can take; the rest waits upstream
            let enter=inRate*dt;if(p.bp){up+=enter;enter=Math.min(up,200*dt);up-=enter;}
            const share=inRate>0?enter/(inRate*dt):0;let refused=0;
            if(!crashed){q+=enter;if(p.bound&&q>100){refused=q-100;q=100;}q-=Math.min(q,200*dt);if(!p.bound&&q>400){crashed=true;FX.burst(470,290,C.red,40,240);}
              const f=enter>0?Math.max(0,1-refused/enter):1;MIX.forEach(([k,r])=>{if(!drop.has(k)&&!crashed)ok[k]+=r*dt*Math.min(1,share)*f;});}
            wait=(q+up)/200;waitMax=Math.max(waitMax,wait);
            acc+=dt*20;const now=api.now();while(acc>=1){acc--;const r=Math.random()*300;let k='checkout',c=0;for(const[m,w]of MIX){c+=w;if(r<c){k=m;break;}}
              const dr=drop.has(k),bad=crashed||dr||(p.bound&&q>=99&&Math.random()<.33);fl.push({t0:now,d:.7,pts:[[150,290],[470,290],[800,290]],c:bad?C.red:k==='checkout'?C.green:C.blue,r:k==='checkout'?5:3.5,drop:bad?(dr?.25:.55):0});}},
          draw(now){flyers(now,fl);server(150,290,{label:'API',sub:'300 req/s',w:120,st:'hot'});
            if(drop.size)box(290,170,{label:'Shedder',sub:[...drop].join(' + '),c:C.amber,w:170,h:50});
            box(470,290,{label:crashed?'OUT OF MEMORY':'Queue',sub:crashed?'':`${Math.round(q)} waiting${p.bound?' / 100':''}`,c:crashed?C.red:q>90?C.amber:C.edge,w:170,h:60,st:crashed?'fail':undefined});
            meter(400,332,140,8,q/(p.bound?100:400),q>80?C.red:C.amber);db(820,290,{label:'Database',sub:'200/s',w:110,h:86});
            if(p.bp)pill(`held upstream: ${Math.round(up)}`,150,390,{c:C.amber,z:12});
            tx('● checkout',120,470,{z:12,c:C.green,al:'left'});tx('● other requests',230,470,{z:12,c:C.blue,al:'left'});},
          hud(){const c=tot.checkout?ok.checkout/tot.checkout:1;return[['checkout ok',`${(c*100).toFixed(1)}%`,c>=.99?C.green:C.red],['wait',`${Math.round(wait*1000)} ms`,wait<=.25?C.green:C.red],['memory',crashed?'CRASHED':'ok',crashed?C.red:C.green]];},
          score(){const c=ok.checkout/tot.checkout;if(crashed)return{stars:0,title:'Out of memory',msg:'An unlimited queue just grew until the service died. Put a limit on it, or stop accepting work you cannot do.'};
            if(c>=.99&&waitMax<=.25)return{stars:3,title:'Checkout never flinched',msg:`Shedding analytics and recommendations brought traffic under the database's 200/s, so checkout kept flowing with almost no wait (${Math.round(waitMax*1000)} ms at worst). Graceful degradation.`};
            if(c>=.95)return{stars:2,title:`${(c*100).toFixed(1)}% of checkouts, up to ${(waitMax).toFixed(1)} s wait`,msg:p.bp?'Back-pressure kept things from breaking, but the waiting just moved upstream. Drop the low-priority work.':'Close. Drop one more low-priority kind of request.'};
            return{stars:1,title:`${(c*100).toFixed(1)}% of checkouts succeeded`,msg:'The queue was full, so checkouts were refused just like everything else. Protect the important requests by shedding the unimportant ones.'};}};}});})()});
