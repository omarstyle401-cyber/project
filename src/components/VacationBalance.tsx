import './VacationBalance.css'

interface VacationBalanceProps {
  annualDays: number
  remainingDays: number
}

export default function VacationBalance({ annualDays, remainingDays }: VacationBalanceProps) {
  const usedDays = annualDays - remainingDays
  const percentageUsed = (usedDays / annualDays) * 100

  return (
    <div className="vacation-balance-card">
      <h2>Your Vacation Balance</h2>

      <div className="balance-stats">
        <div className="stat-item primary">
          <div className="stat-value">{remainingDays.toFixed(1)}</div>
          <div className="stat-label">Days Available</div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <div className="stat-value">{usedDays.toFixed(1)}</div>
          <div className="stat-label">Days Used</div>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <div className="stat-value">{annualDays}</div>
          <div className="stat-label">Annual Total</div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-label">Usage</span>
          <span className="progress-percentage">{percentageUsed.toFixed(0)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(percentageUsed, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
