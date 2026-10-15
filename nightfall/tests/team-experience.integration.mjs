/** Real room transport verifies shared XP, per-client presentation and authority handoff. */
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',members=[];
if(!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base))throw Error('Local verification only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
try{
 const host=await call({action:'create',name:'共享经验验证',weapon:'blade'});members.push(host);for(let i=1;i<4;i++)members.push(await call({action:'join',code:host.code,name:`队友${i}`,weapon:'blade'}));
 const w=new World(members.map(p=>({id:p.id})),()=>.4);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];for(const p of w.s.players)p.ranks={};const p=w.s.players[0];w.s.gems=[{id:900,x:p.x,y:p.y,v:7,type:'gem'}];w.step(.05);
 const a=packSnapshot(w.checkpoint(),{authoritative:true}),published=await call({...host,action:'sync',wire:2,status:'playing',snapshot:a}),views=[];
 for(const member of members.slice(1)){const seen=await call({...member,action:'sync',wire:2});views.push(seen);const s=unpackSnapshot(seen.snapshot);assert.equal(s.teamXp.xp,7);assert.equal(s.teamXp.nextXp,16);assert.ok(s.players.every(p=>p.xp===7&&p.level===1));}
 w.xp(w.s.players[2],9);w.step(.05);const b=packSnapshot(w.checkpoint(),{authoritative:true});await call({...host,action:'sync',wire:2,status:'playing',snapshot:snapshotDelta(a,b,published.revision)});
 for(const [i,member] of members.slice(1).entries()){const seen=await call({...member,action:'sync',wire:2,since:views[i].revision}),s=unpackSnapshot(applySnapshotDelta(views[i].snapshot,seen.snapshot,views[i].revision));assert.equal(s.teamXp.level,2);assert.equal(s.teamXp.xp,0);assert.equal(s.draft.pending.length,4);assert.equal(s.draft.cards.length,12);assert.ok(s.players.every(p=>p.level===2&&p.nextXp===27));}
 await call({...host,action:'leave'});members.shift();const authority=await call({...members[0],action:'sync',wire:2});assert.ok(authority.host&&authority.authority);const restored=World.restore(unpackSnapshot(authority.snapshot));assert.equal(restored.s.teamXp.level,2);assert.equal(restored.s.teamXp.xp,0);assert.ok(restored.s.players.every(p=>p.level===2));assert.equal(restored.s.draft.cards.length,12);
 console.log('PASS: one pickup gives seven total XP, all three guests see the same 7/16 bar, four players level together, deltas preserve the shared pool, and host takeover preserves one canonical meter');
}finally{for(const m of members.slice().reverse())await call({...m,action:'leave'}).catch(()=>{});}
