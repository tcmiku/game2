import {shrineInvulnerable,preventShrineDeath,shrineHurt} from './shrine-powers.mjs';
import {ultraActive} from './dragon-light.mjs';
import {stepDuskBullet} from './dusk-foes.mjs';
import {stepBossBullet,drawBossBullet} from './boss-skills.mjs';
import {stepBossAttack,bossMotion,stepBossHazard,drawBossWarnings,drawBossHazard} from './bosses.mjs';
import {attackContact,cancelBullet,circleContact} from './counterfire.mjs';
import {ARENA_W,ARENA_H} from './frontier.mjs';
import {stepBestiaryAttack,bestiaryMotion,stepBestiaryHazard,drawBestiaryWarnings,drawBestiaryHazard,drawBestiaryBullet} from './bestiary.mjs';
/** Authoritative enemy attacks; presentation reads these same bounded records. */
export const DEATH_TIME=1800;
export const ELITE_TIERS={1:{name:'翠影',color:'#82ef9d',health:3},2:{name:'苍焰',color:'#70b6ff',health:7},3:{name:'赤祸',color:'#ff6c78',health:14}};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function rollElite(time,random){
 if(time<30||random()>.065+Math.min(.055,time/18000))return 0;
 const r=random();return time>=600&&r<.2?3:time>=180&&r<.5?2:1;
}
export function hurtPlayer(w,p,damage){
 if(shrineInvulnerable(p,w.s.time)||ultraActive(p,w.s.time)||p.hp<=0||p.connected===false||p.hitCd>0||p.choices.length)return false;
 const amount=damage*Math.max(.25,1-(p.ranks?.ward||0)*.08);if(preventShrineDeath(w,p,amount))return true;p.hp=Math.max(0,p.hp-amount);shrineHurt(w,p);p.hitCd=.65;w.effect(p.x,p.y,'hit',.25,55);w.events.push('hurt');return true;
}
function bullet(w,e,angle,speed=210,damage=12,radius=10){
 w.s.hostile.push({id:w.nextId(),owner:e.id,sourceType:e.type,cancellable:e.type!==4&&e.type!==7,x:e.x,y:e.y-24,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius,damage:damage*(e.damageScale||1),life:6,kind:e.type===4?'thorn':'orb'});
}
export function stepEnemyAttack(w,e,target,dt){
 if(e.type===7){e.frozen=e.slow=e.stagger=0;return;}
 if(stepBossAttack(w,e,target,dt))return;
 if(stepBestiaryAttack(w,e,target,dt))return;
 if(e.type!==6)return;
 e.skillCd=(e.skillCd??1.1)-dt;
 if(e.skillCd<.5&&!e.aiming){e.aiming=true;e.attackAt=w.s.time;e.attackAngle=Math.atan2(target.y-e.y,target.x-e.x);}
 if(e.skillCd<=0){const a=Math.atan2(target.y-e.y,target.x-e.x),count=e.elite?3:1;for(let i=0;i<count;i++)bullet(w,e,a+(i-(count-1)/2)*.22,210,12+(e.elite||0)*4,11);e.attackAt=w.s.time-.14;e.aiming=false;e.skillCd=2.8;}
}
export function enemyMotion(e,target,distance){
 const boss=bossMotion(e,distance);if(boss!==null)return boss;
 const extra=bestiaryMotion(e,distance);if(extra!==null)return extra;
 if(e.type===7)return 1;
 if(e.type===6)return distance>340?1:distance<230?-.55:0;
 return 1;
}
export function stepHostiles(w,dt){
 const s=w.s;
 for(const h of s.hazards){h.wait-=dt;h.life-=dt;if(stepBossHazard(w,h,dt,hurtPlayer)||stepBestiaryHazard(w,h,dt,hurtPlayer))continue;if(h.wait<=0&&!h.fired){h.fired=true;if(h.kind==='roots')for(const p of s.players)if(dist(p,h)<h.radius+12)hurtPlayer(w,p,h.damage);}}
 for(const b of s.hostile){
  if(b.life<=0)continue;
  stepDuskBullet(b,dt);stepBossBullet(w,b,dt);if(b.life<=0)continue;
  const ox=b.x,oy=b.y,tx=b.x+b.vx*dt,ty=b.y+b.vy*dt,contact=attackContact(w,b,ox,oy,tx,ty);b.life-=dt;
  const hits=s.players.filter(p=>p.hp>0).map(p=>({p,t:circleContact(ox,oy,tx,ty,p.x,p.y,b.radius+14)})).filter(hit=>hit.t<=1).sort((a,b)=>a.t-b.t);
  for(const hit of hits){if(contact&&contact.t<=hit.t)break;if(hurtPlayer(w,hit.p,b.damage)){b.life=0;break;}}
  if(b.life>0&&contact)cancelBullet(w,b,contact,ox,oy,tx,ty);else{b.x=tx;b.y=ty;}
 }
 s.hostile=s.hostile.filter(b=>b.life>0&&b.x>-60&&b.x<(s.width||ARENA_W)+60&&b.y>-60&&b.y<(s.height||ARENA_H)+60).slice(-160);
 s.hazards=s.hazards.filter(h=>h.life>0).slice(-48);
}
export function drawHostiles(renderer,s,time){
 const c=renderer.ctx;drawBestiaryWarnings(renderer,s,time);drawBossWarnings(renderer,s,time);
 for(const h of s.hazards||[]){
  if(drawBossHazard(renderer,h,time)||drawBestiaryHazard(renderer,h,time))continue;
  c.save();c.lineWidth=3;c.strokeStyle=h.wait>0?'#ffab77':'#ff626b';c.fillStyle=h.wait>0?'#e563392a':'#f9655655';c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();c.stroke();
  c.lineWidth=2;c.strokeStyle='#ffe0ae';c.beginPath();c.arc(h.x,h.y,h.radius*.82,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,1-h.wait/1.5));c.stroke();
  for(let j=0;j<6;j++){const a=j*Math.PI/3;c.fillStyle='#ffbd89';c.fillRect(h.x+Math.cos(a)*h.radius-3,h.y+Math.sin(a)*h.radius-3,6,6);}c.restore();
 }
 for(const b of s.hostile||[]){
  if(drawBossBullet(renderer,b)||drawBestiaryBullet(renderer,b,time))continue;
  const size=b.radius*2;c.save();c.strokeStyle='#18212d';c.lineWidth=size*.85;c.beginPath();c.moveTo(b.x-b.vx*.09,b.y-b.vy*.09);c.lineTo(b.x,b.y);c.stroke();
  c.strokeStyle='#ff826a';c.lineWidth=size*.45;c.stroke();
  renderer.foeSprite(b.kind==='thorn'?3:2,b.x,b.y,size*2.6,Math.atan2(b.vy,b.vx));c.restore();
 }
}
