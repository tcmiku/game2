import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {hurtPlayer} from '../lib/encounters.mjs';
import {enemyExperience,dropsChest,chestWeapon,normalizeFavorites,wantedUpgrade,readyWeapons} from '../lib/run-rules.mjs';
import {newProfile,settleRun,smithOnDeath,mayReturn} from '../lib/camp.mjs';
import {RemoteView,packSnapshot,unpackSnapshot} from '../lib/network.mjs';
function party(){const w=new World([{id:'host'},{id:'guest'}],()=>.05);w.spawnCd=w.eliteAt=1e9;for(const p of w.s.players){p.ranks={};p.nextXp=1e8;}return w;}
const step=(w,n)=>{for(let i=0;i<n;i++)w.step(.05);};
test('elite experience scales with the actual body and tier; ordinary enemies retain their base',()=>{
 for(const type of [1,2,3,5,6,8,9,10,11,12]){const values=[0,1,2,3].map(elite=>enemyExperience({type,elite}));assert.equal(values[1],values[0]*6);assert.equal(values[2],values[0]*12);assert.equal(values[3],values[0]*20);}
 assert.equal(enemyExperience({type:4}),100);
});
test('only elites roll rare chests, bosses always drop one, and the reaper never does',()=>{
 for(const type of [1,2,3,6,8,9,10,11,12])assert.equal(dropsChest({type,elite:0},()=>0),false);
 for(const [elite,expected]of [[1,120],[2,180],[3,250]]){let count=0;for(let i=0;i<1000;i++)count+=dropsChest({type:8,elite},()=>i/1000);assert.equal(count,expected);}
 assert.equal(dropsChest({type:5},()=>.5),false);assert.equal(dropsChest({type:5},()=>.01),true);assert.equal(dropsChest({type:7,elite:3},()=>0),false);assert.equal(dropsChest({type:4},()=>{throw Error('no boss roll');}),true);
});
test('collecting a boss chest upgrades exactly one owned eligible weapon per living player and only once',()=>{
 const w=party(),[p,q]=w.s.players;p.ranks={blade:4,orbit:5,bow:2};p.count=4;q.ranks={storm:1};q.storm=1;
 const e=w.spawn(4);e.x=p.x;e.y=p.y;w.damage(e,1e9,p);assert.equal(w.s.chests.length,1);w.damage(e,1e9,p);assert.equal(w.s.chests.length,1);w.step(.05);
 assert.deepEqual(p.ranks,{blade:5,orbit:5,bow:2});assert.equal(p.count,5);assert.equal(q.ranks.storm,2);assert.equal(q.storm,2);assert.equal(p.relics,1);assert.equal(q.relics,1);assert.equal(p.lastChestUpgrade.key,'blade');step(w,2);assert.equal(p.count,5);
 p.evolutions={blade:'eclipse'};p.fused={bow:'thunderbow'};assert.equal(chestWeapon(p,()=>0),null);assert.equal(p.relics,1);
});
test('a chest cannot leave a pending level choice pointing at an already maxed weapon',()=>{
 const w=party(),p=w.s.players[0];p.ranks={blade:4};p.count=4;w.s.chests.push({id:9,x:p.x,y:p.y,value:1});w.step(.05);p.choices=['blade'];p.ranks.blade=4;p.count=4;
 // Collected chests may coincide with an XP-triggered choice in the same frame.
 p.choices=[];p.nextXp=1;p.xp=0;w.s.gems.push({id:10,x:p.x,y:p.y,v:1,type:'gem'});w.s.chests.push({id:11,x:p.x,y:p.y});w.step(.05);assert.equal(p.ranks.blade,5);assert.ok(!p.choices.includes('blade'));
});
test('a cooperative death creates a mobile harmless ghost and clears all owned attacks',()=>{
 const w=party(),[p,q]=w.s.players;q.x+=500;p.hp=0;w.s.shots.push({owner:p.id,life:2});w.s.zones.push({owner:p.id,life:2});w.s.beams.push({owner:p.id,life:2});w.input(p.id,{x:1});const x=p.x;w.step(.05);
 assert.equal(p.ghost,true);assert.equal(p.deaths,1);assert.ok(p.x>x);assert.equal(p.hp,0);assert.equal(hurtPlayer(w,p,100),false);assert.equal(w.s.shots.length+w.s.zones.length+w.s.beams.length,0);w.xp(p,100);assert.equal(p.xp,0);assert.equal(mayReturn(w.s,p),false);
 const e=w.spawn(1);const hp=e.hp;w.damage(e,100,p);assert.equal(e.hp,hp);step(w,5);assert.equal(p.deaths,1);
});
test('a nearby living teammate revives a ghost after three seconds with half health and protection',()=>{
 const w=party(),[p,q]=w.s.players;p.hp=0;const ranks={...p.ranks};step(w,59);assert.equal(p.hp,0);assert.ok(p.reviveProgress>2.9);w.step(.05);assert.equal(p.hp,50);assert.equal(p.ghost,false);assert.ok(p.hitCd>1.8);assert.deepEqual(p.ranks,ranks);assert.equal(p.revives,1);assert.equal(p.deaths,1);
 p.hitCd=0;hurtPlayer(w,p,1e6);w.step(.05);assert.equal(p.deaths,2);assert.equal(p.ghost,true);
});
test('moving away resets revival progress; a defeated whole party returns instead of reviving',()=>{
 const w=party(),[p,q]=w.s.players;p.hp=0;step(w,30);assert.ok(p.reviveProgress>1);q.x+=300;w.step(.05);assert.equal(p.reviveProgress,0);q.hp=0;w.step(.05);assert.equal(w.s.status,'over');assert.equal(mayReturn(w.s,p),true);
});
test('any cooperative upgrade freezes enemy movement, skills, attacks and combat time until everyone chooses',()=>{
 const w=party(),[p,q]=w.s.players;const e=w.spawn(12);w.s.hostile.push({id:80,x:100,y:100,vx:300,vy:0,life:4,radius:5});p.choices=['power'];q.choices=['speed'];const before=JSON.stringify({enemies:w.s.enemies,hostile:w.s.hostile});const t=w.s.time;step(w,20);
 assert.equal(w.s.time,t);assert.equal(e.x,JSON.parse(before).enemies[0].x);assert.equal(w.s.hostile[0].x,100);assert.equal(w.s.hostile[0].life,4);assert.ok(p.choiceTime>.9);w.input(p.id,{choice:'power',seq:10});w.step(.05);assert.equal(w.s.time,t);w.input(q.id,{choice:'speed',seq:11});w.step(.05);assert.ok(w.s.time>t);assert.equal(w.s.upgradePaused,false);
});
test('cooperative choice timeouts remain live while paused and snapshots with the same combat time still update',()=>{
 const w=party(),p=w.s.players[0],view=new RemoteView();p.choices=['power'];w.step(.05);view.receive(unpackSnapshot(packSnapshot(w.s)),p.id,1);const t=w.s.time;step(w,279);assert.equal(p.choices.length,0);assert.ok(p.ranks.power);assert.equal(w.s.time,t);view.receive(unpackSnapshot(packSnapshot(w.s)),p.id,15);assert.equal(view.latest.players[0].choices.length,0);
 w.step(.05);p.choices=['speed'];w.step(.05);view.receive(unpackSnapshot(packSnapshot(w.s)),p.id,15.1);const held=view.sample({x:1},15.15,.05);assert.equal(held.players[0].x,p.x);assert.equal(held.visualTime,w.s.time);
});
test('the first personal death unlocks the smith once with a small welcome grant; a boss kill does not',()=>{
 const profile=newProfile();assert.equal(smithOnDeath(profile,{hp:100,deaths:0,bossDefeated:true}),profile);const dead=smithOnDeath(profile,{hp:0,deaths:1});assert.ok(dead.residents.includes('smith'));assert.equal(dead.embers,80);assert.equal(smithOnDeath(dead,{hp:0,deaths:2}),dead);
});
test('embers reward survival and kills in modest amounts, cap a long run, and settle once',()=>{
 const normal=settleRun(newProfile(),'one',{time:600,bossKills:1},{kills:600});assert.equal(normal.reward,35);assert.equal(settleRun(normal.profile,'one',{time:600},{kills:600}).reward,0);assert.equal(settleRun(normal.profile,'two',{time:1801,bossKills:5},{kills:100000}).reward,120);
});
test('artifact favorites normalize, identify missing materials, and ready recipes highlight every participating weapon',()=>{
 const favorites=normalizeFavorites(['solar','solar','bogus','eclipse']);assert.deepEqual(favorites,['solar','eclipse']);const p={ranks:{blade:2,spear:3},evolutions:{},fused:{},relics:1};assert.equal(wantedUpgrade(p,'blade',favorites),true);assert.equal(wantedUpgrade(p,'spear',favorites),false);assert.deepEqual(readyWeapons(p),[]);p.ranks.blade=3;assert.deepEqual(readyWeapons(p),['spear','blade']);p.fused.blade='solar';assert.deepEqual(readyWeapons(p),[]);
});
