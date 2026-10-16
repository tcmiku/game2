import { normalizeBoons } from '../../../lib/camp.mjs';
import {normalizeAppearance} from '../../../lib/appearance.mjs';
import {cleanRealtimeInput,cleanSignals} from '../../../lib/realtime.mjs';
import { WEAPONS,normalizeEffects } from '../../../lib/equipment.mjs';
import {env} from 'cloudflare:workers';
import {unpackSnapshot,presentationPacket} from '../../../lib/network.mjs';
import {applySnapshotDelta,checkpointPacket,smallerPacket} from '../../../lib/snapshot-delta.mjs';
import {MEMBER_GRACE_MS,HOST_LEASE_MS,MEMBER_ONLINE_MS,ROOM_TTL_MS} from '../../../lib/room-session.mjs';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const positiveInteger=(value:any)=>Number.isFinite(Number(value))?Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(Number(value)))):0;
const cleanInput=(value:any={})=>({...cleanRealtimeInput(value),appearance:normalizeAppearance(value.appearance),boons:normalizeBoons(value.boons),effects:normalizeEffects(value.effects),weapon:WEAPONS.includes(value.weapon)?value.weapon:'blade',signals:cleanSignals(value.signals),serial:positiveInteger(value.serial)});
export async function POST(req:Request){
 try{
  if(Number(req.headers.get('content-length')||0)>300000)return reply({error:'数据过大'},413);
  const text=await req.text();if(new TextEncoder().encode(text).length>300000)return reply({error:'数据过大'},413);
  let b:any;try{b=JSON.parse(text);}catch{return reply({error:'无效请求'},400);}if(!b||typeof b!=='object'||!['create','join','sync','resume','leave'].includes(b.action))return reply({error:'无效请求'},400);
  const db=env.DB;if(!db)return reply({error:'联机暂不可用'},503);const now=Date.now();
  if(b.action==='create'){
   const id=crypto.randomUUID(),token=crypto.randomUUID(),lease=crypto.randomUUID();let code='';
   await db.batch([db.prepare('DELETE FROM nightfall_members WHERE seen < ?').bind(now-7200000),db.prepare('DELETE FROM nightfall_rooms WHERE updated < ?').bind(now-7200000)]);
   for(let i=0;i<5;i++){code=crypto.randomUUID().replaceAll('-','').slice(0,6).toUpperCase();const created=await db.prepare('INSERT OR IGNORE INTO nightfall_rooms (code,host,status,snapshot,updated) VALUES (?,?,?,?,?)').bind(code,id,'lobby',JSON.stringify({_lease:lease,_revision:0,_tickAt:now}),now).run();if(created.meta.changes)break;code='';}
   if(!code)return reply({error:'房间繁忙，请重试'},503);
   await db.prepare('INSERT INTO nightfall_members (id,code,token,name,input,seen) VALUES (?,?,?,?,?,?)').bind(id,code,token,String(b.name||'旅人').slice(0,12),JSON.stringify({...cleanInput({weapon:b.weapon,appearance:b.appearance,boons:b.boons,effects:b.effects}),slot:0}),now).run();
   return reply({code,id,token,host:true,hostId:id,lease,serial:0});
  }
  const code=String(b.code||'').toUpperCase(),id=String(b.id||''),token=String(b.token||'');
  const replacing=b.action==='sync'&&!!b.snapshot&&b.snapshot.wire!==2&&(!b.hostId||b.hostId===id);
  const lean=b.action==='sync'&&b.wire===2&&!b.snapshot&&b.hostId!==id;
  const lookup=()=>db.prepare(`SELECT r.code,r.host,r.status,r.updated,
   CASE WHEN r.host=? AND ?=1 AND (?='' OR ?=COALESCE(json_extract(r.snapshot,'$._lease'),r.host)) THEN NULL
    WHEN ?=1 AND r.host=? AND COALESCE(json_extract(r.snapshot,'$._lease'),r.host)=? AND json_type(r.snapshot,'$._view')='object' AND r.updated>=? AND (r.status<>'playing' OR COALESCE(json_extract(r.snapshot,'$._tickAt'),r.updated)>=?) THEN NULL ELSE r.snapshot END AS snapshot,
   CASE WHEN ?=1 AND r.host<>? AND COALESCE(json_extract(r.snapshot,'$._revision'),0)<>? THEN
    CASE WHEN json_extract(r.snapshot,'$._deltaBase')=? THEN json_extract(r.snapshot,'$._delta') ELSE json_extract(r.snapshot,'$._view') END END AS presentation,
   COALESCE(json_extract(r.snapshot,'$._lease'),r.host) AS lease,
   json_extract(r.snapshot,'$._revision') AS revision,json_extract(r.snapshot,'$._tickAt') AS tickAt,
   json_extract(r.snapshot,'$.frame') AS frame,json_extract(r.snapshot,'$.time') AS time,json_extract(r.snapshot,'$.runId') AS runId,
   m.id AS memberId,m.seen AS memberSeen FROM nightfall_rooms r LEFT JOIN nightfall_members m ON m.code=r.code AND m.id=? AND m.token=? WHERE r.code=?`).bind(id,replacing?1:0,String(b.lease||''),String(b.lease||''),lean?1:0,String(b.hostId||''),String(b.lease||''),now-HOST_LEASE_MS,now-HOST_LEASE_MS,lean?1:0,id,positiveInteger(b.since),positiveInteger(b.since),id,token,code).first<any>();
  const savedState=(value:any)=>value.snapshot?JSON.parse(value.snapshot):{_lease:value.lease,_revision:value.revision||0,_tickAt:value.tickAt,frame:value.frame,time:value.time,runId:value.runId};
  let room=await lookup();if(!room||room.updated<now-ROOM_TTL_MS)return reply({error:'房间已结束或不存在'},404);
  if(b.action==='join'){
   if(room.status!=='lobby')return reply({error:'这场长夜已经开始'},409);
   const memberId=crypto.randomUUID(),memberToken=crypto.randomUUID();
   const result=await db.prepare(`INSERT INTO nightfall_members (id,code,token,name,input,seen) SELECT ?,?,?,?,json_set(?,'$.slot',(SELECT value FROM json_each('[0,1,2,3]') WHERE value NOT IN (SELECT COALESCE(json_extract(input,'$.slot'),-1) FROM nightfall_members WHERE code=? AND seen>?) LIMIT 1)),? WHERE (SELECT COUNT(*) FROM nightfall_members WHERE code=? AND seen>?)<4 AND EXISTS(SELECT 1 FROM nightfall_rooms WHERE code=? AND status='lobby')`).bind(memberId,code,memberToken,String(b.name||'旅人').slice(0,12),JSON.stringify(cleanInput({weapon:b.weapon,appearance:b.appearance,boons:b.boons,effects:b.effects})),code,now-MEMBER_GRACE_MS,now,code,now-MEMBER_GRACE_MS,code).run();
   if(!result.meta.changes)return reply({error:'房间已满'},409);
   const saved=savedState(room);return reply({code,id:memberId,token:memberToken,host:false,hostId:room.host,lease:saved._lease||room.host,serial:0});
  }
  if(!room.memberId)return reply({error:'连接已失效'},403);
  if(room.memberSeen<now-MEMBER_GRACE_MS)return reply({error:'重连时间已结束'},410);
  if(b.action==='leave'){
   await db.prepare('DELETE FROM nightfall_members WHERE id=? AND token=?').bind(id,token).run();
   if(room.host===id){
    const next=await db.prepare('SELECT id FROM nightfall_members WHERE code=? AND seen>? ORDER BY rowid ASC LIMIT 1').bind(code,now-MEMBER_GRACE_MS).first<any>();
    if(next){const saved=savedState(room);saved._lease=crypto.randomUUID();saved._tickAt=now;saved._revision=(saved._revision||0)+1;await db.prepare('UPDATE nightfall_rooms SET host=?,snapshot=?,updated=? WHERE code=? AND host=?').bind(next.id,JSON.stringify(saved),now,code,id).run();}
    else await db.prepare('DELETE FROM nightfall_rooms WHERE code=? AND host=?').bind(code,id).run();
   }
   return reply({ok:true});
  }
  let saved=savedState(room),lease=saved._lease||room.host;
  // A compare-and-swap election fences off late writes from the former host.
  if(room.host!==id&&(room.updated<now-HOST_LEASE_MS||room.status==='playing'&&(saved._tickAt||room.updated)<now-HOST_LEASE_MS)){
   const next=await db.prepare('SELECT id FROM nightfall_members WHERE code=? AND id<>? AND (seen>? OR id=?) ORDER BY rowid ASC LIMIT 1').bind(code,room.host,now-HOST_LEASE_MS*2,id).first<any>();
   if(next){saved._lease=crypto.randomUUID();saved._tickAt=now;saved._revision=(saved._revision||0)+1;await db.prepare('UPDATE nightfall_rooms SET host=?,snapshot=?,updated=? WHERE code=? AND host=? AND updated=?').bind(next.id,JSON.stringify(saved),now,code,room.host,room.updated).run();room=await lookup();if(!room)return reply({error:'房间已结束或不存在'},404);saved=savedState(room);lease=saved._lease||room.host;}
  }
  const isHost=room.host===id,changed=b.hostId&&b.hostId!==room.host||b.lease&&b.lease!==lease,authority=b.action==='resume'||!!changed;
  const queries=[];const input=cleanInput(b.input);
  if(b.action==='resume')queries.push(db.prepare('UPDATE nightfall_members SET seen=?,input=json_set(input,\'$.x\',0,\'$.y\',0,\'$.choice\',\'\',\'$.serial\',COALESCE(json_extract(input,\'$.serial\'),0)+1000) WHERE id=?').bind(now,id));
  else queries.push(db.prepare(`UPDATE nightfall_members SET input=CASE WHEN ?>=COALESCE(json_extract(input,\'$.serial\'),0) THEN json_set(?,'$.slot',COALESCE(json_extract(input,'$.slot'),0)) ELSE input END,seen=? WHERE id=?`).bind(input.serial,JSON.stringify(input),now,id));
  let writeIndex=-1,resync=false;
  if(isHost&&!authority){
   let status=['lobby','playing','over','victory'].includes(b.status)?b.status:room.status;
   let next=saved;
   if(b.snapshot&&typeof b.snapshot==='object'&&!Array.isArray(b.snapshot)){
    let packet:any;try{packet=applySnapshotDelta(saved,b.snapshot,saved._revision||0);}catch{resync=true;}
    if(packet){
     const payload=JSON.stringify(packet);if(payload.length>250000)return reply({error:'房间数据过大'},413);
     const progressed=packet.frame!==saved.frame||packet.time!==saved.time||packet.runId!==saved.runId;
     const view=presentationPacket(packet),delta=saved._view?smallerPacket(saved._view,view,saved._revision||0):undefined;
     next={...packet,_view:view,_delta:delta?.wire===2?delta:undefined,_deltaBase:delta?.wire===2?saved._revision:undefined,_lease:lease,_tickAt:progressed?now:saved._tickAt||now,_revision:(saved._revision||0)+1};
    }
   }
   if(resync)status=room.status;
   writeIndex=queries.length;queries.push(db.prepare('UPDATE nightfall_rooms SET snapshot=?,status=?,updated=? WHERE code=? AND host=? AND COALESCE(json_extract(snapshot,\'$._lease\'),host)=?').bind(JSON.stringify(next),status,now,code,id,lease));
   saved=next;room.status=status;room.updated=now;
  }
  queries.push(db.prepare('SELECT id,name,input,seen FROM nightfall_members WHERE code=? AND seen>? ORDER BY rowid ASC').bind(code,now-MEMBER_GRACE_MS));
  const result=await db.batch<any>(queries),members=result.at(-1)!.results.map((m:any,i:number)=>{const connected=m.seen>=now-MEMBER_ONLINE_MS,input=JSON.parse(m.input);return{id:m.id,name:m.name,seen:m.seen,connected,slot:input.slot??i,input:connected&&m.seen>now-750?input:{...input,x:0,y:0,choice:''}};});
  if(writeIndex>=0&&!result[writeIndex].meta.changes){room=await lookup();if(!room)return reply({error:'房间已结束或不存在'},404);saved=savedState(room);lease=saved._lease||room.host;}
  const host=room.host===id,roleChanged=!!changed||isHost!==host;
  let snapshot=b.action==='resume'||roleChanged||!host&&b.since!==saved._revision?checkpointPacket(saved):undefined;
  if(snapshot&&b.wire===2&&!host)snapshot=room.presentation&&!roleChanged?JSON.parse(room.presentation):b.action!=='resume'&&!roleChanged&&b.since===saved._deltaBase&&saved._delta?saved._delta:saved._view||presentationPacket(saved);
  return reply({host,hostId:room.host,lease,status:room.status,revision:saved._revision||0,authority:b.action==='resume'||roleChanged,resync:resync||undefined,snapshot:b.wire===1||b.wire===2?snapshot:unpackSnapshot(snapshot),members,serverTime:now});
 }catch(error){console.error('Room request failed',error);return reply({error:'连接暂时中断，请重试'},500);}
}
