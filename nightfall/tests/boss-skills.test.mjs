import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {BOSS_SKILLS,BOSS_TUNING,planBossSkill,stepBossPattern,stepBossBullet,drawBossSkillWarnings,drawBossPattern,drawBossBullet} from '../lib/boss-skills.mjs';
import {bossPhase,bossMotion} from '../lib/bosses.mjs';
import {stepHostiles,hurtPlayer} from '../lib/encounters.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
function scene(kind='roots',rage=false,count=1){
 const w=new World(Array.from({length:count},(_,i)=>({id:`p${i}`})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(const p of w.s.players){p.ranks={};p.hp=p.maxHp=1e8;p.nextXp=1e9;}
 const p=w.s.players[0],e=w.spawn(4);e.bossKind=kind;e.x=p.x+320;e.y=p.y;e.speed=0;e.skillCd=0;if(rage)e.hp=e.maxHp*.3;return{w,p,e};
}
const steps=(w,n)=>{for(let i=0;i<n;i++)w.step(.05);};
function start(w,e,skill){e.skill='';e.bossCast=null;e.bossChain=[];e.chargeLeft=0;e.skillIndex=BOSS_SKILLS[e.bossKind].indexOf(skill);e.skillCd=0;w.step(.05);assert.equal(e.skill,skill);}
function release(w,e){for(let i=0;e.skill&&i<40;i++)w.step(.05);assert.equal(e.skill,'');}

test('all twenty skills lock their warnings before damaging, then create a real attack',()=>{
 assert.equal(new Set(Object.values(BOSS_SKILLS).flat()).size,20);
 for(const [kind,skills] of Object.entries(BOSS_SKILLS))for(const skill of skills){
  const {w,p,e}=scene(kind);start(w,e,skill);const plan=structuredClone(e.bossCast),hp=p.hp;
  assert.ok(plan.duration>=BOSS_TUNING.minWarning);assert.ok(plan.marks.length||plan.shots.length||plan.lane);
  while(e.windup>.051){w.step(.05);assert.equal(p.hp,hp,`${skill}: no early hit`);assert.deepEqual(e.bossCast.marks,plan.marks);}
  release(w,e);assert.ok(w.s.hazards.length||w.s.hostile.length||e.chargeLeft>0,skill);
  // Hit the actual emitted shape, rather than invoking a synthetic damage callback.
  p.hitCd=0;const before=p.hp;
  if(e.chargeLeft>0){p.x=e.x+Math.cos(e.chargeAngle)*140;p.y=e.y+Math.sin(e.chargeAngle)*140;steps(w,5);}
  else if(w.s.hostile.length){const b=w.s.hostile[0];p.x=b.x+b.vx*.01;p.y=b.y+b.vy*.01;stepHostiles(w,.02);}
  else{
   const h=w.s.hazards.find(h=>h.kind!=='bossVolley');h.wait=0;h.tick=0;h.fired=false;w.s.hazards=[h];
   if(h.kind==='bossRing'){h.age=h.max*.5;p.x=h.x+Math.cos(h.gap+Math.PI)*(20+h.outer)/2;p.y=h.y+Math.sin(h.gap+Math.PI)*(20+h.outer)/2;}
   else if(h.kind==='bossOrbit'){h.age=.5;p.x=h.x+Math.cos(h.angle+h.age*h.rate)*h.radius;p.y=h.y+Math.sin(h.angle+h.age*h.rate)*h.radius;}
   else if(h.length){p.x=h.x+Math.cos(h.angle)*h.length*.5;p.y=h.y+Math.sin(h.angle)*h.length*.5;}
   else{p.x=h.x;p.y=h.y;}
   stepHostiles(w,0);
  }
  assert.ok(p.hp<before,`${skill}: real collision causes damage`);
 }
});

test('targeted attacks lock online living players and do not chase a dodge during their warning',()=>{
 for(const [kind,skill] of [['roots','roots'],['halo','starfall']]){
  const {w,p,e}=scene(kind,false,4);w.s.players[1].connected=false;w.s.players[2].hp=0;w.s.players[3].x+=500;start(w,e,skill);
  const marks=structuredClone(e.bossCast.marks);assert.equal(marks.length,4);
  assert.ok(marks.some(m=>m.x===p.x&&m.y===p.y));assert.ok(marks.some(m=>m.x===w.s.players[3].x));
  p.x+=350;p.y+=180;steps(w,6);assert.deepEqual(e.bossCast.marks,marks);
 }
 const {w,p,e}=scene('prism');start(w,e,'refraction');const rays=structuredClone(e.bossCast.marks);p.y+=300;steps(w,8);assert.deepEqual(e.bossCast.marks,rays);
});

test('bosses open promptly, pursue between casts and enrage creates more attacks and explicit combos',()=>{
 for(const kind of Object.keys(BOSS_SKILLS)){
  const counts=[];
  for(const rage of [false,true]){const {w,e}=scene(kind,rage);let casts=0,previous=null;
   for(let i=0;i<500;i++){w.step(.05);if(e.bossCast&&e.bossCast!==previous)casts++;previous=e.bossCast;}
   assert.ok(casts>=7,`${kind} stays aggressive`);counts.push(casts);
  }
  assert.ok(counts[1]>counts[0],`${kind}: rage ${counts}`);
  const {w,p,e}=scene(kind);e.skillCd=BOSS_TUNING.opening;e.speed=BOSS_TUNING.speed;const distance=Math.hypot(e.x-p.x,e.y-p.y);steps(w,14);assert.ok(Math.hypot(e.x-p.x,e.y-p.y)<distance);steps(w,3);assert.ok(e.bossCast);assert.ok(bossPhase(e).length>2);
  assert.ok(bossMotion({...e,skill:'',bossChain:[],chargeLeft:0},500)>0);
 }
 const {w,e}=scene('ribbon',true);start(w,e,'dash');let charges=0,last=0;for(let i=0;i<100;i++){w.step(.05);if(e.chargeLeft>0&&last<=0)charges++;last=e.chargeLeft||0;}assert.equal(charges,3);
});

test('wave gaps are usable but no longer automatically face a stationary target; walls leave escape lanes',()=>{
 for(const skill of ['halo','eclipse']){
  const {w,p,e}=scene('halo'),plan=planBossSkill(w,e,p,skill),h={...plan.marks[0],owner:e.id,wait:0,life:1,max:1,age:.5,tick:0,damage:27};
  assert.ok(Math.abs(Math.atan2(Math.sin(h.gap-plan.angle),Math.cos(h.gap-plan.angle)))>h.halfGap);
  const radius=(20+h.outer)/2;p.x=h.x+Math.cos(h.gap)*radius;p.y=h.y+Math.sin(h.gap)*radius;stepBossPattern(w,h,0,hurtPlayer);assert.equal(p.hp,p.maxHp);
  p.x=h.x+Math.cos(h.gap+Math.PI)*radius;p.y=h.y+Math.sin(h.gap+Math.PI)*radius;h.tick=0;stepBossPattern(w,h,0,hurtPlayer);assert.ok(p.hp<p.maxHp);
 }
 const {w,p,e}=scene('prism'),cage=planBossSkill(w,e,p,'prismcage');assert.equal(cage.marks.filter(m=>m.kind==='bossLine').length,3);assert.ok(cage.marks.some(m=>m.kind==='bossBurst'&&m.wait>=.7));
});

test('comets have a limited turn window, never home on ghosts, and boss death cancels all new attacks',()=>{
 const {w,p,e}=scene('halo');start(w,e,'comet');release(w,e);const b=w.s.hostile[0],speed=Math.hypot(b.vx,b.vy);p.y+=400;
 stepBossBullet(w,b,.05);assert.ok(Math.abs(Math.hypot(b.vx,b.vy)-speed)<1e-7);for(let i=0;i<20;i++)stepBossBullet(w,b,.05);const a=Math.atan2(b.vy,b.vx);p.y-=1000;stepBossBullet(w,b,.05);assert.equal(Math.atan2(b.vy,b.vx),a);
 const old={...b,homeLeft:.5};p.hp=0;stepBossBullet(w,old,.05);assert.equal(old.vx,b.vx);p.hp=p.maxHp;
 w.s.hazards=[{id:999,owner:e.id,kind:'bossOrbit',x:p.x,y:p.y,radius:200,count:4,angle:0,rate:1,wait:0,life:2,max:2,tick:0,damage:27}];e.hp=0;stepHostiles(w,.05);assert.equal(w.s.hazards.length,0);assert.equal(w.s.hostile.length,0);
});

test('freeze is capped and slow no longer permanently suppresses boss pursuit',()=>{
 const {w,p,e}=scene();e.speed=BOSS_TUNING.speed;e.skillCd=100;e.frozen=1.2;e.slow=2;w.step(.05);assert.ok(e.frozen<=.35);steps(w,7);const x=e.x;w.step(.05);assert.ok(x-e.x>BOSS_TUNING.speed*.5*.05);assert.ok(e.x>p.x);
});

test('paused casts and mid-combo takeover retain locked marks, remaining inputs and fired flags',()=>{
 for(const [kind,skill] of [['roots','thornwall'],['prism','prismcage'],['halo','orbit'],['ribbon','dash']]){
  const {w,p,e}=scene(kind,true,2);start(w,e,skill);steps(w,4);const a=packSnapshot(w.checkpoint(),{authoritative:true});p.choices=['power'];const time=w.s.time,windup=e.windup;steps(w,10);assert.equal(w.s.time,time);assert.equal(e.windup,windup);p.choices=[];steps(w,3);
  const b=packSnapshot(w.checkpoint(),{authoritative:true}),state=unpackSnapshot(applySnapshotDelta(a,snapshotDelta(a,b,1),1)),restored=World.restore(state),q=restored.s.enemies.find(n=>n.id===e.id);
  assert.deepEqual(q.bossCast,state.enemies.find(n=>n.id===e.id).bossCast);release(restored,q);assert.ok(restored.s.hazards.length||q.chargeLeft>0);const shown=unpackSnapshot(packSnapshot(restored.checkpoint(),{presentation:true}));assert.ok(shown.enemies.find(n=>n.id===q.id).bossChain||shown.hazards.length);
 }
 const {w,p,e}=scene();const h={id:999,owner:e.id,kind:'bossBurst',x:p.x,y:p.y,radius:80,wait:0,life:.4,max:.4,damage:27,fired:false};w.s.hazards=[h];stepHostiles(w,0);const saved=World.restore(unpackSnapshot(packSnapshot(w.checkpoint(),{authoritative:true}))),hp=saved.s.players[0].hp;saved.s.players[0].hitCd=0;stepHostiles(saved,.05);assert.equal(saved.s.players[0].hp,hp,'an already fired burst never repeats after takeover');
});

test('four-player raging encounters remain bounded and render every new warning and active shape',()=>{
 for(const reduced of [false,true]){
  let calls=0;const c=new Proxy({}, {get:(o,k)=>o[k]??((...args)=>{calls++;for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n),String(k));})}),r={ctx:c,feedback:{reducedMotion:reduced}};
  for(const [kind,skills] of Object.entries(BOSS_SKILLS))for(const skill of skills){
   const {w,p,e}=scene(kind,true,4);start(w,e,skill);drawBossSkillWarnings(r,w.s);release(w,e);
   for(const h of w.s.hazards){drawBossPattern(r,h);h.wait=0;stepBossPattern(w,h,.05,hurtPlayer);drawBossPattern(r,h);}
   for(const b of w.s.hostile)drawBossBullet(r,b);
   for(let i=0;i<300;i++){w.step(.05);assert.ok(w.s.hostile.length<=160&&w.s.hazards.length<=48);}
   assert.ok(JSON.stringify(packSnapshot(w.checkpoint(),{authoritative:true})).length<100000);
  }
  assert.ok(calls<20000);
 }
});

