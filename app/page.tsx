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
  Sprout,
  Timer,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

type Plant = { id: number; growth: number };
type GameStatus = 'playing' | 'chapter-clear' | 'failed' | 'complete';
type BossModifier =
  | { kind: 'coin-tax'; percentage: number }
  | { kind: 'plant-lock'; disabledIds: number[] }
  | { kind: 'early-check'; seconds: number };

const CHAPTERS = [
  { goal: 8, seconds: 32, name: '一株起步' },
  { goal: 28, seconds: 30, name: '账单加码' },
  { goal: 70, seconds: 30, name: '订单堆积' },
  { goal: 140, seconds: 28, name: '黄昏催收' },
  { goal: 250, seconds: 32, name: '霜王来袭', boss: 'frost' },
  { goal: 380, seconds: 35, name: '词条审判', boss: 'random' },
] as const;

const INITIAL_GROWTH = [45];
const MAX_PLANTS = 12;

function makeInitialPlants(): Plant[] {
  return INITIAL_GROWTH.map((growth, index) => ({ id: index + 1, growth }));
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `00:${safe.toString().padStart(2, '0')}`;
}

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>(makeInitialPlants);
  const [coins, setCoins] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(CHAPTERS[0].seconds);
  const [clickLevel, setClickLevel] = useState(0);
  const [plantLevel, setPlantLevel] = useState(1);
  const [areaLevel, setAreaLevel] = useState(0);
  const [cloneCount, setCloneCount] = useState(0);
  const [selectedId, setSelectedId] = useState(1);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [bossModifier, setBossModifier] = useState<BossModifier | null>(null);
  const [notice, setNotice] = useState('点击植物开始照料');
  const [coinBurst, setCoinBurst] = useState({ amount: 0, serial: 0 });
  const nextId = useRef(INITIAL_GROWTH.length + 1);
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
  const harvestValue = plantLevel;
  const plantLevelCost = Math.round(4 * 1.85 ** (plantLevel - 1));
  const clickCost = Math.round(8 * 1.65 ** clickLevel);
  const cloneCost = Math.round(7 * 1.55 ** cloneCount);
  const areaCost = areaLevel === 0 ? 24 : 55;
  const goalPercent = Math.min(100, (coins / chapterData.goal) * 100);
  const gap = Math.max(0, chapterData.goal - coins);
  const selectedPlant =
    plants.find((plant) => plant.id === selectedId) ?? plants[0];
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

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 0.25));
      setPlants((current) =>
        current.map((plant) =>
          activeBossModifier?.kind === 'plant-lock' &&
          activeBossModifier.disabledIds.includes(plant.id)
            ? plant
            : {
                ...plant,
                growth: Math.min(100, plant.growth + naturalRate * 0.25),
              },
        ),
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [activeBossModifier, naturalRate, status]);

  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    if (coins < chapterData.goal) {
      setStatus('failed');
    } else if (safeChapter === CHAPTERS.length) {
      setStatus('complete');
    } else {
      setStatus('chapter-clear');
    }
  }, [chapterData.goal, coins, safeChapter, status, timeLeft]);

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

  function tendPlant(index: number) {
    if (status !== 'playing') return;
    const target = plants[index];
    const origin = positions[index];
    if (!target || !origin) return;
    if (
      activeBossModifier?.kind === 'plant-lock' &&
      activeBossModifier.disabledIds.includes(target.id)
    ) {
      setNotice('这株植物被 Boss 词条禁用，本关无法操作');
      return;
    }
    setSelectedId(target.id);

    let harvested = 0;
    const nextPlants = plants.map((plant, plantIndex) => {
      if (
        activeBossModifier?.kind === 'plant-lock' &&
        activeBossModifier.disabledIds.includes(plant.id)
      ) {
        return plant;
      }
      const position = positions[plantIndex];
      if (!position) return plant;
      const distance =
        Math.abs(position.row - origin.row) +
        Math.abs(position.col - origin.col);
      const affected =
        plantIndex === index || (areaLevel > 0 && distance <= areaLevel);
      if (!affected) return plant;
      if (plant.growth >= 100) {
        harvested += 1;
        return { ...plant, growth: 0 };
      }
      const growthPower =
        plantIndex === index
          ? clickPower
          : clickPower * (areaLevel === 1 ? 0.48 : 0.34);
      return { ...plant, growth: Math.min(100, plant.growth + growthPower) };
    });
    setPlants(nextPlants);

    if (harvested > 0) {
      const grossIncome = harvested * harvestValue;
      const income =
        activeBossModifier?.kind === 'coin-tax'
          ? Math.max(
              1,
              Math.round(
                grossIncome * (1 - activeBossModifier.percentage / 100),
              ),
            )
          : grossIncome;
      setCoins((value) => value + income);
      showCoinGain(income);
      setNotice(
        activeBossModifier?.kind === 'coin-tax'
          ? `减产税生效：原本 ${grossIncome} 金币，实际 +${income}`
          : harvested > 1
            ? `范围收获 ${harvested} 株，金币 +${income}`
            : `收获日光芽，金币 +${income}`,
      );
    }
  }

  function upgradePlantLevel() {
    if (coins < plantLevelCost) return;
    setCoins((value) => value - plantLevelCost);
    setPlantLevel((value) => value + 1);
    setNotice(`植物升至 Lv.${plantLevel + 1}：每株产出 ${plantLevel + 1} 金币`);
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
    const newPlant = { id: nextId.current++, growth: selectedPlant.growth };
    setPlants((current) => [...current, newPlant]);
    setSelectedId(newPlant.id);
    setCloneCount((value) => value + 1);
    setNotice('扦插成功：复制了一株当前植物');
  }

  function buyArea() {
    if (coins < areaCost || areaLevel >= 2) return;
    setCoins((value) => value - areaCost);
    setAreaLevel((value) => value + 1);
    setNotice(`扩散喷头升级：点击范围扩大到 ${areaLevel + 1} 格`);
  }

  function continueChapter() {
    if (safeChapter >= CHAPTERS.length) {
      setStatus('complete');
      return;
    }
    const nextChapter = safeChapter + 1;
    const nextChapterData = CHAPTERS[nextChapter - 1];
    if (!nextChapterData) return;
    const rolledModifier =
      nextChapterData.boss === 'random' ? rollBossModifier(plants) : null;
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
    setPlants(makeInitialPlants());
    setCoins(0);
    setChapter(1);
    setTimeLeft(CHAPTERS[0].seconds);
    setClickLevel(0);
    setPlantLevel(1);
    setAreaLevel(0);
    setCloneCount(0);
    setSelectedId(1);
    nextId.current = INITIAL_GROWTH.length + 1;
    if (coinBurstTimer.current) window.clearTimeout(coinBurstTimer.current);
    setCoinBurst({ amount: 0, serial: 0 });
    setStatus('playing');
    setBossModifier(null);
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
              <span>
                <b>{coins}</b>
                <small>当前金币</small>
              </span>
              {coinBurst.amount > 0 && (
                <i className={`coin-burst ${coinBurstTier}`}>
                  +{coinBurst.amount}
                </i>
              )}
            </div>
            <div className={`stat-chip ${timeLeft <= 8 ? 'is-urgent' : ''}`}>
              <Timer />{' '}
              <span>
                <b>{formatTime(timeLeft)}</b>
                <small>结算倒计时</small>
              </span>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="game-panel">
            <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
              <div>
                <p className="eyebrow">
                  第 {chapter} 章 · {chapterData.name}
                </p>
                <h2 className="text-xl font-bold">
                  结算时持有 {chapterData.goal} 金币
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gap > 0
                    ? `还差 ${gap} 金币，升级消费也会减少当前金币。`
                    : '目标已达成！守住余额直到结算。'}
                </p>
              </div>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
                  <span>账单进度</span>
                  <span>{Math.round(goalPercent)}%</span>
                </div>
                <progress
                  value={goalPercent}
                  max={100}
                  className="native-progress"
                  aria-label={`金币目标完成 ${Math.round(goalPercent)}%`}
                />
              </div>
            </div>

            {isFrostBoss && (
              <div className="boss-rule" role="status">
                <Snowflake />
                <div>
                  <b>Boss 词条 · 严寒侵袭</b>
                  <span>自然生长 -56%，点击催生 -28%</span>
                </div>
              </div>
            )}

            {isRandomBoss && (
              <div className="boss-rule boss-rule-random" role="status">
                {activeBossModifier?.kind === 'coin-tax' ? (
                  <Coins />
                ) : activeBossModifier?.kind === 'early-check' ? (
                  <Timer />
                ) : (
                  <CircleAlert />
                )}
                <div>
                  <b>随机 Boss 词条 · {bossModifierCopy.title}</b>
                  <span>{bossModifierCopy.description}，仅在本关生效</span>
                </div>
              </div>
            )}

            <div className="plant-grid">
              {plants.map((plant, index) => {
                const ripe = plant.growth >= 100;
                const selected = plant.id === selectedId;
                const disabled =
                  activeBossModifier?.kind === 'plant-lock' &&
                  activeBossModifier.disabledIds.includes(plant.id);
                return (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => tendPlant(index)}
                    disabled={disabled}
                    className={`plant-card ${ripe ? 'is-ripe' : ''} ${selected ? 'is-selected' : ''} ${disabled ? 'is-disabled' : ''}`}
                    aria-label={`第 ${index + 1} 株日光芽，成长 ${Math.round(plant.growth)}%，${disabled ? '本关已禁用' : ripe ? '点击收获' : '点击催生'}`}
                  >
                    <span className="plot-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <Sprout
                      aria-hidden="true"
                      style={{
                        transform: `scale(${0.72 + plant.growth / 360})`,
                      }}
                    />
                    <span className="plant-name">
                      {disabled
                        ? 'Boss 已禁用'
                        : ripe
                          ? `点击收获 +${harvestValue}`
                          : `日光芽 Lv.${plantLevel}`}
                    </span>
                    <span className="growth-track">
                      <i style={{ width: `${plant.growth}%` }} />
                    </span>
                    <span className="growth-value">
                      {Math.round(plant.growth)}%
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MousePointer2 className="size-4" /> 点击催生 +{clickPower}
                %；范围内成熟植物会一并收获。
              </p>
              <div
                className="chapter-track"
                aria-label={`当前第 ${chapter} 章，共 6 章`}
              >
                {CHAPTERS.map((item, index) => (
                  <span
                    key={item.name}
                    className={index + 1 <= chapter ? 'active' : ''}
                  >
                    {index === 4 ? 'B1' : index === 5 ? 'B2' : index + 1}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="upgrade-panel">
            <p className="eyebrow">工具台 / 前期</p>
            <h2 className="text-xl font-bold">把金币变成效率</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">
              投资会降低本章持有金币。越接近结算，选择越要谨慎。
            </p>

            <div className="upgrade-row">
              <div className="upgrade-icon">
                <TrendingUp />
              </div>
              <div className="min-w-0 flex-1">
                <h3>
                  植物等级 <em>Lv.{plantLevel}</em>
                </h3>
                <p>
                  每株产出 {harvestValue} → {harvestValue + 1} 金币
                </p>
              </div>
              <Button
                onClick={upgradePlantLevel}
                disabled={coins < plantLevelCost}
              >
                {plantLevelCost} ◎
              </Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon">
                <Droplets />
              </div>
              <div className="min-w-0 flex-1">
                <h3>
                  强效浇灌 <em>Lv.{clickLevel}</em>
                </h3>
                <p>点击成长 +7%</p>
              </div>
              <Button onClick={buyClickPower} disabled={coins < clickCost}>
                {clickCost} ◎
              </Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon">
                <CopyPlus />
              </div>
              <div className="min-w-0 flex-1">
                <h3>
                  扦插繁育{' '}
                  <em>
                    {plants.length}/{MAX_PLANTS}
                  </em>
                </h3>
                <p>复制当前选中植物</p>
              </div>
              <Button
                onClick={cloneSelectedPlant}
                disabled={coins < cloneCost || plants.length >= MAX_PLANTS}
              >
                {plants.length >= MAX_PLANTS ? '已满' : `${cloneCost} ◎`}
              </Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon">
                <Expand />
              </div>
              <div className="min-w-0 flex-1">
                <h3>
                  扩散喷头 <em>Lv.{areaLevel}</em>
                </h3>
                <p>
                  {areaLevel === 0
                    ? '催生并收获相邻植物'
                    : areaLevel === 1
                      ? '催生/收获范围扩大到 2 格'
                      : '已覆盖最大范围'}
                </p>
              </div>
              <Button
                onClick={buyArea}
                disabled={coins < areaCost || areaLevel >= 2}
              >
                {areaLevel >= 2 ? '满级' : `${areaCost} ◎`}
              </Button>
            </div>

            <div className="manual-card">
              <Leaf />
              <div>
                <b>
                  当前选中：第{' '}
                  {plants.findIndex((plant) => plant.id === selectedId) + 1} 株
                  · 产出 {harvestValue}
                </b>
                <span>复制会保留它现在的生长度。</span>
              </div>
            </div>
          </aside>
        </section>

        <output
          className={`notice ${notice ? 'is-visible' : ''}`}
          aria-live="polite"
        >
          {notice}
        </output>
      </div>

      {status !== 'playing' && (
        <div className="result-backdrop">
          <section
            className="result-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-title"
            aria-describedby="result-description"
          >
            <div
              className={`result-media ${status === 'failed' ? 'is-failed' : ''}`}
            >
              {status === 'failed' ? <CircleAlert /> : <BadgeCheck />}
            </div>
            <div>
              <h2 id="result-title" className="result-title">
                {status === 'failed'
                  ? '金币检测未通过'
                  : status === 'complete'
                    ? '前期阶段完成！'
                    : `第 ${chapter} 章通过`}
              </h2>
              <p id="result-description" className="result-description">
                {status === 'failed'
                  ? `结算需要 ${chapterData.goal} 金币，你持有 ${coins} 金币，还差 ${gap}。这次要更谨慎地安排升级。`
                : status === 'complete'
                  ? `你顶住随机负面词条并守住了 ${chapterData.goal} 金币，已经完成点击阶段的全部六章。`
                    : `金币检测通过。下一章目标提高到 ${CHAPTERS[safeChapter].goal}，植物和升级会全部保留。`}
              </p>
            </div>
            <div className="result-footer">
              {status === 'chapter-clear' ? (
                <Button onClick={continueChapter}>
                  进入第 {safeChapter + 1} 章
                </Button>
              ) : (
                <Button onClick={restartGame}>
                  <RotateCcw /> 重新开始
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
