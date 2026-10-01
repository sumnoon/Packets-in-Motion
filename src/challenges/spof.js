/* ---------------- 16. SPOF: survive the chaos monkey ---------------- */
chal('spof',{title:'Survive the chaos monkey',goal:'The chaos monkey will kill three components. Click components to add a standby ($1 each, budget $4) and stay up the whole time.',
  hint:'Look at which boxes stand alone. DNS is a managed service and already redundant.',
  make:(()=>{const K=[{id:'dns',n:'DNS',sub:'managed · redundant',x:150,managed:true},{id:'lb',n:'Load balancer',x:370},{id:'app',n:'App server',x:600},{id:'db',n:'Database',x:830,isDb:true}];const kills=[['app',3],['lb',6.5],['db',10]];
    const dup=new Set();
    return simGame({dur:13,defaults:{},intro:'Click components (or press <kbd>1</kbd> DNS, <kbd>2</kbd> load balancer, <kbd>3</kbd> app server, <kbd>4</kbd> database) to give them a standby, then press <b>Unleash chaos</b>.',runLabel:'Unleash chaos',
      controls(){},
      build(p,api){let up=0,down=0,dead={},acc=0;const fl=[];
        function toggle(k){if(!k)return;if(dup.has(k.id))dup.delete(k.id);else if(dup.size<4){dup.add(k.id);FX.burst(k.x,390,C.green,12,120);}
          api.status(`Standbys: ${dup.size?K.filter(q=>dup.has(q.id)).map(q=>q.n).join(', '):'none'} ($${dup.size} of $4). Then press <b>Unleash chaos</b>.`);}
        return{step(dt,t){kills.forEach(([id,at])=>{if(t>=at&&!(id in dead)){dead[id]=t;const k=K.find(q=>q.id===id);FX.burst(k.x,250,C.red,30,220);FX.text(k.x,170,dup.has(id)?'Failover!':'DEAD',dup.has(id)?C.green:C.red);}});
            const broken=Object.keys(dead).some(id=>!dup.has(id)&&t-dead[id]<2.5);if(broken)down+=dt;else up+=dt;
            acc+=dt*12;const now=api.now();while(acc>=1){acc--;fl.push({t0:now,d:.9,pts:[[40,250],...K.map(k=>[k.x,250])],c:broken?C.red:C.blue,r:4,drop:broken?.55:0});}},
          draw(now,running){flyers(now,fl);K.forEach(k=>{const d=k.id in dead,has=dup.has(k.id);const st=d?(has?'ok':'fail'):'ok';
              if(k.isDb)db(k.x,250,{label:k.n,st,w:100,h:86});else server(k.x,250,{label:k.n,sub:k.sub||'',w:130,st});
              if(has){if(k.isDb)db(k.x,390,{label:'Standby',st:d?'good':'ok',w:84,h:70});else server(k.x,390,{label:'Standby',w:110,h:52,st:d?'good':'ok'});ln([[k.x,300],[k.x,358]],{c:hexA(C.green,.5),dash:[4,5]});}
              else if(!running&&!k.managed)tx('+ add standby',k.x,390,{z:12,c:C.dim});if(!running)keycap(String(K.indexOf(k)+1),k.x-(k.isDb?62:77),212);});
            tx(`spent $${dup.size} of $4`,W/2,500,{z:14,wt:700,c:dup.size<=4?C.amber:C.red});},
          hud(){const tot=up+down;return[['uptime',`${tot?(up/tot*100).toFixed(0):100}%`,down<.01?C.green:C.red],['budget',`$${dup.size} / $4`]];},
          down(x,y,now,running){if(running)return;toggle(K.find(q=>Math.abs(x-q.x)<70&&y>200&&y<440));},
          key(k,now,running){if(running)return;toggle(K[+k-1]);},
          score(){const ok=down<.01;if(ok&&!dup.has('dns'))return{stars:3,title:'Zero downtime',msg:'Every single point of failure had a standby, and you did not waste money on DNS, which was already redundant.'};
            if(ok)return{stars:2,title:'Zero downtime, $1 wasted',msg:'DNS was already a managed, redundant service. That standby bought nothing.'};
            return{stars:1,title:`Down ${down.toFixed(1)} s`,msg:'A box with no standby took the whole system down when it died. Find every box that stands alone.'};}};}});})()});
