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
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Plant = { id: number; growth: number };
type GameStatus = 'playing' | 'chapter-clear' | 'failed' | 'complete';

const CHAPTERS = [
  { goal: 42, seconds: 32, name: '一株起步' },
  { goal: 125, seconds: 30, name: '账单加码' },
  { goal: 260, seconds: 30, name: '订单堆积' },
  { goal: 430, seconds: 28, name: '黄昏催收' },
  { goal: 650, seconds: 32, name: '霜王来袭', boss: true },
] as const;

const INITIAL_GROWTH = [45];
const HARVEST_VALUE = 14;
const MAX_PLANTS = 12;

function makeInitialPlants(): Plant[] {
  return INITIAL_GROWTH.map((growth, index) => ({ id: index + 1, growth }));
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  return `00:${safe.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [plants, setPlants] = useState<Plant[]>(makeInitialPlants);
  const [coins, setCoins] = useState(0);
  const [chapter, setChapter] = useState(1);
  const [timeLeft, setTimeLeft] = useState(CHAPTERS[0].seconds);
  const [clickLevel, setClickLevel] = useState(0);
  const [areaLevel, setAreaLevel] = useState(0);
  const [cloneCount, setCloneCount] = useState(0);
  const [selectedId, setSelectedId] = useState(1);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [notice, setNotice] = useState('点击植物开始照料');
  const nextId = useRef(INITIAL_GROWTH.length + 1);

  const chapterData = CHAPTERS[chapter - 1];
  const isBoss = Boolean(chapterData.boss);
  const clickPower = Math.round((18 + clickLevel * 7) * (isBoss ? 0.72 : 1));
  const naturalRate = isBoss ? 0.55 : 1.25;
  const clickCost = Math.round(30 * 1.65 ** clickLevel);
  const cloneCost = Math.round(28 * 1.55 ** cloneCount);
  const areaCost = areaLevel === 0 ? 75 : 165;
  const goalPercent = Math.min(100, (coins / chapterData.goal) * 100);
  const gap = Math.max(0, chapterData.goal - coins);
  const selectedPlant = plants.find((plant) => plant.id === selectedId) ?? plants[0];

  const rowWidth = 3;
  const positions = useMemo(
    () => plants.map((_, index) => ({ row: Math.floor(index / rowWidth), col: index % rowWidth })),
    [plants],
  );

  useEffect(() => {
    if (status !== 'playing') return;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 0.25));
      setPlants((current) =>
        current.map((plant) => ({ ...plant, growth: Math.min(100, plant.growth + naturalRate * 0.25) })),
      );
    }, 250);
    return () => window.clearInterval(timer);
  }, [naturalRate, status]);

  useEffect(() => {
    if (status !== 'playing' || timeLeft > 0) return;
    if (coins < chapterData.goal) {
      setStatus('failed');
    } else if (chapter === CHAPTERS.length) {
      setStatus('complete');
    } else {
      setStatus('chapter-clear');
    }
  }, [chapter, chapterData.goal, coins, status, timeLeft]);

  useEffect(() => {
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function tendPlant(index: number) {
    if (status !== 'playing') return;
    const target = plants[index];
    setSelectedId(target.id);

    setPlants((current) => {
      let harvested = 0;
      const next = current.map((plant, plantIndex) => {
        const distance =
          Math.abs(positions[plantIndex].row - positions[index].row) +
          Math.abs(positions[plantIndex].col - positions[index].col);
        const affected = plantIndex === index || (areaLevel > 0 && distance <= areaLevel);
        if (!affected) return plant;
        if (plant.growth >= 100) {
          harvested += 1;
          return { ...plant, growth: 0 };
        }
        const growthPower = plantIndex === index
          ? clickPower
          : clickPower * (areaLevel === 1 ? 0.48 : 0.34);
        return { ...plant, growth: Math.min(100, plant.growth + growthPower) };
      });
      if (harvested > 0) {
        const income = harvested * HARVEST_VALUE;
        setCoins((value) => value + income);
        setNotice(harvested > 1 ? `范围收获 ${harvested} 株，金币 +${income}` : `收获日光芽，金币 +${income}`);
      }
      return next;
    });
  }

  function buyClickPower() {
    if (coins < clickCost) return;
    setCoins((value) => value - clickCost);
    setClickLevel((value) => value + 1);
    setNotice(`强效浇灌升级：单次催生 +${18 + (clickLevel + 1) * 7}%`);
  }

  function cloneSelectedPlant() {
    if (!selectedPlant || coins < cloneCost || plants.length >= MAX_PLANTS) return;
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
    const nextChapter = chapter + 1;
    setChapter(nextChapter);
    setTimeLeft(CHAPTERS[nextChapter - 1].seconds);
    setStatus('playing');
    setNotice(nextChapter === 5 ? 'Boss 词条生效：严寒侵袭' : `第 ${nextChapter} 章开始`);
  }

  function restartGame() {
    setPlants(makeInitialPlants());
    setCoins(0);
    setChapter(1);
    setTimeLeft(CHAPTERS[0].seconds);
    setClickLevel(0);
    setAreaLevel(0);
    setCloneCount(0);
    setSelectedId(1);
    nextId.current = INITIAL_GROWTH.length + 1;
    setStatus('playing');
    setNotice('新一轮开始：先催熟接近成熟的植物');
  }

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-[0.22em] text-primary">Greenhouse ledger / season 01</p>
            <h1 className="text-3xl font-black tracking-[-0.04em] sm:text-4xl">温室账单</h1>
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="stat-chip"><Coins /> <span><b>{coins}</b><small>当前金币</small></span></div>
            <div className={`stat-chip ${timeLeft <= 8 ? 'is-urgent' : ''}`}><Timer /> <span><b>{formatTime(timeLeft)}</b><small>结算倒计时</small></span></div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
          <div className="game-panel">
            <div className="mb-5 grid gap-4 sm:grid-cols-[1fr_220px] sm:items-end">
              <div>
                <p className="eyebrow">第 {chapter} 章 · {chapterData.name}</p>
                <h2 className="text-xl font-bold">结算时持有 {chapterData.goal} 金币</h2>
                <p className="mt-1 text-sm text-muted-foreground">{gap > 0 ? `还差 ${gap} 金币，升级消费也会减少当前金币。` : '目标已达成！守住余额直到结算。'}</p>
              </div>
              <div>
                <div className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-wider">
                  <span>账单进度</span><span>{Math.round(goalPercent)}%</span>
                </div>
                <Progress value={goalPercent} className="goal-progress" aria-label={`金币目标完成 ${Math.round(goalPercent)}%`} />
              </div>
            </div>

            {isBoss && (
              <div className="boss-rule" role="status">
                <Snowflake />
                <div><b>Boss 词条 · 严寒侵袭</b><span>自然生长 -56%，点击催生 -28%</span></div>
              </div>
            )}

            <div className="plant-grid">
              {plants.map((plant, index) => {
                const ripe = plant.growth >= 100;
                const selected = plant.id === selectedId;
                return (
                  <button
                    key={plant.id}
                    type="button"
                    onClick={() => tendPlant(index)}
                    className={`plant-card ${ripe ? 'is-ripe' : ''} ${selected ? 'is-selected' : ''}`}
                    aria-label={`第 ${index + 1} 株日光芽，成长 ${Math.round(plant.growth)}%，${ripe ? '点击收获' : '点击催生'}`}
                  >
                    <span className="plot-number">{String(index + 1).padStart(2, '0')}</span>
                    <Sprout aria-hidden="true" style={{ transform: `scale(${0.72 + plant.growth / 360})` }} />
                    <span className="plant-name">{ripe ? '点击收获 +14' : '日光芽'}</span>
                    <span className="growth-track"><i style={{ width: `${plant.growth}%` }} /></span>
                    <span className="growth-value">{Math.round(plant.growth)}%</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><MousePointer2 className="size-4" /> 点击催生 +{clickPower}%；范围内成熟植物会一并收获。</p>
              <div className="chapter-track" aria-label={`当前第 ${chapter} 章，共 5 章`}>
                {CHAPTERS.map((item, index) => <span key={item.name} className={index + 1 <= chapter ? 'active' : ''}>{index === 4 ? 'B' : index + 1}</span>)}
              </div>
            </div>
          </div>

          <aside className="upgrade-panel">
            <p className="eyebrow">工具台 / 前期</p>
            <h2 className="text-xl font-bold">把金币变成效率</h2>
            <p className="mb-4 mt-1 text-xs leading-relaxed text-muted-foreground">投资会降低本章持有金币。越接近结算，选择越要谨慎。</p>

            <div className="upgrade-row">
              <div className="upgrade-icon"><Droplets /></div>
              <div className="min-w-0 flex-1"><h3>强效浇灌 <em>Lv.{clickLevel}</em></h3><p>点击成长 +7%</p></div>
              <Button onClick={buyClickPower} disabled={coins < clickCost}>{clickCost} ◎</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><CopyPlus /></div>
              <div className="min-w-0 flex-1"><h3>扦插繁育 <em>{plants.length}/{MAX_PLANTS}</em></h3><p>复制当前选中植物</p></div>
              <Button onClick={cloneSelectedPlant} disabled={coins < cloneCost || plants.length >= MAX_PLANTS}>{plants.length >= MAX_PLANTS ? '已满' : `${cloneCost} ◎`}</Button>
            </div>
            <div className="upgrade-row">
              <div className="upgrade-icon"><Expand /></div>
              <div className="min-w-0 flex-1"><h3>扩散喷头 <em>Lv.{areaLevel}</em></h3><p>{areaLevel === 0 ? '催生并收获相邻植物' : areaLevel === 1 ? '催生/收获范围扩大到 2 格' : '已覆盖最大范围'}</p></div>
              <Button onClick={buyArea} disabled={coins < areaCost || areaLevel >= 2}>{areaLevel >= 2 ? '满级' : `${areaCost} ◎`}</Button>
            </div>

            <div className="manual-card">
              <Leaf />
              <div><b>当前选中：第 {plants.findIndex((plant) => plant.id === selectedId) + 1} 株</b><span>复制会保留它现在的生长度。</span></div>
            </div>
          </aside>
        </section>

        <output className={`notice ${notice ? 'is-visible' : ''}`} aria-live="polite">{notice}</output>
      </div>

      <AlertDialog open={status !== 'playing'}>
        <AlertDialogContent className="result-dialog">
          <AlertDialogHeader>
            <AlertDialogMedia className={status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary'}>
              {status === 'failed' ? <CircleAlert /> : <BadgeCheck />}
            </AlertDialogMedia>
            <AlertDialogTitle>
              {status === 'failed' ? '金币检测未通过' : status === 'complete' ? '前期阶段完成！' : `第 ${chapter} 章通过`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {status === 'failed'
                ? `结算需要 ${chapterData.goal} 金币，你持有 ${coins} 金币，还差 ${gap}。这次要更谨慎地安排升级。`
                : status === 'complete'
                  ? `你在严寒侵袭下守住了 ${chapterData.goal} 金币，已经完成点击阶段的全部五章。`
                  : `金币检测通过。下一章目标提高到 ${CHAPTERS[chapter].goal}，植物和升级会全部保留。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {status === 'chapter-clear' ? (
              <AlertDialogAction onClick={continueChapter}>进入第 {chapter + 1} 章</AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={restartGame}><RotateCcw /> 重新开始</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
