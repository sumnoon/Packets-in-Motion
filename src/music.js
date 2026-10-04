/* ---------------- background music (off until the viewer turns it on) ----------------
   A slow generative ambient score, synthesized in the browser like the sound cues: nothing is
   downloaded. Warm pads move through a four-chord loop over a soft bass, and a few plucked notes
   from A minor pentatonic drift over each bar, picked fresh every time so the music never loops
   exactly. Lessons and the learning hub stay calm; a running challenge adds a gentle pulse and a
   slightly brighter tone ("focus"). The music fades out while the tab is hidden. */
const MUSIC={
  on:false,vol:.5,mood:'calm',ctx:null,out:null,bus:null,tone:null,timer:null,next:0,bar:0,seed:1,
  BAR:8,                                              // seconds per chord: eight slow beats
  // MIDI notes: pad voicing and bass for Fmaj7, G6, Em7, Am9
  CHORDS:[{pad:[53,57,60,64],bass:41},{pad:[55,59,62,64],bass:43},{pad:[52,55,59,62],bass:40},{pad:[57,60,64,71],bass:45}],
  SCALE:[69,72,74,76,79,81],                          // A minor pentatonic, A4 to A5
  hz:m=>440*Math.pow(2,(m-69)/12),
  // music has its own small random source, so it can never disturb the course's seeded randomness
  rand(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;},
  // the shared output chain: score bus → warm low-pass → dry + generated reverb → volume
  chain(ctx){const out=ctx.createGain(),bus=ctx.createGain(),tone=ctx.createBiquadFilter(),verb=ctx.createConvolver(),wet=ctx.createGain(),dry=ctx.createGain();
    tone.type='lowpass';tone.frequency.value=1800;tone.Q.value=.4;
    const len=Math.floor(ctx.sampleRate*3.2),ir=ctx.createBuffer(2,len,ctx.sampleRate);
    for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(this.rand()*2-1)*Math.pow(1-i/len,2.6);}
    verb.buffer=ir;wet.gain.value=.55;dry.gain.value=.7;
    bus.connect(tone);tone.connect(dry);tone.connect(verb);verb.connect(wet);dry.connect(out);wet.connect(out);out.connect(ctx.destination);
    return {out,bus,tone};},
  // one note with an envelope: a slow swell for pads and bass, a quick pluck for melody
  note(ctx,dest,m,t,dur,o){const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=o.type||'sine';osc.frequency.value=this.hz(m);if(o.cents)osc.detune.value=o.cents;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(o.vol,t+o.attack);
    if(o.pluck)g.gain.exponentialRampToValueAtTime(.0001,t+dur);else{g.gain.setValueAtTime(o.vol,t+dur-o.release);g.gain.linearRampToValueAtTime(0,t+dur);}
    osc.connect(g);g.connect(dest);osc.start(t);osc.stop(t+dur+.05);},
  // everything that plays during one chord, starting at time t
  scheduleBar(ctx,bus,t,bar,mood){const B=this.BAR,ch=this.CHORDS[bar%this.CHORDS.length],beat=B/8;
    // pads overlap the next chord by a breath so the changes stay smooth
    ch.pad.forEach(m=>{this.note(ctx,bus,m,t,B+1.6,{type:'triangle',vol:.035,attack:2.6,release:2.2});this.note(ctx,bus,m,t,B+1.6,{vol:.028,attack:3,release:2.4,cents:6});});
    this.note(ctx,bus,ch.bass,t,B+.8,{vol:.1,attack:1.2,release:1.8});
    // two to four plucked notes on half beats, never two at once
    const n=2+Math.floor(this.rand()*3),slots=new Set();
    while(slots.size<n)slots.add(1+Math.floor(this.rand()*13));
    [...slots].sort((a,b)=>a-b).forEach(s=>{const m=this.SCALE[Math.floor(this.rand()*this.SCALE.length)];this.note(ctx,bus,m,t+s*beat/2,2.4,{vol:.075,attack:.006,pluck:true});this.note(ctx,bus,m+12,t+s*beat/2,1.2,{vol:.012,attack:.006,pluck:true,type:'triangle'});});
    // focus: a soft heartbeat on every beat, an octave above the bass
    if(mood==='focus')for(let k=0;k<8;k++)this.note(ctx,bus,ch.bass+12,t+k*beat,.45,{vol:k%2?.035:.06,attack:.01,pluck:true});},
  tick(){if(!this.on||!this.ctx)return;const ctx=this.ctx;
    if(this.next<ctx.currentTime)this.next=ctx.currentTime+.1;
    while(this.next<ctx.currentTime+1.5){this.scheduleBar(ctx,this.bus,this.next,this.bar++,this.mood);this.next+=this.BAR;}
    this.timer=setTimeout(()=>this.tick(),400);},
  level(){return this.on&&!document.hidden?this.vol*1.1:0;},
  fade(to,secs){if(!this.out)return;const g=this.out.gain,t=this.ctx.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(to,t+secs);},
  // turn on (the browser may keep audio suspended until the next tap or key; unlock() resumes it)
  enable(v){this.on=!!v;clearTimeout(this.timer);this.timer=null;
    if(!v){this.fade(0,.6);return;}
    if(!this.ctx){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;this.ctx=SFX.ctx||new A();SFX.ctx=SFX.ctx||this.ctx;this.seed=(Date.now()>>>0)||1;Object.assign(this,this.chain(this.ctx));this.out.gain.value=0;}
    this.unlock();this.setMood(this.mood);this.fade(this.level(),2.5);this.next=0;this.tick();},
  unlock(){if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});},
  setVolume(v){this.vol=Math.min(1,Math.max(0,+v||0));if(this.on)this.fade(this.level(),.25);},
  setMood(m){this.mood=m==='focus'?'focus':'calm';if(this.tone){const f=this.tone.frequency,t=this.ctx.currentTime;f.cancelScheduledValues(t);f.setValueAtTime(f.value,t);f.linearRampToValueAtTime(this.mood==='focus'?2600:1800,t+3);}},
  // a hidden tab fades out and stops scheduling; coming back fades in where it left off
  visibility(){if(!this.on||!this.ctx)return;if(document.hidden){clearTimeout(this.timer);this.timer=null;this.fade(0,.4);}else{this.fade(this.level(),1.5);if(!this.timer){this.next=0;this.tick();}}}
};
