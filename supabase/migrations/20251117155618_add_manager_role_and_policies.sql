/*
  # Add Manager Role and Policies

  ## Overview
  Adds manager role functionality allowing managers to view and approve/reject requests from all users.

  ## 1. Modified Tables

  ### `users`
  - Added `role` (text) - User role: 'employee' or 'manager' (default: 'employee')

  ## 2. Security Updates
  - Managers can view all users and their requests
  - Managers can approve/reject vacation and compensation requests
  - Employees maintain existing permissions (own data only)

  ## 3. Important Notes
  - Default role for new users: 'employee'
  - Managers have read access to all user data
  - Only managers can change request statuses to 'approved' or 'rejected'
  - Employees can only cancel their own pending requests
*/

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'manager'));

-- Drop existing policies to recreate them with manager access
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view own vacation requests" ON vacation_requests;
DROP POLICY IF EXISTS "Users can update own vacation requests" ON vacation_requests;
DROP POLICY IF EXISTS "Users can view own compensation requests" ON compensation_requests;
DROP POLICY IF EXISTS "Users can update own pending compensation requests" ON compensation_requests;

-- Users table policies with manager access
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

-- Vacation requests policies with manager access
CREATE POLICY "Users can view own vacation requests"
  ON vacation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all vacation requests"
  ON vacation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

CREATE POLICY "Users can update own vacation requests"
  ON vacation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Managers can approve or reject vacation requests"
  ON vacation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

-- Compensation requests policies with manager access
CREATE POLICY "Users can view own compensation requests"
  ON compensation_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Managers can view all compensation requests"
  ON compensation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );

CREATE POLICY "Users can update own pending compensation requests"
  ON compensation_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

CREATE POLICY "Managers can approve or reject compensation requests"
  ON compensation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'manager'
    )
  );