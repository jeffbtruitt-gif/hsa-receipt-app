const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const APP_PASSWORD = process.env.APP_PASSWORD || 'changeMe123';

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cloudinary setup
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware
app.use(cors());
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const verifyPassword = (req, res, next) => {
  const password = req.body?.password || req.query?.password;
  if (password === APP_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const isPdf = originalName.match(/\.pdf$/i);
    const resourceType = 'image';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'hsa-receipts',
        public_id: `${Date.now()}-${uuidv4()}`,
        use_filename: false,
        ...(isPdf && { format: 'pdf' }),
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

// Routes

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password === APP_PASSWORD) {
    res.json({ success: true, token: 'authenticated' });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
  }
});

app.post('/api/receipts', upload.single('file'), verifyPassword, async (req, res) => {
  try {
    const { vendor_name, amount, expense_date, category, notes, is_reimbursed } = req.body;

    if (!req.file || !vendor_name || !amount || !expense_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    const { data, error } = await supabase
      .from('receipts')
      .insert([{
        vendor_name,
        amount: parseFloat(amount),
        expense_date,
        category: category || null,
        notes: notes || null,
        file_name: req.file.originalname,
        storage_path: cloudinaryResult.secure_url,
        is_reimbursed: is_reimbursed === 'true' || is_reimbursed === true,
      }])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save receipt' });
    }

    res.json({ id: data[0].id, message: 'Receipt uploaded successfully' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

app.get('/api/receipts', verifyPassword, async (req, res) => {
  try {
    const { startDate, endDate, category, vendorSearch, includeReimbursed } = req.query;

    let query = supabase
      .from('receipts')
      .select('*')
      .order('expense_date', { ascending: false });

    if (startDate) query = query.gte('expense_date', startDate);
    if (endDate) query = query.lte('expense_date', endDate);
    if (category) query = query.eq('category', category);
    if (vendorSearch) query = query.ilike('vendor_name', `%${vendorSearch}%`);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return res.status(500).json({ error: 'Failed to fetch receipts' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

app.get('/api/receipts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Receipt not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// PUT /api/receipts/:id - Update receipt (for marking reimbursed)
app.put('/api/receipts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_reimbursed, vendor_name, amount, expense_date, category, notes } = req.body;
    
    const updates = {};
    if (is_reimbursed !== undefined) updates.is_reimbursed = is_reimbursed;
    if (vendor_name !== undefined) updates.vendor_name = vendor_name;
    if (amount !== undefined) updates.amount = parseFloat(amount);
    if (expense_date !== undefined) updates.expense_date = expense_date;
    if (category !== undefined) updates.category = category;
    if (notes !== undefined) updates.notes = notes;

    const { data, error } = await supabase
      .from('receipts')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Update error:', error);
      return res.status(500).json({ error: 'Failed to update' });
    }

    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/api/receipts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !receipt) return res.status(404).json({ error: 'Receipt not found' });

    const { error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (deleteError) return res.status(500).json({ error: 'Failed to delete' });
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/api/categories', verifyPassword, (req, res) => {
  const categories = ['Medical', 'Dental', 'Pharmacy', 'Vision', 'Mental Health', 'Physical Therapy', 'Chiropractic', 'Other'];
  res.json(categories);
});

// GET /api/stats - Dashboard statistics
app.get('/api/stats', verifyPassword, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch stats' });

    const receipts = data || [];
    const nonReimbursed = receipts.filter(r => !r.is_reimbursed);
    
    const currentYear = new Date().getFullYear();
    const thisYearReceipts = nonReimbursed.filter(r => 
      new Date(r.expense_date).getFullYear() === currentYear
    );

    // Monthly totals (current year)
    const monthlyTotals = {};
    for (let m = 0; m < 12; m++) {
      monthlyTotals[m] = 0;
    }
    thisYearReceipts.forEach(r => {
      const month = new Date(r.expense_date).getMonth();
      monthlyTotals[month] += parseFloat(r.amount);
    });

    // Yearly totals
    const yearlyTotals = {};
    nonReimbursed.forEach(r => {
      const year = new Date(r.expense_date).getFullYear();
      yearlyTotals[year] = (yearlyTotals[year] || 0) + parseFloat(r.amount);
    });

    const totalAllTime = nonReimbursed.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalThisYear = thisYearReceipts.reduce((sum, r) => sum + parseFloat(r.amount), 0);

    res.json({
      total_count: receipts.length,
      non_reimbursed_count: nonReimbursed.length,
      reimbursed_count: receipts.length - nonReimbursed.length,
      total_all_time: totalAllTime,
      total_this_year: totalThisYear,
      monthly_totals: monthlyTotals,
      yearly_totals: yearlyTotals,
      recent_receipts: receipts.slice(0, 5),
      current_year: currentYear,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

app.get('/api/export', verifyPassword, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to export' });
    res.json({ exported_at: new Date().toISOString(), receipts: data || [] });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`HSA Receipt App backend running on port ${PORT}`);
});
