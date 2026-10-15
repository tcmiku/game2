// A delta always names its acknowledged base. Missing bases require a full
// packet; a partial packet must never become a playable or recoverable world.
const safe=key=>!['__proto__','constructor','prototype'].includes(key)&&!key.startsWith('_');
const equal=(a,b)=>a===b||(a==null&&b==null)||typeof a==='object'&&typeof b==='object'&&JSON.stringify(a)===JSON.stringify(b);
export function checkpointPacket(packet){return Object.fromEntries(Object.entries(packet||{}).filter(([key])=>safe(key)));}
export function snapshotDelta(previous,next,revision){
 if(!previous||previous.wire!==1||next.wire!==1||previous.runId!==next.runId)return next;
 const set={},remove=[],entities={};
 for(const [key,value] of Object.entries(next))if(key!=='entities'&&safe(key)&&!equal(previous[key],value))set[key]=value;
 for(const key of Object.keys(previous))if(safe(key)&&key!=='entities'&&!(key in next))remove.push(key);
 for(const [name,group] of Object.entries(next.entities)){
  const old=previous.entities[name];
  if(!old||!equal(old.keys,group.keys)){entities[name]=group;continue;}
  const column=group.keys.indexOf('id');
  if(column<0){if(!equal(old.rows,group.rows))entities[name]=group;continue;}
  const byId=new Map(old.rows.map(row=>[row[column],row])),ids=new Set(),changes=[],add=[];
  for(const row of group.rows){const id=row[column],before=byId.get(id);ids.add(id);if(!before){add.push(row);continue;}const changed=[id];for(let c=0;c<group.keys.length;c++)if(!equal(before[c],row[c]))changed.push(c,row[c]??null);if(changed.length>1)changes.push(changed);}
  const drop=old.rows.filter(row=>!ids.has(row[column])).map(row=>row[column]);
  const order=group.rows.map(row=>row[column]);
  if(changes.length||add.length||drop.length||!equal(order,old.rows.map(row=>row[column])))entities[name]={changes,add,drop,...(!equal(order,old.rows.map(row=>row[column]))?{order}:{})};
 }
 return {wire:2,base:revision,runId:next.runId,set,remove,entities};
}
export function applySnapshotDelta(previous,delta,revision){
 if(delta?.wire!==2)return checkpointPacket(delta);
 if(!previous||previous.wire!==1||delta.base!==revision||delta.runId!==previous.runId)throw new Error('Snapshot base mismatch');
 const next={...checkpointPacket(previous),entities:{...previous.entities}};
 for(const [key,value] of Object.entries(delta.set||{})){if(!safe(key)||['wire','entities','runId'].includes(key))throw new Error('Invalid snapshot field');next[key]=value;}
 for(const key of delta.remove||[]){if(!safe(key)||['wire','entities','runId'].includes(key))throw new Error('Invalid snapshot field');delete next[key];}
 for(const [name,change] of Object.entries(delta.entities||{})){
  if(!safe(name)||!previous.entities[name])throw new Error('Invalid entity group');
  if(change.keys&&change.rows){next.entities[name]=change;continue;}
  const old=previous.entities[name],column=old.keys.indexOf('id');if(column<0)throw new Error('Missing entity identity');
  const rows=new Map(old.rows.map(row=>[row[column],row]));
  for(const id of change.drop||[])rows.delete(id);
  for(const row of change.add||[]){if(rows.has(row[column]))throw new Error('Duplicate entity');rows.set(row[column],row);}
  for(const [id,...fields] of change.changes||[]){if(!rows.has(id)||fields.length%2)throw new Error('Unknown entity');const row=[...rows.get(id)];for(let i=0;i<fields.length;i+=2){const c=fields[i];if(!Number.isInteger(c)||c<0||c>=old.keys.length||c===column)throw new Error('Invalid entity column');row[c]=fields[i+1];}while(row.length&&row.at(-1)==null)row.pop();rows.set(id,row);}
  const order=change.order||[...rows.keys()];if(order.length!==rows.size||new Set(order).size!==rows.size||order.some(id=>!rows.has(id)))throw new Error('Invalid entity order');
  next.entities[name]={keys:old.keys,rows:order.map(id=>rows.get(id))};
 }
 return next;
}
export function smallerPacket(previous,next,revision){const delta=snapshotDelta(previous,next,revision);return delta.wire===2&&JSON.stringify(delta).length<JSON.stringify(next).length*.85?delta:next;}
export class SnapshotSender{
 constructor(){this.reset();}
 reset(){this.base=null;this.revision=undefined;this.pending=null;}
 encode(packet,revision){this.pending=packet;return this.revision===revision?smallerPacket(this.base,packet,revision):packet;}
 acknowledge(revision){this.base=this.pending;this.revision=revision;this.pending=null;}
}
