/* ---------------- 9b. QUORUMS: tune N, W and R ---------------- */
// replicas answer in this order (ms); the fastest one dies halfway through the run
const QLAT=[5,8,12,20,35];
function quorumNums(p){const live=QLAT.slice(0,p.n),after=live.slice(1);
  const lat=(q,l)=>q<=l.length?l[q-1]:null,ok=p.w<=after.length&&p.r<=after.length;
  const ms=[lat(p.w,live),lat(p.r,live),lat(p.w,after),lat(p.r,after)].filter(v=>v!=null);
  return{stale:p.r+p.w<=p.n,fails:!ok,avg:ms.length?ms.reduce((a,b)=>a+b,0)/ms.length:999};}
chal('quorums',{title:'Tune the quorum',goal:'Half reads, half writes. Halfway through, one replica dies. Get zero stale reads, zero failed requests and an average wait of 15 ms or less.',
  hint:'R + W must be more than N for fresh reads. Both W and R must still fit in the replicas left after one dies. Every extra replica you wait for is slower.',
  make:simGame({dur:10,defaults:{n:3,w:1,r:1},intro:'Pick N, W and R, then press <b>Run it</b>.',
    controls(api,p,re){api.slider('Replicas (N)',3,5,1,p.n,v=>`${v}`,v=>{p.n=v;re();});api.slider('Write quorum (W)',1,5,1,p.w,v=>`${v}`,v=>{p.w=v;re();});api.slider('Read quorum (R)',1,5,1,p.r,v=>`${v}`,v=>{p.r=v;re();});},
    build(p,api){const N=quorumNums(p),CL=[150,300],RY=k=>300+(k-(p.n-1)/2)*92;let acc=0,i=0,dead=false;const fl=[];
      return{step(dt,t){if(!dead&&t>=5){dead=true;FX.burst(640,RY(0),C.red,24);FX.text(640,RY(0)-50,'replica down',C.red,14);}
          acc+=dt*7;const now=api.now();while(acc>=1){acc--;const write=i++%2===0,q=write?p.w:p.r,alive=dead?p.n-1:p.n;const bad=q>alive||q>p.n,stale=!write&&N.stale&&i%4===1;
            for(let k=0;k<Math.min(q,p.n);k++){const kk=dead?k+1:k;if(kk>=p.n)break;fl.push({t0:now,d:.5,pts:[[CL[0]+22,CL[1]],[588,RY(kk)]],c:write?C.amber:C.blue,r:3.5,drop:bad?.7:0});}
            fl.push({t0:now+.6,d:.5,pts:[[588,300],[CL[0]+22,CL[1]]],c:bad?C.red:stale?C.red:C.green,r:4,label:bad?'failed':stale?'stale':null});}},
        draw(now){flyers(now,fl);user(CL[0],CL[1],{label:'client',r:20});
          for(let k=0;k<p.n;k++)db(640,RY(k),{label:`Replica ${k+1}`,sub:`${QLAT[k]} ms`,w:104,h:76,st:dead&&k===0?'fail':'ok'});
          tx(`R + W = ${p.r+p.w} ${p.r+p.w>p.n?'>':'≤'} N = ${p.n}`,860,250,{z:16,wt:800,f:MONO,c:p.r+p.w>p.n?C.green:C.red});
          tx(p.r+p.w>p.n?'reads overlap the latest write':'reads can miss the latest write',860,278,{z:12,c:C.dim});
          if(p.w>p.n||p.r>p.n)tx('a quorum bigger than N can never be met',860,320,{z:12,c:C.red});},
        hud(){return[['stale reads',N.stale?'yes':'none',N.stale?C.red:C.green],['failures',N.fails?'yes':'none',N.fails?C.red:C.green],['avg wait',`${N.avg.toFixed(0)} ms`,N.avg<=15?C.green:C.red]];},
        score(){const a=!N.stale,b=!N.fails,c=N.avg<=15,n=[a,b,c].filter(Boolean).length;
          if(n===3)return{stars:3,title:'Fresh, available and fast',msg:`N=${p.n}, W=${p.w}, R=${p.r}: every read overlaps the latest write, one dead replica changes nothing, and the average wait is ${N.avg.toFixed(0)} ms.`};
          const why=[!a&&'R + W is not more than N, so some reads miss the latest write',!b&&'after one replica died there were not enough left to meet W or R',!c&&'waiting for that many replicas is too slow'].filter(Boolean).join('; ');
          return{stars:n===2?2:1,title:`${n} of 3 goals`,msg:why.charAt(0).toUpperCase()+why.slice(1)+'.'};}};}})});