test('guest visual time smooths moving patterns without mutating authoritative hazards or advancing paused frames',()=>{
 const calls=[],c=new Proxy({}, {get:(o,k)=>o[k]??((...args)=>calls.push([k,...args]))}),r={ctx:c,weaponFX:{simTime:10}};
 const draw=(h,time)=>{calls.length=0;drawBossPattern(r,h,time);return structuredClone(calls);};
 const base={x:100,y:100,theme:'halo',wait:0,life:1,max:1,age:.4};
 for(const h of [{...base,kind:'bossRing',radius:236,outer:560,gap:0,halfGap:.5},{...base,kind:'bossOrbit',radius:280,count:4,angle:0,rate:1},{...base,kind:'bossSweep',angle:.4,fromAngle:0,sweep:1,length:650,width:30}]){
  const saved=structuredClone(h),still=draw(h,10),between=draw(h,10.1);
  assert.notDeepEqual(between,still,h.kind);assert.deepEqual(draw(h,10.1),between,'unchanged visual time freezes the pattern');assert.deepEqual(h,saved);
 }
 const pending={...base,kind:'bossOrbit',age:0,wait:.08,radius:280,count:4,angle:0,rate:1},early=draw(pending,10.04);
 assert.deepEqual(early,draw(pending,10),'pending orbit stays at its warning positions');
 const active=draw(pending,10.1),equivalent=draw({...pending,wait:0,age:.02},10),rounded=value=>JSON.parse(JSON.stringify(value,(_,v)=>typeof v==='number'?Math.round(v*1e6)/1e6:v));assert.deepEqual(rounded(active),rounded(equivalent),'only elapsed time after release advances orbit nodes');
});
