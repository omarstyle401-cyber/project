import { useState } from 'react'
import { supabase, type VacationRequest, type CompensationRequest } from '../supabaseClient'
import './VacationHistory.css'

interface VacationHistoryProps {
  requests: VacationRequest[]
  compensationRequests: CompensationRequest[]
  onUpdate: () => void
}

export default function VacationHistory({ requests, compensationRequests, onUpdate }: VacationHistoryProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [cancellingCompensationId, setCancellingCompensationId] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id)

      const { error } = await supabase
        .from('vacation_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error

      onUpdate()
    } catch (error: any) {
      console.error('Error cancelling request:', error.message)
    } finally {
      setCancellingId(null)
    }
  }

  const handleCancelCompensation = async (id: string) => {
    try {
      setCancellingCompensationId(id)

      const { error } = await supabase
        .from('compensation_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)

      if (error) throw error

      onUpdate()
    } catch (error: any) {
      console.error('Error cancelling compensation request:', error.message)
    } finally {
      setCancellingCompensationId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved'
      case 'pending':
        return 'status-pending'
      case 'rejected':
        return 'status-rejected'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return ''
    }
  }

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  if (requests.length === 0 && compensationRequests.length === 0) {
    return (
      <div className="vacation-history-card">
        <h3>History</h3>
        <div className="empty-state">
          <p>No requests yet</p>
          <span className="empty-state-subtitle">Submit your first vacation or compensation request to get started</span>
        </div>
      </div>
    )
  }

  return (
    <div className="vacation-history-card">
      <h3>History</h3>

      <div className="requests-list">
        {requests.length > 0 && (
          <div className="history-section">
            <h4 className="section-title">Vacation Requests</h4>
            {requests.map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-header">
                  <div className="request-dates">
                    <span className="date-range">
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </span>
                    <span className="days-count">{request.days_requested} days</span>
                  </div>
                  <span className={`status-badge ${getStatusClass(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                {request.reason && (
                  <div className="request-reason">
                    <span className="reason-label">Reason:</span>
                    <span className="reason-text">{request.reason}</span>
                  </div>
                )}

                <div className="request-footer">
                  <span className="request-date">
                    Requested on {formatDate(request.created_at)}
                  </span>

                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(request.id)}
                      disabled={cancellingId === request.id}
                      className="btn-cancel-request"
                    >
                      {cancellingId === request.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {compensationRequests.length > 0 && (
          <div className="history-section">
            <h4 className="section-title">Compensation Requests</h4>
            {compensationRequests.map((request) => (
              <div key={request.id} className="request-item compensation-item">
                <div className="request-header">
                  <div className="request-dates">
                    <span className="date-range">
                      {request.days_to_sell} days @ ${request.rate_per_day.toFixed(2)}/day
                    </span>
                    <span className="compensation-amount">${request.total_amount.toFixed(2)}</span>
                  </div>
                  <span className={`status-badge ${getStatusClass(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </div>

                {request.notes && (
                  <div className="request-reason">
                    <span className="reason-label">Notes:</span>
                    <span className="reason-text">{request.notes}</span>
                  </div>
                )}

                <div className="request-footer">
                  <span className="request-date">
                    Requested on {formatDate(request.created_at)}
                  </span>

                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleCancelCompensation(request.id)}
                      disabled={cancellingCompensationId === request.id}
                      className="btn-cancel-request"
                    >
                      {cancellingCompensationId === request.id ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
