import {canUpgrade,UPGRADES} from './equipment.mjs';

export const DRAFT_SECONDS=14;
export const draftSize=players=>Math.min(12,Math.max(1,players.length)*3);
const allowed=(p,key)=>key==='mend'||canUpgrade(p,key);

/** One host-owned pool per round. Claimed cards remain in place for everyone. */
export function updateDraft(w){
 const s=w.s;if(!s.coop)return;
 let draft=s.draft;
 if(draft){
  draft.pending=draft.pending.filter(id=>s.players.some(p=>p.id===id&&p.hp>0&&p.choices.length));
  if(!draft.pending.length){s.draft=null;for(const p of s.players)if(p.hp>0)w.checkLevel(p);return;}
 }else{
  const pending=s.players.filter(p=>p.hp>0&&p.choices.length);if(!pending.length)return;
  const count=draftSize(s.players.filter(p=>p.hp>0)),keys=[];
  // Preserve each player's initial roll, including unlock/slot restrictions.
  for(let i=0;i<3;i++)for(const p of pending){const key=p.choices[i];if(key&&!keys.includes(key))keys.push(key);}
  const extra=Object.keys(UPGRADES).filter(key=>pending.some(p=>allowed(p,key))&&!keys.includes(key));
  for(let i=extra.length-1;i>0;i--){const j=Math.min(i,Math.floor(w.random()*(i+1)));[extra[i],extra[j]]=[extra[j],extra[i]];}
  keys.push(...extra);keys.length=Math.min(keys.length,count);while(keys.length<count)keys.push('mend');
  const id=`${s.runId}:${s.frame}:${pending.map(p=>p.level).join('-')}`;
  draft=s.draft={id,elapsed:0,pending:pending.map(p=>p.id),participants:pending.map(p=>p.id),cards:keys.map((key,i)=>({id:`${id}:${i}`,key,claimedBy:''}))};
 }
 for(const id of draft.pending){
  const p=s.players.find(p=>p.id===id);
  p.choices=[...new Set(draft.cards.filter(c=>!c.claimedBy&&allowed(p,c.key)).map(c=>c.key))];
  // A player must never lose their upgrade because others took the last
  // compatible weapon; a supply card replaces a now unusable free card.
  if(!p.choices.length){const card=draft.cards.find(c=>!c.claimedBy);if(card){card.key='mend';p.choices=['mend'];}}
 }
}

export function claimDraft(w,p,key,draftId){
 const draft=w.s.draft;if(!draft)return true;
 if(draftId!==undefined&&draftId!==draft.id||!draft.pending.includes(p.id))return false;
 const card=draft.cards.find(c=>c.key===key&&!c.claimedBy);if(!card)return false;
 card.claimedBy=p.id;draft.pending=draft.pending.filter(id=>id!==p.id);return true;
}

/** Panel-relative coordinates work across different window sizes and scrolling. */
export function cleanCursor(value){
 if(!value||typeof value.round!=='string'||value.round.length>180||!Number.isFinite(value.x)||!Number.isFinite(value.y))return null;
 return{round:value.round,card:typeof value.card==='string'?value.card.slice(0,220):'',x:Math.round(Math.max(0,Math.min(1,value.x))*1000)/1000,y:Math.round(Math.max(0,Math.min(1,value.y))*1000)/1000};
}
