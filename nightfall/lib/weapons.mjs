import {stepMemeArsenal,stepMemeShot,stepMemeField} from './meme-arsenal.mjs';
import {castZmd,stepZmdField} from './zmd.mjs';
import {castPelican,stepPelican} from './pelican.mjs';
import { ownsWeapon, UPGRADES, weaponScale, weaponDuration, weaponCooldown } from './equipment.mjs';
import {stepNewArsenal,stepNewShot,stepNewField} from './arsenal-extra.mjs';
import {stepRitualArsenal,stepRitualField} from './arsenal-ritual.mjs';
import {stepSwordArsenal,stepSwordField} from './dual-swords.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function shot(w,p,key,angle,options={}){
 const speed=options.speed||520;
 w.s.shots.push({born:Math.round(w.s.time*1000)/1000,id:w.nextId(),x:p.x,y:p.y-10,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.6,owner:p.id,weapon:key,damage:p.damage,angle,hit:[],pierce:3,sprite:UPGRADES[key].sprite,...options,scale:weaponScale(p),life:(options.life||1.6)*weaponDuration(p)});
}
function zone(w,p,kind,x,y,radius,damage,life,delay=0){radius*=weaponScale(p);life*=weaponDuration(p);
 w.s.zones.push({born:Math.round(w.s.time*1000)/1000,id:w.nextId(),owner:p.id,weapon:kind==='sigil'?'sigil':kind==='void'?'prism':'ember',kind,x,y,radius,damage,life,max:life,delay,wait:delay,tick:0});
}
function slash(w,p,angle,radius,full,damage){radius*=weaponScale(p);
 w.s.effects.push({id:w.nextId(),type:'slash',x:p.x,y:p.y,angle,size:radius,full,life:.32,max:.32});
 w.guard(p,'scythe',{kind:full?'circle':'cone',x:p.x,y:p.y,radius,angle,halfAngle:1.15});
 for(const e of w.targets())if(e.hp>0&&distance(p,e)<radius+e.size&&(full||Math.abs(angleDelta(aim(p,e),angle))<1.15))w.damage(e,damage,p,p,'scythe');
}
/** Each weapon schedules independently; all damage remains in the host World. */
export function stepArsenal(w,p,dt,target){
 p.cooldowns||={};for(const key of Object.keys(p.cooldowns))p.cooldowns[key]-=dt;
 const cast=(key,seconds,fn)=>{if(ownsWeapon(p,key)&&target&&(p.cooldowns[key]||0)<=0){p.cooldowns[key]=weaponCooldown(p,seconds);w.castPose(p,key,target);fn(p.ranks[key],p.evolutions[key]);w.events.push('shoot');}};
 cast('spear',1.45,(rank,evo)=>{
  const a=aim(p,target);
  if(evo==='solar'){
   w.s.beams.push({id:w.nextId(),owner:p.id,weapon:'spear',kind:'solar',angle:a,length:940,width:22*weaponScale(p),damage:p.damage*3,life:.34*weaponDuration(p),max:.34*weaponDuration(p),tick:0,follow:false});
   for(let i=-1;i<=1;i++)shot(w,p,'blade',a+i*.2,{weapon:'spear',damage:p.damage*1.5,pierce:5,sprite:8});
  }else for(let i=0;i<1+(p.ranks.volley||0);i++)shot(w,p,'spear',a+(i-(p.ranks.volley||0)/2)*.14,{speed:850,damage:p.damage*(1.6+rank*.35),pierce:3+rank,life:1.1});
 });
 cast('ember',2.7,(rank,evo)=>{
  if(evo==='inferno')for(let i=0;i<3;i++)zone(w,p,'meteor',target.x+(i-1)*100,target.y+(i%2)*60,100+rank*8,p.damage*3,1.1+i*.18,.55+i*.18);
  else{
   const tx=target.x,ty=target.y,flight=Math.max(.3,Math.min(.7,distance(p,target)/650));
   for(let i=0;i<1+(p.ranks.volley||0);i++)shot(w,p,'ember',aim(p,target),{kind:'flask',sx:p.x,sy:p.y-10,tx:tx+(i-(p.ranks.volley||0)/2)*85,ty,elapsed:0,flight,life:flight+.1,rank,damage:p.damage*.48});
  }
 });
 cast('axe',2.15,(rank)=>{for(let i=0;i<Math.ceil(rank/2)+(p.ranks.volley||0);i++)shot(w,p,'axe',aim(p,target)+(i-(Math.ceil(rank/2)+(p.ranks.volley||0)-1)/2)*.35,{kind:'return',age:0,speed:360,life:2.8,damage:p.damage*(1.25+rank*.18),pierce:99});});
 cast('bow',1.05,(rank,evo)=>{for(let i=0;i<rank+1+(p.ranks.volley||0);i++)shot(w,p,'bow',aim(p,target)+(i-(rank+(p.ranks.volley||0))/2)*.1,{speed:760,damage:p.damage*(evo?1.25:.7),life:1.1,pierce:evo?6:1,shock:evo==='thunderbow',sprite:evo?31:23});});
 cast('scythe',1.6,(rank,evo)=>{
  const a=aim(p,target),full=evo==='reaper',radius=full?235:110+rank*17;
  slash(w,p,a,radius,full,p.damage*(1.7+rank*.3)*(full?1.4:1));
  if(full)for(let i=0;i<3;i++)shot(w,p,'scythe',a+i*Math.PI*2/3,{kind:'return',age:0,speed:390,life:2.6,damage:p.damage*1.8,pierce:99,sprite:30});
 });
 cast('sigil',2.8,(rank)=>{zone(w,p,'sigil',target.x,target.y,90+rank*16,p.damage*(2.3+rank*.4),1.25,.8);});
 cast('prism',2.6,(rank,evo)=>{
  w.s.beams.push({id:w.nextId(),owner:p.id,weapon:'prism',kind:evo==='void'?'void':'prism',angle:aim(p,target),target:target.id,length:evo?670:490,width:(evo?40:10+rank*3)*weaponScale(p),damage:p.damage*(evo?1.1:.42+rank*.06),life:1.05*weaponDuration(p),max:1.05*weaponDuration(p),tick:0,follow:true});
  if(evo==='void')zone(w,p,'void',target.x,target.y,160,p.damage*.55,2.8);
 });
 cast('zmd',5.4,(rank,evo)=>castZmd(w,p,rank,evo==='dijiang',target));
 cast('pelican',4.6,rank=>castPelican(w,p,rank));
 stepMemeArsenal(w,p,target,cast);
 stepNewArsenal(w,p,dt,target,cast);
 stepRitualArsenal(w,p,dt,target,cast);
 stepSwordArsenal(w,p,target,cast);
 if(!ownsWeapon(p,'familiar')){p.familiars=[];return;}
 const evolved=p.evolutions.familiar==='seraph',count=evolved?3:Math.ceil(p.ranks.familiar/2);
 p.familiars||=[];
 while(p.familiars.length<count)p.familiars.push({id:w.nextId(),x:p.x,y:p.y,phase:'orbit',cooldown:.25+p.familiars.length*.35});
 p.familiars.length=count;
 for(let i=0;i<count;i++){
  const bird=p.familiars[i];bird.cooldown-=dt;
  if(bird.phase==='orbit'){
   const a=w.s.time*2+i*Math.PI*2/count;bird.x=p.x+Math.cos(a)*70;bird.y=p.y-35+Math.sin(a)*48;
   if(target&&bird.cooldown<=0){bird.target=target.id;bird.phase='dive';bird.timeout=1.2;}
  }else if(bird.phase==='dive'){
   const ox=bird.x,oy=bird.y;
   bird.timeout-=dt;const e=w.targets().find(e=>e.id===bird.target&&e.hp>0);
   if(!e||bird.timeout<=0){bird.phase='return';continue;}
   const a=aim(bird,e),step=620*dt;bird.angle=a;
   if(distance(bird,e)<step+e.size+12*(weaponScale(p)-1)){
    w.damage(e,p.damage*(evolved?2.5:1.5+p.ranks.familiar*.25),p,bird,'familiar');
    if(evolved)for(let j=0;j<6;j++)shot(w,p,'familiar',j*Math.PI/3,{x:bird.x,y:bird.y,speed:400,damage:p.damage*.8,life:.8,pierce:2,sprite:26});
    bird.phase='return';
   }else{bird.x+=Math.cos(a)*step;bird.y+=Math.sin(a)*step;}
   w.guard(p,'familiar',{kind:'line',x:ox,y:oy,tx:bird.x,ty:bird.y,radius:20*weaponScale(p)});
  }else{
   const d=distance(bird,p),a=aim(bird,p);bird.x+=Math.cos(a)*Math.min(d,480*dt);bird.y+=Math.sin(a)*Math.min(d,480*dt);
   if(d<65){bird.phase='orbit';bird.cooldown=weaponCooldown(p,evolved?.8:1.6);}
  }
 }
}
/** Handles non-linear shots; returns true when normal projectile movement must be skipped. */
export function stepSpecialShot(w,b,p,dt){
 if(stepMemeShot(w,b,p,dt))return true;
 if(stepNewShot(w,b,p,dt))return true;
 if(b.kind==='flask'){
  b.elapsed+=dt;const t=Math.min(1,b.elapsed/b.flight);b.x=b.sx+(b.tx-b.sx)*t;b.y=b.sy+(b.ty-b.sy)*t-Math.sin(t*Math.PI)*95;b.life-=dt;
  if(t>=1){zone(w,p,'fire',b.tx,b.ty,65+b.rank*9,b.damage,2.2+b.rank*.3);w.effect(b.tx,b.ty,'fireburst',.35,80);b.life=0;}
  return true;
 }
 if(b.kind==='return'){
  b.age+=dt;
  if(b.age>.65){
   if(!b.returning){b.returning=true;b.hit=[];}
   const a=aim(b,p);b.vx=Math.cos(a)*540;b.vy=Math.sin(a)*540;
   if(distance(b,p)<30)b.life=0;
  }
 }
 return false;
}
export function stepWeaponEntities(w,dt){
 const s=w.s;
 for(const z of s.zones){
  const p=s.players.find(p=>p.id===z.owner);z.life-=dt;z.wait-=dt;z.tick-=dt;if(!p||p.hp<=0||p.connected===false){z.life=0;continue;}
  if(z.kind==='pelican'){stepPelican(w,z,p,dt);continue;}
  if(z.wait>0)continue;
  if(stepSwordField(w,z,p))continue;
  if(stepMemeField(w,z,p,dt))continue;
  if(stepZmdField(w,z,p,dt))continue;
  if(stepRitualField(w,z,p,dt))continue;
  if(stepNewField(w,z,p,dt))continue;
  if(z.kind==='sigil'||z.kind==='meteor'){
   if(!z.exploded){z.exploded=true;w.guard(p,z.weapon,{x:z.x,y:z.y,radius:z.radius});w.effect(z.x,z.y,z.kind==='meteor'?'fireburst':'rune',.5,z.radius);
    for(const e of w.targets())if(e.hp>0&&distance(e,z)<z.radius+e.size)w.damage(e,z.damage,p,z,z.weapon);
    if(z.kind==='meteor')zone(w,p,'fire',z.x,z.y,z.radius/weaponScale(p),z.damage*.16,2.5);
   }
  }else{
   w.guard(p,z.weapon,{x:z.x,y:z.y,radius:z.radius});
   if(z.kind==='void')for(const e of w.targets())if(e.hp>0&&!e.prop&&e.type!==7&&distance(e,z)<z.radius){const a=aim(e,z);e.x+=Math.cos(a)*95*dt;e.y+=Math.sin(a)*95*dt;e.slow=.3;}
   if(z.tick<=0){z.tick=.32;for(const e of w.targets())if(e.hp>0&&distance(e,z)<z.radius+e.size)w.damage(e,z.damage,p,z,z.weapon);}
  }
 }
 for(const b of s.beams){
  b.life-=dt;b.tick-=dt;const p=s.players.find(p=>p.id===b.owner);if(!p||p.hp<=0||p.connected===false){b.life=0;continue;}b.x=p.x;b.y=p.y-15;
  if(b.follow){let target=w.targets().find(e=>e.id===b.target&&e.hp>0);if(!target)target=w.targets().find(e=>e.hp>0&&distance(e,p)<b.length);if(target){b.target=target.id;b.angle+=angleDelta(aim(b,target),b.angle)*Math.min(1,dt*7);}}
  w.guard(p,b.weapon,{kind:'line',x:b.x,y:b.y,tx:b.x+Math.cos(b.angle)*b.length,ty:b.y+Math.sin(b.angle)*b.length,radius:b.width/2});
  if(b.tick<=0){b.tick=.18;const dx=Math.cos(b.angle),dy=Math.sin(b.angle);
   for(const e of w.targets()){const x=e.x-b.x,y=e.y-b.y,along=x*dx+y*dy,side=Math.abs(x*dy-y*dx);if(e.hp>0&&along>0&&along<b.length&&side<e.size+b.width/2)w.damage(e,b.damage,p,b,b.weapon);}
  }
 }
 s.zones=s.zones.filter(z=>z.life>0).slice(-64);s.beams=s.beams.filter(b=>b.life>0).slice(-16);
}
export function drawWeaponFields(renderer,s,time){renderer.weaponFX.drawFields(renderer,s,time);}
export function drawFamiliars(renderer,p,time){renderer.weaponFX.drawFamiliars(renderer,p,time);}
