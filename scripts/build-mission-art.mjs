#!/usr/bin/env node
// Original native vectors: fixed palette, transparent canvas, editable semantic layers.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'assets/mission-art');
const C={navy:'#04060d',panel:'#131b2b',line:'#27334d',violet:'#a78bfa',mint:'#34d399',blue:'#4ea1ff',amber:'#fbbf24',red:'#f87171',white:'#e7ecf5',muted:'#8f9ab0',skin:'#b98461',lightSkin:'#efb58e'};
const pathEl=(d,fill,attrs='')=>`<path d="${d}" fill="${fill}" ${attrs}/>`;
const line=(d,color=C.line,width=2,attrs='')=>pathEl(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${attrs}`);
const rect=(x,y,w,h,r,fill,attrs='')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${attrs}/>`;
const ellipse=(x,y,rx,ry,fill,attrs='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${attrs}/>`;
const g=(id,body,attrs='')=>`<g id="${id}" data-part="${id}" inkscape:groupmode="layer" inkscape:label="${id}" ${attrs}>${body}</g>`;
const move=(x,y,body,scale=1)=>`<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`;
const scope=(prefix,body)=>body.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`);
const shade=(x,y,rx)=>ellipse(x,y,rx,4,C.muted,'opacity=".12"');
const assets=[];
function add(name,w,h,body,category,description){assets.push({name,width:w,height:h,body,category,description});}
function svg(a){return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${a.width}" height="${a.height}" viewBox="0 0 ${a.width} ${a.height}" role="img" aria-labelledby="${a.name}-title"><title id="${a.name}-title">${a.description}</title>${g(a.name,a.body)}</svg>\n`;}

function rack(state){
  let units='';
  for(let i=0;i<4;i++){
    const y=20+i*32,failed=state.startsWith('failing')&&i===1,color=failed?C.red:state==='under-load'&&i<2?C.amber:C.mint;
    units+=g('unit-'+i,rect(22,y,56,26,4,C.panel)+line(`M28 ${y+22} H72`,C.line,1.4)+
      g('lights-'+i,ellipse(31,y+10,3,3,color)+ellipse(41,y+10,2,2,color),failed&&state==='failing-dim'?'opacity=".22"':'')+
      line(`M53 ${y+8} H69 M53 ${y+14} H65`,C.muted,1.5)+ellipse(27,y+21,1,1,C.muted)+ellipse(73,y+21,1,1,C.muted));
  }
  return g('ground-shadow',shade(50,166,36))+g('rack-body',rect(15,8,70,151,8,C.line)+rect(18,10,64,145,6,C.navy)+line('M21 14 H76',C.muted,1.5)+rect(19,153,12,9,2,C.line)+rect(69,153,12,9,2,C.line))+g('rack-units',units);
}
for(const state of ['healthy','under-load','failing','failing-dim'])add('server-rack-'+state,100,180,rack(state),'Racks',`Server rack: ${state.replaceAll('-',' ')}`);

function laptop(){return g('screen-shell',pathEl('M24 10 H115 Q119 10 118 15 L109 76 H16 L20 14 Q21 10 24 10',C.line)+pathEl('M26 15 H113 L105 70 H20 Z',C.navy)+line('M26 13 H113',C.muted,1.4))+g('screen-code',line('M32 28 H53 M60 28 H77 M30 38 H42 M49 38 H89 M28 48 H48 M55 48 H69 M26 58 H60',C.mint,3))+g('keyboard-base',pathEl('M16 76 H109 L135 95 Q136 99 130 100 H7 Q3 100 5 96 Z',C.muted)+pathEl('M5 96 H135 L131 101 H8 Z',C.line)+pathEl('M24 80 H103 L113 87 H17 Z',C.panel)+line('M29 83 H101',C.muted,1)+pathEl('M53 89 H83 L88 95 H48 Z',C.line));}
add('laptop-open',140,110,laptop(),'Hand props','Open laptop with abstract mint code lines');
function tablet(){return g('tablet-shell',rect(6,4,62,86,7,C.line)+rect(9,7,56,79,5,C.navy)+line('M14 7 H58',C.muted,1.3))+g('chart-screen',rect(14,16,46,56,3,C.panel)+line('M21 61 H54',C.muted,1.3)+rect(21,44,7,13,1,C.blue)+rect(33,35,7,22,1,C.blue)+rect(45,25,7,32,1,C.blue)+line('M21 23 H35',C.muted,1.5))+g('home-indicator',line('M30 79 H44',C.muted,2));}
add('tablet-chart',74,96,tablet(),'Hand props','Tablet with blue chart blocks');

function office(){
  const buildings=[[230,78,23,51],[259,62,28,67],[292,86,20,43],[318,46,29,83],[352,71,33,58],[391,59,20,70]];
  const city=buildings.map(([x,y,w,h],i)=>rect(x,y,w,h,1,C.line)+[0,1,2].map(j=>rect(x+6,y+9+j*13,3,4,0,C.muted,'opacity=".4"')).join('')).join('');
  return g('ground-shadow',ellipse(250,210,221,5,C.muted,'opacity=".08"'))+
    g('night-window',rect(220,22,199,126,7,C.line)+rect(226,28,187,111,3,C.navy)+ellipse(382,48,8,8,C.muted,'opacity=".5"')+g('city-silhouette',city)+line('M316 28 V140 M226 92 H413',C.panel,5)+rect(213,145,213,8,2,C.line))+
    g('desk',pathEl('M139 143 H342 L329 153 H130 Z',C.muted)+rect(131,153,208,8,2,C.line)+pathEl('M147 161 H157 L151 206 H140 Z M315 161 H325 L334 206 H323 Z',C.line)+rect(270,165,51,21,3,C.panel)+line('M288 174 H304',C.muted,1.5))+
    // the lamp sits left of the window so its shade stays clear of the frame
    g('desk-lamp',move(-18,0,rect(171,139,39,4,2,C.line)+line('M188 139 V110 L210 93',C.muted,3)+pathEl('M196 94 Q212 82 226 98 L220 104 L201 102 Z',C.line)))+
    g('desk-items',pathEl('M243 138 L279 138 L287 143 H240 Z',C.line)+pathEl('M247 116 H275 L279 138 H243 Z',C.panel)+rect(300,128,13,14,3,C.line)+line('M313 131 Q323 130 319 138 H314',C.line,2))+
    g('plant-stem',line('M91 175 V102 M91 133 L70 114 M91 150 L111 125 M91 115 L107 96',C.muted,2))+
    g('plant-leaves',pathEl('M91 126 Q61 124 61 100 Q86 102 91 126 M92 147 Q121 144 123 119 Q102 119 92 147 M92 112 Q88 86 109 81 Q119 103 92 112 M89 158 Q64 157 66 137 Q82 136 89 158',C.line)+line('M69 107 L84 120 M116 127 L99 142 M106 91 L96 107',C.muted,1,'opacity=".5"'))+
    g('plant-pot',pathEl('M70 173 H111 L106 205 H76 Z',C.line)+rect(67,169,47,8,3,C.muted)+pathEl('M98 177 H109 L105 203 H96 Z',C.panel));
}
add('townsquare-office',480,230,office(),'Scene pieces','Muted office corner with desk, plant and night city window');

// An illustrative continent silhouette, not a political or navigational map.
function continents(fill=C.line){return pathEl('M38 45 L53 31 L80 29 L93 18 L126 21 L135 33 L118 40 L114 52 L98 61 L91 75 L77 81 L78 95 L93 103 L101 118 L115 122 L114 131 L98 129 L88 115 L77 111 L62 90 L47 82 L38 65 L25 61 Z M102 130 L122 128 L139 146 L147 164 L140 180 L131 188 L126 207 L115 224 L107 211 L109 190 L99 173 L94 150 Z M139 23 L157 13 L174 18 L169 41 L155 52 L141 41 Z M205 47 L212 33 L225 32 L237 45 L254 35 L283 33 L299 23 L343 24 L361 37 L393 37 L414 48 L422 63 L408 75 L389 69 L380 83 L362 86 L350 104 L332 110 L316 100 L303 106 L296 125 L282 118 L273 96 L258 93 L247 76 L233 79 L222 66 L208 66 Z M215 79 L237 80 L256 102 L263 129 L247 151 L237 178 L224 184 L212 165 L211 142 L197 124 L194 105 L204 88 Z M284 130 L297 136 L304 153 L316 157 L318 167 L303 164 L293 155 Z M343 168 L365 157 L387 170 L398 190 L383 201 L359 197 L347 205 L332 194 Z M405 207 L412 202 L417 214 L411 221 Z M259 166 L266 164 L264 182 L258 189 Z M405 87 L411 91 L410 112 L403 120 L398 111 Z',fill);}
function marker(id,x,y,color){return g(id,ellipse(x,y,16,16,color,'opacity=".08"')+ellipse(x,y,10,10,color,'opacity=".18"')+ellipse(x,y,5,5,color)+ellipse(x-1.2,y-1.2,1.7,1.7,C.white),`data-pivot="${x} ${y}"`);}
// The route is a quadratic curve from the west marker towards the east one. It stops short of the east
// marker's glow so the arrowhead stays visible, pointing along the curve's final direction.
const ROUTE=[[91,72],[211,-7],[343,86]];
const routeAt=t=>[0,1].map(k=>(1-t)**2*ROUTE[0][k]+2*(1-t)*t*ROUTE[1][k]+t*t*ROUTE[2][k]);
function routeArrow(){
  const [a,b,c]=ROUTE,len=Math.hypot(c[0]-b[0],c[1]-b[1]),d=[(c[0]-b[0])/len,(c[1]-b[1])/len],n=[-d[1],d[0]];
  const tip=[c[0]-d[0]*19,c[1]-d[1]*19],base=[tip[0]-d[0]*11,tip[1]-d[1]*11],f=v=>v.toFixed(1);
  const corner=s=>`${f(base[0]+n[0]*6*s)} ${f(base[1]+n[1]*6*s)}`;
  return line(`M${a} Q${b} ${f(base[0])} ${f(base[1])}`,C.blue,2,'stroke-dasharray="5 7"')+pathEl(`M${f(tip[0])} ${f(tip[1])} L${corner(1)} L${corner(-1)} Z`,C.blue);
}
function world(linked=true){return g('continents',continents())+(linked?g('region-link',routeArrow()):'')+marker('region-west',...ROUTE[0],C.blue)+marker('region-east',...ROUTE[2],C.mint);}
add('world-regions',450,240,world(),'Scene pieces','World silhouette with West and East region markers and a packet route');

for(const [name,color] of Object.entries({violet:C.violet,mint:C.mint,blue:C.blue,amber:C.amber,red:C.red})){
  add('confetti-'+name+'-square',20,20,g('piece',rect(5,5,10,10,1,color),'transform="rotate(18 10 10)"'),'Effects',`${name} square confetti`);
  add('confetti-'+name+'-circle',20,20,g('piece',ellipse(10,10,5,5,color)),'Effects',`${name} circle confetti`);
}
add('sparkle',48,48,g('sparkle-core',pathEl('M24 4 Q27 20 43 24 Q27 27 24 44 Q21 28 5 24 Q21 21 24 4',C.amber))+g('small-spark',pathEl('M39 3 L41 9 L47 11 L41 13 L39 19 L37 13 L31 11 L37 9 Z',C.white)),'Effects','Small four-point burst and sparkle');
add('exclamation',32,56,g('stem',pathEl('M11 6 Q16 3 21 6 L19 35 H13 Z',C.amber))+g('dot',ellipse(16,45,4,4,C.amber)),'Effects','Exclamation mark drawn as paths');
add('sweat-drop',32,48,g('drop',pathEl('M18 3 C17 16 5 22 5 32 C5 46 27 46 27 32 C27 22 19 15 18 3',C.blue))+g('highlight',line('M12 27 Q8 34 13 37',C.white,2)),'Effects','Blue sweat drop');
for(const direction of ['left','right'])add('speech-tail-'+direction,40,32,g('tail',pathEl(direction==='left'?'M6 3 H35 L7 27 Q13 12 6 3':'M5 3 H34 Q27 12 33 27 Z',C.panel)+line(direction==='left'?'M6 3 Q13 12 7 27 L35 3':'M5 3 L33 27 Q27 12 34 3',C.line,2)),'Effects',`${direction} speech-bubble tail with an open attachment edge`);

function person(id,x,y,color,skin=C.skin,pose='walk'){
  const hand=pose==='phone'?line('M13 30 L24 38 L29 26',color,7)+rect(26,18,9,15,2,C.panel)+rect(28,21,5,8,1,C.blue):line('M13 29 L24 47',color,7);
  return move(x,y,g(id,g(id+'-shadow',shade(9,91,23))+g(id+'-leg-left',line('M4 51 L0 82 L-7 86',C.muted,7))+g(id+'-leg-right',line('M14 51 L21 82 L28 86',C.line,7))+g(id+'-torso',pathEl('M0 20 Q9 16 18 23 L20 54 H-3 Z',color))+g(id+'-arm-left',line('M1 28 L-11 45 L-4 51',color,7))+g(id+'-arm-right',hand)+g(id+'-head',ellipse(9,10,6.5,8,skin)+pathEl('M2 10 Q0 -1 10 0 Q19 1 16 9 L11 5 L5 7 Z',C.panel)+g(id+'-eyes',ellipse(7,10,.6,.8,C.panel)+ellipse(12,10,.6,.8,C.panel))+g(id+'-mouth',line('M8 14 Q10 15 12 14',C.panel,.7))+g(id+'-brows',line('M6 8 H8 M11 8 H13',C.panel,.6)))));
}
function phone(id,x,y,scale=1,screen=C.panel,content=''){
  return move(x,y,g(id,g(id+'-case',rect(0,0,80,139,12,C.line)+rect(4,4,72,131,9,C.navy)+line('M15 5 H65',C.muted,1.5))+g(id+'-screen',rect(9,17,62,105,4,screen)+content)+g(id+'-speaker',line('M31 10 H49',C.muted,2))+g(id+'-home',line('M29 128 H51',C.muted,2))),scale);
}
function storefront(){return g('storefront-app',rect(18,43,44,54,3,C.white)+rect(24,61,14,27,2,C.panel)+rect(43,63,13,13,1,C.blue)+pathEl('M15 43 L23 31 H57 L65 43 Z',C.violet)+pathEl('M15 43 H25 V50 Q20 57 15 50 Z M35 43 H45 V50 Q40 57 35 50 Z M55 43 H65 V50 Q60 57 55 50 Z',C.violet)+pathEl('M25 43 H35 V50 Q30 57 25 50 Z M45 43 H55 V50 Q50 57 45 50 Z',C.white)+ellipse(34,76,1,1,C.muted)+rect(21,105,38,7,3,C.mint));}
const launch=g('ground-shadow',ellipse(300,342,239,11,C.line,'opacity=".36"'))+
  g('town',rect(84,128,97,179,10,C.panel)+pathEl('M75 128 L132 91 L191 128 Z',C.line)+rect(437,166,74,140,8,C.panel)+pathEl('M427 166 L474 135 L520 166 Z',C.line)+rect(104,150,22,31,3,C.line)+rect(141,150,22,31,3,C.line)+rect(453,190,17,26,3,C.line)+rect(482,190,17,26,3,C.line))+
  g('arrival-path',line('M86 329 Q290 374 507 309',C.muted,2,'stroke-dasharray="3 9"'))+
  phone('launch-phone',233,48,2,C.panel,storefront())+
  person('arrival-left',143,228,C.violet,C.lightSkin)+person('arrival-right',441,240,C.muted)+person('arrival-front',369,263,C.mint,C.skin)+
  g('launch-sparks',move(210,82,pathEl('M0 -12 V12 M-12 0 H12','none',`stroke="${C.amber}" stroke-width="3" stroke-linecap="round"`))+ellipse(418,113,5,5,C.blue)+ellipse(194,197,3,3,C.mint));
add('postcard-launch-day',600,400,launch,'Mission postcards','Launch day: a storefront app on a phone with people arriving');
let city='';for(const [x,y,w,h] of [[54,180,59,150],[118,130,57,200],[179,168,56,162],[363,158,54,172],[421,116,65,214],[491,174,55,156]])city+=rect(x,y,w,h,4,C.panel)+[0,1,2,3].map(i=>rect(x+13,y+17+i*30,8,10,1,C.line)+rect(x+w-22,y+17+i*30,8,10,1,C.line)).join('');
const viral=g('ground-shadow',ellipse(300,350,249,9,C.line,'opacity=".3"'))+g('night-city',city)+
  g('notification-links',line('M137 158 Q230 21 296 131 M300 131 Q404 14 465 144 M153 177 Q307 291 459 164',C.blue,2,'stroke-dasharray="3 9"'))+
  [[96,77,.85],[252,43,1.17],[428,66,.86],[176,205,.56],[355,228,.51]].map(([x,y,s],i)=>g('lit-phone-'+i,ellipse(x+40*s,y+68*s,56*s,91*s,C.blue,'opacity=".06"')+phone('viral-phone-'+i,x,y,s,C.line,rect(17,28,46,31,4,C.blue)+rect(17,68,32,5,2,C.white)+rect(17,79,43,4,2,C.muted)+rect(17,92,21,9,3,C.mint))+marker('notification-'+i,x+68*s,y+18*s,i%2?C.amber:C.blue))).join('')+
  person('night-reader-left',75,257,C.violet,C.lightSkin,'phone')+person('night-reader-right',502,252,C.mint,C.skin,'phone');
add('postcard-viral-night',600,400,viral,'Mission postcards','The viral night: phones lighting up across a night city');
// The map is placed at (41, 48) and scaled 1.15; each rack stands under its region marker, its link
// rising from the rack's top to the marker, and the packets ride on the route.
const onMap=([x,y])=>[41+x*1.15,48+y*1.15],RACK=.73,f1=v=>+v.toFixed(1);
const [westPin,eastPin]=[onMap(ROUTE[0]),onMap(ROUTE[2])];
const datacenter=(id,[x],y)=>g(id,move(f1(x-50*RACK),y,scope(id.split('-')[0],rack('healthy')),RACK));
const link=([x,y],rackY)=>`M${f1(x)} ${f1(y+13)} V${f1(rackY+8*RACK)}`;
const packet=(t,size,color,turn)=>{const [x,y]=onMap(routeAt(t));return rect(f1(x-size/2),f1(y-size/2),size,size,2,color,`transform="rotate(${turn} ${f1(x)} ${f1(y)})"`);};
const global=g('ground-shadow',ellipse(300,356,241,8,C.line,'opacity=".22"'))+
  move(41,48,g('global-map',world()),1.15)+
  datacenter('west-datacenter',westPin,201)+
  datacenter('east-datacenter',eastPin,215)+
  g('datacenter-links',line(link(westPin,201)+' '+link(eastPin,215),C.blue,2,'stroke-dasharray="4 6"'))+
  g('travelling-packets',packet(.4,10,C.blue,-4)+packet(.62,8,C.mint,14));
add('postcard-going-global',600,400,global,'Mission postcards','Going global: two regions connected across the world');

// Prefix IDs when composing sheets: every anatomical or prop layer stays independently selectable.
function instance(a,prefix){return a.body.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`);}
let sheet='';
const place=(name,x,y,s=1)=>{const a=assets.find(a=>a.name===name);sheet+=move(x,y,g('sheet-'+name,instance(a,name)),s);};
['healthy','under-load','failing','failing-dim'].forEach((state,i)=>place('server-rack-'+state,25+i*130,30,1.05));
place('laptop-open',577,66,1.3);place('tablet-chart',780,68,1.35);
place('townsquare-office',915,20,.95);place('world-regions',48,265,1.07);
const effects=assets.filter(a=>a.category==='Effects');effects.forEach((a,i)=>place(a.name,595+(i%8)*93,300+Math.floor(i/8)*112,a.name.startsWith('confetti')?2:1.4));
['launch-day','viral-night','going-global'].forEach((name,i)=>place('postcard-'+name,12+i*466,575,.75));
const files=new Map(assets.map(a=>[a.name+'.svg',svg(a)]));
files.set('mission-art-sheet.svg',svg({name:'mission-art-sheet',width:1400,height:910,body:sheet,description:'TownSquare mission props, office, regional map, effects and three postcards'}));
files.set('manifest.json',JSON.stringify(assets.map(({body,...a})=>({...a,file:a.name+'.svg'})),null,2)+'\n');
const check=process.argv.includes('--check');let stale=false;
if(!check)fs.mkdirSync(out,{recursive:true});
for(const [name,content] of files){const dest=path.join(out,name);if(check){if(!fs.existsSync(dest)||fs.readFileSync(dest,'utf8')!==content){console.error(`${name} is stale`);stale=true;}}else fs.writeFileSync(dest,content);}
if(stale)process.exitCode=1;else console.log(`${assets.length} mission assets, contact sheet and manifest ${check?'verified':'written'}.`);
