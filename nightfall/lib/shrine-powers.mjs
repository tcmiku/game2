import {normalizeShrines,SHRINE_POWERS} from './sanctuary.mjs';
import {collideDestructibles,ARENA_W,ARENA_H} from './frontier.mjs';
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),tau=Math.PI*2;
export const DODGE={duration:.22,distance:156,cooldown:2.4};
export const hasShrine=(p,key)=>(p?.shrines?.[key]||0)>0;
// Boons are frozen at departure. Old checkpoints lacking this field retain
// their previous rules rather than silently gaining abilities during takeover.
export const shrineLoadout=boons=>boons?.sanctuary?normalizeShrines(boons.sanctuary):{};
export const dodgeActive=(p,time)=>hasShrine(p,'stride')&&p.hp>0&&p.connected!==false&&(p.dashUntil||0)>time;
export const shrineInvulnerable=(p,time)=>dodgeActive(p,time)||(p.emberShieldUntil||0)>time;
export function cancelDodge(p){p.dashLeft=0;p.dashUntil=0;}
function consumed(p,input){const n=input?.dashSeq;if(!Number.isSafeInteger(n)||n<=0||n<=(p.dashSeq||0))return false;p.dashSeq=n;return true;}
/** Called once per authority step before movement. Failed presses never queue. */
export function stepDodge(w,p,input){
 const press=consumed(p,input);if(!press||!hasShrine(p,'stride')||p.hp<=0||p.connected===false||p.choices.length||w.s.upgradePaused||dodgeActive(p,w.s.time)||w.s.time<(p.dashReadyAt||0))return;
 let x=Number(input.x)||0,y=Number(input.y)||0,length=Math.hypot(x,y);
 if(length<.1){x=p.lastMoveX??p.face??1;y=p.lastMoveY??0;length=Math.hypot(x,y)||1;}
 p.dashDx=x/length;p.dashDy=y/length;p.dashAt=w.s.time;p.dashUntil=w.s.time+DODGE.duration;p.dashLeft=DODGE.duration;p.dashReadyAt=w.s.time+DODGE.cooldown;
 p.dashStartX=p.x;p.dashStartY=p.y;w.events.push('shoot');
}
/** Swept substeps keep the dash out of solid scenery and inside the arena. */
export function moveDodge(p,props,dt,time){
 if(!(p.dashLeft>0))return false;
 const used=Math.min(dt,p.dashLeft),distance=DODGE.distance/DODGE.duration*used,steps=Math.max(1,Math.ceil(distance/8)),stride=distance/steps;
 for(let i=0;i<steps;i++){
  const x=clamp(p.x+p.dashDx*stride,100,ARENA_W-100),y=clamp(p.y+p.dashDy*stride,100,ARENA_H-100);p.x=x;p.y=y;collideDestructibles(p,props);
  if(Math.hypot(p.x-x,p.y-y)>.5){p.dashLeft=0;p.dashUntil=time;return true;}
 }
 p.dashLeft=Math.max(0,p.dashLeft-used);if(p.dashLeft<1e-8)p.dashLeft=0;p.moving=true;if(p.dashDx)p.face=p.dashDx<0?-1:1;
 return true;
}
export function preventShrineDeath(w,p,damage){
 if(!hasShrine(p,'foundation')||p.emberGuardUsed||damage<p.hp)return false;
 p.emberGuardUsed=true;p.emberShieldUntil=w.s.time+1.5;p.hp=Math.max(1,p.maxHp*.25);p.hitCd=0;p.lastShrinePower={key:'foundation',at:w.s.time};
 w.s.effects.push({id:w.nextId(),type:'shrineRebirth',x:p.x,y:p.y,size:150,life:.75,max:.75});w.events.push('heal');return true;
}
export function shrineHurt(w,p){
 if(!hasShrine(p,'vigor')||p.hp<=0||w.s.time<(p.vigorReadyAt||0))return;
 p.vigorUntil=w.s.time+3;p.vigorReadyAt=w.s.time+12;p.vigorLeft=3;
}
export function stepShrinePassives(w,p,dt,target){
 if(p.vigorLeft>0){
  const used=Math.min(dt,p.vigorLeft);p.vigorLeft=Math.max(0,p.vigorLeft-used);p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.04*used);
  for(const e of w.s.enemies)if(e.hp>0&&e.type!==7&&Math.hypot(e.x-p.x,e.y-p.y)<112+e.size)e.slow=Math.max(e.slow||0,.35);
 }
 if(!hasShrine(p,'cadence')||!target||target.prop||w.s.time<(p.starReadyAt||0))return;
 p.starReadyAt=w.s.time+8;p.starAt=w.s.time;
 const angle=Math.atan2(target.y-p.y,target.x-p.x);
 for(let i=-1;i<=1;i++){const a=angle+i*.35;w.s.shots.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:SHRINE_POWERS.cadence.statKey,kind:'shrinemote',x:p.x+Math.cos(a)*18,y:p.y-16+Math.sin(a)*18,vx:Math.cos(a)*430,vy:Math.sin(a)*430,life:1.4,damage:p.damage*1.1,hit:[],pierce:2,homing:true,scale:1,sprite:19});}
}
export function shrineHit(w,p,target,weapon){
 if(!hasShrine(p,'might')||weapon===SHRINE_POWERS.might.statKey||w.s.time<(p.dawnReadyAt||0))return;
 p.dawnReadyAt=w.s.time+6;p.dawnAt=w.s.time;
 const a=Math.atan2(target.y-p.y,target.x-p.x);
 w.s.shots.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:SHRINE_POWERS.might.statKey,kind:'shrineblade',x:p.x,y:p.y-8,vx:Math.cos(a)*740,vy:Math.sin(a)*740,life:1,damage:p.damage*2,hit:[target.id],pierce:7,scale:1,sprite:20});
}
export function dodgeRotation(p,time,reduced=false){return dodgeActive(p,time)&&!reduced?(time-p.dashAt)/DODGE.duration*tau*(p.dashDx<0?-1:1):0;}
export function drawShrinePlayer(r,p,time){
 const c=r.ctx;if(p.hp<=0||p.connected===false)return;
 c.save();
 if(dodgeActive(p,time)){
  // Short moon-feather remnants follow the actual dash, including obstruction.
  c.fillStyle='#bddfe1';
  for(let i=1;i<=4;i++){c.globalAlpha=(1-i/5)*.55;const x=p.x-p.dashDx*i*10,y=p.y-22-p.dashDy*i*10;c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,10-i,3);}
 }
 if((p.emberShieldUntil||0)>time){
  c.globalAlpha=.65;c.strokeStyle='#e8cb8b';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y-27,33,49,0,0,tau);c.stroke();
  for(let i=0;i<5;i++){const a=i*tau/5;c.fillStyle='#f4dc9c';c.fillRect(Math.round(p.x+Math.cos(a)*31),Math.round(p.y-27+Math.sin(a)*47),3,3);}
 }
 if((p.vigorUntil||0)>time){
  const reduced=r.feedback.reducedMotion;c.strokeStyle='#91bfa2';c.lineWidth=2;c.globalAlpha=.65;
  c.beginPath();c.ellipse(p.x,p.y+4,72,25,0,0,tau);c.stroke();
  for(let i=0;i<10;i++){const a=i*tau/10+(reduced?0:time*.35),x=p.x+Math.cos(a)*72,y=p.y+Math.sin(a)*25;c.fillStyle=i%2?'#a4d3a5':'#d8e1b0';c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2-3,6,3);c.fillRect(Math.round(x/2)*2+2,Math.round(y/2)*2-6,3,7);}
 }
 c.restore();
}
export function drawShrineShot(r,b){
 if(!['shrineblade','shrinemote'].includes(b.kind))return false;
 const c=r.ctx;c.save();c.translate(b.x,b.y);c.rotate(Math.atan2(b.vy,b.vx));
 if(b.kind==='shrineblade'){c.fillStyle='#d4aa7d55';c.fillRect(-40,-9,62,18);c.fillStyle='#ead3ab';c.beginPath();c.moveTo(-22,-4);c.lineTo(31,0);c.lineTo(-22,4);c.closePath();c.fill();c.fillStyle='#fff6d7';c.fillRect(-20,-1,47,2);}
 else{c.fillStyle='#b7a2db6b';c.fillRect(-16,-4,24,8);c.fillStyle='#ddc4ed';c.fillRect(-5,-2,12,4);c.fillRect(-2,-7,4,14);c.fillStyle='#fff1d8';c.fillRect(-2,-2,5,5);}
 c.restore();return true;
}
export function drawShrineEffect(r,f){
 if(f.type!=='shrineRebirth')return false;
 const c=r.ctx,age=1-f.life/f.max,t=r.feedback.reducedMotion?.65:age;c.save();c.globalAlpha=(1-age)*.7;c.strokeStyle='#edc989';c.lineWidth=3;c.beginPath();c.ellipse(f.x,f.y,35+t*f.size,12+t*f.size*.45,0,0,tau);c.stroke();
 for(let i=0;i<12;i++){const a=i*tau/12,x=f.x+Math.cos(a)*t*f.size,y=f.y+Math.sin(a)*t*f.size*.45;c.fillStyle=i%2?'#f0d8a4':'#c5b692';c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,4,4);}
 c.restore();return true;
}
