/*
  # Add Leave Compensation System

  ## Overview
  Adds the ability for users to request compensation for unused vacation days instead of taking time off.

  ## 1. New Tables
  
  ### `compensation_requests`
  - `id` (uuid, primary key) - Unique request identifier
  - `user_id` (uuid, foreign key) - Reference to users table
  - `days_to_sell` (decimal) - Number of days user wants to sell
  - `rate_per_day` (decimal) - Hourly/daily compensation rate
  - `total_amount` (decimal) - Total compensation (days × rate)
  - `status` (text) - Request status: pending, approved, rejected, cancelled
  - `notes` (text) - Optional notes from user or admin
  - `created_at` (timestamptz) - Request submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Modified Tables

  ### `users`
  - Added `compensation_rate_per_day` (decimal) - Default rate for compensation (default: 100)
  
  ## 3. Security
  - Enable RLS on compensation_requests table
  - Users can only view and manage their own compensation requests
  - Users cannot approve/reject their own requests (admin function)

  ## 4. Important Notes
  - Default compensation rate: 100 per day (can be configured)
  - Users can only sell up to their remaining vacation days
  - Approved compensations should reduce remaining_vacation_days
  - System tracks complete history of compensation requests
*/

-- Add compensation rate to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'compensation_rate_per_day'
  ) THEN
    ALTER TABLE users ADD COLUMN compensation_rate_per_day decimal(10,2) NOT NULL DEFAULT 100;
  END IF;
END $$;

-- Create compensation_requests table
CREATE TABLE IF NOT EXISTS compensation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  days_to_sell decimal(5,2) NOT NULL,
  rate_per_day decimal(10,2) NOT NULL,
  total_amount decimal(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_compensation_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT positive_days_to_sell CHECK (days_to_sell > 0),
  CONSTRAINT positive_rate CHECK (rate_per_day > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_compensation_requests_user_id ON compensation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_compensation_requests_status ON compensation_requests(status);
CREATE INDEX IF NOT EXISTS idx_compensation_requests_created_at ON compensation_requests(created_at);

-- Enable Row Level Security
ALTER TABLE compensation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compensation_requests table
CREATE POLICY "Users can view own compensation requests"
  ON compensation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own compensation requests"
  ON compensation_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending compensation requests"
  ON compensation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Users can cancel own compensation requests"
  ON compensation_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Trigger to automatically update updated_at
CREATE TRIGGER update_compensation_requests_updated_at
  BEFORE UPDATE ON compensation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();