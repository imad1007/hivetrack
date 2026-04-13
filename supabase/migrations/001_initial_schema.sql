-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro', 'scale')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ─── Apiaries ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  altitude DOUBLE PRECISION,
  exposure TEXT,
  environment_type TEXT CHECK (environment_type IN ('urban','suburban','rural','forest','agricultural','mountain')),
  water_nearby BOOLEAN DEFAULT FALSE,
  polygon_geojson JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Hives ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apiary_id UUID NOT NULL REFERENCES apiaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'langstroth' CHECK (type IN ('langstroth','dadant','warré','top-bar','other')),
  color_code TEXT,
  qr_code_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','dead','sold')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(qr_code_token)
);

-- ─── Queens ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  mark_color TEXT NOT NULL,
  mark_year INTEGER NOT NULL,
  breed TEXT,
  origin TEXT,
  introduced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','missing','replaced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Visits ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  template_id UUID,
  weather_json JSONB,
  behavior TEXT CHECK (behavior IN ('calm','nervous','aggressive')),
  brood_frames INTEGER,
  stores_frames INTEGER,
  pollen_frames INTEGER,
  space_needed BOOLEAN,
  queen_seen BOOLEAN,
  queen_laying BOOLEAN,
  notes TEXT,
  photos_urls TEXT[] DEFAULT '{}',
  swarm_signs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Treatments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  amm_code TEXT,
  dosage TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  withdrawal_days INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Feedings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('syrup_1_1','syrup_2_1','fondant','pollen_sub','other')),
  quantity_liters DOUBLE PRECISION,
  feeding_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Swarms ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS swarms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hive_id UUID NOT NULL REFERENCES hives(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  queen_cells_found BOOLEAN DEFAULT FALSE,
  estimated_weight DOUBLE PRECISION,
  origin TEXT,
  destination_hive_id UUID REFERENCES hives(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Harvests ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS harvests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apiary_id UUID NOT NULL REFERENCES apiaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL,
  flora_type TEXT,
  total_weight_kg DOUBLE PRECISION NOT NULL,
  humidity_percent DOUBLE PRECISION,
  avg_yield_per_hive DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Queen Lines ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS queen_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  breed TEXT NOT NULL,
  description TEXT,
  traits_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Visit Templates ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields_config_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Sync Queue ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT','UPDATE','DELETE')),
  record_id UUID NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Updated At Trigger ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_apiaries_updated_at BEFORE UPDATE ON apiaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hives_updated_at BEFORE UPDATE ON hives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_treatments_updated_at BEFORE UPDATE ON treatments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_harvests_updated_at BEFORE UPDATE ON harvests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── Auto-create Profile on User Signup ──────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE apiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hives ENABLE ROW LEVEL SECURITY;
ALTER TABLE queens ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedings ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE queen_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Apiaries
CREATE POLICY "Users can CRUD own apiaries" ON apiaries FOR ALL USING (auth.uid() = user_id);

-- Hives
CREATE POLICY "Users can CRUD own hives" ON hives FOR ALL USING (auth.uid() = user_id);

-- Queens (access via hive ownership)
CREATE POLICY "Users can CRUD queens in own hives" ON queens FOR ALL
  USING (hive_id IN (SELECT id FROM hives WHERE user_id = auth.uid()));

-- Visits
CREATE POLICY "Users can CRUD own visits" ON visits FOR ALL USING (auth.uid() = user_id);

-- Treatments (access via hive ownership)
CREATE POLICY "Users can CRUD treatments in own hives" ON treatments FOR ALL
  USING (hive_id IN (SELECT id FROM hives WHERE user_id = auth.uid()));

-- Feedings (access via hive ownership)
CREATE POLICY "Users can CRUD feedings in own hives" ON feedings FOR ALL
  USING (hive_id IN (SELECT id FROM hives WHERE user_id = auth.uid()));

-- Swarms (access via hive ownership)
CREATE POLICY "Users can CRUD swarms in own hives" ON swarms FOR ALL
  USING (hive_id IN (SELECT id FROM hives WHERE user_id = auth.uid()));

-- Harvests
CREATE POLICY "Users can CRUD own harvests" ON harvests FOR ALL USING (auth.uid() = user_id);

-- Queen Lines
CREATE POLICY "Users can CRUD own queen lines" ON queen_lines FOR ALL USING (auth.uid() = user_id);

-- Visit Templates
CREATE POLICY "Users can CRUD own visit templates" ON visit_templates FOR ALL USING (auth.uid() = user_id);

-- Sync Queue
CREATE POLICY "Users can CRUD own sync queue" ON sync_queue FOR ALL USING (auth.uid() = user_id);

-- ─── QR Code Public Lookup (service role only) ───────────────────────────────
-- Allow public read of hive by qr_code_token (used by scan page)
CREATE POLICY "Public can read hive by QR token" ON hives
  FOR SELECT USING (true);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_apiaries_user_id ON apiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_hives_apiary_id ON hives(apiary_id);
CREATE INDEX IF NOT EXISTS idx_hives_user_id ON hives(user_id);
CREATE INDEX IF NOT EXISTS idx_hives_qr_token ON hives(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_visits_hive_id ON visits(hive_id);
CREATE INDEX IF NOT EXISTS idx_visits_visited_at ON visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_treatments_hive_id ON treatments(hive_id);
CREATE INDEX IF NOT EXISTS idx_feedings_hive_id ON feedings(hive_id);
CREATE INDEX IF NOT EXISTS idx_harvests_apiary_id ON harvests(apiary_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced_at ON sync_queue(synced_at) WHERE synced_at IS NULL;
