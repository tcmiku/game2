import {ARENA_W,ARENA_H} from './frontier.mjs';
/** Reward and cooperative life-cycle rules, calculated only by the host. */
import {ENEMY_TYPES} from './bestiary.mjs';
import {WEAPONS,canUpgrade,recipeParts,ARTIFACTS,forgeState} from './equipment.mjs';
export const REVIVE_RADIUS=76,REVIVE_SECONDS=3;
export function enemyExperience(e){
 const base=e.type===4?100:e.type===5?8:e.type===2?3:ENEMY_TYPES[e.type]?.xp||1;
 return e.type===4?base:base*([1,6,12,20][Math.min(3,e.elite||0)]);
}
export function dropsChest(e,random=Math.random){
 if(e.type===4)return true;
 const tier=e.elite||(e.type===5?1:0);
 return tier>0&&e.type!==7&&random()<([0,.12,.18,.25][Math.min(3,tier)]);
}
export function chestWeapon(p,random=Math.random){
 const keys=WEAPONS.filter(key=>p.ranks?.[key]>0&&canUpgrade(p,key));
 return keys.length?keys[Math.min(keys.length-1,Math.floor(random()*keys.length))]:null;
}
export function readyWeapons(p){return [...new Set(Object.keys(ARTIFACTS).filter(key=>forgeState(p,key).ready).flatMap(key=>recipeParts(ARTIFACTS[key]).map(part=>part.key)).filter(key=>WEAPONS.includes(key)))];}
export const FAVORITES_KEY='nightfall-favorites-v1';
export const normalizeFavorites=value=>[...new Set((Array.isArray(value)?value:[]).filter(key=>ARTIFACTS[key]))];
export function wantedUpgrade(p,key,favorites){return normalizeFavorites(favorites).some(id=>{const r=ARTIFACTS[id],state=forgeState(p,id);return !state.blocked&&!state.complete&&recipeParts(r).some(part=>part.key===key&&(p.ranks?.[key]||0)<part.level);});}
export function noteDeaths(w){
 const s=w.s;
 for(const p of s.players){
  if(p.hp>0){p.down=false;p.ghost=false;continue;}
  p.hp=0;p.choices=[];p.familiars=[];if(!p.ghost)p.moving=false;
  if(!p.down){p.down=true;p.deaths=(p.deaths||0)+1;p.reviveProgress=0;p.ghost=!!s.coop;w.events.push('down');}
  for(const name of ['shots','zones','beams'])s[name]=s[name].filter(entity=>entity.owner!==p.id);
 }
}
export function stepGhosts(w,dt){
 const s=w.s;if(!s.coop)return;
 for(const p of s.players){
  if(p.hp>0||!p.ghost)continue;
  p.dead+=dt;if(Number.isFinite(p.inputAt))p.inputAge+=dt;const input=w.inputs[p.id]||{};let x=Number(input.x)||0,y=Number(input.y)||0;const length=Math.max(1,Math.hypot(x,y));
  p.x=Math.max(100,Math.min((s.width||ARENA_W)-100,p.x+x/length*p.speed*.85*dt));p.y=Math.max(100,Math.min((s.height||ARENA_H)-100,p.y+y/length*p.speed*.85*dt));p.moving=Math.hypot(x,y)>.1;if(x)p.face=x<0?-1:1;
  const helper=s.players.find(q=>q.hp>0&&q.connected!==false&&Math.hypot(q.x-p.x,q.y-p.y)<=REVIVE_RADIUS);
  p.reviver=helper?.id||'';p.reviveProgress=helper?Math.min(REVIVE_SECONDS,(p.reviveProgress||0)+dt):0;
  if(p.reviveProgress>=REVIVE_SECONDS-1e-6){p.hp=Math.ceil(p.maxHp*.5);p.hitCd=2;p.ghost=p.down=false;p.dead=0;p.reviveProgress=0;p.reviver='';p.revives=(p.revives||0)+1;w.effect(p.x,p.y,'forge',.9,110);w.events.push('revive');}
 }
}
/** Choice timeout uses real step durations even while combat time is held. */
export function holdForUpgrades(w,dt){
 const s=w.s,choosing=s.players.filter(p=>p.hp>0&&p.choices.length);
 s.upgradePaused=!s.reaperSpawned&&choosing.length>0;
 if(!s.upgradePaused)return false;
 for(const e of s.enemies)e.moving=false;
 if(s.coop)for(const p of choosing){p.choiceTime+=dt;if(p.choiceTime>=14-1e-6)w.upgrade(p.id,p.choices[0]);}
 return true;
}
