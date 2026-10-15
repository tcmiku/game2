import test from 'node:test';
import assert from 'node:assert/strict';
import { World, makePlayer } from '../lib/game.mjs';
import { WEAPONS, UPGRADES, RECIPES, forgeState, rollChoices, canUpgrade, weaponLoadout } from '../lib/equipment.mjs';
const enemy=(id,x,y,hp=10000)=>({id,x,y,hp,maxHp:hp,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
function world(key='blade'){const w=new World([{id:'p',weapon:key}],()=>.4);w.spawnCd=1e5;const p=w.s.players[0];w.s.enemies=[enemy(900,p.x+160,p.y)];return w;}
function equip(p,key,rank=3){p.ranks[key]=rank;if(key==='blade')p.count=rank;if(['orbit','nova','storm'].includes(key))p[key]=rank;}
function ready(w,r){const p=w.s.players[0];for(const part of r.weapons)equip(p,part.key,part.level);p.relics=2;return p;}
test('all twenty-nine starter weapons are selectable and do not silently equip a blade',()=>{
 assert.equal(WEAPONS.length,29);
 for(const key of WEAPONS){const w=world(key),p=w.s.players[0];assert.deepEqual(weaponLoadout(p),[key]);w.step(.05);assert.equal(w.s.shots.some(b=>b.weapon==='blade'),key==='blade');}
 assert.deepEqual(weaponLoadout(makePlayer('x','x',0,'invalid')),['blade']);
});
test('early levels offer three acquisitions; six weapon slots reject a seventh but keep reinforcement',()=>{
 const p=makePlayer('p');p.level=2;const choices=rollChoices(p,()=>0);assert.equal(choices.length,3);assert.ok(choices.every(k=>UPGRADES[k].kind==='weapon'&&!p.ranks[k]));
 for(const key of WEAPONS.slice(1,6))equip(p,key,1);
 assert.equal(weaponLoadout(p).length,6);assert.equal(canUpgrade(p,'axe'),false);assert.equal(canUpgrade(p,'blade'),true);
 for(let i=0;i<50;i++)assert.ok(rollChoices(p).every(k=>UPGRADES[k].kind==='item'||p.ranks[k]));
 const w=world(),a=w.s.players[0];a.ranks={...p.ranks};a.choices=['axe'];assert.equal(w.upgrade('p','axe'),false);
});
test('simultaneously owned weapons cast independently with distinct trajectories and timing',()=>{
 const w=world('spear'),p=w.s.players[0];for(const key of ['ember','axe','bow','sigil','prism'])equip(p,key,2);
 w.step(.05);
 assert.ok(w.s.shots.some(b=>b.weapon==='spear'&&b.pierce===4&&Math.hypot(b.vx,b.vy)===850));
 assert.ok(w.s.shots.some(b=>b.kind==='flask'));assert.ok(w.s.shots.some(b=>b.kind==='return'));
 assert.equal(w.s.shots.filter(b=>b.weapon==='bow').length,3);assert.ok(w.s.zones.some(z=>z.kind==='sigil'&&z.wait>0));assert.ok(w.s.beams.some(b=>b.kind==='prism'));
 assert.equal(new Set(Object.values(p.cooldowns).map(v=>v.toFixed(2))).size,6);
});
test('flasks land as persistent fire, runes delay damage, and returning axes can hit twice',()=>{
 const w=world('ember'),p=w.s.players[0];w.step(.05);const e=w.s.enemies[0];assert.equal(e.hp,10000);
 for(let i=0;i<16;i++)w.step(.05);assert.ok(w.s.zones.some(z=>z.kind==='fire'));assert.ok(e.hp<10000);
 const rune=world('sigil'),r=rune.s.enemies[0];rune.step(.05);assert.equal(r.hp,10000);for(let i=0;i<18;i++)rune.step(.05);assert.ok(r.hp<10000);
 const axe=world('axe'),a=axe.s.enemies[0];a.x=axe.s.players[0].x+145;
 for(let i=0;i<27;i++)axe.step(.05);assert.ok(a.hp<10000-18*1.43*1.5,'outbound and return both hit');
});
test('scythes strike a cone; ravens dive; tracking beams damage along a segment',()=>{
 const w=world('scythe'),p=w.s.players[0];w.s.enemies[0].x=p.x+100;const behind=enemy(901,p.x-100,p.y);w.s.enemies.push(behind);w.step(.05);assert.ok(w.s.enemies[0].hp<10000);assert.equal(behind.hp,10000);
 const birds=world('familiar');for(let i=0;i<30;i++)birds.step(.05);assert.ok(birds.s.enemies[0].hp<10000);assert.ok(birds.s.players[0].familiars.length>0);
 const beam=world('prism');beam.step(.05);assert.ok(beam.s.enemies[0].hp<10000);assert.equal(beam.s.shots.length,0);
});
test('all unions require both exact weapon levels and a chest, consume their secondary and release a slot',()=>{
 for(const r of RECIPES.filter(r=>r.weapons)){
  const w=world(r.weapon),p=ready(w,r),second=r.weapons[1].key;
  p.ranks[second]=2;assert.equal(w.craft('p',r.key),false);p.ranks[second]=3;p.relics=0;assert.equal(w.craft('p',r.key),false);p.relics=2;
  const before=weaponLoadout(p).length;assert.ok(w.craft('p',r.key));assert.equal(p.relics,1);assert.equal(weaponLoadout(p).length,before-1);assert.equal(p.fused[second],r.key);
  assert.equal(canUpgrade(p,second),false);assert.equal(canUpgrade(p,r.weapon),false);assert.equal(w.craft('p',r.key),false);assert.equal(forgeState(p,r.key).complete,true);
  w.step(.05);assert.ok(!w.s.shots.some(b=>b.weapon===second));
 }
});
test('a weapon used in an evolution cannot enter another recipe or keep existing attacks',()=>{
 const w=world('spear'),p=w.s.players[0],solar=RECIPES.find(r=>r.key==='solar');ready(w,solar);p.ranks.blade=5;p.ranks.power=1;
 p.choices=['blade'];assert.equal(w.craft('p','solar'),false);p.choices=[];assert.ok(w.craft('p','eclipse'));assert.equal(forgeState(p,'solar').blocked,true);assert.equal(w.craft('p','solar'),false);
 const x=world('bow'),q=ready(x,RECIPES.find(r=>r.key==='thunderbow'));q.stormCd=0;x.step(.05);assert.ok(x.s.effects.some(f=>f.type==='lightning'));assert.ok(x.craft('p','thunderbow'));x.s.effects=[];x.step(.05);assert.ok(!x.s.effects.some(f=>f.type==='lightning'),'consumed lightning does not cast separately');
});
test('all unions produce their special attacks and serialize in multiplayer snapshots',()=>{
 const expected={dijiang:w=>w.s.zones.some(z=>z.kind==='orbital'),requiem:w=>w.s.zones.filter(z=>z.kind==='bellwave').length===3,bloodfist:w=>w.s.zones.some(z=>z.kind==='punch'&&z.evolved),stormloom:w=>w.s.zones.some(z=>z.kind==='flail'&&z.evolved),solar:w=>w.s.beams.some(b=>b.kind==='solar'),inferno:w=>w.s.zones.filter(z=>z.kind==='meteor').length===3,reaper:w=>w.s.effects.some(f=>f.type==='slash'&&f.full),thunderbow:w=>w.s.shots.some(b=>b.shock),void:w=>w.s.zones.some(z=>z.kind==='void'),seraph:w=>w.s.players[0].familiars.length===3,mirrordance:w=>w.s.shots.some(b=>b.split),bastion:w=>w.s.zones.filter(z=>z.kind==='turret').length===3,soulmill:w=>w.s.zones.some(z=>z.kind==='mill'),typhoon:w=>w.s.shots.filter(b=>b.kind==='tornado'&&b.seek).length===3};
 for(const r of RECIPES.filter(r=>r.weapons)){const w=world(r.weapon);ready(w,r);w.input('p',{choice:r.key,seq:1});w.input('p',{choice:r.key,seq:1});w.step(.05);assert.ok(expected[r.key](w),r.key);const state=JSON.parse(JSON.stringify(w.s));assert.equal(state.players[0].relics,1);assert.equal(state.players[0].evolutions[r.weapon],r.key);}
});
test('four players with six mixed unions stay within the room transport budget over six minutes',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:String(i)})),()=>.4);let largest=0;
 for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e7;p.damage=85;p.magnet=600;for(const r of RECIPES.filter(r=>['solar','seraph','mirrordance','bastion','soulmill','typhoon'].includes(r.key))){for(const part of r.weapons)equip(p,part.key,3);p.relics++;assert.ok(w.craft(p.id,r.key));}}
 for(let i=0;i<361*20;i++){for(const p of w.s.players)p.choices=[];w.step(.05);if(i%20===0)largest=Math.max(largest,JSON.stringify(w.s).length);}
 assert.ok(largest<220000,`largest snapshot ${largest}`);assert.ok(w.s.kills>200);assert.ok(w.s.shots.length<=180);assert.ok(w.s.zones.length<=64);assert.ok(w.s.beams.length<=16);assert.ok(w.s.players.every(p=>Number.isFinite(p.hp)));
});
test('forging one pair preserves another weapon’s ongoing fire and beam',()=>{
 const w=world('ember'),p=w.s.players[0];for(let i=0;i<16;i++)w.step(.05);
 equip(p,'prism',1);w.step(.05);assert.ok(w.s.zones.some(z=>z.kind==='fire'));assert.ok(w.s.beams.some(b=>b.kind==='prism'));
 ready(w,RECIPES.find(r=>r.key==='solar'));const emberTimer=p.cooldowns.ember;
 assert.ok(w.craft('p','solar'));assert.ok(w.s.zones.some(z=>z.kind==='fire'));assert.ok(w.s.beams.some(b=>b.kind==='prism'));assert.equal(p.cooldowns.ember,emberTimer);
});
