export const midiHz=m=>440*2**((m-69)/12);
const N=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
export const noteName=m=>N[m%12]+(Math.floor(m/12)-1);
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let b=n>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]]}}
for(let l=2;l<=n;l<<=1){const a=-2*Math.PI/l,wr=Math.cos(a),wi=Math.sin(a);for(let i=0;i<n;i+=l){let cr=1,ci=0;for(let k=0;k<l/2;k++){const u=i+k,v=u+l/2,tr=re[v]*cr-im[v]*ci,ti=re[v]*ci+im[v]*cr;re[v]=re[u]-tr;im[v]=im[u]-ti;re[u]+=tr;im[u]+=ti;[cr,ci]=[cr*wr-ci*wi,cr*wi+ci*wr]}}}}
export function spectrum(buf){const n=buf.length,re=new Float64Array(n),im=new Float64Array(n);let e=0;
for(let i=0;i<n;i++){re[i]=buf[i]*(.5-.5*Math.cos(2*Math.PI*i/n));e+=buf[i]*buf[i]}
fft(re,im);const mag=new Float64Array(n/2);for(let i=0;i<n/2;i++)mag[i]=Math.hypot(re[i],im[i])/n;return{mag,rms:Math.sqrt(e/n)}}
// Polyphonic: harmonic-sum salience + iterative cancellation of each found note's partials.
function poly(mag,sr,floor,lo=48,hi=96){const bin=sr/(mag.length*2),w=mag.slice(),out=[];let ref=0;
const at=f=>{const k=Math.round(f/bin);return Math.max(w[k-1]||0,w[k]||0,w[k+1]||0)};
for(let it=0;it<6;it++){let best=-1,bs=0;
for(let m=lo;m<=hi;m++){const f=midiHz(m);let s=0;for(let h=1;h<=5;h++)s+=at(f*h)/Math.sqrt(h);if(s>bs){bs=s;best=m}}
if(best<0||bs<floor||bs<ref*.35)break;if(!ref)ref=bs;out.push(best);
for(let h=1;h<=8;h++){const k=Math.round(midiHz(best)*h/bin);for(let j=k-1;j<=k+1;j++)w[j]=0}}
return out}
// Monophonic fallback (YIN). Returns Hz or -1.
export function yin(buf,sr,th=.12){const n=buf.length>>1,d=new Float32Array(n);
for(let t=1;t<n;t++){let s=0;for(let i=0;i<n;i++){const x=buf[i]-buf[i+t];s+=x*x}d[t]=s}
let r=0;for(let t=1;t<n;t++){r+=d[t];d[t]=d[t]*t/r}
for(let t=2;t<n;t++)if(d[t]<th){while(t+1<n&&d[t+1]<d[t])t++;return sr/t}return -1}
export function analyze(buf,sr,sens=.5){const{mag,rms}=spectrum(buf);if(rms<.0015)return{rms,notes:[]};
let notes=poly(mag,sr,10**(-2.2-1.6*sens));
if(!notes.length&&rms>.01){const f=yin(buf.subarray(0,4096),sr);if(f>60&&f<2200)notes=[Math.round(69+12*Math.log2(f/440))]}
return{rms,notes}}
