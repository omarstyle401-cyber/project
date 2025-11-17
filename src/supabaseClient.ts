import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  full_name: string
  annual_vacation_days: number
  remaining_vacation_days: number
  created_at: string
  updated_at: string
}

export type VacationRequest = {
  id: string
  user_id: string
  start_date: string
  end_date: string
  days_requested: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason: string
  created_at: string
  updated_at: string
}

export type CompensationRequest = {
  id: string
  user_id: string
  days_to_sell: number
  rate_per_day: number
  total_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  notes: string
  created_at: string
  updated_at: string
}
