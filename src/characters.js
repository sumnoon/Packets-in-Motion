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
// a small server rack whose lights show how the system is doing: ok, hot or fail
function rackSVG(state){
  const light=i=>state==='fail'&&i===1?'var(--red)':state==='hot'&&i<2?'var(--amber)':'var(--green)';
  return `<svg class="m-rack m-rack-${state}" viewBox="0 0 60 150" aria-hidden="true"><rect x="2" y="2" width="56" height="146" rx="6" fill="#0f1a2e" stroke="#3b4a69" stroke-width="2"/>${[0,1,2,3].map(i=>`<rect x="9" y="${12+i*33}" width="42" height="25" rx="3" fill="#18253d"/><circle class="m-led" cx="17" cy="${24.5+i*33}" r="3" fill="${light(i)}"/><circle cx="26" cy="${24.5+i*33}" r="3" fill="${light(i)}" opacity=".6"/><path d="M34 ${21+i*33} h11 M34 ${28+i*33} h8" stroke="#3b4a69" stroke-width="2" stroke-linecap="round"/>`).join('')}</svg>`;
}
// a scene: Maya speaking on the left; you, the engineer, with an optional reply and the rack on the right
function missionScene({maya='calm',eng='type',rack='ok',say='',reply='',mood=''}){
  return `<div class="m-scene${mood?' m-scene-'+mood:''}">
<div class="m-side m-side-maya">${charSVG('maya',maya,`Maya, TownSquare's founder, ${({calm:'holding a tablet',wave:'waving hello',worried:'looking worried',celebrate:'celebrating',point:'pointing ahead'})[maya]||''}`)}
<div class="m-bubble m-bubble-maya"><span class="m-who">Maya · founder, TownSquare</span><p>${esc(say)}</p></div></div>
<div class="m-side m-side-you">${reply?`<div class="m-bubble m-bubble-you"><span class="m-who">You · engineer</span><p>${esc(reply)}</p></div>`:''}
<div class="m-you">${charSVG('engineer',eng,`You, the engineer, ${({type:'typing on a laptop',think:'thinking',point:'pointing at the server rack',celebrate:'celebrating'})[eng]||''}`)}${rackSVG(rack)}</div></div>
</div>`;
}
