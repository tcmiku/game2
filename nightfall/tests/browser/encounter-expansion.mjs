import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {World,Renderer} from '/lib/game.mjs';
import {bossVisual} from '/lib/boss-presentation.mjs';
import {BossHud} from '/components/game/boss-hud.tsx';
import {SmithPanel} from '/components/game/combat-panel.tsx';
import {newProfile,rescueSmith,unlockEffect,strengthenEffect} from '/lib/camp.mjs';
import '/app/globals.css';import '/app/nightfall-theme.css';import '/app/npc-panels.css';import '/app/boss-hud.css';
const h=React.createElement;
function Preview(){
 const canvas=useRef(),engine=useRef(),renderer=useRef(),[kind,setKind]=useState('prism'),[state,setState]=useState(null),[paused,setPaused]=useState(false),[smith,setSmith]=useState(false),[profile,setProfile]=useState(()=>({...rescueSmith(newProfile()),embers:1500}));
 const reset=key=>{let seed=1234;const w=new World(undefined,()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)),p=w.s.players[0];p.ranks=key==='memes'?{spincat:4,gugu:4,manbo:4,bananacat:4}:{};p.count=0;p.hp=p.maxHp=1e8;p.damage=9;p.nextXp=1e9;w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
  if(key==='memes'){for(let i=0;i<22;i++){const e=w.spawn([1,8,13,14,15][i%5],0),a=i*2.4;e.x=p.x+Math.cos(a)*(130+i%5*40);e.y=p.y+Math.sin(a)*(130+i%5*40);e.hp=e.maxHp=1e6;e.speed=8;e.skillCd=1e8;}}
  else {const e=w.spawn(4);e.bossKind=key;e.size=bossVisual(e).radius;e.x=p.x+270;e.y=p.y;e.speed=0;e.skillCd=0;w.s.bossWarning={kind:key,at:0,arrive:0,until:3};for(const type of [13,14,15]){const n=w.spawn(type,1);n.x=p.x-230+(type-13)*150;n.y=p.y+180;n.speed=15;n.skillCd=1;}}
  engine.current=w;setState({...w.s});renderer.current?.render(w.s,p.id,.016);
 };
 useEffect(()=>{renderer.current=new Renderer(canvas.current);Promise.all([renderer.current.arena,renderer.current.atlas,renderer.current.weaponAtlas,renderer.current.actors,renderer.current.bestiary,renderer.current.bossAtlas].map(im=>im.decode())).then(()=>reset(kind));return()=>{};},[]);
 useEffect(()=>{let frame,last=0,tick=0;const loop=now=>{const dt=Math.min(.05,(now-last)/1000||.016);last=now;const w=engine.current;if(w&&renderer.current&&!paused&&!smith){w.step(dt);renderer.current.render(w.s,'solo',dt);if(now-tick>80){tick=now;setState({...w.s});}}frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);},[paused,smith]);
 return h('main',{className:'app in-game'},h('canvas',{ref:canvas,'aria-label':'新怪物与首领战场'}),state&&h('div',{className:'qa-hud'},h(BossHud,{state})),h('div',{id:'qa-controls'},h('select',{'aria-label':'预览内容',value:kind,onChange:e=>{setKind(e.target.value);reset(e.target.value);}},[['prism','棱镜使骸'],['halo','空环使骸'],['ribbon','断界使骸'],['roots','枯枝之王'],['memes','热梗武器']].map(([value,label])=>h('option',{value,key:value},label))),h('button',{onClick:()=>setPaused(!paused)},paused?'继续':'暂停'),h('button',{onClick:()=>{setPaused(true);const w=engine.current;for(let i=0;i<3;i++)w.step(.05);renderer.current.render(w.s,'solo',.05);setState({...w.s});}},'步进'),h('button',{onClick:()=>{const w=engine.current,e=w.s.enemies.find(e=>e.type===4);if(e)w.damage(e,e.maxHp*.25,w.s.players[0]);setState({...w.s});}},'试击首领'),h('button',{onClick:()=>setSmith(true)},'铁匠淬炼'),h('output',null,(state?.time||0).toFixed(2)+' s')),smith&&h('div',{className:'qa-smith'},h(SmithPanel,{profile,onClose:()=>setSmith(false),onUnlock:key=>{const next=profile.effects.includes(key)?strengthenEffect(profile,key):unlockEffect(profile,key);if(!next)return false;setProfile(next);return true;}})));
}
createRoot(document.querySelector('#root')).render(h(Preview));
