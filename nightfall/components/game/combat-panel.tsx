'use client';
import {useState} from 'react';
import {X,Flame,Check} from 'lucide-react';
import {NpcEncounter,NpcGlyph} from './npc-encounter';
import {weaponRanking} from '../../lib/combat-stats.mjs';
import {SMITH_ITEMS,UPGRADES,ARTIFACTS} from '../../lib/equipment.mjs';
import {WeaponIcon,RelicIcon} from './forge-panel';
const definitions:Record<string,any>=UPGRADES,artifacts:Record<string,any>=ARTIFACTS;
const compact=(n:number)=>n>=1e6?`${(n/1e6).toFixed(1)}m`:n>=10000?`${(n/1000).toFixed(1)}k`:Math.round(n).toLocaleString();
export function CombatPanel({player,time,onClose}:{player:any,time:number,onClose:()=>void}){
 const [sort,setSort]=useState('damage');const rows=weaponRanking(player,time,sort),total=rows.reduce((n,r)=>n+r.damage,0);
 return <aside className="combat-panel" aria-label="武器战绩"><header><div><h2>武器战绩</h2></div><button className="icon-button" aria-label="关闭伤害面板" onClick={onClose}><X size={18}/></button></header><div className="combat-total"><strong>{compact(total/Math.max(1,time))}<small>DPS</small></strong><span>总伤害 {compact(total)}</span></div><div className="combat-sort"><button className={sort==='damage'?'selected':''} onClick={()=>setSort('damage')}>伤害</button><button className={sort==='kills'?'selected':''} onClick={()=>setSort('kills')}>击杀</button></div><div className="combat-columns"><span>武器</span><span>伤害</span><span>DPS</span><span>击杀</span></div><div className="combat-rows">{rows.map((row,i)=><div className="combat-row" key={row.key}><div className="combat-weapon"><small>{i+1}</small>{artifacts[row.key]?<RelicIcon id={row.key} size={30}/>:<WeaponIcon id={row.key} size={30}/>}<span>{row.name}<i style={{width:`${Math.max(2,row.damage/Math.max(1,total)*100)}%`}}/></span></div><span>{compact(row.damage)}</span><span>{compact(row.dps)}</span><span>{row.kills}</span></div>)}</div></aside>;
}
export function SmithPanel({profile,onClose,onUnlock}:{profile:any,onClose:()=>void,onUnlock:(key:string)=>void}){
 const [selected,setSelected]=useState(SMITH_ITEMS[0]),[receipt,setReceipt]=useState('');
 const item=definitions[selected],done=profile.effects.includes(selected),canBuy=!done&&profile.embers>=item.cost;
 const unlock=()=>{if(!canBuy)return;onUnlock(selected);setReceipt('工艺已解锁');};
 return <NpcEncounter kind="smith" title="余火锻造" balance={profile.embers} quote={receipt?'带上这份工艺。让长夜见识你的锋芒。':'火候正好。看看哪件工艺合你的手。'} onClose={onClose}>
  <div className="npc-options" aria-label="选择锻造工艺">{SMITH_ITEMS.map(key=>{const def=definitions[key],owned=profile.effects.includes(key);return <button className={`npc-option ${selected===key?'selected':''} ${owned?'complete':''}`} key={key} aria-label={`选择${def.name}`} aria-pressed={selected===key} onClick={()=>{setSelected(key);setReceipt('');}}>
   <NpcGlyph id={key}/><span className="npc-option-name">{def.name}</span><span className={`npc-item-state ${owned?'unlocked':''}`}>{owned?<Check size={13}/>:<><Flame size={11}/>{def.cost}</>}</span>
  </button>;})}</div>
  <div className="npc-detail npc-smith-detail" key={selected}><h3>{item.detail}</h3></div>
  <div className="npc-action-area"><div className="npc-feedback" role="status" aria-live="polite" key={`${selected}-${done}`}>{receipt&&<><Check size={13}/>{receipt}</>}</div><button className={`npc-confirm ${done?'complete':''}`} aria-label={`解锁${item.name}`} disabled={!canBuy} onClick={unlock}><span>{done?'已解锁':!canBuy?'余火不足':'解锁工艺'}</span>{done?<Check size={18}/>:<span className="npc-price"><Flame size={15}/>{item.cost}</span>}</button></div>
 </NpcEncounter>;
}
