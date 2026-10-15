import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {partyDifficulty} from '../lib/difficulty.mjs';
import {BOSS_ORDER,stepBossHazard} from '../lib/bosses.mjs';
import {newProfile,rescueSmith,unlockEffect,strengthenEffect,normalizeProfile,expeditionBoons,smithWorkCost} from '../lib/camp.mjs';
import {SMITH_ITEMS,UPGRADES,upgradeMax,canUpgrade,rollChoices,weaponScale,weaponCooldown} from '../lib/equipment.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
import {hurtPlayer} from '../lib/encounters.mjs';
function world(n=1){const w=new World(Array.from({length:n},(_,i)=>({id:String(i)})),()=>.5);w.s.props=[];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e8;p.nextXp=1e9;}return w;}
const advance=(w,n)=>{for(let i=0;i<n;i++)w.step(.05);};
function boss(kind){const w=world(),p=w.s.players[0],e=w.spawn(4);e.bossKind=kind;e.x=p.x+320;e.y=p.y;e.speed=0;e.skillCd=0;return{w,p,e};}
test('one to four connected living players scale health, damage, boss health and spawn pressure',()=>{
 let health=0,bossHealth=0,spawn=0;for(let n=1;n<=4;n++){const w=world(n),d=partyDifficulty(w.s),e=w.spawn(1,0),b=w.spawn(4);assert.equal(d.count,n);assert.ok(e.maxHp>health&&b.maxHp>bossHealth);assert.equal(e.damageScale,d.damage);assert.ok(d.spawn>spawn);health=e.maxHp;bossHealth=b.maxHp;spawn=d.spawn;const old=b.hp;w.s.players.slice(1).forEach(p=>p.connected=false);assert.equal(partyDifficulty(w.s).count,1);assert.equal(b.hp,old,'existing boss HP never jumps on disconnect');assert.equal(b.encounterPlayers,n);}
 const w=world(4);w.s.players[1].hp=0;w.s.players[2].connected=false;assert.equal(partyDifficulty(w.s).count,2);
});
test('larger groups actually receive more ordinary enemies over the same interval',()=>{
 const counts=[];for(const n of [1,2,3,4]){const w=world(n);w.spawnCd=0;advance(w,200);counts.push(w.s.enemies.length);}for(let i=1;i<counts.length;i++)assert.ok(counts[i]>counts[i-1],String(counts));
});
test('each five-minute encounter selects another boss and warns five seconds before arrival',()=>{
 for(let cycle=1;cycle<=4;cycle++){const w=world();w.s.nextBossAt=cycle*300;w.s.time=cycle*300-5.01;w.step(.02);assert.equal(w.s.bossWarning.kind,BOSS_ORDER[cycle-1]);assert.ok(!w.s.enemies.some(e=>e.type===4));w.s.time=cycle*300-.01;w.step(.02);const e=w.s.enemies.find(e=>e.type===4);assert.equal(e.bossKind,BOSS_ORDER[cycle-1]);assert.equal(e.cycle,cycle);assert.ok(w.s.bossWarning.until>w.s.time);}
});
test('boss encounters reduce ordinary spawns by at least eighty percent and defer elite arrivals',()=>{
 const a=world(),b=world();for(const w of [a,b]){w.s.time=310;w.spawnCd=0;w.eliteAt=310;}const e=b.spawn(4);e.speed=0;advance(a,200);advance(b,200);assert.ok(b.s.enemies.filter(e=>e.type!==4).length<=a.s.enemies.length*.2);assert.ok(!b.s.enemies.some(e=>e.type===5));e.hp=0;b.spawnCd=0;advance(b,1);assert.ok(b.spawnCd<1);
});
test('prism shield reduces damage only while charging, locks a dodgeable ray, then alternates shards',()=>{
 const {w,p,e}=boss('prism');w.step(.05);assert.equal(e.skill,'ray');const angle=e.attackAngle,hp=e.hp;w.damage(e,100,p);assert.equal(hp-e.hp,55);p.y+=250;advance(w,25);assert.equal(e.attackAngle,angle);assert.equal(p.hp,p.maxHp);advance(w,3);assert.ok(w.s.hazards.some(h=>h.kind==='bossRay'));const before=e.hp;w.damage(e,100,p);assert.equal(before-e.hp,100);advance(w,100);assert.ok(w.s.hostile.some(b=>b.sourceType===4&&b.cancellable===false));
});
test('halo rings have a genuinely safe gap, hollow center and delayed starfall',()=>{
 const {w,p,e}=boss('halo'),hit=(x,y)=>{p.x=x;p.y=y;p.hitCd=0;p.hp=p.maxHp;const h={kind:'bossRing',owner:e.id,x:e.x,y:e.y,wait:0,life:1,age:.5,max:1,outer:340,gap:0,halfGap:.42,tick:0,damage:20};stepBossHazard(w,h,0,hurtPlayer);return p.hp;};
 assert.equal(hit(e.x+180,e.y),p.maxHp);assert.equal(hit(e.x,e.y),p.maxHp);assert.equal(hit(e.x-180,e.y),p.maxHp-20);
 e.skillIndex=1;e.skillCd=0;w.step(.05);advance(w,27);const h=w.s.hazards.find(h=>h.kind==='bossStar');assert.ok(h&&h.wait>0);p.x+=300;const hp=p.hp;advance(w,28);assert.equal(p.hp,hp);
});
test('ribbon performs two telegraphed dashes and proceeds to its sweeping beam',()=>{
 const {w,e}=boss('ribbon');let starts=0,last=0,rift=false;for(let i=0;i<230;i++){w.step(.05);if(e.chargeLeft>0&&last<=0)starts++;last=e.chargeLeft||0;rift ||= e.skill==='rift'||w.s.hazards.some(h=>h.kind==='bossSweep');}assert.ok(starts>=2&&starts<=4);assert.ok(rift);assert.ok(w.s.hazards.length<=48);
});
test('defeated bosses stop their active rays and shockwaves without repeating damage',()=>{
 const {w,p,e}=boss('prism');w.s.hazards=[{id:999,owner:e.id,kind:'bossRay',x:p.x-50,y:p.y,angle:0,length:500,width:30,wait:0,life:1,tick:0,damage:25}];w.s.bossWarning={cycle:e.cycle};w.damage(e,e.maxHp*2,p);assert.equal(w.s.bossWarning,null);w.step(.05);assert.equal(p.hp,p.maxHp);assert.equal(w.s.hazards.length,0);
});
test('new foes telegraph a fan, cast slowing webs and blink to a locked destination',()=>{
 for(const type of [13,14,15]){const w=world(),p=w.s.players[0],e=w.spawn(type,0);e.x=p.x+250;e.y=p.y;e.speed=0;e.skillCd=0;w.step(.05);assert.ok(e.skill&&e.windup>0);assert.equal(w.s.hostile.length,0);const tx=e.tx,ty=e.ty;p.y+=180;advance(w,22);if(type===13)assert.equal(w.s.hostile.length,3);if(type===14)assert.ok(w.s.hazards.some(h=>h.kind==='web'));if(type===15){assert.equal(e.x,tx);assert.equal(e.y,ty);assert.equal(w.s.hostile.length,6);}}
 const w=world(),p=w.s.players[0];w.s.hazards=[{id:999,kind:'web',x:p.x,y:p.y,radius:74,wait:0,life:2,tick:0,damage:6}];w.step(.05);w.input(p.id,{x:1,y:0});const x=p.x;w.step(.05);assert.ok(Math.abs(p.x-x-p.speed*.55*.05)<1e-6);assert.equal(p.snared,true);advance(w,50);assert.equal(p.snared,false);
});
test('boss charge, warning, new hazards and encounter scaling survive deltas and takeover',()=>{
 const {w,e}=boss('halo');w.s.bossWarning={kind:'halo',at:0,arrive:5,until:8};e.skillCd=0;advance(w,10);const a=packSnapshot(w.checkpoint(),{authoritative:true});advance(w,18);const b=packSnapshot(w.checkpoint(),{authoritative:true}),state=unpackSnapshot(JSON.parse(JSON.stringify(applySnapshotDelta(a,snapshotDelta(a,b,7),7)))),restored=World.restore(state);
 assert.deepEqual(restored.s.bossWarning,state.bossWarning);assert.deepEqual(restored.s.enemies,state.enemies);assert.deepEqual(restored.s.hazards,state.hazards);advance(restored,5);assert.ok(restored.s.hazards.some(h=>h.kind==='bossRing'&&h.radius>20));
});
test('smith work unlocks then strengthens three times with rising cost, persistent caps and no overspend',()=>{
 for(const key of SMITH_ITEMS){let p=rescueSmith(newProfile());p.embers=2000;assert.equal(strengthenEffect(p,key),null);p=unlockEffect(p,key);let cost=0;for(let i=1;i<=3;i++){assert.ok(smithWorkCost(p,key)>cost);cost=smithWorkCost(p,key);const before=p.embers;p=strengthenEffect(p,key);assert.equal(p.smithwork[key],i);assert.equal(p.embers,before-cost);}assert.equal(strengthenEffect(p,key),null);assert.deepEqual(normalizeProfile(JSON.parse(JSON.stringify(p))),p);const q=newProfile();assert.equal(q.smithwork[key],0);}
 let p=rescueSmith(newProfile());p=unlockEffect(p,'area');p.embers=0;assert.equal(strengthenEffect(p,'area'),null);assert.equal(strengthenEffect(p,'blade'),null);assert.equal(normalizeProfile({effects:['area'],smithwork:{area:99,cooling:3}}).smithwork.area,3);assert.equal(normalizeProfile({effects:['area'],smithwork:{cooling:3}}).smithwork.cooling,0);
});
test('forged item caps affect real upgrade choices and attacks, remain per player and freeze at departure',()=>{
 let profile=rescueSmith(newProfile());profile.embers=3000;for(const key of SMITH_ITEMS){profile=unlockEffect(profile,key);for(let i=0;i<3;i++)profile=strengthenEffect(profile,key);}
 const w=new World([{id:'a',effects:profile.effects,boons:expeditionBoons(profile),weapon:'spear'},{id:'b',effects:profile.effects,boons:expeditionBoons(newProfile()),weapon:'spear'}],()=>.5),[p,q]=w.s.players;w.spawnCd=w.eliteAt=1e9;w.s.props=[];
 for(const key of SMITH_ITEMS){assert.equal(upgradeMax(p,key),UPGRADES[key].max+3);assert.equal(upgradeMax(q,key),UPGRADES[key].max);p.ranks[key]=UPGRADES[key].max;assert.ok(canUpgrade(p,key));assert.equal(canUpgrade({...q,ranks:{[key]:UPGRADES[key].max}},key),false);p.choices=[key];assert.ok(w.upgrade('a',key));p.ranks[key]=upgradeMax(p,key);assert.equal(canUpgrade(p,key),false);}
 assert.ok(Math.abs(weaponScale(p)-2.4)<1e-6);assert.ok(Math.abs(weaponCooldown(p,1)-.44)<1e-6);w.input('a',{boons:{smithwork:{area:0}},smithwork:{area:0}});assert.equal(p.smithwork.area,3);
 for(const [key,def] of Object.entries(UPGRADES))p.ranks[key]=def.max;p.ranks.area=6;p.ranks.cooling=7;p.ranks.linger=6;p.ranks.volley=5;p.level=20;assert.ok(rollChoices(p,()=>.5).includes('area'));const saved=unpackSnapshot(packSnapshot(w.checkpoint(),{authoritative:true}));assert.equal(World.restore(saved).s.players[0].smithwork.volley,3);
});
