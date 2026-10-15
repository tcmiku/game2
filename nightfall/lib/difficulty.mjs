/** Spawn scaling uses connected living players; existing enemies keep their rolled stats. */
export function partyDifficulty(state){
 const count=Math.max(1,Math.min(4,(state.players||[]).filter(p=>p.hp>0&&p.connected!==false).length));
 return{count,health:1+(count-1)*.48,bossHealth:1+(count-1)*.82,damage:1+(count-1)*.1,spawn:1+(count-1)*.3,cadence:1/(1+(count-1)*.13)};
}
export const bossActive=s=>(s.enemies||[]).some(e=>e.type===4&&e.hp>0);
