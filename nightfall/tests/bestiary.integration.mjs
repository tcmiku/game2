import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {ENEMY_TYPES} from '../lib/bestiary.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',party=[];
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
try{
 const host=await call({action:'create',name:'新敌群房主',weapon:'bow'});party.push(host);
 for(let i=1;i<4;i++)party.push(await call({action:'join',code:host.code,name:'夜巡'+i,weapon:'wind'}));
 const lobby=await call({...host,action:'sync',input:{weapon:'bow'}}),w=new World(lobby.members.map(m=>({id:m.id,weapon:m.input.weapon})),()=>.42);w.spawnCd=w.eliteAt=1e9;
 for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e8;}
 const p=w.s.players[0];for(const type of Object.keys(ENEMY_TYPES).map(Number)){const e=w.spawn(type,2);e.x=p.x+110;e.y=p.y;e.speed=0;e.skillCd=0;}
 for(let i=0;i<28;i++)w.step(.05);
 await call({...host,action:'sync',status:'playing',snapshot:w.s,input:{weapon:'bow'}});const received=(await call({...party[3],action:'sync',input:{weapon:'wind'}})).snapshot;
 for(const type of Object.keys(ENEMY_TYPES).map(Number)){const e=received.enemies.find(e=>e.type===type);assert.ok(e,type);assert.equal(e.elite,2);assert.ok(Number.isFinite(e.attackAt));assert.ok(Number.isFinite(e.maxHp));}
 assert.ok(received.enemies.some(e=>e.summoner));assert.ok(received.hostile.some(b=>b.kind==='bolt'));assert.ok(received.hazards.some(h=>h.kind==='spores'));assert.equal(received.players.length,4);
 console.log('PASS: all five enemy types, elite variants, minions, sequential bolts and poison warnings synchronize in a four-player room');
}finally{for(const p of party.slice(1))await call({...p,action:'leave'});if(party[0])await call({...party[0],action:'leave'});}
