import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeRoom,STATE_HISTORY_LIMIT} from '../lib/realtime.mjs';
import {World} from '../lib/game.mjs';
import {packSnapshot,presentationPacket} from '../lib/network.mjs';

test('four-player dense snapshots converge under latency, packet loss and reordering without a transport backlog',()=>{
 let now=0,sequence=0,bytes=0,fullBytes=0,loss=true;const queue=[],states=[],rooms=[],encode=[];
 const host=new RealtimeRoom({id:'h',hostId:'h',lease:'l',now:()=>now});rooms.push(host);
 function link(from,to,id){const p={id,pc:{close(){}},out:0,received:{},chunks:new Map(),channel:{readyState:'open',bufferedAmount:0,send(text){
  if(from===host)bytes+=text.length;const seq=++sequence;if(loss&&seq%19===0)return;queue.push({at:now+25+seq%4*15,to,p:null,text,source:from.id});
 }}};from.peers.set(id,p);return p;}
 for(let i=0;i<3;i++){const g=new RealtimeRoom({id:'g'+i,hostId:'h',lease:'l',now:()=>now,onState:v=>states[i]=v.snapshot});rooms.push(g);link(host,g,g.id);link(g,host,'h');}
 const w=new World(rooms.map(r=>({id:r.id})),()=>.4);w.s.props=[];
 w.s.enemies=Array.from({length:220},(_,id)=>({id,x:1500+id,y:800,hp:10000,maxHp:10000,type:1,size:20,phase:.1,moving:true}));
 w.s.gems=Array.from({length:260},(_,id)=>({id:1000+id,x:100+id*5,y:100,v:2,type:'gem'}));
 w.s.shots=Array.from({length:180},(_,id)=>({id:2000+id,owner:'h',weapon:'blade',x:1200,y:700,vx:300,vy:0,life:5,born:0,damage:10,hit:[],pierce:3}));
 function flush(){queue.sort((a,b)=>a.at-b.at);while(queue[0]?.at<=now){const m=queue.shift(),p=m.to.peers.get(m.source);m.to.receive(p,m.text);}}
 for(let tick=0;tick<110;tick++){
  now=tick*50;if(tick===90)loss=false;flush();w.s.frame++;w.s.time+=.05;for(const e of w.s.enemies)e.x-=.6;for(const b of w.s.shots){b.x+=15;b.life=5;}
  if(tick===35)w.s.enemies.splice(0,20);if(tick===55)w.s.gems.splice(0,50);
  const snapshot=presentationPacket(packSnapshot(w.checkpoint()));fullBytes+=JSON.stringify(snapshot).length*3;const start=performance.now();host.broadcast(snapshot,[]);encode.push(performance.now()-start);
  for(const guest of rooms.slice(1))guest.sendInput({x:1,y:0,serial:tick});assert.ok(queue.length<100);
 }
 for(let i=0;i<8;i++){now+=50;flush();for(const g of rooms.slice(1))g.sendInput({});}now+=500;flush();
 for(const s of states){assert.equal(s.frame,w.s.frame);assert.equal(s.entities.enemies.rows.length,200);assert.equal(s.entities.gems.rows.length,210);}
 for(const room of rooms)for(const p of room.peers.values()){assert.ok((p.pendingStates?.size||0)<=STATE_HISTORY_LIMIT);assert.ok((p.downHistory?.size||0)<=STATE_HISTORY_LIMIT);assert.ok(p.chunks.size<=6);}
 assert.ok(bytes/fullBytes<.65,`${bytes}/${fullBytes}`);encode.sort((a,b)=>a-b);
 console.log(`4P loss/reorder: payload -${Math.round((1-bytes/fullBytes)*100)}%, encode p95 ${encode[Math.floor(encode.length*.95)].toFixed(2)}ms; 220 enemies, 180 shots, 260 gems`);
});
