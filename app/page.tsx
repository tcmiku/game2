'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  CircleAlert,
  Coins,
  CopyPlus,
  Droplets,
  Expand,
  Flower2,
  Gem,
  Leaf,
  MousePointer2,
  RotateCcw,
  Sparkles,
  Sprout,
  Store,
  Terminal,
  Timer,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Plant = {
  id: number;
  growth: number;
  level: number;
  golden: boolean;
  diamond: boolean;
  storedMultiplier: number;
  fullSince: number | null;
  ripeSince: number | null;
  lastHarvestAt: number;
  minHarvestMs: number;
};

type GameStatus = 'playing' | 'shop' | 'failed' | 'complete';
type HarvestMode = 'manual' | 'auto';
type BossModifier =
  | { kind: 'coin-tax'; percentage: number }
  | { kind: 'plant-lock'; disabledIds: number[] }
  | { kind: 'early-check'; seconds: number };

type RelicId =
  | 'autoHarvester'
  | 'goldenDrop'
  | 'fertilizer'
  | 'infinityBlade'
  | 'midasHand'
  | 'critRing'
  | 'bigDog'
  | 'maodie';

type FusedRelicId =
  | 'goldenHarvester'
  | 'santiago'
  | 'megaCrit'
  | 'catDog';

type RelicLevels = Record<RelicId, number>;
type FusedRelics = Record<FusedRelicId, boolean>;
type HarvestStats = {
  total: number;
  goldenProgress: number;
  fragments: number;
  diamondFragments: number;
  bigDogProgress: number;
  maodieProgress: number;
};

const TOTAL_CHAPTERS = 6;
const STAGES_PER_CHAPTER = 5;
const TOTAL_STAGES = TOTAL_CHAPTERS * STAGES_PER_CHAPTER;
const SHOP_UNLOCK_STAGE = STAGES_PER_CHAPTER * 2;
const MAX_RELIC_SLOTS = 4;
const GOLDEN_FRAGMENT_HARVESTS = 100;
const FUSION_UNLOCK_STAGE = 20;
const DIAMOND_FRAGMENT_REQUIREMENT = 4;
const DIFFICULTY_RAMP_START_STAGE = 10;
const FINAL_STAGE_GOAL = 80_000;

function getStageGoal(stage: number) {
  const baseGoal = (targetStage: number) =>
    Math.round(8 + 5.5 * (targetStage - 1) ** 2);

  if (stage < DIFFICULTY_RAMP_START_STAGE) return baseGoal(stage);
  if (stage === TOTAL_STAGES) return FINAL_STAGE_GOAL;

  const anchorStage = DIFFICULTY_RAMP_START_STAGE - 1;
  const anchorGoal = baseGoal(anchorStage);
  const rampProgress =
    (stage - anchorStage) / (TOTAL_STAGES - anchorStage);

  return Math.round(
    anchorGoal * (FINAL_STAGE_GOAL / anchorGoal) ** rampProgress,
  );
}

const STAGES = Array.from({ length: TOTAL_STAGES }, (_, index) => {
  const stage = index + 1;
  const chapter = Math.ceil(stage / STAGES_PER_CHAPTER);
  const isBoss = stage % STAGES_PER_CHAPTER === 0;
  return {
    stage,
    chapter,
    goal: getStageGoal(stage),
    seconds: isBoss ? 30 : stage <= SHOP_UNLOCK_STAGE ? 24 : 22,
    name: isBoss ? `第 ${chapter} 章守关者` : stage <= SHOP_UNLOCK_STAGE ? '点击培育' : '遗物经营',
    boss: isBoss,
  };
});

const RELICS: Array<{
  id: RelicId;
  name: string;
  branch: string;
  description: string;
  baseCost: number;
}> = [
  {
    id: 'autoHarvester',
    name: '自动收割机',
    branch: '黄金植物',
    description: '自动收获成熟植物，自动金币增加40%，并提高全场植物生长速率。',
    baseCost: 5,
  },
  {
    id: 'goldenDrop',
    name: '黄金水滴',
    branch: '黄金植物',
    description: `提高植物生长速率；每收获 ${GOLDEN_FRAGMENT_HARVESTS} 次获得碎片，4 枚生成黄金植物，并使其最小收获间隔缩短 0.2 秒。`,
    baseCost: 8,
  },
  {
    id: 'fertilizer',
    name: '金坷垃',
    branch: '倍倍',
    description: '加快全场生长；成熟植物放置越久，金币蓄积倍率越高。',
    baseCost: 6,
  },
  {
    id: 'infinityBlade',
    name: '无尽之刃',
    branch: '暴击',
    description: '收获时有概率暴击，提高暴击概率和倍率。',
    baseCost: 7,
  },
  {
    id: 'midasHand',
    name: '点金手',
    branch: '倍倍',
    description: '手动收获的金币至少翻倍，升级继续提高倍率。',
    baseCost: 8,
  },
  {
    id: 'critRing',
    name: '暴击戒指',
    branch: '暴击',
    description: '每级增加10%暴击率；成功暴击后可以继续判定，但下一次暴击率减半。',
    baseCost: 7,
  },
  {
    id: 'bigDog',
    name: '大狗',
    branch: '成长',
    description: '累计收获一定次数后，随机升级一株植物。',
    baseCost: 6,
  },
  {
    id: 'maodie',
    name: '耄耋',
    branch: '间隔',
    description: '累计收获后随机扰乱一株植物，但永久缩短其收获间隔。',
    baseCost: 5,
  },
];

const FUSIONS: Array<{
  id: FusedRelicId;
  name: string;
  materials: [RelicId, RelicId];
  description: string;
}> = [
  {
    id: 'goldenHarvester',
    name: '黄金收割机',
    materials: ['autoHarvester', 'goldenDrop'],
    description: '保留两件遗物效果；黄金碎片满4枚且没有普通植物可转化时获得1枚钻石碎片，4枚可升级一株满载后结算金币的钻石植物。',
  },
  {
    id: 'santiago',
    name: '圣地亚哥',
    materials: ['fertilizer', 'midasHand'],
    description: '跳过生长阶段；蓄积新增16倍阶段，达到 ×16 后延迟1秒自动收获。',
  },
  {
    id: 'megaCrit',
    name: '大爆特爆',
    materials: ['infinityBlade', 'critRing'],
    description: '取消暴击次数限制；每次暴击后，下一次暴击概率变为当前的80%。',
  },
  {
    id: 'catDog',
    name: '猫狗大战',
    materials: ['bigDog', 'maodie'],
    description: '收获需求减半且一次影响3株植物；最小收获间隔可降至0.1秒。',
  },
];

const EMPTY_RELIC_LEVELS: RelicLevels = {
  autoHarvester: 0,
  goldenDrop: 0,
  fertilizer: 0,
  infinityBlade: 0,
  midasHand: 0,
  critRing: 0,
  bigDog: 0,
  maodie: 0,
};

const EMPTY_FUSED_RELICS: FusedRelics = {
  goldenHarvester: false,
  santiago: false,
  megaCrit: false,
  catDog: false,
};

const EMPTY_HARVEST_STATS: HarvestStats = {
  total: 0,
  goldenProgress: 0,
  fragments: 0,
  diamondFragments: 0,
  bigDogProgress: 0,
  maodieProgress: 0,
};

const MAX_PLANTS = 18;
const MIN_HARVEST_MS = 300;
const FUSED_MIN_HARVEST_MS = 100;
const SPECIAL_PLANT_INTERVAL_REDUCTION_MS = 200;
const SANTIAGO_HARVEST_DELAY_MS = 1000;

