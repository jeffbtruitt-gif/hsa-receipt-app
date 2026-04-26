import React, { useState, useEffect } from 'react';
import DashboardHome from './DashboardHome';
import UploadForm from './UploadForm';
import ReceiptList from './ReceiptList';
import ReceiptDetail from './ReceiptDetail';

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

  const navigateToUpload = () => {
    setCurrentPage('upload');
    setSelectedReceipt(null);
  };

  const navigateToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedReceipt(null);
  };

  const navigateToReceipts = () => {
    setCurrentPage('receipts');
    setSelectedReceipt(null);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="HSA Receipt Vault" className="sidebar-logo" />
        </div>
        
        <nav className="sidebar-nav">
          <button
            onClick={navigateToDashboard}
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={navigateToReceipts}
            className={`nav-item ${currentPage === 'receipts' ? 'active' : ''}`}
          >
            <span className="nav-icon">📋</span>
            <span>Receipts</span>
          </button>
          
          <button
            onClick={navigateToUpload}
            className={`nav-item ${currentPage === 'upload' ? 'active' : ''}`}
          >
            <span className="nav-icon">⬆️</span>
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

      {/* Main Content */}
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
            onNavigateToUpload={navigateToUpload}
            onSelectReceipt={setSelectedReceipt}
          />
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
