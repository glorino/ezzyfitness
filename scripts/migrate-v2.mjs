-- Migration: Add missing tables for full functionality
-- Run: node scripts/migrate.mjs

-- Server-side sessions for revocation
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions(token_hash);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_token_idx ON password_resets(token);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets(user_id);

-- Notifications system
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info', -- info, warning, success, error
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS notifications_created_idx ON notifications(created_at DESC);

-- Recurring subscriptions (Flutterwave)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(user_id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES plans(id),
  flutterwave_subscription_id TEXT,
  status TEXT DEFAULT 'active', -- active, cancelled, expired, paused
  amount_ngn INTEGER NOT NULL,
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, quarterly, yearly
  next_billing_date DATE,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscriptions_member_idx ON subscriptions(member_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status, next_billing_date);

-- Workout tracking
CREATE TABLE IF NOT EXISTS workout_logs (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(user_id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC(5,2),
  duration_minutes INTEGER,
  notes TEXT,
  logged_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS workout_logs_member_idx ON workout_logs(member_id, logged_at DESC);

-- Body measurements
CREATE TABLE IF NOT EXISTS body_measurements (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL REFERENCES members(user_id) ON DELETE CASCADE,
  weight_kg NUMERIC(5,2),
  height_cm NUMERIC(5,2),
  body_fat_percentage NUMERIC(4,2),
  muscle_mass_kg NUMERIC(5,2),
  chest_cm NUMERIC(5,2),
  waist_cm NUMERIC(5,2),
  hips_cm NUMERIC(5,2),
  bicep_cm NUMERIC(5,2),
  thigh_cm NUMERIC(5,2),
  notes TEXT,
  measured_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS measurements_member_idx ON body_measurements(member_id, measured_at DESC);

-- AI chat history
CREATE TABLE IF NOT EXISTS ai_interactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT,
  model TEXT DEFAULT 'claude-3-5-sonnet',
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_interactions_user_idx ON ai_interactions(user_id, created_at DESC);

-- Class reservations/bookings
CREATE TABLE IF NOT EXISTS class_reservations (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id INTEGER NOT NULL REFERENCES members(user_id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, waitlist, attended
  reserved_at TIMESTAMPTZ DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(class_id, member_id, session_date)
);
CREATE INDEX IF NOT EXISTS reservations_class_idx ON class_reservations(class_id, session_date);
CREATE INDEX IF NOT EXISTS reservations_member_idx ON class_reservations(member_id, session_date DESC);

-- Feedback/reviews
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'general', -- general, class, trainer, facility
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  anonymous BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_created_idx ON feedback(created_at DESC);

-- Revenue reports cache
CREATE TABLE IF NOT EXISTS revenue_reports (
  id SERIAL PRIMARY KEY,
  report_date DATE NOT NULL,
  period_type TEXT NOT NULL, -- daily, weekly, monthly, yearly
  total_revenue INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  renewals INTEGER DEFAULT 0,
  avg_transaction_value INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_date, period_type)
);
CREATE INDEX IF NOT EXISTS revenue_reports_date_idx ON revenue_reports(report_date DESC);

-- System audit trail (enhanced)
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info';
