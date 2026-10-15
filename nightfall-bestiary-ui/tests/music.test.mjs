import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreStep,SCORES,ChipMusic} from '../lib/music.mjs';
test('both original chip scores repeat exactly with finite bounded voices and different moods',()=>{
 assert.ok(SCORES.battle.bpm>SCORES.camp.bpm);const notes={};
 for(const scene of Object.keys(SCORES)){notes[scene]=[];for(let i=0;i<128;i++){const voices=scoreStep(scene,i);assert.deepEqual(voices,scoreStep(scene,i+128));assert.ok(voices.length<=6);for(const n of voices){assert.ok(n.volume>0&&n.volume<.2&&n.duration>0&&n.duration<1.3);if(n.midi)assert.ok(n.midi>=33&&n.midi<=89);assert.ok(['sine','square','triangle','noise'].includes(n.wave));}notes[scene].push(...voices);}}
 assert.ok(notes.battle.some(n=>n.wave==='noise'));assert.ok(notes.camp.every(n=>n.wave!=='noise'));assert.ok(notes.battle.length>notes.camp.length);
});
function context(){
 const sources=[],parameter=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}}),node=()=>({gain:parameter(),frequency:parameter(),connect(){},disconnect(){}});
 const source=()=>{const n={...node(),start(at){this.at=at;},stop(at){this.end=at;}};sources.push(n);return n;};
 return{currentTime:0,state:'running',sampleRate:22050,destination:{},sources,createGain:node,createOscillator:source,createBufferSource:source,createBiquadFilter:node,createBuffer:(channels,length)=>({getChannelData:()=>new Float32Array(length)})};
}
test('music switches scenes, obeys mute, skips background scheduling backlogs and disposes its timer',()=>{
 const ctx=context(),music=new ChipMusic(ctx);try{music.setScene('camp');const channel=music.channel,timer=music.timer;music.setScene('camp');assert.equal(music.channel,channel);assert.equal(music.timer,timer);music.setEnabled(false);assert.equal(music.master.gain.value,0);music.setScene('battle');assert.notEqual(music.channel,channel);assert.equal(music.master.gain.value,0);music.setEnabled(true);assert.ok(music.master.gain.value>0);
 ctx.currentTime=300;const before=ctx.sources.length;music.pump();assert.ok(ctx.sources.length-before<=24,'no replay of hundreds of missed beats');assert.ok(music.next>300);
 }finally{music.dispose();}assert.equal(music.timer,null);assert.equal(music.voices.size,0);
});
