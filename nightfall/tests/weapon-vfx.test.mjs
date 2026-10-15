import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WeaponVFX,weaponStyle,drawVfx,vfxFrame,VFX_ROWS,VFX_LIMITS} from '../lib/weapon-vfx.mjs';
import {WEAPONS,RECIPES} from '../lib/equipment.mjs';
import {World} from '../lib/game.mjs';
import {HitFeedback} from '../lib/feedback.mjs';
const shot=(id,x=100,y=100)=>({id,owner:'p',weapon:'blade',x,y,scale:1,life:1,vx:500,vy:0});
function recorder(){
 const calls=[],stack=[];const c={globalAlpha:1,save(){stack.push(this.globalAlpha);},restore(){this.globalAlpha=stack.pop();},drawImage(...a){assert.ok(Number.isFinite(this.globalAlpha)&&this.globalAlpha>=0&&this.globalAlpha<=1);assert.ok(a.slice(1).every(Number.isFinite));calls.push(a);}};
 return{c:new Proxy(c,{get:(o,k)=>o[k]??((...a)=>{if(['lineTo','moveTo','translate','rotate','fillRect','scale'].includes(k))assert.ok(a.every(Number.isFinite),k);if(k==='arc'||k==='ellipse'){assert.ok(a.every(Number.isFinite));assert.ok(a[2]>=0);}calls.push([k,...a]);})}),calls};
}
test('VFX atlas has twelve complete native-pixel rows and frame sampling stays in its eight columns',async()=>{
 const png=await readFile(new URL('../public/art/pixel-weapon-vfx.png',import.meta.url));assert.equal(png.readUInt32BE(16),768);assert.equal(png.readUInt32BE(20),1152);
 const {c,calls}=recorder(),atlas={complete:true,naturalWidth:768};for(const progress of [-1,0,.13,.5,.99,1,2])for(const row of Object.keys(VFX_ROWS)){drawVfx(c,atlas,row,100,100,48,vfxFrame(progress));const args=calls.at(-1);assert.ok(args[1]>=0&&args[1]<=672);assert.ok(args[2]>=0&&args[2]<=1056);assert.equal(args[3],96);}
 assert.equal(c.globalAlpha,1);assert.equal(drawVfx(c,null,'spark',0,0,20),false);
});
test('every weapon and artifact resolves a palette and impact animation matching its primary weapon',()=>{
 for(const key of WEAPONS)assert.ok(weaponStyle(key).color&&VFX_ROWS[weaponStyle(key).row]!==undefined,key);
 for(const r of RECIPES){const style=weaponStyle(r.key);assert.equal(style.base,r.weapon);assert.equal(style.artifact,true);assert.equal(style.color,weaponStyle(r.weapon).color);}
 assert.notEqual(weaponStyle('ember').row,weaponStyle('nova').row);assert.notEqual(weaponStyle('storm').color,weaponStyle('blade').color);
});
test('visual histories are capped, expire, freeze on pause, and never mutate authoritative combat',()=>{
 const fx=new WeaponVFX(),s={time:1,shots:Array.from({length:300},(_,i)=>shot(i))};const before=JSON.stringify(s);fx.update(s,1,'p');assert.equal(JSON.stringify(s),before);assert.equal(fx.trails.size,VFX_LIMITS.trails);
 const tracked=[...fx.trails.keys()];
 for(let i=0;i<20;i++){s.time+=.01;for(const b of s.shots)b.x+=8;fx.update(s,s.time,'p');}assert.deepEqual([...fx.trails.keys()],tracked,'a full pool keeps stable trails instead of cycling every frame');assert.ok([...fx.trails.values()].every(e=>e.points.length<=VFX_LIMITS.points));
 const held=JSON.stringify([...fx.trails]);fx.update(s,s.time,'p');assert.equal(JSON.stringify([...fx.trails]),held);
 s.shots=[];fx.update(s,s.time+.2,'p');assert.equal(fx.trails.size,0);s.shots=[shot(999)];fx.update(s,0,'p');assert.equal(fx.trails.size,1);
});
test('reduced motion and offscreen culling prevent needless trail work; allied effects are quieter',()=>{
 const fx=new WeaponVFX({reducedMotion:true}),s={time:1,shots:[shot(1)]};fx.update(s,1,'p');assert.equal(fx.trails.size,0);assert.equal(fx.opacity('p'),1);assert.ok(fx.opacity('friend')<.6);
 fx.reducedMotion=false;fx.update(s,2,'p',{x:2000,y:2000,w:100,h:100});assert.equal(fx.trails.size,0);assert.ok(fx.visible(2000,2000));assert.equal(fx.visible(100,100),false);
});
test('hit records preserve source weapon and artifact palettes through snapshots without replaying effects',()=>{
 const w=new World([{id:'p',weapon:'nova'}]),p=w.s.players[0],e={id:999,x:p.x+50,y:p.y,hp:1000,maxHp:1000,type:1};p.evolutions.nova='winter';w.damage(e,10,p,p,'nova');
 const record=JSON.parse(JSON.stringify(w.s.impacts))[0];assert.equal(record.weapon,'winter');const f=new HitFeedback();f.update([record],w.s.time,'p',.01);assert.equal(f.bursts[0].row,'frost');assert.ok(f.particles.some(p=>p.color===weaponStyle('nova').color));const count=f.bursts.length;f.update([record],w.s.time+.1,'p',.01);assert.equal(f.bursts.length,count);
});
test('all phases of spells, sweeps and whips produce deterministic finite drawing commands',()=>{
 const fx=new WeaponVFX(),atlas={complete:true,naturalWidth:768};
 for(const reducedMotion of [false,true])for(const type of ['slash','lash','lightning','tempest','nova','winter','fireburst','rune','thunder','gravity','forge'])for(const t of [0,.1,.4,.8,.99]){
  const f={id:1,type,x:200,y:200,tx:310,ty:210,size:120,angle:.4,width:20,full:true,max:.6,life:.6*(1-t)};fx.reducedMotion=reducedMotion;fx.simTime=1;
  const a=recorder(),b=recorder();assert.ok(fx.drawEffect({ctx:a.c,vfxAtlas:atlas},f,1));fx.drawEffect({ctx:b.c,vfxAtlas:atlas},f,1);assert.deepEqual(a.calls,b.calls);assert.equal(a.c.globalAlpha,1);
 }
});
