import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot,syncDelay} from '../lib/network.mjs';
import {HostTicker,saveSession,readSession,clearSession,storedSession,connectionQuality} from '../lib/room-session.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
test('authoritative checkpoint retains projectile damage, pierce, hit targets, cooldowns, skill timing and action acknowledgements',()=>{
 const w=new World([{id:'a',index:2},{id:'b',index:3}],()=>.4);w.spawnCd=.12;w.eliteAt=700;w.s.time=601;w.s.players[0].ranks={blade:3};w.s.players[0].count=3;w.s.players[0].choices=['power'];w.input('a',{choice:'power',seq:900});const e=w.spawn(12,3);e.skill='slam';e.slamAt=601.8;
 w.s.shots=[{id:95000,owner:'a',weapon:'blade',x:1300,y:800,vx:500,vy:0,life:1,damage:48,pierce:5,hit:[e.id]}];w.s.hazards=[{id:95001,kind:'slam',x:e.x,y:e.y,radius:135,wait:.8,life:1.1,damage:40,fired:false}];
 const packet=packSnapshot(w.checkpoint(),{authoritative:true}),state=unpackSnapshot(clone(packet)),restored=World.restore(state,()=>.4);
 assert.equal(restored.s.runId,w.s.runId);assert.equal(restored.s.shots[0].damage,48);assert.equal(restored.s.shots[0].pierce,5);assert.deepEqual(restored.s.shots[0].hit,[e.id]);assert.equal(restored.s.hazards[0].damage,40);assert.equal(restored.s.enemies[0].slamAt,601.8);assert.equal(restored.eliteAt,700);assert.equal(restored.spawnCd,.12);assert.equal(restored.lastSeq.a,900);assert.ok(restored.nextId()>95001);assert.deepEqual(restored.s.players.map(p=>p.index),[2,3]);
 restored.s.players[0].choices=['power'];restored.input('a',{choice:'power',seq:900});assert.equal(restored.s.players[0].ranks.power,1,'an acknowledged action cannot apply twice after takeover');assert.doesNotThrow(()=>restored.step(.02));
});
test('missing old engine metadata has safe recovery defaults and malformed state is rejected',()=>{
 const w=new World();w.s.time=200;const restored=World.restore(clone(w.s));assert.ok(restored.eliteAt>200);assert.equal(restored.s.players[0].hp,100);assert.throws(()=>World.restore({players:[],time:2}));
});
test('briefly disconnected members retain identity, inventory and ghosts while abandoned members are removed',()=>{
 const w=new World([{id:'a'},{id:'b'}]),p=w.s.players[1];p.ranks.bow=4;
 w.reconcileMembers([{id:'a',input:{}},{id:'b',connected:false,input:{x:1}}]);assert.equal(w.s.players.length,2);assert.equal(p.index,1);assert.equal(p.ranks.bow,4);assert.equal(p.connected,false);assert.equal(w.inputs.b.x,0);p.hp=0;w.step(.02);assert.equal(p.ghost,true);
 w.reconcileMembers([{id:'b',connected:true,input:{x:1}}]);assert.equal(w.s.players.length,1);assert.equal(p.index,1);assert.equal(p.connected,true);assert.equal(w.inputs.b.x,1);
});
test('a disconnected ally cannot attack or act as a revival helper',()=>{
 const w=new World([{id:'a'},{id:'b'}],()=>.4),[p,q]=w.s.players;w.spawnCd=w.eliteAt=1e9;q.connected=false;q.ranks={blade:5};q.count=5;p.hp=0;
 for(let i=0;i<180;i++)w.step(.02);assert.equal(p.hp,0);assert.equal(p.reviveProgress,0);assert.equal(w.s.shots.length,0);
});
test('fixed authority ticker runs at 50 Hz, tolerates render inactivity, bounds catch-up and clears paused debt',()=>{
 let time=0;const ticker=new HostTicker(dt=>time+=dt,0);assert.equal(ticker.pump(19),0);assert.equal(ticker.pump(20),1);ticker.pump(1000);assert.ok(Math.abs(time-1)<1e-8);assert.equal(ticker.pump(90000),50);assert.ok(Math.abs(time-2)<1e-8);ticker.pump(91000,false);assert.equal(ticker.pump(91020),1);
});
test('resume identity is stored per tab and corrupt data cannot become a valid session',()=>{
 const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k),removeItem:k=>values.delete(k)};
 assert.equal(readSession(storage),null);saveSession(storage,{code:'a1b2c3',id:'a',token:'private-session',lease:'lease-one',serial:37,host:true});assert.equal(readSession(storage).code,'A1B2C3');assert.equal(readSession(storage).token,'private-session');assert.equal(readSession(storage).host,undefined);clearSession(storage);assert.equal(readSession(storage),null);assert.equal(storedSession({code:'bad',id:'a',token:'b'}),null);
});
test('latency feedback and host cadence adapt while guest controls keep the short input interval',()=>{
 assert.equal(connectionQuality(50),'good');assert.equal(connectionQuality(180),'fair');assert.equal(connectionQuality(300),'slow');assert.equal(connectionQuality(50,1),'reconnecting');assert.equal(syncDelay(0,10,false,0,true,50),70);assert.equal(syncDelay(0,10,false,0,false,50),40);assert.ok(syncDelay(0,10,false,0,true,300)>70);
});
