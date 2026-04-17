-- ============================================================
-- HiveTrack — Migration 004: Queen Rearing + Feeding v2
-- Safe to run multiple times (idempotent).
-- ============================================================

-- ─── Queen Rearings ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS queen_rearings (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id      UUID        NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grafting_date DATE       NOT NULL,
  rearing_type TEXT        NOT NULL CHECK (rearing_type IN ('natural', 'grafting', 'division')),
  status       TEXT        NOT NULL DEFAULT 'in_progress'
                           CHECK (status IN ('in_progress', 'success', 'failure')),
  notes        TEXT,
  photo_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS queen_rearing_stages (
  id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  queen_rearing_id   UUID        NOT NULL REFERENCES queen_rearings(id) ON DELETE CASCADE,
  stage_name         TEXT        NOT NULL,
  estimated_date     DATE        NOT NULL,
  alert_days_before  INTEGER     NOT NULL DEFAULT 1,
  completed          BOOLEAN     NOT NULL DEFAULT FALSE,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Feedings: collective feeding support ────────────────────────────────────

-- Make hive_id nullable so collective feedings can target an apiary instead
ALTER TABLE feedings ALTER COLUMN hive_id DROP NOT NULL;

ALTER TABLE feedings
  ADD COLUMN IF NOT EXISTS apiary_id            UUID   REFERENCES apiaries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS food_type            TEXT   CHECK (food_type IN ('light_syrup','heavy_syrup','protein_paste','candi')),
  ADD COLUMN IF NOT EXISTS quantity             DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS unit                 TEXT   CHECK (unit IN ('kg','L')),
  ADD COLUMN IF NOT EXISTS feeding_session_type TEXT   CHECK (feeding_session_type IN ('collective','individual')),
  ADD COLUMN IF NOT EXISTS notes                TEXT;

-- Either apiary_id or hive_id must be set
DO $$ BEGIN
  ALTER TABLE feedings
    ADD CONSTRAINT feedings_target_check
    CHECK (hive_id IS NOT NULL OR apiary_id IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Triggers ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TRIGGER update_queen_rearings_updated_at
    BEFORE UPDATE ON queen_rearings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE queen_rearings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE queen_rearing_stages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own queen rearings" ON queen_rearings;
CREATE POLICY "Users can CRUD own queen rearings" ON queen_rearings
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can CRUD own queen rearing stages" ON queen_rearing_stages;
CREATE POLICY "Users can CRUD own queen rearing stages" ON queen_rearing_stages
  FOR ALL USING (
    queen_rearing_id IN (SELECT id FROM queen_rearings WHERE user_id = auth.uid())
  );

-- Update feedings policy for apiary-level collective feedings
DROP POLICY IF EXISTS "Users can CRUD feedings in own hives" ON feedings;
DROP POLICY IF EXISTS "Users can CRUD feedings" ON feedings;
CREATE POLICY "Users can CRUD feedings" ON feedings
  FOR ALL USING (
    (hive_id   IS NOT NULL AND hive_id   IN (SELECT id FROM hives    WHERE user_id = auth.uid()))
    OR
    (apiary_id IS NOT NULL AND apiary_id IN (SELECT id FROM apiaries WHERE user_id = auth.uid()))
  );

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_queen_rearings_user_id    ON queen_rearings(user_id);
CREATE INDEX IF NOT EXISTS idx_queen_rearings_hive_id    ON queen_rearings(hive_id);
CREATE INDEX IF NOT EXISTS idx_qr_stages_rearing_id      ON queen_rearing_stages(queen_rearing_id);
CREATE INDEX IF NOT EXISTS idx_qr_stages_estimated_date  ON queen_rearing_stages(estimated_date);
CREATE INDEX IF NOT EXISTS idx_feedings_apiary_id        ON feedings(apiary_id);
CREATE INDEX IF NOT EXISTS idx_feedings_food_type        ON feedings(food_type);

-- ─── Grants (service role) ───────────────────────────────────────────────────

GRANT ALL ON queen_rearings       TO authenticated, service_role;
GRANT ALL ON queen_rearing_stages TO authenticated, service_role;
