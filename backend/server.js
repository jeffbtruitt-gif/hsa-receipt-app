const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const cloudinary = require('cloudinary').v2;
const { v4: uuidv4 } = require('uuid');
const CryptoJS = require('crypto-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const APP_PASSWORD = process.env.APP_PASSWORD || 'changeMe123';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

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

// Encryption helpers
const encrypt = (text) => {
  if (!text || !ENCRYPTION_KEY) return null;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decrypt = (encryptedText) => {
  if (!encryptedText || !ENCRYPTION_KEY) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decrypt error:', err);
    return null;
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

// ============ AUTH ============
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password === APP_PASSWORD) {
    res.json({ success: true, token: 'authenticated' });
  } else {
    res.status(401).json({ error: 'Incorrect password' });
  }
});

// ============ RECEIPTS ============
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
    const { startDate, endDate, category, vendorSearch } = req.query;

    let query = supabase
      .from('receipts')
      .select('*')
      .order('expense_date', { ascending: false });

    if (startDate) query = query.gte('expense_date', startDate);
    if (endDate) query = query.lte('expense_date', endDate);
    if (category) query = query.eq('category', category);
    if (vendorSearch) query = query.ilike('vendor_name', `%${vendorSearch}%`);

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: 'Failed to fetch receipts' });
    res.json(data || []);
  } catch (err) {
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

    if (error) return res.status(500).json({ error: 'Failed to update' });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/api/receipts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Failed to delete' });
    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.get('/api/categories', verifyPassword, (req, res) => {
  const categories = ['Medical', 'Dental', 'Pharmacy', 'Vision', 'Mental Health', 'Physical Therapy', 'Chiropractic', 'Other'];
  res.json(categories);
});

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

    const monthlyTotals = {};
    for (let m = 0; m < 12; m++) monthlyTotals[m] = 0;
    thisYearReceipts.forEach(r => {
      const month = new Date(r.expense_date).getMonth();
      monthlyTotals[month] += parseFloat(r.amount);
    });

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

// ============ HSA ACCOUNTS ============

// GET all HSA accounts (returns decrypted passwords)
app.get('/api/hsa-accounts', verifyPassword, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hsa_accounts')
      .select('*')
      .order('is_active', { ascending: false })
      .order('name', { ascending: true });

    if (error) return res.status(500).json({ error: 'Failed to fetch accounts' });

    // Decrypt passwords
    const accounts = (data || []).map(account => ({
      ...account,
      password: account.password_encrypted ? decrypt(account.password_encrypted) : '',
      password_encrypted: undefined, // don't send encrypted version
    }));

    res.json(accounts);
  } catch (err) {
    console.error('Fetch accounts error:', err);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// GET single HSA account
app.get('/api/hsa-accounts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('hsa_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Account not found' });

    res.json({
      ...data,
      password: data.password_encrypted ? decrypt(data.password_encrypted) : '',
      password_encrypted: undefined,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// POST create HSA account
app.post('/api/hsa-accounts', verifyPassword, async (req, res) => {
  try {
    const { name, website_url, login_username, password, account_number, notes } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    const insertData = {
      name,
      website_url: website_url || null,
      login_username: login_username || null,
      password_encrypted: password ? encrypt(password) : null,
      account_number: account_number || null,
      notes: notes || null,
      is_active: true,
    };

    const { data, error } = await supabase
      .from('hsa_accounts')
      .insert([insertData])
      .select();

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ error: 'Failed to create account' });
    }

    res.json({ id: data[0].id, message: 'Account created' });
  } catch (err) {
    console.error('Create error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// PUT update HSA account
app.put('/api/hsa-accounts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website_url, login_username, password, account_number, notes, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (website_url !== undefined) updates.website_url = website_url;
    if (login_username !== undefined) updates.login_username = login_username;
    if (password !== undefined) updates.password_encrypted = password ? encrypt(password) : null;
    if (account_number !== undefined) updates.account_number = account_number;
    if (notes !== undefined) updates.notes = notes;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from('hsa_accounts')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) return res.status(500).json({ error: 'Failed to update' });
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE HSA account
app.delete('/api/hsa-accounts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('hsa_accounts')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: 'Failed to delete' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ============ HEALTH ============
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`HSA Receipt App backend running on port ${PORT}`);
  console.log(`Encryption: ${ENCRYPTION_KEY ? 'configured' : 'NOT configured'}`);
});
