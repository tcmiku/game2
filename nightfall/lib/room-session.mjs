/** Shared room timing and per-tab resume identity. Tokens never enter URLs. */
export const ROOM_SESSION_KEY='nightfall-room-v2';
export const MEMBER_GRACE_MS=60000,HOST_LEASE_MS=4000,MEMBER_ONLINE_MS=2500,ROOM_TTL_MS=120000;
export function storedSession(value){
 if(!value||typeof value!=='object'||!/^\w{6}$/.test(value.code||'')||!['id','token'].every(key=>typeof value[key]==='string'&&value[key].length>0&&value[key].length<=128))return null;
 return{code:value.code.toUpperCase(),id:value.id,token:value.token,lease:typeof value.lease==='string'?value.lease:'',serial:Math.max(0,Number(value.serial)||0)};
}
export function saveSession(storage,room){try{const value=storedSession(room);if(value)storage.setItem(ROOM_SESSION_KEY,JSON.stringify(value));else storage.removeItem(ROOM_SESSION_KEY);}catch{}}
export function readSession(storage){try{return storedSession(JSON.parse(storage.getItem(ROOM_SESSION_KEY)||'null'));}catch{return null;}}
export function clearSession(storage){try{storage.removeItem(ROOM_SESSION_KEY);}catch{}}
export function connectionQuality(rtt,failures=0){return failures?'reconnecting':rtt>240?'slow':rtt>100?'fair':'good';}
/** Fixed 50 Hz authority. Discard suspended-tab debt instead of monopolizing the
 * main thread with a second of simulation before rendering/networking can run. */
export const MAX_CATCHUP_STEPS=5;
export class HostTicker{
 constructor(step,now=performance.now()){this.step=step;this.last=now;this.accumulator=0;}
 pump(now,enabled=true){const elapsed=Math.max(0,Math.min(MAX_CATCHUP_STEPS*20,now-this.last));this.last=now;if(!enabled){this.accumulator=0;return 0;}this.accumulator+=elapsed;let count=0;while(this.accumulator>=20-1e-6&&count<MAX_CATCHUP_STEPS){this.step(.02);this.accumulator-=20;count++;}return count;}
}
