/* Four connected learning surfaces. Rendering is synchronous: testing a mission
   evaluates every named condition, so navigation never leaves a run behind. */
function initJourney(bridge){
  const $=id=>document.getElementById(id),root=$('journey');
  let state=journeyDecode(PIM_STORE.json('pim-journey',null))||journeyInitial(),route='home',introStep=0,result=null;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save=()=>PIM_STORE.put('pim-journey',state);
  const button=(id,text,primary=false)=>`<button class="btn${primary?' pri':''}" id="${id}">${text}</button>`;
  const maya=pose=>`<span class="j-maya" aria-hidden="true">${charSVG('maya',({celebrating:'celebrate',pointing:'point'})[pose]||pose,'Maya')}</span>`;
  const lessonLink=id=>{const c=chapters.find(c=>c.id===id);return c?`<a href="#${c.id}">${esc(c.title)}</a>`:'';};
  const heading=(_label,title,copy)=>`<header class="journey-heading"><h1 id="journeyTitle" tabindex="-1">${title}</h1><p>${copy}</p></header>`;
  function bind(id,fn){$(id).onclick=fn;}
  function focus(id='journeyTitle'){$(id).focus({preventScroll:true});}
  function diagram(d,{traffic=300,caption='Architecture preview',intro=false}={}){
    const west=d.west>0,cache=d.cache,split=west&&d.balancer;
    const node=(x,y,w,label,sub,kind='')=>`<g class="j-node ${kind}"><rect x="${x}" y="${y}" width="${w}" height="58" rx="9"/><text x="${x+w/2}" y="${y+24}">${label}</text><text class="j-svg-small" x="${x+w/2}" y="${y+43}">${sub}</text></g>`;
    const line=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1} L${x2} ${y2}"/>`;
    const appY=cache?268:180,storeY=appY+88,sourceY=cache?238:150,busY=appY-16;
    const branch=west?`<path d="M300 ${sourceY} V${busY} H150 V${appY}"/>${split?`<path d="M300 ${busY} H450 V${appY}"/>`:''}`:line(300,sourceY,300,appY);
    const paths=line(300,62,300,92)+(cache?line(300,150,300,180):'')+branch+(west?line(150,appY+58,150,storeY)+line(450,appY+58,450,storeY):line(300,appY+58,300,storeY));
    const description=cache?'The cache serves 60% of reads before the apps. Remaining reads go through apps to the store. ':'';
    return `<figure class="j-diagram"><svg viewBox="0 0 600 ${storeY+69}" role="img" aria-label="${esc(description+caption)}"><g class="j-wires">${paths}</g>${node(215,4,170,'READERS',traffic+' reads / second','j-node-blue')}${node(205,92,190,d.balancer?'LOAD BALANCER':'DIRECT CONNECTION',d.balancer?'Distribute the load':'First app receives all reads',d.balancer?'j-node-mint':'')}${cache?node(205,180,190,'EVENT-PAGE CACHE','60% served · 40% continue','j-node-mint'):''}${west?node(55,appY,190,`${d.east} EAST APPS`,'200 reads/s each')+node(355,appY,190,`${d.west} WEST APPS`,split?'200 reads/s each':'No route from readers'):node(185,appY,230,`${d.east} APP${d.east===1?'':'S'}`,d.balancer?'Traffic shared across apps':'Extra apps wait for traffic')}${west?node(55,storeY,190,'EAST STORE','500 reads/s')+node(355,storeY,190,'WEST REPLICA','500 reads/s'):node(185,storeY,230,intro?'RESPONSE':'EVENT STORE',intro?'Follow the requests':'500 reads/s','j-node-mint')}</svg><figcaption>${caption}</figcaption></figure>`;
  }
  // Home has one job: one clear way in. A paused lesson shows the Continue learning card (drawn by the
  // player below this heading); otherwise a single Start learning or Continue learning card.
  function home(){
    const progress=bridge.progress(),path=JOURNEY_PATHS[state.path],next=path.ids.find(id=>!progress.seen[id]);
    const resumed=!!pimResume(PIM_STORE.json('pim-resume',null)),fresh=!Object.keys(progress.seen).length;
    const target=next||path.ids[0],i=chapters.findIndex(c=>c.id===target),c=chapters[i];
    const intro=heading('','Build an instinct for systems.','System design, explained by watching it happen: short animated lessons, each followed by a hands-on challenge.');
    if(resumed){root.innerHTML=intro;return;}
    root.innerHTML=intro+`<section class="j-start" aria-labelledby="jStartTitle"><div class="j-start-copy"><span class="j-resume-label" id="jStartTitle">${fresh?'Start learning':'Continue learning'}</span><strong>${esc(c.title)}</strong><span class="j-start-meta">${fresh?'Your first lesson':'Next on your path'} · chapter ${i+1} of ${chapters.length} · about ${Math.max(1,Math.round(c.dur/60))} min</span></div>${button('jStart',fresh?'Start learning':'Continue learning',true)}</section>${fresh?'<p class="j-start-alt">New to system design? <a href="#intro">Find out what it is in about a minute</a>.</p>':''}`;
    bind('jStart',()=>bridge.lesson(target));
  }
  function map(){
    const progress=bridge.progress(),ids=JOURNEY_PATHS[state.path].ids,groups=[...new Set(chapters.filter(c=>ids.includes(c.id)).map(c=>c.group))];
    // You are here: the lesson you paused in, if it is on this route, otherwise the route's next lesson
    const paused=pimResume(PIM_STORE.json('pim-resume',null)),here=paused&&ids.includes(paused.chapter)?paused.chapter:ids.find(id=>!progress.seen[id]);
    root.innerHTML=heading('THE LEARNING MAP','Small steps. Connected ideas.','Follow a route or jump to a station. Prerequisites are suggestions, so every lesson stays open.')+`<label class="j-map-filter">Your route <select id="jMapPath">${Object.entries(JOURNEY_PATHS).map(([id,p])=>`<option value="${id}"${id===state.path?' selected':''}>${p.title}</option>`).join('')}</select></label><p class="j-map-key">◉ You are here &nbsp; ○ Not completed &nbsp; ✓ Lesson completed &nbsp; ★ Challenge stars</p><div class="j-map">${groups.map((group,index)=>{
      const list=ids.map(id=>chapters.find(c=>c.id===id)).filter(c=>c.group===group),n=list.filter(c=>progress.seen[c.id]).length;
      return `<section class="j-map-group${list.some(c=>c.id===here)?' j-group-here':''}"><header><span class="j-station">${String(index+1).padStart(2,'0')}</span><div><h2>${esc(group)}</h2><p>${n} / ${list.length} lessons completed</p></div></header><ol>${list.map(c=>`<li class="${progress.seen[c.id]?'j-complete':''}${c.id===here?' j-here':''}"><a class="j-map-lesson" href="#${c.id}"${c.id===here?' aria-current="step"':''}><span aria-hidden="true">${c.id===here?'◉':progress.seen[c.id]?'✓':'○'}</span><strong>${c.id===here?'<span class="j-here-tag">You are here</span>':''}${esc(c.title)}</strong><span class="j-lesson-state">${progress.seen[c.id]?'Completed':'Not completed'}${CHAL[c.id]?` · ${progress.stars[c.id]||0}/3 ★`:''}</span></a>${c.needs?.length?`<details><summary>Suggested before this</summary><div class="j-prereqs">${c.needs.map(lessonLink).join('')}</div></details>`:''}</li>`).join('')}</ol></section>`;
    }).join('')}</div>`;
    $('jMapPath').onchange=e=>{state.path=e.target.value;save();map();focus('jMapPath');};
  }
  // after the introduction: the next unseen lesson on the learner's path (the same one Home offers),
  // so a newcomer starts at the beginning instead of skipping ahead to load balancers
  const nextIntroLesson=()=>{const seen=bridge.progress().seen,ids=JOURNEY_PATHS[state.path].ids;return chapters.find(c=>c.id===(ids.find(id=>!seen[id])||ids[0]));};
  const balancerLesson=()=>chapters.find(c=>c.id==='load-balancers');
  // The introduction's own scene: each app is drawn separately so an overload, an idle app and the
  // shared load are visible. Packets flow along the wires; reduced motion hides them (journey.css).
  function introScene(s){
    const W=600,appW=s.servers===2?210:230,appY=s.balanced?226:196,apps=s.servers===2?[[50,0],[340,1]]:[[185,0]];
    const srcX=300,srcY=68,lbY=118,from=s.balanced?[srcX,lbY+58]:[srcX,srcY];
    const node=(x,y,w,label,sub,kind='')=>`<g class="j-node ${kind}"><rect x="${x}" y="${y}" width="${w}" height="58" rx="9"/><text x="${x+w/2}" y="${y+24}">${label}</text><text class="j-svg-small" x="${x+w/2}" y="${y+43}">${sub}</text></g>`;
    const wire=(x1,y1,x2,y2)=>`M${x1} ${y1} V${(y1+y2)/2} H${x2} V${y2}`;
    let wires=s.balanced?`<path d="M${srcX} ${srcY} V${lbY}"/>`:'',flow='',nodes=node(215,10,170,'READERS',`${s.offered} reads / second`,'j-node-blue');
    if(s.balanced){nodes+=node(205,lbY,190,'LOAD BALANCER','Shares reads across apps','j-node-mint');for(let k=0;k<6;k++)flow+=`<circle class="j-packet" r="4.5"><animateMotion dur="0.8s" repeatCount="indefinite" begin="${(-0.8*k/6).toFixed(2)}s" path="M${srcX} ${srcY} V${lbY}"/></circle>`;}
    apps.forEach(([x,i])=>{const load=s.loads[i]||0,cx=x+appW/2,over=load>200,idle=!load,path=wire(from[0],from[1],cx,appY);
      if(load)wires+=`<path d="${path}"/>`;
      // a packet every ~30 reads/s, spread along the wire
      const n=Math.min(10,Math.ceil(load/40));for(let k=0;k<n;k++)flow+=`<circle class="j-packet" r="4.5"><animateMotion dur="1.6s" repeatCount="indefinite" begin="${(-1.6*k/n).toFixed(2)}s" path="${path}"/></circle>`;
      // an overloaded app turns readers away: red packets bounce off its side
      if(over)for(let k=0;k<4;k++)flow+=`<circle class="j-packet j-dropped" r="4.5"><animateMotion dur="1.4s" repeatCount="indefinite" begin="${(-0.35*k).toFixed(2)}s" path="M${x+appW} ${appY+18} q40 -10 60 40"/><animate attributeName="opacity" values="1;0" dur="1.4s" repeatCount="indefinite" begin="${(-0.35*k).toFixed(2)}s"/></circle>`;
      nodes+=node(x,appY,appW,`APP ${i+1}`,`${load} / 200 reads/s`,over?'j-node-over':idle?'j-node-idle':'j-node-ok');
      if(over||idle)nodes+=`<g class="j-tag ${over?'j-tag-over':'j-tag-idle'}"><rect x="${cx-48}" y="${appY-26}" width="96" height="22" rx="11"/><text x="${cx}" y="${appY-11}">${over?'OVERLOADED':s.balanced?'IDLE':'IDLE · NO ROUTE'}</text></g>`;});
    const label=s.balanced?`Readers, a load balancer and two apps, each serving ${s.loads[0]} reads a second.`:s.servers===2?`Every read goes to app 1 (${s.loads[0]} a second, capacity 200); app 2 is idle.`:`Readers send ${s.offered} reads a second to one app with capacity 200${s.offered>200?': it is overloaded and drops '+(s.offered-s.served)+' a second':''}.`;
    return `<figure class="j-diagram j-intro-diagram"><svg viewBox="0 0 ${W} ${appY+70}" role="img" aria-label="${esc(label)}"><g class="j-wires">${wires}</g><g class="j-flow" aria-hidden="true">${flow}</g>${nodes}</svg><figcaption>${s.balanced?'Readers → load balancer → two apps':'Readers → app 1'+(s.servers===2?' (app 2 gets nothing)':'')}</figcaption></figure>`;
  }
  // Step 0: what system design is. A tap travels down to the servers and data; the answer comes back up.
  function whatScene(){
    const ys=[10,100,190,280],node=(y,label,sub,kind='')=>`<g class="j-node ${kind}"><rect x="170" y="${y}" width="260" height="58" rx="9"/><text x="300" y="${y+24}">${label}</text><text class="j-svg-small" x="300" y="${y+43}">${sub}</text></g>`;
    let wires='',flow='';
    for(let k=0;k<3;k++){const a=ys[k]+58,b=ys[k+1];wires+=`<path d="M288 ${a} V${b}"/><path class="j-wire-reply" d="M312 ${b} V${a}"/>`;}
    for(let k=0;k<4;k++)flow+=`<circle class="j-packet" r="4.5"><animateMotion dur="2.4s" repeatCount="indefinite" begin="${(-0.6*k).toFixed(2)}s" path="M288 68 V280"/></circle><circle class="j-packet j-reply" r="4.5"><animateMotion dur="2.4s" repeatCount="indefinite" begin="${(-0.6*k-0.3).toFixed(2)}s" path="M312 280 V68"/></circle>`;
    const nodes=node(ys[0],'YOU','Tap send in any app','j-node-blue')+node(ys[1],'THE INTERNET','Routers pass the request along')+node(ys[2],'APP SERVERS','Run the app’s code','j-node-mint')+node(ys[3],'DATABASE','Keeps posts, photos and accounts');
    return `<figure class="j-diagram j-intro-diagram j-what"><svg viewBox="0 0 600 348" role="img" aria-label="Your tap travels as a request across the internet to the app's servers and database, and the answer comes back."><g class="j-wires">${wires}</g><g class="j-flow" aria-hidden="true">${flow}</g>${nodes}</svg><figcaption>Your tap → the internet → servers → data, and the answer comes back</figcaption></figure>`;
  }
  // The introduction: what system design is (step 0), the app getting popular and being fixed (steps 1-4),
  // and why it is worth knowing (step 5). No timer: every step waits for the learner.
  const INTRO_LAST=5;
  function introduction(moveFocus=false){
    const step=introStep,demo=step>=1&&step<INTRO_LAST,s=journeyIntro(demo?step-1:3),next=nextIntroLesson(),first=!Object.keys(bridge.progress().seen).length;
    const titles=['Every app you use is a system.','A quiet morning.','Then everyone arrives.','A second app. Still a bottleneck.','Now the work is shared.','That was system design.'];
    const why=[['Building apps','they keep working when they get popular.'],['Job interviews','system design rounds are standard for software engineering roles.'],['Working with engineers','you understand why things break and what a fix costs.'],['Everyday curiosity','why ticket sites crash, and why a video starts instantly.']];
    const copy=['<p>When you send a message, open a map or stream a video, your phone sends a request across the internet to computers somewhere, and an answer comes back.</p><p><strong>System design</strong> is deciding how those computers are arranged and connected, so the app stays <strong>fast</strong>, <strong>reliable</strong> and <strong>affordable</strong> as more people use it.</p><p>Let’s try it with Maya’s new app, TownSquare.</p>',
      '<p>TownSquare runs on one app server. It handles 80 reads a second and has room for 200. Let’s see what happens when the traffic grows.</p>',
      '<p>360 reads a second reach an app that can handle 200. Some readers miss out. Give the system more capacity.</p>',
      '<p>The new app is idle: every read still goes to the first one. A load balancer can distribute those reads.</p>',
      '<p>Each app handles 180 reads a second. All 360 are served. Capacity and routing need to work together.</p>',
      `<p>You just made the kind of decision engineers make every day: how many machines to run, and how work reaches them. Knowing how systems behave is useful whether or not you write code:</p><ul class="j-why">${why.map(([a,b])=>`<li><strong>${a}:</strong> ${b}</li>`).join('')}</ul>`];
    const poses=['wave','calm','worried','worried','celebrating','pointing'],nexts=['See it in action','Send the traffic spike','Add a second server','Add a load balancer','What did I just do?'];
    const recap='<div class="j-recap"><h3>What you just did</h3><ol><li><strong>Spotted the bottleneck.</strong> One app got 360 reads a second but could only handle 200.</li><li><strong>Added capacity.</strong> A second app gave the system room for 400.</li><li><strong>Fixed the routing.</strong> A load balancer shared the reads, so all 360 were served.</li></ol><p>Every lesson in this course works the same way: watch a problem happen, then see how engineers fix it.</p></div>';
    const scene=step===0?whatScene():step===INTRO_LAST?recap:`${introScene(s)}<div class="j-loads">${s.loads.map((n,i)=>`<div><span>App ${i+1} · ${n} / 200 reads/s</span><meter min="0" max="360" low="0" high="200" optimum="180" value="${n}" aria-label="App ${i+1} load"></meter></div>`).join('')}</div>`;
    const metrics=demo?`<dl class="j-metrics"><div><dt>Reads served / second</dt><dd>${s.served} <small>/ ${s.offered}</small></dd></div><div><dt>Reads dropped / second</dt><dd class="${s.offered>s.served?'j-warning':'j-success'}">${s.offered-s.served}</dd></div></dl>`:'';
    const actions=step<INTRO_LAST?button('jIntroNext',nexts[step],true):button('jIntroLesson',`${first?'Start your first lesson':'Next lesson'}: ${esc(next.title)} →`,true)+'<a class="btn" href="#missions">Try your first mission</a>';
    const after=step<INTRO_LAST?'<a class="j-inline-link" href="#map">Explore the lessons</a>':`<p class="j-intro-next">${next.id===balancerLesson().id?`<strong>${esc(next.title)}</strong> shows how a balancer picks a server, checks health and routes around failures.`:`The course builds up to these ideas one at a time, starting with <strong>${esc(next.title)}</strong>.`}</p>`;
    root.innerHTML=heading('','What is system design?','See what it means, try it yourself, and find out why it’s worth knowing. About a minute, at your own pace.')+`<section class="j-intro"><div class="j-intro-scene">${scene}</div><div class="j-intro-copy">${maya(poses[step])}<h2 id="jIntroStep" tabindex="-1">${titles[step]}</h2><p class="j-step-count">Step ${step+1} of ${INTRO_LAST+1} · About a minute, at your pace</p>${copy[step]}${metrics}<div class="j-actions">${actions}${step?button('jIntroReset','Start over'):''}</div>${after}</div></section>`;
    if(step<INTRO_LAST)bind('jIntroNext',()=>{introStep++;if(introStep===INTRO_LAST){state.intro=true;save();}introduction(true);});
    if(step)bind('jIntroReset',()=>{introStep=0;introduction(true);});
    if(step===INTRO_LAST)bind('jIntroLesson',()=>bridge.lesson(next.id));
    if(moveFocus)focus('jIntroStep');
  }
  // Mission 3's map: the West marker lights up once there is a West region. The dashed route is West readers
  // crossing the ocean to the East; it fades when a load balancer serves them in the West.
  function regionsMap(d){
    const west=d.west>0,local=west&&d.balancer;
    const note=local?'West readers are served in the West, in about 40 ms.':west?'West apps are ready, but without a load balancer no reads reach them. West readers still cross the ocean.':'Every West reader crosses the ocean to the East: about 180 ms.';
    return `<figure class="j-regions${west?' j-regions-west':''}${local?' j-regions-local':''}" id="jRegions">${MISSION_ART['world-regions']}<figcaption>${note}</figcaption></figure>`;
  }
  function mission(){
    const m=JOURNEY_MISSIONS[state.stage],d=state.draft,done=!!state.proofs[m.id];
    root.innerHTML=heading('','Engineering missions','Design the architecture for TownSquare, a fictional events app, as it grows. Each mission brings new traffic and a new constraint: change your design, test it, and pass every check within the budget to unlock the next mission.')+`<div class="j-mission-how"><ol><li><span>1</span>Read the brief</li><li><span>2</span>Shape your system</li><li><span>3</span>Test all conditions</li></ol><button class="btn" id="jMissionHelp">How missions work</button></div><nav class="j-mission-nav" aria-label="Story chapters">${JOURNEY_MISSIONS.map((x,i)=>`<button class="j-mission-tab" id="jMission-${i}" ${i>0&&!state.proofs[JOURNEY_MISSIONS[i-1].id]?'disabled':''} ${i===state.stage?'aria-current="step"':''}><span>${state.proofs[x.id]?'✓':x.chapter}</span>${x.title}<small>${i>0&&!state.proofs[JOURNEY_MISSIONS[i-1].id]?'Complete the previous mission':state.proofs[x.id]?'Completed':'Ready to try'}</small></button>`).join('')}</nav>
      <section class="j-brief"><div><h2>${m.chapter} · ${m.title}</h2>${missionScene({maya:m.pose,eng:'think',rack:m.rack||'ok',say:m.story,office:true})}</div><div class="j-brief-row"><figure class="j-postcard">${MISSION_ART['postcard-'+m.postcard]}</figure><div class="j-brief-goal"><strong>Your goal</strong><p>${m.goal}</p></div></div></section>
      <div class="j-workbench"><section class="j-blueprint" aria-label="Your architecture">${state.stage===2?regionsMap(d):''}<div id="jMissionDiagram">${diagram(d,{traffic:m.traffic,caption:'Your current design · test it against every condition'})}</div><p class="j-budget" id="jBudget">${journeyCost(d)} / ${m.budget} credits</p></section><section class="j-design-controls" aria-labelledby="jDesignTitle"><h2 id="jDesignTitle">Shape your system</h2><p class="j-control-hint">Your design carries into the next mission.</p><label>East app servers <span>200 reads/s each · 2 credits each</span><select id="jEast">${Array.from({length:6},(_,i)=>`<option value="${i+1}"${d.east===i+1?' selected':''}>${i+1} app${i?'s':''}</option>`).join('')}</select></label><label class="j-check"><input id="jBalancer" type="checkbox"${d.balancer?' checked':''}><span><strong>Load balancer</strong><small>Distribute reads across apps and available regions · 1 credit</small></span></label>${state.stage>0?`<label class="j-check"><input id="jCache" type="checkbox"${d.cache?' checked':''}><span><strong>Event-page cache</strong><small>Serve 60% of reads before they reach apps · 2 credits total</small></span></label>`:''}${state.stage===2?`<label>West app servers <span>3 credits each + 3 for a local read replica</span><select id="jWest">${Array.from({length:5},(_,i)=>`<option value="${i}"${d.west===i?' selected':''}>${i?i+' app'+(i>1?'s':''):'No West region'}</option>`).join('')}</select></label>`:''}${button('jTest','Test all conditions',true)}<p class="j-control-hint">Instant capacity checks. No countdown.</p></section></div>
      <section class="j-mission-result" id="jMissionResult" aria-labelledby="jResultTitle" ${result?'':'hidden'}></section>
      <p class="j-tested" id="jSavedProof">${done?'Completed with a passing design. Edits above are a separate draft until you test them.':''}</p>
      <details class="j-model"><summary>How this teaching model works</summary><p>Each app serves 200 reads/s. Without a load balancer, only the first East app receives reads; if that app fails, no app reads are served. A cache serves a fixed 60% of reads before the apps, including during app failures. Each region’s store handles 500 reads/s. The East store costs 2 credits and is always included.</p><p>The load balancer splits reads among healthy apps. In mission 3, when West apps exist, it also routes 60% of reads East and 40% West. A West region includes a local read replica. Local reads take 40 ms; West readers served from East take 180 ms. Failed reads never count as fast reads.</p><p>Every named condition must meet the goal independently. Credits are teaching units, not provider prices. This read-only model excludes writes, replication lag, cache misses changing over time, network failures and load balancer failures.</p></details><div class="j-study"><strong>Explore the ideas</strong>${m.learn.map(lessonLink).join('')}</div>`;
    for(let i=0;i<3;i++)bind('jMission-'+i,()=>{if(i>0&&!state.proofs[JOURNEY_MISSIONS[i-1].id])return;if(i===state.stage)return;const previous=state.stage;state.stage=i;state.draft={...(state.proofs[JOURNEY_MISSIONS[i].id]||(i>previous?state.proofs[JOURNEY_MISSIONS[i-1].id]:journeyInitial().draft))};if(i<2)state.draft.west=0;if(i===0)state.draft.cache=false;result=null;save();mission();focus('jMission-'+i);});
    bind('jMissionHelp',()=>bridge.missionHelp(false));
    if(!PIM_STORE.get('pim-missions-help'))bridge.missionHelp(state.stage===0&&!Object.keys(state.proofs).length);
    const change=()=>{state.draft={east:+$('jEast').value,west:state.stage===2?+$('jWest').value:0,balancer:$('jBalancer').checked,cache:state.stage>0&&$('jCache').checked};result=null;save();$('jMissionDiagram').innerHTML=diagram(state.draft,{traffic:m.traffic,caption:'Your current design · test it against every condition'});$('jBudget').textContent=`${journeyCost(state.draft)} / ${m.budget} credits`;if(state.stage===2)$('jRegions').outerHTML=regionsMap(state.draft);$('jMissionResult').hidden=true;$('jSavedProof').textContent=done?'Previously completed. This edited draft has not been tested.':'Design changed. Test all conditions to check it.';};
    ['jEast','jBalancer',...(state.stage>0?['jCache']:[]),...(state.stage===2?['jWest']:[])].forEach(id=>{$(id).onchange=change;});
    bind('jTest',()=>{result=journeyTrial(state.stage,state.draft);if(result.passed){state.proofs[m.id]={...state.draft};save();}renderResult();focus('jResultTitle');});
    if(result)renderResult();
  }
  function renderResult(){
    const m=JOURNEY_MISSIONS[state.stage],r=result,box=$('jMissionResult');if(!r)return;
    // Maya reacts to the result: a celebration, or a worry in plain words; the rack shows the system's state
    const worry=r.cost>m.budget?'That design costs more than we can afford right now.':state.stage===2&&r.rows.some(x=>x.fast<.95)?'Readers in the West are still waiting too long.':'Some readers are still being turned away.';
    const scene=r.passed?missionScene({maya:'celebrate',eng:'celebrate',say:m.win,reply:state.stage<2?'On to the next one!':'Let us keep it running.',mood:'win'}):missionScene({maya:'worried',eng:'point',rack:'fail',say:worry,reply:'Let me look at the design again.',mood:'fail'});
    box.hidden=false;box.innerHTML=scene+`<h2 id="jResultTitle" tabindex="-1">${r.passed?'Your design holds up.':'A useful failure. A better next move.'}</h2><p>${r.passed?state.stage===2?'TownSquare is ready for readers in both regions. You completed the story.':'You met the delivery goal and the budget. Bring this design into the next chapter.':r.cost>m.budget?'Your design exceeds the budget. Reduce its cost and test again.':!state.draft.balancer?'Extra servers need traffic. Add a load balancer to distribute the work.':state.stage>0&&!state.draft.cache?'Repeated reads overload the apps or store. Try caching event pages.':state.stage===2&&!state.draft.west?'West readers still cross the ocean. Add apps in the West region.':'A failure leaves too little capacity. Add an app in the affected region and test again.'}</p><ul class="j-condition-list">${r.rows.map(x=>`<li><strong>${x.name}</strong><span>${(x.delivery*100).toFixed(1)}% served${state.stage===2?` · ${(x.fast*100).toFixed(1)}% within 100 ms`:''}</span><b class="${x.passed?'j-success':'j-warning'}">${x.passed?'Pass':'Needs work'}</b></li>`).join('')}<li><strong>Budget</strong><span>${r.cost} / ${m.budget} credits</span><b class="${r.cost<=m.budget?'j-success':'j-warning'}">${r.cost<=m.budget?'Pass':'Over budget'}</b></li></ul><div class="j-actions">${r.passed&&state.stage<2?button('jNextMission','Continue the story →',true):r.passed?'<a class="btn pri" href="#map">Keep exploring →</a>':''}</div>`;
    if(r.passed&&state.stage<2)bind('jNextMission',()=>{state.stage++;result=null;save();mission();focus();$('main').scrollTop=0;});
    $('jSavedProof').textContent=r.passed?'This passing design is saved.':'This draft has not passed all checks.';
  }
  function show(next){route=next;if(next==='home')home();else if(next==='map')map();else if(next==='intro')introduction();else mission();}
  return {show,export:()=>journeyDecode(state),merge:incoming=>{const before=JSON.stringify(state);state=journeyMerge(state,incoming);save();result=null;return before!==JSON.stringify(state);},refresh:()=>show(route)};
}
