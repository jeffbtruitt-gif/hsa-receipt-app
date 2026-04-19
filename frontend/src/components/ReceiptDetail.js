import React from 'react';

function ReceiptDetail({ receipt, onBack }) {
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  return (
    <div className="receipt-detail">
      <button onClick={onBack} className="back-btn">
        ← Back
      </button>

      <div className="detail-content">
        <div className="detail-info">
          <h2>{receipt.vendor_name}</h2>
          <div className="info-grid">
            <div>
              <label>Date:</label>
              <span>{new Date(receipt.expense_date).toLocaleDateString()}</span>
            </div>
            <div>
              <label>Amount:</label>
              <span className="amount">${receipt.amount.toFixed(2)}</span>
            </div>
            <div>
              <label>Category:</label>
              <span>{receipt.category || '—'}</span>
            </div>
            <div>
              <label>Uploaded:</label>
              <span>{new Date(receipt.uploaded_at).toLocaleDateString()}</span>
            </div>
            {receipt.notes && (
              <div className="full-width">
                <label>Notes:</label>
                <p>{receipt.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="detail-image">
          <h3>Receipt Image</h3>
          {receipt.storage_path && (
            <img src={`${apiUrl}${receipt.storage_path}`} alt="Receipt" className="receipt-image" />
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptDetail;
