/* ---------------- 20. EVENT-DRIVEN: subscribe the services ---------------- */
// You build it on the board. Three event topics are published by other services; you add the services
// that react and subscribe each to the events it needs by wiring topic → service. Nobody calls anybody.
// Events flow live: a service that misses an event it needs, or reacts to one it should not, is a mistake.
// The email service is down from 5 s to 7 s; its events wait in its subscription.
(function(){
const TOPICS={placed:{label:'OrderPlaced',sub:'an order came in',c:C.blue,rate:6},failed:{label:'PaymentFailed',sub:'a card was declined',c:C.red,rate:1.5},shipped:{label:'ItemShipped',sub:'a box left the warehouse',c:C.green,rate:4}};
// what each service needs, and why reacting to the other events would be wrong
const NEEDS={email:{placed:'The confirmation email goes out when the order is placed.'},
  stock:{placed:'Stock is reserved as soon as the order exists.',failed:'When payment fails, the reserved items must be released for others.'},
  card:{failed:'Customers are asked to update their card only when payment fails.'},
  sms:{shipped:'A tracking link only exists once the box has shipped.'},
  reviews:{shipped:'Ask for a review after the box is on its way, not when the order is placed.'},
  points:{placed:'Loyalty points are awarded for placing an order, with zero changes to the order service.'}};
const WRONG={email:'Email sent an order confirmation for an event that was not a new order.',stock:'Inventory reserved or released stock at the wrong moment.',
  card:'Customers were asked to update a card that was never declined.',sms:'Tracking texts went out before anything shipped.',
  reviews:'Reviews were requested before anything shipped.',points:'Points were awarded for something other than placing an order.'};
chal('event-driven',{title:'Wire up the events',goal:'Build it yourself: add the services and subscribe each one to the events it must react to. Every service gets exactly what it needs, and nobody calls anybody directly.',
  hint:'Ask of each service: what just happened that it cares about? Inventory cares about two events: reserve stock when an order is placed, release it when payment fails.',
  make:labGame({id:'event-driven',
    hints:['For each service, ask: what just happened that it cares about?','Inventory needs two events. Tracking texts and review requests only make sense once something has shipped.'],
    solution:{nodes:['email','stock','card','sms','reviews','points'],edges:[[0,3],[0,4],[1,4],[1,5],[2,6],[2,7],[0,8]]},
    blame(S,G){const m=[];
      Object.keys(NEEDS).forEach(k=>{const s=G.of(k)[0];if(!s)return;
        Object.keys(TOPICS).forEach(tp=>{const src=G.of(tp)[0];if(!NEEDS[k][tp]&&G.out(src).includes(s))m.push({edge:src.id+'>'+s.id,note:'should not react to this'});});
        const miss=Object.keys((S.missed[k]||{})).filter(tp=>S.missed[k][tp]>.01);if(miss.length)m.push({id:s.id,note:`never hears ${miss.map(tp=>TOPICS[tp].label).join(' or ')}`});});
      return m;},budget:6,dur:12,scale:1.2,runLabel:'Start the events',
    intro:'Three kinds of events stream in on the left. Drag in the services that react, then wire each event to the services that care about it.',
    fixedKinds:Object.fromEntries(Object.entries(TOPICS).map(([k,v])=>[k,{label:v.label,shape:'box',c:v.c,w:176,h:52,sub:v.sub}])),
    fixed:[{kind:'placed',x:110,y:130,label:'OrderPlaced'},{kind:'failed',x:110,y:250,label:'PaymentFailed'},{kind:'shipped',x:110,y:370,label:'ItemShipped'}],
    kinds:{
      email:{label:'Email service',short:'Email',cost:1,max:1,shape:'server',w:152,h:48,sub:'order confirmation'},
      stock:{label:'Inventory',short:'Inventory',cost:1,max:1,shape:'server',w:152,h:48,sub:'reserve / release'},
      card:{label:'Card alerts',short:'Card alerts',cost:1,max:1,shape:'server',w:152,h:48,sub:'update your card'},
      sms:{label:'Tracking SMS',short:'Tracking',cost:1,max:1,shape:'server',w:152,h:48,sub:'text the link'},
      reviews:{label:'Reviews',short:'Reviews',cost:1,max:1,shape:'server',w:152,h:48,sub:'ask for a review'},
      points:{label:'Loyalty points',short:'Loyalty',cost:1,max:1,shape:'server',w:152,h:48,sub:'award points'}},
    columns:{email:560,stock:560,card:560,sms:820,reviews:820,points:820},
    links:{placed:Object.keys(NEEDS),failed:Object.keys(NEEDS),shipped:Object.keys(NEEDS)},
    check(G){const miss=Object.keys(NEEDS).filter(k=>!G.of(k).length);if(miss.length===6)return['drag in the services that react to events.'];
      const deaf=Object.keys(NEEDS).find(k=>G.of(k).length&&!G.inn(G.of(k)[0]).length);if(deaf)return[`${NAME(deaf)} is not subscribed to anything yet.`];
      return[];},
    sub(n,G,S){if(n.kind==='email'&&S&&S.down)return`down · ${Math.round(S.held)} waiting`;return null;},
    init(){return{down:false,held:0,missed:{},wrong:{},ok:0};},
    step(S,G,dt,t){const down=t>=5&&t<7,phase=t<5?'Events flowing':down?'Email service dies':'Email is back';S.down=down;
      const flows=[],load={};
      Object.keys(TOPICS).forEach(tp=>{const src=G.of(tp)[0],r=TOPICS[tp].rate;
        Object.keys(NEEDS).forEach(k=>{const s=G.of(k)[0],sub=s&&G.out(src).includes(s),need=!!NEEDS[k][tp];
          if(need&&!sub){S.missed[k]=S.missed[k]||{};S.missed[k][tp]=(S.missed[k][tp]||0)+r*dt;}
          if(!sub)return;
          if(!need)S.wrong[k]=(S.wrong[k]||0)+r*dt;else S.ok+=r*dt;
          if(k==='email'&&down){S.held+=r*dt;return;}
          const rr=k==='email'&&S.held>0?r*3:r;if(k==='email'&&!down)S.held=Math.max(0,S.held-r*2*dt);
          flows.push({a:src.id,b:s.id,rate:rr,bad:!need,c:TOPICS[tp].c});});});
      const em=G.of('email')[0];
      return{flows,load,dead:new Set(down&&em?[em.id]:[]),phase,badEdges:new Set(flows.filter(f=>f.bad).map(f=>f.a+'>'+f.b))};},
    hud(S){const m=Object.values(S.missed).reduce((a,o)=>a+Object.values(o).reduce((x,y)=>x+y,0),0),w=Object.values(S.wrong).reduce((a,b)=>a+b,0);
      return[['handled',`${Math.round(S.ok)}`,C.green],['missed',`${Math.round(m)}`,m<.5?C.green:C.red],['wrong reactions',`${Math.round(w)}`,w<.5?C.green:C.red]];},
    score(S,G){// one finding per service that got something wrong
      const issues=Object.keys(NEEDS).map(k=>{const miss=Object.keys(S.missed[k]||{}).filter(tp=>S.missed[k][tp]>.01),wrong=(S.wrong[k]||0)>.01;
        if(!G.of(k).length)return`${NAME(k)} is missing: drag it in. ${Object.values(NEEDS[k]).join(' ')}`;
        if(wrong)return`${WRONG[k]} ${Object.values(NEEDS[k]).join(' ')}`;
        if(miss.length)return`${NAME(k)} never heard about ${miss.map(tp=>TOPICS[tp].label).join(' or ')}. ${miss.map(tp=>NEEDS[k][tp]).join(' ')}`;
        return null;}).filter(Boolean);
      const uniq=issues,n=uniq.length;
      if(!n)return{stars:3,title:'Every event, the right reaction',msg:'Each service subscribed to exactly what it cares about, and Inventory to two events. The order service knows none of them: new reactions are added without touching it. Email\'s events simply waited out the outage.'};
      return{stars:n===1?2:n<=3?1:0,title:`${n} service${n>1?'s':''} wired wrong`,msg:uniq.slice(0,2).join(' ')+(n>2?` (and ${n-2} more)`:'')};}})});
function NAME(k){return{email:'Email service',stock:'Inventory',card:'Card alerts',sms:'Tracking SMS',reviews:'Reviews',points:'Loyalty points'}[k];}
})();
