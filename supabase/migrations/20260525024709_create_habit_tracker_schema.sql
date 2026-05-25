/*
  # Create Habit Tracker Database Schema

  1. New Tables
    - `profiles` - User profile with preferences (theme, font size, pin lock)
      - `id` (uuid, primary key, references auth.users)
      - `theme` (text, default 'system') - 'light', 'dark', or 'system'
      - `accent_color` (text, default '#4F9D69') - Primary accent color
      - `font_size` (integer, default 16) - Base font size
      - `pin_lock` (text, nullable) - PIN for app lock
      - `biometric_enabled` (boolean, default false) - Fingerprint lock
      - `morning_reminder` (boolean, default false)
      - `evening_reminder` (boolean, default false)
      - `reminder_time_morning` (text, default '08:00')
      - `reminder_time_evening` (text, default '20:00')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `habits` - User habits to track
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text) - Habit name
      - `emoji` (text, default '✅') - Habit icon/emoji
      - `color` (text, default '#4F9D69') - Habit color indicator
      - `category` (text, default 'General') - Category for grouping
      - `priority` (text, default 'medium') - 'low', 'medium', 'high'
      - `is_archived` (boolean, default false) - Soft delete/archive
      - `reminder_enabled` (boolean, default false)
      - `reminder_time` (text, nullable)
      - `reminder_message` (text, nullable)
      - `target_per_day` (integer, default 1) - Times per day to complete
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `habit_completions` - Tracks when a habit is completed on a date
      - `id` (uuid, primary key)
      - `habit_id` (uuid, references habits)
      - `user_id` (uuid, references profiles)
      - `date` (date) - The date of completion
      - `count` (integer, default 1) - Number of completions that day
      - `created_at` (timestamp)

    - `daily_notes` - Notes attached to calendar days
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `date` (date) - The date the note belongs to
      - `content` (text) - Note content
      - `mood` (text, nullable) - Mood emoji or label
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - All policies restrict to authenticated users accessing their own data
    - habit_completions policies verify habit ownership via habits table
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text DEFAULT 'system',
  accent_color text DEFAULT '#4F9D69',
  font_size integer DEFAULT 16,
  pin_lock text,
  biometric_enabled boolean DEFAULT false,
  morning_reminder boolean DEFAULT false,
  evening_reminder boolean DEFAULT false,
  reminder_time_morning text DEFAULT '08:00',
  reminder_time_evening text DEFAULT '20:00',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text DEFAULT '✅',
  color text DEFAULT '#4F9D69',
  category text DEFAULT 'General',
  priority text DEFAULT 'medium',
  is_archived boolean DEFAULT false,
  reminder_enabled boolean DEFAULT false,
  reminder_time text,
  reminder_message text,
  target_per_day integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Habit completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON habit_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
  ON habit_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions"
  ON habit_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
  ON habit_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Daily notes table
CREATE TABLE IF NOT EXISTS daily_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  content text DEFAULT '',
  mood text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE daily_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
  ON daily_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON daily_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON daily_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON daily_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_notes_user_date ON daily_notes(user_id, date);

-- Unique constraint: one completion record per habit per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_completions_unique ON habit_completions(habit_id, date);

-- Unique constraint: one note per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_notes_unique ON daily_notes(user_id, date);
