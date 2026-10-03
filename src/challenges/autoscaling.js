/* ---------------- 2b. AUTOSCALING: tune the rules ---------------- */
// Target tracking: scale out at once to reach the target; scale in one server at a
// time, and only after the cooldown. Traffic wobbles, which is what causes flapping.
function autoSim(p){const dem=t=>150+550*Math.exp(-Math.pow((t-10)/3.5,2))+(t>=16&&t<18.5?300:0)+45*Math.sin(t*2.7)+25*Math.sin(t*6.1);
  let ready=p.min,boot=[],lastIn=-99,dir=0,flips=0,changes=0,tot=0,drop=0,cost=0,cpu=0,acc=0;
  return{dem,step(dt,t){boot=boot.filter(b=>{if(t>=b){ready++;return false;}return true;});
      const d=dem(t),cap=ready*100;cpu=d/Math.max(cap,1);tot+=d*dt;drop+=Math.max(0,d-cap)*dt;cost+=(ready+boot.length)*dt;
      acc+=dt;if(acc>=.5){acc-=.5;
        if(cpu*100>p.out){const add=Math.ceil(d/p.out)-ready-boot.length;if(add>0){for(let i=0;i<add;i++)boot.push(t+2);changes++;if(dir<0)flips++;dir=1;}}
        else if(cpu*100<p.inn&&ready>p.min&&t-lastIn>=p.cd){ready--;lastIn=t;changes++;if(dir>0)flips++;dir=-1;}}},
    get ready(){return ready;},get booting(){return boot.length;},get cpu(){return cpu;},get dropPct(){return tot?drop/tot:0;},get cost(){return cost;},get flips(){return flips;},get changes(){return changes;}};}
chal('autoscaling',{title:'Tune the autoscaler',goal:'Traffic rises to a peak, wobbles, then a surprise spike hits. Drop under 2% of requests, spend at most 200 server-seconds, and flip between adding and removing no more than 3 times.',
  hint:'New servers take 2 s to boot, so scale out well before you are full (around 60%). Keep a floor of servers for the surprise spike, and use a cooldown so a wobble does not trigger an add-remove-add dance.',
  make:simGame({dur:24,defaults:{out:90,inn:20,cd:0,min:1},intro:'Set the scaling rules, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Scale out above',50,95,5,p.out,v=>`${v}% CPU`,v=>{p.out=v;re();});api.slider('Scale in below',10,60,5,p.inn,v=>`${v}% CPU`,v=>{p.inn=v;re();});
      api.slider('Cooldown',0,6,1,p.cd,v=>`${v} s`,v=>{p.cd=v;re();});api.slider('Minimum servers',1,4,1,p.min,v=>`${v}`,v=>{p.min=v;re();});},
    build(p,api){const m=autoSim({...p});let T=0,acc=0;const fl=[],hist=[];
      return{step(dt,t){T=t;m.step(dt,t);hist.push([t,m.dem(t),m.ready*100]);acc+=dt*m.dem(t)/60;const now=api.now();
          while(acc>=1){acc--;const over=m.cpu>1&&PIM_RANDOM.next()<1-1/m.cpu,k=Math.floor(PIM_RANDOM.next()*Math.max(1,m.ready));fl.push({t0:now,d:.7,pts:[[60,380],[300,380],[520+(k%4)*110,k<4?330:440]],c:over?C.red:C.blue,r:3.5,drop:over?.7:0});}},
        draw(now,running){flyers(now,fl);box(300,380,{label:'Load balancer',w:130,h:48});
          for(let k=0;k<Math.min(8,m.ready+m.booting);k++){const bootK=k>=m.ready;server(520+(k%4)*110,k<4?330:440,{label:`S${k+1}`,sub:bootK?'booting':'',w:90,h:46,st:bootK?'off':m.cpu>1?'fail':m.cpu>.7?'hot':'ok',down:''});}
          // mini chart of demand vs capacity
          rr(40,40,560,150,10);g.fillStyle=hexA(C.panel,.8);g.fill();g.strokeStyle=C.line;g.stroke();tx('demand',56,58,{z:11.5,c:C.blue,al:'left'});tx('capacity',116,58,{z:11.5,c:C.green,al:'left'});
          const X=s=>50+s/24*540,Y=v=>180-v/1100*110;[[1,C.blue],[2,C.green]].forEach(([i,c])=>{g.beginPath();hist.forEach((h,j)=>{j?g.lineTo(X(h[0]),Y(h[i])):g.moveTo(X(h[0]),Y(h[i]));});g.strokeStyle=c;g.lineWidth=2;g.stroke();});
          if(!running&&!hist.length)tx('press Run it to see traffic arrive',320,120,{z:13,c:C.dim});},
        hud(){return[['dropped',`${(m.dropPct*100).toFixed(1)}%`,m.dropPct<.02?C.green:C.red],['cost',`${Math.round(m.cost)} srv·s`,m.cost<=200?C.green:C.red],['flips',`${m.flips}`,m.flips<=3?C.green:C.red],['servers',`${m.ready}${m.booting?' +'+m.booting:''}`]];},
        score(){const d=m.dropPct,c=m.cost,f=m.flips;const ok=[d<.02,c<=200,f<=3];const n=ok.filter(Boolean).length;
          if(n===3)return{stars:3,title:'Smooth scaling',msg:`${(d*100).toFixed(1)}% dropped, ${Math.round(c)} server-seconds, ${f} flip${f===1?'':'s'}. Scaling out early covers the 2 s boot, a minimum absorbs the surprise, and a cooldown keeps it calm.`};
          const why=[!ok[0]&&'too many requests dropped: scale out earlier (a lower threshold) or keep a higher minimum for the spike',!ok[1]&&'too expensive: scale in sooner or lower the minimum',!ok[2]&&'it flapped between adding and removing: add a cooldown, or leave more room between the two thresholds'].filter(Boolean).join('; ');
          return{stars:ok[0]?2:1,title:ok[0]?`${n} of 3 goals`:`${(d*100).toFixed(1)}% of requests dropped`,msg:why.charAt(0).toUpperCase()+why.slice(1)+'.'};}};}})});
