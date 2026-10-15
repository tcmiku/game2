import test from 'node:test';
import assert from 'node:assert/strict';
import {World,W,H} from '../lib/game.mjs';
import {WEAPONS,forgeState,canUpgrade,normalizeEffects} from '../lib/equipment.mjs';
import {newProfile,normalizeProfile,recruitScholar,unlockEffect} from '../lib/camp.mjs';
import {experienceAppearance,createDestructibles} from '../lib/frontier.mjs';
import {hurtPlayer} from '../lib/encounters.mjs';
import {packSnapshot,unpackSnapshot,RemoteView} from '../lib/network.mjs';
function scene(weapon='aegis',coop=false){const w=new World(coop?[{id:'p',weapon},{id:'q',weapon:'blade'}]:[{id:'p',weapon}],()=>.5);w.spawnCd=w.eliteAt=1e9;w.s.props=[];for(const p of w.s.players)p.nextXp=1e9;if(w.s.teamXp)w.s.teamXp.nextXp=1e9;return{w,p:w.s.players[0]};}
const foe=p=>({id:900,x:p.x+180,y:p.y,type:1,hp:10000,maxHp:10000,size:20,speed:0,hit:0,slow:0,orbitCd:0});
const bullet=(p,id=901,x=60)=>({id,x:p.x+x,y:p.y,vx:0,vy:0,radius:10,life:4,damage:15,kind:'orb'});
test('mirror shield erases a nearby projectile, retaliates with attributed damage, and has a vulnerable cooldown',()=>{
 const {w,p}=scene();w.s.enemies=[foe(p)];w.s.hostile=[bullet(p,901,30)];w.step(.05);
 assert.equal(p.hp,100);assert.equal(p.blockedShots,1);assert.equal(w.s.hostile.length,0);assert.ok(w.s.shots.some(b=>b.weapon==='aegis'&&b.owner==='p'));
 for(let i=0;i<12;i++)w.step(.05);assert.ok(p.stats.aegis.damage>0);p.shieldUntil=0;p.cooldowns.aegis=2;w.s.hostile=[bullet(p,902,0)];w.step(.05);assert.equal(p.hp,85);
});
test('mirror shield has a per-cast interception budget and leaves distant bullets and ground hazards active',()=>{
 const {w,p}=scene();w.s.hostile=Array.from({length:12},(_,i)=>bullet(p,1000+i));w.s.hostile.push(bullet(p,1013,500));w.s.hazards=[{id:901,kind:'roots',x:p.x,y:p.y,radius:70,wait:3,life:4,damage:30}];w.step(.05);
 assert.equal(p.blockedShots,8);assert.equal(w.s.hostile.length,5);assert.equal(w.s.hazards.length,1);w.step(.05);assert.equal(p.blockedShots,8);
});
test('ghosts and disconnected owners do not intercept or attack; living allies continue',()=>{
 const {w,p}=scene('aegis',true);p.hp=0;w.s.players[1].x+=500;w.s.hostile=[bullet(p)];w.step(.05);assert.equal(p.ghost,true);assert.equal(p.blockedShots||0,0);assert.equal(w.s.hostile.length,1);
 const offline=scene();offline.p.connected=false;offline.w.s.hostile=[bullet(offline.p,55,0)];offline.w.step(.05);assert.equal(offline.p.blockedShots||0,0);assert.equal(offline.p.hp,100);
});
test('moonward requires mirror rank five, a heartleaf and a chest, and cannot be forged twice',()=>{
 const {w,p}=scene();p.ranks.aegis=5;p.ranks.ward=1;p.relics=1;assert.equal(forgeState(p,'moonward').ready,true);assert.ok(w.craft('p','moonward'));assert.equal(p.relics,0);assert.equal(w.craft('p','moonward'),false);
 w.s.hostile=Array.from({length:20},(_,i)=>bullet(p,1200+i));w.s.enemies=[foe(p)];w.step(.05);assert.equal(p.blockedShots,20);assert.ok(p.shieldRadius>190);assert.equal(p.evolutions.aegis,'moonward');
});
test('destructible rewards occur once and do not inflate enemy kills, chest drops or weapon damage rankings',()=>{
 const {w,p}=scene('blade'),objects=createDestructibles();w.s.props=objects.slice(0,3);
 for(const object of w.s.props){w.damage(object,100,p);w.damage(object,100,p);}
 assert.equal(w.s.gems.length,3);assert.deepEqual(w.s.gems.map(g=>g.type),['gem','gem','heart']);assert.deepEqual(w.s.gems.map(g=>g.v),[8,24,1]);assert.equal(w.s.kills,0);assert.equal(p.kills,0);assert.equal(p.stats.blade.damage,0);assert.equal(w.s.chests.length,0);
 const saved=unpackSnapshot(packSnapshot(w.checkpoint(),{authoritative:true})),restored=World.restore(saved);assert.ok(restored.s.props.every(o=>o.broken));restored.damage(restored.s.props[0],100,restored.s.players[0]);assert.equal(restored.s.gems.length,3);
});
test('every weapon family can damage an environmental object using its real attacks',()=>{
 for(const key of WEAPONS){const {w,p}=scene(key);const object={id:-500,prop:true,kind:0,x:p.x+80,y:p.y,size:22,hp:1,maxHp:1,hit:0};w.s.props=[object];
  for(let i=0;i<130&&object.hp>0;i++)w.step(.05);assert.equal(object.hp,0,key);assert.equal(w.s.kills,0,key);
 }
});
test('the expanded arena, client movement prediction and authoritative checkpoints agree beyond the old boundary',()=>{
 assert.equal(W*H/(2400*1600),2.25);const {w,p}=scene('blade');p.x=2800;p.y=1900;p.speed=1000;w.input('p',{x:1,y:1});for(let i=0;i<50;i++)w.step(.05);assert.ok(p.x>2400&&p.y>1600);assert.ok(p.x<=W-100&&p.y<=H-100);
 const state=unpackSnapshot(packSnapshot(w.checkpoint(),{authoritative:true})),remote=new RemoteView();remote.receive(state,p.id,0);const shown=remote.sample({x:1,y:1},.05,.05);assert.ok(shown.players[0].x>2400&&shown.players[0].y>1600);assert.equal(state.width,W);assert.equal(World.restore(state).s.height,H);
 const legacy=packSnapshot(w.s);delete legacy.entities.props;assert.deepEqual(unpackSnapshot(legacy).props,[]);
});
test('experience value determines four distinct colors and increasing visual size, including consolidated gems',()=>{
 assert.deepEqual([1,5,20,80].map(n=>experienceAppearance(n).tier),[0,1,2,3]);assert.equal(new Set([1,5,20,80].map(n=>experienceAppearance(n).color)).size,4);assert.ok(experienceAppearance(80).size>experienceAppearance(1).size);assert.equal(experienceAppearance(4).tier,0);assert.equal(experienceAppearance(79).tier,2);
});
test('legacy saves gain the herbalist, scholar recruitment is idempotent, and each resident gates their unlocks',()=>{
 let profile=normalizeProfile({embers:200,residents:['keeper','herbalist','herbalist']});assert.deepEqual(profile.residents,['keeper','herbalist']);assert.equal(unlockEffect(profile,'wisdom'),null);profile=unlockEffect(profile,'ward');assert.equal(profile.embers,150);assert.ok(profile.effects.includes('ward'));assert.equal(unlockEffect(profile,'ward'),null);
 assert.equal(recruitScholar(profile,{bossKills:0}),profile);profile=recruitScholar(profile,{bossKills:1});assert.ok(profile.residents.includes('scholar'));assert.equal(recruitScholar(profile,{bossKills:2}),profile);profile=unlockEffect(profile,'wisdom');assert.ok(profile.effects.includes('wisdom'));assert.equal(profile.embers,105);assert.deepEqual(normalizeEffects(['ward','wisdom','bogus','ward']),['ward','wisdom']);assert.ok(newProfile().residents.includes('herbalist'));
});
test('new passives affect actual regeneration, received damage, shared experience and healing pickups',()=>{
 const {w,p}=scene('blade',true),q=w.s.players[1];p.hp=40;p.ranks.renewal=2;p.ranks.ward=3;p.ranks.wisdom=2;p.ranks.preservation=2;
 w.step(.05);assert.ok(p.hp>40);const before=p.hp;hurtPlayer(w,p,10);assert.ok(Math.abs(p.hp-(before-7.6))<1e-6);w.xp(p,10);assert.equal(p.xp,13);assert.equal(q.xp,13);assert.equal(w.s.teamXp.xp,13);
 p.hp=20;p.hitCd=0;p.ranks.renewal=0;w.s.gems=[{id:400,x:p.x,y:p.y,v:1,type:'heart'}];w.step(.05);assert.equal(p.hp,60);p.hp=20;p.choices=['mend'];w.upgrade('p','mend');assert.equal(p.hp,68);
 assert.equal(canUpgrade({...p,effects:[]},'wisdom'),false);p.effects=['wisdom'];p.ranks.wisdom=0;assert.equal(canUpgrade(p,'wisdom'),true);
});
