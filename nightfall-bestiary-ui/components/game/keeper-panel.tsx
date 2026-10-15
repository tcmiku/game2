'use client';
import {useState} from 'react';
import {ArrowRight,Check,Flame} from 'lucide-react';
import {BOONS,boonCost,baseStats,expeditionBoons} from '../../lib/camp.mjs';
import {NpcEncounter,NpcGlyph} from './npc-encounter';
const labels:Record<string,string>={vitality:'生命上限',power:'基础伤害',speed:'移动速度',haste:'攻击速度'};
const display=(stats:any,key:string)=>key==='vitality'?String(stats.maxHp):key==='power'?stats.damage.toFixed(1):key==='speed'?stats.speed.toFixed(0):`${Math.round(stats.rate*100)}%`;
export function KeeperPanel({profile,onClose,onUpgrade}:{profile:any,onClose:()=>void,onUpgrade:(key:string)=>void}){
 const [selected,setSelected]=useState<keyof typeof BOONS>('vitality'),[receipt,setReceipt]=useState('');
 const stats=baseStats(expeditionBoons(profile)),def=BOONS[selected],rank=profile.boons[selected],cost=boonCost(profile,selected),max=cost===null;
 const next=baseStats({...expeditionBoons(profile),[selected]:Math.min(def.max,rank+1)}),canBuy=!max&&profile.embers>=cost;
 const upgrade=()=>{if(!canBuy)return;onUpgrade(selected);setReceipt('刻印完成');};
 return <NpcEncounter kind="keeper" title="余火塑魂" balance={profile.embers} quote={receipt?'让这点光，陪你走得更远。':'不必畏惧熄灭。你的归途，我会守着。'} onClose={onClose}>
  <div className="npc-options" aria-label="选择强化属性">{Object.entries(BOONS).map(([key,item])=><button className={`npc-option ${selected===key?'selected':''} ${profile.boons[key]===item.max?'complete':''}`} key={key} aria-label={`选择${item.name}`} aria-pressed={selected===key} onClick={()=>{setSelected(key as keyof typeof BOONS);setReceipt('');}}>
   <NpcGlyph id={key}/><span className="npc-option-name">{item.name}</span><strong>{display(stats,key)}</strong><span className="npc-ranks" aria-label={`强化等级 ${profile.boons[key]} / ${item.max}`}>{Array.from({length:item.max},(_,i)=><i key={i} className={i<profile.boons[key]?'lit':''}/>)}</span>
   {profile.boons[key]===item.max&&<Check className="npc-option-check" size={12}/>}
  </button>)}</div>
  <div className="npc-detail" key={selected}><div className="npc-detail-caption"><span>{labels[selected]}</span><small>{rank} / {def.max}</small></div><div className="npc-stat-preview"><strong>{display(stats,selected)}</strong>{!max&&<><ArrowRight size={20}/><strong className="next">{display(next,selected)}</strong></>}{max&&<span className="npc-complete-label">刻印圆满</span>}</div></div>
  <div className="npc-action-area"><div className="npc-feedback" role="status" aria-live="polite" key={`${selected}-${rank}`}>{receipt&&<><Check size={13}/>{receipt}</>}</div><button className={`npc-confirm ${max?'complete':''}`} disabled={!canBuy} aria-label={`强化${def.name}`} onClick={upgrade}><span>{max?'刻印圆满':!canBuy?'余火不足':'刻印灵魂'}</span>{max?<Check size={18}/>:<span className="npc-price"><Flame size={15}/>{cost}</span>}</button></div>
 </NpcEncounter>;
}
