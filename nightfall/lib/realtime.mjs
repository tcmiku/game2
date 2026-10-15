import {cleanCursor} from './shared-draft.mjs';
import {applySnapshotDelta,smallerPacket} from './snapshot-delta.mjs';

// 20 Hz snapshots need more than 16 entries to cover a high-latency round trip.
// Bounded on both sides, including when acknowledgements are lost.
export const STATE_HISTORY_LIMIT=64;
const bounded=(value,min,max)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):0;
export function cleanRealtimeInput(value={}){
 value=value&&typeof value==='object'?value:{};
 return{x:bounded(value.x,-1,1),y:bounded(value.y,-1,1),choice:typeof value.choice==='string'?value.choice.slice(0,32):'',seq:bounded(value.seq,0,Number.MAX_SAFE_INTEGER),serial:Math.floor(bounded(value.serial,0,Number.MAX_SAFE_INTEGER)),moveAt:Number.isFinite(value.moveAt)?Math.max(0,value.moveAt):undefined,draftId:typeof value.draftId==='string'?value.draftId.slice(0,180):undefined,cursor:cleanCursor(value.cursor)};
}
export function cleanSignals(value){
 if(!Array.isArray(value))return[];
 return value.slice(0,3).filter(s=>s&&typeof s.to==='string'&&s.to.length<=128&&typeof s.nonce==='string'&&s.nonce.length<=128&&['offer','answer'].includes(s.type)&&typeof s.sdp==='string'&&s.sdp.length<=12000).map(({to,nonce,type,sdp})=>({to,nonce,type,sdp}));
}

/** Star topology: HTTP authenticates members and exchanges SDP; gameplay uses
 * disposable, unordered packets. HTTP snapshots remain the recovery path. */
