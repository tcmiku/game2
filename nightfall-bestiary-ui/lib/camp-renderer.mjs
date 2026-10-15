import {SHRINES,normalizeShrines,SANCTUARY_Y} from './sanctuary.mjs';
import { CAMP_W,CAMP_H,KEEPER,PORTAL,CAMP_SITES,SMITH,CAMP_NPCS } from './camp.mjs';
import { actorPose,ACTOR_CELL } from './animation.mjs';
const FIRES=[{x:416,y:480,size:1.25,light:175},{x:248,y:178,size:.5,light:115},{x:1036,y:182,size:.5,light:115},{x:260,y:586,size:.5,light:125},{x:1032,y:586,size:.5,light:125}];
export class CampRenderer {
 constructor(renderer){this.r=renderer;this.sanctuaryMap=new Image();this.sanctuaryMap.src='/art/pixel-sanctuary.png?v=sakura-1';this.sanctuaryAtlas=new Image();this.sanctuaryAtlas.src='/art/pixel-sanctuary-statues.png';this.map=new Image();this.map.src='/art/pixel-camp.png';this.keeper=new Image();this.keeper.src='/art/pixel-keeper.png';this.portal=new Image();this.portal.src='/art/pixel-portal.png';this.smith=new Image();this.smith.src='/art/pixel-smith.png';this.residentAtlas=new Image();this.residentAtlas.src='/art/pixel-residents.png';this.npcAssets=['keeper-portrait','smith-portrait','npc-glyphs','herbalist-portrait','scholar-portrait'].map(name=>{const image=new Image();image.src=`/art/pixel-${name}.png`;return image;});this.camera={x:640,y:420};this.transform={x:0,y:0,zoom:1};this.reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;this.shrineLevels=new Map();this.shrineAwakenedAt=new Map();}
 get ready(){return[this.map,this.keeper,this.portal,this.smith,this.sanctuaryMap,this.sanctuaryAtlas].every(i=>i.complete&&i.naturalWidth);}
 light(){if(this.fireLight)return this.fireLight;const im=document.createElement('canvas');im.width=im.height=128;const c=im.getContext('2d'),g=c.createRadialGradient(64,64,2,64,64,64);g.addColorStop(0,'#ffc47b88');g.addColorStop(.3,'#f5a45a38');g.addColorStop(1,'#e58a4100');c.fillStyle=g;c.fillRect(0,0,128,128);return this.fireLight=im;}
 flame(c,fire,t,index){
  const {x,y,size}=fire,beat=this.reduced?0:Math.floor(t*11+index*2),sway=[0,2,0,-2][beat%4];
  c.save();c.translate(x,y);c.scale(size,size);
  c.fillStyle='#ad543e';c.fillRect(-10,-10,20,11);c.fillRect(-7,-17,14,12);
  c.fillStyle='#ec9a55';c.fillRect(-7,-15,13,14);c.fillRect(-4+sway,-24-(beat%3)*2,7,14);c.fillRect(4-sway,-17,5,11);
  c.fillStyle='#ffd086';c.fillRect(-4,-14,8,12);c.fillRect(-2+sway,-22,4,12);
  c.fillStyle='#fff0c1';c.fillRect(-2,-8,4,7);c.fillRect(-1+sway,-16,3,9);
  for(let i=0;i<6;i++){const age=this.reduced?i/6:(t*.42+i/6+index*.13)%1;c.globalAlpha=(1-age)*.8;c.fillStyle=i%2?'#f6c582':'#d78959';c.fillRect(Math.round((Math.sin(i*3+age*5)*9+sway)/2)*2,-18-Math.round(age*45/2)*2,2,3);}
  c.restore();
 }
 shadow(c,entity,t){
  if(!this.actorShadow&&this.r.whiteActors.width){this.actorShadow=document.createElement('canvas');this.actorShadow.width=this.r.whiteActors.width;this.actorShadow.height=this.r.whiteActors.height;const mask=this.actorShadow.getContext('2d');mask.drawImage(this.r.whiteActors,0,0);mask.globalCompositeOperation='source-in';mask.fillStyle='#050e18';mask.fillRect(0,0,this.actorShadow.width,this.actorShadow.height);}
  const dx=entity.x-416,dy=entity.y-480,length=Math.max(1,Math.hypot(dx,dy)),pose=actorPose(entity,t,{player:true,reducedMotion:this.reduced});
  c.save();c.translate(entity.x,entity.y+8);c.globalAlpha=.36;c.transform((entity.face||1)*.8,0,-dx/length*.9,-dy/length*.48,0,0);
  if(entity.kind==='player'&&this.actorShadow)c.drawImage(this.actorShadow,pose.column*ACTOR_CELL,0,ACTOR_CELL,ACTOR_CELL,-43,-64.5,86,86);
  else{c.fillStyle='#07121b';c.beginPath();c.moveTo(-17,0);c.lineTo(-22,-48);c.lineTo(-8,-70);c.lineTo(8,-70);c.lineTo(22,-48);c.lineTo(17,0);c.fill();}
  c.restore();
 }
 torii(c){
  c.save();c.translate(640,188);c.scale(.82,.82);
  const polygon=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  c.fillStyle='#040c1770';c.beginPath();c.ellipse(0,10,146,19,0,0,Math.PI*2);c.fill();
  for(const side of [-1,1]){const x=side*99;c.fillStyle='#182731';c.fillRect(x-18,-16,36,30);c.fillStyle='#647270';c.fillRect(x-17,-13,34,6);c.fillStyle='#394b52';c.fillRect(x-14,-7,28,20);c.fillStyle='#1b232f';c.fillRect(x-12,-190,24,178);c.fillStyle='#854e53';c.fillRect(x-9,-188,18,174);c.fillStyle='#b47a73';c.fillRect(x-8,-185,4,169);c.fillStyle='#573d4a';c.fillRect(x+6,-184,3,168);c.fillStyle='#38353b';c.fillRect(x-12,-35,24,16);c.fillStyle='#ac9272';c.fillRect(x-12,-35,24,3);}
  polygon([[-150,-160],[150,-160],[150,-144],[-150,-144]],'#252630');c.fillStyle='#a46b64';c.fillRect(-146,-159,292,5);c.fillStyle='#794a51';c.fillRect(-145,-154,290,7);
  polygon([[-164,-224],[-145,-219],[-108,-212],[108,-212],[145,-219],[164,-224],[160,-207],[143,-200],[-143,-200],[-160,-207]],'#17242e');
  polygon([[-159,-219],[-110,-208],[110,-208],[159,-219],[156,-211],[139,-204],[-139,-204],[-156,-211]],'#4a4d51');
  polygon([[-147,-202],[147,-202],[142,-190],[-142,-190]],'#854e53');c.fillStyle='#c28d78';c.fillRect(-141,-202,282,3);c.fillStyle='#4e3743';c.fillRect(-141,-193,282,4);
  c.fillStyle='#a98e62';c.fillRect(-6,-191,12,32);c.fillStyle='#d1b585';c.fillRect(-4,-191,3,28);
  c.strokeStyle='#baaa80';c.lineWidth=3;c.beginPath();c.moveTo(-96,-140);c.lineTo(-58,-130);c.lineTo(0,-124);c.lineTo(58,-130);c.lineTo(96,-140);c.stroke();
  for(const x of [-64,-28,28,64]){const y=-127-Math.abs(x)*.13;polygon([[x,y],[x+7,y+4],[x+2,y+10],[x+8,y+14],[x,y+25],[x-4,y+20],[x+2,y+14],[x-4,y+10]],'#cfcdc0');}
  c.fillStyle='#152630';c.fillRect(-20,-188,40,31);c.fillStyle='#9d875e';c.fillRect(-17,-185,34,25);c.fillStyle='#28343c';c.fillRect(-14,-182,28,19);polygon([[0,-180],[5,-173],[0,-166],[-5,-173]],'#d5be90');
  c.restore();
 }
 petals(c,time){
  const t=this.reduced?0:time,colors=['#e8bbc8','#c996b0','#eed1cf','#aa7998'];
  c.save();c.beginPath();c.rect(0,SANCTUARY_Y,1280,940);c.clip();
  for(let i=0;i<76;i++){
   const phase=(i*.61803398875)%1,age=(t*(.024+i%5*.002)+phase)%1;
   const x=((i*173+t*(7+i%4)+Math.sin(t*.7+i*2.4)*25)%1320)-20,y=SANCTUARY_Y-35+age*980;
   const flutter=Math.sin(t*2.2+i*1.9),width=Math.abs(flutter)>.4?5:2;
   c.globalAlpha=(.36+(i%4)*.12)*Math.min(1,age*12,(1-age)*12);c.fillStyle=colors[i%4];
   c.save();c.translate(Math.round(x/2)*2,Math.round(y/2)*2);c.rotate(this.reduced?i%3*.5:Math.round(flutter*3)*Math.PI/8);c.fillRect(-width/2,-1,width,2);if(width>2)c.fillRect(-1,-2,3,1);c.restore();
  }c.restore();
 }
 shrineAura(c,entity,time,level,scale){
  if(!level)return;
  const color=SHRINES[entity.id].color,beat=this.reduced?1:.84+Math.sin(time*1.6+entity.sprite)*.12;
  const since=time-(this.shrineAwakenedAt.get(entity.id)??-100),surge=!this.reduced&&since>=0&&since<1.8?1-since/1.8:0;
  c.save();c.translate(entity.x,entity.y);c.globalCompositeOperation='screen';
  const glow=c.createRadialGradient(0,-55*scale,5,0,-55*scale,110*scale);glow.addColorStop(0,color+'35');glow.addColorStop(.45,color+'13');glow.addColorStop(1,color+'00');c.globalAlpha=Math.min(1,beat+surge*.4);c.fillStyle=glow;c.fillRect(-120*scale,-185*scale,240*scale,245*scale);
  c.fillStyle=color+'09';c.beginPath();c.moveTo(-29*scale,-178*scale);c.lineTo(29*scale,-178*scale);c.lineTo(47*scale,5);c.lineTo(-47*scale,5);c.closePath();c.fill();
  for(let ring=0;ring<2;ring++){c.strokeStyle=color;c.globalAlpha=(ring?.18:.42)*beat+surge*.3;c.lineWidth=ring?1:2;c.beginPath();c.ellipse(0,6,(61+ring*9+surge*15)*scale,(18+ring*3+surge*4)*scale,0,0,Math.PI*2);c.stroke();}
  c.globalAlpha=.7*beat;
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.round(Math.cos(a)*62*scale/2)*2,y=Math.round((6+Math.sin(a)*18*scale)/2)*2;c.fillStyle=i%3?color:'#f5ead0';c.fillRect(x-1,y-2,2,4);}
  c.restore();
 }
 shrine(c,entity,time,profile){
  const def=SHRINES[entity.id],level=normalizeShrines(profile?.shrines)[entity.id],scale=entity.id==='foundation'?1.6:.95;
  const previous=this.shrineLevels.get(entity.id);if(previous!==undefined&&level>previous)this.shrineAwakenedAt.set(entity.id,time);this.shrineLevels.set(entity.id,level);this.shrineAura(c,entity,time,level,scale);
  c.save();c.translate(entity.x,entity.y);c.fillStyle='#06101a88';c.beginPath();c.ellipse(0,10,57*scale,14*scale,0,0,Math.PI*2);c.fill();
  c.strokeStyle=level?def.color:'#657876';c.globalAlpha=level?.7:.35;c.lineWidth=2;c.beginPath();c.ellipse(0,5,58*scale,18*scale,0,0,Math.PI*2);c.stroke();c.globalAlpha=level?1:.7;
  if(this.sanctuaryAtlas.complete&&this.sanctuaryAtlas.naturalWidth)c.drawImage(this.sanctuaryAtlas,def.sprite*128,0,128,192,-64*scale,-184*scale,128*scale,192*scale);
  if(level){const a=this.reduced?1:.7+Math.sin(time*2)*.2;c.globalAlpha=a;c.fillStyle=def.color;for(let i=0;i<10;i++){const phase=this.reduced?i/10:(time*.12+i/10)%1,x=Math.sin(i*2.4+phase*3)*39*scale,y=-25*scale-phase*143*scale;c.globalAlpha=a*Math.sin(phase*Math.PI);c.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,i%3?2:3,3);}c.globalAlpha=a;c.fillStyle='#f4e9d1';const starY=entity.id==='foundation'?-173*scale:-157*scale;c.fillRect(-1,starY-4,2,8);c.fillRect(-4,starY-1,8,2);if(entity.id==='foundation'){c.fillStyle='#f4e9b9';c.fillRect(-2*scale,-98*scale,4*scale,8*scale);}}
  c.restore();
 }
 project(entity){const {x,y,zoom}=this.transform;return{x:entity.x*zoom+x,y:entity.y*zoom+y};}
 unproject(x,y){const t=this.transform;return{x:(x-t.x)/t.zoom,y:(y-t.y)/t.zoom};}
 ritual(c,camp,ritual){
  if(!ritual||!['channeling','receiving'].includes(ritual.phase))return;
  const def=SHRINES[ritual.id];if(!def)return;const scale=def.id==='foundation'?1.6:.95,progress=Math.max(0,Math.min(1,ritual.progress)),x=def.x,y=def.y-95*scale;
  c.save();c.globalCompositeOperation='screen';c.strokeStyle=def.color;c.lineWidth=2;c.globalAlpha=.8;c.beginPath();c.arc(x,y,26*scale,-Math.PI/2,-Math.PI/2+Math.PI*2*progress);c.stroke();
  const glow=c.createRadialGradient(x,y,2,x,y,75*scale);glow.addColorStop(0,def.color+'88');glow.addColorStop(.3,def.color+'32');glow.addColorStop(1,def.color+'00');c.fillStyle=glow;c.globalAlpha=ritual.phase==='receiving'?.9:.25+progress*.6;c.fillRect(x-80*scale,y-80*scale,160*scale,160*scale);
  if(ritual.phase==='channeling')for(let i=0;i<12;i++){
   const p=this.reduced?progress:(camp.time*.8+i/12)%1,px=camp.x+(x-camp.x)*p+Math.sin(p*Math.PI)*(i%2?12:-12),py=camp.y-35+(y-camp.y+35)*p-Math.sin(p*Math.PI)*18;
   c.globalAlpha=Math.sin(p*Math.PI)*(.4+progress*.6);c.fillStyle=i%3?def.color:'#fff0c4';c.fillRect(Math.round(px/2)*2,Math.round(py/2)*2,3,4);
  }
  c.restore();
 }
 render(camp,dt,profile,ritual=null){
 const r=this.r;r.resize();r.feedback.reset();const c=r.ctx,w=r.w,h=r.h;
 c.setTransform(r.dpr,0,0,r.dpr,0,0);c.fillStyle='#080f15';c.fillRect(0,0,w,h);
 const focus=ritual&&SHRINES[ritual.id],baseZoom=Math.max(.68,Math.min(1.12,w/CAMP_W,h/CAMP_H)),desiredZoom=baseZoom*(focus?(w>760?1.18:.96):1);
 this.zoom??=baseZoom;this.zoom+=(desiredZoom-this.zoom)*(this.reduced?1:Math.min(1,dt*6));const zoom=this.zoom;
 const visible=w/zoom/2,targetX=w<800?Math.max(visible,Math.min(CAMP_W-visible,camp.x-70)):640;
 const focusX=w>760?Math.max(w*.28,(w-420)/2):w/2,focusY=h*(w>760?.46:.23),figureY=focus?focus.y-(focus.id==='foundation'?145:86):0;
 const ritualX=focus?Math.max(visible,Math.min(CAMP_W+(w/2-(w>760?w-420:w))/zoom,focus.x+(w/2-focusX)/zoom)):targetX;
 this.camera.x+=(ritualX-this.camera.x)*(this.reduced?1:Math.min(1,dt*5));const north=Math.max(0,Math.min(1,(170-camp.y)/350)),targetY=focus?Math.max(SANCTUARY_Y+h/zoom/2,figureY+(h/2-focusY)/zoom):420-800*north;this.camera.y+=(targetY-this.camera.y)*(this.reduced?1:Math.min(1,dt*5));
 const ox=w/2-this.camera.x*zoom,oy=h/2-this.camera.y*zoom;this.transform={x:ox,y:oy,zoom};c.save();c.translate(ox,oy);c.scale(zoom,zoom);
 if(this.map.complete&&this.map.naturalWidth)c.drawImage(this.map,0,0,CAMP_W,CAMP_H);
 if(this.sanctuaryMap.complete&&this.sanctuaryMap.naturalWidth)c.drawImage(this.sanctuaryMap,0,SANCTUARY_Y,CAMP_W,CAMP_H);
 // Northern stairs join the two maps through the forest edge.
 for(let y=36;y<175;y+=18){c.fillStyle='#334a50';c.fillRect(566,y,148,16);c.fillStyle='#687a77';c.fillRect(568,y,144,3);c.fillStyle='#223b43';c.fillRect(638,y+3,3,13);}
 const t=camp.time;
 // Warm hearth light contrasts the blue-violet portal. Gradients are light only;
 // all silhouettes and particles remain on the pixel grid.
 const fires=[...FIRES,{x:210,y:-270,size:.55,light:130},{x:1070,y:-270,size:.55,light:130},...(profile?.residents?.includes('smith')?[{x:982,y:466,size:.6,light:130}]:[])];
 for(let i=0;i<fires.length;i++){const fire=fires[i],flicker=this.reduced?1:.92+Math.sin(t*8+i*2)*.045+Math.sin(t*13+i)*.035;c.save();c.globalAlpha=flicker;c.drawImage(this.light(),fire.x-fire.light,fire.y+20-fire.light,fire.light*2,fire.light*2);c.restore();}
 const px=PORTAL.x,py=PORTAL.y-88,pulse=this.reduced?1:1+Math.sin(t*2)*.045;
 const glow=c.createRadialGradient(px,py,20,px,py,190);glow.addColorStop(0,'#c3b4f13d');glow.addColorStop(.5,'#7f96dd24');glow.addColorStop(1,'#6d85dc00');c.fillStyle=glow;c.fillRect(px-200,py-200,400,400);
 c.save();c.translate(px,py);c.scale(pulse,pulse);c.fillStyle='#667dc343';c.beginPath();c.ellipse(0,0,49,80,0,0,6.28);c.fill();
 for(let j=0;j<5;j++){const phase=this.reduced?j/5:(t*.18+j/5)%1;c.globalAlpha=(1-phase)*.65;c.strokeStyle=j%2?'#b6b3f4':'#8bbcdf';c.lineWidth=2;c.beginPath();c.ellipse(0,0,18+phase*34,32+phase*48,0,0,6.28);c.stroke();}c.restore();
 c.fillStyle='#abb4ec20';c.beginPath();c.ellipse(px,PORTAL.y+9,95,25,0,0,6.28);c.fill();
 if(this.portal.complete&&this.portal.naturalWidth)c.drawImage(this.portal,px-88,PORTAL.y-194,176,220);
 for(let i=0;i<32;i++){
  const a=i*2.399+(this.reduced?0:t*.22),v=this.reduced?i/32:(t*.12+i/32)%1,radius=80*(1-v);
  const x=px+Math.cos(a)*radius,y=py+Math.sin(a)*radius*1.3;
  c.globalAlpha=.2+Math.sin(v*Math.PI)*.65;c.fillStyle=i%3?'#aebcf4':'#efe2ff';c.fillRect(Math.round(x/3)*3,Math.round(y/3)*3,i%4?3:5,i%4?3:5);
 }c.globalAlpha=1;
 for(let i=0;i<fires.length;i++)this.flame(c,fires[i],t,i);
 for(const site of CAMP_SITES){const unlocked=profile?.unlocks?.includes(site.id),resident=profile?.residents?.includes(site.resident);if(unlocked||resident){c.strokeStyle='#cbbd855c';c.lineWidth=2;c.beginPath();c.ellipse(site.x,site.y+8,35,12,0,0,6.28);c.stroke();}}
 const entities=[...Object.values(SHRINES).map(s=>({...s,kind:'shrine'})),{x:640,y:188,kind:'torii'},{...KEEPER,kind:'keeper'},{...camp,kind:'player'},...(profile?.residents?.includes('smith')?[{...SMITH,kind:'smith'}]:[]),...CAMP_NPCS.filter(n=>profile?.residents?.includes(n.kind)).map(n=>({...n,kind:n.kind}))].sort((a,b)=>a.y-b.y);
 for(const entity of entities)if(entity.kind!=='shrine'&&entity.kind!=='torii')this.shadow(c,entity,t);
 for(const entity of entities){if(entity.kind==='torii'){this.torii(c);continue;}if(entity.kind==='shrine'){this.shrine(c,entity,t,profile);continue;}c.fillStyle='#0005';c.beginPath();c.ellipse(entity.x,entity.y+8,22,8,0,0,6.28);c.fill();if(entity.kind==='keeper'){if(this.keeper.complete&&this.keeper.naturalWidth)c.drawImage(this.keeper,entity.x-44,entity.y-66+(this.reduced?0:Math.round(Math.sin(t*1.5))),88,88);}else if(entity.kind==='smith'){const frame=this.reduced?0:Math.floor(t*5)%4;if(this.smith.complete&&this.smith.naturalWidth)c.drawImage(this.smith,frame*96,0,96,96,entity.x-48,entity.y-72,96,96);}else if(entity.kind==='herbalist'||entity.kind==='scholar'){const frame=this.reduced?0:Math.floor(t*3)%4,row=entity.kind==='herbalist'?0:1;if(this.residentAtlas.complete&&this.residentAtlas.naturalWidth)c.drawImage(this.residentAtlas,frame*64,row*64,64,64,entity.x-44,entity.y-66,88,88);}else{c.strokeStyle='#b6ceb860';c.lineWidth=1;c.beginPath();c.ellipse(camp.x,camp.y+9,23,8,0,0,6.28);c.stroke();r.actor(camp,camp.x,camp.y,86,t,{player:true,reducedMotion:this.reduced});}}
 this.ritual(c,camp,ritual);if(this.camera.y<300)this.petals(c,t);
 for(let i=0;i<24;i++){const x=(i*179+Math.sin(t*.2+i)*20)%CAMP_W,y=(i*97-(this.reduced?0:t*(2+i%3))+CAMP_H*100)%CAMP_H;c.globalAlpha=.12+(Math.sin(t+i)+1)*.12;c.fillStyle='#b9c8b4';c.fillRect(Math.round(x/3)*3,Math.round(y/3)*3,2,2);}c.globalAlpha=1;c.restore();
 const vignette=c.createRadialGradient(w/2,h/2,h*.15,w/2,h/2,Math.max(w,h)*.68);vignette.addColorStop(0,'#060d1300');vignette.addColorStop(1,'#060d13c9');c.fillStyle=vignette;c.fillRect(0,0,w,h);
 r.display.setTransform(1,0,0,1,0,0);r.display.imageSmoothingEnabled=false;r.display.drawImage(r.surface,0,0,r.canvas.width,r.canvas.height);
 return{zoom,width:w,height:h,inSanctuary:camp.y< -70,gate:this.project({x:640,y:188}),shrines:Object.values(SHRINES).map(s=>({...s,...this.project(s)})),keeper:this.project({x:KEEPER.x,y:KEEPER.y-81}),smith:this.project({x:SMITH.x,y:SMITH.y-81}),portal:this.project({x:PORTAL.x,y:PORTAL.y+40}),player:this.project(camp),npcs:CAMP_NPCS.map(npc=>({...npc,...this.project({x:npc.x,y:npc.y-81})})),sites:CAMP_SITES.map(site=>({...site,...this.project({x:site.x,y:site.y-50})}))};
 }
}
