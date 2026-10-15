/** Keep a transient audio/drawing failure from permanently cancelling the game. */
export function startFrameLoop(step, {request=requestAnimationFrame, cancel=cancelAnimationFrame, report=console.error}={}) {
 let active=true,handle=0,lastReport=-Infinity;
 const frame=now=>{
  if(!active)return;
  try{step(now);}catch(error){if(now-lastReport>5000){lastReport=now;report('NIGHTFALL frame failed',error);}}
  finally{if(active)handle=request(frame);}
 };
 handle=request(frame);
 return()=>{active=false;cancel(handle);};
}
