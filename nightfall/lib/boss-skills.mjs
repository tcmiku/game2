import {arenaBounds} from './arena.mjs';
import {segmentDistance} from './counterfire.mjs';
const tau=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
export const BOSS_SKILLS={roots:['thorns','roots','charge','thornwall','stomp'],prism:['ray','shards','crossray','prismcage','refraction'],halo:['halo','starfall','orbit','comet','eclipse'],ribbon:['dash','rift','scissor','rifttrail','execution']};
export const BOSS_SKILL_NAMES={thorns:'荆棘齐射',roots:'追猎根刺',charge:'裂木冲锋',thornwall:'荆棘封路',stomp:'古木震荡',ray:'蓄能贯射',shards:'折光散弹',crossray:'棱镜十字',prismcage:'折光围牢',refraction:'三重折射',halo:'缺口环波',starfall:'连环星坠',orbit:'星轨围剿',comet:'彗星追猎',eclipse:'蚀月坠界',dash:'连续突进',rift:'裂界横扫',scissor:'交错裂刃',rifttrail:'裂地连冲',execution:'断界追斩'};
export const BOSS_TUNING={health:15600,speed:88,opening:.75,recovery:1.6,rageRecovery:.9,minWarning:.72};
export const BOSS_COLORS={roots:'#c6a37f',prism:'#a8cfde',halo:'#d3bcdf',ribbon:'#e2a493'};
const WARNING_COLORS={roots:'#efbc83',prism:'#b5e8f2',halo:'#ebcdf1',ribbon:'#f4b49e'};
const living=w=>w.s.players.filter(p=>p.hp>0&&p.connected!==false);
const raging=e=>e.hp<e.maxHp*.45;
function point(w,x,y){const{width,height}=arenaBounds(w.s);return{x:clamp(x,100,width-100),y:clamp(y,100,height-100)};}
function predicted(w,p,a){const input=w.inputs?.[p.id]||{},x=Number(input.x)||0,y=Number(input.y)||0,l=Math.hypot(x,y);return point(w,p.x+(l?x/l:Math.cos(a))*125,p.y+(l?y/l:Math.sin(a))*125);}
const line=(x,y,angle,length=660,width=30,wait=0,life=.65)=>({kind:'bossRay',x,y,angle,length,width,wait,life});
const circle=(x,y,radius=85,wait=0,kind='bossBurst')=>({kind,x,y,radius,wait,life:.4});
/** All target marks and angles lock before windup and travel in snapshots. */
export function planBossSkill(w,e,target,skill,follow=false){
 const theme=BOSS_SKILLS[e.bossKind]?e.bossKind:'roots',rage=raging(e),angle=aim(e,target),marks=[],shots=[];
 const base={thorns:.9,roots:1.05,charge:.95,thornwall:1.15,stomp:1.1,ray:1.15,shards:.9,crossray:1.15,prismcage:1.2,refraction:1.2,halo:1.1,starfall:1.1,orbit:1.05,comet:.95,eclipse:1.15,dash:follow?.72:.9,rift:1.05,scissor:1.05,rifttrail:1.05,execution:1.1}[skill]||1;
 const cast={skill,theme,rage,angle,x:e.x,y:e.y,duration:Math.max(BOSS_TUNING.minWarning,base-(rage&&!follow?.12:0)),marks,shots,follow};
 const radial=(count,speed,offset=0)=>shots.push({count,speed,offset,radial:true});
 const fan=(count,speed,spread)=>shots.push({count,speed,spread,offset:angle,radial:false});
 if(skill==='thorns'){radial(rage?22:18,250,angle+.1);cast.repeat=.32;}
 if(skill==='roots'||skill==='starfall'){
  for(const p of living(w)){
   const next=predicted(w,p,angle),kind=skill==='roots'?'bossBurst':'bossStar',delay=skill==='starfall'?.35:.15;
   marks.push(circle(p.x,p.y,skill==='roots'?88:82,delay,kind),circle(next.x,next.y,74,delay+.38,kind));
   if(rage){const side=point(w,p.x-Math.sin(angle)*125,p.y+Math.cos(angle)*125);marks.push(circle(side.x,side.y,70,delay+.7,kind));}
  }
 }
 if(skill==='charge'||skill==='dash'||skill==='rifttrail'){
  cast.chargeSpeed=skill==='charge'?760:skill==='rifttrail'?880:800;cast.chargeDuration=skill==='charge'?.72:skill==='rifttrail'?.52:.43;
  const length=cast.chargeSpeed*cast.chargeDuration,end=point(w,e.x+Math.cos(angle)*length,e.y+Math.sin(angle)*length);
  cast.lane={kind:'bossLane',x:e.x,y:e.y,angle,length,width:e.size*2};
  if(skill==='charge')marks.push(circle(end.x,end.y,145,cast.chargeDuration+.55));
  if(skill==='rifttrail')for(let i=1;i<=3;i++){
   const p=point(w,e.x+Math.cos(angle)*length*i/3,e.y+Math.sin(angle)*length*i/3);marks.push(circle(p.x,p.y,65,.55+i*.2));
  }
  if(skill==='dash'&&!follow)cast.chain=Array.from({length:rage?2:1},()=>({skill:'dash',delay:.35}));
  if(rage&&skill==='charge')cast.chain=[{skill:'stomp',delay:.3}];
  if(rage&&skill==='rifttrail')cast.chain=[{skill:'rift',delay:.3}];
 }
 if(skill==='thornwall')for(const offset of [-150,0,150]){
  const center=point(w,target.x+Math.cos(angle)*offset,target.y+Math.sin(angle)*offset);
  marks.push({...line(center.x+Math.sin(angle)*250,center.y-Math.cos(angle)*250,angle+Math.PI/2,500,26,0,1.25),kind:'bossLine'});
 }
 if(['stomp','halo','eclipse'].includes(skill)){
  const gap=angle+((e.skillIndex||0)%2?-1:1)*.95;
  marks.push({kind:'bossRing',x:e.x,y:e.y,radius:skill==='eclipse'?560:20,outer:skill==='halo'?520:560,gap,halfGap:rage?.44:.5,inward:skill==='eclipse',wait:0,life:1.65});
  if(rage&&skill==='halo')marks.push({...marks[0],wait:.5});
 }
 if(skill==='ray')marks.push(line(e.x,e.y,angle,1200,44,0,.65));
 if(skill==='shards'){radial(rage?20:16,245,angle+.12);fan(3,330,.4);}
 if(skill==='crossray'||skill==='scissor')for(const [i,a] of [angle+(skill==='scissor'?-.65:0),angle+(skill==='scissor'?.65:Math.PI/2)].entries()){
  marks.push(line(target.x-Math.cos(a)*390,target.y-Math.sin(a)*390,a,780,skill==='scissor'?26:32,i*(skill==='scissor'?.3:0),.6));
 }
 if(skill==='prismcage'){
  const x=target.x,y=target.y,r=145;
  marks.push({...line(x-r,y-r,0,r*2,24,0,1.7),kind:'bossLine'}, {...line(x+r,y-r,Math.PI/2,r*2,24,0,1.7),kind:'bossLine'}, {...line(x+r,y+r,Math.PI,r*2,24,0,1.7),kind:'bossLine'},circle(x,y,90,.75));
 }
 if(skill==='refraction')for(const [i,off] of [0,-.44,.44].entries())marks.push(line(e.x,e.y,angle+off,1200,28,i*.25,.55));
 if(skill==='orbit')marks.push({kind:'bossOrbit',x:e.x,y:e.y,radius:280,count:rage?5:4,angle:angle+.45,rate:.95,wait:0,life:2.8});
 if(skill==='comet'){fan(rage?4:3,220,.28);cast.homing=target.id;}
 if(skill==='rift')marks.push({kind:'bossSweep',x:e.x,y:e.y,angle:angle-.8,fromAngle:angle-.8,sweep:1.6,length:650,width:30,wait:0,life:1.15});
 if(skill==='execution'){
  cast.landing=point(w,target.x,target.y);marks.push(circle(cast.landing.x,cast.landing.y,155,.55));
 }
 if(rage&&!follow&&skill==='ray')cast.chain=[{skill:'shards',delay:.35}];
 if(rage&&!follow&&skill==='starfall')cast.chain=[{skill:'comet',delay:.35}];
 return cast;
}
function attackOwner(w,id){
 // Reuse one lookup table per host step; references still observe deaths immediately.
 const list=w.s.enemies;if(w.bossOwnerFrame!==w.s.frame||w.bossOwnerList!==list||w.bossOwnerSize!==list.length){w.bossOwnerFrame=w.s.frame;w.bossOwnerList=list;w.bossOwnerSize=list.length;w.bossOwners=new Map(list.map(e=>[e.id,e]));}
 const owner=w.bossOwners?.get(id);return owner?.hp>0?owner:null;
}
function hazard(w,e,mark){
 if(w.s.hazards.length>=48)return;
 const wait=mark.wait||0,life=mark.life||.4;
 w.s.hazards.push({id:w.nextId(),owner:e.id,boss:true,theme:e.bossKind||'roots',x:e.x,y:e.y,angle:0,radius:100,tick:0,age:0,damage:(24+(e.cycle||1)*3)*(e.damageScale||1),fired:false,...mark,wait,delay:wait,life:life+wait,max:life});
}
function shoot(w,e,origin,spec,homing){
 for(let i=0;i<spec.count&&w.s.hostile.length<160;i++){
  const a=spec.offset+(spec.radial?i*tau/spec.count:(i-(spec.count-1)/2)*spec.spread);
  w.s.hostile.push({id:w.nextId(),owner:e.id,sourceType:4,cancellable:false,bossShot:true,theme:e.bossKind||'roots',kind:homing?'bossComet':'thorn',x:origin.x,y:origin.y,vx:Math.cos(a)*spec.speed,vy:Math.sin(a)*spec.speed,radius:homing?11:9,damage:18*(e.damageScale||1),life:4.5,born:w.s.time,...(homing?{targetId:homing,homeLeft:.9,turnRate:.9}:{})});
 }
}
function begin(w,e,target,skill,follow=false){
 const cast=planBossSkill(w,e,target,skill,follow);e.skill=skill;e.bossCast=cast;e.windup=cast.duration;e.attackAngle=cast.angle;e.attackAt=w.s.time;
 if(cast.theme==='prism'&&['ray','crossray','refraction'].includes(skill))e.barrier=cast.duration;
}
function release(w,e,cast){
 if(cast.landing){e.x=cast.landing.x;e.y=cast.landing.y;}
 for(const mark of cast.marks)hazard(w,e,mark);
 for(const spec of cast.shots)shoot(w,e,cast,spec,cast.homing);
 if(cast.repeat)for(const spec of cast.shots)hazard(w,e,{kind:'bossVolley',x:cast.x,y:cast.y,radius:100,wait:cast.repeat,life:.15,spec});
 if(cast.chargeDuration){e.chargeAngle=cast.angle;e.chargeSpeed=cast.chargeSpeed;e.chargeLeft=cast.chargeDuration;}
 if(cast.chain&&!cast.follow)e.bossChain=cast.chain;
 if(!cast.follow)e.skillIndex=(e.skillIndex||0)+1;
 e.skill='';e.bossCast=null;e.barrier=0;e.comboSecond=false;e.dashesLeft=0;e.bossComboWait=e.bossChain?.[0]?.delay||0;
 e.skillCd=raging(e)?BOSS_TUNING.rageRecovery:BOSS_TUNING.recovery;
}
export function stepBossSkills(w,e,target,dt){
 if(e.type!==4)return false;
 e.bossKind=BOSS_SKILLS[e.bossKind]?e.bossKind:'roots';if(e.frozen>0)return true;
 e.barrier=Math.max(0,(e.barrier||0)-dt);
 e.skillCd=(e.skillCd??BOSS_TUNING.opening)-dt;
 if(e.skill){
  // Old in-progress encounters lack the plan but keep their pending attack.
  if(!e.bossCast){const locked=Number.isFinite(e.attackAngle)?{x:e.x+Math.cos(e.attackAngle)*350,y:e.y+Math.sin(e.attackAngle)*350}:target;e.bossCast=planBossSkill(w,e,locked,e.skill,!!e.comboSecond);e.windup=e.windup??Math.max(.05,e.skillCd);}
  e.windup-=dt;if(e.windup<=1e-8)release(w,e,e.bossCast);return true;
 }
 if(e.chargeLeft>0)return true;
 if(e.dashesLeft&&!e.bossChain?.length){e.bossChain=Array.from({length:Math.min(2,e.dashesLeft)},()=>({skill:'dash',delay:.35}));e.bossComboWait=e.dashPause??.35;e.dashesLeft=0;}
 if(e.bossChain?.length){
  e.bossComboWait=(e.bossComboWait||0)-dt;
  if(e.bossComboWait<=0){const next=e.bossChain.shift();begin(w,e,target,next.skill,true);}return true;
 }
 if(e.skillCd<=0)begin(w,e,target,BOSS_SKILLS[e.bossKind][(e.skillIndex||0)%5]);
 return true;
}
export function bossPursuit(e,distance){
 if(e.type!==4)return null;
 if(e.skill||e.chargeLeft>0||e.bossChain?.length)return 0;
 const melee=e.bossKind==='roots'||e.bossKind==='ribbon',speed=raging(e)?1.25:1;
 return(melee?(distance>190?1.1:.35):distance>330?1:distance<160?-.2:.45)*speed;
}
export function stepBossPattern(w,h,dt,hurt){
 if(!(h.kind||'').startsWith('boss'))return false;
 const owner=attackOwner(w,h.owner);if(!owner){h.life=0;return true;}if(h.wait>0||h.life<=0)return true;
 if(h.kind==='bossVolley'){if(!h.fired){h.fired=true;shoot(w,owner,h,h.spec);}return true;}
 if(h.kind==='bossStar'||h.kind==='bossBurst'){
  if(!h.fired){h.fired=true;for(const p of living(w))if(Math.hypot(p.x-h.x,p.y-h.y)<h.radius+14)hurt(w,p,h.damage);}return true;
 }
 h.age=(h.age||0)+dt;
 if(h.kind==='bossRing')h.radius=h.inward?Math.max(20,h.outer-h.age/h.max*(h.outer-20)):Math.min(h.outer,20+h.age/h.max*(h.outer-20));
 if(h.kind==='bossSweep')h.angle=h.fromAngle+h.sweep*Math.min(1,h.age/h.max);
 h.tick=(h.tick||0)-dt;if(h.tick>0)return true;h.tick=.12;
 for(const p of living(w)){
  if(h.kind==='bossRing'){
   const d=Math.hypot(p.x-h.x,p.y-h.y),a=aim(h,p),gap=Math.abs(Math.atan2(Math.sin(a-h.gap),Math.cos(a-h.gap)));
   if(Math.abs(d-h.radius)<26&&gap>h.halfGap)hurt(w,p,h.damage);
  }else if(h.kind==='bossOrbit'){
   for(let i=0;i<h.count;i++){const a=h.angle+i*tau/h.count+h.age*h.rate;if(Math.hypot(p.x-h.x-Math.cos(a)*h.radius,p.y-h.y-Math.sin(a)*h.radius)<48)hurt(w,p,h.damage);}
  }else if(segmentDistance(p.x,p.y,h.x,h.y,h.x+Math.cos(h.angle)*h.length,h.y+Math.sin(h.angle)*h.length)<14+h.width/2)hurt(w,p,h.damage);
 }
 return true;
}
export function stepBossBullet(w,b,dt){
 if(!b.bossShot)return;
 if(!attackOwner(w,b.owner)){b.life=0;return;}
 if(b.homeLeft>0){
  b.homeLeft=Math.max(0,b.homeLeft-dt);const p=w.s.players.find(p=>p.id===b.targetId&&p.hp>0&&p.connected!==false);if(!p)return;
  const a=Math.atan2(b.vy,b.vx),delta=Math.atan2(Math.sin(aim(b,p)-a),Math.cos(aim(b,p)-a)),next=a+clamp(delta,-b.turnRate*dt,b.turnRate*dt),speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(next)*speed;b.vy=Math.sin(next)*speed;
 }
}

