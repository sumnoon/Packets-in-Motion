/* Deterministic model utilities. No canvas, DOM, storage or wall clock access. */
/** @typedef {{id:string,kind:string,x:number,y:number,fixed?:boolean}} LabNode */
/** @typedef {{nodes:LabNode[],edges:{a:string,b:string}[],opts:Object<string,boolean>}} LabDesign */
/** @typedef {LabDesign & {of:(kind:string)=>LabNode[],out:(node:LabNode,kinds?:string[])=>LabNode[],inn:(node:LabNode,kinds?:string[])=>LabNode[]}} LabGraph */
/** @typedef {{type:'incident',id:string,text:string,color:string,time:number}} LabEvent */
/** @typedef {{name:string,observed:number,target:number,passed:boolean}} LabRequirement */
/** @typedef {{requirements?:LabRequirement[],readings?:{name:string,value:string|number}[],sent?:number,delivered?:number,accepted?:number,persisted?:number,pending?:number}} LabMetrics */
/** @typedef {{stars:number,title:string,msg:string,metrics?:LabMetrics,seed?:number,elapsed?:number,cost?:number}} ChallengeResult */
/** @typedef {{update?:(now:number,dt:number)=>void,draw:(now:number,dt:number)=>void,cancel?:()=>void,dispose?:()=>void}} ChallengeInstance */
/** @typedef {{now:()=>number,status:(html:string)=>void,lock:(locked:boolean)=>void,win:(stars:number,title:string,msg:string)=>void,button:(label:string,onClick:()=>void,options?:Object)=>Object,metrics?:(rows:Array)=>void,later?:(callback:()=>void,ms:number)=>void}} ChallengeAPI */
/** @typedef {{flows:{a:string,b:string,rate:number,bad?:boolean}[],load:Object<string,number>,dead?:Set<string>,badEdges?:Set<string>,phase:string}} LabView */
/** @typedef {{dur:number,init:(graph:LabGraph)=>Object,step:(state:Object,graph:LabGraph,dt:number,time:number)=>LabView,hud:(state:Object,graph:LabGraph)=>Array,measure?:(state:Object,graph:LabGraph,cost:number)=>LabMetrics,score:(state:Object,graph:LabGraph,cost:number,metrics:LabMetrics)=>ChallengeResult}} LabScenario */

function pimRng(seed){return()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const PIM_RANDOM={seed:0,reset(seed){this.seed=seed>>>0;this.next=pimRng(this.seed);}};
// Tests inject a seed before startup; the shipped course chooses a fresh one.
PIM_RANDOM.reset(Number.isInteger(globalThis.PIM_TEST_SEED)?globalThis.PIM_TEST_SEED:typeof crypto!=='undefined'?crypto.getRandomValues(new Uint32Array(1))[0]:Math.floor(Math.random()*4294967296));
const PIM_EFFECTS={next:pimRng(PIM_RANDOM.seed^0x9e3779b9)};

/** Advance at a stable interval, retaining fractional time and stopping exactly at duration. */
function pimClock(step,duration=Infinity,interval=1/60){if(!(duration>=0)||duration!==Infinity&&!Number.isFinite(duration)||!Number.isFinite(interval)||interval<=0)throw new Error('Invalid simulation clock');let time=0,pending=0;
  return{get time(){return time;},advance(dt){if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid simulation delta');pending+=dt;
    while(time<duration&&pending+1e-9>=Math.min(interval,duration-time)){const d=Math.min(interval,duration-time);pending=Math.max(0,pending-d);time=Math.min(duration,time+d);step(d,time);}return time;}};}
/** @param {LabDesign} data @returns {LabGraph} */
function pimGraph(data){const G={nodes:data.nodes.map(n=>({...n})),edges:data.edges.map(e=>({...e})),opts:{...data.opts}};
  G.of=k=>G.nodes.filter(n=>n.kind===k);
  G.out=(n,kinds)=>G.edges.filter(e=>e.a===n.id).map(e=>G.nodes.find(m=>m.id===e.b)).filter(m=>m&&(!kinds||kinds.includes(m.kind)));
  G.inn=(n,kinds)=>G.edges.filter(e=>e.b===n.id).map(e=>G.nodes.find(m=>m.id===e.a)).filter(m=>m&&(!kinds||kinds.includes(m.kind)));return G;}
function labSignal(S,n,text,color){if(n)(S.events||(S.events=[])).push({type:'incident',id:n.id,text,color,time:S.time||0});}
/** A headless lab run owns its graph, seeded incident RNG, fixed clock and measured state.
 * @param {LabScenario} scenario @param {LabDesign} graph
 * @param {{seed?:number,chaos?:boolean}} options
 */
function pimLabRun(scenario,graph,{seed=0,chaos=false}={}){const G=pimGraph(graph),S=scenario.init(G);Object.assign(S,{seed:seed>>>0,chaos,rng:pimRng(seed),events:[],time:0});
  const clock=pimClock((dt,t)=>{S.time=t;S.view=scenario.step(S,G,dt,t);const T=S.track||(S.track={peak:{},bad:{}});
    for(const id in S.view.load||{}){const u=S.view.load[id];if(u>(T.peak[id]?.u||0))T.peak[id]={u,t};}
    for(const id of S.view.badEdges||[]){const b=T.bad[id]||(T.bad[id]={d:0,t});b.d+=dt;}
  },scenario.dur);
  return{state:S,graph:G,get time(){return clock.time;},advance:dt=>clock.advance(dt),events(){return S.events.splice(0);},
    result(cost){const metrics=scenario.measure?scenario.measure(S,G,cost):{readings:scenario.hud(S,G).map(([name,value])=>({name,value}))};return Object.freeze({...scenario.score(S,G,cost,metrics),metrics,seed:S.seed,elapsed:clock.time,cost});},
    snapshot(){return JSON.stringify(S,(_,v)=>v instanceof Set?[...v]:typeof v==='function'?undefined:v);}};}
