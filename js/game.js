const B={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
export const parsePitch=p=>{const m=/^([A-G])([#b])?(-?\d)$/.exec(p);return 12*(+m[3]+1)+B[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)};
export class Game{
 constructor(cv,geom,cb){this.cv=cv;this.geom=geom;this.cb=cb}
 load(l){const by={};for(const n of l.notes)(by[n.time]??=[]).push({...n,midi:parsePitch(n.pitch)});
  this.steps=Object.keys(by).map(Number).sort((a,b)=>a-b).map(t=>({beat:t,notes:by[t]}));
  Object.assign(this,{i:0,cur:this.steps[0].beat,clean:0,streak:0,best:0,okN:0,badN:0,need:null,missed:false,flash:null,done:false,lock:performance.now()+600})}
 get acc(){return this.i?this.clean/this.i:1}
 // det: Set of MIDI notes heard (mic ∪ touched keys). Pitch class first; octave only if exact.
 feed(det,exact,now=performance.now()){const s=this.steps[this.i];if(this.done||now<this.lock)return;
  const want=s.notes.map(n=>n.midi),pcs=new Set(want.map(m=>m%12)),dpc=new Set([...det].map(m=>m%12));
  if(this.need){if([...this.need].some(p=>dpc.has(p)))return;this.need=null} // repeated pitch: wait for the old note to die away
  if(want.every(m=>exact?det.has(m):dpc.has(m%12))){if(++this.okN>=2)this.advance(now);return}
  this.okN=0;if([...dpc].some(p=>!pcs.has(p))){if(++this.badN>=3){this.badN=0;this.miss(now)}}else this.badN=0}
 advance(now){const s=this.steps[this.i],nx=this.steps[this.i+1];
  if(!this.missed){this.clean++;this.streak++;this.best=Math.max(this.best,this.streak)}
  const sh=nx?new Set(s.notes.map(n=>n.midi%12).filter(p=>nx.notes.some(n=>n.midi%12===p))):null;this.need=sh&&sh.size?sh:null;
  this.flash={c:'#2ecc71',t:now,m:s.notes.map(n=>n.midi)};this.i++;this.okN=this.badN=0;this.missed=false;this.lock=now+350;
  if(this.i>=this.steps.length){this.done=true;const a=this.clean/this.steps.length;this.cb.done({acc:a,stars:a>=.9?3:a>=.7?2:1,streak:this.best})}else this.cb.step(this.steps[this.i])}
 miss(now){const s=this.steps[this.i];this.missed=true;this.streak=0;this.flash={c:'#e5484d',t:now,m:s.notes.map(n=>n.midi)};this.cb.miss(s)}
 draw(now=performance.now()){const c=this.cv,x=c.getContext('2d'),d=devicePixelRatio||1,W=c.clientWidth,H=c.clientHeight;
  if(c.width!==Math.round(W*d)){c.width=W*d;c.height=H*d}x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,H);if(this.done)return;
  this.cur+=(this.steps[this.i].beat-this.cur)*.18;const ppb=H/5,hy=H-6;x.textAlign='center';x.font='bold 22px system-ui';
  for(const[k,s]of this.steps.entries()){const y=hy-(s.beat-this.cur)*ppb;if(y<0||y>H+ppb)continue;
   for(const n of s.notes){const g=this.geom(n.midi),h=Math.max(.6,n.dur||1)*ppb*.8;x.globalAlpha=k===this.i?1:.65;
    x.fillStyle=n.hand==='L'?'#f59e0b':'#4f9dff';x.fillRect(g.x+3,y-h,g.w-6,h);x.globalAlpha=1;x.fillStyle='#14110f';x.fillText(n.finger||'',g.x+g.w/2,y-h/2+8)}}
  x.fillStyle='#fff6';x.fillRect(0,hy,W,2);
  if(this.flash&&now-this.flash.t<350){x.globalAlpha=.5*(1-(now-this.flash.t)/350);x.fillStyle=this.flash.c;for(const m of this.flash.m){const g=this.geom(m);x.fillRect(g.x,0,g.w,H)}x.globalAlpha=1}}
}
