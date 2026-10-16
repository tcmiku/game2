import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForImage,loadGameAssets,gameImages,GAME_ASSET_TOTAL,retryGameImages} from '../lib/assets.mjs';
const tick=()=>new Promise(r=>setImmediate(r));
class Asset extends EventTarget{
 constructor(path='image',complete=false){super();this.src=`https://game.test/art/${path}.png`;this.complete=complete;this.naturalWidth=complete?64:0;this.decode=()=>Promise.resolve();}
 load(){this.complete=true;this.naturalWidth=64;this.dispatchEvent(new Event('load'));}
}
test('game remains loading until every image has decoded and fonts have settled',async()=>{
 const a=new Asset('a',true),b=new Asset('b');let decodeDone,fontDone;const progress=[];b.decode=()=>new Promise(r=>decodeDone=r);
 let entered=false;const task=loadGameAssets([a,b],{fontReady:new Promise(r=>fontDone=r),onProgress:(n,total)=>progress.push([n,total])}).then(()=>entered=true);
 await tick();assert.equal(entered,false);assert.deepEqual(progress,[[0,3],[1,3]]);b.load();await tick();assert.equal(entered,false);fontDone();await tick();assert.equal(entered,false,'load event alone cannot reveal undecoded sprites');decodeDone();await task;
 assert.equal(entered,true);assert.deepEqual(progress.map(p=>p[0]),[0,1,2,3]);assert.ok(progress.every(p=>p[1]===3));
});
test('cached images still decode, and existing renderer load callbacks remain intact',async()=>{
 const image=new Asset('cached',true);let decoded=false;image.onload=()=>{};const callback=image.onload;image.decode=async()=>{decoded=true;};await waitForImage(image);assert.ok(decoded);assert.equal(image.onload,callback);
});
test('image network and decode failures reject without reporting a successful completion',async()=>{
 for(const decoding of [false,true]){const image=new Asset('bad',decoding);if(decoding)image.decode=()=>Promise.reject(new Error('corrupt PNG'));const progress=[];const task=loadGameAssets([image],{onProgress:n=>progress.push(n)});if(!decoding)image.dispatchEvent(new Event('error'));await assert.rejects(task,error=>error.image===image);assert.ok(!progress.includes(2));}
});
test('timeouts and unmount cancellation terminate pending loads, including a pending font',async()=>{
 await assert.rejects(waitForImage(new Asset(),{timeoutMs:10}),/could not be loaded/);
 const controller=new AbortController(),image=new Asset('pending');const pending=waitForImage(image,{signal:controller.signal});controller.abort();await assert.rejects(pending,{name:'AbortError'});image.load();
 const fonts=new AbortController(),task=loadGameAssets([new Asset('done',true)],{signal:fonts.signal,fontReady:new Promise(()=>{})});await tick();fonts.abort();await assert.rejects(task,{name:'AbortError'});
});
test('retry refreshes only the failed and unfinished images and preserves decoded assets',()=>{
 const good=new Asset('good',true),bad=new Asset('bad',true),pending=new Asset('pending'),original=good.src;retryGameImages([good,bad,pending],bad,123);
 assert.equal(good.src,original);assert.equal(new URL(bad.src).searchParams.get('retry'),'123');assert.equal(new URL(pending.src).searchParams.get('retry'),'123');
});
test('resource inventory includes all camp, combat, weapon and enemy atlases',()=>{
 const renderer=Object.fromEntries(['arena','atlas','actors','wardrobe','foes','walk','hitAtlas','relicAtlas','weaponAtlas','vfxAtlas','bestiary','uiAtlas','frontierAtlas','bossAtlas','duskAtlas','dragonLightAtlas'].map(k=>[k,new Asset(k)])),camp=Object.fromEntries(['map','sanctuaryMap','sanctuaryAtlas','keeper','portal','smith','residentAtlas'].map(k=>[k,new Asset(k)]));camp.npcAssets=[new Asset("keeper-portrait"),new Asset("smith-portrait"),new Asset("npc-glyphs"),new Asset("herbalist-portrait"),new Asset("scholar-portrait")];const images=gameImages(renderer,camp);assert.equal(new Set(images).size,28);assert.equal(images.length+1,GAME_ASSET_TOTAL);assert.ok(images.includes(renderer.dragonLightAtlas)&&images.includes(renderer.wardrobe)&&images.includes(renderer.duskAtlas)&&images.includes(renderer.bossAtlas)&&images.includes(renderer.foes)&&images.includes(camp.smith)&&images.includes(renderer.weaponAtlas)&&images.includes(renderer.vfxAtlas)&&images.includes(renderer.bestiary)&&images.includes(renderer.uiAtlas)&&camp.npcAssets.every(image=>images.includes(image)));
});
