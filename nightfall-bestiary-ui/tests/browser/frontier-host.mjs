/** Local-only browser QA using the same authoritative World and room endpoint. */
import {readFile,writeFile} from 'node:fs/promises';
import {World} from '../../lib/game.mjs';
import {packSnapshot} from '../../lib/network.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5174',command='/tmp/nightfall-frontier-command';
if(!/^http:\/\/(127\.0\.0\.1|localhost):/.test(base))throw Error('Local QA only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const host=await call({action:'create',name:'引路人',weapon:'aegis'});console.log('ROOM '+host.code);await writeFile(command,'run');let w,guest,wave=0;
try{while(true){
 const cmd=(await readFile(command,'utf8')).trim();if(cmd==='stop')break;
 const data=await call({...host,action:'sync',wire:1,status:w?.s.status||'lobby',snapshot:packSnapshot(w?.checkpoint(),{authoritative:true}),input:{}});
 if(!w&&data.members.length>1){
  guest=data.members.find(m=>m.id!==host.id);w=new World(data.members.map(m=>({id:m.id,name:m.name,index:m.slot,weapon:'aegis',effects:['ward','renewal','wisdom','preservation']})),()=>.5);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.time=190;w.s.bossKills=1;
  for(const p of w.s.players){p.x=p.id===guest.id?2865:2400;p.y=1900;p.hp=p.maxHp=500;p.nextXp=1e9;p.ranks.aegis=3;p.ranks.bow=2;}
  const p=w.s.players.find(p=>p.id===guest.id);
  for(const [type,dx,dy]of [[6,330,0],[8,310,-150],[6,-300,-40]]){const e=w.spawn(type,0);e.x=p.x+dx;e.y=p.y+dy;e.hp=e.maxHp=1e6;e.speed=0;e.skillCd=1;}
  for(let i=0;i<3;i++){const object=w.s.props[i];object.x=p.x-220+i*210;object.y=p.y+150;}
  for(const [i,value]of [1,8,24,100].entries())w.s.gems.push({id:w.nextId(),x:p.x-240+i*150,y:p.y-180,v:value,type:'gem'});
  console.log('READY');
 }
 if(w){const p=w.s.players.find(p=>p.id===guest.id);for(const m of data.members)w.input(m.id,m.input);
  if(cmd==='break')for(const object of w.s.props.slice(0,3))w.damage(object,1000,p);
  if(cmd==='death')for(const player of w.s.players)player.hp=0;
  if(cmd==='run'){for(const player of w.s.players)player.hp=player.maxHp;if(w.s.time>wave){wave=w.s.time+3;for(let i=0;i<8;i++){const angle=i*Math.PI/4;w.s.hostile.push({id:w.nextId(),x:p.x+Math.cos(angle)*230,y:p.y+Math.sin(angle)*230,vx:-Math.cos(angle)*160,vy:-Math.sin(angle)*160,radius:9,damage:10,life:4,kind:'orb'});}}}
  for(let i=0;i<2;i++)w.step(.05);
 }
 await new Promise(r=>setTimeout(r,100));
}}finally{await call({...host,action:'leave'}).catch(()=>{});}
