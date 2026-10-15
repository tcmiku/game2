import test from 'node:test';
import assert from 'node:assert/strict';
import {RealtimeRoom,cleanRealtimeInput,cleanSignals} from '../lib/realtime.mjs';
import {syncDelay} from '../lib/network.mjs';
import {acceptSnapshot,packSnapshot,presentationPacket} from '../lib/network.mjs';
import {World} from '../lib/game.mjs';
const room=(options={})=>new RealtimeRoom({id:'a',hostId:'a',lease:'lease',PeerConnection:undefined,...options});
function peer(r,id){const p={id,pc:{close(){}},out:0,received:{},chunks:new Map(),channel:{readyState:'open',bufferedAmount:0,send(){}}};r.peers.set(id,p);return p;}

test('unavailable WebRTC preserves HTTP fallback and only healthy peers slow database polling',()=>{
 const r=room({PeerConnection:null});assert.equal(r.supported,false);assert.equal(r.fresh,false);assert.equal(syncDelay(0,10,false,0,false,0,true),640);assert.equal(syncDelay(0,10,false,0,false),40);
});
test('large snapshots reassemble out of order; missing fragments never become a partial world',()=>{
 const received=[],host=room(),guest=room({id:'b',onState:value=>received.push(value)}),h=peer(host,'b'),g=peer(guest,'a'),sent=[];
 h.channel.send=text=>sent.push(text);const value={snapshot:{wire:1,players:[],payload:'月光'.repeat(40000)}};host.send(h,'state',value);assert.ok(sent.length>1);
 // A newer small pong must not discard a fragmented state on another stream.
 guest.receive(g,JSON.stringify({lease:'lease',seq:99,type:'pong',value:0}));
 for(const text of sent.slice(1).reverse())guest.receive(g,text);assert.equal(received.length,0);guest.receive(g,sent[0]);assert.deepEqual(received,[value]);
 for(const text of sent)guest.receive(g,text);assert.equal(received.length,1);
});
test('stale leases, duplicate and reversed inputs are rejected; send queues are bounded',()=>{
 let applied=0;const r=room({onInput:()=>applied++}),p=peer(r,'b');
 const packet=(seq,lease='lease')=>JSON.stringify({type:'input',seq,lease,value:{x:2,y:-2,choice:'power',seq:4}});
 r.receive(p,packet(3));r.receive(p,packet(2));r.receive(p,packet(3));r.receive(p,packet(4,'old'));assert.equal(applied,1);assert.equal(r.inputFor('b').x,1);
 p.channel.bufferedAmount=70000;assert.equal(r.send(p,'state',{}),false);
});
test('a lost peer stops local prediction freshness and a lease change closes old channels',async()=>{
 let now=100;const r=room({id:'b',PeerConnection:class {},now:()=>now}),p=peer(r,'a');r.lastStateAt=100;assert.equal(r.fresh,true);now=600;assert.equal(r.fresh,false);
 await r.update({hostId:'b',lease:'next',members:[]});assert.equal(r.peers.size,0);assert.equal(r.host,true);
});
test('signaling and input payloads cannot inject authority or unbounded SDP',()=>{
 const input=cleanRealtimeInput({x:Infinity,y:4,seq:-2,cursor:{round:'r',x:.1,y:.5},snapshot:{players:[]},boons:{damage:999}});assert.equal(input.x,0);assert.equal(input.y,1);assert.equal(input.seq,0);assert.equal(input.snapshot,undefined);assert.equal(input.boons,undefined);
 assert.equal(cleanSignals([{to:'b',nonce:'n',type:'offer',sdp:'x'.repeat(12001)}]).length,0);assert.equal(cleanSignals([{to:'b',nonce:'n',type:'offer',sdp:'valid'}]).length,1);
});

