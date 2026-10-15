/** Two original chip scores: Ashen Hearth (72 BPM) and Moonward (132 BPM). */
export const SCORES={camp:{name:'余火轻眠',bpm:72,steps:128},battle:{name:'逐月行军',bpm:132,steps:128}};
const hz=midi=>440*Math.pow(2,(midi-69)/12);
const battleMelody=[
 [74,0,77,74,81,0,77,72],[74,77,81,84,81,77,74,0],
 [70,0,74,77,82,81,77,74],[72,0,76,79,84,79,76,0],
 [77,0,81,84,89,84,81,77],[79,81,84,86,84,81,79,0],
 [76,0,79,84,83,79,76,72],[73,76,81,85,81,76,73,0],
 [86,0,81,77,74,77,81,0],[84,81,77,74,72,74,77,81],
 [82,0,77,74,70,74,77,81],[84,0,79,76,72,76,79,0],
 [81,0,84,89,86,84,81,77],[79,0,82,86,84,82,79,74],
 [76,79,84,83,79,76,73,76],[81,0,77,76,74,0,73,0],
];
const campMelody=[
 [74,0,0,77,0,81,0,0],[79,0,77,0,74,0,0,0],
 [70,0,74,0,77,0,0,0],[76,0,72,0,69,0,0,0],
 [77,0,0,81,0,84,0,0],[81,0,79,0,77,0,0,0],
 [76,0,79,0,72,0,0,0],[73,0,0,76,0,69,0,0],
 [81,0,0,84,0,86,0,0],[84,0,81,0,77,0,0,0],
 [82,0,81,0,77,0,74,0],[79,0,0,76,0,72,0,0],
 [77,0,81,0,84,0,81,0],[79,0,77,0,74,0,0,0],
 [76,0,0,79,0,73,0,0],[74,0,0,0,0,0,0,0],
];
const roots=[38,38,34,36,41,43,36,33,38,38,34,36,41,43,33,33];
const chords=[[62,65,69],[62,65,69],[58,62,65],[60,64,67],[65,69,72],[67,70,74],[60,64,67],[57,61,64]];
export function scoreStep(scene,step){
 const score=SCORES[scene]||SCORES.camp,i=((step%128)+128)%128,bar=Math.floor(i/8),beat=i%8,battle=scene==='battle',unit=60/score.bpm/2,voices=[];
 const add=(midi,wave,duration,volume,extra={})=>{if(midi)voices.push({midi,wave,duration:duration*unit,volume,...extra});};
 const melody=(battle?battleMelody:campMelody)[bar][beat];add(melody,battle?'square':'triangle',battle?.72:2.5,battle?.052:.065);
 const chord=chords[bar%8];
 if(battle||beat%2===0)add(chord[(beat+(bar%2))%3]+(battle?12:0),'square',battle?.42:1.4,battle?.01:.008);
 if(beat%2===0)add(roots[bar]+(beat===4?12:0),'triangle',battle?1.4:2.8,battle?.08:.055);
 if(battle){
  if(beat===0||beat===4)add(38,'sine',.55,.13,{kick:true});
  if(beat===2||beat===6)voices.push({wave:'noise',duration:.085,volume:.024,filter:1800});
  voices.push({wave:'noise',duration:.026,volume:beat%2?.007:.012,filter:6500});
 }
 return voices;
}
export class ChipMusic{
 constructor(ctx){this.ctx=ctx;this.scene='';this.enabled=true;this.voices=new Set();this.master=ctx.createGain();this.master.gain.value=.78;this.master.connect(ctx.destination);this.channel=null;this.timer=null;this.step=0;this.next=0;}
 setEnabled(value){this.enabled=!!value;const t=this.ctx.currentTime;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(value?.78:0,t,.06);}
 setScene(scene){
  if(!SCORES[scene]||scene===this.scene)return;
  const ctx=this.ctx,t=ctx.currentTime,old=this.channel;this.scene=scene;this.step=0;this.next=t+.04;
  if(old){old.gain.cancelScheduledValues(t);old.gain.setTargetAtTime(0,t,.14);for(const voice of this.voices)if(voice.channel===old){try{voice.source.stop(t+.75);}catch{}}setTimeout(()=>old.disconnect(),850);}
  this.channel=ctx.createGain();this.channel.gain.setValueAtTime(0,t);this.channel.gain.linearRampToValueAtTime(1,t+.65);this.channel.connect(this.master);
  if(!this.timer)this.timer=setInterval(()=>this.pump(),80);this.pump();
 }
 noiseBuffer(){if(this.noise)return this.noise;const ctx=this.ctx;this.noise=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.12),ctx.sampleRate);let seed=719;const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;data[i]=(seed/4294967296*2-1)*.7;}return this.noise;}
 note(note,at){
  const ctx=this.ctx,gain=ctx.createGain(),noise=note.wave==='noise',source=noise?ctx.createBufferSource():ctx.createOscillator(),channel=this.channel;
  if(noise){source.buffer=this.noiseBuffer();const filter=ctx.createBiquadFilter();filter.type='highpass';filter.frequency.value=note.filter;source.connect(filter);filter.connect(gain);source._filter=filter;}
  else{source.type=note.wave;source.frequency.setValueAtTime(hz(note.midi),at);if(note.kick)source.frequency.exponentialRampToValueAtTime(38,at+note.duration);source.connect(gain);}
  gain.gain.setValueAtTime(.0001,at);gain.gain.linearRampToValueAtTime(note.volume,at+(noise?.002:.006));if(!noise)gain.gain.linearRampToValueAtTime(note.volume*.55,at+note.duration*.65);gain.gain.exponentialRampToValueAtTime(.0001,at+note.duration);gain.connect(channel);
  const voice={source,gain,channel};this.voices.add(voice);source.onended=()=>{this.voices.delete(voice);source.disconnect();source._filter?.disconnect();gain.disconnect();};source.start(at);source.stop(at+note.duration+.015);
 }
 pump(){
  if(this.ctx.state!=='running'||!this.scene)return;
  if(this.next<this.ctx.currentTime-.2)this.next=this.ctx.currentTime+.02;
  const unit=60/SCORES[this.scene].bpm/2;let count=0;
  while(this.next<this.ctx.currentTime+.18&&count++<4){for(const n of scoreStep(this.scene,this.step))this.note(n,this.next);this.step=(this.step+1)%128;this.next+=unit;}
 }
 dispose(){clearInterval(this.timer);this.timer=null;for(const v of this.voices){try{v.source.stop();}catch{}v.gain.disconnect();v.source.disconnect();}this.voices.clear();this.channel?.disconnect();this.master.disconnect();}
}
