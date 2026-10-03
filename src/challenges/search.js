/* ---------------- S2. SEARCH: answer with the index ---------------- */
chal('search',{title:'Be the search engine',goal:'Answer three queries using only the inverted index: pick exactly the documents that match each one.',
  hint:'AND keeps documents in both lists, OR keeps documents in either, AND NOT removes the second list from the first.',
  make:api=>{const DOCS=['Caching with Redis','Redis streams for events','CDN caches images','Sharding Postgres by user','Redis cache for sessions','Edge CDN for video'];
    const IDX=[['cache',[1,3,5]],['redis',[1,2,5]],['cdn',[3,6]],['shard',[4]],['stream',[2]],['session',[5]]];
    const Q=[['cache AND redis',[1,5],['cache','redis']],['cdn OR shard',[3,4,6],['cdn','shard']],['redis AND NOT cache',[2],['redis','cache']]];
    let r=0,sel=new Set(),right=0,shown=0,done=false;const DY=k=>150+k*58;
    const choices=DOCS.map((t,k)=>api.button(`D${k+1}: ${t}`,()=>toggle(k+1)));
    const say=()=>{choices.forEach((b,k)=>{b.setAttribute('aria-pressed',String(sel.has(k+1)));b.disabled=done||!!shown;});api.status(`Query ${r+1} of 3: <b>${Q[r][0]}</b>. Press <kbd>1</kbd>–<kbd>6</kbd> (or click) to pick documents, then <kbd>Enter</kbd>. Picked: ${sel.size?[...sel].sort().map(d=>'D'+d).join(', '):'none'}.`);};
    function toggle(d){if(done||shown||d<1||d>6)return;sel.has(d)?sel.delete(d):sel.add(d);say();}
    function submit(){if(done||shown)return;const want=Q[r][1],ok=want.length===sel.size&&want.every(d=>sel.has(d));if(ok)right++;
      shown=api.now();choices.forEach(b=>b.disabled=true);FX.text(W/2,108,ok?'Right!':'Not quite',ok?C.green:C.red,18);api.status(`${ok?'<b>Right.</b>':'<span class="bad">✕</span>'} ${Q[r][0]} → ${want.map(d=>'D'+d).join(', ')}.`);}
    api.button('Check my answer',submit,{primary:true});say();
    return{update(now){if(shown&&now-shown>2){shown=0;sel=new Set();r++;if(r>=3){done=true;r=2;api.win(right,`${right} of 3 queries right`,right===3?'Postings lists in, set operations out: that is every search engine\'s inner loop.':'Look up each term\'s list, then intersect (AND), unite (OR) or subtract (AND NOT).');}else say();}},
      draw(now){if(api.metrics)api.metrics(IDX.map(([term,ds])=>[term,ds.map(d=>'D'+d).join(', ')]));
        const q=Q[r];pill(`query: ${q[0]}`,W/2,70,{c:C.accent,z:16,f:MONO});
        DOCS.forEach((t,k)=>{const d=k+1,on=sel.has(d),want=shown&&q[1].includes(d),y=DY(k);plate(250,y,360,48,{c:shown?(want?C.green:on?C.red:C.edge):on?C.accent:C.edge,fill:on?hexA(C.accent,.12):C.panel2,r:10});
          keycap(String(d),88,y);tx(`D${d}`,112,y,{z:13,wt:800,f:MONO,c:C.dim,al:'left'});tx(t,150,y,{z:14,al:'left'});});
        tx('inverted index',650,128,{z:12,c:C.dim,al:'left'});
        IDX.forEach(([term,ds],k)=>{const y=DY(k),hot=q[2].includes(term);tx(term,650,y,{z:15,wt:750,f:MONO,c:hot?C.accent:C.text,al:'left'});ds.forEach((d,j)=>pill(`D${d}`,760+j*58,y,{c:hot?C.accent:C.blue,z:12,f:MONO,a:hot?1:.5}));});
        tx(`${r+1} / 3`,80,40,{z:13,wt:700,c:C.dim,f:MONO});},
      click(x,y){const k=DOCS.findIndex((_,k)=>Math.abs(x-250)<180&&Math.abs(y-DY(k))<24);if(k>=0)toggle(k+1);},
      key(k){if(k==='Enter'){submit();return;}toggle(+k);}};}});
