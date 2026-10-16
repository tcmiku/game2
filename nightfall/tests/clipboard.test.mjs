import test from 'node:test';
import assert from 'node:assert/strict';
import {copyText} from '../lib/clipboard.mjs';

function browser({legacy=true,writeText}={}){
 let clipboard='',field=null,removed=false,focused=null;
 const range={cloneRange:()=>range},selection={rangeCount:1,getRangeAt:()=>range,removeAllRanges(){this.rangeCount=0;},addRange(value){assert.equal(value,range);this.rangeCount++;}};
 const button={isConnected:true,focus(){focused=this;},closest:()=>dialog},dialog={appendChild(value){field=value;}};
 const document={body:dialog,activeElement:button,getSelection:()=>selection,createElement:()=>({value:'',style:{},focus(){document.activeElement=this;},select(){this.selected=true;},setSelectionRange(start,end){this.start=start;this.end=end;},remove(){removed=true;}}),execCommand(command){
  if(legacy instanceof Error)throw legacy;
  assert.equal(command,'copy');if(!legacy)return false;
  assert.equal(document.activeElement,field);assert.ok(field.selected);assert.equal(field.start,0);assert.equal(field.end,field.value.length);clipboard=field.value;return true;
 }};
 return {document,navigator:writeText?{clipboard:{writeText}}:{},read:()=>clipboard,clean:()=>removed&&focused===button&&selection.rangeCount===1};
}

test('HTTP and embedded browsers copy exact room codes during the click without the async clipboard API',async()=>{
 const env=browser();const copying=copyText('0F3153',env);
 assert.equal(env.read(),'0F3153','clipboard changes before the click gesture ends');assert.equal(await copying,true);assert.ok(env.clean());
});
test('a synchronous copy works even when the webview async API would never settle',async()=>{
 let called=false;const env=browser({writeText:()=>{called=true;return new Promise(()=>{});}});
 assert.equal(await copyText('ABC123',env),true);assert.equal(called,false);assert.ok(env.clean());
});
test('modern clipboard remains available when legacy copying is disabled or throws',async()=>{
 for(const legacy of [false,new Error('Copy blocked')]){
  let written='';const env=browser({legacy,writeText:async value=>{written=value;}});
  assert.equal(await copyText('0012AF',env),true);assert.equal(written,'0012AF');assert.ok(env.clean());
 }
});
test('denied clipboard access reports failure and cleans temporary selection instead of claiming success',async()=>{
 for(const writeText of [undefined,async()=>{throw new Error('NotAllowedError');},()=>{throw new Error('Unavailable');}]){
  const env=browser({legacy:false,writeText});assert.equal(await copyText('ABC123',env),false);assert.equal(env.read(),'');assert.ok(env.clean());
 }
});
test('an unresponsive async clipboard has a bounded wait for manual copy',async()=>{
 const env=browser({legacy:false,writeText:()=>new Promise(()=>{})});assert.equal(await copyText('ABC123',{...env,timeoutMs:5}),false);assert.ok(env.clean());
});
test('missing document and empty codes do not throw or copy the word undefined',async()=>{
 assert.equal(await copyText('ABC123',{document:null,navigator:null}),false);
 let calls=0;for(const text of ['',undefined,null])assert.equal(await copyText(text,{navigator:{clipboard:{writeText:async()=>{calls++;}}}}),false);assert.equal(calls,0);
 let written='';assert.equal(await copyText('ABC123',{document:null,navigator:{clipboard:{writeText:async value=>{written=value;}}}}),true);assert.equal(written,'ABC123');
});
