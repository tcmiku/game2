import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {World,Renderer} from '/lib/game.mjs';
import {gameImages,loadGameAssets} from '/lib/assets.mjs';
import {CampRenderer} from '/lib/camp-renderer.mjs';
import {newProfile,createCamp,expeditionBoons} from '/lib/camp.mjs';
import {SHRINES,offerToShrine} from '/lib/sanctuary.mjs';
import {hurtPlayer} from '/lib/encounters.mjs';
import {SanctuaryPanel} from '/components/game/sanctuary-panel.tsx';
import {ShrineCombat} from '/components/game/shrine-combat.tsx';
import '/app/globals.css';import '/app/nightfall-theme.css';import '/app/interface.css';import '/app/sanctuary.css';
const h=React.createElement;
function Preview(){
 const canvas=useRef(),renderer=useRef(),campRenderer=useRef(),camp=useRef(createCamp()),world=useRef(),input=useRef({dashSeq:0,x:0,y:0}),keys=useRef(new Set()),ritual=useRef({id:'stride',phase:'idle',progress:0}),profileRef=useRef(),viewRef=useRef('court');
 const [profile,setProfile]=useState(()=>({...newProfile(),embers:1000})),[selected,setSelected]=useState('stride'),[open,setOpen]=useState(true),[view,setView]=useState('court'),[state,setState]=useState(null);profileRef.current=profile;viewRef.current=view;
 const aimCamp=key=>{const def=SHRINES[key];camp.current.x=def.x;camp.current.y=def.y+80;ritual.current={id:key,phase:'idle',progress:0};setSelected(key);setOpen(true);};
 const dodge=()=>{if(viewRef.current!=='battle')return;const k=keys.current;input.current.x=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);input.current.y=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0);input.current.dashSeq++;input.current.moveAt=performance.now()/1000;world.current.input('p',input.current);};
 useEffect(()=>{const r=renderer.current=new Renderer(canvas.current);campRenderer.current=new CampRenderer(r);aimCamp('stride');let frame,last=0,ui=0,ready=false;loadGameAssets(gameImages(r,campRenderer.current),{fontReady:document.fonts.ready}).then(()=>ready=true);
  const down=e=>{if(viewRef.current!=='battle')return;const key=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();keys.current.add(key);if(key===' '&&!e.repeat)dodge();},up=e=>keys.current.delete(e.key.toLowerCase()),blur=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  const loop=now=>{const dt=Math.min(.05,(now-last)/1000||.016);last=now;if(!ready){frame=requestAnimationFrame(loop);return;}if(viewRef.current==='battle'&&world.current){const w=world.current,k=keys.current;input.current.x=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0);input.current.y=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0);w.input('p',input.current);w.step(dt);r.render(w.s,'p',dt);if(now-ui>70){ui=now;setState({...w.s});}}else{camp.current.time+=dt;campRenderer.current.render(camp.current,dt,profileRef.current,ritual.current);}frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
 },[]);
 const offer=id=>{const next=offerToShrine(profileRef.current,id);if(!next)return false;profileRef.current=next;setProfile(next);return true;};
 const battle=all=>{const next=all?{...profileRef.current,shrines:Object.fromEntries(Object.keys(SHRINES).map(k=>[k,1]))}:profileRef.current;const w=new World([{id:'p',boons:expeditionBoons(next)}],()=>.4,[]);w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.players[0].nextXp=1e9;for(let i=0;i<14;i++){const a=i*2.4;w.s.enemies.push({id:900+i,x:1200+Math.cos(a)*(190+i%3*40),y:800+Math.sin(a)*(190+i%3*40),hp:1e8,maxHp:1e8,type:1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:i});}world.current=w;input.current={dashSeq:0,x:0,y:0};setState({...w.s});setOpen(false);setView('battle');};
 const p=state?.players[0];return h('main',{className:`app ${view==='battle'?'in-game':'in-camp'}`},h('canvas',{ref:canvas,'aria-label':view==='battle'?'神像能力试炼战场':'祈愿庭院能力预览'}),h('div',{id:'qa-controls'},view==='court'?[
  h('select',{key:'select','aria-label':'预览雕像',value:selected,onChange:e=>aimCamp(e.target.value)},Object.values(SHRINES).map(s=>h('option',{key:s.id,value:s.id},s.name))),h('button',{key:'start',onClick:()=>battle(false)},'携赐福出发'),h('button',{key:'all',onClick:()=>battle(true)},'试炼全部能力')]:[
  h('button',{key:'back',onClick:()=>{setView('court');aimCamp(selected);}},'返回庭院'),h('button',{key:'hurt',onClick:()=>hurtPlayer(world.current,world.current.s.players[0],20)},'受伤'),h('button',{key:'fatal',onClick:()=>hurtPlayer(world.current,world.current.s.players[0],1e6)},'致命试炼'),h('output',{key:'out','aria-label':'试炼状态'},`x=${p?.x.toFixed(1)} · 闪避=${p?.dashSeq||0} · 余火守护=${p?.emberGuardUsed?'已用':'可用'}`)]),view==='battle'&&p&&h('div',{className:'qa-health'},`生命 ${p.hp.toFixed(1)} / ${p.maxHp}`),view==='battle'&&p&&h(ShrineCombat,{player:p,time:state.time,blocked:state.status!=='playing',onDodge:dodge}),view==='court'&&open&&h(SanctuaryPanel,{key:selected,profile,initial:selected,onClose:()=>setOpen(false),onOffer:offer,onRitual:(id,state)=>ritual.current={id,...state}}));
}
createRoot(document.getElementById('root')).render(h(Preview));
