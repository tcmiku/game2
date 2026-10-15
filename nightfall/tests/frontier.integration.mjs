import assert from 'node:assert/strict';
import {World,W,H} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(body){const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();assert.ok(response.ok,data.error);return data;}
const host=await call({action:'create',name:'镜盾测试',weapon:'aegis',effects:['ward','wisdom']}),members=[host];
try{
 const guest=await call({action:'join',code:host.code,name:'远行者',weapon:'aegis',effects:['renewal','preservation']});members.push(guest);
 const lobby=await call({...host,action:'sync',input:{weapon:'aegis',effects:['ward','wisdom']}});assert.equal(lobby.members[1].input.weapon,'aegis');assert.deepEqual(lobby.members[1].input.effects,['renewal','preservation']);
 const w=new World(lobby.members.map(m=>({id:m.id,index:m.slot,weapon:m.input.weapon,effects:m.input.effects})),()=>.5),p=w.s.players[0];w.spawnCd=w.eliteAt=1e9;p.x=2800;p.y=1900;w.s.players[1].x=3000;w.s.players[1].y=2000;
 const object=w.s.props[0];w.damage(object,1000,p);w.s.hostile=[{id:w.nextId(),x:p.x+50,y:p.y,vx:-100,vy:0,radius:10,damage:15,life:3}];w.step(.05);
 await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true})});const data=await call({...guest,action:'sync',wire:1,input:{x:1,y:0,weapon:'aegis',effects:['renewal','preservation']}}),state=unpackSnapshot(data.snapshot);
 assert.equal(state.width,W);assert.equal(state.height,H);assert.equal(state.props[0].hp,0);assert.equal(state.players[0].blockedShots,1);assert.ok(state.players[0].x>2400&&state.players[0].y>1600);assert.deepEqual(state.players[1].effects,['renewal','preservation']);
 const restored=World.restore(state);restored.damage(restored.s.props[0],1000,restored.s.players[0]);assert.equal(restored.s.gems.length,w.s.gems.length);assert.equal(restored.s.props[0].broken,true);
 console.log('PASS: expanded bounds, mirror blocking, new NPC unlocks and persistent destructibles survive the real room transport and host restoration');
}finally{for(const m of members.slice(1))await call({...m,action:'leave'});await call({...host,action:'leave'});}
