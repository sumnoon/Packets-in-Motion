/* ---------------- 7. SQL vs NoSQL ---------------- */
(function(){
  const UR=[['1','Ada','London'],['2','Lin','Tokyo'],['3','Sam','Lagos']],OR=[['101','2','$30'],['102','1','$12'],['103','2','$55']];
ch({id:'sql-nosql',group:'Data',title:'SQL vs NoSQL',dur:34,needs:['client-server'],related:['indexing','sharding','cap'],
beats:[
[0,'SQL: tables with fixed columns','Relational databases store data in tables. Every row has the same columns, defined up front by a schema.'],
[5,'Relations and JOINs','Orders point to users by id. A JOIN stitches related rows together at query time, so each fact is stored exactly once.'],
[11,'Schema changes have different costs','Cost depends on the engine and operation. PostgreSQL can add a column with a constant default without rewriting rows. Adding a volatile default such as clock_timestamp() evaluates every row and can require a table rewrite; locks also matter.'],
[15,'NoSQL: flexible documents','A document database stores self-contained, JSON-like records. Each can have different fields, and related data is often embedded right inside.'],
[22,'Scaling depends on the database','A single-primary SQL system can scale up and add read replicas; distributed SQL can scale out. Many NoSQL stores partition by key. Neither label alone determines capacity, transaction support or consistency.'],
[29,'Pick by access pattern','Compare the actual database guarantees and queries. Relational stores fit joins and integrity constraints; document or key-value stores fit aggregate/key access. Both families can support transactions, and flexible documents still need application validation.']],
use:['SQL: money, inventory, bookings, anything needing ACID transactions and ad-hoc queries','NoSQL (document / key-value): user profiles, catalogs, sessions, feeds at large scale','Many systems use both: SQL for the core records, NoSQL for high-volume or flexible data'],
cons:['Migration cost and locking depend on the engine, operation and default','Denormalized documents duplicate facts and need a strategy to keep them consistent','Check each database’s transaction, consistency and distribution guarantees'],
draw(t){
  const dim=t>22.3?1-.62*P(t,22.3,23):1;
  tx('SQL · relational',40,76,{z:14,wt:700,al:'left',c:C.blue,a:V(t,.3)});
  tx('NoSQL · document',540,76,{z:14,wt:700,al:'left',c:C.amber,a:V(t,15)});
  if(t>15)ln([[510,64],[510,540]],{dash:[4,6],a:V(t,15)*.8});
  // Users (with migration)
  const grow=P(t,11.4,12.2);const joinU=t>5.4&&t<11.2;
  table(40,118,'users',['id','name','city','phone'],[40,70,84,86*grow],UR.map((r,i)=>[...r,t>12.4+i*.55?'—':'']),
    {a:A(t,.3).a*dim,rowA:i=>V(t,.9+i*.3),hl:i=>joinU&&i===1?C.accent:(t>12.4+i*.55&&t<13.2+i*.55?C.amber:null),colA:j=>j===3?grow:1});
  table(40,280,'orders',['id','user_id','total'],[50,70,64],OR,{a:A(t,2).a*dim,rowA:i=>V(t,2.5+i*.3),hl:i=>t>6.2&&t<11.2&&OR[i][1]==='2'?C.accent:null});
  // relation arrows
  if(t>3.5&&t<11.4){const a=V(t,3.8,10.8);[0,1,2].forEach(i=>{const oy=280+28*(i+1)+14,uy=118+28*(+OR[i][1])+14;
    ln(crv([40,oy],[8,(oy+uy)/2],[40,uy]),{c:OR[i][1]==='2'&&t>6.2?C.accent:C.edge,w:1.8,a:a*(OR[i][1]==='2'||t<6.2?1:.35),p:P(t,3.8+i*.25,4.8+i*.25),arrow:true});});}
  // join result
  const ra=A(t,8,11.2);
  table(270,280,'users ⋈ orders  (user 2)',['name','city','total'],[62,78,62],[['Lin','Tokyo','$30'],['Lin','Tokyo','$55']],{a:ra.a,rowA:i=>V(t,8.6+i*.4),hl:()=>C.accent,nc:C.green});
  if(t>11){textBlock('Constant-default column: metadata only in PostgreSQL. Volatile default: evaluate rows and rewrite.',262,435,445,{c:C.amber,a:V(t,11.6,21.5)*dim,z:13});}
  // documents
  const d1=[['{ "_id": 2,'],['  "name": "Lin",'],['  "city": "Tokyo",'],['  "orders": [',C.green],['    {"total": 30},',C.green],['    {"total": 55} ] }',C.green]];
  const d2=[['{ "_id": 1,'],['  "name": "Ada",'],['  "phone": "+44…",',C.amber],['  "tags": ["vip"] }',C.amber]];
  const d3=[['{ "_id": 3,'],['  "name": "Sam",'],['  "city": "Lagos" }']];
  doc(540,104,208,d1,{a:V(t,15.5)*dim});doc(764,104,200,d2,{a:V(t,16.2)*dim});doc(764,216,200,d3,{a:V(t,16.9)*dim});
  pill('orders embedded: no JOIN',644,264,{c:C.green,z:12,a:V(t,18)*dim});
  pill('every doc has its own shape',864,310,{c:C.amber,z:12,a:V(t,19.2)*dim});
  // scaling
  if(t>22){const up=P(t,23,26);db(270,462,{label:'SQL primary',sub:'scale up ↑',...A(t,22.6),s:A(t,22.6).s*(.85+.45*up),w:100,h:80,col:C.blue,st:'blue'});
    tx(`${Math.round(8+56*up)} CPU · ${Math.round(32+480*up)} GB`,270,535,{z:12,c:C.dim,f:MONO,a:V(t,23)*(t>29?0:1)});
    for(let k=0;k<4;k++){const x=610+k*105;db(x,468,{label:'node '+(k+1),w:74,h:62,...A(t,23.3+k*.35),col:C.amber,st:'amber'});}
    each(t,24.2,28.6,.25,.9,(i,s)=>{const k=i%4;pk(t,s,.9,[[750,330],[610+k*105,432]],C.amber,{r:4.5});});
    tx('scale out →',750,382,{z:13,c:C.amber,wt:650,a:V(t,24)*(t>29?0:1)});}
  pill('ACID transactions · JOINs · strict schema',270,535,{c:C.blue,z:12.5,a:V(t,29.3)});
  pill('document / key access · verify engine guarantees',768,535,{c:C.amber,z:12.5,a:V(t,30)});
}});})();
