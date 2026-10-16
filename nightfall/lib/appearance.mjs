import {recolorCloth} from './player-style.mjs';
export const OUTFITS=[
 {id:'wanderer',name:'逐月旅装',detail:'旧披风与月纹轻甲',color:'#779776'},
 {id:'nightcoat',name:'夜行长衣',detail:'黑银长衣 · 双排扣',color:'#7b899f'},
 {id:'knight',name:'曙光轻甲',detail:'象牙护甲 · 金色肩饰',color:'#e4ce92'},
 {id:'ranger',name:'林间猎装',detail:'短披肩 · 皮革束带',color:'#a2b77f'},
 {id:'mage',name:'星术长袍',detail:'紫蓝长袍 · 星纹衣摆',color:'#a99bdd'},
 {id:'crimson',name:'绯羽披风',detail:'绯红长披 · 黑金内衬',color:'#d68693'},
 {id:'frost',name:'霜雪斗篷',detail:'白绒领口 · 冰蓝外衣',color:'#b3dfe6'},
 {id:'sakura',name:'樱落和服',detail:'交叠衣襟 · 樱色腰封',color:'#e3b4ce'},
];
export const HAIRSTYLES=[{id:'hood',name:'兜帽碎发'},{id:'short',name:'利落短发'},{id:'ponytail',name:'高束马尾'},{id:'long',name:'披肩长发'},{id:'braid',name:'侧编长辫'},{id:'bob',name:'齐耳短发'}];
export const HAIR_COLORS=[
 {id:'silver',name:'月银',color:'#bfcfc0',palette:['#bfcfc0','#f0f0d4','#8ea99e','#c2d1bc']},
 {id:'ink',name:'墨黑',color:'#3c465a',palette:['#3c465a','#79879a','#242c3c','#56647b']},
 {id:'chestnut',name:'栗棕',color:'#96654d',palette:['#96654d','#d3a175','#593e37','#b97e57']},
 {id:'gold',name:'麦金',color:'#d8bb72',palette:['#d8bb72','#fff0b0','#987644','#eed18a']},
 {id:'wine',name:'绯红',color:'#a9556c',palette:['#a9556c','#eb9ba4','#63384d','#c97086']},
 {id:'blue',name:'雾蓝',color:'#739ebf',palette:['#739ebf','#b7e2ed','#475c85','#8eb8d0']},
 {id:'lilac',name:'星紫',color:'#a393cb',palette:['#a393cb','#e4ccef','#655a97','#bdacde']},
 {id:'rose',name:'樱粉',color:'#d6a4be',palette:['#d6a4be','#ffe3dd','#996e91','#e7bacd']},
];
export const MASKS=[
 {id:'crescent',name:'月纹面具',detail:'象牙白面 · 金色弦月',color:'#e3d9bc'},
 {id:'fox',name:'绯纹狐面',detail:'尖耳狐面 · 绯红眼纹',color:'#dfaaa1'},
 {id:'oni',name:'赤鬼半面',detail:'朱红护面 · 象牙獠齿',color:'#d87f75'},
 {id:'raven',name:'夜鸦面具',detail:'黑银长喙 · 幽蓝镜片',color:'#91afc5'},
 {id:'visor',name:'星辉眼罩',detail:'深蓝镜框 · 青碧流光',color:'#8ed9d4'},
 {id:'iron',name:'铁卫面甲',detail:'玄铁护甲 · 黄铜格栅',color:'#c3b18a'},
 {id:'none',name:'不戴面具',detail:'露出原本面容',color:'#a7b6ab'},
];
export const DEFAULT_APPEARANCE={outfit:'wanderer',hairstyle:'hood',hairColor:'silver',mask:'crescent'};
export const WARDROBE_CELL=96,WARDROBE_COLUMNS=12,WARDROBE_BODY_ROWS=OUTFITS.length*HAIRSTYLES.length,WARDROBE_ROWS=WARDROBE_BODY_ROWS+(MASKS.length-1)*2;
export const WARDROBE_URL='/art/pixel-wardrobe.png?v=2-masks';
export function normalizeAppearance(value={}){return{
 outfit:OUTFITS.some(o=>o.id===value?.outfit)?value.outfit:DEFAULT_APPEARANCE.outfit,
 hairstyle:HAIRSTYLES.some(h=>h.id===value?.hairstyle)?value.hairstyle:DEFAULT_APPEARANCE.hairstyle,
 hairColor:HAIR_COLORS.some(c=>c.id===value?.hairColor)?value.hairColor:DEFAULT_APPEARANCE.hairColor,
 mask:MASKS.some(m=>m.id===value?.mask)?value.mask:DEFAULT_APPEARANCE.mask,
};}
export function appearanceKey(value){const a=normalizeAppearance(value);return`${a.outfit}/${a.hairstyle}/${a.hairColor}/${a.mask}`;}
export const isOriginalAppearance=value=>appearanceKey(value)===appearanceKey({...DEFAULT_APPEARANCE,mask:'none'});
export function appearanceRow(value){const a=normalizeAppearance(value);return OUTFITS.findIndex(o=>o.id===a.outfit)*HAIRSTYLES.length+HAIRSTYLES.findIndex(h=>h.id===a.hairstyle);}
export function maskRow(value){const a=normalizeAppearance(value);return a.mask==='none'?-1:WARDROBE_BODY_ROWS+MASKS.findIndex(m=>m.id===a.mask)*2+(a.hairstyle==='hood'?0:1);}
export function recolorHair(pixels,color){
 const source=HAIR_COLORS[0].palette,target=(HAIR_COLORS.find(c=>c.id===color)||HAIR_COLORS[0]).palette,hex=v=>parseInt(v.slice(1),16),palette=new Map(source.map((c,i)=>[hex(c),hex(target[i])]));
 for(let i=0;i<pixels.length;i+=4){if(!pixels[i+3])continue;const c=palette.get(pixels[i]*65536+pixels[i+1]*256+pixels[i+2]);if(c!==undefined){pixels[i]=c>>16;pixels[i+1]=c>>8&255;pixels[i+2]=c&255;}}
 return pixels;
}
/** One complete animation strip, used by previews and both game renderers. */
export function composeAppearanceAtlas(image,value,index=0){
 const a=normalizeAppearance(value),canvas=document.createElement('canvas');canvas.width=WARDROBE_CELL*WARDROBE_COLUMNS;canvas.height=WARDROBE_CELL;
 const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,0,appearanceRow(a)*WARDROBE_CELL,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
 const pixels=c.getImageData(0,0,canvas.width,canvas.height);if(a.outfit==='wanderer')recolorCloth(pixels.data,index);recolorHair(pixels.data,a.hairColor);c.putImageData(pixels,0,0);
 const row=maskRow(a);if(row>=0)c.drawImage(image,0,row*WARDROBE_CELL,canvas.width,canvas.height,0,0,canvas.width,canvas.height);return canvas;
}
