import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World,W,H} from '../lib/game.mjs';
import {ARENA_ART_SCALE,arenaSpawn} from '../lib/arena.mjs';
import {partyIndicators,drawPartyCompass} from '../lib/party-compass.mjs';
import {playerStyle} from '../lib/player-style.mjs';
import {RemoteView,packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const actor=(index,x,y)=>({id:`p${index}`,index,x,y,hp:100,maxHp:100,connected:true});
const camera={x:2700,y:1800};

test('larger battlefield keeps native pixel scale, central clear spawns and bounded scattered loot',()=>{
 assert.equal(W,5400);assert.equal(H,3600);assert.equal(W*H/(3600*2400),2.25);
 const png=readFileSync(new URL('../public/art/pixel-frontier.png',import.meta.url));assert.equal(png.readUInt32BE(16)*ARENA_ART_SCALE,W);assert.equal(png.readUInt32BE(20)*ARENA_ART_SCALE,H);
 const w=new World(Array.from({length:4},(_,i)=>({id:`p${i}`})),()=>.4);
 assert.equal(w.s.props.length,70);
 for(const p of w.s.players){assert.equal(p.x,arenaSpawn(p.index).x);assert.equal(p.y,H/2);assert.ok(w.s.props.every(o=>Math.hypot(o.x-p.x,o.y-p.y)>=239));}
 assert.ok(w.s.props.every(o=>o.x>=110&&o.x<=W-110&&o.y>=110&&o.y<=H-110));
});

test('movement, dodge, ghosts and takeover respect new and already-running legacy bounds',()=>{
 for(const [width,height] of [[W,H],[3600,2400]]){
  const initial=new World([{id:'p',boons:{sanctuary:{stride:1}}},{id:'q'}],()=>.4,[]);initial.s.width=width;initial.s.height=height;initial.spawnCd=initial.eliteAt=initial.s.nextBossAt=1e9;
  const w=World.restore(unpackSnapshot(packSnapshot(initial.checkpoint(),{authoritative:true}))),p=w.s.players[0];p.x=width-120;p.y=height-120;w.s.players[1].x=width/2;w.s.players[1].y=height/2;
  const state=structuredClone(w.s),remote=new RemoteView();remote.receive(state,p.id,1);const prediction=remote.sample({x:1,y:1,dashSeq:1},1.05,.05).players[0];assert.ok(prediction.x<=width-100&&prediction.y<=height-100);
  w.input('p',{x:1,y:1,dashSeq:1});for(let i=0;i<35;i++)w.step(.05);assert.equal(p.x,width-100);assert.equal(p.y,height-100);
  for(let i=0;i<20;i++){const e=w.spawn(10,0);assert.ok(e.x<=width-90&&e.y<=height-90);}
  p.hp=0;for(let i=0;i<10;i++)w.step(.05);assert.ok(p.ghost);assert.ok(p.x<=width-100&&p.y<=height-100);assert.equal(w.s.width,width);assert.equal(w.s.height,height);
 }
});

test('arrows identify only offscreen connected allies and retain ghost rescue directions',()=>{
 const me=actor(0,2700,1800),p2=actor(1,5000,1800),p3=actor(2,2700,100),p4=actor(3,2700,3450),players=[me,p2,p3,p4];
 for(const [width,height,zoom] of [[1280,720,1],[368,584,.64],[844,390,.64]]){
  const arrows=partyIndicators(players,me.id,camera,width,height,zoom);assert.equal(arrows.length,3);assert.deepEqual(arrows.map(a=>a.edge),['right','top','bottom']);
  for(const a of arrows){assert.ok(a.x>=14&&a.x<=width-14&&a.y>=20&&a.y<=height-94);assert.equal(a.color,playerStyle(a.index).color);}
  const visible=players.map(p=>({...p,x:me.x+40*p.index,y:me.y}));assert.deepEqual(partyIndicators(visible,me.id,camera,width,height,zoom),[]);
  const offline=players.map(p=>p.id===p2.id?{...p,connected:false}:p);assert.equal(partyIndicators(offline,me.id,camera,width,height,zoom).length,2);
  const ghost=players.map(p=>p.id===p2.id?{...p,hp:0,ghost:true}:p);assert.equal(partyIndicators(ghost,me.id,camera,width,height,zoom).find(a=>a.id===p2.id).down,true);
 }
});

test('same-direction allies get separate slots; bearings follow the local actor under shifted cameras',()=>{
 for(const [width,height] of [[1280,720],[368,584],[844,390]]){
  const me=actor(0,2700,1800),players=[me,...[1,2,3].map(i=>actor(i,4500+i*30,1800+i*5))],before=JSON.stringify(players),shift={x:2800,y:1700};
  const arrows=partyIndicators(players,me.id,shift,width,height,.64);assert.equal(arrows.length,3);
  assert.ok(arrows[1].y-arrows[0].y>=36&&arrows[2].y-arrows[1].y>=36);
  for(const a of arrows){const p=players.find(p=>p.id===a.id);assert.ok(Math.abs(a.angle-Math.atan2(p.y-me.y,p.x-me.x))<1e-8);}
  assert.equal(JSON.stringify(players),before);
 }
});

test('transported positions and new dimensions survive delta snapshots and host restoration',()=>{
 const w=new World(Array.from({length:4},(_,i)=>({id:`p${i}`})),()=>.4,[]);w.s.players[1].x=5000;w.s.players[1].y=3000;
 const a=packSnapshot(w.checkpoint(),{authoritative:true});w.s.frame++;w.s.time+=.05;w.s.players[2].x=200;w.s.players[2].y=300;
 const b=packSnapshot(w.checkpoint(),{authoritative:true}),state=unpackSnapshot(applySnapshotDelta(a,snapshotDelta(a,b,1),1)),restored=World.restore(state);
 assert.equal(state.width,W);assert.equal(state.height,H);assert.equal(restored.s.players[1].x,5000);assert.equal(restored.s.players[2].y,300);
 const remote=new RemoteView();remote.receive(state,'p0',1);const shown=remote.sample({},1.05,.05),arrows=partyIndicators(shown.players,'p0',camera,1280,720,1);assert.equal(arrows.length,2);assert.ok(arrows.some(a=>a.id==='p1')&&arrows.some(a=>a.id==='p2'));
});

test('edge markers remain readable around mobile dodge, equipment and active-skill controls',()=>{
 const me=actor(0,2700,1800),players=[me,actor(1,100,3300),actor(2,120,3320),{...actor(3,140,3340),hp:0,ghost:true}];
 const blocks=[{left:14,right:160,top:423,bottom:480},{left:10,right:282,top:510,bottom:584},{left:200,right:354,top:345,bottom:452}];
 const arrows=partyIndicators(players,me.id,camera,368,584,.64,blocks);assert.equal(arrows.length,3);
 for(const a of arrows){
  assert.ok(blocks.every(b=>a.x<b.left||a.x>b.right||a.y<b.top||a.y>b.bottom),'no arrow is covered by an active control');
  assert.ok(Math.abs(a.angle-Math.atan2(players.find(p=>p.id===a.id).y-me.y,players.find(p=>p.id===a.id).x-me.x))<1e-8);
 }
 assert.equal(new Set(arrows.map(a=>`${a.x},${a.y}`)).size,3);
});

test('compass drawing is bounded and never changes authoritative data or appears in solo/end screens',()=>{
 const s={coop:true,status:'playing',players:[actor(0,2700,1800),actor(1,5000,1800)]},before=JSON.stringify(s),calls=[];
 const c=new Proxy({}, {get:(o,k)=>o[k]??((...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls.push([k,...args]);})}),r={ctx:c,w:1280,h:720,camera,combatZoom:1,positions:new Map()};
 drawPartyCompass(r,s,'p0');assert.ok(calls.some(c=>c[0]==='fillText'&&c[1]==='P2'));assert.ok(calls.length<50);assert.equal(JSON.stringify(s),before);
 for(const state of [{...s,coop:false},{...s,status:'over'},{...s,status:'victory'}]){calls.length=0;drawPartyCompass(r,state,'p0');assert.equal(calls.length,0);}
});
