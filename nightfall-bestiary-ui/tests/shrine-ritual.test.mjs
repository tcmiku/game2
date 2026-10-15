import test from 'node:test';
import assert from 'node:assert/strict';
import {OfferingRitual,OFFERING_HOLD_MS,OFFERING_RESPONSE_MS} from '../lib/shrine-ritual.mjs';
import {newProfile} from '../lib/camp.mjs';
import {offerToShrine} from '../lib/sanctuary.mjs';

function offering(embers=500){
 let profile={...newProfile(),embers},purchases=0;
 const ritual=new OfferingRitual({complete(){const next=offerToShrine(profile,'foundation');if(!next)return false;profile=next;purchases++;return true;}});
 return{ritual,get profile(){return profile;},get purchases(){return purchases;}};
}
test('releasing before the offering fills spends nothing and a new gesture starts from zero',()=>{
 const o=offering();o.ritual.begin(0,'pointer:1');o.ritual.tick(800);assert.equal(o.purchases,0);assert.equal(o.ritual.progress,.8);
 o.ritual.release('pointer:1');assert.equal(o.ritual.progress,0);assert.equal(o.profile.embers,500);
 o.ritual.begin(900,'key:e');o.ritual.tick(1000);assert.equal(o.ritual.progress,.1);assert.equal(o.purchases,0);
});
test('one long hold completes one real upgrade, even across many frames and key repeats',()=>{
 const o=offering();o.ritual.begin(100,'key:e');o.ritual.tick(100+OFFERING_HOLD_MS);
 for(let t=1200;t<10000;t+=16){assert.equal(o.ritual.begin(t,'key:e'),false);o.ritual.tick(t);}
 assert.equal(o.purchases,1);assert.equal(o.profile.embers,450);assert.equal(o.profile.shrines.foundation,2);
 o.ritual.release('key:e');o.ritual.tick(10000);assert.equal(o.ritual.phase,'idle');
 o.ritual.begin(11000,'pointer:2');o.ritual.tick(11000+OFFERING_HOLD_MS);assert.equal(o.purchases,2);assert.equal(o.profile.embers,385);
});
test('pointer and keyboard releases cannot cancel a different active gesture',()=>{
 const o=offering();o.ritual.begin(0,'pointer:8');assert.equal(o.ritual.begin(50,'key:e'),false);
 o.ritual.release('key:e');o.ritual.tick(OFFERING_HOLD_MS);assert.equal(o.purchases,1);
});
test('focus loss or leaving the vessel cancels unfinished offerings without spending',()=>{
 const o=offering();o.ritual.begin(0,'key:e');o.ritual.tick(900);o.ritual.cancel();o.ritual.tick(9000);
 assert.equal(o.purchases,0);assert.equal(o.ritual.phase,'idle');assert.equal(o.ritual.source,null);
});
test('failed purchases do not show a completed blessing or retry while the input stays held',()=>{
 const o=offering(10);o.ritual.begin(0,'key:e');o.ritual.tick(OFFERING_HOLD_MS);assert.equal(o.ritual.phase,'rejected');
 o.ritual.tick(9000);assert.equal(o.purchases,0);assert.equal(o.profile.shrines.foundation,1);assert.equal(o.profile.embers,10);
 o.ritual.release('key:e');o.ritual.tick(10000);assert.equal(o.ritual.phase,'idle');
});
test('the response finishes after release and cannot trigger a second accidental purchase',()=>{
 const o=offering();o.ritual.begin(0,'pointer:1');o.ritual.tick(OFFERING_HOLD_MS);o.ritual.release('pointer:1');
 assert.equal(o.ritual.begin(OFFERING_HOLD_MS+10,'pointer:1'),false);
 o.ritual.tick(OFFERING_HOLD_MS+OFFERING_RESPONSE_MS);assert.equal(o.ritual.phase,'idle');assert.equal(o.purchases,1);
});
