// Run with: node tools/benchmark-network.mjs (no browser or room required).
import assert from 'node:assert/strict';
import {World} from '../lib/game.mjs';
import {packSnapshot,presentationPacket,unpackSnapshot} from '../lib/network.mjs';
const world=new World(Array.from({length:4},(_,i)=>({id:`p${i}`})));
world.s.enemies=Array.from({length:220},(_,id)=>({id,x:id*2,y:800,hp:100,maxHp:100,type:1,speed:30,hit:0,phase:.2,moving:true,skillCd:2}));
world.s.shots=Array.from({length:180},(_,id)=>({id:1000+id,x:1200,y:800,vx:200,vy:0,life:3,weapon:'blade',damage:20,pierce:3,hit:[]}));
world.s.gems=Array.from({length:260},(_,id)=>({id:2000+id,x:id*3,y:500,v:1,type:'gem'}));
const state=world.checkpoint(),legacy=()=>presentationPacket(packSnapshot(state,{authoritative:true})),direct=()=>packSnapshot(state,{presentation:true});
assert.deepEqual(JSON.parse(JSON.stringify(direct())),JSON.parse(JSON.stringify(legacy())));
for(const [name,encode] of [['two-pass',legacy],['single-pass',direct]]){
 const times=[];
 for(let i=0;i<1100;i++){const start=performance.now();unpackSnapshot(encode());if(i>=100)times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);
 console.log(`${name}: encode + decode median ${times[500].toFixed(3)}ms, p95 ${times[950].toFixed(3)}ms`);
}
