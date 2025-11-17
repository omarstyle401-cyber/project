import { useState, useEffect } from 'react'
import { supabase, type User, type VacationRequest, type CompensationRequest } from '../supabaseClient'
import type { User as AuthUser } from '@supabase/supabase-js'
import VacationBalance from './VacationBalance'
import VacationRequestForm from './VacationRequestForm'
import CompensationRequestForm from './CompensationRequestForm'
import VacationHistory from './VacationHistory'
import './Dashboard.css'

interface DashboardProps {
  user: AuthUser
}

export default function Dashboard({ user }: DashboardProps) {
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([])
  const [compensationRequests, setCompensationRequests] = useState<CompensationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showVacationForm, setShowVacationForm] = useState(false)
  const [showCompensationForm, setShowCompensationForm] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      setUserProfile(profile)

      const { data: requests, error: requestsError } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError
      setVacationRequests(requests || [])

      const { data: compensations, error: compensationsError } = await supabase
        .from('compensation_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (compensationsError) throw compensationsError
      setCompensationRequests(compensations || [])
    } catch (error: any) {
      console.error('Error fetching user data:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleVacationSubmit = async () => {
    setShowVacationForm(false)
    await fetchUserData()
  }

  const handleCompensationSubmit = async () => {
    setShowCompensationForm(false)
    await fetchUserData()
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="error-container">
        <p>Unable to load profile data</p>
        <button onClick={handleSignOut} className="btn-secondary">Sign Out</button>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Welcome back, {userProfile.full_name}</h1>
            <p className="header-email">{userProfile.email}</p>
          </div>
          <button onClick={handleSignOut} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <VacationBalance
          annualDays={userProfile.annual_vacation_days}
          remainingDays={userProfile.remaining_vacation_days}
        />

        <div className="actions-section">
          <button
            onClick={() => {
              setShowVacationForm(!showVacationForm)
              setShowCompensationForm(false)
            }}
            className="btn-primary"
          >
            {showVacationForm ? 'Cancel' : 'Request Time Off'}
          </button>
          <button
            onClick={() => {
              setShowCompensationForm(!showCompensationForm)
              setShowVacationForm(false)
            }}
            className="btn-primary"
          >
            {showCompensationForm ? 'Cancel' : 'Sell Leave Days'}
          </button>
        </div>

        {showVacationForm && (
          <VacationRequestForm
            userId={user.id}
            remainingDays={userProfile.remaining_vacation_days}
            onSubmit={handleVacationSubmit}
            onCancel={() => setShowVacationForm(false)}
          />
        )}

        {showCompensationForm && (
          <CompensationRequestForm
            userId={user.id}
            remainingDays={userProfile.remaining_vacation_days}
            onSubmit={handleCompensationSubmit}
            onCancel={() => setShowCompensationForm(false)}
          />
        )}

        <VacationHistory
          requests={vacationRequests}
          compensationRequests={compensationRequests}
          onUpdate={fetchUserData}
        />
      </main>
    </div>
  )
}
