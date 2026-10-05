/* Mission cast: shared native SVG source, with unique IDs per rendered instance.
   Group classes preserve breathing, blinking and result animations. */
const CHAR_POSES={maya:['calm','wave','worried','celebrate','point'],engineer:['type','think','point','celebrate']};
let characterInstance=0;
function charSVG(who,pose,label){
  const vectors=who==='maya'?MAYA_VECTORS:ENGINEER_VECTORS;
  const name=({type:'typing',think:'thinking',celebrate:'celebrating',point:'pointing'})[pose]||pose;
  const source=vectors[name]||vectors[who==='maya'?'calm':'thinking'],prefix='mc-'+who+'-'+(++characterInstance)+'-';
  return source.replace(/<metadata>[\s\S]*?<\/metadata>/,'').replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}${id}"`)
    .replace('<svg ',`<svg class="mc mc-${who} mc-${pose}" `)
    .replace('aria-labelledby="title"',`aria-label="${esc(label)}"`)
    .replace(/(<g id="[^"]+" data-part="figure")/,'<g class="mc-body">$1').replace('</svg>','</g></svg>')
    .replace('data-part="eyes"','data-part="eyes" class="mc-eyes"');
}
// mission art (mission-art-assets.js) with a class added to its root
const artSVG=(name,cls,attrs='')=>MISSION_ART[name].replace('<svg ',`<svg class="${cls}" ${attrs}`);
// the server rack, whose lights show how the system is doing: ok, hot (under load) or fail. A failing rack
// stacks its dim frame over the bright one and blinks between them; reduced motion keeps the bright frame.
function rackSVG(state){
  if(state==='fail')return `<span class="m-rack m-rack-fail">${artSVG('server-rack-failing','m-rack-frame')}${artSVG('server-rack-failing-dim','m-rack-frame m-rack-dim')}</span>`;
  return artSVG(state==='hot'?'server-rack-under-load':'server-rack-healthy',`m-rack m-rack-${state}`);
}
// a speech bubble with its tail pointing down towards the speaker
const bubble=(who,side,name,text)=>`<div class="m-bubble m-bubble-${who}"><span class="m-who">${name}</span><p>${esc(text)}</p>${artSVG('speech-tail-'+side,'m-tail')}</div>`;
// a burst of falling confetti over a passing result
function confettiBurst(){
  const colors=['violet','mint','blue','amber','red'];
  return `<div class="m-confetti" aria-hidden="true">${Array.from({length:14},(_,i)=>artSVG(`confetti-${colors[i%5]}-${i%2?'circle':'square'}`,'',`style="left:${(3+i*7).toFixed(1)}%;animation-delay:${(-(i*.37)%2.2).toFixed(2)}s;animation-duration:${(2+(i%4)*.25).toFixed(2)}s"`)).join('')}</div>`;
}
// a scene: Maya speaking on the left; you, the engineer, with an optional reply and the rack on the right.
// Small effects carry the mood: a sparkle and confetti on a win, a sweat drop when Maya worries, an alert over a failing rack.
// office: the TownSquare office corner as a quiet backdrop between the two of them.
function missionScene({maya='calm',eng='type',rack='ok',say='',reply='',mood='',office=false}){
  const mayaFx=mood==='win'?artSVG('sparkle','m-fx m-fx-sparkle'):maya==='worried'?artSVG('sweat-drop','m-fx m-fx-sweat'):'';
  const rackFx=rack==='fail'?artSVG('exclamation','m-fx m-fx-alert'):'';
  return `<div class="m-scene${mood?' m-scene-'+mood:''}">${office?`<div class="m-office" aria-hidden="true">${MISSION_ART['townsquare-office']}</div>`:''}${mood==='win'?confettiBurst():''}
<div class="m-side m-side-maya"><span class="m-cast">${charSVG('maya',maya,`Maya, TownSquare's founder, ${({calm:'holding a tablet',wave:'waving hello',worried:'looking worried',celebrate:'celebrating',point:'pointing ahead'})[maya]||''}`)}${mayaFx}</span>
${bubble('maya','left','Maya · founder, TownSquare',say)}</div>
<div class="m-side m-side-you">${reply?bubble('you','right','You · engineer',reply):''}
<div class="m-you">${charSVG('engineer',eng,`You, the engineer, ${({type:'typing on a laptop',think:'thinking',point:'pointing at the server rack',celebrate:'celebrating'})[eng]||''}`)}<span class="m-cast">${rackSVG(rack)}${rackFx}</span></div></div>
</div>`;
}
