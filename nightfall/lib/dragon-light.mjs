import {ownsWeapon,weaponScale,weaponCooldown} from './equipment.mjs';
import {ARENA_W,ARENA_H} from './arena.mjs';
import {segmentDistance} from './counterfire.mjs';
import {drawWyvern,drawWyvernFire,drawWyvernClaw} from './wyvern-presentation.mjs';
const tau=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const ULTRA_SKILL={duration:15,cooldown:90,punchCooldown:.45,height:216};
export const hasUltra=p=>ownsWeapon(p,'lightrod')&&p.evolutions?.lightrod==='ultraman';
export const ultraActive=(p,time)=>!!p&&p.hp>0&&p.connected!==false&&hasUltra(p)&&(p.ultraUntil||0)>time;
const lightPower=p=>1+(p.ranks.lightgene||0)*.12;
const aim=(from,to)=>Math.atan2(to.y-from.y,to.x-from.x);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function field(w,p,kind,options){const life=options.life;w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:kind==='ultrapunch'?'lightrod':'drogon',kind,wait:0,tick:0,max:life,...options});}
function consume(p,input,key){const n=input?.[key];if(!Number.isSafeInteger(n)||n<=0||n<=(p[key]||0))return false;p[key]=n;return true;}
/** Only simulated playing time counts, beginning when both components coexist. */
export function stepLightState(w,p,input,dt){
 if(ownsWeapon(p,'lightrod')&&p.ranks.lightgene>0)p.lightBond=Math.min(181,Math.round(((p.lightBond||0)+dt)*1e6)/1e6);
 else p.lightBond=0;
 const activate=consume(p,input,'transformSeq'),punch=consume(p,input,'punchSeq');
 if(!hasUltra(p)||p.hp<=0||p.connected===false||p.choices.length||w.s.upgradePaused)return;
 if(activate&&!ultraActive(p,w.s.time)&&w.s.time>=(p.ultraReadyAt||0)){
  p.ultraAt=w.s.time;p.ultraUntil=w.s.time+ULTRA_SKILL.duration;p.ultraReadyAt=w.s.time+ULTRA_SKILL.cooldown;p.ultraBeamCd=0;p.punchReadyAt=0;
  w.effect(p.x,p.y,'forge',.7,145);w.events.push('forge');
 }
 if(punch&&ultraActive(p,w.s.time)&&w.s.time>=(p.punchReadyAt||0)){
  const target=w.targets().filter(e=>e.hp>0).reduce((a,e)=>!a||dist(p,e)<dist(p,a)?e:a,null);
  const angle=Number.isFinite(input.aim)?input.aim:target?aim(p,target):p.face<0?Math.PI:0;
  p.ultraPunchAt=w.s.time;p.ultraPunchAngle=angle;p.punchReadyAt=w.s.time+ULTRA_SKILL.punchCooldown;
  if(Math.abs(Math.cos(angle))>.1)p.face=Math.cos(angle)<0?-1:1;
  field(w,p,'ultrapunch',{x:p.x,y:p.y-12,angle,halfAngle:.75,radius:180*weaponScale(p),damage:p.damage*9*lightPower(p),life:.28,hit:[]});w.events.push('shoot');
 }
}
/** One companion per player. The egg only collides; fire appears after fusion. */
export function stepDragonLightArsenal(w,p,dt,target,cast){
 if(!ownsWeapon(p,'drogon'))p.dragon=null;
 else{
  const evolved=p.evolutions.drogon==='wyvern',rank=p.ranks.drogon;
  let d=p.dragon;
  if(!d||d.evolved!==evolved)d=p.dragon={id:w.nextId(),x:p.x-65,y:p.y-20,phase:'orbit',cooldown:.25,breath:0,evolved,angle:0,hit:[]};
  d.cooldown-=dt;d.breath-=dt;
  if(evolved&&target&&d.breath<=0&&dist(d,target)<600){
   d.breath=weaponCooldown(p,2.8);d.breathUntil=w.s.time+.65;d.angle=aim(d,target);
   field(w,p,'dragonfire',{x:d.x,y:d.y,angle:d.angle,halfAngle:.38,radius:340*weaponScale(p),damage:p.damage*(.65+rank*.18),life:.65});
  }
  if(d.phase==='orbit'){
   const a=w.s.time*.85,tx=p.x-70+Math.cos(a)*20,ty=p.y-25+Math.sin(a)*28;
   d.x+=(tx-d.x)*Math.min(1,dt*7);d.y+=(ty-d.y)*Math.min(1,dt*7);
   if(target&&d.cooldown<=0){d.angle=aim(d,target);d.phase='charge';d.left=clamp(dist(d,target)/(evolved?700:480)+.13,.2,.8);d.chargeAt=w.s.time;d.chargeSpan=d.left;d.hit=[];}
  }else if(d.phase==='charge'){
   const ox=d.x,oy=d.y,speed=(evolved?720:470+rank*26);
   d.x=clamp(d.x+Math.cos(d.angle)*speed*dt,70,(w.s.width||ARENA_W)-70);d.y=clamp(d.y+Math.sin(d.angle)*speed*dt,70,(w.s.height||ARENA_H)-70);d.left-=dt;
   const radius=(evolved?38:22)*weaponScale(p);w.guard(p,'drogon',{kind:'line',x:ox,y:oy,tx:d.x,ty:d.y,radius});
   for(const e of w.targets())if(e.hp>0&&!d.hit.includes(e.id)&&segmentDistance(e.x,e.y,ox,oy,d.x,d.y)<e.size+radius){d.hit.push(e.id);w.damage(e,p.damage*(evolved?3.5+rank*.55:1.4+rank*.35),p,d,'drogon');if(evolved)field(w,p,'dragonclaw',{x:e.x,y:e.y,angle:d.angle,radius:55,damage:0,life:.22});}
   if(d.left<=0){d.phase='return';d.returnAt=w.s.time;}
  }else{
   const to={x:p.x-65,y:p.y-25},distance=dist(d,to),step=Math.min(distance,(evolved?580:420)*dt),a=aim(d,to);d.x+=Math.cos(a)*step;d.y+=Math.sin(a)*step;
   if(distance<30){d.phase='orbit';d.cooldown=weaponCooldown(p,evolved?1.3:1.8);}
  }
 }
 if(ultraActive(p,w.s.time)){
  p.ultraBeamCd=(p.ultraBeamCd||0)-dt;
  if(target&&p.ultraBeamCd<=0&&w.s.time>=(p.punchReadyAt||0)){
   p.ultraBeamCd=.9;p.ultraBeamUntil=w.s.time+.36;
   const face=target.x<p.x?-1:1,angle=aim({x:p.x+45*face,y:p.y-94},target);p.ultraBeamAngle=angle;p.face=face;
   w.s.beams.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'lightrod',kind:'ultralight',angle,length:840,width:34*weaponScale(p),damage:p.damage*3*lightPower(p),life:.36,max:.36,tick:0,follow:false});
  }
 }else cast('lightrod',1.25,rank=>{
  const a=aim(p,target);for(let i=0;i<1+(p.ranks.volley||0);i++){
   const angle=a+(i-(p.ranks.volley||0)/2)*.14;
   w.s.shots.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'lightrod',kind:'lightbolt',x:p.x,y:p.y-10,vx:Math.cos(angle)*640,vy:Math.sin(angle)*640,angle,damage:p.damage*(1+rank*.25)*lightPower(p),life:1.2,scale:weaponScale(p),hit:[],pierce:2+Math.floor(rank/2),sprite:74});
  }
 });
}
export function stepDragonLightField(w,z,p){
 if(!['dragonfire','dragonclaw','ultrapunch'].includes(z.kind))return false;
 if(z.kind==='dragonclaw')return true;
 if(z.kind==='ultrapunch'&&!ultraActive(p,w.s.time)){z.life=0;return true;}
 const shape={kind:'cone',x:z.x,y:z.y,radius:z.radius,angle:z.angle,halfAngle:z.halfAngle};w.guard(p,z.weapon,shape);
 if(z.kind==='dragonfire'&&z.tick>0)return true;
 if(z.kind==='dragonfire')z.tick=.16;
 for(const e of w.targets()){
  const delta=aim(z,e)-z.angle;
  if(e.hp>0&&dist(z,e)<z.radius+e.size&&Math.abs(Math.atan2(Math.sin(delta),Math.cos(delta)))<z.halfAngle&&(!z.hit||!z.hit.includes(e.id))){z.hit?.push(e.id);w.damage(e,z.damage,p,z,z.weapon);}
 }
 return true;
}
function sprite(r,column,row,x,y,size,face=1,angle=0){
 const atlas=r.dragonLightAtlas;if(!atlas?.complete||!atlas.naturalWidth)return false;
 const c=r.ctx;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.scale(face,1);c.drawImage(atlas,column*128,row*128,128,128,-size/2,-size*.82,size,size);c.restore();return true;
}
export function drawDragonCompanion(r,p,time){
 const d=p.dragon;if(!d||p.hp<=0||p.connected===false||!ownsWeapon(p,'drogon'))return;
 const c=r.ctx,reduced=r.feedback.reducedMotion,charging=d.phase==='charge';
 c.save();c.globalAlpha=r.weaponFX.opacity(p.id);c.fillStyle='#040c11';c.globalAlpha*=.35;c.beginPath();c.ellipse(d.x,d.y+10,d.evolved?48:20,d.evolved?15:8,0,0,tau);c.fill();c.globalAlpha=r.weaponFX.opacity(p.id);
 if(d.evolved)drawWyvern(r,d,p,time);
 else sprite(r,charging?1:0,0,d.x,d.y,68,1,charging&&!reduced?Math.sin(time*20)*.25:0);
 c.restore();
}
export function drawUltraPlayer(r,p,time){
 if(!ultraActive(p,time))return false;
 const c=r.ctx,reduced=r.feedback.reducedMotion,age=time-(p.ultraAt||0),punch=time-(p.ultraPunchAt??-100)<.28,beam=(p.ultraBeamUntil||0)>time;
 c.save();c.fillStyle='#050d15';c.globalAlpha=.35;c.beginPath();c.ellipse(p.x,p.y+10,49,17,0,0,tau);c.fill();c.globalAlpha=1;
 const frame=age<.35?5:punch?4:beam?3:p.moving?(reduced?1:1+Math.floor(time*9)%2):0;
 sprite(r,frame,1,p.x,p.y,ULTRA_SKILL.height,p.face||1);
 // A small shield rim and chest lamp show invulnerability without hiding the sprite.
 c.strokeStyle='#a3e7f0';c.globalAlpha=.35;c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y-76,75,105,0,0,tau);c.stroke();
 if(age<.65&&!reduced){c.strokeStyle='#f3efd2';c.globalAlpha=(1-age/.65)*.6;c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y+6,30+age*110,10+age*35,0,0,tau);c.stroke();}
 c.restore();return true;
}
export function drawDragonLightShot(r,b){
 if(b.kind!=='lightbolt')return false;
 const c=r.ctx;c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));c.fillStyle='#81c2d6';c.fillRect(-22,-4,31,8);c.fillStyle='#fff3cf';c.fillRect(-7,-2,25,4);c.fillStyle='#fffaf1';c.fillRect(15,-1,6,2);c.restore();return true;
}
export function drawDragonLightField(r,z,time){
 if(!['dragonfire','dragonclaw','ultrapunch'].includes(z.kind))return false;
 const c=r.ctx,t=clamp(1-z.life/z.max,0,1);c.save();c.translate(z.x,z.y);c.rotate(z.angle||0);
 if(z.kind==='dragonfire'){
  drawWyvernFire(r,z,time);
 }else if(z.kind==='dragonclaw'){
  drawWyvernClaw(r,z);
 }else{
  c.globalAlpha=1-t;c.strokeStyle='#c9e9ef';c.lineWidth=9;c.beginPath();c.arc(0,0,z.radius*.85,-.7,.7);c.stroke();c.strokeStyle='#fff7e1';c.lineWidth=2;c.beginPath();c.arc(0,0,z.radius*.91,-.65,.65);c.stroke();
  c.fillStyle='#93c2d35c';c.fillRect(40,-22,z.radius-40,44);
 }
 c.restore();return true;
}
export function drawUltraBeam(r,b,time){
 if(b.kind!=='ultralight')return false;
 const c=r.ctx;c.save();c.translate(b.x,b.y);c.rotate(b.angle);const fade=clamp(b.life/.12,0,1);c.globalAlpha=r.weaponFX.opacity(b.owner)*fade;
 c.fillStyle='#85c8e52b';c.fillRect(0,-b.width,b.length,b.width*2);
 c.fillStyle='#91d4e9';c.fillRect(0,-b.width/2,b.length,b.width);c.fillStyle='#fff9df';c.fillRect(0,-b.width*.16,b.length,b.width*.32);
 for(let i=0;i<18;i++){const x=((i*61+(r.feedback.reducedMotion?0:time*650))%b.length);c.fillStyle='#eafaff';c.fillRect(x,-b.width/2-(i%2)*4,13,4);}
 c.restore();return true;
}
