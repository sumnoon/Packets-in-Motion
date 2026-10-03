/* ---------------- 18b. DEPLOYMENTS: ship v2 safely ---------------- */
// v2 fails 40% of the requests it gets. Detection needs enough v2 traffic: 1 s at full traffic, 2 s for a 5% canary.
function deployPlan(p){const mode=p.mode,auto=p.auto;
  // [from, to, share of traffic on v2]
  if(mode==='all'){const end=auto?2+1+3:8+3;return{segs:[[2,end,1]],undo:end,how:auto?'redeploy v1 (3 s)':'noticed at 8 s, redeploy v1 (3 s)'};}
  if(mode==='bg'){const end=auto?3:8;return{segs:[[2,end,1]],undo:end,how:auto?'switch back at once':'noticed at 8 s, switch back'};}
  if(auto)return{segs:[[2,4,.05]],undo:4,how:'canary error rate tripped the rollback'};
  return{segs:[[2,5,.05],[5,8,.25]],undo:8,how:'canary widened to 25% before anyone noticed'};}
const deployErrors=p=>Math.round(deployPlan(p).segs.reduce((a,[s,e,sh])=>a+(e-s)*100*sh*.4,0));
const v2share=(p,t)=>{const s=deployPlan(p).segs.find(([a,b])=>t>=a&&t<b);return s?s[2]:0;};
chal('deployments',{title:'Ship v2 without hurting users',goal:'v2 has a bug that fails 40% of its requests. Traffic is 100 requests a second. Pick a release strategy so that fewer than 20 requests fail.',
  hint:'Expose as few users as possible, and let the system roll back on its own: people notice slowly.',
  make:simGame({dur:12,defaults:{mode:'all',auto:false},intro:'Pick how v2 goes out, then press <b>Ship it</b>.',runLabel:'Ship it',
    controls(api,p,re){api.seg('Strategy',[['all','all at once'],['bg','blue-green'],['canary','canary 5%']],p.mode,v=>{p.mode=v;re();});api.toggle('Automatic rollback on errors',p.auto,v=>{p.auto=v;re();});},
    build(p,api){const plan=deployPlan(p),total=deployErrors(p);let shown=0,acc=0,T=0,rolled=false;const fl=[];const LB=[330,300];
      return{step(dt,t){T=t;if(!rolled&&t>=plan.undo){rolled=true;FX.text(LB[0],LB[1]-60,'rolled back',C.green,15);}
          shown=Math.round(total*clamp(plan.segs.reduce((a,[s,e])=>a+clamp((t-s)/(e-s))*(e-s),0)/Math.max(.001,plan.segs.reduce((a,[s,e])=>a+e-s,0))));
          acc+=dt*16;const now=api.now();while(acc>=1){acc--;const sh=v2share(p,t),toV2=PIM_RANDOM.next()<sh,bad=toV2&&PIM_RANDOM.next()<.4,y=toV2?420:180;
            fl.push({t0:now,d:.45,pts:[[110,300],[LB[0]-62,LB[1]]],c:C.blue,r:3.5});fl.push({t0:now+.45,d:.45,pts:[[LB[0]+62,LB[1]],[700,y+(PIM_RANDOM.next()-.5)*60]],c:bad?C.red:toV2?C.amber:C.blue,r:3.5,drop:bad?.85:0});}},
        draw(now,running){flyers(now,fl);for(let k=0;k<4;k++)user(110,210+k*60,{r:12});box(LB[0],LB[1],{label:'Load balancer',w:124,h:54});
          const sh=running?v2share(p,T):0;
          server(760,180,{label:'v1 fleet',sub:`${Math.round((1-sh)*100)}% of traffic`,w:150,h:60,col:C.blue,st:'blue'});
          server(760,420,{label:'v2 fleet',sub:`${Math.round(sh*100)}% of traffic`,w:150,h:60,col:C.amber,st:sh>0?'hot':'off'});
          if(!running&&!T)tx(`plan: ${p.mode==='all'?'all traffic to v2 at once':p.mode==='bg'?'switch everything to green (v2)':'5% canary, then widen'}${p.auto?', auto-rollback on':''}`,W/2,530,{z:13.5,c:C.dim});
          if(T)tx(plan.how,W/2,530,{z:13.5,c:C.dim});},
        hud(){return[['failed requests',`${shown}`,shown<20?C.green:C.red],['on v2 now',`${Math.round(v2share(p,T)*100)}%`]];},
        score(){const e=total;if(e<20)return{stars:3,title:`${e} failed requests`,msg:'A small canary with automatic rollback: the bug touched a handful of requests and was gone in seconds.'};
          if(e<=60)return{stars:2,title:`${e} failed requests`,msg:p.mode==='canary'?'The canary limited the damage, but nobody rolled it back before it widened. Make rollback automatic.':'Switching back fast helped, but all traffic hit v2 first. Expose a small slice before everyone.'};
          return{stars:1,title:`${e} failed requests`,msg:'Everyone got v2 at once, and undoing it was slow. Try a canary with automatic rollback.'};}};}})});
