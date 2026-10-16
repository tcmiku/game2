import {ownsWeapon,weaponScale,weaponDuration,weaponCooldown} from './equipment.mjs';

const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export const SWORD_SKILL={duration:3.5,cooldown:12,speed:1.65};
export const hasDualBlades=p=>ownsWeapon(p,'elucidator')&&p.evolutions?.elucidator==='dualblades';
export const swordSpinning=(p,time)=>p.hp>0&&p.connected!==false&&hasDualBlades(p)&&(p.spinUntil||0)>time;
export const swordMoveMultiplier=(p,time)=>swordSpinning(p,time)?SWORD_SKILL.speed:1;

// One sequence per press: retries, held buttons and restored input cannot recast.
export function stepSwordSkill(w,p,input){
 const seq=input?.skillSeq;
 if(!Number.isSafeInteger(seq)||seq<=0||seq<=(p.skillSeq||0))return;
 p.skillSeq=seq;
 if(!hasDualBlades(p)||p.hp<=0||p.connected===false||swordSpinning(p,w.s.time)||p.choices.length||w.s.upgradePaused||w.s.time<(p.spinReadyAt||0))return;
 p.spinAt=w.s.time;p.spinUntil=w.s.time+SWORD_SKILL.duration;p.spinReadyAt=w.s.time+weaponCooldown(p,SWORD_SKILL.cooldown);
 field(w,p,'swordstorm',p.x,p.y,178,p.damage*1.25,SWORD_SKILL.duration,{tick:0,trailAt:{x:p.x,y:p.y}});
 w.events.push('forge');
}
function field(w,p,kind,x,y,radius,damage,life,extra={}){
 const z={id:w.nextId(),born:w.s.time,owner:p.id,weapon:'elucidator',kind,x,y,radius:radius*weaponScale(p),damage,life,max:life,wait:0,...extra};w.s.zones.push(z);return z;
}
function slash(w,p,target,rank,dual){
 const angle=Math.atan2(target.y-p.y,target.x-p.x),radius=(105+rank*15)*(dual?1.4:1),life=.26*weaponDuration(p);
 field(w,p,'swordslash',p.x,p.y,radius,p.damage*(1.15+rank*.28)*(dual?1.65:1),life,{angle,halfAngle:dual?1.5:1.12,hit:[],dual,side:(p.swordSide=(p.swordSide||0)+1)%2});
}
function wave(w,p,target,rank,dual){
 const angle=Math.atan2(target.y-(p.y-10),target.x-p.x),count=(dual?3:1)+(p.ranks.volley||0);
 for(let i=0;i<count;i++){
  const a=angle+(i-(count-1)/2)*.16,speed=dual?680:530;
  w.s.shots.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:dual?'elucidator':'darkrepulser',kind:'swordwave',x:p.x,y:p.y-10,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,angle:a,damage:p.damage*(.9+rank*.23)*(dual?1.7:1),life:(dual?1.35:1.05)*weaponDuration(p),scale:weaponScale(p)*(dual?1.3:1),pierce:dual?10:2+rank,hit:[],dual});
 }
}
export function stepSwordArsenal(w,p,target,cast){
 const dual=hasDualBlades(p),rank=p.ranks.elucidator||0;
 // A close sword does not waste its swing cycle on a distant target.
 if(target&&Math.hypot(target.x-p.x,target.y-p.y)<(105+rank*15)*(dual?1.4:1)*weaponScale(p)+target.size)
  cast('elucidator',dual?.43:.85,(rank)=>slash(w,p,target,rank,dual));
 if(dual&&target&&(p.cooldowns.dualwave||0)<=0){p.cooldowns.dualwave=weaponCooldown(p,.74);wave(w,p,target,Math.max(rank,p.ranks.darkrepulser||0),true);}
 cast('darkrepulser',1.18,rank=>wave(w,p,target,rank,false));
}
function segmentDistance(e,x,y,tx,ty){const dx=tx-x,dy=ty-y,d=dx*dx+dy*dy,t=d?clamp(((e.x-x)*dx+(e.y-y)*dy)/d,0,1):0;return Math.hypot(e.x-x-dx*t,e.y-y-dy*t);}
export function stepSwordField(w,z,p){
 if(!['swordslash','swordstorm','swordtrail'].includes(z.kind))return false;
 if(z.life<=0)return true;
 if(z.kind==='swordslash'){
  const shape={kind:'cone',x:z.x,y:z.y,radius:z.radius,angle:z.angle,halfAngle:z.halfAngle};w.guard(p,z.weapon,shape);
  for(const e of w.targets()){
   const angle=Math.atan2(e.y-z.y,e.x-z.x),delta=Math.atan2(Math.sin(angle-z.angle),Math.cos(angle-z.angle));
   if(e.hp>0&&!z.hit.includes(e.id)&&Math.hypot(e.x-z.x,e.y-z.y)<z.radius+e.size&&Math.abs(delta)<z.halfAngle){z.hit.push(e.id);w.damage(e,z.damage,p,z,z.weapon);}
  }
 }else if(z.kind==='swordstorm'){
  if(!swordSpinning(p,w.s.time)){z.life=0;return true;}
  const ox=z.x,oy=z.y;z.x=p.x;z.y=p.y;
  w.guard(p,z.weapon,{kind:'line',x:ox,y:oy,tx:z.x,ty:z.y,radius:z.radius});
  if(z.tick<=0){z.tick=.12;for(const e of w.targets())if(e.hp>0&&segmentDistance(e,ox,oy,z.x,z.y)<z.radius+e.size)w.damage(e,z.damage,p,z,z.weapon);}
  const last=z.trailAt||{x:z.x,y:z.y};
  if(Math.hypot(z.x-last.x,z.y-last.y)>30){
   field(w,p,'swordtrail',last.x,last.y,36,p.damage*.42,.55,{tx:z.x,ty:z.y,tick:0});z.trailAt={x:z.x,y:z.y};
   const trails=w.s.zones.filter(f=>f.owner===p.id&&f.kind==='swordtrail'&&f.life>0);for(const f of trails.slice(0,-12))f.life=0;
  }
 }else{
  w.guard(p,z.weapon,{kind:'line',x:z.x,y:z.y,tx:z.tx,ty:z.ty,radius:z.radius});
  if(z.tick<=0){z.tick=.18;for(const e of w.targets())if(e.hp>0&&segmentDistance(e,z.x,z.y,z.tx,z.ty)<z.radius+e.size)w.damage(e,z.damage,p,z,z.weapon);}
 }
 return true;
}

