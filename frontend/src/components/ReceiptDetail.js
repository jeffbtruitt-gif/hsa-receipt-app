import React from 'react';

function ReceiptDetail({ receipt, onBack }) {
  const isPdf = receipt.file_name && receipt.file_name.toLowerCase().endsWith('.pdf');
  const isImage = receipt.file_name && /\.(jpg|jpeg|png|gif|webp)$/i.test(receipt.file_name);

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
          <h3>Receipt File</h3>
          {receipt.storage_path && (
            <>
              {isImage && (
                <img src={receipt.storage_path} alt="Receipt" className="receipt-image" />
              )}
              {isPdf && (
                <div className="pdf-preview">
                  <iframe
                    src={receipt.storage_path}
                    width="100%"
                    height="600px"
                    title="Receipt PDF"
                    style={{ border: '1px solid #ddd', borderRadius: '4px' }}
                  />
                  <p style={{ marginTop: '10px' }}>
                    <a 
                      href={receipt.storage_path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#5D3A3A', textDecoration: 'underline' }}
                    >
                      Open PDF in new tab
                    </a>
                  </p>
                </div>
              )}
              {!isImage && !isPdf && (
                <p>
                  <a 
                    href={receipt.storage_path} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#5D3A3A', textDecoration: 'underline' }}
                  >
                    Download {receipt.file_name}
                  </a>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReceiptDetail;
