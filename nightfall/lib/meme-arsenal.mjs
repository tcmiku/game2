import {UPGRADES,ARTIFACTS,weaponScale,weaponDuration} from './equipment.mjs';
import {segmentDistance} from './counterfire.mjs';
const tau=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function launch(w,p,key,angle,extra={}){
 const scale=weaponScale(p),speed=extra.speed||580;
 w.s.shots.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:key,kind:key,sprite:ARTIFACTS[p.evolutions?.[key]]?.sprite||UPGRADES[key].sprite,x:p.x,y:p.y-10,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,scale,radius:20*scale,life:1.35*weaponDuration(p),damage:p.damage,hit:[],pierce:4,...extra});
}
function castMemeKing(w,p,a,scale,duration,target){
 const cats=Math.min(12,8+(p.ranks.volley||0)),horses=Math.min(7,5+(p.ranks.volley||0));
 // All four components belong to the one remaining weapon and one stat entry.
 for(let i=0;i<cats;i++)launch(w,p,'spincat',a+i*tau/cats,{sprite:64,royal:true,evolved:true,damage:p.damage*5.5,pierce:18,life:1.9*duration,returnAt:.8*duration});
 const life=3.2*duration;
 w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'spincat',kind:'gugu',x:p.x,y:p.y-10,radius:420*scale,scale,damage:p.damage*3.5,life,max:life,wait:0,tick:0,elapsed:0,duration,pulses:6,interval:.48,evolved:true,royal:true,pulse:-1,hit:[],waveRadius:0,inner:0,active:false});
 for(let i=0;i<horses;i++)launch(w,p,'spincat',a+(i-(horses-1)/2)*.18,{kind:'manbo',sprite:66,royal:true,evolved:true,speed:1200,life:1.05*duration,wait:.2+i*.06,active:false,damage:p.damage*11,pierce:32,radius:36*scale});
 for(let i=0;i<3;i++){const distance=Math.min(420,dist(p,target)),offset=(i-1)*85*scale;launch(w,p,'spincat',a,{kind:'bananacat',sprite:67,royal:true,evolved:true,sx:p.x,sy:p.y-10,tx:p.x+Math.cos(a)*distance-Math.sin(a)*offset,ty:p.y+Math.sin(a)*distance+Math.cos(a)*offset,flight:.5+i*.09,elapsed:0,rank:5,life:1,damage:p.damage*5,active:false,duration,peels:4});}
}
export function stepMemeArsenal(w,p,target,cast){
 const a=target?Math.atan2(target.y-p.y,target.x-p.x):0,scale=weaponScale(p),duration=weaponDuration(p);
 if(p.evolutions?.spincat==='memeking'){if(Math.abs(p.cooldowns.spincat||0)<1e-7)p.cooldowns.spincat=0;cast('spincat',2.4,()=>castMemeKing(w,p,a,scale,duration,target));return;}
 cast('spincat',1.8,(rank,evo)=>{const evolved=evo==='cataclysm',count=evolved?Math.min(8,5+(p.ranks.volley||0)):Math.ceil(rank/2)+(p.ranks.volley||0);for(let i=0;i<count;i++)launch(w,p,'spincat',evolved?a+i*tau/count:a+(i-(count-1)/2)*.22,{damage:p.damage*(1.2+rank*.22)*(evolved?1.5:1),pierce:evolved?14:3+rank,evolved,life:(evolved?1.8:1.35)*duration,returnAt:evolved?.75*duration:0});});
 cast('gugu',4.1,(rank,evo)=>{const evolved=evo==='polarChoir',pulses=evolved?5:rank>=4?4:3,interval=evolved?.5:.65,life=(.2+pulses*interval)*duration;w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'gugu',kind:'gugu',x:p.x+Math.cos(a)*34,y:p.y-10+Math.sin(a)*34,radius:(175+rank*20)*scale*(evolved?1.3:1),scale,damage:p.damage*(.65+rank*.16)*(evolved?1.6:1),life,max:life,wait:0,tick:0,elapsed:0,duration,pulses,interval,evolved,pulse:-1,hit:[],waveRadius:0,inner:0,active:false});});
 cast('manbo',3.1,(rank,evo)=>{const evolved=evo==='dreamcavalry',count=evolved?Math.min(5,3+(p.ranks.volley||0)):1+Math.floor(rank/3)+(p.ranks.volley||0);for(let i=0;i<count;i++)launch(w,p,'manbo',a+(i-(count-1)/2)*(evolved?.13:.25),{speed:evolved?1150:1000,life:.9*duration,wait:.28+(evolved?i*.07:0),active:false,damage:p.damage*(2+rank*.4)*(evolved?1.6:1),pierce:evolved?24:6+rank,radius:(evolved?30:25)*scale,evolved});});
 cast('bananacat',3.4,(rank,evo)=>{const evolved=evo==='goldenbanquet',distance=Math.min(270,dist(p,target)),tx=p.x+Math.cos(a)*distance,ty=p.y+Math.sin(a)*distance;for(let i=0;i<(evolved?3:1);i++){const offset=evolved?(i-1)*65*scale:0;launch(w,p,'bananacat',a,{sx:p.x,sy:p.y-10,tx:tx-Math.sin(a)*offset,ty:ty+Math.cos(a)*offset,flight:.55+(evolved?i*.1:0),elapsed:0,rank,life:evolved?1:.65,damage:p.damage*(1+rank*.2)*(evolved?1.5:1),active:false,duration,evolved,peels:Math.min(6,2+Math.ceil(rank/2)+(p.ranks.volley||0))});}});
}
/** All hit history and wind-up state lives in the host checkpoint. */
export function stepMemeShot(w,b,p,dt){
 if(!['spincat','manbo','bananacat'].includes(b.kind))return false;
 if(b.kind==='bananacat'){
  b.elapsed+=dt;const t=Math.min(1,b.elapsed/b.flight);b.x=b.sx+(b.tx-b.sx)*t;b.y=b.sy+(b.ty-b.sy)*t-Math.sin(t*Math.PI)*100;b.life-=dt;
  if(t>=1){b.life=0;w.guard(p,b.weapon,{x:b.tx,y:b.ty,radius:40*b.scale});for(const e of w.targets())if(e.hp>0&&dist(e,{x:b.tx,y:b.ty})<e.size+40*b.scale)w.damage(e,b.damage,p,b,b.weapon);
   const old=w.s.zones.filter(z=>z.owner===p.id&&z.kind==='bananaPeel'&&z.life>0);for(const z of old.slice(0,Math.max(0,old.length+b.peels-(b.royal?12:8))))z.life=0;
   for(let i=0;i<b.peels;i++){const angle=b.evolved?i*tau/b.peels:b.angle+Math.PI/2,offset=b.evolved?55*b.scale:(i-(b.peels-1)/2)*45*b.scale,life=5*b.duration;w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:b.weapon,kind:'bananaPeel',evolved:b.evolved,royal:b.royal,x:Math.min(w.s.width-80,Math.max(80,b.tx+Math.cos(angle)*offset)),y:Math.min(w.s.height-80,Math.max(80,b.ty+Math.sin(angle)*offset)),angle:b.angle,scale:b.scale,radius:(b.royal?95:65)*b.scale,triggerRadius:(b.royal?30:22)*b.scale,damage:b.damage*1.45,life,max:life,wait:.25,tick:0,triggered:false});}
  }return true;
 }
 if(b.wait>0){b.wait=Math.max(0,b.wait-dt);if(b.wait<1e-7)b.wait=0;b.active=false;return true;}
 if(b.kind==='spincat'&&b.evolved&&w.s.time-b.born>=b.returnAt){if(!b.recalled){b.recalled=true;b.hit=[];}const a=Math.atan2(p.y-10-b.y,p.x-b.x);b.angle=a;b.vx=Math.cos(a)*640;b.vy=Math.sin(a)*640;if(dist(b,{x:p.x,y:p.y-10})<24)b.life=0;}
 if(b.kind==='manbo'&&b.evolved&&!b.trail){b.trail=true;const life=1.15*weaponDuration(p);w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:b.weapon,kind:'cavalryTrail',x:b.x,y:b.y,tx:b.x+Math.cos(b.angle)*550,ty:b.y+Math.sin(b.angle)*550,radius:14*b.scale,scale:b.scale,damage:b.damage*.2,life,max:life,wait:0,tick:0});}
 b.active=true;const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
 for(const e of w.targets())if(e.hp>0&&!b.hit.includes(e.id)&&segmentDistance(e.x,e.y,ox,oy,b.x,b.y)<=e.size+b.radius){w.damage(e,b.damage,p,{x:ox,y:oy},b.weapon);b.hit.push(e.id);if(b.hit.length>=b.pierce){b.life=0;break;}}
 return true;
}
export function stepMemeField(w,z,p,dt){
 if(z.life<=0&&['cavalryTrail','gugu','bananaPeel'].includes(z.kind))return true;
 if(z.kind==='cavalryTrail'){w.guard(p,z.weapon,{kind:'line',x:z.x,y:z.y,tx:z.tx,ty:z.ty,radius:z.radius});if(z.tick<=0){z.tick=.25;for(const e of w.targets())if(e.hp>0&&segmentDistance(e.x,e.y,z.x,z.y,z.tx,z.ty)<e.size+z.radius)w.damage(e,z.damage,p,z,z.weapon);}return true;}
 if(z.kind==='gugu'){
  z.elapsed+=dt;const elapsed=z.elapsed-.2*z.duration,pulse=Math.floor(elapsed/((z.interval||.65)*z.duration)),phase=elapsed-pulse*(z.interval||.65)*z.duration;
  z.active=z.life>0&&elapsed>=0&&pulse<z.pulses&&phase<(z.evolved?.46:.6)*z.duration;
  if(!z.active){z.waveRadius=0;return true;}
  if(z.pulse!==pulse){z.pulse=pulse;z.hit=[];z.waveRadius=0;}
  z.inner=Math.max(0,z.waveRadius-12*z.scale);z.waveRadius=Math.min(z.radius,phase/((z.evolved?.46:.6)*z.duration)*z.radius);
  w.guard(p,z.weapon,{kind:'ring',x:z.x,y:z.y,radius:z.waveRadius,inner:z.inner});
  for(const e of w.targets()){const d=dist(e,z);if(e.hp>0&&!z.hit.includes(e.id)&&d<=z.waveRadius+e.size&&d>=z.inner-e.size){w.damage(e,z.damage,p,z,z.weapon);e.slow=Math.max(e.slow||0,z.evolved?1.2:.5);if(z.evolved&&!e.prop&&![4,7].includes(e.type))e.frozen=Math.max(e.frozen||0,z.royal?.35:.18);z.hit.push(e.id);}}
  return true;
 }
 if(z.kind==='bananaPeel'){
  if(z.triggered)return true;
  if(!(z.chainAt&&w.s.time>=z.chainAt)&&!w.targets().some(e=>e.hp>0&&dist(e,z)<e.size+z.triggerRadius))return true;
  z.triggered=true;z.life=.35;if(z.evolved)for(const other of w.s.zones)if(other!==z&&other.kind==='bananaPeel'&&other.owner===p.id&&other.life>0&&!other.triggered&&dist(other,z)<z.radius*1.8)other.chainAt=Math.min(other.chainAt||Infinity,w.s.time+.12);w.guard(p,z.weapon,{x:z.x,y:z.y,radius:z.radius});
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
  ring(c,b.x,b.y,(b.evolved?31:24)*scale,b.royal?'#f1d58b':b.evolved?'#bce1cf':'#b9c8b8',.4);if(!reduced){c.save();c.globalAlpha*=.2;glyph(r,b.sprite,b.x,b.y,64*scale,spin-.5);c.restore();}
  glyph(r,b.sprite,b.x,b.y,64*scale,spin);return true;
 }
 if(b.kind==='manbo'){
  const charging=b.wait<=0,face=b.vx<0?-1:1,bob=reduced?0:Math.sin(time*(charging?30:10))*3;
  if(charging){c.save();c.globalAlpha*=.5;c.strokeStyle=b.evolved?'#dfc5f1':'#d8c3a0';c.lineWidth=3;for(let i=0;i<3;i++){const dx=-Math.cos(b.angle)*(35+i*14)*scale,dy=-Math.sin(b.angle)*(35+i*14)*scale;c.beginPath();c.moveTo(b.x+dx,b.y+dy+(i-1)*12);c.lineTo(b.x+dx-Math.cos(b.angle)*26,b.y+dy+(i-1)*12-Math.sin(b.angle)*26);c.stroke();}c.restore();}
  else ring(c,b.x,b.y,30*scale,'#d8c3a0',.4);
  glyph(r,b.sprite,b.x,b.y+bob,78*scale,charging?.08*face:0,face);return true;
 }
 if(b.kind==='bananacat'){glyph(r,b.sprite,b.x,b.y,62*scale,reduced?0:Math.sin(age*9)*.25);return true;}
 return false;
}
export function drawMemeField(r,z,time,reduced=false){
 const c=r.ctx,scale=z.scale||1;
 if(z.kind==='cavalryTrail'){c.save();c.globalAlpha*=Math.max(0,z.life/z.max);c.strokeStyle='#b9b5ed';c.lineWidth=4*scale;c.beginPath();c.moveTo(z.x,z.y);c.lineTo(z.tx,z.ty);c.stroke();for(let i=0;i<8;i++){const t=i/8,x=z.x+(z.tx-z.x)*t,y=z.y+(z.ty-z.y)*t;c.fillStyle='#efe0fa';c.fillRect(x-3,y-3,6,6);}c.restore();return true;}
 if(z.kind==='gugu'){
  glyph(r,z.royal?71:z.evolved?65:61,z.x,z.y-8+(reduced?0:Math.sin(time*14)*2),(z.royal?84:66)*scale);
  if(z.royal){ring(c,z.x,z.y,48*scale,'#f1d58b',.6);for(let i=0;i<4;i++){const a=i*tau/4+(reduced?0:time*.8);glyph(r,60+i,z.x+Math.cos(a)*66*scale,z.y+Math.sin(a)*48*scale,30*scale);}}
  if(z.active){ring(c,z.x,z.y,z.waveRadius,z.evolved?'#d6bff0':'#a9cfda',.85);ring(c,z.x,z.y,Math.max(0,z.waveRadius-9*scale),'#edf2d6',.35);for(let i=0;i<6;i++){const a=i*tau/6,x=z.x+Math.cos(a)*z.waveRadius,y=z.y+Math.sin(a)*z.waveRadius;c.fillStyle='#d7e4cd';c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,3,3);}}
  return true;
 }
 if(z.kind==='bananaPeel'){
  c.save();c.translate(Math.round(z.x),Math.round(z.y));c.scale(scale,scale);c.globalAlpha*=z.wait>0?.5:1;c.fillStyle='#111e28';c.beginPath();c.moveTo(-18,7);c.lineTo(-5,-4);c.lineTo(0,-12);c.lineTo(6,0);c.lineTo(21,7);c.lineTo(11,13);c.lineTo(0,6);c.lineTo(-12,14);c.closePath();c.fill();c.fillStyle=z.evolved?'#f5d979':'#dec578';c.beginPath();c.moveTo(-15,8);c.lineTo(-4,-1);c.lineTo(0,-8);c.lineTo(4,3);c.lineTo(17,8);c.lineTo(11,10);c.lineTo(0,3);c.lineTo(-11,11);c.closePath();c.fill();c.fillStyle='#f4e5af';c.fillRect(-1,-8,3,9);c.restore();
  if(z.evolved&&!z.triggered)ring(c,z.x,z.y,26*scale,'#f5d979',.4);
  if(z.triggered)ring(c,z.x,z.y,z.radius*(1-z.life/.35),'#dec578',z.life/.35);
  return true;
 }
 return false;
}
