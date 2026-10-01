/* ---------------- 17. RESILIENCE: tune the client ---------------- */
function resilSim(p){ // discrete-event model, also used by the challenge
  const CAP=60,load=[],att=[];let ok=0,gave=0,state='closed',openUntil=0,fails=[],id=0,peak=0;
  for(let t=0;t<12;t+=1/50)att.push({t,k:0,id:id++});const n0=att.length;
  return{step(T){att.sort((a,b)=>a.t-b.t);while(att.length&&att[0].t<=T){const a=att.shift(),t=a.t;
      let fast=false;if(p.cb&&state==='open'){if(t>=openUntil)state='half';else fast=true;}
      let good=false;if(!fast){load.push(t);while(load.length&&load[0]<t-.5)load.shift();peak=Math.max(peak,load.length*2);const down=t>=4&&t<6,over=load.length>CAP/2*1.9;good=!down&&!over;}
      if(good){ok++;if(state==='half')state='closed';}
      else{if(p.cb&&!fast){fails.push(t);while(fails.length&&fails[0]<t-1)fails.shift();if(state==='half'||fails.length>=15){state='open';openUntil=t+1;fails=[];}}
        if(a.k<p.retries){let d=p.backoff==='exp'?.25*Math.pow(2,a.k):.15;if(p.jitter)d*=.5+rnd(a.id*7+a.k*13+1);att.push({t:t+d,k:a.k+1,id:a.id,fast});}else gave++;}}},
    get ok(){return ok;},n0,get gave(){return gave;},get peak(){return peak;},get state(){return state;},pending:att};}
chal('resilience',{title:'Stop the retry storm',goal:'The payment service (60 req/s max) goes down for 2 seconds while 50 payments/s keep coming. Get ≥95% through without trampling it with more than 3× normal load.',
  hint:'Retries rescue payments, but naive retries arrive all at once. Back off exponentially, add jitter, and let a circuit breaker stop hammering a dead service.',
  make:simGame({dur:16,defaults:{retries:1,backoff:'none',jitter:false,cb:false},intro:'Tune how clients retry. The outage hits at 4 s.',
    controls(api,p,re){api.slider('Retries',0,5,1,p.retries,v=>`${v}`,v=>{p.retries=v;re();});api.seg('Backoff',[['none','none'],['exp','exponential']],p.backoff,v=>{p.backoff=v;re();});
      api.toggle('Jitter',p.jitter,v=>{p.jitter=v;re();});api.toggle('Circuit breaker',p.cb,v=>{p.cb=v;re();});},
    build(p,api){const m=resilSim(p);let T=0,hist=[];const fl=[];let lastOk=0,lastGave=0,acc=0;
      return{step(dt,t){T=t;m.step(t);const now=api.now();const dOk=m.ok-lastOk,dG=m.gave-lastGave;lastOk=m.ok;lastGave=m.gave;
          acc+=dt*14;while(acc>=1){acc--;const down=t>=4&&t<6;fl.push({t0:now,d:.6,pts:[[120,280],[450,280],[780,280]],c:m.state==='open'?C.amber:down?C.red:C.blue,r:4,drop:down||m.state==='open'?.5:0});}
          hist.push([t,m.peak]);},
        draw(now){flyers(now,fl);for(let i=0;i<3;i++)user(110,190+i*90,{c:C.blue,r:13});tx('50 payments/s',110,470,{z:12,c:C.dim});
          box(450,280,{label:'Circuit breaker',sub:p.cb?m.state.toUpperCase():'off',c:!p.cb?C.edge:m.state==='open'?C.red:m.state==='half'?C.amber:C.green,w:170,h:58});
          const down=T>=4&&T<6;server(780,280,{label:'Payments',sub:down?'outage':'60/s max',w:130,st:down?'fail':m.peak>180?'hot':'ok'});
          tx(`retries ${p.retries} · ${p.backoff==='exp'?'exponential':'no'} backoff${p.jitter?' + jitter':''}`,450,370,{z:12,c:C.dim});},
        hud(){const s=m.ok/m.n0;return[['succeeded',`${(Math.min(1,s)*100).toFixed(0)}%`,s>=.95?C.green:C.red],['peak load',`${(m.peak/50).toFixed(1)}×`,m.peak/50<=3?C.green:C.red],['gave up',`${m.gave}`]];},
        score(){const s=m.ok/m.n0,pk=m.peak/50;if(s>=.95&&pk<=3)return{stars:3,title:`${(s*100).toFixed(0)}% through, peak ${pk.toFixed(1)}×`,msg:'Retries rescued the payments, backoff and jitter spread them out, and the service was never trampled. That is resilience.'};
          if(s>=.85)return{stars:2,title:`${(s*100).toFixed(0)}% through, peak ${pk.toFixed(1)}×`,msg:pk>3?'Your retries arrived in a stampede. Add jitter and exponential backoff.':'Some payments gave up too early. Allow a few more retries, spaced out.'};
          return{stars:1,title:`${(s*100).toFixed(0)}% through`,msg:p.retries===0?'With no retries, every payment during the outage is simply lost.':'Retries fired too fast and too close together, overloading the service as it came back.'};}};}})});
