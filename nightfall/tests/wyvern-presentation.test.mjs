import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {drawDragonCompanion,drawDragonLightField} from '../lib/dragon-light.mjs';
import {WYVERN_ART,wyvernPose} from '../lib/wyvern-presentation.mjs';

function scene(){
 const w=new World([{id:'p',weapon:'drogon'}],()=>.4,[]),p=w.s.players[0];
 p.ranks.drogon=p.ranks.ember=3;p.relics=1;p.hp=p.maxHp=1e6;w.craft('p','wyvern');w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 w.s.enemies=[{id:900,x:p.x+220,y:p.y,type:1,hp:1e8,maxHp:1e8,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0}];
 return{w,p};
}
function renderer(reduced=false){
 const calls=[],stack=[],ctx=new Proxy({globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();}}, {get:(o,k)=>o[k]??((...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),`${String(k)} must use finite coordinates`);calls.push([k,...args]);})});
 return{ctx,calls,feedback:{reducedMotion:reduced},weaponFX:{opacity:()=>.52},wyvernAtlas:{complete:true,naturalWidth:1536},dragonLightAtlas:{complete:true,naturalWidth:768}};
}

test('flight, breath, grab and return have native poses that face the real attack direction',()=>{
 const png=readFileSync(new URL('../public/art/pixel-wyvern.png',import.meta.url));assert.equal(png.readUInt32BE(16),WYVERN_ART.cell*8);assert.equal(png.readUInt32BE(20),WYVERN_ART.cell*4);
 const p={x:900,y:900},d={id:1,x:1000,y:900,phase:'orbit',angle:0};
 assert.equal(new Set(Array.from({length:8},(_,i)=>wyvernPose(d,p,i/11).column)).size,8);
 assert.equal(wyvernPose({...d,breathUntil:2.65},p,2.3).mode,'breath');
 assert.equal(wyvernPose({...d,phase:'charge',chargeAt:2,chargeSpan:.5},p,2.3).mode,'dive');
 assert.equal(wyvernPose({...d,phase:'return',returnAt:2},p,2.3).mode,'return');
 for(const angle of [0,.8,Math.PI/2,Math.PI,Math.PI*1.5]){
  const pose=wyvernPose({...d,phase:'charge',angle},p,3),x=Math.cos(pose.pitch)*pose.face,y=Math.sin(pose.pitch)*pose.face;
  assert.ok(Math.abs(Math.atan2(Math.sin(Math.atan2(y,x)-angle),Math.cos(Math.atan2(y,x)-angle)))<1e-8,'vertical and rear attacks must not aim a sideways sprite');
 }
 assert.equal(wyvernPose({...d,phase:'return'},p,3).face,-1,'the returning dragon looks toward its owner');
});

test('reduced motion holds the wings, tail and body steady while still showing attack states',()=>{
 const p={x:900,y:900},d={id:5,x:1000,y:900,phase:'orbit',angle:.5};
 assert.deepEqual(wyvernPose(d,p,1,true),wyvernPose(d,p,8,true));
 assert.equal(wyvernPose({...d,phase:'charge'},p,8,true).column,4);
 assert.equal(wyvernPose({...d,breathUntil:8.65},p,8.3,true).column,3);
 const {w,p:player}=scene();w.step(.05);const r=renderer();drawDragonCompanion(r,player,w.s.time);const a=structuredClone(r.calls);r.calls.length=0;drawDragonCompanion(r,player,w.s.time);assert.deepEqual(r.calls,a,'a paused visual clock repeats the same pose');
});

test('charge timing survives checkpoints without changing collision, flame or cooldown rules',()=>{
 const {w,p}=scene();let started=false;
 for(let i=0;i<80;i++){w.step(.05);if(p.dragon.phase==='charge'){started=true;break;}}
 assert.ok(started);assert.ok(p.dragon.chargeSpan>=.2&&p.dragon.chargeSpan<=.8);assert.ok(p.dragon.chargeAt<=w.s.time);
 const restored=World.restore(unpackSnapshot(packSnapshot(w.checkpoint(),{authoritative:true}))),q=restored.s.players[0];assert.equal(q.dragon.chargeAt,p.dragon.chargeAt);assert.ok(Math.abs(q.dragon.chargeSpan-p.dragon.chargeSpan)<.001);
 const from=wyvernPose(p.dragon,p,w.s.time),to=wyvernPose(q.dragon,q,restored.s.time);assert.ok(Math.abs(to.pitch-from.pitch)<.001);assert.deepEqual({...to,pitch:0},{...from,pitch:0});
 const fire=w.s.zones.find(z=>z.kind==='dragonfire');assert.equal(fire.radius,340);assert.equal(fire.halfAngle,.38);assert.equal(fire.max,.65);
 const before=JSON.stringify(w.checkpoint()),r=renderer();for(let i=0;i<100;i++){drawDragonCompanion(r,p,w.s.time+i/60);for(const z of w.s.zones)drawDragonLightField(r,z,w.s.time+i/60);}
 assert.equal(JSON.stringify(w.checkpoint()),before,'visual frames never mutate combat or queue more attacks');
});

test('four wyverns render bounded native frames and plume geometry, including reduced motion',()=>{
 for(const reduced of [false,true]){
  const r=renderer(reduced),{w,p}=scene();w.step(.05);
  for(const phase of ['orbit','charge','return'])for(let i=0;i<4;i++){
   const player={...p,id:`p${i}`,dragon:{...p.dragon,phase,chargeAt:0,chargeSpan:.8,returnAt:0,angle:i*Math.PI/2}};
   drawDragonCompanion(r,player,.3);drawDragonLightField(r,{kind:'dragonfire',x:player.x,y:player.y,radius:340,halfAngle:.38,angle:i,life:.4,max:.65},.3);drawDragonLightField(r,{kind:'dragonclaw',x:player.x,y:player.y,life:.1,max:.22},.3);
  }
  for(const [_,atlas,x,y,width,height] of r.calls.filter(c=>c[0]==='drawImage')){
   assert.equal(atlas,r.wyvernAtlas);assert.equal(width,192);assert.equal(height,192);assert.ok(x>=0&&x+width<=1536);assert.ok(y>=0&&y+height<=768);
  }
  assert.equal(r.calls.filter(c=>c[0]==='clip').length,12,'every plume is clipped to its actual damage fan');assert.ok(r.calls.filter(c=>c[0]==='fillRect').length<2000,'draw work stays bounded, with no persistent particles');assert.equal(r.ctx.globalAlpha,1);
 }
});
