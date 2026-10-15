import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',party=[];
async function call(body,expected=200){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.equal(r.status,expected,data.error);return data;}
async function send(p,body={}){const data=await call({...p,action:'sync',wire:1,hostId:p.hostId,lease:p.lease,...body});p.hostId=data.hostId;p.lease=data.lease;return data;}
function ageMember(p,age){
 assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'clock fixture only targets local D1');assert.match(p.id,/^[a-f0-9-]+$/);
 const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--command',`UPDATE nightfall_members SET seen=${Date.now()-age} WHERE id='${p.id}'`],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
}
try{
 const a=await call({action:'create',name:'原房主'});party.push(a);
 const joined=await Promise.all(Array.from({length:3},(_,i)=>call({action:'join',code:a.code,name:'同行'+i})));party.push(...joined);const lobby=await send(a);assert.deepEqual(lobby.members.map(m=>m.slot).sort(),[0,1,2,3]);
 const [b,c,d]=lobby.members.filter(m=>m.id!==a.id).map(m=>party.find(p=>p.id===m.id));
 let w=new World(lobby.members.map(m=>({id:m.id,index:m.slot,weapon:'prism'})),()=>.4);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;for(const p of w.s.players){p.hp=p.maxHp=1e6;p.nextXp=1e8;p.ranks={prism:3};}
 w.s.time=160;w.s.shots.push({id:50000,owner:b.id,weapon:'blade',x:1400,y:800,vx:450,vy:0,life:2,damage:77,pierce:5,hit:[]});
 const publish=async p=>{w.step(.02);return send(p,{status:w.s.status,snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});};
 await publish(a);const runId=w.s.runId;
 // Refresh/resume keeps the same player rather than adding a fifth slot.
 const resumed=await call({...b,action:'resume',wire:1});assert.equal(resumed.members.length,4);assert.equal(resumed.host,false);assert.equal(unpackSnapshot(resumed.snapshot).runId,runId);assert.equal(unpackSnapshot(resumed.snapshot).shots[0].damage,77);
 await call({...a,action:'leave'});let received=await send(b);assert.equal(received.host,true);assert.equal(received.authority,true);assert.equal(received.members.length,3);const after=unpackSnapshot(received.snapshot);assert.equal(after.runId,runId);assert.equal(after.players.find(p=>p.id===b.id).ranks.prism,3);assert.equal(after.shots[0].pierce,5);w=World.restore(after,()=>.4);w.reconcileMembers(received.members);await publish(b);
 console.log('PASS: concurrent room slots, refresh resume, explicit host transfer and complete authoritative checkpoint');
 const oldLease=b.lease;
 // A real lost host is elected away after the lease, without user intervention.
 await new Promise(r=>setTimeout(r,4200));const elections=await Promise.all([send(c),send(d)]);assert.equal(elections[0].hostId,elections[1].hostId);assert.equal(elections[0].hostId,c.id);assert.equal(elections.filter(r=>r.host).length,1);assert.notEqual(c.lease,oldLease);
 const restored=unpackSnapshot(elections[0].snapshot);w=World.restore(restored,()=>.4);w.reconcileMembers(elections[0].members);await publish(c);
 const stale=await call({...b,lease:oldLease,hostId:b.id,action:'sync',wire:1,status:'over',snapshot:{time:0,status:'over',players:[]}});assert.equal(stale.host,false);assert.equal(stale.status,'playing');assert.equal(unpackSnapshot(stale.snapshot).runId,runId);assert.ok(unpackSnapshot(stale.snapshot).time>=160);
 await send(c,{input:{serial:100,x:1}});await send(c,{input:{serial:99,x:-1}});let roster=await send(c);assert.equal(roster.members.find(m=>m.id===c.id).input.x,1);
 const back=await call({...b,action:'resume',wire:1});assert.equal(back.host,false);assert.equal(unpackSnapshot(back.snapshot).players.find(p=>p.id===b.id).index,1);const serial=back.members.find(m=>m.id===b.id).input.serial;assert.ok(serial>=1000);await send(b,{input:{serial:1,x:-1}});roster=await publish(c);assert.equal(roster.members.find(m=>m.id===b.id).input.x,0);
 console.log('PASS: concurrent lease election, stale former-host fencing, ordered input and reconnect action fencing');
 ageMember(b,3000);roster=await publish(c);const offline=roster.members.find(m=>m.id===b.id);assert.equal(offline.connected,false);assert.equal(offline.input.x,0);w.reconcileMembers(roster.members);assert.ok(w.s.players.some(p=>p.id===b.id));
 ageMember(b,61000);await publish(c);await call({...b,action:'resume',wire:1},410);roster=await publish(c);assert.ok(!roster.members.some(m=>m.id===b.id));
 console.log('PASS: disconnected players retain a sixty-second grace period, stale movement stops, expired sessions cannot resume');
}finally{for(const p of party.reverse())await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...p,action:'leave'})}).catch(()=>{});}
