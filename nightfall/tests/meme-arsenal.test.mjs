import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {createDestructibles,ARENA_W,ARENA_H} from '../lib/frontier.mjs';
import {packSnapshot,unpackSnapshot,presentationPacket,RemoteView} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
import {stepHostiles} from '../lib/encounters.mjs';
function rng(seed){return()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);}
function scene(key,rank=1){const w=new World([{id:'p',weapon:key}],rng(9)),p=w.s.players[0];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];p.nextXp=1e9;p.ranks[key]=rank;return{w,p};}
function foe(w,x,y,hp=1e6){const e={id:w.nextId(),type:1,x,y,hp,maxHp:hp,size:20,speed:0,slow:0,hit:0,orbitCd:0,phase:0};w.s.enemies.push(e);return e;}
function freeze(w){for(const e of w.s.enemies){e.knockX=e.knockY=0;e.stagger=0;}}
const advance=(w,n)=>{for(let i=0;i<n;i++){freeze(w);w.step(.05);}};
test('spinning cats fly away, pierce separate targets once and use swept collision at high speed',()=>{
 const {w,p}=scene('spincat');const a=foe(w,p.x+100,p.y-10),b=foe(w,p.x+190,p.y-10);w.step(.05);p.ranks={};const shot=w.s.shots[0];shot.vx=4000;w.step(.05);
 assert.deepEqual(shot.hit,[a.id,b.id]);assert.ok(shot.x>p.x+200);const damage=p.stats.spincat.damage;advance(w,4);assert.equal(p.stats.spincat.damage,damage);assert.equal(p.stats.blade,undefined);
});
test('penguin waves damage once per wave, leave their centers hollow and gain a fourth wave at rank four',()=>{
 for(const rank of [1,4]){const {w,p}=scene('gugu',rank),e=foe(w,p.x+130,p.y);w.step(.05);p.ranks={};const z=w.s.zones[0];advance(w,8);const before=e.hp;assert.equal(z.pulse,0);assert.ok(z.hit.includes(e.id));advance(w,3);assert.equal(e.hp,before);
  w.guards=[];w.guard(p,'gugu',{kind:'ring',x:z.x,y:z.y,radius:140,inner:120});w.s.hostile=[{id:w.nextId(),x:z.x,y:z.y,vx:0,vy:0,life:1,radius:4,damage:1,kind:'orb',sourceType:6}];stepHostiles(w,.01);assert.equal(w.s.hostile.length,1);
  advance(w,60);assert.ok(Math.abs(p.stats.gugu.damage-p.damage*(.65+rank*.16)*(rank>=4?4:3))<1e-6);assert.equal(w.s.zones.length,0);
 }
});
test('little horse winds up without canceling bullets, then charges and deals attributed damage',()=>{
 const {w,p}=scene('manbo');const e=foe(w,p.x+160,p.y);w.step(.05);p.ranks={};const b=w.s.shots[0],x=b.x;assert.equal(b.active,false);assert.equal(w.guards.length,0);advance(w,4);assert.equal(b.x,x);advance(w,5);assert.ok(b.x>x+100);assert.ok(e.hp<e.maxHp);assert.ok(p.stats.manbo.damage>0);
});
test('banana cat follows an arc, drops armed-on-delay peels and slides enemies once',()=>{
 const {w,p}=scene('bananacat');foe(w,p.x+160,p.y);w.step(.05);p.ranks={};const b=w.s.shots[0];advance(w,4);assert.ok(b.y<p.y-70);advance(w,7);assert.equal(w.s.shots.length,0);const peels=w.s.zones;assert.equal(peels.length,3);assert.ok(peels.every(z=>!z.triggered));
 w.s.enemies=[];advance(w,6);const z=peels[0],e=foe(w,z.x,z.y);advance(w,1);assert.ok(z.triggered);assert.equal(e.slow,2.4);assert.ok(e.knockX>200);const damage=p.stats.bananacat.damage;w.s.zones=[z];advance(w,2);assert.equal(p.stats.bananacat.damage,damage);
});
test('all meme attacks stop on owner death or disconnect without changing damage statistics',()=>{
 for(const key of ['spincat','gugu','manbo','bananacat'])for(const mode of ['dead','offline']){const {w,p}=scene(key);foe(w,p.x+180,p.y);w.step(.05);const damage=p.stats[key].damage;if(mode==='dead'){w.s.players.push({...p,id:'ally',x:1800,ranks:{},stats:{},cooldowns:{}});p.hp=0;}else p.connected=false;advance(w,60);assert.equal(p.stats[key].damage,damage,key);assert.equal(w.s.shots.length,0);assert.equal(w.s.zones.length,0);}
});
test('each new run scatters seventy props with safe spawns, spacing, unique IDs and bounded fallback',()=>{
 for(const random of [rng(42),rng(43),()=>0,()=>.5,()=>.999]){const props=createDestructibles(random);assert.equal(props.length,70);assert.equal(new Set(props.map(p=>p.id)).size,70);for(const [i,p] of props.entries()){assert.ok(p.x>=110&&p.x<=ARENA_W-110&&p.y>=110&&p.y<=ARENA_H-110);for(let slot=0;slot<4;slot++)assert.ok(Math.hypot(p.x-1200-slot*65,p.y-800)>=239);for(const q of props.slice(i+1))assert.ok(Math.hypot(q.x-p.x,q.y-p.y)>=104);}}
 assert.notDeepEqual(createDestructibles(rng(42)),createDestructibles(rng(43)));assert.deepEqual(createDestructibles(rng(42)),createDestructibles(rng(42)));
});
test('randomized props and live meme attacks survive authoritative deltas, guest snapshots and takeover',()=>{
 const {w,p}=scene('spincat');p.ranks={spincat:3,gugu:4,manbo:3,bananacat:4};w.s.props=createDestructibles(rng(77));foe(w,p.x+180,p.y);advance(w,14);w.damage(w.s.props[0],100,p);
 const a=packSnapshot(w.checkpoint(),{authoritative:true});advance(w,3);const b=packSnapshot(w.checkpoint(),{authoritative:true}),packet=applySnapshotDelta(a,snapshotDelta(a,b,5),5),saved=unpackSnapshot(packet);
 let calls=0;const restored=World.restore(saved,()=>{calls++;return .2;});assert.equal(calls,0,'restoring existing props must not reroll');assert.deepEqual(restored.s.props,saved.props);assert.deepEqual(restored.s.zones,saved.zones);assert.deepEqual(restored.s.shots,saved.shots);
 const view=unpackSnapshot(presentationPacket(packet)),remote=new RemoteView();remote.receive(view,'p',0);assert.deepEqual(remote.sample({},.01,.01).props,view.props);assert.deepEqual(view.props.map(({id,x,y,hp,broken})=>({id,x,y,hp,broken})),saved.props.map(({id,x,y,hp,broken})=>({id,x,y,hp,broken})));
 p.ranks={};restored.s.players[0].ranks={};advance(w,10);advance(restored,10);for(const key of ['spincat','gugu','manbo','bananacat'])assert.ok(Math.abs((p.stats[key]?.damage||0)-(restored.s.players[0].stats[key]?.damage||0))<.01,key);
});
test('four full meme builds stay bounded and below the multiplayer transport budget',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:String(i),weapon:'spincat'})),rng(12));w.s.props=[];w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){p.ranks={spincat:5,gugu:5,manbo:5,bananacat:5,blade:5,bow:5,area:4,linger:3,cooling:4,volley:2};p.count=5;p.hitCd=1e9;p.nextXp=1e9;}
 for(let i=0;i<100;i++)foe(w,1450+(i%10)*30,650+Math.floor(i/10)*30);
 for(let i=0;i<600;i++){freeze(w);w.step(.05);if(i%40===0){assert.ok(w.s.shots.length<=180);assert.ok(w.s.zones.length<=64);assert.ok(JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})).length<220000);}}
});
