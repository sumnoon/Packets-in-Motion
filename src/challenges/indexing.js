/* ---------------- 8. INDEXING: find the row ---------------- */
chal('indexing',{title:'Find the row',goal:'Walk down the index to one user id in as few page reads as possible. A full table scan would read up to 10,000 rows.',
  hint:'At each level, pick the range that contains the id. Four reads is perfect.',
  make:api=>{let target,lvl,lo,hi,reads,path,done,flash,pageRows;
    function reset(){target=1+Math.floor(Math.random()*9999);lvl=0;lo=1;hi=10000;reads=0;path=[];done=false;flash=null;pageRows=null;api.status(`Find user <b>#${target}</b>. Click the range that contains it.`);}
    reset();
    const kids=()=>{const n=4,step=Math.ceil((hi-lo+1)/n);return Array.from({length:n},(_,k)=>({a:lo+k*step,b:Math.min(hi,lo+(k+1)*step-1),x:130+k*247,y:300,w:210,h:80}));};
    return{draw(now){tx(`Find user #${target}`,W/2,70,{z:26,wt:800,c:C.accent});
        tx(path.length?'index path:  '+path.join('  →  '):'root of the index',W/2,108,{z:13,c:C.dim,f:MONO});
        if(pageRows){pageRows.forEach((r,j)=>{const x=150+j*140,hit=r===target;plate(x,300,120,70,{c:hit?C.green:C.edge,fill:C.panel2});tx(`#${r}`,x,292,{z:15,wt:750,f:MONO,c:hit?C.green:C.text});tx(hit?'← here?':'row',x,316,{z:11,c:C.dim});});tx('Leaf page: click the row',W/2,210,{z:14,c:C.dim});}
        else kids().forEach((k,j)=>{const bad=flash&&flash.j===j&&now-flash.t<.6;plate(k.x+k.w/2,k.y,k.w,k.h,{c:bad?C.red:C.edge,fill:C.panel2});
          tx(`${k.a.toLocaleString()} – ${k.b.toLocaleString()}`,k.x+k.w/2,k.y-6,{z:16,wt:750,f:MONO});tx(lvl===0?'index node':`level ${lvl+1}`,k.x+k.w/2,k.y+20,{z:11.5,c:C.dim});});
        for(let i=0;i<reads;i++)dot(90+i*22,460,C.amber,6);tx(`page reads: ${reads}`,90,490,{z:14,wt:700,c:C.amber,al:'left'});
        tx('full scan: up to 10,000 rows',W-90,490,{z:13,c:C.dim,al:'right'});},
      click(x,y,now){if(done)return;
        if(pageRows){const j=pageRows.findIndex((r,j)=>Math.abs(x-(150+j*140))<60&&Math.abs(y-300)<35);if(j<0)return;reads++;if(pageRows[j]===target){done=true;FX.burst(150+j*140,300,C.green,40,240);
            api.win(reads<=4?3:reads<=6?2:1,`Found in ${reads} reads`,`A full scan could need 10,000. The index halves and quarters the search at every level, so a million rows would take only a couple more reads.`);}else FX.text(150+j*140,260,'not this one',C.red,13);return;}
        const K=kids(),j=K.findIndex(k=>inBox(x,y,{x:k.x,y:k.y-k.h/2,w:k.w,h:k.h}));if(j<0)return;reads++;const k=K[j];
        if(target<k.a||target>k.b){flash={j,t:now};FX.text(k.x+k.w/2,k.y-60,'not in this range',C.red,13);return;}
        path.push(`${k.a}–${k.b}`);lo=k.a;hi=k.b;lvl++;FX.burst(k.x+k.w/2,k.y,C.green,12,120);
        if(hi-lo<200){const s=new Set([target]);while(s.size<6)s.add(lo+Math.floor(Math.random()*(hi-lo+1)));pageRows=[...s].sort((a,b)=>a-b);}}};}});
