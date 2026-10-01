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
     sub(n,G,S) → a live subtitle for a component, or null (S is null before a run)
     hints:   [nudge, which components] the first two hint levels; the third outlines solution
     solution:{nodes:[kind,…], edges:[[i,j],…]} a 3-star design (indices count the fixed nodes first;
              a stateless server with no wires of its own is wired like the first of its kind)
     lean:    the cheapest known 3-star cost, when it is under the budget
     loadNote(n,util,G) → how to describe a component's overload after a run: text, null for the default, false to skip it
     blame(S,G,marks) → the weak spots to mark on the board after a run below 3 stars
   ============================================================ */
const LAB_SAVE={};
// kept per lab across retries: the last run's weak spots, the hint level, undo history, failed runs
const LAB_POST={},LAB_HINT={},LAB_UNDO={},LAB_FAILS={};
const LAB_DEFS={};   // every lab's scenario, by id (the tests build each solution from it)
// the cheapest 3-star cost per lab, kept in the browser
const LAB_BEST=(()=>{try{return JSON.parse(localStorage.getItem('pim-lab-best'))||{};}catch(e){return{};}})();
function labSaveBest(){try{localStorage.setItem('pim-lab-best',JSON.stringify(LAB_BEST));}catch(e){}}
const LAB_BOARD={x:14,y:62,w:972,h:380};
const LAB_PAL_Y=LAB_BOARD.y+LAB_BOARD.h+16;   // the palette is a row of tiles under the board
function labGame(o){LAB_DEFS[o.id]=o;return api=>{
  const id=o.id,K=o.kinds,PAL=Object.keys(K);
  // ---------- the graph ----------
  let G=LAB_SAVE[id]?JSON.parse(JSON.stringify(LAB_SAVE[id])):{nodes:o.fixed.map((f,i)=>({id:'f'+i,kind:f.kind,x:f.x,y:f.y,label:f.label,fixed:true})),edges:[],seq:0};
  if(!G.opts)G.opts={};(o.toggles||[]).forEach(tg=>{if(!(tg.key in G.opts))G.opts[tg.key]=tg.val;});
  const save=()=>{LAB_SAVE[id]=JSON.parse(JSON.stringify(G));if(!running){S=null;post=null;LAB_POST[id]=null;}};   // an edit clears the last run's readings and weak spots
  // undo history: a snapshot of the graph before each change
  const undoStack=LAB_UNDO[id]||(LAB_UNDO[id]=[]),snapshot=()=>JSON.stringify({nodes:G.nodes,edges:G.edges,seq:G.seq});
  const remember=s=>{undoStack.push(s||snapshot());if(undoStack.length>60)undoStack.shift();};
  function undo(){if(running)return;const s=undoStack.pop();if(!s){say('Nothing to undo.');return;}const u=JSON.parse(s);G.nodes=u.nodes;G.edges=u.edges;G.seq=u.seq;sel=null;save();say('Undone.');}
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
  const free=(x,y,list)=>(list||G.nodes).every(n=>Math.abs(n.x-x)>120||Math.abs(n.y-y)>70);
  // columns: {kind: x} or {kind: [x, preferred y]}
  function slotFor(kind,list){const cc=o.columns&&o.columns[kind],col=(Array.isArray(cc)?cc[0]:cc)||520,y0=Array.isArray(cc)?cc[1]:null;
    if(y0!=null&&free(col,y0,list))return[col,y0];
    for(const dx of [0,130,-130,260,-260])for(let y=LAB_BOARD.y+60;y<LAB_BOARD.y+LAB_BOARD.h-40;y+=78){const x=clamp(col+dx,LAB_BOARD.x+60,LAB_BOARD.x+LAB_BOARD.w-60);if(free(x,y,list))return[x,y];}return[LAB_BOARD.x+LAB_BOARD.w/2,LAB_BOARD.y+LAB_BOARD.h/2];}
  function add(kind,x,y){if(!canAdd(kind)){FX.text(x||LAB_BOARD.x+LAB_BOARD.w/2,(y||LAB_BOARD.y+LAB_BOARD.h/2)-40,`max ${K[kind].max} ${K[kind].label.toLowerCase()}s`,C.red,14);return null;}
    remember();const twin=K[kind].clone&&G.of(kind)[0];   // a new copy of a stateless server joins the pool with the same wires
    const n={id:'n'+(++G.seq),kind,x:0,y:0};G.nodes.push(n);if(x==null)[x,y]=slotFor(kind);[n.x,n.y]=clampIn(n,x,y);
    if(twin)G.edges.filter(e=>e.a===twin.id||e.b===twin.id).forEach(e=>G.edges.push({a:e.a===twin.id?n.id:e.a,b:e.b===twin.id?n.id:e.b}));
    sel={n};save();say(twin&&G.edges.some(e=>e.a===n.id||e.b===n.id)?`Added ${K[kind].label.toLowerCase()} ${letterOf(n)}, wired like ${letterOf(twin)}.`:'');FX.burst(n.x,n.y,K[kind].c||C.accent,12,110);SFX.play('good');return n;}
  function removeNode(n,snap){if(!n||n.fixed)return;remember(snap);G.nodes=G.nodes.filter(m=>m!==n);G.edges=G.edges.filter(e=>e.a!==n.id&&e.b!==n.id);sel=null;save();say();}
  function toggleEdge(a,b){if(hasEdge(a,b)){remember();G.edges=G.edges.filter(e=>!(e.a===a.id&&e.b===b.id));save();say(`Unwired ${nameOf(a)} → ${nameOf(b)}.`);return;}
    if(!allowed(a,b)){const t=(o.links[a.kind]||[]).map(k=>(K[k]||o.fixedKinds[k]).label.toLowerCase());FX.text((a.x+b.x)/2,(a.y+b.y)/2-20,`${kindOf(a).label} can't feed ${kindOf(b).label.toLowerCase()}`,C.red,13);
      say(`${nameOf(a)} can't send to ${nameOf(b)}. ${t.length?nameOf(a)+' can feed: '+t.join(', ')+'.':nameOf(a)+' has nothing to feed.'}`);return;}
    remember();G.edges.push({a:a.id,b:b.id});save();say(`Wired ${nameOf(a)} → ${nameOf(b)}.`);const[p,q]=seg(G.edges[G.edges.length-1]);FX.burst(q[0],q[1],C.accent,8,80);}
  // ---------- status line (read by screen readers) ----------
  function describe(){const pal=PAL.map((k,i)=>`<kbd>${i+1}</kbd> ${esc(K[k].label)} $${K[k].cost}`).join(' · ');
    const lines=G.nodes.map(n=>{const outs=G.out(n);return`<b>${letterOf(n)}</b> ${esc(nameOf(n))}${outs.length?' → '+outs.map(m=>letterOf(m)).join(', '):''}`;}).join(' · ');
    const probs=o.check?o.check(G):[];
    const opts=(o.toggles||[]).map(tg=>`${tg.label}: ${G.opts[tg.key]?'on':'off'}`).join(' · ');
    const weak=post&&post.length?' <span class="bad">Weak spots from your last run:</span> '+post.map(m=>{if(m.edge){const e=G.edges.find(x=>x.a+'>'+x.b===m.edge);return e?`${esc(nameOf(node(e.a)))} → ${esc(nameOf(node(e.b)))}: ${esc(m.note)}`:'';}const n=node(m.id);return n?`<b>${letterOf(n)}</b> ${esc(nameOf(n))}: ${esc(m.note)}`:'';}).filter(Boolean).join('; ')+'.':'';
    const best=LAB_BEST[id]!=null?` Your cheapest 3-star design: $${LAB_BEST[id]}/h.`:'';
    return`Budget $${cost()} of $${o.budget}.${best} Your design: ${lines}.${weak}${opts?' '+esc(opts)+'.':''} ${probs.length?'<span class="bad">To fix:</span> '+esc(probs[0])+' ':''}Add with ${pal}.`;}
  let lastMsg='';
  function say(msg){if(msg)lastMsg=msg;const s=sel&&sel.n?` Selected <b>${letterOf(sel.n)}</b> ${esc(nameOf(sel.n))}: press another letter to wire it, Delete to remove.`:'';api.status((lastMsg?esc(lastMsg)+' ':'')+describe()+s+' Press <kbd>Enter</kbd> to run the load test.');lastMsg='';}
  // ---------- run ----------
  let running=false,S=null,t0=0,last=0,done=false,res=null;const fl=[];
  (o.toggles||[]).forEach(tg=>api.toggle(tg.label,G.opts[tg.key],v=>{G.opts[tg.key]=v;save();say();}));   // design choices that are not boxes
  const run=api.button(o.runLabel||'Run load test',()=>start(),{primary:true});
  const clear=api.button('Clear board',()=>{if(running)return;remember();G.nodes=G.nodes.filter(n=>n.fixed);G.edges=[];sel=null;save();say('Board cleared.');});
  api.button('Undo',()=>undo());
  // what the run did to each component and wire, for the weak spots afterwards
  function track(out,t,dt){const T=S.track||(S.track={peak:{},bad:{}});
    for(const nid in out.load||{}){const u=out.load[nid];if(u>(T.peak[nid]?T.peak[nid].u:0))T.peak[nid]={u,t};}
    (out.badEdges||[]).forEach(k=>{const b=T.bad[k]||(T.bad[k]={d:0,t});b.d+=dt;});}
  function weakSpots(){const T=S.track||{peak:{},bad:{}},gen=[];
    G.nodes.forEach(n=>{const p=T.peak[n.id];if(!p||p.u<=1.02)return;const ln_=o.loadNote&&o.loadNote(n,p.u,G);if(ln_===false)return;gen.push({id:n.id,note:`${ln_||Math.round(p.u*100)+'% of capacity'} ${p.t<.2?'from the start':'at '+p.t.toFixed(1)+' s'}`,w:p.u});});
    gen.sort((a,b)=>b.w-a.w);gen.splice(2);
    Object.entries(T.bad).filter(([k,b])=>b.d>.3&&G.edges.some(e=>e.a+'>'+e.b===k)).sort((a,b)=>b[1].d-a[1].d).slice(0,2).forEach(([k,b])=>gen.push({edge:k,note:`failing from ${b.t.toFixed(1)} s`}));
    return(o.blame?o.blame(S,G,gen):gen).filter(m=>m&&(m.edge?G.edges.some(e=>e.a+'>'+e.b===m.edge):node(m.id))).slice(0,4);}
  function medal(c){const prev=LAB_BEST[id];let m='';
    if(prev==null||c<prev){LAB_BEST[id]=c;labSaveBest();if(prev!=null)m+=` New best: $${c}/h, down from $${prev}/h.`;}
    if(o.lean!=null)m+=c<=o.lean?` Lean medal: no 3-star design we know of costs less than $${o.lean}/h.`:` A 3-star design exists for $${o.lean}/h. Can you find it?`;
    return m;}
  function finish(){const c=cost();res=o.score(S,G,c);let msg=res.msg;
    post=res.stars<3?weakSpots():[];LAB_POST[id]=post;
    if(post.length)msg+=' Press Try again to see where it broke on the board.';
    if(res.stars<3){LAB_FAILS[id]=(LAB_FAILS[id]||0)+1;if(LAB_FAILS[id]>=2&&hintLvl<3)msg+=' Stuck? Press Hint for a nudge.';}
    else msg+=medal(c);
    api.win(res.stars,res.title,msg);setTimeout(()=>say(),50);}
  // hints: a nudge, then which components, then a faint outline of a 3-star design
  let post=LAB_POST[id]||null,hintLvl=LAB_HINT[id]||0,ghostOn=true;
  const ghost=o.solution?layoutGhost():null;
  function layoutGhost(){const F=o.fixed.length,ns=o.fixed.map(f=>({kind:f.kind,x:f.x,y:f.y}));
    o.solution.nodes.forEach(kind=>{const[x,y]=slotFor(kind,ns),p=clampIn({kind},x,y);ns.push({kind,x:p[0],y:p[1]});});
    const es=o.solution.edges.map(e=>e.slice());
    ns.forEach((n,i)=>{if(i<F||!K[n.kind].clone||es.some(([a,b])=>a===i||b===i))return;const first=ns.findIndex(m=>m.kind===n.kind);
      es.filter(([a,b])=>a===first||b===first).forEach(([a,b])=>es.push([a===first?i:a,b===first?i:b]));});
    return{ns,es};}
  function ghostWords(){const nm=k=>(K[k]||o.fixedKinds[k]).label,cnt={};ghost.ns.forEach(n=>cnt[n.kind]=(cnt[n.kind]||0)+1);
    return[...new Set(ghost.es.map(([a,b])=>ghost.ns[a].kind+'>'+ghost.ns[b].kind))].map(p=>{const[a,b]=p.split('>');return`${nm(a)} → ${cnt[b]>1?cnt[b]+' × ':''}${nm(b)}`;}).join(', ');}
  const hintLabel=()=>hintLvl===0?'Hint':hintLvl<3?`Hint ${hintLvl+1} of 3`:ghostOn?'Hide outline':'Show outline';
  const outlineText=full=>(full||'')+(ghost?` One 3-star design is outlined faintly on the board: ${ghostWords()}.`:'');
  function hint(full){const h=o.hints||[];
    if(hintLvl>=3&&ghost){ghostOn=!ghostOn;return{text:ghostOn?`Hint 3 of 3: ${outlineText(full)}`:null,label:hintLabel()};}
    hintLvl=Math.min(3,hintLvl+1);LAB_HINT[id]=hintLvl;ghostOn=true;
    const text=hintLvl<3&&h[hintLvl-1]?h[hintLvl-1]:outlineText(full);
    return{text:`Hint ${hintLvl} of 3: ${text}`,label:hintLabel()};}
  function start(){if(running)return;sel=null;drag=null;post=null;LAB_POST[id]=null;S=o.init(G);running=true;done=false;res=null;api.lock(true);t0=api.now();last=0;fl.length=0;api.status('Load test running… watch where traffic piles up.');}
  // ---------- pointer ----------
  let sel=null,drag=null,hover=null,pal=-1,kb=false;   // kb: shortcut keycaps show once the player uses the keyboard
  const TW=Math.min(150,(LAB_BOARD.w+12-(PAL.length-1)*8)/PAL.length),TX0=LAB_BOARD.x-6+(LAB_BOARD.w+12-(PAL.length*TW+(PAL.length-1)*8))/2;
  const TILE=k=>({x:TX0+k*(TW+8),y:LAB_PAL_Y,w:TW,h:50});
  const nodeAt=(x,y)=>{for(let i=G.nodes.length-1;i>=0;i--){const n=G.nodes[i],[w,h]=sizeOf(n);if(Math.abs(x-n.x)<=w/2+4&&Math.abs(y-n.y)<=h/2+4)return n;}return null;};
  const portAt=(x,y)=>G.nodes.find(n=>(o.links[n.kind]||[]).length&&Math.hypot(x-port(n)[0],y-port(n)[1])<12)||null;
  const edgeAt=(x,y)=>G.edges.find(e=>{const[[x0,y0],[x1,y1]]=seg(e),L=Math.hypot(x1-x0,y1-y0)||1,u=clamp(((x-x0)*(x1-x0)+(y-y0)*(y1-y0))/(L*L));return Math.hypot(x-(x0+u*(x1-x0)),y-(y0+u*(y1-y0)))<7;})||null;
  const delBtn=()=>{if(!sel)return null;if(sel.n){if(sel.n.fixed)return null;const[w,h]=sizeOf(sel.n);return[sel.n.x+w/2,sel.n.y-h/2];}const[[a,b],[c,d]]=seg(sel.e);return[(a+c)/2,(b+d)/2];};
  say();
  return{hint,hintLabel,
    draw(now,dt){
      // run loop
      if(running){const el=now-t0,step=Math.min(el-last,.1);if(step>0){const out=o.step(S,G,step,el);S.view=out;last+=step;spawn(out,now,step);track(out,el,step);}
        if(el>=o.dur&&!done){done=true;running=false;api.lock(false);finish();}}
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
      // the hint outline, faint, under everything you built
      if(ghost&&hintLvl>=3&&ghostOn&&!running){ghost.es.forEach(([a,b])=>{const A=ghost.ns[a],B=ghost.ns[b];ln([[A.x,A.y],[B.x,B.y]],{c:hexA(C.accent,.3),w:1.5,dash:[4,6]});});
        ghost.ns.forEach((n,i)=>{if(i<o.fixed.length)return;const k=K[n.kind],w=k.w||110,h=k.h||52;g.save();g.setLineDash([5,5]);g.strokeStyle=hexA(C.accent,.45);g.lineWidth=1.5;rr(n.x-w/2,n.y-h/2,w,h,10);g.stroke();g.restore();tx(k.short||k.label,n.x,n.y,{z:12,wt:700,c:C.accent,a:.45});});}
      // wires
      G.edges.forEach(e=>{const s=seg(e),on=sel&&sel.e===e,bad=V_&&V_.badEdges&&V_.badEdges.has(e.a+'>'+e.b);ln(s,{c:on?C.accent:bad?hexA(C.red,.7):hexA(C.edge,.9),w:on?3:2,arrow:true});});
      if(drag&&drag.type==='wire'){const a=drag.from,[px,py]=port(a),tgt=nodeAt(drag.x,drag.y),okT=tgt&&allowed(a,tgt);ln([[px,py],tgt?anchor(tgt,px,py):[drag.x,drag.y]],{c:tgt?(okT?C.green:C.red):C.accent,w:2,dash:[5,5],arrow:true});}
      flyers(now,fl);
      // nodes
      G.nodes.forEach(n=>{const k=kindOf(n),[w,h]=sizeOf(n),util=V_&&V_.load?V_.load[n.id]:null,dead=V_&&V_.dead&&V_.dead.has(n.id);
        const st=dead?'fail':util==null?(k.st||'ok'):util>1.02?'fail':util>.85?'hot':'ok';
        const sb=o.sub&&o.sub(n,G,S);drawKind(n,sb!=null?Object.assign({},k,{sub:sb}):k,w,h,st,util);
        if(kb)keycap(letterOf(n),n.x-w/2-1,n.y-h/2-1,{c:sel&&sel.n===n?C.accent:C.edge});
        if((o.links[n.kind]||[]).length&&!running){const[px,py]=port(n),hv=hover===n||sel&&sel.n===n;g.save();g.beginPath();g.arc(px,py,hv?6.5:4.5,0,7);g.fillStyle=hv?C.accent:C.panel2;g.fill();g.strokeStyle=C.accent;g.lineWidth=1.5;g.stroke();g.restore();}
        if(sel&&sel.n===n){g.save();g.strokeStyle=C.accent;g.lineWidth=2;g.setLineDash([4,4]);rr(n.x-w/2-6,n.y-h/2-6,w+12,h+12,14);g.stroke();g.restore();}
        if(util!=null&&!dead)meter(n.x-w/2,n.y+h/2+5,w,4,Math.min(util,1),util>1?C.red:util>.85?C.amber:C.green);});
      // weak spots from the last run
      if(!running&&post&&post.length){const pulse=.5+.5*Math.sin(now*4);
        post.forEach(m=>{if(m.edge){const e=G.edges.find(x=>x.a+'>'+x.b===m.edge);if(!e)return;const s=seg(e);ln(s,{c:hexA(C.red,.3+.35*pulse),w:6});pill(m.note,(s[0][0]+s[1][0])/2,(s[0][1]+s[1][1])/2-16,{c:C.red,z:11.5});return;}
          const n=node(m.id);if(!n)return;const[w,h]=sizeOf(n);g.save();g.strokeStyle=hexA(C.red,.45+.55*pulse);g.lineWidth=2.5;g.setLineDash([6,4]);rr(n.x-w/2-8,n.y-h/2-8,w+16,h+16,14);g.stroke();g.restore();
          pill(m.note,n.x,n.y<LAB_BOARD.y+120?n.y+h/2+24:n.y-h/2-22,{c:C.red,z:11.5});});
        tx('weak spots from your last run',W-14,LAB_BOARD.y-24,{z:12,wt:700,c:C.red,al:'right'});}
      // delete button on the selection
      const d=!running&&delBtn();if(d){g.save();g.beginPath();g.arc(d[0],d[1],9,0,7);g.fillStyle=C.red;g.fill();g.restore();tx('×',d[0],d[1]+.5,{z:14,wt:800,c:'#fff'});}
      // dragging a new component
      if(drag&&drag.type==='new'){const kk=K[drag.kind],over=drag.y<LAB_BOARD.y+LAB_BOARD.h;g.save();g.globalAlpha=over?.85:.5;drawKind({x:drag.x,y:drag.y,kind:drag.kind},kk,kk.w||110,kk.h||52,'ok',null);g.restore();}
      // top bar: budget and phase
      if(!running){const c=cost(),b=LAB_BEST[id],bt=`budget $${c} / $${o.budget}`;tx(bt,LAB_BOARD.x+6,LAB_BOARD.y-24,{z:13,wt:800,c:c<=o.budget?C.green:C.red,al:'left',f:MONO});
        if(b!=null)tx(`best 3★ $${b}`+(o.lean==null?'':b<=o.lean?' · lean medal':` · lean is $${o.lean}`),LAB_BOARD.x+6+tw(bt,13,800,MONO)+18,LAB_BOARD.y-24,{z:12,wt:700,c:o.lean!=null&&b<=o.lean?C.amber:C.dim,al:'left',f:MONO});}
      if(running&&V_){tx(V_.phase||'',LAB_BOARD.x+6,LAB_BOARD.y-24,{al:'left',z:16,wt:800,c:/die|attack|storm|spike|star/i.test(V_.phase||'')?C.red:C.accent});const f=clamp((now-t0)/o.dur);meter(LAB_BOARD.x,H-12,LAB_BOARD.w,4,f,C.accent);
        // live readout along the top bar, right-aligned, clear of the board
        let hx=W-14;o.hud(S,G).slice().reverse().forEach(([l,v,c])=>{tx(v,hx,LAB_BOARD.y-24,{z:12.5,wt:800,c:c||C.text,al:'right',f:MONO});hx-=tw(v,12.5,800,MONO)+6;tx(l,hx,LAB_BOARD.y-24,{z:11,c:C.dim,al:'right'});hx-=tw(l,11,500)+16;});}
    },
    down(x,y){if(running)return;const d=delBtn();if(d&&Math.hypot(x-d[0],y-d[1])<11){if(sel.n)removeNode(sel.n);else{remember();G.edges=G.edges.filter(e=>e!==sel.e);sel=null;save();say('Wire removed.');}return;}
      const pi=PAL.findIndex((k,i)=>inBox(x,y,TILE(i)));if(pi>=0){drag={type:'new',kind:PAL[pi],x,y};return;}
      const pn=portAt(x,y);if(pn){drag={type:'wire',from:pn,x,y};sel={n:pn};return;}
      const n=nodeAt(x,y);if(n){drag={type:'move',n,dx:x-n.x,dy:y-n.y,x0:x,y0:y,ox:n.x,oy:n.y,snap:snapshot()};sel={n};say();return;}
      const e=edgeAt(x,y);if(e){sel={e};say(`Selected the wire ${nameOf(node(e.a))} → ${nameOf(node(e.b))}. Press Delete or × to remove it.`);return;}
      sel=null;say();},
    move(x,y){pal=PAL.findIndex((k,i)=>inBox(x,y,TILE(i)));hover=portAt(x,y)||nodeAt(x,y);if(!drag)return;drag.x=x;drag.y=y;
      if(drag.type==='move'&&!drag.n.fixed||drag.type==='move'&&drag.n.fixed){[drag.n.x,drag.n.y]=clampIn(drag.n,x-drag.dx,y-drag.dy);if(!drag.n.fixed&&y>LAB_BOARD.y+LAB_BOARD.h+6)drag.n.y=snap(y-drag.dy);}},
    up(x,y){if(!drag)return;const d=drag;drag=null;
      if(d.type==='new'){if(y<LAB_BOARD.y+LAB_BOARD.h+10){if(cost()+K[d.kind].cost>o.budget+20){FX.text(x,y-30,'way over budget',C.red,13);return;}add(d.kind,x,y);}return;}
      if(d.type==='wire'){const tgt=nodeAt(x,y);if(tgt&&tgt!==d.from)toggleEdge(d.from,tgt);return;}
      if(d.type==='move'){if(y>LAB_BOARD.y+LAB_BOARD.h+6&&!d.n.fixed){removeNode(d.n,d.snap);FX.text(x,LAB_BOARD.y+LAB_BOARD.h-14,'removed',C.dim,13);return;}if(d.n.x!==d.ox||d.n.y!==d.oy)remember(d.snap);save();}},
    key(k,now,e){kb=true;if(running)return;
      if(e&&(e.ctrlKey||e.metaKey)){if(k==='z'||k==='Z')undo();return;}
      if(k==='Enter'){start();return;}
      if(/^[1-9]$/.test(k)){const kind=PAL[+k-1];if(kind){const n=add(kind);if(n){sel=null;say(`Added ${K[kind].label.toLowerCase()} ${letterOf(n)}${G.edges.some(e=>e.a===n.id||e.b===n.id)?', wired like the first one':''}.`);}}return;}
      if(k==='Delete'||k==='Backspace'){if(sel&&sel.n)removeNode(sel.n);else if(sel&&sel.e){remember();G.edges=G.edges.filter(e=>e!==sel.e);sel=null;save();say('Wire removed.');}return;}
      if(/^[a-z]$/i.test(k)){const n=G.nodes[LET.indexOf(k.toUpperCase())];if(!n)return;
        if(sel&&sel.n&&sel.n!==n){const a=sel.n;sel=null;toggleEdge(a,n);return;}
        sel=sel&&sel.n===n?null:{n};say();}}};
  // packets along the wires the user drew
  function spawn(out,now,dt){(out.flows||[]).forEach(f=>{if(!(f.rate>0))return;const e={a:f.a,b:f.b};if(!node(f.a)||!node(f.b))return;const pps=Math.min(10,f.rate/(o.scale||100));
      if(Math.random()<pps*dt)fl.push({t0:now,d:.55,pts:seg(e),c:f.bad?C.red:f.c||C.blue,r:3.6,drop:f.bad?.85:0});});}
};}
// a short label over a component, or under it when the component sits against the top of the board
function labMark(n,text,c,z){FX.text(n.x,n.y<LAB_BOARD.y+90?n.y+54:n.y-50,text,c,z||15);}
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
