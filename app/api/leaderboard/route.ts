import { env } from 'cloudflare:workers';

import {
  CREATE_LEADERBOARD_INDEX,
  CREATE_LEADERBOARD_TABLE,
} from '@/db/schema';

export const dynamic = 'force-dynamic';

type ScoreRow = {
  id: number;
  playerName: string;
  score: number;
  createdAt: string;
};

function database() {
  return (env as unknown as { DB: D1Database }).DB;
}

async function ensureSchema(db: D1Database) {
  await db.batch([
    db.prepare(CREATE_LEADERBOARD_TABLE),
    db.prepare(CREATE_LEADERBOARD_INDEX),
  ]);
}

async function topScores(db: D1Database) {
  const result = await db
    .prepare(
      `SELECT
        id,
        player_name AS playerName,
        score,
        created_at AS createdAt
      FROM frenzy_scores
      ORDER BY score DESC, created_at ASC
      LIMIT 10`,
    )
    .all<ScoreRow>();
  return result.results;
}

export async function GET() {
  try {
    const db = database();
    await ensureSchema(db);
    return Response.json(
      { entries: await topScores(db) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: '排行榜暂时不可用' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      playerName?: unknown;
      score?: unknown;
    };
    const playerName =
      typeof payload.playerName === 'string'
        ? payload.playerName.replace(/[\u0000-\u001f\u007f]/g, '').trim()
        : '';
    const score =
      typeof payload.score === 'number' ? Math.floor(payload.score) : NaN;

    if (
      playerName.length < 1 ||
      playerName.length > 16 ||
      !Number.isSafeInteger(score) ||
      score < 0 ||
      score > 1_000_000_000_000
    ) {
      return Response.json({ error: '昵称或成绩无效' }, { status: 400 });
    }

    const db = database();
    await ensureSchema(db);
    await db
      .prepare(
        'INSERT INTO frenzy_scores (player_name, score) VALUES (?, ?)',
      )
      .bind(playerName, score)
      .run();

    return Response.json(
      { entries: await topScores(db) },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return Response.json({ error: '成绩提交失败' }, { status: 503 });
  }
}
