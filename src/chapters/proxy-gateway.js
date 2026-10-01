/* ---------------- 4. REVERSE PROXIES & API GATEWAYS ---------------- */
(function(){
  const CL=[[95,170],[95,300],[95,430]],PX=[420,300],SV=[[790,170],[790,300],[790,430]];
ch({id:'proxy-gateway',group:'Traffic',title:'Reverse Proxies & API Gateways',dur:34,needs:['load-balancers'],related:['rate-limiting','microservices','cdn'],
beats:[
[0,'Without a proxy: every server is exposed','Clients connect straight to each server. Every server needs a public address, its own security and its own certificates.'],
[5,'Reverse proxy: one front door','A reverse proxy stands in front of the servers. Clients only ever see the proxy; the servers hide on a private network.'],
[9,'The proxy handles the chores','It decrypts HTTPS (TLS termination, the lock ring comes off), compresses responses, caches common answers (amber) and blocks bad traffic.'],
[15,'API gateway: route by path','An API gateway is a reverse proxy that understands your API. It sends /users, /orders and /pay to different services.'],
[23,'The gateway checks every request','It authenticates callers, enforces rate limits and logs each call. A request without a valid token is turned away at the door with 401.'],
[29.5,'Proxy vs gateway','A reverse proxy forwards and protects. A gateway adds API-level smarts on top. Tools like NGINX, Envoy or Kong often do both.']],
use:['Reverse proxy: any public site, for TLS in one place, compression, caching, hiding internal hosts','API gateway: many backend services behind one public API (mobile apps, microservices)','Central place for auth, rate limits, request logging and API versioning'],
cons:['One more network hop (usually around a millisecond)','Must be redundant, or it becomes the single point of failure','Gateways can grow into a bloated "god layer" if business logic creeps in'],
draw(t){
  const gw=t>15,phase0=t<5.4;
  const pxA=A(t,5,1e9);
  // private network region
  if(t>5){const a=V(t,5.6);draw(0,0,{a},()=>{g.setLineDash([6,6]);rr(690,95,200,410,18);g.strokeStyle=hexA(C.accent,.45);g.lineWidth=1.5;g.stroke();g.setLineDash([]);});
    tx('private network',790,82,{z:12,c:C.accent,a});}
  CL.forEach((c,i)=>user(c[0],c[1],{...A(t,.2+i*.12),label:['App','Browser','Partner'][i]}));
  const names=gw?['Users svc','Orders svc','Payments svc']:['Server 1','Server 2','Server 3'];
  SV.forEach((s,i)=>{const pub=t<5.4;server(s[0],s[1],{label:names[i],sub:pub?`203.0.113.${i+1}`:`10.0.0.${i+1}`,...A(t,.4+i*.12),w:120,col:pub?C.red:null,st:pub?'hot':'ok'});
    if(pub)pill('public',s[0]+80,s[1]-24,{c:C.red,z:10.5,a:V(t,.8,4.8)});});
  // direct mesh
  const mA=1-P(t,5,5.8);
  if(mA>0){CL.forEach(c=>SV.forEach(s=>ln([[c[0]+17,c[1]],[s[0]-60,s[1]]],{a:mA*.45})));
    each(t,.8,4.6,.35,1.2,(i,s)=>{const c=CL[i%3],sv=SV[(i*2+1)%3];pk(t,s,1.2,[[c[0]+17,c[1]],[sv[0]-60,sv[1]]],C.blue,{r:5,a:mA});});}
  // proxy links
  if(t>5){CL.forEach(c=>ln([[c[0]+17,c[1]],[PX[0]-70,PX[1]]],{a:pxA.a*.6}));SV.forEach(s=>ln([[PX[0]+70,PX[1]],[s[0]-60,s[1]]],{a:pxA.a*.6}));}
  box(PX[0],PX[1],{label:gw?'API Gateway':'Reverse Proxy',sub:gw?'auth · routing':'one public address',w:150,h:62,glow:true,...pxA,c:C.accent});
  // flows via proxy
  if(t>6){each(t,6.2,33.4,.9,1.8,(i,s)=>{
      const c=CL[i%3];
      if(s>24&&s<24.5||s>26.5&&s<27.2){return;}
      const toS=gw?(i%3):((i+1)%3),sv=SV[toS];
      const locked=s<15&&s>8.8;
      const cached=s>11&&s<14.5&&i%3===1;
      const lab=s>15?['/users','/orders','/pay'][toS]:null;
      pk(t,s,.9,[[c[0]+17,c[1]],[PX[0]-70,PX[1]]],C.blue,{r:5.5,lock:locked,label:lab});
      if(cached){pk(t,s+.95,.9,[[PX[0]-70,PX[1]],[c[0]+17,c[1]]],C.amber,{r:5.5});pop(t,s+.9,PX[0],PX[1]-44,'cached',C.amber,{z:12});}
      else pk(t,s+.9,.9,[[PX[0]+70,PX[1]],[sv[0]-60,sv[1]]],C.blue,{r:5.5,label:lab&&t>s+.9?lab:null});
    });}
  // rejected requests
  const bad=[[24.1,'no token','401'],[26.6,'bad token','401']];
  if(t>23)bad.forEach(([s,l,code],i)=>{const c=CL[i*2];const p=pk(t,s,.9,[[c[0]+17,c[1]],[PX[0]-70,PX[1]]],C.blue,{r:6,label:l});
    if(t>s+.9){pk(t,s+.9,.9,[[PX[0]-70,PX[1]],[c[0]+17,c[1]]],C.red,{r:6,label:code});ring(t,s+.9,PX[0]-70,PX[1],C.red,24);}});
  // chores / checklist
  const chores=[['🔒 TLS termination',9.4],['compression',10.4],['caching',11.4],['blocks bad traffic',12.4]];
  const checks=[['✓ auth token',23.3],['✓ rate limit',23.8],['✓ route by path',24.3],['✓ log every call',24.8]];
  if(t<15.3)chores.forEach(([s,t0],i)=>pill(s,PX[0],372+i*33,{c:i===2?C.amber:C.accent,a:V(t,t0,14.8),z:12.5}));
  if(t>22.8&&t<29.5)checks.forEach(([s,t0],i)=>pill(s,PX[0],372+i*33,{c:C.green,a:V(t,t0,29.2),z:12.5}));
  if(t>9&&t<14.8)tx('🔒 encrypted until the proxy',PX[0],228,{z:12,c:C.accent,a:V(t,9.4,14.5)});
  if(t>29.5){pill('Reverse proxy: forward · hide servers · TLS · cache',PX[0]+60,492,{c:C.accent,a:V(t,29.8),z:13});
    pill('API gateway: + auth · rate limits · routing by API · metrics',PX[0]+60,528,{c:C.green,a:V(t,30.8),z:13});}
}});})();
