CREATE TABLE IF NOT EXISTS frenzy_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL CHECK(length(player_name) BETWEEN 1 AND 16),
  score INTEGER NOT NULL CHECK(score >= 0 AND score <= 1000000000000),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_frenzy_scores_ranking
ON frenzy_scores(score DESC, created_at ASC);
--> statement-breakpoint
PRAGMA optimize;
