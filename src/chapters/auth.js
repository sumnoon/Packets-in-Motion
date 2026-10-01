/* ---------------- 4b. AUTHENTICATION: SESSIONS, JWTs & OAUTH ---------------- */
(function(){
const U=[110,300],SV=[470,300],ST=[820,300];                       // browser, server, session store
const SVS=[160,300,440].map(y=>[560,y]),BOT=[110,470];              // JWT: three servers, a thief
const OA={u:[110,330],app:[440,330],idp:[800,190],api:[800,450]};  // OAuth: you, the app, the provider, the API
const toS=[[U[0]+20,U[1]],[SV[0]-58,SV[1]]],toStore=[[SV[0]+58,SV[1]],[ST[0]-50,ST[1]]];
ch({id:'auth',group:'Traffic',title:'Authentication: Sessions, JWTs & OAuth',dur:38,needs:['sessions'],related:['proxy-gateway','microservices','rate-limiting'],
beats:[
[0,'Who is asking?','HTTP remembers nothing between requests, so every request must carry proof of who sent it, and the server checks it every time.'],
[5,'Session cookie','Log in once: the server stores a session and gives the browser a random id in a cookie. Each request sends the cookie, and the server looks it up.'],
[13,'JWT: a signed token','Instead of a lookup, the server signs a token that holds the user id and an expiry. Any server can check the signature without asking a database.'],
[21,'The catch: you cannot take it back','A JWT stays valid until it expires, even after logout or theft. Keep JWTs short-lived and use a refresh token to get new ones.'],
[27,'OAuth: log in through someone else','The app sends you to an identity provider. You approve there, and the app receives an access token. Your password never reaches the app.'],
[34,'Pick by situation','One web app: session cookies. Many services checking identity: short-lived JWTs. Third-party login or API access: OAuth.']],
use:['Session cookies: classic web apps, instant logout, admin tools','JWTs: many services or regions verifying identity without a shared store','OAuth: "log in with…" buttons and letting one app use another\'s API on your behalf'],
cons:['Sessions need a shared store that every server can reach','JWTs cannot be revoked early without a blocklist, and they grow with every claim','OAuth adds redirects, token storage and expiry handling: use a well-tested library'],
draw(t){
  // ---- 1. sessions
  const p1=V(t,.2,12.6);
  if(p1>0){user(U[0],U[1],{label:'browser',r:18,a:p1});server(SV[0],SV[1],{label:'Server',w:116,a:p1});db(ST[0],ST[1],{label:'Sessions',sub:'store',w:104,h:84,a:p1*V(t,5.4)});
    ln(toS,{a:p1*.4});ln(toStore,{a:p1*.4*V(t,5.4)});
    each(t,1,4.2,1.1,1.6,(i,s)=>{pk(t,s,.8,toS,C.blue,{label:i===1?'GET /orders · who am I?':null,a:p1});pk(t,s+.8,.7,rev(toS),C.red,{r:4.5,label:i===1?'401: log in first':null,a:p1});});
    pk(t,5.6,1.1,toS,C.blue,{label:'POST /login · password',a:p1});pk(t,6.8,.8,toStore,C.amber,{label:'save session 8f3a',a:p1});
    pk(t,7.8,1.1,rev(toS),C.green,{label:'Set-Cookie: sid=8f3a',a:p1});
    if(t>8.9)pill('cookie sid=8f3a',U[0],U[1]-48,{c:C.amber,z:12,f:MONO,a:p1*V(t,8.9)});
    each(t,9.4,12,1.2,2.8,(i,s)=>{pk(t,s,.7,toS,C.blue,{label:i===0?'GET /orders + cookie':null,a:p1});pk(t,s+.7,.5,toStore,C.amber,{r:4,a:p1});pk(t,s+1.2,.5,rev(toStore),C.amber,{r:4,label:i===0?'8f3a → user 42':null,a:p1});pk(t,s+1.7,.7,rev(toS),C.green,{r:4.5,a:p1});});}
  // ---- 2. JWT: signed, checked anywhere, and impossible to recall
  const p2=V(t,13,26.6);
  if(p2>0){user(U[0],U[1],{label:'browser',r:18,a:p2});SVS.forEach((p,k)=>server(p[0],p[1],{label:`Server ${'ABC'[k]}`,sub:'has the key',w:122,a:p2*V(t,13.2+k*.2)}));
    // the token
    draw(805,300,{a:p2*V(t,13.6)},()=>{rr(-150,-92,300,184,12);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.edge;g.lineWidth=1.5;g.stroke();
      tx('JWT',-134,-70,{z:12,wt:800,c:C.dim,al:'left'});
      [['header','{alg: "HS256"}',C.red],['payload','{user: 42, exp: 10:15}',C.accent],['signature','x9Kq…  (secret key)',C.blue]].forEach(([k,v,c],i)=>{tx(k,-134,-36+i*42,{z:11.5,c:C.dim,al:'left'});tx(v,-134,-18+i*42,{z:13,f:MONO,wt:700,c,al:'left'});});});
    const toK=k=>[[U[0]+20,U[1]],[SVS[k][0]-61,SVS[k][1]]];
    each(t,14.4,20.6,.9,1.6,(i,s)=>{const k=(i*2+1)%3;pk(t,s,.8,toK(k),C.blue,{label:i===0?'request + JWT':null,a:p2});pop(t,s+.85,SVS[k][0],SVS[k][1]-44,'signature ✓',C.green,{z:12,d:.9});pk(t,s+.9,.7,rev(toK(k)),C.green,{r:4.5,a:p2});});
    if(t>15.6&&t<21)pill('no session store: every server checks the signature itself',W/2-60,520,{c:C.green,z:12.5,a:p2*V(t,15.6,20.8)});
    // logout does not help; a stolen token keeps working
    if(t>21.2)pill('logged out at 10:02',U[0],U[1]-48,{c:C.dim,z:12,a:p2*V(t,21.2)});
    user(BOT[0],BOT[1],{label:'thief',c:C.red,r:15,a:p2*V(t,22)});
    const thief=[[BOT[0]+18,BOT[1]],[SVS[2][0]-61,SVS[2][1]]];pk(t,22.6,1,thief,C.red,{label:'stolen JWT',a:p2});pop(t,23.7,SVS[2][0],SVS[2][1]-44,'signature ✓',C.amber,{z:12,d:1.2});
    if(t>23.9)pill('still valid until 10:15',SVS[2][0]+20,SVS[2][1]+50,{c:C.red,z:12,a:p2*V(t,23.9)});
    if(t>24.8)pill('fix: 5-minute JWTs + a refresh token to get new ones',W/2-60,520,{c:C.accent,z:12.5,a:p2*V(t,24.8)});}
  // ---- 3. OAuth
  const p3=V(t,26.8,33.8);
  if(p3>0){user(OA.u[0],OA.u[1],{label:'you',r:18,a:p3});server(OA.app[0],OA.app[1],{label:'Print shop',sub:'the app',w:126,a:p3});
    box(OA.idp[0],OA.idp[1],{label:'Identity provider',sub:'knows your password',w:176,h:58,a:p3});box(OA.api[0],OA.api[1],{label:'Photos API',sub:'your photos',w:150,h:56,c:C.blue,a:p3});
    const u2i=[[OA.u[0]+18,OA.u[1]-10],[OA.idp[0]-88,OA.idp[1]]],a2i=[[OA.app[0]+63,OA.app[1]-14],[OA.idp[0]-88,OA.idp[1]+18]],a2p=[[OA.app[0]+63,OA.app[1]+10],[OA.api[0]-75,OA.api[1]]];
    pk(t,27.2,.9,[[OA.u[0]+18,OA.u[1]],[OA.app[0]-63,OA.app[1]]],C.blue,{label:'① log in with…',a:p3});
    pk(t,28.2,1,u2i,C.blue,{label:'② sign in + approve "read photos"',a:p3});
    pk(t,29.3,1,[[OA.idp[0]-88,OA.idp[1]+8],[OA.app[0]+63,OA.app[1]-24]],C.amber,{label:'③ one-time code',a:p3});
    pk(t,30.4,.8,a2i,C.amber,{r:5,a:p3});pk(t,31.2,.8,rev(a2i),C.green,{label:'④ access token',a:p3});
    pk(t,32.1,.9,a2p,C.green,{label:'⑤ GET /photos + token',a:p3});
    if(t>29)pill('your password never reaches the app',OA.idp[0],OA.idp[1]-56,{c:C.green,z:12,a:p3*V(t,29)});}
  // ---- summary
  const p4=V(t,34.1);
  if(p4>0)[['Session cookie','one web app · instant logout',C.amber],['Short-lived JWT','many services · no shared lookup',C.accent],['OAuth','log in with… · access another API',C.green]].forEach(([a,b,c],k)=>{const x=190+k*310,v=V(t,34.2+k*.4);
    plate(x,300,280,110,{c,a:v});tx(a,x,282,{z:19,wt:800,c,a:v});tx(b,x,316,{z:13,a:v});});
}});})();
