import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import './CompensationRequestForm.css'

interface CompensationRequestFormProps {
  userId: string
  remainingDays: number
  onSubmit: () => void
  onCancel: () => void
}

export default function CompensationRequestForm({
  userId,
  remainingDays,
  onSubmit,
  onCancel,
}: CompensationRequestFormProps) {
  const [daysToSell, setDaysToSell] = useState('')
  const [ratePerDay, setRatePerDay] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [defaultRate, setDefaultRate] = useState(0)

  useEffect(() => {
    fetchDefaultRate()
  }, [userId])

  const fetchDefaultRate = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('compensation_rate_per_day')
        .eq('id', userId)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (data?.compensation_rate_per_day) {
        setDefaultRate(data.compensation_rate_per_day)
        setRatePerDay(data.compensation_rate_per_day.toString())
      }
    } catch (error: any) {
      console.error('Error fetching compensation rate:', error.message)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!daysToSell || !ratePerDay) {
      setError('Please fill in all required fields')
      return
    }

    const days = parseFloat(daysToSell)
    const rate = parseFloat(ratePerDay)

    if (days <= 0 || isNaN(days)) {
      setError('Days to sell must be a positive number')
      return
    }

    if (rate <= 0 || isNaN(rate)) {
      setError('Rate per day must be a positive number')
      return
    }

    if (days > remainingDays) {
      setError(`You only have ${remainingDays} days available to sell`)
      return
    }

    try {
      setLoading(true)

      const totalAmount = days * rate

      const { error: insertError } = await supabase
        .from('compensation_requests')
        .insert([
          {
            user_id: userId,
            days_to_sell: days,
            rate_per_day: rate,
            total_amount: totalAmount,
            status: 'pending',
            notes: notes,
          },
        ])

      if (insertError) throw insertError

      setDaysToSell('')
      setRatePerDay(defaultRate.toString())
      setNotes('')
      onSubmit()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = daysToSell && ratePerDay
    ? (parseFloat(daysToSell) * parseFloat(ratePerDay)).toFixed(2)
    : '0.00'

  return (
    <div className="compensation-request-form-card">
      <h3>Request Leave Compensation</h3>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="daysToSell">Days to Sell</label>
            <div className="input-group">
              <input
                id="daysToSell"
                type="number"
                step="0.5"
                min="0.5"
                max={remainingDays}
                placeholder="0.5"
                value={daysToSell}
                onChange={(e) => setDaysToSell(e.target.value)}
                disabled={loading}
              />
              <span className="input-hint">Max: {remainingDays} days</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ratePerDay">Rate per Day</label>
            <div className="input-group">
              <span className="currency-symbol">$</span>
              <input
                id="ratePerDay"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={ratePerDay}
                onChange={(e) => setRatePerDay(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {daysToSell && ratePerDay && (
          <div className="calculation-summary">
            <div className="calculation-row">
              <span className="calc-label">{daysToSell} days ×</span>
              <span className="calc-operator">$</span>
              <span className="calc-value">{ratePerDay} per day</span>
            </div>
            <div className="calculation-result">
              <span className="result-label">Total Compensation:</span>
              <span className="result-amount">${totalAmount}</span>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="notes">Additional Notes (Optional)</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional information about this compensation request..."
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
            {loading ? 'Submitting...' : 'Submit Compensation Request'}
          </button>
        </div>
      </form>
    </div>
  )
}
