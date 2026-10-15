'use client';
import {useState} from 'react';
import {Check,Flame} from 'lucide-react';
import {UPGRADES,CAMP_ITEMS} from '../../lib/equipment.mjs';
import {CAMP_NPCS} from '../../lib/camp.mjs';
import {NpcEncounter,NpcGlyph} from './npc-encounter';
const items:Record<string,any>=UPGRADES;
export function ResidentPanel({kind,profile,onClose,onUnlock}:{kind:'herbalist'|'scholar',profile:any,onClose:()=>void,onUnlock:(key:string)=>void}){
 const npc=CAMP_NPCS.find(n=>n.kind===kind)!,keys=CAMP_ITEMS.filter(key=>items[key].unlock===kind);
 const [selected,setSelected]=useState(keys[0]),[receipt,setReceipt]=useState('');
 const item=items[selected],done=profile.effects.includes(selected),allowed=!done&&profile.embers>=item.cost;
 return <NpcEncounter kind={kind} title={npc.title} quote={receipt?'带上它，平安归来。':npc.quote} balance={profile.embers} onClose={onClose}>
  <div className="npc-options resident-options" aria-label="局中道具">{keys.map(key=><button key={key} className={`npc-option ${selected===key?'selected':''} ${profile.effects.includes(key)?'complete':''}`} aria-label={`选择${items[key].name}`} aria-pressed={selected===key} onClick={()=>{setSelected(key);setReceipt('');}}><NpcGlyph id={key}/><span className="npc-option-name">{items[key].name}</span><span className="npc-item-state">{profile.effects.includes(key)?<Check size={13}/>:<><Flame size={11}/>{items[key].cost}</>}</span></button>)}</div>
  <div className="npc-detail npc-smith-detail" key={selected}><h3>{item.detail}</h3></div>
  <div className="npc-action-area"><div className="npc-feedback" role="status" aria-live="polite">{receipt&&<><Check size={13}/>{receipt}</>}</div><button className={`npc-confirm ${done?'complete':''}`} disabled={!allowed} aria-label={`解锁${item.name}`} onClick={()=>{if(allowed){onUnlock(selected);setReceipt('已解锁');}}}><span>{done?'已解锁':allowed?'解锁':'余火不足'}</span>{done?<Check size={18}/>:<span className="npc-price"><Flame size={15}/>{item.cost}</span>}</button></div>
 </NpcEncounter>;
}
