/* ---------------- mission characters ----------------
   Maya, TownSquare's founder, and you, the engineer, drawn as full-body flat figures in SVG so
   they can change pose without any image files. Each figure stands in a 120 × 220 box with its
   feet on y = 212. Poses move the arms (shoulder → elbow → hand), the face and the props; the
   rest of the body is shared. Motion (breathing, blinking, a hop, confetti) is CSS in
   journey.css and switches off under reduced motion. */
const CHAR_POSES={
  maya:['calm','wave','worried','celebrate','point'],
  engineer:['type','think','point','celebrate']
};
const CHAR_LOOK={
  maya:{skin:'#f1c3a7',skinShade:'#d99c80',hair:'#2b2152',top:'var(--accent)',topShade:'#7c6bd6',legs:'#1c2540',shoes:'#0d1322'},
  engineer:{skin:'#c68a62',skinShade:'#a5694a',hair:'#2a1c12',top:'var(--green)',topShade:'#1f9a72',legs:'#1d3557',shoes:'#0d1322'}
};
// arms as [elbow, hand] for the left and right sides, per pose
const CHAR_ARMS={
  calm:[[44,120],[52,132],[76,120],[68,130]],
  wave:[[42,124],[42,150],[94,82],[96,46]],
  worried:[[30,86],[46,56],[90,86],[74,56]],
  celebrate:[[34,70],[28,34],[86,70],[92,34]],
  point:[[40,122],[42,146],[92,96],[114,86]],
  type:[[44,122],[54,134],[76,122],[68,134]],
  think:[[44,122],[64,124],[80,112],[66,72]]
};
function charFace(pose){
  const eyes=pose==='celebrate'?'<path d="M50 54 q3 -4 6 0 M64 54 q3 -4 6 0" stroke="#2a1a14" stroke-width="2" fill="none" stroke-linecap="round"/>'
    :'<g class="mc-eyes"><ellipse cx="53" cy="54" rx="2.2" ry="2.6" fill="#2a1a14"/><ellipse cx="67" cy="54" rx="2.2" ry="2.6" fill="#2a1a14"/></g>';
  const brows=pose==='worried'?'<path d="M48 46 l8 3 M72 46 l-8 3" stroke="#2a1a14" stroke-width="1.8" stroke-linecap="round"/>'
    :pose==='think'?'<path d="M48 47 q4 -2 8 0 M64 45 q4 -1 8 1" stroke="#2a1a14" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    :'<path d="M48 47 q4 -2 8 0 M64 47 q4 -2 8 0" stroke="#2a1a14" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
  const mouth=pose==='worried'?'<ellipse cx="60" cy="64" rx="3.2" ry="2.6" fill="#8a3a2a"/>'
    :pose==='celebrate'||pose==='wave'?'<path d="M53 61 q7 8 14 0 z" fill="#8a3a2a"/>'
    :pose==='think'?'<path d="M56 64 q5 -1 9 -3" stroke="#8a3a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>'
    :'<path d="M54 62 q6 4 12 0" stroke="#8a3a2a" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  return brows+eyes+mouth+'<ellipse cx="49" cy="61" rx="3" ry="1.8" fill="#e8907a" opacity=".35"/><ellipse cx="71" cy="61" rx="3" ry="1.8" fill="#e8907a" opacity=".35"/>';
}
function charHair(who,back){
  if(who==='maya')return back
    ?'<path d="M38 52 Q36 24 60 22 Q84 24 82 52 L84 96 Q74 102 70 88 L70 60 L50 60 L50 88 Q46 102 36 96 Z" fill="#2b2152"/>'
    :'<path d="M41 52 Q42 30 60 30 Q78 30 79 52 Q74 38 60 38 Q52 38 46 44 Q44 48 41 52 Z" fill="#2b2152"/><path d="M58 31 Q68 30 76 40" stroke="#4a3d82" stroke-width="2" fill="none" stroke-linecap="round"/>';
  return back?'':'<path d="M41 50 Q40 26 60 26 Q80 26 79 50 Q76 36 64 36 Q66 32 60 31 Q50 34 46 40 Q42 44 41 50 Z" fill="#2a1c12"/>';
}
// one arm: a sleeve from shoulder to elbow, a forearm to the hand, then the hand
function charArm(sx,sy,[ex,ey],[hx,hy],look,front){
  return `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="${front?look.top:look.topShade}" stroke-width="11" stroke-linecap="round"/>`+
    `<path d="M${ex} ${ey} L${hx} ${hy}" stroke="${front?look.top:look.topShade}" stroke-width="9" stroke-linecap="round"/>`+
    `<circle cx="${hx}" cy="${hy}" r="5.2" fill="${look.skin}"/>`;
}
function charProps(who,pose){
  if(who==='maya'&&pose==='calm')return '<g transform="rotate(-8 60 124)"><rect x="47" y="108" width="28" height="36" rx="4" fill="#0f1a2e" stroke="#9fb4d8" stroke-width="2"/><rect x="51" y="113" width="20" height="5" rx="1.5" fill="var(--blue)"/><rect x="51" y="121" width="14" height="3" rx="1" fill="#5d7196"/><rect x="51" y="127" width="17" height="3" rx="1" fill="#5d7196"/></g>';
  if(who==='engineer'&&pose==='type')return '<g><path d="M36 136 L84 136 L90 146 L30 146 Z" fill="#9fb4d8"/><rect x="40" y="110" width="40" height="27" rx="3" fill="#1b2a44" stroke="#9fb4d8" stroke-width="2"/><path d="M45 118 h18 M45 124 h26 M45 130 h12" stroke="var(--green)" stroke-width="2" stroke-linecap="round"/></g>';
  return '';
}
function charSVG(who,pose,label){
  const look=CHAR_LOOK[who],a=CHAR_ARMS[pose]||CHAR_ARMS.calm,front=who==='engineer'&&pose==='type'||who==='maya'&&pose==='calm';
  const glasses=who==='engineer'?'<g fill="none" stroke="#1b2333" stroke-width="1.6"><circle cx="53" cy="54" r="5"/><circle cx="67" cy="54" r="5"/><path d="M58 54 h4"/></g>':'';
  const badge=who==='engineer'?'<path d="M54 82 L60 100 L66 82" stroke="#e7ecf5" stroke-width="1.4" fill="none"/><rect x="56" y="100" width="8" height="10" rx="1.5" fill="#e7ecf5"/>':'<circle cx="60" cy="88" r="2.4" fill="#f5e6b8"/>';
  // arms behind a held prop are drawn first so the prop covers the hands' join
  const arms=charArm(46,90,a[0],a[1],look,!front)+charArm(74,90,a[2],a[3],look,!front);
  return `<svg class="mc mc-${who} mc-${pose}" viewBox="0 0 120 220" role="img" aria-label="${esc(label)}">
<ellipse cx="60" cy="213" rx="30" ry="5" fill="#000" opacity=".22"/>
<g class="mc-body">
<path d="M50 150 L48 206" stroke="${look.legs}" stroke-width="12" stroke-linecap="round"/><path d="M70 150 L72 206" stroke="${look.legs}" stroke-width="12" stroke-linecap="round"/>
<path d="M40 204 h14 a4 4 0 0 1 0 8 h-17 a3 3 0 0 1 3 -8 Z M66 204 h14 a3 3 0 0 1 3 8 h-17 a4 4 0 0 1 0 -8 Z" fill="${look.shoes}"/>
${charHair(who,true)}
${front?'':arms}
<path d="M42 88 Q60 78 78 88 L82 152 Q60 158 38 152 Z" fill="${look.top}"/>
<path d="M60 82 L60 152" stroke="${look.topShade}" stroke-width="1.2" opacity=".5"/>
${badge}
<rect x="55" y="68" width="10" height="14" rx="3" fill="${look.skinShade}"/>
<circle cx="60" cy="52" r="19" fill="${look.skin}"/>
${charHair(who,false)}
${charFace(pose)}${glasses}
${front?charProps(who,pose)+arms:''}
</g>
${pose==='celebrate'?'<g class="mc-confetti"><rect x="18" y="20" width="5" height="5" fill="var(--amber)"/><rect x="98" y="14" width="5" height="5" fill="var(--green)"/><circle cx="30" cy="8" r="3" fill="var(--blue)"/><circle cx="90" cy="30" r="3" fill="var(--red)"/><rect x="60" y="2" width="4" height="6" fill="var(--accent)"/></g>':''}
</svg>`;
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
