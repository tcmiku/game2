import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
async function call(b){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return {status:r.status,data:await r.json()};}
const created=await call({action:'create',name:'测试房主'});assert.equal(created.status,200);const host=created.data,guests=[];
try{
 for(let i=0;i<3;i++){const r=await call({action:'join',code:host.code,name:'测试旅人'+i});assert.equal(r.status,200);guests.push(r.data);}
 assert.equal((await call({action:'join',code:host.code,name:'第五人'})).status,409);
 assert.equal((await call({...host,action:'sync',token:'invalid'})).status,403);
 await call({...guests[0],action:'sync',input:{x:1,y:-1,choice:'power',seq:10}});
 const h=await call({...host,action:'sync',status:'playing',snapshot:{time:3,players:[{id:host.id,hp:100}],enemies:[]}});assert.equal(h.data.members.length,4);assert.equal(h.data.members.find(m=>m.id===guests[0].id).input.x,1);
 const g=await call({...guests[0],action:'sync'});assert.equal(g.data.snapshot.time,3);assert.equal(g.data.snapshot.players[0].hp,100);assert.equal(g.data.status,'playing');
 assert.equal((await call({action:'join',code:host.code,name:'迟到玩家'})).status,409);
 console.log('PASS: create, 4-player limit, token checks, host snapshot, guest inputs, in-progress join rejection');
}finally{for(const g of guests)await call({...g,action:'leave'});await call({...host,action:'leave'});}
assert.equal((await call({...host,action:'sync'})).status,404);console.log('PASS: leave and room cleanup');
