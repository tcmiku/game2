import {duskDamageMultiplier} from './dusk-foes.mjs';
import {bossVisual,bossCamera} from './boss-presentation.mjs';
import {syncTeamExperience,checkTeamLevel,awardTeamExperience} from './team-experience.mjs';
import {drawExpandedBody} from './expanded-foes.mjs';
import {partyDifficulty,bossActive} from './difficulty.mjs';
import {bossKind,drawBossBody} from './bosses.mjs';
import {addWeaponGuard} from './counterfire.mjs';
import {updateDraft,claimDraft} from './shared-draft.mjs';
import {ARENA_W as W,ARENA_H as H,createDestructibles,collideDestructibles,damageDestructible,stepMirrorShield,drawMirrorShield,drawExperience,drawDestructible,drawFrontierEffect} from "./frontier.mjs";
export {W,H};
export const DURATION=1800;
import {createRunId} from './run-id.mjs';
import {ChipMusic} from './music.mjs';
import { actorPose, AnimationClock, ACTOR_CELL } from './animation.mjs';
import { HitFeedback } from './feedback.mjs';
import { WeaponVFX } from './weapon-vfx.mjs';
import { UPGRADES, ARTIFACTS, forgeState, canUpgrade, rollChoices, orbitBlades, ownsWeapon, WEAPONS, normalizeEffects, normalizeSmithWork, weaponScale, weaponDuration, weaponCooldown } from './equipment.mjs';
import { stepArsenal, stepSpecialShot, stepWeaponEntities, drawWeaponFields, drawFamiliars } from './weapons.mjs';
import {onNewShotHit} from './arsenal-extra.mjs';
import {enemyExperience,dropsChest,chestWeapon,noteDeaths,stepGhosts,holdForUpgrades} from './run-rules.mjs';
import { baseStats } from './camp.mjs';
import {DEATH_TIME,ELITE_TIERS,rollElite,hurtPlayer,stepEnemyAttack,enemyMotion,stepHostiles,drawHostiles} from './encounters.mjs';
import {ENEMY_TYPES,pickEnemyType,bestiaryDeath,stepBestiaryStrafe} from './bestiary.mjs';
import {statKey,trackWeapon,recordDamage} from './combat-stats.mjs';
import {playerStyle,playerLabel,placePlayerLabels,recolorCloth} from './player-style.mjs';
export { UPGRADES } from './equipment.mjs';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
let uid=1;
export function makePlayer(id, name='旅人', index=0, weapon='blade', boons={}, effects=[]) { if(!WEAPONS.includes(weapon))weapon='blade';return { id, name, x: 1200 + index*65, y:800, hp:baseStats(boons).maxHp,maxHp:baseStats(boons).maxHp,level:1,xp:0,nextXp:6,kills:0,damage:baseStats(boons).damage,speed:baseStats(boons).speed,rate:baseStats(boons).rate,count:weapon==='blade'?1:0,orbit:weapon==='orbit'?1:0,nova:weapon==='nova'?1:0,magnet:90, cooldown:0,novaCd:2,hitCd:0,dead:0,face:1,choices:[],choiceTime:0, ranks:{[weapon]:1}, effects:normalizeEffects(effects),smithwork:normalizeSmithWork(boons?.smithwork,normalizeEffects(effects)),stats:{[weapon]:{damage:0,kills:0,startedAt:0}}, evolutions:{}, fused:{}, cooldowns:{}, familiars:[], relics:0, storm:weapon==='storm'?1:0, stormCd:1, pulseCd:2, index }; }
export class World {
 constructor(players=[{id:'solo',name:'旅人'}],random=Math.random,initialProps) { this.random=random; this.s={time:0,runId:createRunId(),frame:0,coop:players.length>1,upgradePaused:false,status:'playing',players:players.map((p,i)=>makePlayer(p.id,p.name,p.index??i,p.weapon,p.boons,p.effects)),enemies:[],shots:[],gems:[],effects:[],zones:[],beams:[],impacts:[],chests:[],kills:0,bossSpawned:false,bossDefeated:false,bossKills:0,nextBossAt:300,reaperSpawned:false,hostile:[],hazards:[],props:initialProps??createDestructibles(random),width:W,height:H};this.inputs={};this.spawnCd=.2;this.eliteAt=60;this.lastSeq={};this.events=[];syncTeamExperience(this.s); }
 checkpoint(){return {...this.s,engine:{spawnCd:this.spawnCd,eliteAt:this.eliteAt,lastSeq:{...this.lastSeq},nextId:uid}};}
 static restore(state,random=Math.random){
  if(!state||!Array.isArray(state.players)||!state.players.length||!Number.isFinite(state.time))throw new Error('对局快照不可恢复');
  const copy=JSON.parse(JSON.stringify(state)),engine=copy.engine||{};delete copy.engine;for(const key of Object.keys(copy))if(key.startsWith('_'))delete copy[key];delete copy.ack;
  const w=new World(copy.players,random,copy.props);w.s={...w.s,...copy};w.spawnCd=Number.isFinite(engine.spawnCd)?engine.spawnCd:.2;w.eliteAt=Number.isFinite(engine.eliteAt)?engine.eliteAt:Math.max(60,Math.floor(copy.time/45+1)*45);w.lastSeq=engine.lastSeq||{};syncTeamExperience(w.s,{legacy:!copy.teamXp});
  let largest=Number(engine.nextId)||0;for(const list of Object.values(copy))if(Array.isArray(list))for(const entity of list){if(typeof entity?.id==='number')largest=Math.max(largest,entity.id+1);for(const child of entity?.familiars||[])if(typeof child.id==='number')largest=Math.max(largest,child.id+1);}uid=Math.max(uid,largest);return w;
 }
 reconcileMembers(members){const byId=new Map(members.map(m=>[m.id,m]));this.s.players=this.s.players.filter(p=>byId.has(p.id));for(const p of this.s.players){const m=byId.get(p.id);p.connected=m.connected!==false;if(p.connected)this.input(p.id,m.input);else this.inputs[p.id]={...this.inputs[p.id],x:0,y:0,choice:''};}syncTeamExperience(this.s);}
 targets(){if(this.targetFrame!==this.s.frame||this.targetEnemies!==this.s.enemies){this.targetFrame=this.s.frame;this.targetEnemies=this.s.enemies;this.targetList=[...this.s.enemies,...(this.s.props||[]).filter(p=>p.hp>0)];}return this.targetList;}
 guard(p,weapon,shape){addWeaponGuard(this,p,weapon,shape);}
 nextId(){return uid++;}
 castPose(p,key,target){if(Number.isFinite(p.attackAt)&&this.s.time-p.attackAt<.32)return;p.attackAt=this.s.time;p.attackKind=key;p.attackAngle=target?Math.atan2(target.y-p.y,target.x-p.x):p.face===-1?Math.PI:0;}

