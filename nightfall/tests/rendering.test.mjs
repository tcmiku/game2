import test from 'node:test';
import assert from 'node:assert/strict';
import {World,Renderer} from '../lib/game.mjs';
import {BOSS_ORDER} from '../lib/bosses.mjs';
import {CampRenderer} from '../lib/camp-renderer.mjs';
import {createCamp,newProfile} from '../lib/camp.mjs';
import {WEAPONS,RECIPES} from '../lib/equipment.mjs';
import {startFrameLoop} from '../lib/frame-loop.mjs';
// Enforce the Canvas API contract rather than accepting invalid calls as no-ops.
function context(){return new Proxy({
 drawImage(source,...coordinates){assert.ok(source);assert.ok(coordinates.every(Number.isFinite),'drawImage requires finite source and destination coordinates');},
 getImageData(){return{data:new Uint8ClampedArray([40,75,75,255])};},
 measureText(text){return{width:text.length*7};},
 ellipse(...a){assert.ok(a.length>=7,'Canvas ellipse requires seven arguments');assert.ok(a.every(Number.isFinite));assert.ok(a[2]>=0&&a[3]>=0);},
 arc(...a){assert.ok(a.length>=5);assert.ok(a.every(Number.isFinite));assert.ok(a[2]>=0);},
 createRadialGradient(...a){assert.ok(a.every(Number.isFinite));return{addColorStop(){}};},
}, {get:(o,k)=>o[k]??(()=>{})});}
function canvas(){return{width:1280,height:720,getBoundingClientRect:()=>({width:1280,height:720}),getContext:()=>context()};}
function setup(){globalThis.window={matchMedia:()=>({matches:false})};globalThis.devicePixelRatio=1;globalThis.document={createElement:canvas};globalThis.Image=class{complete=true;naturalWidth=384;width=384;height=192;};return new Renderer(canvas());}

test('custom clothes and hair render in camp, combat, death and takeover with a bounded atlas cache',()=>{
 const r=setup(),w=new World([{id:'solo',appearance:{outfit:'sakura',hairstyle:'braid',hairColor:'rose'}}],()=>.4,[]),p=w.s.players[0],cr=new CampRenderer(r),camp=createCamp();
 const look=p.appearance,strip=r.playerAtlas(0,look);assert.notEqual(strip,r.actors);assert.equal(strip,r.playerAtlas(0,{...look}));
 r.actor(p,p.x,p.y,86,0,{player:true,flash:1});const mask=r.playerFlashAtlas(strip);assert.equal(mask.width,strip.width);assert.equal(mask.height,96);assert.equal(mask,r.playerFlashAtlas(strip));
 for(const [width,height] of [[1280,720],[390,844]]){r.canvas.getBoundingClientRect=()=>({width,height});for(let i=0;i<40;i++){p.moving=i<20;p.attackAt=i>=20?w.s.time:undefined;w.step(.05);assert.doesNotThrow(()=>r.render(w.s,'solo',.05));assert.doesNotThrow(()=>cr.render(camp,.05,{...newProfile(),appearance:look}));}}
 p.hp=0;assert.doesNotThrow(()=>r.render(w.s,'solo',.05));
 for(const outfit of ['wanderer','nightcoat','knight','ranger','mage','crimson','frost','sakura'])for(const hairstyle of ['hood','short','ponytail','long','braid','bob'])r.playerAtlas(0,{outfit,hairstyle,hairColor:'ink'});
 assert.ok(r.appearanceAtlases.size<=32);
});

