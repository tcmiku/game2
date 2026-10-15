import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {RITUAL_WEAPONS} from '../lib/arsenal-ritual.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {SnapshotSender,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',party=[];
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
async function sync(p,body={}){const data=await call({...p,action:'sync',wire:2,since:p.revision,...body,input:{weapon:p.weapon,...body.input}});if(data.snapshot)p.packet=applySnapshotDelta(p.packet,data.snapshot,p.revision);Object.assign(p,{revision:data.revision,hostId:data.hostId,lease:data.lease});return data;}
try{
 const a=await call({action:'create',name:'钟波',weapon:'bell'});a.weapon='bell';party.push(a);for(const weapon of ['bloodneedle','loom','flail'])party.push({...await call({action:'join',code:a.code,name:weapon,weapon}),weapon});const lobby=await sync(a);assert.deepEqual(lobby.members.map(m=>m.input.weapon),['bell','bloodneedle','loom','flail']);
 const w=new World(lobby.members.map(m=>({id:m.id,index:m.slot,weapon:m.input.weapon})),()=>.4),sender=new SnapshotSender();w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];
 for(const p of w.s.players){p.hp=p.maxHp=10000;p.nextXp=1e9;p.ranks=Object.fromEntries(RITUAL_WEAPONS.map(key=>[key,3]));for(let i=0;i<3;i++)w.s.enemies.push({id:w.nextId(),x:p.x+85+i*35,y:p.y+(i-1)*35,type:1,hp:1e7,maxHp:1e7,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});}
 // Durable stationary targets keep knockback from moving the transport fixture
 // out of each attack's geometry; live enemy movement is covered by simulation.
 const anchors=new Map(w.s.enemies.map(e=>[e.id,{x:e.x,y:e.y}]));function advance(){for(const e of w.s.enemies){Object.assign(e,anchors.get(e.id));e.knockX=e.knockY=0;}w.step(.05);}
 async function publish(){const packet=sender.encode(packSnapshot(w.checkpoint(),{authoritative:true}),a.revision),data=await sync(a,{snapshot:packet,status:'playing'});if(packet.wire===2)applySnapshotDelta(sender.base,packet,sender.revision);assert.ok(!data.resync,JSON.stringify({base:packet.base,senderRevision:sender.revision,serverRevision:data.revision,frame:w.s.frame}));sender.acknowledge(a.revision);w.reconcileMembers(data.members);return data;}
 for(let tick=0;tick<50;tick++){for(let j=0;j<2;j++)advance();await publish();await sync(party[1]);}
 for(const key of RITUAL_WEAPONS)assert.ok(w.s.players.some(p=>p.stats[key]?.damage>0),key);
 for(const [i,key]of ['requiem','bloodfist','stormloom'].entries()){w.s.players[i].relics=1;await publish();await sync(party[i],{input:{serial:100+i,choice:key,seq:100+i}});await publish();if(i===0)w.input(a.id,{choice:key,seq:100});}
 for(let i=0;i<35;i++){advance();await publish();}
 await sync(party[3]);const seen=unpackSnapshot(party[3].packet);for(const [i,key]of ['requiem','bloodfist','stormloom'].entries()){const p=seen.players[i];assert.ok(Object.values(p.evolutions).includes(key));assert.ok(p.stats[key]?.damage>0,key);assert.equal(p.relics,0);}
 await call({...a,action:'leave'});const promoted=await sync(party[1]);assert.equal(promoted.authority,true);assert.equal(promoted.host,true);const restored=World.restore(unpackSnapshot(party[1].packet));assert.equal(restored.s.runId,w.s.runId);assert.ok(restored.s.players[1].evolutions.gauntlet==='bloodfist');assert.doesNotThrow(()=>restored.step(.02));
 console.log('PASS: four-player ritual loadouts, real damage from all six weapon types, input-driven artifact forging, delta rendering and authoritative takeover');
}finally{for(const p of party.reverse())await call({...p,action:'leave'}).catch(()=>{});}
