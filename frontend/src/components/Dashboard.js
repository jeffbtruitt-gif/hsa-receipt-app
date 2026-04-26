import React, { useState, useEffect } from 'react';
import DashboardHome from './DashboardHome';
import UploadForm from './UploadForm';
import ReceiptList from './ReceiptList';
import ReceiptDetail from './ReceiptDetail';
import HSAAccounts from './HSAAccounts';

// Icon components
const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const AccountsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"></rect>
    <line x1="2" y1="10" x2="22" y2="10"></line>
  </svg>
);

const ReceiptsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

function Dashboard({ password, onLogout }) {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    vendorSearch: '',
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/categories?password=${password}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchReceipts = async (filterParams = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ password, ...filterParams });
      const response = await fetch(`${apiUrl}/api/receipts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReceipts(data);
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/stats?password=${password}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchReceipts();
    fetchStats();
  }, []);

  const handleUploadSuccess = () => {
    fetchReceipts(filters);
    fetchStats();
    setCurrentPage('receipts');
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchReceipts(newFilters);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receipt?')) return;
    try {
      const response = await fetch(`${apiUrl}/api/receipts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (response.ok) {
        fetchReceipts(filters);
        fetchStats();
        setSelectedReceipt(null);
      }
    } catch (err) {
      console.error('Failed to delete receipt:', err);
    }
  };

  const handleToggleReimbursed = async (id, currentStatus) => {
    try {
      const response = await fetch(`${apiUrl}/api/receipts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, is_reimbursed: !currentStatus }),
      });
      if (response.ok) {
        fetchReceipts(filters);
        fetchStats();
        if (selectedReceipt && selectedReceipt.id === id) {
          const updated = await response.json();
          setSelectedReceipt(updated);
        }
      }
    } catch (err) {
      console.error('Failed to update receipt:', err);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/export?password=${password}`);
      if (response.ok) {
        const data = await response.json();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hsa-receipts-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  const navigateTo = (page) => {
    setCurrentPage(page);
    setSelectedReceipt(null);
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="HSA Receipt Vault" className="sidebar-logo" />
        </div>
        
        <div className="sidebar-section-label">Menu</div>
        
        <nav className="sidebar-nav">
          <button
            onClick={() => navigateTo('dashboard')}
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          >
            <span className="nav-icon"><DashboardIcon /></span>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => navigateTo('hsa-accounts')}
            className={`nav-item ${currentPage === 'hsa-accounts' ? 'active' : ''}`}
          >
            <span className="nav-icon"><AccountsIcon /></span>
            <span>HSA Accounts</span>
          </button>
          
          <button
            onClick={() => navigateTo('receipts')}
            className={`nav-item ${currentPage === 'receipts' ? 'active' : ''}`}
          >
            <span className="nav-icon"><ReceiptsIcon /></span>
            <span>Receipts</span>
          </button>
          
          <button
            onClick={() => navigateTo('upload')}
            className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
          >
            <span className="nav-icon"><UploadIcon /></span>
            <span>Upload Receipt</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleExport} className="export-btn">
            Export Data
          </button>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        {selectedReceipt ? (
          <ReceiptDetail 
            receipt={selectedReceipt} 
            onBack={() => setSelectedReceipt(null)}
            onDelete={handleDelete}
            onToggleReimbursed={handleToggleReimbursed}
          />
        ) : currentPage === 'dashboard' ? (
          <DashboardHome 
            stats={stats} 
            onNavigateToUpload={() => navigateTo('upload')}
            onSelectReceipt={setSelectedReceipt}
          />
        ) : currentPage === 'hsa-accounts' ? (
          <HSAAccounts password={password} />
        ) : currentPage === 'upload' ? (
          <UploadForm 
            password={password} 
            categories={categories} 
            onUploadSuccess={handleUploadSuccess} 
          />
        ) : (
          <ReceiptList
            receipts={receipts}
            loading={loading}
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onDelete={handleDelete}
            onSelectReceipt={setSelectedReceipt}
            onToggleReimbursed={handleToggleReimbursed}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