test('dual blades renders rotating actor, moving light trails and both sword attacks at desktop and mobile sizes',()=>{
 for(const reduced of [false,true])for(const [width,height] of [[1280,720],[390,844]]){
  const r=setup(),w=new World([{id:'solo',weapon:'elucidator'}],()=>.4,[]),p=w.s.players[0];r.canvas.getBoundingClientRect=()=>({width,height});r.feedback.reducedMotion=r.weaponFX.reducedMotion=reduced;
  p.ranks.elucidator=p.ranks.darkrepulser=3;p.relics=1;w.craft('solo','dualblades');p.hp=p.maxHp=1e6;p.nextXp=1e9;
  w.s.enemies=[{id:900,x:p.x+120,y:p.y,type:1,hp:1e8,maxHp:1e8,speed:0,size:20,hit:0,slow:0,orbitCd:0,phase:0}];
  w.input('solo',{x:1,y:0,skillSeq:1});for(let i=0;i<90;i++){w.step(.05);assert.doesNotThrow(()=>r.render(w.s,'solo',.05));}
 }
});
test('defeating an elite leaves a drawable chest and the next frames keep rendering',()=>{
 const r=setup(),w=new World(undefined,()=>.05),p=w.s.players[0];w.spawn(5);w.damage(w.s.enemies[0],1e6,p);assert.equal(w.s.chests.length,1);
 for(let i=0;i<120;i++){p.hp=p.maxHp;p.choices=[];w.step(.05);assert.doesNotThrow(()=>r.render(w.s,p.id,.05));}
});
test('all weapons and artifacts draw finite Canvas geometry through repeated attacks',()=>{
 const r=setup();
 for(const key of [...WEAPONS,...RECIPES.map(r=>r.key)]){
  const recipe=RECIPES.find(r=>r.key===key),weapon=recipe?.weapon||key,w=new World([{id:'p',weapon}],()=>.4),p=w.s.players[0];p.ranks[weapon]=5;
  if(recipe)p.evolutions[weapon]=key;
  w.spawnCd=1e5;w.s.enemies=[{id:900,x:p.x+120,y:p.y,type:4,hp:1e8,maxHp:1e8,speed:0,size:50,hit:0,slow:0,orbitCd:0,phase:0}];
  for(let i=0;i<200;i++){p.hp=p.maxHp;p.choices=[];w.step(.05);assert.doesNotThrow(()=>r.render(w.s,'p',.05),key);}
 }
});
test('every boss and added enemy draws all attack phases at normal and reduced motion',()=>{
 const r=setup();for(const reduced of [false,true])for(const kind of BOSS_ORDER){r.feedback.reducedMotion=reduced;const w=new World(undefined,()=>.5),p=w.s.players[0];p.ranks={};p.hp=p.maxHp=1e8;w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];const boss=w.spawn(4);boss.bossKind=kind;boss.x=p.x+320;boss.y=p.y;boss.speed=0;boss.skillCd=0;for(const type of [13,14,15]){const e=w.spawn(type,2);e.x=p.x+200;e.y=p.y+150;e.skillCd=0;}
 for(let i=0;i<300;i++){w.step(.05);assert.doesNotThrow(()=>r.render(w.s,p.id,.05),kind);}}
});
test('camp and sakura courtyard render at normal and reduced motion, including newly awakened shrines',()=>{
 const r=setup(),cr=new CampRenderer(r),camp=createCamp(),profile=newProfile();
 for(const reduced of [false,true]){cr.reduced=reduced;for(const y of [608,-250]){camp.y=y;profile.shrines={foundation:1,might:0,vigor:0,stride:0,cadence:0};for(let i=0;i<80;i++){camp.time+=.05;if(i===40)profile.shrines={foundation:2,might:1,vigor:1,stride:1,cadence:1};assert.doesNotThrow(()=>cr.render(camp,.05,profile));}}}
});
test('each shrine ritual keeps its live statue visible and draws valid charge and response geometry',()=>{
 const r=setup(),cr=new CampRenderer(r),camp=createCamp(),profile=newProfile();camp.y=-250;
 for(const [width,height] of [[1280,720],[368,584]]){
  r.canvas.getBoundingClientRect=()=>({width,height});
  for(const reduced of [false,true])for(const id of ['foundation','might','vigor','stride','cadence']){
   cr.reduced=reduced;let anchors;
   for(let i=0;i<80;i++){camp.time+=.05;assert.doesNotThrow(()=>{anchors=cr.render(camp,.05,profile,{id,phase:i<60?'channeling':'receiving',progress:Math.min(1,i/60)});});}
   const statue=anchors.shrines.find(s=>s.id===id);assert.ok(statue.x>width*.15&&statue.x<width*.55,'statue stays beside or above the ledger');assert.ok(statue.y>100&&statue.y<height*.7,'statue stays in the visible scene');
  }
 }
});
test('elite silhouettes, ranged orbs, boss warnings and death use valid Canvas calls',()=>{
 const r=setup(),w=new World();
 for(const [type,tier]of [[1,1],[2,2],[3,3],[6,2],[7,0]])w.spawn(type,tier);
 const boss=w.spawn(4);boss.skill='charge';boss.chargeAngle=.4;
 w.s.hazards=[{kind:'roots',x:1200,y:800,radius:95,wait:.5}];
 w.s.hostile=[{kind:'orb',x:1200,y:800,vx:100,vy:0,radius:11},{kind:'thorn',x:1300,y:820,vx:0,vy:100,radius:12}];
 for(let i=0;i<30;i++)assert.doesNotThrow(()=>r.render(w.s,'solo',.05));
});
test('four network player palettes render and are cached across repeated frames',()=>{
 const r=setup(),w=new World(Array.from({length:4},(_,i)=>({id:String(i),name:'同名旅人'})));
 for(let i=0;i<30;i++)assert.doesNotThrow(()=>r.render(w.s,'2',1/60,false,true));
 assert.equal(r.playerAtlases.size,3);const atlas=r.playerAtlas(2);assert.equal(r.playerAtlas(2),atlas);
 w.s.players[1].hp=0;assert.doesNotThrow(()=>r.render(w.s,'2',1/60,false,true));
});
test('a transient frame error cannot cancel later frames and unmount cancels the pending frame',()=>{
 let pending,called=0,cancelled=0,reported=0;
 const stop=startFrameLoop(()=>{called++;if(called===1)throw new Error('one failed drawing');},{request:fn=>(pending=fn,called+1),cancel:()=>cancelled++,report:()=>reported++});
 pending(100);assert.equal(reported,1);pending(116);assert.equal(called,2);stop();assert.equal(cancelled,1);pending(132);assert.equal(called,2);
});

test('render position cache releases despawned enemies throughout a long multiplayer run',()=>{
 const r=setup(),w=new World([{id:'a'},{id:'b'}]);w.s.props=[];
 for(let i=0;i<300;i++){
  w.s.enemies=[{id:10000+i,x:1300,y:800,type:1,hp:100,size:20,phase:0}];
  r.render(w.s,'a',.02,false,true);
  assert.equal(r.positions.size,3,'cache is bounded by current actors, not total kills');
 }
 w.s.enemies=[];r.render(w.s,'a',.02,false,true);assert.equal(r.positions.size,2);
});
