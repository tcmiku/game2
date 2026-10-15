import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {canUpgrade,UPGRADES} from '../lib/equipment.mjs';
import {packSnapshot,unpackSnapshot,RemoteView} from '../lib/network.mjs';
import {cleanCursor} from '../lib/shared-draft.mjs';
const copy=value=>JSON.parse(JSON.stringify(value));
function party(count=4){const w=new World(Array.from({length:count},(_,i)=>({id:`p${i}`})),()=>.4);w.spawnCd=w.eliteAt=1e9;for(const p of w.s.players)w.xp(p,6);w.step(.02);return w;}

test('2–4 players receive one shared pool with three cards per living player',()=>{
 for(const count of [2,3,4]){
  const w=party(count),d=w.s.draft;assert.equal(d.cards.length,count*3);assert.equal(d.pending.length,count);assert.equal(w.s.upgradePaused,true);
  for(const p of w.s.players)assert.deepEqual(p.choices,d.cards.filter(c=>c.key==='mend'||canUpgrade(p,c.key)).map(c=>c.key));
  const restored=World.restore(unpackSnapshot(copy(packSnapshot(w.checkpoint(),{authoritative:true}))));assert.deepEqual(restored.s.draft,d);
 }
});
test('simultaneous contenders cannot claim one card twice and claimed cards stay visible',()=>{
 const w=party(),d=w.s.draft,key=d.cards[0].key;
 assert.equal(w.upgrade('p0',key,d.id),true);assert.equal(w.upgrade('p1',key,d.id),false);assert.equal(w.upgrade('p0',d.cards[1].key,d.id),false);
 assert.equal(d.cards[0].claimedBy,'p0');assert.ok(!w.s.players[1].choices.includes(key));assert.equal(d.cards.length,12);
 assert.equal(w.upgrade('p1',w.s.players[1].choices[0],'previous-round'),false);
 for(const p of w.s.players.slice(1))assert.equal(w.upgrade(p.id,p.choices[0],d.id),true);
 w.step(.02);assert.equal(w.s.draft,null);assert.equal(w.s.upgradePaused,false);assert.ok(w.s.time>0);
});
test('shared cards enforce unlocks and full weapon slots; exhausted pools provide supplies',()=>{
 const w=new World([{id:'a'},{id:'b'}],()=>.3);w.spawnCd=1e9;
 const [a,b]=w.s.players;for(const key of Object.keys(UPGRADES))a.ranks[key]=UPGRADES[key].max;
 w.xp(a,6);w.xp(b,6);w.step(.02);assert.deepEqual(a.choices,['mend']);assert.ok(b.choices.length>=3);assert.equal(w.upgrade(a.id,b.choices.find(key=>key!=='mend'),w.s.draft.id),false);
 assert.equal(w.upgrade(a.id,'mend',w.s.draft.id),true);assert.equal(a.choices.length,0);
});
test('queued levels wait for the team; late input from an older round cannot spend a new choice',()=>{
 const w=party(2),d=w.s.draft;for(const p of w.s.players)p.xp=100;
 w.input('p0',{choice:w.s.players[0].choices[0],seq:100,draftId:d.id});assert.equal(w.s.players[0].choices.length,0);
 w.upgrade('p1',w.s.players[1].choices[0],d.id);w.step(.02);assert.notEqual(w.s.draft.id,d.id);
 const next=copy(w.s.players[0].ranks);w.input('p0',{choice:w.s.players[0].choices[0],seq:99,draftId:w.s.draft.id});assert.deepEqual(w.s.players[0].ranks,next);
 w.input('p0',{choice:w.s.players[0].choices[0],seq:101,draftId:d.id});assert.deepEqual(w.s.players[0].ranks,next);
});
test('timeouts, disconnects and host restoration cannot permanently hold the team',()=>{
 const w=party(),t=w.s.time;w.s.players[3].hp=0;w.s.players[2].connected=false;
 for(let i=0;i<700;i++)w.step(.02);
 assert.ok(w.s.players.slice(0,3).every(p=>!p.choices.length));w.step(.02);assert.equal(w.s.draft,null);assert.ok(w.s.time>t);
 const restored=World.restore(copy(party(2).checkpoint()));restored.reconcileMembers([{id:'p0',input:{}}]);for(let i=0;i<701;i++)restored.step(.02);assert.equal(restored.s.draft,null);
});
test('spectators receive the draft while time is frozen and cursor payloads are bounded',()=>{
 const w=party(),view=new RemoteView();view.receive(copy(w.s),'p0',1);w.upgrade('p1',w.s.players[1].choices[0],w.s.draft.id);w.step(.02);view.receive(copy(w.s),'p0',1.05);assert.equal(view.latest.draft.cards.filter(c=>c.claimedBy).length,1);
 assert.deepEqual(cleanCursor({round:'r',card:'c',x:2,y:-1}),{round:'r',card:'c',x:1,y:0});assert.equal(cleanCursor({round:'r',x:Infinity,y:0}),null);
});
