import {addWeaponGuard,attackContact} from '../lib/counterfire.mjs';
const players=Array.from({length:4},(_,i)=>({id:`p${i}`,hp:100})),w={s:{players,enemies:[]},guards:[]};
for(let i=0;i<180;i++)addWeaponGuard(w,players[i%4],'blade',{kind:'line',x:200+i%20*140,y:200+Math.floor(i/20)*140,tx:215+i%20*140,ty:200+Math.floor(i/20)*140,radius:12});
const bullets=Array.from({length:160},(_,i)=>({x:100+i%20*160,y:100+Math.floor(i/20)*160,radius:7,sourceType:6}));
const times=[];let contacts=0;
for(let i=0;i<120;i++){
 const start=performance.now();for(const b of bullets)if(attackContact(w,b,b.x,b.y,b.x+9,b.y))contacts++;
 if(i>=20)times.push(performance.now()-start);
}
times.sort((a,b)=>a-b);console.log(`180 attack shapes × 160 hostile bullets: median ${times[50].toFixed(3)}ms, p95 ${times[95].toFixed(3)}ms; ${contacts} contacts`);
