-- ============================================================
-- AirPulse — Supabase Migration 001
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Main table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS air_quality_stations (
  station_id         TEXT PRIMARY KEY,
  name               TEXT        NOT NULL,
  lat                DOUBLE PRECISION NOT NULL,
  lon                DOUBLE PRECISION NOT NULL,
  aqi                INTEGER     NOT NULL,
  category           TEXT        NOT NULL,
  dominant_pollutant TEXT,
  pm25               REAL,
  pm10               REAL,
  o3                 REAL,
  no2                REAL,
  so2                REAL,
  co                 REAL,
  raw_pollutants     JSONB       NOT NULL DEFAULT '{}',
  fetched_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at         TIMESTAMPTZ NOT NULL,

  -- Constraints
  CONSTRAINT aqi_range CHECK (aqi >= 0 AND aqi <= 999)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
-- Spatial bounding-box queries
CREATE INDEX IF NOT EXISTS idx_stations_lat  ON air_quality_stations (lat);
CREATE INDEX IF NOT EXISTS idx_stations_lon  ON air_quality_stations (lon);
CREATE INDEX IF NOT EXISTS idx_stations_coords ON air_quality_stations (lat, lon);

-- AQI queries (leaderboards, sorting)
CREATE INDEX IF NOT EXISTS idx_stations_aqi ON air_quality_stations (aqi DESC);

-- Cache expiry checks (most frequent query)
CREATE INDEX IF NOT EXISTS idx_stations_expiry ON air_quality_stations (expires_at);

-- Name search
CREATE INDEX IF NOT EXISTS idx_stations_name_trgm ON air_quality_stations USING gin (name gin_trgm_ops);

-- ── Cleanup function ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION delete_expired_stations()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM air_quality_stations WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ── Optional: pg_cron scheduled cleanup (if enabled in your Supabase project) ─
-- Enable via: Dashboard → Database → Extensions → pg_cron
-- SELECT cron.schedule(
--   'airpulse-cleanup',           -- job name
--   '0 * * * *',                  -- every hour
--   'SELECT delete_expired_stations()'
-- );

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE air_quality_stations ENABLE ROW LEVEL SECURITY;

-- Allow public reads (needed for client-side queries with anon key)
CREATE POLICY "Allow public read"
  ON air_quality_stations FOR SELECT
  USING (true);

-- Only service role can write (API routes use SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role insert"
  ON air_quality_stations FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role upsert"
  ON air_quality_stations FOR UPDATE
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role delete"
  ON air_quality_stations FOR DELETE
  USING (auth.role() = 'service_role');

-- ── Verify setup ──────────────────────────────────────────────────────────────
-- Run this to check everything is created correctly:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'air_quality_stations'
-- ORDER BY ordinal_position;
