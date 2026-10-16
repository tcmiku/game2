'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Flame,Infinity as InfinityIcon,X} from 'lucide-react';
import {SHRINES,SHRINE_POWERS,normalizeShrines,shrineCost,shrineBenefit} from '../../lib/sanctuary.mjs';
import {OfferingRitual} from '../../lib/shrine-ritual.mjs';
import {usePanelFocus} from './use-panel-focus';
const definitions:Record<string,any>=SHRINES;
type RitualState={phase:string,progress:number};
function Blessing({value}:{value:string}){return <>{value.split(' · ').map(line=><span key={line}>{line}</span>)}</>;}
export function SanctuaryPanel({profile,initial='foundation',onClose,onOffer,onRitual}:{profile:any,initial?:string,onClose:()=>void,onOffer:(id:string)=>boolean,onRitual:(id:string,state:RitualState)=>void}){
 const selected=definitions[initial]?initial:'foundation',def=definitions[selected],levels=normalizeShrines(profile.shrines),level=levels[selected],power=(SHRINE_POWERS as Record<string,any>)[selected],cost=shrineCost(levels,selected),max=cost===null,canOffer=!max&&profile.embers>=cost;
 const [state,setState]=useState<RitualState>({phase:'idle',progress:0}),[receipt,setReceipt]=useState('');
 const controller=useRef<any>(null),vessel=useRef<HTMLButtonElement>(null),latest=useRef({onOffer,onRitual,canOffer,selected,level});
 latest.current={onOffer,onRitual,canOffer,selected,level};usePanelFocus('.sanctuary-panel');
 useEffect(()=>{
  let active=true,frame=0;
  const ritual=new OfferingRitual({complete:()=>{
   const current=latest.current,accepted=current.onOffer(current.selected);
   if(active)setReceipt(accepted?(current.level?'祝福已增强':'雕像已唤醒'):'供奉未完成');
   return accepted;
  },update:(next:RitualState)=>{if(active){setState(next);latest.current.onRitual(latest.current.selected,next);}}});
  controller.current=ritual;
  const animate=(now:number)=>{ritual.tick(now);if(active)frame=requestAnimationFrame(animate);};frame=requestAnimationFrame(animate);
  const down=(event:KeyboardEvent)=>{
   const key=event.key.toLowerCase(),onVessel=event.target===vessel.current;
   if(event.repeat||!(key==='e'||onVessel&&(key===' '||key==='enter')))return;
   event.preventDefault();if(latest.current.canOffer&&ritual.begin(performance.now(),'key:'+key))setReceipt('');
  };
  const up=(event:KeyboardEvent)=>ritual.release('key:'+event.key.toLowerCase());
  const cancel=()=>ritual.cancel(),visibility=()=>{if(document.hidden)cancel();};
  window.addEventListener('keydown',down,true);window.addEventListener('keyup',up,true);window.addEventListener('blur',cancel);document.addEventListener('visibilitychange',visibility);
  vessel.current?.focus({preventScroll:true});
  return()=>{active=false;cancelAnimationFrame(frame);ritual.cancel();controller.current=null;latest.current.onRitual(latest.current.selected,{phase:'idle',progress:0});window.removeEventListener('keydown',down,true);window.removeEventListener('keyup',up,true);window.removeEventListener('blur',cancel);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{if(controller.current?.phase==='channeling')controller.current.cancel();},[cost,profile.embers,level]);
 const begin=(event:React.PointerEvent<HTMLButtonElement>)=>{
  if(event.button!==0||!canOffer)return;event.preventDefault();event.currentTarget.focus({preventScroll:true});
  if(controller.current?.begin(performance.now(),'pointer:'+event.pointerId)){setReceipt('');event.currentTarget.setPointerCapture(event.pointerId);}
 };
 const release=(event:React.PointerEvent<HTMLButtonElement>)=>controller.current?.release('pointer:'+event.pointerId);
 const move=(event:React.PointerEvent<HTMLButtonElement>)=>{const bounds=event.currentTarget.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)release(event);};
 const channeling=state.phase==='channeling',receiving=state.phase==='receiving',next={...levels,[selected]:level+1};
 return <div className="overlay sanctuary-overlay" role="dialog" aria-modal="true" aria-labelledby="sanctuary-title" onPointerDown={event=>{if(event.target===event.currentTarget)onClose();}}><section className={`sanctuary-panel ritual-${state.phase}`} style={{'--shrine-color':def.color,'--offering-progress':state.progress} as any}>
  <div className="altar-corners" aria-hidden="true"><i/><i/><i/><i/></div>
  <header className="sanctuary-heading"><div><h2 id="sanctuary-title">{def.name}</h2><div className="shrine-level" aria-label={`等级 ${level}${def.max===null?'，可持续升级':` / ${def.max}`}`}><span>Lv.</span><strong key={level}>{level}</strong>{def.max===null?<InfinityIcon size={14} aria-hidden="true"/>:<small>/ {def.max}</small>}</div></div><div className="sanctuary-balance" aria-label={`余火 ${profile.embers}`}><Flame size={14}/><strong>{profile.embers}</strong></div><button className="icon-button sanctuary-close" aria-label="结束祈福" onClick={onClose}><X size={18}/></button></header>
  <div className={`shrine-preview ${max?'complete':''}`}><div className="blessing-tablet"><span className="tablet-label">当前祝福</span><strong key={`current-${level}`}><Blessing value={shrineBenefit(levels,selected)}/></strong></div>{!max&&<><ArrowRight className="tablet-arrow" size={16} aria-hidden="true"/><div className="blessing-tablet next"><span className="tablet-label">{level?'下一级':'唤醒祝福'}</span><strong><Blessing value={shrineBenefit(next,selected)}/></strong></div></>}</div>
  <div className={`shrine-awakening ${level?'awakened':'dormant'}`}><span className="awakening-glyph" aria-hidden="true">{power.glyph}</span><div><small>{level?'专属能力 · 已解锁':'首次唤醒解锁'}</small><h3>{power.name}</h3><p>{power.detail}</p></div></div>
  <div className="ritual-offering">
   <button ref={vessel} className="shrine-vessel" disabled={!canOffer||receiving} aria-label={`按住祭器${level?'升级':'唤醒'}${def.name}${cost===null?'':`，消耗 ${cost} 余火`}`} aria-describedby="ritual-instruction" aria-keyshortcuts="E Space Enter" onPointerDown={begin} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onContextMenu={event=>event.preventDefault()}><i className="vessel-ring" aria-hidden="true"/><span className="vessel-flame" aria-hidden="true"><Flame size={38} strokeWidth={1.2}/></span><i className="vessel-bowl" aria-hidden="true"/></button>
   <div className="ritual-guidance"><strong id="ritual-instruction">{receiving?receipt:state.phase==='rejected'?receipt:max?'祝福圆满':!canOffer?'余火不足':channeling?'余火汇聚':'按住注火'}</strong>{receiving?<span className="ritual-cost">Lv. {level}</span>:!max&&<span className="ritual-cost"><Flame size={13}/>{cost}<small>余火</small></span>}<span className="ritual-hint">{receiving?'':state.phase==='rejected'?'松开后重试':channeling?'松手取消':canOffer?<>按住祭器<span className="ritual-keyboard-hint">或 <kbd>E</kbd></span></>:max?'已达最高等级':`还差 ${Math.max(0,(cost??0)-profile.embers)} 余火`}</span></div>
  </div>
  <span className="ritual-meter sr-only" role="progressbar" aria-label="注火进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress*100)}/>
  <p className="shrine-duration">永久祝福 · 下次出发生效</p><span className="sr-only" role="status" aria-live="polite">{receipt}</span>
 </section></div>;
}
