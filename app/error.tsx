'use client';

import { RotateCcw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <section className="game-panel max-w-md text-center" role="alert">
        <TriangleAlert className="mx-auto mb-4 size-10 text-destructive" />
        <h1 className="text-2xl font-black">温室暂时出了点状况</h1>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">
          本局状态没有继续运行。点击下方按钮即可安全重新载入游戏。
        </p>
        <Button onClick={reset} size="lg">
          <RotateCcw /> 重新载入
        </Button>
      </section>
    </main>
  );
}
