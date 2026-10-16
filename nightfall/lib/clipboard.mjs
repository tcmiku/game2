function copySelection(text,doc){
 if(!doc?.body||typeof doc.execCommand!=='function')return false;
 const previous=doc.activeElement,selection=doc.getSelection?.(),ranges=[];
 for(let i=0;i<(selection?.rangeCount||0);i++)ranges.push(selection.getRangeAt(i).cloneRange());
 const field=doc.createElement('textarea');
 field.value=text;field.readOnly=true;field.tabIndex=-1;
 field.style.cssText='position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;opacity:0;font-size:16px;pointer-events:none';
 try{
  (previous?.closest?.('[role="dialog"]')||doc.body).appendChild(field);
  field.focus({preventScroll:true});field.select();field.setSelectionRange(0,text.length);
  return doc.execCommand('copy')===true;
 }catch{return false;}
 finally{
  field.remove();
  try{if(previous?.isConnected)previous.focus?.({preventScroll:true});}catch{}
  try{if(selection&&ranges.length){selection.removeAllRanges();for(const range of ranges)selection.addRange(range);}}catch{}
 }
}

/** Copy during the click gesture, including HTTP LAN play and embedded browsers. */
export async function copyText(text,{document:doc=globalThis.document,navigator:nav=globalThis.navigator,timeoutMs=1500}={}){
 if(typeof text!=='string'||!text.length)return false;
 // Some webviews leave writeText pending forever. Try the synchronous path first.
 if(copySelection(text,doc))return true;
 let timer;
 try{
  if(typeof nav?.clipboard?.writeText!=='function')return false;
  return await Promise.race([
   Promise.resolve(nav.clipboard.writeText(text)).then(()=>true,()=>false),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(false),timeoutMs);})
  ]);
 }catch{return false;}
 finally{clearTimeout(timer);}
}
