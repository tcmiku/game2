import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BOSS_VISUALS,BOSS_CELL,bossCamera,bossVisual} from '../lib/boss-presentation.mjs';
import {World} from '../lib/game.mjs';
test('five detailed bosses have two native 224px poses and bodies far larger than the player',async()=>{
 const png=await readFile(new URL('../public/art/pixel-bosses.png',import.meta.url));assert.equal(png.readUInt32BE(16),BOSS_CELL*5);assert.equal(png.readUInt32BE(20),BOSS_CELL*2);for(const v of Object.values(BOSS_VISUALS))assert.ok(v.height>=340&&v.radius>=56);
 const w=new World(undefined,()=>.5);for(let cycle=1;cycle<=4;cycle++){w.s.time=cycle*300;const b=w.spawn(4);assert.equal(b.size,bossVisual(b).radius);assert.ok(b.size>50);assert.ok(Math.hypot(b.x-w.s.players[0].x,b.y-w.s.players[0].y)<=441);}
});
test('boss framing retains a visible player and large boss at desktop and portrait sizes',()=>{
 const p={x:1500,y:1000};for(const [width,height,base] of [[1280,720,1],[368,584,.64]])for(const kind of ['roots','prism','halo','ribbon'])for(const direction of [-1,1]){const b={type:4,bossKind:kind,x:p.x+direction*440,y:p.y,hp:1},s={enemies:[b]},v=bossVisual(b),frame=bossCamera(s,p,width,height,base),project=e=>({x:width/2+(e.x-frame.x)*frame.zoom,y:height/2+(e.y-frame.y)*frame.zoom});const player=project(p),boss=project(b);assert.ok(player.x>20&&player.x<width-20);assert.ok(player.y>100&&player.y<height-50);assert.ok(boss.x-v.height*.45*frame.zoom>0&&boss.x+v.height*.45*frame.zoom<width);assert.ok(boss.y-v.height*.89*frame.zoom>100);assert.ok(frame.zoom<=base);}
 assert.deepEqual(bossCamera({enemies:[]},p,1280,720,1),{x:p.x,y:p.y,zoom:1});
});
