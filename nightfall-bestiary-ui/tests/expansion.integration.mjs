import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {SMITH_ITEMS} from '../lib/equipment.mjs';
import {weaponRanking} from '../lib/combat-stats.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(b){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
const host=await call({action:'create',name:'铁匠测试',effects:['area','invalid']}),party=[host];
try{
 const guest=await call({action:'join',code:host.code,name:'远程同行',weapon:'bow',effects:['cooling','volley','invalid']});party.push(guest);
 const data=await call({...host,action:'sync',input:{effects:['area']}});const members=data.members;assert.deepEqual(members.find(m=>m.id===guest.id).input.effects,['cooling','volley']);
 const w=new World(members.map(m=>({id:m.id,weapon:m.input.weapon,effects:m.input.effects})),()=>.4),p=w.s.players.find(p=>p.id===guest.id);w.spawnCd=1e5;w.s.time=300;const boss=w.spawn(4);w.spawn(6,3);w.step(.05);w.damage(boss,1e9,p,p,'bow');
 await call({...host,action:'sync',status:'playing',snapshot:w.s,input:{effects:['area']}});const received=(await call({...guest,action:'sync',input:{effects:['cooling','volley']}})).snapshot;
 assert.ok(received.bossDefeated);assert.equal(received.status,'playing');const q=received.players.find(p=>p.id===guest.id);assert.deepEqual(q.effects,['cooling','volley']);assert.deepEqual(weaponRanking(q,received.time),weaponRanking(p,w.s.time));assert.ok(received.enemies.some(e=>e.type===6&&e.elite===3));
 w.s.time=1800;w.step(.01);await call({...host,action:'sync',status:'playing',snapshot:w.s});const end=(await call({...guest,action:'sync'})).snapshot;assert.ok(end.reaperSpawned);assert.ok(end.enemies.some(e=>e.type===7));assert.ok(Array.isArray(end.hostile)&&Array.isArray(end.hazards));
 console.log('PASS: per-player smith unlocks, DPS attribution, boss rescue, elite ranks, enemy bullets and thirty-minute death state survive room transport');
}finally{for(const p of party.slice(1))await call({...p,action:'leave'});await call({...host,action:'leave'});}