function stroke(c,x,y,angle,length,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(angle)*length,y+Math.sin(angle)*length);c.stroke();}
function ring(c,x,y,radius,color,width=2,start=0,end=tau){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(0,radius),start,end);c.stroke();}
/** Same plan records draw the warning and resolve damage; reduced motion only removes decoration. */
function shape(r,h,ready=false){
 const c=r.ctx,color=(ready?BOSS_COLORS:WARNING_COLORS)[h.theme]||WARNING_COLORS.roots,hairline=Math.max(2,2/(r.combatZoom||1));c.save();c.globalAlpha=ready?.85:.82;c.setLineDash(ready?[]:[7,5]);
 if(['bossStar','bossBurst'].includes(h.kind)){
  c.fillStyle=ready?color+'40':color+'25';c.beginPath();c.arc(h.x,h.y,h.radius,0,tau);c.fill();ring(c,h.x,h.y,h.radius,color,hairline);
  if(!ready&&h.progress>0){c.setLineDash([]);ring(c,h.x,h.y,h.radius*.88,'#f8dfb0',hairline,-Math.PI/2,-Math.PI/2+tau*h.progress);}
  stroke(c,h.x-12,h.y,0,24,'#f4deaf',2);stroke(c,h.x,h.y-12,Math.PI/2,24,'#f4deaf',2);
  if(ready){c.setLineDash([]);for(let i=0;i<6;i++){const a=i*tau/6,x=h.x+Math.cos(a)*h.radius*.64,y=h.y+Math.sin(a)*h.radius*.64;c.fillStyle=color;c.fillRect(Math.round(x)-3,Math.round(y)-6,6,12);}}
 }else if(h.kind==='bossRing'){
  const radius=ready?h.radius:h.inward?h.outer:Math.min(h.outer,125);
  ring(c,h.x,h.y,radius,color,ready?10:hairline,h.gap+h.halfGap,h.gap+tau-h.halfGap);c.setLineDash([]);
  if(ready)ring(c,h.x,h.y,radius,'#f0e5c7',2,h.gap+h.halfGap,h.gap+tau-h.halfGap);
  for(const off of [-h.halfGap,h.halfGap])stroke(c,h.x+Math.cos(h.gap+off)*(radius-18),h.y+Math.sin(h.gap+off)*(radius-18),h.gap+off,36,'#9fd3b3',3);
  if(!ready)for(const off of [-h.halfGap,h.halfGap])stroke(c,h.x,h.y,h.gap+off,h.outer,'#9fd3b366',1);
 }else if(h.kind==='bossOrbit'){
  ring(c,h.x,h.y,h.radius,color+'70',1);
  for(let i=0;i<h.count;i++){const a=h.angle+i*tau/h.count+(ready?(h.age||0)*h.rate:0),x=h.x+Math.cos(a)*h.radius,y=h.y+Math.sin(a)*h.radius;ring(c,x,y,34,color,hairline);if(ready){c.fillStyle=color;c.fillRect(Math.round(x)-8,Math.round(y)-8,16,16);c.fillStyle='#f6eacb';c.fillRect(Math.round(x)-3,Math.round(y)-3,6,6);}}
 }else if(h.kind==='bossVolley')ring(c,h.x,h.y,100,color,2);
 else if(h.kind==='bossSweep'&&!ready){
  ring(c,h.x,h.y,h.length,color,2,h.fromAngle,h.fromAngle+h.sweep);
  for(const a of [h.fromAngle,h.fromAngle+h.sweep])stroke(c,h.x,h.y,a,h.length,color,2);
 }else{
  const length=h.length,width=h.width||30;
  if(ready){c.setLineDash([]);stroke(c,h.x,h.y,h.angle,length,color+'55',width+8);stroke(c,h.x,h.y,h.angle,length,color,width);stroke(c,h.x,h.y,h.angle,length,'#fff0c8',3);}
  else{stroke(c,h.x,h.y,h.angle,length,color+'30',width);stroke(c,h.x,h.y,h.angle,length,color,hairline);for(const side of [-1,1])stroke(c,h.x-Math.sin(h.angle)*width/2*side,h.y+Math.cos(h.angle)*width/2*side,h.angle,length,color,hairline*.75);}
 }
 c.restore();
}
export function drawBossSkillWarnings(r,s,time=s.time){
 const c=r.ctx;for(const e of s.enemies||[]){
  const cast=e.bossCast;if(e.type!==4||!e.skill||!cast)continue;
  const drift=e.frozen>0?0:clamp(time-s.time,-.5,.12),progress=clamp(1-(e.windup-drift)/cast.duration,0,1);
  for(const mark of cast.marks)shape(r,{...mark,theme:cast.theme,progress},false);
  if(cast.lane)shape(r,{...cast.lane,theme:cast.theme},false);
  if(cast.shots.length){c.save();c.globalAlpha=.7;c.setLineDash([6,5]);ring(c,cast.x,cast.y,100,BOSS_COLORS[cast.theme],2);for(const spec of cast.shots)for(let i=0;i<spec.count;i++){const a=spec.offset+(spec.radial?i*tau/spec.count:(i-(spec.count-1)/2)*spec.spread);stroke(c,cast.x+Math.cos(a)*85,cast.y+Math.sin(a)*85,a,45,BOSS_COLORS[cast.theme],2);}c.restore();}
 }
}
export function drawBossPattern(r,h,time){
 if(!(h.kind||'').startsWith('boss'))return false;
 // Read the existing guest visual clock; motion between packets creates no damage.
 const drift=Number.isFinite(time)&&Number.isFinite(r.weaponFX?.simTime)?clamp(time-r.weaponFX.simTime,-.5,.12):0;
 let view=h;if(drift){
  const elapsed=h.wait>0?Math.max(0,drift-h.wait):drift;
  view={...h,wait:h.wait-drift,age:clamp((h.age||0)+elapsed,0,h.max||10)};
  if(view.wait<=0&&h.kind==='bossRing')view.radius=h.inward?Math.max(20,h.outer-view.age/h.max*(h.outer-20)):Math.min(h.outer,20+view.age/h.max*(h.outer-20));
  if(view.wait<=0&&h.kind==='bossSweep')view.angle=h.fromAngle+h.sweep*Math.min(1,view.age/h.max);
 }
 shape(r,view,view.wait<=0);return true;
}
export function drawBossBullet(r,b){
 if(!b.bossShot)return false;const c=r.ctx,angle=Math.atan2(b.vy,b.vx),color=BOSS_COLORS[b.theme]||BOSS_COLORS.roots;
 c.save();c.translate(Math.round(b.x),Math.round(b.y));c.rotate(angle);c.fillStyle='#121c2b';c.beginPath();c.moveTo(15,0);c.lineTo(-8,-8);c.lineTo(-15,0);c.lineTo(-8,8);c.closePath();c.fill();
 c.fillStyle=color;c.beginPath();c.moveTo(11,0);c.lineTo(-6,-5);c.lineTo(-10,0);c.lineTo(-6,5);c.closePath();c.fill();c.fillStyle='#f7e8be';c.fillRect(-4,-2,10,4);
 if(b.kind==='bossComet'){c.fillStyle=color+'80';c.fillRect(-27,-3,17,6);c.fillStyle=color+'40';c.fillRect(-39,-2,12,4);}c.restore();return true;
}
