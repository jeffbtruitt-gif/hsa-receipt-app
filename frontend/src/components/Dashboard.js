import React, { useState, useEffect } from 'react';
import UploadForm from './UploadForm';
import ReceiptList from './ReceiptList';

function Dashboard({ password, onLogout }) {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
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

  useEffect(() => {
    fetchCategories();
    fetchReceipts();
  }, []);

  const handleUploadSuccess = () => {
    fetchReceipts(filters);
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
      }
    } catch (err) {
      console.error('Failed to delete receipt:', err);
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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>HSA Receipt Vault</h1>
        <div className="header-actions">
          <button onClick={handleExport} className="export-btn">
            Export Data
          </button>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="upload-section">
          <UploadForm password={password} categories={categories} onUploadSuccess={handleUploadSuccess} />
        </section>

        <section className="receipts-section">
          <ReceiptList
            receipts={receipts}
            loading={loading}
            categories={categories}
            filters={filters}
            onFilterChange={handleFilterChange}
            onDelete={handleDelete}
          />
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
