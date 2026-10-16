/** World units. Native map art uses three world units per source pixel. */
export const ARENA_W=5400,ARENA_H=3600,ARENA_ART_SCALE=3;
export const ARENA_URL='/art/pixel-frontier.png?v=expanded-2';
export const arenaSpawn=(index=0)=>({x:ARENA_W/2+index*65,y:ARENA_H/2});
/** Old active checkpoints keep their original bounds through host takeover. */
export const arenaBounds=s=>({width:s?.width||ARENA_W,height:s?.height||ARENA_H});
