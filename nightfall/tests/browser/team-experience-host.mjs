/** Disposable local room for browser QA; never loads or edits a user's camp profile. */
import {readFile,writeFile} from 'node:fs/promises';
import {World} from '../../lib/game.mjs';
import {packSnapshot} from '../../lib/network.mjs';
import {bossVisual} from '../../lib/boss-presentation.mjs';
const base=process.env.TEST_URL||'http://127.0.0.1:5173',command='/tmp/nightfall-team-xp-command';
if(!/^http:\/\/(localhost|127\.0\.0\.1):/.test(base))throw Error('Local QA only');
async function call(body){const r=await fetch(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data=await r.json();if(!r.ok)throw Error(data.error);return data;}
const host=await call({action:'create',name:'队伍验证',weapon:'spincat'}),bots=[];let world,guest,last='',frozen=false,arrival;
try{
 for(let i=0;i<2;i++)bots.push(await call({action:'join',code:host.code,name:`同行${i+1}`,weapon:'blade'}));
 await writeFile(command,'run');console.log('ROOM '+host.code);
 while(true){const cmd=(await readFile(command,'utf8')).trim();if(cmd==='stop')break;
  for(const bot of bots)await call({...bot,action:'sync',input:{weapon:'blade'}});
  const data=await call({...host,action:'sync',wire:1,status:world?'playing':'lobby',input:{weapon:'spincat'},snapshot:packSnapshot(world?.checkpoint(),{authoritative:true})});
  if(!world&&data.members.length===4){guest=data.members.find(m=>m.id!==host.id&&!bots.some(b=>b.id===m.id));world=new World(data.members.map(m=>({id:m.id,name:m.name,index:m.slot,weapon:m.input.weapon,boons:m.input.boons,effects:m.input.effects})),()=>.4);world.spawnCd=world.eliteAt=world.s.nextBossAt=1e9;world.s.props=[];for(const p of world.s.players){p.ranks={};p.count=0;p.hp=p.maxHp=1000;}console.log('READY');}
  if(world){for(const m of data.members)world.input(m.id,m.input);const p=world.s.players.find(p=>p.id===guest.id);
   if(cmd!==last){last=cmd;if(cmd==='xp7')world.xp(p,7);if(cmd==='level')world.xp(p,world.s.teamXp.nextXp-world.s.teamXp.xp);if(cmd==='freeze')frozen=true;if(cmd==='run')frozen=false;
    if(cmd.startsWith('boss:')){const kind=cmd.slice(5);world.s.enemies=[];world.s.hazards=[];world.s.hostile=[];arrival={kind,at:world.s.time+5};world.s.bossWarning={kind,at:world.s.time,arrive:arrival.at,until:arrival.at+3};frozen=false;}
   }
   if(world.s.draft)for(const id of [...world.s.draft.pending])if(id!==guest.id){const q=world.s.players.find(p=>p.id===id);world.upgrade(id,q.choices[0],world.s.draft?.id);}
   if(arrival&&world.s.time>=arrival.at){const e=world.spawn(4);e.bossKind=arrival.kind;e.size=bossVisual(e).radius;e.x=p.x+300;e.y=p.y;e.skillCd=3.6;arrival=null;}
   if(!frozen){world.step(.05);world.step(.05);}
  }
  await new Promise(r=>setTimeout(r,100));
 }
}finally{for(const bot of bots)await call({...bot,action:'leave'}).catch(()=>{});await call({...host,action:'leave'}).catch(()=>{});}
