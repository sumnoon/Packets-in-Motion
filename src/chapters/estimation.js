/* ---------------- 2c. BACK-OF-THE-ENVELOPE ESTIMATION ---------------- */
(function(){
const NX=50,NY=96,NW=410;
// the envelope: [appears at, the sum, the answer, colour]
const LINES=[[6.6,'10 M users × 50 views','= 500 M views a day',C.accent],[8.4,'÷ ~100,000 s in a day','(86,400, rounded up)',C.dim],[10.2,'≈ 5,000 reads / s','the average QPS',C.green],
  [13.6,'× 3 for the evening peak','≈ 15,000 reads / s',C.green],[19.6,'10 M uploads × 500 KB','= 5 TB a day',C.amber],[21.6,'× 365','≈ 1.8 PB a year',C.amber],[26.6,'15,000 / s × 500 KB','≈ 7.5 GB / s at peak',C.blue]];
// requests per second through one day, 0–1; the evening peak is ~2.5× the average
const day=h=>.3+.18*Math.sin((h-10)/24*2*Math.PI)+.6*Math.exp(-Math.pow((h-20.5)/2.4,2));
const AVG=(()=>{let s=0;for(let h=0;h<24;h+=.1)s+=day(h);return s/240;})();
ch({id:'estimation',group:'Foundations',title:'Back-of-the-Envelope Estimation',dur:36,needs:['scaling'],related:['caching','cdn','sharding'],
beats:[
[0,'Estimate before you build','How big will this be? A few multiplications answer it well enough to choose a design. Let\'s size a photo app with 10 million daily users.'],
[6,'Requests per second','10 M users × 50 views = 500 M views a day. A day has about 100,000 seconds, so that is about 5,000 requests per second (QPS) on average.'],
[13,'Plan for the peak','Traffic is not flat. Evenings run two to three times the average, so plan for about 15,000 reads per second.'],
[19,'Storage adds up','10 M uploads a day × 500 KB = 5 TB a day, about 1.8 PB a year. That calls for object storage, not one database.'],
[26,'Bandwidth','15,000 photos a second × 500 KB is about 7.5 GB a second at peak. No single origin should serve that: put a CDN in front.'],
[31,'Round numbers, right decisions','Being within a factor of two is plenty. The goal is to spot which part needs a cache, a CDN or sharding before you build it.']],
use:['Before a design review or interview: size reads, writes, storage and bandwidth','Checking whether one machine is enough, or you need many','Spotting the part of a system that will hit a limit first'],
cons:['Round numbers hide detail: a 2× error is normal, so leave headroom','Averages hide peaks and hot spots: always ask about the busiest minute','An estimate is a starting point; measure once real traffic arrives'],
draw(t){
  // the app being sized
  const ia=A(t,.3,5.8);if(ia.a>0){box(250,230,{label:'Photo app',sub:'view · upload',w:170,h:64,...ia});
    [['10 M daily users',1.2],['50 photo views each a day',2],['1 upload each a day',2.8],['500 KB per photo',3.6]].forEach(([s,t0],k)=>pill(s,250,310+k*42,{c:C.blue,z:13,a:ia.a*V(t,t0)}));}
  // the envelope
  const na=V(t,6.2);if(na>0){panel(NX,NY,NW,LINES.length*54+26,{a:na});tx('the envelope',NX+16,NY-14,{z:12,c:C.dim,al:'left',a:na});
    LINES.forEach(([t0,a,b,c],i)=>{const v=V(t,t0);if(v<=0)return;const y=NY+30+i*54;tx(a,NX+20,y,{z:14,f:MONO,al:'left',a:v});tx(b,NX+20,y+21,{z:14,f:MONO,wt:750,al:'left',c,a:v});});}
  // 1. a hundred dots, each 100,000 people, all asking for photos
  const p1=V(t,.2,12.8);
  if(p1>0){const GX=k=>575+(k%10)*20,GY=k=>110+Math.floor(k/10)*20;
    for(let k=0;k<100;k++){const a=V(t,.3+k*.025,12.8);if(a>0)dot(GX(k),GY(k),C.blue,3.2,a);}
    tx('10 M daily users',665,330,{z:15,wt:700,a:V(t,2.6,12.8)});tx('each dot = 100,000 people',665,352,{z:12,c:C.dim,a:V(t,3,12.8)});
    server(880,220,{label:'Photos',sub:'app',w:112,...A(t,4,12.8)});
    each(t,6.5,12.3,.09,.7,(i,s)=>{const k=(i*37)%100;pk(t,s,.7,[[GX(k),GY(k)],[824,220]],C.blue,{r:3});});
    if(t>10.2)pill('≈ 5,000 requests / s',880,282,{c:C.green,z:13,a:V(t,10.2,12.8)});}
  // 2. one day of traffic: average versus peak
  const p2=V(t,13.2,18.8);
  if(p2>0){const X=h=>520+h/24*430,Y=v=>330-v*190,top=AVG*3;
    tx('requests per second through one day',735,96,{z:12,c:C.dim,a:p2});
    ln([[520,330],[950,330]],{c:C.line,a:p2});[['0:00',0,'left'],['12:00',12,'center'],['24:00',24,'right']].forEach(([s,h,al])=>tx(s,X(h),348,{z:11,c:C.dim,al,a:p2}));
    const pd=P(t,13.4,15.4);g.save();g.globalAlpha=p2;g.beginPath();for(let h=0;h<=24*pd;h+=.25){const x=X(h),y=Y(day(h)/top);h?g.lineTo(x,y):g.moveTo(x,y);}g.strokeStyle=C.blue;g.lineWidth=2.5;g.stroke();g.restore();
    const ay=Y(AVG/top);ln([[520,ay],[950,ay]],{c:C.green,dash:[5,6],a:p2*V(t,15.4)});tx('average ≈ 5,000/s',948,ay+14,{z:12,c:C.green,al:'right',a:p2*V(t,15.4)});
    ln([[520,Y(1)],[950,Y(1)]],{c:C.amber,dash:[5,6],a:p2*V(t,16.4)});tx('plan for 3× ≈ 15,000/s',948,Y(1)-10,{z:12,c:C.amber,al:'right',a:p2*V(t,16.4)});
    if(t>15.8)ring(t,15.8,X(20.5),Y(day(20.5)/top),C.amber,26);}
  // 3. storage: five terabytes a day, every day
  const p3=V(t,19.2,25.8);
  if(p3>0){const n=Math.max(1,Math.ceil(P(t,19.6,24.4)*12));
    for(let k=0;k<n;k++)db(605+(k%4)*90,150+Math.floor(k/4)*84,{label:'5 TB',w:62,h:48,col:C.amber,a:p3*V(t,19.6+k*.36)});
    const days=Math.round(lerp(1,365,P(t,21.6,24.8)));tx(`day ${days}: ${(days*5).toLocaleString()} TB`,740,428,{z:17,wt:750,f:MONO,c:C.amber,a:p3});
    pill('→ object storage, not one database',740,470,{c:C.accent,z:12.5,a:p3*V(t,23.6)});}
  // 4. bandwidth: one origin cannot serve it, a CDN can
  const p4=V(t,26.2,30.8);
  if(p4>0){server(560,300,{label:'Origin',w:110,a:p4});for(let k=0;k<5;k++)user(935,200+k*50,{r:11,a:p4});
    const cdn=V(t,28.4,30.8);ln([[616,300],[910,300]],{c:hexA(C.blue,.45),w:lerp(18,3,cdn),a:p4});
    each(t,26.4,30.6,.06,.6,(i,s)=>{const k=i%5;pk(t,s,.6,[[616,300],[760,300],[922,200+k*50]],C.blue,{r:3.5,a:p4});});
    if(t<28.6)pill('7.5 GB/s from one origin?',760,250,{c:C.red,z:12.5,a:p4*V(t,26.8,28.4)});
    box(760,300,{label:'CDN',sub:'edge caches',c:C.amber,w:110,h:52,a:p4*cdn});pill('the origin only sends misses',640,380,{c:C.green,z:12,a:p4*V(t,29)});}
  // 5. what the numbers decided
  const p5=V(t,31.2);
  if(p5>0)[['15,000 reads / s','→ cache + read replicas',C.green],['5 TB a day','→ object storage',C.amber],['7.5 GB / s','→ CDN in front',C.blue]].forEach(([a,b,c],k)=>{const y=160+k*112,v=V(t,31.3+k*.5);
    plate(735,y,400,86,{c,a:v});tx(a,735,y-15,{z:20,wt:800,f:MONO,c,a:v});tx(b,735,y+17,{z:14,a:v});});
}});})();
