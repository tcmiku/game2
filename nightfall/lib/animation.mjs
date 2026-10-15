/** Six actor rows plus seven enemy rows, each with twelve native 96px poses. */
export const ACTOR_CELL=96,ACTOR_COLUMNS=12,ACTOR_ROWS=16;
export const ATTACK_SPAN={player:.32,1:.36,2:.4,3:.28,4:.55,5:.45,6:.45,7:.32,8:.55,9:.6,10:.6,11:1,12:.9,13:.65,14:.65,15:.9};
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function actorPose(entity,time,{player=false,reducedMotion=false}={}){
 const row=player?0:clamp(Math.floor(entity.type)||1,1,15),phase=Number(entity.phase)||Number(entity.index)*.7||0;
 const span=ATTACK_SPAN[player?'player':row],age=time-entity.attackAt;
 const alive=entity.hp===undefined||entity.hp>0,frozen=(entity.frozen||0)>0;
 const attacking=alive&&!frozen&&Number.isFinite(entity.attackAt)&&age>=0&&age<span;
 const moving=alive&&!frozen&&!!entity.moving;
 const fps=player?10:row===3?14:row===2?7:row===4?6:9;
 const cycle=time*fps+phase,walkIndex=((Math.floor(cycle)%6)+6)%6;
 const column=!alive||frozen?0:attacking?(reducedMotion?10:8+Math.min(3,Math.floor(age/span*4))):moving||alive&&!frozen&&row===3?(reducedMotion?2:2+walkIndex):reducedMotion?0:((Math.floor(time*1.6+phase)%2)+2)%2;
 const breath=reducedMotion||!alive||frozen?0:row===2?Math.sin(time*3.6+phase)*1.7:row===3?Math.sin(time*9+phase)*2: moving?Math.abs(Math.sin(cycle*Math.PI/3))*.8:0;
 const angle=Number.isFinite(entity.attackAngle)?entity.attackAngle:entity.face===-1?Math.PI:0;
 const face=attacking&&Math.abs(Math.cos(angle))>.15?(Math.cos(angle)<0?-1:1):(entity.face===-1?-1:1);
 return{row,column,mode:!alive?'dead':frozen?'frozen':attacking?'attack':moving?'walk':'idle',offsetY:Math.round(breath),face,attackProgress:attacking?age/span:0,angle};
}
/** Guests keep poses moving between polls; prediction is capped at one poll interval. */
export class AnimationClock{
 constructor(){this.reset();}
 reset(){this.value=0;this.snapshot=-1;}
 update(time,dt,interpolate=false){
  if(!Number.isFinite(time))return this.value;
  if(this.snapshot<0||time<this.snapshot-.1){this.value=time;this.snapshot=time;return this.value;}
  this.snapshot=time;
  this.value=interpolate?clamp(Math.max(time,this.value+clamp(dt,0,.05)),time,time+.16):time;
  return this.value;
 }
}
