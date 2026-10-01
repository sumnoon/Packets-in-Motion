/* ---------------- 19. MICROSERVICES: draw the boundaries ---------------- */
chal('microservices',{title:'Draw the service boundaries',goal:'Split six features into three services so the fewest calls cross the network. Thick lines are chatty pairs.',
  hint:'Keep chatty pairs together: each thick line that crosses a boundary becomes a slow network call.',
  make:api=>{const F=[['Users'],['Auth'],['Catalog'],['Search'],['Cart'],['Payments']].map(([n],k)=>({n,k,box:-1,x:140+k*146,y:150}));
    const E=[[0,1,5],[2,3,5],[4,5,4],[4,2,1],[4,0,1]];const B=[0,1,2].map(k=>({x:60+k*300,y:250,w:280,h:230}));let drag=null,checked=false;
    const home=f=>{if(f.box<0)return[140+f.k*146,150];const inB=F.filter(q=>q.box===f.box),j=inB.indexOf(f),b=B[f.box];return[b.x+b.w/2,b.y+60+j*62];};
    const cross=()=>E.reduce((a,[i,j,w])=>a+(F[i].box!==F[j].box?w:0),0);
    api.button('Check boundaries',()=>{if(F.some(f=>f.box<0)){api.status('Place every feature in a service first.');return;}if(B.some((b,k)=>!F.some(f=>f.box===k))){api.status('Every service needs at least one feature.');return;}
      checked=true;const c=cross();FX.burst(W/2,360,c<=2?C.green:C.amber,30,220);api.win(c<=2?3:c<=4?2:1,`${c*100} network calls/s`,c<=2?'Chatty pairs live together: Users + Auth, Catalog + Search, Cart + Payments. Only light traffic crosses the network.':'Some heavy pairs were split across services, and every one of those calls now goes over the network. Keep chatty pairs together.');},{primary:true});
    const say=()=>api.status(`Drag each feature into a service box, or press its number to move it to the next service. ${B.map((b,k)=>`Service ${k+1}: ${F.filter(f=>f.box===k).map(f=>f.n).join(', ')||'empty'}`).join(' · ')}. Calls crossing the network: ${cross()*100}/s.`);
    say();
    return{draw(now,dt){B.forEach((b,k)=>{g.save();g.setLineDash([7,6]);rr(b.x,b.y,b.w,b.h,16);g.strokeStyle=C.edge;g.lineWidth=2;g.stroke();g.restore();tx(`Service ${k+1}`,b.x+b.w/2,b.y+22,{z:14,wt:750,c:C.dim});});
        E.forEach(([i,j,w])=>{const a=F[i],b=F[j],x=a.box>=0&&b.box>=0&&a.box!==b.box;ln([[a.x,a.y],[b.x,b.y]],{c:x?C.red:hexA(C.accent,.55),w:1+w*1.3,dash:x?[6,6]:null});
          if(x){const q=(now*.8+i*.3)%1;dot(lerp(a.x,b.x,q),lerp(a.y,b.y,q),C.red,3.5);}});
        F.forEach(f=>{if(f!==drag){const[hx,hy]=home(f);f.x=lerp(f.x,hx,clamp(dt*12));f.y=lerp(f.y,hy,clamp(dt*12));}plate(f.x,f.y,130,44,{c:f===drag?C.accent:C.edge,fill:C.panel2,r:22,glow:f===drag?14:0});tx(f.n,f.x,f.y+1,{z:15,wt:750});keycap(String(f.k+1),f.x-52,f.y);});
        const c=cross();tx(`calls crossing the network: ${c*100}/s`,W/2,520,{z:14,wt:700,c:c<=2?C.green:c<=4?C.amber:C.red});},
      down(x,y){if(checked)return;drag=F.find(f=>Math.abs(x-f.x)<65&&Math.abs(y-f.y)<22)||null;if(drag){drag.dx=x-drag.x;drag.dy=y-drag.y;}},
      move(x,y){if(drag){drag.x=x-drag.dx;drag.y=y-drag.dy;}},
      up(){if(!drag)return;const k=B.findIndex(b=>inBox(drag.x,drag.y,b));if(k>=0&&F.filter(f=>f.box===k&&f!==drag).length<3)drag.box=k;else if(k<0)drag.box=-1;else FX.text(drag.x,drag.y-30,'max 3 per service',C.red,13);drag=null;say();},
      // keyboard: each press moves the feature to the next service with room; after the last, back out
      key(k){if(checked)return;const f=F[+k-1];if(!f)return;let b=f.box;for(let n=0;n<4;n++){b=b>=2?-1:b+1;if(b<0||F.filter(q=>q.box===b&&q!==f).length<3)break;}f.box=b;say();}};}});
