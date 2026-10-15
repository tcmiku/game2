import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot,presentationPacket,RemoteView} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta,SnapshotSender,smallerPacket} from '../lib/snapshot-delta.mjs';
import {stepBestiaryStrafe,stepBestiaryAttack} from '../lib/bestiary.mjs';
const clone=value=>JSON.parse(JSON.stringify(value));
const packet=w=>clone(packSnapshot(w.checkpoint(),{authoritative:true}));
test('archer strafing and summoned enemies do not teleport back to the former map boundary',()=>{
 const w=new World(),p=w.s.players[0];p.x=3000;p.y=2000;const archer=w.spawn(10);archer.x=2800;archer.y=1900;archer.skill='';archer.phase=.4;stepBestiaryStrafe(archer,p,.02);assert.ok(archer.x>2700&&archer.y>1800);
 const priest=w.spawn(11);priest.x=2900;priest.y=1800;priest.skill='summon';priest.skillCd=0;stepBestiaryAttack(w,priest,p,.02);const summons=w.s.enemies.filter(e=>e.summoner===priest.id);assert.equal(summons.length,2);assert.ok(summons.every(e=>e.x>2700&&e.y>1700));
});
test('delta round trips preserve every authoritative field through spawn, despawn, mutation, reordering and schema changes',()=>{
 const w=new World([{id:'a'},{id:'b'}],()=>.4);w.spawnCd=w.eliteAt=1e9;let previous=packet(w);
 for(let i=1;i<=80;i++){
  w.s.frame++;w.s.time+=.02;w.s.players[1].xp=i;w.lastSeq.b=i;
  w.s.shots.push({id:1000+i,x:i,y:800,vx:300,vy:0,life:1,damage:33,pierce:4,hit:[]});
  if(i%2===0)w.s.shots.shift();if(i%7===0)w.s.shots.reverse();if(i%9===0)w.s.shots[0].extra=[1,2,3];
  if(i%10===0){w.s.props[i%w.s.props.length].hp=0;w.s.players[0].choices=['power'];}else w.s.players[0].choices=[];
  for(const s of w.s.shots){s.x+=.5;s.life-=.02;s.hit=[i];if(i%11===0)delete s.extra;}
  const next=packet(w),delta=clone(snapshotDelta(previous,next,i));assert.deepEqual(clone(applySnapshotDelta(previous,delta,i)),next);previous=next;
 }
 const restored=World.restore(unpackSnapshot(previous));assert.equal(restored.lastSeq.b,80);assert.equal(restored.s.shots[0].damage,33);assert.equal(restored.s.shots[0].pierce,4);
});
test('missing or mismatched bases never create a partial world and a new run sends a complete packet',()=>{
 const w=new World(),base=packet(w),untouched=clone(base);w.s.frame++;const next=packet(w),delta=snapshotDelta(base,next,1);
 assert.throws(()=>applySnapshotDelta(base,delta,0),/base mismatch/);assert.throws(()=>applySnapshotDelta(null,delta,1));
 const invalid=clone(delta);invalid.entities.props={changes:[[999,1,30]]};assert.throws(()=>applySnapshotDelta(base,invalid,1));assert.deepEqual(base,untouched);
 next.runId='new-run';assert.equal(snapshotDelta(base,next,1),next);
 const unsafe=clone(delta);unsafe.set.constructor={};assert.throws(()=>applySnapshotDelta(base,unsafe,1));
});
test('sender only uses acknowledged bases; revision changes and rejected updates force full state',()=>{
 const w=new World(),sender=new SnapshotSender(),a=packet(w);assert.equal(sender.encode(a,0),a);sender.acknowledge(1);
 w.s.frame++;const b=packet(w);assert.equal(sender.encode(b,1).wire,2);
 w.s.frame++;const c=packet(w);assert.deepEqual(clone(applySnapshotDelta(a,sender.encode(c,1),1)),c,'lost reply does not advance baseline');
 assert.equal(sender.encode(c,2).wire,1);sender.reset();assert.equal(sender.encode(c,1).wire,1);
});
test('presentation packets retain choices, stats, attack animation, prop damage and acknowledgements while excluding authority internals',()=>{
 const w=new World([{id:'a'},{id:'b'}]);w.lastSeq.b=72;w.s.players[1].choices=['ward'];w.s.players[1].attackAt=12;w.s.players[1].cooldowns.aegis=1;w.s.props[0].hit=.12;
 w.s.shots=[{id:100,x:100,y:100,vx:20,vy:10,life:1,weapon:'aegis',damage:99,pierce:5,hit:[3]}];
 const view=unpackSnapshot(clone(presentationPacket({...packet(w),_view:{private:true},_delta:{}})));
 assert.equal(view.engine,undefined);assert.equal(view._view,undefined);assert.equal(view.players[1].cooldowns,undefined);assert.deepEqual(view.players[1].choices,['ward']);assert.equal(view.ack.b,72);assert.equal(view.players[1].attackAt,12);assert.equal(view.shots[0].damage,undefined);assert.equal(view.props[0].hit,.12);assert.deepEqual(view.players[1].stats,w.s.players[1].stats);
});
test('crowded four-player delta traffic is substantially smaller in both directions, including static gems and props',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:`p${i}`}))),sender=new SnapshotSender();w.s.time=500;
 w.s.enemies=Array.from({length:240},(_,i)=>({id:1000+i,x:100+i*4,y:800,hp:100,maxHp:100,type:i%12+1,phase:.2,speed:30,skillCd:2,orbitCd:0,knockX:0,knockY:0,moving:true}));
 w.s.gems=Array.from({length:600},(_,i)=>({id:5000+i,x:i*3,y:600,v:i%100,type:'gem'}));w.s.shots=Array.from({length:180},(_,i)=>({id:3000+i,x:100+i*4,y:800,vx:200,vy:0,life:3,damage:18,owner:'p0',weapon:'blade',pierce:3,hit:[]}));
 let full=0,up=0,down=0,old=null;
 for(let i=0;i<30;i++){w.s.frame++;w.s.time+=.08;for(const e of w.s.enemies){e.x+=2.4;e.skillCd-=.08;}for(const shot of w.s.shots){shot.x+=16;shot.life-=.08;}const next=packet(w),view=presentationPacket(next);full+=JSON.stringify(next).length;up+=JSON.stringify(sender.encode(next,i)).length;sender.acknowledge(i+1);down+=JSON.stringify(smallerPacket(old,view,i)).length;old=view;}
 assert.ok(up/full<.55,`${up}/${full}`);assert.ok(down/full<.55,`${down}/${full}`);console.log(`4P traffic: uplink -${Math.round((1-up/full)*100)}%, downlink -${Math.round((1-down/full)*100)}% vs full authority packets`);
});
test('jitter buffer keeps remote motion monotonic and local input active at a 400ms snapshot cadence',()=>{
 const w=new World([{id:'a'},{id:'b'}]),view=new RemoteView();w.s.enemies=[{id:99,x:100,y:400,hp:100,moving:true}];let x=100,maxJump=0,stalls=0,last=100;
 for(let frame=0;frame<240;frame++){const now=frame/60;if(frame%24===0){w.s.time=now;w.s.frame=frame;w.s.enemies[0].x=100+now*50;view.receive(clone(w.s),'b',now);}const shown=view.sample({x:1},now,1/60);x=shown.enemies[0].x;assert.ok(x>=last-1e-8);maxJump=Math.max(maxJump,x-last);if(frame>120&&Math.abs(x-last)<1e-7)stalls++;if(frame>120)assert.equal(shown.players[1].moving,true);last=x;}
 assert.ok(maxJump<3,`largest remote step: ${maxJump}`);assert.ok(stalls<20,`stalled frames: ${stalls}`);assert.equal(view.snapshots.length,8);
});
