/* ---------------- 11c. HOT KEYS: survive the celebrity post ---------------- */
chal('hot-keys',{title:'Survive the celebrity post',goal:'5,000 requests/s for one key. Each cache node handles 2,000/s and the key expires every 5 s. Keep errors under 1% and never send the database more than 10 queries at once.',
  hint:'One node cannot hold the crowd: add copies. Expiry turns the crowd into a stampede: coalesce the misses, or refresh the key before it expires.',
  make:simGame({dur:20,defaults:{nodes:1,coal:false,ref:false},intro:'Configure the cache for post:42, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Cache nodes with a copy',1,3,1,p.nodes,v=>`${v} × 2,000/s`,v=>{p.nodes=v;re();});api.toggle('Coalesce misses',p.coal,v=>{p.coal=v;re();});api.toggle('Refresh before expiry',p.ref,v=>{p.ref=v;re();});},
    build(p,api){let valid=true,nextExp=2,refillAt=0,q=0,qPeak=0,err=0,tot=0,acc=0;const fl=[];const RATE=5000;
      return{step(dt,t){tot+=RATE*dt;
          if(valid&&!p.ref&&t>=nextExp){valid=false;refillAt=t+.3;nextExp=t+5;}
          if(valid)err+=Math.max(0,RATE-2000*p.nodes)*dt;                 // more traffic than the cache nodes can serve
          else{if(p.coal)q=Math.max(q,1);else{q+=RATE*dt;if(q>300)err+=RATE*dt;}if(t>=refillAt)valid=true;}   // misses; beyond 1 s of DB work they time out
          if(!p.coal)q=Math.max(0,q-300*dt);else if(valid)q=0;             // the database drains 300 queries/s
          qPeak=Math.max(qPeak,q);
          acc+=dt*40;const now=api.now();while(acc>=1){acc--;const k=Math.floor(PIM_RANDOM.next()*p.nodes),over=valid&&PIM_RANDOM.next()<Math.max(0,1-2000*p.nodes/RATE);
            if(valid)fl.push({t0:now,d:.5,pts:[[80,120+PIM_RANDOM.next()*340],[330,290],[590,170+(k-(p.nodes-1)/2)*96]],c:over?C.red:C.blue,r:3.5,drop:over?.8:0});
            else fl.push({t0:now,d:.7,pts:[[80,120+PIM_RANDOM.next()*340],[330,290],p.coal?[330,330]:[830,360]],c:p.coal?C.amber:C.red,r:3.5});}},
        draw(now){flyers(now,fl);for(let k=0;k<8;k++)user(80,120+k*48,{r:10,c:C.blue});server(330,290,{label:'App',sub:p.coal?'coalescing':'',w:118});
          for(let k=0;k<p.nodes;k++)box(590,170+(k-(p.nodes-1)/2)*96,{label:`cache ${k+1}`,sub:valid?'post:42 ✓':'expired',c:valid?C.green:C.red,w:130,h:48});
          db(830,360,{label:'Database',sub:`${Math.round(q)} queued`,w:120,h:88,st:q>10?'fail':'ok',down:'STAMPEDE'});},
        hud(){const e=tot?err/tot:0;return[['errors',`${(e*100).toFixed(1)}%`,e<.01?C.green:C.red],['DB queue peak',`${Math.round(qPeak)}`,qPeak<=10?C.green:C.red]];},
        score(){const e=err/tot,a=e<.01,b=qPeak<=10;if(a&&b)return{stars:3,title:'The post survived',msg:`Copies on ${p.nodes} nodes carried the crowd, and ${p.coal&&p.ref?'coalescing plus refresh-ahead':p.coal?'coalescing':'refreshing ahead'} meant the database saw at most ${Math.round(qPeak)} quer${qPeak===1?'y':'ies'} at once.`};
          if(a||b)return{stars:2,title:a?'Errors fine, database stampeded':'Database safe, cache overloaded',msg:a?`Every expiry sent ~${Math.round(qPeak).toLocaleString()} identical queries to the database. Coalesce them, or refresh before expiry.`:`${p.nodes} node${p.nodes>1?'s':''} can serve ${2000*p.nodes}/s, but the key gets 5,000/s. Put copies on more nodes.`};
          return{stars:1,title:p.nodes<3?'Melted twice over':'Stampede on every expiry',msg:p.nodes<3?'The cache nodes could not keep up, and every expiry stampeded the database. Spread the key across more nodes and coalesce the misses.':'The cache nodes held the crowd, but each expiry sent thousands of identical queries to the database, which timed out. Coalesce the misses, or refresh before expiry.'};}};}})});
