import { useState } from 'react'
import { supabase } from '../supabaseClient'
import './VacationRequestForm.css'

interface VacationRequestFormProps {
  userId: string
  remainingDays: number
  onSubmit: () => void
  onCancel: () => void
}

export default function VacationRequestForm({
  userId,
  remainingDays,
  onSubmit,
  onCancel,
}: VacationRequestFormProps) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateBusinessDays = (start: string, end: string): number => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    let count = 0

    const current = new Date(startDate)
    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!startDate || !endDate) {
      setError('Please select both start and end dates')
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (end < start) {
      setError('End date must be after start date')
      return
    }

    const daysRequested = calculateBusinessDays(startDate, endDate)

    if (daysRequested > remainingDays) {
      setError(`You only have ${remainingDays} days available`)
      return
    }

    if (daysRequested === 0) {
      setError('Please select at least one business day')
      return
    }

    try {
      setLoading(true)

      const { error: insertError } = await supabase
        .from('vacation_requests')
        .insert([
          {
            user_id: userId,
            start_date: startDate,
            end_date: endDate,
            days_requested: daysRequested,
            status: 'pending',
            reason: reason,
          },
        ])

      if (insertError) throw insertError

      setStartDate('')
      setEndDate('')
      setReason('')
      onSubmit()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const daysRequested = startDate && endDate ? calculateBusinessDays(startDate, endDate) : 0

  return (
    <div className="vacation-request-form-card">
      <h3>Request Time Off</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        {daysRequested > 0 && (
          <div className="days-info">
            <span className="days-label">Business Days:</span>
            <span className="days-value">{daysRequested}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="reason">Reason (Optional)</label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter a reason for your time off..."
            rows={3}
            disabled={loading}
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
