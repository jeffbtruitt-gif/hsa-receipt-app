# HSA Receipt Vault

**Luxury financial application for managing HSA receipts and documents.**

Navy + Gold + Burgundy theme with dark wood grain accents. Built with React, Node.js, and JSON file storage.

---

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Two terminal windows (one for backend, one for frontend)

### Step 1: Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will start on `http://localhost:5000`

**Configure password in `backend/.env`:**
```
PORT=5000
NODE_ENV=development
APP_PASSWORD=YourSecurePassword123!
```

### Step 2: Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend will open at `http://localhost:3000`

### Step 3: Login

Password: Whatever you set in `backend/.env` (default: `YourSecurePassword123!`)

---

## Project Structure

```
hsa-receipt-app/
├── backend/
│   ├── server.js              # Express server
│   ├── package.json
│   ├── .env                   # Password & config
│   ├── .gitignore
│   ├── uploads/               # Receipt image storage
│   └── receipts-db.json       # JSON database
│
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main app component
│   │   ├── App.css            # Burgundy luxury theme
│   │   ├── components/
│   │   │   ├── LoginPage.js
│   │   │   ├── Dashboard.js
│   │   │   ├── UploadForm.js
│   │   │   ├── ReceiptList.js
│   │   │   └── ReceiptDetail.js
│   │   └── index.js
│   ├── .env.local             # API URL
│   ├── package.json
│   └── public/
│
└── README.md
```

---

## Features (Phase 1)

✅ **Authentication** - Password-protected access

✅ **Upload Receipts** - With vendor, amount, date, category, notes

✅ **View Receipts** - List with search and filter options

✅ **Filter & Search** - By date range, category, vendor name

✅ **Receipt Details** - View full receipt with image

✅ **Delete Receipts** - Remove from system

✅ **Export Data** - Download all receipts as JSON

✅ **Luxury Theme** - Navy + Gold + Burgundy design

---

## API Endpoints

All endpoints require `password` parameter.

### Authentication
- `POST /api/login` - Verify password

### Receipts
- `POST /api/receipts` - Upload new receipt
- `GET /api/receipts` - List receipts (with filters)
- `GET /api/receipts/:id` - Get single receipt
- `DELETE /api/receipts/:id` - Delete receipt

### Utilities
- `GET /api/categories` - Get category list
- `GET /api/export` - Export all receipts as JSON
- `GET /api/health` - Health check

---

## Theme & Design

**Colors:**
```
Navy:     #1A2942 (primary)
Gold:     #C9A961 (accent)
Burgundy: #5D3A3A (premium accent)
Wood:     #3D2817 (luxury detail)
```

**Typography:**
- Titles: 36px, font-weight 700
- Labels: 11px uppercase
- Body: 13-14px

---

## Deployment

### Backend (Render.com)

1. Push to GitHub
2. Create new Web Service on Render
3. Select GitHub repo
4. Build: `npm install`
5. Start: `npm start`
6. Add environment variables in Render dashboard

### Frontend (GitHub Pages or Vercel)

**GitHub Pages:**
```bash
npm run build
npm run deploy
```

**Vercel:**
```bash
vercel
```

---

## Future Phases

**Phase 2:** OCR auto-extraction of receipt data

**Phase 3:** Advanced analytics and reporting

**Phase 4:** Personal finance dashboard consolidation

---

## Troubleshooting

**Backend won't start**
- Check port 5000 is available
- Verify Node.js version (18+)
- Check `.env` file exists

**Frontend can't connect to backend**
- Verify backend is running on port 5000
- Check `.env.local` has correct API URL
- Check CORS is enabled in backend

**File upload not working**
- Check `uploads/` folder exists in backend
- Verify file permissions
- Check file size limits

---

## Security Notes

- Change `APP_PASSWORD` in `.env` to something secure
- Never commit `.env` to GitHub
- Use HTTPS in production
- Implement proper authentication for production
- Consider adding rate limiting

---

## License

Personal use. Built with ❤️ for HSA receipt management.

---

**Ready to launch? Start the backend and frontend, then login and upload your first receipt!**
