import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,unpackSnapshot} from '../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',party=[];
async function call(body){const response=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await response.json();assert.ok(response.ok,data.error);return data;}
try{
 const host=await call({action:'create',name:'引路人'});party.push(host);for(let i=1;i<4;i++)party.push(await call({action:'join',code:host.code,name:'同行'+i}));
 const w=new World(party.map(p=>({id:p.id})),()=>.01);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;for(const p of w.s.players){p.nextXp=1e7;p.ranks={blade:4};p.count=4;p.x=1100+p.index*300;}
 const [p,q]=w.s.players;
 async function send(){await call({...host,action:'sync',wire:1,status:w.s.status,snapshot:packSnapshot(w.s)});return unpackSnapshot((await call({...party[1],action:'sync',wire:1})).snapshot);}
 q.hp=0;w.step(.05);let received=await send();let ghost=received.players.find(player=>player.id===q.id);assert.equal(ghost.ghost,true);assert.equal(ghost.hp,0);assert.equal(ghost.deaths,1);
 await call({...party[1],action:'sync',wire:1,input:{x:1,moveAt:100}});const inputs=await call({...host,action:'sync',wire:1});for(const member of inputs.members)w.input(member.id,member.input);const x=q.x;w.step(.05);assert.ok(q.x>x);received=await send();assert.ok(received.players[1].x>x);
 w.input(q.id,{x:0});p.x=q.x;p.y=q.y;for(let i=0;i<60;i++)w.step(.05);received=await send();assert.equal(received.players[1].ghost,false);assert.equal(received.players[1].hp,50);assert.ok(received.players[1].hitCd>1.8);
 q.choices=['power'];const time=w.s.time;w.step(.05);received=await send();assert.equal(received.upgradePaused,true);assert.equal(received.time,Math.round(time*1000)/1000);
 await call({...party[1],action:'sync',wire:1,input:{choice:'power',seq:98}});const chosen=await call({...host,action:'sync',wire:1});for(const member of chosen.members)w.input(member.id,member.input);w.step(.05);received=await send();assert.equal(received.upgradePaused,false);assert.equal(received.players[1].ranks.power,1);
 const boss=w.spawn(4);boss.x=p.x;boss.y=p.y;w.damage(boss,1e9,p);w.step(.05);received=await send();assert.ok(received.players.every(player=>player.ranks.blade===5&&player.relics===1));assert.ok(received.players.every(player=>player.lastChestUpgrade.key==='blade'));assert.equal(received.chests.length,0);
 console.log('PASS: four-player packed transport preserves mobile ghosts, teammate revival, held upgrade state, guest choices and one-time chest weapon rewards');
}finally{for(const p of party.slice(1).reverse())await call({...p,action:'leave'}).catch(()=>{});if(party[0])await call({...party[0],action:'leave'}).catch(()=>{});}
