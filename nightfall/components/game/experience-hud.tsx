'use client';
import {experienceView} from '../../lib/team-experience.mjs';
export function ExperienceHud({state,player}:{state:any,player:any}){
 const xp=experienceView(state,player);if(!xp)return null;
 return <><div className={`xp-track ${xp.shared?'team-xp-track':''}`} role="progressbar" aria-label={xp.shared?'队伍共享经验':'升级经验'} aria-valuemin={0} aria-valuemax={xp.nextXp} aria-valuenow={Math.min(xp.xp,xp.nextXp)} data-team-count={xp.count}><div style={{width:`${Math.max(0,Math.min(100,xp.xp/xp.nextXp*100))}%`}}/></div>{xp.shared&&<div className="team-xp-caption"><span>队伍等级 <b>LV.{xp.level}</b><i>{xp.count} 人</i></span><strong>{Math.floor(xp.xp)} <small>/ {xp.nextXp}</small></strong></div>}</>;
}
