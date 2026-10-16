'use client';
import {Wind} from 'lucide-react';
import {hasShrine,dodgeActive,DODGE} from '../../lib/shrine-powers.mjs';
import '../../app/shrine-powers.css';
export function ShrineCombat({player,time,blocked,onDodge}:{player:any,time:number,blocked:boolean,onDodge:()=>void}){
 if(!player||player.hp<=0)return null;
 const remaining=Math.max(0,(player.dashReadyAt||0)-time),active=dodgeActive(player,time);
 return <>{hasShrine(player,'stride')&&<button className={`dodge-button ${active?'active':''}`} disabled={blocked||active||remaining>0} onClick={onDodge} aria-label={remaining>0?`闪避冷却 ${remaining.toFixed(1)} 秒`:'风行闪避'} title="向移动方向突进，短暂无敌；空格或点击释放">
  <Wind size={22}/><span><strong>闪避</strong><small>{remaining>0?`${remaining.toFixed(1)}s`:'空格 / 点击'}</small></span><i aria-hidden="true" style={{width:`${(1-Math.min(1,remaining/DODGE.cooldown))*100}%`}}/>
 </button>}{player.lastShrinePower?.key==='foundation'&&time-player.lastShrinePower.at<2.5&&<div className="ember-guard-notice" role="status"><b>✦</b><span>始火重燃<small>余火替你抵挡了致命一击</small></span></div>}</>;
}
