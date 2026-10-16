import {normalizeShrines,shrineBonuses,SHRINES,shrineNear} from './sanctuary.mjs';
import {normalizeAppearance} from './appearance.mjs';
/** Persistent camp progression and spatial interactions, independent of React. */
import {CAMP_ITEMS,UPGRADES,normalizeEffects,normalizeSmithWork,SMITH_WORK_MAX,SMITH_ITEMS} from './equipment.mjs';
export const PROFILE_KEY='nightfall-camp-v1';
export const BOONS={
 vitality:{name:'生命',detail:'生命上限 +10',max:5,base:100,step:10,unit:'',icon:'heart'},
 power:{name:'力量',detail:'基础伤害 +8%',max:5,base:18,step:1.44,unit:'',icon:'power'},
 speed:{name:'疾行',detail:'移动速度 +4%',max:5,base:195,step:7.8,unit:'',icon:'speed'},
 haste:{name:'迅捷',detail:'攻击速度 +5%',max:5,base:100,step:5,unit:'%',icon:'haste'},
};
const integer=(n,max)=>Math.max(0,Math.min(max,Math.floor(Number(n)||0)));
export function normalizeBoons(value={}){const boons=Object.fromEntries(Object.entries(BOONS).map(([key,def])=>[key,integer(value?.[key],def.max)]));return {...boons,...(value?.sanctuary?{sanctuary:normalizeShrines(value.sanctuary)}:{}),...(value?.smithwork?{smithwork:normalizeSmithWork(value.smithwork)}:{})};}
export function expeditionBoons(profile){return{...normalizeBoons(profile.boons),sanctuary:normalizeShrines(profile.shrines),smithwork:normalizeSmithWork(profile.smithwork,profile.effects)};}
export function newProfile(){return{version:1,appearance:normalizeAppearance(),embers:60,boons:normalizeBoons(),shrines:normalizeShrines(),residents:['keeper','herbalist'],unlocks:[],effects:[],smithwork:normalizeSmithWork(),settled:[],runs:0};}
export function normalizeProfile(value){
 const fallback=newProfile();if(!value||typeof value!=='object')return fallback;
 return{version:1,appearance:normalizeAppearance(value.appearance),embers:value.embers===undefined?fallback.embers:integer(value.embers,1e7),boons:normalizeBoons(value.boons),shrines:normalizeShrines(value.shrines),residents:['keeper','herbalist',...new Set((Array.isArray(value.residents)?value.residents:[]).filter(k=>k!=='herbalist'&&CAMP_SITES.some(s=>s.resident===k)))],unlocks:[...new Set((Array.isArray(value.unlocks)?value.unlocks:[]).filter(k=>CAMP_SITES.some(s=>s.id===k)))],effects:normalizeEffects(value.effects),smithwork:normalizeSmithWork(value.smithwork,normalizeEffects(value.effects)),settled:(Array.isArray(value.settled)?value.settled:[]).filter(k=>typeof k==='string').slice(-30),runs:integer(value.runs,1e7)};
}
export function rescueSmith(profile){const p=normalizeProfile(profile);if(p.residents.includes('smith'))return p;return{...p,embers:p.embers+20,residents:[...p.residents,'smith'],unlocks:[...new Set([...p.unlocks,'forge'])]};}
export function smithOnDeath(profile,player){return !profile.residents.includes('smith')&&(player?.deaths>0||player?.hp<=0)?rescueSmith(profile):profile;}
export function unlockEffect(profile,key){const p=normalizeProfile(profile),def=UPGRADES[key];if(!def?.unlock||!p.residents.includes(def.unlock)||!CAMP_ITEMS.includes(key)||p.effects.includes(key)||p.embers<def.cost)return null;return{...p,embers:p.embers-def.cost,effects:[...p.effects,key]};}
export function smithWorkCost(profile,key){if(!SMITH_ITEMS.includes(key)||!profile.residents?.includes('smith')||!profile.effects?.includes(key))return null;const rank=normalizeSmithWork(profile.smithwork)[key];return rank>=SMITH_WORK_MAX?null:UPGRADES[key].cost+rank*45;}
export function strengthenEffect(profile,key){const p=normalizeProfile(profile),cost=smithWorkCost(p,key);if(cost===null||p.embers<cost)return null;return{...p,embers:p.embers-cost,smithwork:{...p.smithwork,[key]:p.smithwork[key]+1}};}
export function recruitScholar(profile,run){if(profile.residents.includes('scholar')||!(run?.bossKills>0))return profile;const p=normalizeProfile(profile);return{...p,residents:[...p.residents,'scholar'],unlocks:[...new Set([...p.unlocks,'archive'])]};}
export function boonCost(profile,key){const def=BOONS[key];return !def||profile.boons[key]>=def.max?null:20+profile.boons[key]*15;}
export function strengthen(profile,key){
 const p=normalizeProfile(profile),cost=boonCost(p,key);if(cost===null||p.embers<cost)return null;
 return{...p,embers:p.embers-cost,boons:{...p.boons,[key]:p.boons[key]+1}};
}
export function baseStats(value){const b=normalizeBoons(value),s=b.sanctuary?shrineBonuses(b.sanctuary):{health:0,damage:0,speed:0,rate:0};return{maxHp:100+b.vitality*10+s.health,damage:18*(1+b.power*.08+s.damage),speed:195*(1+b.speed*.04+s.speed),rate:1+b.haste*.05+s.rate};}
export function settleRun(profile,runId,run,player){
 const p=normalizeProfile(profile);if(!runId||p.settled.includes(runId))return{profile:p,reward:0,duplicate:true};
 const reward=Math.min(120,Math.floor(integer(player?.kills,1e6)/50)+Math.floor(integer(run?.time,3600)/60)*2+integer(run?.bossKills,20)*3+(run?.status==='victory'?15:0));
 return{profile:{...p,embers:p.embers+reward,runs:p.runs+1,settled:[...p.settled,runId].slice(-30)},reward,duplicate:false};
}
export const CAMP_W=1280,CAMP_H=840;
export const KEEPER={id:'keeper',name:'守火人 · 伊蕾',x:380,y:492,radius:85};
export const PORTAL={id:'portal',name:'长夜之门',x:640,y:372,radius:135};
export const TENT={id:'tent',name:'旅人帐篷',x:224,y:412,radius:95};
export const CAMP_SITES=[
 {id:'forge',name:'旧铁砧',resident:'smith',x:970,y:500,radius:80},
 {id:'garden',name:'月光花圃',resident:'herbalist',x:352,y:262,radius:70},
 {id:'archive',name:'残卷石台',resident:'scholar',x:942,y:260,radius:70},
];
export const CAMP_NPCS=[
 {...CAMP_SITES[1],kind:'herbalist',name:'药师 · 莱娅',short:'莱娅',action:'调药',title:'草木回春',quote:'草木会记得每一个归来的人。',lines:['带上这些药草。长夜里，别忘了照看自己。','伤口会愈合。你只管朝有光的地方走。']},
 {...CAMP_SITES[2],kind:'scholar',name:'学者 · 索伦',short:'索伦',action:'研习',title:'星识研习',quote:'每一场长夜，都有值得记下的光。',lines:['枯枝间的咒缚已经松动。多谢你，旅人。','把见闻带回来吧。我会替你把它们编成新的篇章。']},
];
export const SMITH={...CAMP_SITES[0],name:'铁匠 · 奥伦'};
export function createCamp(){return{x:640,y:608,face:1,moving:false,time:0,target:null,route:[]};}
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
export function stepCamp(camp,input,dt,blocked=false){
 camp.time+=dt;if(blocked){camp.moving=false;return;}
 let x=Number(input?.x)||0,y=Number(input?.y)||0;
 if(Math.hypot(x,y)>.05){camp.target=null;camp.route=[];}
 else if(camp.target){x=camp.target.x-camp.x;y=camp.target.y-camp.y;const d=Math.hypot(x,y);if(d<8){camp.target=camp.route?.shift()||null;x=y=0;}}
 const len=Math.hypot(x,y),step=Math.min(220*dt,camp.target?len:220*dt);camp.moving=len>.05;
 if(camp.moving){camp.x=clamp(camp.x+x/len*step,160,CAMP_W-160);camp.y=clamp(camp.y+y/len*step,-680,CAMP_H-125);if(x)camp.face=x<0?-1:1;}
 // Keep movement outside the solid arch and the keeper's personal space.
 for(const obstacle of [{x:640,y:310,r:65},{x:380,y:492,r:24},...Object.values(SHRINES).map(s=>({x:s.x,y:s.y,r:s.id==='foundation'?59:29}))]){const dx=camp.x-obstacle.x,dy=camp.y-obstacle.y,d=Math.hypot(dx,dy);if(d<obstacle.r&&d>0){camp.x=obstacle.x+dx/d*obstacle.r;camp.y=obstacle.y+dy/d*obstacle.r;}}
}
export function campNear(camp,entity){return Math.hypot(camp.x-entity.x,camp.y-entity.y)<entity.radius;}
export function campInteraction(camp){const shrine=shrineNear(camp);if(shrine)return'shrine:'+shrine;if(campNear(camp,KEEPER))return'keeper';if(campNear(camp,TENT))return'tent';if(campNear(camp,PORTAL))return'portal';return CAMP_SITES.find(site=>campNear(camp,site))?.id||null;}
/** Automatic return waits for the expedition to end; the pause menu can leave explicitly. */
export function mayReturn(run,player){return !!run&&(run.status==='over'||run.status==='victory'||player?.hp<=0&&!run.players?.some(p=>p.hp>0));}
