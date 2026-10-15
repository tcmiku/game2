'use client';
import {useEffect,useState,type CSSProperties,type PointerEvent} from 'react';
import {ArrowUpRight,BookOpen,Check,Expand,Feather,Heart,Hourglass,Layers,Magnet,MousePointer2,Shield,Sparkles,Star,Timer,Wind,Zap} from 'lucide-react';
import {UPGRADES,MEND} from '../../lib/equipment.mjs';
import {wantedUpgrade} from '../../lib/run-rules.mjs';
import {DRAFT_SECONDS} from '../../lib/shared-draft.mjs';
import {playerStyle} from '../../lib/player-style.mjs';
import {WeaponIcon} from './forge-panel';
import {usePanelFocus} from './use-panel-focus';

const definitions:Record<string,any>=UPGRADES;
const itemIcons:Record<string,typeof Sparkles>={ward:Shield,wisdom:BookOpen,power:Zap,haste:Wind,heart:Heart,speed:Feather,magnet:Magnet,area:Expand,cooling:Timer,linger:Hourglass,volley:Layers};
const shortcuts=['1','2','3','4','5','6','7','8','9','0','-','='];

function MoonSeal(){
 return <svg className="draft-moon-seal" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="28"/><circle cx="32" cy="32" r="23" strokeDasharray="1 5"/><path d="M39 14a18 18 0 1 0 11 27A18 18 0 0 1 39 14Z" className="draft-moon"/><path d="m46 17 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5ZM32 1v6m0 50v6M1 32h6m50 0h6"/></svg>;
}

