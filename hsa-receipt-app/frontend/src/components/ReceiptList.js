import React, { useState } from 'react';
import ReceiptDetail from './ReceiptDetail';

function ReceiptList({ receipts, loading, categories, filters, onFilterChange, onDelete }) {
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    onFilterChange(newFilters);
  };

  if (selectedReceipt) {
    return <ReceiptDetail receipt={selectedReceipt} onBack={() => setSelectedReceipt(null)} />;
  }

  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const categoryTotals = {};
  receipts.forEach((r) => {
    if (r.category) {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
    }
  });

  return (
    <div className="receipt-list">
      <h2>Your Receipts</h2>

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
            <option key={cat} value={cat}>
              {cat}
            </option>
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
              <span>Total:</span>
              <strong>${totalAmount.toFixed(2)}</strong>
            </div>
            <div className="summary-item">
              <span>Count:</span>
              <strong>{receipts.length}</strong>
            </div>
          </div>

          {Object.keys(categoryTotals).length > 0 && (
            <div className="category-breakdown">
              <h3>By Category</h3>
              <ul>
                {Object.entries(categoryTotals).map(([cat, total]) => (
                  <li key={cat}>
                    {cat}: <strong>${total.toFixed(2)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="receipts-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} onClick={() => setSelectedReceipt(receipt)} className="clickable">
                    <td>{new Date(receipt.expense_date).toLocaleDateString()}</td>
                    <td>{receipt.vendor_name}</td>
                    <td>{receipt.category || '—'}</td>
                    <td>${receipt.amount.toFixed(2)}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(receipt.id);
                        }}
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
