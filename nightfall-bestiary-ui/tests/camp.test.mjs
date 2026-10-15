import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../lib/game.mjs';
import { BOONS,newProfile,normalizeProfile,normalizeBoons,strengthen,boonCost,baseStats,settleRun,createCamp,stepCamp,campInteraction,mayReturn,KEEPER,PORTAL } from '../lib/camp.mjs';
test('the keeper spends actual embers, increases cost, and never overspends or exceeds a cap',()=>{
 let p=newProfile();assert.equal(p.embers,60);assert.equal(boonCost(p,'vitality'),20);p=strengthen(p,'vitality');assert.equal(p.embers,40);assert.equal(p.boons.vitality,1);assert.equal(boonCost(p,'vitality'),35);p=strengthen(p,'vitality');assert.equal(p.embers,5);assert.equal(strengthen(p,'vitality'),null);assert.equal(strengthen(p,'bogus'),null);
 p.embers=1000;for(let i=0;i<3;i++)p=strengthen(p,'vitality');assert.equal(boonCost(p,'vitality'),null);assert.equal(strengthen(p,'vitality'),null);assert.equal(baseStats(p.boons).maxHp,150);
});
test('saved camp progression survives JSON reload and corrupt values are bounded',()=>{
 let p=strengthen(newProfile(),'power');p=strengthen(p,'speed');const copy=normalizeProfile(JSON.parse(JSON.stringify(p)));assert.deepEqual(copy.boons,p.boons);assert.equal(copy.embers,20);
 const bad=normalizeProfile({embers:-500,boons:{vitality:Infinity,power:1000,speed:-8,haste:'oops'},residents:['smith','smith','bogus'],unlocks:['forge','bogus']});assert.equal(bad.embers,0);assert.deepEqual(bad.boons,{vitality:5,power:5,speed:0,haste:0});assert.deepEqual(bad.residents,['keeper','herbalist','smith']);assert.deepEqual(bad.unlocks,['forge']);
});
test('a run grants embers once and preserves previously purchased boons',()=>{
 const p=strengthen(newProfile(),'power');const result=settleRun(p,'run-1',{time:60,status:'over'},{kills:20});assert.equal(result.reward,2);assert.equal(result.profile.boons.power,1);assert.equal(result.profile.runs,1);assert.equal(result.profile.embers,42);
 const repeated=settleRun(result.profile,'run-1',{time:60,status:'over'},{kills:20});assert.equal(repeated.reward,0);assert.equal(repeated.profile.embers,42);assert.equal(repeated.profile.runs,1);
 const victory=settleRun(result.profile,'run-2',{time:360,status:'victory'},{kills:200});assert.equal(victory.reward,31);
});
test('solo and cooperative players start with their own permanent base stats',()=>{
 const w=new World([{id:'p',boons:{vitality:2,power:3,speed:1,haste:4}},{id:'q',boons:{vitality:5},weapon:'prism'}],()=>.5),[p,q]=w.s.players;
 assert.equal(p.hp,120);assert.equal(p.maxHp,120);assert.equal(p.damage,18*1.24);assert.equal(p.speed,195*1.04);assert.equal(p.rate,1.2);assert.equal(q.hp,150);assert.equal(q.damage,18);assert.deepEqual(q.ranks,{prism:1});
 w.input('p',{boons:{vitality:5,power:5}});w.step(.01);assert.equal(p.maxHp,120);assert.equal(p.damage,18*1.24,'live input cannot change the run’s base stats');
});
test('automatic returns wait during live play and level choices, then permit defeat or victory',()=>{
 const w=new World(),p=w.s.players[0];assert.equal(mayReturn(w.s,p),false);p.choices=['blade'];assert.equal(mayReturn(w.s,p),false);p.hp=0;assert.equal(mayReturn(w.s,p),true);p.hp=100;w.s.status='victory';assert.equal(mayReturn(w.s,p),true);assert.equal(mayReturn(null,p),false);
});
test('a distant ghost waits for rescue and cannot level or attack',()=>{
 const w=new World([{id:'p'},{id:'q'}],()=>.4),[p,q]=w.s.players;p.hp=0;p.choices=['power'];p.familiars=[{id:1}];q.hp=q.maxHp=100000;q.x+=500;w.spawnCd=1e5;
 for(let i=0;i<270;i++)w.step(.05);assert.equal(p.hp,0);assert.deepEqual(p.choices,[]);assert.deepEqual(p.familiars,[]);assert.equal(w.s.status,'playing');w.xp(p,100);assert.equal(p.xp,0);assert.equal(w.upgrade(p.id,'power'),false);q.hp=0;w.step(.05);assert.equal(w.s.status,'over');
});
test('camp movement, click targets and spatial interactions stay on the sanctuary map',()=>{
 const c=createCamp();const initial={x:c.x,y:c.y};stepCamp(c,{x:1,y:1},.05);assert.ok(Math.abs(Math.hypot(c.x-initial.x,c.y-initial.y)-11)<.001);
 c.target={x:KEEPER.x+38,y:KEEPER.y+47};for(let i=0;i<100;i++)stepCamp(c,{},.05);assert.equal(campInteraction(c),'keeper');const pos={x:c.x,y:c.y};stepCamp(c,{x:1},.05,true);assert.equal(c.x,pos.x);
 c.x=PORTAL.x;c.y=PORTAL.y+80;assert.equal(campInteraction(c),'portal');c.x=1119;c.y=714;for(let i=0;i<100;i++)stepCamp(c,{x:1,y:1},.05);assert.equal(c.x,1120);assert.equal(c.y,715);
});
test('camp upgrades persist into the next expedition without carrying temporary weapons',()=>{
 const p=strengthen(newProfile(),'vitality'),first=new World([{id:'p',boons:p.boons,weapon:'axe'}]);first.s.players[0].ranks.bow=3;first.s.players[0].maxHp+=25;
 const saved=settleRun(p,'finished',first.s,first.s.players[0]).profile,second=new World([{id:'p',boons:saved.boons,weapon:'spear'}]);assert.equal(second.s.players[0].maxHp,110);assert.deepEqual(second.s.players[0].ranks,{spear:1});assert.equal(Object.keys(BOONS).length,4);assert.deepEqual(normalizeBoons(null),newProfile().boons);
});
