import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunId} from '../lib/run-id.mjs';
import {newProfile,settleRun,normalizeProfile} from '../lib/camp.mjs';
test('native UUID generation retains the Crypto receiver',()=>{
 const crypto={randomUUID(){assert.equal(this,crypto);return 'native-uuid';}};assert.equal(createRunId(crypto),'native-uuid');
});
test('missing or rejected randomUUID falls back to getRandomValues',()=>{
 for(const randomUUID of [undefined,null,'unavailable',()=>{throw new Error('Unavailable context');}]){
  const crypto={randomUUID,getRandomValues(bytes){assert.equal(this,crypto);return bytes.fill(13);}};
  assert.match(createRunId(crypto),/^run-[a-z0-9]+-[a-z0-9]+-(0d){16}$/);
 }
});
test('contexts without Web Crypto still get distinct local run IDs',()=>{
 for(const crypto of [null,{}, {getRandomValues(){throw new Error('Unavailable');}}]){
  const ids=Array.from({length:1000},()=>createRunId(crypto));assert.equal(new Set(ids).size,ids.length);assert.ok(ids.every(id=>/^run-[a-z0-9]+-[a-z0-9]+-[0-9a-f]{32}$/.test(id)));
 }
});
test('same-millisecond fallback IDs remain unique even with repeated random bytes',()=>{
 const original=Date.now;Date.now=()=>123;
 try{const crypto={getRandomValues:bytes=>bytes.fill(0)},ids=Array.from({length:1000},()=>createRunId(crypto));assert.equal(new Set(ids).size,1000);}finally{Date.now=original;}
});
test('fallback run IDs persist and preserve one-time settlement across reloads',()=>{
 const id=createRunId(null),result=settleRun(newProfile(),id,{time:60,status:'over'},{kills:10});assert.equal(result.reward,2);
 const saved=normalizeProfile(JSON.parse(JSON.stringify(result.profile))),duplicate=settleRun(saved,id,{time:60,status:'over'},{kills:10});assert.equal(duplicate.reward,0);assert.equal(duplicate.profile.embers,result.profile.embers);
});
