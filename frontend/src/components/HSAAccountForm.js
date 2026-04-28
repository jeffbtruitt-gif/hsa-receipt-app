import React, { useState, useEffect } from 'react';

function HSAAccountForm({ account, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    website_url: '',
    login_username: '',
    password: '',
    account_number: '',
    notes: '',
    image: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        website_url: account.website_url || '',
        login_username: account.login_username || '',
        password: account.password || '',
        account_number: account.account_number || '',
        notes: account.notes || '',
        image: null,
      });
      if (account.image_url) {
        setImagePreview(account.image_url);
      }
    }
  }, [account]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Account name is required');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="hsa-account-form-page">
      <div className="page-header">
        <h1>{account ? 'Edit Account' : 'Add HSA Account'}</h1>
        <button onClick={onCancel} className="secondary-btn">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="name">Account Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Fidelity HSA, HealthEquity"
            required
          />
        </div>

        <div className="form-group">
          <label>Account Image / Logo</label>
          <div className="image-upload-area">
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Account preview" />
              </div>
            )}
            <input 
              type="file" 
              id="image" 
              onChange={handleImageChange} 
              accept="image/*"
            />
            <p className="form-help">Upload an image to help identify this account (optional)</p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="website_url">Website URL</label>
          <input
            type="url"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            placeholder="https://www.example.com"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="login_username">Username / Email</label>
            <input
              type="text"
              id="login_username"
              name="login_username"
              value={formData.login_username}
              onChange={handleChange}
              placeholder="your.email@example.com"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Key</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Account key"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="account_number">Account Number</label>
          <input
            type="text"
            id="account_number"
            name="account_number"
            value={formData.account_number}
            onChange={handleChange}
            placeholder="Optional account or member number"
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes (security questions, recovery info, etc.)"
            rows="4"
          />
        </div>

        <div className="encryption-note">
          🔐 <strong>Security:</strong> Account keys are encrypted before being stored.
        </div>

        <button type="submit" className="submit-btn">
          {account ? 'Save Changes' : 'Add Account'}
        </button>
      </form>
    </div>
  );
}

export default HSAAccountForm;
