'use client';
import {hasDualBlades,swordSpinning,SWORD_SKILL} from '../../lib/dual-swords.mjs';
import {RelicIcon} from './forge-panel';

type SwordSkillPlayer={hp:number;ranks:Record<string,number>;evolutions?:Record<string,string>;fused?:Record<string,string>;spinAt?:number;spinUntil?:number;spinReadyAt?:number};
export function SwordSkill({player,time,blocked,onCast}:{player:SwordSkillPlayer,time:number,blocked:boolean,onCast:()=>void}){
 if(!hasDualBlades(player)||player.hp<=0)return null;
 const active=swordSpinning(player,time),remaining=Math.max(0,(player.spinReadyAt||0)-time),disabled=blocked||active||remaining>0;
 const duration=Math.max(.1,(player.spinReadyAt||0)-(player.spinAt||0)||SWORD_SKILL.cooldown);
 return <button className={`sword-skill ${active?'active':''}`} disabled={disabled} onClick={onCast} aria-label={active?'星光轮舞施放中':remaining>0?`星光轮舞冷却 ${remaining.toFixed(1)} 秒`:'释放星光轮舞'} title="二刀流 · 星光轮舞：旋转斩击 3.5 秒，移速 +65%，光轨附带伤害。点击战场左键或此按钮释放。">
  <RelicIcon id="dualblades" size={42}/><span><strong>星光轮舞</strong><small>{active?`旋风 · ${Math.max(0,(player.spinUntil||0)-time).toFixed(1)}s`:remaining>0?`冷却 ${remaining.toFixed(1)}s`:'左键 / 点击释放'}</small></span>
  <i aria-hidden="true" style={{width:`${(1-Math.min(1,remaining/duration))*100}%`}}/>
 </button>;
}
