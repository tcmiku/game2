/** Native poses and bounded, deterministic effects; never advance combat here. */
export const WYVERN_ART={cell:192,columns:8,rows:4,size:208,url:'/art/pixel-wyvern.png?v=wyvern-2'};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),tau=Math.PI*2;
const cycle=(time,fps,offset=0)=>((Math.floor(time*fps+offset)%8)+8)%8;

export function wyvernPose(d,p,time,reduced=false){
 const charging=d.phase==='charge',returning=d.phase==='return';
 const breathAge=time-((d.breathUntil??-100)-.65),breathing=breathAge>=0&&breathAge<.65;
 const chargeAge=Math.max(0,time-(d.chargeAt??time)),returnAge=Math.max(0,time-(d.returnAt??-100));
 const angle=returning?Math.atan2(p.y-25-d.y,p.x-65-d.x):(d.angle||0),face=Math.cos(angle)<0?-1:1;
 let row=0,column=cycle(time,11,(d.id||0)%8),mode='flight';
 if(breathing&&(!charging||breathAge<.22)){row=1;column=Math.min(7,Math.floor(breathAge/.65*8));mode='breath';}
 else if(charging){row=2;column=Math.min(7,Math.floor(chargeAge/(d.chargeSpan||.55)*8));mode='dive';}
 else if(returning){row=returnAge<.16?2:3;column=row===2?6+Math.min(1,Math.floor(returnAge/.08)):cycle(time,13,(d.id||0)%8);mode='return';}
 if(reduced)column=[2,3,4,2][row];
 const bob=reduced?0:mode==='flight'?Math.sin(time*11/8*tau+(d.id||0)) * 3:mode==='return'?Math.sin(time*13/8*tau)*2:0;
 // Flip in the rear hemisphere, then bank toward the actual travel/fire vector.
 // A vertical attack must not leave a side-facing dragon breathing at empty air.
 const heading=Math.atan2(Math.sin(angle)*face,Math.cos(angle)*face);
 const pitch=heading+(reduced||breathing||charging?0:Math.sin(time*3)*.035);
 return{row,column,mode,face,bob,pitch,breathing};
}

export function drawWyvern(r,d,p,time){
 const atlas=r.wyvernAtlas;if(!atlas?.complete||!atlas.naturalWidth)return false;
 const c=r.ctx,pose=wyvernPose(d,p,time,r.feedback.reducedMotion),{cell,size}=WYVERN_ART;
 c.save();c.translate(Math.round(d.x),Math.round(d.y-30+pose.bob));c.rotate(pose.pitch);c.scale(pose.face,1);c.imageSmoothingEnabled=false;
 c.drawImage(atlas,pose.column*cell,pose.row*cell,cell,cell,-size/2,-size*.57,size,size);
 // Throat embers are local to the jaw, distinct from the authoritative fire cone.
 if(pose.breathing){
  const reduced=r.feedback.reducedMotion,age=time-(d.breathUntil-.65),strength=Math.sin(Math.min(1,age/.65)*Math.PI);
  c.globalAlpha*=strength*.8;c.fillStyle='#efad68';
  for(let i=0;i<4;i++){const travel=reduced?i*4:(time*70+i*9)%23;c.fillRect(Math.round(size*.365+travel),Math.round(-size*.12-i%2*4),i%2?2:3,2);}
 }
 c.restore();return true;
}

/** The plume stays inside the real fan; layers travel outward and fade at its rim. */
export function drawWyvernFire(r,z,time){
 const c=r.ctx,reduced=r.feedback.reducedMotion,age=clamp(1-z.life/z.max,0,1),radius=z.radius,half=z.halfAngle||.38;
 c.save();c.beginPath();c.moveTo(0,0);c.arc(0,0,radius,-half,half);c.closePath();c.clip();
 const fade=Math.min(1,z.life/.16),phase=reduced?0:Math.floor(age*12);
 c.globalAlpha*=fade;
 const pixel=n=>Math.round(n/2)*2;
 for(let i=0;i<24;i++){
  const q=(i+.7)/24,x=q*radius,y=Math.sin(i*2.4+phase*.35)*x*Math.tan(half)*.62,block=pixel(8+q*24);
  c.fillStyle=i%3?'#a74c3d60':'#d279426d';c.fillRect(pixel(x-block*.2),pixel(y-block*.65),block*1.4,block*1.3);
 }
 // Five jagged tongues interleave with the smoke lobes instead of solid bars.
 for(let j=-2;j<=2;j++)for(let i=0;i<13;i++){
  const q=(i+.4)/13,x=q*radius,y=j*q*radius*Math.tan(half)*.34+Math.sin(i*1.3+j*2+phase)*q*8;
  const width=pixel(14+q*15),height=pixel(4+q*(j===0?12:8));
  c.fillStyle=j===0?'#efac63':'#d7824e';c.fillRect(pixel(x),pixel(y-height/2),width,height);
  if(i<10){c.fillStyle=j===0?'#ffe7ac':'#f5bc78';c.fillRect(pixel(x+2),pixel(y-height*.12),pixel(width*.7),Math.max(2,pixel(height*.35)));}
 }
 // Widely spaced embers, not per-frame particles or persistent network entities.
 for(let i=0;i<9;i++){
  const q=reduced?.3+i*.07:(i*.113+age*.55)%1,x=radius*q,y=Math.sin(i*4.7)*x*Math.tan(half)*.87;
  c.fillStyle=i%2?'#f7c37c':'#d88855';c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,3,2);
 }
 c.restore();
}

export function drawWyvernClaw(r,z){
 const c=r.ctx,t=clamp(1-z.life/z.max,0,1),reduced=r.feedback.reducedMotion,reach=reduced?1:Math.min(1,t*4),fade=1-t;
 c.save();c.globalAlpha*=fade;
 for(let i=-1;i<=1;i++){
  const x=-30+i*5,y=-21+i*13,endX=x+55*reach,endY=y+34*reach;
  c.fillStyle='#b15f4970';c.beginPath();c.moveTo(x-5,y+4);c.lineTo(endX-3,endY+7);c.lineTo(endX+4,endY);c.lineTo(x+2,y-3);c.closePath();c.fill();
  c.strokeStyle='#d29574';c.lineWidth=4;c.beginPath();c.moveTo(x,y);c.lineTo(endX,endY);c.stroke();
  c.strokeStyle='#ffe2af';c.lineWidth=1.5;c.beginPath();c.moveTo(x+4,y+1);c.lineTo(endX,endY);c.stroke();
 }
 if(!reduced){c.fillStyle='#e5b88b';for(let i=0;i<5;i++)c.fillRect(Math.round(7+Math.cos(i*2.4)*(8+t*23)),Math.round(Math.sin(i*2.4)*(6+t*18)),2,2);}
 c.restore();
}
