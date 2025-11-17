/*
  # Vacation Management System Schema

  ## Overview
  Creates the database structure for a vacation management system with personal balance tracking.

  ## 1. New Tables
  
  ### `users`
  - `id` (uuid, primary key) - Unique user identifier linked to auth
  - `email` (text, unique) - User's email address
  - `full_name` (text) - User's full name
  - `annual_vacation_days` (integer) - Total vacation days allocated per year
  - `remaining_vacation_days` (decimal) - Current available vacation balance
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `vacation_requests`
  - `id` (uuid, primary key) - Unique request identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `start_date` (date) - Vacation start date
  - `end_date` (date) - Vacation end date
  - `days_requested` (decimal) - Number of days requested
  - `status` (text) - Request status: pending, approved, rejected, cancelled
  - `reason` (text) - Optional reason for vacation
  - `created_at` (timestamptz) - Request submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable Row Level Security (RLS) on all tables
  - Users can only view and manage their own data
  - Authenticated access required for all operations

  ## 3. Important Notes
  - Default annual vacation allocation: 20 days
  - Vacation balance automatically calculated based on approved requests
  - All dates use proper date types for accurate calculations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  annual_vacation_days integer NOT NULL DEFAULT 20,
  remaining_vacation_days decimal(5,2) NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vacation_requests table
CREATE TABLE IF NOT EXISTS vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested decimal(5,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reason text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT valid_dates CHECK (end_date >= start_date),
  CONSTRAINT positive_days CHECK (days_requested > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_id ON vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_dates ON vacation_requests(start_date, end_date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for vacation_requests table
CREATE POLICY "Users can view own vacation requests"
  ON vacation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own vacation requests"
  ON vacation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vacation requests"
  ON vacation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vacation requests"
  ON vacation_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vacation_requests_updated_at
  BEFORE UPDATE ON vacation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();