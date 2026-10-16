import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Moon,Pause,Skull,Volume2,Maximize2} from 'lucide-react';
import {World,Renderer,W,H} from '../../lib/game.mjs';
import {CampRenderer} from '../../lib/camp-renderer.mjs';
import {loadGameAssets,gameImages} from '../../lib/assets.mjs';
import {partyIndicators} from '../../lib/party-compass.mjs';
import {playerStyle,playerLabel} from '../../lib/player-style.mjs';
import {ExperienceHud} from '../../components/game/experience-hud';
import {ShrineCombat} from '../../components/game/shrine-combat';
import {BossHud} from '../../components/game/boss-hud';
import {AppearancePreview} from '../../components/game/wardrobe-panel';
import {WeaponIcon} from '../../components/game/forge-panel';
import '../../app/globals.css';import '../../app/nightfall-theme.css';import '../../app/interface.css';import '../../app/boss-hud.css';import '../../app/multiplayer.css';

function Preview(){
 const canvas=useRef<HTMLCanvasElement>(null),world=useRef<any>(null),renderer=useRef<any>(null),selected=useRef('p0'),keys=useRef(new Set<string>()),[view,setView]=useState<any>(),[id,setId]=useState('p0'),[ready,setReady]=useState(false);
 const reset=()=>{const w=new World(['引路人','远行者','月影','守灯人'].map((name,index)=>({id:`p${index}`,name,index,weapon:'blade'})),(()=>{let seed=107;return()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;})());w.spawnCd=w.eliteAt=w.s.nextBossAt=1e9;w.s.time=190;for(const p of w.s.players){p.hp=p.maxHp=100;p.ranks={};p.shrines={stride:1};}w.s.players[1].x=W-400;w.s.players[2].y=220;w.s.players[3].x=1400;w.s.players[3].y=H-220;world.current=w;return w;};
 useEffect(()=>{world.current=null;const r=renderer.current=new Renderer(canvas.current!),camp=new CampRenderer(r);let active=true,frame=0,last=0,ui=0;loadGameAssets(gameImages(r,camp),{fontReady:document.fonts.ready}).then(()=>{if(!active)return;reset();setReady(true);}).catch(console.error);
  const loop=(now:number)=>{const dt=Math.min(.05,(now-last)/1000||.016);last=now;const w=world.current;if(w){const k=keys.current;w.input(selected.current,{x:(k.has('d')?1:0)-(k.has('a')?1:0),y:(k.has('s')?1:0)-(k.has('w')?1:0)});w.step(dt);r.render(w.s,selected.current,dt);if(now-ui>90){ui=now;const me=w.s.players.find((p:any)=>p.id===selected.current),arrows=partyIndicators(w.s.players,selected.current,r.camera,r.w,r.h,r.combatZoom);setView({...w.s,players:w.s.players.map((p:any)=>({...p})),me,arrows});}}frame=requestAnimationFrame(loop);};frame=requestAnimationFrame(loop);
  const down=(e:KeyboardEvent)=>keys.current.add(e.key.toLowerCase()),up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase()),blur=()=>keys.current.clear();window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
  return()=>{active=false;cancelAnimationFrame(frame);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);};
 },[]);
 const action=(key:string)=>{const w=world.current,p=w?.s.players.find((p:any)=>p.id===selected.current);if(!w||!p)return;
  if(key==='reset')reset();
  if(key==='group'){const x=p.x,y=p.y;for(const q of w.s.players){q.hp=100;q.ghost=false;q.down=false;q.connected=true;q.x=x+(q.index-p.index)*42;q.y=y+40;}}
  if(key==='same')for(const q of w.s.players)if(q.id!==p.id){q.hp=100;q.ghost=false;q.connected=true;q.x=W-180;q.y=p.y+q.index*8;}
  if(key==='ghost'){w.s.players[1].hp=0;w.s.players[2].connected=false;}
  if(key==='east'){p.x=W-350;p.y=H-700;}
  if(key==='south'){p.x=W/2-300;p.y=H-540;}
  if(key==='boss'){w.s.players[1].x=W-220;w.s.players[1].y=220;const b=w.spawn(4);b.x=p.x+370;b.y=p.y;b.speed=0;b.skillCd=999;b.hp=b.maxHp=1e8;}
 };
 const p=view?.me;return <main className="app in-game"><canvas ref={canvas} className="world-canvas" aria-label="扩展战场与队友方位试炼"/>
 <header className="topbar"><button className="brand" aria-label="长夜"><span className="brand-mark"><Moon size={22}/></span><span>NIGHTFALL</span><i>长夜</i></button><div className="top-actions"><span className="connected"><span/>试炼</span><button className="icon-button" aria-label="声音"><Volume2 size={18}/></button><button className="icon-button" aria-label="全屏"><Maximize2 size={18}/></button></div></header>
 {p&&<><ExperienceHud state={view} player={p}/><div className="hud"><div className="player-hud"><div className="avatar" style={{borderColor:playerStyle(p.index).color}}><AppearancePreview appearance={p.appearance} index={p.index}/><b style={{color:playerStyle(p.index).color}}>P{p.index+1}</b></div><div><div className="player-title"><span style={{color:playerStyle(p.index).color}}>P{p.index+1} · 你</span><small>LV.01</small></div><div className="health-track"><div style={{width:`${p.hp}%`}}/></div><div className="health-text">{Math.round(p.hp)} / 100</div></div></div><div className="timer"><strong>03:10</strong></div><div className="combat-stats"><span><Skull size={17}/>0</span><button className="icon-button pause-button" aria-label="暂停"><Pause size={18}/></button></div></div><BossHud state={view}/><ShrineCombat player={p} time={view.time} blocked={false} onDodge={()=>world.current.input(id,{dashSeq:Date.now()})}/><div className="party">{view.players.filter((q:any)=>q.id!==id).map((q:any)=><div key={q.id}><span className="party-dot" style={{background:playerStyle(q.index).color}}/><span style={{color:playerStyle(q.index).color}}>{playerLabel(q)}</span><small>{q.connected===false?'重连':q.ghost?'幽灵':100}</small></div>)}</div><div className="equipment-hud"><div className="loadout">{Array.from({length:6},(_,i)=><div className="loadout-slot" key={i}>{!i&&<WeaponIcon id="blade" size={34}/>}</div>)}</div></div><button className="forge-toggle">✧ 神器</button></>}
 <output aria-label="试炼状态" className="battle-qa-status">{ready&&p?`${W}×${H} · P${p.index+1}(${Math.round(p.x)},${Math.round(p.y)}) · 画外队友：${view.arrows.map((a:any)=>`P${a.index+1}${a.down?'＋':''}`).join('、')||'无'}`:'资源加载中'}</output>
 <details className="battle-qa-tools"><summary>本地四人试炼</summary><label>观察角色 <select aria-label="观察角色" value={id} onChange={e=>{selected.current=e.target.value;setId(e.target.value);renderer.current.positions.clear();}}>{[0,1,2,3].map(i=><option key={i} value={`p${i}`}>P{i+1}</option>)}</select></label>{[['reset','分散队友'],['group','队友归队'],['same','同向远行'],['ghost','幽灵与断线'],['boss','首领镜头'],['east','探索东境'],['south','南部石阵']].map(([key,text])=><button key={key} disabled={!ready} onClick={()=>action(key)}>{text}</button>)}<small>WASD 移动 · 不读写营地存档</small></details>
 <style>{`html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}.world-canvas{width:100vw;height:100dvh;display:block;image-rendering:pixelated}.battle-qa-status{position:absolute;left:50%;bottom:82px;transform:translateX(-50%);z-index:15;color:#b8c8ba;font:11px monospace;background:#0b1824e0;padding:5px 8px;white-space:nowrap;pointer-events:none}.battle-qa-tools{position:absolute;z-index:20;bottom:8px;left:50%;transform:translateX(-50%);width:min(480px,calc(100vw - 30px));padding:7px 10px;background:#111e2bed;border:1px solid #bdac7966;color:#ddcfb1;font:12px 'Songti SC',serif}.battle-qa-tools summary{cursor:pointer;text-align:center;letter-spacing:2px}.battle-qa-tools[open]{display:flex;flex-wrap:wrap;gap:6px}.battle-qa-tools label{display:block;margin:8px}.battle-qa-tools button,.battle-qa-tools select{background:#27343d;border:1px solid #94876b;color:#e7dabb;padding:6px 9px;margin:3px}.battle-qa-tools small{display:block;color:#99adac;margin-top:6px}@media(max-width:600px){.battle-qa-status{font-size:9px;bottom:106px}}`}</style>
 </main>;
}
const root=createRoot(document.getElementById('root')!);root.render(<Preview/>);
(import.meta as any).hot?.dispose(()=>root.unmount());
