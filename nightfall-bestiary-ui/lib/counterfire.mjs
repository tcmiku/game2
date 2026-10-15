/** Per-step attack geometry. Never serialized: the host rebuilds it from live attacks. */
export function addWeaponGuard(w,p,weapon,shape){
 if(!p||p.hp<=0||p.connected===false)return;
 (w.guards||=[]).push({owner:p.id,weapon,...shape});
}
export function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-ax-dx*t,y-ay-dy*t);}
export function circleContact(ax,ay,bx,by,x,y,r){
 const dx=bx-ax,dy=by-ay,ox=ax-x,oy=ay-y,c=ox*ox+oy*oy-r*r;if(c<=0)return 0;
 const a=dx*dx+dy*dy,b=ox*dx+oy*dy,d=b*b-a*c;if(a===0||d<0)return Infinity;
 const t=(-b-Math.sqrt(d))/a;return t>=0&&t<=1?t:Infinity;
}
function contains(g,x,y,pad){
 if(g.kind==='line')return segmentDistance(x,y,g.x,g.y,g.tx,g.ty)<=g.radius+pad;
 const dx=x-g.x,dy=y-g.y,d=Math.hypot(dx,dy);
 if(d>g.radius+pad||g.kind==='ring'&&d<Math.max(0,g.inner-pad))return false;
 if(g.kind==='cone'&&d>pad){const delta=Math.atan2(Math.sin(Math.atan2(dy,dx)-g.angle),Math.cos(Math.atan2(dy,dx)-g.angle));return Math.abs(delta)<g.halfAngle+Math.asin(Math.min(1,pad/d));}
 return true;
}
export function canCancelBullet(w,b){
 if(b.cancellable===false||b.sourceType===4||b.sourceType===7||b.kind==='thorn')return false;
 const source=w.s.enemies.find(e=>e.id===b.owner);return source?.type!==4&&source?.type!==7;
}
/** Find the first collision along the hostile sweep, before testing player hits. */
export function attackContact(w,b,ax,ay,bx,by){
 if(!canCancelBullet(w,b))return null;
 let result=null,best=Infinity;const steps=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/3));
 for(const g of w.guards||[]){
  const p=w.s.players.find(p=>p.id===g.owner);if(!p||p.hp<=0||p.connected===false)continue;
  let t=Infinity;
  if(!g.kind||g.kind==='circle')t=circleContact(ax,ay,bx,by,g.x,g.y,g.radius+(b.radius||0));
  else for(let i=0;i<=steps;i++){const at=i/steps;if(at>=best)break;if(contains(g,ax+(bx-ax)*at,ay+(by-ay)*at,b.radius||0)){t=at;break;}}
  if(t<best){best=t;result={t,guard:g,player:p};}
 }return result;
}
export function cancelBullet(w,b,contact,ax,ay,bx,by){
 b.x=ax+(bx-ax)*contact.t;b.y=ay+(by-ay)*contact.t;b.life=0;
 contact.player.blockedShots=(contact.player.blockedShots||0)+1;
 w.s.effects.push({id:w.nextId(),type:'counter',owner:contact.guard.owner,weapon:contact.guard.weapon,x:b.x,y:b.y,size:24,life:.2,max:.2});
}
