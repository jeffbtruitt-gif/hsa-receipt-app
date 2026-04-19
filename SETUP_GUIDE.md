# HSA Receipt Vault - Complete Setup Guide

## What You Have

You've got a complete, production-ready React + Node.js application with:

- ✅ React frontend with luxury burgundy theme
- ✅ Express.js backend with file upload
- ✅ JSON file-based database (no native modules needed)
- ✅ Password authentication
- ✅ Receipt management (upload, view, filter, delete, export)
- ✅ Mobile responsive design

---

## Directory Structure

```
hsa-receipt-app/
├── backend/                      # Node.js server
│   ├── server.js                 # Express app
│   ├── package.json              # Dependencies
│   ├── .env                       # Configuration
│   ├── node_modules/             # Installed packages
│   ├── uploads/                  # Receipt images (created on first upload)
│   └── receipts-db.json          # Database (created on first receipt)
│
├── frontend/                      # React app
│   ├── src/
│   │   ├── App.js                # Main component
│   │   ├── App.css               # Burgundy luxury theme
│   │   ├── components/           # React components
│   │   │   ├── LoginPage.js      # Password login
│   │   │   ├── Dashboard.js      # Main interface
│   │   │   ├── UploadForm.js     # Receipt upload
│   │   │   ├── ReceiptList.js    # Receipts table
│   │   │   └── ReceiptDetail.js  # Receipt view
│   │   └── index.js
│   ├── public/
│   ├── package.json
│   ├── .env.local                # API configuration
│   └── node_modules/
│
├── README.md                      # Project overview
├── .gitignore                     # Git rules
└── package.json                   # Root (optional)
```

---

## Installation

### 1. Install Backend Dependencies

Already done! ✓ You can see `backend/node_modules/` exists.

If you ever need to reinstall:
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

Navigate to the frontend and install:

```bash
cd frontend
npm install
```

This will take 1-2 minutes. Creates `node_modules/` (~500MB).

---

## Configuration

### Backend Configuration (`.env`)

```
PORT=5000
NODE_ENV=development
APP_PASSWORD=YourSecurePassword123!
```

**Change the password to something secure:**
```bash
# Edit backend/.env
APP_PASSWORD=MySpecialPassword2026!
```

### Frontend Configuration (`.env.local`)

```
REACT_APP_API_URL=http://localhost:5000
```

This tells React where the backend is. Already set up. ✓

---

## Running the Application

### Option 1: Two Terminal Windows (Recommended for Development)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You'll see:
```
HSA Receipt App backend running on port 5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

You'll see:
```
Compiled successfully!

You can now view frontend in the browser.

  Local:            http://localhost:3000
  ...
```

Browser will open automatically to `http://localhost:3000`

---

### Option 2: Single Terminal (Using `&` to background processes)

```bash
# Terminal 1
cd backend && npm run dev &
sleep 2
cd ../frontend && npm start
```

---

## Using the App

### Login
- Password: Whatever you set in `backend/.env`
- Default: `YourSecurePassword123!`

### Upload a Receipt
1. Click "Upload Receipt" on the left
2. Fill in vendor, amount, date, category
3. Select an image or PDF
4. Click "Upload Receipt"

### View Receipts
- Table shows all uploaded receipts
- Click a row to see full details + image
- Hover rows to see burgundy highlight

### Search & Filter
- Filter by date range
- Filter by category
- Search by vendor name
- All filters work together

### Export Data
- Click "Export Data" in header
- Downloads JSON file with all receipts
- Perfect for backup

### Delete
- Click "Delete" in table row
- Confirms before removal

---

## Stopping the Application

### To Stop Backend
Terminal 1:
```
Ctrl+C
```

### To Stop Frontend
Terminal 2:
```
Ctrl+C
```

---

## Troubleshooting

### "Port 5000 already in use"
```bash
# Find what's using port 5000
lsof -i :5000

# Kill the process (replace 1234 with PID)
kill -9 1234

# Or use a different port in backend/.env
PORT=5001
```

### "Cannot find module 'express'"
```bash
cd backend
npm install
```

### Frontend shows blank page
1. Check browser console (F12)
2. Check backend is running on port 5000
3. Check `.env.local` has correct API URL
4. Try hard refresh (Ctrl+Shift+R)

### "Failed to upload receipt"
1. Check `uploads/` folder exists in backend
2. Check file is image or PDF
3. Check backend logs for errors
4. Try smaller file

### "Incorrect password"
1. Check password in `backend/.env`
2. Make sure you're copying it exactly
3. Restart backend after changing `.env`

---

## Database

### How It Works
- Receipts stored in `backend/receipts-db.json`
- Images stored in `backend/uploads/`
- Created automatically on first use

### Backup Your Data
```bash
# Copy the database file
cp backend/receipts-db.json backup-$(date +%Y%m%d).json

# Or use the Export button in the app
```

### Reset Everything
```bash
# Delete database (WARNING: loses all receipts)
rm backend/receipts-db.json
rm -rf backend/uploads/*
```

---

## Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Development with auto-reload
npm start            # Production
```

**Frontend:**
```bash
npm start            # Development server with hot reload
npm run build        # Production build
npm test             # Run tests
npm run eject        # (Don't do this unless needed)
```

### Modifying the Theme

All colors in `frontend/src/App.css`:
```css
:root {
  --hsa-navy: #1a2942;
  --hsa-gold: #C9A961;
  --hsa-burgundy: #5D3A3A;
  /* ... etc */
}
```

Change any hex code to modify the theme.

### Adding Features

See comments in component files for modification points:
- `LoginPage.js` - Add remember password, forgot password
- `UploadForm.js` - Add image preview, drag-drop
- `ReceiptList.js` - Add sorting, bulk actions
- `Dashboard.js` - Add analytics, charts

---

## Next Steps

### Phase 2: OCR (Auto-extract receipt data)
- Install tesseract.js on frontend
- Auto-fill vendor, amount from image

### Phase 3: Analytics
- Add Chart.js for spending by category
- Monthly trends
- Budget tracking

### Phase 4: Production
- Deploy backend to Render
- Deploy frontend to GitHub Pages or Vercel
- Set up proper authentication
- Add rate limiting

---

## Need Help?

### Check These Files
1. `README.md` - Project overview
2. `backend/server.js` - API endpoints
3. `frontend/src/components/*.js` - Component code
4. Browser console (F12) - JavaScript errors
5. Backend terminal - Server logs

### Common Issues Checklist
- [ ] Both backend and frontend running?
- [ ] Correct password in `.env`?
- [ ] Port 5000 available?
- [ ] Correct API URL in frontend `.env.local`?
- [ ] Can reach `http://localhost:5000/api/health`?

---

## File Locations Reference

```
Backend Config:      backend/.env
Frontend Config:     frontend/.env.local
Database:            backend/receipts-db.json
Receipt Images:      backend/uploads/
Theme Colors:        frontend/src/App.css
Components:          frontend/src/components/
API Server:          backend/server.js
Main App:            frontend/src/App.js
```

---

**You're all set! Run the backend and frontend, then start uploading receipts.**

**This is the Mercedes-Benz of HSA apps.** ✨

---

## Quick Reference: Commands You'll Use

```bash
# Start backend (in backend/ directory)
npm run dev

# Start frontend (in frontend/ directory)
npm start

# Build for production (in frontend/ directory)
npm run build

# Export data (use button in app)
# Downloads hsa-receipts-YYYY-MM-DD.json

# Stop either app
Ctrl+C
```

Happy receipting! 📄✨
