'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  CircleAlert,
  Coins,
  CopyPlus,
  Droplets,
  Expand,
  Leaf,
  MousePointer2,
  RotateCcw,
  Snowflake,
  Sparkles,
  Sprout,
  Store,
  Timer,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

type Plant = {
  id: number;
  growth: number;
  level: number;
  golden: boolean;
  storedMultiplier: number;
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

type RelicLevels = Record<RelicId, number>;
type HarvestStats = {
  total: number;
  goldenProgress: number;
  fragments: number;
  bigDogProgress: number;
  maodieProgress: number;
};

const CHAPTERS = [
  { goal: 8, seconds: 32, name: '一株起步' },
  { goal: 28, seconds: 30, name: '账单加码' },
  { goal: 70, seconds: 30, name: '订单堆积' },
  { goal: 140, seconds: 28, name: '黄昏催收' },
  { goal: 250, seconds: 32, name: '霜王来袭', boss: 'frost' },
  { goal: 380, seconds: 35, name: '词条审判', boss: 'random' },
] as const;

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
    description: '自动收获成熟植物，并提供额外自动催熟速度。',
    baseCost: 5,
  },
  {
    id: 'goldenDrop',
    name: '黄金水滴',
    branch: '黄金植物',
    description: '每收获 1000 次获得碎片；4 枚碎片生成一株黄金植物。',
    baseCost: 8,
  },
  {
    id: 'fertilizer',
    name: '金坷垃',
    branch: '倍倍',
    description: '成熟植物放置一段时间后，储存金币翻倍。',
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
    description: '增加暴击率，并允许一次收获连续触发暴击。',
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

const EMPTY_HARVEST_STATS: HarvestStats = {
  total: 0,
  goldenProgress: 0,
  fragments: 0,
  bigDogProgress: 0,
  maodieProgress: 0,
};

const MAX_PLANTS = 12;
const MIN_HARVEST_MS = 300;

function makeInitialPlants(): Plant[] {
  return [
    {
      id: 1,
      growth: 45,
      level: 1,
      golden: false,
      storedMultiplier: 1,
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

function relicCost(id: RelicId, level: number) {
  const relic = RELICS.find((item) => item.id === id)!;
  return Math.round(relic.baseCost * 1.7 ** level);
}

function relicEffect(id: RelicId, level: number) {
  const shownLevel = Math.max(1, level);
  switch (id) {
    case 'autoHarvester':
      return `自动收获；额外催熟 +${(shownLevel * 0.6).toFixed(1)}%/秒`;
    case 'goldenDrop':
      return `植物金币 +${shownLevel * 12}%，自动生长 +${(shownLevel * 0.3).toFixed(1)}%/秒`;
    case 'fertilizer':
      return `${Math.max(2.5, 5.5 - shownLevel * 0.5).toFixed(1)} 秒未收获后储存 ×2 金币`;
    case 'infinityBlade':
      return `暴击率 +${5 + shownLevel * 3}%，暴击倍率 ×${(1.75 + shownLevel * 0.25).toFixed(2)}`;
    case 'midasHand':
      return `手动收获倍率 ×${(2 + (shownLevel - 1) * 0.25).toFixed(2)}`;
    case 'critRing':
      return `暴击率 +${shownLevel * 3}%，最多重复暴击 ${shownLevel} 次`;
    case 'bigDog':
      return `每 ${Math.max(30, 90 - shownLevel * 10)} 次收获，随机植物等级 +1`;
    case 'maodie':
      return `每 ${Math.max(30, 90 - shownLevel * 10)} 次收获，随机植物进度 -15%，间隔缩短`;
  }
}

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>(makeInitialPlants);
  const plantsRef = useRef(plants);
  const [coins, setCoins] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(CHAPTERS[0].seconds);
  const [clickLevel, setClickLevel] = useState(0);
  const [areaLevel, setAreaLevel] = useState(0);
  const [cloneCount, setCloneCount] = useState(0);
  const [selectedId, setSelectedId] = useState(1);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [bossModifier, setBossModifier] = useState<BossModifier | null>(null);
  const [relicLevels, setRelicLevels] = useState<RelicLevels>({
    ...EMPTY_RELIC_LEVELS,
  });
  const [harvestStats, setHarvestStats] = useState<HarvestStats>({
    ...EMPTY_HARVEST_STATS,
  });
  const harvestStatsRef = useRef(harvestStats);
  const [notice, setNotice] = useState('点击植物开始照料');
  const [coinBurst, setCoinBurst] = useState({ amount: 0, serial: 0 });
  const nextId = useRef(2);
  const coinBurstTimer = useRef<number | null>(null);

  const safeChapter = Math.min(Math.max(chapter, 1), CHAPTERS.length);
  const chapterData = CHAPTERS[safeChapter - 1];
  const isFrostBoss = chapterData.boss === 'frost';
  const isRandomBoss = chapterData.boss === 'random';
  const activeBossModifier = isRandomBoss ? bossModifier : null;
  const clickPower = Math.round(
    (18 + clickLevel * 7) * (isFrostBoss ? 0.72 : 1),
  );
  const naturalRate = isFrostBoss ? 0.55 : 1.25;
  const clickCost = Math.round(8 * 1.65 ** clickLevel);
  const cloneCost = Math.round(7 * 1.55 ** cloneCount);
  const areaCost = areaLevel === 0 ? 24 : 55;
  const goalPercent = Math.min(100, (coins / chapterData.goal) * 100);
  const gap = Math.max(0, chapterData.goal - coins);
  const selectedPlant =
    plants.find((plant) => plant.id === selectedId) ?? plants[0];
  const plantLevelCost = selectedPlant
    ? Math.round(4 * 1.85 ** (selectedPlant.level - 1))
    : 4;
  const bossModifierCopy = describeBossModifier(activeBossModifier);
  const coinBurstTier =
    coinBurst.amount >= 12
      ? 'large'
      : coinBurst.amount >= 4
        ? 'medium'
        : 'small';

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

  function collectPlantIds(
    plantIds: number[],
    mode: HarvestMode,
    sourcePlants = plantsRef.current,
  ) {
    const now = Date.now();
    const idSet = new Set(plantIds);
    let harvested = 0;
    let grossIncome = 0;
    let criticalHits = 0;

    let nextPlants = sourcePlants.map((plant) => {
      if (
        !idSet.has(plant.id) ||
        isPlantDisabled(plant.id) ||
        plant.growth < 100 ||
        now - plant.lastHarvestAt < plant.minHarvestMs
      ) {
        return plant;
      }

      harvested += 1;
      let plantIncome =
        plant.level *
        (plant.golden ? 2 : 1) *
        plant.storedMultiplier *
        (1 + relicLevels.goldenDrop * 0.12);

      if (mode === 'manual' && relicLevels.midasHand > 0) {
        plantIncome *= 2 + (relicLevels.midasHand - 1) * 0.25;
      }

      const critChance = Math.min(
        0.7,
        (relicLevels.infinityBlade > 0
          ? 0.05 + relicLevels.infinityBlade * 0.03
          : 0) +
          relicLevels.critRing * 0.03,
      );
      const critMultiplier =
        relicLevels.infinityBlade > 0
          ? 1.75 + relicLevels.infinityBlade * 0.25
          : 2;
      const maxCrits = relicLevels.critRing > 0 ? 1 + relicLevels.critRing : 1;
      for (let attempt = 0; attempt < maxCrits; attempt += 1) {
        if (Math.random() >= critChance) break;
        plantIncome *= critMultiplier;
        criticalHits += 1;
        if (relicLevels.critRing === 0) break;
      }

      grossIncome += Math.max(1, Math.round(plantIncome));
      return {
        ...plant,
        growth: plant.golden ? 100 : 0,
        storedMultiplier: 1,
        ripeSince: plant.golden ? now : null,
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
      while (nextStats.goldenProgress >= 1000) {
        nextStats.goldenProgress -= 1000;
        nextStats.fragments += 1;
      }
      while (nextStats.fragments >= 4) {
        nextStats.fragments -= 4;
        const regularPlants = nextPlants.filter((plant) => !plant.golden);
        if (regularPlants.length > 0) {
          const chosen = regularPlants[randomIndex(regularPlants.length)];
          nextPlants = nextPlants.map((plant) =>
            plant.id === chosen.id
              ? {
                  ...plant,
                  golden: true,
                  growth: 100,
                  ripeSince: now,
                }
              : plant,
          );
          events.push('生成黄金植物');
        } else {
          directBonus += 100 * relicLevels.goldenDrop;
          events.push(`黄金碎片兑换 +${100 * relicLevels.goldenDrop}`);
        }
      }
    }

    if (relicLevels.bigDog > 0 && nextPlants.length > 0) {
      const threshold = Math.max(30, 90 - relicLevels.bigDog * 10);
      nextStats.bigDogProgress += harvested;
      while (nextStats.bigDogProgress >= threshold) {
        nextStats.bigDogProgress -= threshold;
        const chosenIndex = randomIndex(nextPlants.length);
        nextPlants = nextPlants.map((plant, index) =>
          index === chosenIndex ? { ...plant, level: plant.level + 1 } : plant,
        );
        events.push(`大狗升级第 ${chosenIndex + 1} 株`);
      }
    }

    if (relicLevels.maodie > 0 && nextPlants.length > 0) {
      const threshold = Math.max(30, 90 - relicLevels.maodie * 10);
      nextStats.maodieProgress += harvested;
      while (nextStats.maodieProgress >= threshold) {
        nextStats.maodieProgress -= threshold;
        const chosenIndex = randomIndex(nextPlants.length);
        nextPlants = nextPlants.map((plant, index) =>
          index === chosenIndex
            ? {
                ...plant,
                growth: plant.golden ? 100 : Math.max(0, plant.growth - 15),
                minHarvestMs: Math.max(
                  MIN_HARVEST_MS,
                  plant.minHarvestMs - (80 + relicLevels.maodie * 20),
                ),
              }
            : plant,
        );
        events.push(`耄耋影响第 ${chosenIndex + 1} 株`);
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
      const autoGrowth =
        relicLevels.autoHarvester * 0.6 + relicLevels.goldenDrop * 0.3;
      const fertilizerWait = Math.max(
        2500,
        5500 - relicLevels.fertilizer * 500,
      );

      const grownPlants = plantsRef.current.map((plant) => {
        if (isPlantDisabled(plant.id)) return plant;
        const nextGrowth = plant.golden
          ? 100
          : Math.min(
              100,
              plant.growth + (naturalRate + autoGrowth) * 0.25,
            );
        const reachedMaturity = plant.growth < 100 && nextGrowth >= 100;
        const ripeSince = reachedMaturity
          ? now
          : nextGrowth >= 100
            ? (plant.ripeSince ?? now)
            : null;
        const shouldStoreDouble =
          relicLevels.fertilizer > 0 &&
          nextGrowth >= 100 &&
          ripeSince !== null &&
          now - ripeSince >= fertilizerWait;
        return {
          ...plant,
          growth: nextGrowth,
          ripeSince,
          storedMultiplier: shouldStoreDouble ? 2 : plant.storedMultiplier,
        };
      });

      plantsRef.current = grownPlants;
      if (relicLevels.autoHarvester > 0) {
        const readyIds = grownPlants
          .filter(
            (plant) =>
              !isPlantDisabled(plant.id) &&
              plant.growth >= 100 &&
              now - plant.lastHarvestAt >= plant.minHarvestMs,
          )
          .map((plant) => plant.id);
        if (readyIds.length > 0) {
          collectPlantIds(readyIds, 'auto', grownPlants);
          return;
        }
      }
      commitPlants(grownPlants);
    }, 250);
    return () => window.clearInterval(timer);
  }, [activeBossModifier, naturalRate, relicLevels, status]);

  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    if (coins < chapterData.goal) {
      setStatus('failed');
    } else {
      if (isRandomBoss) setBossModifier(null);
      setStatus('shop');
    }
  }, [chapterData.goal, coins, isRandomBoss, status, timeLeft]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(
    () => () => {
      if (coinBurstTimer.current) window.clearTimeout(coinBurstTimer.current);
    },
    [],
  );

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
      storedMultiplier: 1,
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
    const cost = relicCost(id, level);
    if (level >= 6 || coins < cost) return;
    setCoins((value) => value - cost);
    setRelicLevels((current) => ({ ...current, [id]: level + 1 }));
  }

  function continueChapter() {
    if (safeChapter >= CHAPTERS.length) {
      setBossModifier(null);
      setStatus('complete');
      return;
    }
    const nextChapter = safeChapter + 1;
    const nextChapterData = CHAPTERS[nextChapter - 1];
    const rolledModifier =
      nextChapterData.boss === 'random'
        ? rollBossModifier(plantsRef.current)
        : null;
    const adjustedSeconds =
      rolledModifier?.kind === 'early-check'
        ? nextChapterData.seconds - rolledModifier.seconds
        : nextChapterData.seconds;
    setChapter(nextChapter);
    setBossModifier(rolledModifier);
    setTimeLeft(adjustedSeconds);
    setStatus('playing');
    setNotice(
      nextChapter === 5
        ? 'Boss 词条生效：严寒侵袭'
        : nextChapter === 6
          ? `随机词条生效：${describeBossModifier(rolledModifier).title}`
          : `第 ${nextChapter} 章开始`,
    );
  }

  function restartGame() {
    const initialPlants = makeInitialPlants();
    commitPlants(initialPlants);
    setCoins(0);
    setChapter(1);
    setTimeLeft(CHAPTERS[0].seconds);
    setClickLevel(0);
    setAreaLevel(0);
    setCloneCount(0);
    setSelectedId(1);
    setBossModifier(null);
    setRelicLevels({ ...EMPTY_RELIC_LEVELS });
    commitHarvestStats({ ...EMPTY_HARVEST_STATS });
    nextId.current = 2;
    if (coinBurstTimer.current) window.clearTimeout(coinBurstTimer.current);
    setCoinBurst({ amount: 0, serial: 0 });
    setStatus('playing');
    setNotice('新一轮开始：先催熟接近成熟的植物');
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
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
          <div className="flex w-full gap-2 sm:w-auto">
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
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="game-panel">
            <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
              <div>
                <p className="eyebrow">第 {chapter} 章 · {chapterData.name}</p>
                <h2 className="text-xl font-bold">结算时持有 {chapterData.goal} 金币</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gap > 0 ? `还差 ${gap} 金币，升级消费也会减少当前金币。` : '目标已达成！守住余额直到结算。'}
                </p>
              </div>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
                  <span>账单进度</span><span>{Math.round(goalPercent)}%</span>
                </div>
                <progress value={goalPercent} max={100} className="native-progress" aria-label={`金币目标完成 ${Math.round(goalPercent)}%`} />
              </div>
            </div>

            {isFrostBoss && (
              <div className="boss-rule" role="status">
                <Snowflake />
                <div><b>Boss 词条 · 严寒侵袭</b><span>自然生长 -56%，点击催生 -28%</span></div>
              </div>
            )}
            {isRandomBoss && (
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
                    className={`plant-card ${ripe ? 'is-ripe' : ''} ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''} ${plant.golden ? 'is-golden' : ''} ${plant.storedMultiplier > 1 ? 'is-stored' : ''}`}
                    aria-label={`第 ${index + 1} 株植物，等级 ${plant.level}，成长 ${Math.round(plant.growth)}%，最小收获间隔 ${(plant.minHarvestMs / 1000).toFixed(1)} 秒`}
                  >
                    <span className="plot-number">{String(index + 1).padStart(2, '0')}</span>
                    {plant.golden && <span className="golden-mark"><Sparkles /> 黄金</span>}
                    <Sprout aria-hidden="true" style={{ transform: `scale(${0.72 + plant.growth / 360})` }} />
                    <span className="plant-name">
                      {disabled ? 'Boss 已禁用' : plant.storedMultiplier > 1 ? '金币已储存 ×2' : ripe ? `可收获 · Lv.${plant.level}` : `日光芽 Lv.${plant.level}`}
                    </span>
                    <span className="growth-track"><i style={{ width: `${plant.growth}%` }} /></span>
                    <span className="growth-value"><span>{Math.round(plant.growth)}%</span><span>间隔 {(plant.minHarvestMs / 1000).toFixed(1)}s</span></span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><MousePointer2 className="size-4" /> 点击催生 +{clickPower}%；最短收获间隔为 0.3 秒。</p>
              <div className="chapter-track" aria-label={`当前第 ${chapter} 章，共 6 章`}>
                {CHAPTERS.map((item, index) => (
                  <span key={item.name} className={index + 1 <= chapter ? 'active' : ''}>{index === 4 ? 'B1' : index === 5 ? 'B2' : index + 1}</span>
                ))}
              </div>
            </div>
          </div>

          <aside className="upgrade-panel">
            <p className="eyebrow">工具台 / 前期</p>
            <h2 className="text-xl font-bold">把金币变成效率</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">投资会降低本章持有金币。遗物只在小波结束后的商店购买。</p>

            <div className="upgrade-row">
              <div className="upgrade-icon"><TrendingUp /></div>
              <div className="min-w-0 flex-1"><h3>选中植物 <em>Lv.{selectedPlant?.level ?? 1}</em></h3><p>单株基础产出 +1</p></div>
              <Button onClick={upgradeSelectedPlant} disabled={coins < plantLevelCost}>{plantLevelCost} ◎</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><Droplets /></div>
              <div className="min-w-0 flex-1"><h3>强效浇灌 <em>Lv.{clickLevel}</em></h3><p>点击成长 +7%</p></div>
              <Button onClick={buyClickPower} disabled={coins < clickCost}>{clickCost} ◎</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><CopyPlus /></div>
              <div className="min-w-0 flex-1"><h3>扦插繁育 <em>{plants.length}/{MAX_PLANTS}</em></h3><p>复制选中植物等级与间隔</p></div>
              <Button onClick={cloneSelectedPlant} disabled={coins < cloneCost || plants.length >= MAX_PLANTS}>{plants.length >= MAX_PLANTS ? '已满' : `${cloneCost} ◎`}</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><Expand /></div>
              <div className="min-w-0 flex-1"><h3>扩散喷头 <em>Lv.{areaLevel}</em></h3><p>{areaLevel === 0 ? '催生并收获相邻植物' : areaLevel === 1 ? '范围扩大到 2 格' : '已覆盖最大范围'}</p></div>
              <Button onClick={buyArea} disabled={coins < areaCost || areaLevel >= 2}>{areaLevel >= 2 ? '满级' : `${areaCost} ◎`}</Button>
            </div>

            <div className="manual-card">
              <Leaf />
              <div><b>总收获 {harvestStats.total} 次 · 遗物 {Object.values(relicLevels).filter(Boolean).length}/8</b><span>自动收割会沿用暴击、黄金植物和收获计数。</span></div>
            </div>
          </aside>
        </section>

        <output className={`notice ${notice ? 'is-visible' : ''}`} aria-live="polite">{notice}</output>
      </div>

      {status === 'shop' && (
        <div className="shop-backdrop">
          <section className="shop-card" role="dialog" aria-modal="true" aria-labelledby="shop-title">
            <header className="shop-header">
              <div><p className="eyebrow">第 {safeChapter} 小波结算完成</p><h2 id="shop-title"><Store /> 中期遗物商店</h2></div>
              <div className="shop-balance"><Coins /><span><b>{coins}</b><small>可用金币</small></span></div>
            </header>

            <div className="relic-grid">
              {RELICS.map((relic, index) => {
                const level = relicLevels[relic.id];
                const cost = relicCost(relic.id, level);
                const maxed = level >= 6;
                const progress = relic.id === 'goldenDrop'
                  ? `${harvestStats.goldenProgress}/1000 · 碎片 ${harvestStats.fragments}/4`
                  : relic.id === 'bigDog'
                    ? `${harvestStats.bigDogProgress}/${Math.max(30, 90 - Math.max(1, level) * 10)}`
                    : relic.id === 'maodie'
                      ? `${harvestStats.maodieProgress}/${Math.max(30, 90 - Math.max(1, level) * 10)}`
                      : null;
                return (
                  <article className={`relic-card ${level > 0 ? 'is-owned' : ''}`} key={relic.id}>
                    <div className="relic-topline"><span>0{index + 1} · {relic.branch}</span><b>Lv.{level}/6</b></div>
                    <h3>{relic.name}</h3>
                    <p>{relic.description}</p>
                    <div className="relic-effect">{relicEffect(relic.id, level > 0 ? level : 1)}</div>
                    {progress && <div className="relic-progress">进度 {progress}</div>}
                    <Button onClick={() => buyRelic(relic.id)} disabled={maxed || coins < cost} className="w-full">
                      {maxed ? '已满级' : level === 0 ? `购买 · ${cost} ◎` : `升级 Lv.${level + 1} · ${cost} ◎`}
                    </Button>
                  </article>
                );
              })}
            </div>

            <footer className="shop-footer">
              <p>商店期间倒计时暂停。消费会减少下一关可用于结算的金币。</p>
              <Button onClick={continueChapter} size="lg">{safeChapter >= CHAPTERS.length ? '完成本轮' : `进入第 ${safeChapter + 1} 关`}</Button>
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
                {status === 'failed' ? `结算需要 ${chapterData.goal} 金币，你持有 ${coins} 金币，还差 ${gap}。` : `你击败了两场 Boss，并建立了由遗物驱动的半自动温室。`}
              </p>
            </div>
            <div className="result-footer"><Button onClick={restartGame}><RotateCcw /> 重新开始</Button></div>
          </section>
        </div>
      )}
    </main>
  );
}
