import React from 'react';

function DashboardHome({ stats, onNavigateToUpload, onSelectReceipt }) {
  if (!stats) {
    return (
      <div className="dashboard-home">
        <h1>Dashboard</h1>
        <p>Loading statistics...</p>
      </div>
    );
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate max for bar chart scaling
  const maxMonthly = Math.max(...Object.values(stats.monthly_totals), 1);
  const yearlyEntries = Object.entries(stats.yearly_totals).sort((a, b) => b[0] - a[0]);
  const maxYearly = Math.max(...Object.values(stats.yearly_totals), 1);

  return (
    <div className="dashboard-home">
      <div className="page-header">
        <h1>Dashboard</h1>
        <button onClick={onNavigateToUpload} className="primary-btn">
          + Add New Receipt
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card featured">
          <div className="kpi-label">Total Spent (This Year)</div>
          <div className="kpi-value">${stats.total_this_year.toFixed(2)}</div>
          <div className="kpi-subtitle">{stats.current_year} • Non-reimbursed</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Spent (All Time)</div>
          <div className="kpi-value">${stats.total_all_time.toFixed(2)}</div>
          <div className="kpi-subtitle">Non-reimbursed</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Receipts</div>
          <div className="kpi-value">{stats.total_count}</div>
          <div className="kpi-subtitle">
            {stats.non_reimbursed_count} pending • {stats.reimbursed_count} reimbursed
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Reimbursed</div>
          <div className="kpi-value">{stats.reimbursed_count}</div>
          <div className="kpi-subtitle">of {stats.total_count} total</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="chart-card">
        <h2>Spending by Month ({stats.current_year})</h2>
        <div className="bar-chart">
          {monthNames.map((month, i) => {
            const value = stats.monthly_totals[i] || 0;
            const height = maxMonthly > 0 ? (value / maxMonthly) * 100 : 0;
            return (
              <div key={month} className="bar-container">
                <div className="bar-value">${value.toFixed(0)}</div>
                <div className="bar-wrapper">
                  <div 
                    className="bar" 
                    style={{ height: `${height}%` }}
                    title={`${month}: $${value.toFixed(2)}`}
                  ></div>
                </div>
                <div className="bar-label">{month}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Yearly Chart */}
      {yearlyEntries.length > 0 && (
        <div className="chart-card">
          <h2>Spending by Year</h2>
          <div className="yearly-bars">
            {yearlyEntries.map(([year, total]) => {
              const width = maxYearly > 0 ? (total / maxYearly) * 100 : 0;
              return (
                <div key={year} className="yearly-bar-row">
                  <div className="year-label">{year}</div>
                  <div className="year-bar-wrapper">
                    <div 
                      className="year-bar" 
                      style={{ width: `${width}%` }}
                    >
                      <span className="year-bar-value">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Receipts */}
      <div className="chart-card">
        <h2>Recent Receipts</h2>
        {stats.recent_receipts && stats.recent_receipts.length > 0 ? (
          <table className="recent-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_receipts.map((receipt) => (
                <tr 
                  key={receipt.id} 
                  onClick={() => onSelectReceipt(receipt)} 
                  className="clickable"
                >
                  <td>{new Date(receipt.expense_date).toLocaleDateString()}</td>
                  <td>{receipt.vendor_name}</td>
                  <td>{receipt.category || '—'}</td>
                  <td>${parseFloat(receipt.amount).toFixed(2)}</td>
                  <td>
                    {receipt.is_reimbursed ? (
                      <span className="status-reimbursed">✓ Reimbursed</span>
                    ) : (
                      <span className="status-pending">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No receipts yet. <button onClick={onNavigateToUpload} className="link-btn">Upload your first receipt</button></p>
        )}
      </div>
    </div>
  );
}

export default DashboardHome;
