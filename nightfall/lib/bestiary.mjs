import {DUSK_TYPES,stepDuskAttack,duskMotion,stepDuskHazard,drawDuskWarnings,drawDuskHazard,drawDuskBullet} from './dusk-foes.mjs';
import {EXPANDED_TYPES,stepExpandedAttack,expandedMotion,stepExpandedStrafe,stepWeb,drawExpandedWarnings,drawWeb} from './expanded-foes.mjs';
/** Additional enemy archetypes share the authoritative enemy and hazard pools. */
import {ARENA_W,ARENA_H} from './frontier.mjs';
export const ENEMY_TYPES={...EXPANDED_TYPES,...DUSK_TYPES,
 8:{name:'灰鬃猎犬',hp:28,speed:108,size:20,height:94,xp:2,damage:12,from:18,weight:14},
 9:{name:'孢囊魔',hp:55,speed:44,size:25,height:106,xp:2,damage:9,from:40,weight:11},
 10:{name:'裂骨弩手',hp:38,speed:72,size:21,height:99,xp:2,damage:10,from:65,weight:11},
 11:{name:'墓铃祭司',hp:88,speed:48,size:23,height:114,xp:4,damage:8,from:105,weight:6},
 12:{name:'铁甲巨像',hp:160,speed:37,size:34,height:142,xp:5,damage:18,from:150,weight:8},
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function pickEnemyType(time,random,enemies=[]){
 const pool=[[1,40]];if(time>25)pool.push([6,10]);if(time>35)pool.push([3,14]);if(time>60)pool.push([2,16]);
 for(const [key,def]of Object.entries(ENEMY_TYPES))if(time>=def.from&&(key!=='11'||enemies.filter(e=>e.type===11&&e.hp>0).length<5))pool.push([Number(key),def.weight]);
 let roll=random()*pool.reduce((n,[,weight])=>n+weight,0);for(const [type,weight]of pool){roll-=weight;if(roll<0)return type;}return pool.at(-1)[0];
}
function poison(w,e,target,delay=.85,life=3.4){
 if(w.s.hazards.length>=48)return;
 w.s.hazards.push({id:w.nextId(),owner:e.id,kind:'spores',x:target.x,y:target.y,radius:e.elite?87:68,wait:delay,delay,life:life+delay,tick:0,damage:(8+(e.elite||0)*3)*(e.damageScale||1)});
}
function bolt(w,e){const a=e.burstAngle;w.s.hostile.push({id:w.nextId(),owner:e.id,sourceType:e.type,cancellable:true,kind:'bolt',x:e.x,y:e.y-20,vx:Math.cos(a)*290,vy:Math.sin(a)*290,radius:7,damage:(10+(e.elite||0)*3)*(e.damageScale||1),life:4});e.attackAt=w.s.time-.08;e.attackAngle=a;}
export function stepBestiaryAttack(w,e,target,dt){
 if(!ENEMY_TYPES[e.type])return false;
 if(e.frozen>0||e.stagger>0)return true;
 if(stepDuskAttack(w,e,target,dt)||stepExpandedAttack(w,e,target,dt))return true;
 const distance=dist(e,target);e.skillCd=(e.skillCd??(e.type===11?3.5:e.type===12?1.8:1.3))-dt;
 if(e.type===8){
  if(e.skill==='pounce'){
   e.windup-=dt;if(e.windup<=0){e.chargeLeft=.38;e.chargeSpeed=390;e.skill='';e.skillCd=4.5;}
  }else if(e.chargeLeft<=0||e.chargeLeft===undefined){if(e.skillCd<=0&&distance<430){e.skill='pounce';e.windup=.55;e.attackAt=w.s.time;e.attackAngle=e.chargeAngle=aim(e,target);}}
 }else if(e.type===9){
  if(e.skillCd<=0&&distance<390){e.attackAt=w.s.time;e.attackAngle=aim(e,target);poison(w,e,target);e.skillCd=4.6;}
 }else if(e.type===10){
  if(e.burstRemaining>0){e.burstWait-=dt;if(e.burstWait<=0){bolt(w,e);e.burstRemaining--;e.burstWait=.14;if(!e.burstRemaining)e.skill='';}}
  else{
   if(e.skill==='volley'&&distance>620){e.skill='';e.skillCd=1;}
   if(e.skillCd<=.45&&!e.skill&&distance<540){e.skill='volley';e.attackAt=w.s.time;e.attackAngle=e.burstAngle=aim(e,target);}
   if(e.skillCd<=0&&distance<580){e.burstRemaining=3+(e.elite?1:0);e.burstWait=0;e.skillCd=3.7;}
  }
 }else if(e.type===11){
  if(e.skillCd<=1&&!e.skill&&distance<620){e.skill='summon';e.attackAt=w.s.time;e.attackAngle=aim(e,target);}
  if(e.skillCd<=0){
   if(e.skill==='summon'){
    const owned=w.s.enemies.filter(n=>n.hp>0&&n.summoner===e.id).length,count=Math.min(e.elite?3:2,6-owned,220-w.s.enemies.length);
    for(let i=0;i<count;i++){const n=w.spawn(1,0);if(!n)break;const a=(e.phase||0)+i*Math.PI;n.x=clamp(e.x+Math.cos(a)*65,75,(w.s.width||ARENA_W)-75);n.y=clamp(e.y+Math.sin(a)*55,75,(w.s.height||ARENA_H)-75);n.summoner=e.id;w.effect(n.x,n.y,'summon',.55,42);}
   }
   e.skill='';e.skillCd=6;
  }
 }else{
  if(e.skill==='slam'){if(w.s.time>=e.slamAt){e.skill='';e.skillCd=4.2;}}
  else if(e.skillCd<=0&&distance<230){e.skill='slam';e.slamAt=w.s.time+.9;e.attackAt=w.s.time;e.attackAngle=aim(e,target);if(w.s.hazards.length<48)w.s.hazards.push({id:w.nextId(),owner:e.id,kind:'slam',x:e.x,y:e.y+8,radius:135,wait:.9,delay:.9,life:1.25,damage:(22+(e.elite||0)*7)*(e.damageScale||1),fired:false});}
 }
 return true;
}
export function bestiaryMotion(e,distance){
 const dusk=duskMotion(e,distance);if(dusk!==null)return dusk;
 const extra=expandedMotion(e,distance);if(extra!==null)return extra;
 if(!ENEMY_TYPES[e.type])return null;
 if(e.skill==='pounce'||e.skill==='slam'||e.skill==='volley'||e.skill==='summon'||e.chargeLeft>0)return 0;
 if(e.type===9)return distance>250?1:distance<155?-.35:0;
 if(e.type===10)return distance>360?1:distance<250?-.55:0;
 if(e.type===11)return distance>440?1:distance<300?-.35:0;
 return 1;
}
export function stepBestiaryStrafe(e,target,dt,bounds={}){
 stepExpandedStrafe(e,target,dt);
 if(e.type!==10||e.skill||e.frozen>0||e.stagger>0)return;
 const d=Math.max(1,dist(e,target)),speed=e.speed*.32*Math.sin((e.phase||0)*2+.8);e.x=clamp(e.x-(target.y-e.y)/d*speed*dt,70,(bounds.width||ARENA_W)-70);e.y=clamp(e.y+(target.x-e.x)/d*speed*dt,70,(bounds.height||ARENA_H)-70);
}
export function bestiaryDeath(w,e){if(e.type===9)poison(w,e,e,.65,2.2);}
export function stepBestiaryHazard(w,h,dt,hurt){
 if(stepDuskHazard(w,h,dt,hurt)||stepWeb(w,h,dt,hurt))return true;
 if(h.kind==='spores'){
  if(h.wait<=0){h.tick-=dt;if(h.tick<=0){h.tick=.7;for(const p of w.s.players)if(p.hp>0&&dist(p,h)<h.radius+12)hurt(w,p,h.damage);}}return true;
 }
 if(h.kind==='slam'){
  if(h.wait<=0&&!h.fired){h.fired=true;for(const p of w.s.players)if(p.hp>0&&dist(p,h)<h.radius+12)hurt(w,p,h.damage);}return true;
 }
 return false;
}
export function drawBestiaryWarnings(renderer,s,time){
 const c=renderer.ctx,tau=Math.PI*2;drawExpandedWarnings(renderer,s);drawDuskWarnings(renderer,s);
 for(const e of s.enemies||[]){
  if(e.type===8&&(e.skill==='pounce'||e.chargeLeft>0)){
   const a=e.chargeAngle??e.attackAngle,ready=e.skill==='pounce';c.save();c.strokeStyle=ready?'#eab17b':'#f6d5a1';c.globalAlpha=ready?.65:.35;c.lineWidth=2;c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(a)*148,e.y+Math.sin(a)*148);c.stroke();
   for(const sign of [-1,1]){c.beginPath();c.moveTo(e.x+Math.cos(a+sign*.2)*55,e.y+Math.sin(a+sign*.2)*55);c.lineTo(e.x+Math.cos(a)*78,e.y+Math.sin(a)*78);c.stroke();}c.restore();
  }
  if(e.type===10&&e.skill==='volley'&&!e.burstRemaining){c.save();c.strokeStyle='#ffb483';c.globalAlpha=.55;c.lineWidth=1.5;c.setLineDash([8,7]);c.beginPath();c.moveTo(e.x,e.y-20);c.lineTo(e.x+Math.cos(e.attackAngle)*350,e.y-20+Math.sin(e.attackAngle)*350);c.stroke();c.restore();}
  if(e.type===11&&e.skill==='summon'){
   c.save();c.strokeStyle='#d5a6b5';c.globalAlpha=.6;c.lineWidth=2;c.beginPath();c.ellipse(e.x,e.y+9,52,22,0,0,tau);c.stroke();
   for(let i=0;i<5;i++){const a=i*tau/5+(renderer.feedback.reducedMotion?0:time*.7);c.fillStyle='#e4c395';c.fillRect(e.x+Math.cos(a)*45-2,e.y+9+Math.sin(a)*18-2,4,4);}c.restore();
  }
 }
}
export function drawBestiaryHazard(renderer,h,time){
 if(drawDuskHazard(renderer,h)||drawWeb(renderer,h))return true;
 if(h.kind!=='spores'&&h.kind!=='slam')return false;
 const c=renderer.ctx,tau=Math.PI*2,ready=h.wait<=0,progress=Math.max(0,Math.min(1,1-h.wait/(h.delay||1)));
 c.save();c.strokeStyle=ready?'#ef826c':'#efba81';c.lineWidth=2;c.fillStyle=ready?'#d878492b':'#d5a47013';c.beginPath();c.arc(h.x,h.y,h.radius,0,tau);c.fill();c.stroke();
 c.strokeStyle='#f9db9e';c.lineWidth=2;c.beginPath();c.arc(h.x,h.y,h.radius*.86,-Math.PI/2,-Math.PI/2+tau*progress);c.stroke();
 if(h.kind==='spores')for(let i=0;i<9;i++){const a=i*2.4,r=h.radius*(.2+.6*((i*7)%11)/11),phase=renderer.feedback.reducedMotion?0:Math.sin(time*3+i)*7;c.fillStyle=i%2?'#ddac74':'#b98468';c.globalAlpha=ready?.7:.28;c.fillRect(Math.round((h.x+Math.cos(a)*r)/2)*2,Math.round((h.y+Math.sin(a)*r+phase)/2)*2,4,4);}
 else if(ready){c.globalAlpha=Math.max(0,h.life/.35);c.strokeStyle='#f1c58c';c.lineWidth=5;c.beginPath();c.arc(h.x,h.y,h.radius*Math.max(0,1-h.life/.7),0,tau);c.stroke();for(let i=0;i<8;i++){const a=i*tau/8;c.beginPath();c.moveTo(h.x+Math.cos(a)*20,h.y+Math.sin(a)*20);c.lineTo(h.x+Math.cos(a)*h.radius*.9,h.y+Math.sin(a)*h.radius*.9);c.stroke();}}
 c.restore();return true;
}
export function drawBestiaryBullet(renderer,b,time=0){
 if(drawDuskBullet(renderer,b,time))return true;
 if(b.kind!=='bolt')return false;const c=renderer.ctx,a=Math.atan2(b.vy,b.vx);c.save();c.translate(Math.round(b.x),Math.round(b.y));c.rotate(a);c.strokeStyle='#131923';c.lineWidth=10;c.beginPath();c.moveTo(-30,0);c.lineTo(13,0);c.stroke();c.strokeStyle='#ef9b73';c.lineWidth=5;c.stroke();c.strokeStyle='#ffe7af';c.lineWidth=2;c.stroke();c.fillStyle='#f8d3a0';c.beginPath();c.moveTo(19,0);c.lineTo(5,-7);c.lineTo(8,0);c.lineTo(5,7);c.closePath();c.fill();c.restore();return true;
}
