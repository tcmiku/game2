import {rollChoices} from './equipment.mjs';
/** One source of truth per cooperative expedition; player fields are mirrors for old HUDs. */
export const TEAM_XP_STEP=.55;
export const experienceMembers=s=>Math.max(1,Math.min(4,s.players.filter(p=>p.connected!==false).length));
export const teamRequirement=(base,count)=>Math.max(1,Math.ceil(base*(1+TEAM_XP_STEP*(Math.max(1,Math.min(4,count))-1))));
const finite=(n,fallback)=>Number.isFinite(n)&&n>=0?n:fallback;
export function syncTeamExperience(s,{legacy=false}={}){
 if(!s.coop)return null;
 const count=experienceMembers(s);
 if(!s.teamXp||legacy){
  const highest=s.players.reduce((best,p)=>(p.level||1)>(best?.level||0)?p:best,null),level=Math.max(1,highest?.level||1),baseNext=Math.max(1,finite(highest?.nextXp,6)),ratio=Math.max(0,...s.players.filter(p=>(p.level||1)===level).map(p=>finite(p.xp,0)/Math.max(1,p.nextXp||6)));
  s.teamXp={level,xp:ratio*teamRequirement(baseNext,count),baseNext,nextXp:teamRequirement(baseNext,count),count};
  for(const p of s.players)p.upgradeCredits=finite(p.upgradeCredits,0)+(legacy?Math.max(0,level-(p.level||1)):0);
 }
 const t=s.teamXp;t.baseNext=Math.max(1,finite(t.baseNext,6));t.level=Math.max(1,finite(t.level,1));t.xp=finite(t.xp,0);
 if(t.count!==count){const next=teamRequirement(t.baseNext,count);t.xp=t.xp/Math.max(1,t.nextXp)*next;t.nextXp=next;t.count=count;}
 mirror(s);return t;
}
function mirror(s){const t=s.teamXp;for(const p of s.players){p.level=t.level;p.xp=t.xp;p.nextXp=t.nextXp;}}
/** Dead teammates bank upgrade rewards and claim them after revival. */
export function checkTeamLevel(w){
 const s=w.s,t=syncTeamExperience(s);if(!t||s.reaperSpawned)return;
 if(!s.draft&&!s.players.some(p=>p.hp>0&&p.choices.length)&&!s.players.some(p=>p.hp>0&&p.upgradeCredits>0)&&t.xp>=t.nextXp){
  t.xp-=t.nextXp;t.level++;t.baseNext=Math.floor(t.baseNext*1.24+3);t.nextXp=teamRequirement(t.baseNext,t.count);
  for(const p of s.players)p.upgradeCredits=(p.upgradeCredits||0)+1;
  w.events.push('level');
 }
 for(const p of s.players)if(!s.draft&&p.hp>0&&!p.choices.length&&p.upgradeCredits>0){p.upgradeCredits--;p.choices=rollChoices(p,w.random);p.choiceTime=0;}
 mirror(s);
}
export function awardTeamExperience(w,collector,value){
 if(collector.hp<=0||collector.connected===false||!Number.isFinite(value)||value<=0)return;
 const t=syncTeamExperience(w.s);if(!t)return;
 t.xp+=value*(1+(collector.ranks.wisdom||0)*.15);checkTeamLevel(w);
}
export function experienceView(s,player){return s?.coop&&s.teamXp?{...s.teamXp,shared:true}:player?{level:player.level,xp:player.xp,nextXp:player.nextXp,count:1,shared:false}:null;}