export function SharedUpgradePanel({state,playerId,members,favorites,onChoose,onCursor}:{state:any,playerId:string,members:any[],favorites:string[],onChoose:(key:string)=>void,onCursor:(cursor:any)=>void}){
 const draft=state.draft,me=state.players.find((p:any)=>p.id===playerId),waiting=draft.pending.includes(playerId);
 const seconds=Math.max(0,Math.ceil(DRAFT_SECONDS-draft.elapsed)),remaining=Math.max(0,Math.min(1,1-draft.elapsed/DRAFT_SECONDS));
 const [pending,setPending]=useState('');usePanelFocus('.shared-upgrade-panel');
 useEffect(()=>{setPending('');},[draft.id,waiting]);
 useEffect(()=>{if(!pending)return;const timer=setTimeout(()=>setPending(''),2000);return()=>clearTimeout(timer);},[pending]);
 const cursors=members.filter(m=>m.id!==playerId&&m.connected!==false&&m.input?.cursor?.round===draft.id);
 const renderCursors=(card:string)=>cursors.filter(m=>(m.input.cursor.card||'')===card).map((m,i)=>{
  const p=state.players.find((p:any)=>p.id===m.id);if(!p)return null;const cursor=m.input.cursor;
  return <span className="draft-cursor" key={m.id} style={{left:`${cursor.x*100}%`,top:`${cursor.y*100}%`,color:playerStyle(p.index).color}} aria-hidden="true"><MousePointer2 size={19} fill="currentColor"/><span style={{marginTop:i*15}}>P{p.index+1} · {p.name}</span></span>;
 });
 const move=(event:PointerEvent<HTMLDivElement>)=>{
  const card=(event.target as HTMLElement).closest<HTMLElement>('[data-draft-card]'),rect=(card||event.currentTarget).getBoundingClientRect();
  onCursor({round:draft.id,card:card?.dataset.draftCard||'',x:(event.clientX-rect.left)/Math.max(1,rect.width),y:(event.clientY-rect.top)/Math.max(1,rect.height)});
 };
 return <div className="overlay shared-upgrade-overlay" role="dialog" aria-modal="true" aria-labelledby="shared-upgrade-title" aria-describedby="draft-instruction">
  <section className="shared-upgrade-panel" style={{'--party-size':state.players.length,'--draft-columns':draft.cards.length<=9?3:4} as CSSProperties}>
   <header className="draft-heading">
    <div className="draft-title"><MoonSeal/><div><small>长夜同行 <i/> 共享兵装</small><h2 id="shared-upgrade-title">共借一缕月光</h2></div></div>
    <div className={`draft-countdown ${seconds<=5?'urgent':''}`} role="timer" aria-label={`${seconds} 秒后自动选择`}>
     <div className="draft-clock"><svg viewBox="0 0 56 56" aria-hidden="true"><circle className="draft-clock-track" cx="28" cy="28" r="24"/><circle className="draft-clock-remaining" cx="28" cy="28" r="24" pathLength="1" strokeDasharray="1" strokeDashoffset={1-remaining}/></svg><strong>{seconds}<small>秒</small></strong></div>
     <span>月光将歇<small>到时自动领取</small></span>
    </div>
   </header>
   <div className="draft-roster" aria-label="同行者选择状态">{state.players.map((p:any)=>{
    const chosen=draft.cards.find((c:any)=>c.claimedBy===p.id),choosing=draft.pending.includes(p.id),self=p.id===playerId,color=playerStyle(p.index).color;
    return <div key={p.id} className={`draft-player ${chosen?'picked':''} ${self?'is-self':''} ${p.hp<=0?'is-ghost':''}`} style={{'--player-color':color} as CSSProperties}>
     <b className="draft-player-seal">P{p.index+1}</b><div className="draft-player-copy"><span><span className="draft-player-name" title={p.name}>{p.name}</span>{self&&<em>你</em>}</span><small>{chosen?`已选 · ${definitions[chosen.key]?.name||MEND.name}`:choosing?'选择中':p.hp<=0?'幽灵 · 观战':'等待下一轮'}</small></div>
     {chosen?<Check className="draft-player-check" size={15}/>:<i className="draft-player-dot" aria-hidden="true"/>}
    </div>;
   })}</div>
   <div className="draft-instruction"><p id="draft-instruction" aria-live="polite">{waiting?pending?'正在确认选择…':'每人择取一件兵装，与你的同行者共渡长夜。':me?.hp<=0?'化作月影，守望队友的选择。':'兵装已入囊，等待同行者。'}</p><span><b>{draft.cards.length}</b> 张候选<i/> <b>{draft.pending.length}</b> 人待选<small className="draft-auto-hint">到时自动领取</small></span></div>
   <div className="draft-scroll"><div className="draft-board" onPointerMove={move} onPointerDown={move} onPointerLeave={()=>onCursor(null)}>
    {draft.cards.map((card:any,i:number)=>{
     const u=definitions[card.key]||MEND,owner=state.players.find((p:any)=>p.id===card.claimedBy),eligible=waiting&&me?.choices.includes(card.key),disabled=!!card.claimedBy||!eligible||!!pending,favorite=me&&wantedUpgrade(me,card.key,favorites);
     const rank=me?.ranks[card.key]||0,shownRank=owner?.ranks[card.key]||rank,ItemIcon=card.key==='mend'?Heart:itemIcons[u.icon]||Sparkles;
     return <div className={`draft-card-wrap ${card.claimedBy?'claimed':''}`} data-draft-card={card.id} key={card.id} style={{'--card-accent':u.color,'--claim-color':owner?playerStyle(owner.index).color:undefined} as CSSProperties}>
      <button className={`draft-card ${favorite?'favorite':''}`} disabled={disabled} onClick={()=>{setPending(card.key);onChoose(card.key);}} aria-label={`${u.name}${owner?`，已由 P${owner.index+1} 领取`:`，${card.key==='mend'?'生命补给':rank?`等级 ${rank} 提升至 ${rank+1}`:'初次获得'}${!eligible?'，当前不可领取':''}`}${favorite?'，收藏神器材料':''}`}>
       <div className="draft-card-top"><span><i/>{owner?'已领取':card.key==='mend'?'月露补给':rank?'精进兵装':u.kind==='weapon'?'新武器':'新道具'}{favorite&&<Star className="draft-favorite-star" size={11} fill="currentColor" aria-hidden="true"/>}</span><kbd aria-label={`快捷键 ${shortcuts[i]}`}>{shortcuts[i]}</kbd></div>
       <div className="draft-card-main">
        <div className="draft-weapon-seal" aria-hidden="true">{u.kind==='weapon'?<WeaponIcon id={card.key} size={48}/>:<ItemIcon size={28} strokeWidth={1.4}/>}</div>
        <div className="draft-weapon-name"><h3>{u.name}</h3><span className="draft-rank">{card.key==='mend'?'恢复生命':owner?`Lv.${shownRank} · 已领取`:rank?`Lv.${rank} → ${rank+1}`:'初次获得'}</span>{card.key!=='mend'&&<div className="draft-rank-pips" aria-label={`${owner?'当前':'领取后'}等级 ${owner?shownRank:rank+1}，最高 ${u.max} 级`}>{Array.from({length:u.max},(_,j)=><i key={j} className={j<(owner?shownRank:rank)?'lit':!owner&&j===rank?'next':''}/>)}</div>}</div>
       </div>
       <p>{u.kind==='weapon'&&(owner||!rank)?u.sub:u.detail}</p>
       <div className="draft-card-footer">{owner?<span className="draft-card-owner"><Check size={13}/><span>P{owner.index+1} · {owner.name}</span><b>已领取</b></span>:<><span className="draft-pick-label">{pending===card.key?'确认中…':!waiting?'等待队友':!eligible?'条件未满足':'择取兵装'}</span>{!disabled&&<ArrowUpRight size={15}/>}</>}</div>
      </button>{renderCursors(card.id)}
     </div>;
    })}{renderCursors('')}
   </div></div>
   <footer className="draft-bottom"><span><MousePointer2 size={11}/>{waiting?<><span className="draft-desktop-hint">点击卡片 / 按对应数字或符号领取</span><span className="draft-touch-hint">轻触卡片，择取你的兵装</span></>:<span>可继续查看队友的选择与光标</span>}</span><span>星标 <Star size={10}/> 收藏神器的材料</span></footer>
  </section>
 </div>;
}
