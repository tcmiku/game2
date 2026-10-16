import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {World,Renderer} from '../lib/game.mjs';
import {ENEMY_TYPES,pickEnemyType,stepBestiaryAttack} from '../lib/bestiary.mjs';
import {actorPose,ATTACK_SPAN,ACTOR_ROWS} from '../lib/animation.mjs';
function setup(type,range=250){const w=new World([{id:'p'}],()=>.42),p=w.s.players[0];w.spawnCd=w.eliteAt=1e9;p.ranks={};p.hp=p.maxHp=10000;const e=w.spawn(type,0);e.x=p.x+range;e.y=p.y;e.speed=0;e.skillCd=0;return{w,p,e};}
const advance=(w,n)=>{for(let i=0;i<n;i++){for(const p of w.s.players)p.choices=[];w.step(.05);}};
test('new archetypes unlock gradually, have distinct bodies, and summoners have a spawn quota',()=>{
 for(const [type,def]of Object.entries(ENEMY_TYPES)){
  assert.ok(Array.from({length:200},(_,i)=>pickEnemyType(def.from-1,()=>i/200)).every(k=>k!==Number(type)));
  assert.ok(Array.from({length:500},(_,i)=>pickEnemyType(def.from,()=>i/500)).includes(Number(type)));
  const {e}=setup(Number(type));assert.equal(e.size,def.size);assert.ok(e.maxHp>0);assert.equal(e.type,Number(type));
 }
 const crowded=Array.from({length:5},()=>({type:11,hp:100}));assert.ok(Array.from({length:500},(_,i)=>pickEnemyType(500,()=>i/500,crowded)).every(k=>k!==11));
});
test('hounds telegraph a fixed direction before dashing, and frozen hounds stop their lunge',()=>{
 const {w,p,e}=setup(8,300),x=e.x;w.step(.05);assert.equal(e.skill,'pounce');assert.equal(e.x,x);const angle=e.chargeAngle;p.y+=200;advance(w,9);assert.equal(e.x,x);advance(w,3);assert.ok(e.chargeLeft>0);assert.ok(e.x<x);assert.equal(e.chargeAngle,angle);
 e.frozen=1;const frozenX=e.x;w.step(.05);assert.equal(e.x,frozenX);
});
test('spore pools warn before ticking and a dead spore creates exactly one delayed pool',()=>{
 const {w,p,e}=setup(9,250);w.step(.05);assert.equal(w.s.hazards[0].kind,'spores');assert.equal(p.hp,10000);advance(w,14);assert.equal(p.hp,10000);advance(w,4);assert.equal(p.hp,9992);advance(w,5);assert.equal(p.hp,9992,'poison respects its tick interval');
 const n=w.s.hazards.length;w.damage(e,1e9,p,p,'spear');assert.equal(w.s.hazards.length,n+1);assert.ok(w.s.hazards.at(-1).wait>0);w.damage(e,1e9,p,p,'spear');assert.equal(w.s.hazards.length,n+1);
});
test('crossbow archers use aimed sequential bolts, rather than a simultaneous fan',()=>{
 const {w,p,e}=setup(10,320);e.skillCd=.4;w.step(.05);assert.equal(e.skill,'volley');const angle=e.burstAngle;p.y+=150;advance(w,7);assert.equal(w.s.hostile.length,0);advance(w,2);assert.equal(w.s.hostile.length,1);advance(w,10);assert.equal(w.s.hostile.length,3);assert.ok(w.s.hostile.every(b=>b.kind==='bolt'&&Math.abs(Math.atan2(b.vy,b.vx)-angle)<.00001));
});
test('bell priests summon living skeletons near themselves with owner and global caps',()=>{
 const {w,p,e}=setup(11,350);for(let i=0;i<5;i++){e.skill='summon';e.skillCd=0;stepBestiaryAttack(w,e,p,.05);}const minions=w.s.enemies.filter(n=>n.summoner===e.id);assert.equal(minions.length,6);assert.ok(minions.every(n=>n.type===1&&Math.hypot(n.x-e.x,n.y-e.y)<80));
 const crowded=setup(11);crowded.w.s.enemies.push(...Array.from({length:218},(_,i)=>({id:10000+i,type:1,hp:1})));crowded.e.skill='summon';stepBestiaryAttack(crowded.w,crowded.e,crowded.p,.05);assert.equal(crowded.w.s.enemies.length,220);assert.equal(crowded.w.spawn(1),undefined);
});
test('golem shockwaves are delayed, can be dodged, and heavy bodies resist recoil',()=>{
 const {w,p,e}=setup(12,110);w.step(.05);assert.equal(e.skill,'slam');assert.ok(w.s.hazards[0].wait>0);assert.equal(p.hp,10000);advance(w,14);assert.equal(p.hp,10000);advance(w,5);assert.equal(p.hp,9978);advance(w,5);assert.equal(p.hp,9978,'a shockwave only hits once');
 const dodge=setup(12,110);dodge.w.step(.05);dodge.p.y+=300;advance(dodge.w,22);assert.equal(dodge.p.hp,10000);
 w.damage(e,1,p);assert.ok(Math.hypot(e.knockX,e.knockY)<=180*.24);
});
test('all enemy types preserve twelve logical poses; the existing native atlas stays intact',async()=>{
 assert.equal(ACTOR_ROWS,20);const png=await readFile(new URL('../public/art/pixel-bestiary.png',import.meta.url));assert.equal(png.readUInt32BE(16),1152);assert.equal(png.readUInt32BE(20),480);
 const ui=await readFile(new URL('../public/art/pixel-ui.png',import.meta.url));assert.equal(ui.readUInt32BE(16),384);
 for(const key of Object.keys(ENEMY_TYPES)){const type=Number(key),span=ATTACK_SPAN[type],e={type,hp:100,moving:true,attackAt:2,attackAngle:0};
  for(const [i,q]of [.1,.3,.55,.85].entries()){const a=actorPose(e,2+q*span);assert.equal(a.row,type);assert.equal(a.column,8+i);assert.equal(actorPose(e,2+q*span,{reducedMotion:true}).column,10);}
  assert.equal(actorPose({...e,frozen:1},2.1).mode,'frozen');assert.equal(actorPose({...e,hp:0},2.1).mode,'dead');
 }
});
test('new enemies, elites, hazards and attack timestamps serialize for four players',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:String(i)})),()=>.42);w.spawnCd=1e9;for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=100000;}
 for(const type of Object.keys(ENEMY_TYPES).map(Number)){const e=w.spawn(type,2);e.x=1250;e.y=800;e.speed=0;e.skillCd=0;}
 advance(w,30);const state=JSON.parse(JSON.stringify(w.s));for(const type of Object.keys(ENEMY_TYPES).map(Number)){const e=state.enemies.find(e=>e.type===type);assert.ok(e);assert.equal(e.elite,2);assert.ok(Number.isFinite(e.attackAt));}
 assert.ok(state.hostile.some(b=>b.kind==='bolt'));assert.ok(state.hazards.some(h=>h.kind==='spores'));assert.ok(state.enemies.some(e=>e.summoner));assert.ok(state.hostile.length<=160&&state.hazards.length<=48&&state.enemies.length<=220);
});
test('all new enemy poses, warnings, bullets and hazards draw finite Canvas calls',()=>{
 const context=()=>new Proxy({getImageData(){return{data:new Uint8ClampedArray(4)};},ellipse(...a){assert.ok(a.length>=7&&a.every(Number.isFinite)&&a[2]>=0&&a[3]>=0);},arc(...a){assert.ok(a.every(Number.isFinite)&&a[2]>=0);},createRadialGradient(){return{addColorStop(){}};}},{get:(o,k)=>o[k]??(()=>{})});
 const canvas=()=>({width:1280,height:720,getBoundingClientRect:()=>({width:1280,height:720}),getContext:context});globalThis.window={matchMedia:()=>({matches:false})};globalThis.document={createElement:canvas};globalThis.devicePixelRatio=1;globalThis.Image=class{complete=true;naturalWidth=1152;width=1152;height=1248;};
 const r=new Renderer(canvas()),w=new World();w.spawnCd=1e9;const p=w.s.players[0];p.ranks={};p.hp=p.maxHp=1e8;
 for(const type of Object.keys(ENEMY_TYPES).map(Number)){const e=w.spawn(type,3);e.x=p.x+110+(type-8)*40;e.y=p.y+30;e.skillCd=0;e.speed=0;}
 for(let i=0;i<160;i++){p.choices=[];w.step(.05);assert.doesNotThrow(()=>r.render(w.s,'solo',.05));}
 assert.ok(r.eliteMasks.has('bestiary3'));
});
