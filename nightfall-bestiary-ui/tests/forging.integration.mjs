import assert from 'node:assert/strict';
import { World } from '../lib/game.mjs';
import { RECIPES } from '../lib/equipment.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(b){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const data=await r.json();assert.ok(r.ok,data.error);return data;}
const host=await call({action:'create',name:'合成测试房主'}),party=[host];
try{
 for(let i=1;i<4;i++)party.push(await call({action:'join',code:host.code,name:'合成测试'+i}));
 const world=new World(party.map(p=>({id:p.id})),()=>.4);
 // Forged requests cannot skip equipment requirements.
 await call({...party[1],action:'sync',input:{choice:'eclipse',seq:1}});
 let sync=await call({...host,action:'sync',status:'playing',snapshot:world.s});
 for(const m of sync.members)world.input(m.id,m.input);
 assert.deepEqual(world.s.players[1].evolutions,{});
 // Give the deterministic host simulation four different complete builds.
 for(let i=0;i<4;i++){
  const p=world.s.players[i],r=RECIPES[i];p.ranks[r.weapon]=5;p.ranks[r.item]=1;p.relics=2;
  await call({...party[i],action:'sync',input:{choice:r.key,seq:2}});
 }
 sync=await call({...host,action:'sync',input:{choice:RECIPES[0].key,seq:2},status:'playing',snapshot:world.s});
 for(const m of sync.members){world.input(m.id,m.input);world.input(m.id,m.input);}
 for(let i=0;i<4;i++){assert.equal(world.s.players[i].evolutions[RECIPES[i].weapon],RECIPES[i].key);assert.equal(world.s.players[i].relics,1);}
 await call({...host,action:'sync',status:'playing',snapshot:world.s});
 const guest=await call({...party[1],action:'sync'});
 for(let i=0;i<4;i++){assert.equal(guest.snapshot.players[i].evolutions[RECIPES[i].weapon],RECIPES[i].key);assert.equal(guest.snapshot.players[i].relics,1);}
 console.log('PASS: guest request -> room transport -> host recipe validation -> four independent evolutions -> guest snapshot; duplicate actions consume no extra chests');
}finally{for(const p of party.slice(1))await call({...p,action:'leave'});await call({...host,action:'leave'});}
