import {UPGRADES,weaponScale,weaponDuration} from './equipment.mjs';
import {segmentDistance} from './counterfire.mjs';
const tau=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function launch(w,p,key,angle,extra={}){
 const scale=weaponScale(p),speed=extra.speed||580;
 w.s.shots.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:key,kind:key,sprite:UPGRADES[key].sprite,x:p.x,y:p.y-10,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,scale,radius:20*scale,life:1.35*weaponDuration(p),damage:p.damage,hit:[],pierce:4,...extra});
}
export function stepMemeArsenal(w,p,target,cast){
 const a=target?Math.atan2(target.y-p.y,target.x-p.x):0,scale=weaponScale(p),duration=weaponDuration(p);
 cast('spincat',1.8,rank=>{const count=Math.ceil(rank/2)+(p.ranks.volley||0);for(let i=0;i<count;i++)launch(w,p,'spincat',a+(i-(count-1)/2)*.22,{damage:p.damage*(1.2+rank*.22),pierce:3+rank});});
 cast('gugu',4.1,rank=>{const life=(.2+(rank>=4?4:3)*.65)*duration;w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'gugu',kind:'gugu',x:p.x+Math.cos(a)*34,y:p.y-10+Math.sin(a)*34,radius:(175+rank*20)*scale,scale,damage:p.damage*(.65+rank*.16),life,max:life,wait:0,tick:0,elapsed:0,duration,pulses:rank>=4?4:3,pulse:-1,hit:[],waveRadius:0,inner:0,active:false});});
 cast('manbo',3.1,rank=>{const count=1+Math.floor(rank/3)+(p.ranks.volley||0);for(let i=0;i<count;i++)launch(w,p,'manbo',a+(i-(count-1)/2)*.25,{speed:1000,life:.9*duration,wait:.28,active:false,damage:p.damage*(2+rank*.4),pierce:6+rank,radius:25*scale});});
 cast('bananacat',3.4,rank=>{const distance=Math.min(270,dist(p,target)),tx=p.x+Math.cos(a)*distance,ty=p.y+Math.sin(a)*distance;launch(w,p,'bananacat',a,{sx:p.x,sy:p.y-10,tx,ty,flight:.55,elapsed:0,rank,life:.65,damage:p.damage*(1+rank*.2),active:false,duration,peels:Math.min(6,2+Math.ceil(rank/2)+(p.ranks.volley||0))});});
}
/** All hit history and wind-up state lives in the host checkpoint. */
export function stepMemeShot(w,b,p,dt){
 if(!['spincat','manbo','bananacat'].includes(b.kind))return false;
 if(b.kind==='bananacat'){
  b.elapsed+=dt;const t=Math.min(1,b.elapsed/b.flight);b.x=b.sx+(b.tx-b.sx)*t;b.y=b.sy+(b.ty-b.sy)*t-Math.sin(t*Math.PI)*100;b.life-=dt;
  if(t>=1){b.life=0;w.guard(p,b.weapon,{x:b.tx,y:b.ty,radius:40*b.scale});for(const e of w.targets())if(e.hp>0&&dist(e,{x:b.tx,y:b.ty})<e.size+40*b.scale)w.damage(e,b.damage,p,b,b.weapon);
   for(let i=0;i<b.peels;i++){const angle=b.angle+Math.PI/2,offset=(i-(b.peels-1)/2)*45*b.scale,life=5*b.duration;w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:b.weapon,kind:'bananaPeel',x:Math.min(w.s.width-80,Math.max(80,b.tx+Math.cos(angle)*offset)),y:Math.min(w.s.height-80,Math.max(80,b.ty+Math.sin(angle)*offset)),angle:b.angle,scale:b.scale,radius:65*b.scale,triggerRadius:22*b.scale,damage:b.damage*1.45,life,max:life,wait:.25,tick:0,triggered:false});}
  }return true;
 }
 if(b.wait>0){b.wait=Math.max(0,b.wait-dt);b.active=false;return true;}
 b.active=true;const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
 for(const e of w.targets())if(e.hp>0&&!b.hit.includes(e.id)&&segmentDistance(e.x,e.y,ox,oy,b.x,b.y)<=e.size+b.radius){w.damage(e,b.damage,p,{x:ox,y:oy},b.weapon);b.hit.push(e.id);if(b.hit.length>=b.pierce){b.life=0;break;}}
 return true;
}
export function stepMemeField(w,z,p,dt){
 if(z.kind==='gugu'){
  z.elapsed+=dt;const elapsed=z.elapsed-.2*z.duration,pulse=Math.floor(elapsed/(.65*z.duration)),phase=elapsed-pulse*.65*z.duration;
  z.active=z.life>0&&elapsed>=0&&pulse<z.pulses&&phase<.6*z.duration;
  if(!z.active){z.waveRadius=0;return true;}
  if(z.pulse!==pulse){z.pulse=pulse;z.hit=[];z.waveRadius=0;}
  z.inner=Math.max(0,z.waveRadius-12*z.scale);z.waveRadius=Math.min(z.radius,phase/(.6*z.duration)*z.radius);
  w.guard(p,z.weapon,{kind:'ring',x:z.x,y:z.y,radius:z.waveRadius,inner:z.inner});
  for(const e of w.targets()){const d=dist(e,z);if(e.hp>0&&!z.hit.includes(e.id)&&d<=z.waveRadius+e.size&&d>=z.inner-e.size){w.damage(e,z.damage,p,z,z.weapon);e.slow=Math.max(e.slow||0,.5);z.hit.push(e.id);}}
  return true;
 }
 if(z.kind==='bananaPeel'){
  if(z.triggered)return true;
  if(!w.targets().some(e=>e.hp>0&&dist(e,z)<e.size+z.triggerRadius))return true;
  z.triggered=true;z.life=.35;w.guard(p,z.weapon,{x:z.x,y:z.y,radius:z.radius});
  for(const e of w.targets())if(e.hp>0&&dist(e,z)<e.size+z.radius){w.damage(e,z.damage,p,z,z.weapon);if(!e.prop&&e.type!==7){e.slow=Math.max(e.slow||0,2.4);if(e.type!==4){e.knockX=Math.cos(z.angle)*260;e.knockY=Math.sin(z.angle)*260;e.stagger=Math.max(e.stagger||0,.28);}}}
  return true;
 }
 return false;
}
function glyph(r,index,x,y,size,angle=0,flip=1){const c=r.ctx,atlas=r.weaponAtlas;if(!atlas?.complete||!atlas.naturalWidth)return;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.scale(flip,1);c.drawImage(atlas,(index-16)%6*64,Math.floor((index-16)/6)*64,64,64,-size/2,-size/2,size,size);c.restore();}
function ring(c,x,y,radius,color,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x,y,Math.max(0,radius),0,tau);c.stroke();c.restore();}
export function drawMemeShot(r,b,time,reduced=false){
 const c=r.ctx,age=Math.max(0,time-b.born),scale=b.scale||1;
 if(b.kind==='spincat'){
  const spin=reduced?0:Math.floor(age*18)*Math.PI/4;
  ring(c,b.x,b.y,24*scale,'#b9c8b8',.4);if(!reduced){c.save();c.globalAlpha*=.2;glyph(r,b.sprite,b.x,b.y,64*scale,spin-.5);c.restore();}
  glyph(r,b.sprite,b.x,b.y,64*scale,spin);return true;
 }
 if(b.kind==='manbo'){
  const charging=b.wait<=0,face=b.vx<0?-1:1,bob=reduced?0:Math.sin(time*(charging?30:10))*3;
  if(charging){c.save();c.globalAlpha*=.5;c.strokeStyle='#d8c3a0';c.lineWidth=3;for(let i=0;i<3;i++){const dx=-Math.cos(b.angle)*(35+i*14)*scale,dy=-Math.sin(b.angle)*(35+i*14)*scale;c.beginPath();c.moveTo(b.x+dx,b.y+dy+(i-1)*12);c.lineTo(b.x+dx-Math.cos(b.angle)*26,b.y+dy+(i-1)*12-Math.sin(b.angle)*26);c.stroke();}c.restore();}
  else ring(c,b.x,b.y,30*scale,'#d8c3a0',.4);
  glyph(r,b.sprite,b.x,b.y+bob,78*scale,charging?.08*face:0,face);return true;
 }
 if(b.kind==='bananacat'){glyph(r,b.sprite,b.x,b.y,62*scale,reduced?0:Math.sin(age*9)*.25);return true;}
 return false;
}
export function drawMemeField(r,z,time,reduced=false){
 const c=r.ctx,scale=z.scale||1;
 if(z.kind==='gugu'){
  glyph(r,61,z.x,z.y-8+(reduced?0:Math.sin(time*14)*2),66*scale);
  if(z.active){ring(c,z.x,z.y,z.waveRadius,'#a9cfda',.85);ring(c,z.x,z.y,Math.max(0,z.waveRadius-9*scale),'#edf2d6',.35);for(let i=0;i<6;i++){const a=i*tau/6,x=z.x+Math.cos(a)*z.waveRadius,y=z.y+Math.sin(a)*z.waveRadius;c.fillStyle='#d7e4cd';c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,3,3);}}
  return true;
 }
 if(z.kind==='bananaPeel'){
  c.save();c.translate(Math.round(z.x),Math.round(z.y));c.scale(scale,scale);c.globalAlpha*=z.wait>0?.5:1;c.fillStyle='#111e28';c.beginPath();c.moveTo(-18,7);c.lineTo(-5,-4);c.lineTo(0,-12);c.lineTo(6,0);c.lineTo(21,7);c.lineTo(11,13);c.lineTo(0,6);c.lineTo(-12,14);c.closePath();c.fill();c.fillStyle='#dec578';c.beginPath();c.moveTo(-15,8);c.lineTo(-4,-1);c.lineTo(0,-8);c.lineTo(4,3);c.lineTo(17,8);c.lineTo(11,10);c.lineTo(0,3);c.lineTo(-11,11);c.closePath();c.fill();c.fillStyle='#f4e5af';c.fillRect(-1,-8,3,9);c.restore();
  if(z.triggered)ring(c,z.x,z.y,z.radius*(1-z.life/.35),'#dec578',z.life/.35);
  return true;
 }
 return false;
}
