import {weaponScale,weaponDuration} from './equipment.mjs';
import {segmentDistance} from './counterfire.mjs';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),tau=Math.PI*2;
export function castZmd(w,p,rank,evolved,target){
 const scale=weaponScale(p),duration=weaponDuration(p);
 if(evolved){const life=2.15*duration;w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'zmd',kind:'orbital',target:target.id,x:target.x,y:target.y,radius:(155+rank*10)*scale,scale,damage:p.damage*(14+rank*2),life,max:life,charge:1.05*duration,wait:0,tick:0,fired:false});return;}
 const a=Math.atan2(target.y-p.y,target.x-p.x),forward=Math.min(130,dist(p,target)*.6),x=p.x+Math.cos(a)*forward,y=p.y+Math.sin(a)*forward,span=(80+rank*7)*scale,life=8*duration;
 w.s.zones.push({id:w.nextId(),born:w.s.time,owner:p.id,weapon:'zmd',kind:'powergrid',x:clamp(x-Math.sin(a)*span,70,w.s.width-70),y:clamp(y+Math.cos(a)*span,70,w.s.height-70),tx:clamp(x+Math.sin(a)*span,70,w.s.width-70),ty:clamp(y-Math.cos(a)*span,70,w.s.height-70),radius:12*scale,range:(175+rank*20)*scale,scale,rank,damage:p.damage*(.6+rank*.16),life,max:life,wait:.45,tick:0,links:[]});
 const live=w.s.zones.filter(z=>z.owner===p.id&&z.kind==='powergrid'&&z.life>0);for(const z of live.slice(0,-2))z.life=0;
}
export function stepZmdField(w,z,p,dt){
 if(z.kind!=='powergrid'&&z.kind!=='orbital')return false;if(z.life<=0)return true;
 if(z.kind==='powergrid'){
  const line={kind:'line',x:z.x,y:z.y,tx:z.tx,ty:z.ty,radius:z.radius};w.guard(p,'zmd',line);
  if(z.tick<=0){z.tick=.38;z.links=[];z.firedAt=w.s.time;
   const targets=w.targets().filter(e=>e.hp>0),hit=new Set();
   for(const e of targets)if(segmentDistance(e.x,e.y,z.x,z.y,z.tx,z.ty)<z.radius+e.size){w.damage(e,z.damage,p,z,'zmd');hit.add(e.id);}
   for(const node of [{x:z.x,y:z.y},{x:z.tx,y:z.ty}]){
    const near=targets.filter(e=>!hit.has(e.id)&&dist(e,node)<z.range).sort((a,b)=>dist(a,node)-dist(b,node)).slice(0,1+Math.floor(z.rank/3));
    for(const e of near){hit.add(e.id);z.links.push({x:node.x,y:node.y,tx:e.x,ty:e.y});w.damage(e,z.damage,p,node,'zmd');}
   }
  }
  if(w.s.time-z.firedAt<.18)for(const link of z.links)w.guard(p,'zmd',{kind:'line',...link,radius:9*z.scale});
 }else{
  const age=z.max-z.life;
  if(age<z.charge*.72){const e=w.targets().find(e=>e.id===z.target&&e.hp>0);if(e){z.x=e.x;z.y=e.y;}}
  if(age<z.charge)return true;
  w.guard(p,'zmd',{x:z.x,y:z.y,radius:z.radius});w.guard(p,'zmd',{kind:'line',x:z.x,y:z.y-650,tx:z.x,ty:z.y,radius:28*z.scale});
  if(!z.fired){z.fired=true;z.firedAt=w.s.time;for(const e of w.targets())if(e.hp>0&&dist(e,z)<z.radius+e.size)w.damage(e,z.damage,p,z,'zmd');w.events.push('forge');}
  if(z.tick<=0){z.tick=.18;for(const e of w.targets())if(e.hp>0&&dist(e,z)<z.radius*.7+e.size)w.damage(e,p.damage*1.25,p,z,'zmd');}
 }return true;
}
export function drawZmdField(r,z,time){
 if(!['powergrid','orbital'].includes(z.kind))return false;
 const c=r.ctx,reduced=r.weaponFX.reducedMotion,phase=reduced?0:time,scale=z.scale||1;
 const line=(points,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let i=0;i<points.length;i++){const [x,y]=points[i];i?c.lineTo(Math.round(x/2)*2,Math.round(y/2)*2):c.moveTo(Math.round(x/2)*2,Math.round(y/2)*2);}c.stroke();};
 const ring=(x,y,radius,color,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(0,radius),0,tau);c.stroke();};
 const arc=(a,b,bright=true)=>{const points=[];for(let i=0;i<=12;i++){const t=i/12,j=i===0||i===12?0:Math.sin(i*2.1+Math.floor(phase*14))*7*scale;points.push([a.x+(b.x-a.x)*t+j,a.y+(b.y-a.y)*t+j]);}line(points,bright?'#eac757':'#8a998f',5*scale);line(points,bright?'#f6ffe4':'#c2cabb',1.5*scale);};
 if(z.kind==='powergrid'){
  const powered=z.wait<=0;line([[z.x,z.y-58*scale],[z.tx,z.ty-58*scale]],'#17252d',6*scale);line([[z.x,z.y-58*scale],[(z.x+z.tx)/2,(z.y+z.ty)/2-30*scale],[z.tx,z.ty-58*scale]],'#c4af64',2*scale);
  if(powered){arc(z,{x:z.tx,y:z.ty});if(time-z.firedAt<.2)for(const link of z.links)arc(link,{x:link.tx,y:link.ty});}
  for(const node of [{x:z.x,y:z.y},{x:z.tx,y:z.ty}]){
   c.save();c.translate(node.x,node.y);c.scale(scale,scale);c.fillStyle='#07111b80';c.beginPath();c.ellipse(0,7,27,10,0,0,tau);c.fill();
   c.fillStyle='#192634';c.fillRect(-25,-7,50,15);c.fillStyle='#87989d';c.fillRect(-21,-9,42,10);c.fillStyle='#d9dfd3';c.fillRect(-9,-64,18,57);c.fillStyle='#576d79';c.fillRect(4,-62,5,53);
   c.fillStyle='#e1bb49';c.fillRect(-12,-33,24,12);c.fillStyle='#29313c';for(let i=0;i<4;i++)c.fillRect(-10+i*6,-31,3,8);
   c.fillStyle='#c6d5cc';c.fillRect(-23,-67,46,9);c.fillStyle='#253849';c.fillRect(-18,-75,11,12);c.fillRect(7,-75,11,12);
   c.fillStyle=powered?'#f4d35c':'#7e8e85';c.fillRect(-16,-73,7,9);c.fillRect(9,-73,7,9);c.fillRect(-5,-53,7,11);ring(0,0,30,powered?'#c7b557':'#607675',1);c.restore();
  }
 }else{
  const age=z.max-z.life,charged=age>=z.charge,pct=clamp(age/z.charge,0,1);
  ring(z.x,z.y,z.radius,charged?'#ffe8a1':'#d3bd67',charged?3:1);ring(z.x,z.y,z.radius*.72,'#9dd5dd',2);
  for(let i=0;i<4;i++){const a=i*tau/4+(charged?0:phase*.3),x=z.x+Math.cos(a)*z.radius,y=z.y+Math.sin(a)*z.radius;line([[x-12,y],[x+12,y]],'#ede4ac',2);line([[x,y-12],[x,y+12]],'#ede4ac',2);}
  if(!charged){line([[z.x-25,z.y],[z.x+25,z.y]],'#eff0cc');line([[z.x,z.y-25],[z.x,z.y+25]],'#eff0cc');ring(z.x,z.y,15+pct*24,'#e7d588',2);}
  // Dijiang silhouette: layered industrial carrier plates and twin rail barrels.
  c.save();c.translate(z.x,z.y-180);const shipScale=scale*(charged?1:.75+pct*.25);c.scale(shipScale,shipScale);c.globalAlpha*=charged?.82:.25+pct*.4;
  c.fillStyle='#11212d';c.beginPath();c.moveTo(-132,-16);c.lineTo(-83,-36);c.lineTo(70,-32);c.lineTo(133,-8);c.lineTo(93,18);c.lineTo(-76,22);c.closePath();c.fill();
  c.fillStyle='#a3b4b5';c.fillRect(-79,-22,154,24);c.fillStyle='#d9dfcf';c.fillRect(-52,-29,104,15);c.fillStyle='#4b6471';c.fillRect(-120,-8,74,15);c.fillRect(48,-9,64,15);c.fillStyle='#e2c163';c.fillRect(-65,-18,13,5);c.fillRect(51,-18,13,5);c.fillRect(-13,2,8,33);c.fillRect(5,2,8,33);c.restore();
  if(charged){const fade=clamp(z.life/.25,0,1),width=(reduced?42:42+Math.sin(phase*31)*6)*scale;c.save();c.globalAlpha*=fade;line([[z.x,z.y-650],[z.x,z.y]],'#71c6da55',width*2.4);line([[z.x,z.y-650],[z.x,z.y]],'#e8d06e',width);line([[z.x,z.y-650],[z.x,z.y]],'#faffdc',width*.45);c.fillStyle='#b8e5db33';c.beginPath();c.arc(z.x,z.y,z.radius*.7,0,tau);c.fill();ring(z.x,z.y,z.radius*(.65+(reduced?0:(phase*2)%1)*.35),'#f2df95',3);c.restore();}
 }
 return true;
}
