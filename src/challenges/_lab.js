/* ============================================================
   ARCHITECTURE LAB: build the system yourself, then load-test it.
   Drag components from the palette onto the board, drag from a
   component's ● to another to wire them, and press Run. Traffic
   flows along the wires you drew; every component has a capacity
   and overloads, fails or slows down on its own.

   Keyboard: 1–9 adds a component · a letter selects one · a second
   letter wires the selected component to it (again to unwire) ·
   Delete removes the selection · Enter runs the load test.

   A scenario supplies:
     kinds:   {kind:{label,short,cost,max,shape,c,w,h,sub}} for the palette
     fixed:   [{kind,x,y,label}] nodes that are always there (traffic sources)
     links:   {fromKind:[toKind,…]} which wires are allowed
     budget, dur, intro
     init(G) → S;  step(S,G,dt,t) → {flows:[{a,b,rate,bad}], load:{id:util}, dead:Set, phase}
     hud(S,G) → [[label,value,colour]];  score(S,G) → {stars,title,msg};  check(G) → [problem]
   ============================================================ */
const LAB_SAVE={};
const LAB_BOARD={x:14,y:62,w:972,h:380};
const LAB_PAL_Y=LAB_BOARD.y+LAB_BOARD.h+16;   // the palette is a row of tiles under the board
function labGame(o){return api=>{
  const id=o.id,K=o.kinds,PAL=Object.keys(K);
  // ---------- the graph ----------
  let G=LAB_SAVE[id]?JSON.parse(JSON.stringify(LAB_SAVE[id])):{nodes:o.fixed.map((f,i)=>({id:'f'+i,kind:f.kind,x:f.x,y:f.y,label:f.label,fixed:true})),edges:[],seq:0};
  if(!G.opts)G.opts={};(o.toggles||[]).forEach(tg=>{if(!(tg.key in G.opts))G.opts[tg.key]=tg.val;});
  const save=()=>{LAB_SAVE[id]=JSON.parse(JSON.stringify(G));};
  const LET='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const node=nid=>G.nodes.find(n=>n.id===nid);
  const sizeOf=n=>{const k=K[n.kind]||o.fixedKinds[n.kind];return[k.w||110,k.h||52];};
  const kindOf=n=>K[n.kind]||o.fixedKinds[n.kind];
  const letterOf=n=>LET[G.nodes.indexOf(n)]||'?';
  const nameOf=n=>n.label||kindOf(n).label;
  const cost=()=>G.nodes.reduce((a,n)=>a+(n.fixed?0:K[n.kind].cost),0);
  const count=kind=>G.nodes.filter(n=>n.kind===kind).length;
  const canAdd=kind=>count(kind)<(K[kind].max||8)&&G.nodes.length<LET.length;
  const allowed=(a,b)=>a!==b&&(o.links[a.kind]||[]).includes(b.kind);
  const hasEdge=(a,b)=>G.edges.some(e=>e.a===a.id&&e.b===b.id);
  G.out=(n,kinds)=>G.edges.filter(e=>e.a===n.id).map(e=>node(e.b)).filter(m=>m&&(!kinds||kinds.includes(m.kind)));
  G.inn=(n,kinds)=>G.edges.filter(e=>e.b===n.id).map(e=>node(e.a)).filter(m=>m&&(!kinds||kinds.includes(m.kind)));
  G.of=kind=>G.nodes.filter(n=>n.kind===kind);
  // where a wire leaves/enters a box: the centre line clipped to the box edge
  const anchor=(n,tx_,ty_)=>{const[w,h]=sizeOf(n),dx=tx_-n.x,dy=ty_-n.y,s=Math.min((w/2+2)/Math.abs(dx||1e-9),(h/2+2)/Math.abs(dy||1e-9));return[n.x+dx*s,n.y+dy*s];};
  const seg=e=>{const a=node(e.a),b=node(e.b);return[anchor(a,b.x,b.y),anchor(b,a.x,a.y)];};
  const port=n=>{const[w]=sizeOf(n);return[n.x+w/2,n.y];};
  // ---------- placement ----------
  const snap=v=>Math.round(v/10)*10;
  const clampIn=(n,x,y)=>{const[w,h]=sizeOf(n);return[clamp(snap(x),LAB_BOARD.x+w/2,LAB_BOARD.x+LAB_BOARD.w-w/2),clamp(snap(y),LAB_BOARD.y+h/2+14,LAB_BOARD.y+LAB_BOARD.h-h/2-16)];};
  const free=(x,y,ign)=>G.nodes.every(n=>n===ign||Math.abs(n.x-x)>120||Math.abs(n.y-y)>70);
  function slotFor(kind){const col=o.columns&&o.columns[kind]||520;for(let d=0;d<8;d++)for(const dx of [0,130,-130,260,-260])for(let y=LAB_BOARD.y+60;y<LAB_BOARD.y+LAB_BOARD.h-40;y+=78){const x=clamp(col+dx+d*0,LAB_BOARD.x+60,LAB_BOARD.x+LAB_BOARD.w-60);if(free(x,y))return[x,y];}return[LAB_BOARD.x+LAB_BOARD.w/2,LAB_BOARD.y+LAB_BOARD.h/2];}
  function add(kind,x,y){if(!canAdd(kind)){FX.text(x||LAB_BOARD.x+LAB_BOARD.w/2,(y||LAB_BOARD.y+LAB_BOARD.h/2)-40,`max ${K[kind].max} ${K[kind].label.toLowerCase()}s`,C.red,14);return null;}
    const twin=K[kind].clone&&G.of(kind)[0];   // a new copy of a stateless server joins the pool with the same wires
    const n={id:'n'+(++G.seq),kind,x:0,y:0};G.nodes.push(n);if(x==null)[x,y]=slotFor(kind);[n.x,n.y]=clampIn(n,x,y);
    if(twin)G.edges.filter(e=>e.a===twin.id||e.b===twin.id).forEach(e=>G.edges.push({a:e.a===twin.id?n.id:e.a,b:e.b===twin.id?n.id:e.b}));
    sel={n};save();say(twin&&G.edges.some(e=>e.a===n.id||e.b===n.id)?`Added ${K[kind].label.toLowerCase()} ${letterOf(n)}, wired like ${letterOf(twin)}.`:'');FX.burst(n.x,n.y,K[kind].c||C.accent,12,110);SFX.play('good');return n;}
  function removeNode(n){if(!n||n.fixed)return;G.nodes=G.nodes.filter(m=>m!==n);G.edges=G.edges.filter(e=>e.a!==n.id&&e.b!==n.id);sel=null;save();say();}
  function toggleEdge(a,b){if(hasEdge(a,b)){G.edges=G.edges.filter(e=>!(e.a===a.id&&e.b===b.id));save();say(`Unwired ${nameOf(a)} → ${nameOf(b)}.`);return;}
    if(!allowed(a,b)){const t=(o.links[a.kind]||[]).map(k=>(K[k]||o.fixedKinds[k]).label.toLowerCase());FX.text((a.x+b.x)/2,(a.y+b.y)/2-20,`${kindOf(a).label} can't feed ${kindOf(b).label.toLowerCase()}`,C.red,13);
      say(`${nameOf(a)} can't send to ${nameOf(b)}. ${t.length?nameOf(a)+' can feed: '+t.join(', ')+'.':nameOf(a)+' has nothing to feed.'}`);return;}
    G.edges.push({a:a.id,b:b.id});save();say(`Wired ${nameOf(a)} → ${nameOf(b)}.`);const[p,q]=seg(G.edges[G.edges.length-1]);FX.burst(q[0],q[1],C.accent,8,80);}
  // ---------- status line (read by screen readers) ----------
  function describe(){const pal=PAL.map((k,i)=>`<kbd>${i+1}</kbd> ${esc(K[k].label)} $${K[k].cost}`).join(' · ');
    const lines=G.nodes.map(n=>{const outs=G.out(n);return`<b>${letterOf(n)}</b> ${esc(nameOf(n))}${outs.length?' → '+outs.map(m=>letterOf(m)).join(', '):''}`;}).join(' · ');
    const probs=o.check?o.check(G):[];
    const opts=(o.toggles||[]).map(tg=>`${tg.label}: ${G.opts[tg.key]?'on':'off'}`).join(' · ');
    return`Budget $${cost()} of $${o.budget}. Your design: ${lines}.${opts?' '+esc(opts)+'.':''} ${probs.length?'<span class="bad">To fix:</span> '+esc(probs[0])+' ':''}Add with ${pal}.`;}
  let lastMsg='';
  function say(msg){if(msg)lastMsg=msg;const s=sel&&sel.n?` Selected <b>${letterOf(sel.n)}</b> ${esc(nameOf(sel.n))}: press another letter to wire it, Delete to remove.`:'';api.status((lastMsg?esc(lastMsg)+' ':'')+describe()+s+' Press <kbd>Enter</kbd> to run the load test.');lastMsg='';}
  // ---------- run ----------
  let running=false,S=null,t0=0,last=0,done=false,res=null;const fl=[];
  (o.toggles||[]).forEach(tg=>api.toggle(tg.label,G.opts[tg.key],v=>{G.opts[tg.key]=v;save();say();}));   // design choices that are not boxes
  const run=api.button(o.runLabel||'Run load test',()=>start(),{primary:true});
  const clear=api.button('Clear board',()=>{if(running)return;G.nodes=G.nodes.filter(n=>n.fixed);G.edges=[];sel=null;save();say('Board cleared.');});
  function start(){if(running)return;sel=null;drag=null;S=o.init(G);running=true;done=false;res=null;api.lock(true);t0=api.now();last=0;fl.length=0;api.status('Load test running… watch where traffic piles up.');}
  // ---------- pointer ----------
  let sel=null,drag=null,hover=null,pal=-1,kb=false;   // kb: shortcut keycaps show once the player uses the keyboard
  const TW=Math.min(150,(LAB_BOARD.w+12-(PAL.length-1)*8)/PAL.length),TX0=LAB_BOARD.x-6+(LAB_BOARD.w+12-(PAL.length*TW+(PAL.length-1)*8))/2;
  const TILE=k=>({x:TX0+k*(TW+8),y:LAB_PAL_Y,w:TW,h:50});
  const nodeAt=(x,y)=>{for(let i=G.nodes.length-1;i>=0;i--){const n=G.nodes[i],[w,h]=sizeOf(n);if(Math.abs(x-n.x)<=w/2+4&&Math.abs(y-n.y)<=h/2+4)return n;}return null;};
  const portAt=(x,y)=>G.nodes.find(n=>(o.links[n.kind]||[]).length&&Math.hypot(x-port(n)[0],y-port(n)[1])<12)||null;
  const edgeAt=(x,y)=>G.edges.find(e=>{const[[x0,y0],[x1,y1]]=seg(e),L=Math.hypot(x1-x0,y1-y0)||1,u=clamp(((x-x0)*(x1-x0)+(y-y0)*(y1-y0))/(L*L));return Math.hypot(x-(x0+u*(x1-x0)),y-(y0+u*(y1-y0)))<7;})||null;
  const delBtn=()=>{if(!sel)return null;if(sel.n){if(sel.n.fixed)return null;const[w,h]=sizeOf(sel.n);return[sel.n.x+w/2,sel.n.y-h/2];}const[[a,b],[c,d]]=seg(sel.e);return[(a+c)/2,(b+d)/2];};
  say();
  return{
    draw(now,dt){
      // run loop
      if(running){const el=now-t0,step=Math.min(el-last,.1);if(step>0){const out=o.step(S,G,step,el);S.view=out;last+=step;spawn(out,now,step);}
        if(el>=o.dur&&!done){done=true;running=false;api.lock(false);res=o.score(S,G,cost());api.win(res.stars,res.title,res.msg);setTimeout(()=>say(),50);}}
      const V_=S&&S.view;
      // board
      g.save();rr(LAB_BOARD.x-6,LAB_BOARD.y-6,LAB_BOARD.w+12,LAB_BOARD.h+12,14);g.fillStyle=hexA(C.panel,.35);g.fill();g.strokeStyle=hexA(C.line,.8);g.setLineDash([3,6]);g.lineWidth=1;g.stroke();g.restore();
      for(let x=LAB_BOARD.x+10;x<LAB_BOARD.x+LAB_BOARD.w;x+=40)for(let y=LAB_BOARD.y+10;y<LAB_BOARD.y+LAB_BOARD.h;y+=40){g.fillStyle='rgba(255,255,255,.035)';g.fillRect(x-1,y-1,2,2);}
      // palette
      PAL.forEach((k,i)=>{const T=TILE(i),kk=K[k],ok=canAdd(k)&&cost()+kk.cost<=o.budget+20,hot=pal===i&&!running;
        g.save();g.globalAlpha=running?.45:ok?1:.5;rr(T.x,T.y,T.w,T.h,10);g.fillStyle=hot?hexA(kk.c||C.accent,.18):C.panel;g.fill();g.strokeStyle=hot?kk.c||C.accent:C.line;g.lineWidth=1.3;g.stroke();g.restore();
        icon(kk,T.x+28,T.y+T.h/2,running?.45:1);if(kb)keycap(String(i+1),T.x+11,T.y+11,{a:running?.45:1});
        tx(kk.short||kk.label,T.x+52,T.y+T.h/2-7,{z:12.5,wt:700,al:'left',a:running?.45:1});tx(`$${kk.cost}`+(kk.max?` · max ${kk.max}`:''),T.x+52,T.y+T.h/2+9,{z:10.5,c:C.dim,al:'left',f:MONO,a:running?.45:1});});
      if(!running)tx(kb?'keys: a number adds a component · press two letters to wire them (again to unwire) · Delete removes · Enter runs':'drag a component up onto the board · drag one back down here to remove it · press Tab for keyboard shortcuts',W/2,LAB_PAL_Y+68,{z:11,c:C.dim});
      // empty-board coaching
      if(G.nodes.length===o.fixed.length&&!running)textBlock(o.intro||'Drag components from the row below onto the board, then drag from a component’s ● to another to wire them.',LAB_BOARD.x+LAB_BOARD.w/2+40,LAB_BOARD.y+LAB_BOARD.h/2,420,{z:14,wt:500,c:C.dim});
      // wires
      G.edges.forEach(e=>{const s=seg(e),on=sel&&sel.e===e,bad=V_&&V_.badEdges&&V_.badEdges.has(e.a+'>'+e.b);ln(s,{c:on?C.accent:bad?hexA(C.red,.7):hexA(C.edge,.9),w:on?3:2,arrow:true});});
      if(drag&&drag.type==='wire'){const a=drag.from,[px,py]=port(a),tgt=nodeAt(drag.x,drag.y),okT=tgt&&allowed(a,tgt);ln([[px,py],tgt?anchor(tgt,px,py):[drag.x,drag.y]],{c:tgt?(okT?C.green:C.red):C.accent,w:2,dash:[5,5],arrow:true});}
      flyers(now,fl);
      // nodes
      G.nodes.forEach(n=>{const k=kindOf(n),[w,h]=sizeOf(n),util=V_&&V_.load?V_.load[n.id]:null,dead=V_&&V_.dead&&V_.dead.has(n.id);
        const st=dead?'fail':util==null?(k.st||'ok'):util>1.02?'fail':util>.85?'hot':'ok';
        drawKind(n,k,w,h,st,util);
        if(kb)keycap(letterOf(n),n.x-w/2-1,n.y-h/2-1,{c:sel&&sel.n===n?C.accent:C.edge});
        if((o.links[n.kind]||[]).length&&!running){const[px,py]=port(n),hv=hover===n||sel&&sel.n===n;g.save();g.beginPath();g.arc(px,py,hv?6.5:4.5,0,7);g.fillStyle=hv?C.accent:C.panel2;g.fill();g.strokeStyle=C.accent;g.lineWidth=1.5;g.stroke();g.restore();}
        if(sel&&sel.n===n){g.save();g.strokeStyle=C.accent;g.lineWidth=2;g.setLineDash([4,4]);rr(n.x-w/2-6,n.y-h/2-6,w+12,h+12,14);g.stroke();g.restore();}
        if(util!=null&&!dead)meter(n.x-w/2,n.y+h/2+5,w,4,Math.min(util,1),util>1?C.red:util>.85?C.amber:C.green);});
      // delete button on the selection
      const d=!running&&delBtn();if(d){g.save();g.beginPath();g.arc(d[0],d[1],9,0,7);g.fillStyle=C.red;g.fill();g.restore();tx('×',d[0],d[1]+.5,{z:14,wt:800,c:'#fff'});}
      // dragging a new component
      if(drag&&drag.type==='new'){const kk=K[drag.kind],over=drag.y<LAB_BOARD.y+LAB_BOARD.h;g.save();g.globalAlpha=over?.85:.5;drawKind({x:drag.x,y:drag.y,kind:drag.kind},kk,kk.w||110,kk.h||52,'ok',null);g.restore();}
      // top bar: budget and phase
      if(!running){const c=cost();tx(`budget $${c} / $${o.budget}`,LAB_BOARD.x+6,LAB_BOARD.y-24,{z:13,wt:800,c:c<=o.budget?C.green:C.red,al:'left',f:MONO});}
      if(running&&V_){tx(V_.phase||'',LAB_BOARD.x+6,LAB_BOARD.y-24,{al:'left',z:16,wt:800,c:/die|attack|storm|spike|star/i.test(V_.phase||'')?C.red:C.accent});const f=clamp((now-t0)/o.dur);meter(LAB_BOARD.x,H-12,LAB_BOARD.w,4,f,C.accent);
        // live readout along the top bar, right-aligned, clear of the board
        let hx=W-14;o.hud(S,G).slice().reverse().forEach(([l,v,c])=>{tx(v,hx,LAB_BOARD.y-24,{z:12.5,wt:800,c:c||C.text,al:'right',f:MONO});hx-=tw(v,12.5,800,MONO)+6;tx(l,hx,LAB_BOARD.y-24,{z:11,c:C.dim,al:'right'});hx-=tw(l,11,500)+16;});}
    },
    down(x,y){if(running)return;const d=delBtn();if(d&&Math.hypot(x-d[0],y-d[1])<11){if(sel.n)removeNode(sel.n);else{G.edges=G.edges.filter(e=>e!==sel.e);sel=null;save();say('Wire removed.');}return;}
      const pi=PAL.findIndex((k,i)=>inBox(x,y,TILE(i)));if(pi>=0){drag={type:'new',kind:PAL[pi],x,y};return;}
      const pn=portAt(x,y);if(pn){drag={type:'wire',from:pn,x,y};sel={n:pn};return;}
      const n=nodeAt(x,y);if(n){drag={type:'move',n,dx:x-n.x,dy:y-n.y,x0:x,y0:y};sel={n};say();return;}
      const e=edgeAt(x,y);if(e){sel={e};say(`Selected the wire ${nameOf(node(e.a))} → ${nameOf(node(e.b))}. Press Delete or × to remove it.`);return;}
      sel=null;say();},
    move(x,y){pal=PAL.findIndex((k,i)=>inBox(x,y,TILE(i)));hover=portAt(x,y)||nodeAt(x,y);if(!drag)return;drag.x=x;drag.y=y;
      if(drag.type==='move'&&!drag.n.fixed||drag.type==='move'&&drag.n.fixed){[drag.n.x,drag.n.y]=clampIn(drag.n,x-drag.dx,y-drag.dy);if(!drag.n.fixed&&y>LAB_BOARD.y+LAB_BOARD.h+6)drag.n.y=snap(y-drag.dy);}},
    up(x,y){if(!drag)return;const d=drag;drag=null;
      if(d.type==='new'){if(y<LAB_BOARD.y+LAB_BOARD.h+10){if(cost()+K[d.kind].cost>o.budget+20){FX.text(x,y-30,'way over budget',C.red,13);return;}add(d.kind,x,y);}return;}
      if(d.type==='wire'){const tgt=nodeAt(x,y);if(tgt&&tgt!==d.from)toggleEdge(d.from,tgt);return;}
      if(d.type==='move'){if(y>LAB_BOARD.y+LAB_BOARD.h+6&&!d.n.fixed){removeNode(d.n);FX.text(x,LAB_BOARD.y+LAB_BOARD.h-14,'removed',C.dim,13);return;}save();}},
    key(k){kb=true;if(running)return;
      if(k==='Enter'){start();return;}
      if(/^[1-9]$/.test(k)){const kind=PAL[+k-1];if(kind){const n=add(kind);if(n){sel=null;say(`Added ${K[kind].label.toLowerCase()} ${letterOf(n)}${G.edges.some(e=>e.a===n.id||e.b===n.id)?', wired like the first one':''}.`);}}return;}
      if(k==='Delete'||k==='Backspace'){if(sel&&sel.n)removeNode(sel.n);else if(sel&&sel.e){G.edges=G.edges.filter(e=>e!==sel.e);sel=null;save();say('Wire removed.');}return;}
      if(/^[a-z]$/i.test(k)){const n=G.nodes[LET.indexOf(k.toUpperCase())];if(!n)return;
        if(sel&&sel.n&&sel.n!==n){const a=sel.n;sel=null;toggleEdge(a,n);return;}
        sel=sel&&sel.n===n?null:{n};say();}}};
  // packets along the wires the user drew
  function spawn(out,now,dt){(out.flows||[]).forEach(f=>{if(!(f.rate>0))return;const e={a:f.a,b:f.b};if(!node(f.a)||!node(f.b))return;const pps=Math.min(10,f.rate/(o.scale||100));
      if(Math.random()<pps*dt)fl.push({t0:now,d:.55,pts:seg(e),c:f.bad?C.red:f.c||C.blue,r:3.6,drop:f.bad?.85:0});});}
};}
// a small glyph for the palette
function icon(k,x,y,a){draw(x,y,{a},()=>{if(k.shape==='db'){g.beginPath();g.ellipse(0,-8,13,4.5,0,0,7);g.moveTo(-13,-8);g.lineTo(-13,8);g.ellipse(0,8,13,4.5,0,Math.PI,0,true);g.lineTo(13,-8);g.fillStyle=C.panel2;g.fill();g.strokeStyle=k.c||C.edge;g.lineWidth=1.6;g.stroke();}
  else if(k.shape==='user'){g.beginPath();g.arc(0,0,11,0,7);g.fillStyle=C.panel2;g.fill();g.strokeStyle=C.blue;g.lineWidth=1.5;g.stroke();g.fillStyle=C.blue;g.beginPath();g.arc(0,-3,3.5,0,7);g.fill();g.beginPath();g.arc(0,7,5.5,Math.PI,0);g.fill();}
  else{rr(-15,-11,30,22,5);g.fillStyle=C.panel2;g.fill();g.strokeStyle=k.c||C.edge;g.lineWidth=1.6;g.stroke();if(k.shape==='server')for(let i=0;i<3;i++){g.beginPath();g.arc(-9+i*5,-5,1.4,0,7);g.fillStyle=i?hexA(C.green,.35):C.green;g.fill();}}});}
// a placed component, drawn with the course's own primitives
function drawKind(n,k,w,h,st,util){const sub=k.sub||'';
  if(k.shape==='db')db(n.x,n.y,{label:n.label||k.short||k.label,sub,w,h,st:st==='ok'?'ok':st});
  else if(k.shape==='user')user(n.x,n.y,{label:n.label||k.label,r:17,c:k.c||C.blue});
  else if(k.shape==='server')server(n.x,n.y,{label:n.label||k.short||k.label,sub,w,h,st,down:''});
  else box(n.x,n.y,{label:n.label||k.short||k.label,sub,c:k.c||C.accent,w,h,st:st==='ok'?undefined:st});}
