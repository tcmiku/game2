'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Flame,X} from 'lucide-react';

const glyphs=['vitality','power','speed','haste','area','cooling','linger','volley','renewal','ward','wisdom','preservation'];
const names={keeper:'守火人 · 伊蕾',smith:'铁匠 · 奥伦',herbalist:'药师 · 莱娅',scholar:'学者 · 索伦'};
export function NpcGlyph({id}:{id:string}){
 return <span className="npc-glyph" aria-hidden="true" style={{backgroundPosition:`-${Math.max(0,glyphs.indexOf(id))*48}px 0`}}/>;
}

/** A camp encounter keeps the world visible and contains keyboard focus. */
export function NpcEncounter({kind,title,balance,quote,onClose,children}:{kind:'keeper'|'smith'|'herbalist'|'scholar',title:string,balance:number,quote:string,onClose:()=>void,children:ReactNode}){
 const root=useRef<HTMLDivElement>(null),close=useRef(onClose),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [leaving,setLeaving]=useState(false);close.current=onClose;
 const dismiss=()=>{if(timer.current)return;setLeaving(true);timer.current=setTimeout(()=>close.current(),window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:180);};
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  root.current?.querySelector<HTMLElement>('.npc-option[aria-pressed="true"]')?.focus({preventScroll:true});
  const keys=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss();}
   if(event.key!=='Tab')return;
   const elements=Array.from(root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]')||[]);
   const first=elements[0],last=elements.at(-1);if(!first)return;
   if(!root.current?.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();}
   else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  window.addEventListener('keydown',keys,true);
  return()=>{window.removeEventListener('keydown',keys,true);if(timer.current)clearTimeout(timer.current);if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[]);
 return <div ref={root} className={`npc-encounter npc-${kind} ${leaving?'is-leaving':''}`} role="dialog" aria-modal="true" aria-labelledby={`${kind}-title`} onPointerDown={event=>{if(event.target===event.currentTarget)dismiss();}}>
  <figure className="npc-speaker">
   <div className="npc-portrait-scene" aria-hidden="true"><div className="npc-halo"/><img className="npc-portrait-figure" src={`/art/pixel-${kind}-portrait.png`} alt=""/>
    <div className="npc-embers">{Array.from({length:7},(_,i)=><i key={i} style={{'--ember-i':i} as any}/>)}</div>
   </div>
   <figcaption><h2>{names[kind]}</h2><p key={quote}>{quote}</p></figcaption>
  </figure>
  <section className="npc-sheet">
   <header className="npc-sheet-header"><div><h2 id={`${kind}-title`}>{title}</h2></div><button className="npc-close" aria-label={kind==='keeper'?'关闭强化面板':kind==='smith'?'关闭铁匠面板':`关闭${names[kind].split(' · ')[0]}面板`} onClick={dismiss}><X size={18}/></button></header>
   <div className="npc-ledger"><span>{kind==='keeper'?'永久强化':'局中升级道具'}</span><div><Flame size={15}/><strong key={balance}>{balance}</strong><small>余火</small></div></div>
   {children}
   <div className="npc-sheet-seal" aria-hidden="true"><i/><span>✦</span><i/></div>
  </section>
 </div>;
}
