import React, { useState, useEffect } from 'react';

function UploadForm({ password, categories, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    vendor_name: '',
    amount: '',
    expense_date: '',
    category: '',
    notes: '',
    file: null,
    is_reimbursed: false,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pastePreview, setPastePreview] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const extension = item.type.split('/')[1] || 'png';
          const file = new File([blob], `pasted-receipt-${timestamp}.${extension}`, {
            type: item.type,
          });
          
          setFormData(prev => ({ ...prev, file }));
          
          const reader = new FileReader();
          reader.onload = (e) => setPastePreview(e.target.result);
          reader.readAsDataURL(blob);
          
          setSuccess('Image pasted from clipboard!');
          setTimeout(() => setSuccess(''), 3000);
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, file });
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPastePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPastePreview('');
    }
  };

  const handleClearFile = () => {
    setFormData({ ...formData, file: null });
    setPastePreview('');
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.vendor_name || !formData.amount || !formData.expense_date || !formData.file) {
      setError('Please fill in all required fields');
      return;
    }

    setUploading(true);

    try {
      const data = new FormData();
      data.append('password', password);
      data.append('vendor_name', formData.vendor_name);
      data.append('amount', formData.amount);
      data.append('expense_date', formData.expense_date);
      data.append('category', formData.category);
      data.append('notes', formData.notes);
      data.append('is_reimbursed', formData.is_reimbursed);
      data.append('file', formData.file);

      const response = await fetch(`${apiUrl}/api/receipts`, {
        method: 'POST',
        body: data,
      });

      if (response.ok) {
        setSuccess('Receipt uploaded successfully!');
        setFormData({
          vendor_name: '',
          amount: '',
          expense_date: '',
          category: '',
          notes: '',
          file: null,
          is_reimbursed: false,
        });
        setPastePreview('');
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        onUploadSuccess();
      } else {
        setError('Failed to upload receipt');
      }
    } catch (err) {
      setError('Error uploading receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>Upload Receipt</h1>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="vendor_name">Vendor/Provider Name *</label>
          <input
            type="text"
            id="vendor_name"
            name="vendor_name"
            value={formData.vendor_name}
            onChange={handleInputChange}
            placeholder="e.g., CVS Pharmacy, Dr. Smith's Office"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="amount">Amount *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="expense_date">Date *</label>
            <input
              type="date"
              id="expense_date"
              name="expense_date"
              value={formData.expense_date}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select id="category" name="category" value={formData.category} onChange={handleInputChange}>
            <option value="">Select a category...</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional details (optional)"
            rows="3"
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_reimbursed"
              checked={formData.is_reimbursed}
              onChange={handleInputChange}
            />
            <span>Already Reimbursed</span>
          </label>
          <p className="checkbox-help">Check if this expense has already been reimbursed (excluded from totals)</p>
        </div>

        <div className="form-group">
          <label htmlFor="file">Receipt Image/PDF *</label>
          <div className="paste-tip">
            💡 <strong>Tip:</strong> You can paste an image directly from your clipboard! 
            Use Snipping Tool or screenshots, then press <kbd>Ctrl+V</kbd> (or <kbd>Cmd+V</kbd> on Mac).
          </div>
          <input type="file" id="file" onChange={handleFileChange} accept="image/*,.pdf" />
          
          {formData.file && (
            <div className="file-selected">
              <strong>Selected:</strong> {formData.file.name}
              <button type="button" onClick={handleClearFile} className="remove-file-btn">
                Remove
              </button>
            </div>
          )}
          
          {pastePreview && (
            <div className="file-preview">
              <p>Preview:</p>
              <img src={pastePreview} alt="Preview" />
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" disabled={uploading} className="submit-btn">
          {uploading ? 'Uploading...' : 'Upload Receipt'}
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