function shortenHarvestInterval(minHarvestMs: number, hasCatDog: boolean) {
  return Math.max(
    hasCatDog ? FUSED_MIN_HARVEST_MS : MIN_HARVEST_MS,
    minHarvestMs - SPECIAL_PLANT_INTERVAL_REDUCTION_MS,
  );
}

function makeInitialPlants(): Plant[] {
  return [
    {
      id: 1,
      growth: 45,
      level: 1,
      golden: false,
      diamond: false,
      storedMultiplier: 1,
      fullSince: null,
      ripeSince: null,
      lastHarvestAt: 0,
      minHarvestMs: 1000,
    },
  ];
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `00:${safe.toString().padStart(2, '0')}`;
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function randomUniqueIndices(length: number, count: number) {
  return Array.from({ length }, (_, index) => index)
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(length, count));
}

function rollBossModifier(plants: Plant[]): BossModifier {
  const roll = randomInteger(0, 2);
  if (roll === 0) {
    return { kind: 'coin-tax', percentage: randomInteger(10, 30) };
  }
  if (roll === 1) {
    const shuffledIds = plants
      .map((plant) => plant.id)
      .sort(() => Math.random() - 0.5);
    return {
      kind: 'plant-lock',
      disabledIds: shuffledIds.slice(
        0,
        Math.min(plants.length, randomInteger(1, 4)),
      ),
    };
  }
  return { kind: 'early-check', seconds: randomInteger(5, 10) };
}

function describeBossModifier(modifier: BossModifier | null) {
  if (!modifier) return { title: '正在抽取', description: '词条即将生效' };
  if (modifier.kind === 'coin-tax') {
    return {
      title: '减产税',
      description: `本关金币收获量减少 ${modifier.percentage}%`,
    };
  }
  if (modifier.kind === 'plant-lock') {
    return {
      title: '温室封锁',
      description: `随机禁用 ${modifier.disabledIds.length} 株植物，本关无法生长或收获`,
    };
  }
  return {
    title: '催缴令',
    description: `本关金币结算提前 ${modifier.seconds} 秒`,
  };
}

function relicCost(
  id: RelicId,
  level: number,
  purchaseCount: number,
  upgradeCount: number,
) {
  if (level === 0 && purchaseCount === 0) return 0;
  const relic = RELICS.find((item) => item.id === id)!;
  if (level === 0) {
    return Math.round(relic.baseCost * 8 * 1.7 ** purchaseCount);
  }
  return Math.round(
    relic.baseCost * 10 * 1.85 ** level * 1.18 ** upgradeCount,
  );
}

function fertilizerCap(level: number) {
  if (level >= 6) return 8;
  if (level >= 3) return 4;
  return 2;
}

function storageCapacity(fertilizerLevel: number, hasSantiago: boolean) {
  if (fertilizerLevel <= 0) return 1;
  return hasSantiago ? 16 : fertilizerCap(fertilizerLevel);
}

function occupiedRelicSlots(levels: RelicLevels, fused: FusedRelics) {
  const ownedCount = Object.values(levels).filter((level) => level > 0).length;
  const fusedCount = Object.values(fused).filter(Boolean).length;
  return ownedCount - fusedCount;
}

function drawRelicOffers(levels: RelicLevels, fused: FusedRelics) {
  const ownedCount = occupiedRelicSlots(levels, fused);
  const available = RELICS.filter((relic) =>
    ownedCount >= MAX_RELIC_SLOTS
      ? levels[relic.id] > 0 && levels[relic.id] < 6
      : levels[relic.id] < 6,
  );
  const shuffledAvailable = [...available].sort(() => Math.random() - 0.5);
  const filler = RELICS.filter((relic) => !available.includes(relic)).sort(
    () => Math.random() - 0.5,
  );
  return [...shuffledAvailable, ...filler]
    .slice(0, 3)
    .map((relic) => relic.id);
}

function critRingRepeatCount(level: number) {
  if (level >= 6) return 2;
  return level > 0 ? 1 : 0;
}

