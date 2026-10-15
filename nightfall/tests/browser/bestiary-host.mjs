/** Local QA host for new enemies and the actual game's panels; no product debug route. */
import {readFile,writeFile} from 'node:fs/promises';
import {World} from '../../lib/game.mjs';
const base='http://127.0.0.1:5173',command='/tmp/nightfall-bestiary-command';
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const host=await call({action:'create',name:'夜巡者',weapon:'bow'});console.log('ROOM '+host.code);await writeFile(command,'run');let w,guest,last='';
try{while(true){
 const cmd=(await readFile(command,'utf8')).trim();if(cmd==='stop')break;
 const data=await call({...host,action:'sync',status:w?.s.status||'lobby',snapshot:w?.s,input:{}});
 if(!w&&data.members.length>1){
  guest=data.members.find(m=>m.id!==host.id);w=new World(data.members.map(m=>({id:m.id,name:m.name,weapon:'bow'})),()=>.42);w.spawnCd=w.eliteAt=1e9;w.s.time=160;w.s.nextBossAt=300;
  for(const p of w.s.players){p.hp=p.maxHp=100000;p.damage=5;p.ranks=p.id===guest.id?{bow:3,orbit:2,ember:2,storm:1}:{};p.orbit=p.id===guest.id?2:0;p.storm=p.id===guest.id?1:0;p.count=0;p.x=p.id===guest.id?1200:1850;p.y=p.id===guest.id?800:1300;}
  for(const [type,tier,x,y]of [[8,0,965,855],[9,1,1000,655],[10,2,1510,735],[11,0,1440,1000],[12,3,1100,1040],[1,0,900,740],[2,0,1290,580],[3,0,1470,560]]){const e=w.spawn(type,tier);e.x=x;e.y=y;e.hp=e.maxHp=1e7;e.skillCd=1.5+(type%3);}
  console.log('BATTLE READY');
 }
 if(w){const p=w.s.players.find(p=>p.id===guest.id);
  if(cmd!==last){if(cmd==='upgrade')p.choices=['chakram','turret','wind'];if(cmd==='forge'){p.ranks.storm=3;p.storm=3;p.relics=3;}if(cmd==='death')for(const p of w.s.players)p.hp=0;last=cmd;}
  for(const member of data.members)w.input(member.id,member.input);
  if(cmd!=='upgrade')for(let i=0;i<3;i++){for(const p of w.s.players){p.choices=[];if(cmd!=='death')p.hp=p.maxHp;}w.step(.05);}
 }
 await new Promise(r=>setTimeout(r,120));
}}finally{await call({...host,action:'leave'}).catch(()=>{});}
