/* ---------------- 8. INDEXING ---------------- */
(function(){
  const EM=['kim','ana','zoe','bo','lee','max','eve','sam','dan','ivy','raj','cy'];
  const LEAVES=[['ana','bo','cy'],['dan','eve','ivy'],['kim','lee','max'],['raj','sam','zoe']],LX=[470,600,730,860],ROOT=[665,165];
  const rowOf=e=>EM.indexOf(e)+1,TX=60,TY=88,RH=31,rowY=i=>TY+RH*(i+1)+RH/2;
  const slot=(e)=>{for(let l=0;l<4;l++){const j=LEAVES[l].indexOf(e);if(j>=0)return[l,j];}};
ch({id:'indexing',group:'Data',title:'Database Indexing',dur:28.5,needs:['sql-nosql'],related:['sharding','caching'],
beats:[
[0,'Find one row in a big table','Query: find the user whose email is raj@mail.com. Rows are stored in the order they were inserted, not sorted by email.'],
[2.5,'No index: check every row','The database scans row by row until it has checked them all, since there could be more matches. Work grows with table size: O(n).'],
[9,'Build an index','An index is a separate, sorted structure (usually a B-tree) that maps each email to where its row lives, like the index at the back of a book.'],
[15,'With an index: jump straight there','Now the lookup walks the tree: root → leaf → row. A few steps instead of a full scan: O(log n). With a billion rows, that\'s about 30 steps instead of a billion.'],
[21,'The price: slower writes, more space','Every insert or update must also update the index. Index the columns you search by often, not every column.']],
use:['Columns in WHERE, JOIN and ORDER BY clauses of frequent queries','Unique constraints (email, username) and foreign keys','Composite indexes for common multi-column filters (e.g. user_id + created_at)'],
cons:['Every write also updates each index, so write-heavy tables slow down','Indexes use extra disk and memory','Unused or overlapping indexes are pure cost; low-selectivity columns (e.g. true/false) rarely help']
,draw(t){
  const scanI=Math.floor((t-2.8)/.45),scanning=t>2.8&&t<8.4;
  const found=t>18.6;const ins=t>21.6;
  const rows=EM.map((e,i)=>[String(i+1),e+'@mail.com']);if(ins)rows.push(['13','amy@mail.com']);
  table(TX,TY,'users',['row','email'],[62,200],rows,{a:A(t,.2).a,rowA:i=>i===12?V(t,21.6):V(t,.4+i*.07),
    hl:i=>{if(i===12)return C.amber;if(scanning&&i===scanI)return C.accent;if(i===10&&((t>7.3&&t<9)||found))return C.green;return null;},
    cellC:(i,j)=>scanning&&i<scanI&&i!==10?C.faint:null,rh:RH});
  if(t>2.8&&t<9){for(let i=0;i<12;i++)if(i<=Math.min(scanI,11)&&i!==10)tx('✕',TX+275,rowY(i),{z:12,c:C.red,a:V(t,2.8+i*.45+.3,8.6)});
    if(scanI>=10)tx('✓ match',TX+275,rowY(10),{z:12,al:'left',c:C.green,wt:700,a:V(t,7.4,8.6)});}
  pill(t<21?'WHERE email = "raj@mail.com"':'INSERT amy@mail.com',700,92,{c:t<21?C.blue:C.amber,a:V(t,.8),f:MONO,z:12.5});
  if(t>2.8&&t<9.2)pill(`rows checked: ${clamp(scanI+1,0,12)} / 12`,860,470,{c:C.red,a:V(t,3,8.8),z:13});
  // index tree
  const ra=A(t,9.4);
  const leafIn=[...LEAVES.map(l=>l.slice())];if(t>23.4)leafIn[0]=['amy',...leafIn[0]];
  LX.forEach((x,l)=>ln([[ROOT[0],ROOT[1]+22],[x,300]],{a:ra.a*.9,p:P(t,9.8,10.6),c:t>16.3&&t<21&&l===3||found&&t<21&&l===3?C.accent:C.edge,w:t>16.3&&t<21&&l===3?3:2}));
  draw(ROOT[0],ROOT[1],ra,()=>{glowOn(C.accent,t>15.4&&t<21?20:0);rr(-110,-22,220,44,10);g.fillStyle=C.panel;g.fill();glowOff();g.strokeStyle=C.accent;g.lineWidth=2;g.stroke();
    ['dan','kim','raj'].forEach((k,i)=>{tx(k,-73+i*73,1,{z:13,f:MONO,wt:650,c:i===2&&t>15.6&&t<21?C.green:C.text});if(i)ln([[-110+i*73,-22],[-110+i*73,22]],{c:C.line,w:1});});});
  tx('B-tree index on email',ROOT[0],ROOT[1]-38,{z:12,c:C.accent,a:ra.a});
  if(t>15.6&&t<21)pill('raj ≥ raj → go right',ROOT[0]+10,236,{c:C.accent,z:12,a:V(t,15.8,20.6)});
  LX.forEach((x,l)=>{const la=A(t,10+l*.2);const n=leafIn[l].length,h=n*20+14,hot=l===3&&t>16.6&&t<21,grew=l===0&&t>23.4&&t<25.4;
    draw(x,300,la,()=>{glowOn(hot?C.accent:grew?C.amber:C.bg,hot||grew?18:0);rr(-55,0,110,h,9);g.fillStyle=C.panel;g.fill();glowOff();g.strokeStyle=hot?C.accent:grew?C.amber:C.edge;g.lineWidth=2;g.stroke();});
    leafIn[l].forEach((e,j)=>{const isNew=e==='amy';const t0=isNew?23.4:10.9+EM.indexOf(e)*.13+.9;const hl=l===3&&j===0&&t>17.2&&t<21;
      if(hl){g.save();g.globalAlpha=la.a;rr(x-50,300+7+j*20,100,20,5);g.fillStyle=hexA(C.green,.22);g.fill();g.restore();}
      tx(`${e} → ${isNew?13:rowOf(e)}`,x,300+17+j*20,{z:12.5,f:MONO,c:isNew?C.amber:hl?C.green:'#c9d2e3',a:la.a*V(t,t0)});});});
  // flying keys during build
  if(t>10.4&&t<13.8)EM.forEach((e,i)=>{const t0=10.9+i*.13,p=clamp((t-t0)/.9);if(p<=0||p>=1)return;const[l,j]=slot(e);
    const from=[TX+160,rowY(i)],to=[LX[l],300+17+j*20];const q=eio(p);const pos=along(crv(from,[(from[0]+to[0])/2,Math.min(from[1],to[1])-60],to),q);pill(e,pos[0],pos[1],{c:C.accent,z:11.5,f:MONO});});
  if(t>22.3&&t<23.5){const p=eio(clamp((t-22.4)/1));const pos=along(crv([TX+160,rowY(12)],[300,420],[LX[0],307]),p);pill('amy',pos[0],pos[1],{c:C.amber,z:11.5,f:MONO});}
  // pointer from leaf to row
  if(t>17.4){const pth=crv([LX[3]-55,317],[520,500],[TX+262,rowY(10)],24);ln(pth,{c:C.green,w:2.5,p:P(t,17.4,18.6),arrow:true,a:1-P(t,20.6,21.2)});}
  pill('scan: 12 rows checked',860,470,{c:C.red,z:13,a:V(t,19.2,21)});pill('index: 3 steps',860,506,{c:C.green,z:13,a:V(t,19.6,21)});
  pill('+ every write updates the index',860,470,{c:C.amber,z:12.5,a:V(t,24)});pill('+ extra disk & memory',860,506,{c:C.amber,z:12.5,a:V(t,24.8)});
}});})();
