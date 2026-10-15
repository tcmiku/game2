/** Render the same game scores into standalone 8-bit PCM WAV previews. */
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {scoreStep,SCORES} from '../lib/music.mjs';
const output=resolve(process.argv[2]||'artifacts/audio'),rate=22050;
await mkdir(output,{recursive:true});
for(const [scene,score]of Object.entries(SCORES)){
 const unit=60/score.bpm/2,length=Math.ceil(score.steps*unit*rate),samples=new Float64Array(length);let seed=719;
 for(let step=0;step<score.steps;step++)for(const note of scoreStep(scene,step)){
  const start=Math.floor(step*unit*rate),count=Math.ceil(note.duration*rate),frequency=440*2**((note.midi-69)/12);let phase=0,previous=0;
  for(let i=0;i<count;i++){
   const t=i/rate,attack=note.wave==='noise'?.002:.006,envelope=t<attack?t/attack:note.wave!=='noise'&&t<note.duration*.65?1-.45*(t-attack)/(note.duration*.65-attack):Math.exp(Math.log(.0001/(note.volume*(note.wave==='noise'?1:.55)))*(t-(note.wave==='noise'?attack:note.duration*.65))/Math.max(.001,note.duration-(note.wave==='noise'?attack:note.duration*.65)))*(note.wave==='noise'?1:.55);let value;
   if(note.wave==='noise'){seed=(seed*1664525+1013904223)>>>0;const raw=(seed/4294967296*2-1)*.7;value=(raw-previous)*.6;previous=raw;}
   else{phase+=(note.kick?frequency*Math.exp(Math.log(38/frequency)*t/note.duration):frequency)/rate;value=note.wave==='square'?(phase%1<.5?1:-1):note.wave==='triangle'?1-4*Math.abs(phase%1-.5):Math.sin(phase*Math.PI*2);}
   samples[(start+i)%length]+=value*note.volume*envelope*.78;
  }
 }
 // Loop tails wrap into the beginning. Standard unsigned 8-bit PCM at 22.05 kHz.
 const wav=Buffer.alloc(44+length);wav.write('RIFF',0);wav.writeUInt32LE(36+length,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate,28);wav.writeUInt16LE(1,32);wav.writeUInt16LE(8,34);wav.write('data',36);wav.writeUInt32LE(length,40);
 let peak=0,energy=0;for(let i=0;i<length;i++){const value=Math.max(-1,Math.min(1,samples[i]));peak=Math.max(peak,Math.abs(value));energy+=value*value;wav[44+i]=Math.round(128+value*127);}
 const file=resolve(output,`nightfall-${scene}.wav`);await writeFile(file,wav);console.log(`${scene}: ${(length/rate).toFixed(2)} seconds, peak ${peak.toFixed(3)}, RMS ${Math.sqrt(energy/length).toFixed(3)} -> ${file}`);
}
