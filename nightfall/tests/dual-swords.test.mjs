import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {forgeState,weaponLoadout,canUpgrade,rollChoices} from '../lib/equipment.mjs';
import {swordSpinning,swordMoveMultiplier} from '../lib/dual-swords.mjs';
import {cleanRealtimeInput} from '../lib/realtime.mjs';
import {packSnapshot,unpackSnapshot,presentationPacket,RemoteView} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';

const enemy=(id,x,y)=>({id,x,y,type:1,hp:1e6,maxHp:1e6,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
function scene(weapon='elucidator',party=1){
 const w=new World(Array.from({length:party},(_,i)=>({id:i?'q':'p',weapon})),()=>.4,[]),p=w.s.players[0];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){p.nextXp=1e9;p.hitCd=100;p.hp=p.maxHp=1e6;}return{w,p};
}
function dual(w,p){p.ranks.elucidator=p.ranks.darkrepulser=3;p.relics=1;assert.equal(w.craft(p.id,'dualblades'),true);}
function step(w,n){for(let i=0;i<n;i++){for(const e of w.s.enemies)e.knockX=e.knockY=0;w.step(.05);}}
test('both swords are obtainable starters and enter the ordinary upgrade pool',()=>{
 for(const key of ['elucidator','darkrepulser']){const {p}=scene(key);assert.ok(weaponLoadout(p).includes(key));assert.ok(canUpgrade(p,key));}
 const {p}=scene('blade');let choices=new Set();for(let n=0;n<100;n++){let seed=n;for(const key of rollChoices(p,()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)))choices.add(key);}
 assert.ok(choices.has('elucidator'));assert.ok(choices.has('darkrepulser'));
});
test('Elucidator hits only its close forward arc once per slash and waits for targets to enter reach',()=>{
 const {w,p}=scene();const front=enemy(901,p.x+90,p.y),back=enemy(902,p.x-90,p.y),far=enemy(903,p.x+300,p.y);w.s.enemies=[front,back,far];w.step(.05);p.cooldowns.elucidator=100;
 assert.ok(front.hp<front.maxHp);assert.equal(back.hp,back.maxHp);assert.equal(far.hp,far.maxHp);const damage=p.stats.elucidator.damage;step(w,6);assert.equal(p.stats.elucidator.damage,damage);assert.equal(w.s.shots.length,0);
 const distant=scene();distant.w.s.enemies=[enemy(904,distant.p.x+400,distant.p.y)];step(distant.w,20);assert.equal(distant.p.stats.elucidator.damage,0);assert.ok(!(distant.p.cooldowns.elucidator>0));
});
test('Dark Repulser launches a traveling crescent which reaches and pierces distant enemies',()=>{
 const {w,p}=scene('darkrepulser');w.s.enemies=[enemy(901,p.x+240,p.y-10),enemy(902,p.x+370,p.y-10)];w.step(.05);p.cooldowns.darkrepulser=100;
 assert.equal(w.s.shots[0].kind,'swordwave');assert.equal(w.s.enemies[0].hp,1e6);step(w,18);assert.ok(w.s.enemies.every(e=>e.hp<e.maxHp));assert.ok(p.stats.darkrepulser.damage>0);assert.equal(w.s.zones.length,0);
});
test('dual blades requires both level-three swords and a chest, frees a slot and strengthens both attacks',()=>{
 const {w,p}=scene();p.ranks.darkrepulser=3;p.ranks.elucidator=2;p.relics=1;assert.equal(forgeState(p,'dualblades').ready,false);p.ranks.elucidator=3;p.relics=0;assert.equal(w.craft('p','dualblades'),false);p.relics=1;
 const base=scene();base.p.ranks.elucidator=3;base.w.s.enemies=[enemy(901,base.p.x+100,base.p.y)];base.w.step(.05);const baseDamage=base.p.stats.elucidator.damage,baseCooldown=base.p.cooldowns.elucidator;
 assert.equal(w.craft('p','dualblades'),true);assert.equal(p.relics,0);assert.equal(weaponLoadout(p).length,1);assert.equal(canUpgrade(p,'darkrepulser'),false);assert.equal(w.craft('p','dualblades'),false);
 w.s.enemies=[enemy(901,p.x+100,p.y)];w.step(.05);assert.ok(p.stats.dualblades.damage>baseDamage);assert.ok(p.cooldowns.elucidator<baseCooldown);assert.equal(w.s.shots.length,3);assert.ok(w.s.shots.every(b=>b.dual&&b.pierce===10));assert.ok(!w.s.shots.some(b=>b.weapon==='darkrepulser'));
});
test('left-click requests require the artifact, run once, respect cooldown and never queue retries',()=>{
 const {w,p}=scene();w.input('p',{skillSeq:1});w.step(.05);assert.equal(p.spinUntil,undefined);dual(w,p);w.step(.05);assert.equal(p.spinUntil,undefined);
 w.input('p',{skillSeq:2});w.step(.05);const start=p.spinAt,ready=p.spinReadyAt;assert.equal(p.spinUntil-start,3.5);assert.equal(ready-start,12);assert.ok(swordSpinning(p,w.s.time));
 step(w,20);w.input('p',{skillSeq:3});w.step(.05);assert.equal(p.spinAt,start);step(w,225);assert.ok(w.s.time>ready);assert.equal(p.spinAt,start,'held or rejected input must not recast after cooldown');
 w.input('p',{skillSeq:4});w.step(.05);assert.ok(p.spinAt>start);assert.equal(w.s.zones.filter(z=>z.kind==='swordstorm').length,1);
});
test('whirlwind speeds movement in both axes, damages nearby enemies and leaves damaging light trails',()=>{
 const {w,p}=scene();dual(w,p);const x=p.x,y=p.y;w.s.enemies=[enemy(901,x-100,y),enemy(902,x+600,y)];w.input('p',{x:1,y:1,skillSeq:1});w.step(.05);
 assert.ok(Math.abs(Math.hypot(p.x-x,p.y-y)-p.speed*1.65*.05)<1e-7);assert.ok(w.s.enemies[0].hp<1e6);assert.equal(w.s.enemies[1].hp,1e6);
 step(w,7);const trail=w.s.zones.find(z=>z.kind==='swordtrail');assert.ok(trail);const target=enemy(903,(trail.x+trail.tx)/2,(trail.y+trail.ty)/2);w.s.enemies.push(target);p.cooldowns.elucidator=p.cooldowns.dualwave=100;step(w,4);assert.ok(target.hp<1e6);assert.ok(p.stats.dualblades.damage>0);
 w.input('p',{x:0,y:0,skillSeq:1});step(w,65);assert.equal(swordMoveMultiplier(p,w.s.time),1);assert.equal(w.s.zones.filter(z=>z.kind==='swordstorm'||z.kind==='swordtrail').length,0);
});
test('pause freezes the active duration and cooldown; death and disconnect cancel damage and movement boost',()=>{
 const {w,p}=scene();dual(w,p);w.input('p',{skillSeq:1});w.step(.05);const time=w.s.time,until=p.spinUntil,ready=p.spinReadyAt;p.choices=['power'];step(w,20);assert.equal(w.s.time,time);assert.equal(p.spinUntil,until);assert.equal(p.spinReadyAt,ready);
 p.choices=[];p.connected=false;step(w,1);assert.equal(swordSpinning(p,w.s.time),false);assert.equal(w.s.zones.length,0);p.connected=true;assert.equal(swordSpinning(p,w.s.time),false,'reconnecting does not restore a cancelled spin');p.hp=0;assert.equal(swordMoveMultiplier(p,w.s.time),1);
});
test('active state, cooldown and consumed click survive delta transport and host takeover without replay',()=>{
 const {w,p}=scene('elucidator',2);dual(w,p);const input=cleanRealtimeInput({x:1,y:0,skillSeq:17});assert.equal(input.skillSeq,17);assert.equal(cleanRealtimeInput({skillSeq:Infinity}).skillSeq,0);
 w.input('p',input);w.step(.05);const base=packSnapshot(w.checkpoint(),{authoritative:true});step(w,6);const packet=packSnapshot(w.checkpoint(),{authoritative:true});const restored=World.restore(unpackSnapshot(applySnapshotDelta(base,snapshotDelta(base,packet,1),1))),q=restored.s.players[0];
 assert.equal(q.skillSeq,17);assert.equal(q.spinReadyAt,p.spinReadyAt);assert.equal(q.spinUntil,p.spinUntil);restored.input('p',input);step(restored,2);assert.equal(q.spinAt,p.spinAt);assert.equal(restored.s.zones.filter(z=>z.kind==='swordstorm').length,1);
 const viewState=unpackSnapshot(presentationPacket(packet));assert.equal(viewState.players[0].spinReadyAt,p.spinReadyAt);const view=new RemoteView();view.receive(viewState,'p',1);const before={...view.local};view.sample({x:0,y:1},1.05,.05);assert.ok(Math.abs(view.local.y-before.y-p.speed*1.65*.05)<.01);
});
test('four upgraded dual wielders keep whirlwind trails, projectiles and takeover packets bounded',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:String(i),weapon:'elucidator'})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){dual(w,p);Object.assign(p.ranks,{area:4,cooling:3,volley:2,linger:3});p.rate=2;p.hp=p.maxHp=1e7;p.nextXp=1e9;}
 const p=w.s.players[0];w.s.enemies=Array.from({length:180},(_,i)=>enemy(10000+i,p.x+Math.cos(i*2.4)*(100+i%5*60),p.y+Math.sin(i*2.4)*(100+i%5*60)));
 let largest=0;for(let i=0;i<300;i++){for(const p of w.s.players)w.input(p.id,{x:Math.sin(i*.05),y:Math.cos(i*.05),skillSeq:Math.floor(i/110)+1});w.step(.05);assert.ok(w.s.zones.length<=64);assert.ok(w.s.shots.length<=180);if(i%20===0)largest=Math.max(largest,JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})).length);}
 assert.ok(largest<250000,`largest checkpoint ${largest}`);assert.ok(w.s.players.every(p=>p.stats.dualblades.damage>0));
});
