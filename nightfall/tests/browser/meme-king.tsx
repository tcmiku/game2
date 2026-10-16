import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../app/globals.css';
import '../../app/nightfall-theme.css';
import '../../app/interface.css';
import {World,Renderer} from '../../lib/game.mjs';
import {ForgePanel,RelicIcon} from '../../components/game/forge-panel';
import {weaponLoadout} from '../../lib/equipment.mjs';

function scene(){
 const w:any=new World([{id:'solo',name:'加冕者',weapon:'spincat'}] as any,()=>.4,[]),p=w.s.players[0];
 for(const [key,rank] of Object.entries({spincat:5,gugu:5,manbo:5,bananacat:5,flail:3,loom:3}))while((p.ranks[key]||0)<rank)w.applyUpgrade(p,key);
 p.hp=p.maxHp=1e8;p.nextXp=1e9;p.relics=0;w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 w.s.enemies=Array.from({length:36},(_,i)=>({id:10000+i,x:p.x+Math.cos(i*2.4)*(120+i%4*70),y:p.y+Math.sin(i*2.4)*(120+i%4*70),type:1,hp:1e8,maxHp:1e8,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0,skillCd:1e9}));return w;
}
function Demo(){
 const canvas=useRef<HTMLCanvasElement>(null),world=useRef(scene()),renderer=useRef<any>(null),forgeRef=useRef(false),paused=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [state,setState]=useState<any>(null),[forge,setForge]=useState(false),[favorites,setFavorites]=useState<string[]>([]),[ready,setReady]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('四把满级热梗武器已装备，先获得宝箱再合成。');
 const show=()=>setState(JSON.parse(JSON.stringify(world.current.s))),open=()=>{forgeRef.current=true;setForge(true);show();},close=()=>{forgeRef.current=false;setForge(false);};
 const chest=()=>{world.current.s.players[0].relics++;setNotice('已获得宝箱：meme之王与星锤雷狱可以合成。');show();};
 const reset=()=>{if(timer.current)clearTimeout(timer.current);world.current=scene();paused.current=false;close();setNotice('已重置：四把满级武器、六个武器位、宝箱 ×0。');show();};
 useEffect(()=>{
  const r=new Renderer(canvas.current);renderer.current=r;let running=true,frame=0,last=0,lastUI=0;
  Promise.all([r.arena,r.atlas,r.actors,r.foes,r.walk,r.hitAtlas,r.relicAtlas,r.weaponAtlas,r.vfxAtlas,r.bestiary,r.uiAtlas,r.frontierAtlas].map((im:any)=>im.decode())).then(()=>{
   if(!running)return;setReady(true);show();const tick=(now:number)=>{if(!running)return;try{const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    if(!forgeRef.current&&!paused.current){for(const e of world.current.s.enemies)e.knockX=e.knockY=0;world.current.step(dt);}r.render(world.current.s,'solo',dt);r.feedback.sounds=[];
    if(now-lastUI>100){show();lastUI=now;}frame=requestAnimationFrame(tick);
   }catch(e:any){setError(e.message);}};frame=requestAnimationFrame(tick);
  }).catch(e=>setError(e.message));
  return()=>{running=false;cancelAnimationFrame(frame);if(timer.current)clearTimeout(timer.current);};
 },[]);
 const p=state?.players[0],king=p?.evolutions.spincat==='memeking';
 return <main className="king-demo"><header><strong>长夜 · 四梗加冕</strong><button disabled={!ready} onClick={open}>神器合成</button><button onClick={chest}>获得宝箱</button><button onClick={()=>{if(timer.current)clearTimeout(timer.current);setNotice('6 秒后获得宝箱，打开神器页并向下翻以检查自动置顶。');timer.current=setTimeout(chest,6000);}}>延迟获得宝箱</button><button onClick={()=>{paused.current=!paused.current;show();}}>{paused.current?'继续':'暂停'}</button><button onClick={reset}>重置</button><a href="/">返回游戏</a></header>
  <canvas ref={canvas} aria-label="meme之王真实战场"/>
  <aside>{king&&<RelicIcon id="memeking" size={58}/>}<strong>{king?'meme之王':'四梗兵装 · 待加冕'}</strong><span>{notice}</span><output aria-label="加冕战斗状态">{error?`FAIL: ${error}`:p?`武器 ${weaponLoadout(p).length} / 6 · 宝箱 ${p.relics} · ${king?'神器伤害':'基础伤害'} ${Math.floor(king?p.stats.memeking.damage:Object.values(p.stats).reduce((n:number,s:any)=>n+s.damage,0))}`:'加载中'}</output></aside>
  {forge&&p&&<ForgePanel player={p} inRun onClose={close} onCraft={key=>{if(world.current.craft('solo',key)){setNotice(key==='memeking'?'四梗加冕成功：释放三个武器位。':'神器合成成功。');close();show();}}} pending="" starter="spincat" onSelect={()=>{}} favorites={favorites} onFavorite={key=>setFavorites(v=>v.includes(key)?v.filter(k=>k!==key):[...v,key])}/>}
  <style>{`html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}.king-demo{position:relative;width:100%;height:100%;font:12px system-ui;color:#e6d7b0;background:#0a1520}.king-demo>header{position:absolute;top:0;left:0;right:0;z-index:5;display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:14px 20px;min-height:65px;background:#0c1926f5;border-bottom:1px solid #b69d6344}.king-demo>header strong{margin-right:auto;letter-spacing:3px}.king-demo>header button{font:inherit;padding:7px 10px;color:#e7d8b4;background:#24303d;border:1px solid #b59e6255}.king-demo>header a{color:#b7ceb9}.king-demo>canvas{position:absolute;top:65px;left:0;right:0;width:100%;height:calc(100% - 65px);image-rendering:pixelated}.king-demo>aside{position:absolute;top:86px;left:24px;display:flex;flex-direction:column;gap:10px;max-width:370px;pointer-events:none;text-shadow:0 2px 5px #000}.king-demo>aside strong{font-size:20px;letter-spacing:3px}.king-demo>aside span{font-size:10px;line-height:1.8;color:#c4c0a9}.king-demo output{font:11px monospace;color:#cde1c4}.king-demo .forge-panel{height:min(640px,calc(100dvh - 36px))}@media(max-width:700px){.king-demo>header{padding:10px;gap:6px;min-height:112px;font-size:10px}.king-demo>header strong{flex-basis:100%;font-size:14px}.king-demo>header button{padding:6px}.king-demo>canvas{top:112px;height:calc(100% - 112px)}.king-demo>aside{top:128px;left:14px;max-width:300px}.king-demo>aside strong{font-size:17px}}`}</style>
 </main>;
}
const rootElement=document.querySelector('#root') as HTMLElement & {kingRoot?:ReturnType<typeof createRoot>};
(rootElement.kingRoot??=createRoot(rootElement)).render(<Demo/>);
