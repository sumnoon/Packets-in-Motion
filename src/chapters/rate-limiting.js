/* ---------------- 6. RATE LIMITING ---------------- */
(function(){
  // token bucket simulation
  const CAP=5,RATE=1,TB0=3.2;
  const tbReq=[5.4,...Array.from({length:8},(_,i)=>8.6+i*.22),...Array.from({length:8},(_,i)=>13.3+i*.72)];
  const TB=[];{let tok=0,last=TB0;tbReq.forEach(s=>{const a=s+1;tok=Math.min(CAP,tok+(a-last)*RATE);last=a;const ok=tok>=1;if(ok)tok-=1;TB.push({s,a,ok});});}
  const tokensAt=t=>{if(t<TB0)return 0;let tok=0,last=TB0;for(const r of TB){if(r.a>t)break;tok=Math.min(CAP,tok+(r.a-last)*RATE);last=r.a;if(r.ok)tok-=1;}return Math.min(CAP,tok+(t-last)*RATE);};
  // leaky bucket simulation
  const LCAP=4,LEAK=1.05;
  const lbReq=[20.3,21.5,22.7,24.9,25.1,25.3,25.5,25.7,25.9,26.1,26.3,28.8,30,31.2,31.4,31.6,33.2];
  const LB=[];{let lastD=0;lbReq.forEach(s=>{const a=s+1;const inQ=LB.filter(q=>q.ok&&q.dep>a).length;if(inQ>=LCAP){LB.push({s,a,ok:false});return;}const dep=Math.max(a+.35,lastD)+LEAK;lastD=dep;LB.push({s,a,ok:true,dep});});}
  const X0=180,X1=900;
ch({id:'rate-limiting',group:'Traffic',title:'Rate Limiting: Token Bucket & Leaky Bucket',dur:38.5,
beats:[
[0,'Why limit?','Without limits, one noisy client, or an attack, can flood a server and ruin it for everyone. A rate limiter decides which requests get in.'],
[3,'Token bucket: tokens drip in','The bucket holds up to 5 tokens and gains 1 token per second. Every request must take a token to pass.'],
[8.4,'A burst: spend saved tokens','A burst arrives. Saved-up tokens let the first 5 straight through. Once the bucket is empty, the rest get "429 Too Many Requests".'],
[13.2,'Then back to the refill rate','After the burst, requests only pass as fast as tokens refill. Token bucket allows short bursts but caps the average rate.'],
[19.5,'Leaky bucket: a steady drip out','Requests pour into a queue (amber) and leak out to the server at a fixed pace, however spiky the input is.'],
[24.8,'Overflow is dropped','When a burst fills the queue, extra requests spill over and are rejected. The server still sees a smooth stream.'],
[31,'Bursty in, smooth out','Compare the two timelines: arrivals come in clumps, but departures are evenly spaced.']],
use:['Public APIs: protect shared capacity per user, per key or per IP','Token bucket: allow short bursts (page loads, batch uploads) while capping the average rate','Leaky bucket: feed a downstream system that needs a steady, predictable rate'],
cons:['Limits that are too tight hurt real users, and too loose ones don\'t protect','Across many servers, counters need shared storage (e.g. Redis) or you get approximate limits','Leaky bucket adds queueing delay; token bucket lets bursts through by design']
,draw(t){
  const tl=(y,label,a0,a1,a)=>{tx(label,X0-14,y,{z:12,c:C.dim,al:'right',a});ln([[X0,y],[X1,y]],{a:a*.8});};
  const tX=(s,a0,a1)=>X0+(s-a0)/(a1-a0)*(X1-X0);
  if(t<19.6){const fa=A(t,.2,19).a;
    user(90,290,{label:'Client',a:fa});server(840,290,{label:'API server',a:fa,w:124});
    ln([[108,290],[778,290]],{a:fa*.5});
    // gate + bucket
    const ba=A(t,3);const BX=420;
    draw(BX,0,ba,()=>{g.strokeStyle=C.accent;g.lineWidth=2.5;g.beginPath();g.moveTo(-82,110);g.lineTo(-72,200);g.lineTo(72,200);g.lineTo(82,110);g.stroke();
      rr(-10,210,20,64,6);g.fillStyle=hexA(C.accent,.25);g.fill();g.strokeStyle=C.accent;g.lineWidth=1.5;g.stroke();});
    if(ba.a>0){tx('gate',BX,318,{z:11.5,c:C.accent,a:ba.a});
      const tok=tokensAt(t),full=Math.floor(tok+1e-6),fr=tok-full;
      for(let k=0;k<CAP;k++){const x=BX-52+k*26;if(k<full)dot(x,183,C.accent,9.5,ba.a);else{g.save();g.globalAlpha=ba.a*.5;g.strokeStyle=C.line;g.lineWidth=1.5;g.beginPath();g.arc(x,183,9.5,0,7);g.stroke();g.restore();}}
      if(full<CAP&&t>TB0)dot(BX-52+full*26,lerp(88,183,eio(fr)),C.accent,9.5*Math.max(.35,fr),ba.a*Math.max(.3,fr));
      tx(`tokens: ${full} / ${CAP}`,BX-100,160,{z:13,wt:650,c:C.accent,a:ba.a,f:MONO,al:'right'});
      pill('+1 token / sec',BX+170,140,{c:C.accent,z:12,a:ba.a});}
    // requests
    let pass=0,rej=0;
    TB.forEach(r=>{const toG=[[108,290],[BX-14,290]];pk(t,r.s,1,toG,C.blue,{r:5.5});
      if(t>=r.a){if(r.ok){pass++;ring(t,r.a,BX,290,C.accent,18);pk(t,r.a,1,[[BX+14,290],[778,290]],C.blue,{r:5.5});}
        else{rej++;drop(t,r.a,BX-14,290,{label:false,dx:-40});pop(t,r.a,BX-40,320,'429',C.red,{z:13});}}});
    // timelines
    const ta=V(t,3.4,19);tl(440,'arrivals',0,0,ta);tl(484,'passed',0,0,ta);
    TB.forEach(r=>{if(t<r.a)return;const x=tX(r.a,3,19.5);g.save();g.globalAlpha=ta;g.fillStyle=r.ok?C.blue:C.red;g.fillRect(x-1.5,430,3,20);if(r.ok){g.fillStyle=C.green;g.fillRect(x-1.5,474,3,20);}g.restore();});
    if(t>3.4&&t<19.5){const x=tX(t,3,19.5);ln([[x,420],[x,500]],{c:hexA(C.text,.35),w:1,a:ta});}
    pill(`passed ${pass}`,730,528,{c:C.green,z:12,a:V(t,5.8,19)});pill(`rejected ${rej}`,840,528,{c:C.red,z:12,a:V(t,9.4,19)});
  }else{
    // ===== leaky bucket =====
    const fa=A(t,19.6).a,BX=420;
    user(90,200,{label:'Client',a:fa});server(840,330,{label:'API server',a:fa,w:124});
    const ba=A(t,19.8);
    draw(BX,0,ba,()=>{g.strokeStyle=C.amber;g.lineWidth=2.5;g.beginPath();g.moveTo(-60,140);g.lineTo(-52,270);g.lineTo(-8,270);g.moveTo(8,270);g.lineTo(52,270);g.lineTo(60,140);g.stroke();});
    tx(`queue (max ${LCAP})`,BX,124,{z:12,c:C.amber,a:ba.a});
    ln([[BX,272],[BX,330],[778,330]],{a:fa*.5});
    pill('leaks 1 per second',BX+110,300,{c:C.amber,z:12,a:ba.a});
    ln([[108,200],[BX-70,150]],{a:fa*.4});
    let drops=0;
    LB.forEach((r,i)=>{pk(t,r.s,1,[[108,200],[BX-8,138]],C.blue,{r:5.5});
      if(t<r.a)return;
      if(!r.ok){drops++;const p=clamp((t-r.a)/1.1);if(p<1){dot(BX+lerp(0,110,p),138+90*p*p,C.red,5.5,1-p);}pop(t,r.a,BX+80,118,'overflow',C.red,{z:12,d:1.2});return;}
      if(t<r.dep){let slot=0;LB.forEach((q,j)=>{if(j<i&&q.ok&&q.dep>r.a&&t<q.dep+.0)slot+=clamp((q.dep-t)/.35);});
        const target=[BX,255-slot*28],fall=clamp((t-r.a)/.45);const pos=L2([BX,140],target,eio(fall));dot(pos[0],pos[1],C.amber,8,1);}
      else pk(t,r.dep,1.4,[[BX,262],[BX,330],[778,330]],C.blue,{r:5.5});
    });
    const ta=V(t,20);tl(440,'arrivals',0,0,ta);tl(484,'to server',0,0,ta);
    LB.forEach(r=>{g.save();g.globalAlpha=ta;if(t>=r.a){const x=tX(r.a,19.5,38);g.fillStyle=r.ok?C.blue:C.red;g.fillRect(x-1.5,430,3,20);}
      if(r.ok&&t>=r.dep){const x=tX(r.dep,19.5,38);g.fillStyle=C.green;g.fillRect(x-1.5,474,3,20);}g.restore();});
    if(t<38){const x=tX(t,19.5,38);ln([[x,420],[x,500]],{c:hexA(C.text,.35),w:1,a:ta});}
    pill(`dropped ${drops}`,840,528,{c:C.red,z:12,a:V(t,25.8)});
    if(t>31){tx('spiky',912,440,{z:13,wt:700,al:'left',c:C.blue,a:V(t,31.3)});tx('even',912,484,{z:13,wt:700,al:'left',c:C.green,a:V(t,31.8)});}
  }
}});})();