function arc(c,x,y,r,a,b,color,width,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(0,r),a,b);c.stroke();c.restore();}
function blade(r,index,x,y,size,angle,alpha=1){
 const c=r.ctx,atlas=r.weaponAtlas;if(!atlas?.complete||!atlas.naturalWidth)return;
 const i=index-16;c.save();c.globalAlpha*=alpha;c.translate(Math.round(x),Math.round(y));c.rotate(angle+Math.PI/2);c.drawImage(atlas,i%6*64,Math.floor(i/6)*64,64,64,-size/2,-size/2,size,size);c.restore();
}
export function drawSwordShot(r,b){
 if(b.kind!=='swordwave')return false;
 const c=r.ctx,a=Math.atan2(b.vy,b.vx),radius=34*(b.scale||1);c.save();c.translate(b.x,b.y);c.rotate(a);
 // The crescent is perpendicular to its travel, rather than a flying sword.
 arc(c,-radius*.65,0,radius,-1.05,1.05,'#319d9e',12,.2);
 arc(c,-radius*.65,0,radius,-1.05,1.05,'#8aeee0',6,.9);
 arc(c,-radius*.65,0,radius-4,-1,1,'#e8fff5',2);
 if(b.dual)arc(c,-radius*.9,0,radius+8,-1,1,'#c6d7f6',2,.65);
 c.restore();return true;
}
export function drawSwordField(r,z,time,s){
 if(!['swordslash','swordtrail'].includes(z.kind))return z.kind==='swordstorm';
 const c=r.ctx,t=clamp(1-z.life/z.max,0,1),reduced=r.weaponFX.reducedMotion;
 if(z.kind==='swordtrail'){
  c.save();const opacity=c.globalAlpha;c.lineCap='round';
  for(const [color,width,alpha] of [['#477ba7',z.radius*1.6,.12],['#79d9d3',10,.45],['#d7fff5',2,.85]]){c.globalAlpha=opacity*(1-t)*alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(z.x,z.y);c.lineTo(z.tx,z.ty);c.stroke();}c.restore();return true;
 }
 const a=z.angle,start=a-z.halfAngle,end=a+z.halfAngle,sweep=reduced?end:start+(end-start)*clamp(t*2,0,1),color=z.side&&z.dual?'#91e4db':'#b6c8ec';
 arc(c,z.x,z.y,z.radius*.86,start,sweep,'#26344e',19,(1-t)*.55);
 arc(c,z.x,z.y,z.radius*.88,Math.max(start,sweep-1.6),sweep,color,8,1-t);
 arc(c,z.x,z.y,z.radius*.91,Math.max(start,sweep-1.5),sweep,'#f0ffff',2,1-t);
 blade(r,z.side&&z.dual?69:68,z.x+Math.cos(sweep)*z.radius*.4,z.y+Math.sin(sweep)*z.radius*.4,95*weaponScale(s.players.find(p=>p.id===z.owner)||{}),sweep,1-t);
 return true;
}
export function drawSwordPlayer(r,p,time){
 if(p.hp<=0)return;const dual=hasDualBlades(p),spinning=swordSpinning(p,time),c=r.ctx,scale=weaponScale(p),reduced=r.weaponFX.reducedMotion;
 if(spinning){
  const a=reduced?.4:(time-p.spinAt)*16,radius=178*scale,x=p.x,y=p.y-16;
  c.save();c.globalAlpha=r.weaponFX.opacity(p.id);
  // Four staggered ribbons leave the actor readable at the center.
  for(let i=0;i<4;i++){
   const angle=a+i*Math.PI/2,color=i%2?'#7ce4d7':'#c4d3f3';
   arc(c,x,y,radius*(.66+i*.08),angle-1.75,angle,color,i%2?5:3,.72);
   arc(c,x,y,radius*(.67+i*.08),angle-1.4,angle,'#ecfffb',1,.85);
   if(!reduced)for(let j=1;j<4;j++)blade(r,i%2?69:68,x+Math.cos(angle-j*.17)*62*scale,y+Math.sin(angle-j*.17)*62*scale,108*scale,angle-j*.17,.13*(4-j));
  }
  for(let i=0;i<2;i++){const angle=a+i*Math.PI;blade(r,i?69:68,x+Math.cos(angle)*58*scale,y+Math.sin(angle)*58*scale,112*scale,angle);}
  c.restore();return;
 }
 const a=p.face===-1?Math.PI:0;
 if(ownsWeapon(p,'elucidator'))blade(r,68,p.x-20*p.face,p.y-26,64,a-.95,.9);
 if(ownsWeapon(p,'darkrepulser')||dual)blade(r,69,p.x+23*p.face,p.y-25,64,a+.85,.95);
}
