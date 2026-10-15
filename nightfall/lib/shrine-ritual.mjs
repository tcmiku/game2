/** One continuous offering gesture. Currency changes only at completion. */
export const OFFERING_HOLD_MS=1000;
export const OFFERING_RESPONSE_MS=700;
export class OfferingRitual {
 /** @param {{complete:()=>boolean,update?:(state:{phase:string,progress:number})=>void}} options */
 constructor({complete,update=()=>{}}){this.complete=complete;this.update=update;this.phase='idle';this.progress=0;this.source=null;this.started=0;this.respondUntil=0;}
 emit(){this.update({phase:this.phase,progress:this.progress});}
 begin(now,source){
  if(!Number.isFinite(now)||!source||this.source!==null||this.phase==='receiving')return false;
  this.source=source;this.started=now;this.phase='channeling';this.progress=0;this.emit();return true;
 }
 tick(now){
  if(!Number.isFinite(now))return;
  if(this.phase==='channeling'){
   this.progress=Math.max(0,Math.min(1,(now-this.started)/OFFERING_HOLD_MS));
   if(this.progress===1){
    // Latch before invoking the purchase so re-entrant/repeated frames cannot buy twice.
    this.phase='receiving';this.respondUntil=now+OFFERING_RESPONSE_MS;
    if(this.complete()!==true){this.phase='rejected';this.progress=0;}
   }
   this.emit();
  }else if((this.phase==='receiving'&&now>=this.respondUntil||this.phase==='rejected')&&this.source===null){
   this.phase='idle';this.progress=0;this.emit();
  }
 }
 release(source){
  if(source!==this.source)return;
  this.source=null;
  if(this.phase==='channeling'){this.phase='idle';this.progress=0;this.emit();}
 }
 cancel(){
  this.source=null;
  if(this.phase==='channeling'||this.phase==='rejected'){this.phase='idle';this.progress=0;this.emit();}
 }
}
