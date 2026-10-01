/* ---------------- S2. SEARCH: INVERTED INDEXES ---------------- */
(function(){
const DOCS=[['D1','Caching with Redis'],['D2','Redis streams for events'],['D3','CDN caches images'],['D4','Sharding Postgres by user']];
const DX=60,DY=k=>110+k*92,DW=250;
// the index, in the order its rows appear: term → documents
const IDX=[['cache',[1,3]],['redis',[1,2]],['stream',[2]],['event',[2]],['cdn',[3]],['image',[3]],['shard',[4]],['postgres',[4]],['user',[4]]];
const IX=560,IY=k=>104+k*38,ROW0=11.4;
const TOK=[['Caching','cache',true],['with','',false],['Redis','redis',true]];
const SH=[[620,300],[770,300],[920,300]];
ch({id:'search',group:'Storage & Search',title:'Search: Inverted Indexes',dur:36,needs:['indexing'],related:['storage-engines','sharding','caching'],
beats:[
[0,'Find every document with a word','To find documents that mention "cache", reading every one is fine for four documents and hopeless for forty million.'],
[5,'Break text into terms','Each document is tokenized: split into words, lower-cased, common words like "with" dropped, and each word trimmed to a root, so "Caching" becomes "cache".'],
[11,'The inverted index','For every term, keep the list of documents that contain it, its postings list. It is the index at the back of a book, built for every word.'],
[18,'Answer a query','"cache AND redis": fetch the two postings lists and intersect them. Only documents in both lists match. OR takes the union instead.'],
[24,'Rank the results','Score each match: rare terms count more than common ones, and a match in the title counts more than one in the body. Show the best first.'],
[30,'Shard the index','A big index is split by document across many machines. A query goes to every shard, each returns its best matches, and the results are merged.']],
use:['Site and product search, log search, autocomplete','Any "find documents containing these words" question at scale','Engines such as Elasticsearch, OpenSearch and Lucene are built on it'],
cons:['The index is extra storage and must be updated on every write','New documents appear in results after a short indexing delay','Relevance needs tuning: synonyms, typos and languages all need care'],
draw(t){
  // documents
  DOCS.forEach(([id,title],k)=>{const a=V(t,.3+k*.2),y=DY(k),scan=t>1.5&&t<5&&Math.floor((t-1.5)/.7)%4===k,used=t>=24&&t<30&&(k===0||k===2);
    plate(DX+DW/2,y,DW,70,{c:scan?C.amber:used?C.green:C.edge,a,r:12,glow:scan?12:0});
    tx(id,DX+16,y-14,{z:12,wt:800,f:MONO,c:C.dim,al:'left',a});tx(title,DX+16,y+10,{z:14.5,wt:650,al:'left',a});});
  if(t>1.2&&t<5.4){pill('query: cache',W/2,80,{c:C.accent,z:13,f:MONO,a:V(t,1.2,5.2)});pill('reading every document… now imagine 40 million',W/2+60,520,{c:C.red,z:12.5,a:V(t,2.4,5.2)});}
  // tokenizing D1
  if(t>5&&t<11.6){const a=V(t,5.2,11.4);TOK.forEach(([w,tok,keep],i)=>{const x=400,y=150+i*62,p=P(t,6.2+i*.6,7+i*.6);
      pill(w,lerp(DX+80+i*60,x,p),lerp(DY(0)+10,y,p),{c:C.blue,z:13,f:MONO,a});
      if(t>7.6+i*.6){if(keep)pill(tok,x+130,y,{c:C.green,z:13,f:MONO,a:a*V(t,7.6+i*.6)});else tx('dropped',x+110,y,{z:12,c:C.faint,al:'left',a:a*V(t,7.6+i*.6)});}});
    pill('lower-case · drop common words · trim to a root',W/2,520,{c:C.dim,z:12,a:a*V(t,8.4)});}
  // the index
  const ia=V(t,ROW0-.2,29.8);if(ia>0){tx('term',IX,80,{z:12,wt:700,c:C.dim,al:'left',f:MONO,a:ia});tx('postings list',IX+150,80,{z:12,wt:700,c:C.dim,al:'left',f:MONO,a:ia});
    const q=t>=18&&t<24,qr=t>=24&&t<30;
    IDX.forEach(([term,docs],k)=>{const a=V(t,ROW0+k*.45,29.8);if(a<=0)return;const y=IY(k),hot=(q&&(term==='cache'||term==='redis'))||(qr&&term==='cache');
      tx(term,IX,y,{z:14,wt:750,f:MONO,c:hot?C.accent:C.text,al:'left',a});
      docs.forEach((d,j)=>{const both=q&&d===1,dim=q&&hot&&d!==1;pill(`D${d}`,IX+170+j*60,y,{c:both?C.green:hot?C.accent:C.blue,z:12,f:MONO,a:a*(dim?.45:1)});});});}
  if(t>18.4&&t<24){pill('cache AND redis',W/2-40,500,{c:C.accent,z:13,f:MONO,a:V(t,18.4,23.8)});pill('[D1, D3] ∩ [D1, D2] = [D1]',W/2+180,500,{c:C.green,z:13,f:MONO,a:V(t,19.6,23.8)});}
  // ranking
  if(t>24.2&&t<30){const a=V(t,24.2,29.8);pill('query: cache',DX+DW/2,62,{c:C.accent,z:13,f:MONO,a});
    [['D1','in the title, rare in the collection',.92],['D3','in the title, as "caches"',.71]].forEach(([d,why,s],k)=>{const y=470+k*38,x=DX;
      tx(`${k+1}. ${d}`,x,y,{z:14,wt:800,f:MONO,al:'left',a});meter(x+80,y-5,150,10,s*P(t,24.6+k*.4,25.6+k*.4),C.green);tx(why,x+244,y,{z:12,c:C.dim,al:'left',a});});}
  // sharded index
  const sa=V(t,30.2);if(sa>0){SH.forEach(([x,y],k)=>box(x,y,{label:`Shard ${k+1}`,sub:'part of the docs',w:130,h:52,c:C.blue,a:sa*V(t,30.2+k*.2)}));
    pill('query: cache AND redis',770,150,{c:C.accent,z:13,f:MONO,a:sa});
    SH.forEach(([x,y],k)=>{pk(t,30.8,.7,[[770,166],[x,y-26]],C.accent,{r:4.5});pk(t,32+k*.15,.7,[[x,y+26],[770,430]],C.green,{r:4.5,label:k===1?'its top 10':null});});
    if(t>33)pill('merge → the overall top 10',770,446,{c:C.green,z:12.5,a:V(t,33)});}
}});})();
