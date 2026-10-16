import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {World,Renderer} from '../lib/game.mjs';
import {stepHostiles} from '../lib/encounters.mjs';
import {stepBestiaryAttack} from '../lib/bestiary.mjs';
import {DUSK_TYPES,EMBER_CHARGE,touchesSweep} from '../lib/dusk-foes.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';

function scene(type,range=100){
 const w=new World([{id:'p'}],()=>.42),p=w.s.players[0];
 w.s.props=[];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 p.ranks={};p.count=p.orbit=p.nova=p.storm=0;p.hp=p.maxHp=10000;p.nextXp=1e9;
 const e=w.spawn(type,0);e.x=p.x+range;e.y=p.y;e.skillCd=0;e.speed=0;
 return{w,p,e};
}
const advance=(w,n)=>{for(let i=0;i<n;i++)w.step(.05);};
test('moss shields block front damage, expose their back, and open during attacks and freeze',()=>{
 for(const [mode,expected] of [['front',10],['back',20],['cast',20],['frozen',20],['recover',20]]){
  const {w,p,e}=scene(16);e.guardAngle=Math.PI;
  if(mode==='back')p.x=e.x+100;if(mode==='cast')e.skill='guardBash';if(mode==='frozen')e.frozen=1;if(mode==='recover')e.guardOpenUntil=1;
  const before=e.hp;w.damage(e,20,p,p,'spear');assert.equal(before-e.hp,expected);assert.equal(p.stats.spear.damage,expected);
 }
});
test('guard and reaper sweeps warn, lock their direction, hit once, and leave a safe back',()=>{
 for(const type of [16,17]){
  const {w,p,e}=scene(type,90);w.step(.05);const a=e.castAngle;
  assert.ok(e.skill&&e.windup>0);assert.equal(w.s.hazards.length,0);assert.equal(p.hp,10000);
  advance(w,10);assert.equal(p.hp,10000);
  advance(w,12);assert.ok(p.hp<10000);assert.equal(e.castAngle,a);
  const hp=p.hp;advance(w,4);assert.equal(p.hp,hp);
  const dodge=scene(type,90);dodge.w.step(.05);dodge.p.x=dodge.e.x+90;advance(dodge.w,24);assert.equal(dodge.p.hp,10000);
 }
 const h={x:0,y:0,angle:0,halfAngle:.7,radius:100};
 assert.ok(touchesSweep(h,{x:90,y:0}));assert.ok(!touchesSweep(h,{x:-90,y:0}));assert.ok(!touchesSweep(h,{x:120,y:0}));
 assert.ok(touchesSweep(h,{x:Math.cos(.7)*90-5,y:Math.sin(.7)*90+5}),'player body may overlap a sector edge');
});
test('freezing interrupts a pending sweep until thawed',()=>{
 const {w,p,e}=scene(17,100);w.step(.05);const left=e.windup;e.frozen=2;
 advance(w,25);assert.equal(p.hp,10000);assert.equal(e.windup,left);assert.equal(w.s.hazards.length,0);
 advance(w,40);assert.ok(p.hp<10000);
});
test('emberhorn locks its charge lane, respects freeze, and never tracks a dodge',()=>{
 const {w,p,e}=scene(18,220),start=e.x;w.step(.05);const angle=e.chargeAngle;
 p.y+=200;advance(w,14);assert.equal(e.x,start);advance(w,4);assert.ok(e.x<start);assert.equal(e.chargeAngle,angle);
 const y=e.y;e.frozen=1;const x=e.x;w.step(.05);assert.equal(e.x,x);assert.equal(e.y,y);
 advance(w,38);assert.equal(p.hp,10000);assert.equal(e.y,y);assert.ok(start-e.x<=EMBER_CHARGE.speed*(EMBER_CHARGE.duration+.05));
});
test('bonewings warn, reverse their fixed lane once, and can be countered on either leg',()=>{
 const {w,p,e}=scene(19,350);w.step(.05);assert.equal(e.skill,'bonecast');assert.equal(w.s.hostile.length,0);
 p.y+=180;advance(w,16);assert.equal(w.s.hostile.length,1);const b=w.s.hostile[0],vx=b.vx;
 advance(w,25);assert.equal(b.returned,true);assert.equal(b.vx,-vx);assert.ok(Math.abs(b.vy)<1e-10);
 const reachable=scene(19,350);advance(reachable.w,44);assert.equal(reachable.p.hp,9988,'bonewing reaches the distance maintained by the raven');
 for(const returning of [false,true]){
  const {w,p}=scene(19);w.s.enemies=[];
  w.s.hostile=[{id:100,sourceType:19,kind:'bonewing',cancellable:true,x:p.x+80,y:p.y,vx:-260,vy:0,radius:11,life:1,turnIn:1,returned:returning,damage:12}];
  w.guard(p,'spear',{x:p.x+70,y:p.y,radius:20});stepHostiles(w,.05);
  assert.equal(w.s.hostile.length,0);assert.equal(p.blockedShots,1);assert.equal(p.hp,10000);
 }
});
test('new attacks stay bounded and survive authoritative deltas and host takeover',()=>{
 const {w,p}=scene(16);for(const type of [17,18,19]){const e=w.spawn(type,2);e.x=p.x+100;e.y=p.y;e.speed=0;e.skillCd=0;}
 w.step(.05);const base=packSnapshot(w.checkpoint(),{authoritative:true});advance(w,18);
 const next=packSnapshot(w.checkpoint(),{authoritative:true}),delta=snapshotDelta(base,next,7);
 assert.deepEqual(applySnapshotDelta(base,delta,7),next);
 const restored=World.restore(unpackSnapshot(next),()=>.42);advance(w,5);advance(restored,5);
 for(const e of w.s.enemies){const copy=restored.s.enemies.find(n=>n.id===e.id);assert.ok(Math.abs(copy.x-e.x)<.02);assert.equal(copy.skill,e.skill);}
 assert.deepEqual(restored.s.hostile.map(b=>b.returned),w.s.hostile.map(b=>b.returned));
 const crowded=scene(19);crowded.w.s.hostile=Array.from({length:160},()=>({}));crowded.e.skill='bonecast';crowded.e.windup=0;stepBestiaryAttack(crowded.w,crowded.e,crowded.p,.05);assert.equal(crowded.w.s.hostile.length,160);
});
test('new native atlas has four rows and every pose uses a valid source cell, including elite masks',async()=>{
 const png=await readFile(new URL('../public/art/pixel-dusk-foes.png',import.meta.url));assert.equal(png.readUInt32BE(16),1152);assert.equal(png.readUInt32BE(20),384);
 const draws=[];const context=()=>new Proxy({drawImage(source,...args){assert.ok(args.every(Number.isFinite));draws.push([source,...args]);},createRadialGradient(){return{addColorStop(){}};}},{get:(o,k)=>o[k]??(()=>{})});
 const canvas=()=>({width:1280,height:720,getBoundingClientRect:()=>({width:1280,height:720}),getContext:context});
 globalThis.window={matchMedia:()=>({matches:false})};globalThis.document={createElement:canvas};globalThis.Image=class{complete=true;naturalWidth=1152;width=1152;height=384;};
 const r=new Renderer(canvas());
 for(const [key,def]of Object.entries(DUSK_TYPES))for(const reducedMotion of [false,true])for(let f=0;f<12;f++){
  const type=Number(key);r.actor({type,hp:100,moving:f>=2,attackAt:f>=8?2:undefined,elite:2},200,200,def.height,f>=8?2+(f-7.5)*.1:f/9,{reducedMotion});
  const cell=draws.findLast(call=>call[0]===r.duskAtlas);assert.ok(cell);assert.equal(cell[2],(type-16)*96);assert.ok(cell[1]>=0&&cell[1]<=1056);
 }
 assert.ok(r.eliteMasks.has('dusk2'));
});
