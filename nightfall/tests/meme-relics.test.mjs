import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {ARTIFACTS,WEAPONS,RECIPES,forgeState} from '../lib/equipment.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const keys=['cataclysm','polarChoir','dreamcavalry','goldenbanquet'];
function scene(key){const r=ARTIFACTS[key],w=new World([{id:'p',weapon:r.weapon}],()=>.4),p=w.s.players[0];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];p.ranks[r.weapon]=5;p.ranks[r.item]=1;p.nextXp=1e9;p.relics=1;p.hp=p.maxHp=1e7;
 w.s.enemies=Array.from({length:12},(_,i)=>({id:1000+i,x:p.x+100+(i%3)*40,y:p.y+(Math.floor(i/3)-1)*40,hp:1e8,maxHp:1e8,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0}));return{w,p,r};}
const step=(w,n)=>{for(let i=0;i<n;i++){for(const e of w.s.enemies){e.knockX=e.knockY=0;e.stagger=0;}w.step(.05);}};
test('every selectable weapon now has an artifact recipe; all new single evolutions require a real chest and exact materials',()=>{
 assert.ok(WEAPONS.every(key=>RECIPES.some(r=>r.weapon===key||r.weapons?.some(p=>p.key===key))));
 for(const key of keys){const {w,p,r}=scene(key);p.ranks[r.item]=0;assert.equal(forgeState(p,key).ready,false);p.ranks[r.item]=1;p.relics=0;assert.equal(w.craft(p.id,key),false);p.relics=1;assert.equal(w.craft(p.id,key),true);assert.equal(p.relics,0);assert.equal(w.craft(p.id,key),false);step(w,45);assert.ok(p.stats[key]?.damage>0,key);assert.equal(p.stats[r.weapon].damage,0);}
});
test('cat squad returns, choir gains five freezing waves, cavalry lays trails, and banquet chains armed peels',()=>{
 for(const key of keys){const {w,p}=scene(key);w.craft(p.id,key);w.step(.05);
  if(key==='cataclysm'){assert.equal(w.s.shots.length,5);assert.ok(w.s.shots.every(b=>b.evolved));step(w,16);assert.ok(w.s.shots.some(b=>b.recalled));}
  if(key==='polarChoir'){const z=w.s.zones[0];assert.equal(z.pulses,5);step(w,10);assert.ok(w.s.enemies.some(e=>e.frozen>0));}
  if(key==='dreamcavalry'){assert.equal(w.s.shots.length,3);step(w,10);assert.ok(w.s.zones.some(z=>z.kind==='cavalryTrail'));}
  if(key==='goldenbanquet'){assert.equal(w.s.shots.length,3);step(w,20);assert.ok(w.s.zones.some(z=>z.evolved&&z.chainAt));assert.ok(w.s.zones.filter(z=>z.kind==='bananaPeel'&&z.life>0).length<=12);}
 }
});
test('new artifact attacks preserve damage and pending phases through checkpoint restoration',()=>{
 for(const key of keys){const {w,p}=scene(key);w.craft(p.id,key);step(w,9);const saved=unpackSnapshot(JSON.parse(JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})))),restored=World.restore(saved,()=>.4);step(restored,50);step(w,50);assert.ok(Math.abs(p.stats[key].damage-restored.s.players[0].stats[key].damage)<.1,key);}
});
test('four players with all four new artifacts stay bounded during a one-minute crowded fight',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:`p${i}`})),()=>.4);w.s.props=[];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e8;p.nextXp=1e9;for(const key of keys){const r=ARTIFACTS[key];p.ranks[r.weapon]=5;p.ranks[r.item]=Math.max(p.ranks[r.item]||0,1);p.relics++;assert.ok(w.craft(p.id,key));}p.ranks.volley=2;p.ranks.area=4;p.ranks.linger=3;}
 w.s.enemies=Array.from({length:200},(_,i)=>({id:1000+i,x:1250+i%20*20,y:600+Math.floor(i/20)*30,hp:1e8,maxHp:1e8,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0}));
 for(let i=0;i<1200;i++){step(w,1);if(i%20===0){assert.ok(w.s.shots.length<=180);assert.ok(w.s.zones.length<=64);assert.ok(JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})).length<250000);}}
});
