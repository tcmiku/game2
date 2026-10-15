let sequence=0;
/** Local run/settlement identity only. Room IDs and authentication tokens stay server-generated.
 * @param {{randomUUID?:()=>string,getRandomValues?:(buffer:Uint8Array)=>Uint8Array}|null} [source] */
export function createRunId(source=globalThis.crypto){
 if(typeof source?.randomUUID==='function'){
  try{return source.randomUUID();}catch{/* Older browser contexts may expose but reject this API. */}
 }
 const bytes=new Uint8Array(16);
 try{
  if(typeof source?.getRandomValues!=='function')throw new Error('No browser random API');
  source.getRandomValues(bytes);
 }catch{
  for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
 }
 // The counter also separates runs created in the same millisecond.
 const suffix=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `run-${Date.now().toString(36)}-${(++sequence).toString(36)}-${suffix}`;
}
