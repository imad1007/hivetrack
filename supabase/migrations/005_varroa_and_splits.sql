-- ============================================================
-- HiveTrack — Migration 005: Varroa Monitoring + Hive Splits
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ─── Varroa Checks ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS varroa_checks (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id       UUID        NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  check_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  method        TEXT        NOT NULL CHECK (method IN ('alcohol_wash','sugar_roll','drone_brood','sticky_board')),
  mites_counted INTEGER     NOT NULL CHECK (mites_counted >= 0),
  bees_sampled  INTEGER     NOT NULL DEFAULT 100 CHECK (bees_sampled > 0),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Hive Splits ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hive_splits (
  id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_hive_id UUID        NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  new_hive_id    UUID        REFERENCES hives(id) ON DELETE SET NULL,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  split_date     DATE        NOT NULL DEFAULT CURRENT_DATE,
  split_type     TEXT        NOT NULL DEFAULT 'walk_away'
                             CHECK (split_type IN ('walk_away','artificial_swarm','nucleus','cut_down')),
  queen_status   TEXT        NOT NULL DEFAULT 'queen_cell'
                             CHECK (queen_status IN ('queen_cell','virgin_queen','mated_queen','queenless')),
  outcome        TEXT        CHECK (outcome IN ('success','failure','merged_back')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE varroa_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hive_splits   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own varroa checks" ON varroa_checks;
CREATE POLICY "Users can CRUD own varroa checks" ON varroa_checks
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own hive splits" ON hive_splits;
CREATE POLICY "Users can CRUD own hive splits" ON hive_splits
  FOR ALL USING (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_varroa_checks_hive_id  ON varroa_checks(hive_id);
CREATE INDEX IF NOT EXISTS idx_varroa_checks_user_id  ON varroa_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_varroa_checks_date     ON varroa_checks(check_date DESC);
CREATE INDEX IF NOT EXISTS idx_hive_splits_source     ON hive_splits(source_hive_id);
CREATE INDEX IF NOT EXISTS idx_hive_splits_user_id    ON hive_splits(user_id);

-- ─── Grants ──────────────────────────────────────────────────────────────────

GRANT ALL ON varroa_checks TO authenticated, service_role;
GRANT ALL ON hive_splits   TO authenticated, service_role;
