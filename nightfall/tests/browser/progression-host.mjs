/** QA drives the real room API and simulation. Commands are local, never shipped as a game endpoint. */
import {readFile,writeFile} from 'node:fs/promises';
import {World} from '../../lib/game.mjs';
import {packSnapshot} from '../../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',command='/tmp/nightfall-progression-command';
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const host=await call({action:'create',name:'引路人',weapon:'bow'});console.log('ROOM '+host.code);await writeFile(command,'run');let w,guest,last='';
try{while(true){
 const cmd=(await readFile(command,'utf8')).trim();if(cmd==='stop')break;
 const data=await call({...host,action:'sync',wire:1,status:w?.s.status||'lobby',snapshot:packSnapshot(w?.s),input:{}});
 if(!w&&data.members.length>1){
  guest=data.members.find(m=>m.id!==host.id);w=new World(data.members.map(m=>({id:m.id,name:m.name,weapon:'blade'})),()=>.05);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.time=160;
  for(const p of w.s.players){p.hp=p.maxHp=150;p.nextXp=10000;p.xp=6500;p.damage=1;p.ranks=p.id===guest.id?{blade:4,bow:3,storm:3}:{};p.count=p.id===guest.id?4:0;p.storm=p.id===guest.id?3:0;p.x=p.id===guest.id?1200:1700;p.y=800;}
  for(const [type,tier,x,y]of [[8,0,950,900],[9,1,980,650],[10,2,1550,700],[11,0,1480,1040],[12,3,1120,1100]]){const e=w.spawn(type,tier);e.x=x;e.y=y;e.hp=e.maxHp=1e7;}
  console.log('READY');
 }
 if(w){const p=w.s.players.find(p=>p.id===guest.id),q=w.s.players.find(p=>p.id===host.id);
  for(const member of data.members)w.input(member.id,member.input);
  if(cmd!==last){
   if(cmd==='upgrade'){p.choices=['blade','haste','orbit'];p.choiceTime=0;}
   if(cmd==='ghost'){p.hp=0;p.choices=[];q.x=p.x+350;q.y=p.y;}
   if(cmd==='revive'){q.x=p.x;q.y=p.y;}
   if(cmd==='forge'){p.choices=[];p.hp=150;p.ranks={blade:5,power:1,bow:3,storm:3};p.count=5;p.relics=2;}
   if(cmd==='chest'){p.choices=[];p.hp=150;p.ranks={blade:4,orbit:5};p.count=4;p.orbit=5;w.s.chests.push({id:w.nextId(),x:p.x,y:p.y,value:1});}
   if(cmd==='death')for(const p of w.s.players)p.hp=0;
   last=cmd;
  }
  for(let i=0;i<2;i++){if(cmd!=='death')q.hp=q.maxHp;if(!['ghost','revive','death'].includes(cmd)&&p.hp>0)p.hp=p.maxHp;w.step(.05);}
 }
 await new Promise(r=>setTimeout(r,100));
}}finally{await call({...host,action:'leave'}).catch(()=>{});}
