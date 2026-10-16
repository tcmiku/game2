import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {World,Renderer} from '/lib/game.mjs';
import {ultraActive} from '/lib/dragon-light.mjs';
import {UltraSkill} from '/components/game/ultra-skill.tsx';
import {ForgePanel} from '/components/game/forge-panel.tsx';
import '/app/globals.css';import '/app/nightfall-theme.css';import '/app/interface.css';
const h=React.createElement;
const labels={egg:'卓耿 · 龙蛋',wyvern:'飞龙 · 破壳振翼',rod:'神光棒',resonance:'光之共鸣',ultra:'超人力霸王'};
function Preview(){
 const canvas=useRef(),world=useRef(),renderer=useRef(),input=useRef({transformSeq:0,punchSeq:0}),modeRef=useRef('egg'),[mode,setMode]=useState('egg'),[state,setState]=useState(null),[paused,setPaused]=useState(false),[forge,setForge]=useState(false);
 const update=()=>setState({...world.current.s,players:world.current.s.players.map(p=>({...p}))});
 const reset=key=>{const w=new World([{id:'p',weapon:['egg','wyvern'].includes(key)?'drogon':'lightrod'}],()=>.4,[]),p=w.s.players[0];p.hp=p.maxHp=1e6;p.damage=12;p.nextXp=1e9;w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;input.current={transformSeq:0,punchSeq:0};
  if(key==='wyvern'){p.ranks.drogon=p.ranks.ember=3;p.relics=1;w.craft('p','wyvern');}
  if(['resonance','ultra'].includes(key)){w.applyUpgrade(p,'lightgene');p.relics=1;if(key==='ultra'){p.lightBond=180.05;w.craft('p','ultraman');}}
  for(let i=0;i<14;i++){const a=i*2.4,x=p.x+Math.cos(a)*(170+i%4*50),y=p.y+Math.sin(a)*(140+i%3*40);w.s.enemies.push({id:900+i,x,y,type:1,hp:1e8,maxHp:1e8,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:i});}
  modeRef.current=key;setMode(key);setPaused(false);setForge(false);world.current=w;w.step(.02);update();};
 useEffect(()=>{const r=renderer.current=new Renderer(canvas.current);Promise.all([r.arena,r.atlas,r.actors,r.weaponAtlas,r.dragonLightAtlas].map(im=>im.decode())).then(()=>reset('egg'));},[]);
 useEffect(()=>{let frame,last=0,ui=0;const loop=now=>{const dt=Math.min(.05,(now-last)/1000||.016);last=now;const w=world.current;if(w){if(!paused&&!forge){w.input('p',input.current);w.step(dt);}renderer.current.render(w.s,'p',dt);if(now-ui>80){ui=now;update();}}frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);return()=>cancelAnimationFrame(frame);},[paused,forge]);
 const cast=key=>{if(paused||forge)return;input.current[key]++;world.current.input('p',input.current);};
 const pointer=e=>{const w=world.current;if(!w)return;const rect=canvas.current.getBoundingClientRect(),r=renderer.current,p=w.s.players[0];input.current.aim=Math.atan2(r.camera.y+(e.clientY-rect.top-rect.height/2)/r.combatZoom-p.y,r.camera.x+(e.clientX-rect.left-rect.width/2)/r.combatZoom-p.x);if(e.button===2)cast('transformSeq');else if(e.button===0&&ultraActive(p,w.s.time))cast('punchSeq');};
 const p=state?.players[0];return h('main',{className:'app in-game has-ultra'},h('canvas',{ref:canvas,'aria-label':'龙与光之巨人试炼战场',onPointerDown:pointer,onContextMenu:e=>e.preventDefault()}),h('div',{className:'qa-caption'},h('strong',null,labels[mode]),h('p',null,mode==='ultra'?'右键变身 · 左键出拳 · 15 秒无敌':mode==='wyvern'?'自主追敌 · 龙焰吐息 · 俯冲抓击':'真实 World 判定 · 原生像素动画')),p&&h(UltraSkill,{player:p,time:state.time,blocked:paused||forge,onTransform:()=>cast('transformSeq'),onPunch:()=>cast('punchSeq')}),h('div',{id:'qa-controls'},h('select',{'aria-label':'试炼内容',value:mode,onChange:e=>reset(e.target.value)},Object.entries(labels).map(([value,label])=>h('option',{value,key:value},label))),h('button',{onClick:()=>setPaused(!paused)},paused?'继续画面':'暂停画面'),h('button',{onClick:()=>setForge(true)},'兵装录'),h('button',{onClick:()=>{const w=world.current,saved=w.s.enemies;w.s.enemies=[];for(let i=0;i<3580;i++)w.step(.05);w.s.enemies=saved;update();}},'推进共鸣 179s'),p&&h('output',{'aria-label':'试炼状态'},`t=${state.time.toFixed(2)} · 共鸣=${(p.lightBond||0).toFixed(2)} · 变身=${ultraActive(p,state.time)} · 出拳=${p.punchSeq||0} · HP=${p.hp} · 伤害=${Math.round(Object.values(p.stats).reduce((n,s)=>n+s.damage,0))}`)),forge&&h(ForgePanel,{player:p,inRun:true,onClose:()=>setForge(false),onCraft:key=>{world.current.craft('p',key);update();},pending:'',starter:'drogon',onSelect:()=>{},favorites:['wyvern','ultraman'],onFavorite:()=>{}}));
}
createRoot(document.getElementById('root')).render(h(Preview));
