/* ---------------- S3. GEOSPATIAL INDEXES: GEOHASH & QUADTREES ---------------- */
(function(){
const MX=270,MY=80,MW=460,MH=440,X=u=>MX+u*MW,Y=v=>MY+v*MH;
// 160 drivers: most downtown, the rest spread out (fixed, so every frame matches)
const PTS=Array.from({length:160},(_,i)=>{const r=rnd(i+7),a=rnd(i+301)*6.283;
  if(i<100){const d=.03+.2*Math.pow(r,1.4);return[clamp(.62+Math.cos(a)*d,.02,.98),clamp(.36+Math.sin(a)*d*1.1,.02,.98)];}
  return[.03+rnd(i+51)*.94,.03+rnd(i+91)*.94];});
const RIDER=[.555,.47];
const B32='0123456789bcdefghjkmnpqrstuvwxyz';
const cell1=[Math.floor(RIDER[0]*4),Math.floor(RIDER[1]*4)];                       // the rider's coarse cell
const code1=(cx,cy)=>'9q'+B32[cy*4+cx];
const FINE=.25/4,cell2=[Math.floor(RIDER[0]/FINE),Math.floor(RIDER[1]/FINE)];           // the rider's fine cell (16×16 grid)
const inNine=([u,v])=>Math.abs(Math.floor(u/FINE)-cell2[0])<=1&&Math.abs(Math.floor(v/FINE)-cell2[1])<=1;
const NEAR=PTS.filter(inNine),BEST=NEAR.reduce((b,p)=>Math.hypot(p[0]-RIDER[0],p[1]-RIDER[1])<Math.hypot(b[0]-RIDER[0],b[1]-RIDER[1])?p:b,NEAR[0]||PTS[0]);
// quadtree: split any square holding more than 6 drivers (up to 5 levels deep)
const QT=[];(function split(x,y,s,d,pts){QT.push({x,y,s,d});if(pts.length<=6||d>=5)return;const h=s/2;
  [[0,0],[1,0],[0,1],[1,1]].forEach(([i,j])=>split(x+i*h,y+j*h,h,d+1,pts.filter(([u,v])=>u>=x+i*h&&u<x+(i+1)*h&&v>=y+j*h&&v<y+(j+1)*h)));})(0,0,1,0,PTS);
ch({id:'geo',group:'Storage & Search',title:'Geospatial Indexes: Geohash & Quadtrees',dur:36,needs:['indexing'],related:['search','sharding','hot-keys'],
beats:[
[0,'Who is nearby?','A rider wants the closest drivers. Measuring the distance to every driver in the city, on every request, does not scale.'],
[5,'Cut the map into cells','Lay a grid over the map. Each cell gets a short code, and each driver is stored under the code of the cell they are in.'],
[11,'Geohash: cells inside cells','Split a cell again and add a character to its code. Codes that share a prefix are close together, so an ordinary index on the code finds a whole area.'],
[18,'Search the cell and its neighbours','The closest driver may sit just over a cell edge, so look in the rider\'s cell and the eight around it, then rank the few drivers found.'],
[25,'Quadtree: split where it is busy','A quadtree splits a square into four only when it holds too many drivers. Downtown ends up with tiny cells; the suburbs stay coarse.'],
[31,'A few cells instead of every driver','Either way, the server reads a handful of small cells and ranks a dozen drivers instead of the whole city.']],
use:['Ride hailing, food delivery, "stores near me", dating apps','Any query for points inside a radius or a box','Sharding location data by cell code'],
cons:['Cells are not circles: always check neighbours and then measure real distance','Dense areas overload one cell; quadtrees or finer cells fix that','Moving points (drivers) must be re-indexed as they cross cells'],
draw(t){
  const ma=V(t,.2);if(ma<=0)return;
  draw(0,0,{a:ma},()=>{rr(MX,MY,MW,MH,14);g.fillStyle='#0d1424';g.fill();g.strokeStyle=C.line;g.lineWidth=1.5;g.stroke();
    g.strokeStyle=hexA(C.edge,.25);g.lineWidth=6;g.beginPath();g.moveTo(X(0),Y(.55));g.bezierCurveTo(X(.3),Y(.5),X(.5),Y(.7),X(1),Y(.62));g.moveTo(X(.45),Y(0));g.bezierCurveTo(X(.5),Y(.35),X(.4),Y(.7),X(.48),Y(1));g.stroke();});
  tx('downtown',X(.72),Y(.08),{z:12,c:C.dim,a:ma*V(t,1.4,25)});
  const nine=t>=18.4&&t<25.4,quad=V(t,25.4);
  PTS.forEach((p,i)=>{const hot=nine&&inNine(p),best=nine&&p===BEST&&t>21;dot(X(p[0]),Y(p[1]),best?C.green:hot?C.amber:hexA(C.amber,.55),best?5.5:hot?4:2.8,ma*V(t,.3+i*.008)*(nine&&!hot?.35:1));});
  user(X(RIDER[0]),Y(RIDER[1]),{label:'rider',r:13,...A(t,1.6)});
  // 1. distance to every driver
  if(t>2.2&&t<5.6){const a=V(t,2.2,5.4);PTS.forEach((p,i)=>{if(i%3===0)ln([[X(RIDER[0]),Y(RIDER[1])],[X(p[0]),Y(p[1])]],{c:hexA(C.red,.35),w:1,a:a*clamp((t-2.2)*2-i/80)});});
    pill('160 distance checks per request… for 50,000 drivers?',W/2,544,{c:C.red,z:12.5,a});}
  // 2. coarse grid with codes
  const ga=V(t,5.2,25.2);if(ga>0){for(let i=1;i<4;i++){ln([[X(i/4),Y(0)],[X(i/4),Y(1)]],{c:hexA(C.blue,.5),a:ga});ln([[X(0),Y(i/4)],[X(1),Y(i/4)]],{c:hexA(C.blue,.5),a:ga});}
    for(let cy=0;cy<4;cy++)for(let cx=0;cx<4;cx++){const me=cx===cell1[0]&&cy===cell1[1];tx(code1(cx,cy),X(cx/4)+8,Y(cy/4)+14,{z:12,wt:700,f:MONO,al:'left',c:me&&t>8?C.accent:hexA(C.blue,.9),a:ga*V(t,6+(cy*4+cx)*.08)});}
    if(t>8&&t<11)pill(`rider is in cell ${code1(...cell1)}`,W/2,544,{c:C.accent,z:12.5,f:MONO,a:V(t,8,10.8)});}
  // 3. the rider's cell, split again
  const fa=V(t,11.2,25.2);if(fa>0){const x0=cell1[0]/4,y0=cell1[1]/4;g.save();g.globalAlpha=fa;rr(X(x0),Y(y0),MW/4,MH/4,4);g.strokeStyle=C.accent;g.lineWidth=2.5;g.stroke();g.restore();
    for(let i=1;i<4;i++){ln([[X(x0+i*FINE),Y(y0)],[X(x0+i*FINE),Y(y0+.25)]],{c:hexA(C.accent,.6),a:fa});ln([[X(x0),Y(y0+i*FINE)],[X(x0+.25),Y(y0+i*FINE)]],{c:hexA(C.accent,.6),a:fa});}
    const fine=code1(...cell1)+B32[(cell2[1]-cell1[1]*4)*4+(cell2[0]-cell1[0]*4)];
    if(t>12.4&&t<18.4){pill(`finer cell: ${fine}`,W/2-90,544,{c:C.accent,z:12.5,f:MONO,a:V(t,12.4,18.2)});pill(`same prefix ${code1(...cell1)} → close together`,W/2+130,544,{c:C.green,z:12.5,f:MONO,a:V(t,13.4,18.2)});}}
  // 4. nine fine cells around the rider
  if(nine){const a=V(t,18.4,25.2);g.save();g.globalAlpha=a;g.setLineDash([5,4]);rr(X((cell2[0]-1)*FINE),Y((cell2[1]-1)*FINE),MW*FINE*3,MH*FINE*3,6);g.strokeStyle=C.green;g.lineWidth=2.5;g.stroke();g.restore();
    if(t>21)ln([[X(RIDER[0]),Y(RIDER[1])],[X(BEST[0]),Y(BEST[1])]],{c:C.green,w:2.5,a:V(t,21),p:P(t,21,21.6)});
    pill(`9 cells → ${NEAR.length} drivers to rank, not 160`,W/2,544,{c:C.green,z:12.5,a:V(t,19.4,25.2)});}
  // 5. quadtree
  if(quad>0){QT.forEach(q=>{if(!q.d)return;const a=quad*V(t,25.6+q.d*.7);if(a<=0)return;g.save();g.globalAlpha=a*.85;g.strokeStyle=q.d>=4?C.accent:hexA(C.blue,.75);g.lineWidth=q.d>=4?1:1.5;g.strokeRect(X(q.x),Y(q.y),q.s*MW,q.s*MH);g.restore();});
    if(t>28.6&&t<31.4){pill('downtown: small squares',X(.75),Y(.03)-18,{c:C.accent,z:12,a:V(t,28.6,31.2)});pill('suburbs: one big square',X(.18),Y(.97)+18,{c:C.blue,z:12,a:V(t,29.2,31.2)});}}
  if(t>31.2)pill('read a few cells, rank a dozen drivers: done in milliseconds',W/2,544,{c:C.green,z:12.5,a:V(t,31.4)});
}});})();
