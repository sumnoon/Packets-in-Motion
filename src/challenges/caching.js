/* ---------------- 11. CACHING: beat LRU ---------------- */
chal('caching',{title:'Beat LRU',goal:'The cache holds 4 items. When it is full and a new item arrives, you choose what to evict. Match or beat LRU\'s hit count.',
  hint:'Things used recently tend to be used again soon. Evict the item that has gone longest without being asked for.',
  make:api=>{const N=26,SL=4;let stream=[],slots,i,hits,lru,waiting,t0,last,done,cur,curT;
    function gen(){const s=[];let hot=['A','B','C'];for(let k=0;k<N;k++){if(k===13)hot=['D','E','B'];const r=Math.random();s.push(r<.72?hot[Math.floor(Math.random()*3)]:'FGHK'[Math.floor(Math.random()*4)]);}return s;}
    function lruHits(s){const c=[];let h=0;s.forEach(x=>{const j=c.indexOf(x);if(j>=0){h++;c.splice(j,1);}else if(c.length>=SL)c.shift();c.push(x);});return h;}
    function reset(){stream=gen();lru=lruHits(stream);slots=[];i=0;hits=0;waiting=false;done=false;t0=null;cur=null;api.status(`Requests arrive one by one. LRU would score <b>${lru}</b> hits on this exact stream.`);}
    reset();const SX=k=>320+k*120,SY=270;
    function arrive(now){cur=stream[i];curT=now;const j=slots.findIndex(s=>s.k===cur);
      if(j>=0){hits++;slots[j].used=now;FX.burst(SX(j),SY,C.green,14,120);FX.text(SX(j),SY-58,'HIT',C.green,15);next(now);}
      else if(slots.length<SL){slots.push({k:cur,used:now});FX.text(SX(slots.length-1),SY-58,'miss',C.amber,14);next(now);}
      else{waiting=true;api.status(`<b>${cur}</b> is not cached and the cache is full. Click an item to evict.`);}}
    function next(now){i++;last=now;cur=null;if(i>=N){done=true;setTimeout(()=>api.win(hits>=lru?3:hits>=lru-2?2:1,`${hits} hits · LRU got ${lru}`,hits>=lru?'You matched the machine. Evicting what was least recently used is hard to beat when popularity shifts over time.':'Evict the item that has waited longest since its last request. That is exactly what LRU does.'),500);}}
    return{draw(now){if(t0===null){t0=now;last=now-.4;}if(!waiting&&!done&&!cur&&now-last>.75)arrive(now);
        tx('incoming',120,150,{z:12,c:C.dim});stream.slice(i,i+6).forEach((k,j)=>{const x=120-j*0+0,y=190+j*44;plate(120+(j?0:0),200+j*44,j?50:66,j?34:44,{c:j?C.edge:C.blue,a:j?.5:1,fill:C.panel2});tx(k,120,201+j*44,{z:j?15:22,wt:800,a:j?.5:1});});
        tx('cache (4 slots)',SX(0)+180,180,{z:13,c:C.dim});
        for(let k=0;k<SL;k++){const s=slots[k],pick=waiting;plate(SX(k),SY,96,96,{c:pick?C.red:s?C.accent:C.line,fill:C.panel,glow:pick?(8+6*Math.sin(now*8)):0});
          if(s){tx(s.k,SX(k),SY-4,{z:34,wt:800});tx(`used ${(now-s.used).toFixed(1)}s ago`,SX(k),SY+32,{z:10.5,c:C.dim});}}
        tx('database',860,SY,{z:12,c:C.dim});db(860,SY+60,{label:'DB',w:70,h:60});
        tx(`hits ${hits}`,SX(0)-40,420,{z:18,wt:800,c:C.green,al:'left'});tx(`LRU target ${lru}`,SX(3)+48,420,{z:14,wt:700,c:C.dim,al:'right'});tx(`${Math.min(i+1,N)} / ${N}`,SX(0)+180,450,{z:12,c:C.dim,f:MONO});},
      click(x,y,now){if(!waiting)return;const k=[0,1,2,3].find(k=>Math.abs(x-SX(k))<50&&Math.abs(y-SY)<50);if(k==null)return;FX.burst(SX(k),SY,C.red,10,120);slots[k]={k:cur,used:now};waiting=false;api.status('Keep going…');next(now);},
      key(k,now){if(waiting&&k>='1'&&k<='4')this.click(SX(+k-1),SY,now);}};}});
