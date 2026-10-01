/* ---------------- 0. START HERE: PACKETS, IP ADDRESSES & PORTS ---------------- */
(function(){
const LP=[110,300],SV=[880,300],PH=[240,300];
const R={a:[330,190],b:[330,410],c:[520,140],d:[520,300],e:[520,460],f:[710,215],g:[710,385]};
const EDGES=[['a','c'],['a','d'],['b','d'],['b','e'],['c','f'],['d','f'],['d','g'],['e','g']];
// Wires and packets share endpoints: where each wire meets the laptop's circle (r 18)
// and the server's box (124 × 62), so packets ride exactly on the drawn line.
const atLaptop=k=>{const[x,y]=R[k],dx=x-LP[0],dy=y-LP[1],d=Math.hypot(dx,dy);return[LP[0]+dx/d*18,LP[1]+dy/d*18];};
const atServer=k=>{const[x,y]=R[k],dx=x-SV[0],dy=y-SV[1],s=Math.min(62/Math.abs(dx||1e-9),31/Math.abs(dy||1e-9));return[SV[0]+dx*s,SV[1]+dy*s];};
const via=(...k)=>[atLaptop(k[0]),...k.map(q=>R[q]),atServer(k[k.length-1])];
// four packets, different roads; #3 is lost at router d and resent later
const SENT=[{n:1,path:via('a','c','f'),t0:12.6,d:3.3},{n:2,path:via('b','e','g'),t0:13.1,d:2.7},{n:4,path:via('b','d','f'),t0:14.1,d:3.1}];
const arr=n=>n===3?27.9:(p=>p.t0+p.d)(SENT.find(p=>p.n===n));
const SLOT=k=>[790+k*46,165];
ch({id:'packets',group:'Start Here',title:'How Computers Talk: Packets, IP Addresses & Ports',dur:34,needs:[],related:['client-server','rest-grpc-ws'],
beats:[
[0,'Two computers, one message','Your laptop wants to send a photo to a server far away. The internet only moves small pieces, so the photo is split into packets.'],
[6,'Every packet carries an address','Each packet is labelled with the destination IP address (like a street address) and a port number (which door to knock on).'],
[12,'Routers pass packets hop by hop','No single wire connects you to the server. Each router reads the address and hands the packet to a neighbour that is closer.'],
[18,'Packets take different roads','Pieces of the same photo may travel different paths and arrive out of order. One of them got lost on the way.'],
[23.5,'Put the pieces back together','Each packet is numbered, so the server puts them in order, notices #3 is missing and asks for it again.'],
[29,'Ports: one address, many doors','One server runs many programs. Port 443 is the web server, 5432 the database, 22 remote login. The port picks the program.']],
use:['Every networked app: websites, games, chat, video calls','Debugging: "host unreachable" is a wrong address, "connection refused" often a wrong port','The foundation for every other chapter in this course'],
cons:['Packets can be lost, delayed or duplicated, so a protocol (TCP) has to fix that','Every router hop adds a little delay','Anyone along the path can read unencrypted packets, so use TLS (https)'],
draw(t){
  const ra=A(t,11.4);
  EDGES.forEach(([a,b])=>ln([R[a],R[b]],{a:ra.a*.6}));['a','b'].forEach(k=>ln([atLaptop(k),R[k]],{a:ra.a*.6}));['f','g'].forEach(k=>ln([R[k],atServer(k)],{a:ra.a*.6}));
  Object.values(R).forEach(p=>box(p[0],p[1],{label:'Router',w:76,h:38,z:12.5,c:C.edge,...ra}));
  user(LP[0],LP[1],{label:'your laptop',r:18,...A(t,.2)});
  server(SV[0],SV[1],{label:'Server',sub:'93.184.216.34',w:124,...A(t,.4)});
  // the photo, then its four pieces
  const sp=P(t,2.2,4.2);
  if(sp<1)draw(PH[0],PH[1],{a:V(t,.8)*(1-sp)},()=>{rr(-60,-34,120,68,10);g.fillStyle=C.panel2;g.fill();g.strokeStyle=C.edge;g.lineWidth=2;g.stroke();tx('photo.jpg',0,-6,{z:14,wt:700});tx('4 MB',0,14,{z:11.5,c:C.dim,f:MONO});});
  if(sp>0)for(let k=0;k<4;k++){const n=k+1,s=SENT.find(q=>q.n===n),gone=n===3?t>13.6:s&&t>s.t0;if(gone)continue;
    const y=lerp(PH[1],206+k*62,sp);draw(PH[0],y,{a:sp},()=>{rr(-42,-22,84,44,8);g.fillStyle=C.panel2;g.fill();g.strokeStyle=hexA(C.blue,.8);g.lineWidth=1.8;g.stroke();tx(`#${n}`,0,1,{z:15,wt:800,c:C.blue});});}
  if(t>4.4&&t<11)pill('split into 4 packets',PH[0],470,{c:C.blue,z:12.5,a:V(t,4.4,10.6)});
  // what a packet carries
  const la=A(t,6.3,11.3);draw(560,300,la,()=>{rr(-175,-86,350,172,14);g.fillStyle=C.panel;g.fill();g.strokeStyle=C.blue;g.lineWidth=2;g.stroke();
    [['to',  '93.184.216.34','IP address: which computer'],['port','443','which program (door)'],['from','10.0.0.7','so replies can find you'],['piece','#1 of 4','so pieces can be re-ordered']]
      .forEach(([k,v,s],i)=>{tx(k,-155,-54+i*36,{z:12,c:C.dim,al:'left'});tx(v,-95,-54+i*36,{z:15,wt:750,f:MONO,al:'left',c:C.blue});tx(s,155,-54+i*36,{z:11.5,c:C.dim,al:'right'});});});
  // travel
  SENT.forEach(s=>pk(t,s.t0,s.d,s.path,C.blue,{label:`#${s.n}`,r:6}));
  const lostPath=[atLaptop('a'),R.a,R.d];pk(t,13.6,1.6,lostPath,C.blue,{label:'#3',r:6});drop(t,15.2,R.d[0],R.d[1],{label:'lost!'});
  if(t>15.2&&t<18.5)pill('packet #3 lost',R.d[0],R.d[1]+50,{c:C.red,z:12,a:V(t,15.3,18.2)});
  if(t>17.5&&t<23.5){const order=[1,2,4].sort((a,b)=>arr(a)-arr(b)).map(n=>'#'+n).join('  ');pill(`arrived: ${order}  (out of order)`,SV[0]-40,SV[1]+70,{c:C.amber,z:12,a:V(t,17.6,23.2)});}
  // reassembly strip
  const sa=V(t,16);if(sa>0){tx('reassembled',SLOT(0)[0]-30,SLOT(0)[1]-34,{z:11.5,c:C.dim,al:'left',a:sa});
    for(let k=0;k<4;k++){const n=k+1,[x,y]=SLOT(k);
      const filled=n===3?t>=arr(3):t>=23.5+k*.2&&t>=arr(n);
      g.save();g.globalAlpha=sa;rr(x-19,y-19,38,38,7);g.fillStyle=filled?hexA(C.green,.25):C.panel;g.fill();
      if(!filled&&n===3&&t>24){g.setLineDash([4,4]);g.strokeStyle=Math.floor(t*3)%2?C.red:hexA(C.red,.4);}else g.strokeStyle=filled?C.green:C.line;g.lineWidth=1.6;g.stroke();g.setLineDash([]);g.restore();
      tx(`#${n}`,x,y+1,{z:13,wt:800,c:filled?C.green:C.dim,a:sa});}}
  if(t>24&&t<28)pill('missing #3 → please resend',SV[0]-20,SV[1]-78,{c:C.amber,z:12,a:V(t,24.2,27.7)});
  pk(t,24.4,1.1,[atServer('g'),R.g,R.e],C.amber,{r:4,label:'resend #3?'});
  pk(t,25.5,2.4,via('b','e','g'),C.blue,{label:'#3 again',r:6});
  if(t>28.2)pill('photo.jpg complete ✓',SV[0]-20,SV[1]-78,{c:C.green,z:12.5,a:V(t,28.2)});
  // ports
  const pa=A(t,29.2);if(pa.a>0){[[':443','web server',C.blue],[':5432','database',C.dim],[':22','remote login',C.dim]].forEach(([p,n,c],k)=>{const y=392+k*42;
      pill(`${p}  ${n}`,SV[0],y,{c:k===0&&t>31.6?C.green:c,z:12.5,a:pa.a,f:MONO});});
    ln([[SV[0],SV[1]+32],[SV[0],374]],{a:pa.a*.5,dash:[3,5]});}
  pk(t,29.8,1.8,via('b','e','g'),C.blue,{label:'→ :443',r:6});
  if(t>31.6)pill('same address, port 443 → the web server answers',500,520,{c:C.green,z:12.5,a:V(t,31.7)});
}});})();
