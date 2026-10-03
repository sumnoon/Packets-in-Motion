// Storage is optional: keep the course usable, but never imply a failed save succeeded.
const PIM_STORE={
  failed:false,
  warn(){this.failed=true;const el=document.getElementById('storageMsg');if(el)el.textContent='Browser storage is unavailable. Changes stay in this tab; export your progress before closing it.';},
  get(k){try{return localStorage.getItem(k);}catch(e){this.warn();return null;}},
  set(k,v){try{localStorage.setItem(k,v);return true;}catch(e){this.warn();return false;}},
  json(k,def){try{const raw=this.get(k);return raw==null?def:JSON.parse(raw);}catch(e){return def;}},
  put(k,v){return this.set(k,JSON.stringify(v));}
};
const pimRecord=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
function pimFilter(v,valid){const out={};if(pimRecord(v))Object.entries(v).forEach(([k,x])=>{if(valid(k,x))out[k]=x;});return out;}
const pimSeen=v=>pimFilter(v,(k,x)=>chapters.some(c=>c.id===k)&&(x===1||x===true));
const pimStars=v=>pimFilter(v,(k,x)=>(Object.hasOwn(CHAL,k)||Object.values(QUIZ).some(q=>q.id===k))&&Number.isInteger(x)&&x>=0&&x<=3);
const pimSpeed=v=>[.5,1,1.5,2].includes(Number(v))?Number(v):1;
function pimResume(v){if(!pimRecord(v)||v.version!==1||typeof v.chapter!=='string'||!Number.isFinite(v.time)||v.time<0)return null;const c=chapters.find(c=>c.id===v.chapter);return c&&v.time<=c.dur&&[.5,1,1.5,2].includes(v.speed)?{version:1,chapter:c.id,time:v.time,speed:v.speed}:null;}
