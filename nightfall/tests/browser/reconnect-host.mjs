/** Local browser QA fixture with a full checkpoint and a controllable handoff. */
import {readFile,writeFile} from 'node:fs/promises';
import {World} from '../../lib/game.mjs';
import {packSnapshot} from '../../lib/network.mjs';
import {SnapshotSender} from '../../lib/snapshot-delta.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',command='/tmp/nightfall-reconnect-command';
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Browser fixture is local only');
const host=await call({action:'create',name:'前哨',weapon:'blade'});console.log('ROOM '+host.code);await writeFile(command,'run');let w,revision;const sender=new SnapshotSender();
try{while(true){const cmd=(await readFile(command,'utf8')).trim();if(cmd==='transfer'||cmd==='stop')break;
 const packet=w?sender.encode(packSnapshot(w.checkpoint(),{authoritative:true}),revision):undefined;
 const data=await call({...host,action:'sync',wire:2,since:revision,hostId:host.id,lease:host.lease,status:w?.s.status||'lobby',snapshot:packet,input:{}});revision=data.revision;if(data.resync)sender.reset();else if(packet)sender.acknowledge(revision);
 if(!w&&data.members.length>1){w=new World(data.members.map(m=>({id:m.id,name:m.name,index:m.slot})),()=>.4);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.time=120;for(const p of w.s.players){p.hp=p.maxHp=9999;p.nextXp=1e9;p.ranks=p.id===host.id?{}:{blade:3,orbit:2};p.count=p.id===host.id?0:3;p.orbit=p.id===host.id?0:2;}for(const [type,tier]of [[8,0],[9,1],[10,2],[11,0],[12,3]]){const e=w.spawn(type,tier);e.hp=e.maxHp=5000;}console.log('READY');}
 if(w){w.reconcileMembers(data.members);for(let i=0;i<5;i++)w.step(.02);}await new Promise(r=>setTimeout(r,90));
}}finally{await call({...host,action:'leave'}).catch(()=>{});console.log('HOST LEFT');}
