import {weaponScale,weaponDuration,UPGRADES} from './equipment.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
/** One host-simulated bird per owner, transported with the existing zone pool. */
export function castPelican(w,p,rank){
 if(w.s.zones.some(z=>z.owner===p.id&&z.kind==='pelican'&&z.life>0))return;
 const life=3.6*weaponDuration(p),scale=weaponScale(p);
 w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'pelican',kind:'pelican',x:p.x,y:p.y-32,radius:64*scale,scale,damage:p.damage*(.34+rank*.1),life,max:life,wait:0,tick:0,rank,angle:p.face===-1?Math.PI:0,phase:'chase'});
}
export function pelicanTip(z){return{x:z.x+Math.cos(z.angle)*36*z.scale,y:z.y+Math.sin(z.angle)*36*z.scale};}
export function stepPelican(w,z,p,dt){
 if(z.life<=0)return;
 let target=w.targets().find(e=>e.id===z.target&&e.hp>0&&dist(p,e)<900);
 if(!target){let best=Infinity;for(const e of w.targets()){if(e.hp<=0||dist(p,e)>900)continue;const d=dist(z,e)+(e.prop?450:0);if(d<best){best=d;target=e;}}z.target=target?.id;}
 const home=z.life<.5||!target||dist(z,p)>1000;
 const goal=home?{x:p.x,y:p.y-35}:target,dx=goal.x-z.x,dy=goal.y-z.y,d=Math.hypot(dx,dy);
 z.angle=Math.atan2(dy,dx);z.phase=home?'return':d<48*z.scale+(target?.size||0)?'saw':'chase';
 const reach=home?8:34*z.scale+(target?.size||0),travel=Math.min(Math.max(0,d-reach),(home?440:350+z.rank*25)*dt);
 z.x=clamp(z.x+Math.cos(z.angle)*travel,60,w.s.width-60);z.y=clamp(z.y+Math.sin(z.angle)*travel,60,w.s.height-60);
 if(z.phase==='saw')w.guard(p,'pelican',{...pelicanTip(z),radius:24*z.scale});
 if(z.phase!=='saw'||z.tick>0)return;
 z.tick=.16;const tip=pelicanTip(z);let hit=false;
 for(const e of w.targets())if(e.hp>0&&dist(e,tip)<24*z.scale+e.size){w.damage(e,z.damage,p,z,'pelican');hit=true;}
 if(hit)z.sawAt=w.s.time;
}
/** Pixel sprite, flapping wing, moving chain and contact sparks; presentation only. */
export function drawPelican(r,z,time){
 const c=r.ctx,reduced=r.weaponFX.reducedMotion,phase=reduced?0:time,scale=z.scale||1,face=Math.cos(z.angle)<0?-1:1,saw=z.phase==='saw';
 c.save();c.translate(Math.round(z.x/2)*2,Math.round(z.y/2)*2);
 c.fillStyle='#0c142b66';c.beginPath();c.ellipse(0,27*scale,25*scale,7*scale,0,0,Math.PI*2);c.fill();
 c.rotate(z.angle+(face<0?Math.PI:0));c.scale(face*scale,scale);c.translate(0,reduced?0:Math.round(Math.sin(phase*12)*2));
 const atlas=r.weaponAtlas,index=UPGRADES.pelican.sprite-16;
 if(atlas?.complete&&atlas.naturalWidth){c.imageSmoothingEnabled=false;c.drawImage(atlas,index%6*64,Math.floor(index/6)*64,64,64,-48,-48,96,96);}
 // The free wing beats above the body while the other wing holds the saw.
 const lift=reduced?5:Math.round((Math.sin(phase*15)+1)*7);
 c.fillStyle='#a9becb';c.beginPath();c.moveTo(-23,3);c.lineTo(-39,-4-lift);c.lineTo(-35,-14-lift);c.lineTo(-17,-5);c.closePath();c.fill();
 c.fillStyle='#edf2e5';c.beginPath();c.moveTo(-23,0);c.lineTo(-37,-7-lift);c.lineTo(-33,-12-lift);c.lineTo(-18,-7);c.closePath();c.fill();
 const chain=reduced?0:Math.floor(phase*35)%5;c.fillStyle='#f0e6ba';for(let i=0;i<4;i++){c.fillRect(18+i*6+chain,9,3,2);c.fillRect(18+i*6-chain,21,3,2);}
 if(saw){c.strokeStyle='#f0d68b';c.lineWidth=2;for(let i=0;i<5;i++){const a=i*1.4+phase*8,l=7+(i%3)*4,x=43,y=15;c.beginPath();c.moveTo(x+Math.cos(a)*5,y+Math.sin(a)*5);c.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);c.stroke();}}
 if(z.phase==='chase'&&!reduced){c.fillStyle='#c4d9db66';for(let i=0;i<3;i++)c.fillRect(-48-i*8,-7+i*9,10,2);}
 c.restore();
}
