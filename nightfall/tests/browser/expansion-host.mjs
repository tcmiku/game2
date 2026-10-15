/** Local QA host. Drives the real room protocol; no product debug routes. */
import {readFile,writeFile} from 'node:fs/promises';
import {World} from '../../lib/game.mjs';
const base='http://127.0.0.1:5173',command='/tmp/nightfall-expansion-command',stateFile='/tmp/nightfall-expansion-fixture.json';
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const host=await call({action:'create',name:'巡夜者',weapon:'blade'});console.log('ROOM '+host.code);await writeFile(command,'wait');let w,guest,last='';
try{while(true){
 const cmd=(await readFile(command,'utf8')).trim();if(cmd==='stop')break;
 const data=await call({...host,action:'sync',status:w?.s.status||'lobby',snapshot:w?.s,input:{}});
 if(!w&&data.members.length>1){
  guest=data.members.find(m=>m.id!==host.id);w=new World(data.members.map(m=>({id:m.id,name:m.name,weapon:m.id===guest.id?'bow':'blade'})),()=>.42);w.spawnCd=1e9;w.eliteAt=1e9;w.s.time=301;w.s.nextBossAt=600;w.s.bossSpawned=true;
  for(const p of w.s.players){p.hp=p.maxHp=10000;p.damage=12;p.ranks={bow:3,spear:3,prism:3,orbit:2,nova:2};p.orbit=p.nova=2;p.count=0;p.cooldown=1e9;p.x=1200;p.y=800;}
  const boss=w.spawn(4);boss.x=1460;boss.y=680;boss.hp=boss.maxHp=1e6;boss.speed=0;
  for(const [type,tier,x,y]of [[1,1,1010,690],[2,2,1030,870],[3,3,1370,960],[6,0,910,820],[6,2,1500,850]]){const e=w.spawn(type,tier);e.x=x;e.y=y;e.speed=0;e.hp=e.maxHp=1e6;}
  await writeFile(stateFile,JSON.stringify({code:host.code,guest:guest.id}));console.log('BATTLE READY');
 }
 if(w){
  const p=w.s.players.find(p=>p.id===guest.id);
  if(cmd!==last){
   if(cmd==='rescue'){const e=w.s.enemies.find(e=>e.type===4);if(e)w.damage(e,e.hp+1,p,p,'bow');console.log('BOSS DEFEATED');}
   if(cmd==='death'){for(const p of w.s.players)p.hp=0;console.log('RETURN TO CAMP');}
   if(cmd==='reaper'){w.s.time=1799.99;w.s.reaperSpawned=false;w.s.enemies=[];for(const p of w.s.players)p.hp=10000;console.log('DEATH ARRIVES');}
   last=cmd;
  }
  for(let i=0;i<3;i++){for(const p of w.s.players){p.choices=[];if(cmd!=='death'&&cmd!=='reaper')p.hp=p.maxHp;const member=data.members.find(m=>m.id===p.id);if(member)w.input(p.id,member.input);}w.step(.05);}
 }
 await new Promise(r=>setTimeout(r,120));
}}finally{await call({...host,action:'leave'}).catch(()=>{});}
