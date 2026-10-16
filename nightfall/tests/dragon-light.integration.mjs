import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {ultraActive} from '../lib/dragon-light.mjs';
const base=process.env.TEST_URL||'http://localhost:5173';
async function call(body){const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();assert.ok(response.ok,`${response.status} ${data.error}`);return data;}
const host=await call({action:'create',name:'龙光试炼'}),party=[host];
try{
 for(let i=0;i<3;i++)party.push(await call({action:'join',code:host.code,name:`试炼${i+1}`}));
 const w=new World(party.map(p=>({id:p.id,weapon:'lightrod'})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){p.ranks.lightgene=1;p.lightBond=180.05;p.relics=2;assert.equal(w.craft(p.id,'ultraman'),true);w.applyUpgrade(p,'drogon');p.ranks.drogon=p.ranks.ember=3;assert.equal(w.craft(p.id,'wyvern'),true);}
 await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});
 for(const guest of party.slice(1))await call({...guest,action:'sync',wire:1,input:{serial:1,transformSeq:7,punchSeq:11,aim:.5}});
 const data=await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});w.reconcileMembers(data.members);w.input(host.id,{transformSeq:7,punchSeq:11,aim:.5});w.step(.05);
 for(const p of w.s.players){assert.ok(ultraActive(p,w.s.time));assert.equal(p.transformSeq,7);assert.equal(p.punchSeq,11);assert.equal(p.dragon.evolved,true);}
 await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});
 for(const guest of party.slice(1)){const data=await call({...guest,action:'sync',wire:1}),state=unpackSnapshot(data.snapshot);for(const p of state.players){assert.equal(p.ultraUntil,15.05);assert.equal(p.ultraReadyAt,90.05);assert.equal(p.punchSeq,11);assert.equal(p.dragon.evolved,true);assert.equal(p.lightBond,180.1);}}
 await call({...host,action:'leave'});party.shift();const next=await call({...party[0],action:'sync',wire:1});assert.equal(next.host,true);const restored=World.restore(unpackSnapshot(next.snapshot));restored.step(.05);assert.ok(restored.s.players.every(p=>ultraActive(p,restored.s.time)));assert.ok(restored.s.players.every(p=>p.ultraAt===.05));
 console.log('PASS: four real room members receive dragon forms, shared active requests, ownership timer and cooldown; explicit host takeover preserves the active form without replay.');
}finally{for(const p of party.slice().reverse())await call({...p,action:'leave'});}
