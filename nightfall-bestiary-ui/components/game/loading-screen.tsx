'use client';
import {Moon,RotateCcw} from 'lucide-react';
export function LoadingScreen({loaded,total,phase,onRetry}:{loaded:number,total:number,phase:string,onRetry:()=>void}){
 if(phase==='done')return null;
 const progress=Math.min(100,Math.floor(loaded/Math.max(1,total)*100)),failed=phase==='error';
 return <section className={`loading-screen ${phase==='ready'?'is-ready':''}`} aria-label="加载游戏" aria-busy={!failed&&phase!=='ready'}>
  <div className="loading-content"><div className="loading-emblem" aria-hidden="true"><div className="loading-orbit"/><Moon size={58} strokeWidth={.65}/><i/><i/><i/></div>
   <h1>长夜</h1>
   <div className="loading-progress" role="progressbar" aria-label="游戏资源加载进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${loaded} / ${total}`}><span style={{width:`${progress}%`}}/></div>
   <div className="loading-status" role="status"><span className={failed?'':'sr-only'}>{failed?'资源加载失败':phase==='ready'?'已就绪':'载入中'}</span><span>{progress}<small>%</small></span></div>
   {failed&&<button className="loading-retry" onClick={onRetry}><RotateCcw size={13}/>重新加载</button>}
  </div>
 </section>;
}
