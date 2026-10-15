import {ownsWeapon,weaponScale,weaponDuration,weaponCooldown} from './equipment.mjs';
export const ARENA_W=3600,ARENA_H=2400;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function collideDestructibles(entity,props){
 for(const object of props||[]){if(object.hp<=0)continue;const dx=entity.x-object.x,dy=entity.y-object.y,d=Math.hypot(dx,dy),radius=object.size+14;if(d<radius){entity.x=object.x+(d?dx/d:1)*radius;entity.y=object.y+(d?dy/d:0)*radius;}}
}
/** Each host rolls one scatter layout. Rejection is bounded, even with a constant RNG. */
export function createDestructibles(random=Math.random){
 const props=[],margin=110;
 const safe=(x,y)=>Array.from({length:4},(_,i)=>({x:1200+i*65,y:800})).every(p=>Math.hypot(x-p.x,y-p.y)>=240)&&props.every(p=>Math.hypot(x-p.x,y-p.y)>=105);
 const add=(x,y)=>{const id=props.length,kind=id%3,hp=[38,52,28][kind];props.push({id:-id-1,prop:true,kind,x:Math.round(x),y:Math.round(y),size:[22,19,16][kind],hp,maxHp:hp,hit:0});};
 for(let attempt=0;attempt<840&&props.length<70;attempt++){const x=Math.round(margin+random()*(ARENA_W-margin*2)),y=Math.round(margin+random()*(ARENA_H-margin*2));if(safe(x,y))add(x,y);}
 // Dense enough for exploration without an unbounded retry on injected RNGs.
 for(let row=0;row<12&&props.length<70;row++)for(let col=0;col<18&&props.length<70;col++){const x=Math.round(margin+col*(ARENA_W-margin*2)/17),y=Math.round(margin+row*(ARENA_H-margin*2)/11);if(safe(x,y))add(x,y);}
 return props;
}
export function damageDestructible(w,object,amount){
 if(object.hp<=0)return;object.hp=Math.max(0,object.hp-amount);object.hit=.16;if(object.hp>0)return;
 object.broken=true;object.brokenAt=w.s.time;const heart=object.kind===2,value=heart?1:object.kind===1?24:8;
 w.s.gems.push({id:w.nextId(),x:object.x,y:object.y,v:value,type:heart?'heart':'gem'});
 w.s.effects.push({id:w.nextId(),x:object.x,y:object.y,type:'propBreak',kind:object.kind,life:.6,max:.6,size:42});w.events.push('kill');
}
export function experienceAppearance(value){
 const tier=value>=80?3:value>=20?2:value>=5?1:0;
 return [{tier:0,color:'#79c9a0',core:'#d6f2bd',size:19},{tier:1,color:'#65adf0',core:'#c7e9ff',size:24},{tier:2,color:'#b78aeb',core:'#ead7ff',size:29},{tier:3,color:'#edc66e',core:'#fff0b7',size:35}][tier];
}
export function stepMirrorShield(w,p,dt,target){
 if(!ownsWeapon(p,'aegis')){p.shieldUntil=0;return;}
 const rank=p.ranks.aegis,evolved=p.evolutions.aegis==='moonward',radius=(100+rank*10+(evolved?45:0))*weaponScale(p);
 const incoming=w.s.hostile.some(b=>b.life>0&&distance(p,b)<radius+Math.min(90,Math.max(10,Math.hypot(b.vx||0,b.vy||0)*.25)));
 if((p.cooldowns.aegis||0)<=0&&(incoming||target&&distance(p,target)<radius+(target.size||0))){
  p.cooldowns.aegis=weaponCooldown(p,evolved?1.65:2.9-rank*.16);p.shieldUntil=w.s.time+(evolved?1.1:.65)*weaponDuration(p);p.shieldBudget=(evolved?16:6)+rank*2;p.shieldRadius=radius;
  w.castPose(p,'aegis',target);w.s.effects.push({id:w.nextId(),x:p.x,y:p.y,type:'wardPulse',owner:p.id,size:radius,life:.55,max:.55,evolved});
  for(const e of w.targets())if(e.hp>0&&distance(p,e)<radius+e.size)w.damage(e,p.damage*(.65+rank*.15)*(evolved?1.6:1),p,p,'aegis');w.events.push('forge');
 }
 if(p.shieldUntil<=w.s.time||p.shieldBudget<=0)return;
 for(const bullet of w.s.hostile){
  if(p.shieldBudget<=0)break;if(bullet.life<=0||distance(p,bullet)>p.shieldRadius+(bullet.radius||0))continue;
  bullet.life=0;p.shieldBudget--;p.blockedShots=(p.blockedShots||0)+1;
  let enemy=null,near=700;for(const e of w.s.enemies){const d=distance(p,e);if(e.hp>0&&d<near){enemy=e;near=d;}}
  if(!enemy)continue;const angle=Math.atan2(enemy.y-p.y,enemy.x-p.x);
  w.s.shots.push({id:w.nextId(),born:w.s.time,x:bullet.x,y:bullet.y,vx:Math.cos(angle)*620,vy:Math.sin(angle)*620,angle,life:1.2*weaponDuration(p),owner:p.id,weapon:'aegis',damage:p.damage*(1+rank*.15)*(evolved?1.5:1),sprite:evolved?47:46,pierce:evolved?3:1,hit:[],scale:weaponScale(p)});
 }
}
export function drawExperience(renderer,gem,time){
 const c=renderer.ctx,{tier,color,core,size}=experienceAppearance(gem.value||gem.v),x=Math.round(gem.x/2)*2,y=Math.round((gem.y+Math.sin(time*3+gem.id)*2)/2)*2;
 const diamond=(cx,cy,r,fill)=>{c.fillStyle=fill;c.beginPath();c.moveTo(cx,cy-r);c.lineTo(cx+r*.65,cy);c.lineTo(cx,cy+r);c.lineTo(cx-r*.65,cy);c.closePath();c.fill();};
 c.save();c.fillStyle='#060e1b70';c.fillRect(x-size*.45,y+size*.55,size*.9,3);
 if(tier===3){diamond(x-10,y+3,7,color);diamond(x+10,y+3,7,color);}diamond(x,y,size*.57,'#101d2b');diamond(x,y,size*.43,color);
 c.fillStyle=core;c.beginPath();c.moveTo(x,y-size*.43);c.lineTo(x+size*.28,y);c.lineTo(x,y+size*.27);c.closePath();c.fill();c.fillStyle='#ffffffc9';c.fillRect(x-2,y-size*.31,2,4);
 if(tier>=2){c.fillStyle=core;c.fillRect(x+size*.55,y-6,2,2);c.fillRect(x-size*.6,y+3,2,2);}c.restore();
}
export function drawDestructible(renderer,object){
 const c=renderer.ctx,x=object.x,y=object.y;c.save();
 if(object.hp<=0){c.globalAlpha=.45;c.fillStyle=object.kind===1?'#7c7f94':'#8b7256';for(let i=0;i<5;i++)c.fillRect(x-17+i*8,y+Math.sin(i*4+object.id)*6,6,3);c.restore();return;}
 c.fillStyle='#030a1560';c.beginPath();c.ellipse(x,y+8,object.size+4,8,0,0,Math.PI*2);c.fill();
 if(renderer.frontierAtlas?.complete&&renderer.frontierAtlas.naturalWidth)c.drawImage(renderer.frontierAtlas,object.kind*64,0,64,64,x-37,y-48,74,74);
 if(object.hit>0){c.globalAlpha=object.hit/.16*.55;c.fillStyle='#f7ddb0';c.fillRect(x-15,y-29,30,25);}
 if(object.hp<object.maxHp){c.fillStyle='#131d29';c.fillRect(x-16,y-48,32,3);c.fillStyle='#bead83';c.fillRect(x-16,y-48,32*object.hp/object.maxHp,3);}c.restore();
}
export function drawFrontierEffect(renderer,effect){
 if(!['wardPulse','propBreak'].includes(effect.type))return false;
 const c=renderer.ctx,t=1-effect.life/effect.max;c.save();c.globalAlpha=1-t;
 if(effect.type==='propBreak'){
  const colors=effect.kind===1?['#b8a6bb','#6d7189']:['#d5b47d','#887456'];
  for(let i=0;i<10;i++){const angle=i*2.4+effect.id,d=(12+effect.size*t)*(i%3+1)/3;c.fillStyle=colors[i%2];c.fillRect(Math.round(effect.x+Math.cos(angle)*d),Math.round(effect.y+Math.sin(angle)*d-t*17),i%2?4:6,3);}
 }else{
  const radius=effect.size*(.35+.65*t);c.strokeStyle=effect.evolved?'#efe0a1':'#aadfe5';c.lineWidth=3;c.beginPath();c.arc(effect.x,effect.y,radius,0,Math.PI*2);c.stroke();
  for(let i=0;i<8;i++){const a=i*Math.PI/4+t*.3;c.fillStyle=i%2?'#d7f1eb':'#819cc9';c.fillRect(effect.x+Math.cos(a)*radius-3,effect.y+Math.sin(a)*radius-3,6,6);}
 }c.restore();return true;
}
export function drawMirrorShield(renderer,p,time){
 if(!ownsWeapon(p,'aegis')||p.hp<=0)return;
 const active=p.shieldUntil>time&&p.shieldBudget>0,evolved=p.evolutions.aegis==='moonward',radius=active?p.shieldRadius:52,c=renderer.ctx;
 c.save();c.globalAlpha=active?.65:.52;c.strokeStyle=evolved?'#f0d6a0':'#a9d3e3';c.lineWidth=active?2:1;
 for(let i=0;i<(evolved?4:3);i++){const a=time*.7+i*Math.PI*2/(evolved?4:3);c.beginPath();c.arc(p.x,p.y,radius,a-.18,a+.18);c.stroke();if(!active)renderer.sprite(evolved?47:46,p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius,25,1,.7,a);}
 if(active){c.fillStyle='#8ac4d610';c.beginPath();c.arc(p.x,p.y,radius,0,Math.PI*2);c.fill();}c.restore();
}
