import React from 'react';

function ReceiptList({ receipts, loading, categories, filters, onFilterChange, onDelete, onSelectReceipt, onToggleReimbursed }) {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    onFilterChange(newFilters);
  };

  const nonReimbursedReceipts = receipts.filter(r => !r.is_reimbursed);
  const totalAmount = nonReimbursedReceipts.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="receipt-list">
      <div className="page-header">
        <h1>Your Receipts</h1>
      </div>

      <div className="filters">
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          placeholder="Start date"
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          placeholder="End date"
        />
        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <input
          type="text"
          name="vendorSearch"
          value={filters.vendorSearch}
          onChange={handleFilterChange}
          placeholder="Search vendor..."
        />
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : receipts.length === 0 ? (
        <p className="no-receipts">No receipts found</p>
      ) : (
        <>
          <div className="summary">
            <div className="summary-item">
              <span>Pending Total:</span>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>
            <div className="summary-item">
              <span>Total Receipts:</span>
              <strong>{receipts.length}</strong>
            </div>
            <div className="summary-item">
              <span>Pending:</span>
              <strong>{nonReimbursedReceipts.length}</strong>
            </div>
          </div>

          <div className="receipts-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr 
                    key={receipt.id} 
                    onClick={() => onSelectReceipt(receipt)} 
                    className={`clickable ${receipt.is_reimbursed ? 'reimbursed-row' : ''}`}
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleReimbursed(receipt.id, receipt.is_reimbursed)}
                        className="toggle-btn"
                      >
                        {receipt.is_reimbursed ? 'Mark Pending' : 'Mark Reimbursed'}
                      </button>
                      <button
                        onClick={() => onDelete(receipt.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default ReceiptList;