export class RealtimeRoom{
 constructor({id,hostId,lease,onInput=(_id,_input)=>{},onState=(_state)=>{},onChange=()=>{},PeerConnection=globalThis.RTCPeerConnection,now=()=>performance.now()}){
  Object.assign(this,{id,hostId,lease,onInput,onState,onChange,PeerConnection,now});this.peers=new Map();this.retryAt=new Map();this.signals=[];this.inputs=new Map();this.lastStateAt=-Infinity;this.rtt=0;this.closed=false;this.packetId=0;
 }
 get supported(){return !!this.PeerConnection;}
 get host(){return this.id===this.hostId;}
 get fresh(){return this.now()-this.lastStateAt<450&&this.peers.get(this.hostId)?.channel?.readyState==='open';}
 get connected(){return [...this.peers.values()].some(p=>p.channel?.readyState==='open');}
 allConnected(members){return this.host&&members.filter(m=>m.id!==this.id).every(m=>this.peers.get(m.id)?.channel?.readyState==='open'&&this.now()-(this.inputs.get(m.id)?.at??-Infinity)<1000&&this.now()-(this.peers.get(m.id)?.ackAt??-Infinity)<1200);}
 get wantsState(){return [...this.peers.values()].some(p=>p.channel?.readyState==='open'&&this.now()>=(p.nextStateAt||0)&&p.channel.bufferedAmount<=65536);}
 inputFor(id){const input=this.inputs.get(id);return input&&this.now()-input.at<350?input.value:null;}
 drop(id){const p=this.peers.get(id);if(!p)return;this.peers.delete(id);this.inputs.delete(id);this.signals=this.signals.filter(s=>s.to!==id);p.pc.close();}
 close(){this.closed=true;for(const id of [...this.peers.keys()])this.drop(id);this.signals=[];}
 async update({hostId,lease,members=[]}){
  if(this.closed||!this.supported)return;
  if(this.hostId!==hostId||this.lease!==lease){for(const id of [...this.peers.keys()])this.drop(id);this.lastStateAt=-Infinity;this.retryAt.clear();this.hostId=hostId;this.lease=lease;}
  const targets=members.filter(m=>m.id!==this.id&&(this.host||m.id===hostId));
  for(const id of [...this.peers.keys()])if(!targets.some(m=>m.id===id))this.drop(id);
  for(const member of targets){
   let p=this.peers.get(member.id);
   if(this.host&&p&&p.channel?.readyState!=='open'&&this.now()-p.created>15000){this.drop(member.id);p=null;}
   const signal=cleanSignals(member.input?.signals).find(s=>s.to===this.id);
   if(this.host){
    if(!p&&this.now()<(this.retryAt.get(member.id)||0))continue;
    if(!p){p=this.create(member.id,`${this.lease}:${++this.packetId}`);const peer=p;this.offer(peer).catch(()=>this.failed(peer));}
    if(signal?.type==='answer'&&signal.nonce===p.nonce&&!p.answering&&!p.pc.remoteDescription){p.answering=true;const peer=p;peer.pc.setRemoteDescription({type:'answer',sdp:signal.sdp}).catch(()=>this.failed(peer));}
   }else if(signal?.type==='offer'&&(!p||p.nonce!==signal.nonce)){
    if(p)this.drop(member.id);p=this.create(member.id,signal.nonce);const peer=p;this.answer(peer,signal).catch(()=>this.failed(peer));
   }
  }
 }
 failed(p){if(this.peers.get(p.id)===p){this.drop(p.id);this.retryAt.set(p.id,this.now()+3000);this.onChange();}}
 create(id,nonce){
  const pc=new this.PeerConnection({iceServers:[{urls:'stun:stun.cloudflare.com:3478'}]});
  const p={id,nonce,pc,created:this.now(),out:0,received:{},chunks:new Map(),channel:null};this.peers.set(id,p);
  pc.ondatachannel=event=>this.attach(p,event.channel);
  pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(pc.connectionState)&&this.peers.get(id)===p){this.failed(p);}};
  return p;
 }
 attach(p,channel){
  if(p.channel){channel.close();return;}p.channel=channel;
  channel.onopen=()=>{if(this.peers.get(p.id)!==p)return;this.signals=this.signals.filter(s=>s.to!==p.id);this.onChange();};
  channel.onclose=()=>{if(this.peers.get(p.id)===p)this.failed(p);};
  channel.onmessage=event=>this.receive(p,event.data);
 }
 async gather(p){
  if(p.pc.iceGatheringState!=='complete')await new Promise(resolve=>{
   const done=()=>{if(p.pc.iceGatheringState==='complete'){clearTimeout(timer);p.pc.removeEventListener('icegatheringstatechange',done);resolve();}};
   const timer=setTimeout(()=>{p.pc.removeEventListener('icegatheringstatechange',done);resolve();},2000);p.pc.addEventListener('icegatheringstatechange',done);
  });
  if(this.closed||this.peers.get(p.id)!==p)return;
  const description=p.pc.localDescription;if(!description)return;
  this.signals=this.signals.filter(s=>s.to!==p.id);this.signals.push({to:p.id,nonce:p.nonce,type:description.type,sdp:description.sdp});this.onChange();
 }
 async offer(p){this.attach(p,p.pc.createDataChannel('nightfall',{ordered:false,maxRetransmits:0}));await p.pc.setLocalDescription(await p.pc.createOffer());await this.gather(p);}
 async answer(p,signal){await p.pc.setRemoteDescription({type:'offer',sdp:signal.sdp});await p.pc.setLocalDescription(await p.pc.createAnswer());await this.gather(p);}
 send(p,type,value){
  if(p?.channel?.readyState!=='open'||p.channel.bufferedAmount>65536)return false;
  const text=JSON.stringify({lease:this.lease,seq:++p.out,type,value}),total=Math.ceil(text.length/12000),bytes=new TextEncoder().encode(text).byteLength;if(total>24||bytes+p.channel.bufferedAmount>262144)return false;
  try{if(total===1)p.channel.send(text);else for(let part=0;part<total;part++)p.channel.send(JSON.stringify({chunk:p.out,part,total,text:text.slice(part*12000,(part+1)*12000)}));return true;}catch{return false;}
 }
 receive(p,text){
  if(this.closed||this.peers.get(p.id)!==p||typeof text!=='string'||text.length>60000)return;
  try{
   let data=JSON.parse(text);
   if(data.chunk!==undefined){
    if(!Number.isInteger(data.chunk)||data.chunk<=(p.received.state||0)||!Number.isInteger(data.total)||data.total<2||data.total>24||!Number.isInteger(data.part)||data.part<0||data.part>=data.total||typeof data.text!=='string'||data.text.length>12000)return;
    for(const [id,parts]of p.chunks)if(this.now()-parts.at>1500)p.chunks.delete(id);
    let parts=p.chunks.get(data.chunk);if(!parts){if(p.chunks.size>=6)p.chunks.delete(p.chunks.keys().next().value);parts={at:this.now(),total:data.total,values:new Map()};p.chunks.set(data.chunk,parts);}
    if(parts.total!==data.total)return;parts.values.set(data.part,data.text);if(parts.values.size!==parts.total)return;
    data=JSON.parse(Array.from({length:parts.total},(_,i)=>parts.values.get(i)).join(''));p.chunks.delete(data.seq);
   }
   if(data.lease!==this.lease||!['input','state','pong'].includes(data.type)||!Number.isInteger(data.seq)||data.seq<=(p.received[data.type]||0))return;p.received[data.type]=data.seq;
   if(this.host&&data.type==='input'){
    const ack=data.value?.stateAck,pending=p.pendingStates?.get(ack);
    if(data.value?.resync){p.stateBase=null;p.pendingStates?.clear();}
    else if(pending&&ack>(p.stateBase?.revision||0)){
     p.stateBase={revision:ack,snapshot:pending.snapshot};p.ackAt=this.now();
     for(const revision of p.pendingStates.keys())if(revision<=ack)p.pendingStates.delete(revision);
    }
    const value=cleanRealtimeInput(data.value);this.inputs.set(p.id,{value,at:this.now()});this.onInput(p.id,value);this.send(p,'pong',data.value?.ping);
   }else if(!this.host&&p.id===this.hostId&&data.type==='state'){
    if(![1,2].includes(data.value?.snapshot?.wire))return;
    const delta=data.value.snapshot,base=delta.wire===2?p.downHistory?.get(delta.base):undefined;
    let snapshot;try{snapshot=applySnapshotDelta(base,delta,delta.base);}catch{p.resync=true;this.sendInput(this.lastInput||{});return;}
    p.downlink=snapshot;p.downRevision=data.value.revision??data.seq;p.downHistory??=new Map();p.downHistory.set(p.downRevision,snapshot);while(p.downHistory.size>STATE_HISTORY_LIMIT)p.downHistory.delete(p.downHistory.keys().next().value);
    p.resync=false;this.lastStateAt=this.now();this.onState({...data.value,snapshot});
   }else if(!this.host&&data.type==='pong'&&Number.isFinite(data.value)){const rtt=this.now()-data.value;if(rtt>=0&&rtt<5000)this.rtt=this.rtt?this.rtt*.8+rtt*.2:rtt;}
  }catch{/* Bad/incomplete packets are disposable; the next snapshot is whole. */}
 }
 sendInput(input){this.lastInput=cleanRealtimeInput(input);const p=this.peers.get(this.hostId);return this.send(p,'input',{...this.lastInput,ping:this.now(),stateAck:p?.downRevision||0,resync:!!p?.resync});}
 broadcast(snapshot,members){
  const deltas=new Map();
  for(const p of this.peers.values()){
   if(this.now()<(p.nextStateAt||0))continue;
   if(p.channel?.readyState!=='open'||p.channel.bufferedAmount>65536){p.nextStateAt=this.now()+100;continue;}
   p.pendingStates??=new Map();const revision=(p.stateRevision||0)+1,base=p.stateBase;
   let packet=snapshot;if(base&&snapshot.entities&&base.snapshot.entities){packet=deltas.get(base.snapshot);if(packet)packet=packet.wire===2?{...packet,base:base.revision}:packet;else{packet=smallerPacket(base.snapshot,snapshot,base.revision);deltas.set(base.snapshot,packet);}}
   if(this.send(p,'state',{snapshot:packet,revision,members})){
    p.stateRevision=revision;p.pendingStates.set(revision,{snapshot,at:this.now()});while(p.pendingStates.size>STATE_HISTORY_LIMIT)p.pendingStates.delete(p.pendingStates.keys().next().value);
   }
   p.nextStateAt=this.now()+(p.channel.bufferedAmount>32768?100:48);
  }
 }
}
