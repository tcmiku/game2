import assert from 'node:assert/strict';
import {World,W,H} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {partyIndicators} from '../lib/party-compass.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
if(!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base))throw Error('Local QA only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
const host=await call({action:'create',name:'战场试炼 P1',weapon:'blade'}),party=[host];let hostLeft=false;
try{
 for(let i=1;i<4;i++)party.push(await call({action:'join',code:host.code,name:`战场试炼 P${i+1}`,weapon:'blade'}));
 const lobby=await call({...host,action:'sync',input:{}}),w=new World(lobby.members.map(m=>({id:m.id,name:m.name,index:m.slot,weapon:'blade'})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 const spots=[[2700,1800],[4950,3100],[250,200],[2700,3420]];
 for(const p of w.s.players){[p.x,p.y]=spots[p.index];p.ranks={};p.hp=p.maxHp=1e6;}
 const saved=JSON.parse(JSON.stringify(w.s.players.map(p=>({id:p.id,index:p.index,x:p.x,y:p.y}))));
 await call({...host,action:'sync',status:'playing',wire:1,snapshot:packSnapshot(w.checkpoint(),{authoritative:true}),input:{}});
 for(const peer of party.slice(1)){
  const data=await call({...peer,action:'sync',wire:1,input:{}}),state=unpackSnapshot(data.snapshot),me=state.players.find(p=>p.id===peer.id);
  assert.equal(state.width,W);assert.equal(state.height,H);assert.deepEqual(state.players.map(p=>({id:p.id,index:p.index,x:p.x,y:p.y})),saved);
  const arrows=partyIndicators(state.players,peer.id,me,1280,720,1);assert.equal(arrows.length,3);assert.ok(arrows.every(a=>a.id!==peer.id));
 }
 const p=w.s.players[1];w.input(p.id,{x:1,y:1});for(let i=0;i<10;i++)w.step(.05);assert.ok(p.x>4950&&p.y>3100);
 await call({...host,action:'sync',status:'playing',wire:1,snapshot:packSnapshot(w.checkpoint(),{authoritative:true}),input:{}});
 await call({...host,action:'leave'});hostLeft=true;
 const promoted=await call({...party[1],action:'sync',wire:1,input:{}});assert.equal(promoted.hostId,party[1].id);
 const resumed=World.restore(unpackSnapshot(promoted.snapshot));resumed.reconcileMembers(promoted.members);assert.equal(resumed.s.width,W);assert.equal(resumed.s.height,H);assert.equal(resumed.s.players.length,3);assert.deepEqual(resumed.s.players.map(p=>p.index),[1,2,3]);
 const leader=resumed.s.players.find(p=>p.id===party[1].id),arrows=partyIndicators(resumed.s.players,leader.id,leader,368,584,.64);assert.equal(arrows.length,2);assert.ok(arrows.every(a=>a.index===2||a.index===3));
 console.log('PASS: four real room members share expanded positions/bounds, see their own ally bearings, and preserve slots through host takeover.');
}finally{
 for(const peer of party.slice(1))await call({...peer,action:'leave'}).catch(()=>{});
 if(!hostLeft)await call({...host,action:'leave'}).catch(()=>{});
}
