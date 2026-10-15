/** Native 224px silhouettes, sized to dominate the player without hiding dodge space. */
export const BOSS_CELL=224;
export const BOSS_VISUALS={roots:{column:0,height:368,radius:84,core:.47},prism:{column:1,height:400,radius:82,core:.4},halo:{column:2,height:384,radius:94,core:.38},ribbon:{column:3,height:420,radius:72,core:.63},reaper:{column:4,height:340,radius:56,core:.54}};
export const bossVisual=e=>BOSS_VISUALS[e.type===7?'reaper':e.bossKind||'roots']||BOSS_VISUALS.roots;
export function bossCamera(s,me,width,height,baseZoom){
 const bosses=(s?.enemies||[]).filter(e=>e.type===4&&e.hp>0&&Math.hypot(e.x-me.x,e.y-me.y)<950).sort((a,b)=>Math.hypot(a.x-me.x,a.y-me.y)-Math.hypot(b.x-me.x,b.y-me.y));
 const boss=bosses[0];if(!boss)return{x:me.x,y:me.y,zoom:baseZoom};
 const visual=bossVisual(boss),radius=visual.height*.45,minX=Math.min(me.x-75,boss.x-radius),maxX=Math.max(me.x+75,boss.x+radius),minY=Math.min(me.y-100,boss.y-visual.height*.89),maxY=Math.max(me.y+85,boss.y+50),top=Math.min(width<600?245:250,height*.44),bottom=85;
 const zoom=Math.max(.36,Math.min(baseZoom,(width-54)/(maxX-minX),(height-top-bottom)/(maxY-minY)));
 return{x:(minX+maxX)/2,y:(minY+maxY)/2-((top+height-bottom)/2-height/2)/zoom,zoom};
}
export function drawBossSprite(r,e,x,y,height,time,flash=0){
 const atlas=r.bossAtlas;if(!atlas?.complete||!atlas.naturalWidth)return false;
 const c=r.ctx,visual=bossVisual(e),reduced=r.feedback.reducedMotion,active=!!e.skill||e.chargeLeft>0,row=active?1:0,bob=reduced?0:Math.round(Math.sin(time*(active?3.5:1.6))*3),sx=visual.column*BOSS_CELL,sy=row*BOSS_CELL;
 c.save();c.translate(Math.round(x),Math.round(y+bob));c.imageSmoothingEnabled=false;
 c.drawImage(atlas,sx,sy,BOSS_CELL,BOSS_CELL,-height/2,-height*.86,height,height);
 if(flash>0&&r.whiteBossAtlas?.width){c.globalAlpha*=Math.min(.7,flash*.7);c.drawImage(r.whiteBossAtlas,sx,sy,BOSS_CELL,BOSS_CELL,-height/2,-height*.86,height,height);}
 c.restore();
 const coreY=y-height*visual.core+bob;
 c.save();c.globalAlpha*=active?.8:.35;c.fillStyle=active?'#f9c98c':'#e6dbab';const glint=active?4:2;c.fillRect(Math.round(x-glint/2),Math.round(coreY-glint/2),glint,glint);c.restore();
 if(e.barrier>0){c.save();c.strokeStyle='#e4b77c';c.lineWidth=2;c.globalAlpha=.6;const radius=height*.48,centerY=y-height*.4;for(let ring=0;ring<2;ring++){c.beginPath();for(let i=0;i<=8;i++){const a=i*Math.PI/4+Math.PI/8,px=Math.round(x+Math.cos(a)*(radius+ring*8)),py=Math.round(centerY+Math.sin(a)*(radius*.82+ring*8));i?c.lineTo(px,py):c.moveTo(px,py);}c.stroke();}c.restore();}
 return true;
}
