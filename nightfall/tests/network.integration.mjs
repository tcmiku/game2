import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',times=[];
async function call(body){const start=performance.now(),r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,`${r.status} ${data.error}`);times.push(performance.now()-start);return data;}
const host=await call({action:'create',name:'同名旅人'}),party=[host];
try{
 for(let i=0;i<3;i++)party.push(await call({action:'join',code:host.code,name:'同名旅人'}));
 const w=new World(party.map(p=>({id:p.id,name:'同名旅人',weapon:'blade'})),()=>.4);w.spawnCd=1e6;
 w.s.enemies=Array.from({length:100},(_,i)=>({id:1000+i,x:1400+i%10*12,y:750+Math.floor(i/10)*12,type:1,hp:1e6,maxHp:1e6,size:20,speed:10,phase:.123456789,orbitCd:0}));
 let revision;let rawBytes=0,wireBytes=0;
 for(let tick=0;tick<40;tick++){
  const received=await Promise.all(party.slice(1).map((p,i)=>call({...p,action:'sync',wire:1,input:{x:1,y:i%2,moveAt:20+i,choice:'',seq:0}})));
  if(tick>1)for(const data of received){const s=unpackSnapshot(data.snapshot);assert.ok(s.time>0);assert.deepEqual(s.players.map(p=>p.index),[0,1,2,3]);assert.equal(s.players[1].inputAt,20);}
  const result=await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.s)});revision=result.revision;
  assert.deepEqual(result.members.map(m=>m.id),party.map(p=>p.id),'slots stay in join order despite out-of-order heartbeats');
  for(const m of result.members)if(m.id!==host.id)w.input(m.id,m.input);
  w.step(.05);rawBytes+=JSON.stringify(w.s).length;wireBytes+=JSON.stringify(packSnapshot(w.s)).length;
 }
 const latest=await call({...party[1],action:'sync',wire:1});assert.equal(latest.snapshot.wire,1);
 const repeat=await call({...party[1],action:'sync',wire:1,since:revision});assert.equal(repeat.snapshot,undefined,'unchanged snapshots are not retransmitted');
 const legacy=await call({...party[2],action:'sync'});assert.ok(legacy.snapshot.players);assert.ok(legacy.snapshot.enemies);assert.equal(legacy.snapshot.wire,undefined);
 times.sort((a,b)=>a-b);console.log(`PASS: 4-player packed sync, input acknowledgement, stable colors, duplicate suppression and legacy compatibility; average payload reduction ${Math.round((1-wireBytes/rawBytes)*100)}%; HTTP p50 ${times[Math.floor(times.length*.5)].toFixed(1)}ms, p95 ${times[Math.floor(times.length*.95)].toFixed(1)}ms`);
}finally{for(const p of party.slice(1).reverse())await call({...p,action:'leave'});await call({...host,action:'leave'});}
