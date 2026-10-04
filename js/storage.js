const K='keys.v1',load=()=>{try{return JSON.parse(localStorage.getItem(K))||{}}catch{return{}}},save=d=>{try{localStorage.setItem(K,JSON.stringify(d))}catch{}};
export const settings=()=>({sens:.5,octave:'any',...load().settings});
export const setSettings=s=>save({...load(),settings:s});
export const progress=()=>load().progress||{};
export function saveResult(id,r){const d=load(),p=d.progress||{},o=p[id]||{};
p[id]={acc:Math.max(o.acc||0,r.acc),stars:Math.max(o.stars||0,r.stars),streak:Math.max(o.streak||0,r.streak)};save({...d,progress:p})}
