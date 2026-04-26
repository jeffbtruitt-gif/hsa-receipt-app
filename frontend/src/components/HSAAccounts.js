import React, { useState, useEffect } from 'react';
import HSAAccountForm from './HSAAccountForm';

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
      const response = await fetch(`${apiUrl}/api/hsa-accounts?password=${password}`);
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
        ? `${apiUrl}/api/hsa-accounts/${editingAccount.id}`
        : `${apiUrl}/api/hsa-accounts`;
      
      const response = await fetch(url, {
        method: editingAccount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...formData }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingAccount(null);
        fetchAccounts();
      } else {
        alert('Failed to save account');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving account');
    }
  };

  const handleToggleActive = async (account) => {
    try {
      const response = await fetch(`${apiUrl}/api/hsa-accounts/${account.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, is_active: !account.is_active }),
      });
      if (response.ok) fetchAccounts();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Permanently delete this account? This cannot be undone.')) return;
    try {
      const response = await fetch(`${apiUrl}/api/hsa-accounts/${id}`, {
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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
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
          {/* Active Accounts */}
          <div className="accounts-section">
            <h2 className="section-title">Active Accounts ({activeAccounts.length})</h2>
            {activeAccounts.length === 0 ? (
              <p className="no-accounts">No active accounts</p>
            ) : (
              <div className="accounts-grid">
                {activeAccounts.map(account => (
                  <AccountCard
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

          {/* Inactive Accounts */}
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
                <div className="accounts-grid">
                  {inactiveAccounts.map(account => (
                    <AccountCard
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

function AccountCard({ account, onEdit, onToggleActive, onDelete, revealedPasswords, togglePasswordVisibility, copyToClipboard }) {
  const isPasswordRevealed = revealedPasswords[account.id];
  
  return (
    <div className={`account-card ${!account.is_active ? 'inactive' : ''}`}>
      <div className="account-card-header">
        <h3>{account.name}</h3>
        {!account.is_active && <span className="inactive-badge">Inactive</span>}
      </div>

      <div className="account-fields">
        {account.website_url && (
          <div className="account-field">
            <label>Website</label>
            <div className="field-value">
              <a href={account.website_url} target="_blank" rel="noopener noreferrer" className="link">
                {account.website_url}
              </a>
            </div>
          </div>
        )}

        {account.login_username && (
          <div className="account-field">
            <label>Username</label>
            <div className="field-value">
              <span>{account.login_username}</span>
              <button 
                onClick={() => copyToClipboard(account.login_username, 'Username')}
                className="copy-btn"
                title="Copy username"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {account.password && (
          <div className="account-field">
            <label>Password</label>
            <div className="field-value">
              <span className="password-display">
                {isPasswordRevealed ? account.password : '••••••••••'}
              </span>
              <button 
                onClick={() => togglePasswordVisibility(account.id)}
                className="copy-btn"
                title={isPasswordRevealed ? 'Hide password' : 'Show password'}
              >
                {isPasswordRevealed ? '🙈' : '👁️'}
              </button>
              <button 
                onClick={() => copyToClipboard(account.password, 'Password')}
                className="copy-btn"
                title="Copy password"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {account.account_number && (
          <div className="account-field">
            <label>Account #</label>
            <div className="field-value">
              <span>{account.account_number}</span>
              <button 
                onClick={() => copyToClipboard(account.account_number, 'Account number')}
                className="copy-btn"
                title="Copy account number"
              >
                📋
              </button>
            </div>
          </div>
        )}

        {account.notes && (
          <div className="account-field">
            <label>Notes</label>
            <div className="field-value">
              <p className="account-notes">{account.notes}</p>
            </div>
          </div>
        )}
      </div>

      <div className="account-actions">
        {account.website_url && account.is_active && (
          <a 
            href={account.website_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="primary-btn-small"
          >
            🌐 Visit Site
          </a>
        )}
        <button onClick={() => onEdit(account)} className="secondary-btn-small">
          ✏️ Edit
        </button>
        <button 
          onClick={() => onToggleActive(account)} 
          className="toggle-btn-small"
        >
          {account.is_active ? 'Mark Inactive' : 'Mark Active'}
        </button>
        <button onClick={() => onDelete(account.id)} className="delete-btn-small">
          Delete
        </button>
      </div>
    </div>
  );
}

export default HSAAccounts;
