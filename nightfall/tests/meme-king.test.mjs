import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {RECIPES,forgeState,prioritizedRecipes,weaponLoadout,canUpgrade} from '../lib/equipment.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const ingredients=['spincat','gugu','manbo','bananacat'];
function scene(count=1){
 const w=new World(Array.from({length:count},(_,i)=>({id:String(i),weapon:'spincat'})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){for(const key of ingredients)while((p.ranks[key]||0)<5)w.applyUpgrade(p,key);p.relics=1;p.hp=p.maxHp=1e8;p.nextXp=1e9;}
 const p=w.s.players[0];w.s.enemies=Array.from({length:24},(_,i)=>({id:1000+i,x:p.x+Math.cos(i/24*Math.PI*2)*(110+i%3*65+i*.7),y:p.y+Math.sin(i/24*Math.PI*2)*(110+i%3*65+i*.7),hp:1e8,maxHp:1e8,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0}));return{w,p};
}
function step(w,n){for(let i=0;i<n;i++){for(const e of w.s.enemies)e.knockX=e.knockY=0;w.step(.05);}}
test('ready recipes are first, completed relics are last, and favorite filtering keeps its scope',()=>{
 const {p}=scene();p.ranks={wind:3,whip:3};const catalog=RECIPES.map(r=>r.key);assert.notEqual(catalog[0],'typhoon');
 const ordered=prioritizedRecipes(p);assert.equal(ordered[0].key,'typhoon');assert.deepEqual(RECIPES.map(r=>r.key),catalog,'sorting never changes the shared catalog');
 p.evolutions.wind='typhoon';p.fused.whip='typhoon';assert.equal(prioritizedRecipes(p).at(-1).key,'typhoon');
 const favorites=RECIPES.filter(r=>['memeking','typhoon'].includes(r.key));assert.equal(prioritizedRecipes(p,favorites).length,2);assert.equal(prioritizedRecipes(p,favorites)[0].key,'memeking');
});
test('meme king requires all four level-five weapons plus a chest and cannot consume existing evolutions',()=>{
 const {w,p}=scene();for(const key of ingredients){p.ranks[key]=4;assert.equal(w.craft(p.id,'memeking'),false,key);p.ranks[key]=5;}
 p.relics=0;assert.equal(w.craft(p.id,'memeking'),false);p.relics=1;
 for(const key of ingredients){p.evolutions[key]='other';assert.equal(forgeState(p,'memeking').blocked,true);assert.equal(w.craft(p.id,'memeking'),false);delete p.evolutions[key];}
 assert.equal(forgeState(p,'memeking').ready,true);assert.equal(prioritizedRecipes(p)[0].key,'memeking');
});
test('fusion turns four weapons into one, frees three slots, clears old attacks and cannot repeat',()=>{
 const {w,p}=scene();w.step(.05);assert.ok(w.s.shots.length);assert.equal(weaponLoadout(p).length,4);
 assert.equal(w.craft(p.id,'memeking'),true);assert.deepEqual(weaponLoadout(p),['spincat']);assert.equal(p.relics,0);assert.equal(w.s.shots.length,0);assert.equal(w.s.zones.length,0);
 for(const key of ingredients){assert.equal(canUpgrade(p,key),false);assert.ok(Number.isFinite(p.stats[key].endedAt));}
 for(const key of ingredients.slice(1))assert.equal(p.fused[key],'memeking');assert.equal(w.craft(p.id,'memeking'),false);
});
test('the king casts eight returning cats, six freezing waves, five cavalry and three banana bombs as one weapon',()=>{
 const {w,p}=scene();w.craft(p.id,'memeking');w.step(.05);p.cooldowns.spincat=100;
 assert.equal(w.s.shots.filter(b=>b.kind==='spincat').length,8);assert.equal(w.s.shots.filter(b=>b.kind==='manbo').length,5);assert.equal(w.s.shots.filter(b=>b.kind==='bananacat').length,3);assert.ok(w.s.shots.every(b=>b.weapon==='spincat'&&b.royal));
 const choir=w.s.zones.find(z=>z.kind==='gugu');assert.equal(choir.pulses,6);assert.equal(choir.radius,420);step(w,7);assert.ok(w.s.enemies.some(e=>e.frozen>0));step(w,12);
 assert.ok(w.s.shots.some(b=>b.kind==='spincat'&&b.recalled));assert.ok(w.s.zones.some(z=>z.kind==='cavalryTrail'));assert.ok(w.s.zones.some(z=>z.kind==='bananaPeel'&&z.royal));assert.ok(p.stats.memeking.damage>0);assert.ok(ingredients.every(key=>p.stats[key]?.damage===0));
});
test('meme king deals substantially more damage than all four full-rank base weapons together',()=>{
 const base=scene(),king=scene();king.w.craft(king.p.id,'memeking');step(base.w,240);step(king.w,240);
 const before=Object.values(base.p.stats).reduce((n,s)=>n+s.damage,0);assert.ok(before>0);assert.ok(king.p.stats.memeking.damage>before*2,`king ${king.p.stats.memeking.damage}, four bases ${before}`);
});
test('volley, area, duration and cooldown upgrades strengthen the fused attack',()=>{
 const {w,p}=scene();Object.assign(p.ranks,{volley:2,area:2,linger:2,cooling:2});p.rate=2;w.craft(p.id,'memeking');w.step(.05);
 assert.equal(w.s.shots.filter(b=>b.kind==='spincat').length,10);assert.equal(w.s.shots.filter(b=>b.kind==='manbo').length,7);assert.ok(w.s.shots.every(b=>b.scale===1.4));assert.equal(w.s.zones[0].radius,588);assert.ok(w.s.zones[0].max>4);assert.ok(p.cooldowns.spincat<1.1);
});
test('delta host takeover retains windups, returns, attribution and one-slot equipment without replaying a cast',()=>{
 const {w,p}=scene();w.craft(p.id,'memeking');w.step(.05);const base=packSnapshot(w.checkpoint(),{authoritative:true});step(w,3);const next=packSnapshot(w.checkpoint(),{authoritative:true});
 const restored=World.restore(unpackSnapshot(applySnapshotDelta(base,snapshotDelta(base,next,1),1)),()=>.4);assert.deepEqual(weaponLoadout(restored.s.players[0]),['spincat']);assert.equal(restored.s.shots.length,w.s.shots.length);
 step(w,80);step(restored,80);assert.ok(Math.abs(p.stats.memeking.damage-restored.s.players[0].stats.memeking.damage)<1);
});
test('four kings remain within entity and transport budgets; disconnect cancels every component',()=>{
 const {w}=scene(4);for(const p of w.s.players){Object.assign(p.ranks,{volley:2,area:4,linger:3,cooling:3});p.rate=2;assert.ok(w.craft(p.id,'memeking'));}
 let largest=0;for(let i=0;i<400;i++){step(w,1);assert.ok(w.s.shots.length<=180);assert.ok(w.s.zones.length<=64);if(i%20===0)largest=Math.max(largest,JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})).length);}
 assert.ok(largest<250000,`checkpoint ${largest}`);for(const p of w.s.players){assert.ok(p.stats.memeking.damage>0);p.connected=false;}step(w,1);assert.equal(w.s.shots.length,0);assert.equal(w.s.zones.length,0);
});
