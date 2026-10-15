import {UPGRADES,ownsWeapon,weaponScale,weaponDuration,weaponCooldown} from './equipment.mjs';
import {onRitualHit} from './arsenal-ritual.mjs';
const tau=Math.PI*2;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
function nearest(w,from,range,excluded=[]){let target=null;for(const e of w.targets()){const d=dist(e,from);if(e.hp>0&&d<range&&!excluded.includes(e.id)){target=e;range=d;}}return target;}
function shot(w,p,key,angle,options={}){
 const speed=options.speed||560;
 w.s.shots.push({born:Math.round(w.s.time*1000)/1000,id:w.nextId(),owner:p.id,weapon:key,x:p.x,y:p.y-10,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,damage:p.damage,hit:[],pierce:1,sprite:UPGRADES[key].sprite,...options,scale:weaponScale(p),life:(options.life||1.4)*weaponDuration(p)});
}
function field(w,p,key,kind,x,y,radius,damage,life,options={}){
 const duration=life*weaponDuration(p);
 const z={born:Math.round(w.s.time*1000)/1000,id:w.nextId(),owner:p.id,weapon:key,kind,x,y,radius:radius*weaponScale(p),damage,life:duration,max:duration,wait:0,tick:0,...options};w.s.zones.push(z);return z;
}
function trimFields(w,p,kind,limit){const fields=w.s.zones.filter(z=>z.owner===p.id&&z.kind===kind&&z.life>0);for(const z of fields.slice(0,Math.max(0,fields.length-limit)))z.life=0;}
function pull(e,to,force,dt){if(e.type===7||e.prop)return;const d=dist(e,to);if(d<1)return;const step=Math.min(d,force*dt*(e.type===4?.15:1));e.x+=(to.x-e.x)/d*step;e.y+=(to.y-e.y)/d*step;e.slow=Math.max(e.slow||0,.3);}
function detonate(w,p,z){
 w.guard(p,z.weapon,{x:z.x,y:z.y,radius:z.radius});
 w.effect(z.x,z.y,'fireburst',.45,z.radius);for(const e of w.targets())if(e.hp>0&&dist(e,z)<z.radius+e.size)w.damage(e,z.damage,p,z,z.weapon);
 z.life=0;z.exploded=true;
}
/** Additional weapons use the same bounded projectile/field pools and host damage ledger. */
export function stepNewArsenal(w,p,dt,target,cast){
 if(!ownsWeapon(p,'dagger'))p.salvo=null;
 cast('dagger',1.5,rank=>{p.salvo={remaining:3+rank+(p.ranks.volley||0),wait:0};});
 if(p.salvo&&target){p.salvo.wait-=dt;if(p.salvo.wait<=0){p.salvo.wait+=.11;shot(w,p,'dagger',aim(p,target),{speed:780,damage:p.damage*(.65+rankOf(p,'dagger')*.13),pierce:1+Math.floor(rankOf(p,'dagger')/3),life:.95});if(--p.salvo.remaining<=0)p.salvo=null;}}
 cast('chakram',2.25,(rank,evo)=>{const count=(rank>=4?2:1)+(p.ranks.volley||0)+(evo?1:0);for(let i=0;i<count;i++)shot(w,p,'chakram',aim(p,target)+(i-(count-1)/2)*.3,{kind:'bounce',speed:430,bounces:(evo?8:2+rank),damage:p.damage*(1.2+rank*.2),life:3.5,sprite:evo?42:35,split:evo==='mirrordance'});});
 cast('mine',2.1,rank=>{field(w,p,'mine','mine',p.x,p.y,90+rank*10,p.damage*(3+rank*.6),12,{wait:.45});trimFields(w,p,'mine',6);});
 cast('turret',5.2,(rank,evo)=>{
  const count=evo?3:1;
  for(let i=0;i<count;i++){const a=i*tau/3;field(w,p,'turret','turret',p.x+(evo?Math.cos(a)*68:0),p.y+(evo?Math.sin(a)*48:0),440,p.damage*(.8+rank*.16),7+rank*.5,{rank,evolved:!!evo,angle:aim(p,target),scale:weaponScale(p)});}
  trimFields(w,p,'turret',evo?3:2);
  if(evo){for(let i=0;i<3;i++)field(w,p,'turret','mine',p.x+Math.cos(i*tau/3)*100,p.y+Math.sin(i*tau/3)*100,125,p.damage*4,8,{wait:.45});trimFields(w,p,'mine',6);}
 });
 cast('chain',2.5,(rank,evo)=>{
  const count=1+Math.floor(rank/2)+(evo?2:0),targets=w.targets().filter(e=>e.hp>0&&dist(e,p)<(240+rank*20)*weaponScale(p)).sort((a,b)=>dist(a,p)-dist(b,p)).slice(0,count);
  for(const e of targets)field(w,p,'chain','tether',p.x,p.y,240+rank*20,p.damage*(.35+rank*.08),1.9,{target:e.id,evolved:!!evo});
  trimFields(w,p,'tether',count);
  if(evo){field(w,p,'chain','mill',p.x,p.y,130,p.damage*.9,2.7);trimFields(w,p,'mill',1);}
 });
 cast('saw',1.2,rank=>{field(w,p,'saw','saw',p.x,p.y,72+rank*8,p.damage*(.38+rank*.08),2.5+rank*.2);trimFields(w,p,'saw',3);});
 cast('wind',3.2,(rank,evo)=>{const count=(evo?3:1)+(p.ranks.volley||0);for(let i=0;i<count;i++)shot(w,p,'wind',aim(p,target)+(i-(count-1)/2)*.55,{kind:'tornado',speed:evo?140:105,age:0,tick:0,bolt:0,radius:(54+rank*6)*weaponScale(p),damage:p.damage*(.4+rank*.08)*(evo?1.4:1),life:3.8,seek:!!evo,sprite:evo?45:40});});
 cast('whip',1.25,rank=>{
  const angle=aim(p,target),length=(195+rank*22)*weaponScale(p),width=(18+rank*2)*weaponScale(p),angles=rank>=3?[angle,angle+Math.PI]:[angle];
  for(const a of angles){w.s.effects.push({id:w.nextId(),type:'lash',x:p.x,y:p.y,angle:a,size:length,width,life:.28,max:.28});
   const dx=Math.cos(a),dy=Math.sin(a);w.guard(p,'whip',{kind:'line',x:p.x,y:p.y,tx:p.x+dx*length,ty:p.y+dy*length,radius:width});for(const e of w.targets()){const x=e.x-p.x,y=e.y-p.y,along=x*dx+y*dy;if(e.hp>0&&along>=0&&along<length+e.size&&Math.abs(x*dy-y*dx)<width+e.size)w.damage(e,p.damage*(1.7+rank*.24),p,p,'whip');}
  }
 });
}
const rankOf=(p,key)=>p.ranks[key]||1;
export function stepNewShot(w,b,p,dt){
 if(b.kind!=='bounce'&&b.kind!=='tornado')return false;
 if(b.life<=0)return true;
 b.life-=dt;
 if(b.kind==='bounce'){
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const e of w.targets())if(e.hp>0&&!b.hit.includes(e.id)&&dist(e,b)<e.size+17*b.scale){
   w.damage(e,b.damage,p,b,'chakram');b.hit.push(e.id);
   if(b.split)for(const side of [-1,1])shot(w,p,'chakram',aim(b,e)+side*.8,{x:b.x,y:b.y,sprite:34,damage:b.damage*.45,speed:650,life:.65});
   const target=nearest(w,b,420,b.hit);
   if(--b.bounces<=0||!target){b.life=0;break;}
   const a=aim(b,target);b.vx=Math.cos(a)*520;b.vy=Math.sin(a)*520;break;
  }
 }else{
  b.age+=dt;b.tick-=dt;b.bolt-=dt;
  if(b.seek){const target=nearest(w,b,450);if(target){const a=aim(b,target);b.angle+=Math.atan2(Math.sin(a-b.angle),Math.cos(a-b.angle))*Math.min(1,dt*1.6);}}
  const turn=Math.sin(b.age*4+b.id)*.6;b.vx=Math.cos(b.angle+turn)*(b.speed||125);b.vy=Math.sin(b.angle+turn)*(b.speed||125);b.x+=b.vx*dt;b.y+=b.vy*dt;
  const hit=b.tick<=0;if(hit)b.tick=.28;
  for(const e of w.targets())if(e.hp>0&&dist(e,b)<b.radius+e.size){pull(e,b,150,dt);if(hit)w.damage(e,b.damage,p,b,'wind');}
  if(b.seek&&b.bolt<=0&&nearest(w,b,250)){b.bolt=.8;w.lightning(p,b,3,.65,'wind');}
 }
 return true;
}
export function stepNewField(w,z,p,dt){
 if(!['mine','turret','tether','mill','saw'].includes(z.kind))return false;
 if(z.life<=0)return true;
 if(z.kind==='mine'){
  if(w.targets().some(e=>e.hp>0&&dist(e,z)<z.radius*.72+e.size))detonate(w,p,z);
 }else if(z.kind==='turret'){
  const target=nearest(w,z,z.radius);if(target)z.angle=aim(z,target);
  if(target&&z.tick<=0){z.firedAt=Math.round(w.s.time*1000)/1000;z.tick=weaponCooldown(p,Math.max(.22,.7-z.rank*.065));
   const count=(z.evolved?3:1)+(p.ranks.volley||0);for(let i=0;i<count;i++)shot(w,p,'turret',z.angle+(i-(count-1)/2)*.15,{x:z.x,y:z.y-18,speed:550,damage:z.damage,sprite:z.evolved?43:34,life:.85,blast:z.evolved?68*weaponScale(p):0});w.events.push('shoot');
  }
 }else if(z.kind==='tether'){
  z.x=p.x;z.y=p.y-12;const e=w.targets().find(e=>e.id===z.target&&e.hp>0);
  if(!e||dist(e,p)>z.radius*1.4){z.life=0;return true;}
  z.tx=e.x;z.ty=e.y;w.guard(p,'chain',{kind:'line',x:z.x,y:z.y,tx:e.x,ty:e.y,radius:10*weaponScale(p)});pull(e,p,z.evolved?200:100,dt);
  if(z.tick<=0){z.tick=.24;w.damage(e,z.damage,p,p,'chain');}
 }else{
  if(z.kind==='mill'){z.x=p.x;z.y=p.y;}
  w.guard(p,z.weapon,{x:z.x,y:z.y,radius:z.radius});
  if(z.tick<=0){z.tick=.22;for(const e of w.targets())if(e.hp>0&&dist(e,z)<z.radius+e.size)w.damage(e,z.damage,p,z,z.weapon);}
 }
 return true;
}
export function onNewShotHit(w,b,p,struck){
 onRitualHit(w,b,p,struck);
 if(!b.blast||b.exploded)return;w.guard(p,b.weapon,{x:b.x,y:b.y,radius:b.blast});b.exploded=true;w.effect(b.x,b.y,'fireburst',.3,b.blast);
 for(const e of w.targets())if(e!==struck&&e.hp>0&&dist(e,b)<b.blast+e.size)w.damage(e,b.damage*.65,p,b,b.weapon);
}
