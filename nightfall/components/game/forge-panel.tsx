'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, LoaderCircle, Sparkles, X, Zap, Wind, Heart, Magnet, Star } from 'lucide-react';
import { ARTIFACTS, RECIPES, UPGRADES, WEAPONS, WEAPON_LIMIT, WEAPON_ATLAS_COLUMNS, WEAPON_ATLAS_ROWS, forgeState, weaponLoadout, prioritizedRecipes } from '../../lib/equipment.mjs';
import {readyWeapons} from '../../lib/run-rules.mjs';
import {usePanelFocus} from './use-panel-focus';
import '../../app/forge-priority.css';
const ITEMS:Record<string,any>=UPGRADES, ART:Record<string,any>=ARTIFACTS;
const icons:Record<string,any>={power:Zap,haste:Wind,vitality:Heart,magnet:Magnet};
export function WeaponIcon({id,size=32}:{id:string,size?:number}) {
 const index=(ITEMS[id]?.sprite||ART[id]?.sprite||16)-16;
 return <span aria-hidden="true" className="weapon-icon" style={{width:size,height:size,backgroundSize:`${size*WEAPON_ATLAS_COLUMNS}px ${size*WEAPON_ATLAS_ROWS}px`,backgroundPosition:`-${(index%WEAPON_ATLAS_COLUMNS)*size}px -${Math.floor(index/WEAPON_ATLAS_COLUMNS)*size}px`}}/>;
}
export function RelicIcon({id,size=32}:{id:string,size?:number}) {
 if(ART[id]?.sprite>=16)return <WeaponIcon id={id} size={size}/>;
 const index=id==='chest'?4:(ART[id]?.sprite??8)-8;
 return <span aria-hidden="true" className="relic-icon" style={{'--base-size':`${size}px`,'--sprite-index':index} as any}/>;
}
export function ForgePanel({player,inRun,onClose,onCraft,pending,starter,onSelect,favorites,onFavorite}:{player:any,inRun:boolean,onClose:()=>void,onCraft:(key:string)=>void,pending:string,starter:string,onSelect:(key:string)=>void,favorites:string[],onFavorite:(key:string)=>void}) {
 const [tab,setTab]=useState(inRun?'recipes':'weapons'),recipeGrid=useRef<HTMLDivElement>(null);const ready=readyWeapons(player),filtered=RECIPES.filter(recipe=>tab!=='favorites'||favorites.includes(recipe.key)),recipes=inRun?prioritizedRecipes(player,filtered):filtered,readyKeys=recipes.filter(recipe=>forgeState(player,recipe.key).ready).map(recipe=>recipe.key).join(',');
 useEffect(()=>{if(inRun&&tab!=='weapons'&&readyKeys&&recipeGrid.current)recipeGrid.current.scrollTop=0;},[inRun,tab,readyKeys]);
 usePanelFocus('.forge-panel');
 return <div className="overlay forge-overlay" role="dialog" aria-modal="true" aria-labelledby="forge-title"><section className="forge-panel">
  <div className="forge-heading"><h2 id="forge-title">兵装录</h2><div className="arsenal-equipped" aria-label={inRun?`武器 ${weaponLoadout(player).length} / ${WEAPON_LIMIT}`:`初始武器 ${ITEMS[starter].name}`}>{inRun?<span>{weaponLoadout(player).length} / {WEAPON_LIMIT}</span>:<><WeaponIcon id={starter} size={28}/><span>{ITEMS[starter].name}</span></>}</div><button className="icon-button" aria-label="关闭武器库" onClick={onClose}><X size={20}/></button></div>
  <div className="arsenal-tabs" aria-label="兵装分类"><button className={tab==='weapons'?'active':''} aria-pressed={tab==='weapons'} onClick={()=>setTab('weapons')}>武器</button><button className={tab==='recipes'?'active':''} aria-pressed={tab==='recipes'} onClick={()=>setTab('recipes')}>神器</button><button className={tab==='favorites'?'active':''} aria-pressed={tab==='favorites'} onClick={()=>setTab('favorites')} aria-label="收藏的神器"><Star size={13}/>收藏</button>{inRun&&tab!=='weapons'&&<span className="relic-counter" aria-label={`宝箱 ${player?.relics||0}`}><RelicIcon id="chest" size={24}/>{player?.relics||0}</span>}</div>
  {tab==='weapons'?<div className="weapon-grid">{WEAPONS.map(key=>{
   const def=ITEMS[key],owned=weaponLoadout(player).includes(key),evolved=player?.evolutions?.[key],selected=!inRun&&starter===key;
   return <button className={`weapon-card ${ready.includes(key)?'forge-ready':''} ${selected||owned?'selected':''}`} style={{'--weapon-accent':def.color} as any} key={key} disabled={inRun} aria-label={`初始武器${def.name}`} aria-pressed={selected} onClick={()=>onSelect(key)}><WeaponIcon id={key} size={64}/><div><h3>{def.name}</h3><p>{def.sub}</p>{inRun&&<small>{player?.fused?.[key]?'已融合':evolved?ART[evolved].name:owned?`Lv. ${player.ranks[key]}`:'未装备'}</small>}</div>{selected&&<Check size={14}/>}</button>;
  })}</div>:<>
  {inRun&&readyKeys&&<div className="forge-ready-summary" role="status"><Sparkles size={15}/><span>可合成 {readyKeys.split(',').length} 件神器 · 已优先显示</span></div>}
  <div className="recipe-grid" ref={recipeGrid}>{recipes.map((recipe:any)=>{
   const state=forgeState(player,recipe.key),locked=player?.hp<=0||!state.ready||!!player?.choices?.length||!!pending;
   return <article key={recipe.key} className={`recipe-card ${state.complete?'complete':state.ready?'ready':''} ${favorites.includes(recipe.key)?'favorite':''}`} style={{'--relic-color':recipe.color} as any}>
    <div className="recipe-result"><RelicIcon id={recipe.key} size={56}/><div><h3>{recipe.name}</h3></div><button className={`recipe-favorite ${favorites.includes(recipe.key)?'selected':''}`} onClick={()=>onFavorite(recipe.key)} aria-label={`${favorites.includes(recipe.key)?'取消收藏':'收藏'}${recipe.name}`} aria-pressed={favorites.includes(recipe.key)}><Star size={16}/></button></div>
    <div className={`recipe-parts ${state.parts.length>2?'multi':''}`}>{state.parts.map((part:any,i:number)=>{const def=ITEMS[part.key],Icon=icons[part.key]||Sparkles;return <div className={part.met?'met':''} key={part.key}>{i>0&&<b>＋</b>}{def.sprite?<WeaponIcon id={part.key} size={26}/>:<Icon size={16}/>}<span>{def.name}</span><small>{inRun?`${Math.min(player?.ranks?.[part.key]||0,part.level)} / ${part.level}`:`Lv.${part.level}`}</small></div>;})}</div>
    <p>{recipe.detail}</p>{state.holdSeconds>0&&<div className={`recipe-resonance ${state.holdMet?'met':''}`}><span>{inRun?(state.holdMet?'光之共鸣完成':`共同持有 · ${Math.max(0,Math.floor(state.heldFor/60))}:${Math.floor(state.heldFor%60).toString().padStart(2,'0')} / 3:00`):'神光棒与因子共同持有超过 3 分钟'}</span>{inRun&&<i style={{width:`${Math.min(100,state.heldFor/state.holdSeconds*100)}%`}}/>}</div>}<div className="recipe-bottom"><span className={state.chest||state.complete?'met':''} aria-label="需要宝箱一个"><RelicIcon id="chest" size={22}/>×1{recipe.weapons&&<small>空位 +{recipe.weapons.length-1}</small>}</span>{inRun&&<button disabled={locked||state.complete} onClick={()=>onCraft(recipe.key)} aria-label={`合成${recipe.name}`}>{pending===recipe.key?<LoaderCircle size={13} className="spin"/>:state.complete?<Check size={13}/>:null}{state.complete?'已觉醒':pending===recipe.key?'合成中':state.blocked?'进化已占用':!state.holdMet?'等待共鸣':player?.choices?.length?'先完成升级':'合成'}</button>}</div>
   </article>;
  })}</div>{tab==='favorites'&&!recipes.length&&<div className="favorites-empty"><Star size={22}/><span>暂无收藏</span></div>}</>}
 </section></div>;
}
