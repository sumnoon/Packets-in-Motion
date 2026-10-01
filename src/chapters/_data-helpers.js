/* shared: simple table + document card */
function table(x,y,name,cols,ws,rows,o={}){const a=o.a??1;if(a<=.01)return;const W0=ws.reduce((p,c)=>p+c,0),rh=o.rh||28;
  g.save();g.globalAlpha*=a;
  if(name)tx(name,x,y-15,{z:13,wt:700,al:'left',c:o.nc||C.accent});
  rr(x,y,W0,rh*(rows.length+1),8);g.fillStyle=C.panel;g.fill();g.strokeStyle=o.bc||C.line;g.lineWidth=1.3;g.stroke();
  g.save();rr(x,y,W0,rh,8);g.clip();g.fillStyle=C.panel2;g.fillRect(x,y,W0,rh);g.restore();
  let cx=x;cols.forEach((c,j)=>{if(ws[j]>24)tx(c,cx+8,y+rh/2,{z:12,wt:700,al:'left',c:C.dim,f:MONO,a:o.colA?o.colA(j):1});cx+=ws[j];});
  rows.forEach((r,i)=>{const ra=o.rowA?o.rowA(i):1;if(ra<=.01)return;const ry=y+rh*(i+1);const hl=o.hl&&o.hl(i);
    g.save();g.globalAlpha*=ra;if(hl){g.fillStyle=hexA(hl,.2);g.fillRect(x+1,ry+1,W0-2,rh-2);}
    g.strokeStyle=C.line;g.lineWidth=1;g.beginPath();g.moveTo(x+1,ry);g.lineTo(x+W0-1,ry);g.stroke();
    let cx=x;r.forEach((v,j)=>{if(ws[j]>24){const cc=o.cellC&&o.cellC(i,j);tx(v,cx+8,ry+rh/2,{z:12.5,al:'left',f:MONO,c:cc||(hl?C.text:'#c9d2e3'),a:o.cellA?o.cellA(i,j):1});}cx+=ws[j];});g.restore();});
  g.restore();}
function doc(x,y,w,lines,o={}){const a=o.a??1;if(a<=.01)return;const lh=19,h=lines.length*lh+18;
  draw(0,0,{a},()=>{rr(x,y,w,h,10);g.fillStyle=C.panel;g.fill();g.strokeStyle=o.c||C.edge;g.lineWidth=1.5;g.stroke();
    lines.forEach((l,i)=>{const[s,c]=Array.isArray(l)?l:[l];tx(s,x+12,y+9+lh*i+lh/2,{z:12.5,al:'left',f:MONO,c:c||'#c9d2e3'});});});return h;}
