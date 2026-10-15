/** Real local room transport: new starter IDs, randomized props, delta views and host handoff. */
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
if(!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base))throw Error('Local test only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
const keys=['spincat','gugu','manbo','bananacat'],members=[];
try{
 const host=await call({action:'create',name:'猫咪测试',weapon:keys[0]});members.push(host);for(const [i,key] of keys.slice(1).entries())members.push(await call({action:'join',code:host.code,name:'兵装测试'+i,weapon:key}));
 const lobby=await call({...host,action:'sync',input:{weapon:keys[0]}});assert.deepEqual(lobby.members.map(m=>m.input.weapon),keys);
 const w=new World(lobby.members.map(m=>({id:m.id,index:m.slot,weapon:m.input.weapon})));w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){p.ranks=Object.fromEntries(keys.map(k=>[k,4]));p.nextXp=1e9;p.hitCd=1e9;}
 w.s.enemies=[{id:w.nextId(),x:1430,y:800,hp:1e8,maxHp:1e8,type:1,size:20,speed:0,slow:0,hit:0,orbitCd:0}];for(let i=0;i<14;i++)w.step(.05);w.damage(w.s.props[0],100,w.s.players[0]);
 let response=await call({...host,action:'sync',wire:2,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});let guest=await call({...members[1],action:'sync',wire:2});const before=guest.snapshot;assert.equal(before.wire,1);const view=unpackSnapshot(before);assert.deepEqual(view.props.map(p=>[p.id,p.x,p.y,p.hp]),w.s.props.map(p=>[p.id,p.x,p.y,p.hp]));assert.ok(view.zones.some(z=>z.kind==='gugu'));assert.ok(view.zones.some(z=>z.kind==='bananaPeel'));
 const revision=guest.revision,authority=packSnapshot(w.checkpoint(),{authoritative:true});for(let i=0;i<4;i++)w.step(.05);response=await call({...host,action:'sync',wire:2,status:'playing',snapshot:snapshotDelta(authority,packSnapshot(w.checkpoint(),{authoritative:true}),response.revision)});guest=await call({...members[1],action:'sync',wire:2,since:revision});const shown=unpackSnapshot(applySnapshotDelta(before,guest.snapshot,revision));assert.deepEqual(shown.props.map(p=>[p.id,p.x,p.y,p.hp]),w.s.props.map(p=>[p.id,p.x,p.y,p.hp]));
 await call({...host,action:'leave'});members.shift();const takeover=await call({...members[0],action:'sync',wire:2});assert.ok(takeover.host&&takeover.authority);const saved=unpackSnapshot(takeover.snapshot),restored=World.restore(saved,()=>{throw Error('takeover rerolled props');});assert.deepEqual(restored.s.props,saved.props);assert.ok(restored.s.props[0].broken);for(const key of keys)assert.ok(restored.s.players.some(p=>p.ranks[key]===4));
 console.log('PASS: four meme starters, live attacks, random prop positions, broken state, guest deltas and host takeover through local room API');
}finally{for(const m of members.slice().reverse())await call({...m,action:'leave'}).catch(()=>{});}
