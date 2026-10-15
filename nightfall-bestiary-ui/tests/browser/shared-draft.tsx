import React,{useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../app/globals.css';
import '../../app/nightfall-theme.css';
import '../../app/interface.css';
import '../../app/multiplayer.css';
import {SharedUpgradePanel} from '../../components/game/shared-upgrade-panel';
import {World} from '../../lib/game.mjs';
import {RealtimeRoom} from '../../lib/realtime.mjs';
import {packSnapshot,unpackSnapshot} from '../../lib/network.mjs';

function scene(count=4){const w=new World(Array.from({length:count},(_,i)=>({id:`p${i}`,name:['逐月者','青岚','绯叶','琥珀'][i]})),()=>.4);for(const p of w.s.players)w.xp(p,6);w.step(.02);return w;}
const copy=(v:any)=>JSON.parse(JSON.stringify(v));
function Demo(){
 const [showTools,setShowTools]=useState(true);
 const [world,setWorld]=useState(()=>scene()),[state,setState]=useState(()=>copy(world.s)),[selected,setSelected]=useState('p0'),[result,setResult]=useState('尚未运行实时连接验证');
 const members=state.players.map((p:any)=>({id:p.id,connected:true,input:{cursor:p.id==='p1'?{round:state.draft?.id,card:state.draft?.cards[2]?.id,x:.65,y:.4}:p.id==='p2'?{round:state.draft?.id,card:state.draft?.cards[7]?.id,x:.3,y:.55}:null}}));
 const reset=(count=4)=>{const w=scene(count);setWorld(w);setState(copy(w.s));setSelected('p0');};
 const watch=()=>{const w=scene();w.s.players[2].hp=0;w.s.players[2].name='风雪归途仍在守夜的旅人';(w.s as any).draft.elapsed=10;w.step(.02);setWorld(w);setState(copy(w.s));setSelected('p2');};
 async function verify(){
  setResult('正在验证：四人 HTTP 信令、真实 WebRTC、分片快照、输入和回退…');
  const sessions:any[]=[],peers:RealtimeRoom[]=[];let heartbeat:any,tick:any,running=true;const received=[0,0,0,0],inputs=new Set();
  const call=async(body:any)=>{const r=await fetch('/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),data:any=await r.json();if(!r.ok)throw Error(data.error);return data;};
  try{
   sessions.push(await call({action:'create',name:'实时验证房主'}));for(let i=1;i<4;i++)sessions.push(await call({action:'join',code:sessions[0].code,name:`实时验证P${i+1}`}));
   const host=sessions[0];for(let i=0;i<4;i++)peers.push(new RealtimeRoom({id:sessions[i].id,hostId:host.id,lease:host.lease,onInput:id=>inputs.add(id),onState:()=>received[i]++}));
   const poll=async()=>{for(let i=0;i<4&&running;i++){const p=sessions[i],data=await call({...p,action:'sync',wire:2,input:{serial:p.serial=(p.serial||0)+1,signals:peers[i].signals}});await peers[i].update(data);}};
   await poll();let polling=false;heartbeat=setInterval(async()=>{if(polling||!running)return;polling=true;try{await poll();}catch(error){setResult(`FAIL: ${error}`);}finally{polling=false;}},250);
   const dense:any=new World(sessions.map(p=>({id:p.id,name:'验证旅人'})));dense.s.enemies=Array.from({length:220},(_,id)=>({id,x:1600+id,y:800,hp:1000,maxHp:1000,type:1,size:20}));
   tick=setInterval(()=>{for(const peer of peers.slice(1))peer.sendInput({x:1,y:0,seq:0});dense.s.frame++;dense.s.time+=.05;for(const e of dense.s.enemies)e.x-=.5;peers[0].broadcast({...packSnapshot(dense.checkpoint()),test:'月'.repeat(36000)},[]);},50);
   const started=performance.now();await new Promise<void>((resolve,reject)=>{const check=setInterval(()=>{if(received.slice(1).every(n=>n>=10)&&inputs.size===3){clearInterval(check);resolve();}else if(performance.now()-started>18000){clearInterval(check);reject(Error(`实时连接超时，接收数 ${received.join('/')}`));}},100);});
   if([...peers[0].peers.values()].some(p=>!p.stateBase))throw Error('快照未确认增量基准');
   const recovering=peers[1].peers.get(host.id);recovering.downHistory.clear();await new Promise(resolve=>setTimeout(resolve,700));if(recovering.resync||!recovering.downlink)throw Error('丢失增量基准后未恢复');
   peers[3].close();await new Promise(resolve=>setTimeout(resolve,500));if(peers[3].fresh)throw Error('断开后未回退');
   const w=scene(),packet=packSnapshot(w.checkpoint(),{authoritative:true});await call({...host,action:'sync',snapshot:packet,status:'playing',wire:2,input:{serial:10000}});const fallback=await call({...sessions[3],action:'sync',wire:1,input:{serial:10000}});if(unpackSnapshot(fallback.snapshot).draft.cards.length!==12)throw Error('HTTP 回退快照丢失共享卡池');
   setResult(`PASS：四人真实 WebRTC · 三名队员各收到 ${Math.min(...received.slice(1))}+ 个大快照 · 确认增量与缺基准恢复 · 三路输入 · HTTP 回退保留 12 张卡`);
  }catch(error){setResult(`FAIL: ${error}`);}finally{running=false;clearInterval(heartbeat);clearInterval(tick);for(const peer of peers)peer.close();for(const p of sessions.reverse())await call({...p,action:'leave'}).catch(()=>{});}
 }
 return <>{showTools&&<div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'#0c1523',padding:'8px 14px',display:'flex',flexWrap:'wrap',gap:9,fontSize:12,color:'#e4d5b7'}}>
  <button onClick={()=>reset(2)}>2 人</button><button onClick={()=>reset(3)}>3 人</button><button onClick={()=>reset(4)}>4 人重置</button>
  {state.players.map((p:any)=><button key={p.id} onClick={()=>setSelected(p.id)}>查看 P{p.index+1}</button>)}
  <button onClick={watch}>观战 / 临近超时</button><button onClick={verify}>验证四人实时连接</button><button onClick={()=>setShowTools(false)}>隐藏验证工具</button><output style={{width:'100%'}}>{result}</output>
 </div>}<div style={{paddingTop:80}}>{state.draft?<SharedUpgradePanel state={state} playerId={selected} members={members} favorites={['starfall']} onChoose={key=>{world.upgrade(selected,key,state.draft.id);world.step(.02);setState(copy(world.s));}} onCursor={()=>{}}/>:<p>PASS：全员选择完毕，已恢复战斗。<button onClick={()=>reset()}>重置</button></p>}</div></>;
}
// This standalone entry can be evaluated again during a Vite refresh.
const mount=document.getElementById('root')! as HTMLElement&{draftRoot?:ReturnType<typeof createRoot>};
const root=mount.draftRoot??=createRoot(mount);root.render(<Demo/>);
