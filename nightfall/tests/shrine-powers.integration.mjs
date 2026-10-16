import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {newProfile,expeditionBoons} from '../lib/camp.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {hurtPlayer} from '../lib/encounters.mjs';
const base=process.env.TEST_URL||'http://localhost:5173',party=[];
async function call(body){const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();assert.ok(response.ok,`${response.status} ${data.error}`);return data;}
try{
 const profiles=Array.from({length:4},()=>newProfile());profiles[0].shrines.stride=2;profiles[0].shrines.might=1;profiles[1].shrines.stride=1;profiles[3].shrines.cadence=1;profiles[3].shrines.vigor=1;
 const host=await call({action:'create',name:'神像试炼',boons:expeditionBoons(profiles[0])});host.input={boons:expeditionBoons(profiles[0])};party.push(host);
 for(let i=1;i<4;i++)party.push(await call({action:'join',code:host.code,name:`同行${i}`,boons:expeditionBoons(profiles[i])}));
 const lobby=await call({...host,action:'sync',wire:1}),w=new World(lobby.members.map(m=>({id:m.id,boons:m.input.boons})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});
 for(const guest of party.slice(1))await call({...guest,action:'sync',wire:1,input:{serial:1,dashSeq:5,x:1,moveAt:20}});
 const data=await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});w.reconcileMembers(data.members);w.input(host.id,{dashSeq:5,x:1,moveAt:20});w.step(.02);
 assert.equal(w.s.players[0].dashSeq,5);assert.ok(w.s.players[0].dashLeft>0);assert.ok(w.s.players[1].dashLeft>0);assert.equal(w.s.players[2].dashUntil,undefined);assert.equal(w.s.players[3].dashUntil,undefined);
 const guarded=w.s.players[3];hurtPlayer(w,guarded,1e6);assert.equal(guarded.emberGuardUsed,true);
 await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});
 for(const guest of party.slice(1)){const seen=await call({...guest,action:'sync',wire:1}),state=unpackSnapshot(seen.snapshot);assert.equal(state.players[0].shrines.stride,2);assert.equal(state.players[1].shrines.stride,1);assert.equal(state.players[2].shrines.stride,0);assert.equal(state.players[0].dashSeq,5);assert.equal(state.players[3].emberGuardUsed,true);}
 await call({...host,action:'leave'});party.shift();const takeover=await call({...party[0],action:'sync',wire:1});assert.equal(takeover.host,true);const restored=World.restore(unpackSnapshot(takeover.snapshot));assert.equal(restored.s.players[3].emberGuardUsed,true);assert.equal(restored.s.players[1].dashSeq,5);const at=restored.s.players[1].dashAt;restored.input(party[0].id,{dashSeq:5,x:1});restored.step(.02);assert.equal(restored.s.players[1].dashAt,at);
 console.log('PASS: four real room members retain independent shrine abilities, gated dash input, spent ember protection and cooldown through host takeover.');
}finally{for(const p of party.slice().reverse())await call({...p,action:'leave'}).catch(()=>{});}
