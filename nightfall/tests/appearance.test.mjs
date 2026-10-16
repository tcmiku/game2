import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {World} from '../lib/game.mjs';
import {newProfile,normalizeProfile,createCamp,stepCamp,campInteraction,TENT} from '../lib/camp.mjs';
import {OUTFITS,HAIRSTYLES,HAIR_COLORS,DEFAULT_APPEARANCE,normalizeAppearance,appearanceRow,appearanceKey,recolorHair,WARDROBE_ROWS,WARDROBE_COLUMNS,WARDROBE_CELL} from '../lib/appearance.mjs';
import {packSnapshot,presentationPacket,unpackSnapshot} from '../lib/network.mjs';
import {snapshotDelta,applySnapshotDelta} from '../lib/snapshot-delta.mjs';

test('old camp saves gain the default appearance and saved outfits preserve all progression',()=>{
 const old={embers:231,boons:{power:2},residents:['keeper','herbalist','smith'],unlocks:['forge'],runs:8},migrated=normalizeProfile(old);
 assert.deepEqual(migrated.appearance,DEFAULT_APPEARANCE);const look={outfit:'sakura',hairstyle:'braid',hairColor:'rose'},saved=normalizeProfile(JSON.parse(JSON.stringify({...migrated,appearance:look})));
 assert.deepEqual(saved.appearance,look);assert.equal(saved.embers,231);assert.equal(saved.boons.power,2);assert.equal(saved.runs,8);assert.deepEqual(saved.unlocks,['forge']);assert.deepEqual(newProfile().appearance,DEFAULT_APPEARANCE);
});
test('appearance input is bounded to known choices and never retains extra fields or mutable references',()=>{
 assert.deepEqual(normalizeAppearance({outfit:'invalid',hairstyle:null,hairColor:999,hp:1e9}),DEFAULT_APPEARANCE);
 const value={outfit:'mage',hairstyle:'long',hairColor:'lilac'},copy=normalizeAppearance(value);value.outfit='knight';assert.equal(copy.outfit,'mage');assert.equal(Object.keys(copy).length,3);
 assert.deepEqual(normalizeAppearance(null),DEFAULT_APPEARANCE);assert.equal(appearanceKey(copy),'mage/long/lilac');
});
test('eight outfits and six real hair silhouettes occupy unique valid twelve-pose strips',async()=>{
 assert.equal(OUTFITS.length,8);assert.equal(HAIRSTYLES.length,6);assert.equal(HAIR_COLORS.length,8);const rows=new Set();for(const o of OUTFITS)for(const h of HAIRSTYLES)rows.add(appearanceRow({outfit:o.id,hairstyle:h.id}));
 assert.equal(rows.size,48);assert.equal(Math.min(...rows),0);assert.equal(Math.max(...rows),47);
 const png=await readFile(new URL('../public/art/pixel-wardrobe.png',import.meta.url));assert.equal(png.readUInt32BE(16),WARDROBE_COLUMNS*WARDROBE_CELL);assert.equal(png.readUInt32BE(20),WARDROBE_ROWS*WARDROBE_CELL);
});
test('hair recoloring preserves skin, cloth and transparent pixels',()=>{
 const pixels=new Uint8ClampedArray([191,207,192,255,240,240,212,255,200,178,151,255,40,75,75,255,191,207,192,0]);recolorHair(pixels,'ink');
 assert.deepEqual([...pixels.slice(0,8)],[60,70,90,255,121,135,154,255]);assert.deepEqual([...pixels.slice(8)],[200,178,151,255,40,75,75,255,191,207,192,0]);
});
test('the existing camp tent is reachable and only offers wardrobe interaction within range',()=>{
 const c=createCamp();assert.notEqual(campInteraction(c),'tent');c.target={x:TENT.x+55,y:TENT.y+65};for(let i=0;i<180;i++)stepCamp(c,{},.05);
 assert.equal(campInteraction(c),'tent');const before={x:c.x,y:c.y};stepCamp(c,{x:1,y:1},.05,true);assert.equal(c.x,before.x);assert.equal(c.y,before.y);
});
test('solo and teammates keep independent looks, without changing stats or accepting live cosmetic input',()=>{
 const one={outfit:'nightcoat',hairstyle:'short',hairColor:'ink'},two={outfit:'frost',hairstyle:'ponytail',hairColor:'blue'},w=new World([{id:'p',appearance:one},{id:'q',appearance:two}],()=>.4,[]),[p,q]=w.s.players;
 assert.deepEqual(p.appearance,one);assert.deepEqual(q.appearance,two);one.outfit='sakura';assert.equal(p.appearance.outfit,'nightcoat');assert.equal(p.hp,q.hp);assert.equal(p.damage,q.damage);assert.equal(p.speed,q.speed);
 w.input('p',{appearance:{outfit:'mage',hairstyle:'braid',hairColor:'rose'},x:0,y:0});w.step(.05);assert.equal(p.appearance.outfit,'nightcoat');
});
test('full, presentation and delta takeover snapshots preserve the appearance of every player',()=>{
 const w=new World([{id:'p',appearance:{outfit:'mage',hairstyle:'long',hairColor:'lilac'}},{id:'q',appearance:{outfit:'crimson',hairstyle:'bob',hairColor:'wine'}}],()=>.4,[]),base=packSnapshot(w.checkpoint(),{authoritative:true});
 w.step(.05);const next=packSnapshot(w.checkpoint(),{authoritative:true}),saved=unpackSnapshot(applySnapshotDelta(base,snapshotDelta(base,next,7),7)),restored=World.restore(saved),view=unpackSnapshot(presentationPacket(next));
 for(let i=0;i<2;i++){assert.deepEqual(restored.s.players[i].appearance,w.s.players[i].appearance);assert.deepEqual(view.players[i].appearance,w.s.players[i].appearance);}
 const legacy=JSON.parse(JSON.stringify(w.checkpoint()));for(const p of legacy.players)delete p.appearance;assert.doesNotThrow(()=>World.restore(legacy).step(.05));
});
