import {SHRINE_POWERS} from './sanctuary.mjs';
const blessings=Object.fromEntries(Object.values(SHRINE_POWERS).filter(p=>p.statKey).map(p=>[p.statKey,p]));
import {UPGRADES,ARTIFACTS} from './equipment.mjs';
export function statKey(p,weapon){return p.evolutions?.[weapon]||weapon;}
export function trackWeapon(p,key,time){p.stats||={};return p.stats[key]||=( {damage:0,kills:0,startedAt:time} );}
export function recordDamage(p,key,amount,killed,time){const stat=trackWeapon(p,key,time);stat.damage+=amount;if(killed)stat.kills++;}
export function weaponRanking(p,time,sort='damage'){
 const rows=Object.entries(p?.stats||{}).map(([key,s])=>({key,...s,name:(ARTIFACTS[key]||UPGRADES[key]||blessings[key])?.name||key,dps:s.damage/Math.max(1,(s.endedAt??time)-s.startedAt)}));
 return rows.sort((a,b)=>(sort==='kills'?b.kills-a.kills:b.damage-a.damage)||b.damage-a.damage||a.key.localeCompare(b.key));
}