function relicEffect(id: RelicId, level: number) {
  const shownLevel = Math.max(1, level);
  switch (id) {
    case 'autoHarvester':
      return `自动收获金币 +40%；植物生长速率 +${40 + (shownLevel - 1) * 20}%`;
    case 'goldenDrop':
      return `植物金币 +${shownLevel * 20}%，植物生长速率 +${20 + (shownLevel - 1) * 6}%`;
    case 'fertilizer':
      return `生长速度 +${50 + (shownLevel - 1) * 15}%；每 ${Math.max(2.5, 5.5 - shownLevel * 0.5).toFixed(1)} 秒蓄积翻倍，最高 ×${fertilizerCap(shownLevel)}`;
    case 'infinityBlade':
      return `暴击率 +${8 + shownLevel * 5}%，暴击倍率 ×${(2.25 + shownLevel * 0.35).toFixed(2)}`;
    case 'midasHand':
      return `手动收获倍率 ×${(2.5 + (shownLevel - 1) * 0.5).toFixed(2)}`;
    case 'critRing':
      return `暴击率 +${shownLevel * 10}%，可重复暴击 ${critRingRepeatCount(shownLevel)} 次；每次暴击后下次概率减半`;
    case 'bigDog':
      return `每 ${Math.max(24, 72 - shownLevel * 8)} 次收获，随机植物等级 +${Math.ceil(shownLevel / 2)}`;
    case 'maodie':
      return `每 ${Math.max(24, 72 - shownLevel * 8)} 次收获，随机植物进度 -${Math.max(5, 18 - shownLevel * 2)}%，间隔 -${120 + shownLevel * 40}ms`;
  }
}

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>(makeInitialPlants);
  const plantsRef = useRef(plants);
  const [coins, setCoins] = useState(0);
  const [stage, setStage] = useState(1);
  const [timeLeft, setTimeLeft] = useState(STAGES[0].seconds);
  const [clickLevel, setClickLevel] = useState(0);
  const [areaLevel, setAreaLevel] = useState(0);
  const [cloneCount, setCloneCount] = useState(0);
  const [selectedId, setSelectedId] = useState(1);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [bossModifier, setBossModifier] = useState<BossModifier | null>(null);
  const [relicLevels, setRelicLevels] = useState<RelicLevels>({
    ...EMPTY_RELIC_LEVELS,
  });
  const [fusedRelics, setFusedRelics] = useState<FusedRelics>({
    ...EMPTY_FUSED_RELICS,
  });
  const [harvestStats, setHarvestStats] = useState<HarvestStats>({
    ...EMPTY_HARVEST_STATS,
  });
  const harvestStatsRef = useRef(harvestStats);
  const [shopOffers, setShopOffers] = useState<RelicId[]>([]);
  const [shopRefreshes, setShopRefreshes] = useState(0);
  const [shopAdvancesStage, setShopAdvancesStage] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleCoins, setConsoleCoins] = useState('0');
  const [consoleStage, setConsoleStage] = useState('1');
  const [notice, setNotice] = useState('点击植物开始照料');
  const [coinBurst, setCoinBurst] = useState({ amount: 0, serial: 0 });
  const [harvestEffect, setHarvestEffect] = useState({
    ids: [] as number[],
    serial: 0,
  });
  const nextId = useRef(2);
  const coinBurstTimer = useRef<number | null>(null);
  const harvestEffectTimer = useRef<number | null>(null);

  const safeStage = Math.min(Math.max(stage, 1), TOTAL_STAGES);
  const stageData = STAGES[safeStage - 1];
  const bigChapter = Math.ceil(safeStage / STAGES_PER_CHAPTER);
  const stageInChapter = ((safeStage - 1) % STAGES_PER_CHAPTER) + 1;
  const isBossStage = stageData.boss;
  const activeBossModifier = isBossStage ? bossModifier : null;
  const clickPower = 18 + clickLevel * 7;
  const naturalRate = 6.25;
  const clickCost = Math.round(8 * 1.65 ** clickLevel);
  const cloneCost = Math.round(7 * 1.55 ** cloneCount);
  const areaCost = areaLevel === 0 ? 24 : 55;
  const goalPercent = Math.min(100, (coins / stageData.goal) * 100);
  const gap = Math.max(0, stageData.goal - coins);
  const selectedPlant =
    plants.find((plant) => plant.id === selectedId) ?? plants[0];
  const plantLevelCost = selectedPlant
    ? Math.round(4 * 1.85 ** (selectedPlant.level - 1))
    : 4;
  const bossModifierCopy = describeBossModifier(activeBossModifier);
  const relicPurchaseCount = Object.values(relicLevels).filter(
    (level) => level > 0,
  ).length;
  const fusedRelicCount = Object.values(fusedRelics).filter(Boolean).length;
  const relicSlotCount = relicPurchaseCount - fusedRelicCount;
  const relicUpgradeCount = Object.values(relicLevels).reduce(
    (total, level) => total + Math.max(0, level - 1),
    0,
  );
  const refreshCost = 25 + bigChapter * 10 + shopRefreshes * 15;
  const coinBurstTier =
    coinBurst.amount >= 12
      ? 'large'
      : coinBurst.amount >= 4
        ? 'medium'
        : 'small';
  const equippedRelics = useMemo(() => {
    const shownFusions = new Set<FusedRelicId>();
    const slots: Array<{
      key: string;
      name: string;
      level: string;
      description: string;
      effect: string;
      fused: boolean;
    }> = [];

    for (const relic of RELICS) {
      if (relicLevels[relic.id] <= 0) continue;
      const fusion = FUSIONS.find(
        (item) =>
          fusedRelics[item.id] && item.materials.includes(relic.id),
      );
      if (fusion) {
        if (shownFusions.has(fusion.id)) continue;
        shownFusions.add(fusion.id);
        slots.push({
          key: fusion.id,
          name: fusion.name,
          level: '高级遗物',
          description: fusion.description,
          effect: `融合素材：${fusion.materials
            .map((id) => {
              const material = RELICS.find((item) => item.id === id)!;
              return `${material.name} Lv.${relicLevels[id]}`;
            })
            .join(' + ')}`,
          fused: true,
        });
        continue;
      }
      slots.push({
        key: relic.id,
        name: relic.name,
        level: `Lv.${relicLevels[relic.id]}`,
        description: relic.description,
        effect: relicEffect(relic.id, relicLevels[relic.id]),
        fused: false,
      });
    }
    return slots.slice(0, MAX_RELIC_SLOTS);
  }, [fusedRelics, relicLevels]);

  const rowWidth = 3;
  const positions = useMemo(
    () =>
      plants.map((_, index) => ({
        row: Math.floor(index / rowWidth),
        col: index % rowWidth,
      })),
    [plants],
  );

  function commitPlants(next: Plant[]) {
    plantsRef.current = next;
    setPlants(next);
  }

  function commitHarvestStats(next: HarvestStats) {
    harvestStatsRef.current = next;
    setHarvestStats(next);
  }

  function isPlantDisabled(plantId: number) {
    return (
      activeBossModifier?.kind === 'plant-lock' &&
      activeBossModifier.disabledIds.includes(plantId)
    );
  }

  function showCoinGain(amount: number) {
    if (coinBurstTimer.current) window.clearTimeout(coinBurstTimer.current);
    setCoinBurst((current) => ({
      amount: current.amount + amount,
      serial: current.serial + 1,
    }));
    coinBurstTimer.current = window.setTimeout(() => {
      setCoinBurst((current) => ({ ...current, amount: 0 }));
    }, 700);
  }

  function showHarvestEffect(ids: number[]) {
    if (harvestEffectTimer.current) {
      window.clearTimeout(harvestEffectTimer.current);
    }
    setHarvestEffect((current) => ({ ids, serial: current.serial + 1 }));
    harvestEffectTimer.current = window.setTimeout(() => {
      setHarvestEffect((current) => ({ ...current, ids: [] }));
    }, 850);
  }

  function collectPlantIds(
    plantIds: number[],
    mode: HarvestMode,
    sourcePlants = plantsRef.current,
  ) {
    const now = Date.now();
    const currentStorageCapacity = storageCapacity(
      relicLevels.fertilizer,
      fusedRelics.santiago,
    );
    const idSet = new Set(plantIds);
    let harvested = 0;
    const harvestedIds: number[] = [];
    let grossIncome = 0;
    let criticalHits = 0;

    let nextPlants = sourcePlants.map((plant) => {
      if (
        !idSet.has(plant.id) ||
        isPlantDisabled(plant.id) ||
        plant.growth < 100 ||
        (plant.diamond &&
          plant.storedMultiplier < currentStorageCapacity) ||
        now - plant.lastHarvestAt < plant.minHarvestMs
      ) {
        return plant;
      }

      harvested += 1;
      harvestedIds.push(plant.id);
      let plantIncome =
        plant.level *
        (plant.diamond ? 4 : plant.golden ? 2 : 1) *
        plant.storedMultiplier *
        (1 + relicLevels.goldenDrop * 0.2);

      if (mode === 'manual' && relicLevels.midasHand > 0) {
        plantIncome *= 2.5 + (relicLevels.midasHand - 1) * 0.5;
      }

      if (mode === 'auto' && relicLevels.autoHarvester > 0) {
        plantIncome *= 1.4;
      }

      const critChance = Math.min(
        0.85,
        (relicLevels.infinityBlade > 0
          ? 0.08 + relicLevels.infinityBlade * 0.05
          : 0) +
          relicLevels.critRing * 0.1,
      );
      const critMultiplier =
        relicLevels.infinityBlade > 0
          ? 2.25 + relicLevels.infinityBlade * 0.35
          : 2;
      if (fusedRelics.megaCrit) {
        let rollingChance = critChance;
        for (let attempt = 0; attempt < 100; attempt += 1) {
          if (Math.random() >= rollingChance) break;
          plantIncome *= critMultiplier;
          criticalHits += 1;
          rollingChance *= 0.8;
        }
      } else {
        const maxCrits = 1 + critRingRepeatCount(relicLevels.critRing);
        let rollingChance = critChance;
        for (let attempt = 0; attempt < maxCrits; attempt += 1) {
          if (Math.random() >= rollingChance) break;
          plantIncome *= critMultiplier;
          criticalHits += 1;
          rollingChance *= 0.5;
        }
      }

      grossIncome += Math.max(1, Math.round(plantIncome));
      return {
        ...plant,
        growth: plant.golden || fusedRelics.santiago ? 100 : 0,
        storedMultiplier: 1,
        fullSince: null,
        ripeSince: plant.golden || fusedRelics.santiago ? now : null,
        lastHarvestAt: now,
      };
    });

    if (harvested === 0) return 0;

    const nextStats = { ...harvestStatsRef.current };
    nextStats.total += harvested;
    const events: string[] = [];
    let directBonus = 0;

    if (relicLevels.goldenDrop > 0) {
      nextStats.goldenProgress += harvested;
      while (nextStats.goldenProgress >= GOLDEN_FRAGMENT_HARVESTS) {
        nextStats.goldenProgress -= GOLDEN_FRAGMENT_HARVESTS;
        nextStats.fragments += 1;
      }
      while (nextStats.fragments >= 4) {
        const regularPlants = nextPlants.filter((plant) => !plant.golden);
        if (regularPlants.length > 0) {
          nextStats.fragments -= 4;
          const chosen = regularPlants[randomIndex(regularPlants.length)];
          nextPlants = nextPlants.map((plant) =>
            plant.id === chosen.id
              ? {
                  ...plant,
                  golden: true,
                  diamond: false,
                  growth: 100,
                  ripeSince: now,
                  minHarvestMs: shortenHarvestInterval(
                    plant.minHarvestMs,
                    fusedRelics.catDog,
                  ),
                }
              : plant,
          );
          events.push('生成黄金植物 · 间隔 -0.2s');
        } else if (fusedRelics.goldenHarvester) {
          nextStats.fragments -= 4;
          nextStats.diamondFragments += 1;
          events.push('黄金植物已满 · 钻石碎片 +1');
        } else {
          nextStats.fragments -= 4;
          directBonus += 250 * relicLevels.goldenDrop;
          events.push(`黄金碎片兑换 +${250 * relicLevels.goldenDrop}`);
        }
      }
    }

    if (fusedRelics.goldenHarvester) {
      while (nextStats.diamondFragments >= DIAMOND_FRAGMENT_REQUIREMENT) {
        const goldenPlants = nextPlants.filter(
          (plant) => plant.golden && !plant.diamond,
        );
        if (goldenPlants.length === 0) break;
        nextStats.diamondFragments -= DIAMOND_FRAGMENT_REQUIREMENT;
        const chosen = goldenPlants[randomIndex(goldenPlants.length)];
        nextPlants = nextPlants.map((plant) =>
          plant.id === chosen.id
            ? {
                ...plant,
                diamond: true,
                minHarvestMs: shortenHarvestInterval(
                  plant.minHarvestMs,
                  fusedRelics.catDog,
                ),
              }
            : plant,
        );
        events.push('黄金植物升级为钻石植物 · 间隔 -0.2s');
      }
    }

    if (relicLevels.bigDog > 0 && nextPlants.length > 0) {
      const baseThreshold = Math.max(24, 72 - relicLevels.bigDog * 8);
      const threshold = fusedRelics.catDog
        ? Math.max(8, Math.floor(baseThreshold / 2))
        : baseThreshold;
      nextStats.bigDogProgress += harvested;
      while (nextStats.bigDogProgress >= threshold) {
        nextStats.bigDogProgress -= threshold;
        const chosenIndices = randomUniqueIndices(
          nextPlants.length,
          fusedRelics.catDog ? 3 : 1,
        );
        nextPlants = nextPlants.map((plant, index) =>
          chosenIndices.includes(index)
            ? { ...plant, level: plant.level + Math.ceil(relicLevels.bigDog / 2) }
            : plant,
        );
        events.push(`大狗升级 ${chosenIndices.length} 株植物`);
      }
    }

    if (relicLevels.maodie > 0 && nextPlants.length > 0) {
      const baseThreshold = Math.max(24, 72 - relicLevels.maodie * 8);
      const threshold = fusedRelics.catDog
        ? Math.max(8, Math.floor(baseThreshold / 2))
        : baseThreshold;
      nextStats.maodieProgress += harvested;
      while (nextStats.maodieProgress >= threshold) {
        nextStats.maodieProgress -= threshold;
        const chosenIndices = randomUniqueIndices(
          nextPlants.length,
          fusedRelics.catDog ? 3 : 1,
        );
        nextPlants = nextPlants.map((plant, index) =>
          chosenIndices.includes(index)
            ? {
                ...plant,
                growth: plant.golden
                  ? 100
                  : Math.max(
                      0,
                      plant.growth - Math.max(5, 18 - relicLevels.maodie * 2),
                    ),
                minHarvestMs: Math.max(
                  fusedRelics.catDog
                    ? FUSED_MIN_HARVEST_MS
                    : MIN_HARVEST_MS,
                  plant.minHarvestMs - (120 + relicLevels.maodie * 40),
                ),
              }
            : plant,
        );
        events.push(`耄耋影响 ${chosenIndices.length} 株植物`);
      }
    }

    const taxedIncome =
      activeBossModifier?.kind === 'coin-tax'
        ? Math.max(
            1,
            Math.round(
              grossIncome * (1 - activeBossModifier.percentage / 100),
            ),
          )
        : grossIncome;
    const finalIncome = taxedIncome + directBonus;

    commitPlants(nextPlants);
    commitHarvestStats(nextStats);
    setCoins((value) => value + finalIncome);
    showCoinGain(finalIncome);
    showHarvestEffect(harvestedIds);

    const feedback = [
      `${mode === 'auto' ? '自动' : ''}收获 ${harvested} 株，金币 +${finalIncome}`,
      criticalHits > 0 ? `暴击 ${criticalHits} 次` : '',
      activeBossModifier?.kind === 'coin-tax'
        ? `减产前 ${grossIncome}`
        : '',
      ...events,
    ]
      .filter(Boolean)
      .join(' · ');
    setNotice(feedback);
    return harvested;
  }

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => {
      const now = Date.now();
      setTimeLeft((value) => Math.max(0, value - 0.25));
      const harvesterGrowthMultiplier =
        relicLevels.autoHarvester > 0
          ? 1.4 + (relicLevels.autoHarvester - 1) * 0.2
          : 1;
      const goldenGrowthMultiplier =
        relicLevels.goldenDrop > 0
          ? 1.2 + (relicLevels.goldenDrop - 1) * 0.06
          : 1;
      const fertilizerGrowthMultiplier =
        relicLevels.fertilizer > 0
          ? 1.5 + (relicLevels.fertilizer - 1) * 0.15
          : 1;
      const fertilizerWait = Math.max(
        2500,
        5500 - relicLevels.fertilizer * 500,
      );
      const currentStorageCapacity = storageCapacity(
        relicLevels.fertilizer,
        fusedRelics.santiago,
      );

      const grownPlants = plantsRef.current.map((plant) => {
        if (isPlantDisabled(plant.id)) return plant;
        const nextGrowth = plant.golden || fusedRelics.santiago
          ? 100
          : Math.min(
              100,
              plant.growth +
                naturalRate *
                  harvesterGrowthMultiplier *
                  goldenGrowthMultiplier *
                  fertilizerGrowthMultiplier *
                  0.25,
            );
        const reachedMaturity = plant.growth < 100 && nextGrowth >= 100;
        const ripeSince = reachedMaturity
          ? now
          : nextGrowth >= 100
            ? (plant.ripeSince ?? now)
            : null;
        const storageSteps =
          relicLevels.fertilizer > 0 && nextGrowth >= 100 && ripeSince !== null
            ? Math.floor((now - ripeSince) / fertilizerWait)
            : 0;
        const storedMultiplier =
          storageSteps > 0
            ? Math.min(
                currentStorageCapacity,
                2 ** storageSteps,
              )
            : plant.storedMultiplier;
        const fullSince =
          fusedRelics.santiago && storedMultiplier >= 16
            ? (plant.fullSince ?? now)
            : null;
        return {
          ...plant,
          growth: nextGrowth,
          ripeSince,
          storedMultiplier,
          fullSince,
        };
      });

      plantsRef.current = grownPlants;
      if (relicLevels.autoHarvester > 0 || fusedRelics.santiago) {
        const readyIds = grownPlants
          .filter((plant) => {
            if (
              isPlantDisabled(plant.id) ||
              plant.growth < 100 ||
              now - plant.lastHarvestAt < plant.minHarvestMs
            ) {
              return false;
            }
            if (fusedRelics.santiago) {
              return (
                plant.storedMultiplier >= 16 &&
                plant.fullSince !== null &&
                now - plant.fullSince >= SANTIAGO_HARVEST_DELAY_MS
              );
            }
            if (plant.diamond) {
              return plant.storedMultiplier >= currentStorageCapacity;
            }
            return relicLevels.autoHarvester > 0;
          })
          .map((plant) => plant.id);
        if (readyIds.length > 0) {
          collectPlantIds(readyIds, 'auto', grownPlants);
          return;
        }
      }
      commitPlants(grownPlants);
    }, 250);
    return () => window.clearInterval(timer);
  }, [activeBossModifier, fusedRelics, naturalRate, relicLevels, status]);

  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    if (coins < stageData.goal) {
      setStatus('failed');
    } else {
      if (isBossStage) setBossModifier(null);
      const isChapterEnd = safeStage % STAGES_PER_CHAPTER === 0;
      if (isChapterEnd) {
        setShopOffers(drawRelicOffers(relicLevels, fusedRelics));
        setShopRefreshes(0);
        setShopAdvancesStage(true);
        setStatus('shop');
      } else {
        continueStage();
      }
    }
  }, [coins, fusedRelics, isBossStage, relicLevels, safeStage, stageData.goal, status, timeLeft]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(
    () => () => {
      if (coinBurstTimer.current) window.clearTimeout(coinBurstTimer.current);
      if (harvestEffectTimer.current) {
        window.clearTimeout(harvestEffectTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    function handleUpgradeHotkey(event: KeyboardEvent) {
      if (
        event.isComposing ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      if (
        document.querySelector(
          '.console-panel.is-open, [aria-modal="true"]',
        )
      ) {
        return;
      }

      if (event.code === 'Space' || event.key === ' ') {
        const selectedButton = document.querySelector<HTMLButtonElement>(
          '.plant-card.is-selected',
        );
        if (!selectedButton || selectedButton.disabled) return;
        event.preventDefault();
        selectedButton.click();
        return;
      }

      if (event.repeat) return;
      const hotkey = event.key.toLowerCase();
      if (!['q', 'w', 'e', 'r'].includes(hotkey)) return;

      const button = document.querySelector<HTMLButtonElement>(
        `[data-upgrade-hotkey="${hotkey}"]`,
      );
      if (!button || button.disabled) return;

      event.preventDefault();
      button.click();
    }

    window.addEventListener('keydown', handleUpgradeHotkey);
    return () => window.removeEventListener('keydown', handleUpgradeHotkey);
  }, []);

  function tendPlant(index: number) {
    if (status !== 'playing') return;
    const sourcePlants = plantsRef.current;
    const target = sourcePlants[index];
    const origin = positions[index];
    if (!target || !origin) return;
    if (isPlantDisabled(target.id)) {
      setNotice('这株植物被 Boss 词条禁用，本关无法操作');
      return;
    }
    setSelectedId(target.id);

    const readyIds: number[] = [];
    const nextPlants = sourcePlants.map((plant, plantIndex) => {
      if (isPlantDisabled(plant.id)) return plant;
      const position = positions[plantIndex];
      if (!position) return plant;
      const distance =
        Math.abs(position.row - origin.row) +
        Math.abs(position.col - origin.col);
      const affected =
        plantIndex === index || (areaLevel > 0 && distance <= areaLevel);
      if (!affected) return plant;
      if (plant.growth >= 100) {
        readyIds.push(plant.id);
        return plant;
      }
      const growthPower =
        plantIndex === index
          ? clickPower
          : clickPower * (areaLevel === 1 ? 0.48 : 0.34);
      const nextGrowth = Math.min(100, plant.growth + growthPower);
      return {
        ...plant,
        growth: nextGrowth,
        ripeSince:
          plant.growth < 100 && nextGrowth >= 100
            ? Date.now()
            : plant.ripeSince,
      };
    });

    commitPlants(nextPlants);
    const collected = collectPlantIds(readyIds, 'manual', nextPlants);
    if (readyIds.length > 0 && collected === 0) {
      const currentStorageCapacity = storageCapacity(
        relicLevels.fertilizer,
        fusedRelics.santiago,
      );
      if (
        target.diamond &&
        target.storedMultiplier < currentStorageCapacity
      ) {
        setNotice(
          `钻石植物尚未满载：×${target.storedMultiplier}/×${currentStorageCapacity}`,
        );
        return;
      }
      const remaining = Math.max(
        0,
        target.minHarvestMs - (Date.now() - target.lastHarvestAt),
      );
      setNotice(`收获间隔尚未结束，还需 ${(remaining / 1000).toFixed(1)} 秒`);
    }
  }

  function upgradeSelectedPlant() {
    if (!selectedPlant || coins < plantLevelCost) return;
    setCoins((value) => value - plantLevelCost);
    const next = plantsRef.current.map((plant) =>
      plant.id === selectedPlant.id
        ? { ...plant, level: plant.level + 1 }
        : plant,
    );
    commitPlants(next);
    setNotice(
      `第 ${next.findIndex((plant) => plant.id === selectedPlant.id) + 1} 株升至 Lv.${selectedPlant.level + 1}`,
    );
  }

  function buyClickPower() {
    if (coins < clickCost) return;
    setCoins((value) => value - clickCost);
    setClickLevel((value) => value + 1);
    setNotice(`强效浇灌升级：单次催生 +${18 + (clickLevel + 1) * 7}%`);
  }

  function cloneSelectedPlant() {
    if (!selectedPlant || coins < cloneCost || plants.length >= MAX_PLANTS)
      return;
    setCoins((value) => value - cloneCost);
    const newPlant: Plant = {
      ...selectedPlant,
      id: nextId.current++,
      golden: false,
      diamond: false,
      storedMultiplier: 1,
      fullSince: null,
      lastHarvestAt: 0,
    };
    const next = [...plantsRef.current, newPlant];
    commitPlants(next);
    setSelectedId(newPlant.id);
    setCloneCount((value) => value + 1);
    setNotice('扦插成功：复制了一株普通植物');
  }

  function buyArea() {
    if (coins < areaCost || areaLevel >= 2) return;
    setCoins((value) => value - areaCost);
    setAreaLevel((value) => value + 1);
    setNotice(`扩散喷头升级：点击范围扩大到 ${areaLevel + 1} 格`);
  }

  function buyRelic(id: RelicId) {
    const level = relicLevels[id];
    if (level === 0 && relicSlotCount >= MAX_RELIC_SLOTS) {
      setNotice('四个遗物槽位已满，只能继续升级已拥有的遗物');
      return;
    }
    const cost = relicCost(
      id,
      level,
      relicPurchaseCount,
      relicUpgradeCount,
    );
    if (level >= 6 || coins < cost) return;
    setCoins((value) => value - cost);
    setRelicLevels((current) => ({ ...current, [id]: level + 1 }));
    const relic = RELICS.find((item) => item.id === id)!;
    setNotice(
      level === 0
        ? `获得遗物：${relic.name}${cost === 0 ? '（首件免费）' : ''}`
        : `${relic.name} 升至 Lv.${level + 1}`,
    );
  }

  function fuseRelic(id: FusedRelicId) {
    const fusion = FUSIONS.find((item) => item.id === id)!;
    if (
      safeStage < FUSION_UNLOCK_STAGE ||
      fusedRelics[id] ||
      fusion.materials.some((material) => relicLevels[material] < 6)
    ) {
      return;
    }
    const nextFused = { ...fusedRelics, [id]: true };
    setFusedRelics(nextFused);
    setShopOffers(drawRelicOffers(relicLevels, nextFused));
    setNotice(`遗物融合完成：${fusion.name}`);
  }

  function refreshShop() {
    if (status !== 'shop' || coins < refreshCost) return;
    setCoins((value) => value - refreshCost);
    setShopOffers(drawRelicOffers(relicLevels, fusedRelics));
    setShopRefreshes((value) => value + 1);
  }

  function openShop() {
    if (status !== 'playing') return;
    if (shopOffers.length === 0) {
      setShopOffers(drawRelicOffers(relicLevels, fusedRelics));
    }
    setShopAdvancesStage(false);
    setStatus('shop');
  }

  function closeShop() {
    setShopAdvancesStage(false);
    setStatus('playing');
    setNotice('遗物商店已关闭，关卡继续');
  }

  function toggleConsole() {
    setConsoleOpen((open) => {
      if (!open) {
        setConsoleCoins(String(coins));
        setConsoleStage(String(safeStage));
      }
      return !open;
    });
  }

  function applyConsoleCoins() {
    const parsed = Number(consoleCoins);
    if (!Number.isFinite(parsed)) {
      setNotice('请输入有效的金币数量');
      return;
    }
    const nextCoins = Math.max(0, Math.floor(parsed));
    setCoins(nextCoins);
    setConsoleCoins(String(nextCoins));
    setNotice(`控制台：金币已设置为 ${nextCoins}`);
  }

  function applyConsoleStage() {
    const parsed = Number(consoleStage);
    if (!Number.isFinite(parsed)) {
      setNotice('请输入有效的关卡编号');
      return;
    }
    const nextStage = Math.min(
      TOTAL_STAGES,
      Math.max(1, Math.floor(parsed)),
    );
    const nextStageData = STAGES[nextStage - 1];
    const rolledModifier = nextStageData.boss
      ? rollBossModifier(plantsRef.current)
      : null;
    const adjustedSeconds =
      rolledModifier?.kind === 'early-check'
        ? nextStageData.seconds - rolledModifier.seconds
        : nextStageData.seconds;
    setStage(nextStage);
    setConsoleStage(String(nextStage));
    setBossModifier(rolledModifier);
    setTimeLeft(adjustedSeconds);
    setShopOffers([]);
    setShopRefreshes(0);
    setShopAdvancesStage(false);
    setStatus('playing');
    setNotice(
      nextStageData.boss
        ? `控制台跳转：第 ${nextStage} 关 · ${describeBossModifier(rolledModifier).title}`
        : `控制台跳转：第 ${nextStage} 关`,
    );
  }

  function continueStage() {
    if (safeStage >= TOTAL_STAGES) {
      setBossModifier(null);
      setStatus('complete');
      return;
    }
    const nextStage = safeStage + 1;
    const nextStageData = STAGES[nextStage - 1];
    const rolledModifier = nextStageData.boss
      ? rollBossModifier(plantsRef.current)
      : null;
    const adjustedSeconds =
      rolledModifier?.kind === 'early-check'
        ? nextStageData.seconds - rolledModifier.seconds
        : nextStageData.seconds;
    setStage(nextStage);
    setBossModifier(rolledModifier);
    setTimeLeft(adjustedSeconds);
    setShopAdvancesStage(false);
    setStatus('playing');
    setNotice(
      nextStageData.boss
        ? `章末 Boss 词条：${describeBossModifier(rolledModifier).title}`
        : `第 ${nextStage} 小关开始`,
    );
  }

  function restartGame() {
    const initialPlants = makeInitialPlants();
    commitPlants(initialPlants);
    setCoins(0);
    setStage(1);
    setTimeLeft(STAGES[0].seconds);
    setClickLevel(0);
    setAreaLevel(0);
    setCloneCount(0);
    setSelectedId(1);
    setBossModifier(null);
    setRelicLevels({ ...EMPTY_RELIC_LEVELS });
    setFusedRelics({ ...EMPTY_FUSED_RELICS });
    setShopOffers([]);
    setShopRefreshes(0);
    setShopAdvancesStage(false);
    commitHarvestStats({ ...EMPTY_HARVEST_STATS });
    nextId.current = 2;
    if (coinBurstTimer.current) window.clearTimeout(coinBurstTimer.current);
    setCoinBurst({ amount: 0, serial: 0 });
    setStatus('playing');
    setNotice('新一轮开始：先催熟接近成熟的植物');
  }

  return (
    <main className="game-shell min-h-screen bg-background px-4 pb-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-primary">
              Greenhouse ledger / season 01
            </p>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              温室账单
            </h1>
          </div>
          <div className="floating-stats" aria-label="实时游戏状态">
            <div className="floating-stat-row">
              <div
                key={coinBurst.serial}
                className={`stat-chip coin-chip ${coinBurst.amount > 0 ? `coin-hit-${coinBurstTier}` : ''}`}
              >
                <Coins />
                <span><b>{coins}</b><small>当前金币</small></span>
                {coinBurst.amount > 0 && (
                  <i className={`coin-burst ${coinBurstTier}`}>+{coinBurst.amount}</i>
                )}
              </div>
              <div className={`stat-chip ${timeLeft <= 8 ? 'is-urgent' : ''}`}>
                <Timer />
                <span><b>{formatTime(timeLeft)}</b><small>结算倒计时</small></span>
              </div>
            </div>
            <div className="floating-progress-panel">
              <div className="floating-meter goal-meter">
                <span><b>账单</b><small>{Math.round(goalPercent)}%</small></span>
                <progress value={goalPercent} max={100} aria-label={`金币目标完成 ${Math.round(goalPercent)}%`} />
              </div>
              {relicLevels.goldenDrop > 0 && (
                <div className="floating-meter golden-meter">
                  <span><b>黄金碎片 {harvestStats.fragments}/4</b><small>{harvestStats.goldenProgress}/{GOLDEN_FRAGMENT_HARVESTS}</small></span>
                  <progress value={harvestStats.goldenProgress} max={GOLDEN_FRAGMENT_HARVESTS} aria-label={`黄金碎片 ${harvestStats.fragments} 枚，下一枚获取进度 ${harvestStats.goldenProgress}/${GOLDEN_FRAGMENT_HARVESTS}`} />
                </div>
              )}
              {fusedRelics.goldenHarvester && (
                <div className="floating-meter diamond-meter">
                  <span><b>钻石碎片 {harvestStats.diamondFragments}/{DIAMOND_FRAGMENT_REQUIREMENT}</b><small>黄金碎片 {harvestStats.fragments}/4</small></span>
                  <progress value={harvestStats.fragments} max={4} aria-label={`钻石碎片 ${harvestStats.diamondFragments} 枚，黄金碎片替补进度 ${harvestStats.fragments}/4`} />
                </div>
              )}
            </div>
          </div>
        </header>

        <section className={`console-panel ${consoleOpen ? 'is-open' : ''}`} aria-label="游戏快捷入口">
          <div className="utility-actions">
            <Button type="button" variant="outline" onClick={toggleConsole} aria-expanded={consoleOpen}>
              <Terminal /> 测试控制台
            </Button>
            <Button type="button" onClick={openShop} disabled={status !== 'playing'}>
              <Store /> 遗物商店 <span>{relicPurchaseCount === 0 ? '首件免费' : '已开放'}</span>
            </Button>
          </div>
          {consoleOpen && (
            <div className="console-controls">
              <form onSubmit={(event) => { event.preventDefault(); applyConsoleCoins(); }}>
                <label htmlFor="console-coins">金币数量</label>
                <Input id="console-coins" type="number" min="0" step="1" value={consoleCoins} onChange={(event) => setConsoleCoins(event.target.value)} />
                <Button type="submit">设置金币</Button>
              </form>
              <form onSubmit={(event) => { event.preventDefault(); applyConsoleStage(); }}>
                <label htmlFor="console-stage">跳转关卡</label>
                <Input id="console-stage" type="number" min="1" max={TOTAL_STAGES} step="1" value={consoleStage} onChange={(event) => setConsoleStage(event.target.value)} />
                <Button type="submit">进入关卡</Button>
              </form>
              <p>关卡范围 1–{TOTAL_STAGES}。跳关会重新生成该关倒计时与 Boss 词条。</p>
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="game-panel">
            <div className="mb-5">
              <div>
                <p className="eyebrow">第 {bigChapter} 章 · 小关 {stageInChapter}/{STAGES_PER_CHAPTER} · 总进度 {safeStage}/{TOTAL_STAGES}</p>
                <h2 className="text-xl font-bold">{stageData.name} · 结算时持有 {stageData.goal} 金币</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gap > 0 ? `还差 ${gap} 金币，升级消费也会减少当前金币。` : '目标已达成！守住余额直到结算。'}
                </p>
              </div>
            </div>

            {isBossStage && (
              <div className="boss-rule boss-rule-random" role="status">
                {activeBossModifier?.kind === 'coin-tax' ? <Coins /> : activeBossModifier?.kind === 'early-check' ? <Timer /> : <CircleAlert />}
                <div><b>随机 Boss 词条 · {bossModifierCopy.title}</b><span>{bossModifierCopy.description}，仅在本关生效</span></div>
              </div>
            )}

            <div className="plant-grid">
              {plants.map((plant, index) => {
                const ripe = plant.growth >= 100;
                const selected = plant.id === selectedId;
                const disabled = isPlantDisabled(plant.id);
                return (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => tendPlant(index)}
                    disabled={disabled}
                    className={`plant-card ${ripe ? 'is-ripe' : ''} ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''} ${plant.golden ? 'is-golden' : ''} ${plant.diamond ? 'is-diamond' : ''} ${plant.storedMultiplier > 1 ? 'is-stored' : ''} ${plant.storedMultiplier >= 4 ? 'stored-high' : ''} ${plant.storedMultiplier >= 8 ? 'stored-max' : ''} ${plant.storedMultiplier >= 16 ? 'stored-ultimate' : ''}`}
                    aria-label={`第 ${index + 1} 株植物，等级 ${plant.level}，成长 ${Math.round(plant.growth)}%，最小收获间隔 ${(plant.minHarvestMs / 1000).toFixed(1)} 秒`}
                    aria-keyshortcuts={selected ? 'Space' : undefined}
                  >
                    <span className="plot-number">{String(index + 1).padStart(2, '0')}</span>
                    {plant.diamond ? <span className="diamond-mark"><Gem /> 钻石</span> : plant.golden && <span className="golden-mark"><Flower2 /> 黄金</span>}
                    {plant.diamond ? (
                      <Gem className="plant-type-icon" aria-hidden="true" style={{ transform: `scale(${0.72 + plant.growth / 360})` }} />
                    ) : plant.golden ? (
                      <Flower2 className="plant-type-icon" aria-hidden="true" style={{ transform: `scale(${0.72 + plant.growth / 360})` }} />
                    ) : (
                      <Sprout className="plant-type-icon" aria-hidden="true" style={{ transform: `scale(${0.72 + plant.growth / 360})` }} />
                    )}
                    <span className="plant-name">
                      {disabled ? 'Boss 已禁用' : plant.storedMultiplier > 1 ? `金币蓄积 ×${plant.storedMultiplier}` : plant.diamond ? `钻石植物 · Lv.${plant.level}` : plant.golden ? `黄金植物 · Lv.${plant.level}` : ripe ? `可收获 · Lv.${plant.level}` : `日光芽 Lv.${plant.level}`}
                    </span>
                    <span className="growth-track"><i style={{ width: `${plant.growth}%` }} /></span>
                    <span className="growth-value"><span>{Math.round(plant.growth)}%</span><span>间隔 {(plant.minHarvestMs / 1000).toFixed(1)}s</span></span>
                    {harvestEffect.ids.includes(plant.id) && (
                      <span className="plant-coin-effect" key={`${plant.id}-${harvestEffect.serial}`} aria-hidden="true">
                        <i>◎</i><i>◎</i><i>◎</i><b>金币</b>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><MousePointer2 className="size-4" /> 点击或按住空格催生选中植物 +{clickPower}%；最短收获间隔为 {fusedRelics.catDog ? '0.1' : '0.3'} 秒。</p>
              <div className="chapter-track" aria-label={`当前第 ${bigChapter} 章，共 6 章`}>
                {Array.from({ length: TOTAL_CHAPTERS }, (_, index) => (
                  <span key={index} className={index + 1 <= bigChapter ? 'active' : ''}>{index + 1}</span>
                ))}
              </div>
            </div>
          </div>

          <aside className="upgrade-panel">
            <p className="eyebrow">工具台 / {safeStage <= SHOP_UNLOCK_STAGE ? '前期' : '中期'}</p>
            <h2 className="text-xl font-bold">把金币变成效率</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">投资会降低本关持有金币。遗物商店从开局开放，本局第一件遗物免费。</p>

            <section className="relic-slots" aria-labelledby="relic-slots-title">
              <div className="relic-slots-heading">
                <h3 id="relic-slots-title"><Sparkles /> 遗物槽</h3>
                <span>{equippedRelics.length}/{MAX_RELIC_SLOTS}</span>
              </div>
              <div className="relic-slot-grid">
                {Array.from({ length: MAX_RELIC_SLOTS }, (_, index) => {
                  const relic = equippedRelics[index];
                  if (!relic) {
                    return <div className="relic-slot is-empty" key={`empty-${index}`}>空槽 {index + 1}</div>;
                  }
                  return (
                    <div
                      className={`relic-slot is-filled ${relic.fused ? 'is-fused' : ''}`}
                      key={relic.key}
                      tabIndex={0}
                      aria-describedby={`relic-tooltip-${relic.key}`}
                    >
                      <Sparkles />
                      <span className="relic-slot-name">{relic.name}</span>
                      <div className="relic-tooltip" id={`relic-tooltip-${relic.key}`} role="tooltip">
                        <b>{relic.name}</b>
                        <em>{relic.level}</em>
                        <p>{relic.description}</p>
                        <span>{relic.effect}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="upgrade-row">
              <div className="upgrade-icon"><TrendingUp /></div>
              <div className="min-w-0 flex-1"><h3>选中植物 <em>Lv.{selectedPlant?.level ?? 1}</em></h3><p>单株基础产出 +1</p></div>
              <Button onClick={upgradeSelectedPlant} disabled={coins < plantLevelCost} data-upgrade-hotkey="q" aria-keyshortcuts="Q"><kbd>Q</kbd>{plantLevelCost} ◎</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><Droplets /></div>
              <div className="min-w-0 flex-1"><h3>强效浇灌 <em>Lv.{clickLevel}</em></h3><p>点击成长 +7%</p></div>
              <Button onClick={buyClickPower} disabled={coins < clickCost} data-upgrade-hotkey="w" aria-keyshortcuts="W"><kbd>W</kbd>{clickCost} ◎</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><CopyPlus /></div>
              <div className="min-w-0 flex-1"><h3>扦插繁育 <em>{plants.length}/{MAX_PLANTS}</em></h3><p>复制选中植物等级与间隔</p></div>
              <Button onClick={cloneSelectedPlant} disabled={coins < cloneCost || plants.length >= MAX_PLANTS} data-upgrade-hotkey="e" aria-keyshortcuts="E"><kbd>E</kbd>{plants.length >= MAX_PLANTS ? '已满' : `${cloneCost} ◎`}</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><Expand /></div>
              <div className="min-w-0 flex-1"><h3>扩散喷头 <em>Lv.{areaLevel}</em></h3><p>{areaLevel === 0 ? '催生并收获相邻植物' : areaLevel === 1 ? '范围扩大到 2 格' : '已覆盖最大范围'}</p></div>
              <Button onClick={buyArea} disabled={coins < areaCost || areaLevel >= 2} data-upgrade-hotkey="r" aria-keyshortcuts="R"><kbd>R</kbd>{areaLevel >= 2 ? '满级' : `${areaCost} ◎`}</Button>
            </div>

            <div className="manual-card">
              <Leaf />
              <div><b>总收获 {harvestStats.total} 次 · 遗物槽位 {relicSlotCount}/{MAX_RELIC_SLOTS} · 融合 {fusedRelicCount}/4</b><span>融合遗物继承素材效果，且两件素材合并占用一个槽位。</span></div>
            </div>
          </aside>
        </section>

        <output className={`notice ${notice ? 'is-visible' : ''}`} aria-live="polite">{notice}</output>
      </div>

      {status === 'shop' && (
        <div className="shop-backdrop">
          <section className="shop-card" role="dialog" aria-modal="true" aria-labelledby="shop-title">
            <header className="shop-header">
              <div><p className="eyebrow">{shopAdvancesStage ? `第 ${bigChapter} 大章完成` : `第 ${safeStage} 关进行中`} · 随机三选</p><h2 id="shop-title"><Store /> 遗物商店</h2></div>
              <div className="shop-balance"><Coins /><span><b>{coins}</b><small>可用金币</small></span></div>
            </header>

            <div className="relic-grid">
              {shopOffers.map((relicId, index) => {
                const relic = RELICS.find((item) => item.id === relicId)!;
                const level = relicLevels[relic.id];
                const cost = relicCost(
                  relic.id,
                  level,
                  relicPurchaseCount,
                  relicUpgradeCount,
                );
                const maxed = level >= 6;
                const slotsFull =
                  level === 0 && relicSlotCount >= MAX_RELIC_SLOTS;
                const progress = relic.id === 'goldenDrop'
                  ? `${harvestStats.goldenProgress}/${GOLDEN_FRAGMENT_HARVESTS} · 碎片 ${harvestStats.fragments}/4`
                  : relic.id === 'bigDog'
                    ? `${harvestStats.bigDogProgress}/${fusedRelics.catDog ? Math.max(8, Math.floor(Math.max(24, 72 - Math.max(1, level) * 8) / 2)) : Math.max(24, 72 - Math.max(1, level) * 8)}`
                    : relic.id === 'maodie'
                      ? `${harvestStats.maodieProgress}/${fusedRelics.catDog ? Math.max(8, Math.floor(Math.max(24, 72 - Math.max(1, level) * 8) / 2)) : Math.max(24, 72 - Math.max(1, level) * 8)}`
                      : null;
                return (
                  <article className={`relic-card ${level > 0 ? 'is-owned' : ''}`} key={relic.id}>
                    <div className="relic-topline"><span>0{index + 1} · {relic.branch}</span><b>Lv.{level}/6</b></div>
                    <h3>{relic.name}</h3>
                    <p>{relic.description}</p>
                    <div className="relic-effect">{relicEffect(relic.id, level > 0 ? level : 1)}</div>
                    {progress && <div className="relic-progress">进度 {progress}</div>}
                    <Button onClick={() => buyRelic(relic.id)} disabled={maxed || slotsFull || coins < cost} className="w-full">
                      {maxed ? '已满级' : slotsFull ? '遗物槽位已满' : level === 0 ? `购买 · ${cost} ◎` : `升级 Lv.${level + 1} · ${cost} ◎`}
                    </Button>
                  </article>
                );
              })}
            </div>

            {safeStage >= FUSION_UNLOCK_STAGE && (
              <section className="fusion-section" aria-labelledby="fusion-title">
                <div className="fusion-heading">
                  <div><p className="eyebrow">第20关解锁 · 满级素材限定</p><h3 id="fusion-title"><Sparkles /> 遗物融合</h3></div>
                  <p>两件满级遗物融合为一件，保留原效果并释放一个遗物槽位。</p>
                </div>
                <div className="fusion-grid">
                  {FUSIONS.map((fusion) => {
                    const fused = fusedRelics[fusion.id];
                    const ready = fusion.materials.every(
                      (material) => relicLevels[material] >= 6,
                    );
                    const materialNames = fusion.materials.map(
                      (material) => RELICS.find((relic) => relic.id === material)!.name,
                    );
                    return (
                      <article className={`fusion-card ${fused ? 'is-fused' : ''}`} key={fusion.id}>
                        <div className="fusion-materials">
                          {fusion.materials.map((material, index) => (
                            <span key={material}>{materialNames[index]} Lv.{relicLevels[material]}</span>
                          ))}
                        </div>
                        <h4>{fusion.name}</h4>
                        <p>{fusion.description}</p>
                        {fusion.id === 'goldenHarvester' && fused && (
                          <small>钻石碎片 {harvestStats.diamondFragments}/{DIAMOND_FRAGMENT_REQUIREMENT} · 黄金碎片 {harvestStats.fragments}/4</small>
                        )}
                        <Button onClick={() => fuseRelic(fusion.id)} disabled={!ready || fused} className="w-full">
                          {fused ? '融合完成' : ready ? '立即融合' : '需要两件 Lv.6 素材'}
                        </Button>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            <footer className="shop-footer">
              <p>购入阶梯 {relicPurchaseCount} · 升级阶梯 {relicUpgradeCount}。每次购买或升级都会抬高同类后续价格。</p>
              <div className="flex gap-2">
                <Button onClick={refreshShop} variant="outline" size="lg" disabled={coins < refreshCost}>刷新 · {refreshCost} ◎</Button>
                <Button onClick={shopAdvancesStage ? continueStage : closeShop} size="lg">{shopAdvancesStage ? (safeStage >= TOTAL_STAGES ? '完成本轮' : `进入第 ${safeStage + 1} 小关`) : '关闭商店 · 继续本关'}</Button>
              </div>
            </footer>
          </section>
        </div>
      )}

      {(status === 'failed' || status === 'complete') && (
        <div className="result-backdrop">
          <section className="result-card" role="dialog" aria-modal="true" aria-labelledby="result-title" aria-describedby="result-description">
            <div className={`result-media ${status === 'failed' ? 'is-failed' : ''}`}>{status === 'failed' ? <CircleAlert /> : <BadgeCheck />}</div>
            <div>
              <h2 id="result-title" className="result-title">{status === 'failed' ? '金币检测未通过' : '前期与中期阶段完成！'}</h2>
              <p id="result-description" className="result-description">
                {status === 'failed' ? `第 ${safeStage} 关结算需要 ${stageData.goal} 金币，你持有 ${coins} 金币，还差 ${gap}。` : `你完成了 6 个章节、30 个小关与 6 场章末 Boss 战。`}
              </p>
            </div>
            <div className="result-footer"><Button onClick={restartGame}><RotateCcw /> 重新开始</Button></div>
          </section>
        </div>
      )}
    </main>
  );
}
