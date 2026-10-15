export const PLAYER_STYLES=[
 {name:'翡翠',color:'#8ee3b1',cloth:['#284b4b','#3e7565','#779776','#5a967a','#1b333c','#5b7d69','#46695c','#9da882']},
 {name:'苍蓝',color:'#7cc8ff',cloth:['#263e69','#3d659f','#91b6e0','#568bce','#1b2948','#516d9a','#405e92','#9cb9dd']},
 {name:'绯红',color:'#ff929e',cloth:['#652d40','#a4475b','#dc9a9e','#c36172','#3f2137','#985669','#8d4053','#d0a0a1']},
 {name:'琥珀',color:'#ffd178',cloth:['#654925','#a77c38','#e0bd7a','#c9994c','#3e3022','#977745','#926a32','#d5bd86']},
];
export function playerStyle(index=0){return PLAYER_STYLES[((Number(index)||0)%4+4)%4];}
export function playerLabel(player,self=false){return `P${(Number(player.index)||0)+1} ${player.name||'旅人'}${self?' · 你':''}`;}
export function placePlayerLabels(labels){
 const placed=[];
 for(const label of labels){let y=label.y;while(placed.some(p=>Math.abs(p.x-label.x)<(p.width+label.width)/2+5&&Math.abs(p.y-y)<17))y-=18;placed.push({...label,y});}
 return placed;
}
/** Recolor cloth only, preserving the original face, hair, armor and weapon. */
export function recolorCloth(pixels,index){
 const from=PLAYER_STYLES[0].cloth,to=playerStyle(index).cloth;
 const rgb=hex=>parseInt(hex.slice(1),16),palette=new Map(from.map((hex,i)=>[rgb(hex),rgb(to[i])]));
 for(let i=0;i<pixels.length;i+=4){const color=palette.get(pixels[i]*65536+pixels[i+1]*256+pixels[i+2]);if(color!==undefined){pixels[i]=color>>16;pixels[i+1]=color>>8&255;pixels[i+2]=color&255;}}
 return pixels;
}
