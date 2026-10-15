const tau=Math.PI*2,aim=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const EXPANDED_TYPES={
 13:{name:'雾灯妖',hp:44,speed:56,size:21,height:98,xp:3,damage:9,from:80,weight:9},
 14:{name:'蚀月蛛',hp:46,speed:88,size:19,height:80,xp:3,damage:11,from:125,weight:10},
 15:{name:'空壳镜灵',hp:78,speed:65,size:23,height:114,xp:4,damage:13,from:210,weight:6},
};
function bolt(w,e,angle,speed){w.s.hostile.push({id:w.nextId(),owner:e.id,sourceType:e.type,cancellable:true,kind:'orb',x:e.x,y:e.y-15,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:8,damage:11*(e.damageScale||1),life:4});}
export function stepExpandedAttack(w,e,p,dt){
 if(!EXPANDED_TYPES[e.type])return false;
 e.skillCd=(e.skillCd??1.4)-dt;
 if(e.skill){e.windup-=dt;if(e.windup>0)return true;
  if(e.type===13)for(const off of [-.26,0,.26])bolt(w,e,e.attackAngle+off,235);
  else if(e.type===14){if(w.s.hazards.length<48)w.s.hazards.push({id:w.nextId(),owner:e.id,kind:'web',x:e.tx,y:e.ty,radius:74,wait:.5,delay:.5,life:4,tick:0,damage:6*(e.damageScale||1)});}
  else {e.x=e.tx;e.y=e.ty;for(let i=0;i<6;i++)bolt(w,e,i*tau/6,180);}
  e.skill='';e.skillCd=e.type===13?3.1:e.type===14?4.2:5.5;return true;
 }
 if(e.skillCd<=0&&distance(e,p)<560){e.skill=e.type===13?'lanternFan':e.type===14?'webcast':'blink';e.windup=e.type===15?.9:.65;e.attackAt=w.s.time;e.attackAngle=aim(e,p);e.tx=clamp(p.x+(e.type===15?Math.cos(e.phase||0)*165:0),90,w.s.width-90);e.ty=clamp(p.y+(e.type===15?Math.sin(e.phase||0)*165:0),90,w.s.height-90);}
 return true;
}
export function expandedMotion(e,d){if(!EXPANDED_TYPES[e.type])return null;if(e.skill)return 0;if(e.type===13)return d>320?1:d<210?-.5:0;if(e.type===15)return d>260?1:d<150?-.4:0;return 1;}
export function stepExpandedStrafe(e,p,dt){if(e.type!==14||e.skill||e.frozen>0||e.stagger>0)return;const a=aim(e,p)+Math.PI/2,speed=Math.sin((e.phase||0)*3+e.x*.018)*e.speed*.45;e.x=clamp(e.x+Math.cos(a)*speed*dt,70,3530);e.y=clamp(e.y+Math.sin(a)*speed*dt,70,2330);}
export function stepWeb(w,h,dt,hurt){if(h.kind!=='web')return false;if(h.wait>0)return true;h.tick-=dt;for(const p of w.s.players)if(p.hp>0&&p.connected!==false&&distance(p,h)<h.radius+12){p.snareUntil=w.s.time+.25;if(h.tick<=0)hurt(w,p,h.damage);}if(h.tick<=0)h.tick=.8;return true;}
function line(c,a,b,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
export function drawExpandedBody(r,e,x,y,height,time,flash=0){
 if(!EXPANDED_TYPES[e.type])return false;
 const c=r.ctx,reduced=r.feedback.reducedMotion,walking=e.moving&&!reduced&&e.frozen<=0,t=walking?Math.floor(time*9)%4:0,color=flash>0?'#f7e9bf':e.elite?['','#82ef9d','#70b6ff','#ff6c78'][e.elite]:'#b7c6b8',bob=reduced||e.frozen>0?0:Math.round(Math.sin(time*3+(e.phase||0))*2);
 c.save();c.translate(Math.round(x),Math.round(y-height*.32+bob));c.scale(height/64,height/64);
 if(e.type===13){
  for(const side of [-1,1])poly(c,[[side*9,-15],[side*29,-7-t],[side*19,4],[side*13,0]],'#647b88');
  poly(c,[[-10,-23],[9,-23],[14,-10],[10,11],[0,20],[-11,10],[-14,-10]],'#172735');poly(c,[[-7,-20],[6,-20],[10,-8],[7,9],[0,15],[-8,8],[-10,-8]],color);poly(c,[[-5,-12],[5,-12],[7,5],[0,10],[-6,4]],'#e7c38b');c.fillStyle='#f0e5b5';c.fillRect(-2,-6,4,9);line(c,[-4,-24],[0,-30],'#b8ac91',2);line(c,[0,17],[e.skill?5:1,28],'#8aa4a3',2);
 }else if(e.type===14){
  for(const side of [-1,1])for(let i=0;i<4;i++){const yy=-7+i*6,end=yy+8+(t%2?i%2*4:0);line(c,[side*7,yy],[side*(21+i%2*4),yy-8+t],'#172735',4);line(c,[side*(21+i%2*4),yy-8+t],[side*29,end],'#172735',4);line(c,[side*7,yy],[side*(21+i%2*4),yy-8+t],color,2);line(c,[side*(21+i%2*4),yy-8+t],[side*29,end],color,2);}
  poly(c,[[-10,-12],[0,-20],[11,-11],[10,10],[0,18],[-10,10]],'#172735');poly(c,[[-7,-10],[0,-16],[8,-9],[7,9],[0,13],[-7,8]],'#8898a6');poly(c,[[-4,-7],[0,-11],[4,-7],[0,0]],'#d1c29a');c.fillStyle='#e5c38e';c.fillRect(-5,7,3,3);c.fillRect(3,7,3,3);
 }else{
  for(const side of [-1,1]){poly(c,[[side*3,-25],[side*13,-32],[side*23,-16],[side*13,11],[side*5,25],[side*3,9]],'#172735');poly(c,[[side*6,-23],[side*12,-28],[side*18,-16],[side*11,8],[side*6,19]],color);line(c,[side*11,-16],[side*7,3],'#8e9dad',2);}
  poly(c,[[-4,-10],[0,-16],[4,-10],[0,-3]],'#e1c38f');line(c,[-3,10],[3,10],'#e1c38f',2);if(e.skill==='blink'){c.globalAlpha=.45;c.strokeStyle='#b4cbd8';c.beginPath();c.ellipse(0,25,18,6,0,0,tau);c.stroke();}
 }
 c.restore();return true;
}
export function drawExpandedWarnings(r,s){const c=r.ctx;for(const e of s.enemies||[])if(e.skill&&EXPANDED_TYPES[e.type]){c.save();c.strokeStyle='#d7bd92';c.lineWidth=2;c.globalAlpha=.6;c.setLineDash([5,5]);if(e.type===13){c.beginPath();c.arc(e.x,e.y,150,e.attackAngle-.26,e.attackAngle+.26);c.stroke();}else{c.beginPath();c.ellipse(e.tx,e.ty,e.type===15?28:74,e.type===15?12:74,0,0,tau);c.stroke();}c.restore();}}
export function drawWeb(r,h){if(h.kind!=='web')return false;const c=r.ctx;c.save();c.globalAlpha=h.wait>0?.3:.6;c.strokeStyle='#b3b7bc';c.lineWidth=1;for(let i=0;i<8;i++){const a=i*tau/8;line(c,[h.x,h.y],[h.x+Math.cos(a)*h.radius,h.y+Math.sin(a)*h.radius],'#a9b5b8');}for(const ratio of [.35,.65,1]){c.beginPath();for(let i=0;i<=8;i++){const a=i*tau/8,x=h.x+Math.cos(a)*h.radius*ratio,y=h.y+Math.sin(a)*h.radius*ratio;i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}c.restore();return true;}
