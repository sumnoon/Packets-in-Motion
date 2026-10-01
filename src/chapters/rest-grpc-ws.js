/* ---------------- 13. REST vs gRPC vs WEBSOCKETS ---------------- */
(function(){
  const Y=[150,300,450],CX=130,SX=860,cp=y=>[[CX+18,y],[SX-60,y]];
  const pushes=[19.2,20.3,20.8,22.1,23.5,24.2,25,27,28.1,29.4,30,31.5,32.8],sends=[21.3,24.6,28.8,32];
ch({id:'rest-grpc-ws',group:'Communication',title:'REST vs gRPC vs WebSockets',dur:34.5,
beats:[
[0,'REST: resources over HTTP + JSON','The client asks for a resource by URL (GET /users/7) and gets a JSON document back. One request, one response, readable text.'],
[8,'gRPC: compact binary calls','gRPC calls a function on another service using Protocol Buffers: small binary messages over HTTP/2. Many calls share one connection at the same time.'],
[16,'WebSockets: a line that stays open','After one handshake, the connection stays open and either side can send at any time. The server can push updates without being asked.'],
[26,'Side by side','REST: simple and cacheable, great for public APIs. gRPC: fast and typed, great between internal services. WebSockets: chat, games, live feeds.']],
use:['REST: public and web APIs, CRUD resources, anything that benefits from HTTP caching','gRPC: internal service-to-service calls, low latency, streaming, strict contracts','WebSockets: chat, multiplayer games, live dashboards, collaborative editing'],
cons:['REST: chatty (many round trips), over/under-fetching, verbose JSON','gRPC: not browser-native (needs a proxy), binary is hard to debug by eye','WebSockets: stateful connections are harder to load-balance and scale; must handle reconnects']
,draw(t){
  const act=[V(t,0,7.6)+V(t,26.2),V(t,8,15.6)+V(t,26.2),V(t,16,25.6)+V(t,26.2)].map(v=>.28+.72*clamp(v));
  ['REST','gRPC','WebSockets'].forEach((n,k)=>{const y=Y[k],a=act[k]*A(t,.2+k*.15).a;
    draw(0,0,{a},()=>{rr(40,y-62,920,124,16);g.fillStyle='rgba(19,27,43,.55)';g.fill();g.strokeStyle=C.line;g.lineWidth=1.2;g.stroke();});
    tx(n,58,y-42,{z:14,wt:750,al:'left',c:k===0?C.blue:k===1?C.accent:C.green,a});
    user(CX,y,{a,label:'client',r:14});server(SX,y,{label:'Server',a,w:120,h:56});
    if(k!==1)ln(cp(y),{a:a*.5});});
  // REST
  const a0=act[0];
  [[.5,7.2],[26.3,33.2]].forEach(([w0,w1])=>each(t,w0,w1,2.6,2.6,(i,s)=>{pk(t,s,1.2,cp(Y[0]),C.blue,{label:i===0?'GET /users/7':null,a:a0});pk(t,s+1.35,1.2,rev(cp(Y[0])),C.green,{r:9,a:a0,label:i===0?'{"id":7,"name":"Lin",…}':null});}));
  pill('JSON text · ~400 bytes · one request at a time',480,Y[0]+38,{c:C.blue,z:12,a:a0});
  // gRPC: one HTTP/2 connection
  const a1=act[1];draw(0,0,{a:a1},()=>{rr(CX+18,Y[1]-16,SX-60-CX-18,32,16);g.fillStyle=hexA(C.accent,.07);g.fill();g.strokeStyle=hexA(C.accent,.45);g.lineWidth=1.3;g.stroke();});
  [[8.3,15.5],[26.3,33.5]].forEach(([w0,w1])=>each(t,w0,w1,.3,1.8,(i,s)=>{const dy=(i%3-1)*9,p=[[CX+18,Y[1]+dy],[SX-60,Y[1]+dy]];pk(t,s,.8,p,C.blue,{r:4,a:a1,label:i===0?'GetUser(7)':null});pk(t,s+.85,.8,rev(p),C.green,{r:4,a:a1});}));
  pill('binary protobuf · ~60 bytes · many calls in parallel on ONE connection',480,Y[1]+38,{c:C.accent,z:12,a:a1});
  // WebSockets
  const a2=act[2],y2=Y[2];
  if(t>18.7)ln(cp(y2),{c:hexA(C.green,.55),w:5,a:a2*V(t,18.7)});
  pk(t,16.4,1.1,cp(y2),C.blue,{label:'HTTP Upgrade',a:a2});pk(t,17.6,1.1,rev(cp(y2)),C.green,{label:'101 Switching Protocols',a:a2});
  pushes.forEach((s,i)=>pk(t,s,1,rev(cp(y2)),C.green,{r:5.5,a:a2,label:i<2?'push: new message':null}));
  sends.forEach((s,i)=>pk(t,s,1,cp(y2),C.blue,{r:5.5,a:a2,label:i===0?'send':null}));
  pill('connection stays open · both sides talk anytime',480,y2+38,{c:C.green,z:12,a:a2*V(t,18.7)});
  // summary
  [['simple · cacheable · public APIs',C.blue],['fast · typed · service-to-service',C.accent],['real-time · two-way · stateful',C.green]].forEach(([s,c],k)=>pill(s,700,Y[k]-40,{c,z:12,a:V(t,26.6+k*.5)}));
}});})();
