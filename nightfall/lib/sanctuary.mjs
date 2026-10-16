/** Permanent shrine offerings, shared by camp UI, saves and multiplayer inputs. */
export const SANCTUARY_Y=-800;
export const SHRINES={
 foundation:{id:'foundation',name:'始火巨像',title:'长夜中的第一束火',x:640,y:-400,radius:145,sprite:0,color:'#d9c58e',max:null,base:35,step:15,description:'默认开放。每次供奉都将火种留在灵魂深处，可持续升级。',detail:'每级生命上限 +3，基础伤害 +1%'},
 might:{id:'might',name:'破晓剑像',title:'刃锋终将穿透长夜',x:330,y:-405,radius:105,sprite:1,color:'#d6a289',max:10,base:45,step:20,description:'供奉持剑的守望者，让每一件武器都更有力量。',detail:'每级基础伤害 +3%'},
 vigor:{id:'vigor',name:'长青守像',title:'归来之人，生生不息',x:950,y:-405,radius:105,sprite:2,color:'#a5c4a1',max:10,base:40,step:18,description:'供奉怀抱生命之叶的守望者，提高出发时的生命上限。',detail:'每级生命上限 +8'},
 stride:{id:'stride',name:'风行旅像',title:'追上未熄的星光',x:355,y:-155,radius:105,sprite:3,color:'#a8c8dc',max:10,base:50,step:20,description:'供奉披羽的旅人，使步伐更轻盈，便于在敌群中穿行。',detail:'每级移动速度 +2%'},
 cadence:{id:'cadence',name:'星辉祈像',title:'让星辰回应每一次呼吸',x:925,y:-155,radius:105,sprite:4,color:'#c4afd7',max:10,base:55,step:22,description:'供奉捧星的祈愿者，加快所有武器的攻击节奏。',detail:'每级攻击速度 +3%'},
};
/** Unlock once; later offerings retain their existing permanent stat gains. */
export const SHRINE_POWERS={
 foundation:{name:'始火重燃',detail:'每局抵挡一次致命伤，恢复 25% 生命，并获得 1.5 秒庇护。',glyph:'✦'},
 might:{name:'破晓剑气',detail:'命中敌人后释放贯穿剑气，造成 2 倍基础伤害，冷却 6 秒。',statKey:'blessing_might',iconWeapon:'spear',glyph:'✧'},
 vigor:{name:'长青藤环',detail:'受伤后唤出藤环，减速附近敌人；3 秒恢复 12% 生命，冷却 12 秒。',glyph:'❧'},
 stride:{name:'风行闪避',detail:'空格或闪避按钮：向移动方向突进并短暂无敌，冷却 2.4 秒。',glyph:'➶'},
 cadence:{name:'星辉齐奏',detail:'有敌人时，每 8 秒召来 3 颗索敌星弹，自动追击敌人。',statKey:'blessing_cadence',iconWeapon:'storm',glyph:'✶'},
};
const rank=(value,min,max)=>{const n=Number(value);return Math.max(min,Math.min(max,Number.isFinite(n)?Math.floor(n):min));};
export function normalizeShrines(value){return Object.fromEntries(Object.entries(SHRINES).map(([key,def])=>[key,rank(value?.[key],key==='foundation'?1:0,def.max??100000)]));}
export function shrineCost(levels,key){const def=SHRINES[key];if(!def)return null;const level=normalizeShrines(levels)[key];return def.max!==null&&level>=def.max?null:def.base+level*def.step;}
export function offerToShrine(profile,key){
 const levels=normalizeShrines(profile?.shrines),cost=shrineCost(levels,key),embers=Number(profile?.embers);
 if(cost===null||!Number.isFinite(embers)||embers<cost)return null;
 return{...profile,embers:embers-cost,shrines:{...levels,[key]:levels[key]+1}};
}
export function shrineBonuses(levels){const l=normalizeShrines(levels);return{health:l.foundation*3+l.vigor*8,damage:l.foundation*.01+l.might*.03,speed:l.stride*.02,rate:l.cadence*.03};}
export function shrineBenefit(levels,key){const l=normalizeShrines(levels),n=l[key]||0;return key==='foundation'?`生命 +${n*3} · 伤害 +${n}%`:key==='might'?`伤害 +${n*3}%`:key==='vigor'?`生命 +${n*8}`:key==='stride'?`移速 +${n*2}%`:`攻速 +${n*3}%`;}
export function shrineNear(camp){return Object.values(SHRINES).find(s=>Math.hypot(camp.x-s.x,camp.y-s.y)<s.radius)?.id||null;}
export function navigateSanctuary(camp,returning=false){
 const side=camp.x<640?220:1060;
 const points=returning?[{x:side,y:camp.y},{x:side,y:-35},{x:820,y:105},{x:820,y:530},{x:640,y:608}]:camp.y< -400?[{x:820,y:camp.y},{x:820,y:-220},{x:640,y:-250}]:camp.y<100?[{x:640,y:-250}]:[{x:820,y:Math.max(480,camp.y)},{x:820,y:105},{x:640,y:-45},{x:640,y:-250}];
 camp.route=points;camp.target=camp.route.shift();
}
