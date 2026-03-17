# GitHub Pages Deployment Guide

## Setup Instructions

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the "+" icon → "New repository"
3. Name it: `slide-viewer`
4. Description: "A web-based slide viewer for presentations"
5. Make it **Public** (required for free GitHub Pages)
6. Click "Create repository"

### Step 2: Add Remote and Push to GitHub

```bash
cd c:\Users\eivin\Kodeprosjekter\slide-viewer

git remote add origin https://github.com/YOUR_USERNAME/slide-viewer.git
git branch -M main
git add .
git commit -m "Initial commit: slide viewer with PDF support"
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top navigation)
3. Scroll to **Pages** section (left sidebar)
4. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click "Save"

### Step 4: Wait for Deployment

GitHub Pages will build and deploy your site. Look for:
- A green checkmark ✓ next to your branch
- Your site URL: `https://YOUR_USERNAME.github.io/slide-viewer`

This typically takes 1-2 minutes.

## Update Steps (After Making Changes)

```bash
git add .
git commit -m "Your change description"
git push
```

GitHub will automatically redeploy your site!

## Custom Domain (Optional)

If you have a custom domain:

1. Go to Repository Settings → Pages
2. Under "Custom domain", enter your domain
3. Click "Save"
4. Add DNS records to your domain provider pointing to GitHub Pages

## Troubleshooting

**Site not loading?**
- Wait 2-3 minutes for initial deployment
- Check your repository is public
- Verify "GitHub Pages" is enabled in Settings

**Files not showing?**
- Make sure all files are committed: `git status`
- Push changes: `git push`

**PDF files not loading?**
- PDFs should be uploaded to the repository
- Or use external PDF URLs in your code

## File Structure for GitHub Pages

```
slide-viewer/
├── index.html          ✓ (required)
├── styles.css          ✓
├── script.js           ✓
├── package.json
├── README.md
├── .gitignore
└── .git/
```

All your files are already in place and ready for deployment!

## Links

- GitHub Pages Docs: https://pages.github.com
- Repository Settings: https://github.com/YOUR_USERNAME/slide-viewer/settings
- Your Live Site: https://YOUR_USERNAME.github.io/slide-viewer

---

**Important:** Replace `YOUR_USERNAME` with your actual GitHub username everywhere!
