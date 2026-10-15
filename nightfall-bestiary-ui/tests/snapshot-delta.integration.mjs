import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {SnapshotSender,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',party=[],timings=[];
async function call(body){const started=performance.now(),r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,`${r.status}: ${data.error}`);timings.push(performance.now()-started);return data;}
async function sync(p,body={}){const data=await call({...p,action:'sync',wire:2,since:p.revision,...body});if(data.snapshot){p.packet=applySnapshotDelta(p.packet,data.snapshot,p.revision);p.state=unpackSnapshot(p.packet);}p.revision=data.revision;p.hostId=data.hostId;p.lease=data.lease;return data;}
try{
 const host=await call({action:'create',name:'增量房主'});party.push(host);for(let i=0;i<3;i++)party.push(await call({action:'join',code:host.code,name:'同行'+i}));
 const lobby=await sync(host),w=new World(lobby.members.map(m=>({id:m.id,index:m.slot,weapon:'aegis'})),()=>.4),sender=new SnapshotSender();w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.time=600;
 w.s.enemies=Array.from({length:180},(_,i)=>({id:1000+i,x:1800+i%10*20,y:800+Math.floor(i/10)*20,type:1,hp:1e6,maxHp:1e6,size:20,speed:10,phase:.123,orbitCd:0}));w.s.gems=Array.from({length:500},(_,i)=>({id:5000+i,x:100+i*5,y:100,v:i%100+1,type:'gem'}));w.s.shots=[{id:9000,owner:party[1].id,weapon:'blade',x:1600,y:900,vx:500,vy:0,life:5,damage:77,pierce:5,hit:[]}];
 let fullBytes=0,upBytes=0,downBytes=0,deltaUp=0,deltaDown=0;
 for(let tick=0;tick<35;tick++){
  w.s.frame++;w.s.time+=.08;for(const e of w.s.enemies)e.x-=.8;w.s.shots[0].x+=40;w.s.shots[0].life-=.08;w.s.players[1].xp=tick;w.lastSeq[party[1].id]=tick;
  if(tick===10)w.damage(w.s.props[0],1000,w.s.players[0]);
  const full=packSnapshot(w.checkpoint(),{authoritative:true}),upload=sender.encode(full,host.revision);fullBytes+=JSON.stringify(full).length;upBytes+=JSON.stringify(upload).length;if(upload.wire===2)deltaUp++;
  const ack=await sync(host,{snapshot:upload,status:'playing'});assert.equal(ack.resync,undefined);sender.acknowledge(ack.revision);
  for(const [i,p]of party.slice(1).entries()){
   if(i===2&&tick%5!==0)continue;const data=await sync(p,{input:{serial:tick+1,x:1,weapon:'aegis'}});if(data.snapshot?.wire===2)deltaDown++;if(i===0)downBytes+=JSON.stringify(data.snapshot).length;
   assert.equal(p.state.time,Math.round(w.s.time*1000)/1000);assert.equal(p.state.players[1].xp,tick);assert.equal(p.state.ack[party[1].id],tick);assert.equal(p.state.engine,undefined);assert.equal(p.state.shots[0].damage,undefined);assert.equal(p.state.props[0].hp,tick>=10?0:w.s.props[0].hp);
  }
 }
 assert.ok(deltaUp>30&&deltaDown>40);assert.ok(upBytes/fullBytes<.55);assert.ok(downBytes/fullBytes<.55);
 // A host heartbeat carrying only input must retain the complete checkpoint,
 // rather than taking the guest-only lightweight SQL read path.
 await sync(host,{input:{serial:77,x:0}});const preserved=await call({...party[1],action:'sync',wire:1});assert.equal(unpackSnapshot(preserved.snapshot).shots[0].damage,77);assert.equal(unpackSnapshot(preserved.snapshot).engine.lastSeq[party[1].id],34);
 // A duplicate accepted request whose reply was lost must request recovery,
 // rather than silently merging an old base into the current world.
 const previous=host.revision;w.s.frame++;const full=packSnapshot(w.checkpoint(),{authoritative:true}),upload=sender.encode(full,previous);await sync(host,{snapshot:upload,status:'playing'});const rejected=await sync(host,{snapshot:upload,status:'over'});assert.equal(rejected.resync,true);assert.equal(rejected.status,'playing');sender.reset();await sync(host,{snapshot:sender.encode(full,host.revision),status:'playing'});sender.acknowledge(host.revision);
 const reconnect=await call({...party[1],action:'resume',wire:2});assert.equal(reconnect.snapshot.wire,1);assert.ok(unpackSnapshot(reconnect.snapshot).players.length===4);
 const old=await call({...party[2],action:'sync',wire:1});assert.equal(unpackSnapshot(old.snapshot).shots[0].damage,77);assert.equal(old.snapshot._view,undefined);
 await call({...host,action:'leave'});const promoted=await sync(party[1]);assert.equal(promoted.host,true);assert.equal(promoted.authority,true);assert.equal(promoted.snapshot.wire,1);const recovered=World.restore(party[1].state);assert.equal(recovered.s.shots[0].damage,77);assert.equal(recovered.s.shots[0].pierce,5);assert.equal(recovered.s.props[0].hp,0);assert.equal(recovered.lastSeq[party[1].id],34);assert.equal(recovered.s.runId,w.s.runId);
 timings.sort((a,b)=>a-b);console.log(`PASS: 4P real delta transport, missed-packet fallback, rejected-base recovery, resume, legacy compatibility and full host takeover; uplink -${Math.round((1-upBytes/fullBytes)*100)}%, guest downlink -${Math.round((1-downBytes/fullBytes)*100)}%; local HTTP p50 ${timings[Math.floor(timings.length*.5)].toFixed(1)}ms, p95 ${timings[Math.floor(timings.length*.95)].toFixed(1)}ms`);
}finally{for(const p of party.reverse())await call({...p,action:'leave'}).catch(()=>{});}
