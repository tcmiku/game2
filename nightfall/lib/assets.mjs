/** Wait for the exact images used by the renderers, including PNG decoding. */
export const GAME_ASSET_TOTAL=28;
export function gameImages(renderer,camp){return[renderer.arena,renderer.atlas,renderer.actors,renderer.wardrobe,renderer.foes,renderer.walk,renderer.hitAtlas,renderer.relicAtlas,renderer.weaponAtlas,renderer.vfxAtlas,renderer.bestiary,renderer.uiAtlas,renderer.frontierAtlas,renderer.bossAtlas,renderer.duskAtlas,camp.map,camp.sanctuaryMap,camp.sanctuaryAtlas,camp.keeper,camp.portal,camp.smith,camp.residentAtlas,...camp.npcAssets];}
const aborted=()=>new DOMException('Loading cancelled','AbortError');
export function waitForImage(image,{signal,timeoutMs=20000}={}){
 return new Promise((resolve,reject)=>{
  let settled=false,decoding=false;
  const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);image.removeEventListener('load',loaded);image.removeEventListener('error',failed);signal?.removeEventListener('abort',cancel);error?reject(error):resolve(image);};
  const failed=()=>{const error=new Error('Game image could not be loaded');error.image=image;finish(error);};
  const cancel=()=>finish(aborted());
  const loaded=()=>{if(decoding||settled)return;if(!image.naturalWidth){failed();return;}decoding=true;Promise.resolve().then(()=>image.decode?.()).then(()=>signal?.aborted?cancel():finish(),failed);};
  const timer=setTimeout(failed,timeoutMs);
  image.addEventListener('load',loaded);image.addEventListener('error',failed);signal?.addEventListener('abort',cancel,{once:true});
  if(signal?.aborted)cancel();else if(image.complete){if(image.naturalWidth)loaded();else failed();}
 });
}
function waitForFonts(ready,{signal,timeoutMs}){
 return new Promise((resolve,reject)=>{
  let settled=false;const finish=error=>{if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);error?reject(error):resolve();};
  const cancel=()=>finish(aborted()),timer=setTimeout(()=>finish(new Error('Font readiness timed out')),timeoutMs);
  signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();
  Promise.resolve(ready).catch(()=>{}).then(()=>finish());
 });
}
/** @param {HTMLImageElement[]} images
 * @param {{signal?:AbortSignal,onProgress?:(loaded:number,total:number)=>void,fontReady?:Promise<unknown>,timeoutMs?:number}} [options] */
export async function loadGameAssets(images,{signal,onProgress=()=>{},fontReady=Promise.resolve(),timeoutMs=20000}={}){
 let loaded=0;const total=images.length+1;onProgress(loaded,total);
 const complete=()=>{if(signal?.aborted)throw aborted();onProgress(++loaded,total);};
 // Fonts may use the system fallback. Readiness means layout has settled.
 const fonts=waitForFonts(fontReady,{signal,timeoutMs}).then(complete);
 await Promise.all([...images.map(image=>waitForImage(image,{signal,timeoutMs}).then(complete)),fonts]);
}
export function retryGameImages(images,failedImage,nonce=Date.now()){
 for(const image of images)if(image===failedImage||!image.complete||!image.naturalWidth){const url=new URL(image.src);url.searchParams.set('retry',String(nonce));image.src=url.href;}
}
