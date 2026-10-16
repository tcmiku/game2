import test from 'node:test';
import assert from 'node:assert/strict';
import { World, makePlayer } from '../lib/game.mjs';
import { UPGRADES, RECIPES, forgeState, rollChoices, orbitBlades } from '../lib/equipment.mjs';
const make=()=>new World([{id:'p'}],()=>.4);
function ready(world, key){const p=world.s.players[0],r=RECIPES.find(r=>r.key===key);p.ranks[r.weapon]=5;p.ranks[r.item]=1;p.relics=1;if(r.holdSeconds)p.lightBond=r.holdSeconds+.05;p.count=5;p.orbit=5;p.nova=5;p.storm=5;return p;}
function enemy(id,x,y,hp=10000){return{id,x,y,hp,maxHp:hp,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0};}
test('all three recipe requirements are mandatory',()=>{
 for(const recipe of RECIPES.filter(r=>r.item)){
  const w=make(),p=ready(w,recipe.key);
  for(const missing of ['weapon','item','chest']){
   const ranks={...p.ranks};const relics=p.relics;
   if(missing==='weapon')p.ranks[recipe.weapon]=(recipe.weaponLevel||5)-1;if(missing==='item')p.ranks[recipe.item]=0;if(missing==='chest')p.relics=0;
   assert.equal(w.craft('p',recipe.key),false,recipe.key+missing);assert.deepEqual(p.evolutions,{});
   p.ranks=ranks;p.relics=relics;
  }
  assert.equal(forgeState(p,recipe.key).ready,true);
 }
});
test('each artifact consumes one chest, preserves the passive, and cannot be crafted twice',()=>{
 for(const recipe of RECIPES.filter(r=>r.item)){const w=make(),p=ready(w,recipe.key);p.relics=2;
  assert.equal(w.craft('p',recipe.key),true);assert.equal(p.relics,1);assert.equal(p.ranks[recipe.item],1);assert.equal(p.evolutions[recipe.weapon],recipe.key);
  assert.equal(w.craft('p',recipe.key),false);assert.equal(p.relics,1);assert.equal(forgeState(p,recipe.key).complete,true);
 }
});
test('dead players, ended games, and pending level-up choices cannot craft',()=>{
 const w=make(),p=ready(w,'eclipse');p.hp=0;assert.equal(w.craft('p','eclipse'),false);p.hp=100;p.choices=['speed'];assert.equal(w.craft('p','eclipse'),false);p.choices=[];w.s.status='over';assert.equal(w.craft('p','eclipse'),false);
});
test('crafting through multiplayer inputs is validated and idempotent per player',()=>{
 const w=new World([{id:'p'},{id:'q'}],()=>.4),p=ready(w,'eclipse'),q=w.s.players[1];p.relics=2;
 w.input('q',{choice:'eclipse',seq:1});assert.deepEqual(q.evolutions,{});
 w.input('p',{choice:'eclipse',seq:1});w.input('p',{choice:'eclipse',seq:1});assert.equal(p.relics,1);assert.equal(p.evolutions.blade,'eclipse');assert.deepEqual(q.evolutions,{});
 const snapshot=JSON.parse(JSON.stringify(w.s));assert.equal(snapshot.players[0].evolutions.blade,'eclipse');assert.equal(snapshot.players[0].relics,1);
});
test('weapon and passive caps remove choices and completed builds offer healing',()=>{
 const w=make(),p=w.s.players[0];
 for(const[key,def]of Object.entries(UPGRADES)){p.ranks[key]=def.max;}
 assert.deepEqual(rollChoices(p,()=>0),['mend']);p.hp=40;p.choices=['mend'];w.upgrade('p','mend');assert.equal(p.hp,97);
 p.ranks.blade=4;assert.deepEqual(rollChoices(p,()=>0),['blade']);p.choices=['blade'];w.upgrade('p','blade');assert.equal(p.ranks.blade,5);p.choices=['blade'];assert.equal(w.upgrade('p','blade'),false);
});
test('evolved weapons never reappear in the upgrade pool',()=>{
 const p=makePlayer('p');p.evolutions.blade='eclipse';p.ranks.blade=3;
 for(let i=0;i<20;i++)assert.ok(!rollChoices(p).includes('blade'));
 assert.equal(new Set(rollChoices(makePlayer('p'),()=>0)).size,3);
});
test('a successful elite chest roll is shared and collected only once',()=>{
 const w=new World([{id:'p'},{id:'q'}],()=>.05),p=w.s.players[0];p.nextXp=w.s.players[1].nextXp=1e6;const e={...enemy(200,p.x,p.y),type:5,hp:1};w.s.enemies.push(e);
 w.damage(e,2,p);assert.equal(w.s.chests.length,1);w.damage(e,2,p);assert.equal(w.s.chests.length,1);
 w.step(.01);assert.equal(w.s.chests.length,0);assert.ok(w.s.players.every(p=>p.relics===1));w.step(.01);assert.ok(w.s.players.every(p=>p.relics===1));
});
test('the first elite appears at sixty seconds',()=>{
 const w=make();w.s.time=59.95;w.step(.05);assert.ok(w.s.enemies.some(e=>e.type===5));assert.equal(w.eliteAt,105);
});
test('eclipse shoots stronger homing blades with five-hit penetration',()=>{
 const w=make(),p=ready(w,'eclipse');w.craft('p','eclipse');p.orbit=p.nova=p.storm=0;w.s.enemies.push(enemy(300,p.x+200,p.y));w.step(.01);
 const shot=w.s.shots[0];assert.ok(shot);assert.equal(shot.homing,true);assert.equal(shot.pierce,5);assert.equal(shot.damage,p.damage*1.8);assert.equal(shot.sprite,8);
});
test('starfall has two counter-rotating orbits and attracts distant crystals',()=>{
 const w=make(),p=ready(w,'starfall');w.craft('p','starfall');p.nova=p.storm=0;p.magnet=90;const blades=orbitBlades(p,1);assert.equal(blades.length,10);assert.ok(blades.some(b=>Math.abs(Math.hypot(b.x-p.x,b.y-p.y)-145)<.01));
 w.s.gems.push({id:400,x:p.x+300,y:p.y,v:1,type:'gem'});w.step(.01);assert.equal(w.s.gems[0].pulled,'p');assert.ok(w.s.gems[0].x<p.x+300);
});
test('winter freezes distant enemies and heals without exceeding maximum health',()=>{
 const w=make(),p=ready(w,'winter');w.craft('p','winter');p.hp=90;p.orbit=p.storm=0;w.s.enemies.push(enemy(500,p.x+280,p.y));w.step(.01);
 assert.equal(p.hp,96);assert.ok(w.s.enemies[0].frozen>1);assert.ok(w.s.effects.some(e=>e.type==='winter'));
 p.hp=99;p.novaCd=0;w.step(.01);assert.equal(p.hp,100);
});
test('tempest chains to eight unique enemies and creates area bursts',()=>{
 const w=make(),p=ready(w,'tempest');w.craft('p','tempest');
 for(let i=0;i<9;i++)w.s.enemies.push(enemy(600+i,p.x+100+i*50,p.y));
 w.lightning(p);assert.equal(w.s.effects.filter(e=>e.type==='tempest').length,8);assert.equal(w.s.effects.filter(e=>e.type==='thunder').length,8);assert.ok(w.s.enemies[8].hp<10000);
});
test('a complete evolved build remains bounded through a full run',()=>{
 const w=make(),p=w.s.players[0];p.hp=p.maxHp=100000;p.damage=120;p.count=p.orbit=p.nova=p.storm=5;p.magnet=900;
 for(const r of RECIPES.filter(r=>r.item)){p.ranks[r.weapon]=5;p.ranks[r.item]=1;if(r.holdSeconds)p.lightBond=r.holdSeconds+.05;p.relics++;assert.ok(w.craft('p',r.key));}
 for(let i=0;i<362*60;i++){p.choices=[];w.step(1/60);}
 assert.ok(w.s.enemies.length<230);assert.ok(w.s.shots.length<100);assert.ok(w.s.effects.length<150);assert.ok(Number.isFinite(p.x));assert.ok(w.s.kills>100);
});
