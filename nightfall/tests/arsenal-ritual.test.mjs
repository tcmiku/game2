import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {World} from '../lib/game.mjs';
import {RECIPES,WEAPON_ATLAS_COLUMNS,WEAPON_ATLAS_ROWS,weaponLoadout,canUpgrade} from '../lib/equipment.mjs';
import {RITUAL_WEAPONS,flailHeads,onRitualHit} from '../lib/arsenal-ritual.mjs';
import {packSnapshot,unpackSnapshot,presentationPacket} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const enemy=(id,x,y,type=1)=>({id,x,y,type,hp:1e5,maxHp:1e5,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
function scene(key,range=100){const w=new World([{id:'p',weapon:key}],()=>.4),p=w.s.players[0];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];p.nextXp=1e9;p.hitCd=100;p.hp=40;w.s.enemies=[enemy(900,p.x+range,p.y)];return{w,p,e:w.s.enemies[0]};}
function step(w,n){for(let i=0;i<n;i++){for(const e of w.s.enemies)e.knockX=e.knockY=0;w.step(.05);}}
test('bell damage travels outward and each individual wave hits a target only once',()=>{
 const {w,p,e}=scene('bell',200);w.step(.05);p.cooldowns.bell=999;assert.equal(e.hp,e.maxHp);step(w,22);assert.ok(e.hp<e.maxHp);const damage=p.stats.bell.damage;step(w,25);assert.equal(p.stats.bell.damage,damage);assert.equal(w.s.zones.length,0);
});
test('gauntlet executes three timed directional strikes and its restored combo never repeats a completed stage',()=>{
 const {w,p,e}=scene('gauntlet',100),side=enemy(901,p.x,p.y+110),back=enemy(902,p.x-100,p.y);w.s.enemies.push(side,back);step(w,2);assert.equal(w.s.zones[0].stage,1);const first=p.stats.gauntlet.damage;
 const restored=World.restore(unpackSnapshot(packSnapshot(w.checkpoint(),{authoritative:true}))),q=restored.s.players[0];q.cooldowns.gauntlet=999;step(restored,13);assert.equal(restored.s.zones[0].stage,3);assert.ok(Math.abs(q.stats.gauntlet.damage-first*4.2)<1e-7);assert.equal(restored.s.enemies[1].hp,side.maxHp);assert.equal(restored.s.enemies[2].hp,back.maxHp);
});
test('hourglass warns, freezes ordinary enemies, slows bosses, never controls death and shatters after its delay',()=>{
 const {w,p,e}=scene('hourglass',160),boss=enemy(901,e.x+15,e.y,4),death=enemy(902,e.x-15,e.y,7);w.s.enemies.push(boss,death);step(w,5);assert.equal(e.frozen||0,0);assert.equal(p.stats.hourglass.damage,0);step(w,7);assert.ok(e.frozen>0);assert.ok(boss.slow>0);assert.equal(boss.frozen||0,0);assert.equal(death.frozen||0,0);assert.equal(death.slow||0,0);step(w,32);assert.ok(p.stats.hourglass.damage>0);
});
test('real blood needles stack three marks, burst with their own damage attribution and cap healing during dense hits',()=>{
 const {w,p,e}=scene('bloodneedle',140);step(w,82);assert.ok(p.hp>40);assert.ok(p.stats.bloodneedle.damage>18*.77*3);assert.deepEqual(Object.keys(p.stats),['bloodneedle']);
 const before=p.hp;for(let i=0;i<30;i++)onRitualHit(w,{weapon:'bloodneedle'},p,e);assert.ok(p.hp-before<=2,'healing has an independent cooldown');assert.ok(w.s.zones.filter(z=>z.kind==='bloodmark'&&z.life>0).length<=4);
 const object={...e,id:-1,prop:true};onRitualHit(w,{weapon:'bloodneedle'},p,object);assert.ok(w.s.zones.every(z=>z.target!==-1),'props cannot be leeched');
});
test('loom pylons stay in the world after the owner moves and damage only enemies crossing the armed segment',()=>{
 const {w,p,e}=scene('loom',160);step(w,1);const z=w.s.zones[0],from={x:z.x,y:z.y,tx:z.tx,ty:z.ty};assert.equal(e.hp,e.maxHp);p.cooldowns.loom=999;w.input('p',{x:0,y:1});step(w,9);assert.ok(p.stats.loom.damage>0);assert.deepEqual({x:z.x,y:z.y,tx:z.tx,ty:z.ty},from);assert.notEqual(p.y,800);
 e.x+=350;const damage=p.stats.loom.damage;step(w,12);assert.equal(p.stats.loom.damage,damage);
});
test('flail follows a figure eight; its artifact adds a second head and independently damaging chain lines',()=>{
 const {w,p}=scene('flail',40);p.ranks.flail=p.ranks.loom=3;p.relics=1;assert.ok(w.craft('p','stormloom'));step(w,1);const z=w.s.zones[0];assert.equal(flailHeads(z,w.s.time).length,2);assert.ok(p.stats.stormloom.damage>0,'the chain hits a target that is too close to either head');
 const a=flailHeads(z,0),b=flailHeads(z,.4);assert.notEqual(a[0].x,b[0].x);assert.notEqual(a[0].y,b[0].y);assert.ok(Math.abs(a[0].x+a[1].x-2*z.x)<1e-7);
});
test('three ritual unions release a slot, cancel consumed weapons, attribute artifact damage and preserve complete recovery over deltas',()=>{
 for(const key of ['requiem','bloodfist','stormloom']){const r=RECIPES.find(r=>r.key===key),{w,p}=scene(r.weapon,100);for(const part of r.weapons)p.ranks[part.key]=3;p.relics=1;step(w,1);assert.ok(w.craft('p',key));assert.equal(weaponLoadout(p).length,1);assert.equal(canUpgrade(p,r.weapons[1].key),false);assert.equal(w.craft('p',key),false);const base=packSnapshot(w.checkpoint(),{authoritative:true});step(w,80);assert.ok(p.stats[key].damage>0,key);assert.ok(!w.s.shots.some(b=>b.weapon===r.weapons[1].key));
  const next=packSnapshot(w.checkpoint(),{authoritative:true}),recovered=World.restore(unpackSnapshot(applySnapshotDelta(base,snapshotDelta(base,next,8),8)));assert.equal(recovered.s.players[0].evolutions[r.weapon],key);assert.ok(Math.abs(recovered.s.players[0].stats[key].damage-p.stats[key].damage)<.001);assert.doesNotThrow(()=>step(recovered,10));assert.ok(presentationPacket(next).entities.zones);
 }
});
test('four players using six new weapon types keep entity pools and authoritative transport bounded for a dense minute',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:`p${i}`,weapon:'bell'})),()=>.4);w.s.time=350;w.eliteAt=w.s.nextBossAt=1e9;for(const p of w.s.players){p.ranks=Object.fromEntries(RITUAL_WEAPONS.map(k=>[k,5]));p.hp=p.maxHp=1e6;p.nextXp=1e9;p.damage=60;}
 let largest=0;for(let i=0;i<1200;i++){w.step(.05);if(i%20===0)largest=Math.max(largest,JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})).length);}
 assert.ok(w.s.kills>50);assert.ok(largest<250000,`largest checkpoint ${largest}`);assert.ok(w.s.zones.length<=64);assert.ok(w.s.shots.length<=180);for(const p of w.s.players){p.connected=false;}step(w,2);assert.equal(w.s.shots.length,0);assert.equal(w.s.zones.length,0);
});
test('all nine new icons fit inside the shared eight-row pixel atlas',async()=>{
 const png=await readFile(new URL('../public/art/pixel-weapons.png',import.meta.url));assert.equal(png.readUInt32BE(16),WEAPON_ATLAS_COLUMNS*64);assert.equal(png.readUInt32BE(20),WEAPON_ATLAS_ROWS*64);assert.equal(WEAPON_ATLAS_ROWS,8);
});
