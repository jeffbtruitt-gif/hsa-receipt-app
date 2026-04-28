import React, { useState, useEffect } from 'react';
import HSAAccountForm from './HSAAccountForm';

// SVG Icons (white outlines)
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const ExternalLinkIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
  </svg>
);

function HSAAccounts({ password }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [revealedPasswords, setRevealedPasswords] = useState({});

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/hsa-accounts?password=${encodeURIComponent(password)}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleAdd = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleSave = async (formData) => {
    try {
      const url = editingAccount 
        ? `${apiUrl}/api/hsa-accounts/${editingAccount.id}?password=${encodeURIComponent(password)}`
        : `${apiUrl}/api/hsa-accounts?password=${encodeURIComponent(password)}`;
      
      const data = new FormData();
      data.append('password', password);
      data.append('name', formData.name);
      data.append('website_url', formData.website_url || '');
      data.append('login_username', formData.login_username || '');
      data.append('password_value', formData.password || '');
      data.append('account_number', formData.account_number || '');
      data.append('notes', formData.notes || '');
      if (formData.image) {
        data.append('image', formData.image);
      }
      
      const response = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        body: data,
      });

      if (response.ok) {
        setShowForm(false);
        setEditingAccount(null);
        fetchAccounts();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Failed to save account: ${errorData.error || response.status}`);
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving account');
    }
  };

  const handleToggleActive = async (account) => {
    try {
      const data = new FormData();
      data.append('password', password);
      data.append('is_active', !account.is_active);
      
      const response = await fetch(`${apiUrl}/api/hsa-accounts/${account.id}?password=${encodeURIComponent(password)}`, {
        method: 'PUT',
        body: data,
      });
      if (response.ok) fetchAccounts();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this account? This cannot be undone.')) return;
    try {
      const response = await fetch(`${apiUrl}/api/hsa-accounts/${id}?password=${encodeURIComponent(password)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) fetchAccounts();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const togglePasswordVisibility = (id) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const activeAccounts = accounts.filter(a => a.is_active);
  const inactiveAccounts = accounts.filter(a => !a.is_active);

  if (showForm) {
    return (
      <HSAAccountForm
        account={editingAccount}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setEditingAccount(null);
        }}
      />
    );
  }

  return (
    <div className="hsa-accounts-page">
      <div className="page-header">
        <h1>HSA Accounts</h1>
        <button onClick={handleAdd} className="primary-btn">
          + Add Account
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <p>No HSA accounts yet. Add your first account to get started!</p>
        </div>
      ) : (
        <>
          <div className="accounts-section">
            <h2 className="section-title">Active Accounts ({activeAccounts.length})</h2>
            {activeAccounts.length === 0 ? (
              <p className="no-accounts">No active accounts</p>
            ) : (
              <div className="accounts-list">
                {activeAccounts.map(account => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onEdit={handleEdit}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    revealedPasswords={revealedPasswords}
                    togglePasswordVisibility={togglePasswordVisibility}
                    copyToClipboard={copyToClipboard}
                  />
                ))}
              </div>
            )}
          </div>

          {inactiveAccounts.length > 0 && (
            <div className="accounts-section inactive-section">
              <button 
                className="section-toggle"
                onClick={() => setShowInactive(!showInactive)}
              >
                <h2 className="section-title">
                  {showInactive ? '▼' : '▶'} Inactive Accounts ({inactiveAccounts.length})
                </h2>
              </button>
              {showInactive && (
                <div className="accounts-list">
                  {inactiveAccounts.map(account => (
                    <AccountRow
                      key={account.id}
                      account={account}
                      onEdit={handleEdit}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      revealedPasswords={revealedPasswords}
                      togglePasswordVisibility={togglePasswordVisibility}
                      copyToClipboard={copyToClipboard}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AccountRow({ account, onEdit, onToggleActive, onDelete, revealedPasswords, togglePasswordVisibility, copyToClipboard }) {
  const isPasswordRevealed = revealedPasswords[account.id];
  
  return (
    <div className={`account-row ${!account.is_active ? 'inactive' : ''}`}>
      {/* Image Section */}
      <div className="account-image">
        {account.image_url ? (
          <img src={account.image_url} alt={account.name} />
        ) : (
          <div className="account-image-placeholder">
            {account.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="account-info">
        <div className="account-row-header">
          <h3>{account.name}</h3>
          {!account.is_active && <span className="inactive-badge">Inactive</span>}
          {account.website_url && account.is_active && (
            <a 
              href={account.website_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="open-btn"
              title="Open Website"
            >
              <ExternalLinkIcon /> Open
            </a>
          )}
        </div>

        <div className="account-row-content">
          {/* Left Column - Login Info */}
          <div className="account-row-left">
            {account.website_url && (
              <div className="account-row-field">
                <label>Website</label>
                <a href={account.website_url} target="_blank" rel="noopener noreferrer" className="link">
                  {account.website_url}
                </a>
              </div>
            )}

            {account.login_username && (
              <div className="account-row-field">
                <label>Username</label>
                <div className="field-value">
                  <span>{account.login_username}</span>
                  <button 
                    onClick={() => copyToClipboard(account.login_username)}
                    className="icon-btn"
                    title="Copy username"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            )}

            {account.password && (
              <div className="account-row-field">
                <label>Key</label>
                <div className="field-value">
                  <span className="password-display">
                    {isPasswordRevealed ? account.password : '••••••••••'}
                  </span>
                  <button 
                    onClick={() => togglePasswordVisibility(account.id)}
                    className="icon-btn"
                    title={isPasswordRevealed ? 'Hide' : 'Show'}
                  >
                    {isPasswordRevealed ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                  <button 
                    onClick={() => copyToClipboard(account.password)}
                    className="icon-btn"
                    title="Copy"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            )}

            {account.account_number && (
              <div className="account-row-field">
                <label>Account #</label>
                <div className="field-value">
                  <span>{account.account_number}</span>
                  <button 
                    onClick={() => copyToClipboard(account.account_number)}
                    className="icon-btn"
                    title="Copy"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Notes */}
          {account.notes && (
            <div className="account-row-right">
              <div className="account-row-field">
                <label>Notes</label>
                <p className="account-notes">{account.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons - bottom */}
        <div className="account-row-actions">
          <button onClick={() => onEdit(account)} className="action-btn">
            Edit
          </button>
          <button 
            onClick={() => onToggleActive(account)} 
            className="action-btn"
          >
            {account.is_active ? 'Mark Inactive' : 'Mark Active'}
          </button>
          <button onClick={() => onDelete(account.id)} className="action-btn delete">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default HSAAccounts;
