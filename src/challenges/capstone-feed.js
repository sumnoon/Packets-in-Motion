/* ---------------- 24. CAPSTONE: build the news feed and survive the big night ---------------- */
// You build it on the board. Ordinary posting needs 220,000 feed writes/s; a fan-out worker does
// 100,000/s. A star with 30 M followers posts at 3 s, and feed loads jump 20× at 8 s.
// The strategy follows from your wiring:
//   post service → fan-out queue → workers → feed cache, read by the feed service   = fan-out on write
//   feed service → posts database only                                                = fan-out on read
//   both, with "skip fan-out for stars" on                                            = hybrid
(function(){
const NEED=220000,WORKER=1e5,STAR=30e6;
chal('capstone-feed',{title:'Build the news feed',goal:'Build it yourself: ordinary posting needs 220,000 feed writes a second, a star with 30 million followers posts, then feed loads jump 20×. Keep p99 feed loads ≤ 200 ms, new posts visible within 10 s, and spend ≤ $18/h.',
  hint:'Posters → post service → posts database and a fan-out queue → workers → feed cache. Readers → feed service → feed cache (fast), plus the posts database for stars, plus a page cache for the spike. Skip fan-out for stars, and give the workers a little headroom over 220k/s.',
  make:labGame({id:'capstone-feed',
    hints:['One star with 30 million followers posts. What does copying that post into 30 million feeds cost?','Fan out on write for ordinary accounts, skip fan-out for stars and read their posts from the database at load time, and cache first pages for the spike.'],
    solution:{nodes:['postsvc','postdb','fanq','fanw','feedcache','feedsvc','pagecache','fanw','fanw'],edges:[[0,2],[2,3],[2,4],[4,5],[5,6],[1,7],[7,6],[7,3],[7,8]],opts:{skipStars:true}},lean:17,
    loadNote:(n,u)=>n.kind==='feedsvc'?`feed loads took ${Math.round(u*200)} ms`:n.kind==='fanq'?'fan-out writes piling up':n.kind==='fanw'?'more writes than the workers do':null,budget:18,dur:14,scale:5000,
    intro:'Two kinds of traffic: Posters write posts, Readers open their feed. Build a path for each, then decide how posts reach followers’ feeds.',
    fixedKinds:{readers:{label:'Readers',shape:'user',w:44,h:44},posters:{label:'Posters',shape:'user',w:44,h:44}},
    fixed:[{kind:'posters',x:70,y:150,label:'Posters + a star'},{kind:'readers',x:70,y:360,label:'Readers'}],
    kinds:{
      postsvc:{label:'Post service',short:'Post svc',cost:1,max:1,shape:'server',w:100,h:48,sub:'accepts posts'},
      postdb:{label:'Posts database',short:'Posts DB',cost:2,max:1,shape:'db',w:86,h:66,sub:'sharded'},
      fanq:{label:'Fan-out queue',short:'Fan-out Q',cost:1,max:1,shape:'box',c:C.amber,w:104,h:46,sub:'post → followers'},
      fanw:{label:'Fan-out worker',short:'Worker',cost:2,max:6,shape:'server',w:94,h:46,sub:'100k writes/s',clone:true},
      feedcache:{label:'Feed cache',short:'Feed cache',cost:2,max:1,shape:'box',c:C.green,w:108,h:48,sub:'a list per user'},
      feedsvc:{label:'Feed service',short:'Feed svc',cost:2,max:1,shape:'server',w:104,h:50,sub:'merge · rank'},
      pagecache:{label:'Page cache',short:'Page cache',cost:3,max:1,shape:'box',c:C.accent,w:108,h:46,sub:'first page'}},
    columns:{postsvc:220,postdb:440,fanq:440,fanw:640,feedcache:840,feedsvc:290,pagecache:520},
    links:{posters:['postsvc'],readers:['feedsvc'],postsvc:['postdb','fanq'],fanq:['fanw'],fanw:['feedcache'],feedsvc:['feedcache','postdb','pagecache']},
    toggles:[{key:'skipStars',label:'Skip fan-out for accounts with over 1 M followers',val:false}],
    check(G){const P=G.of('posters')[0],R=G.of('readers')[0];
      if(!G.out(P).length)return['wire Posters to a post service.'];if(!G.out(R).length)return['wire Readers to a feed service.'];
      const ps=G.of('postsvc')[0];if(ps&&!G.out(ps,['postdb']).length)return['the post service must save posts in the posts database.'];
      const fs=G.of('feedsvc')[0];if(fs&&!G.out(fs,['feedcache','postdb']).length)return['the feed service needs somewhere to read feeds from.'];
      return[];},
    init(G){return{q:0,fresh:0,loads:[],why:{}};},
    step(S,G,dt,t){const ts=labAt(S,'star',3,2,6),tp=labAt(S,'spike',8,7,10),phase=t<ts?'Normal posting':t<tp?'The star posts':'Everyone opens the app';
      const P=G.of('posters')[0],R=G.of('readers')[0],ps=G.out(P,['postsvc'])[0],fs=G.out(R,['feedsvc'])[0];
      const saves=ps&&G.out(ps,['postdb']).length>0,q=ps&&G.out(ps,['fanq'])[0],ws=q?G.out(q,['fanw']):[],writers=ws.filter(w=>G.out(w,['feedcache']).length);
      const fanOut=!!(q&&writers.length),fromCache=fs&&G.out(fs,['feedcache']).length>0,fromDb=fs&&G.out(fs,['postdb']).length>0,page=fs&&G.out(fs,['pagecache']).length>0,skip=G.opts.skipStars;
      const flows=[],load={},bad=new Set(),F=(a,b,r,isBad,c)=>{if(!a||!b)return;flows.push({a:a.id,b:b.id,rate:r,bad:isBad,c});if(isBad)bad.add(a.id+'>'+b.id);};
      // posting: fan-out writes pile into the queue; workers drain it
      const cap=writers.length*WORKER;if(fanOut){S.q+=NEED*dt;if(!S.star&&t>=ts&&!skip){S.q+=STAR;S.star=true;labSignal(S,q,'+30 M writes',C.red);}S.q=Math.max(0,S.q-cap*dt);
        const wait=Math.max(NEED/cap,S.q/cap)+(cap<=NEED?60:0);S.fresh=Math.max(S.fresh,wait);load[q.id]=Math.min(1.5,S.q/(cap*10));writers.forEach(w=>load[w.id]=NEED/cap);}
      else if(fromCache)S.fresh=Math.max(S.fresh,1e9);         // nothing fills the feed cache: new posts never show up
      if(fromCache&&fanOut&&skip&&!fromDb)S.fresh=Math.max(S.fresh,1e9);   // stars skip fan-out, but nothing reads their posts
      if(ps){F(P,ps,2000,!saves);if(saves)F(ps,G.out(ps,['postdb'])[0],2000,false,C.amber);if(q){F(ps,q,NEED,false,C.amber);writers.forEach(w=>{F(q,w,cap?NEED/writers.length:0,S.q>cap*10,C.amber);F(w,G.out(w,['feedcache'])[0],NEED/writers.length,false,C.amber);});}}
      if(!ps||!saves)S.why.noSave=true;
      // reading: latency depends on where the feed comes from
      const spike=t>=tp,loadsPerS=spike?40000:2000;let ms;
      if(!fs||!(fromCache||fromDb))ms=5000;
      else if(fromCache)ms=spike?(page?40:260):(skip&&fromDb?45:30);
      else ms=spike?(page?820:2400):820;
      S.loads.push([ms,loadsPerS*dt]);load[fs?fs.id:'']=ms/200;
      if(fs){F(R,fs,loadsPerS,ms>200,C.green);if(fromCache)F(fs,G.out(fs,['feedcache'])[0],loadsPerS,false,C.green);if(fromDb)F(fs,G.out(fs,['postdb'])[0],fromCache?loadsPerS*.05:loadsPerS*30,!fromCache,C.blue);if(page)F(fs,G.out(fs,['pagecache'])[0],loadsPerS,false,C.accent);}
      S.mode=fanOut&&fromCache?(skip&&fromDb?'hybrid':'write'):fromDb?'read':'none';
      return{flows,load,phase,badEdges:bad};},
    hud(S){const l=p99(S),f=S.fresh;return[['p99 feed load',`${l>=5000?'—':l+' ms'}`,l<=200?C.green:C.red],['post visible after',f>=1e8?'never':`${f.toFixed(1)} s`,f<=10?C.green:C.red]];},
    score(S,G,cost){const l=p99(S),f=S.fresh,a=l<=200,b=f<=10&&!S.why.noSave,c=cost<=18,n=[a,b,c].filter(Boolean).length;
      if(n===3)return{stars:3,title:'The feed held up',msg:`Posts visible within ${f.toFixed(1)} s, p99 ${l} ms, $${cost}/h. Fan-out on write for ordinary accounts, the star read at load time, and cached pages for the spike: the hybrid feed, built by you.`};
      const why=[!a&&(S.mode==='read'?'Fan-out on read makes every feed load query hundreds of accounts: precompute feeds into a feed cache.':l>=5000?'Readers had nowhere to load a feed from.':'The spike overwhelmed the feed service: add a page cache.'),
        !b&&(S.why.noSave?'Posts were never saved: wire the post service to the posts database.':f>=1e8?(G.opts.skipStars&&!G.of('feedsvc').some(s=>G.out(s,['postdb']).length)?'Stars skip fan-out, but the feed service never reads their posts from the database.':'Nothing ever fills the feed cache: fan posts out through a queue and workers.'):S.mode==='write'?'The star’s 30 M fan-out writes buried everyone else’s posts: skip fan-out for stars.':'The workers could not keep up with ordinary posting: add a little headroom over 220k/s.'),
        !c&&`Over budget at $${cost}/h.`].filter(Boolean).join(' ');
      return{stars:n===2?2:n===1?1:0,title:`${n} of 3 goals`,msg:why};}})});
function p99(S){const a=S.loads.slice().sort((x,y)=>x[0]-y[0]),W_=a.reduce((s,x)=>s+x[1],0);let w=0;for(const[m,v]of a){w+=v;if(w>=W_*.99)return m;}return 0;}
})();
