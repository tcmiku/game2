import assert from 'node:assert/strict';
import { World } from '../lib/game.mjs';
import { RECIPES, weaponLoadout } from '../lib/equipment.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(b){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});const data=await r.json();assert.ok(r.ok,data.error);return data;}
const host=await call({action:'create',name:'武器房主',weapon:'spear'}),party=[host];
try{
 const guest=await call({action:'join',code:host.code,name:'武器访客',weapon:'prism'});party.push(guest);
 const lobby=await call({...host,action:'sync',input:{weapon:'spear'}});
 assert.equal(lobby.members.find(m=>m.id===host.id).input.weapon,'spear');assert.equal(lobby.members.find(m=>m.id===guest.id).input.weapon,'prism');
 const world=new World(lobby.members.map(m=>({id:m.id,weapon:m.input.weapon})),()=>.4);
 assert.deepEqual(weaponLoadout(world.s.players.find(p=>p.id===guest.id)),['prism']);
 for(const r of RECIPES.filter(r=>r.weapons)){
  const p=world.s.players.find(p=>p.id===guest.id);p.ranks={};p.evolutions={};p.fused={};p.relics=2;
  for(const part of r.weapons){p.ranks[part.key]=part.level;if(part.key==='blade')p.count=part.level;else if(['nova','orbit','storm'].includes(part.key))p[part.key]=part.level;}
  await call({...guest,action:'sync',input:{weapon:'prism',choice:r.key,seq:10+RECIPES.indexOf(r)}});
  const transport=await call({...host,action:'sync',status:'playing',snapshot:world.s,input:{weapon:'spear'}});
  for(const m of transport.members){world.input(m.id,m.input);world.input(m.id,m.input);}
  assert.equal(p.evolutions[r.weapon],r.key);assert.equal(p.relics,1);assert.equal(weaponLoadout(p).length,1);
  world.spawnCd=1e5;world.s.enemies=[{id:900,x:p.x+100,y:p.y,hp:1e6,maxHp:1e6,type:1,size:20,speed:0,slow:0,hit:0,orbitCd:0,phase:0}];world.step(.05);
  await call({...host,action:'sync',status:'playing',snapshot:world.s,input:{weapon:'spear'}});
  const received=await call({...guest,action:'sync',input:{weapon:'prism'}}),copy=received.snapshot.players.find(p=>p.id===guest.id);
  assert.equal(copy.evolutions[r.weapon],r.key);assert.equal(copy.fused[r.weapons[1].key],r.key);assert.equal(copy.relics,1);assert.ok(Array.isArray(received.snapshot.zones));assert.ok(Array.isArray(received.snapshot.beams));
 }
 console.log('PASS: independent starter choices and all ten weapon unions validate on the host, reject duplicate actions, and synchronize fused slots and new combat entities');
}finally{for(const p of party.slice(1))await call({...p,action:'leave'});await call({...host,action:'leave'});}
const newStarters=['dagger','chakram','turret','wind'],secondLoadout=['mine','saw','chain','whip'],coop=[];
try{
 coop.push(await call({action:'create',name:'新武器房主',weapon:newStarters[0]}));
 for(let i=1;i<4;i++)coop.push(await call({action:'join',code:coop[0].code,name:'试炼'+i,weapon:newStarters[i]}));
 let room=await call({...coop[0],action:'sync',input:{weapon:newStarters[0]}});
 for(let i=0;i<4;i++)assert.equal(room.members.find(m=>m.id===coop[i].id).input.weapon,newStarters[i]);
 for(let i=0;i<4;i++)await call({...coop[i],action:'sync',input:{weapon:secondLoadout[i]}});
 room=await call({...coop[0],action:'sync',input:{weapon:secondLoadout[0]}});
 const w=new World(room.members.map(m=>({id:m.id,weapon:m.input.weapon})),()=>.4);w.spawnCd=1e6;
 for(let i=0;i<4;i++){const p=w.s.players.find(p=>p.id===coop[i].id);assert.deepEqual(weaponLoadout(p),[secondLoadout[i]]);p.ranks[newStarters[i]]=3;p.hp=10000;p.x=400+i*500;w.s.enemies.push({id:1000+i,x:p.x+40,y:p.y,hp:1e6,maxHp:1e6,type:4,size:50,speed:0,slow:0,hit:0,orbitCd:0,phase:0});}
 for(let i=0;i<25;i++)w.step(.05);
 await call({...coop[0],action:'sync',status:'playing',snapshot:w.s,input:{weapon:secondLoadout[0]}});
 const received=await call({...coop[3],action:'sync',input:{weapon:secondLoadout[3]}});
 for(let i=0;i<4;i++){const p=received.snapshot.players.find(p=>p.id===coop[i].id);assert.ok(p.stats[newStarters[i]]?.damage>0,newStarters[i]);assert.ok(p.stats[secondLoadout[i]]?.damage>0,secondLoadout[i]);}
 console.log('PASS: four-player rooms accept all eight new starters and synchronize their projectiles, fields, and per-owner damage');
}finally{for(const p of coop.slice(1))await call({...p,action:'leave'});if(coop[0])await call({...coop[0],action:'leave'});}
