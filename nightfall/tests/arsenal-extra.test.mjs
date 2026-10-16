import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {RECIPES,WEAPONS,WEAPON_LIMIT,weaponLoadout,SMITH_ITEMS} from '../lib/equipment.mjs';
import {stepSpecialShot,stepWeaponEntities} from '../lib/weapons.mjs';
import {weaponRanking} from '../lib/combat-stats.mjs';
const enemy=(id,x,y,type=1)=>({id,x,y,type,hp:100000,maxHp:100000,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
function setup(key,x=85){const w=new World([{id:'p',weapon:key,effects:SMITH_ITEMS}],()=>.4);w.spawnCd=1e9;w.s.props=[];const p=w.s.players[0];p.hp=p.maxHp=1e6;w.s.enemies=[enemy(900,p.x+x,p.y)];return{w,p,e:w.s.enemies[0]};}
const steps=(w,n)=>{for(let i=0;i<n;i++){for(const p of w.s.players)p.choices=[];w.step(.05);}};
test('daggers fire a paced burst and retarget each throw',()=>{
 const {w,p}=setup('dagger',180);w.step(.05);assert.equal(w.s.shots.length,1);assert.equal(p.salvo.remaining,3);w.step(.05);assert.equal(w.s.shots.length,1);
 const e=enemy(901,p.x,p.y+100);w.s.enemies=[e];steps(w,2);const last=w.s.shots.at(-1);assert.ok(last.vy>Math.abs(last.vx));assert.equal(last.weapon,'dagger');
 p.fused.dagger='mirrordance';steps(w,1);assert.equal(p.salvo,null,'consumed burst cannot leak into artifact damage');
});
test('mirror wheels bounce to distinct enemies and fragments never recurse',()=>{
 const {w,p}=setup('chakram');w.s.enemies.push(enemy(901,p.x+100,p.y+90));w.step(.05);const b=w.s.shots[0];
 b.x=w.s.enemies[0].x;b.y=w.s.enemies[0].y;b.vx=b.vy=0;b.split=true;stepSpecialShot(w,b,p,.01);
 assert.deepEqual(b.hit,[900]);assert.ok(b.vy>0);assert.equal(w.s.shots.filter(s=>s.sprite===34).length,2);assert.ok(w.s.shots.filter(s=>s.sprite===34).every(s=>!s.split&&!s.kind));
 b.x=w.s.enemies[1].x;b.y=w.s.enemies[1].y;stepSpecialShot(w,b,p,0);assert.deepEqual(b.hit,[900,901]);assert.equal(b.life,0);assert.equal(p.stats.chakram.kills,0);
});
test('mines must arm, explode once on proximity, and expire far from enemies',()=>{
 const {w,p,e}=setup('mine');w.step(.05);const z=w.s.zones[0];assert.equal(e.hp,100000);steps(w,7);assert.equal(e.hp,100000);steps(w,2);assert.ok(e.hp<100000);assert.ok(!w.s.zones.includes(z));assert.equal(p.stats.mine.damage,18*3.6);
 const far=setup('mine',500);steps(far.w,20);assert.equal(far.e.hp,100000);assert.ok(far.w.s.zones.length);steps(far.w,280);assert.ok(far.w.s.zones.length<=6);
});
test('turrets stay at placement positions and smith items change their actual volleys',()=>{
 const {w,p}=setup('turret',200);p.ranks.volley=2;p.ranks.area=2;p.ranks.linger=1;p.ranks.cooling=2;w.step(.05);const z=w.s.zones[0],x=z.x,y=z.y;
 assert.equal(w.s.shots.length,3);assert.equal(w.s.shots[0].scale,1.4);assert.ok(z.max>7.5);assert.ok(p.cooldowns.turret<5.2);
 w.input(p.id,{x:1,y:0});steps(w,10);assert.equal(z.x,x);assert.equal(z.y,y);assert.notEqual(p.x,x);steps(w,260);assert.ok(w.s.zones.filter(z=>z.kind==='turret').length<=2);
});
test('tethers pull targets but the thirty-minute reaper ignores crowd control',()=>{
 const {w,p,e}=setup('chain',180);w.step(.05);p.cooldowns.chain=999;const x=e.x;w.s.enemies.push(enemy(901,p.x+100,p.y,7));const death=w.s.enemies[1];
 w.s.zones.push({...w.s.zones[0],id:999,target:death.id});const dx=death.x;stepWeaponEntities(w,.05);assert.ok(e.x<x);assert.equal(death.x,dx);assert.equal(death.slow,0);assert.ok(p.stats.chain.damage>0);
});
test('saw blades remain along the movement trail and repeatedly cut nearby enemies',()=>{
 const {w,p,e}=setup('saw',65);w.step(.05);const first=w.s.zones[0],originY=p.y,damage=p.stats.saw.damage;w.input('p',{x:0,y:1});steps(w,30);
 assert.ok(p.stats.saw.damage>damage);assert.equal(first.y,originY);assert.ok(w.s.zones.some(z=>z.kind==='saw'&&z.y>first.y+100));assert.ok(w.s.zones.length<=3);assert.ok(e.hp<100000);
});
test('tornadoes travel, pull nearby foes and attribute repeated damage to wind',()=>{
 const {w,p}=setup('wind',110);w.step(.05);const b=w.s.shots[0],x=b.x;steps(w,12);assert.notEqual(b.x,x);assert.ok(p.stats.wind.damage>0);assert.deepEqual(Object.keys(p.stats),['wind']);
 const death=enemy(999,b.x+20,b.y,7);w.s.enemies=[death];const dx=death.x;stepSpecialShot(w,b,p,.02);assert.equal(death.x,dx);
});
test('whips strike a long narrow lane and higher ranks also strike behind',()=>{
 const {w,p,e}=setup('whip',230),side=enemy(901,p.x+100,p.y+230),back=enemy(902,p.x-240,p.y);w.s.enemies.push(side,back);w.step(.05);
 assert.ok(e.hp<100000);assert.equal(side.hp,100000);assert.equal(back.hp,100000);p.ranks.whip=3;p.cooldowns.whip=0;w.step(.05);assert.ok(back.hp<100000);assert.equal(w.s.effects.filter(f=>f.type==='lash').length,3);
});
test('four new artifacts retain distinct mechanics and record their own ledger rows',()=>{
 for(const key of ['mirrordance','bastion','soulmill','typhoon']){
  const r=RECIPES.find(r=>r.key===key),{w,p}=setup(r.weapon);for(const part of r.weapons)p.ranks[part.key]=3;p.relics=1;
  w.step(.05);assert.ok(w.craft('p',key));assert.equal(weaponLoadout(p).length,1);assert.ok(!w.s.shots.some(b=>b.weapon===r.weapons[1].key));steps(w,80);
  assert.ok(p.stats[key]?.damage>0,key);assert.ok(weaponRanking(p,w.s.time).find(row=>row.key===key));assert.equal(p.stats[r.weapon].endedAt,.05);
 }
});
test('all new weapons can be acquired at the six-slot boundary and dead owners stop every entity',()=>{
 for(const key of WEAPONS.slice(12)){
  const {w,p}=setup(key);for(const old of WEAPONS.slice(0,5)){p.choices=[old];assert.ok(w.upgrade('p',old));}assert.equal(weaponLoadout(p).length,WEAPON_LIMIT);
  p.choices=['prism'];assert.equal(w.upgrade('p','prism'),false);p.choices=[];w.step(.05);p.hp=0;w.s.players.push({...p,id:'q',hp:100,choices:[],ranks:{},stats:{},cooldowns:{},evolutions:{},fused:{}});steps(w,2);
  assert.ok(w.s.shots.every(b=>b.owner!=='p'));assert.ok(w.s.zones.every(z=>z.owner!=='p'));
 }
});
