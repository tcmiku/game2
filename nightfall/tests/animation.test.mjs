import test from 'node:test';
import assert from 'node:assert/strict';
import { actorPose, AnimationClock, ATTACK_SPAN } from '../lib/animation.mjs';
import { World } from '../lib/game.mjs';
import { WEAPONS } from '../lib/equipment.mjs';
const enemy=(id,x,y,type=1)=>({id,x,y,type,hp:10000,maxHp:10000,size:type===4?50:20,speed:50,phase:.2,hit:0,slow:0,orbitCd:0});
test('all six actor types cycle through six walk poses and four finite attack poses',()=>{
 for(const player of [true,false])for(const type of player?[0]:[1,2,3,4,5]){
  const entity={type,hp:100,moving:true,phase:0,face:1},row=player?0:type,fps=player?10:type===3?14:type===2?7:type===4?6:9;
  const columns=Array.from({length:6},(_,i)=>actorPose(entity,(i+.1)/fps,{player}).column);assert.deepEqual([...new Set(columns)].sort(),[2,3,4,5,6,7]);
  entity.attackAt=2;entity.attackAngle=Math.PI;const span=ATTACK_SPAN[player?'player':type];
  for(const [i,progress]of [.1,.3,.55,.85].entries()){const pose=actorPose(entity,2+progress*span,{player});assert.equal(pose.row,row);assert.equal(pose.column,8+i);assert.equal(pose.mode,'attack');assert.equal(pose.face,-1);assert.ok(Number.isFinite(pose.offsetY));}
  assert.equal(actorPose(entity,3,{player}).mode,'walk');
 }
});
test('frozen and dead actors hold a static pose, while reduced motion retains attack readability',()=>{
 for(const type of [1,2,3,4,5]){
  const e={type,hp:100,moving:true,attackAt:1,attackAngle:0};const frozen=actorPose({...e,frozen:1},1.1);assert.equal(frozen.column,0);assert.equal(frozen.mode,'frozen');assert.equal(frozen.offsetY,0);
  const dead=actorPose({...e,hp:0},1.1);assert.equal(dead.column,0);assert.equal(dead.mode,'dead');assert.equal(dead.offsetY,0);
  const reduced=actorPose(e,1.1,{reducedMotion:true});assert.equal(reduced.column,10);assert.equal(reduced.offsetY,0);assert.equal(actorPose({...e,attackAt:undefined},5,{reducedMotion:true}).column,2);
 }
 assert.notEqual(actorPose({hp:100},-.1,{player:true}).mode,'attack');assert.equal(actorPose({hp:100,attackAt:20},2,{player:true}).mode,'idle');
});
test('network animation clock fills poll gaps, caps prediction and resets for a new run',()=>{
 const c=new AnimationClock();assert.equal(c.update(10,.016,true),10);const a=c.update(10,.04,true);assert.ok(a>10);for(let i=0;i<50;i++)c.update(10,.05,true);assert.equal(c.value,10.16);
 assert.equal(c.update(10.2,.016,true),10.2);assert.equal(c.update(0,.016,true),0);assert.equal(c.update(0,.05,false),0,'solo pause never advances animation');assert.equal(c.update(NaN,.05,true),0);
});
test('actual weapon casts stamp bounded animation state without changing damage or cooldowns',()=>{
 for(const key of WEAPONS.filter(k=>!['orbit','familiar','drogon'].includes(k))){
  const w=new World([{id:'p',weapon:key}],()=>.4),p=w.s.players[0];w.spawnCd=1e5;p.novaCd=p.stormCd=0;w.s.enemies=[enemy(900,p.x+110,p.y)];w.step(.01);
  assert.equal(p.attackKind,key,key);assert.equal(p.attackAt,w.s.time);assert.ok(Number.isFinite(p.attackAngle));assert.equal(actorPose(p,w.s.time,{player:true}).mode,'attack');
  const at=p.attackAt;w.castPose(p,'bow',w.s.enemies[0]);assert.equal(p.attackAt,at);assert.equal(p.attackKind,key,'simultaneous weapons cannot restart the pose each frame');
  const copy=JSON.parse(JSON.stringify(w.s)).players[0];assert.equal(copy.attackAt,p.attackAt);assert.equal(copy.attackKind,key);
 }
});
test('enemy anticipation and follow-through preserve contact damage and invulnerability timing',()=>{
 const w=new World([{id:'p'}],()=>.4),p=w.s.players[0];w.spawnCd=1e5;p.cooldown=999;const e=enemy(900,p.x+65,p.y);w.s.enemies=[e];w.step(.01);assert.ok(Number.isFinite(e.attackAt));assert.equal(p.hp,100,'distant anticipation is cosmetic');
 e.x=p.x+30;w.step(.01);assert.equal(p.hp,90);assert.equal(e.face,-1);assert.ok(Number.isFinite(e.attackAngle));assert.equal(actorPose(e,w.s.time).mode,'attack');
 e.x=p.x+30;w.step(.01);assert.equal(p.hp,90,'attack frames do not add repeated damage');assert.ok(p.hitCd>.6);
});
test('walking enemies advertise motion and frozen enemies stop animating',()=>{
 const w=new World([{id:'p'}],()=>.4),p=w.s.players[0];p.cooldown=999;w.spawnCd=1e5;const e=enemy(900,p.x-150,p.y);w.s.enemies=[e];w.step(.01);assert.equal(e.moving,true);assert.equal(e.face,1);
 e.frozen=1;w.step(.01);assert.equal(e.moving,false);assert.equal(actorPose(e,w.s.time).mode,'frozen');assert.equal(actorPose(e,w.s.time).offsetY,0);
});
