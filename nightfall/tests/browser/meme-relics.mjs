import {World,Renderer} from '/lib/game.mjs';
import {ARTIFACTS,UPGRADES} from '/lib/equipment.mjs';
const keys=['cataclysm','polarChoir','dreamcavalry','goldenbanquet'],nav=document.querySelector('nav'),description=document.querySelector('#description'),footer=document.querySelector('footer'),renderer=new Renderer(document.querySelector('canvas'));
let world,current=keys[0],evolved=true,last=performance.now(),frames=0;
function scene(){
 const recipe=ARTIFACTS[current];world=new World([{id:'preview',weapon:recipe.weapon}],()=>.4,[]);world.spawnCd=world.eliteAt=world.s.nextBossAt=1e9;const p=world.s.players[0];p.ranks[recipe.weapon]=5;p.ranks[recipe.item]=1;p.nextXp=1e9;p.relics=1;p.hp=p.maxHp=1e9;
 world.s.enemies=Array.from({length:24},(_,i)=>({id:1000+i,x:p.x+Math.cos(i/24*Math.PI*2)*(130+i%3*50),y:p.y+Math.sin(i/24*Math.PI*2)*(130+i%3*50),hp:1e8,maxHp:1e8,type:i%3+1,size:20,speed:0,hit:0,slow:0,orbitCd:0,phase:i*.5}));
 if(evolved)world.craft(p.id,current);description.textContent=`${evolved?recipe.name:UPGRADES[recipe.weapon].name} · ${recipe.detail}　|　${UPGRADES[recipe.weapon].name} Lv.5 + ${UPGRADES[recipe.item].name} Lv.1 + 宝箱 ×1`;
 for(const button of nav.children)button.classList.toggle('active',button.dataset.key===current);
}
for(const key of keys){const r=ARTIFACTS[key],button=document.createElement('button');button.dataset.key=key;button.setAttribute('aria-label',r.name);button.innerHTML=`<span class="glyph" style="background-position:-${(r.sprite-16)%6*56}px -${Math.floor((r.sprite-16)/6)*56}px"></span><span><strong>${r.name}</strong><small>${UPGRADES[r.weapon].name} Lv.5 + ${UPGRADES[r.item].name} Lv.1</small></span>`;button.onclick=()=>{current=key;evolved=true;scene();};nav.append(button);}
document.querySelector('#base').onclick=()=>{evolved=!evolved;scene();};
try{
 await Promise.all([renderer.arena,renderer.atlas,renderer.actors,renderer.foes,renderer.walk,renderer.hitAtlas,renderer.relicAtlas,renderer.weaponAtlas,renderer.vfxAtlas,renderer.bestiary,renderer.uiAtlas,renderer.frontierAtlas].map(image=>image.decode()));await document.fonts.ready;scene();
 requestAnimationFrame(function frame(now){try{const dt=Math.min(.05,(now-last)/1000);last=now;for(const e of world.s.enemies){e.knockX=e.knockY=0;e.stagger=0;}world.step(dt);renderer.render(world.s,'preview',dt);frames++;footer.textContent=`PASS · ${frames} 帧 · ${evolved?ARTIFACTS[current].name:'基础武器'} · 伤害 ${Math.floor(Object.values(world.s.players[0].stats).reduce((n,s)=>n+s.damage,0))} · 弹丸 ${world.s.shots.length}/180 · 区域 ${world.s.zones.length}/64`;requestAnimationFrame(frame);}catch(error){footer.textContent='FAIL: '+error.stack;console.error(error);}});
}catch(error){footer.textContent='FAIL: '+error.stack;console.error(error);}
