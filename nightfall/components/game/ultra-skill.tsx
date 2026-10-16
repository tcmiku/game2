'use client';
import {hasUltra,ultraActive,ULTRA_SKILL} from '../../lib/dragon-light.mjs';
import {RelicIcon} from './forge-panel';
import '../../app/ultra-skill.css';
export function UltraSkill({player,time,blocked,onTransform,onPunch}:{player:any,time:number,blocked:boolean,onTransform:()=>void,onPunch:()=>void}){
 if(!hasUltra(player)||player.hp<=0)return null;
 const active=ultraActive(player,time),remaining=Math.max(0,(player.ultraReadyAt||0)-time),life=Math.max(0,(player.ultraUntil||0)-time);
 return <div className="ultra-controls" aria-label="光之巨人技能">
  <button className={`ultra-skill ${active?'active':''}`} disabled={blocked||active||remaining>0} onClick={onTransform} aria-label={active?`光之巨人变身中，剩余 ${life.toFixed(1)} 秒`:remaining>0?`光之巨人冷却 ${remaining.toFixed(1)} 秒`:'变身光之巨人'}>
   <RelicIcon id="ultraman" size={44}/><span><strong>超人力霸王</strong><small>{active?`无敌 · ${life.toFixed(1)}s`:remaining>0?`冷却 ${Math.ceil(remaining)}s`:'右键 / 点击变身'}</small></span>
   <i aria-hidden="true" style={{width:`${active?life/ULTRA_SKILL.duration*100:(1-remaining/ULTRA_SKILL.cooldown)*100}%`}}/>
  </button>
  {active&&<button className="ultra-punch" disabled={blocked||time<(player.punchReadyAt||0)} onClick={onPunch} aria-label="光之巨人出拳"><span>重拳</span><small>左键 / 点击</small></button>}
 </div>;
}
