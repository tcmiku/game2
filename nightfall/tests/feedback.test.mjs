import test from 'node:test';
import assert from 'node:assert/strict';
import { World, W, H } from '../lib/game.mjs';
import { HitFeedback } from '../lib/feedback.mjs';
const make=()=>new World([{id:'p'}],()=>.4);
const enemy=(p,type=1)=>({id:42,x:p.x+100,y:p.y,hp:100,maxHp:100,type,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
const hit=(id=1,extra={})=>({id,target:id,owner:'p',x:100,y:100,dx:1,dy:0,amount:18,strength:1,killed:false,type:1,at:1,...extra});
test('damage emits one directional record and a bounded knockback impulse',()=>{
 const w=make(),p=w.s.players[0],e=enemy(p);w.damage(e,18,p);
 assert.equal(e.hp,82);assert.ok(e.hit>=.15);assert.ok(e.stagger>0);assert.ok(e.knockX>0);assert.equal(e.knockY,0);
 assert.equal(w.s.impacts[0].owner,'p');assert.equal(w.s.impacts[0].amount,18);assert.equal(w.s.impacts[0].target,e.id);
 for(let i=0;i<20;i++)w.damage(e,.1,p);assert.ok(Math.hypot(e.knockX,e.knockY)<=320.001);
});
test('projectile source controls direction and bosses resist knockback',()=>{
 const w=make(),p=w.s.players[0],normal=enemy(p),boss=enemy(p,4);
 w.damage(normal,18,p,{x:normal.x+10,y:normal.y});w.damage(boss,18,p,{x:boss.x+10,y:boss.y});
 assert.ok(normal.knockX<0);assert.ok(Math.abs(boss.knockX)<Math.abs(normal.knockX)*.2);assert.ok(boss.stagger<normal.stagger);
});
test('recoil moves the enemy, decays, and stays inside world bounds',()=>{
 const w=make(),p=w.s.players[0],e=enemy(p);p.cooldown=10;w.s.enemies.push(e);w.damage(e,18,p);const x=e.x,v=e.knockX;w.step(.02);
 assert.ok(e.x>x);assert.ok(e.knockX<v);e.x=W-71;e.y=H-71;e.knockX=e.knockY=300;w.step(.05);assert.ok(e.x<=W-70&&e.y<=H-70);
});
test('dead targets and invalid damage produce no duplicate impact or kill',()=>{
 const w=make(),p=w.s.players[0],e=enemy(p);w.damage(e,0,p);w.damage(e,NaN,p);assert.equal(w.s.impacts.length,0);
 w.damage(e,200,p);w.damage(e,200,p);assert.equal(w.s.impacts.length,1);assert.equal(w.s.kills,1);assert.equal(w.s.impacts[0].killed,true);
});
test('network snapshots retain impacts long enough for polling, then expire them',()=>{
 const w=make(),p=w.s.players[0],e=enemy(p);p.cooldown=10;w.damage(e,18,p);for(let i=0;i<6;i++)w.step(.05);
 const snapshot=JSON.parse(JSON.stringify(w.s));assert.equal(snapshot.impacts.length,1);assert.equal(snapshot.impacts[0].amount,18);
 for(let i=0;i<12;i++)w.step(.05);assert.equal(w.s.impacts.length,0);
});
test('client effects and sounds are not replayed by repeated snapshots',()=>{
 const f=new HitFeedback();f.update([hit()],1.1,'p',.016);assert.equal(f.numbers.length,1);assert.deepEqual(f.sounds,['impact']);f.sounds=[];
 f.update([hit()],1.2,'p',.016);assert.equal(f.numbers.length,1);assert.equal(f.sounds.length,0);
});
test('damage numbers belong to the local player and rapid hits are grouped',()=>{
 const f=new HitFeedback();f.update([hit(1),hit(2,{target:1,amount:12}),hit(3,{owner:'ally'})],1,'p',.016);
 assert.equal(f.numbers.length,1);assert.equal(f.numbers[0].amount,30);assert.equal(f.bursts.length,3);assert.equal(f.sounds.length,2);
});
test('stale events do not burst when resuming and reduced motion disables shaking',()=>{
 const f=new HitFeedback({reducedMotion:true});f.update([hit()],2,'p',.016);assert.equal(f.particles.length,0);
 f.update([hit(2,{at:2,killed:true})],2,'p',.016);assert.ok(f.particles.length>0);assert.deepEqual(f.offset(),{x:0,y:0});assert.deepEqual(f.sounds,['finish']);
});
test('dense fights keep client particle pools and network histories bounded',()=>{
 const f=new HitFeedback();f.update(Array.from({length:300},(_,i)=>hit(i+1,{killed:true})),1,'p',.016);
 assert.ok(f.particles.length<=240);assert.ok(f.numbers.length<=28);assert.ok(f.bursts.length<=32);assert.ok(f.sounds.length<=8);
 f.sounds=[];for(let i=0;i<60;i++)f.update([],2,'p',1/60);assert.equal(f.particles.length,0);assert.equal(f.numbers.length,0);assert.equal(f.flashes.size,0);
 const w=make(),p=w.s.players[0],e=enemy(p);e.hp=10000;for(let i=0;i<200;i++)w.damage(e,1,p);assert.equal(w.s.impacts.length,96);
});
