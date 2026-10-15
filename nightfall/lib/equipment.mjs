/** Equipment definitions shared by the host simulation and the interface. */
export const WEAPON_LIMIT = 6;
export const WEAPON_ATLAS_COLUMNS = 6, WEAPON_ATLAS_ROWS = 9;
const weapon = (name, sub, detail, color, sprite) => ({name,sub,detail,color,sprite,icon:'blade',kind:'weapon',max:5});
export const UPGRADES = {
 blade: weapon('月刃','扇形飞刃 · 连续穿透','飞刃数量 +1','#d6dec7',16),
 orbit: weapon('星环','环绕飞刃 · 近身守护','环绕飞刃 +1','#bcd8cf',17),
 nova: weapon('霜潮','圆形冰爆 · 减速敌群','范围与伤害提升','#a2ccd8',18),
 storm: weapon('雷鸣','连锁闪电 · 自动跳跃','连锁目标 +1','#c8b8e0',19),
 spear: weapon('贯星枪','直线长枪 · 高速贯穿','穿透与伤害提升','#e6ce91',20),
 ember: weapon('焰瓶','抛物投掷 · 留下燃烧地面','燃烧范围与持续时间提升','#df9b70',21),
 axe: weapon('旋风斧','回旋投掷 · 往返命中','回旋斧数量与伤害提升','#a8c4c0',22),
 bow: weapon('逐风弓','瞄准齐射 · 高速箭雨','齐射箭矢 +1','#c7dba5',23),
 scythe: weapon('暮镰','近身横扫 · 扇形斩击','斩击范围与伤害提升','#bdacd8',24),
 sigil: weapon('咒印','延迟法阵 · 定点爆破','法阵范围与伤害提升','#df9dba',25),
 familiar: weapon('灵鸦','自主环绕 · 俯冲猎敌','灵鸦数量与伤害提升','#a7b5e0',26),
 prism: weapon('棱镜','持续光束 · 追踪切割','光束宽度与伤害提升','#a4dcd7',27),
 dagger: weapon('影匕','连发飞匕 · 逐枚索敌','连发数量与穿透提升','#b9c8e5',34),
 chakram: weapon('镜轮','弹射圆刃 · 跳跃猎杀','弹射次数与圆刃数量提升','#8dd8d0',35),
 mine: weapon('符雷','近敌引爆 · 布设陷阱','爆炸范围与伤害提升','#e1ba7c',36),
 turret: weapon('炎铳塔','驻地炮塔 · 自动射击','炮塔射速与持续时间提升','#d8a57e',37),
 chain: weapon('锁魂链','牵引锁链 · 持续束缚','锁链目标与牵引范围提升','#b4a4df',38),
 saw: weapon('血锯','沿途留锯 · 持续切割','锯轮范围与持续时间提升','#d89091',39),
 wind: weapon('风铃','游走龙卷 · 聚拢敌群','龙卷范围与伤害提升','#afdcc3',40),
 whip: weapon('荆棘鞭','长距鞭击 · 前后扫荡','鞭击长度与双向攻击提升','#c7c68d',41),
 aegis:weapon('镜盾','净化弹幕 · 折光反击','净化数量、范围与频率提升','#a9d8e5',46),
 bell:weapon('震魂铃','扩散音波 · 逐层震击','音波范围、伤害与重奏提升','#dac58e',48),
 gauntlet:weapon('断岳拳','三段重拳 · 末段震地','拳击范围与终结伤害提升','#d5a17e',49),
 hourglass:weapon('星砂漏','局部时停 · 延迟碎裂','时停范围与碎裂伤害提升','#b6badf',50),
 bloodneedle:weapon('血契针','穿刺叠印 · 三印汲血','穿透、齐发与印记伤害提升','#d498a7',51),
 loom:weapon('雷织梭','双桩雷线 · 拦路电击','雷线长度与伤害提升','#a1cedb',52),
 flail:weapon('悬星锤','链锤摆荡 · 八字重击','链锤长度与重击伤害提升','#c6b694',53),
 pelican: weapon('佩丽卡电锯','鹈鹕持锯 · 追敌连斩','电锯伤害与追击速度提升','#e0bc81',57),
 zmd: weapon('zmd科技','双塔供电 · 连线放电','电弧数量、伤害与索敌范围提升','#e6cc64',58),
 spincat:weapon('旋转猫咪','旋转发射 · 穿透猫群','齐发数量、穿透与伤害提升','#b9c8b8',60),
 gugu:weapon('咕咕嘎嘎','企鹅怪叫 · 扩散声波','声波伤害、范围与连响次数提升','#a9cfda',61),
 manbo:weapon('曼波小马','蓄力冲锋 · 贯穿敌阵','冲锋数量、穿透与伤害提升','#d8c3a0',62),
 bananacat:weapon('香蕉猫','抛掷落地 · 果皮滑倒','落地伤害与果皮数量提升','#dec578',63),
 renewal:{name:'复苏草',sub:'缓慢恢复生命',detail:'每秒恢复 0.3 生命',icon:'heart',color:'#9dccac',kind:'item',max:3,unlock:'herbalist',cost:35},
 ward:{name:'护心叶',sub:'减轻承受的伤害',detail:'受到伤害 -8%',icon:'ward',color:'#b7d5a2',kind:'item',max:3,unlock:'herbalist',cost:50},
 wisdom:{name:'星识残页',sub:'积累更多经验',detail:'经验获取 +15%',icon:'wisdom',color:'#c7b5e3',kind:'item',max:3,unlock:'scholar',cost:45},
 preservation:{name:'回响符',sub:'放大生命补给的效果',detail:'生命补给效果 +30%',icon:'heart',color:'#e3bf91',kind:'item',max:3,unlock:'scholar',cost:40},
 power:{name:'锋芒',sub:'让每一击更致命',detail:'伤害 +25%',icon:'power',color:'#dcc6a5',kind:'item',max:3},
 haste:{name:'疾风',sub:'所有武器加速',detail:'攻击速度 +20%',icon:'haste',color:'#d0d9b2',kind:'item',max:3},
 vitality:{name:'余烬',sub:'长夜中的一线生机',detail:'生命上限 +25 · 恢复 40',icon:'heart',color:'#d6a3a6',kind:'item',max:3},
 speed:{name:'轻羽',sub:'穿行于暗影之间',detail:'移动速度 +15%',icon:'speed',color:'#c3bddb',kind:'item',max:3},
 magnet:{name:'引力',sub:'让星屑向你靠近',detail:'拾取范围 +50%',icon:'magnet',color:'#a3d9bb',kind:'item',max:3},
 area:{name:'巨匠纹章',sub:'放大武器与弹幕',detail:'武器大小与范围 +20%',icon:'area',color:'#e4bb7b',kind:'item',max:4,unlock:'smith',cost:40},
 cooling:{name:'冷铸齿轮',sub:'缩短每次攻击的等待',detail:'武器冷却 -8%',icon:'cooling',color:'#99c7df',kind:'item',max:4,unlock:'smith',cost:60},
 linger:{name:'长燃余芯',sub:'让投射物和法阵持续更久',detail:'弹幕与区域持续时间 +20%',icon:'linger',color:'#e9a97f',kind:'item',max:3,unlock:'smith',cost:55},
 volley:{name:'复刻模具',sub:'让投射武器齐发',detail:'投射武器弹幕数量 +1',icon:'volley',color:'#c5b4df',kind:'item',max:2,unlock:'smith',cost:80},
};
export const SMITH_ITEMS=Object.keys(UPGRADES).filter(key=>UPGRADES[key].unlock==='smith');
export const CAMP_ITEMS=Object.keys(UPGRADES).filter(key=>UPGRADES[key].unlock);
export const normalizeEffects=value=>[...new Set((Array.isArray(value)?value:[]).filter(key=>CAMP_ITEMS.includes(key)))];
export const weaponScale=p=>1+(p.ranks?.area||0)*.2;
export const weaponDuration=p=>1+(p.ranks?.linger||0)*.2;
export const weaponCooldown=(p,seconds)=>seconds/Math.max(.1,p.rate)*(1-(p.ranks?.cooling||0)*.08);
export const WEAPONS = Object.keys(UPGRADES).filter(key=>UPGRADES[key].kind==='weapon');
const union = (name, primary, secondary, sub, detail, color, sprite) => ({name,weapon:primary,weapons:[{key:primary,level:3},{key:secondary,level:3}],sub,detail,color,sprite});
export const ARTIFACTS = {
 cataclysm:{name:'星旋猫团',weapon:'spincat',item:'haste',weaponLevel:5,itemLevel:1,sub:'群猫巡星',detail:'环形猫群 · 双程回旋穿透',color:'#bce1cf',sprite:64},
 polarChoir:{name:'极夜合唱',weapon:'gugu',item:'area',weaponLevel:5,itemLevel:1,sub:'极光安魂曲',detail:'五重冰音波 · 短暂冻结小怪',color:'#b1e1f0',sprite:65},
 dreamcavalry:{name:'星轨远征',weapon:'manbo',item:'speed',weaponLevel:5,itemLevel:1,sub:'踏星而行',detail:'多列骑兵冲锋 · 留下灼星轨迹',color:'#dfc5f1',sprite:66},
 goldenbanquet:{name:'黄金滑稽宴',weapon:'bananacat',item:'linger',weaponLevel:5,itemLevel:1,sub:'请君入席',detail:'三连落猫 · 金色果皮连锁引爆',color:'#f0d58b',sprite:67},
 dijiang:union('帝江号轨道炮','zmd','pelican','天穹裁决','锁定蓄能 · 轨道贯击 · 大范围清场','#f2d986',59),
 moonward:{name:'月轮圣盾',weapon:'aegis',item:'ward',weaponLevel:5,itemLevel:1,sub:'澄净之月',detail:'扩大净化范围 · 持续折光反击',color:'#e7d7a6',sprite:47},
 eclipse:{name:'蚀月',weapon:'blade',item:'power',weaponLevel:5,itemLevel:1,sub:'追猎月刃',detail:'追踪 · 穿透 5 次 · 伤害 ×1.8',color:'#e6ce91',sprite:8},
 starfall:{name:'星陨',weapon:'orbit',item:'magnet',weaponLevel:5,itemLevel:1,sub:'双重星轨',detail:'双轨飞刃 · 引力脉冲',color:'#b5dbbb',sprite:9},
 winter:{name:'永冬',weapon:'nova',item:'vitality',weaponLevel:5,itemLevel:1,sub:'永冻之心',detail:'大范围冰冻 · 每次恢复 6 生命',color:'#b4dfe7',sprite:10},
 tempest:{name:'天罚',weapon:'storm',item:'haste',weaponLevel:5,itemLevel:1,sub:'连锁天雷',detail:'连锁 8 次 · 雷击爆发',color:'#d0bee9',sprite:11},
 solar:union('日蚀长枪','spear','blade','贯穿日轮','超长贯穿光枪 · 月刃齐发','#ecd08e',28),
 inferno:union('焚星陨','ember','sigil','燃尽星空','三重陨星 · 爆破后持续燃烧','#eca17a',29),
 reaper:union('终焉之镰','scythe','axe','死亡轮舞','全周斩击 · 回旋巨镰','#c8a8e1',30),
 thunderbow:union('雷羽天弓','bow','storm','雷光箭雨','贯穿箭雨 · 命中连锁雷击','#d8c3ec',31),
 void:union('虚空棱核','prism','nova','坍缩之光','宽幅光束 · 引力黑洞','#a2d9df',32),
 seraph:union('群星鸦后','familiar','orbit','群鸦巡夜','三只猎鸦 · 俯冲散射星羽','#bdc7ed',33),
 mirrordance:union('千镜飞刃','chakram','dagger','碎镜追猎','多重弹射镜轮 · 命中迸射飞匕','#a5e9e1',42),
 bastion:union('战争工坊','turret','mine','移动的防线','三座连射炮塔 · 爆破弹与符雷','#edbc85',43),
 soulmill:union('缚魂绞轮','chain','saw','锁魂收割','多重牵引锁链 · 随身绞杀锯环','#d1a5dd',44),
 typhoon:union('九霄风暴','wind','whip','风雷共鸣','三重追踪龙卷 · 连锁落雷','#b8ead5',45),
 requiem:union('镇魂终钟','bell','hourglass','止息长夜','三重钟波 · 命中短暂凝滞','#e4d5b0',54),
 bloodfist:union('绯誓裂拳','gauntlet','bloodneedle','以血立誓','重拳叠加血印 · 终结震波汲血','#dfa1ac',55),
 stormloom:union('星锤雷狱','flail','loom','雷链织狱','双锤交错 · 锁链沿线电击','#badce5',56),
};
export const RECIPES=Object.entries(ARTIFACTS).map(([key,value])=>({key,...value}));
export const MEND={name:'月露',sub:'一口清泉',detail:'恢复 30 生命',icon:'heart',color:'#b4d8c6',kind:'item',max:1};
export function recipeParts(recipe){return recipe.weapons||[{key:recipe.weapon,level:recipe.weaponLevel},{key:recipe.item,level:recipe.itemLevel}];}
export function ownsWeapon(p,key){return !!p?.ranks?.[key]&&!p?.fused?.[key];}
export function weaponLoadout(p){return WEAPONS.filter(key=>ownsWeapon(p,key));}
export function forgeState(player,key){
 const recipe=ARTIFACTS[key];if(!recipe)return{ready:false,complete:false,weapon:false,item:false,chest:false,parts:[],blocked:false};
 const complete=player?.evolutions?.[recipe.weapon]===key;
 const parts=recipeParts(recipe).map(part=>({...part,met:(player?.ranks?.[part.key]||0)>=part.level}));
 const blocked=parts.some(part=>UPGRADES[part.key].kind==='weapon'&&(player?.fused?.[part.key]||player?.evolutions?.[part.key]))&&!complete;
 const chest=(player?.relics||0)>0,weapon=parts[0].met,item=parts[1].met;
 return{parts,weapon,item,chest,blocked,complete,ready:parts.every(p=>p.met)&&chest&&!complete&&!blocked};
}
export function canUpgrade(p,key){const def=UPGRADES[key];return !!def&&(!def.unlock||p.effects?.includes(key))&&(p.ranks[key]||0)<def.max&&!p.evolutions?.[key]&&!p.fused?.[key]&&(def.kind!=='weapon'||ownsWeapon(p,key)||weaponLoadout(p).length<WEAPON_LIMIT);}
export function rollChoices(p,random=Math.random){
 const keys=Object.keys(UPGRADES).filter(key=>canUpgrade(p,key));
 for(let i=keys.length-1;i>0;i--){const j=Math.min(i,Math.floor(random()*(i+1)));[keys[i],keys[j]]=[keys[j],keys[i]];}
 const fresh=keys.filter(k=>UPGRADES[k].kind==='weapon'&&!p.ranks[k]);
 if(p.level<=3&&fresh.length>=3)return fresh.slice(0,3);
 const owned=keys.filter(k=>UPGRADES[k].kind==='weapon'&&p.ranks[k]);
 const items=keys.filter(k=>UPGRADES[k].kind==='item');
 const chosen=[fresh[0],owned[0],items[0]].filter(Boolean);
 for(const key of keys)if(chosen.length<3&&!chosen.includes(key))chosen.push(key);
 return chosen.length?chosen:['mend'];
}
export function orbitBlades(p,time){
 if(!ownsWeapon(p,'orbit'))return[];
 const evolved=p.evolutions?.orbit==='starfall',rank=p.orbit||p.ranks.orbit,count=evolved?rank*2:rank;
 return Array.from({length:count},(_,k)=>{const outer=evolved&&k>=rank,angle=time*(outer?-2.1:2.6)+(k%rank)*Math.PI*2/rank,radius=(outer?145:94)*weaponScale(p);return{x:p.x+Math.cos(angle)*radius,y:p.y+Math.sin(angle)*radius,angle,sprite:evolved?9:17};});
}
