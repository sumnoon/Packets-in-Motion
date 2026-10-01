/* ---------------- 15. SYNC vs ASYNC: make checkout fast ---------------- */
// You build it on the board. Checkout must get seven jobs done for every order. A job wired straight
// from Checkout runs before the reply (the customer waits for it); a job wired from the queue runs
// after the reply. 5 orders a second; the email service is down from 4 s to 7.5 s; 5% of carts
// are invalid and 10% of cards are declined.
(function(){
const JOBS={cart:{label:'Cart check',ms:50,must:'You cannot accept an invalid cart: check it before saying "Order placed".',bad:.05},
  pay:{label:'Payment',ms:400,must:'Customers were told "Order placed" before their card was declined: charge the card before replying.',bad:.10},
  save:{label:'Orders database',ms:30,must:'Customers were told "Order placed" before the order was saved: save it before replying.',bad:.20},
  email:{label:'Email',ms:800},recs:{label:'Recommendations',ms:1200},invoice:{label:'PDF invoice',ms:900},warehouse:{label:'Warehouse',ms:300}};
const IDS=Object.keys(JOBS),RATE=5;
chal('sync-async',{title:'Make checkout fast',goal:'Build it yourself: Checkout must get seven jobs done for every order. Wire a job straight from Checkout to do it before replying, or through a queue to do it afterwards. Reply within 600 ms, never mislead a customer, and survive the email service going down.',
  hint:'Only what the customer must know before the page says "Order placed" belongs on a direct wire: checking the cart, charging the card and saving the order. Everything else goes through the queue.',
  make:labGame({id:'sync-async',budget:8,dur:12,scale:1,runLabel:'Open checkout',
    intro:'Checkout is on the left. A job wired straight from it happens before the customer sees "Order placed". A job wired from a queue happens a moment later. Every job must be wired somewhere.',
    fixedKinds:{checkout:{label:'Checkout',shape:'server',w:116,h:56,sub:'5 orders/s'}},
    fixed:[{kind:'checkout',x:96,y:250,label:'Checkout'}],
    kinds:Object.assign({queue:{label:'Queue',short:'Queue',cost:1,max:1,shape:'box',c:C.amber,w:110,h:54,sub:'jobs for later'}},
      Object.fromEntries(IDS.map(k=>[k,{label:JOBS[k].label,short:JOBS[k].label.replace('Recommendations','Recs').replace('Orders database','Orders DB'),cost:1,max:1,shape:k==='save'?'db':'box',c:k==='save'?undefined:C.green,w:k==='save'?92:118,h:k==='save'?64:46,sub:`${JOBS[k].ms} ms`}]))),
    columns:{queue:300,cart:600,pay:600,save:600,email:860,recs:860,invoice:860,warehouse:860},
    links:{checkout:['queue',...IDS],queue:IDS},
    check(G){const c=G.of('checkout')[0];if(!G.out(c).length)return['wire Checkout to the jobs it must do.'];
      const q=G.of('queue')[0];if(q&&G.inn(q).length&&!G.out(q).length)return['wire the queue to the jobs it should run later.'];
      const off=IDS.filter(k=>!G.of(k).length||!G.inn(G.of(k)[0]).length);if(off.length)return[`every job must be wired: ${off.map(k=>JOBS[k].label).join(', ')} ${off.length>1?'are':'is'} not.`];
      return[];},
    sub(n,G,S){if(n.kind==='queue'&&S)return`${Math.round(S.backlog)} waiting`;if(n.kind==='email'&&S&&S.down)return'DOWN';if(n.kind==='checkout'&&S)return`replies in ${S.ms} ms`;return null;},
    init(){return{n:0,acc:0,ms:0,down:false,backlog:0,failed:0,misled:{},skipped:{},slow:0};},
    step(S,G,dt,t){const down=t>=4&&t<7.5,phase=t<4?'Customers checking out':down?'The email service dies':'Email is back';S.down=down;
      const c=G.of('checkout')[0],q=G.out(c,['queue'])[0],job=k=>G.of(k)[0];
      const sync=IDS.filter(k=>job(k)&&G.out(c).includes(job(k))),later=q?IDS.filter(k=>job(k)&&G.out(q).includes(job(k))&&!sync.includes(k)):[];
      const ms=sync.reduce((a,k)=>a+JOBS[k].ms,0)+(q?5:0);S.ms=ms;
      const orders=RATE*dt;S.n+=orders;
      // a direct call to a dead service fails the whole checkout
      const failing=down&&sync.includes('email');if(failing)S.failed+=orders;
      if(ms>600)S.slow+=orders;
      later.forEach(k=>{if(JOBS[k].bad)S.misled[k]=(S.misled[k]||0)+orders*JOBS[k].bad;});
      IDS.filter(k=>!sync.includes(k)&&!later.includes(k)).forEach(k=>S.skipped[k]=(S.skipped[k]||0)+orders);
      // the queue holds email jobs while the service is down
      if(later.includes('email')){if(down)S.backlog+=orders;else S.backlog=Math.max(0,S.backlog-RATE*4*dt);}
      const flows=[],load={};
      sync.forEach(k=>flows.push({a:c.id,b:job(k).id,rate:RATE,bad:(k==='email'&&down)||(ms>600),c:C.blue}));
      if(q&&later.length){flows.push({a:c.id,b:q.id,rate:RATE,bad:false,c:C.amber});later.forEach(k=>{if(!(k==='email'&&down))flows.push({a:q.id,b:job(k).id,rate:k==='email'&&S.backlog>0?RATE*4:RATE,bad:false,c:C.green});});}
      load[c.id]=ms/600;if(q)load[q.id]=Math.min(1.5,S.backlog/40);
      return{flows,load,dead:new Set(down&&job('email')?[job('email').id]:[]),phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S){const m=Object.values(S.misled).reduce((a,b)=>a+b,0);return[['reply time',`${S.ms} ms`,S.ms<=600?C.green:C.red],['misled',`${Math.round(m)}`,m<.5?C.green:C.red],['failed',`${Math.round(S.failed)}`,S.failed<.5?C.green:C.red]];},
    score(S,G,cost){const misled=Object.entries(S.misled).filter(([k,v])=>v>.01),skipped=Object.keys(S.skipped).filter(k=>S.skipped[k]>.01);
      const issues=[];
      if(skipped.length)issues.push(`${skipped.map(k=>JOBS[k].label).join(', ')} never happened: every job must be wired, directly or through the queue.`);
      misled.forEach(([k])=>issues.push(JOBS[k].must));
      if(S.failed>.5)issues.push('While the email service was down, every checkout that waited for it failed. Send email through the queue: it waits there until the service is back.');
      if(S.ms>600)issues.push(`Customers waited ${S.ms} ms. Move the jobs nobody waits for (email, recommendations, invoice, warehouse) to the queue.`);
      if(!issues.length)return{stars:3,title:`Replies in ${S.ms} ms`,msg:'Check the cart, charge the card, save the order, reply. Everything else ran from the queue, so the email outage cost nothing: the jobs waited and went out when it came back.'};
      const n=issues.length,wrong=skipped.length||misled.length;
      return{stars:wrong?(n>2?0:1):n>1?1:2,title:wrong?(misled.length?'Customers were misled':'Jobs went missing'):`${n} thing${n>1?'s':''} to fix`,msg:issues.join(' ')};}})});
})();
