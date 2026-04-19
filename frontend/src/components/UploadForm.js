import React, { useState } from 'react';

function UploadForm({ password, categories, onUploadSuccess }) {
  const [formData, setFormData] = useState({
    vendor_name: '',
    amount: '',
    expense_date: '',
    category: '',
    notes: '',
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, file: e.target.files[0] });
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
        });
        document.querySelector('input[type="file"]').value = '';
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
    <form onSubmit={handleSubmit} className="upload-form">
      <h2>Upload Receipt</h2>

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
            <option key={cat} value={cat}>
              {cat}
            </option>
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

      <div className="form-group">
        <label htmlFor="file">Receipt Image/PDF *</label>
        <input type="file" id="file" onChange={handleFileChange} accept="image/*,.pdf" required />
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <button type="submit" disabled={uploading} className="submit-btn">
        {uploading ? 'Uploading...' : 'Upload Receipt'}
      </button>
    </form>
  );
}

export default UploadForm;
