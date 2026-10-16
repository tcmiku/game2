'use client';
import {useEffect,useRef,useState} from 'react';
import {Check,RotateCcw,Shirt,Scissors,Palette,X} from 'lucide-react';
import {OUTFITS,HAIRSTYLES,HAIR_COLORS,DEFAULT_APPEARANCE,WARDROBE_URL,normalizeAppearance,appearanceKey,composeAppearanceAtlas} from '../../lib/appearance.mjs';
import {actorPose} from '../../lib/animation.mjs';
import {usePanelFocus} from './use-panel-focus';
import '../../app/wardrobe.css';

type Appearance={outfit:string;hairstyle:string;hairColor:string};
type Motion='idle'|'walk'|'attack';
let imagePromise:Promise<HTMLImageElement>|null=null;
const strips=new Map<string,HTMLCanvasElement>();
function loadAtlas(){return imagePromise??=(async()=>{const image=new Image();image.src=WARDROBE_URL;await image.decode();return image;})();}

export function AppearancePreview({appearance,index=0,animate=false,motion='idle',face=1}:{appearance:Appearance;index?:number;animate?:boolean;motion?:Motion;face?:number}){
 const canvas=useRef<HTMLCanvasElement>(null),[failed,setFailed]=useState(false),key=appearanceKey(appearance);
 useEffect(()=>{
  let live=true,frame=0;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  loadAtlas().then(image=>{
   if(!live||!canvas.current)return;const cacheKey=`${index}:${key}`;let strip=strips.get(cacheKey);
   if(!strip){const [outfit,hairstyle,hairColor]=key.split('/');strip=composeAppearanceAtlas(image,{outfit,hairstyle,hairColor},index);strips.set(cacheKey,strip);if(strips.size>32)strips.delete(strips.keys().next().value!);}
   const tile=strip,c=canvas.current.getContext('2d')!;
   const draw=(now:number)=>{if(!live)return;const time=now/1000,entity={hp:1,moving:animate&&motion==='walk',attackAt:animate&&motion==='attack'?time-time%1.2:undefined},pose=actorPose(entity,time,{player:true,reducedMotion:reduced});
    c.clearRect(0,0,192,192);c.save();c.imageSmoothingEnabled=false;if(face<0){c.translate(192,0);c.scale(-1,1);}c.drawImage(tile,(animate?pose.column:0)*96,0,96,96,0,pose.offsetY,192,192);c.restore();
    if(animate&&!reduced)frame=requestAnimationFrame(draw);
   };draw(animate?performance.now():0);
  }).catch(()=>{if(live)setFailed(true);});
  return()=>{live=false;cancelAnimationFrame(frame);};
 },[key,index,animate,motion,face]);
 return failed?<span className="wardrobe-preview-error">预览未载入</span>:<canvas ref={canvas} width={192} height={192} aria-label="角色穿搭预览"/>;
}

export function WardrobePanel({appearance,onSave,onClose}:{appearance:Appearance;onSave:(value:Appearance)=>void;onClose:()=>void}){
 const [draft,setDraft]=useState<Appearance>(()=>normalizeAppearance(appearance)),[tab,setTab]=useState<'outfit'|'hairstyle'|'hairColor'>('outfit'),[motion,setMotion]=useState<Motion>('idle'),[face,setFace]=useState(1);
 const outfit=OUTFITS.find(o=>o.id===draft.outfit)!,hair=HAIRSTYLES.find(h=>h.id===draft.hairstyle)!,color=HAIR_COLORS.find(c=>c.id===draft.hairColor)!;
 usePanelFocus('.wardrobe-panel');
 return <div className="wardrobe-overlay" role="dialog" aria-modal="true" aria-labelledby="wardrobe-title" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();}}}>
  <section className="wardrobe-panel">
   <header><div><small>旅人帐篷</small><h2 id="wardrobe-title">更衣与梳妆</h2></div><button className="wardrobe-close" aria-label="关闭换装面板" onClick={onClose}><X size={20}/></button></header>
   <div className="wardrobe-content">
    <div className="wardrobe-model"><div className="wardrobe-portrait"><div className="wardrobe-orbit"/><AppearancePreview appearance={draft} animate motion={motion} face={face}/><i/></div>
     <strong>{outfit.name}</strong><span>{hair.name} · {color.name}</span>
     <div className="wardrobe-motion" aria-label="预览动作">{([['idle','待机'],['walk','行走'],['attack','攻击']] as const).map(([id,label])=><button key={id} aria-pressed={motion===id} onClick={()=>setMotion(id)}>{label}</button>)}<button aria-label="转身预览" onClick={()=>setFace(v=>-v)}><RotateCcw size={14}/></button></div>
     <p>自由搭配，免费换装。<br/>保存后在营地与战斗中穿着。</p>
    </div>
    <div className="wardrobe-options">
     <div className="wardrobe-tabs" aria-label="外观分类"><button aria-pressed={tab==='outfit'} onClick={()=>setTab('outfit')}><Shirt size={16}/>服装 <small>8</small></button><button aria-pressed={tab==='hairstyle'} onClick={()=>setTab('hairstyle')}><Scissors size={16}/>发型 <small>6</small></button><button aria-pressed={tab==='hairColor'} onClick={()=>setTab('hairColor')}><Palette size={16}/>发色 <small>8</small></button></div>
     <div className={`wardrobe-grid ${tab==='hairColor'?'colors':tab==='hairstyle'?'hair':''}`}>
      {tab==='outfit'&&OUTFITS.map(value=><button key={value.id} className="wardrobe-option" aria-label={`试穿${value.name}`} aria-pressed={draft.outfit===value.id} onClick={()=>setDraft(v=>({...v,outfit:value.id}))} style={{'--outfit-color':value.color} as React.CSSProperties}><AppearancePreview appearance={{...draft,outfit:value.id}}/><span><strong>{value.name}</strong><small>{value.detail}</small></span>{draft.outfit===value.id&&<Check size={13}/>}</button>)}
      {tab==='hairstyle'&&HAIRSTYLES.map(value=><button key={value.id} className="wardrobe-option" aria-label={`试用${value.name}`} aria-pressed={draft.hairstyle===value.id} onClick={()=>setDraft(v=>({...v,hairstyle:value.id}))}><AppearancePreview appearance={{...draft,hairstyle:value.id}}/><span><strong>{value.name}</strong></span>{draft.hairstyle===value.id&&<Check size={13}/>}</button>)}
      {tab==='hairColor'&&HAIR_COLORS.map(value=><button key={value.id} className="wardrobe-option" aria-label={`${value.name}发色`} aria-pressed={draft.hairColor===value.id} onClick={()=>setDraft(v=>({...v,hairColor:value.id}))}><i className="hair-swatch" style={{background:value.color}}/><strong>{value.name}</strong>{draft.hairColor===value.id&&<Check size={13}/>}</button>)}
     </div>
    </div>
   </div>
   <footer><button className="wardrobe-reset" onClick={()=>setDraft({...DEFAULT_APPEARANCE})}><RotateCcw size={13}/>恢复初始</button><div><button className="wardrobe-cancel" onClick={onClose}>取消</button><button className="wardrobe-save" onClick={()=>onSave(normalizeAppearance(draft))}><Check size={15}/>保存外观</button></div></footer>
  </section>
 </div>;
}
