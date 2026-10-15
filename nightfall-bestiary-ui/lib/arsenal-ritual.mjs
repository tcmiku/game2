import {weaponScale,weaponDuration,UPGRADES} from './equipment.mjs';
const tau=Math.PI*2,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const RITUAL_WEAPONS=['bell','gauntlet','hourglass','bloodneedle','loom','flail'];
const kinds=new Set(['bellwave','punch','sandglass','bloodmark','thunderline','flail']);
function field(w,p,weapon,kind,x,y,radius,damage,life,extra={}){
 const duration=weaponDuration(p),z={id:w.nextId(),born:Math.round(w.s.time*1000)/1000,owner:p.id,weapon,kind,x,y,radius:radius*weaponScale(p),damage,life:life*duration,max:life*duration,wait:0,tick:0,...extra};w.s.zones.push(z);return z;
}
function trim(w,p,kind,max){const active=w.s.zones.filter(z=>z.owner===p.id&&z.kind===kind&&z.life>0);for(const z of active.slice(0,Math.max(0,active.length-max)))z.life=0;}
function freeze(e,seconds){if(e.prop||e.type===7)return;if(e.type===4)e.slow=Math.max(e.slow||0,seconds);else e.frozen=Math.max(e.frozen||0,seconds);}
function lineDistance(e,x,y,tx,ty){const dx=tx-x,dy=ty-y,d=dx*dx+dy*dy,t=d?clamp(((e.x-x)*dx+(e.y-y)*dy)/d,0,1):0;return Math.hypot(e.x-x-dx*t,e.y-y-dy*t);}
function mark(w,p,e,weapon,evolved=false){
 if(e.prop||e.hp<=0)return;
 let z=w.s.zones.find(z=>z.kind==='bloodmark'&&z.owner===p.id&&z.target===e.id&&z.life>0);
 if(!z){z=field(w,p,weapon,'bloodmark',e.x,e.y,20,0,4,{target:e.id,stacks:0});trim(w,p,'bloodmark',4);}
 z.stacks++;z.life=z.max;z.weapon=weapon;
 if(z.stacks>=3){z.life=0;w.guard(p,weapon,{x:e.x,y:e.y,radius:45});w.damage(e,p.damage*(evolved?2.5:1.8),p,p,weapon);w.effect(e.x,e.y,'rune',.3,45);
  if(w.s.time>=(p.leechAt||0)){p.hp=Math.min(p.maxHp,p.hp+(evolved?3:2));p.leechAt=w.s.time+.75;}
 }
}
export function onRitualHit(w,b,p,e){if(b.weapon==='bloodneedle')mark(w,p,e,'bloodneedle');}
export function stepRitualArsenal(w,p,dt,target,cast){
 cast('bell',2.9,(rank,evo)=>{const count=evo?3:rank>=4?2:1;for(let i=0;i<count;i++)field(w,p,'bell','bellwave',p.x,p.y,180+rank*28,p.damage*(1.05+rank*.2)*(evo?1.35:1),1.2+i*.3,{wait:i*.3*weaponDuration(p),travel:1.2*weaponDuration(p),waveRadius:0,hit:[],evolved:!!evo});trim(w,p,'bellwave',4);});
 cast('gauntlet',1.85,(rank,evo)=>{field(w,p,'gauntlet','punch',p.x,p.y,120+rank*18,p.damage*(.9+rank*.18),.9,{angle:aim(p,target),stage:0,evolved:!!evo});trim(w,p,'punch',2);});
 cast('hourglass',4.8,rank=>{field(w,p,'hourglass','sandglass',target.x,target.y,90+rank*13,p.damage*(2.5+rank*.4),2.2,{wait:.45,delay:.45});trim(w,p,'sandglass',2);});
 cast('bloodneedle',1.3,rank=>{const count=1+Math.floor(rank/3)+(p.ranks.volley||0),angle=aim(p,target);for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.12;w.s.shots.push({id:w.nextId(),born:Math.round(w.s.time*1000)/1000,owner:p.id,weapon:'bloodneedle',x:p.x,y:p.y-8,angle:a,vx:Math.cos(a)*710,vy:Math.sin(a)*710,damage:p.damage*(.65+rank*.12),life:1.1*weaponDuration(p),scale:weaponScale(p),pierce:2+Math.floor(rank/2),hit:[],sprite:51});}});
 cast('loom',4,rank=>{const a=aim(p,target),forward=clamp(dist(p,target),95,210),x=p.x+Math.cos(a)*forward,y=p.y+Math.sin(a)*forward,half=(100+rank*13)*weaponScale(p);field(w,p,'loom','thunderline',x-Math.sin(a)*half,y+Math.cos(a)*half,14,p.damage*(.65+rank*.15),5,{tx:x+Math.sin(a)*half,ty:y-Math.cos(a)*half,wait:.35,delay:.35});trim(w,p,'thunderline',2);});
 cast('flail',2.1,(rank,evo)=>{field(w,p,'flail','flail',p.x,p.y,120+rank*18,p.damage*(1.05+rank*.22),2.2,{phase:(p.index||0)*.7,headRadius:(36+rank*2)*weaponScale(p),evolved:!!evo});trim(w,p,'flail',1);});
}
export function flailHeads(z,time){const a=time*3.2+(z.phase||0);return Array.from({length:z.evolved?2:1},(_,i)=>{const angle=a+i*Math.PI;return{x:z.x+Math.cos(angle)*z.radius,y:z.y+Math.sin(angle*2)*z.radius*.32,angle};});}
export function stepRitualField(w,z,p,dt){
 if(!kinds.has(z.kind))return false;if(z.life<=0)return true;
 if(z.kind==='bellwave'){
  const before=z.waveRadius||0,radius=clamp(1-z.life/z.travel,0,1)*z.radius;z.waveRadius=radius;w.guard(p,'bell',{kind:'ring',x:z.x,y:z.y,radius:radius+20,inner:Math.max(0,before-20)});
  for(const e of w.targets())if(e.hp>0&&!z.hit.includes(e.id)&&dist(e,z)>=before-e.size-20&&dist(e,z)<=radius+e.size+20){z.hit.push(e.id);w.damage(e,z.damage,p,z,'bell');if(z.evolved)freeze(e,.55);}
 }else if(z.kind==='punch'){
  const age=z.max-z.life;while(z.stage<3&&age>=[.08,.3,.61][z.stage]){const stage=z.stage++,length=z.radius*(stage===2?1.65:1),dx=Math.cos(z.angle),dy=Math.sin(z.angle);z.struckAt=w.s.time;w.guard(p,'gauntlet',{kind:'line',x:z.x,y:z.y,tx:z.x+dx*length,ty:z.y+dy*length,radius:(stage===2?40:27)*weaponScale(p)});w.castPose(p,'gauntlet',{x:z.x+dx*length,y:z.y+dy*length});
   for(const e of w.targets()){const x=e.x-z.x,y=e.y-z.y,along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);if(e.hp>0&&along>=-e.size&&along<length+e.size&&side<(stage===2?40:27)*weaponScale(p)+e.size){w.damage(e,z.damage*(stage===2?2.2:1)*(z.evolved?1.4:1),p,z,'gauntlet');if(z.evolved)mark(w,p,e,'gauntlet',true);}}
  }
 }else if(z.kind==='sandglass'){
  w.guard(p,'hourglass',{x:z.x,y:z.y,radius:z.radius});
  for(const e of w.targets())if(e.hp>0&&dist(e,z)<z.radius+e.size)freeze(e,.12);
  if(z.life<=.35&&!z.exploded){z.exploded=true;w.effect(z.x,z.y,'winter',.4,z.radius);for(const e of w.targets())if(e.hp>0&&dist(e,z)<z.radius+e.size)w.damage(e,z.damage,p,z,'hourglass');}
 }else if(z.kind==='bloodmark'){
  const e=w.s.enemies.find(e=>e.id===z.target&&e.hp>0);if(!e){z.life=0;return true;}z.x=e.x;z.y=e.y-43;
 }else if(z.kind==='thunderline'){
  w.guard(p,'loom',{kind:'line',x:z.x,y:z.y,tx:z.tx,ty:z.ty,radius:z.radius});
  if(z.tick<=0){z.tick=.3;for(const e of w.targets())if(e.hp>0&&lineDistance(e,z.x,z.y,z.tx,z.ty)<z.radius+e.size)w.damage(e,z.damage,p,z,'loom');}
 }else{
  z.x=p.x;z.y=p.y;const heads=flailHeads(z,w.s.time);for(const h of heads){w.guard(p,'flail',{x:h.x,y:h.y,radius:z.headRadius});if(z.evolved)w.guard(p,'flail',{kind:'line',x:z.x,y:z.y,tx:h.x,ty:h.y,radius:10});}
  if(z.tick<=0){z.tick=.16;for(const e of w.targets())if(e.hp>0&&heads.some(h=>dist(e,h)<z.headRadius+e.size))w.damage(e,z.damage,p,z,'flail');
   if(z.evolved)for(const e of w.targets())if(e.hp>0&&heads.some(h=>lineDistance(e,z.x,z.y,h.x,h.y)<10+e.size))w.damage(e,z.damage*.4,p,z,'flail');
  }
 }return true;
}
// All effects below are code drawn, share owner opacity/culling and reduced
// motion settings, and never mutate the authoritative fields they display.
export function drawRitualField(r,z,time,s){
 if(!kinds.has(z.kind))return false;
 if(z.kind==='flail'){const owner=s?.players.find(p=>p.id===z.owner);if(owner)z={...z,x:owner.x,y:owner.y};}
 const c=r.ctx,reduced=r.weaponFX.reducedMotion,phase=reduced?0:time,style=UPGRADES[z.weapon],color=style?.color||'#ddd6bd';
 const line=(points,ink=color,width=2)=>{c.strokeStyle=ink;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x/2)*2,Math.round(y/2)*2):c.moveTo(Math.round(x/2)*2,Math.round(y/2)*2));c.stroke();};
 const ring=(x,y,radius,ink=color,width=2)=>{c.strokeStyle=ink;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(0,radius),0,tau);c.stroke();};
 const glyph=(sprite,x,y,size,angle=0)=>{const atlas=r.weaponAtlas;if(!atlas?.complete||!atlas.naturalWidth)return;const index=sprite-16;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(Math.round(angle/(Math.PI/8))*Math.PI/8);c.imageSmoothingEnabled=false;c.drawImage(atlas,index%6*64,Math.floor(index/6)*64,64,64,-size/2,-size/2,size,size);c.restore();};
 if(z.kind==='bellwave'){
  const radius=z.wait>0?12:clamp(1-z.life/z.travel,0,1)*z.radius;ring(z.x,z.y,radius,color,3);ring(z.x,z.y,Math.max(0,radius-10),'#eee4c2',1);
  for(let i=0;i<10;i++){const a=i*tau/10+phase*.15;c.fillStyle=i%2?'#f6e3b4':color;c.fillRect(Math.round((z.x+Math.cos(a)*radius)/2)*2,Math.round((z.y+Math.sin(a)*radius)/2)*2,4,4);}if(z.evolved)ring(z.x,z.y,radius*.8,'#b9bce1');
 }else if(z.kind==='punch'){
  const age=z.max-z.life,stage=Math.max(0,z.stage-1),elapsed=time-(z.struckAt??time),reach=z.radius*(stage===2?1.65:1),a=z.angle;
  c.save();c.translate(z.x,z.y);c.rotate(a);const travel=clamp(elapsed/.22,0,1),x=25+reach*travel;
  if(stage===2){for(let i=0;i<5;i++){const d=i*reach/5;line([[d,-12-i*4],[d+19,7+i*4],[d+38,-9]],z.evolved?'#d58d9e':'#c5a684',2);}ring(reach,0,25+travel*45,color,2);}
  if(age>.06){glyph(z.evolved?55:49,x,(stage%2?9:-9),stage===2?78:52,-Math.PI/2);for(let i=0;i<3;i++)line([[x-40-i*13,-11+i*11],[x-9,-11+i*11]],color,2);}c.restore();
 }else if(z.kind==='sandglass'){
  ring(z.x,z.y,z.radius,'#888dbb');ring(z.x,z.y,z.radius*.84,'#d0c8e8',1);
  for(let i=0;i<12;i++){const a=i*tau/12;line([[z.x+Math.cos(a)*z.radius*.9,z.y+Math.sin(a)*z.radius*.9],[z.x+Math.cos(a)*z.radius,z.y+Math.sin(a)*z.radius]],color,i%3===0?3:1);}
  glyph(50,z.x,z.y-24,45);line([[z.x,z.y],[z.x+Math.cos(-phase)*z.radius*.6,z.y+Math.sin(-phase)*z.radius*.6]],'#e4d3b1',2);
  for(let i=0;i<6;i++){const a=i*2.4;c.fillStyle='#dcd3ef';c.fillRect(z.x+Math.cos(a)*z.radius*.7,z.y+Math.sin(a)*z.radius*.7,3,3);}
 }else if(z.kind==='bloodmark'){
  for(let i=0;i<z.stacks;i++){const x=z.x+(i-(z.stacks-1)/2)*10;c.fillStyle='#df9eaf';c.beginPath();c.moveTo(x,z.y-6);c.lineTo(x+4,z.y);c.lineTo(x,z.y+5);c.lineTo(x-4,z.y);c.closePath();c.fill();}
 }else if(z.kind==='thunderline'){
  glyph(52,z.x,z.y,48);glyph(52,z.tx,z.ty,48);const points=[];for(let i=0;i<=12;i++){const t=i/12,j=i===0||i===12||z.wait>0?0:Math.sin(i*3+Math.floor(phase*8))*8;points.push([z.x+(z.tx-z.x)*t+j,z.y+(z.ty-z.y)*t+j]);}
  line(points,'#77a2bd',5);line(points,z.wait>0?'#8e9ba7':'#e0f0df',1.5);ring(z.x,z.y,17,'#a1cedb');ring(z.tx,z.ty,17,'#a1cedb');
 }else{
  for(const h of flailHeads(z,time)){const points=[];for(let i=0;i<=9;i++){const t=i/9,x=z.x+(h.x-z.x)*t,y=z.y+(h.y-z.y)*t+Math.sin(t*Math.PI)*13;points.push([x,y]);if(i%2===0)ring(x,y,3,z.evolved?'#b7dfe6':'#9b967f',1);}
   line(points,z.evolved?'#adcddb':'#837c72',2);if(z.evolved){line(points.map(([x,y],i)=>[x,y+(i%2?4:-4)]),'#e5f2de',1);ring(h.x,h.y,z.headRadius,'#a9cddd',1);}glyph(z.evolved?56:53,h.x,h.y,z.headRadius*1.8,h.angle);
  }
 }return true;
}
