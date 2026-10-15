import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {RemoteView,packSnapshot,unpackSnapshot,syncDelay} from '../lib/network.mjs';
import {PLAYER_STYLES,playerLabel,placePlayerLabels,recolorCloth} from '../lib/player-style.mjs';
const copy=s=>JSON.parse(JSON.stringify(s));
function scene(time=10){const w=new World([{id:'host'},{id:'guest'},{id:'third'},{id:'fourth'}],()=>.4);w.spawnCd=1e6;w.s.time=time;return w;}
test('compact snapshots retain rendering, upgrades and stats while removing simulation-only projectile data',()=>{
 const w=scene();w.s.enemies=Array.from({length:100},(_,i)=>({id:100+i,x:1234.567891+i,y:745.1234567,hp:123.456789,maxHp:200,type:1,speed:45.1234567,hit:.1234567,knockX:1.234567,orbitCd:.123456789,phase:1.23456789,moving:true}));
 w.s.shots=Array.from({length:100},(_,i)=>({id:300+i,x:1234.56789,y:1234.987654,vx:123.456789,vy:456.789123,owner:'guest',weapon:'blade',life:.654321,hit:[1,2,3],damage:24,pierce:2,born:9.5}));
 w.s.players[1].choices=['power','blade','speed'];w.s.players[1].inputAt=20;w.s.players[1].inputAge=.05;
 const before=copy(w.s),wire=packSnapshot(w.s),size=JSON.stringify(wire).length,rawSize=JSON.stringify(w.s).length,s=unpackSnapshot(copy(wire));
 assert.deepEqual(w.s, before,'packing must not mutate simulation');assert.ok(size<rawSize*.6,`${size}/${rawSize}`);
 assert.equal(s.enemies.length,100);assert.equal(s.enemies[0].x,1234.568);assert.equal(s.enemies[0].hit,.123);assert.equal(s.shots[0].hit,undefined);
 assert.deepEqual(s.players[1].choices,before.players[1].choices);assert.deepEqual(s.players[1].stats,before.players[1].stats);assert.equal(s.players[1].inputAt,20);assert.equal(s.players[1].inputAge,.05);
 assert.deepEqual(s.players.map(p=>p.index),[0,1,2,3]);assert.equal(unpackSnapshot(before),before);assert.equal(unpackSnapshot(undefined),undefined);
});
test('sync cadence subtracts request latency and backs off without overlapping requests',()=>{
 assert.equal(syncDelay(100,120),30);assert.equal(syncDelay(100,220),0);assert.equal(syncDelay(100,120,true),630);assert.equal(syncDelay(100,120,false,4),600);
});
test('guest movement responds on the first frame, stops immediately and preserves host authority',()=>{
 const w=scene(),s=copy(w.s),view=new RemoteView(),p=s.players[1];view.receive(s,'guest',20);
 const a=view.sample({x:1,y:1},20.016,.016),distance=Math.hypot(a.players[1].x-p.x,a.players[1].y-p.y);
 assert.ok(Math.abs(distance-p.speed*.016)<1e-6);assert.equal(a.players[1].moving,true);
 const b=view.sample({x:0,y:0},20.032,.016);assert.equal(b.players[1].x,a.players[1].x);assert.equal(b.players[1].y,a.players[1].y);assert.equal(b.players[1].moving,false);
 assert.deepEqual(s,copy(w.s),'rendering never predicts HP, choices, damage or authoritative position');
});
test('host acknowledges movement age, reconciliation replays outstanding input and settles drift',()=>{
 const w=scene(),view=new RemoteView(),p=w.s.players[1],origin=p.x;view.receive(copy(w.s),'guest',20);
 w.input('guest',{x:1,y:0,moveAt:20});
 for(let i=1;i<=6;i++)view.sample({x:1,y:0},20+i/60,1/60);
 w.step(.05);assert.equal(p.inputAt,20);assert.equal(p.inputAge,.05);
 view.receive(copy(w.s),'guest',20.1);const a=view.sample({x:1,y:0},20.1+1/60,1/60);
 assert.ok(Math.abs(a.players[1].x-(origin+p.speed*7/60))<.01,'no rewind when the host is behind');
 const corrected=copy(w.s);corrected.time+=.05;corrected.players[1].x=origin;corrected.players[1].inputAt=20.2;corrected.players[1].inputAge=0;
 view.receive(corrected,'guest',20.2);for(let i=1;i<=40;i++)view.sample({x:0,y:0},20.2+i/60,1/60);
 assert.ok(Math.abs(view.local.x-origin)<.03,'small corrections converge smoothly');
});
test('other entities interpolate between snapshots and projectiles move rather than freezing between polls',()=>{
 const w=scene(),view=new RemoteView();w.s.enemies=[{id:99,x:100,y:300,moving:true,hp:100}];w.s.shots=[{id:100,x:200,y:300,vx:500,vy:0,life:1}];view.receive(copy(w.s),'guest',20);
 w.s.time+=.05;w.s.enemies[0].x+=5;w.s.shots[0].x+=25;view.receive(copy(w.s),'guest',20.05);
 const a=view.sample({},20.05,.016),b=view.sample({},20.075,.025);assert.ok(b.enemies[0].x>a.enemies[0].x);assert.ok(b.shots[0].x>a.shots[0].x);
 const c=view.sample({},22,.016),d=view.sample({},24,.016);assert.equal(c.enemies[0].x,d.enemies[0].x,'prediction is bounded during loss');assert.equal(c.shots[0].x,d.shots[0].x);
 w.s.enemies=[];w.s.shots=[];w.s.time+=.05;view.receive(copy(w.s),'guest',24.05);assert.equal(view.sample({},24.05,.016).enemies.length,0,'despawned enemies never reappear');
});
test('death, game end and a new run cancel prediction and reset snapshot history',()=>{
 const w=scene(),view=new RemoteView();view.receive(copy(w.s),'guest',20);view.sample({x:1},20.016,.016);
 w.s.time+=.05;w.s.players[1].hp=0;view.receive(copy(w.s),'guest',20.05);const dead=view.sample({x:1},20.1,.05);assert.equal(dead.players[1].x,w.s.players[1].x);assert.equal(dead.players[1].moving,false);
 w.s.status='over';view.receive(copy(w.s),'guest',20.1);assert.equal(view.sample({},20.2,.05).visualTime,w.s.time);
 const fresh=scene(0).s;view.receive(copy(fresh),'guest',30);assert.equal(view.previous,null);assert.equal(view.history.length,0);assert.equal(view.sample({},30,.016).visualTime,0);
});
test('four slots have distinct colors and recoloring affects cloth without altering skin or transparency',()=>{
 assert.equal(new Set(PLAYER_STYLES.map(s=>s.color)).size,4);
 const pixels=new Uint8ClampedArray([40,75,75,255,200,178,151,255,0,0,0,0]);recolorCloth(pixels,1);assert.deepEqual([...pixels.slice(0,4)],[38,62,105,255]);assert.deepEqual([...pixels.slice(4)],[200,178,151,255,0,0,0,0]);
 assert.equal(playerLabel({index:2,name:'旅人'},true),'P3 旅人 · 你');
 const labels=placePlayerLabels(Array.from({length:4},(_,i)=>({x:100+i*2,y:100,width:90})));assert.equal(new Set(labels.map(l=>l.y)).size,4,'overlapping players keep separate readable nameplates');
 const w=scene();w.s.players.shift();assert.deepEqual(w.s.players.map(p=>p.index),[1,2,3],'leaving never renumbers surviving players');
});
