/* Learning journeys and TownSquare's deliberately small, deterministic model.
   Units are teaching credits, not cloud prices. Every condition must pass. */
const JOURNEY_PATHS={
  foundations:{title:'Learn the basics',note:'Start with a packet and build up to a reliable system, one idea at a time.',ids:['packets','client-server','scaling','load-balancers','sessions','sql-nosql','caching','replication','queues-pubsub','spof','timeouts','capstone']},
  interview:{title:'Prepare for interviews',note:'Sizing, trade-offs and the classic designs, in the order interviews ask for them.',ids:['estimation','scaling','load-balancers','caching','sharding','replication','cap','queues-pubsub','resilience','consensus','capstone','capstone-chat','capstone-feed']},
  explore:{title:'Explore systems',note:'Every lesson, in any order. Follow whatever catches your interest.',ids:chapters.map(c=>c.id)}
};
const JOURNEY_MISSIONS=[
  {id:'launch',title:'Open the doors',chapter:'01',traffic:300,budget:7,story:'TownSquare helps neighbors find local events. Launch day brings 300 page reads a second. Your single app can serve 200. Keep the doors open without overspending.',goal:'Serve at least 99% of reads within 7 credits.',learn:['scaling','load-balancers'],conditions:[{name:'Launch traffic',eastDown:0,westDown:0}]},
  {id:'spike',title:'Everyone shares the link',chapter:'02',traffic:900,budget:11,story:'A popular organizer shares TownSquare. Reads triple, and one East app may fail. Most visitors ask for the same event pages. Adapt your launch design to survive both conditions.',goal:'Serve at least 99% of reads in every condition within 11 credits.',learn:['caching','spof'],conditions:[{name:'Viral traffic',eastDown:0,westDown:0},{name:'One East app fails',eastDown:1,westDown:0}]},
  {id:'regions',title:'Across the ocean',chapter:'03',traffic:1200,budget:20,story:'TownSquare is going international. Forty percent of reads now come from the West. Crossing regions takes 180 ms; a local response takes 40 ms. Bring the system closer to its readers and survive an app failure in either region.',goal:'Serve at least 99% of reads, with at least 95% of all reads within 100 ms, in every condition. Budget: 20 credits.',learn:['cdn','replication'],conditions:[{name:'Two regions online',eastDown:0,westDown:0},{name:'One East app fails',eastDown:1,westDown:0},{name:'One West app fails',eastDown:0,westDown:1}]}
];
function journeyDesign(value){
  if(!pimRecord(value)||!Number.isInteger(value.east)||value.east<1||value.east>6||!Number.isInteger(value.west)||value.west<0||value.west>4||typeof value.balancer!=='boolean'||typeof value.cache!=='boolean')return null;
  return {east:value.east,west:value.west,balancer:value.balancer,cache:value.cache};
}
function journeyCost(d){return 2+d.east*2+d.west*3+(d.west?3:0)+(d.balancer?1:0)+(d.cache?2:0);}
function journeyTrial(stage,design){
  const m=JOURNEY_MISSIONS[stage],d=journeyDesign(design);
  if(!m||!d||(stage<2&&d.west)||(stage===0&&d.cache))return null;
  const cost=journeyCost(d),rows=m.conditions.map(condition=>{
    const regions=stage===2&&d.balancer&&d.west>0;
    const eastReads=m.traffic*(regions?.6:1),westReads=regions?m.traffic*.4:0;
    const serve=(reads,count,failed)=>{
      if(!reads)return 0;
      // Without balancing all reads still go to the first app, even if it fails.
      const apps=d.balancer?Math.max(0,count-failed):(failed?0:Math.min(1,count));
      const hits=d.cache?reads*.6:0;
      return hits+Math.min(reads-hits,apps*200,500);
    };
    const east=serve(eastReads,d.east,condition.eastDown),west=serve(westReads,d.west,condition.westDown),served=east+west;
    const fast=stage===2?(regions?served:east*.6):served;
    return {...condition,served,delivery:served/m.traffic,fast:fast/m.traffic,passed:served/m.traffic>=.99&&(stage!==2||fast/m.traffic>=.95)};
  });
  return {cost,rows,passed:cost<=m.budget&&rows.every(r=>r.passed)};
}
function journeyInitial(){return {version:1,path:'foundations',intro:false,stage:0,draft:{east:1,west:0,balancer:false,cache:false},proofs:{}};}
function journeyDecode(value){
  if(!pimRecord(value)||value.version!==1||!Object.hasOwn(JOURNEY_PATHS,value.path)||typeof value.intro!=='boolean'||!Number.isInteger(value.stage)||value.stage<0||value.stage>2||!pimRecord(value.proofs))return null;
  const draft=journeyDesign(value.draft);if(!draft||(value.stage<2&&draft.west)||(value.stage===0&&draft.cache))return null;
  const proofs={};
  for(const [id,design] of Object.entries(value.proofs)){
    const i=JOURNEY_MISSIONS.findIndex(m=>m.id===id),d=journeyDesign(design);
    if(i<0||!d||!journeyTrial(i,d)?.passed)return null;
    proofs[id]=d;
  }
  // Later milestones require the preceding evidence, including on import.
  for(let i=1;i<3;i++)if((value.stage>=i||proofs[JOURNEY_MISSIONS[i].id])&&!proofs[JOURNEY_MISSIONS[i-1].id])return null;
  return {version:1,path:value.path,intro:value.intro,stage:value.stage,draft,proofs};
}
function journeyMerge(current,incoming){
  const a=journeyDecode(current)||journeyInitial(),b=journeyDecode(incoming);if(!b)return a;
  const result={...a,path:b.path,intro:a.intro||b.intro,proofs:{...a.proofs}};
  for(const [id,d] of Object.entries(b.proofs))if(!result.proofs[id]||journeyCost(d)<journeyCost(result.proofs[id]))result.proofs[id]=d;
  // Import brings a later campaign's draft, but never discards local work at the same stage.
  if(b.stage>a.stage){result.stage=b.stage;result.draft=b.draft;}
  return result;
}
function journeyIntro(step){const offered=step?360:80,servers=step>=2?2:1,balanced=step>=3,loads=balanced?[180,180]:servers===2?[offered,0]:[offered];return {offered,servers,balanced,loads,served:loads.reduce((sum,n)=>sum+Math.min(n,200),0)};}
