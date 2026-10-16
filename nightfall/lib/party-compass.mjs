import {playerStyle} from './player-style.mjs';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/** Pure screen geometry: bearings use the local actor, including a shifted boss camera. */
export function partyIndicators(players,id,camera,width,height,zoom=1,obstacles=[]){
 const me=players?.find(p=>p.id===id);if(!me||me.connected===false||!Number.isFinite(zoom)||zoom<=0||width<150||height<200)return[];
 const project=p=>({x:width/2+(p.x-camera.x)*zoom,y:height/2+(p.y-30-camera.y)*zoom});
 const self=project(me),left=24,right=width-24,top=32,bottom=height-104;
 const origin={x:clamp(self.x,left+1,right-1),y:clamp(self.y,top+1,bottom-1)},out=[];
 for(const p of players){
  if(p.id===id||p.connected===false||!Number.isFinite(p.x)||!Number.isFinite(p.y))continue;
  const target=project(p),pad=20*zoom;
  // Keep the nameplate while any substantial part of the teammate is visible.
  if(target.x>=-pad&&target.x<=width+pad&&target.y>=-pad&&target.y<=height+pad)continue;
  const dx=target.x-self.x,dy=target.y-self.y;if(Math.hypot(dx,dy)<1)continue;
  const tx=dx===0?Infinity:((dx>0?right:left)-origin.x)/dx,ty=dy===0?Infinity:((dy>0?bottom:top)-origin.y)/dy,t=Math.min(tx,ty);
  if(!Number.isFinite(t)||t<0)continue;
  const edge=tx<ty?(dx>0?'right':'left'):(dy>0?'bottom':'top');
  let x=origin.x+dx*t,y=origin.y+dy*t;
  // Keep small edge tokens clear of the topbar, party list and bottom equipment.
  const low=edge==='left'?Math.min(218,bottom-66):edge==='right'?Math.min(152,bottom-66):top;
  if(edge==='left'||edge==='right')y=clamp(y,low,bottom-28);
  else x=clamp(x,width<600?82:Math.min(310,width*.3),width-82);
  out.push({id:p.id,index:p.index||0,down:p.hp<=0||!!p.ghost,edge,x,y,angle:Math.atan2(dy,dx),color:playerStyle(p.index).color});
 }
 // At most three allies. Pack each edge without losing individual identities.
 for(const edge of ['left','right','top','bottom']){
  const vertical=edge==='left'||edge==='right',axis=vertical?'y':'x',group=out.filter(a=>a.edge===edge).sort((a,b)=>a[axis]-b[axis]||a.index-b.index),lo=vertical?(edge==='left'?Math.min(218,bottom-66):Math.min(152,bottom-66)):(width<600?82:Math.min(310,width*.3)),hi=vertical?bottom-28:width-82;
  const gap=Math.min(38,(hi-lo)/Math.max(1,group.length-1));
  for(let i=0;i<group.length;i++)group[i][axis]=Math.max(group[i][axis],i?group[i-1][axis]+gap:lo);
  const overflow=group.length?Math.max(0,group.at(-1)[axis]-hi):0;
  for(const a of group){a[axis]=Math.round(a[axis]-overflow);a.x=Math.round(a.x);a.y=Math.round(a.y);}
 }
 return avoidOverlays(out,obstacles,width,height);
}

function tokenBounds(a){
 const inward={left:[22,0],right:[-22,0],top:[0,22],bottom:[0,-22]}[a.edge],x=a.x+inward[0],y=a.y+inward[1];
 return{left:Math.min(a.x-12,x-15),right:Math.max(a.x+12,x+15),top:Math.min(a.y-12,y-11),bottom:Math.max(a.y+12,y+(a.down?21:11))};
}
const overlaps=(a,b)=>a.left<b.right+4&&a.right>b.left-4&&a.top<b.bottom+4&&a.bottom>b.top-4;
/** Slide along the edge around real HUD rectangles, while retaining the true bearing. */
function avoidOverlays(arrows,obstacles,width,height){
 if(!obstacles.length)return arrows;
 const placed=[];
 for(const a of arrows){
  const original={...a},vertical=a.edge==='left'||a.edge==='right',axis=vertical?'y':'x',extent=vertical?height:width;
  let found=false;
  // Usually the original position or one adjacent slot fits. Bound the search.
  for(let inset=0;inset<=112&&!found;inset+=14)for(let step=0;step<Math.ceil(extent/14)&&!found;step++)for(const sign of step?[-1,1]:[1]){
   const candidate={...original,[axis]:clamp(original[axis]+step*14*sign,vertical?32:24,vertical?height-32:width-24)};
   if(vertical)candidate.x+=a.edge==='left'?inset:-inset;else candidate.y+=a.edge==='top'?inset:-inset;
   const box=tokenBounds(candidate);if(box.left<4||box.right>width-4||box.top<4||box.bottom>height-4)continue;
   if(obstacles.some(b=>overlaps(box,b))||placed.some(b=>overlaps(box,b)))continue;
   Object.assign(a,candidate);placed.push(box);found=true;break;
  }
  if(!found)placed.push(tokenBounds(a));
 }
 return arrows;
}

export function drawPartyCompass(r,s,id){
 if(!s?.coop||s.status!=='playing'||s.players.length<2)return;
 const players=s.players.map(p=>({...p,...(r.positions.get('player'+p.id)||{})})),arrows=partyIndicators(players,id,r.camera,r.w,r.h,r.combatZoom,r.obstacles||[]),c=r.ctx;
 c.save();c.textAlign='center';c.textBaseline='middle';c.font='bold 12px Georgia,serif';
 for(const a of arrows){
  c.save();c.translate(a.x,a.y);c.rotate(a.angle);c.fillStyle='#0b1622';c.strokeStyle='#e6d5b3';c.lineWidth=1.5;
  c.beginPath();c.moveTo(10,0);c.lineTo(-7,-7);c.lineTo(-3,0);c.lineTo(-7,7);c.closePath();c.fill();c.stroke();
  c.fillStyle=a.color;c.beginPath();c.moveTo(6,0);c.lineTo(-4,-4);c.lineTo(-1,0);c.lineTo(-4,4);c.closePath();c.fill();c.restore();
  const inward={left:[22,0],right:[-22,0],top:[0,22],bottom:[0,-22]}[a.edge],x=a.x+inward[0],y=a.y+inward[1];
  c.fillStyle='#101c29ed';c.strokeStyle=a.color;c.lineWidth=1;c.beginPath();c.moveTo(x-13,y-6);c.lineTo(x-10,y-9);c.lineTo(x+13,y-9);c.lineTo(x+13,y+6);c.lineTo(x+10,y+9);c.lineTo(x-13,y+9);c.closePath();c.fill();c.stroke();
  c.fillStyle=a.color;c.fillText(`P${a.index+1}`,x,y+.5);
  if(a.down){c.fillStyle='#eadcbb';c.fillRect(x-2,y+12,4,8);c.fillRect(x-4,y+14,8,4);}
 }
 c.restore();
}
