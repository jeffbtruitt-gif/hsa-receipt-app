const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const APP_PASSWORD = process.env.APP_PASSWORD || 'changeMe123';

// Middleware
app.use(cors());
app.use(express.json());

// File upload setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.static('uploads'));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

// In-memory database (JSON file for persistence)
const dbFilePath = path.join(__dirname, 'receipts-db.json');

const loadDatabase = () => {
  if (fs.existsSync(dbFilePath)) {
    const data = fs.readFileSync(dbFilePath, 'utf8');
    return JSON.parse(data);
  }
  return { receipts: [] };
};

const saveDatabase = (db) => {
  fs.writeFileSync(dbFilePath, JSON.stringify(db, null, 2), 'utf8');
};

// Verify password middleware
const verifyPassword = (req, res, next) => {
  const password = req.body?.password || req.query?.password;
  if (password === APP_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Routes

// POST /api/login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  if (password === APP_PASSWORD) {
    res.json({ success: true, token: 'authenticated' });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
  }
});

// POST /api/receipts - Upload receipt
app.post('/api/receipts', upload.single('file'), verifyPassword, (req, res) => {
  const { vendor_name, amount, expense_date, category, notes } = req.body;

  if (!req.file || !vendor_name || !amount || !expense_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = loadDatabase();
  const receipt = {
    id: uuidv4(),
    vendor_name,
    amount: parseFloat(amount),
    expense_date,
    category: category || null,
    notes: notes || null,
    file_name: req.file.originalname,
    storage_path: `/uploads/${req.file.filename}`,
    uploaded_at: new Date().toISOString(),
  };

  db.receipts.push(receipt);
  saveDatabase(db);

  res.json({ id: receipt.id, message: 'Receipt uploaded successfully' });
});

// GET /api/receipts - List receipts with filters
app.get('/api/receipts', verifyPassword, (req, res) => {
  const { startDate, endDate, category, vendorSearch } = req.query;

  let db = loadDatabase();
  let receipts = db.receipts;

  if (startDate) {
    receipts = receipts.filter(r => r.expense_date >= startDate);
  }

  if (endDate) {
    receipts = receipts.filter(r => r.expense_date <= endDate);
  }

  if (category) {
    receipts = receipts.filter(r => r.category === category);
  }

  if (vendorSearch) {
    receipts = receipts.filter(r =>
      r.vendor_name.toLowerCase().includes(vendorSearch.toLowerCase())
    );
  }

  // Sort by date descending
  receipts.sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

  res.json(receipts);
});

// GET /api/receipts/:id - Get single receipt
app.get('/api/receipts/:id', verifyPassword, (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const receipt = db.receipts.find(r => r.id === id);

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  res.json(receipt);
});

// DELETE /api/receipts/:id - Delete receipt
app.delete('/api/receipts/:id', verifyPassword, (req, res) => {
  const { id } = req.params;
  const db = loadDatabase();
  const receipt = db.receipts.find(r => r.id === id);

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found' });
  }

  // Delete file
  const filePath = path.join(__dirname, receipt.storage_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove from database
  db.receipts = db.receipts.filter(r => r.id !== id);
  saveDatabase(db);

  res.json({ message: 'Receipt deleted' });
});

// GET /api/categories
app.get('/api/categories', verifyPassword, (req, res) => {
  const categories = ['Medical', 'Dental', 'Pharmacy', 'Vision', 'Mental Health', 'Physical Therapy', 'Chiropractic', 'Other'];
  res.json(categories);
});

// GET /api/export
app.get('/api/export', verifyPassword, (req, res) => {
  const db = loadDatabase();
  res.json({
    exported_at: new Date().toISOString(),
    receipts: db.receipts,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`HSA Receipt App backend running on port ${PORT}`);
});
