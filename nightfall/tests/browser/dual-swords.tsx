import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../app/globals.css';
import '../../app/sword-skill.css';
import {World,Renderer} from '../../lib/game.mjs';
import {SwordSkill} from '../../components/game/sword-skill';
import {WeaponIcon} from '../../components/game/forge-panel';
import {swordMoveMultiplier} from '../../lib/dual-swords.mjs';

function scene(mode='pair'){
 const w:any=new World([{id:'solo',name:'试剑者',weapon:mode==='ranged'?'darkrepulser':'elucidator'}] as any,()=>.4,[]),p=w.s.players[0];
 p.ranks={...(mode!=='ranged'?{elucidator:3}:{}),...(mode!=='melee'?{darkrepulser:3}:{})};p.relics=1;p.hp=p.maxHp=1e6;p.nextXp=1e9;p.damage=18;
 w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;
 for(let i=0;i<18;i++){const a=i*2.4,radius=110+i%4*75;w.s.enemies.push({id:10000+i,x:p.x+Math.cos(a)*radius,y:p.y+Math.sin(a)*radius,type:1,hp:1e6,maxHp:1e6,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:0,skillCd:1e9});}
 return w;
}
function Demo(){
 const canvas=useRef<HTMLCanvasElement>(null),world=useRef(scene()),renderer=useRef<any>(null),keys=useRef(new Set<string>()),request=useRef(0),paused=useRef(false),walk=useRef(false);
 const [mode,setMode]=useState('pair'),[state,setState]=useState<any>(null),[ready,setReady]=useState(false),[error,setError]=useState(''),[pause,setPause]=useState(false);
 const show=()=>setState(JSON.parse(JSON.stringify(world.current.s)));
 const reset=(next=mode)=>{setMode(next);world.current=scene(next);request.current=0;keys.current.clear();walk.current=false;paused.current=false;setPause(false);show();};
 const cast=()=>{if(!paused.current){request.current++;world.current.input('solo',{...world.current.inputs.solo,skillSeq:request.current});}};
 useEffect(()=>{
  const r=new Renderer(canvas.current);renderer.current=r;let live=true,frame=0,last=0,lastUI=0;
  const images=[r.arena,r.atlas,r.actors,r.foes,r.walk,r.hitAtlas,r.relicAtlas,r.weaponAtlas,r.vfxAtlas,r.bestiary,r.uiAtlas,r.frontierAtlas];
  const down=(e:KeyboardEvent)=>{if(['INPUT','SELECT','BUTTON'].includes((e.target as HTMLElement).tagName))return;keys.current.add(e.key.toLowerCase());};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase()),blur=()=>keys.current.clear();
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  Promise.all(images.map((im:any)=>im.decode())).then(()=>{if(!live)return;setReady(true);show();
   const render=(now:number)=>{if(!live)return;try{const dt=Math.min(.05,(now-last)/1000||.016);last=now;
    const w=world.current,k=keys.current,x=(walk.current||k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),y=(k.has('s')||k.has('arrowdown')?1:0)-(k.has('w')||k.has('arrowup')?1:0);
    w.input('solo',{x,y,skillSeq:request.current});if(!paused.current)w.step(dt);r.render(w.s,'solo',dt);r.feedback.sounds=[];
    if(now-lastUI>80){show();lastUI=now;}frame=requestAnimationFrame(render);
   }catch(e:any){setError(e.message);}};frame=requestAnimationFrame(render);
  }).catch(e=>setError(e.message));
  return()=>{live=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
 },[]);
 const p=state?.players[0];
 return <main className="sword-demo">
  <header><strong>长夜 · 双剑试炼</strong><select aria-label="选择双剑演示" value={mode} onChange={e=>reset(e.target.value)}><option value="pair">阐释者 ＋ 逐暗者</option><option value="melee">阐释者 · 近身剑光</option><option value="ranged">逐暗者 · 远程剑气</option></select>
   <button disabled={!ready||mode!=='pair'||!!p?.evolutions.elucidator} onClick={()=>{world.current.craft('solo','dualblades');show();}}>合成二刀流</button>
   <button onClick={()=>{paused.current=!paused.current;setPause(paused.current);}}>{pause?'继续':'暂停'}</button><button onClick={()=>{paused.current=true;setPause(true);for(let i=0;i<3;i++)world.current.step(.05);show();}}>步进</button><button onClick={()=>reset()}>重置</button>
   <button aria-pressed={walk.current} onClick={()=>{walk.current=!walk.current;show();}}>移动演示</button><a href="/">返回游戏</a>
  </header>
  <canvas ref={canvas} aria-label="双剑试炼战场" tabIndex={0} onPointerDown={e=>{if(e.button===0)cast();}}/>
  <aside><div className="demo-swords"><WeaponIcon id="elucidator" size={48}/><WeaponIcon id="darkrepulser" size={48}/></div><strong>{p?.evolutions.elucidator?'神器 · 二刀流':'黑银剑光 / 青碧剑气'}</strong><span>WASD 移动 · 左键释放旋风</span><span>阐释者 Lv.3 ＋ 逐暗者 Lv.3 ＋ 宝箱 ×1</span>
   <output aria-label="双剑战斗状态">{error?`FAIL: ${error}`:!ready?'加载中':p?`${state.time.toFixed(2)}s · 移速 ×${swordMoveMultiplier(p,state.time).toFixed(2)} · 伤害 ${Math.round(Object.values(p.stats).reduce((n:number,v:any)=>n+v.damage,0))}`:''}</output>
  </aside>
  {p&&<SwordSkill player={p} time={state.time} blocked={pause} onCast={cast}/>}
  <style>{`html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}.sword-demo{position:relative;width:100%;height:100%;background:#0a1520;color:#d1e7df;font:13px system-ui}.sword-demo header{position:absolute;z-index:20;top:0;left:0;right:0;min-height:64px;display:flex;align-items:center;gap:10px;padding:10px 20px;flex-wrap:wrap;background:#0c1926f5;border-bottom:1px solid #759c9c44}.sword-demo header strong{letter-spacing:3px;margin-right:auto}.sword-demo header button,.sword-demo select{font:inherit;color:#d1e7df;background:#1b2d3b;border:1px solid #587a7c;padding:7px 10px;border-radius:3px}.sword-demo button:disabled{opacity:.5}.sword-demo a{color:#a9d6c9}.sword-demo canvas{position:absolute;inset:64px 0 0;width:100%;height:calc(100% - 64px);image-rendering:pixelated;outline:none}.sword-demo aside{position:absolute;top:87px;left:24px;display:flex;flex-direction:column;gap:9px;pointer-events:none;text-shadow:0 2px 5px #000}.sword-demo aside strong{font-size:17px;letter-spacing:3px}.sword-demo aside span{font-size:11px;color:#a0b8b7}.sword-demo output{font:11px monospace;color:#b5dfd5}.demo-swords{display:flex;gap:3px}@media(max-width:700px){.sword-demo header{gap:6px;padding:10px;min-height:120px;font-size:11px}.sword-demo header strong{flex-basis:100%;font-size:14px}.sword-demo header button,.sword-demo select{padding:6px}.sword-demo canvas{top:120px;height:calc(100% - 120px)}.sword-demo aside{top:137px;left:14px;gap:7px}.sword-demo aside strong{font-size:14px}.sword-demo aside span{font-size:9px}}`}</style>
 </main>;
}
const rootElement=document.querySelector('#root') as HTMLElement & {swordRoot?:ReturnType<typeof createRoot>};
(rootElement.swordRoot??=createRoot(rootElement)).render(<Demo/>);
