import assert from 'node:assert/strict';
import {newProfile,expeditionBoons} from '../lib/camp.mjs';
import {offerToShrine} from '../lib/sanctuary.mjs';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://localhost:5173',party=[];
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
try{
 let p=newProfile();p.embers=1000;p=offerToShrine(p,'foundation');p=offerToShrine(p,'vigor');p=offerToShrine(p,'might');
 const a=await call({action:'create',name:'庭院验证',weapon:'zmd',boons:expeditionBoons(p)});a.input={weapon:'zmd',boons:expeditionBoons(p)};party.push(a);
 const b=await call({action:'join',code:a.code,name:'同行验证',weapon:'pelican',boons:expeditionBoons(newProfile())});b.input={weapon:'pelican',boons:expeditionBoons(newProfile())};party.push(b);
 const lobby=await call({...a,action:'sync'});assert.equal(lobby.members[0].input.boons.sanctuary.foundation,2);assert.equal(lobby.members[0].input.boons.sanctuary.vigor,1);assert.equal(lobby.members[1].input.boons.sanctuary.foundation,1);
 const w=new World(lobby.members.map(m=>({id:m.id,name:m.name,index:m.slot,boons:m.input.boons,weapon:m.input.weapon})),()=>.4);assert.equal(w.s.players[0].maxHp,114);assert.equal(w.s.players[0].damage,18*1.05);assert.equal(w.s.players[1].maxHp,103);
 await call({...a,action:'sync',status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true}),lease:lobby.lease});
 const seen=await call({...b,action:'sync'});assert.equal(unpackSnapshot(seen.snapshot).players[0].maxHp,114);
 await call({...a,action:'leave'});const takeover=await call({...b,action:'sync'});assert.equal(takeover.host,true);const restored=World.restore(unpackSnapshot(takeover.snapshot));assert.equal(restored.s.players[0].maxHp,114);assert.equal(restored.s.players[1].maxHp,103);
 console.log('PASS: shrine blessings survive real room input validation, distinct player starts, guest snapshots and host takeover');
}finally{for(const p of party.reverse())await call({...p,action:'leave'}).catch(()=>{});}
