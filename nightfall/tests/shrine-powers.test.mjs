import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {newProfile,expeditionBoons} from '../lib/camp.mjs';
import {SHRINE_POWERS} from '../lib/sanctuary.mjs';
import {hurtPlayer} from '../lib/encounters.mjs';
import {hasShrine,dodgeActive,DODGE} from '../lib/shrine-powers.mjs';
import {RemoteView,packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
import {cleanRealtimeInput} from '../lib/realtime.mjs';
import {weaponRanking} from '../lib/combat-stats.mjs';
const clone=s=>JSON.parse(JSON.stringify(s));
function scene(powers={},count=1){const profile=newProfile();Object.assign(profile.shrines,powers);const w=new World(Array.from({length:count},(_,i)=>({id:i?'q':'p',boons:expeditionBoons(profile)})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;return{w,p:w.s.players[0]};}
const enemy=(id,x,y,type=1)=>({id,x,y,type,size:20,hp:1e8,maxHp:1e8,speed:0,hit:0,slow:0,orbitCd:0,phase:0});
function steps(w,n,dt=.02){for(let i=0;i<n;i++){for(const e of w.s.enemies)e.knockX=e.knockY=0;w.step(dt);}}
test('abilities are fixed from saved shrine unlocks at departure, including the default grand statue',()=>{
 const {w,p}=scene({stride:1,might:1});assert.ok(hasShrine(p,'foundation'));assert.ok(hasShrine(p,'stride'));assert.equal(hasShrine(p,'vigor'),false);
 w.input('p',{boons:{sanctuary:{vigor:10}}});w.step(.02);assert.equal(hasShrine(p,'vigor'),false);
 const bare=new World().s.players[0];assert.deepEqual(bare.shrines,{},'legacy snapshots cannot acquire powers from untrusted live inputs');
});
test('Space dash requires the unlock, covers fixed distance diagonally and consumes a press once',()=>{
 const locked=scene();locked.w.input('p',{dashSeq:1,x:1});steps(locked.w,11);assert.equal(locked.p.dashUntil,undefined);
 const {w,p}=scene({stride:1});const x=p.x,y=p.y;w.input('p',{dashSeq:1,x:1,y:1});steps(w,11);assert.ok(Math.abs(Math.hypot(p.x-x,p.y-y)-DODGE.distance)<1e-7);assert.equal(p.dashLeft,0);assert.equal(p.dashSeq,1);
 w.input('p',{dashSeq:2});w.step(.02);assert.equal(p.dashSeq,2);const at=p.dashAt;steps(w,140);assert.equal(p.dashAt,at,'holding or rejected presses cannot recast after cooldown');w.input('p',{dashSeq:3,x:0,y:0});w.step(.02);assert.ok(p.dashAt>at);assert.ok(Math.abs(p.dashDx-Math.SQRT1_2)<1e-7,'idle dodge uses last movement direction');
});
test('dash invulnerability prevents damage without consuming the once-per-run ember guard',()=>{
 const {w,p}=scene({stride:1});w.input('p',{dashSeq:1,x:1});w.step(.02);assert.ok(dodgeActive(p,w.s.time));assert.equal(hurtPlayer(w,p,1e6),false);assert.equal(p.emberGuardUsed,undefined);steps(w,15);p.hitCd=0;assert.equal(hurtPlayer(w,p,10),true);assert.equal(p.hp,p.maxHp-10);
});
test('dash sweeps stop at solid objects and respect arena limits',()=>{
 const {w,p}=scene({stride:1});w.s.props=[{id:-1,x:p.x+80,y:p.y,size:20,hp:100}];const start=p.x;w.input('p',{dashSeq:1,x:1});steps(w,11);assert.ok(p.x<start+50,'solid scenery cannot be tunneled through');
 const edge=scene({stride:1});edge.p.x=3490;edge.w.input('p',{dashSeq:1,x:1});steps(edge.w,11);assert.ok(edge.p.x<=3500);
});
test('ember guard prevents one lethal hit, grants 1.5 seconds protection and is spent for the run',()=>{
 const {w,p}=scene();assert.equal(hurtPlayer(w,p,1e6),true);assert.equal(p.hp,p.maxHp*.25);assert.equal(p.emberGuardUsed,true);assert.equal(hurtPlayer(w,p,1e6),false);steps(w,80);p.hitCd=0;assert.equal(hurtPlayer(w,p,1e6),true);assert.equal(p.hp,0);
});
test('vigor creates a healing and slowing ring after actual damage, with its own cooldown',()=>{
 const {w,p}=scene({vigor:1});p.ranks={};p.hp=40;w.s.enemies=[enemy(900,p.x+100,p.y),enemy(901,p.x+100,p.y,7)];w.s.enemies[1].speed=0;hurtPlayer(w,p,10);const hp=p.hp;steps(w,150);assert.ok(Math.abs(p.hp-(hp+p.maxHp*.12))<1e-6);assert.ok(w.s.enemies[0].slow>0);assert.equal(w.s.enemies[1].slow,0);const until=p.vigorUntil;p.hitCd=0;hurtPlayer(w,p,1);assert.equal(p.vigorUntil,until,'cooldown does not reset on each hit');
});
test('dawn releases a real piercing projectile once per cooldown and never recursively triggers itself',()=>{
 const {w,p}=scene({might:1});p.ranks={};const e=enemy(900,p.x+60,p.y),far=enemy(901,p.x+260,p.y);w.s.enemies=[e,far];w.damage(e,10,p);assert.equal(w.s.shots.filter(b=>b.kind==='shrineblade').length,1);assert.ok(w.s.shots[0].hit.includes(e.id));w.damage(e,10,p);assert.equal(w.s.shots.length,1);steps(w,30);assert.ok(far.hp<far.maxHp);assert.ok(p.stats.blessing_might.damage>0);assert.equal(weaponRanking(p,w.s.time).find(r=>r.key==='blessing_might').name,'破晓剑气');
});
test('cadence waits for enemies and launches three homing stars every eight seconds',()=>{
 const {w,p}=scene({cadence:1});p.ranks={};steps(w,100);assert.equal(w.s.shots.length,0);w.s.props=[{id:-1,prop:true,x:p.x+100,y:p.y,size:20,hp:100,maxHp:100}];w.step(.02);assert.equal(w.s.shots.length,0,'idle scenery does not spend the enemy-seeking blessing');w.s.props=[];w.s.enemies=[enemy(900,p.x+200,p.y-16)];w.step(.02);assert.equal(w.s.shots.length,3);assert.ok(w.s.shots.every(b=>b.kind==='shrinemote'&&b.homing));const ready=p.starReadyAt;steps(w,50);assert.ok(p.stats.blessing_cadence.damage>0);assert.equal(p.starReadyAt,ready);assert.equal(SHRINE_POWERS.cadence.statKey,'blessing_cadence');
});
test('pause freezes abilities, and disconnected or dead players cannot dash or run a healing ring',()=>{
 const {w,p}=scene({stride:1,vigor:1},2);hurtPlayer(w,p,10);w.input('p',{dashSeq:1,x:1});w.step(.02);const time=w.s.time,left=p.dashLeft,hp=p.hp;p.choices=['power'];steps(w,30);assert.equal(w.s.time,time);assert.equal(p.dashLeft,left);assert.equal(p.hp,hp);p.choices=[];p.connected=false;w.step(.02);assert.equal(p.dashUntil,0);assert.equal(p.vigorLeft,0);p.connected=true;assert.equal(dodgeActive(p,w.s.time),false);
});
test('presentation and delta takeover retain unlocks, spent protection, input sequence and cooldowns',()=>{
 const {w,p}=scene({stride:1,might:1},2);hurtPlayer(w,p,1e6);const before=packSnapshot(w.checkpoint(),{authoritative:true});w.input('p',cleanRealtimeInput({dashSeq:77,x:1,moveAt:20}));w.step(.02);const packet=packSnapshot(w.checkpoint(),{authoritative:true}),copy=unpackSnapshot(applySnapshotDelta(before,snapshotDelta(before,packet,1),1)),restored=World.restore(copy),q=restored.s.players[0];assert.deepEqual(q.shrines,p.shrines);assert.equal(q.dashSeq,77);assert.equal(q.emberGuardUsed,true);restored.input('p',{dashSeq:77,x:1});restored.step(.02);assert.equal(q.dashAt,p.dashAt);assert.equal(q.dashReadyAt,p.dashReadyAt);
 const view=unpackSnapshot(packSnapshot(w.checkpoint(),{presentation:true}));assert.equal(view.players[0].dashSeq,77);assert.deepEqual(view.players[0].shrines,p.shrines);assert.equal(cleanRealtimeInput({dashSeq:Infinity}).dashSeq,0);
});
test('guest dash responds in the first frame, replays unacknowledged displacement and never restarts',()=>{
 const {w,p}=scene({stride:1}),remote=new RemoteView(),x=p.x;remote.receive(clone(w.s),'p',20);const input={dashSeq:1,x:1,moveAt:20};let view=remote.sample(input,20.02,.02);assert.ok(view.players[0].x-x>14);
 w.input('p',input);w.step(.02);remote.receive(clone(w.s),'p',20.02);for(let i=2;i<=11;i++)view=remote.sample(input,20+i*.02,.02);assert.ok(Math.abs(view.players[0].x-x-156)<1e-6);
 // A delayed old acknowledgement cannot replay an already completed local dash.
 remote.receive({...clone(w.s),frame:2,time:.04},'p',20.24);assert.equal(remote.localDash,null);view=remote.sample({...input,x:0},20.26,.02);assert.ok(view.players[0].x<=x+156.001);
});

test('ghosts retain ordinary movement reconciliation but cannot predict a shrine dash',()=>{
 const {w,p}=scene({stride:1},2);p.hp=0;w.step(.02);assert.equal(p.ghost,true);
 const remote=new RemoteView(),x=p.x;remote.receive(clone(w.s),'p',20);const input={dashSeq:1,x:1,moveAt:20};remote.sample(input,20.02,.02);remote.sample(input,20.04,.02);
 w.input('p',input);w.step(.02);remote.receive(clone(w.s),'p',20.04);assert.ok(remote.history.length>0,'ordinary ghost history must survive a new packet');assert.equal(remote.localDash,null);const view=remote.sample(input,20.06,.02);assert.ok(Math.abs(view.players[0].x-x-p.speed*.85*.06)<.01);
});