 input(id, input) {const previous=this.inputs[id];if(previous&&((input?.serial??0)<(previous.serial??0)||(input?.serial??0)===(previous.serial??0)&&Number.isFinite(input?.moveAt)&&Number.isFinite(previous.moveAt)&&input.moveAt<previous.moveAt))return;this.inputs[id]=input;const p=this.s.players.find(p=>p.id===id);if(p&&Number.isFinite(input?.moveAt)&&p.inputAt!==input.moveAt){p.inputAt=input.moveAt;p.inputAge=0;}if(input?.choice && Number.isFinite(input.seq)&&input.seq>(this.lastSeq[id]??-1)) {this.lastSeq[id]=input.seq;this.upgrade(id,input.choice,input.draftId);}}
 craft(id,key) {
  const p=this.s.players.find(p=>p.id===id);
  if(this.s.status!=='playing'||!p||p.hp<=0||p.choices.length||!forgeState(p,key).ready)return false;
  const recipe=ARTIFACTS[key];for(const part of recipe.weapons||[{key:recipe.weapon}]){const old=p.stats?.[statKey(p,part.key)];if(old)old.endedAt=this.s.time;}p.evolutions[recipe.weapon]=key;trackWeapon(p,key,this.s.time);p.relics--;
  if(recipe.weapons){for(const part of recipe.weapons)if(part.key!==recipe.weapon)p.fused[part.key]=key;}
  const sources=recipe.weapons?.map(part=>part.key)||[recipe.weapon];this.s.shots=this.s.shots.filter(b=>b.owner!==id||!sources.includes(b.weapon));this.s.zones=this.s.zones.filter(b=>b.owner!==id||!sources.includes(b.weapon));this.s.beams=this.s.beams.filter(b=>b.owner!==id||!sources.includes(b.weapon));for(const source of sources)p.cooldowns[source]=0;if(sources.includes('familiar'))p.familiars=[];
  p.lastForge={key,at:this.s.time};if(sources.includes('blade'))p.cooldown=0;if(sources.includes('nova'))p.novaCd=0;if(sources.includes('storm'))p.stormCd=0;if(sources.includes('orbit'))p.pulseCd=0;
  this.effect(p.x,p.y,'forge',1.2,190);this.events.push('forge');return true;
 }
 upgrade(id,key,draftId) {
  if(ARTIFACTS[key])return this.craft(id,key);
  const p=this.s.players.find(p=>p.id===id);
  if(!p||p.hp<=0||this.s.status!=='playing'||!p.choices.includes(key))return false;
  if(key!=='mend'&&!canUpgrade(p,key))return false;
  if(!claimDraft(this,p,key,draftId))return false;
  if(key==='mend'){p.hp=Math.min(p.maxHp,p.hp+30*(1+(p.ranks.preservation||0)*.3));p.choices=[];this.events.push('heal');if(this.s.draft)updateDraft(this);else this.checkLevel(p);return true;}
  if(!canUpgrade(p,key))return false;
  this.applyUpgrade(p,key);
  p.choices=[];this.events.push('upgrade');if(this.s.draft)updateDraft(this);else this.checkLevel(p);return true;
 }
 applyUpgrade(p,key){
  p.ranks[key]=(p.ranks[key]||0)+1;if(UPGRADES[key].kind==='weapon')trackWeapon(p,key,this.s.time);
  if(key==='blade')p.count++;if(key==='orbit')p.orbit++;if(key==='nova')p.nova++;if(key==='storm')p.storm++;
  if(key==='power')p.damage*=1.25;if(key==='haste')p.rate*=1.2;
  if(key==='vitality'){p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+40);}
  if(key==='speed')p.speed*=1.15;if(key==='magnet')p.magnet*=1.5;
 }
 checkLevel(p){
  if(this.s.coop){checkTeamLevel(this);return;}
  if(!this.s.reaperSpawned&&p.xp>=p.nextXp&&!p.choices.length){p.xp-=p.nextXp;p.level++;p.nextXp=Math.floor(p.nextXp*1.24+3);p.choices=rollChoices(p,this.random);p.choiceTime=0;this.events.push('level');}
 }
 xp(p,value){if(this.s.coop){awardTeamExperience(this,p,value);return;}if(p.hp<=0)return;p.xp+=value*(1+(p.ranks.wisdom||0)*.15);this.checkLevel(p);}
 lightning(p,origin=p,customLimit=0,mult=1,weapon='storm'){
  const evolved=p.evolutions.storm==='tempest',limit=customLimit||(evolved?8:1+p.storm+(p.ranks.volley||0));
  const hit=new Set();let from={x:origin.x,y:origin.y-25};
  for(let i=0;i<limit;i++){
   let target=null,near=i===0?530:230;
   for(const e of this.targets()){const d=dist(from,e);if(e.hp>0&&!hit.has(e.id)&&d<near){near=d;target=e;}}
   if(!target)break;hit.add(target.id);
   const effect={id:uid++,x:from.x,y:from.y,tx:target.x,ty:target.y,type:evolved?'tempest':'lightning',life:.3,max:.3,size:1};this.s.effects.push(effect);
   this.guard(p,weapon,{kind:'line',x:from.x,y:from.y,tx:target.x,ty:target.y,radius:10*weaponScale(p)});
   this.damage(target,p.damage*(evolved?2.4:1+.2*p.storm)*mult,p,from,weapon);
   if(evolved){this.guard(p,weapon,{x:target.x,y:target.y,radius:65*weaponScale(p)});this.effect(target.x,target.y,'thunder',.4,65*weaponScale(p));for(const e of this.targets())if(e!==target&&dist(e,target)<65*weaponScale(p))this.damage(e,p.damage*.8,p,p,weapon);}
   from=target;
  }
 }
 spawn(type,eliteTier) {
  const s=this.s;if(s.enemies.length>=220&&type!==4&&type!==7)return;const def=ENEMY_TYPES[type],live=s.players.filter(p=>p.hp>0&&p.connected!==false),target=live[Math.floor(this.random()*live.length)];if(!target)return;
  const a=this.random()*Math.PI*2,radius=type===7?400:type===4?440:550+this.random()*160;
  const x=clamp(target.x+Math.cos(a)*radius,90,W-90),y=clamp(target.y+Math.sin(a)*radius,90,H-90),stage=1+s.time/220;
  const difficulty=partyDifficulty(s),boss=type===4,reaper=type===7,cycle=Math.max(1,Math.floor(s.time/300));
  const elite=boss||reaper?0:eliteTier??(type===5?Math.min(3,1+Math.floor(s.time/600)):rollElite(s.time,this.random));
  const hp=(reaper?1e9*s.players.length:boss?12000*difficulty.bossHealth*Math.pow(1.9,cycle-1):type===5?210*stage:((type===2?40:type===3?14:type===6?32:def?.hp||24)*stage))*(ELITE_TIERS[elite]?.health||1)*(boss||reaper?1:difficulty.health);
  const enemy={id:uid++,x,y,type,elite,cycle,...(boss?{bossKind:bossKind(cycle),encounterPlayers:difficulty.count,skillCd:3.6}:{}),damageScale:difficulty.damage,hp,maxHp:hp,speed:reaper?780:boss?65:type===5?75:type===6?75:type===3?135:type===2?62:def?.speed||Math.min(125,46+s.time*.045),size:reaper?bossVisual({type:7}).radius:boss?bossVisual({type:4,bossKind:bossKind(cycle)}).radius:type===5?32:type===3?17:def?.size||20,hit:0,slow:0,orbitCd:0,phase:this.random()*6.28};s.enemies.push(enemy);return enemy;
 }
 damage(e,n,p,source=p,weapon='blade'){
  if(p.connected===false||p.hp<=0||e.hp<=0||!Number.isFinite(n)||n<=0)return;
  if(e.prop){damageDestructible(this,e,n);return;}
  n*=duskDamageMultiplier(e,source,this.s.time);
  if(e.type===4&&e.barrier>0)n*=.55;const dealt=Math.min(e.hp,n);e.hp-=n;e.hit=.16;recordDamage(p,statKey(p,weapon),dealt,e.hp<=0,this.s.time);
  let dx=e.x-source.x,dy=e.y-source.y;const distance=Math.hypot(dx,dy);
  if(distance>.01){dx/=distance;dy/=distance;}else{dx=p.face||1;dy=0;}
  const mass=e.type===7?0:e.type===4?.12:e.type===12?.23:e.type===16?.35:e.type===18?.42:(e.type===5||e.elite)?.42:1;
  const strength=clamp(n/Math.max(1,p.damage),.8,1.8),force=(e.hp<=0?230:180)*mass;
  e.knockX=(e.knockX||0)+dx*force;e.knockY=(e.knockY||0)+dy*force;
  const speed=Math.hypot(e.knockX,e.knockY),cap=320*mass;if(speed>cap){e.knockX=e.knockX/speed*cap;e.knockY=e.knockY/speed*cap;}
  e.stagger=e.type===7?0:e.type===4?.015:e.type===5?.035:.075;
  this.s.impacts.push({id:uid++,target:e.id,owner:p.id,weapon:statKey(p,weapon),x:e.x,y:e.y,dx,dy,amount:Math.round(n),strength,killed:e.hp<=0,type:e.type,at:this.s.time});
  if(this.s.impacts.length>96)this.s.impacts.splice(0,this.s.impacts.length-96);
  if(e.hp<=0){bestiaryDeath(this,e);this.s.kills++;p.kills++;if(dropsChest(e,this.random))this.s.chests.push({id:uid++,x:e.x,y:e.y,value:1});this.s.gems.push({id:uid++,x:e.x,y:e.y,v:enemyExperience(e),type:!e.elite&&e.type!==4&&e.type!==5&&this.random()<.035?'heart':'gem'});this.effect(e.x,e.y,'death',.35,e.type===4?110:35);if(e.type===4){if(this.s.bossWarning?.cycle===e.cycle)this.s.bossWarning=null;this.s.bossDefeated=true;this.s.bossKills++;this.s.lastBossKill=this.s.time;this.events.push('boss');}}
 }

 effect(x,y,type,life,size=40){this.s.effects.push({id:uid++,x,y,type,life,max:life,size});}
 step(dt) {const s=this.s;if(s.status!=='playing')return;dt=clamp(dt,0,.05);s.frame=(s.frame||0)+1;noteDeaths(this);if(!s.players.some(p=>p.hp>0)){s.status='over';s.upgradePaused=false;return;}if(s.coop)checkTeamLevel(this);if(holdForUpgrades(this,dt))return;stepGhosts(this,dt);this.guards=[];s.time+=dt;for(const object of s.props||[]){object.hit=Math.max(0,(object.hit||0)-dt);object.orbitCd=Math.max(0,(object.orbitCd||0)-dt);}
 s.difficulty=partyDifficulty(s);const focus=bossActive(s);
 if(s.time>=this.eliteAt&&s.time<DEATH_TIME){if(!focus)this.spawn(5);this.eliteAt+=45;}
 const warningAt=Math.min(s.nextBossAt,DEATH_TIME);if(!focus&&s.time>=warningAt-5&&s.time<warningAt)s.bossWarning={kind:warningAt===DEATH_TIME?'reaper':bossKind(Math.max(1,Math.floor(warningAt/300))),cycle:Math.floor(warningAt/300),at:warningAt-5,arrive:warningAt,until:warningAt+3};
 if(s.time>=s.nextBossAt&&s.time<DEATH_TIME&&!s.enemies.some(e=>e.type===4&&e.hp>0)){s.bossSpawned=true;s.nextBossAt+=300;this.spawn(4);this.events.push('bossSpawn');}
 if(s.time>=DEATH_TIME&&!s.reaperSpawned){s.reaperSpawned=true;s.hostile=[];s.hazards=[];for(const p of s.players){p.choices=[];if(p.hp>0)this.spawn(7);}this.events.push('bossSpawn');}
 const alive=s.players.filter(p=>p.hp>0);if(!alive.length){s.status='over';return;}
 this.spawnCd-=dt;if(this.spawnCd<=0&&s.enemies.length<220){const focused=bossActive(s);this.spawnCd=Math.max(.13,.9-s.time*.002)*s.difficulty.cadence*(focused?5:1);const n=Math.min(220-s.enemies.length,focused?1:8,Math.ceil((1+Math.floor(s.time/65))*s.difficulty.spawn));for(let i=0;i<n;i++){this.spawn(pickEnemyType(s.time,this.random,s.enemies));}}
 for(const p of s.players){if(s.reaperSpawned)p.choices=[];p.hitCd=Math.max(0,p.hitCd-dt);if(p.hp<=0){p.choices=[];p.familiars=[];continue;}

 const inp=this.inputs[p.id]||{};if(Number.isFinite(p.inputAt))p.inputAge+=dt;let x=Number(inp.x)||0,y=Number(inp.y)||0;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}p.snared=(p.snareUntil||0)>s.time;const moveSpeed=p.speed*(p.snared?.55:1);p.x=clamp(p.x+x*moveSpeed*dt,100,W-100);p.y=clamp(p.y+y*moveSpeed*dt,100,H-100);collideDestructibles(p,s.props);p.moving=len>.1;if(x)p.face=x<0?-1:1;
 if(p.connected===false)continue;p.hp=Math.min(p.maxHp,p.hp+(p.ranks.renewal||0)*.3*dt);p.cooldown-=dt;p.novaCd-=dt;p.stormCd-=dt;p.pulseCd-=dt;let nearest=null,nd=640;for(const e of s.enemies){if(e.hp<=0)continue;const d=dist(p,e);if(d<nd){nd=d;nearest=e;}}
 if(!nearest)for(const object of s.props||[]){const d=dist(p,object);if(object.hp>0&&d<Math.min(nd,500)){nd=d;nearest=object;}}
 if(ownsWeapon(p,'blade')&&nearest&&p.cooldown<=0){
  this.castPose(p,'blade',nearest);const evolved=p.evolutions.blade==='eclipse';p.cooldown=weaponCooldown(p,evolved?.48:.68);
  const a=Math.atan2(nearest.y-p.y,nearest.x-p.x);
  for(let k=0;k<p.count+(p.ranks.volley||0);k++){const angle=a+(k-(p.count+(p.ranks.volley||0)-1)/2)*.17;s.shots.push({born:Math.round(s.time*1000)/1000,id:uid++,x:p.x,y:p.y-10,vx:Math.cos(angle)*500,vy:Math.sin(angle)*500,life:(evolved?1.8:1.3)*weaponDuration(p),scale:weaponScale(p),owner:p.id,weapon:'blade',damage:p.damage*(evolved?1.8:1),angle,hit:[],pierce:evolved?5:2,homing:evolved,sprite:evolved?8:6});}this.events.push('shoot');
 }
 if(ownsWeapon(p,'nova')&&p.nova&&p.novaCd<=0){
  this.castPose(p,'nova',nearest);const evolved=p.evolutions.nova==='winter';p.novaCd=weaponCooldown(p,evolved?2:Math.max(2,5-p.nova*.35));
  const radius=(evolved?310:135+p.nova*22)*weaponScale(p);this.effect(p.x,p.y,evolved?'winter':'nova',.65,radius);this.guard(p,'nova',{x:p.x,y:p.y,radius});
  for(const e of this.targets())if(e.hp>0&&dist(p,e)<radius){this.damage(e,p.damage*(1.5+p.nova*.4)*(evolved?1.6:1),p,p,'nova');e.slow=evolved?3:2;if(evolved)e.frozen=1.2;}
  if(evolved)p.hp=Math.min(p.maxHp,p.hp+6);
 }
 const previousOrbit=orbitBlades(p,s.time-dt);for(const [i,blade] of orbitBlades(p,s.time).entries()){const before=previousOrbit[i]||blade;this.guard(p,'orbit',{kind:'line',x:before.x,y:before.y,tx:blade.x,ty:blade.y,radius:22*weaponScale(p)});for(const e of this.targets())if((e.orbitCd||0)<=0&&Math.hypot(e.x-blade.x,e.y-blade.y)<e.size+22*weaponScale(p)){this.damage(e,p.damage*(p.evolutions.orbit?1.25:.85),p,blade,'orbit');e.orbitCd=weaponCooldown(p,.35);}}
 if(p.evolutions.orbit==='starfall'&&p.pulseCd<=0){this.castPose(p,'orbit',nearest);p.pulseCd=weaponCooldown(p,2);this.effect(p.x,p.y,'gravity',.7,230*weaponScale(p));this.guard(p,'orbit',{x:p.x,y:p.y,radius:230*weaponScale(p)});for(const e of this.targets())if(e.hp>0&&dist(p,e)<230*weaponScale(p)){this.damage(e,p.damage*1.2,p,p,'orbit');e.slow=1;}for(const g of s.gems)if(dist(p,g)<350)g.pulled=p.id;}
 if(ownsWeapon(p,'storm')&&p.storm&&nearest&&p.stormCd<=0){p.stormCd=weaponCooldown(p,p.evolutions.storm?1:2);this.castPose(p,'storm',nearest);this.lightning(p);}
 stepArsenal(this,p,dt,nearest);stepMirrorShield(this,p,dt,nearest);

 }
 for(const e of s.enemies){if(e.hp<=0)continue;e.hit=Math.max(0,e.hit-dt);e.stagger=Math.max(0,(e.stagger||0)-dt);
 e.x=clamp(e.x+(e.knockX||0)*dt,70,W-70);e.y=clamp(e.y+(e.knockY||0)*dt,70,H-70);e.knockX=(e.knockX||0)*Math.exp(-12*dt);e.knockY=(e.knockY||0)*Math.exp(-12*dt);e.frozen=Math.max(0,(e.frozen||0)-dt);e.slow=Math.max(0,e.slow-dt);e.orbitCd-=dt;let target=null,nd=1e9;for(const p of s.players)if(p.hp>0&&p.connected!==false){const d=dist(p,e);if(d<nd){nd=d;target=p;}}if(!target)continue;const dx=target.x-e.x,dy=target.y-e.y,l=Math.max(1,Math.hypot(dx,dy));stepEnemyAttack(this,e,target,dt);const motion=enemyMotion(e,target,nd),speed=e.type===7?e.speed:e.frozen>0||e.stagger>0?0:e.speed*(e.slow>0?.4:1);e.x+=dx/l*speed*dt*motion;e.y+=dy/l*speed*dt*motion;stepBestiaryStrafe(e,target,dt);if(e.chargeLeft>0&&(e.type===4||e.frozen<=0&&e.stagger<=0)){e.chargeLeft-=dt;e.x=clamp(e.x+Math.cos(e.chargeAngle)*(e.chargeSpeed||560)*dt,70,W-70);e.y=clamp(e.y+Math.sin(e.chargeAngle)*(e.chargeSpeed||560)*dt,70,H-70);}e.moving=speed>0&&motion!==0||e.chargeLeft>0;e.face=dx<0?-1:1;
 // Telegraphs and follow-through are cosmetic; contact damage keeps its timing.
 if(nd<e.size+48&&e.stagger<=0&&e.frozen<=0&&target.hitCd<=0&&!target.choices.length&&(!Number.isFinite(e.attackAt)||s.time-e.attackAt>.6)){e.attackAt=s.time;e.attackAngle=Math.atan2(dy,dx);}

 if(Math.hypot(target.x-e.x,target.y-e.y)<e.size+18&&e.stagger<=0&&e.frozen<=0){e.attackAt=s.time-.14;e.attackAngle=Math.atan2(dy,dx);if(hurtPlayer(this,target,e.type===7?1e6:(e.type===4?24:e.type===5?18:e.type===3?7:ENEMY_TYPES[e.type]?.damage||10)*(1+(e.elite||0)*.35)*(e.damageScale||1))&&e.type!==7){e.x-=dx/l*22;e.y-=dy/l*22;}}
 }
 stepWeaponEntities(this,dt);
 for(const b of s.shots){const p=s.players.find(p=>p.id===b.owner);if(!p||p.hp<=0||p.connected===false){b.life=0;continue;}const ox=b.x,oy=b.y,special=stepSpecialShot(this,b,p,dt);if(special){if(b.active!==false)this.guard(p,b.weapon,{kind:'line',x:ox,y:oy,tx:b.x,ty:b.y,radius:b.radius??17*(b.scale||1)});continue;}if(b.life<=0)continue;if(b.homing){let target=null,near=360;for(const e of this.targets())if(e.hp>0&&!b.hit.includes(e.id)){const d=dist(e,b);if(d<near){near=d;target=e;}}if(target){const angle=Math.atan2(target.y-b.y,target.x-b.x);b.vx+=(Math.cos(angle)*500-b.vx)*Math.min(1,dt*5);b.vy+=(Math.sin(angle)*500-b.vy)*Math.min(1,dt*5);}}b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;this.guard(p,b.weapon,{kind:'line',x:ox,y:oy,tx:b.x,ty:b.y,radius:12*(b.scale||1)});for(const e of this.targets())if(e.hp>0&&!b.hit.includes(e.id)&&Math.hypot(b.x-e.x,b.y-e.y)<e.size+12*(b.scale||1)){this.damage(e,b.damage,p,{x:b.x-b.vx*.05,y:b.y-b.vy*.05},b.weapon);b.hit.push(e.id);onNewShotHit(this,b,p,e);if(b.shock)this.lightning(p,e,3,.65,b.weapon);if(b.hit.length>=(b.pierce||2)){b.life=0;break;}}}
 stepHostiles(this,dt);
 for(const g of s.gems){let target=null,nd=1e9;for(const p of s.players)if(p.hp>0&&p.connected!==false){const d=dist(p,g);if(d<nd){nd=d;target=p;}}if(!target)continue;if(nd<target.magnet||g.pulled===target.id){const l=Math.max(nd,1);g.x+=(target.x-g.x)/l*(320+240*(1-Math.min(nd/target.magnet,1)))*dt;g.y+=(target.y-g.y)/l*400*dt;}if(nd<23){const value=g.value||g.v;g.v=0;if(g.type==='heart'){target.hp=Math.min(target.maxHp,target.hp+25*(1+(target.ranks.preservation||0)*.3));this.events.push('heal');}else{this.xp(target,value);this.events.push('xp');}}else if(!g.value)g.value=g.v;}
 for(const chest of s.chests){const collector=s.players.find(p=>p.hp>0&&dist(p,chest)<38);if(collector){chest.taken=true;for(const p of s.players){if(p.hp<=0)continue;p.relics+=chest.value||1;p.lastChest=s.time;const key=chestWeapon(p,this.random);if(key){this.applyUpgrade(p,key);if(p.choices.some(option=>option!=='mend'&&!canUpgrade(p,option)))p.choices=rollChoices(p,this.random);p.lastChestUpgrade={key,rank:p.ranks[key],at:s.time};}}this.effect(chest.x,chest.y,'forge',.8,100);this.events.push('chest');}}
 noteDeaths(this);s.chests=s.chests.filter(c=>!c.taken);if(s.chests.length>32){const tail=s.chests.splice(0,s.chests.length-31);s.chests.push({...tail[tail.length-1],value:tail.reduce((n,c)=>n+(c.value||1),0)});}
 s.enemies=s.enemies.filter(e=>e.hp>0);s.shots=s.shots.filter(b=>b.life>0).slice(-180);s.gems=s.gems.filter(g=>g.v>0);if(s.gems.length>260){const tail=s.gems.splice(0,80);s.gems.push({id:uid++,x:tail[0].x,y:tail[0].y,v:tail.reduce((n,g)=>n+(g.value||g.v),0),value:tail.reduce((n,g)=>n+(g.value||g.v),0),type:'gem'});}
 s.zones=s.zones.filter(z=>z.life>0).slice(-64);
 s.impacts=s.impacts.filter(hit=>s.time-hit.at<.8);
 for(const f of s.effects)f.life-=dt;s.effects=s.effects.filter(f=>f.life>0).slice(-180);if(this.events.length>24)this.events=this.events.slice(-24);
 }
}
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.surface=document.createElement('canvas');this.ctx=this.surface.getContext('2d');this.display=canvas.getContext('2d');this.arena=new Image();this.arena.src='/art/pixel-frontier.png';this.frontierAtlas=new Image();this.frontierAtlas.src='/art/pixel-destructibles.png';this.atlas=new Image();this.atlas.src='/art/pixel-sprites.png';this.whiteAtlas=document.createElement('canvas');this.atlas.onload=()=>{this.whiteAtlas.width=this.atlas.width;this.whiteAtlas.height=this.atlas.height;const mask=this.whiteAtlas.getContext('2d');mask.drawImage(this.atlas,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#fff4cc';mask.fillRect(0,0,this.atlas.width,this.atlas.height);};this.hitAtlas=new Image();this.hitAtlas.src='/art/pixel-impact.png';this.feedback=new HitFeedback({reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches});this.walk=new Image();this.walk.src='/art/pixel-walk.png';this.relicAtlas=new Image();this.relicAtlas.src='/art/pixel-relics.png';this.weaponAtlas=new Image();this.weaponAtlas.src='/art/pixel-weapons.png?v=relics-37';this.vfxAtlas=new Image();this.vfxAtlas.src='/art/pixel-weapon-vfx.png';this.weaponFX=new WeaponVFX({reducedMotion:this.feedback.reducedMotion});this.w=1;this.h=1;this.camera={x:W/2,y:H/2};this.positions=new Map();this.motionClock=new AnimationClock();this.actors=new Image();this.actors.src='/art/pixel-actors.png';this.whiteActors=document.createElement('canvas');this.foes=new Image();this.foes.src='/art/pixel-foes.png';this.whiteFoes=document.createElement('canvas');this.bestiary=new Image();this.bestiary.src='/art/pixel-bestiary.png';this.duskAtlas=new Image();this.duskAtlas.src='/art/pixel-dusk-foes.png?v=1';this.whiteDuskAtlas=document.createElement('canvas');this.duskAtlas.onload=()=>{this.whiteDuskAtlas.width=this.duskAtlas.width;this.whiteDuskAtlas.height=this.duskAtlas.height;const mask=this.whiteDuskAtlas.getContext('2d');mask.drawImage(this.duskAtlas,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#fff4cc';mask.fillRect(0,0,this.duskAtlas.width,this.duskAtlas.height);};this.whiteBestiary=document.createElement('canvas');this.bossAtlas=new Image();this.bossAtlas.src='/art/pixel-bosses.png?v=eva-1';this.whiteBossAtlas=document.createElement('canvas');this.bossAtlas.onload=()=>{this.whiteBossAtlas.width=this.bossAtlas.width;this.whiteBossAtlas.height=this.bossAtlas.height;const mask=this.whiteBossAtlas.getContext('2d');mask.drawImage(this.bossAtlas,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#f4e3ba';mask.fillRect(0,0,this.bossAtlas.width,this.bossAtlas.height);};this.uiAtlas=new Image();this.uiAtlas.src='/art/pixel-ui.png';this.bestiary.onload=()=>{this.whiteBestiary.width=this.bestiary.width;this.whiteBestiary.height=this.bestiary.height;const mask=this.whiteBestiary.getContext('2d');mask.drawImage(this.bestiary,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#fff4cc';mask.fillRect(0,0,this.bestiary.width,this.bestiary.height);};this.eliteMasks=new Map();this.foes.onload=()=>{this.whiteFoes.width=this.foes.width;this.whiteFoes.height=this.foes.height;const mask=this.whiteFoes.getContext('2d');mask.drawImage(this.foes,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#fff4cc';mask.fillRect(0,0,this.foes.width,this.foes.height);};this.actors.onload=()=>{this.whiteActors.width=this.actors.width;this.whiteActors.height=this.actors.height;const mask=this.whiteActors.getContext('2d');mask.drawImage(this.actors,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#fff4cc';mask.fillRect(0,0,this.actors.width,this.actors.height);};}
 resize(){const r=this.canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);if(this.canvas.width!==Math.round(r.width*d)||this.canvas.height!==Math.round(r.height*d)){this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}const sw=Math.ceil(r.width/2),sh=Math.ceil(r.height/2);if(this.surface.width!==sw||this.surface.height!==sh){this.surface.width=sw;this.surface.height=sh;}this.w=r.width;this.h=r.height;this.dpr=.5;this.ctx.imageSmoothingEnabled=false;}
 sprite(index,x,y,height,face=1,alpha=1,angle=0,frame=-1,flash=0,stretch=1){const c=this.ctx;if(!this.atlas.complete||!this.atlas.naturalWidth)return;let source=this.atlas,sw=this.atlas.width/4,sh=this.atlas.height/2,sx=(index%4)*sw,sy=Math.floor(index/4)*sh;if(index===0&&frame>=0&&this.walk.complete&&this.walk.naturalWidth){source=this.walk;sw=this.walk.width/4;sh=this.walk.height;sx=frame*sw;sy=0;}if(index>=16){if(!this.weaponAtlas.complete||!this.weaponAtlas.naturalWidth)return;source=this.weaponAtlas;sw=sh=64;sx=((index-16)%6)*64;sy=Math.floor((index-16)/6)*64;}else if(index>=8){if(!this.relicAtlas.complete||!this.relicAtlas.naturalWidth)return;source=this.relicAtlas;sw=this.relicAtlas.width/5;sh=this.relicAtlas.height;sx=(index-8)*sw;sy=0;}const w=height*sw/sh;c.save();c.translate(Math.round(x),Math.round(y));c.scale(face*stretch,2-stretch);if(angle)c.rotate(Math.round(angle/(Math.PI/8))*Math.PI/8);c.globalAlpha=alpha;c.imageSmoothingEnabled=false;c.drawImage(source,sx,sy,sw,sh,-w/2,-height*.75,w,height);if(flash>0&&source===this.atlas&&this.whiteAtlas.width){c.globalAlpha=alpha*flash;c.drawImage(this.whiteAtlas,sx,sy,sw,sh,-w/2,-height*.75,w,height);}c.restore();}
 foeSprite(index,x,y,height,angle=0){
  if(!this.foes.complete||!this.foes.naturalWidth)return;const c=this.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.drawImage(this.foes,(index-2)*96,192,96,96,-height/2,-height/2,height,height);c.restore();
 }
 eliteMask(source,tier){
  const key=(source===this.duskAtlas?'dusk':source===this.bestiary?'bestiary':source===this.foes?'foes':'actors')+tier;if(this.eliteMasks.has(key))return this.eliteMasks.get(key);
  const mask=document.createElement('canvas');mask.width=source.width;mask.height=source.height;const c=mask.getContext('2d');c.drawImage(source,0,0);c.globalCompositeOperation='source-in';c.fillStyle=ELITE_TIERS[tier].color;c.fillRect(0,0,mask.width,mask.height);this.eliteMasks.set(key,mask);return mask;
 }
 playerAtlas(index){
  const slot=((Number(index)||0)%4+4)%4;if(!slot)return this.actors;
  this.playerAtlases??=new Map();if(this.playerAtlases.has(slot))return this.playerAtlases.get(slot);
  const atlas=document.createElement('canvas');atlas.width=this.actors.width;atlas.height=ACTOR_CELL;const c=atlas.getContext('2d');c.drawImage(this.actors,0,0);
  const pixels=c.getImageData(0,0,atlas.width,atlas.height);recolorCloth(pixels.data,slot);c.putImageData(pixels,0,0);this.playerAtlases.set(slot,atlas);return atlas;
 }
 playerLabels(players,id){
  if(players.length<2)return;const c=this.ctx;c.save();c.font='bold 12px sans-serif';c.textAlign='center';
  const labels=players.map(p=>{const pos=this.positions.get('player'+p.id)||p,text=playerLabel(p,p.id===id);return{player:p,text,x:pos.x,y:pos.y-66,width:c.measureText(text).width};});
  for(const label of placePlayerLabels(labels)){
   const {player:p,text,x,y}=label,pos=this.positions.get('player'+p.id)||p,color=playerStyle(p.index).color;
   c.globalAlpha=p.hp>0?1:.5;
   if(y<pos.y-70){c.strokeStyle=color;c.lineWidth=1;c.beginPath();c.moveTo(x,y+4);c.lineTo(pos.x,pos.y-57);c.stroke();}
   c.fillStyle='#071016cc';c.fillRect(x-label.width/2-4,y-12,label.width+8,17);
   c.fillStyle=color;c.fillText(text,x,y);
   if(p.id===id){c.beginPath();c.moveTo(pos.x-5,pos.y-57);c.lineTo(pos.x+5,pos.y-57);c.lineTo(pos.x,pos.y-51);c.closePath();c.fill();}
  }
  c.restore();
 }
 actor(entity,x,y,height,time,{player=false,alpha=1,rotation=0,flash=0,reducedMotion=this.feedback.reducedMotion}={}){
  const pose=actorPose(entity,time,{player,reducedMotion}),c=this.ctx;
  if(!player&&(drawBossBody(this,entity,x,y,height,time,flash)||drawExpandedBody(this,entity,x,y,height,time,flash)))return;
  if(!this.actors.complete||!this.actors.naturalWidth){this.sprite(player?0:entity.type===5?4:entity.type,x,y,height,pose.face,alpha,rotation,-1,flash);return;}
  const dusk=!player&&entity.type>=16,added=!player&&entity.type>=8,extra=!player&&entity.type>=6,source=player?this.playerAtlas(entity.index):dusk?this.duskAtlas:added?this.bestiary:extra?this.foes:this.actors,white=dusk?this.whiteDuskAtlas:added?this.whiteBestiary:extra?this.whiteFoes:this.whiteActors;
  if(source===this.actors||!player){if(!source.complete||!source.naturalWidth)return;}const sx=pose.column*ACTOR_CELL,sy=(dusk?entity.type-16:added?entity.type-8:extra?entity.type-6:pose.row)*ACTOR_CELL,stretch=reducedMotion?1:1+Math.min(1,flash)*.065;
  c.save();c.translate(Math.round(x),Math.round(y+pose.offsetY));c.scale(pose.face*stretch,2-stretch);if(rotation)c.rotate(rotation);c.globalAlpha=alpha;c.imageSmoothingEnabled=false;
  if(!player&&entity.elite&&ELITE_TIERS[entity.elite]){const mask=this.eliteMask(source,entity.elite);for(const [dx,dy]of [[-2,0],[2,0],[0,-2],[0,2]])c.drawImage(mask,sx,sy,ACTOR_CELL,ACTOR_CELL,-height/2+dx,-height*.75+dy,height,height);}
  c.drawImage(source,sx,sy,ACTOR_CELL,ACTOR_CELL,-height/2,-height*.75,height,height);
  if(flash>0&&white.width){c.globalAlpha=alpha*flash;c.drawImage(white,sx,sy,ACTOR_CELL,ACTOR_CELL,-height/2,-height*.75,height,height);}
  c.restore();
  if(pose.mode==='attack'&&entity.hp>0){
   c.save();const strength=Math.sin(pose.attackProgress*Math.PI);c.globalAlpha=strength*.65;
   if(player){const color=UPGRADES[entity.attackKind]?.color||'#d8dec4',fx=x+Math.cos(pose.angle)*26,fy=y-27+Math.sin(pose.angle)*13;
    c.fillStyle=color;c.fillRect(Math.round(fx/2)*2,Math.round(fy/2)*2,4,4);c.fillStyle='#eef0cf';c.fillRect(Math.round(fx/2)*2-2,Math.round(fy/2)*2+2,2,2);
   }else if(pose.attackProgress>.35&&pose.attackProgress<.85){
    c.strokeStyle=entity.type===2?'#9ddbc0':entity.type>=4?'#cdbb91':'#d8c6b0';c.lineWidth=entity.type>=4?2:1;
    const radius=entity.type===4?50:entity.type===5?34:22;c.beginPath();c.arc(x,y-15,radius,pose.angle-.75,pose.angle+.65);c.stroke();
   }c.restore();
  }
 }
 render(s,id,dt,menu=false,networked=false){this.resize();const c=this.ctx,w=this.w,h=this.h,d=this.dpr;c.setTransform(d,0,0,d,0,0);c.clearRect(0,0,w,h);c.fillStyle='#0c1315';c.fillRect(0,0,w,h);const me=s?.players.find(p=>p.id===id);let zoom=menu?Math.max(w/W,h/H)*1.08:Math.max(.64,Math.min(1,w/1250));const frame=!menu&&me?bossCamera(s,me,w,h,zoom):{x:menu?W*.52:W/2,y:menu?H*.5:H/2,zoom};this.combatZoom=this.viewRun!==s?.runId?frame.zoom:(this.combatZoom??zoom)+(frame.zoom-(this.combatZoom??zoom))*Math.min(1,dt*3);zoom=menu?zoom:this.combatZoom;const cx=frame.x,cy=frame.y;const limX=w/zoom/2,limY=h/zoom/2;const targetX=clamp(cx,Math.min(W/2,limX),Math.max(W/2,W-limX)),targetY=clamp(cy,Math.min(H/2,limY),Math.max(H/2,H-limY));if(s?.runId!==this.viewRun){this.camera.x=targetX;this.camera.y=targetY;this.viewRun=s?.runId;}this.camera.x+=(targetX-this.camera.x)*Math.min(1,dt*7);this.camera.y+=(targetY-this.camera.y)*Math.min(1,dt*7);if(menu){this.feedback.reset();this.weaponFX.reset();}else this.feedback.update(s?.impacts,s?.time||0,id,dt);const shake=this.feedback.offset();c.save();c.translate(w/2+shake.x,h/2+shake.y);c.scale(zoom,zoom);c.translate(-this.camera.x,-this.camera.y);
 if(this.arena.complete&&this.arena.naturalWidth)c.drawImage(this.arena,0,0,W,H);c.fillStyle=menu?'rgba(7,13,16,.2)':'rgba(7,13,16,.16)';c.fillRect(0,0,W,H);
 const time=menu?performance.now()/1000:this.motionClock.update(s?.upgradePaused?s.time:s?.visualTime??s?.time??0,dt,networked&&!s?.upgradePaused&&!Number.isFinite(s?.visualTime)&&s?.status==='playing');
 if(s&&!menu){this.weaponFX.update(s,time,id,{x:this.camera.x,y:this.camera.y,w:w/(2*zoom),h:h/(2*zoom)});for(const chest of s.chests||[]){this.sprite(12,chest.x,chest.y+Math.round(Math.sin(time*3)*2),58);c.strokeStyle='#d9c38a';c.lineWidth=1;c.beginPath();c.ellipse(chest.x,chest.y+12,24,9,0,0,Math.PI*2);c.stroke();}for(const object of s.props||[])if(object.hp<=0)drawDestructible(this,object);for(const g of s.gems){if(g.type==='heart')this.sprite(7,g.x,g.y,26+Math.sin(time*3+g.id)*2);else drawExperience(this,g,time);}
 drawWeaponFields(this,s,time);drawHostiles(this,s,time);
 for(const f of s.effects){if(drawFrontierEffect(this,f)||this.weaponFX.drawEffect(this,f,time))continue;const t=1-f.life/f.max;c.save();c.globalAlpha=(1-t)*.8;
 const colors={summon:'#e2b9b5',winter:'#b5e8ed',gravity:'#b5dbbb',forge:'#e6ce91',thunder:'#d0bee9'};c.strokeStyle=colors[f.type]||(f.type==='hit'?'#e2a5a0':'#c6eacb');
 {c.lineWidth=['nova','winter','forge'].includes(f.type)?3:1;c.beginPath();c.arc(f.x,f.y,f.size*(.4+.6*t),0,6.28);c.stroke();if(['nova','winter','gravity','forge'].includes(f.type)){c.fillStyle=f.type==='forge'?'rgba(230,206,145,.13)':'rgba(150,210,209,.1)';c.fill();}}
 c.restore();}

 const units=[...s.enemies.map(e=>({...e,kind:'enemy'})),...s.players.map(p=>({...p,kind:'player'})),...(s.props||[]).filter(p=>p.hp>0).map(p=>({...p,unitKind:'prop'}))].sort((a,b)=>a.y-b.y);const visibleKeys=new Set(units.map(u=>(u.unitKind||u.kind)+u.id));for(const key of this.positions.keys())if(!visibleKeys.has(key))this.positions.delete(key);for(const u of units){const key=(u.unitKind||u.kind)+u.id;const old=this.positions.get(key)||{x:u.x,y:u.y};old.x=networked?u.x:old.x+(u.x-old.x)*Math.min(1,dt*16);old.y=networked?u.y:old.y+(u.y-old.y)*Math.min(1,dt*16);this.positions.set(key,old);const x=old.x,y=old.y;if(u.unitKind==='prop'){drawDestructible(this,{...u,x,y});continue;}const player=u.kind==='player';c.save();c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x,y+8,player?22:u.size*.9,player?8:u.size*.35,0,0,6.28);c.fill();c.restore();
 if(player){if(u.hp<=0){this.actor({...u,hp:u.ghost?1:0,attackAt:-1e9},x,y-(u.ghost?6:0),80,time,{player:true,alpha:u.ghost?.38:.23,rotation:u.ghost?0:Math.PI/2});c.save();c.strokeStyle='#b6dce4';c.lineWidth=2;c.globalAlpha=.65;c.beginPath();c.ellipse(x,y+9,31,12,0,0,Math.PI*2);c.stroke();if(u.reviveProgress>0){c.globalAlpha=1;c.lineWidth=4;c.beginPath();c.arc(x,y-26,39,-Math.PI/2,-Math.PI/2+Math.PI*2*u.reviveProgress/3);c.stroke();}c.fillStyle='#d5edf0';c.font='12px sans-serif';c.textAlign='center';c.fillText('✧',x,y-65);c.restore();continue;}c.strokeStyle=playerStyle(u.index).color;c.lineWidth=u.id===id?2.4:1.4;c.beginPath();c.ellipse(x,y+10,25,10,0,0,6.28);c.stroke();this.actor(u,x,y,86,time,{player:true,alpha:u.hitCd>.1&&Math.sin(time*40)>0?.4:1});this.weaponFX.drawCast(this,u,time);drawFamiliars(this,u,time);drawMirrorShield(this,u,time);this.weaponFX.drawOrbits(this,u,time);if(u.choices.length){c.fillStyle='#dcebc8';c.font='20px serif';c.textAlign='center';c.fillText('✧',x,y-70);}
 }else{const flash=Math.min(1,Math.max((u.hit||0)/.16,(this.feedback.flashes.get(u.id)||0)/.12));const height=((u.type===7||u.type===4)?bossVisual(u).height:u.type===5?120:u.type===3?72:u.type===6?94:ENEMY_TYPES[u.type]?.height||86)*(u.elite?1.12:1);this.actor(u,x,y,height,time,{flash});if(u.type!==7&&u.type!==4&&(u.type===5||u.elite||u.hp<u.maxHp)){const bw=u.type===4||u.type===7?70:28,barY=y-height*.68-8;c.fillStyle='#182322';c.fillRect(x-bw/2,barY,bw,3);c.fillStyle=u.type===7?'#ee647c':u.elite?ELITE_TIERS[u.elite].color:u.type===4?'#ba9c7a':'#9cbaaf';c.fillRect(x-bw/2,barY,bw*u.hp/u.maxHp,3);}}
 }
 this.weaponFX.drawShots(this,s,time);
 this.feedback.draw(c,this.hitAtlas,this.vfxAtlas);
 this.playerLabels(s.players,id);
 }
 for(let i=0;i<32;i++){const x=(i*317+Math.sin(time*.16+i)*38)%W,y=(i*173-time*(3+i%4)+H*100)%H;const glow=.18+.22*Math.sin(time*1.3+i);c.fillStyle=`rgba(210,227,172,${glow})`;c.beginPath();c.arc(x,y,1.5,0,6.28);c.fill();}c.restore();const grad=c.createRadialGradient(w/2,h/2,h*.12,w/2,h/2,w*.7);grad.addColorStop(0,'rgba(4,9,12,0)');grad.addColorStop(1,'rgba(4,9,12,.65)');c.fillStyle=grad;c.fillRect(0,0,w,h);
 this.display.setTransform(1,0,0,1,0,0);this.display.imageSmoothingEnabled=false;this.display.clearRect(0,0,this.canvas.width,this.canvas.height);this.display.drawImage(this.surface,0,0,this.canvas.width,this.canvas.height);if(this.positions.size>1000)this.positions.clear();
 }
}
export class AudioBus {constructor(){this._enabled=true;this.ctx=null;this.music=null;this.scene='camp';this.last=0;this.lastImpact=-1;} get enabled(){return this._enabled;} set enabled(value){this._enabled=!!value;this.music?.setEnabled(this._enabled);} init(){if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.music=new ChipMusic(this.ctx);this.music.setEnabled(this.enabled);this.music.setScene(this.scene);}this.ctx.resume().then(()=>this.music?.pump()).catch(()=>{});} setScene(scene){this.scene=scene;this.music?.setScene(scene);} dispose(){this.music?.dispose();this.ctx?.close();} play(type){if(!this.enabled||!this.ctx)return;if(type==='impact'||type==='finish'){this.contact(type==='finish');return;}const now=this.ctx.currentTime;if(type==='shoot'&&now-this.last<.13)return;this.last=now;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();const freqs={shoot:320,xp:900,level:640,upgrade:520,hurt:85,kill:160,heal:780,bossSpawn:60,boss:180,forge:980,chest:760,revive:850,down:110};osc.type=type==='hurt'?'sawtooth':'sine';osc.frequency.setValueAtTime(freqs[type]||300,now);osc.frequency.exponentialRampToValueAtTime(type==='xp'?1400:(freqs[type]||300)*.5,now+.13);gain.gain.setValueAtTime(type==='shoot'?.013:.04,now);gain.gain.exponentialRampToValueAtTime(.001,now+.17);osc.connect(gain);gain.connect(this.ctx.destination);osc.start();osc.stop(now+.18);}
 contact(finish=false){
  const ctx=this.ctx,now=ctx.currentTime;if(now-this.lastImpact<(finish?.045:.065))return;this.lastImpact=now;
  const body=ctx.createOscillator(),bodyGain=ctx.createGain();body.type='triangle';body.frequency.setValueAtTime(finish?190:340,now);body.frequency.exponentialRampToValueAtTime(finish?48:100,now+.085);
  bodyGain.gain.setValueAtTime(.001,now);bodyGain.gain.linearRampToValueAtTime(finish?.08:.055,now+.004);bodyGain.gain.exponentialRampToValueAtTime(.001,now+.1);body.connect(bodyGain);bodyGain.connect(ctx.destination);body.start(now);body.stop(now+.11);
  if(!this.contactNoise){this.contactNoise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.06),ctx.sampleRate);const data=this.contactNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;}
  const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();noise.buffer=this.contactNoise;filter.type='bandpass';filter.frequency.value=finish?1100:1900;filter.Q.value=.7;gain.gain.setValueAtTime(.045,now);gain.gain.exponentialRampToValueAtTime(.001,now+.055);noise.connect(filter);filter.connect(gain);gain.connect(ctx.destination);noise.start(now);noise.stop(now+.06);
 }
}
