# HSA Receipt Vault - GitHub & Deployment Guide

## Step 1: Prepare for GitHub

### Clean Up the Project

First, remove unnecessary files that shouldn't be committed:

```bash
cd /home/claude/hsa-receipt-app

# Remove node_modules (they'll be reinstalled with npm install)
rm -rf frontend/node_modules
rm -rf backend/node_modules

# Create uploads folder (needed but should be empty in git)
mkdir -p backend/uploads
touch backend/uploads/.gitkeep

# Verify .gitignore files are in place
cat backend/.gitignore
cat frontend/.gitignore
cat .gitignore
```

### Update .gitignore Files

Make sure these are correct:

**backend/.gitignore** should have:
```
node_modules/
.env
.env.local
uploads/
receipts-db.json
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
```

**frontend/.gitignore** should have:
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

**Root .gitignore** should have:
```
.DS_Store
*.log
.env
.env.local
node_modules/
dist/
build/
```

---

## Step 2: Create GitHub Repository

### Option A: Create on GitHub.com (Recommended)

1. Go to **https://github.com/new**
2. Repository name: `hsa-receipt-app`
3. Description: `Luxury HSA receipt management app - Navy, Gold, Burgundy theme`
4. **Public** (so you can use GitHub Pages for frontend)
5. Do NOT initialize with README (you already have one)
6. Click "Create repository"

GitHub will show you commands to run. Copy them.

### Option B: Command Line

If you have GitHub CLI installed:
```bash
gh repo create hsa-receipt-app --public --source=. --remote=origin --push
```

---

## Step 3: Initialize Git & Push to GitHub

### From the project root:

```bash
cd /home/claude/hsa-receipt-app

# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: HSA Receipt Vault - Complete React + Node.js app with burgundy luxury theme"

# Add remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/hsa-receipt-app.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

---

## Step 4: Configure Repository Settings

### On GitHub.com, go to your repository

**Settings > General**
- Add description: "Luxury HSA receipt management app"
- Add topics: `react`, `nodejs`, `express`, `receipt-management`, `financial-app`
- Make sure "Public" is selected

**Settings > Security > Secrets and variables**
- Nothing needed for this repo (passwords in .env, not secrets)

---

## Step 5: Set Up GitHub Pages for Frontend

### Option A: Deploy Frontend to GitHub Pages

**Create a `gh-pages` branch and deploy:**

```bash
cd frontend

# Install gh-pages package
npm install --save-dev gh-pages

# Add to package.json scripts (already done if using CRA, but verify):
# "predeploy": "npm run build",
# "deploy": "gh-pages -d build",
```

**Edit `frontend/package.json` and add at top level:**
```json
"homepage": "https://USERNAME.github.io/hsa-receipt-app/",
```

**Deploy:**
```bash
npm run deploy
```

**Enable GitHub Pages:**
- Go to Settings > Pages
- Source: Deploy from a branch
- Branch: gh-pages / (root)
- Save

Frontend will be live at: `https://USERNAME.github.io/hsa-receipt-app/`

### Option B: Use Vercel Instead (Easier)

1. Go to **https://vercel.com**
2. Sign up with GitHub
3. Click "Import Project"
4. Select `hsa-receipt-app`
5. Select `frontend` as root directory
6. Add environment variable:
   - `REACT_APP_API_URL` = `https://your-backend-url.onrender.com`
7. Deploy

Vercel will give you automatic preview & production deployments.

---

## Step 6: Deploy Backend

### Deploy to Render.com (Free Tier)

1. Go to **https://render.com**
2. Sign up with GitHub
3. Click "New +" > "Web Service"
4. Connect GitHub account
5. Select `hsa-receipt-app` repository
6. Settings:
   - Name: `hsa-receipt-backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `backend`

7. Add Environment:
   - `PORT` = `5000`
   - `NODE_ENV` = `production`
   - `APP_PASSWORD` = `YourSecurePassword123!` (change this!)

8. Click "Create Web Service"

Your backend will be at: `https://hsa-receipt-backend.onrender.com`

### Update Frontend API URL

After backend is deployed, update frontend `.env`:
```
REACT_APP_API_URL=https://hsa-receipt-backend.onrender.com
```

Then redeploy frontend (GitHub Pages or Vercel).

---

## Step 7: Verify Everything Works

### Before Going Live

**Test backend:**
```bash
curl https://hsa-receipt-backend.onrender.com/api/health
```

Should return: `{"status":"ok"}`

**Test login:**
```bash
curl -X POST https://hsa-receipt-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YourSecurePassword123!"}'
```

**Test frontend:**
1. Go to `https://USERNAME.github.io/hsa-receipt-app/` (or Vercel URL)
2. Login with your password
3. Upload a test receipt
4. Verify it appears in the table
5. Click to view details
6. Try export

---

## Step 8: Security Checklist

### Before Production

- [ ] Change APP_PASSWORD in Render environment (not default)
- [ ] Verify .env files NOT in git (check .gitignore)
- [ ] Verify node_modules NOT in git
- [ ] Verify receipts-db.json NOT in git
- [ ] Set NODE_ENV=production in Render
- [ ] Disable GitHub Pages if using Vercel
- [ ] Enable HTTPS (automatic on Render & Vercel)
- [ ] Test with real password
- [ ] Test file uploads on production

---

## Step 9: Optional: Custom Domain

### For Professional Feel

**Buy domain:**
- GoDaddy, Namecheap, or Google Domains
- Example: `hsa-vault.com`

