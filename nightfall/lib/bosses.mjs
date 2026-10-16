import {drawBossSprite} from './boss-presentation.mjs';
import {stepBossSkills,bossPursuit,stepBossPattern,drawBossSkillWarnings,drawBossPattern,BOSS_SKILL_NAMES} from './boss-skills.mjs';
export {BOSS_SKILLS,BOSS_TUNING,BOSS_SKILL_NAMES} from './boss-skills.mjs';
const tau=Math.PI*2;
export const BOSS_ORDER=['roots','prism','halo','ribbon'];
export const BOSSES={roots:{name:'枯枝之王',code:'I · THORN',color:'#c6a37f',role:'根刺追猎 · 荆棘封路 · 古木震荡'},prism:{name:'棱镜使骸',code:'II · PRISM',color:'#a8cfde',role:'交叉光束 · 折光围牢 · 三重折射'},halo:{name:'空环使骸',code:'III · HALO',color:'#d3bcdf',role:'连环星坠 · 星轨围剿 · 彗星追猎'},ribbon:{name:'断界使骸',code:'IV · RIFT',color:'#e2a493',role:'连续突进 · 裂地连冲 · 断界追斩'},reaper:{name:'死神',code:'Ω · REAPER',color:'#ef8a92',role:'终夜降临'}};
export function bossKind(cycle){return BOSS_ORDER[(Math.max(1,cycle)-1)%BOSS_ORDER.length];}
export function bossDefinition(e){return BOSSES[e.type===7?'reaper':e.bossKind||'roots']||BOSSES.roots;}
export function bossPhase(e){return e.type===7?'不可阻挡':e.skill?(BOSS_SKILL_NAMES[e.skill]||'蓄势'):e.chargeLeft>0?'突进':e.bossChain?.length?'连段追击':e.hp<e.maxHp*.45?'狂暴':'交战';}
export const stepBossAttack=stepBossSkills,bossMotion=bossPursuit,stepBossHazard=stepBossPattern;
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
export const drawBossWarnings=drawBossSkillWarnings,drawBossHazard=drawBossPattern;