test('RTC-to-HTTP fallback never rewinds a newer displayed world, except on host takeover',()=>{
 const a={runId:'run',frame:100,time:5,players:[]},old={...a,frame:90,time:4.5};
 assert.equal(acceptSnapshot(a,old),false);assert.equal(acceptSnapshot(a,old,true),true);assert.equal(acceptSnapshot(a,{...a,frame:101,time:5.02}),true);
});
test('late HTTP movement cannot restart a player stopped by RTC; resume can reset the local clock',()=>{
 const w=new World([{id:'a'}]),p=w.s.players[0];w.spawnCd=1e9;
 w.input('a',{serial:10,moveAt:20,x:0,y:0});w.input('a',{serial:9,moveAt:19,x:1,y:0});w.input('a',{serial:10,moveAt:19,x:1,y:0});const x=p.x;w.step(.02);assert.equal(p.x,x);
 w.input('a',{serial:1010,moveAt:1,x:1,y:0});w.step(.02);assert.ok(p.x>x,'new session generation accepts a reset performance clock');
 const stopped=p.x;w.reconcileMembers([{id:'a',connected:false,input:{serial:1010}}]);w.step(.02);assert.equal(p.x,stopped,'disconnect must clear movement even after a high serial was accepted');
});
test('acknowledged delta bases survive delayed acknowledgements, and missing bases request a full snapshot',()=>{
 let now=0;const host=room({now:()=>now}),states=[],guest=room({id:'b',now:()=>now,onState:v=>states.push(v.snapshot)}),h=peer(host,'b'),g=peer(guest,'a'),sent=[],back=[];
 h.channel.send=t=>sent.push(t);g.channel.send=t=>back.push(t);
 const w=new World([{id:'a'},{id:'b'}]);w.s.enemies=Array.from({length:80},(_,id)=>({id,x:500,y:400,hp:100,maxHp:100,type:1,size:20,phase:1}));
 const send=()=>{now+=50;w.s.frame++;w.s.time+=.05;for(const e of w.s.enemies)e.x++;host.broadcast(presentationPacket(packSnapshot(w.checkpoint())),[]);while(sent.length)guest.receive(g,sent.shift());};
 send();guest.sendInput({});while(back.length)host.receive(h,back.shift());sent.length=0;
 send();send();assert.equal(states.length,3,'two deltas based on the same acknowledged old frame both apply');assert.equal(g.downlink.frame,w.s.frame);
 g.downHistory.clear();send();assert.equal(g.resync,true);while(back.length)host.receive(h,back.shift());sent.length=0;send();assert.equal(g.resync,false);assert.equal(states.at(-1).frame,w.s.frame);
 assert.ok(h.pendingStates.size<=16);assert.ok(g.downHistory.size<=16);
});
test('partial snapshots are not evicted by unrelated pong sequence numbers',()=>{
 let now=0;const r=room({id:'b',now:()=>now}),g=peer(r,'a'),host=room(),h=peer(host,'b'),sent=[];h.channel.send=t=>sent.push(t);
 host.send(h,'state',{snapshot:{wire:1,players:[],test:'x'.repeat(40000)}});const chunks=[...sent];r.receive(g,chunks[0]);
 for(let i=0;i<10;i++)r.receive(g,JSON.stringify({lease:'lease',type:'pong',seq:100+i,value:now}));now=300;
 for(const t of chunks.slice(1))r.receive(g,t);assert.equal(g.downlink.test.length,40000);
});
test('closed channels enter a short retry cooldown and byte budgets include UTF-8 expansion',()=>{
 let closed=0;const r=room({PeerConnection:class{close(){closed++;}},now:()=>100}),p=r.create('b','nonce');
 r.attach(p,{readyState:'open',bufferedAmount:0,send(){throw Error('oversized packet must not be sent');}});
 assert.equal(r.send(p,'state',{text:'月'.repeat(100000)}),false);p.channel.onclose();assert.equal(r.peers.size,0);assert.equal(closed,1);assert.equal(r.retryAt.get('b'),3100);
});
