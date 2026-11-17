import React, { useState, useEffect, useRef, useCallback } from 'react';

const EMPTY_FORM = {
  vendor_name: '',
  amount: '',
  expense_date: '',
  category: '',
  notes: '',
  file: null,
  is_reimbursed: false,
};

// Shrink phone photos before sending: faster upload on cellular, stays under
// Claude's image size limit, and converts HEIC/other formats to JPEG.
const MAX_DIMENSION = 2000;
const prepareFile = (file) =>
  new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const base = (file.name || 'receipt').replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${base}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });

function UploadForm({ password, categories, onUploadSuccess }) {
  // 'scan'  = default: pick/take a photo and let Claude fill the form
  // 'review' = Claude filled the form; user checks and saves
  // 'manual' = classic form
  const [mode, setMode] = useState('scan');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState(null); // { confidence, issues }
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('');

  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const manualFileRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const resetInputs = () => {
    [cameraInputRef, fileInputRef, manualFileRef].forEach((r) => {
      if (r.current) r.current.value = '';
    });
  };

  const setPreviewFor = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  const analyzeWithClaude = useCallback(
    async (rawFile) => {
      setError('');
      setSuccess('');
      setAiNote(null);
      setAnalyzing(true);
      const file = await prepareFile(rawFile);
      setPreviewFor(file);
      setFormData({ ...EMPTY_FORM, file });

      try {
        const data = new FormData();
        data.append('password', password);
        data.append('file', file);
        const response = await fetch(`${apiUrl}/api/receipts/analyze`, { method: 'POST', body: data });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(result.error || 'Claude could not read this receipt. Fill in the details below.');
          setMode('manual');
          return;
        }

        setFormData({
          vendor_name: result.vendor_name || '',
          amount: result.amount || '',
          expense_date: result.expense_date || '',
          category: result.category || '',
          notes: result.notes || '',
          file,
          is_reimbursed: false,
        });
        setAiNote({ confidence: result.confidence, issues: result.issues });
        setMode('review');
      } catch (err) {
        setError('Could not reach the server. Fill in the details below or try again.');
        setMode('manual');
      } finally {
        setAnalyzing(false);
      }
    },
    [apiUrl, password]
  );

  // Paste an image from the clipboard (desktop). In scan mode Claude reads it;
  // in manual mode it just attaches.
  useEffect(() => {
    const handlePaste = async (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const extension = item.type.split('/')[1] || 'png';
          const file = new File([blob], `pasted-receipt-${timestamp}.${extension}`, { type: item.type });

          if (mode === 'scan') {
            analyzeWithClaude(file);
          } else {
            const prepared = await prepareFile(file);
            setFormData((prev) => ({ ...prev, file: prepared }));
            setPreviewFor(prepared);
            setSuccess('Image pasted from clipboard!');
            setTimeout(() => setSuccess(''), 3000);
          }
          break;
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mode, analyzeWithClaude]);

  const handleScanPick = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) analyzeWithClaude(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleManualFileChange = async (e) => {
    const raw = e.target.files[0];
    const file = await prepareFile(raw);
    setFormData({ ...formData, file });
    setPreviewFor(file);
  };

  const handleClearFile = () => {
    setFormData({ ...formData, file: null });
    setPreview('');
    resetInputs();
  };

  const startOver = () => {
    setFormData(EMPTY_FORM);
    setPreview('');
    setAiNote(null);
    setError('');
    setSuccess('');
    resetInputs();
    setMode('scan');
  };

  const switchToManual = () => {
    setError('');
    setAiNote(null);
    setMode('manual');
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

      const response = await fetch(`${apiUrl}/api/receipts`, { method: 'POST', body: data });

      if (response.ok) {
        setFormData(EMPTY_FORM);
        setPreview('');
        setAiNote(null);
        resetInputs();
        setMode('scan');
        setSuccess('Receipt saved!');
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

  // ---------- SCAN (default) ----------
  if (mode === 'scan') {
    return (
      <div className="upload-page">
        <div className="page-header">
          <h1>Upload Receipt</h1>
        </div>

        <div className="scan-panel">
          {analyzing ? (
            <div className="scan-analyzing">
              {preview && <img src={preview} alt="Receipt" className="scan-thumb" />}
              <div className="scan-spinner" aria-hidden="true" />
              <p>Claude is reading your receipt…</p>
            </div>
          ) : (
            <>
              <p className="scan-intro">
                Snap or upload a receipt and Claude will fill in the vendor, amount, date, category and notes for you.
              </p>

              <div className="scan-actions">
                <button type="button" className="scan-btn primary" onClick={() => cameraInputRef.current?.click()}>
                  <span className="scan-icon" aria-hidden="true">📷</span>
                  Take Photo
                </button>
                <button type="button" className="scan-btn" onClick={() => fileInputRef.current?.click()}>
                  <span className="scan-icon" aria-hidden="true">📄</span>
                  Choose Photo or File
                </button>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleScanPick}
                hidden
              />
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" onChange={handleScanPick} hidden />

              <p className="scan-paste-hint">
                On a computer you can also paste a screenshot here (<kbd>Ctrl+V</kbd> / <kbd>Cmd+V</kbd>).
              </p>
            </>
          )}

          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}

          {!analyzing && (
            <button type="button" className="link-btn" onClick={switchToManual}>
              Add manually instead
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- REVIEW (Claude-filled) & MANUAL ----------
  const isReview = mode === 'review';

  return (
    <div className="upload-page">
      <div className="page-header">
        <h1>{isReview ? 'Review Receipt' : 'Add Receipt Manually'}</h1>
      </div>

      {isReview && (
        <div className={`ai-banner ${aiNote?.confidence === 'low' ? 'low' : ''}`}>
          <strong>✨ Filled in by Claude.</strong> Check the details, then save.
          {aiNote?.issues && <div className="ai-issues">Double-check: {aiNote.issues}</div>}
        </div>
      )}

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
              inputMode="decimal"
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

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_reimbursed"
              checked={formData.is_reimbursed}
              onChange={handleInputChange}
            />
            <span>Reimbursed</span>
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="file">Receipt Image/PDF *</label>
          {!isReview && (
            <>
              <div className="paste-tip">
                💡 <strong>Tip:</strong> You can paste an image directly from your clipboard!
                Use Snipping Tool or screenshots, then press <kbd>Ctrl+V</kbd> (or <kbd>Cmd+V</kbd> on Mac).
              </div>
              <input
                ref={manualFileRef}
                type="file"
                id="file"
                onChange={handleManualFileChange}
                accept="image/*,.pdf"
              />
            </>
          )}

          {formData.file && (
            <div className="file-selected">
              <strong>Selected:</strong> {formData.file.name}
              {!isReview && (
                <button type="button" onClick={handleClearFile} className="remove-file-btn">
                  Remove
                </button>
              )}
            </div>
          )}

          {preview && (
            <div className="file-preview">
              <p>Preview:</p>
              <img src={preview} alt="Preview" />
            </div>
          )}
        </div>

        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        <button type="submit" disabled={uploading} className="submit-btn">
          {uploading ? 'Saving...' : isReview ? 'Save Receipt' : 'Upload Receipt'}
        </button>

        <div className="form-footer-links">
          <button type="button" className="link-btn" onClick={startOver}>
            {isReview ? 'Scan a different receipt' : 'Scan with Claude instead'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadForm;
