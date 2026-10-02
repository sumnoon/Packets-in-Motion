/* ---------------- 2c. ESTIMATION: size the chat app ---------------- */
chal('estimation',{title:'Size the chat app',goal:'50 M daily users each send 20 messages a day, about 1 KB each. Evenings run 3× the average. Estimate the peak messages per second and the storage per day.',
  hint:'Messages a day ÷ ~100,000 seconds gives the average. Multiply by 3 for the peak. Storage is messages a day × size.',
  make:api=>{const QPS=['100','300','1k','3k','10k','30k','100k','300k','1M'],STO=['1 GB','3 GB','10 GB','30 GB','100 GB','300 GB','1 TB','3 TB','10 TB'];
    const RIGHT=[5,6];let pick=[2,2],checked=false,at=0;
    api.slider('Peak messages / s',0,8,1,pick[0],v=>QPS[v],v=>{pick[0]=v;});
    api.slider('Storage per day',0,8,1,pick[1],v=>STO[v],v=>{pick[1]=v;});
    api.button('Check my estimate',()=>{if(checked)return;checked=true;at=api.now();api.lock(true);const off=pick.map((p,k)=>Math.abs(p-RIGHT[k]));
      const st=off.every(o=>o===0)?3:off.every(o=>o<=1)?2:off.some(o=>o<=1)?1:0;
      chalLater(api,()=>api.win(st,['Off by a lot','One of the two is close','Within 3× on both','Spot on'][st],`Peak: 1 B messages a day ÷ 100,000 s ≈ 10,000/s, × 3 ≈ 30,000/s. Storage: 1 B × 1 KB ≈ 1 TB a day.${st<3?' One step on each slider is a factor of about 3.':''}`),1400);},{primary:true});
    api.status('Set both sliders, then press <b>Check my estimate</b>. Each step is about 3×.');
    const L=[['50 M users × 20 messages','= 1 B messages a day'],['÷ ~100,000 s','≈ 10,000 / s on average'],['× 3 for the evening','≈ 30,000 / s at peak'],['1 B × 1 KB','≈ 1 TB a day']];
    return{draw(now){panel(40,70,440,250,{});tx('the brief',58,92,{z:12,c:C.dim,al:'left'});
        [['50 M','daily users'],['20','messages each a day'],['1 KB','per message'],['3×','evening peak over average']].forEach(([a,b],k)=>{tx(a,60,130+k*44,{z:22,wt:800,f:MONO,c:C.blue,al:'left'});tx(b,160,130+k*44,{z:14,al:'left'});});
        panel(520,70,440,250,{c:C.accent});tx('your envelope',538,92,{z:12,c:C.dim,al:'left'});
        [['peak',QPS[pick[0]]+' / s'],['storage',STO[pick[1]]+' / day']].forEach(([a,b],k)=>{tx(a,560,150+k*80,{z:14,c:C.dim,al:'left'});tx(b,940,150+k*80,{z:28,wt:800,f:MONO,al:'right',c:checked?(pick[k]===RIGHT[k]?C.green:Math.abs(pick[k]-RIGHT[k])<=1?C.amber:C.red):C.text});});
        if(checked)L.forEach(([a,b],k)=>{const v=clamp((now-at-k*.25)/.4);tx(a,60,370+k*42,{z:14,f:MONO,al:'left',a:v});tx(b,940,370+k*42,{z:15,f:MONO,wt:750,al:'right',c:k===3?C.amber:C.green,a:v});});
        else tx('Steps of ×3: 1k, 3k, 10k, 30k…',W/2,420,{z:14,c:C.dim});}};}});
