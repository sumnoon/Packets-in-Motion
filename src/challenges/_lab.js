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
const labStore=(k,def)=>PIM_STORE.json(k,def),labPut=(k,v)=>PIM_STORE.put(k,v);
const LAB_BEST={},LAB_BEST_DESIGNS={},LAB_RUNS={};
function labSaveBest(){labPut('pim-lab-best',LAB_BEST);}
// chaos mode: each run's incidents strike at random times and hit a random component.
// Three 3-star runs in a row earn the lab's chaos-proof badge.
const LAB_CHAOS={},LAB_CHAOS_ON={},LAB_STREAK={},LAB_STREAK_KEYS={},LAB_STREAK_SEEDS={},LAB_CERTIFIED={};
// Layout is cosmetic; certification follows the components, wires and options.
function labDesignKey(G){const ids=G.nodes.map(n=>n.id);return JSON.stringify([G.nodes.map(n=>n.kind),G.edges.map(e=>[ids.indexOf(e.a),ids.indexOf(e.b)]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),Object.entries(G.opts||{}).sort(([a],[b])=>a.localeCompare(b))]);}
function labCertificate(id,b){return pimRecord(b)&&labDecode(id,b.design)&&Array.isArray(b.seeds)&&b.seeds.length===3&&new Set(b.seeds).size===3&&b.seeds.every(s=>Number.isSafeInteger(s)&&s>=0&&s<2147483647);}
const labRng=pimRng;
// an incident's time: the scripted one, or in chaos mode a random time between lo and hi (fixed for the run)
function labAt(S,key,def,lo,hi){if(!S.chaos)return def;const m=S._at||(S._at={});if(!(key in m))m[key]=lo+(hi-lo)*S.rng();return m[key];}
// an incident's victim: the busiest one, or in chaos mode a random one
function labPick(S,key,list,busiest){if(!S.chaos||!list.length)return busiest;const m=S._pick||(S._pick={});if(!(key in m))m[key]=Math.floor(S.rng()*list.length);return list[m[key]%list.length];}
function labShuffle(S,arr){const a=arr.slice();if(!S.chaos)return a;for(let i=a.length-1;i>0;i--){const j=Math.floor(S.rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// a component taught in an earlier chapter stays locked until you have watched that chapter (a toggle turns this off)
const LAB_TEACH={lb:'load-balancers',app:'client-server',db:'sql-nosql',standby:'replication',replica:'replication',limiter:'rate-limiting',
  cache:'caching',feedcache:'caching',pagecache:'caching',queue:'queues-pubsub',worker:'queues-pubsub',fanq:'queues-pubsub',fanw:'queues-pubsub',
  pubsub:'queues-pubsub',gateway:'rest-grpc-ws',store:'sharding',postdb:'sharding'};
// share links: a design packed into the URL as kind.x.y nodes, a-b wires and option bits
const LAB_SHARED={};
function labKinds(o){return[...Object.keys(o.fixedKinds||{}),...Object.keys(o.kinds)];}
function labEncode(id,G){const o=LAB_DEFS[id],kinds=labKinds(o);
  return['1',G.nodes.map(n=>[kinds.indexOf(n.kind),Math.round(n.x/10),Math.round(n.y/10)].join('.')).join('_'),
    G.edges.map(e=>G.nodes.findIndex(n=>n.id===e.a)+'-'+G.nodes.findIndex(n=>n.id===e.b)).join('_'),
    (o.toggles||[]).map(t=>G.opts[t.key]?1:0).join('')].join('~');}
function labDecode(id,code){if(!Object.hasOwn(LAB_DEFS,id))return null;const o=LAB_DEFS[id];if(typeof code!=='string'||code.length>4000)return null;
  const p=code.split('~');if(p[0]!=='1'||p.length!==4)return null;
  if(!/^[01]*$/.test(p[3])||p[3].length!==(o.toggles||[]).length)return null;
  const kinds=labKinds(o),F=o.fixed.length,nodes=[],rows=p[1]?p[1].split('_'):[];if(rows.length<F||rows.length>26)return null;
  for(let i=0;i<rows.length;i++){if(!/^\d+\.-?\d+\.-?\d+$/.test(rows[i]))return null;const[k,x,y]=rows[i].split('.').map(Number),kind=kinds[k];if(!kind||!Number.isSafeInteger(x)||!Number.isSafeInteger(y)||Math.abs(x)>100000||Math.abs(y)>100000)return null;
    if(i<F){if(kind!==o.fixed[i].kind)return null;nodes.push({id:'f'+i,kind,x:x*10,y:y*10,label:o.fixed[i].label,fixed:true});continue;}
    if(!o.kinds[kind]||nodes.filter(n=>n.kind===kind).length>=(o.kinds[kind].max||8))return null;nodes.push({id:'n'+i,kind,x:x*10,y:y*10});}
  nodes.forEach(n=>{n.x=clamp(n.x,LAB_BOARD.x+30,LAB_BOARD.x+LAB_BOARD.w-30);n.y=clamp(n.y,LAB_BOARD.y+30,LAB_BOARD.y+LAB_BOARD.h-30);});
  const edges=[];for(const s of p[2]?p[2].split('_'):[]){if(!/^\d+-\d+$/.test(s))return null;const[a,b]=s.split('-').map(Number),A=nodes[a],B=nodes[b];
    if(!A||!B||A===B||!(o.links[A.kind]||[]).includes(B.kind))return null;if(!edges.some(e=>e.a===A.id&&e.b===B.id))edges.push({a:A.id,b:B.id});}
  const opts={};(o.toggles||[]).forEach((t,i)=>opts[t.key]=p[3][i]==='1');
  return{nodes,edges,seq:nodes.length,opts};}
// opens a shared design in its lab; false when the link is not a valid design
function labImport(id,code){labRestore();const G=labDecode(id,code);if(!G)return false;LAB_SAVE[id]=G;labSaveDesigns();LAB_POST[id]=null;LAB_SHARED[id]=true;return true;}
let LAB_RESTORED=false;
function labRestore(){if(LAB_RESTORED)return;LAB_RESTORED=true;
  Object.assign(LAB_BEST,pimFilter(labStore('pim-lab-best',{}),(k,v)=>Object.hasOwn(LAB_DEFS,k)&&Number.isSafeInteger(v)&&v>0&&v<=10000));
  Object.assign(LAB_CHAOS,pimFilter(labStore('pim-lab-chaos',{}),(k,v)=>Object.hasOwn(LAB_DEFS,k)&&v===true));
  labMergeDesigns(labStore('pim-lab-designs',null));
  const runs=labStore('pim-lab-runs',null);if(pimRecord(runs)&&runs.version===1)Object.entries(pimRecord(runs.runs)?runs.runs:{}).forEach(([id,r])=>{if(pimRecord(r)&&labDecode(id,r.design)&&Number.isSafeInteger(r.seed)&&r.seed>=0&&r.seed<2147483647&&typeof r.chaos==='boolean')LAB_RUNS[id]={design:r.design,seed:r.seed,chaos:r.chaos};});}
function labDesignCost(id,G){return G.nodes.reduce((sum,n)=>sum+(n.fixed?0:LAB_DEFS[id].kinds[n.kind].cost),0);}
function labMergeDesigns(data){if(!pimRecord(data)||data.version!==1)return 0;let added=0;
  if(pimRecord(data.drafts))Object.entries(data.drafts).forEach(([id,code])=>{const G=labDecode(id,code);if(G&&!LAB_SAVE[id]){LAB_SAVE[id]=G;added++;}});
  if(pimRecord(data.best))Object.entries(data.best).forEach(([id,b])=>{if(!pimRecord(b))return;const G=labDecode(id,b.design);
    if(G&&Number.isSafeInteger(b.cost)&&b.cost>0&&b.cost===labDesignCost(id,G)&&(!LAB_BEST_DESIGNS[id]||b.cost<LAB_BEST_DESIGNS[id].cost)){
      LAB_BEST_DESIGNS[id]={cost:b.cost,design:labEncode(id,G)};LAB_BEST[id]=Math.min(LAB_BEST[id]??Infinity,b.cost);added++;}});
  if(pimRecord(data.chaos))Object.entries(data.chaos).forEach(([id,b])=>{if(labCertificate(id,b)&&!LAB_CERTIFIED[id]){LAB_CERTIFIED[id]={design:labEncode(id,labDecode(id,b.design)),seeds:b.seeds.slice()};LAB_CHAOS[id]=true;added++;}});return added;}
function labDesigns(){const drafts={};Object.entries(LAB_SAVE).forEach(([id,G])=>{if(Object.hasOwn(LAB_DEFS,id))drafts[id]=labEncode(id,G);});return{version:1,drafts,best:LAB_BEST_DESIGNS,chaos:LAB_CERTIFIED};}
function labSaveDesigns(){labPut('pim-lab-designs',labDesigns());}
const LAB_BOARD={x:14,y:62,w:972,h:380};
const LAB_PAL_Y=LAB_BOARD.y+LAB_BOARD.h+16;   // the palette is a row of tiles under the board
function labGame(o){LAB_DEFS[o.id]=o;return api=>{
  labRestore();
  const id=o.id,K=o.kinds,PAL=Object.keys(K);
  // ---------- the graph ----------
  let G=LAB_SAVE[id]?JSON.parse(JSON.stringify(LAB_SAVE[id])):{nodes:o.fixed.map((f,i)=>({id:'f'+i,kind:f.kind,x:f.x,y:f.y,label:f.label,fixed:true})),edges:[],seq:0};
  if(!G.opts)G.opts={};(o.toggles||[]).forEach(tg=>{if(!(tg.key in G.opts))G.opts[tg.key]=tg.val;});
  let editor=null,lastPhase='';
  const save=()=>{if(LAB_STREAK_KEYS[id]!==labDesignKey(G)){LAB_STREAK[id]=0;LAB_STREAK_SEEDS[id]=[];LAB_STREAK_KEYS[id]=labDesignKey(G);}LAB_SAVE[id]=JSON.parse(JSON.stringify(G));labSaveDesigns();if(api.clearShareLink)api.clearShareLink();if(!running){S=null;post=null;LAB_POST[id]=null;}};   // an edit clears the last run's readings and weak spots
  // undo history: a snapshot of the graph before each change
  const undoStack=LAB_UNDO[id]||(LAB_UNDO[id]=[]),snapshot=()=>JSON.stringify({nodes:G.nodes,edges:G.edges,seq:G.seq,opts:G.opts});
  const remember=s=>{undoStack.push(s||snapshot());if(undoStack.length>60)undoStack.shift();};
  function applyDesign(u){G.nodes=u.nodes;G.edges=u.edges;G.seq=u.seq;G.opts=u.opts||{};syncOptions();sel=null;save();if(api.summary)api.summary(describe());}
  function undo(){if(running)return;const s=undoStack.pop();if(!s){say('Nothing to undo.');return;}applyDesign(JSON.parse(s));say('Undone.');}
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
  // locks (on unless turned off): a component taught in an earlier chapter waits until you have watched it
  const seenCh=pimSeen(labStore('sdve-seen',{})),myIdx=chapters.findIndex(c=>c.id===id);
  let locksOn=(()=>{try{return localStorage.getItem('pim-lab-locks')!=='false';}catch(e){return true;}})();
  const taughtEarlier=kind=>{const cid=K[kind].teach||LAB_TEACH[kind],j=cid?chapters.findIndex(c=>c.id===cid):-1;return j>=0&&j<myIdx?{cid,n:j+1,title:chapters[j].title}:null;};
  const lockOf=kind=>{if(!locksOn)return null;const T=taughtEarlier(kind);return T&&!seenCh[T.cid]?T:null;};
  const lockMsg=kind=>{const L=lockOf(kind);return`${K[kind].label} unlocks when you mark chapter ${L.n}, ${L.title}, complete. Open its lesson below, or turn off the component locks.`;};
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
  function add(kind,x,y){if(lockOf(kind)){say(lockMsg(kind));FX.text(x||LAB_BOARD.x+LAB_BOARD.w/2,(y||LAB_BOARD.y+LAB_BOARD.h/2)-40,'locked: complete its chapter first',C.amber,14);return null;}
    if(!canAdd(kind)){FX.text(x||LAB_BOARD.x+LAB_BOARD.w/2,(y||LAB_BOARD.y+LAB_BOARD.h/2)-40,`max ${K[kind].max} ${K[kind].label.toLowerCase()}s`,C.red,14);return null;}
    if(cost()+K[kind].cost>o.budget+20){say('Cannot add this component: it would exceed the budget allowance.');return null;}
    remember();const twin=K[kind].clone&&G.of(kind)[0];   // a new copy of a stateless server joins the pool with the same wires
    const n={id:'n'+(++G.seq),kind,x:0,y:0};G.nodes.push(n);if(x==null)[x,y]=slotFor(kind);[n.x,n.y]=clampIn(n,x,y);
    if(twin)G.edges.filter(e=>e.a===twin.id||e.b===twin.id).forEach(e=>G.edges.push({a:e.a===twin.id?n.id:e.a,b:e.b===twin.id?n.id:e.b}));
    sel={n};save();say(`Added ${nameOf(n)} ${letterOf(n)}${twin&&G.edges.some(e=>e.a===n.id||e.b===n.id)?', wired like '+letterOf(twin):''}.`);FX.burst(n.x,n.y,K[kind].c||C.accent,12,110);SFX.play('good');return n;}
  function removeNode(n,snap){if(!n||n.fixed)return;const name=nameOf(n);remember(snap);G.nodes=G.nodes.filter(m=>m!==n);G.edges=G.edges.filter(e=>e.a!==n.id&&e.b!==n.id);sel=null;save();say(`Removed ${name} and its connections.`);}
  function toggleEdge(a,b){if(hasEdge(a,b)){remember();G.edges=G.edges.filter(e=>!(e.a===a.id&&e.b===b.id));save();say(`Unwired ${nameOf(a)} → ${nameOf(b)}.`);return;}
    if(!allowed(a,b)){const t=(o.links[a.kind]||[]).map(k=>(K[k]||o.fixedKinds[k]).label.toLowerCase());FX.text((a.x+b.x)/2,(a.y+b.y)/2-20,`${kindOf(a).label} can't feed ${kindOf(b).label.toLowerCase()}`,C.red,13);
      say(`${nameOf(a)} can't send to ${nameOf(b)}. ${t.length?nameOf(a)+' can feed: '+t.join(', ')+'.':nameOf(a)+' has nothing to feed.'}`);return;}
    remember();G.edges.push({a:a.id,b:b.id});save();say(`Wired ${nameOf(a)} → ${nameOf(b)}.`);const[p,q]=seg(G.edges[G.edges.length-1]);FX.burst(q[0],q[1],C.accent,8,80);}
  // ---------- status line (read by screen readers) ----------
  function describe(){const pal=PAL.map((k,i)=>{const L=lockOf(k);return`<kbd>${i+1}</kbd> ${esc(K[k].label)} ${L?`(locked: complete chapter ${L.n})`:'$'+K[k].cost}`;}).join(' · ');
    const lines=G.nodes.map(n=>{const outs=G.out(n);return`<li><b>${letterOf(n)}</b> ${esc(nameOf(n))}${outs.length?' → '+outs.map(m=>letterOf(m)).join(', '):''}</li>`;}).join('');
    const probs=o.check?o.check(G):[];
    const opts=(o.toggles||[]).map(tg=>`${tg.label}: ${G.opts[tg.key]?'on':'off'}`).join(' · ');
    const weak=post&&post.length?' <span class="bad">Weak spots from your last run:</span> '+post.map(m=>{if(m.edge){const e=G.edges.find(x=>x.a+'>'+x.b===m.edge);return e?`${esc(nameOf(node(e.a)))} → ${esc(nameOf(node(e.b)))}: ${esc(m.note)}`:'';}const n=node(m.id);return n?`<b>${letterOf(n)}</b> ${esc(nameOf(n))}: ${esc(m.note)}`:'';}).filter(Boolean).join('; ')+'.':'';
    const best=LAB_BEST[id]!=null?` Your cheapest 3-star design: $${LAB_BEST[id]}/h.`:'';
    return`<p>Budget <b>$${cost()} of $${o.budget}</b>.${best}</p><h3>Your components and connections</h3><ul>${lines}</ul>${weak?'<p>'+weak+'</p>':''}${opts?'<p>Options: '+esc(opts)+'.</p>':''}${probs.length?'<p><b>Next step:</b> '+esc(probs[0])+'</p>':''}<details><summary>Keyboard shortcuts and component costs</summary><p>Add with ${pal}.</p><p>Press two component letters to connect or disconnect them. Delete removes a selection. Enter runs the test; Ctrl/Command+Z on the diagram undoes an edit.</p></details>`;}
  function say(msg){const s=sel&&sel.n?`Selected ${letterOf(sel.n)}: ${nameOf(sel.n)}.`:'';if(api.summary)api.summary(describe());api.status(esc(msg||s||'Design ready. Add components, connect them, then run the load test.'));refreshEditor();}
  // ---------- run ----------
  let running=false,S=null,simulation=null,done=false,res=null;const fl=[];
  // simT advances the model; vnow slows only the presentation after a crash.
  let simT=0,vnow=0,slowUntil=-1,shakeUntil=-1,badSfx=-9,celebrate=null,seenDead=new Set(),wasBad=false;
  const optionControls=(o.toggles||[]).map(tg=>({key:tg.key,el:api.toggle(tg.label,G.opts[tg.key],v=>{if(running)return;remember();G.opts[tg.key]=v;save();say(tg.label+': '+(v?'on':'off')+'.');})}));
  function syncOptions(){optionControls.forEach(({key,el})=>{if(el&&el.setAttribute)el.setAttribute('aria-pressed',String(!!G.opts[key]));});}
  const run=api.button(o.runLabel||'Run load test',()=>start(),{primary:true,toolbar:true});
  const clear=api.button('Clear board',()=>{if(running)return;remember();G.nodes=G.nodes.filter(n=>n.fixed);G.edges=[];sel=null;save();say('Board cleared.');});
  api.button('Undo',()=>undo(),{toolbar:true});
  const bestBtn=api.button('Restore best design',()=>{if(running||!LAB_BEST_DESIGNS[id])return;const best=labDecode(id,LAB_BEST_DESIGNS[id].design);if(best){remember();applyDesign(best);say('Best saved design restored.');}});
  bestBtn.hidden=!LAB_BEST_DESIGNS[id];
  const shareBtn=api.button('Copy share link',()=>share());
  const replayBtn=api.button('Replay last run',()=>{const previous=LAB_RUNS[id];if(running||!previous)return;const board=labDecode(id,previous.design);if(!board)return;remember();applyDesign(board);start(previous.seed,previous.chaos);});
  replayBtn.hidden=!LAB_RUNS[id];
  let modelNote=null;if(api.surface){const field=api.surface('Model assumptions and replay'),p=document.createElement('p');p.className='lab-guide';p.textContent=o.assumptions||'Educational capacity model: offered rates are split across connected components; each physical node has one shared capacity. Costs are model units expressed as $/h, not provider quotes. Latencies, where shown, are scenario buckets rather than measured network timings.';field.appendChild(p);modelNote=document.createElement('p');modelNote.className='lab-guide';field.appendChild(modelNote);}
  function showRun(){if(modelNote)modelNote.textContent=LAB_RUNS[id]?`Last run seed: ${LAB_RUNS[id].seed}. ${LAB_RUNS[id].chaos?'Random incidents':'Scripted incidents'}. Replay last run restores that board, its options and seed; the test uses a fixed 1/60-second model step.`:'Run the load test to save its board and seed for replay. The model advances in fixed 1/60-second steps.';}
  showRun();
  async function share(){if(running)return;const code=labEncode(id,G),here=String((typeof location!=='undefined'&&location.href)||''),base=/^https?:\/\//.test(here)?here.split(/[?#]/)[0]:'https://sumnoon.github.io/Packets-in-Motion/',url=`${base}?lab=${id}&d=${code}#${id}`;
    if(api.shareLink)api.shareLink(url);
    let copied=false;try{if(typeof navigator!=='undefined'&&navigator.clipboard){await navigator.clipboard.writeText(url);copied=true;}}catch(e){}
    if(code!==labEncode(id,G))return;
    say(`${copied?'Link copied. Send it to anyone':'Copy the link below and send it to anyone'} to share your $${cost()}/h design.${api.shareLink?'':' '+url}`);}
  // the locks are one setting for every lab, offered where a lab uses components from earlier chapters
  if(PAL.some(taughtEarlier))api.toggle('Lock components until I have completed their chapter',locksOn,v=>{locksOn=v;labPut('pim-lab-locks',v);
    say(v?'Component locks on, in every lab: a component from a chapter you have not completed waits until you mark it complete.':'Component locks off: every component is available.');});
  let chaosOn=!!LAB_CHAOS_ON[id];
  api.toggle('Chaos mode: incidents strike at random times and places',chaosOn,v=>{chaosOn=v;LAB_CHAOS_ON[id]=v;LAB_STREAK[id]=0;LAB_STREAK_SEEDS[id]=[];say(v?'Chaos mode on: each run, the incidents strike at a random time and hit a random component. Survive three runs in a row for the chaos-proof badge.':'Chaos mode off.');});
  // what the run did to each component and wire, for the weak spots afterwards
  // a crash shakes the board, slows time for a moment and sounds; failing traffic sounds once
  function react(out,now){let crash=false;(out.dead||[]).forEach(d=>{if(!seenDead.has(d)){seenDead.add(d);crash=true;}});
    if(crash){SFX.play('bad');if(!reduceMQ.matches){slowUntil=now+.5;shakeUntil=now+.35;}}
    const nb=out.badEdges?out.badEdges.size:0;if(nb&&!wasBad&&now-badSfx>1.5){SFX.play('beat');badSfx=now;}wasBad=nb>0;}
  function weakSpots(){const T=S.track||{peak:{},bad:{}},gen=[];
    G.nodes.forEach(n=>{const p=T.peak[n.id];if(!p||p.u<=1.02)return;const ln_=o.loadNote&&o.loadNote(n,p.u,G);if(ln_===false)return;gen.push({id:n.id,note:`${ln_||Math.round(p.u*100)+'% of capacity'} ${p.t<.2?'from the start':'at '+p.t.toFixed(1)+' s'}`,w:p.u});});
    gen.sort((a,b)=>b.w-a.w);gen.splice(2);
    Object.entries(T.bad).filter(([k,b])=>b.d>.3&&G.edges.some(e=>e.a+'>'+e.b===k)).sort((a,b)=>b[1].d-a[1].d).slice(0,2).forEach(([k,b])=>gen.push({edge:k,note:`failing from ${b.t.toFixed(1)} s`}));
    return(o.blame?o.blame(S,G,gen):gen).filter(m=>m&&(m.edge?G.edges.some(e=>e.a+'>'+e.b===m.edge):node(m.id))).slice(0,4);}
  function medal(c){const prev=LAB_BEST[id];let m='';
    if(!LAB_BEST_DESIGNS[id]||c<=LAB_BEST_DESIGNS[id].cost){LAB_BEST_DESIGNS[id]={cost:c,design:labEncode(id,G)};bestBtn.hidden=false;labSaveDesigns();}
    if(prev==null||c<prev){LAB_BEST[id]=c;labSaveBest();if(prev!=null)m+=` New best: $${c}/h, down from $${prev}/h.`;}
    if(o.lean!=null)m+=c<=o.lean?` Lean medal: no 3-star design we know of costs less than $${o.lean}/h.`:` A 3-star design exists for $${o.lean}/h. Can you find it?`;
    return m;}
  function chaosNote(stars){if(!S.chaos)return stars===3&&!LAB_CHAOS[id]?' Ready for more? Turn on chaos mode: the incidents strike at random.':'';
    const key=labDesignKey(G);if(LAB_STREAK_KEYS[id]!==key){LAB_STREAK_KEYS[id]=key;LAB_STREAK[id]=0;LAB_STREAK_SEEDS[id]=[];}
    if(stars<3){LAB_STREAK[id]=0;LAB_STREAK_SEEDS[id]=[];return' Chaos streak reset.';}
    const seeds=LAB_STREAK_SEEDS[id]||(LAB_STREAK_SEEDS[id]=[]);if(!seeds.includes(S.seed))seeds.push(S.seed);if(seeds.length>3)seeds.shift();
    const n=LAB_STREAK[id]=seeds.length;
    if(n>=3){LAB_CERTIFIED[id]={design:labEncode(id,G),seeds:seeds.slice(-3)};LAB_CHAOS[id]=true;labPut('pim-lab-chaos',LAB_CHAOS);labSaveDesigns();return' Chaos-proof badge earned: this design survived three distinct random seeds in a row.';}
    return` Chaos streak: ${n} of 3 for this design.`;}
  function finish(now){const c=cost();res=simulation.result(c);let msg=res.msg+` Run seed: ${S.seed}.`;
    post=res.stars<3?weakSpots():[];LAB_POST[id]=post;
    if(post.length)msg+=' Press Try again to see where it broke on the board.';
    if(res.stars<3){LAB_FAILS[id]=(LAB_FAILS[id]||0)+1;if(LAB_FAILS[id]>=2&&hintLvl<3)msg+=' Stuck? Press Hint for a nudge.';}
    else msg+=medal(c);
    msg+=chaosNote(res.stars);
    // three stars: the wires glow for a moment before the result
    if(res.stars===3){celebrate={at:now,msg};SFX.play('good');G.nodes.slice(0,12).forEach(n=>FX.burst(n.x,n.y,C.amber,10,120));return;}
    api.win(res.stars,res.title,msg);chalLater(api,()=>say(),50);}
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
  function start(seed=Math.floor(PIM_RANDOM.next()*2147483647),chaos=chaosOn){if(running)return;cancelDrag();sel=null;post=null;LAB_POST[id]=null;simulation=pimLabRun(o,G,{seed,chaos});S=simulation.state;LAB_RUNS[id]={design:labEncode(id,G),seed:S.seed,chaos};labPut('pim-lab-runs',{version:1,runs:LAB_RUNS});replayBtn.hidden=false;showRun();celebrate=null;running=true;done=false;res=null;api.lock(true);refreshEditor();lastPhase='';seenDead=new Set();wasBad=false;simT=0;fl.length=0;api.status(`Load test running. Seed ${S.seed}.`);}
  // ---------- pointer ----------
  let sel=null,drag=null,hover=null,pal=-1,kb=false;   // kb: shortcut keycaps show once the player uses the keyboard
  function cancelDrag(){if(drag&&drag.type==='move'){drag.n.x=drag.ox;drag.n.y=drag.oy;}drag=null;hover=null;pal=-1;}
  const TW=Math.min(150,(LAB_BOARD.w+12-(PAL.length-1)*8)/PAL.length),TX0=LAB_BOARD.x-6+(LAB_BOARD.w+12-(PAL.length*TW+(PAL.length-1)*8))/2;
  const TILE=k=>({x:TX0+k*(TW+8),y:LAB_PAL_Y,w:TW,h:50});
  const nodeAt=(x,y)=>{for(let i=G.nodes.length-1;i>=0;i--){const n=G.nodes[i],[w,h]=sizeOf(n);if(Math.abs(x-n.x)<=w/2+4&&Math.abs(y-n.y)<=h/2+4)return n;}return null;};
  const portAt=(x,y)=>G.nodes.filter(n=>(o.links[n.kind]||[]).length).sort((a,b)=>Math.hypot(x-port(a)[0],y-port(a)[1])-Math.hypot(x-port(b)[0],y-port(b)[1])).find(n=>Math.hypot(x-port(n)[0],y-port(n)[1])<(api.targetRadius?api.targetRadius():12))||null;
  const edgeAt=(x,y)=>G.edges.find(e=>{const[[x0,y0],[x1,y1]]=seg(e),L=Math.hypot(x1-x0,y1-y0)||1,u=clamp(((x-x0)*(x1-x0)+(y-y0)*(y1-y0))/(L*L));return Math.hypot(x-(x0+u*(x1-x0)),y-(y0+u*(y1-y0)))<7;})||null;
  const delBtn=()=>{if(!sel)return null;if(sel.n){if(sel.n.fixed)return null;const[w,h]=sizeOf(sel.n);return[sel.n.x+w/2,sel.n.y-h/2];}const[[a,b],[c,d]]=seg(sel.e);return[(a+c)/2,(b+d)/2];};
  if(api.surface){const field=api.surface('Components and connections');
    const select=(label,id)=>{const wrap=document.createElement('label'),el=document.createElement('select');wrap.textContent=label+' ';el.id=id;wrap.appendChild(el);field.appendChild(wrap);return el;};
    const button=(label,fn)=>{const el=document.createElement('button');el.type='button';el.className='btn';el.textContent=label;el.onclick=()=>{if(!running&&(!api.canInput||api.canInput()))fn();};field.appendChild(el);return el;};
    field.className='editor-fields';const kind=select('Component to add','lab-kind');
    const addBtn=button('Add component',()=>add(kind.value)),remove=select('Component to remove','lab-remove');
    const removeBtn=button('Remove component',()=>removeNode(node(remove.value))),from=select('Connection from','lab-from'),to=select('Connection to','lab-to');
    const connect=button('Connect',()=>{const a=node(from.value),b=node(to.value);if(a&&b&&!hasEdge(a,b))toggleEdge(a,b);});
    const disconnect=button('Disconnect',()=>{const a=node(from.value),b=node(to.value);if(a&&b&&hasEdge(a,b))toggleEdge(a,b);});
    const guide=document.createElement('p');guide.className='lab-guide';guide.textContent='1. Add a component using the selector. 2. Choose Connection from and Connection to, then Connect. 3. Run the load test above. Undo reverses an edit; Hint helps you choose a design.';field.appendChild(guide);
    const prerequisites=document.createElement('div');prerequisites.className='lab-prerequisites';field.appendChild(prerequisites);
    const wires=document.createElement('ul');wires.className='editor-wires';field.appendChild(wires);editor={field,kind,addBtn,remove,removeBtn,from,to,connect,disconnect,wires,prerequisites};
    [kind,remove,from,to].forEach(el=>el.onchange=()=>refreshEditor());}
  function refreshEditor(){if(!editor)return;const e=editor;
    const options=(el,rows)=>{const old=el.value;el.replaceChildren();rows.forEach(([value,text])=>{const opt=document.createElement('option');opt.value=value;opt.textContent=text;el.appendChild(opt);});el.value=rows.some(([v])=>v===old)?old:rows[0]?.[0]||'';};
    options(e.kind,PAL.map(k=>[k,`${K[k].label} — $${K[k].cost}${lockOf(k)?' (locked)':''}`]));
    const nodes=G.nodes.map(n=>[n.id,`${letterOf(n)}: ${nameOf(n)}`]);options(e.remove,G.nodes.filter(n=>!n.fixed).map(n=>[n.id,`${letterOf(n)}: ${nameOf(n)}`]));options(e.from,nodes);options(e.to,nodes);
    e.field.disabled=running;e.addBtn.disabled=!e.kind.value||!!lockOf(e.kind.value)||!canAdd(e.kind.value)||cost()+K[e.kind.value].cost>o.budget+20;e.removeBtn.disabled=!e.remove.value;
    const a=node(e.from.value),b=node(e.to.value);e.connect.disabled=!a||!b||!allowed(a,b)||hasEdge(a,b);e.disconnect.disabled=!a||!b||!hasEdge(a,b);
    e.prerequisites.replaceChildren();if(api.lesson){const required=new Map(PAL.filter(k=>lockOf(k)).map(k=>{const L=lockOf(k);return[L.cid,L];}));required.forEach(L=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent='Open required lesson: '+L.title;b.onclick=()=>{if(!running)api.lesson(L.cid);};e.prerequisites.appendChild(b);});}
    e.wires.replaceChildren();const lines=G.edges.map(edge=>`${letterOf(node(edge.a))}: ${nameOf(node(edge.a))} → ${letterOf(node(edge.b))}: ${nameOf(node(edge.b))}`);
    (lines.length?lines:['No connections yet.']).forEach(text=>{const li=document.createElement('li');li.textContent=text;e.wires.appendChild(li);});}
  if(LAB_SHARED[id]){LAB_SHARED[id]=false;say(`Someone shared this design with you: $${cost()}/h. Press Enter or Run to test it, then try to beat it.`);}else say();
  return{hint,hintLabel,
    update(now,dt){const slowF=running&&now<slowUntil?.45:1;vnow+=dt*slowF;
      if(running){simulation.advance(dt);simT=simulation.time;const out=S.view;if(out){spawn(out,vnow,dt);react(out,now);}for(const event of simulation.events()){const n=node(event.id);if(n){FX.burst(n.x,n.y,event.color,24,180);labMark(n,event.text,event.color);}}
        if(simT>=o.dur&&!done){done=true;running=false;api.lock(false);refreshEditor();finish(now);}}
      if(celebrate&&now-celebrate.at>=.8){const m=celebrate.msg;celebrate=null;api.win(res.stars,res.title,m);chalLater(api,()=>say(),50);}
    },
    draw(now,dt){
      const shake=now<shakeUntil?(shakeUntil-now)/.35*5:0;g.save();if(shake)g.translate((PIM_EFFECTS.next()-.5)*2*shake,(PIM_EFFECTS.next()-.5)*2*shake);
      const V_=S&&S.view;
      if(S&&V_){if(api.metrics)api.metrics([['Phase',V_.phase||'Load test'],['Elapsed',simT.toFixed(1)+' of '+o.dur+' seconds'],...o.hud(S,G),...(res?.metrics?.requirements||[]).map(r=>[r.name,`${r.passed?'Met':'Missed'}: ${r.observed.toFixed(3)}; target ${r.target}`]),...G.nodes.map(n=>[`${letterOf(n)}: ${nameOf(n)}`,V_.dead&&V_.dead.has(n.id)?'Unavailable':V_.load&&V_.load[n.id]!=null?Math.round(V_.load[n.id]*100)+'% of capacity':'Available'])]);if(running&&V_.phase&&lastPhase!==V_.phase){lastPhase=V_.phase;api.status(esc(V_.phase)+'.');}}
      // board
      g.save();rr(LAB_BOARD.x-6,LAB_BOARD.y-6,LAB_BOARD.w+12,LAB_BOARD.h+12,14);g.fillStyle=hexA(C.panel,.35);g.fill();g.strokeStyle=hexA(C.line,.8);g.setLineDash([3,6]);g.lineWidth=1;g.stroke();g.restore();
      for(let x=LAB_BOARD.x+10;x<LAB_BOARD.x+LAB_BOARD.w;x+=40)for(let y=LAB_BOARD.y+10;y<LAB_BOARD.y+LAB_BOARD.h;y+=40){g.fillStyle='rgba(255,255,255,.035)';g.fillRect(x-1,y-1,2,2);}
      // palette
      PAL.forEach((k,i)=>{const T=TILE(i),kk=K[k],L=lockOf(k),ok=!L&&canAdd(k)&&cost()+kk.cost<=o.budget+20,hot=pal===i&&!running&&!L;
        g.save();g.globalAlpha=running?.45:ok?1:.5;rr(T.x,T.y,T.w,T.h,10);g.fillStyle=hot?hexA(kk.c||C.accent,.18):C.panel;g.fill();g.strokeStyle=hot?kk.c||C.accent:C.line;g.lineWidth=1.3;g.stroke();g.restore();
        icon(kk,T.x+28,T.y+T.h/2,running?.45:1);if(kb)keycap(String(i+1),T.x+11,T.y+11,{a:running?.45:1});
        tx(kk.short||kk.label,T.x+52,T.y+T.h/2-7,{z:12.5,wt:700,al:'left',a:running?.45:1});tx(L?`complete ch. ${L.n}`:`$${kk.cost}`+(kk.max?` · max ${kk.max}`:''),T.x+52,T.y+T.h/2+9,{z:10.5,c:L?C.amber:C.dim,al:'left',f:MONO,a:running?.45:1});
        if(L)labLock(T.x+T.w-14,T.y+12);});
      if(!running)tx(kb?'keys: a number adds a component · press two letters to wire them (again to unwire) · Delete removes · Enter runs':'drag a component up onto the board · drag one back down here to remove it · press Tab for keyboard shortcuts',W/2,LAB_PAL_Y+68,{z:11,c:C.dim});
      // empty-board coaching
      if(G.nodes.length===o.fixed.length&&!running)textBlock(o.intro||'Drag components from the row below onto the board, then drag from a component’s ● to another to wire them.',LAB_BOARD.x+LAB_BOARD.w/2+40,LAB_BOARD.y+LAB_BOARD.h/2,420,{z:14,wt:500,c:C.dim});
      // the hint outline, faint, under everything you built
      if(ghost&&hintLvl>=3&&ghostOn&&!running){ghost.es.forEach(([a,b])=>{const A=ghost.ns[a],B=ghost.ns[b];ln([[A.x,A.y],[B.x,B.y]],{c:hexA(C.accent,.3),w:1.5,dash:[4,6]});});
        ghost.ns.forEach((n,i)=>{if(i<o.fixed.length)return;const k=K[n.kind],w=k.w||110,h=k.h||52;g.save();g.setLineDash([5,5]);g.strokeStyle=hexA(C.accent,.45);g.lineWidth=1.5;rr(n.x-w/2,n.y-h/2,w,h,10);g.stroke();g.restore();tx(k.short||k.label,n.x,n.y,{z:12,wt:700,c:C.accent,a:.45});});}
      // wires
      G.edges.forEach(e=>{const s=seg(e),on=sel&&sel.e===e,bad=V_&&V_.badEdges&&V_.badEdges.has(e.a+'>'+e.b);ln(s,{c:on?C.accent:bad?hexA(C.red,.7):hexA(C.edge,.9),w:on?3:2,arrow:true});});
      if(drag&&drag.type==='wire'){const a=drag.from,[px,py]=port(a),tgt=nodeAt(drag.x,drag.y),okT=tgt&&allowed(a,tgt);ln([[px,py],tgt?anchor(tgt,px,py):[drag.x,drag.y]],{c:tgt?(okT?C.green:C.red):C.accent,w:2,dash:[5,5],arrow:true});}
      flyers(vnow,fl);
      // three stars: light up every wire
      if(celebrate){const k=clamp((now-celebrate.at)/.8);G.edges.forEach(e=>{const s=seg(e);ln(s,{c:hexA(C.amber,.85*(1-k*.6)),w:4});dot(s[0][0]+(s[1][0]-s[0][0])*k,s[0][1]+(s[1][1]-s[0][1])*k,C.amber,4);});}
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
        let bx=LAB_BOARD.x+6+tw(bt,13,800,MONO)+18;
        if(b!=null){const s_=`best 3★ $${b}`+(o.lean==null?'':b<=o.lean?' · lean medal':` · lean is $${o.lean}`);tx(s_,bx,LAB_BOARD.y-24,{z:12,wt:700,c:o.lean!=null&&b<=o.lean?C.amber:C.dim,al:'left',f:MONO});bx+=tw(s_,12,700,MONO)+18;}
        if(chaosOn||LAB_CHAOS[id]){const b=LAB_CERTIFIED[id],cert=b&&labDesignKey(labDecode(id,b.design))===labDesignKey(G);tx(cert?'this design · chaos-proof ✓':chaosOn?`chaos mode · streak ${LAB_STREAK_KEYS[id]===labDesignKey(G)?LAB_STREAK[id]||0:0}/3`:'chaos badge earned · test this design',bx,LAB_BOARD.y-24,{z:12,wt:800,c:C.red,al:'left',f:MONO});}}
      if(running&&V_){tx(V_.phase||'',LAB_BOARD.x+6,LAB_BOARD.y-24,{al:'left',z:16,wt:800,c:/die|attack|storm|spike|star/i.test(V_.phase||'')?C.red:C.accent});const f=clamp(simT/o.dur);meter(LAB_BOARD.x,H-12,LAB_BOARD.w,4,f,C.accent);
        // live readout along the top bar, right-aligned, clear of the board
        let hx=W-14;o.hud(S,G).slice().reverse().forEach(([l,v,c])=>{tx(v,hx,LAB_BOARD.y-24,{z:12.5,wt:800,c:c||C.text,al:'right',f:MONO});hx-=tw(v,12.5,800,MONO)+6;tx(l,hx,LAB_BOARD.y-24,{z:11,c:C.dim,al:'right'});hx-=tw(l,11,500)+16;});}
      g.restore();
    },
    down(x,y){if(running)return;const d=delBtn();if(d&&Math.hypot(x-d[0],y-d[1])<(api.targetRadius?api.targetRadius():11)){if(sel.n)removeNode(sel.n);else{remember();G.edges=G.edges.filter(e=>e!==sel.e);sel=null;save();say('Wire removed.');}return;}
      const pi=PAL.findIndex((k,i)=>inBox(x,y,TILE(i)));if(pi>=0){if(lockOf(PAL[pi])){say(lockMsg(PAL[pi]));return;}drag={type:'new',kind:PAL[pi],x,y};return;}
      const pn=portAt(x,y);if(pn){drag={type:'wire',from:pn,x,y};sel={n:pn};return;}
      const n=nodeAt(x,y);if(n){drag={type:'move',n,dx:x-n.x,dy:y-n.y,x0:x,y0:y,ox:n.x,oy:n.y,snap:snapshot()};sel={n};say();return;}
      const e=edgeAt(x,y);if(e){sel={e};say(`Selected the wire ${nameOf(node(e.a))} → ${nameOf(node(e.b))}. Press Delete or × to remove it.`);return;}
      sel=null;say();},
    move(x,y){pal=PAL.findIndex((k,i)=>inBox(x,y,TILE(i)));hover=portAt(x,y)||nodeAt(x,y);if(!drag)return;drag.x=x;drag.y=y;
      if(drag.type==='move'&&!drag.n.fixed||drag.type==='move'&&drag.n.fixed){[drag.n.x,drag.n.y]=clampIn(drag.n,x-drag.dx,y-drag.dy);if(!drag.n.fixed&&y>LAB_BOARD.y+LAB_BOARD.h+6)drag.n.y=snap(y-drag.dy);}},
    up(x,y){if(!drag)return;const d=drag;drag=null;
      if(d.type==='new'){if(y<LAB_BOARD.y+LAB_BOARD.h+10)add(d.kind,x,y);return;}
      if(d.type==='wire'){const tgt=nodeAt(x,y);if(tgt&&tgt!==d.from)toggleEdge(d.from,tgt);return;}
      if(d.type==='move'){if(y>LAB_BOARD.y+LAB_BOARD.h+6&&!d.n.fixed){removeNode(d.n,d.snap);FX.text(x,LAB_BOARD.y+LAB_BOARD.h-14,'removed',C.dim,13);return;}if(d.n.x!==d.ox||d.n.y!==d.oy)remember(d.snap);save();}},
    cancel:cancelDrag,
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
      if(PIM_EFFECTS.next()<pps*dt)fl.push({t0:now,d:.55,pts:seg(e),c:f.bad?C.red:f.c||C.blue,r:3.6,drop:f.bad?.85:0});});}
};}
// a short label over a component, or under it when the component sits against the top of the board
function labMark(n,text,c,z){FX.text(n.x,n.y<LAB_BOARD.y+90?n.y+54:n.y-50,text,c,z||15);}
// a small padlock for a locked palette tile
function labLock(x,y){g.save();g.strokeStyle=C.amber;g.fillStyle=C.amber;g.lineWidth=1.6;g.beginPath();g.arc(x,y-2,3.5,Math.PI,0);g.stroke();g.fillRect(x-5,y-1,10,7);g.restore();}
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
