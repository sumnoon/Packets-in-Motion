#!/usr/bin/env node
// Native editable vectors. The generated PNG is an art reference, never an
// embedded bitmap masquerading as SVG. All anatomy is explicit path geometry.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../assets/maya');
fs.mkdirSync(out,{recursive:true});
fs.mkdirSync(path.resolve(out,'../engineer'),{recursive:true});
const c={skin:'#efb58e',shade:'#d79470',hair:'#2b2152',hairShade:'#211936',violet:'#a78bfa',violetShade:'#8c70d0',pants:'#43527a',pantsShade:'#2f3b5c',shoe:'#1c2640',shoeEdge:'#56668c',navy:'#131b2b',ink:'#27334d',white:'#e7ecf5',gold:'#e8cc8c'};
const p=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const line=(d,color=c.ink,width=1.8)=>p(d,'none',`stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`);
const ellipse=(x,y,rx,ry,fill,extra='')=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const group=(prefix,name,content,extra='')=>`<g id="${prefix}-${name}" data-part="${name}" inkscape:groupmode="layer" inkscape:label="${name}" ${extra}>${content}</g>`;
// The held laptop and tablet come from the mission art (built first): its layers, ids prefixed per figure,
// placed in the characters' 260 x 350 space where the hands meet them.
const missionProp=name=>fs.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),`../assets/mission-art/${name}.svg`),'utf8').replace(/^<svg[^>]*>|<title[^>]*>.*?<\/title>|<\/svg>\s*$/g,'');
const heldProp=(id,name,file,transform)=>group(id,name,`<g transform="${transform}">${missionProp(file).replace(/id="([^"]+)"/g,(_,x)=>`id="${id}-${x}"`)}</g>`);
function mouth(kind='neutral',x=130,y=77){
  const shape={neutral:line('M-5 0 Q0 2 5 0','#754b49',1.7),closed:line('M-6 0 Q0 3 6 0','#754b49',1.7),smile:p('M-7 -1 Q0 3 7 -1 Q4 7 0 7 Q-5 7 -7 -1','#713c45')+p('M-5 0 Q0 3 5 0 L4 2 Q0 4 -4 2',c.white),worried:p('M-5 3 Q-4 -4 0 -4 Q5 -4 5 3 Q0 0 -5 3','#713c45'),surprised:ellipse(0,1,4,6,'#713c45'),delighted:p('M-8 -1 Q0 2 8 -1 Q6 10 0 10 Q-6 10 -8 -1','#713c45')+p('M-6 0 Q0 2 6 0 L5 3 Q0 5 -5 3',c.white)+p('M-4 7 Q0 4 4 7 Q0 11 -4 7','#d79470'),thinking:line('M-5 2 Q0 -1 5 1','#754b49',1.7),blink:line('M-6 0 Q0 5 6 0','#754b49',1.7),small:p('M-4 0 C-4 -5 4 -5 4 0 C4 6 -4 6 -4 0','#713c45'),wide:p('M-8 -2 Q0 1 8 -2 Q7 10 0 10 Q-7 10 -8 -2','#713c45')+p('M-5 -1 Q0 1 5 -1 L4 2 L-4 2',c.white)};
  return `<g transform="translate(${x} ${y})">${shape[kind]||shape.neutral}</g>`;
}
function head(id,expression='neutral',view='front',portrait=false){
  const side=view==='side',quarter=view==='three-quarter',eyeY=expression==='worried'?61:62;
  const back=side?'M116 28 C88 37 94 78 82 107 C73 134 92 155 112 148 C130 134 130 92 147 65 C158 33 145 21 116 28':portrait?'M105 31 C83 45 90 70 86 92 C82 110 90 122 104 119 C116 124 144 124 156 119 C170 122 178 110 173 91 C168 60 154 18 129 24 C120 21 112 25 105 31':'M105 31 C81 47 92 69 80 99 C65 124 80 180 104 169 C120 183 144 183 163 169 C186 163 173 108 168 81 C166 47 154 18 129 24 C120 21 112 25 105 31';
  const face=side?'M120 39 C139 33 149 44 150 58 L159 66 Q162 70 153 72 L153 82 Q143 94 131 88 L124 80 Z':quarter?'M108 43 C110 32 145 32 153 49 L155 69 Q151 91 135 94 Q117 92 110 77 Q101 70 108 43':'M107 45 C108 29 150 29 153 45 L153 69 C151 88 138 96 130 96 C119 94 107 84 107 69 Z';
  const eye=(x,small=false)=>expression==='blink'||expression==='delighted'?line(`M${x-5} ${eyeY+1} Q${x} ${eyeY-4} ${x+5} ${eyeY+1}`,c.ink,2):`<g>${p(`M${x-5} ${eyeY} Q${x} ${eyeY-6} ${x+5} ${eyeY} Q${x} ${eyeY+5} ${x-5} ${eyeY}`,c.white)}${ellipse(x+(expression==='thinking'?1:0),eyeY,small?2.2:2.8,3.7,c.ink)}${ellipse(x+1,eyeY-1.5,.8,.9,c.white)}${line(`M${x-5} ${eyeY} Q${x} ${eyeY-6} ${x+5} ${eyeY}`,c.ink,1.3)}</g>`;
  const eyes=side?eye(145,true):eye(quarter?122:118)+eye(quarter?145:142,quarter);
  const brows=side?line('M140 53 Q145 51 149 53',c.hair,2.2):expression==='worried'?line('M112 53 Q118 55 123 50 M137 50 Q142 55 149 54',c.hair,2.3):expression==='surprised'?line('M112 49 Q118 45 124 49 M136 49 Q142 45 148 49',c.hair,2.2):expression==='thinking'?line('M112 54 Q119 50 124 53 M137 50 Q143 48 149 51',c.hair,2.2):line('M112 53 Q118 50 124 53 M136 53 Q142 50 148 53',c.hair,2.2);
  const bangs=side?'M104 54 C107 35 130 22 146 40 C136 35 135 44 122 51 L111 71 C111 58 108 53 104 54':'M99 58 C97 36 111 22 129 26 C151 22 163 40 158 62 C153 55 147 44 142 39 C131 37 129 51 113 57 L105 68 Z';
  const hairBack=portrait?back:side?'M116 28 C88 37 94 78 82 107 C73 134 92 155 112 148 L118 90 L131 80 L147 65 C158 33 145 21 116 28':'M105 31 C81 47 92 69 80 99 C65 124 80 180 104 169 L110 89 Q130 101 150 89 L156 169 C186 163 173 108 168 81 C166 47 154 18 129 24 C120 21 112 25 105 31';
  return group(id,'head',group(id,'hair-back',p(hairBack,c.hair)+line(side?'M106 51 Q115 98 97 131':portrait?'M98 54 Q99 80 95 106 M161 75 Q160 96 164 110':'M98 54 Q99 88 88 119 M161 75 Q157 123 166 146',c.hairShade,5))+
    group(id,'face',p(face,c.skin)+p(side?'M132 79 Q144 89 153 77 L153 82 Q143 94 131 88 Z':'M145 48 Q155 75 137 89 Q128 94 119 87 Q134 101 147 85 Q157 73 153 48 Z',c.shade)+(side?'':ellipse(105,67,4.4,7,c.skin)+ellipse(155,67,4.4,7,c.skin))+line(side?'M150 66 L151 69':'M130 66 L128 72 Q131 74 134 71',c.shade,1.6))+
    group(id,'eyes',eyes)+group(id,'brows',brows)+group(id,'mouth',side?mouth(expression,149,79):mouth(expression,quarter?138:130,80))+
    group(id,'hair-front',p(bangs,c.hair)+line(side?'M115 37 Q128 26 142 36':'M106 41 Q115 27 129 30 M136 28 Q151 29 157 48','#393062',2)),`data-pivot="130 91"`);
}
function hand(x,y,kind='down',flip=false){
  let shape='';
  if(kind==='wave')shape=p('M-5 4 L-8 -5 Q-9 -9 -6 -8 L-3 -3 L-5 -17 Q-5 -21 -2 -19 L1 -8 L1 -23 Q2 -26 4 -23 L5 -8 L8 -20 Q10 -23 12 -20 L10 -5 L14 -13 Q17 -15 17 -11 L12 4 Q7 11 -1 10 Z',c.skin)+line('M-1 2 Q5 -2 10 2',c.shade,1.4);
  else if(kind==='point')shape=p('M-7 -5 L2 -6 L19 -10 Q23 -10 22 -7 L7 -3 L11 0 Q14 3 10 5 L3 8 L-7 5 Z',c.skin)+line('M3 0 L8 3',c.shade,1.4);
  else if(kind==='head')shape=p('M-5 6 L-7 -2 L-4 -13 Q-2 -16 0 -12 L-1 -4 L4 -14 Q7 -16 7 -12 L3 -1 L9 -8 Q12 -9 12 -5 L7 5 Q2 11 -5 6',c.skin);
  else shape=p('M-5 -5 L5 -5 L7 6 Q6 10 4 8 L3 3 L3 13 Q1 17 -1 12 L-2 5 L-3 13 Q-6 15 -6 10 L-7 3 Z',c.skin)+line('M-2 0 L-1 6',c.shade,1.3);
  return `<g transform="translate(${x} ${y})${flip?' scale(-1 1)':''}">${shape}</g>`;
}
function arm(id,which,points,kind='down'){
  const [s,e,w]=points,dx=e[0]-s[0],dy=e[1]-s[1],length=Math.hypot(dx,dy),tip=[s[0]+dx/length*28,s[1]+dy/length*28];
  const route=`M${s} L${e} L${w}`;
  return group(id,'arm-'+which,line(route,c.skin,12)+line(`M${e[0]+3} ${e[1]} L${w[0]+3} ${w[1]}`,c.shade,3)+line(`M${s} L${tip}`,c.violet,21)+line(`M${s[0]+5} ${s[1]+2} L${tip[0]+4} ${tip[1]}`,c.violetShade,6)+hand(w[0],w[1],kind,which==='right'&&kind!=='point'),`data-pivot="${s.join(' ')}"`);
}
function leg(id,which,hip,knee,ankle){
  const s=which==='left'?-1:1;
  return group(id,'leg-'+which,line(`M${hip} L${knee} L${ankle}`,c.pants,23)+line(`M${hip[0]+6} ${hip[1]} L${knee[0]+6} ${knee[1]} L${ankle[0]+6} ${ankle[1]-1}`,c.pantsShade,7)+
    line(`M${ankle} L${ankle[0]} ${ankle[1]+9}`,c.skin,12)+p(`M${ankle[0]-9} ${ankle[1]+5} Q${ankle[0]} ${ankle[1]+10} ${ankle[0]+9} ${ankle[1]+5} L${ankle[0]+13} ${ankle[1]+14} Q${ankle[0]+16+s*7} ${ankle[1]+17} ${ankle[0]+12+s*8} ${ankle[1]+21} L${ankle[0]-12} ${ankle[1]+21} Q${ankle[0]-15} ${ankle[1]+16} ${ankle[0]-9} ${ankle[1]+5}`,c.shoe,`stroke="${c.shoeEdge}" stroke-width="1.5"`)+line(`M${ankle[0]-11} ${ankle[1]+20} L${ankle[0]+11+s*7} ${ankle[1]+20}`,c.white,2.2),`data-pivot="${hip.join(' ')}"`);
}
const poses={
  front:{expression:'neutral',view:'front'},
  'three-quarter':{expression:'neutral',view:'three-quarter'},
  side:{expression:'neutral',view:'side',arms:[[[134,112],[139,151],[141,188]],[[129,112],[132,151],[133,188]]]},
  calm:{expression:'smile',arms:[[[104,112],[91,151],[110,144]],[[156,112],[169,151],[150,144]]],tablet:true},
  wave:{expression:'smile',arms:[[[104,112],[79,83],[72,49]],[[156,112],[171,151],[172,187]]],hands:['wave','down']},
  worried:{expression:'worried',arms:[[[104,112],[80,82],[104,50]],[[156,112],[180,82],[156,50]]],hands:['head','head'],lean:-4},
  celebrating:{expression:'delighted',arms:[[[104,112],[84,80],[65,48]],[[156,112],[176,80],[195,48]]],hands:['wave','wave'],hop:true},
  pointing:{expression:'smile',view:'three-quarter',arms:[[[104,112],[84,151],[112,165]],[[156,112],[191,110],[225,101]]],hands:['down','point']}
};
function figure(id,pose){
  const q=poses[pose],side=q.view==='side',quarter=q.view==='three-quarter',arms=q.arms||[[[104,112],[94,151],[94,188]],[[156,112],[166,151],[166,188]]];
  const torso=group(id,'torso',p('M104 107 Q107 99 121 99 L139 99 Q153 99 157 111 L157 151 L165 185 L139 191 L130 174 L124 192 L95 185 L103 150 Z',c.violet)+p('M143 103 Q155 110 153 143 L165 185 L148 189 L139 171 Z',c.violetShade)+p('M121 85 L139 85 L139 101 L130 113 L121 101 Z',c.skin)+p('M124 88 Q132 96 139 89 L139 100 Q130 101 124 95 Z',c.shade)+ellipse(146,116,3.5,3.5,c.gold)+line('M108 160 L103 178',c.violetShade,2),`data-pivot="130 148"`);
  const limbs=leg(id,'left',[117,182],q.hop?[111,233]:[114,244],q.hop?[106,284]:[111,303])+leg(id,'right',[143,182],q.hop?[162,229]:[149,243],q.hop?[138,262]:[153,303]);
  const tablet=q.tablet?heldProp(id,'prop-tablet','tablet-chart','translate(107 119) scale(.62)'):'';
  // three-quarter: the far (left) arm goes behind the torso and the body narrows
  const farArm=arm(id,'left',quarter&&!q.arms?[[108,112],[104,151],[106,186]]:arms[0],q.hands?.[0]),nearArm=arm(id,'right',arms[1],q.hands?.[1]);
  const body=quarter?limbs+farArm+torso+head(id,q.expression,q.view)+tablet+nearArm:limbs+torso+head(id,q.expression,q.view)+tablet+farArm+nearArm;
  return group(id,'shadow',ellipse(130,329,49,5,c.ink,'opacity=".18"'))+group(id,'figure',body,`transform="${q.hop?'translate(0 -10) ':''}${q.lean?'rotate(-4 130 308) ':''}${side?'translate(36 0) scale(.73 1)':quarter?'translate(18 0) scale(.86 1)':''}"`);
}
const svg=(w,h,title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title"><title id="title">${title}</title><metadata>Original character vector artwork for Packets in Motion. User-directed character; native editable paths. No fonts, filters, gradients, external images or background rectangle. Lighting: upper left. Layer groups expose animation pivots in data-pivot attributes.</metadata>${body}</svg>\n`;
const files=new Map();
for(const name of Object.keys(poses))files.set(`maya-${name}.svg`,svg(260,350,`Maya: ${name}`,figure('maya-'+name,name)));
const expressions=['neutral','smile','worried','surprised','delighted','thinking','blink'];
for(const name of expressions)files.set(`maya-face-${name}.svg`,svg(130,150,`Maya expression: ${name}`,`<g transform="translate(-65 0)">${head('maya-face-'+name,name,'front',true)}</g>`));
for(const name of ['closed','small','wide'])files.set(`maya-mouth-${name}.svg`,svg(50,40,`Maya mouth: ${name}`,group('maya-mouth-'+name,'mouth',mouth(name,25,15))));
let sheet='';
['front','three-quarter','side'].forEach((name,i)=>{sheet+=`<g id="turnaround-${name}" transform="translate(${290+i*280} 12)">${figure('turnaround-'+name,name)}</g>`;});
['calm','wave','worried','celebrating','pointing'].forEach((name,i)=>{sheet+=`<g id="pose-${name}" transform="translate(${15+i*275} 374)">${figure('pose-'+name,name)}</g>`;});
expressions.forEach((name,i)=>{sheet+=`<g id="expression-${name}" transform="translate(${i*194-77} 765) scale(1.3)">${head('expression-'+name,name,'front',true)}</g>`;});
['closed','small','wide'].forEach((name,i)=>{sheet+=group('talk-'+name,'mouth',`<g transform="translate(${580+i*115} 1030) scale(2)">${mouth(name,0,0)}</g>`);});
files.set('maya-character-sheet.svg',svg(1400,1100,'Maya character sheet: three turnaround views, five poses, seven expressions and three mouth shapes',sheet));
const runtimePoses=Object.fromEntries(['calm','wave','worried','celebrating','pointing'].map(name=>[name,files.get(`maya-${name}.svg`)]));
// The engineer uses the same skeleton, line weights and six-head proportions.
const ec={skin:'#b98461',shade:'#945e43',hair:'#182037',hairShade:'#101729',mint:'#34d399',mintShade:'#209f78',jeans:'#3a5a8c',jeansShade:'#2a446d'};
const engineerColors=s=>s.replaceAll(c.skin,ec.skin).replaceAll(c.shade,ec.shade).replaceAll(c.violet,ec.mint).replaceAll(c.violetShade,ec.mintShade).replaceAll(c.pantsShade,ec.jeansShade).replaceAll(c.pants,ec.jeans);
function engineerHead(id,expression='neutral',view='front'){
  const side=view==='side',quarter=view==='three-quarter',base=expression==='concerned'?'worried':expression==='focused'?'neutral':expression;
  let h=engineerColors(head(id,base,view,true));
  h=h.replace(new RegExp(`<g id="${id}-hair-back"[\\s\\S]*?<\\/g>`),'');
  const hair=side?'M105 56 C94 42 109 22 129 26 C145 21 158 36 154 50 L145 46 Q139 36 132 40 L119 52 L113 71 L107 67 Z':'M102 58 C95 52 99 37 108 31 L115 24 L114 31 C126 18 147 24 153 35 C165 37 164 53 155 61 L150 46 Q140 47 133 37 C125 47 113 44 108 59 Z';
  h=h.replace(new RegExp(`<g id="${id}-hair-front"[\\s\\S]*?<\\/g>`),group(id,'hair-front',p(hair,ec.hair)+line(side?'M110 37 Q125 25 144 34':'M108 38 Q122 25 132 29 M138 28 Q153 32 156 43',ec.hairShade,2)));
  if(expression==='focused')h=h.replace(new RegExp(`<g id="${id}-brows"[\\s\\S]*?<\\/g>`),group(id,'brows',line('M112 54 L124 55 M136 55 L148 54',ec.hair,2.2)));
  if(expression==='thinking')h=h.replaceAll('cy="62" rx="2.8" ry="3.7"','cy="60.5" rx="2.8" ry="3.7"');
  const glasses=side?`<ellipse cx="145" cy="62" rx="6" ry="8" fill="none" stroke="${c.ink}" stroke-width="2.4"/>${line('M139 62 L119 61',c.ink,2.2)}`:`<circle cx="${quarter?122:118}" cy="62" r="8.3" fill="none" stroke="${c.ink}" stroke-width="2.3"/><circle cx="${quarter?145:142}" cy="62" r="8.3" fill="none" stroke="${c.ink}" stroke-width="2.3"/>${line(quarter?'M130 61 Q134 58 137 61 M114 60 L108 60 M153 60 L157 59':'M126 61 Q130 58 134 61 M110 60 L105 59 M150 60 L155 59',c.ink,2.2)}`;
  return h.replaceAll(c.hair,ec.hair).replace(/<\/g>$/,group(id,'glasses',glasses)+'</g>');
}
function engineerArm(id,which,points,kind='down'){
  const [s,e,w]=points,route=`M${s} L${e} L${w}`;
  return group(id,'arm-'+which,line(route,ec.mint,20)+line(`M${e[0]+4} ${e[1]} L${w[0]+4} ${w[1]}`,ec.mintShade,5)+engineerColors(hand(w[0],w[1],kind,which==='right'&&kind!=='point')),`data-pivot="${s.join(' ')}"`);
}
const engineerPoses={
  front:{expression:'neutral'},'three-quarter':{expression:'neutral',view:'three-quarter'},side:{expression:'neutral',view:'side',arms:[[[134,112],[139,151],[141,188]],[[129,112],[132,151],[133,188]]]},
  typing:{expression:'focused',arms:[[[104,112],[86,152],[100,170]],[[156,112],[178,150],[170,170]]],laptop:true},
  thinking:{expression:'thinking',arms:[[[104,112],[100,146],[150,146]],[[156,112],[172,142],[137,108]]],hands:['down','head']},
  pointing:{expression:'smile',view:'three-quarter',arms:[[[104,112],[94,151],[94,188]],[[156,112],[191,110],[225,101]]],hands:['down','point']},
  celebrating:{expression:'delighted',arms:[[[104,112],[84,80],[65,48]],[[156,112],[176,80],[195,48]]],hands:['wave','wave']}
};
function engineerTorso(id,portrait=false){return group(id,'torso',
  p(portrait?'M101 104 Q112 96 120 97 L141 97 Q160 97 169 115 L179 151 L81 151 L91 114 Z':'M102 106 Q109 97 120 98 L140 98 Q153 99 158 109 L160 179 Q130 193 99 180 L101 141 Z',ec.mint)+
  p(portrait?'M147 101 Q159 106 165 121 L179 151 L159 151 Z':'M148 102 L158 110 L160 179 L143 184 L146 142 Z',ec.mintShade)+
  p('M119 85 L140 85 L140 99 L130 110 L119 99 Z',ec.skin)+p('M120 88 Q130 97 140 90 L140 99 Q129 102 120 96 Z',ec.shade)+
  p('M116 100 L130 112 L145 99 L141 122 L130 128 L117 119 Z',c.navy)+
  p('M116 95 Q103 89 102 107 L119 124 L125 109 Z',ec.mintShade)+p('M145 95 Q159 92 159 106 L141 123 L135 109 Z',ec.mintShade)+
  line(`M130 124 L130 ${portrait?151:184}`,ec.mintShade,1.7)+line('M119 105 L130 135 L142 104',c.white,3)+
  `<rect x="124" y="134" width="13" height="16" rx="2" fill="${c.white}"/>`+(portrait?'':line('M108 157 L119 153 M141 153 L152 157',ec.mintShade,1.8)), 'data-pivot="130 148"');}
function engineerFigure(id,pose){
  const q=engineerPoses[pose],arms=q.arms||[[[104,112],[94,151],[94,188]],[[156,112],[166,151],[166,188]]];
  const laptop=q.laptop?heldProp(id,'prop-laptop','laptop-open','translate(91 117) scale(.65)'):'';
  const quarter=q.view==='three-quarter',legs=engineerColors(leg(id,'left',[117,182],[114,244],[111,303])+leg(id,'right',[143,182],[149,243],[153,303]));
  const farArm=engineerArm(id,'left',quarter&&!q.arms?[[108,112],[104,151],[106,186]]:arms[0],q.hands?.[0]),nearArm=engineerArm(id,'right',arms[1],q.hands?.[1]);
  const body=quarter?legs+farArm+engineerTorso(id)+engineerHead(id,q.expression,q.view)+laptop+nearArm:legs+engineerTorso(id)+engineerHead(id,q.expression,q.view)+laptop+farArm+nearArm;
  return group(id,'shadow',ellipse(130,329,49,5,c.ink,'opacity=".18"'))+group(id,'figure',body,`transform="${q.view==='side'?'translate(36 0) scale(.73 1)':quarter?'translate(18 0) scale(.86 1)':''}"`);
}
function avatar(id,who){
  const shoulders=who==='engineer'?engineerTorso(id,true):group(id,'torso',p('M100 104 Q112 96 121 97 L140 97 Q160 99 169 117 L177 151 L83 151 L91 115 Z',c.violet)+p('M148 102 L162 113 L177 151 L155 151 Z',c.violetShade)+p('M121 87 L139 87 L139 101 L130 114 L121 101 Z',c.skin)+ellipse(148,120,3.5,3.5,c.gold));
  return `<g transform="translate(-55 0)">${shoulders}${who==='engineer'?engineerHead(id,'smile'):head(id,'smile','front',false)}</g>`;
}
for(const name of Object.keys(engineerPoses))files.set(`../engineer/engineer-${name}.svg`,svg(260,350,`The engineer: ${name}`,engineerFigure('engineer-'+name,name)));
const engineerExpressions=['neutral','focused','thinking','concerned','delighted','blink'];
for(const name of engineerExpressions)files.set(`../engineer/engineer-face-${name}.svg`,svg(130,150,`Engineer expression: ${name}`,`<g transform="translate(-65 0)">${engineerHead('engineer-face-'+name,name)}</g>`));
files.set('../engineer/engineer-avatar.svg',svg(150,160,'Engineer shoulders-up portrait',avatar('engineer-avatar','engineer')));
files.set('maya-avatar.svg',svg(150,160,'Maya shoulders-up portrait',avatar('maya-avatar','maya')));
let engineerSheet='';
['front','three-quarter','side'].forEach((name,i)=>{engineerSheet+=`<g id="turnaround-${name}" transform="translate(${290+i*280} 12)">${engineerFigure('engineer-turnaround-'+name,name)}</g>`;});
['typing','thinking','pointing','celebrating'].forEach((name,i)=>{engineerSheet+=`<g id="pose-${name}" transform="translate(${90+i*320} 367)">${engineerFigure('engineer-pose-'+name,name)}</g>`;});
engineerExpressions.forEach((name,i)=>{engineerSheet+=`<g id="expression-${name}" transform="translate(${i*220-38} 730) scale(1.2)">${engineerHead('engineer-expression-'+name,name)}</g>`;});
engineerSheet+=`<g id="avatar-engineer" transform="translate(490 926)">${avatar('sheet-engineer-avatar','engineer')}</g><g id="avatar-maya" transform="translate(760 926)">${avatar('sheet-maya-avatar','maya')}</g>`;
files.set('../engineer/engineer-character-sheet.svg',svg(1400,1100,'Engineer character sheet: three turnaround views, four poses, six expressions and portraits of both characters',engineerSheet));
const engineerRuntime=Object.fromEntries(['typing','thinking','pointing','celebrating'].map(name=>[name,files.get(`../engineer/engineer-${name}.svg`)]));
const runtimeSource='// Generated by scripts/build-characters.mjs. Native SVG markup keeps layers animatable offline.\nconst MAYA_VECTORS='+JSON.stringify(runtimePoses,null,2)+';\nconst ENGINEER_VECTORS='+JSON.stringify(engineerRuntime,null,2)+';\n';
files.set('../../src/character-assets.js',runtimeSource);
let stale=false;
for(const [name,content] of files){const file=path.join(out,name);if(process.argv.includes('--check')){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==content){console.error(`${name} is out of date`);stale=true;}}else fs.writeFileSync(file,content);}
if(stale)process.exitCode=1;else console.log(`35 character SVG assets and runtime markup ${process.argv.includes('--check')?'verified':'written'}.`);
