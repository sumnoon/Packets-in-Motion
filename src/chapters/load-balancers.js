/* ---------------- 3. LOAD BALANCERS ---------------- */
(function(){
  const US=[[80,150],[80,243],[80,337],[80,430]],LB=[420,290],SV=[[790,160],[790,290],[790,420]];
  // deterministic simulation of requests
  const R=[];let rr_=0,lc=0;
  for(let i=0;;i++){const s=.6+i*.5;if(s>28.3)break;
    let phase=s<5.2?'solo':s<20.6?'rr':s>=21?'lc':null;if(!phase)continue;
    const r={s,u:i%4,phase};
    if(phase==='solo'){r.tg=1;r.cost=3;r.arr=s+1.2;}
    else{const k=phase==='rr'?rr_++:lc++;r.heavy=(phase==='rr'?s>=13.6:true)&&k%3===2;r.cost=r.heavy?5:.8;r.arr=s+1.4;
      if(phase==='rr')r.tg=k%3;
      else{const act=[0,0,0];R.forEach(q=>{if(q.tg!=null&&!q.drop&&q.arr<=r.arr&&q.fin>r.arr)act[q.tg]++;});let b=0;for(let j=1;j<3;j++)if(act[j]<act[b])b=j;r.tg=b;}}
    if(phase==='solo'){const act=R.filter(q=>q.tg===1&&q.arr<=r.arr&&q.fin>r.arr).length;if(act>=4)r.drop=true;}
    r.fin=r.arr+r.cost;R.push(r);}
  const ring0=[500,300],RR=165,SA={A:40,B:160,C:270},KEYS=[15,70,100,130,185,215,250,300,340];
  const owner=(k,set)=>{let best=null,bd=999;for(const n of set){let d=(SA[n]-k+360)%360;if(d<bd){bd=d;best=n;}}return best;};
  const onR=(deg,r=RR)=>[ring0[0]+r*Math.sin(deg*Math.PI/180),ring0[1]-r*Math.cos(deg*Math.PI/180)];
ch({id:'load-balancers',group:'Traffic',title:'Load Balancers',dur:41,
beats:[
[0,'One server can\'t keep up','All traffic lands on one machine. Requests pile up and start failing.'],
[5,'Add servers and a load balancer','A load balancer sits in front of a pool of servers. Clients talk to one address; the balancer decides who does the work.'],
[8,'Round robin: take turns','The simplest rule: server 1, then 2, then 3, then back to 1. Fair when every request costs about the same.'],
[14,'But requests aren\'t equal','Some requests are heavy (big dots). Round robin ignores that, so Server 3 piles up work while the others sit idle.'],
[21,'Least connections: pick the least busy','The balancer counts open connections and sends each new request to whichever server has the fewest. The load evens out.'],
[29,'Consistent hashing: same key → same server','Hash each key (like a user id) to a point on a ring. A key belongs to the next server clockwise, so the same user always lands on the same server. Great for caches.'],
[35,'Remove a server: only its keys move','When Server B leaves, only B\'s keys shift to the next server. Everyone else stays put. With plain hash % N, most keys would move.']],
use:['Round robin: identical servers and similar, short requests','Least connections: requests with very different costs (uploads, reports, long polls)','Consistent hashing: sticky routing to caches or shards, so adding or removing nodes moves few keys'],
cons:['The load balancer itself must be redundant or it becomes a single point of failure','Least connections needs live connection tracking; round robin is blind to load','Consistent hashing can be uneven without "virtual nodes"; sticky routing fights even spreading'],
draw(t){
  if(t<29.2){const fa=A(t,.2,28.6).a;
    US.forEach((u,i)=>user(u[0],u[1],{a:fa,s:A(t,.2+i*.1).s,r:14}));
    const lbA=A(t,5,28.6);
    // links
    if(t<5.6)US.forEach(u=>ln([[u[0]+16,u[1]],[SV[1][0]-56,SV[1][1]]],{a:fa*(1-P(t,5,5.6))*.6}));
    US.forEach(u=>ln([[u[0]+16,u[1]],[LB[0]-65,LB[1]]],{a:lbA.a*.6}));
    SV.forEach(sv=>ln([[LB[0]+65,LB[1]],[sv[0]-56,sv[1]]],{a:lbA.a*.6}));
    // active per server at t
    const act=[[],[],[]];R.forEach(r=>{if(!r.drop&&t>=r.arr&&t<r.fin)act[r.tg].push(r);});
    const showConn=t>14;
    SV.forEach((sv,k)=>{const a=k===1?fa:Math.min(fa,V(t,5.3+k*.15));const n=act[k].length;
      server(sv[0],sv[1],{label:'Server '+(k+1),a,s:k===1?A(t,.3).s:A(t,5.3+k*.15).s,load:n/5,st:n>=4?'hot':'ok'});
      act[k].forEach((r,j)=>dot(sv[0]+72+(j%4)*15,sv[1]-10+Math.floor(j/4)*16,C.amber,r.heavy?7:4.5,a));
      if(showConn)pill(`conns: ${n}`,sv[0],sv[1]-50,{c:n>=4?C.amber:C.dim,z:12,a:Math.min(a,V(t,14))});
    });
    box(LB[0],LB[1],{label:'Load Balancer',sub:t<20.8?'round robin':'least connections',w:130,glow:true,...lbA});
    if(t>8&&t<20.8){const cur=R.filter(r=>r.phase==='rr'&&r.s<=t).length%3;pill(`next → Server ${cur+1}`,LB[0],LB[1]+52,{c:C.accent,z:12,a:V(t,8.2,20.3)});}
    if(t>21.2&&t<28.6){const act2=act.map(a=>a.length);let b=0;for(let j=1;j<3;j++)if(act2[j]<act2[b])b=j;pill(`least busy → Server ${b+1}`,LB[0],LB[1]+52,{c:C.accent,z:12,a:V(t,21.4,28.3)});}
    // packets
    R.forEach(r=>{if(t<r.s)return;const u=US[r.u],sv=SV[r.tg],rad=r.heavy?8.5:5.5;
      if(r.phase==='solo'){pk(t,r.s,1.2,[[u[0]+16,u[1]],[sv[0]-56,sv[1]]],C.blue,{r:rad,a:fa});if(r.drop)drop(t,r.arr,sv[0]-56,sv[1]);}
      else{pk(t,r.s,.7,[[u[0]+16,u[1]],[LB[0]-65,LB[1]]],C.blue,{r:rad,a:fa});pk(t,r.s+.7,.7,[[LB[0]+65,LB[1]],[sv[0]-56,sv[1]]],C.blue,{r:rad,a:fa});}
      if(!r.drop)pop(t,r.fin,sv[0]+56+16,sv[1]-30,'✓',C.green,{z:14,d:.8});
    });
    if(t>2&&t<5.2)pill('overloaded!',SV[1][0],SV[1][1]+62,{c:C.red,a:V(t,2.4,4.8)});
    if(t>16&&t<20.8)pill('heavy requests all land on Server 3',SV[2][0]-20,512,{c:C.amber,a:V(t,16.5,20.4)});
    if(t>24.5&&t<28.6)pill('load evens out',SV[2][0],512,{c:C.green,a:V(t,24.8,28.2)});
  }else{
    // ===== consistent hashing ring =====
    const ra=A(t,29.3);
    draw(0,0,{a:ra.a},()=>{g.beginPath();g.arc(ring0[0],ring0[1],RR,0,7);g.strokeStyle=C.edge;g.lineWidth=3;g.stroke();
      for(let d=0;d<360;d+=30){const[x,y]=onR(d,RR+10),[x2,y2]=onR(d,RR+4);g.beginPath();g.moveTo(x,y);g.lineTo(x2,y2);g.strokeStyle=C.line;g.lineWidth=1.5;g.stroke();}});
    tx('0°',ring0[0],ring0[1]-RR-20,{z:11,c:C.faint,a:ra.a});
    pill('position = hash(key) mod 360°',840,108,{c:C.accent,a:V(t,29.6)});
    const bGone=P(t,35.2,36.2);
    ['A','B','C'].forEach((n,i)=>{const a=A(t,29.8+i*.3);const[x,y]=onR(SA[n]),[lx,ly]=onR(SA[n],RR+72);
      const dead=n==='B'&&t>35.2;
      draw(0,0,{a:a.a*(n==='B'?1-bGone*.85:1)},()=>{ln([[x,y],[lx,ly]],{c:C.line});g.save();g.translate(x,y);g.rotate(Math.PI/4);g.fillStyle=dead?C.red:C.accent;g.fillRect(-7,-7,14,14);g.restore();});
      server(lx,ly,{label:'Server '+n,w:104,h:52,a:a.a*(n==='B'?1-bGone*.7:1),s:a.s,st:dead?'fail':'ok',down:'REMOVED'});});
    let moved=0;
    KEYS.forEach((k,i)=>{const t0=31+i*.32,a=V(t,t0);if(a<=0)return;
      const o1=owner(k,['A','B','C']),o2=owner(k,['A','C']);const mv=o1!==o2;
      // walk to owner (initial)
      const w1=P(t,t0+.2,t0+.8);let d1=(SA[o1]-k+360)%360;
      const gd=k+d1*w1;if(w1>0&&w1<1)dot(...onR(gd),C.blue,4,.6);
      // reassignment walk
      if(mv&&t>36.3){const w2=P(t,36.3+i*.12,37.3+i*.12);const d2=(SA[o2]-SA[o1]+360)%360;if(w2>0&&w2<1)dot(...onR(SA[o1]+d2*w2),C.amber,4.5,.9);if(w2>=1)moved++;}
      const cur=mv&&t>=37.3+i*.12?o2:o1;
      dot(...onR(k),mv&&t>36.3?C.amber:C.blue,6.5,a);
      const[lx,ly]=onR(k,RR-38);tx(`k${i+1}→${cur}`,lx,ly,{z:12,wt:650,f:MONO,c:mv&&t>36.3?C.amber:C.text,a:a*clamp((t-t0-.8)*3)});
    });
    pill(`keys moved: ${moved} of 9`,840,440,{c:C.amber,a:V(t,36.5),z:14});
    pill('with hash % N: ~6 of 9 would move',840,478,{c:C.red,a:V(t,38.2),z:12});
  }
}});})();
