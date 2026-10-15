import {drawMemeShot,drawMemeField} from './meme-arsenal.mjs';
import {drawZmdField} from './zmd.mjs';
import {drawPelican} from './pelican.mjs';
import {ARTIFACTS,orbitBlades,weaponScale} from './equipment.mjs';
import {drawRitualField} from './arsenal-ritual.mjs';
export const VFX_CELL=96,VFX_FRAMES=8;
export const VFX_ROWS={crescent:0,thrust:1,flame:2,frost:3,arc:4,rune:5,burst:6,wind:7,spark:8,raven:9,slash:10,smoke:11};
export const VFX_LIMITS={trails:128,points:6,fade:.18};
const tau=Math.PI*2,clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),pixel=v=>Math.round(v/2)*2;
const noise=(id,salt=0)=>{const n=Math.sin(id*12.9898+salt*78.233)*43758.5453;return n-Math.floor(n);};
const age=(entity,time)=>Math.max(0,time-(entity.born??time-.2));
const fade=entity=>clamp((entity.life??1)/.16);
const colors={spincat:['#b9c8b8','#f1edd0'],gugu:['#a9cfda','#edf2d6'],manbo:['#d8c3a0','#f5e4bd'],bananacat:['#dec578','#f4e5af'],zmd:['#e6cc64','#f6ffdd'],pelican:['#e0bc81','#fff0c4'],bell:['#d9c58f','#f6e9bb'],gauntlet:['#cfa080','#ffe2b5'],hourglass:['#a6a9d5','#ece0f0'],bloodneedle:['#cf91a6','#f5d4db'],loom:['#90c6d9','#e1f3dd'],flail:['#bdaf94','#e8dcba'],aegis:['#a3d6e8','#edf4ce'],blade:['#b2d4c2','#f1edd0'],orbit:['#9ccdbd','#e9eed0'],nova:['#85cbdc','#e7f6e2'],storm:['#b5a7df','#f0dffc'],spear:['#dfc28c','#fff0bc'],ember:['#e7a46c','#ffe9ab'],axe:['#9fc9c5','#e9e9cb'],bow:['#b4d09d','#eef0c4'],scythe:['#b39dce','#ecdeef'],sigil:['#d4a0c7','#fae1e2'],familiar:['#96b0df','#e8e3fa'],prism:['#87d6d3','#e3fae7'],dagger:['#a8bfdd','#eef1df'],chakram:['#8cdbd1','#e8fae4'],mine:['#dfb474','#ffe5a9'],turret:['#dfa673','#ffedb2'],chain:['#ac95d2','#e5cdeb'],saw:['#cf909d','#f6d3bf'],wind:['#a7d3b8','#e9f2cd'],whip:['#bfc189','#f2e7b7']};
export function weaponStyle(key){const base=ARTIFACTS[key]?.weapon||key;const [color,core]=colors[base]||colors.blade;const row=['nova','hourglass'].includes(base)?'frost':['storm','prism','loom'].includes(base)?'arc':['ember','mine','turret'].includes(base)?'burst':['sigil','chain','bell'].includes(base)?'rune':['wind'].includes(base)?'wind':'spark';return{base,color,core,row,artifact:!!ARTIFACTS[key]};}
export function vfxFrame(progress){return Math.min(7,Math.floor(clamp(progress)*8));}
export function drawVfx(c,atlas,row,x,y,size,frame=0,angle=0,alpha=1,aspect=1){
 if(!atlas?.complete||!atlas.naturalWidth||size<=0||alpha<=0)return false;
 const index=typeof row==='string'?VFX_ROWS[row]:row;if(!Number.isInteger(index))return false;
 c.save();c.translate(pixel(x),pixel(y));c.rotate(angle);c.globalAlpha*=clamp(alpha);c.imageSmoothingEnabled=false;
 c.drawImage(atlas,Math.floor(clamp(frame,0,7))*VFX_CELL,index*VFX_CELL,VFX_CELL,VFX_CELL,-size/2,-size*aspect/2,size,size*aspect);c.restore();return true;
}
function line(c,points,color,width=2,alpha=1){c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(pixel(x),pixel(y)):c.moveTo(pixel(x),pixel(y)));c.stroke();c.restore();}
function poly(c,points,color,alpha=1){c.save();c.globalAlpha*=alpha;c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(pixel(x),pixel(y)):c.moveTo(pixel(x),pixel(y)));c.closePath();c.fill();c.restore();}
function ring(c,x,y,r,color,width=2,alpha=1,start=0,end=tau){c.save();c.globalAlpha*=alpha;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(0,r),start,end);c.stroke();c.restore();}
function mote(c,x,y,color,size=3,alpha=1){c.save();c.globalAlpha*=alpha;c.fillStyle=color;c.fillRect(pixel(x),pixel(y),size,size);c.restore();}
function glyph(r,index,x,y,size,angle=0,alpha=1){
 const c=r.ctx,atlas=index>=16?r.weaponAtlas:r.relicAtlas;if(!atlas?.complete||!atlas.naturalWidth)return;
 const sx=index>=16?(index-16)%6*64:(index-8)*64,sy=index>=16?Math.floor((index-16)/6)*64:0;
 c.save();c.translate(pixel(x),pixel(y));c.rotate(angle);c.globalAlpha*=alpha;c.drawImage(atlas,sx,sy,64,64,-size/2,-size/2,size,size);c.restore();
}
function lightning(c,f,t,reduced=false){
 const dx=f.tx-f.x,dy=f.ty-f.y,length=Math.hypot(dx,dy)||1,n=Math.max(3,Math.ceil(length/32)),points=[[f.x,f.y]],seed=f.id||1,phase=reduced?0:Math.floor(t*6);
 for(let i=1;i<n;i++){const q=i/n,jitter=(noise(seed+i,phase)-.5)*22*Math.sin(q*Math.PI);points.push([f.x+dx*q-dy/length*jitter,f.y+dy*q+dx/length*jitter]);}points.push([f.tx,f.ty]);
 line(c,points,'#8574bd',f.type==='tempest'?12:8,.16*(1-t));line(c,points,'#b9a8e7',f.type==='tempest'?5:3,1-t);line(c,points,'#f3e8ef',1.5,(1-t)*.9);
 if(!reduced)for(let i=2;i<points.length-1;i+=3){const [x,y]=points[i],sign=i%2?1:-1;line(c,[[x,y],[x-dy/length*sign*18,y+dx/length*sign*18],[x+dx/length*9-dy/length*sign*26,y+dy/length*9+dx/length*sign*26]],'#bdace5',1,(1-t)*.65);}
}
/** Renderer-owned histories never enter authoritative snapshots or create damage. */
export class WeaponVFX{
 constructor({reducedMotion=false}={}){this.reducedMotion=reducedMotion;this.reset();}
 reset(){this.trails=new Map();this.time=-1;this.simTime=0;this.owner=null;this.view=null;}
 visible(x,y,pad=120){const v=this.view;return !v||Math.abs(x-v.x)<v.w+pad&&Math.abs(y-v.y)<v.h+pad;}
 opacity(owner){return owner&&this.owner&&owner!==this.owner ? .52 : 1;}
 update(s,time,owner,view=null){
  if(time<this.time-.1)this.reset();this.owner=owner;this.view=view;this.simTime=s.time;if(time===this.time)return;this.time=time;
  if(this.reducedMotion){this.trails.clear();return;}
  const live=new Set();
  for(const b of (s.shots||[]).filter(b=>this.visible(b.x,b.y)).slice(-VFX_LIMITS.trails)){live.add(b.id);let entry=this.trails.get(b.id);
   if(!entry){entry={owner:b.owner,weapon:b.weapon,scale:b.scale||1,points:[],last:time};this.trails.set(b.id,entry);}
   const last=entry.points.at(-1);if(!last||Math.hypot(last.x-b.x,last.y-b.y)>4){entry.points.push({x:b.x,y:b.y,at:time});entry.points=entry.points.slice(-VFX_LIMITS.points);}
   entry.last=time;
  }
  for(const [id,entry]of this.trails)if(time-entry.last>VFX_LIMITS.fade||!live.has(id)&&!this.visible(entry.points.at(-1)?.x,entry.points.at(-1)?.y))this.trails.delete(id);
  while(this.trails.size>VFX_LIMITS.trails)this.trails.delete(this.trails.keys().next().value);
 }
 fx(r,row,x,y,size,progress=0,angle=0,alpha=1,aspect=1){return drawVfx(r.ctx,r.vfxAtlas,row,x,y,size,vfxFrame(progress),angle,alpha,aspect);}
 drawTrails(r){
  const c=r.ctx;
  for(const entry of this.trails.values()){
   const {color,core}=weaponStyle(entry.weapon),p=entry.points,opacity=this.opacity(entry.owner);
   for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i],alpha=clamp(1-(this.time-a.at)/VFX_LIMITS.fade)*.42*opacity;if(alpha<=0)continue;
    line(c,[[a.x,a.y],[b.x,b.y]],color,(3+i*.7)*entry.scale,alpha*.4);line(c,[[a.x,a.y],[b.x,b.y]],core,Math.max(1,i*.35)*entry.scale,alpha);
   }
  }
 }
 drawShots(r,s,time){
  const c=r.ctx;this.drawTrails(r);
  for(const b of s.shots||[]){if(!this.visible(b.x,b.y))continue;
   const p=s.players.find(p=>p.id===b.owner),key=p?.evolutions?.[b.weapon]||b.weapon,style=weaponStyle(key),scale=b.scale||1,a=Math.atan2(b.vy,b.vx),born=age(b,time),phase=this.reducedMotion?0:(time*1.8+b.id*.13)%1;
   c.save();c.globalAlpha=this.opacity(b.owner)*fade(b);
   if(drawMemeShot(r,b,time,this.reducedMotion)){c.restore();continue;}
   if(b.kind==='tornado'){this.drawTornado(r,b,time);c.restore();continue;}
   if(b.kind==='flask'){
    const ground=b.sy+(b.ty-b.sy)*clamp(b.elapsed/b.flight);c.save();c.globalAlpha*=.2;c.fillStyle='#040b10';c.beginPath();c.ellipse(b.x,ground+14,16*scale,6*scale,0,0,tau);c.fill();c.restore();
    this.fx(r,'flame',b.x-5,b.y+4,32*scale,phase,-.3,.7);glyph(r,21,b.x,b.y,34*scale,born*5);mote(c,b.x,b.y-14,style.core,3,.8);
   }else if(b.kind==='return'||b.kind==='bounce'){
    const spin=this.reducedMotion?0:Math.round((time*(b.kind==='bounce'?19:14)+b.id)/(Math.PI/8))*Math.PI/8,size=(b.weapon==='scythe'?75:56)*scale;
    if(!this.reducedMotion){glyph(r,b.sprite,b.x,b.y,size,spin-.7,.13);glyph(r,b.sprite,b.x,b.y,size,spin-.35,.25);}
    glyph(r,b.sprite,b.x,b.y,size,spin);ring(c,b.x,b.y,size*.34,style.color,2,.35,spin,spin+Math.PI*1.4);
   }else if(b.weapon==='bloodneedle'){
    c.save();c.translate(pixel(b.x),pixel(b.y));c.rotate(a);line(c,[[-28,0],[20,0]],'#dca4b0',2);poly(c,[[22,0],[8,-4],[8,4]],'#f4ded0');ring(c,-7,0,4,'#a9637d',1);c.restore();
   }else if(['spear','bow','dagger','turret'].includes(b.weapon)){
    c.save();c.translate(pixel(b.x),pixel(b.y));c.rotate(a);c.scale(scale,scale);
    const length=b.weapon==='spear'?71:b.weapon==='bow'?37:b.weapon==='dagger'?29:19;
    line(c,[[-length,0],[10,0]],style.color,b.weapon==='turret'?5:3,.7);line(c,[[-length*.6,-1],[13,-1]],style.core,1.5);
    poly(c,[[20,0],[6,-5],[9,0],[6,5]],style.core);poly(c,[[-length+2,0],[-length-8,-6],[-length+5,-3]],style.color,.8);poly(c,[[-length+2,0],[-length-8,6],[-length+5,3]],style.color,.8);
    if(b.shock){line(c,[[-30,0],[-20,-6],[-9,3],[2,-4],[12,0]],'#dcc7ed',2,.8);}
    c.restore();if(b.weapon==='spear')this.fx(r,'thrust',b.x,b.y,88*scale,phase,a,.7);
    if(b.weapon==='turret')this.fx(r,'flame',b.x-8*Math.cos(a),b.y-8*Math.sin(a),25*scale,phase,a+Math.PI/2,.75);
   }else if(b.weapon==='aegis'){
    c.save();c.translate(pixel(b.x),pixel(b.y));c.rotate(a);poly(c,[[-20,0],[-2,-6],[16,0],[-2,6]],style.color,.9);poly(c,[[-7,0],[0,-3],[13,0],[0,3]],style.core);line(c,[[-32,0],[-18,0]],style.color,2,.5);c.restore();
   }else if(b.weapon==='familiar'){
    c.save();c.translate(pixel(b.x),pixel(b.y));c.rotate(a);poly(c,[[-20,0],[-9,-5],[14,0],[-10,4]],style.core);line(c,[[-14,0],[9,0]],style.color,2);c.restore();
   }else{
    const spin=this.reducedMotion?a:time*12+b.id;this.fx(r,'crescent',b.x,b.y,(b.homing?66:52)*scale,phase,spin,1);
    if(b.homing){ring(c,b.x,b.y,19*scale,'#e1c88c',1,.65,spin,spin+Math.PI);mote(c,b.x+6,b.y-4,'#f9e3a7',3);}
   }
   if(born<.13)this.fx(r,'spark',b.x,b.y,35*scale,born/.13,a,.6*(1-born/.13));
   c.restore();
  }
 }
 drawTornado(r,b,time){
  const c=r.ctx,phase=this.reducedMotion ? .25 : (time*1.5+b.id*.13)%1,rad=b.radius,color=b.seek?'#c5e4d1':'#9fcdb3';
  c.save();c.globalAlpha*=.8;
  c.fillStyle='#708f7c';c.globalAlpha*=.12;c.beginPath();c.ellipse(b.x,b.y+16,rad*.9,rad*.3,0,0,tau);c.fill();c.globalAlpha/=.12;
  this.fx(r,'wind',b.x,b.y-rad*.35,rad*2.1,phase,0,.82,1.2);
  for(let j=0;j<3;j++){const y=b.y-j*rad*.35,rr=rad*(.55+j*.18),a=(this.reducedMotion?0:time*8)+j+b.id;const points=[];for(let i=0;i<15;i++){const t=a+i*Math.PI*1.4/14;points.push([b.x+Math.cos(t)*rr,y+Math.sin(t)*rr*.25]);}line(c,points,color,2,.65);if(!this.reducedMotion)mote(c,b.x+Math.cos(a)*rr,y+Math.sin(a)*rr*.25,'#e2e7bd',3,.8);}
  if(b.seek)ring(c,b.x,b.y-26,rad*.4,'#dbdfad',1,.4,phase*tau,phase*tau+Math.PI);
  c.restore();
 }
 drawOrbits(r,p,time){
  const c=r.ctx,scale=weaponScale(p),evolved=p.evolutions?.orbit==='starfall';
  for(const b of orbitBlades(p,time)){
   const sign=evolved&&Math.hypot(b.x-p.x,b.y-p.y)>120*scale?-1:1;
   if(!this.reducedMotion)for(let k=3;k>0;k--){const a=b.angle-sign*k*.1,radius=Math.hypot(b.x-p.x,b.y-p.y);this.fx(r,'crescent',p.x+Math.cos(a)*radius,p.y+Math.sin(a)*radius,42*scale,(time+k*.1)%1,a+time*5,.1*(4-k));}
   this.fx(r,'crescent',b.x,b.y,46*scale,time%1,b.angle+(this.reducedMotion?0:time*5));mote(c,b.x,b.y,evolved?'#e5d798':'#d8ead1',2,.65);
  }
 }
 drawCast(r,p,time){
  if(p.hp<=0||!Number.isFinite(p.attackAt))return;const elapsed=time-p.attackAt;if(elapsed<0||elapsed>.32)return;
  const c=r.ctx,style=weaponStyle(p.evolutions?.[p.attackKind]||p.attackKind),a=p.attackAngle||0,t=elapsed/.32,x=p.x+Math.cos(a)*24,y=p.y-23+Math.sin(a)*18;
  c.save();c.globalAlpha=this.opacity(p.id)*(1-t)*.85;
  if(['bow','dagger','spear','blade','axe','scythe','whip'].includes(p.attackKind)){
   c.save();c.translate(x,y);c.rotate(a);
   if(p.attackKind==='bow'){
    const pull=Math.sin(t*Math.PI)*11;line(c,[[2,-23],[9,-11],[11,0],[9,11],[2,23]],'#c8d5a3',3);line(c,[[2,-23],[-pull,0],[2,23]],'#eee5bf',1);
   }else this.fx(r,p.attackKind==='spear'?'thrust':'spark',10,0,p.attackKind==='spear'?85:40,t,0,.8);
   c.restore();
  }else if(['mine','saw','turret'].includes(p.attackKind))this.fx(r,'smoke',p.x,p.y+10,72,t,0,.6);
  else{
   this.fx(r,'rune',x,y,38+12*Math.sin(t*Math.PI),t,0,.65);ring(c,x,y,12+14*t,style.color,2,1-t);mote(c,x,y,style.core,4,1-t);
  }
  c.restore();
 }
 drawFamiliars(r,p,time){
  const c=r.ctx,scale=weaponScale(p),evolved=p.evolutions?.familiar==='seraph';
  for(const bird of p.familiars||[]){const dive=bird.phase==='dive',a=dive?(bird.angle||0)+Math.PI/2:0,phase=this.reducedMotion ? .25 : (time*(dive?3.5:2.2)+bird.id*.2)%1;
   if(dive&&!this.reducedMotion){this.fx(r,'raven',bird.x-Math.cos(bird.angle)*22,bird.y-Math.sin(bird.angle)*22,58*scale,phase,a,.18);line(c,[[bird.x-Math.cos(bird.angle)*40,bird.y-Math.sin(bird.angle)*40],[bird.x,bird.y]],'#a2b8e3',2,.35);}
   this.fx(r,'raven',bird.x,bird.y-8,66*scale,phase,a);
   if(evolved){mote(c,bird.x-8,bird.y-22,'#eedfa4',3,.85);mote(c,bird.x+7,bird.y-20,'#eedfa4',3,.85);}
  }
 }
 drawFields(r,s,time){
  for(const z of s.zones||[]){if(!this.visible(z.x,z.y,z.radius+80))continue;const c=r.ctx;c.save();c.globalAlpha=this.opacity(z.owner)*fade(z);
   const radius=z.radius,phase=this.reducedMotion ? .25 : (time*1.7+(z.id||0)*.13)%1,ready=z.wait<=0;
   if(drawMemeField(r,z,time,this.reducedMotion)){c.restore();continue;}
   if(drawZmdField(r,z,time)){c.restore();continue;}
   if(z.kind==='pelican'){drawPelican(r,z,time);c.restore();continue;}
   if(drawRitualField(r,z,time,s)){c.restore();continue;}
   if(z.kind==='mine')this.drawMine(r,z,time);
   else if(z.kind==='turret')this.drawTurret(r,z,time);
   else if(z.kind==='tether')this.drawChain(r,z,time);
   else if(z.kind==='saw'||z.kind==='mill')this.drawSaw(r,z,time);
   else if(z.kind==='fire'){
    ring(c,z.x,z.y,radius,'#9d7250',1,.18);c.save();c.globalAlpha*=.12;c.fillStyle='#c88953';c.beginPath();c.ellipse(z.x,z.y,radius,radius*.62,0,0,tau);c.fill();c.restore();
    const count=this.reducedMotion?5:9;
    for(let i=0;i<count;i++){const a=i*2.4,radiusAt=radius*(.15+.65*noise(z.id||1,i)),x=z.x+Math.cos(a)*radiusAt,y=z.y+Math.sin(a)*radiusAt*.65;this.fx(r,'flame',x,y-5,45+radius*.3,(phase+i*.17)%1,0,.8);}
    if(!this.reducedMotion)for(let i=0;i<8;i++){const t=(phase+i*.12)%1,a=i*2.4;mote(c,z.x+Math.cos(a)*radius*.7,z.y+Math.sin(a)*radius*.4-t*50,'#ebc285',2,(1-t)*.6);}
   }else if(z.kind==='sigil'||z.kind==='meteor'){
    const charge=clamp(1-z.wait/(z.delay||.8));
    this.fx(r,'rune',z.x,z.y,radius*2.25,phase,0,(ready?.25:.4+.4*charge),.78);
    ring(c,z.x,z.y,radius*(.6+.2*charge),z.kind==='meteor'?'#e6b276':'#d5b1da',2,.65,-Math.PI/2,-Math.PI/2+tau*charge);
    if(!ready){
     for(let i=0;i<6;i++){const a=i*tau/6-(this.reducedMotion?0:time*.65),x=z.x+Math.cos(a)*radius*.85,y=z.y+Math.sin(a)*radius*.7;mote(c,x,y,z.kind==='meteor'?'#edc98d':'#e1b8de',3,.65);}
     if(z.kind==='meteor'){
      const y=z.y-280*(1-charge)-22;this.fx(r,'flame',z.x,y-24,80,phase,Math.PI,charge);line(c,[[z.x,y-100],[z.x,y]],'#e9be86',6,.22*charge);this.fx(r,'burst',z.x,y,55,charge*.35,0,.9);
     }else{this.fx(r,'rune',z.x,z.y-32*charge,65+charge*35,phase,0,.7);line(c,[[z.x,z.y],[z.x,z.y-40*charge]],'#dfb4da',2,.4);}
    }
   }else if(z.kind==='void'){
    c.save();c.globalAlpha*=.8;c.fillStyle='#10202e';c.beginPath();c.ellipse(z.x,z.y,radius*.42,radius*.22,0,0,tau);c.fill();c.restore();
    for(let j=0;j<4;j++){const points=[];for(let i=0;i<24;i++){const t=i/23,a=j*tau/4+(this.reducedMotion?0:time*1.7)+t*4,rad=radius*(1-t)*.9;points.push([z.x+Math.cos(a)*rad,z.y+Math.sin(a)*rad*.6]);}line(c,points,j%2?'#94c9d7':'#a99acb',2,.26);}
    this.fx(r,'rune',z.x,z.y,radius*1.3,phase,0,.5,.65);ring(c,z.x,z.y,radius*.37,'#b8dfe1',3,.6);
   }
   c.restore();
  }
  for(const b of s.beams||[])this.drawBeam(r,b,time);
 }
 drawMine(r,z,time){
  const c=r.ctx,scale=z.radius/100,charge=clamp(1-z.wait/.45),ready=z.wait<=0;
  glyph(r,36,z.x,z.y,40*Math.min(1.5,scale),0,.6+.4*charge);ring(c,z.x,z.y,23*scale,ready?'#e0bd7d':'#8e8365',1,ready?.35:.6,-Math.PI/2,-Math.PI/2+tau*charge);
  mote(c,z.x-1,z.y-11,ready?'#ffe0a1':'#a79777',ready?4:2,ready?.7:1);
  if(ready&&!this.reducedMotion){const t=(time*.8+z.id*.1)%1;ring(c,z.x,z.y,23*scale+t*12,'#d9b277',1,(1-t)*.22);}
 }
 drawTurret(r,z,time){
  const c=r.ctx,scale=z.scale||1,deploy=clamp(age(z,time)/.25),kick=clamp(1-(time-(z.firedAt??-10))/.12),a=z.angle||0;
  c.save();c.globalAlpha*=.35;c.fillStyle='#050d11';c.beginPath();c.ellipse(z.x,z.y+14,28*scale,10*scale,0,0,tau);c.fill();c.restore();
  if(deploy<1)this.fx(r,'smoke',z.x,z.y+9,80*scale,deploy,0,.6);
  glyph(r,z.evolved?43:37,z.x,z.y-15*deploy,64*scale,0,deploy);
  const from={x:z.x-Math.cos(a)*kick*6,y:z.y-23-Math.sin(a)*kick*6},tip={x:from.x+Math.cos(a)*30*scale,y:from.y+Math.sin(a)*30*scale};
  line(c,[[from.x,from.y],[tip.x,tip.y]],'#323f47',10*scale);line(c,[[from.x,from.y-2],[tip.x,tip.y-2]],'#d1b18a',5*scale);line(c,[[tip.x-Math.sin(a)*5,tip.y+Math.cos(a)*5],[tip.x+Math.sin(a)*5,tip.y-Math.cos(a)*5]],'#ede0b6',2);
  if(kick>0){this.fx(r,'burst',tip.x+Math.cos(a)*15,tip.y+Math.sin(a)*15,42*scale,1-kick,a,.95);this.fx(r,'smoke',tip.x,tip.y,48*scale,1-kick,0,.45);}
  mote(c,z.x,z.y-20,'#efc27c',3,.7);
 }
 drawChain(r,z,time){
  if(!Number.isFinite(z.tx))return;const c=r.ctx,dx=z.tx-z.x,dy=z.ty-z.y,length=Math.hypot(dx,dy)||1,count=Math.min(24,Math.max(3,Math.ceil(length/12))),a=Math.atan2(dy,dx),color=z.evolved?'#c9a4df':'#a895c9',settle=clamp(age(z,time)/.15);
  const points=[];for(let i=0;i<=count;i++){const q=i/count,sag=Math.sin(q*Math.PI)*(this.reducedMotion?0:Math.sin(time*11+z.id)*5)*(1-.5*settle);points.push([z.x+dx*q-dy/length*sag,z.y+dy*q+dx/length*sag]);}
  line(c,points,'#463c61',5,.55);
  for(let i=0;i<points.length;i++){const [x,y]=points[i];c.save();c.translate(pixel(x),pixel(y));c.rotate(a);c.strokeStyle=i%2?color:'#e0cce3';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,i%2?4:5,i%2?3:1.5,0,0,tau);c.stroke();c.restore();}
  this.fx(r,'rune',z.tx,z.ty,40,(time*2)%1,0,.6);if(!this.reducedMotion){const q=(time*1.8+z.id*.1)%1;mote(c,z.x+dx*(1-q),z.y+dy*(1-q),'#eed8ed',4,.8);}
 }
 drawSaw(r,z,time){
  const c=r.ctx,spin=this.reducedMotion?0:Math.round((time*10+z.id)/(Math.PI/12))*Math.PI/12,deploy=clamp(age(z,time)/.15);
  c.save();c.globalAlpha*=.1;c.fillStyle=z.kind==='mill'?'#b397d0':'#c08c98';c.beginPath();c.ellipse(z.x,z.y,z.radius,z.radius*.65,0,0,tau);c.fill();c.restore();
  glyph(r,z.kind==='mill'?44:39,z.x,z.y,z.radius*1.9*deploy,spin,.86);
  ring(c,z.x,z.y,z.radius*.58,z.kind==='mill'?'#d7b2e5':'#e5b5ad',2,.4,spin,spin+Math.PI*1.5);
  if(!this.reducedMotion)for(let i=0;i<5;i++){const a=spin+i*tau/5,radius=z.radius*(.75+.15*noise(z.id,i)),t=(time*3+i*.2)%1;line(c,[[z.x+Math.cos(a)*radius,z.y+Math.sin(a)*radius],[z.x+Math.cos(a)*(radius+12*t),z.y+Math.sin(a)*(radius+12*t)]],'#e9c991',1,(1-t)*.5);}
 }
 drawBeam(r,b,time){
  if(!Number.isFinite(b.x))return;const c=r.ctx,a=b.angle,dx=Math.cos(a),dy=Math.sin(a),t=clamp(1-b.life/b.max),envelope=clamp(t/.08)*clamp((1-t)/.16),width=b.width*(.72+.28*envelope),end=[b.x+dx*b.length,b.y+dy*b.length],phase=this.reducedMotion ? .25 : (time*2)%1,color=b.kind==='solar'?'#e7c286':b.kind==='void'?'#b2b6e4':'#9adcd9';
  c.save();c.globalAlpha=this.opacity(b.owner)*envelope;
  line(c,[[b.x,b.y],end],color,width*2.4,.08);line(c,[[b.x,b.y],end],color,width,.55);line(c,[[b.x,b.y],end],'#eff6dc',Math.max(2,width*.22),.9);
  for(const sign of [-1,1])line(c,[[b.x-dy*width*.6*sign,b.y+dx*width*.6*sign],[end[0]-dy*width*.6*sign,end[1]+dx*width*.6*sign]],color,1,.6);
  if(!this.reducedMotion)for(let i=0;i<6;i++){const q=(phase+i/6)%1,x=b.x+dx*b.length*q,y=b.y+dy*b.length*q;line(c,[[x-dx*12,y-dy*12],[x+dx*12,y+dy*12]],'#e8f6df',2,.8);}
  this.fx(r,b.kind==='solar'?'burst':'arc',b.x,b.y,54+width,phase,0,.7);this.fx(r,'rune',b.x,b.y,48+width,phase,a,.65);c.restore();
 }
 drawEffect(r,f,time){
  const c=r.ctx,t=clamp(1-f.life/f.max+Math.max(0,time-this.simTime)/f.max),phase=this.reducedMotion ? .25 : (time*1.5)%1;
  if(!['counter','slash','lash','lightning','tempest','nova','winter','thunder','rune','fireburst','gravity','forge'].includes(f.type))return false;
  c.save();c.globalAlpha=fade(f);
  if(f.type==='counter'){const style=weaponStyle(f.weapon);ring(c,f.x,f.y,6+t*16,style.color,2,1-t);for(let i=0;i<5;i++){const a=i*tau/5+(f.id||0);line(c,[[f.x+Math.cos(a)*t*9,f.y+Math.sin(a)*t*9],[f.x+Math.cos(a)*(9+t*19),f.y+Math.sin(a)*(9+t*19)]],style.core,2,1-t);}}
  else if(f.type==='lightning'||f.type==='tempest'){
   lightning(c,f,t,this.reducedMotion);this.fx(r,'arc',f.tx,f.ty,f.type==='tempest'?74:48,t,0,(1-t)*.9);
  }else if(f.type==='slash'){
   for(let i=0;i<(f.full?3:1);i++)this.fx(r,'slash',f.x,f.y,f.size*2.45,t,(f.angle||0)+i*tau/3,1-t*.5);
  }else if(f.type==='lash')this.drawLash(r,f,t);
  else if(f.type==='nova'||f.type==='winter'){
   const radius=f.size*(.22+.78*(1-Math.pow(1-t,3)));ring(c,f.x,f.y,radius,'#a5dfe2',3,(1-t)*.75);ring(c,f.x,f.y,radius*.82,'#77aebb',8,(1-t)*.12);
   this.fx(r,'frost',f.x,f.y,f.size*2.25,t,0,.9);
   if(f.type==='winter')for(let i=0;i<8;i++){const a=i*tau/8;this.fx(r,'frost',f.x+Math.cos(a)*radius*.78,f.y+Math.sin(a)*radius*.78,55,t,0,(1-t)*.8);}
  }else if(f.type==='fireburst'){
   this.fx(r,'burst',f.x,f.y,f.size*2.3,t,0,.95);this.fx(r,'smoke',f.x,f.y-18*t,f.size*1.6,t,0,.6);ring(c,f.x,f.y,f.size*(.2+.8*t),'#c69265',2,(1-t)*.45);
  }else if(f.type==='rune'){
   this.fx(r,'rune',f.x,f.y,f.size*2.2*(1-t*.3),phase,0,1-t);this.fx(r,'arc',f.x,f.y,f.size*1.7,t,0,.7*(1-t));
  }else if(f.type==='thunder'){
   this.fx(r,'arc',f.x,f.y,f.size*2.3,t,0,.9);ring(c,f.x,f.y,f.size*t,'#ccb2e3',2,(1-t)*.6);
  }else{
   const color=f.type==='forge'?'#e3c790':'#b6d8bd';ring(c,f.x,f.y,f.size*(.3+.7*t),color,2,(1-t)*.7);
   this.fx(r,'rune',f.x,f.y,f.size*(1.4-.4*t),phase,0,(1-t)*.6);
   for(let i=0;i<10;i++){const a=i*tau/10+(f.type==='forge'?t:-t),radius=f.size*(.4+.5*t);mote(c,f.x+Math.cos(a)*radius,f.y+Math.sin(a)*radius-t*22,color,3,1-t);}
  }
  c.restore();return true;
 }
 drawLash(r,f,t){
  const c=r.ctx,reach=f.size*(.35+.65*Math.min(1,t/.24)),points=[],tail=[];c.save();c.translate(f.x,f.y);c.rotate(f.angle);
  for(let i=0;i<=18;i++){const q=i/18,wave=Math.sin(q*7-t*13)*Math.sin(q*Math.PI)*(1-t)*19;points.push([reach*q,wave]);tail.push([reach*q,wave-8*(1-t)]);}
  if(!this.reducedMotion)line(c,tail,'#8e9b75',f.width*.7,.2*(1-t));line(c,points,'#776b51',Math.max(3,f.width*.3),1-t*.8);line(c,points,'#e1d2a0',2,1-t*.7);
  for(let i=2;i<points.length;i+=3){const [x,y]=points[i];poly(c,[[x-3,y],[x+2,y-8*(1-t)],[x+4,y+2]],'#b4c28b',1-t);}
  const tip=points.at(-1);this.fx(r,'spark',tip[0],tip[1],30,t,0,1-t);c.restore();
 }
}
