import assert from 'node:assert/strict';
import { World } from '../lib/game.mjs';
import { mayReturn } from '../lib/camp.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(b){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const data=await r.json();assert.ok(r.ok,data.error);return data;}
const host=await call({action:'create',name:'营地房主',weapon:'spear',boons:{vitality:2,power:3,haste:2}}),party=[host];
try{
 const guest=await call({action:'join',code:host.code,name:'营地同行者',weapon:'prism',boons:{vitality:1000,speed:2,haste:-3}});party.push(guest);
 let lobby=await call({...host,action:'sync',input:{weapon:'spear',boons:{vitality:2,power:3,haste:2}}});
 const gm=lobby.members.find(m=>m.id===guest.id);assert.deepEqual(gm.input.boons,{vitality:5,power:0,speed:2,haste:0});
 const w=new World(lobby.members.map(m=>({id:m.id,weapon:m.input.weapon,boons:m.input.boons})),()=>.4),p=w.s.players.find(p=>p.id===host.id),q=w.s.players.find(p=>p.id===guest.id);assert.equal(p.maxHp,120);assert.equal(q.maxHp,150);assert.equal(q.speed,195*1.08);
 // A dead host remains an authoritative room participant while the survivor fights.
 p.hp=0;w.spawnCd=1e5;w.s.enemies=[{id:900,x:q.x+100,y:q.y,hp:1e5,maxHp:1e5,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0}];
 for(let i=0;i<20;i++)w.step(.05);assert.equal(w.s.status,'playing');assert.equal(p.hp,0);assert.ok(w.s.beams.length||w.s.enemies[0].hp<1e5);
 await call({...host,action:'sync',status:'playing',snapshot:w.s,input:{weapon:'spear',boons:{vitality:2,power:3,haste:2}}});
 const received=await call({...guest,action:'sync',input:{weapon:'prism',boons:gm.input.boons}});assert.equal(received.snapshot.players.find(p=>p.id===host.id).hp,0);assert.ok(received.snapshot.players.find(p=>p.id===guest.id).hp>0);assert.equal(mayReturn(received.snapshot,q),false);
 q.hp=0;w.step(.05);assert.equal(w.s.status,'over');await call({...host,action:'sync',status:'over',snapshot:w.s});const ended=await call({...guest,action:'sync'});assert.equal(ended.snapshot.status,'over');assert.equal(mayReturn(ended.snapshot,q),true);
 console.log('PASS: per-player camp boons are validated and synchronized; host death preserves the survivor’s combat; final defeat reaches both clients');
}finally{for(const p of party.slice(1))await call({...p,action:'leave'});await call({...host,action:'leave'});}
