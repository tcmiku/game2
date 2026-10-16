/** Ordinary foes: all attacks run on the host and use the existing bounded pools. */
export const DUSK_TYPES={
 16:{name:'苔甲卫',hp:86,speed:47,size:24,height:108,xp:3,damage:10,from:55,weight:8},
 17:{name:'枯镰侍',hp:62,speed:76,size:22,height:116,xp:3,damage:12,from:100,weight:8},
 18:{name:'烬角兽',hp:105,speed:63,size:28,height:112,xp:4,damage:15,from:160,weight:7},
 19:{name:'缚骨鸦',hp:49,speed:83,size:20,height:100,xp:3,damage:9,from:195,weight:8},
};
const tau=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const SWEEPS={16:{radius:100,halfAngle:.65,damage:15},17:{radius:148,halfAngle:1.12,damage:18}};
export const DUSK_WINDUP={16:.75,17:.9,18:.85,19:.7};
export const EMBER_CHARGE={speed:440,duration:.62};
export const BONEWING={speed:300,outbound:1.2,life:2.5,radius:14};

export function duskDamageMultiplier(e,source,time){
 if(e.type!==16||!Number.isFinite(e.guardAngle)||e.frozen>0||e.stagger>0||e.skill||time<(e.guardOpenUntil||0))return 1;
 return Math.abs(angleDiff(aim(e,source),e.guardAngle))<Math.PI*.36?.5:1;
}
function sweep(w,e){
 if(w.s.hazards.length>=48)return;
 const def=SWEEPS[e.type];
 w.s.hazards.push({id:w.nextId(),owner:e.id,kind:'duskSweep',x:e.tx,y:e.ty,angle:e.castAngle,
  radius:def.radius,halfAngle:def.halfAngle,wait:0,life:.26,fired:false,damage:def.damage*(1+(e.elite||0)*.25)*(e.damageScale||1)});
}
export function stepDuskAttack(w,e,p,dt){
 if(!DUSK_TYPES[e.type])return false;
 if(e.type===16&&!e.skill)e.guardAngle=aim(e,p);
 e.skillCd=(e.skillCd??1.6)-dt;
 e.recoverLeft=Math.max(0,(e.recoverLeft||0)-dt);if(e.recoverLeft>0)return true;
 if(e.skill){
  e.windup-=dt;if(e.windup>0)return true;
  if(SWEEPS[e.type]){sweep(w,e);e.guardOpenUntil=w.s.time+.6;e.recoverLeft=.45;}
  else if(e.type===18){e.chargeLeft=EMBER_CHARGE.duration;e.chargeSpeed=EMBER_CHARGE.speed;}
  else if(w.s.hostile.length<160){
   w.s.hostile.push({id:w.nextId(),owner:e.id,sourceType:e.type,kind:'bonewing',cancellable:true,
    x:e.x,y:e.y,vx:Math.cos(e.castAngle)*BONEWING.speed,vy:Math.sin(e.castAngle)*BONEWING.speed,radius:BONEWING.radius,
    life:BONEWING.life,turnIn:BONEWING.outbound,returned:false,damage:12*(1+(e.elite||0)*.25)*(e.damageScale||1)});
  }
  e.skill='';e.skillCd={16:3.8,17:4.5,18:5.4,19:4.1}[e.type];return true;
 }
 const range={16:175,17:235,18:490,19:540}[e.type];
 if(e.skillCd<=0&&!(e.chargeLeft>0)&&dist(e,p)<range){
  e.skill={16:'guardBash',17:'reap',18:'emberRush',19:'bonecast'}[e.type];
  e.windup=DUSK_WINDUP[e.type];e.attackAt=w.s.time;e.attackAngle=e.castAngle=aim(e,p);
  e.tx=e.x;e.ty=e.y;if(e.type===18)e.chargeAngle=e.castAngle;
 }
 return true;
}
export function duskMotion(e,d){
 if(!DUSK_TYPES[e.type])return null;
 if(e.skill||e.chargeLeft>0||e.recoverLeft>0)return 0;
 if(e.type===19)return d>350?1:d<245?-.6:0;
 return 1;
}
/** Return along the original lane; it never retargets a player mid-flight. */
export function stepDuskBullet(b,dt){
 if(b.kind!=='bonewing'||b.returned)return;
 if(b.turnIn<=0){b.vx=-b.vx;b.vy=-b.vy;b.returned=true;}
 else b.turnIn=Math.max(0,b.turnIn-dt);
}
/** Player body overlaps a sector, including its two straight edges. */
export function touchesSweep(h,p){
 const d=dist(h,p),delta=Math.abs(angleDiff(aim(h,p),h.angle));
 if(d<=14)return true;
 if(d>h.radius+14)return false;
 if(delta<=h.halfAngle)return true;
 const edge=h.angle+(angleDiff(aim(h,p),h.angle)<0?-h.halfAngle:h.halfAngle);
 const ex=Math.cos(edge),ey=Math.sin(edge),projection=clamp((p.x-h.x)*ex+(p.y-h.y)*ey,0,h.radius);
 return Math.hypot(p.x-h.x-ex*projection,p.y-h.y-ey*projection)<=14;
}
export function stepDuskHazard(w,h,dt,hurt){
 if(h.kind!=='duskSweep')return false;
 if(h.wait<=0&&!h.fired){h.fired=true;for(const p of w.s.players)if(p.hp>0&&p.connected!==false&&touchesSweep(h,p))hurt(w,p,h.damage);}
 return true;
}
function sector(c,x,y,r,a,half){c.beginPath();c.moveTo(x,y);c.arc(x,y,r,a-half,a+half);c.closePath();}
export function drawDuskWarnings(r,s){
 const c=r.ctx;
 for(const e of s.enemies||[]){
  if(e.type===16&&Number.isFinite(e.guardAngle)&&!e.skill&&!(e.frozen>0)&&!(e.stagger>0)&&s.time>=(e.guardOpenUntil||0)){
   c.save();c.strokeStyle='#b4c4a0';c.lineWidth=3;c.globalAlpha=.45;c.beginPath();c.arc(e.x,e.y,34,e.guardAngle-.8,e.guardAngle+.8);c.stroke();c.restore();
  }
  if(!e.skill||!DUSK_TYPES[e.type])continue;
  const progress=clamp(1-e.windup/DUSK_WINDUP[e.type],0,1);
  c.save();c.strokeStyle=e.type===18?'#dcac77':'#d8c69c';c.fillStyle='#b99c6722';c.lineWidth=2;c.globalAlpha=.75;
  if(SWEEPS[e.type]){
   const def=SWEEPS[e.type];sector(c,e.tx,e.ty,def.radius,e.castAngle,def.halfAngle);c.fill();c.stroke();
   c.strokeStyle='#f2dfaf';c.beginPath();c.arc(e.tx,e.ty,def.radius*.9,e.castAngle-def.halfAngle,e.castAngle-def.halfAngle+def.halfAngle*2*progress);c.stroke();
  }else{
   const length=e.type===18?EMBER_CHARGE.speed*EMBER_CHARGE.duration:BONEWING.speed*BONEWING.outbound,width=e.type===18?e.size:BONEWING.radius;
   c.translate(e.tx,e.ty);c.rotate(e.castAngle);c.fillRect(0,-width,length,width*2);c.setLineDash([7,6]);c.strokeRect(0,-width,length,width*2);
   c.setLineDash([]);c.beginPath();c.moveTo(length-14,-7);c.lineTo(length,0);c.lineTo(length-14,7);c.stroke();
   c.fillStyle='#e0c598';c.fillRect(0,-2,length*progress,4);
  }
  c.restore();
 }
}
export function drawDuskHazard(r,h){
 if(h.kind!=='duskSweep')return false;
 const c=r.ctx;c.save();c.globalAlpha=clamp(h.life/.26,0,1)*.7;c.fillStyle='#d8bd7833';c.strokeStyle='#efe2b8';c.lineWidth=3;
 sector(c,h.x,h.y,h.radius,h.angle,h.halfAngle);c.fill();c.stroke();c.restore();return true;
}
export function drawDuskBullet(r,b,time){
 if(b.kind!=='bonewing')return false;
 const c=r.ctx;c.save();c.translate(Math.round(b.x),Math.round(b.y));c.rotate(r.feedback.reducedMotion?0:time*12);
 for(let i=0;i<3;i++){c.rotate(tau/3);c.fillStyle='#15202a';c.fillRect(-4,-21,8,23);c.fillRect(-4,-22,15,7);c.fillStyle=b.returned?'#d3b48d':'#d4dbc2';c.fillRect(-2,-19,4,18);c.fillRect(-2,-20,10,3);c.fillStyle='#8a9e9a';c.fillRect(-1,-15,2,8);}
 c.fillStyle='#f5dfad';c.fillRect(-3,-3,6,6);c.restore();return true;
}