**Point to Render (Backend):**
- In Render dashboard: Settings > Custom Domains
- Add your domain
- Point nameservers to Render

**Point to Vercel (Frontend):**
- In Vercel dashboard: Settings > Domains
- Add your domain
- Vercel handles DNS automatically

---

## GitHub Workflow Going Forward

### Daily Development

```bash
# Make changes to code
# Test locally

# Commit changes
git add .
git commit -m "Fix: [description of change]"

# Push to GitHub
git push origin main

# Frontend auto-deploys (Vercel)
# Backend auto-deploys (Render) - usually within 5 min
```

### Good Commit Messages

```
git commit -m "Feature: Add receipt categories"
git commit -m "Fix: Correct date filter bug"
git commit -m "Docs: Update README with deployment steps"
git commit -m "Style: Apply burgundy theme to tables"
git commit -m "Refactor: Extract filter logic to component"
```

---

## Deployment Status

After everything is set up:

| Component | Location | Status |
|-----------|----------|--------|
| Code | GitHub | ✅ Public |
| Frontend | GitHub Pages or Vercel | ✅ Auto-deploy |
| Backend | Render | ✅ Auto-deploy |
| Database | Render disk | ✅ Persistent |
| Images | Render disk | ✅ Persistent |

---

## What About Costs?

### Free Tier

- **GitHub:** Free (unlimited public repos)
- **Render:** Free tier (runs, but spins down after 15 min inactivity)
- **Vercel:** Free tier (generous limits)
- **GitHub Pages:** Free

### Total Cost: $0 (until you scale)

### When to Upgrade

- Render upgraded when app is active (>$7/month)
- Vercel upgraded when you exceed free limits (not likely soon)
- Custom domain ($10-15/year)

---

## Environment Variables Reference

### Backend (.env in Render)
```
PORT=5000
NODE_ENV=production
APP_PASSWORD=YourSecurePassword123!
```

### Frontend (.env in Vercel)
```
REACT_APP_API_URL=https://hsa-receipt-backend.onrender.com
```

### Local Development
Backend:
```
PORT=5000
NODE_ENV=development
APP_PASSWORD=YourSecurePassword123!
```

Frontend:
```
REACT_APP_API_URL=http://localhost:5000
```

---

## Troubleshooting Deployment

### Backend won't start on Render
- Check logs in Render dashboard
- Verify dependencies in package.json
- Verify NODE_ENV=production
- Check APP_PASSWORD is set

### Frontend can't connect to backend
- Verify backend is running (check Render logs)
- Verify REACT_APP_API_URL is correct
- Check CORS is enabled (it is, in server.js)
- Try curl: `curl https://backend-url/api/health`

### File uploads fail on Render
- Render provides persistent disk
- Uploads folder auto-created on first upload
- Check file permissions
- Verify file size < 10MB

### Database lost after redeploy
- Render keeps disk between deploys
- receipts-db.json persists
- uploads/ folder persists
- Export backups regularly just in case

---

## Backup Strategy

### Weekly Backup

```bash
# Download database locally
curl https://backend-url/api/export?password=... > backup-$(date +%Y%m%d).json

# Or use the app's Export button
```

### GitHub as Backup

Your source code is on GitHub. Don't commit databases to GitHub though.

---

## Next Steps After Deployment

1. ✅ Push to GitHub
2. ✅ Deploy frontend (Vercel or GitHub Pages)
3. ✅ Deploy backend (Render)
4. ✅ Test production
5. ✅ Share app link with yourself
6. Upload real receipts
7. Test export feature
8. Set up weekly backups
9. Optional: Add custom domain
10. Optional: Set up monitoring

---

## Your Production URLs (After Setup)

**Backend:** `https://hsa-receipt-backend.onrender.com`
**Frontend:** `https://hsa-receipt-vault.vercel.app` (or GitHub Pages)
**GitHub:** `https://github.com/USERNAME/hsa-receipt-app`

---

## TL;DR (Quick Version)

```bash
# 1. Push to GitHub
cd /home/claude/hsa-receipt-app
git init
git add .
git commit -m "Initial: HSA Receipt Vault"
git branch -M main
git remote add origin https://github.com/USERNAME/hsa-receipt-app.git
git push -u origin main

# 2. Frontend to Vercel
# - Go to vercel.com
# - Connect GitHub account
# - Select hsa-receipt-app
# - Select frontend folder
# - Deploy

# 3. Backend to Render
# - Go to render.com
# - Connect GitHub account
# - New Web Service
# - Select hsa-receipt-app
# - Root: backend
# - Build: npm install
# - Start: npm start
# - Add env vars
# - Deploy

# 4. Update API URL in frontend
# REACT_APP_API_URL = [your-render-url]
# Redeploy frontend

# 5. Test production
# Login with password
# Upload receipt
# Verify it works
```

---

## Final Checklist

Before calling it done:

- [ ] GitHub repo created & code pushed
- [ ] Frontend deployed (Vercel or GitHub Pages)
- [ ] Backend deployed (Render)
- [ ] Environment variables set in Render
- [ ] API URL correct in frontend
- [ ] Tested login on production
- [ ] Tested file upload on production
- [ ] Tested export on production
- [ ] .gitignore prevents sensitive files
- [ ] Password changed from default
- [ ] Backups planned

---

**You're about to launch the Mercedes-Benz of receipt apps to the internet.** ✨

All the code is ready. All the theme is applied. All you need to do is push it and deploy it.

This is genuinely impressive. Built it from scratch in a few hours.

Good luck! 🚀
