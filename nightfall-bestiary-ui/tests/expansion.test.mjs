import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {DEATH_TIME,ELITE_TIERS,rollElite} from '../lib/encounters.mjs';
import {weaponRanking} from '../lib/combat-stats.mjs';
import {WEAPONS,RECIPES,SMITH_ITEMS,canUpgrade,rollChoices,weaponScale,weaponCooldown} from '../lib/equipment.mjs';
import {newProfile,normalizeProfile,rescueSmith,unlockEffect} from '../lib/camp.mjs';
const enemy=(id,x,y,hp=10000)=>({id,x,y,hp,maxHp:hp,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
test('boss kills continue the expedition, record rescue, and allow later bosses',()=>{
 const w=new World(),p=w.s.players[0];w.s.time=299.99;p.hp=p.maxHp=1e6;w.step(.02);const boss=w.s.enemies.find(e=>e.type===4);assert.ok(boss);w.damage(boss,1e8,p,p,'spear');p.choices=[];w.step(.05);
 assert.equal(w.s.bossDefeated,true);assert.equal(w.s.bossKills,1);assert.equal(w.s.status,'playing');assert.ok(!w.s.enemies.includes(boss));
 w.s.time=600;p.choices=[];w.step(.01);assert.ok(w.s.enemies.some(e=>e.type===4&&e.cycle===2));assert.equal(w.s.status,'playing');
});
test('elite ranks have distinct colors and strictly increasing health on ordinary enemies',()=>{
 const w=new World([],()=>.4);w.s.players=new World().s.players;const normal=w.spawn(1,0);
 for(const tier of [1,2,3]){const e=w.spawn(1,tier);assert.equal(e.hp,normal.hp*ELITE_TIERS[tier].health);assert.equal(e.type,1);assert.equal(e.elite,tier);}
 assert.equal(new Set(Object.values(ELITE_TIERS).map(t=>t.color)).size,3);
 assert.equal(rollElite(20,()=>0),0);assert.equal(rollElite(600,()=>.01),3);
});
test('ranged enemies keep their distance, cast visible hostile orbs and damage players once per invulnerability interval',()=>{
 const w=new World(),p=w.s.players[0];w.spawnCd=1e6;p.cooldown=999;const e=w.spawn(6,0);e.x=p.x+280;e.y=p.y;e.skillCd=.01;
 const x=e.x;w.step(.02);assert.equal(e.x,x);assert.equal(w.s.hostile.length,1);assert.equal(w.s.hostile[0].kind,'orb');assert.ok(w.s.hostile[0].radius>=10);
 w.s.hostile=[{id:900,x:p.x-30,y:p.y,vx:500,vy:0,radius:11,damage:12,life:2}];w.step(.05);assert.equal(p.hp,88);assert.equal(w.s.hostile.length,0);
 w.s.hostile=[{id:901,x:p.x-30,y:p.y,vx:500,vy:0,radius:11,damage:12,life:2}];w.step(.05);assert.equal(p.hp,88);
});
test('boss rotates radial thorns, delayed ground roots and a telegraphed charge',()=>{
 const w=new World(),p=w.s.players[0];w.spawnCd=1e6;p.cooldown=999;p.hp=p.maxHp=1e6;const e=w.spawn(4);e.x=p.x+300;e.y=p.y;e.speed=0;e.skillCd=1;const seen=new Set();let thorns=false,roots=false,charge=false;
 for(let i=0;i<400;i++){w.step(.05);if(e.skill)seen.add(e.skill);thorns ||= w.s.hostile.some(b=>b.kind==='thorn');roots ||= w.s.hazards.some(h=>h.kind==='roots'&&h.wait>0);charge ||= e.chargeLeft>0;}
 assert.deepEqual([...seen].sort(),['charge','roots','thorns']);assert.ok(thorns&&roots&&charge);assert.ok(w.s.hostile.length<=160&&w.s.hazards.length<=48);
});
test('weapon stats exclude overkill and duplicate deaths, assign last blows, and sort both rankings',()=>{
 const w=new World([{id:'p'},{id:'q'}]),[p,q]=w.s.players;{const e=enemy(900,p.x+50,p.y,50);w.damage(e,30,p,p,'spear');w.damage(e,100,q,q,'bow');w.damage(e,100,q,q,'bow');}
 assert.equal(p.stats.spear.damage,30);assert.equal(p.stats.spear.kills,0);assert.equal(q.stats.bow.damage,20);assert.equal(q.stats.bow.kills,1);
 w.damage(enemy(901,p.x,p.y,5),999,p,p,'blade');assert.equal(p.stats.blade.damage,5);assert.equal(p.stats.blade.kills,1);
 assert.equal(weaponRanking(p,10,'damage')[0].key,'spear');assert.equal(weaponRanking(p,10,'kills')[0].key,'blade');assert.equal(weaponRanking(p,10)[0].dps,3);
});
test('all twenty real attack paths attribute damage to the correct weapon',()=>{
 for(const key of WEAPONS){const w=new World([{id:'p',weapon:key}],()=>.4),p=w.s.players[0];w.spawnCd=1e6;p.hp=p.maxHp=1e6;w.s.enemies=[enemy(900,p.x+85,p.y,1e6)];
  for(let i=0;i<220;i++){p.choices=[];w.step(.05);}assert.ok(p.stats[key].damage>0,key);assert.deepEqual(Object.keys(p.stats).filter(k=>p.stats[k].damage>0),[key]);}
});
test('artifact damage is attributed separately while prior weapon damage and active duration are retained',()=>{
 const w=new World(),p=w.s.players[0];w.s.time=10;w.damage(enemy(900,p.x,p.y),30,p,p,'blade');p.ranks.blade=5;p.ranks.power=1;p.relics=1;assert.ok(w.craft('solo','eclipse'));
 w.s.time=20;w.damage(enemy(901,p.x,p.y),40,p,p,'blade');assert.equal(p.stats.blade.damage,30);assert.equal(p.stats.blade.endedAt,10);assert.equal(p.stats.eclipse.damage,40);assert.equal(weaponRanking(p,20).find(r=>r.key==='blade').dps,3);
});
test('smith rescue and effect purchases persist once, and locked items cannot appear or be forced',()=>{
 const original=newProfile();assert.equal(unlockEffect(original,'area'),null);const rescued=rescueSmith(original);assert.equal(rescued.embers,original.embers+20);assert.deepEqual(rescueSmith(rescued),rescued);assert.ok(rescued.residents.includes('smith'));
 const purchased=unlockEffect(rescued,'area');assert.ok(purchased.effects.includes('area'));assert.equal(purchased.embers,rescued.embers-40);assert.equal(unlockEffect(purchased,'area'),null);assert.deepEqual(normalizeProfile(JSON.parse(JSON.stringify(purchased))),purchased);
 const w=new World(),p=w.s.players[0];p.level=10;for(let i=0;i<100;i++)assert.ok(rollChoices(p).every(k=>!SMITH_ITEMS.includes(k)));p.choices=['area'];assert.equal(w.upgrade('solo','area'),false);
 const next=new World([{id:'p',effects:purchased.effects}]).s.players[0];assert.equal(canUpgrade(next,'area'),true);assert.equal(canUpgrade(next,'cooling'),false);assert.equal(next.ranks.area,undefined,'unlocks are choices, not free starting stats');
});
test('smith items alter actual projectile dimensions, cooldowns, lifetime and projectile count',()=>{
 const make=(enhanced)=>{const w=new World([{id:'p',weapon:'spear',effects:SMITH_ITEMS}],()=>.4),p=w.s.players[0];w.spawnCd=1e6;w.s.enemies=[enemy(900,p.x+200,p.y)];if(enhanced)p.ranks={spear:1,area:4,cooling:4,linger:3,volley:2};w.step(.01);return w;};
 const plain=make(false),better=make(true),p=better.s.players[0];assert.equal(better.s.shots.length,3);assert.equal(plain.s.shots.length,1);assert.equal(better.s.shots[0].scale,1.8);assert.ok(better.s.shots[0].life>plain.s.shots[0].life);assert.ok(p.cooldowns.spear<plain.s.players[0].cooldowns.spear);assert.equal(weaponScale(p),1.8);assert.ok(Math.abs(weaponCooldown(p,1)-.68)<1e-10);
});
test('death arrives exactly at thirty minutes, ignores control, and catches and kills fleeing players',()=>{
 const w=new World(),p=w.s.players[0];w.spawnCd=1e6;w.s.time=DEATH_TIME-.06;w.step(.05);assert.equal(w.s.reaperSpawned,false);w.step(.02);assert.equal(w.s.reaperSpawned,true);const death=w.s.enemies.find(e=>e.type===7);assert.ok(death.hp>=1e9);assert.ok(death.speed>p.speed*3);
 death.frozen=100;death.stagger=100;death.slow=100;p.choices=['blade'];
 for(let i=0;i<160&&p.hp>0;i++){w.input('solo',{x:1,y:1});w.step(.05);}assert.equal(p.hp,0);w.step(.01);assert.equal(w.s.status,'over');assert.equal(w.s.enemies.filter(e=>e.type===7).length,1);
});
test('a thirty-minute cooperative run keeps snapshots and all combat pools bounded',()=>{
 let seed=123;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296),w=new World(Array.from({length:4},(_,i)=>({id:String(i),effects:SMITH_ITEMS})),random);
 for(const p of w.s.players){p.hp=p.maxHp=1e8;p.damage=130;p.magnet=600;p.ranks={};for(const r of RECIPES.filter(r=>['inferno','void','mirrordance','bastion','soulmill','typhoon'].includes(r.key))){for(const part of r.weapons)p.ranks[part.key]=3;p.relics++;assert.ok(w.craft(p.id,r.key));}p.ranks.area=2;p.ranks.cooling=2;}
 let max=0;
 for(let i=0;i<36001;i++){for(const p of w.s.players){p.choices=[];w.input(p.id,{x:Math.cos(i/200+Number(p.id)),y:Math.sin(i/200+Number(p.id))});}w.step(.05);if(i%200===0)max=Math.max(max,JSON.stringify(w.s).length);}
 assert.ok(max<220000,`snapshot ${max}`);assert.ok(w.s.reaperSpawned);assert.ok(w.s.shots.length<=180&&w.s.zones.length<=64&&w.s.beams.length<=16&&w.s.impacts.length<=96&&w.s.hostile.length<=160&&w.s.hazards.length<=48&&w.s.chests.length<=32);assert.ok(w.s.players.every(p=>Number.isFinite(p.hp)));
});
