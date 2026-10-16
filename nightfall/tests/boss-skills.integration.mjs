import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {BOSS_SKILLS} from '../lib/boss-skills.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',party=[];
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(base))throw Error('Local test only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();assert.ok(r.ok,data.error);return data;}
try{
 const host=await call({action:'create',name:'首领试炼 P1',weapon:'blade'});party.push(host);
 for(let i=1;i<4;i++)party.push(await call({action:'join',code:host.code,name:`首领试炼 P${i+1}`,weapon:'blade'}));
 const lobby=await call({...host,action:'sync',wire:1,input:{}});let latest;
 for(const [kind,skill] of [['roots','thornwall'],['prism','prismcage'],['halo','orbit'],['ribbon','dash']]){
  const w=new World(lobby.members.map(m=>({id:m.id,index:m.slot})),()=>.4,[]),p=w.s.players[0];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e6;}
  const e=w.spawn(4);e.bossKind=kind;e.x=p.x+320;e.y=p.y;e.speed=0;e.skillCd=0;e.skillIndex=BOSS_SKILLS[kind].indexOf(skill);e.hp=e.maxHp*.3;
  for(let i=0;i<5;i++)w.step(.05);const packet=packSnapshot(w.checkpoint(),{authoritative:true}),expected=unpackSnapshot(packet).enemies.find(n=>n.id===e.id);assert.ok(expected.bossCast);
  await call({...host,action:'sync',wire:1,status:'playing',snapshot:packet,input:{}});
  for(const peer of party.slice(1)){const data=await call({...peer,action:'sync',wire:1,input:{}}),state=unpackSnapshot(data.snapshot),seen=state.enemies.find(n=>n.id===e.id);assert.deepEqual(seen.bossCast,expected.bossCast);assert.equal(seen.windup,expected.windup);}
  for(let i=0;e.skill&&i<40;i++)w.step(.05);assert.ok(w.s.hazards.length||e.chargeLeft>0);latest=w;
  await call({...host,action:'sync',wire:1,status:'playing',snapshot:packSnapshot(w.checkpoint(),{authoritative:true}),input:{}});
  const data=await call({...party[1],action:'sync',wire:1,input:{}}),state=unpackSnapshot(data.snapshot);assert.deepEqual(state.hazards.map(h=>h.kind),w.s.hazards.map(h=>h.kind));
 }
 const e=latest.s.enemies.find(e=>e.type===4);assert.equal(e.bossChain.length,2);await call({...host,action:'leave'});party.shift();
 const promoted=await call({...party[0],action:'sync',wire:1,input:{}});assert.ok(promoted.host&&promoted.authority);const state=unpackSnapshot(promoted.snapshot),w=World.restore(state);w.reconcileMembers(promoted.members);const boss=w.s.enemies.find(n=>n.id===e.id);assert.deepEqual(boss.bossChain,e.bossChain);
 let starts=0,last=boss.chargeLeft;for(let i=0;i<80;i++){w.step(.05);if(boss.chargeLeft>0&&last<=0)starts++;last=boss.chargeLeft||0;}assert.equal(starts,2,'takeover resumes only the two pending dashes');
 console.log('PASS: all three guests receive identical locked boss warnings and active attacks; raging dash queues resume once through real host takeover.');
}finally{for(const peer of party.slice().reverse())await call({...peer,action:'leave'}).catch(()=>{});}
