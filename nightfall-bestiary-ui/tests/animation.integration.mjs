import assert from 'node:assert/strict';
import { World } from '../lib/game.mjs';
import { actorPose,AnimationClock } from '../lib/animation.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(b){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const data=await r.json();assert.ok(r.ok,data.error);return data;}
const host=await call({action:'create',name:'动画房主'}),party=[host];
try{
 const guest=await call({action:'join',code:host.code,name:'动画访客'});party.push(guest);const w=new World([{id:host.id,weapon:'blade'},{id:guest.id,weapon:'prism'}],()=>.4),[p,q]=w.s.players;w.spawnCd=1e5;p.hp=q.hp=10000;
 w.s.enemies=Array.from({length:5},(_,i)=>({id:900+i,type:i+1,x:p.x+36+i*65,y:p.y+35,hp:1e5,maxHp:1e5,size:20,speed:30,hit:0,slow:0,orbitCd:0,phase:i*.8}));w.step(.05);
 await call({...host,action:'sync',status:'playing',snapshot:w.s});const received=await call({...guest,action:'sync'}),s=received.snapshot;
 for(const a of s.players){const original=w.s.players.find(p=>p.id===a.id);assert.equal(a.attackAt,original.attackAt);assert.equal(a.attackKind,original.attackKind);assert.deepEqual(actorPose(a,s.time,{player:true}),actorPose(original,w.s.time,{player:true}));}
 for(const e of s.enemies){const original=w.s.enemies.find(a=>a.id===e.id);assert.equal(e.moving,true);assert.deepEqual(actorPose(e,s.time),actorPose(original,w.s.time));}
 assert.ok(Number.isFinite(s.enemies[0].attackAt));const clock=new AnimationClock();clock.update(s.time,.016,true);const predicted=clock.update(s.time,.05,true);assert.ok(predicted>s.time&&predicted<=s.time+.16);
 console.log('PASS: host attack timestamps, facing and six actor pose types survive room transport; guest animation advances between snapshots');
}finally{for(const p of party.slice(1))await call({...p,action:'leave'});await call({...host,action:'leave'});}
