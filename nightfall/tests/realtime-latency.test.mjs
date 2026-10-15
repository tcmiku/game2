import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeRoom,STATE_HISTORY_LIMIT} from '../lib/realtime.mjs';
import {World} from '../lib/game.mjs';
import {packSnapshot} from '../lib/network.mjs';

test('900ms round trips retain delta bases instead of permanently falling back to full snapshots',()=>{
 let now=0,delta=0,full=0,received=0,lastFrame=0;const queue=[];
 const host=new RealtimeRoom({id:'h',hostId:'h',lease:'l',now:()=>now});
 const guest=new RealtimeRoom({id:'g',hostId:'h',lease:'l',now:()=>now,onState:v=>{received++;lastFrame=v.snapshot.frame;}});
 function link(from,to,id){const p={id,pc:{close(){}},out:0,received:{},chunks:new Map(),channel:{readyState:'open',bufferedAmount:0,send(text){
  const data=JSON.parse(text);if(data.type==='state'&&now>2000){if(data.value.snapshot.wire===2)delta++;else full++;}
  queue.push({at:now+450,to,source:from.id,text});
 }}};from.peers.set(id,p);}
 link(host,guest,'g');link(guest,host,'h');
 const w=new World([{id:'h'},{id:'g'}]);w.s.props=[];
 w.s.enemies=Array.from({length:80},(_,id)=>({id,x:500,y:400,hp:100,maxHp:100,type:1,size:20,phase:1}));
 function flush(){while(queue[0]?.at<=now){const m=queue.shift();m.to.receive(m.to.peers.get(m.source),m.text);}}
 for(let tick=0;tick<240;tick++){
  now=tick*50;flush();w.s.frame++;w.s.time+=.05;for(const e of w.s.enemies)e.x++;
  host.broadcast(packSnapshot(w.checkpoint(),{presentation:true}),[]);guest.sendInput({serial:tick});
 }
 // Stop broadcasting and let the final snapshot and acknowledgement arrive.
 for(let i=0;i<30;i++){now+=50;flush();guest.sendInput({serial:240});}
 assert.equal(lastFrame,w.s.frame);assert.ok(received>220,'high latency must not create repeated resync gaps');
 assert.ok(delta>full*4,`steady-state full=${full}, delta=${delta}`);
 const h=host.peers.get('g'),g=guest.peers.get('h');
 assert.ok(h.pendingStates.size<=STATE_HISTORY_LIMIT);assert.ok(g.downHistory.size<=STATE_HISTORY_LIMIT);
});

test('complete acknowledgement loss keeps snapshot retention bounded',()=>{
 let now=0;const host=new RealtimeRoom({id:'h',hostId:'h',lease:'l',now:()=>now}),guest=new RealtimeRoom({id:'g',hostId:'h',lease:'l',now:()=>now});
 const g={id:'h',out:0,received:{},chunks:new Map(),channel:{readyState:'open',bufferedAmount:0,send(){}}};guest.peers.set('h',g);
 const h={id:'g',out:0,received:{},chunks:new Map(),channel:{readyState:'open',bufferedAmount:0,send:text=>guest.receive(g,text)}};host.peers.set('g',h);
 for(let i=0;i<300;i++){now+=50;host.broadcast({wire:1,runId:'run',frame:i,players:[],entities:{}},[]);}
 assert.equal(h.pendingStates.size,STATE_HISTORY_LIMIT);assert.equal(g.downHistory.size,STATE_HISTORY_LIMIT);assert.equal(g.downlink.frame,299);
});
