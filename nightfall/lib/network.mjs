import {ARENA_W,ARENA_H,collideDestructibles} from './frontier.mjs';
// Keep requests serial and schedule from their start, so latency isn't added to
// the polling interval. Lobby traffic stays slow; failures back off separately.
export const SYNC_MS=50,LOBBY_SYNC_MS=650;
export function syncDelay(start,now,lobby=false,failures=0,host=false,rtt=0){
 return Math.max(failures?Math.min(1500,150*failures):0,(lobby?LOBBY_SYNC_MS:host?Math.min(160,80+Math.max(0,rtt-100)*.2):SYNC_MS)-(now-start));
}
const groups=['enemies','shots','gems','effects','zones','beams','impacts','chests','hostile','hazards','props'];
const omitted=new Set(['hit','damage','pierce','orbitCd','cooldowns','tick','knockX','knockY']);
function round(value){
 if(typeof value==='number')return Math.round(value*1000)/1000;
 if(Array.isArray(value))return value.map(round);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,round(v)]));
 return value;
}
/** Column names travel once per collection, rather than on every entity. */
export function packSnapshot(state,{authoritative=false}={}){
 if(!state)return undefined;
 const packet={wire:1,entities:{}};
 for(const key of Object.keys(state))if(!groups.includes(key)&&!key.startsWith('_'))packet[key]=round(state[key]);
 for(const name of groups){
  const items=state[name]||[],columns=new Set();for(const item of items)for(const key of Object.keys(item))if(authoritative||!omitted.has(key)||key==='hit'&&name==='enemies')columns.add(key);
  const keys=[...columns],rows=[];
  for(const item of items){const row=[];for(const key of keys)row.push(round(item[key]));while(row.length&&row.at(-1)===undefined)row.pop();rows.push(row);}packet.entities[name]={keys,rows};
 }
 return packet;
}
/** Guests need presentation and action acknowledgements, not takeover physics. */
export function presentationPacket(packet){
 if(!packet)return undefined;if(packet.wire!==1)packet=packSnapshot(packet,{authoritative:true});
 const view={wire:1,entities:{}};
 for(const [key,value] of Object.entries(packet))if(!key.startsWith('_')&&!['entities','engine','players'].includes(key))view[key]=value;
 view.ack=packet.engine?.lastSeq||{};
 view.players=(packet.players||[]).map(p=>Object.fromEntries(Object.entries(p).filter(([key])=>!['cooldowns','cooldown','novaCd','stormCd','pulseCd'].includes(key))));
 const physics=new Set([...omitted,'speed','skillCd','burstWait','summoner','chargeSpeed']);
 for(const [name,{keys,rows}] of Object.entries(packet.entities)){
  const columns=keys.map((key,index)=>[key,index]).filter(([key])=>!physics.has(key)||key==='hit'&&['enemies','props'].includes(name));
  view.entities[name]={keys:columns.map(([key])=>key),rows:rows.map(row=>{const out=columns.map(([,index])=>row[index]);while(out.length&&out.at(-1)==null)out.pop();return out;})};
 }return view;
}
export function unpackSnapshot(packet){
 if(packet?.wire!==1)return packet;
 const {wire,entities,...state}=packet;
 for(const name of groups){const {keys,rows}=entities[name]||{keys:[],rows:[]};state[name]=rows.map(row=>Object.fromEntries(row.flatMap((value,i)=>value==null?[]:[[keys[i],value]])));}
 return state;
}
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function direction(input){let x=Number(input.x)||0,y=Number(input.y)||0;const length=Math.max(1,Math.hypot(x,y));return{x:x/length,y:y/length};}

