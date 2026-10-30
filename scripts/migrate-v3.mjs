-- Migration v3: Add missing columns to existing tables
-- Run: node scripts/migrate.mjs (add these to the migrate script)

-- Contact messages: add reply tracking and DOB
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS response TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Members: ensure date_of_birth exists
ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Payments: ensure notes column exists
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Class attendance: ensure all columns exist
ALTER TABLE class_attendance ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE class_attendance ADD COLUMN IF NOT EXISTS recorded_by INTEGER;
