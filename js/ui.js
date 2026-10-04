import {Mic} from './mic.js';import {Game,parsePitch} from './game.js';import {noteName} from './pitch.js';import * as S from './storage.js';
const $=s=>document.querySelector(s),mic=new Mic(),cfg=S.settings(),BLK=[1,3,6,8,10];
let game,lesson,geom,held=new Set(),det=new Set(),screen='home',last=0,test=0,keys={};
mic.sens=cfg.sens;$('#sens').value=cfg.sens;$('#oct').value=cfg.octave;
$('#sens').oninput=e=>{cfg.sens=mic.sens=+e.target.value;S.setSettings(cfg)};
$('#oct').onchange=e=>{cfg.octave=e.target.value;S.setSettings(cfg)};
const go=id=>{screen=id;document.querySelectorAll('main>section').forEach(s=>s.hidden=s.id!==id)};
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('#back').onclick=()=>{go('home');home()};
async function ensureMic(){if(mic.on)return true;try{await mic.start();$('#micBtn').textContent='Microphone on';return true}catch(e){$('#testOut').textContent='Microphone unavailable ('+e.message+'). Use the on-screen keys.';return false}}
$('#micBtn').onclick=ensureMic;
$('#testC').onclick=async()=>{if(await ensureMic()){test=performance.now()+8000;$('#testOut').textContent='Play middle C now…'}};
function buildKb(lo,hi){const kb=$('#kb');kb.innerHTML='';keys={};const wh=[],ix={};
 for(let m=lo;m<=hi;m++)if(!BLK.includes(m%12)){ix[m]=wh.length;wh.push(m)}const n=wh.length;
 geom=m=>{const w=$('#lane').clientWidth/n;return BLK.includes(m%12)?{x:(ix[m-1]+.7)*w,w:w*.6}:{x:ix[m]*w,w}};
 for(let m=lo;m<=hi;m++){const b=BLK.includes(m%12),e=document.createElement('div');e.className='key '+(b?'black':'white');
  e.style.left=(b?ix[m-1]+.7:ix[m])*100/n+'%';e.style.width=(b?.6:1)*100/n+'%';if(m%12===0)e.textContent=noteName(m);
  e.onpointerdown=ev=>{ev.preventDefault();held.add(m)};for(const t of['pointerup','pointercancel','pointerleave'])e['on'+t]=()=>held.delete(m);
  kb.append(e);keys[m]=e}}
function start(l){lesson=l;go('play');$('#ttl').textContent=l.title;
 const ms=l.notes.map(n=>parsePitch(n.pitch)),a=Math.min(...ms),z=Math.max(...ms),lo=a-a%12;buildKb(lo,Math.max(z-z%12+11,lo+11));
 game=new Game($('#lane'),m=>geom(m),{step:onStep,miss:onMiss,done:onDone});game.load(l);onStep(game.steps[0])}
const clear=()=>Object.values(keys).forEach(e=>{e.classList.remove('hint');delete e.dataset.f});
function onStep(s){clear();const t=(lesson.tips||[]).filter(t=>t.beat<=s.beat).pop();$('#tipbar').textContent=t?t.text:''}
function onMiss(s){clear();for(const n of s.notes){keys[n.midi]?.classList.add('hint');if(keys[n.midi])keys[n.midi].dataset.f=(n.hand||'')+(n.finger||'')}
 $('#tipbar').textContent='Play '+s.notes.map(n=>noteName(n.midi)+(n.finger?` (finger ${n.finger}, ${n.hand==='L'?'left':'right'} hand)`:'')).join(' + ')}
function onDone(r){clear();S.saveResult(lesson.id,r);$('#tipbar').textContent=`Done! ${'★'.repeat(r.stars)} ${Math.round(r.acc*100)}% accuracy, best streak ${r.streak}`}
function loop(now){requestAnimationFrame(loop);
 if(now-last>=60&&mic.on&&screen!=='home'){last=now;const r=mic.read();det=new Set(r.notes);
  if(screen==='cal'){$('#lvl').style.width=Math.min(100,Math.sqrt(r.rms)*300)+'%';$('#det').textContent=r.notes.map(noteName).join(' ')||'–';
   if(test){const ok=cfg.octave==='exact'?det.has(60):[...det].some(m=>m%12===0);
    if(ok){test=0;$('#testOut').textContent='Heard C. You are set.'}else if(now>test){test=0;$('#testOut').textContent='No middle C heard. Raise sensitivity or move the iPad closer.'}}}}
 if(screen==='play'&&game){game.feed(new Set([...det,...held]),cfg.octave==='exact');game.draw(now);
  for(const m in keys)keys[m].classList.toggle('on',det.has(+m)||held.has(+m));$('#stat').textContent=`${Math.round(game.acc*100)}%  streak ${game.streak}`}}
async function home(){const ids=await(await fetch('lessons/index.json')).json(),p=S.progress(),h=$('#home');h.innerHTML='<h2>Beginner lessons</h2>';let open=true;
 for(const id of ids){const l=await(await fetch(`lessons/${id}.json`)).json(),st=p[l.id]?.stars||0,b=document.createElement('button');
  b.className='card';b.disabled=!open;b.innerHTML=`<span>${l.title}</span><span>${'★'.repeat(st)}${'☆'.repeat(3-st)}</span>`;b.onclick=()=>{ensureMic();start(l)};h.append(b);open=st>0}}
navigator.serviceWorker?.register('sw.js');home();requestAnimationFrame(loop);