/** Presentation only. Damage, pickups, choices and death always use host state. */
export class RemoteView{
 constructor(){this.reset();}
 reset(){this.latest=null;this.previous=null;this.arrived=0;this.interval=.05;this.jitter=0;this.maps={};this.history=[];this.snapshots=[];this.local=null;this.target=null;this.visualTime=0;this.clockReady=false;}
 receive(state,id,now){
  if(!state?.players)return;
  if(this.latest&&(state.time<this.latest.time||state.runId!==this.latest.runId||this.id!==id))this.reset();
  if(this.latest&&state.time===this.latest.time&&state.frame===this.latest.frame&&state.status===this.latest.status)return;
  if(this.latest){this.previous=this.latest;const gap=Math.min(.8,now-this.arrived);this.jitter=this.jitter*.8+Math.abs(gap-this.interval)*.2;this.interval=clamp(this.interval*.7+gap*.3,.035,.45);}
  this.latest=state;this.id=id;this.arrived=now;
  this.snapshots.push({state,maps:Object.fromEntries(['players','enemies','shots','hostile','zones','beams','gems'].map(name=>[name,new Map((state[name]||[]).map(e=>[e.id,e]))]))});if(this.snapshots.length>8)this.snapshots.shift();
  const me=state.players.find(p=>p.id===id);
  if(!me)return;
  if(!this.local||me.hp<=0&&!me.ghost||state.upgradePaused||state.status!=='playing')this.local={x:me.x,y:me.y};
  const target={x:me.x,y:me.y},ack=me.inputAt+me.inputAge;
  // Replay only recent, unacknowledged local movement. The timestamp belongs
  // to the guest's clock; inputAge is elapsed simulation time on the host.
  if((me.hp>0||me.ghost)&&!state.upgradePaused&&state.status==='playing'&&Number.isFinite(ack))for(const h of this.history){const dt=Math.max(0,h.to-Math.max(h.from,ack,now-.3));target.x+=h.x*me.speed*(me.ghost?.85:1)*dt;target.y+=h.y*me.speed*(me.ghost?.85:1)*dt;}
  target.x=clamp(target.x,100,(this.latest?.width||ARENA_W)-100);target.y=clamp(target.y,100,(this.latest?.height||ARENA_H)-100);if(me.hp>0)collideDestructibles(target,state.props);this.target=target;
  if(Math.hypot(target.x-this.local.x,target.y-this.local.y)>180)this.local={...target};
 }
 motion(entity,name,time){
  if(entity.id==null)return entity;
  const old=this.motionFrom?.maps[name]?.get(entity.id),current=this.motionTo?.maps[name]?.get(entity.id),span=(this.motionTo?.state.time||0)-(this.motionFrom?.state.time||0);
  if(!old||!current||span<=0||!Number.isFinite(entity.x)||!Number.isFinite(entity.y))return entity;
  const t=clamp((time-this.motionFrom.state.time)/span,0,1+.12/span);
  // Stop extrapolating an entity that has just stopped or frozen.
  const stopped=(name==='players'||name==='enemies')&&(entity.moving===false||entity.frozen>0||entity.hp<=0&&!entity.ghost);
  const factor=stopped?Math.min(1,t):t;
  return{...entity,x:old.x+(current.x-old.x)*factor,y:old.y+(current.y-old.y)*factor};
 }
 sample(input,now,dt){
  const s=this.latest;if(!s)return null;
  dt=clamp(dt,0,.05);const me=s.players.find(p=>p.id===this.id),fresh=now-this.arrived<clamp(this.interval*3+this.jitter*2,.35,1.2);
  const {x,y}=direction(input),moving=!!(fresh&&s.status==='playing'&&!s.upgradePaused&&(me?.hp>0||me?.ghost));
  if(moving){
   this.history.push({from:now-dt,to:now,x,y});this.history=this.history.filter(h=>h.to>now-1);
   const dx=x*me.speed*(me.ghost?.85:1)*dt,dy=y*me.speed*(me.ghost?.85:1)*dt;this.local.x+=dx;this.local.y+=dy;if(this.target){this.target.x=clamp(this.target.x+dx,100,(this.latest?.width||ARENA_W)-100);this.target.y=clamp(this.target.y+dy,100,(this.latest?.height||ARENA_H)-100);}
  }
  if(this.local&&this.target){const blend=1-Math.exp(-12*dt);this.local.x=clamp(this.local.x+(this.target.x-this.local.x)*blend,100,(this.latest?.width||ARENA_W)-100);this.local.y=clamp(this.local.y+(this.target.y-this.local.y)*blend,100,(this.latest?.height||ARENA_H)-100);}
  if(me?.hp>0&&this.local)collideDestructibles(this.local,s.props);
  const playing=s.status==='playing'&&!s.upgradePaused,buffer=clamp(this.interval+this.jitter*.5,.05,.5),desired=Math.max(0,s.time+(this.snapshots.length>1?Math.min(now-this.arrived,buffer+.12):0)-buffer);
  if(!playing){this.visualTime=s.time;this.clockReady=false;}
  else if(!this.clockReady||!fresh||desired-this.visualTime>.8){this.visualTime=Math.max(this.visualTime,desired);this.clockReady=true;}
  else if(desired>this.visualTime)this.visualTime=Math.min(desired,this.visualTime+dt*clamp(1+(desired-this.visualTime)*2,.9,1.35));
  this.motionFrom=this.snapshots[0];this.motionTo=this.snapshots[1]||this.motionFrom;
  for(let i=1;i<this.snapshots.length;i++){this.motionTo=this.snapshots[i];this.motionFrom=this.snapshots[i-1];if(this.motionTo.state.time>=this.visualTime)break;}
  const view={...s,visualTime:this.visualTime};
  for(const name of ['players','enemies','shots','hostile','zones','beams','gems'])view[name]=s.upgradePaused?s[name]:(s[name]||[]).map(e=>this.motion(e,name,view.visualTime));
  view.players=view.players.map(p=>p.id===this.id&&this.local?{...p,...this.local,moving:moving&&Math.hypot(x,y)>.1,face:moving&&x?(x<0?-1:1):p.face}:p);
  // Projectiles and short effects also move/expire between polls.
  const ahead=Math.max(0,view.visualTime-s.time);
  for(const name of ['shots','hostile','effects']){const out=[];for(const e of view[name]||[]){if(e.life!==undefined&&e.life-ahead<=0)continue;let item=e;if(ahead>0){item={...e,...(e.life!==undefined?{life:e.life-ahead}:{})};if(name!=='effects'&&!this.motionFrom?.maps[name]?.has(e.id)&&!['flask','bananacat'].includes(e.kind)&&e.active!==false){item.x+=(e.vx||0)*ahead;item.y+=(e.vy||0)*ahead;}}out.push(item);}view[name]=out;}
  return view;
 }
}
