import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {UPGRADES,forgeState,weaponLoadout,WEAPON_ATLAS_ROWS} from '../lib/equipment.mjs';
import {hurtPlayer} from '../lib/encounters.mjs';
import {ultraActive,ULTRA_SKILL} from '../lib/dragon-light.mjs';
import {cleanRealtimeInput} from '../lib/realtime.mjs';
import {packSnapshot,unpackSnapshot,RemoteView} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
import {readFileSync} from 'node:fs';
const clone=s=>JSON.parse(JSON.stringify(s));
function scene(weapon='drogon',count=1){const w=new World(Array.from({length:count},(_,i)=>({id:i?'q':'p',weapon})),()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;for(const p of w.s.players)p.hp=p.maxHp=1e6;return{w,p:w.s.players[0]};}
function enemy(w,id,x,y){const e={id,x,y,type:1,hp:1e8,maxHp:1e8,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0};w.s.enemies.push(e);return e;}
function steps(w,n){for(let i=0;i<n;i++){for(const e of w.s.enemies)e.knockX=e.knockY=0;w.step(.05);}}
function ultra(w,p){p.ranks.lightgene=1;p.lightBond=180.05;p.relics=1;assert.equal(w.craft(p.id,'ultraman'),true);}
test('new weapons are starters and dragon remains an egg with contact damage only before fusion',()=>{
 for(const key of ['drogon','lightrod']){const {p}=scene(key);assert.ok(weaponLoadout(p).includes(key));}
 const {w,p}=scene(),e=enemy(w,900,p.x+140,p.y);steps(w,60);
 assert.ok(p.dragon&&!p.dragon.evolved);assert.ok(e.hp<e.maxHp);assert.ok(p.stats.drogon.damage>0);assert.equal(w.s.shots.length,0);assert.ok(!w.s.zones.some(z=>z.kind==='dragonfire'));
 p.relics=1;p.ranks.ember=3;p.ranks.drogon=2;assert.equal(w.craft('p','wyvern'),false);p.ranks.drogon=3;assert.equal(w.craft('p','wyvern'),true);assert.equal(p.relics,0);assert.equal(p.fused.ember,'wyvern');assert.equal(weaponLoadout(p).length,1);
 steps(w,1);assert.equal(p.dragon.evolved,true);assert.ok(w.s.zones.some(z=>z.kind==='dragonfire'));const initial=p.stats.wyvern.damage;steps(w,120);assert.ok(p.stats.wyvern.damage>initial);assert.ok(w.s.zones.length<12);
});
test('light resonance starts with the second component and strictly requires over 180 playing seconds',()=>{
 const {w,p}=scene('lightrod');steps(w,100);assert.equal(p.lightBond,0);w.applyUpgrade(p,'lightgene');steps(w,3600);assert.equal(p.lightBond,180);p.relics=1;assert.equal(forgeState(p,'ultraman').ready,false);assert.equal(w.craft('p','ultraman'),false);
 steps(w,1);assert.equal(p.lightBond,180.05);assert.equal(forgeState(p,'ultraman').ready,true);assert.equal(w.craft('p','ultraman'),true);assert.equal(w.craft('p','ultraman'),false);assert.equal(p.relics,0);
 const late=scene('blade');late.w.applyUpgrade(late.p,'lightgene');steps(late.w,3800);late.w.applyUpgrade(late.p,'lightrod');steps(late.w,1);assert.equal(late.p.lightBond,.05,'earlier time with just the factor cannot satisfy joint ownership');
});
test('resonance and transformation freeze during upgrade pause; disconnect cancels the active form',()=>{
 const {w,p}=scene('lightrod',2);ultra(w,p);w.input('p',{transformSeq:1});w.step(.05);const time=w.s.time,until=p.ultraUntil,progress=p.lightBond;p.choices=['power'];steps(w,20);assert.equal(w.s.time,time);assert.equal(p.ultraUntil,until);assert.equal(p.lightBond,progress);
 p.choices=[];p.connected=false;steps(w,1);assert.equal(p.ultraUntil,0);assert.equal(p.dragon,null);p.connected=true;assert.equal(ultraActive(p,w.s.time),false);
});
test('right-click activation is deduplicated, lasts exactly 15 seconds and cannot replay after cooldown',()=>{
 const {w,p}=scene('lightrod');w.input('p',{transformSeq:1});w.step(.05);ultra(w,p);w.step(.05);assert.equal(p.ultraUntil,undefined,'rejected requests do not queue a future transform');
 w.input('p',{transformSeq:2});w.step(.05);assert.ok(ultraActive(p,w.s.time));const at=p.ultraAt;assert.equal(p.ultraUntil-at,15);assert.equal(p.ultraReadyAt-at,90);
 p.hitCd=0;assert.equal(hurtPlayer(w,p,1e9),false);assert.equal(p.hp,p.maxHp);steps(w,301);assert.equal(ultraActive(p,w.s.time),false);p.hitCd=0;assert.equal(hurtPlayer(w,p,10),true);
 w.input('p',{transformSeq:3});w.step(.05);steps(w,1600);assert.equal(p.ultraAt,at);w.input('p',{transformSeq:4});w.step(.05);assert.ok(p.ultraAt>at);
});
test('giant beams hit distant targets; manual punches hit a wide aimed arc once per click',()=>{
 const {w,p}=scene('lightrod');ultra(w,p);const far=enemy(w,900,p.x+400,p.y),back=enemy(w,901,p.x-120,p.y),front=enemy(w,902,p.x+120,p.y);w.input('p',{transformSeq:1});w.step(.05);assert.ok(w.s.beams.some(b=>b.kind==='ultralight'));steps(w,24);assert.ok(p.stats.ultraman.damage>0);
 // Isolate a single manual punch from automatic rays and the pre-transformation rod.
 w.s.beams=[];w.s.shots=[];p.ultraBeamCd=100;w.input('p',{transformSeq:1,punchSeq:1,aim:0});w.step(.05);assert.ok(front.hp<front.maxHp);const frontHp=front.hp,backHp=back.hp,farHp=far.hp;steps(w,4);assert.equal(front.hp,frontHp);assert.equal(back.hp,backHp);assert.equal(far.hp,farHp);assert.equal(p.punchSeq,1);
 w.input('p',{transformSeq:1,punchSeq:2,aim:Math.PI});steps(w,1);assert.equal(back.hp,backHp,'cooldown rejects a rapid second click');steps(w,10);w.input('p',{transformSeq:1,punchSeq:3,aim:Math.PI});w.step(.05);assert.ok(back.hp<backHp);
});
test('host takeover and presentation preserve joint ownership progress, companion and consumed active inputs',()=>{
 const {w,p}=scene('lightrod',2);ultra(w,p);w.applyUpgrade(p,'drogon');w.input('p',cleanRealtimeInput({transformSeq:7,punchSeq:9,aim:.1}));w.step(.05);const base=packSnapshot(w.checkpoint(),{authoritative:true});steps(w,8);const packet=packSnapshot(w.checkpoint(),{authoritative:true});const state=unpackSnapshot(applySnapshotDelta(base,snapshotDelta(base,packet,1),1)),restored=World.restore(state),q=restored.s.players[0];
 assert.equal(q.lightBond,p.lightBond);assert.equal(q.ultraUntil,p.ultraUntil);assert.equal(q.transformSeq,7);assert.equal(q.punchSeq,9);assert.deepEqual(q.dragon,state.players[0].dragon);restored.input('p',{transformSeq:7,punchSeq:9});restored.step(.05);assert.equal(q.ultraAt,p.ultraAt);
 const view=unpackSnapshot(packSnapshot(w.checkpoint(),{presentation:true}));assert.equal(view.players[0].ultraReadyAt,p.ultraReadyAt);assert.equal(view.players[0].lightBond,p.lightBond);assert.ok(view.players[0].dragon);
 const input=cleanRealtimeInput({transformSeq:Infinity,punchSeq:-3,aim:100,snapshot:{}});assert.equal(input.transformSeq,0);assert.equal(input.punchSeq,0);assert.equal(input.aim,Math.PI);assert.equal(input.snapshot,undefined);
});
test('nested companion motion interpolates between packets and does not modify host snapshots',()=>{
 const {w,p}=scene();w.step(.05);const a=clone(w.s),remote=new RemoteView();remote.receive(a,'p',1);const b=clone(w.s);b.time+=.1;b.frame++;b.players[0].dragon.x+=50;remote.receive(b,'p',1.1);const before=remote.sample({},1.1,.016).players[0].dragon.x,after=remote.sample({},1.13,.03).players[0].dragon.x;
 assert.ok(after>before);assert.equal(b.players[0].dragon.x,a.players[0].dragon.x+50);
});
test('new sprite slots and native poses have valid image geometry',()=>{
 const png=readFileSync(new URL('../public/art/pixel-dragon-light.png',import.meta.url));assert.equal(png.readUInt32BE(16),768);assert.equal(png.readUInt32BE(20),256);const icons=readFileSync(new URL('../public/art/pixel-weapons.png',import.meta.url));assert.equal(icons.readUInt32BE(20),WEAPON_ATLAS_ROWS*64);assert.equal(UPGRADES.lightgene.sprite,75);
});
