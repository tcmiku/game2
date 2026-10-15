import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {newProfile,rescueSmith,unlockEffect,strengthenEffect,expeditionBoons} from '../lib/camp.mjs';
import {upgradeMax} from '../lib/equipment.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',members=[];
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(base))throw Error('Local test only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
try{
 let profile=rescueSmith(newProfile());profile.embers=2000;profile=unlockEffect(profile,'area');for(let i=0;i<3;i++)profile=strengthenEffect(profile,'area');
 const host=await call({action:'create',name:'工艺验证',weapon:'spincat',effects:profile.effects,boons:expeditionBoons(profile)});host.input={weapon:'spincat',effects:profile.effects,boons:expeditionBoons(profile)};members.push(host);
 const guest=await call({action:'join',code:host.code,name:'首领验证',weapon:'gugu',effects:['area'],boons:expeditionBoons(newProfile())});members.push(guest);
 const lobby=await call({...host,action:'sync'});assert.equal(lobby.members[0].input.boons.smithwork.area,3);assert.equal(lobby.members[1].input.boons.smithwork.area,0);
 const w=new World(lobby.members.map(m=>({id:m.id,index:m.slot,weapon:m.input.weapon,effects:m.input.effects,boons:m.input.boons})),()=>.5);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e8;}assert.equal(upgradeMax(w.s.players[0],'area'),7);assert.equal(upgradeMax(w.s.players[1],'area'),4);
 const boss=w.spawn(4);boss.bossKind='prism';boss.x=1500;boss.y=800;boss.skillCd=0;w.s.bossWarning={kind:'prism',at:0,arrive:0,until:3};for(const type of [13,14,15]){const e=w.spawn(type,1);e.x=1450;e.y=950;e.speed=0;e.skillCd=0;}for(let i=0;i<30;i++)w.step(.05);
 await call({...host,action:'sync',wire:2,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});const seen=await call({...guest,action:'sync',wire:2}),view=unpackSnapshot(seen.snapshot);assert.equal(view.players[0].smithwork.area,3);assert.equal(view.bossWarning.kind,'prism');assert.ok(view.enemies.some(e=>e.bossKind==='prism'&&e.encounterPlayers===2));assert.ok(view.hazards.some(h=>h.kind==='bossRay'));for(const type of [13,14,15])assert.ok(view.enemies.some(e=>e.type===type));
 await call({...host,action:'leave'});members.shift();const takeover=await call({...guest,action:'sync',wire:2});assert.ok(takeover.host&&takeover.authority);const state=unpackSnapshot(takeover.snapshot),restored=World.restore(state);assert.equal(restored.s.bossWarning.kind,'prism');assert.deepEqual(restored.s.hazards,state.hazards);assert.equal(upgradeMax(restored.s.players[0],'area'),7);assert.equal(upgradeMax(restored.s.players[1],'area'),4);
 console.log('PASS: smithwork passes local room input validation with distinct item caps; new boss, warning, hazards, enemy types and encounter scaling survive guest view and host takeover');
}finally{for(const m of members.slice().reverse())await call({...m,action:'leave'}).catch(()=>{});}
