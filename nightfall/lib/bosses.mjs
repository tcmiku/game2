import {drawBossSprite} from './boss-presentation.mjs';
import {segmentDistance} from './counterfire.mjs';
const tau=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
export const BOSS_ORDER=['roots','prism','halo','ribbon'];
export const BOSSES={roots:{name:'枯枝之王',code:'I · THORN',color:'#c6a37f',role:'荆棘 · 地脉 · 冲锋'},prism:{name:'棱镜使骸',code:'II · PRISM',color:'#a8cfde',role:'折光壁 · 蓄能贯射'},halo:{name:'空环使骸',code:'III · HALO',color:'#d3bcdf',role:'缺口环波 · 星坠'},ribbon:{name:'断界使骸',code:'IV · RIFT',color:'#e2a493',role:'连续突进 · 裂界横扫'},reaper:{name:'死神',code:'Ω · REAPER',color:'#ef8a92',role:'终夜降临'}};
export function bossKind(cycle){return BOSS_ORDER[(Math.max(1,cycle)-1)%BOSS_ORDER.length];}
export function bossDefinition(e){return BOSSES[e.type===7?'reaper':e.bossKind||'roots']||BOSSES.roots;}
export function bossPhase(e){return e.type===7?'不可阻挡':e.barrier>0?'折光壁展开':e.skill?'蓄势':e.hp<e.maxHp*.45?'狂暴':'交战';}
function hazard(w,e,kind,extra={}){if(w.s.hazards.length>=48)return;w.s.hazards.push({id:w.nextId(),owner:e.id,boss:true,kind,x:e.x,y:e.y,angle:0,radius:100,wait:1,delay:1,life:1.45,damage:(24+(e.cycle||1)*3)*(e.damageScale||1),fired:false,...extra});}
function volley(w,e,count,offset=0,speed=200){for(let i=0;i<count;i++){const a=i*tau/count+offset;w.s.hostile.push({id:w.nextId(),owner:e.id,sourceType:4,cancellable:false,kind:'thorn',x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:9,damage:18*(e.damageScale||1),life:4});}}
export function stepBossAttack(w,e,target,dt){
 if(e.type!==4||!e.bossKind||e.bossKind==='roots')return false;
 e.barrier=Math.max(0,(e.barrier||0)-dt);e.skillCd=(e.skillCd??1.8)-dt;
 if(e.skill){e.windup-=dt;if(e.windup>0)return true;
  const index=e.skillIndex||0;
  if(e.bossKind==='prism'){
   if(e.skill==='ray')hazard(w,e,'bossRay',{angle:e.attackAngle,length:1200,width:44,wait:0,delay:1.3,life:.65,tick:0});else volley(w,e,16,e.attackAngle,220);
  }else if(e.bossKind==='halo'){
   if(e.skill==='halo')hazard(w,e,'bossRing',{radius:20,outer:480,gap:e.attackAngle,halfGap:.42,wait:0,delay:1.15,life:1.65,max:1.65,age:0,tick:0});
   else for(const [i,p] of w.s.players.filter(p=>p.hp>0&&p.connected!==false).entries())hazard(w,e,'bossStar',{x:p.x,y:p.y,radius:86,wait:1.15+i*.1,delay:1.15+i*.1,life:1.6+i*.1});
  }else{
   if(e.skill==='rift')hazard(w,e,'bossSweep',{angle:e.attackAngle-.7,fromAngle:e.attackAngle-.7,sweep:1.4,length:620,width:28,wait:0,delay:1.2,life:1.2,max:1.2,age:0,tick:0});
   else {e.chargeAngle=e.attackAngle;e.chargeLeft=.45;e.chargeSpeed=720;e.dashesLeft=e.comboSecond?0:1;e.dashPause=.55;}
  }
  e.skill='';e.skillIndex=index+(e.comboSecond?0:1);e.comboSecond=false;e.skillCd=e.hp<e.maxHp*.45?2.1:3.3;return true;
 }
 if(e.dashesLeft&&e.chargeLeft<=0){e.dashPause-=dt;if(e.dashPause<=0){e.dashesLeft--;e.comboSecond=true;e.skill='dash';e.windup=.65;e.attackAt=w.s.time;e.attackAngle=aim(e,target);}return true;}
 if(e.skillCd<=0&&!(e.chargeLeft>0)){
  const odd=(e.skillIndex||0)%2;e.skill=e.bossKind==='prism'?(odd?'shards':'ray'):e.bossKind==='halo'?(odd?'starfall':'halo'):(odd?'rift':'dash');e.windup=e.skill==='shards'?.85:1.3;e.attackAt=w.s.time;e.attackAngle=aim(e,target);if(e.bossKind==='prism')e.barrier=e.windup;
 }
 return true;
}
export function bossMotion(e,distance){if(e.type!==4||!e.bossKind||e.bossKind==='roots')return null;if(e.skill||e.chargeLeft>0||e.dashesLeft)return 0;return distance>360?.65:distance<240?-.35:0;}
export function stepBossHazard(w,h,dt,hurt){
 if(!(h.kind||'').startsWith('boss'))return false;
 const owner=w.s.enemies.find(e=>e.id===h.owner&&e.hp>0);if(!owner){h.life=0;return true;}if(h.wait>0)return true;
 if(h.kind==='bossStar'){if(!h.fired){h.fired=true;for(const p of w.s.players)if(p.hp>0&&Math.hypot(p.x-h.x,p.y-h.y)<h.radius+14)hurt(w,p,h.damage);}return true;}
 h.tick-=dt;if(h.kind==='bossRing'){h.age+=dt;h.radius=Math.min(h.outer,20+h.age/h.max*(h.outer-20));}
 if(h.kind==='bossSweep'){h.age+=dt;h.angle=h.fromAngle+h.sweep*Math.min(1,h.age/h.max);}
 if(h.tick>0)return true;h.tick=.12;
 for(const p of w.s.players){if(p.hp<=0)continue;
  if(h.kind==='bossRing'){const d=Math.hypot(p.x-h.x,p.y-h.y),a=aim(h,p),gap=Math.abs(Math.atan2(Math.sin(a-h.gap),Math.cos(a-h.gap)));if(Math.abs(d-h.radius)<26&&gap>h.halfGap)hurt(w,p,h.damage);}
  else if(segmentDistance(p.x,p.y,h.x,h.y,h.x+Math.cos(h.angle)*h.length,h.y+Math.sin(h.angle)*h.length)<14+h.width/2)hurt(w,p,h.damage);
 }return true;
}
function poly(c,pts,color){c.fillStyle=color;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
function line(c,ax,ay,bx,by,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();}
export function drawBossBody(r,e,x,y,height,time,flash=0){
 if(e.type!==4&&e.type!==7)return false;
 if(drawBossSprite(r,e,x,y,height,time,flash))return true;
 if(!e.bossKind||e.bossKind==='roots'||e.type===7)return false;
 const c=r.ctx,reduced=r.feedback.reducedMotion,kind=e.bossKind,scale=height/170,bob=reduced?0:Math.round(Math.sin(time*2)*4),color=flash>0?'#f6e6bf':bossDefinition(e).color;
 c.save();c.translate(Math.round(x),Math.round(y-44+bob));c.scale(scale,scale);
 if(kind==='prism'){
  poly(c,[[0,-78],[50,-15],[0,45],[-50,-15]],'#172a3b');poly(c,[[0,-70],[44,-15],[0,38]],'#4f758f');poly(c,[[0,-70],[0,38],[-44,-15]],'#99bbca');poly(c,[[0,-48],[28,-15],[0,19],[-28,-15]],color);poly(c,[[0,-29],[13,-15],[0,0],[-13,-15]],'#f1e5ba');
  if(e.barrier>0){c.strokeStyle='#d1d9b4';c.lineWidth=2;c.beginPath();for(let i=0;i<=8;i++){const a=i*tau/8+Math.PI/8;i?c.lineTo(Math.cos(a)*66,Math.sin(a)*66-15):c.moveTo(Math.cos(a)*66,Math.sin(a)*66-15);}c.stroke();}
 }else if(kind==='halo'){
  c.strokeStyle='#17232f';c.lineWidth=18;c.beginPath();c.ellipse(0,-14,65,36,0,0,tau);c.stroke();c.strokeStyle=color;c.lineWidth=7;c.stroke();
  for(let i=0;i<8;i++){const a=i*tau/8+(reduced?0:time*.3);poly(c,[[Math.cos(a)*59,Math.sin(a)*35-14],[Math.cos(a+.12)*76,Math.sin(a+.12)*47-14],[Math.cos(a+.24)*59,Math.sin(a+.24)*35-14]],'#d0bc90');}
  poly(c,[[-29,-14],[0,-36],[29,-14],[0,9]],'#172332');poly(c,[[-23,-14],[0,-29],[23,-14],[0,2]],color);c.fillStyle='#131e2c';c.fillRect(-4,-27,8,26);c.fillStyle='#efe5bd';c.fillRect(-2,-20,4,9);
 }else{
  for(let i=8;i>=0;i--){const sx=(reduced?Math.sin(i*.5):Math.sin(time*2+i*.5))*16,sy=-75+i*14;poly(c,[[sx-12,sy],[sx,sy-9],[sx+13,sy],[sx,sy+15]],i%2?'#737887':color);if(i%2===0)line(c,sx,sy,sx+(i%4===0?35:-35),sy+14,'#dac5a5',3);}
  poly(c,[[-20,-72],[0,-91],[20,-72],[0,-57]],'#172332');poly(c,[[-12,-72],[0,-84],[12,-72],[0,-64]],color);c.fillStyle='#f0e7c0';c.fillRect(-2,-78,4,10);
 }
 c.restore();return true;
}
export function drawBossWarnings(r,s,time){
 const c=r.ctx;
 for(const e of s.enemies||[])if(e.type===4&&e.bossKind&&e.bossKind!=='roots'&&e.skill){const a=e.attackAngle,color=bossDefinition(e).color;c.save();c.globalAlpha=.6;c.setLineDash([10,8]);
  if(e.skill==='ray'||e.skill==='dash'){line(c,e.x,e.y,e.x+Math.cos(a)*(e.skill==='ray'?1200:400),e.y+Math.sin(a)*(e.skill==='ray'?1200:400),color,e.skill==='ray'?5:3);}
  else if(e.skill==='rift'){c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(e.x,e.y,400,a-.7,a+.7);c.stroke();for(const off of [-.7,.7])line(c,e.x,e.y,e.x+Math.cos(a+off)*620,e.y+Math.sin(a+off)*620,color);}
  else {c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.arc(e.x,e.y,85,0,tau);c.stroke();}c.restore();
 }
}
export function drawBossHazard(r,h){
 if(!(h.kind||'').startsWith('boss'))return false;const c=r.ctx,ready=h.wait<=0;c.save();c.globalAlpha=ready?.9:.55;
 if(h.kind==='bossStar'){c.strokeStyle='#e4aa97';c.fillStyle=ready?'#df987b44':'#df987b14';c.lineWidth=2;c.beginPath();c.arc(h.x,h.y,h.radius,0,tau);c.fill();c.stroke();line(c,h.x-14,h.y,h.x+14,h.y,'#f3d9aa');line(c,h.x,h.y-14,h.x,h.y+14,'#f3d9aa');}
 else if(h.kind==='bossRing'){c.strokeStyle='#d3bcdf';c.lineWidth=10;c.beginPath();c.arc(h.x,h.y,h.radius,h.gap+h.halfGap,h.gap+tau-h.halfGap);c.stroke();c.strokeStyle='#f0e5c7';c.lineWidth=2;c.stroke();for(const off of [-h.halfGap,h.halfGap])line(c,h.x+Math.cos(h.gap+off)*(h.radius-20),h.y+Math.sin(h.gap+off)*(h.radius-20),h.x+Math.cos(h.gap+off)*(h.radius+20),h.y+Math.sin(h.gap+off)*(h.radius+20),'#9cc6ad',3);}
 else {const tx=h.x+Math.cos(h.angle)*h.length,ty=h.y+Math.sin(h.angle)*h.length;line(c,h.x,h.y,tx,ty,'#658aa6',h.width+10);line(c,h.x,h.y,tx,ty,'#d1e2d5',h.width);line(c,h.x,h.y,tx,ty,'#fff0c8',5);}
 c.restore();return true;
}
