/* ---------------- S3. GEO: find the nearest driver ---------------- */
chal('geo',{title:'Find the nearest driver',goal:'Walk down the quadtree to the rider\'s cell, then pick which of the nine cells around the rider holds the nearest driver.',
  hint:'At each level pick the quarter the rider is in. At the end, the nearest driver may be just across an edge: look at all nine cells.',
  make:api=>{const MX=240,MY=70,MW=520,MH=440,X=u=>MX+u*MW,Y=v=>MY+v*MH,R=()=>.18+Math.random()*.64;
    let rider,drivers,ans,box=[0,0,1],lvl=0,mistakes=0,stage='down',done=false,flash=null;
    const cellOf=([u,v])=>[Math.floor(u*8),Math.floor(v*8)];
    (function gen(){for(;;){rider=[R(),R()];const[cx,cy]=cellOf(rider);
        drivers=[];for(let i=0;i<6;i++)drivers.push([(cx-1+Math.random()*3)/8,(cy-1+Math.random()*3)/8]);
        for(let i=0;i<34;i++){const p=[Math.random(),Math.random()],[px,py]=cellOf(p);if(Math.abs(px-cx)>2||Math.abs(py-cy)>2)drivers.push(p);}
        const near=drivers.reduce((b,p)=>Math.hypot(p[0]-rider[0],p[1]-rider[1])<Math.hypot(b[0]-rider[0],b[1]-rider[1])?p:b);const[nx,ny]=cellOf(near);
        if(Math.abs(nx-cx)<=1&&Math.abs(ny-cy)<=1&&Math.hypot(near[0]-rider[0],near[1]-rider[1])>.02){ans=(ny-cy+1)*3+(nx-cx+1);return;}}})();
    const quad=k=>{const h=box[2]/2;return[box[0]+(k%2)*h,box[1]+Math.floor(k/2)*h,h];};
    const say=()=>api.status(stage==='down'?`Level ${lvl+1} of 3: which quarter is the rider in? <kbd>1</kbd> top left · <kbd>2</kbd> top right · <kbd>3</kbd> bottom left · <kbd>4</kbd> bottom right.`
      :'Rider\'s cell found. Which of the nine cells holds the nearest driver? Press <kbd>1</kbd>–<kbd>9</kbd> (reading order) or click a cell.');
    function pickQuad(k,now){if(done||stage!=='down'||k<0||k>3)return;const q=quad(k);const inside=rider[0]>=q[0]&&rider[0]<q[0]+q[2]&&rider[1]>=q[1]&&rider[1]<q[1]+q[2];
      if(!inside){mistakes++;flash={q,t:now};FX.text(X(q[0]+q[2]/2),Y(q[1]+q[2]/2),'not here',C.red,14);return;}
      box=q;lvl++;FX.burst(X(q[0]+q[2]/2),Y(q[1]+q[2]/2),C.green,12,120);if(lvl>=3)stage='near';say();}
    function pickCell(k,now){if(done||stage!=='near'||k<0||k>8)return;const[cx,cy]=cellOf(rider),x=cx-1+k%3,y=cy-1+Math.floor(k/3);
      if(k!==ans){mistakes++;flash={q:[x/8,y/8,1/8],t:now};FX.text(X((x+.5)/8),Y((y+.5)/8)-30,'someone is closer',C.red,13);return;}
      done=true;FX.burst(X((x+.5)/8),Y((y+.5)/8),C.green,30,200);const st=mistakes===0?3:mistakes===1?2:1;
      api.win(st,mistakes?`Found with ${mistakes} wrong pick${mistakes>1?'s':''}`:'Straight to the nearest driver',`Three quarter-steps found the rider\'s cell among 64, and checking the ${ans===4?'cell itself':'neighbours'} found the nearest driver${ans===4?'':' just across an edge'}. That is how geohash and quadtree lookups work.`);}
    say();
    return{draw(now){g.save();rr(MX,MY,MW,MH,12);g.fillStyle='#0d1424';g.fill();g.strokeStyle=C.line;g.lineWidth=1.5;g.stroke();g.restore();
        drivers.forEach(p=>dot(X(p[0]),Y(p[1]),C.amber,stage==='near'?4:3,stage==='near'?1:.6));
        if(stage==='down'){for(let k=0;k<4;k++){const q=quad(k),bad=flash&&flash.q[0]===q[0]&&flash.q[1]===q[1]&&now-flash.t<.6;g.save();g.strokeStyle=bad?C.red:C.blue;g.lineWidth=2;g.strokeRect(X(q[0]),Y(q[1]),q[2]*MW,q[2]*MH);g.restore();keycap(String(k+1),X(q[0])+16,Y(q[1])+16);}}
        else{const[cx,cy]=cellOf(rider);for(let k=0;k<9;k++){const x=cx-1+k%3,y=cy-1+Math.floor(k/3),bad=flash&&Math.abs(flash.q[0]-x/8)<1e-9&&Math.abs(flash.q[1]-y/8)<1e-9&&now-flash.t<.6;
            g.save();g.strokeStyle=bad?C.red:k===4?C.accent:hexA(C.green,.8);g.lineWidth=k===4?2.5:1.5;g.strokeRect(X(x/8),Y(y/8),MW/8,MH/8);g.restore();keycap(String(k+1),X(x/8)+13,Y(y/8)+13,{c:k===4?C.accent:C.dim});}
          if(done){const near=drivers.reduce((b,p)=>Math.hypot(p[0]-rider[0],p[1]-rider[1])<Math.hypot(b[0]-rider[0],b[1]-rider[1])?p:b);ln([[X(rider[0]),Y(rider[1])],[X(near[0]),Y(near[1])]],{c:C.green,w:2.5});}}
        user(X(rider[0]),Y(rider[1]),{r:10,c:C.blue});
        tx(stage==='down'?`level ${lvl+1} / 3`:'nine cells around the rider',W/2,40,{z:14,wt:700,c:C.dim});tx(`wrong picks: ${mistakes}`,MX+MW,540,{z:12.5,c:mistakes?C.red:C.dim,al:'right'});},
      click(x,y,now){const u=(x-MX)/MW,v=(y-MY)/MH;if(u<0||u>1||v<0||v>1)return;
        if(stage==='down'){const h=box[2]/2,k=(u>=box[0]+h?1:0)+(v>=box[1]+h?2:0);if(u>=box[0]&&u<box[0]+box[2]&&v>=box[1]&&v<box[1]+box[2])pickQuad(k,now);}
        else{const[cx,cy]=cellOf(rider),dx=Math.floor(u*8)-cx+1,dy=Math.floor(v*8)-cy+1;if(dx>=0&&dx<3&&dy>=0&&dy<3)pickCell(dy*3+dx,now);}},
      key(k,now){const d=+k;if(!(d>=1))return;if(stage==='down')pickQuad(d-1,now);else pickCell(d-1,now);}};}});
