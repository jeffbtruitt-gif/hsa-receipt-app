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

// File upload setup - using memory storage for Cloudinary
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Verify password middleware
const verifyPassword = (req, res, next) => {
  const password = req.body?.password || req.query?.password;
  if (password === APP_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Helper: Upload file to Cloudinary
const uploadToCloudinary = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const isImage = originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isPdf = originalName.match(/\.pdf$/i);
    
    let resourceType = 'auto';
    if (isPdf) resourceType = 'raw';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: 'hsa-receipts',
        public_id: `${Date.now()}-${uuidv4()}`,
        use_filename: false,
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
app.post('/api/receipts', upload.single('file'), verifyPassword, async (req, res) => {
  try {
    const { vendor_name, amount, expense_date, category, notes } = req.body;

    if (!req.file || !vendor_name || !amount || !expense_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Upload file to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    // Save metadata to Supabase
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

// GET /api/receipts - List receipts with filters
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

// GET /api/receipts/:id - Get single receipt
app.get('/api/receipts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(data);
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch receipt' });
  }
});

// DELETE /api/receipts/:id - Delete receipt
app.delete('/api/receipts/:id', verifyPassword, async (req, res) => {
  try {
    const { id } = req.params;

    // Get receipt first to get the file URL
    const { data: receipt, error: fetchError } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Delete from Supabase
    const { error: deleteError } = await supabase
      .from('receipts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete' });
    }

    // Note: Cloudinary file remains - manual cleanup or scheduled job needed
    // (For production, you'd want to delete from Cloudinary too using public_id)

    res.json({ message: 'Receipt deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// GET /api/categories
app.get('/api/categories', verifyPassword, (req, res) => {
  const categories = ['Medical', 'Dental', 'Pharmacy', 'Vision', 'Mental Health', 'Physical Therapy', 'Chiropractic', 'Other'];
  res.json(categories);
});

// GET /api/export
app.get('/api/export', verifyPassword, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .order('expense_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to export' });
    }

    res.json({
      exported_at: new Date().toISOString(),
      receipts: data || [],
    });
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`HSA Receipt App backend running on port ${PORT}`);
  console.log(`Supabase: ${supabaseUrl ? 'configured' : 'NOT configured'}`);
  console.log(`Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'NOT configured'}`);
});
