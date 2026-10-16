import {World,Renderer} from '/lib/game.mjs';
import {DUSK_TYPES} from '/lib/dusk-foes.mjs';
import {actorPose} from '/lib/animation.mjs';
const canvas=document.querySelector('#battle'),renderer=new Renderer(canvas),status=document.querySelector('#status');
const select=document.querySelector('select'),pause=document.querySelector('#pause');
const images=[renderer.arena,renderer.atlas,renderer.actors,renderer.foes,renderer.bestiary,renderer.duskAtlas,renderer.hitAtlas,renderer.weaponAtlas,renderer.vfxAtlas,renderer.frontierAtlas,renderer.uiAtlas,renderer.relicAtlas,renderer.walk,renderer.bossAtlas];
let world,paused=false,last=0,keys=new Set();
function reset(telegraph=false){
 let seed=127;world=new World(undefined,()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296));
 world.s.props=[];world.spawnCd=world.eliteAt=world.s.nextBossAt=1e9;
 const p=world.s.players[0];p.x=1800;p.y=1200;p.ranks={};p.count=p.orbit=p.nova=p.storm=0;p.hp=p.maxHp=1e8;p.nextXp=1e9;
 const types=select.value==='all'?[16,17,18,19]:[Number(select.value)];
 for(const [i,type]of types.entries()){
  const e=world.spawn(type,0),offset=types.length===1?{16:[120,0],17:[140,0],18:[260,0],19:[330,0]}[type]:[[-110,-60],[120,-50],[-230,80],[260,90]][i];
  e.x=p.x+offset[0];e.y=p.y+offset[1];e.skillCd=telegraph?0:1+i*.35;e.hp=e.maxHp=1e6;
  if(telegraph)e.speed=0;
 }
 if(telegraph){world.step(.05);paused=true;}
 pause.textContent=paused?'继续':'暂停';draw(.016);
}
function draw(dt){
 renderer.render(world.s,'solo',dt);
 status.textContent=world.s.time.toFixed(1)+' s'+(paused?' · 已暂停':'');
 for(const c of document.querySelectorAll('[data-type]')){
  const ctx=c.getContext('2d'),type=Number(c.dataset.type),enemy=world.s.enemies.find(e=>e.type===type);
  const pose=actorPose(enemy||{type,hp:1,moving:true},world.s.time,{reducedMotion:renderer.feedback.reducedMotion});
  ctx.clearRect(0,0,192,192);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#0b161b88';ctx.beginPath();ctx.ellipse(96,165,type===18?61:35,9,0,0,Math.PI*2);ctx.fill();
  ctx.drawImage(renderer.duskAtlas,pose.column*96,(type-16)*96,96,96,0,0,192,192);
 }
}
pause.onclick=()=>{paused=!paused;pause.textContent=paused?'继续':'暂停';draw(.016);};
document.querySelector('#attack').onclick=()=>reset(true);
document.querySelector('#reset').onclick=()=>reset();select.onchange=()=>reset(true);
const movement=new Set(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright']);
canvas.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(movement.has(key)){e.preventDefault();keys.add(key);}});
canvas.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));canvas.addEventListener('blur',()=>keys.clear());
try{
 await Promise.all(images.map(im=>im.decode()));await document.fonts.ready;reset();
 requestAnimationFrame(function frame(now){
  const dt=Math.min(.05,(now-last)/1000||.016);last=now;
  if(!paused){const x=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));world.input('solo',{x,y});world.step(dt);}
  draw(dt);requestAnimationFrame(frame);
 });
}catch(error){status.textContent='加载失败：'+error.message;console.error(error);}
