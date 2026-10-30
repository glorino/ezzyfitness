/**
 * Ezzy Fitness — schema migration for Neon PostgreSQL.
 * Idempotent: safe to run repeatedly (`npm run db:migrate`).
 * Tuned for the Neon FREE plan (small footprint, no extensions required).
 */
import pg from "pg";
import { dbConfig } from "./lib/env.mjs";

const { Pool } = pg;

const DDL = `
-- =========================================================
-- MEDIA (uploads live in Neon itself — no paid blob service)
-- =========================================================
CREATE TABLE IF NOT EXISTS media (
  id            BIGSERIAL PRIMARY KEY,
  kind          TEXT NOT NULL DEFAULT 'misc',
  name          TEXT NOT NULL,
  mime          TEXT NOT NULL DEFAULT 'image/jpeg',
  size_bytes    INTEGER NOT NULL,
  data          BYTEA NOT NULL,
  width         INTEGER,
  height        INTEGER,
  created_by    BIGINT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_created_idx ON media (created_at DESC);
CREATE INDEX IF NOT EXISTS media_kind_idx ON media (kind);

-- =========================================================
-- STAFF & MEMBERS
-- =========================================================
CREATE TABLE IF NOT EXISTS users (
  id              BIGSERIAL PRIMARY KEY,
  full_name       TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member'
                  CHECK (role IN ('admin','trainer','frontdesk','member')),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','suspended')),
  avatar_media_id BIGINT REFERENCES media(id) ON DELETE SET NULL,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uidx ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_role_idx ON users (role);

CREATE TABLE IF NOT EXISTS plans (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  tagline       TEXT,
  price_ngn     INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  features      JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_popular    BOOLEAN NOT NULL DEFAULT false,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trainers (
  user_id           BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio               TEXT,
  specialties       TEXT[] NOT NULL DEFAULT '{}',
  certifications    TEXT[] NOT NULL DEFAULT '{}',
  experience_years  INTEGER NOT NULL DEFAULT 0,
  instagram         TEXT,
  is_visible        BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  user_id         BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  membership_no   TEXT NOT NULL UNIQUE,
  plan_id         BIGINT REFERENCES plans(id) ON DELETE SET NULL,
  gender          TEXT CHECK (gender IN ('male','female','other')),
  date_of_birth   DATE,
  goals           TEXT,
  emergency_name  TEXT,
  emergency_phone TEXT,
  weight_kg       NUMERIC(5,1),
  height_cm       NUMERIC(5,1),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','expired','frozen','inactive')),
  joined_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  expires_at      DATE,
  notes           TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS members_status_idx ON members (status);
CREATE INDEX IF NOT EXISTS members_expiry_idx ON members (expires_at);

-- =========================================================
-- CLASSES, ATTENDANCE, CHECK-INS, PAYMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS classes (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL DEFAULT 'General',
  description   TEXT,
  trainer_id    BIGINT REFERENCES users(id) ON DELETE SET NULL,
  day_of_week   INTEGER NOT NULL DEFAULT 0 CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL DEFAULT '06:00',
  end_time      TIME NOT NULL DEFAULT '07:00',
  capacity      INTEGER NOT NULL DEFAULT 20,
  location      TEXT NOT NULL DEFAULT 'Main Floor',
  intensity     TEXT NOT NULL DEFAULT 'Medium'
                CHECK (intensity IN ('Low','Medium','High')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS classes_day_idx ON classes (day_of_week, start_time);
CREATE INDEX IF NOT EXISTS classes_trainer_idx ON classes (trainer_id);

CREATE TABLE IF NOT EXISTS class_attendance (
  id            BIGSERIAL PRIMARY KEY,
  class_id      BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  status        TEXT NOT NULL DEFAULT 'present'
                CHECK (status IN ('present','absent','late','cancelled')),
  checked_in_at TIMESTAMPTZ,
  notes         TEXT,
  recorded_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, member_id, session_date)
);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON class_attendance (session_date DESC);
CREATE INDEX IF NOT EXISTS attendance_member_idx ON class_attendance (member_id);

CREATE TABLE IF NOT EXISTS check_ins (
  id          BIGSERIAL PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  method      TEXT NOT NULL DEFAULT 'frontdesk'
              CHECK (method IN ('frontdesk','trainer','self')),
  note        TEXT,
  created_by  BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS checkins_date_idx ON check_ins (created_at DESC);
CREATE INDEX IF NOT EXISTS checkins_member_idx ON check_ins (member_id);

CREATE TABLE IF NOT EXISTS payments (
  id          BIGSERIAL PRIMARY KEY,
  member_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id     BIGINT REFERENCES plans(id) ON DELETE SET NULL,
  amount_ngn  INTEGER NOT NULL,
  method      TEXT NOT NULL DEFAULT 'cash'
              CHECK (method IN ('cash','transfer','pos','card','other')),
  status      TEXT NOT NULL DEFAULT 'paid'
              CHECK (status IN ('paid','pending','failed','refunded')),
  reference   TEXT,
  period_from DATE,
  period_to   DATE,
  notes       TEXT,
  recorded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS payments_date_idx ON payments (paid_at DESC);
CREATE INDEX IF NOT EXISTS payments_member_idx ON payments (member_id);

-- =========================================================
-- SITE FORMS, AUDIT, SETTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  date_of_birth DATE,
  subject     TEXT,
  message     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new'
              CHECK (status IN ('new','read','replied')),
  response    TEXT,
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_status_idx ON contact_messages (status, created_at DESC);

-- Alterations for existing tables (safe with IF NOT EXISTS)
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth DATE;

CREATE TABLE IF NOT EXISTS activity_log (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT,
  detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_date_idx ON activity_log (created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function migrate() {
  const pool = new Pool(dbConfig());
  const client = await pool.connect();
  const started = Date.now();
  try {
    console.log("\n  Ezzy Fitness → Neon migration\n  --------------------------------");
    const ver = await client.query("SELECT version()");
    console.log(`  ✓ Connected: ${ver.rows[0].version.split(" ").slice(0, 2).join(" ")}`);

    // Run each statement separately so a single failure is easy to locate.
    const statements = DDL.split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    let ok = 0;
    for (const stmt of statements) {
      await client.query(stmt);
      ok += 1;
    }
    console.log(`  ✓ Schema applied (${ok} statements, all idempotent)`);

    const tables = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
       ORDER BY table_name`
    );
    console.log(`  ✓ Tables (${tables.rows.length}): ${tables.rows.map((r) => r.table_name).join(", ")}`);

    const size = await client.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`
    );
    console.log(`  ✓ Database size: ${size.rows[0].db_size} (free plan budget: 512 MB)\n`);
    console.log(`  Done in ${Date.now() - started}ms. Next: npm run db:seed\n`);
  } catch (err) {
    console.error(`\n  [✗] Migration failed: ${err.message}\n`);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
