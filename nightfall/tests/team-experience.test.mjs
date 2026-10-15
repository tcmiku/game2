import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {teamRequirement,experienceView,syncTeamExperience} from '../lib/team-experience.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
function party(count=4){const w=new World(Array.from({length:count},(_,i)=>({id:`p${i}`})),()=>.4);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.props=[];return w;}
function pickAll(w){w.step(.01);const draft=w.s.draft;if(!draft)return;for(const id of [...draft.pending]){const p=w.s.players.find(p=>p.id===id);assert.equal(w.upgrade(id,p.choices[0],draft.id),true);}}
test('a pickup is awarded once to the whole team; one through four players have scaled thresholds',()=>{
 assert.deepEqual([1,2,3,4].map(n=>teamRequirement(6,n)),[6,10,13,16]);
 for(const n of [2,3,4]){const w=party(n),p=w.s.players[0];w.s.gems=[{id:900,x:p.x,y:p.y,v:2,type:'gem'}];w.step(.05);assert.equal(w.s.teamXp.xp,2);assert.equal(w.s.gems.length,0);assert.ok(w.s.players.every(p=>p.xp===2&&p.level===1&&p.nextXp===teamRequirement(6,n)));w.step(.05);assert.equal(w.s.teamXp.xp,2,'consumed gem cannot award again');}
});
test('collector experience bonuses feed the same bar and all living teammates level together',()=>{
 const w=party(2),[p,q]=w.s.players;p.ranks.wisdom=2;w.xp(p,10);assert.equal(w.s.teamXp.level,2);assert.equal(w.s.teamXp.xp,3);assert.equal(q.xp,3);assert.equal(q.level,p.level);assert.ok(w.s.players.every(p=>p.choices.length===3));w.step(.01);assert.equal(w.s.draft.pending.length,2);assert.equal(w.s.draft.cards.length,6);assert.equal(experienceView(w.s,p).shared,true);
});
test('overflow waits for the team to finish a round, then grants exactly the next shared upgrade',()=>{
 const w=party(3),p=w.s.players[0],first=w.s.teamXp.nextXp,second=teamRequirement(10,3);w.xp(p,first+second+4);w.step(.01);const id=w.s.draft.id;assert.equal(w.s.teamXp.level,2);assert.equal(w.s.teamXp.xp,second+4);pickAll(w);w.step(.01);assert.equal(w.s.teamXp.level,3);assert.equal(w.s.teamXp.xp,4);assert.notEqual(w.s.draft.id,id);pickAll(w);w.step(.01);assert.equal(w.s.draft,null);assert.ok(w.s.players.every(p=>p.level===3&&p.xp===4&&p.upgradeCredits===0));
});
test('disconnect, reconnect and permanent leave preserve the fraction instead of gifting levels or resetting XP',()=>{
 const w=party(4);w.xp(w.s.players[0],8);const fraction=w.s.teamXp.xp/w.s.teamXp.nextXp;w.s.players[3].connected=false;syncTeamExperience(w.s);assert.equal(w.s.teamXp.count,3);assert.equal(w.s.teamXp.nextXp,13);assert.equal(w.s.teamXp.xp/w.s.teamXp.nextXp,fraction);w.s.players[3].connected=true;syncTeamExperience(w.s);assert.equal(w.s.teamXp.xp,8);w.reconcileMembers(w.s.players.slice(0,2).map(p=>({id:p.id,input:{}})));assert.equal(w.s.teamXp.count,2);assert.equal(w.s.teamXp.xp,5);assert.equal(w.s.teamXp.level,1);
});
test('ghosts share the level and bank missed upgrades, claiming once after revival',()=>{
 const w=party(2),[p,q]=w.s.players;p.hp=0;w.step(.05);w.xp(q,w.s.teamXp.nextXp);assert.equal(p.level,2);assert.equal(p.upgradeCredits,1);assert.equal(p.choices.length,0);pickAll(w);q.x=p.x;q.y=p.y;for(let i=0;i<62;i++)w.step(.05);assert.ok(p.hp>0);assert.equal(p.level,q.level);assert.equal(p.upgradeCredits,0);assert.equal(w.s.draft.pending.length,1);assert.equal(w.s.draft.pending[0],p.id);pickAll(w);w.step(.05);assert.equal(w.s.draft,null);assert.equal(p.upgradeCredits,0);assert.equal(w.s.teamXp.level,2);
});
test('dying before choosing refunds that pending reward once without double-counting the team level',()=>{
 const w=party(2),[p,q]=w.s.players;w.xp(q,w.s.teamXp.nextXp);w.step(.01);p.hp=0;w.step(.01);assert.equal(p.upgradeCredits,1);w.step(.01);assert.equal(p.upgradeCredits,1);pickAll(w);q.x=p.x;q.y=p.y;for(let i=0;i<62;i++)w.step(.05);assert.equal(w.s.draft.pending[0],p.id);pickAll(w);w.step(.05);assert.equal(w.s.teamXp.level,2);assert.equal(p.upgradeCredits,0);
});
test('authoritative deltas and host takeover retain one shared meter, draft and banked rewards',()=>{
 const w=party(4),p=w.s.players[0];w.xp(p,5);const a=packSnapshot(w.checkpoint(),{authoritative:true});w.s.players[3].hp=0;w.step(.01);w.xp(p,11);w.step(.01);const b=packSnapshot(w.checkpoint(),{authoritative:true}),state=unpackSnapshot(copy(applySnapshotDelta(a,snapshotDelta(a,b,9),9))),restored=World.restore(state);assert.deepEqual(restored.s.teamXp,state.teamXp);assert.deepEqual(restored.s.draft,state.draft);assert.equal(restored.s.players[3].upgradeCredits,1);assert.ok(restored.s.players.every(p=>p.level===2&&p.xp===0));pickAll(restored);restored.step(.01);assert.equal(restored.s.teamXp.level,2);
});
test('legacy individual meters migrate to the highest earned level and preserve owed choices',()=>{
 const w=party(2),state=copy(w.checkpoint());delete state.teamXp;Object.assign(state.players[0],{level:4,xp:5,nextXp:25});Object.assign(state.players[1],{level:2,xp:2,nextXp:10});const restored=World.restore(state);assert.equal(restored.s.teamXp.level,4);assert.ok(Math.abs(restored.s.teamXp.xp/restored.s.teamXp.nextXp-.2)<1e-8);assert.equal(restored.s.players[1].upgradeCredits,2);restored.step(.01);assert.equal(restored.s.players[1].upgradeCredits,1);assert.ok(restored.s.players[1].choices.length>0);
});
test('solo XP and level thresholds retain their existing behavior and disconnected collectors award nothing',()=>{
 const w=new World(undefined,()=>.4),p=w.s.players[0];w.xp(p,6);assert.equal(p.level,2);assert.equal(p.nextXp,10);assert.equal(w.s.teamXp,undefined);assert.equal(experienceView(w.s,p).shared,false);const team=party();team.s.players[0].connected=false;team.xp(team.s.players[0],100);assert.equal(team.s.teamXp.xp,0);
});
